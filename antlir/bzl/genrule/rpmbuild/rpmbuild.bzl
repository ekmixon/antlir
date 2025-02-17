# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Given a source tree and a matching RPM spec file, runs `rpmbuild` inside the
given image layer, and outputs a new layer with the resulting RPM(s)
available in a pre-determined location: `/rpmbuild/RPMS`.
"""

load("//antlir/bzl:constants.bzl", "REPO_CFG")
load("//antlir/bzl:flavor_helpers.bzl", "flavor_helpers")
load("//antlir/bzl:image.bzl", "image")
load("//antlir/bzl:image_layer.bzl", "image_layer")
load("//antlir/bzl:maybe_export_file.bzl", "maybe_export_file")
load("//antlir/bzl:oss_shim.bzl", "buck_genrule", "get_visibility")
load("//antlir/bzl:sha256.bzl", "sha256_b64")
load("//antlir/bzl/image/feature:remove.bzl", "feature_remove")
load("//antlir/bzl/image/feature:tarball.bzl", "feature_tarball")
load("//antlir/bzl/image_actions:ensure_dirs_exist.bzl", "image_ensure_subdirs_exist")
load("//antlir/bzl/image_actions:install.bzl", "image_install")

RPMBUILD_LAYER_SUFFIX = "rpmbuild-build"

# Builds RPM(s) based on the provided specfile and sources, copies them to an
# output directory, and signs them.
# The end result will be a directory containing all the signed RPM(s).
#
# If you need to access the intermediate image layers to debug a build issue,
# you can use the "//<project>:<name>-<RPMBUILD_LAYER_SUFFIX>" image_layer
# target.  This layer is where the `rpmbuild` command is run to produce the
# unsigned RPM(s).
def image_rpmbuild(
        name,
        # The name of a specfile target (i.e. a single file made accessible
        # with `export_file()`).
        specfile,
        # The name of the target that has the source files for the RPM
        # (i.e. made accessible with `export_file()`).
        # Be aware that depending on the buck rule, the sources may not
        # have the intended directory structure (i.e. may or may not include
        # the top directory) when installed in the layer. You can look at the
        # test TARGETS for "toy-rpm" to see how the sources target is set up
        # so that there is no "toy_srcs" top directory.
        # It can be helpful to do
        # `buck run //<project>:<name>-rpmbuild-setup=container` to inspect the
        # setup layer and experiment with building, but do not depend on it for
        # production targets.
        source,
        # A binary target that takes an RPM file path as an argument and signs
        # the RPM in place.  Used to sign the RPM(s) built.
        # Signers should not modify anything except the signatures on the RPMs.
        # This is verified after each call to sign an RPM.
        signer,
        # An `image.layer` target, on top of which the current layer will
        # build the RPM.  This should have `rpm-build`, optionally macro
        # packages like `redhat-rpm-config`, and any of the spec file's
        # build dependencies installed.
        parent_layer = None,
        # The `flavor` of the images generated by this function.
        # This is used to determine compatibility between images.
        flavor = REPO_CFG.flavor_default,
        **image_layer_kwargs):
    parent_layer = parent_layer or flavor_helpers.default_flavor_build_appliance
    private_image_rpmbuild_impl(
        name,
        specfile,
        source,
        signer,
        parent_layer,
        flavor = flavor,
        **image_layer_kwargs
    )

def private_image_rpmbuild_impl(
        name,
        specfile,
        source,
        signer,
        parent_layer,
        # Additional setup features used by wrapper command
        setup_features = None,
        # A wrapper command to run rpmbuild instead of running it standalone
        wrapper_cmd = None,
        visibility = None,
        flavor = REPO_CFG.flavor_default,
        **image_layer_kwargs):
    """
    Implementation of image_rpmbuild, see docs in `image_rpmbuild`.
    """

    visibility = get_visibility(visibility, name)

    # Future: We tar the source directory and untar it inside the subvolume
    # before building because the "install_*_trees" feature does not yet
    # exist.
    source_tarball = name + "-source.tgz"
    buck_genrule(
        name = source_tarball,
        out = source_tarball,
        bash = '''
            tar --sort=name --mtime=2018-01-01 --owner=0 --group=0 \
                --numeric-owner -C $(location {source}) -czf "$OUT" .
        '''.format(source = maybe_export_file(source)),
        visibility = [],
        antlir_rule = "user-internal",
    )

    rpmbuild_dir = "/rpmbuild"
    specfile_path = "/rpmbuild/SPECS/specfile.spec"

    setup_layer = name + "-rpmbuild-setup"
    image_layer(
        name = setup_layer,
        parent_layer = parent_layer,
        features = [
            image_install(specfile, specfile_path),
            image_ensure_subdirs_exist("/", "rpmbuild"),
            image_ensure_subdirs_exist("/rpmbuild", "BUILD"),
            image_ensure_subdirs_exist("/rpmbuild", "BUILDROOT"),
            image_ensure_subdirs_exist("/rpmbuild", "RPMS"),
            image_ensure_subdirs_exist("/rpmbuild", "SOURCES"),
            image_ensure_subdirs_exist("/rpmbuild", "SPECS"),
            feature_tarball(":" + source_tarball, "/rpmbuild/SOURCES"),
        ] + (setup_features or []),
        visibility = [],
        antlir_rule = "user-internal",
    )

    # Figure out which build command to use to install dependencies in the
    # <name>-rpmbuild-install-deps layer.
    installer = getattr(
        flavor_helpers.get_flavor_config(
            flavor,
            image_layer_kwargs.get("flavor_config_override"),
        ),
        "rpm_installer",
        flavor_helpers.get_rpm_installer(REPO_CFG.flavor_default),
    )

    install_deps_layer = name + "-rpmbuild-install-deps"
    image.genrule_layer(
        name = install_deps_layer,
        rule_type = "rpmbuild_install_deps_layer",
        parent_layer = ":" + setup_layer,
        # Auto-installing RPM dependencies requires `root`.
        user = "root",
        cmd = [
            installer,
            "builddep",  # Hack: our `yum` wrapper maps this to `yum-builddep`
            # Define the build directory for this project
            "--define=_topdir {}".format(rpmbuild_dir),
            "--assumeyes",
            specfile_path,
        ],
        container_opts = struct(
            # Serve default snapshots for the RPM installers that define
            # one.  So, we may start `repo-server`s for both `yum` and `dnf`
            # -- this minor inefficiency is worth the simplicity.
            #
            # In the unlikely event we need support for a non-default snapshot,
            # we can expose a flag that chooses between enabling shadowing, or
            # serving a specific snapshot.
            shadow_proxied_binaries = True,
        ),
        antlir_rule = "user-internal",
        visibility = [],
        **image_layer_kwargs
    )

    build_layer = name + "-rpmbuild-build"
    image.genrule_layer(
        name = build_layer,
        rule_type = "rpmbuild_build_layer",
        parent_layer = ":" + install_deps_layer,
        # While it's possible to want to support unprivileged builds, the
        # typical case will want to auto-install dependencies, which
        # requires `root`.
        user = "root",
        cmd = (wrapper_cmd or []) + [
            "rpmbuild",
            # Change the destination for the built RPMs
            "--define=_topdir {}".format(rpmbuild_dir),
            # Don't include the version in the resulting RPM filenames
            "--define=_rpmfilename %%{NAME}.rpm",
            "-bb",  # Only build the binary packages (no SRPMs)
            "{}/SPECS/specfile.spec".format(rpmbuild_dir),
        ],
        antlir_rule = "user-facing",
        visibility = visibility,
        **image_layer_kwargs
    )

    buck_genrule(
        name = name,
        out = "signed_rpms",
        bash = '''
            set -ue -o pipefail
            mkdir "$OUT"

            # copy the RPMs out of the rpmbuild_layer
            binary_path=( $(exe //antlir:find-built-subvol) )
            layer_loc="$(location {rpmbuild_layer})"
            sv_path=\\$( "${{binary_path[@]}}" "$layer_loc" )
            find "$sv_path/rpmbuild/RPMS/" -name '*.rpm' -print0 | xargs -0 cp --no-clobber --target-directory "$OUT"

            # call the signer binary to sign the RPMs
            signer_binary_path=( $(exe {signer_target}) )
            for rpm in $OUT/*.rpm; do
                "${{signer_binary_path[@]}}" "$rpm"

                rpm_basename=\\$( basename "$rpm")
                orig_rpm="$sv_path/rpmbuild/RPMS/$rpm_basename"

                # verify that the contents match
                # Future: we can probably use --queryformat to print the content
                # hashes and avoid comparing contents directly if we dig around
                # and find a checksum stronger than MD5.
                diff <(rpm2cpio "$orig_rpm") <(rpm2cpio "$rpm")

                # diff the rest of the metadata, ignoring the signature line
                # --nosignature passed to `rpm` silences warning about unrecognized keys
                diff -I "^Signature" <(rpm --scripts --nosignature -qilp "$orig_rpm") <(rpm --scripts --nosignature -qilp "$rpm")
            done
        '''.format(
            rpmbuild_layer = ":" + build_layer,
            signer_target = signer,
        ),
        antlir_rule = "user-facing",
        visibility = visibility,
    )

# You typically don't need this if you're installing an RPM signed with a key
# that is already imported in a RPM repo in your image.  However, if you're
# signing with a custom key pair that has not been used/installed before (as in
# the case of the tests) you can use this to import the public key for
# verification into the destination layer before you install the RPM(s) signed
# with the custom key.
def image_import_rpm_public_key_layer(
        name,
        # A list of `image.source` (see `image_source.bzl`) and/or targets
        # exporting a public key file.
        pubkeys,
        # An `image.layer`to import the key into.  This should have the `rpm`
        # RPM installed.
        parent_layer,
        **image_layer_kwargs):
    gpg_key_dir = "/antlir-rpm-gpg-keys"
    install_keys = []
    for src in pubkeys:
        dest = gpg_key_dir + "/RPM-GPG-KEY-" + sha256_b64(str(src))
        install_keys.append(image_install(src, dest))

    if not install_keys:
        fail("cannot import an empty set of keys")

    copy_layer = name + "-key-copy"
    image_layer(
        name = copy_layer,
        parent_layer = parent_layer,
        features = [image_ensure_subdirs_exist("/", gpg_key_dir[1:])] + install_keys,
        **image_layer_kwargs
    )

    import_layer = name + "-key-import"
    image.genrule_layer(
        name = import_layer,
        rule_type = "import_rpm_public_key_layer",
        parent_layer = ":" + copy_layer,
        # Need to be root to modify the RPM DB.
        user = "root",
        cmd = ["/bin/bash", "-c", "rpm --import {}/*".format(gpg_key_dir)],
        antlir_rule = "user-internal",
        **image_layer_kwargs
    )

    # Remove the directory of keys so as not to leave artifacts in the layers.
    # Since the key is imported in the RPM DB the file isn't needed.
    image_layer(
        name = name,
        parent_layer = ":" + import_layer,
        features = [feature_remove(gpg_key_dir)],
        **image_layer_kwargs
    )
