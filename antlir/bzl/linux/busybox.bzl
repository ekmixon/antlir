# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

load("@bazel_skylib//lib:new_sets.bzl", "sets")
load("@bazel_skylib//lib:paths.bzl", "paths")
load("//antlir/bzl:image.bzl", "image")

DEFAULT_APPLETS = sets.make([
    "basename",
    "cat",
    "clear",
    "cp",
    "echo",
    "file",
    "groups",
    "hostname",
    "id",
    "ip",
    # "less" - intentionally excluded to not have messed up color output from
    # systemctl, since busybox's `less` does not support ansi colors
    "ln",
    "ls",
    "lsmod",
    "mkdir",
    "mktemp",
    "modprobe",
    "mount",
    "ping",
    "rm",
    "rmmod",
    "sh",
    "su",
    "true",
    "umount",
    "uname",
])

def _install(src, applets = None, install_dir = "/usr/bin", src_path = "/busybox"):
    """
    Generate features to install a statically linked `busybox` binary
    from the supplied `src` layer into an `install_dir` (default `/usr/bin`)
    and configure a set of applets for it.

    The `src` layer must have the `busybox` binary installed at the path `/busybox`.
    """
    applets = sets.to_list(applets or DEFAULT_APPLETS)
    return [
        image.clone(
            src,
            src_path,
            paths.join(install_dir, "busybox"),
        ),
    ] + [
        image.ensure_file_symlink(
            paths.join(install_dir, "busybox"),
            paths.join(install_dir, applet),
        )
        for applet in applets
    ]

busybox = struct(
    install = _install,
)
