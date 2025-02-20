#!/usr/bin/env python3
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os
import subprocess
import tempfile
from abc import ABC, abstractmethod
from contextlib import AsyncExitStack, contextmanager
from dataclasses import dataclass, field
from typing import Generator, Iterable, Optional, Tuple

from antlir.common import get_logger
from antlir.fs_utils import Path, temp_dir


log = get_logger()

__next_tag_index = 0
# We have 2 drives for the root disk (seed + child) so we start all others
# after those 2
__next_drive_index = 2


def _next_tag() -> str:
    global __next_tag_index
    tag = f"fs{__next_tag_index}"
    __next_tag_index += 1
    return tag


def _next_drive() -> str:
    global __next_drive_index
    idx = __next_drive_index
    __next_drive_index += 1
    return "vd" + chr(idx + ord("a"))


class Share(ABC):
    @property
    def generator(self) -> bool:  # pragma: no cover
        """Should this share have a systemd mount unit generated for it"""
        return False

    @property
    def mount_unit(
        self,
    ) -> Tuple[Optional[str], Optional[str]]:  # pragma: no cover
        """
        Return the name of the mount unit file, and its contents.
        This is only applicable if `self.generator == True`.
        """
        return (None, None)

    @property
    @abstractmethod
    def qemu_args(self) -> Iterable[str]:  # pragma: no cover
        """QEMU cmdline args to attach this share"""

    @staticmethod
    def _systemd_escape_mount(path: Path) -> str:
        return subprocess.run(
            ["systemd-escape", "--suffix=mount", "--path", path],
            text=True,
            capture_output=True,
            check=True,
        ).stdout.strip()

    @staticmethod
    @contextmanager
    def export_spec(
        shares: Iterable["Share"],
    ) -> Generator["Share", None, None]:
        """share a meta-directory that contains all the mount tags and paths to
        mount them, which is then read early in boot by a systemd generator
        this cannot be performed with just the export tags, because encoding the
        full path would frequently make them too long to be valid 9p tags"""
        with temp_dir() as exportdir:
            for share in shares:
                if not share.generator:
                    continue
                unit_name, unit_contents = share.mount_unit
                assert (
                    unit_name and unit_contents
                ), f"Invalid mount unit for {share}"
                unit_path = exportdir / unit_name
                with unit_path.open(mode="w") as f:
                    f.write(unit_contents)

            yield Plan9Export(
                path=exportdir, mountpoint=exportdir, mount_tag="exports"
            )


@dataclass(frozen=True)
class Plan9Export(Share):
    """9PFS share of a host directory to the guest"""

    path: Path
    mountpoint: Path
    mount_tag: str = field(default_factory=_next_tag)
    generator: bool = True
    # This should be used in readonly mode unless absolutely necessary.
    readonly: bool = True

    @property
    def mount_unit(self) -> Tuple[str, str]:
        cache = "loose" if self.readonly else "none"
        ro_rw = "ro" if self.readonly else "rw"
        return (
            self._systemd_escape_mount(self.mountpoint),
            f"""[Unit]
Description=Mount {self.mount_tag} at {self.mountpoint!s}
Requires=systemd-modules-load.service
After=systemd-modules-load.service
Before=local-fs.target

[Mount]
What={self.mount_tag}
Where={self.mountpoint!s}
Type=9p
Options=version=9p2000.L,posixacl,cache={cache},{ro_rw}
""",
        )

    @property
    def qemu_args(self) -> Iterable[str]:
        readonly = "on" if self.readonly else "off"
        return (
            "-virtfs",
            (
                f"local,path={self.path!s},security_model=none,"
                f"multidevs=remap,mount_tag={self.mount_tag},"
                f"readonly={readonly}"
            ),
        )


@dataclass(frozen=True)
class BtrfsDisk(Share):
    """A single btrfs disk for use in qemu"""

    path: Path
    mountpoint: Path
    dev: str = field(default_factory=_next_drive)
    generator: bool = True
    subvol: str = "volume"
    readonly: bool = True

    @property
    def mount_unit(self) -> Tuple[str, str]:
        ro_rw = "ro" if self.readonly else "rw"
        return (
            self._systemd_escape_mount(self.mountpoint),
            f"""[Unit]
Description=Mount {self.dev} ({self.path!s} from host) at {self.mountpoint!s}
Before=local-fs.target

[Mount]
What=/dev/{self.dev}
Where={self.mountpoint!s}
Type=btrfs
Options=subvol={self.subvol},{ro_rw}
""",
        )

    # Note: coverage on this is actually provided via the
    # `//antlir/vm/tests:test-kernel-panic` test, but due to
    # how python coverage works it can't be included in the
    # report.
    @property
    def qemu_args(self) -> Iterable[str]:  # pragma: no cover
        readonly = "on" if self.readonly else "off"
        return (
            "--blockdev",
            (
                f"driver=raw,node-name=dev-{self.dev},read-only={readonly},"
                f"file.driver=file,file.filename={self.path!s}"
            ),
            "--device",
            f"virtio-blk,drive=dev-{self.dev}",
        )


