/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#![deny(warnings)]

use std::collections::VecDeque;
use std::path::PathBuf;

use anyhow::{Context, Result};
use slog::{o, warn};
use structopt::clap::AppSettings;
use structopt::StructOpt;

mod apply_host_config;
mod config;
mod fetch_image;
mod generator;
mod http;
mod kernel_cmdline;
mod mkdir;
mod mount;
mod switch_root;
mod systemd;
mod umount;

pub use config::Config;

#[derive(StructOpt)]
enum Subcommand {
    /// Systemd unit generator
    MetalosGenerator(generator::Opts),
    /// Download an image over HTTPS
    FetchImage(fetch_image::Opts),
    /// Simplistic method to mount filesystems
    Mount(mount::Opts),
    /// Simplistic method to unmount filesystems
    Umount(umount::Opts),
    /// Simple implementation of /bin/mkdir
    Mkdir(mkdir::Opts),
    /// Setup the new rootfs and switch-root into it
    SwitchRoot(switch_root::Opts),
    /// Generate and apply a structured host config
    ApplyHostConfig(apply_host_config::Opts),
}

#[derive(StructOpt)]
#[structopt(name = "metalctl", setting(AppSettings::NoBinaryName))]
struct MetalCtl {
    #[structopt(short, long, default_value("/etc/metalctl.toml"))]
    config: PathBuf,
    #[structopt(subcommand)]
    command: Subcommand,
}

#[tokio::main]
async fn main() -> Result<()> {
    let mut args: VecDeque<_> = std::env::args_os().collect();
    // Yeah, expect() is not the best thing to do, but really what else can we
    // do besides panic?
    let bin_path: PathBuf = args
        .pop_front()
        .expect("metalctl: must have argv[0]")
        .into();
    let bin_name = bin_path
        .file_name()
        .expect("metalctl: argv[0] must be a file path");
    // If argv[0] is a symlink for a multicall utility, push the file name back
    // into the args array so that structopt will parse it correctly
    if bin_name != "metalctl" {
        args.push_front(bin_name.to_owned());
    }

    let options = MetalCtl::from_iter(args);

    let log = slog::Logger::root(slog_glog_fmt::default_drain(), o!());

    let mut config: config::Config = match std::fs::read_to_string(&options.config) {
        Ok(config_str) => toml::from_str(&config_str).context("invalid config")?,
        Err(e) => {
            warn!(
                log,
                "failed to read config from {:?}, using defaults: {}", options.config, e
            );
            Default::default()
        }
    };
    config.apply_kernel_cmdline_overrides().unwrap();

    match options.command {
        Subcommand::MetalosGenerator(opts) => generator::generator(log, opts),
        Subcommand::FetchImage(opts) => fetch_image::fetch_image(log, config, opts).await,
        Subcommand::Mkdir(opts) => mkdir::mkdir(opts),
        Subcommand::Mount(opts) => mount::mount(opts),
        Subcommand::Umount(opts) => umount::umount(opts),
        Subcommand::SwitchRoot(opts) => switch_root::switch_root(log, opts),
        Subcommand::ApplyHostConfig(opts) => apply_host_config::apply_host_config(log, opts).await,
    }
}