def _tmp_qcow2_disk(
    qemu_img: Path,
    stack: AsyncExitStack,
    size_mb: int = 1024,
) -> Path:
    """
    Create a qcow2 scratch disk using qemu-img.  The default size is 256MB.
    """
    disk = stack.enter_context(
        tempfile.NamedTemporaryFile(
            prefix="vm_",
            suffix="_rw.qcow2",
            # If available, create this temporary disk image in a temporary
            # directory that we know will be on disk, instead of /tmp which
            # may be a space-constrained tmpfs whichcan cause sporadic
            # failures depending on how much VMs decide to write to the
            # root partition multiplied by however many VMs are running
            # concurrently. If DISK_TEMP is not set, Python will follow the
            # normal mechanism to determine where to create this file as
            # described in:
            # https://docs.python.org/3/library/tempfile.html#tempfile.gettempdir
            dir=os.getenv("DISK_TEMP"),
        )
    )

    cmd = [
        qemu_img,
        "create",
        "-f",  # format
        "qcow2",
        disk.name,
        f"{size_mb}M",
    ]
    log.debug(f"Creating tmp qcow2 img: {cmd}")

    try:
        # Combine stdout and stderr.
        ret = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            check=True,
        )
        log.debug(f"qemu-img complete: {ret}")

    except subprocess.CalledProcessError as e:  # pragma: no cover
        log.error(
            "Failed to create qemu disk image. "
            f'Command: "{cmd}"; '
            f"Return value: {e.returncode}; "
            f"Output:\n {e.output.decode('utf-8')}"
        )
        raise

    return Path(disk.name)


@dataclass(frozen=True)
class BtrfsSeedRootDisk(Share):
    """
    A btrfs seed disk + a child disk for use in qemu.
    """

    path: Path
    qemu_img: Path
    stack: AsyncExitStack
    subvol: str = "volume"
    # Note: these are hard coded for virtio and to be the 1st
    # and 2nd drive presented to qemu.  This is handled in `//antlir/vm:vm`
    # where this Share is inserted at the beginning of the list of shares
    # provided to qemu.
    # Future: This should support other interface formats like sata and nvme
    seed_dev: str = "vda"
    child_dev: str = "vdb"
    # This is dynamically created during the __post_init__
    child_disk: Optional[Path] = None

    def __post_init__(self) -> None:
        # Reaching into the object like this is lame.
        # TODO: Convert these to Pydantic types so we can use
        # validators
        object.__setattr__(
            self,
            "child_disk",
            _tmp_qcow2_disk(
                qemu_img=self.qemu_img,
                stack=self.stack,
            ),
        )

    @property
    def qemu_args(self) -> Iterable[str]:
        return (
            # Seed device
            "--blockdev",
            (
                "driver=raw,node-name=seed,read-only=on,"
                f"file.driver=file,file.filename={self.path!s}"
            ),
            "--device",
            "virtio-blk,drive=seed",
            # Child device
            "--blockdev",
            (
                "driver=qcow2,node-name=child,read-only=off,"
                f"file.driver=file,file.filename={self.child_disk!s}"
            ),
            "--device",
            "virtio-blk,drive=child",
        )

    @property
    def kernel_args(self) -> Iterable[str]:
        return (
            f"metalos.seed_device=/dev/{self.child_dev}",
            f"root=/dev/{self.seed_dev}",
            f"rootflags=subvol={self.subvol},ro",
            "rootfstype=btrfs",
        )


@dataclass(frozen=True)
class QCow2RootDisk(Share):
    """
    Share a btrfs filesystem to a Qemu instance as a
    qcow2 disk via the virtio interface.
    """

    path: Path
    qemu_img: Path
    stack: AsyncExitStack
    subvol: str = "volume"
    dev: str = "vda"
    cow_disk: Optional[Path] = None

    def __post_init__(self) -> None:
        object.__setattr__(
            self,
            "cow_disk",
            _tmp_qcow2_disk(
                qemu_img=self.qemu_img,
                stack=self.stack,
            ),
        )

    @property
    def qemu_args(self) -> Iterable[str]:
        return (
            "--blockdev",
            (
                "driver=qcow2,node-name=root-drive,"
                f"file.driver=file,file.filename={self.cow_disk!s},"
                "backing.driver=raw,backing.file.driver=file,"
                f"backing.file.filename={self.path!s}"
            ),
            "--device",
            "virtio-blk,drive=root-drive",
        )

    @property
    def kernel_args(self) -> Iterable[str]:
        return (
            f"root=/dev/{self.dev}",
            f"rootflags=subvol={self.subvol},ro",
            "rootfstype=btrfs",
        )
