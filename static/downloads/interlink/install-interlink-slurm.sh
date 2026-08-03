#!/usr/bin/env bash

set -euo pipefail

INTERLINK_VERSION="0.6.1"
WSTUNNEL_VERSION="10.5.5"
WSTUNNEL_SHA256="b20ffa02e945ec0c0d6b153ba69a290593f0957ed2892aee8f987f715ccd95d6"

usage() {
  cat <<'EOF'
Install and configure the InterLink Slurm plugin without sudo.

Usage:
  install-interlink-slurm.sh [options]

Options:
  --namespace VALUE          Kubernetes namespace
  --tunnel-host VALUE        wstunnel hostname
  --credential-file PATH     Tunnel credential supplied by NRP
  --account VALUE            Slurm account
  --cpu-partition VALUE      Slurm CPU partition
  --shared-root PATH         Shared path visible on submit and compute nodes
  --gpu-partition VALUE      Slurm GPU partition (optional)
  --gpu-constraint VALUE     Slurm GPU constraint (required with --gpu-partition)
  --guest-partition VALUE    Opportunistic GPU partition (optional)
  --interlink-version VALUE  InterLink release (default: 0.6.1)
  --wstunnel-version VALUE   wstunnel release (default: 10.5.5)
  --yes                      Skip confirmation
  -h, --help                 Show this help

With no options, the script asks for each value interactively.
EOF
}

die() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

prompt_required() {
  local variable="$1" prompt="$2" value
  value="${!variable:-}"
  while [[ -z "$value" ]]; do
    [[ -t 0 ]] || die "$prompt is required"
    read -r -p "$prompt: " value
  done
  printf -v "$variable" '%s' "$value"
}

prompt_default() {
  local variable="$1" prompt="$2" default="$3" value
  [[ -n "${!variable:-}" ]] && return
  if [[ -t 0 ]]; then
    read -r -p "$prompt [$default]: " value
    printf -v "$variable" '%s' "${value:-$default}"
  else
    printf -v "$variable" '%s' "$default"
  fi
}

prompt_optional() {
  local variable="$1" prompt="$2" value
  [[ -n "${!variable:-}" ]] && return
  [[ -t 0 ]] || return
  read -r -p "$prompt (leave blank to disable): " value
  printf -v "$variable" '%s' "$value"
}

namespace=""
tunnel_host=""
credential_file=""
account=""
cpu_partition=""
shared_root=""
gpu_partition=""
gpu_constraint=""
guest_partition=""
assume_yes=false

while (($#)); do
  case "$1" in
    --namespace) namespace="${2:?missing value}"; shift 2 ;;
    --tunnel-host) tunnel_host="${2:?missing value}"; shift 2 ;;
    --credential-file) credential_file="${2:?missing value}"; shift 2 ;;
    --account) account="${2:?missing value}"; shift 2 ;;
    --cpu-partition) cpu_partition="${2:?missing value}"; shift 2 ;;
    --shared-root) shared_root="${2:?missing value}"; shift 2 ;;
    --gpu-partition) gpu_partition="${2:?missing value}"; shift 2 ;;
    --gpu-constraint) gpu_constraint="${2:?missing value}"; shift 2 ;;
    --guest-partition) guest_partition="${2:?missing value}"; shift 2 ;;
    --interlink-version) INTERLINK_VERSION="${2:?missing value}"; shift 2 ;;
    --wstunnel-version) WSTUNNEL_VERSION="${2:?missing value}"; shift 2 ;;
    --yes) assume_yes=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) die "unknown option: $1" ;;
  esac
done

printf 'InterLink Slurm site installer\n\n'
prompt_required namespace "Kubernetes namespace assigned by NRP"
prompt_required tunnel_host "Tunnel hostname supplied by NRP"
prompt_required credential_file "Path to the tunnel credential supplied by NRP"
prompt_required account "Slurm account"
prompt_required cpu_partition "Slurm CPU partition"
prompt_default shared_root "Shared InterLink storage path" "$HOME/.local/share/interlink"
prompt_optional gpu_partition "Slurm GPU partition"
if [[ -n "$gpu_partition" ]]; then
  prompt_required gpu_constraint "Slurm GPU constraint"
  prompt_optional guest_partition "Opportunistic GPU partition"
fi

[[ -f "$credential_file" ]] || die "credential file not found: $credential_file"
[[ -r "$credential_file" ]] || die "credential file is not readable: $credential_file"
[[ "$tunnel_host" != *://* && "$tunnel_host" != */* ]] || die "enter only the tunnel hostname, without wss:// or a path"
[[ -z "$guest_partition" || -n "$gpu_partition" ]] || die "a guest partition requires a GPU partition"

[[ "$namespace" =~ ^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$ ]] || die "invalid Kubernetes namespace"
[[ "$tunnel_host" =~ ^[A-Za-z0-9.-]+(:[0-9]+)?$ ]] || die "invalid tunnel hostname"
[[ "$account" =~ ^[A-Za-z0-9_.-]+$ ]] || die "invalid Slurm account"
[[ "$cpu_partition" =~ ^[A-Za-z0-9_.-]+$ ]] || die "invalid CPU partition"
[[ -z "$gpu_partition" || "$gpu_partition" =~ ^[A-Za-z0-9_.-]+$ ]] || die "invalid GPU partition"
[[ -z "$gpu_constraint" || "$gpu_constraint" =~ ^[A-Za-z0-9_.-]+$ ]] || die "invalid GPU constraint"
[[ -z "$guest_partition" || "$guest_partition" =~ ^[A-Za-z0-9_.-]+$ ]] || die "invalid guest GPU partition"
[[ "$shared_root" == /* && "$shared_root" != *[[:space:]]* ]] || die "shared storage must be an absolute path without spaces"
[[ "$INTERLINK_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || die "invalid InterLink version"
[[ "$WSTUNNEL_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || die "invalid wstunnel version"

for command in curl install sha256sum tar sbatch squeue scancel sinfo apptainer nohup; do
  command -v "$command" >/dev/null || die "required command not found: $command"
done

cat <<EOF

Configuration
  Kubernetes namespace: $namespace
  Tunnel hostname:      $tunnel_host
  Slurm account:        $account
  CPU partition:        $cpu_partition
  Shared storage:       $shared_root
  GPU partition:        ${gpu_partition:-disabled}
  GPU constraint:       ${gpu_constraint:-disabled}
  Guest GPU partition:  ${guest_partition:-disabled}
  InterLink version:    $INTERLINK_VERSION
  wstunnel version:     $WSTUNNEL_VERSION
EOF

if [[ "$assume_yes" != true ]]; then
  [[ -t 0 ]] || die "use --yes for non-interactive installation"
  read -r -p "Continue? [y/N]: " answer
  [[ "$answer" =~ ^[Yy]$ ]] || { printf 'Canceled.\n'; exit 0; }
fi

config_dir="$HOME/.config/interlink"
bin_dir="$HOME/.local/bin"
state_dir="$HOME/.local/state/interlink"
mkdir -p "$config_dir" "$bin_dir" "$state_dir" \
  "$shared_root/apptainer" "$shared_root/jobs"

tmp_dir=$(mktemp -d)
trap 'rm -rf "$tmp_dir"' EXIT

case "$(uname -m)" in
  x86_64|amd64) arch="x86_64" ;;
  *) die "the published InterLink binary is not available for $(uname -m)" ;;
esac

release="https://github.com/interlink-hq/interlink-slurm-plugin/releases/download/${INTERLINK_VERSION}"
plugin_binary="interlink-sidecar-slurm_Linux_${arch}"
curl --fail --location "$release/$plugin_binary" --output "$tmp_dir/$plugin_binary"
curl --fail --location "$release/checksums.txt" --output "$tmp_dir/checksums.txt"
(cd "$tmp_dir" && grep " $plugin_binary$" checksums.txt | sha256sum --check -)
install -m 0755 "$tmp_dir/$plugin_binary" "$bin_dir/interlink-sidecar-slurm"

archive="wstunnel_${WSTUNNEL_VERSION}_linux_amd64.tar.gz"
wstunnel_url="https://github.com/erebe/wstunnel/releases/download/v${WSTUNNEL_VERSION}/${archive}"
curl --fail --location "$wstunnel_url" --output "$tmp_dir/$archive"
if [[ "$WSTUNNEL_VERSION" == "10.5.5" ]]; then
  printf '%s  %s\n' "$WSTUNNEL_SHA256" "$tmp_dir/$archive" | sha256sum --check -
else
  printf 'Warning: no pinned wstunnel checksum is available for version %s.\n' "$WSTUNNEL_VERSION" >&2
fi
tar --extract --gzip --file "$tmp_dir/$archive" --directory "$tmp_dir" wstunnel
install -m 0755 "$tmp_dir/wstunnel" "$bin_dir/wstunnel"

install -m 0600 "$credential_file" "$config_dir/tunnel-path-prefix"

config_file="$config_dir/SlurmConfig.yaml"
cat >"$config_file" <<EOF
SidecarPort: "4001"
SbatchPath: $(command -v sbatch)
ScancelPath: $(command -v scancel)
SqueuePath: $(command -v squeue)
SinfoPath: $(command -v sinfo)
SingularityPath: $(command -v apptainer)
ImagePrefix: docker://
CommandPrefix: "export APPTAINER_CACHEDIR=$shared_root/apptainer; export SINGULARITY_CACHEDIR=$shared_root/apptainer;"
ExportPodData: true
DataRootFolder: $shared_root/jobs/
Namespace: $namespace
EnableProbes: true
DefaultFlavor: cpu

Flavors:
  cpu:
    Name: cpu
    CPUDefault: 1
    MemoryDefault: 1G
    SlurmFlags:
      - --account=$account
      - --partition=$cpu_partition
      - --time=00:30:00
EOF

if [[ -n "$gpu_partition" ]]; then
  cat >>"$config_file" <<EOF

  gpu:
    Name: gpu
    CPUDefault: 8
    MemoryDefault: 64G
    SlurmFlags:
      - --account=$account
      - --partition=$gpu_partition
      - --gres=gpu:1
      - --constraint=$gpu_constraint
      - --time=04:00:00
EOF
fi

if [[ -n "$guest_partition" ]]; then
  cat >>"$config_file" <<EOF

  gpu-guest:
    Name: gpu-guest
    Description: Opportunistic GPU
    CPUDefault: 8
    MemoryDefault: 64G
    SlurmFlags:
      - --account=$account
      - --partition=$guest_partition
      - --gres=gpu:1
      - --constraint=$gpu_constraint
      - --time=04:00:00
EOF
fi
chmod 0600 "$config_file"

cat >"$config_dir/site.env" <<EOF
TUNNEL_HOST=$tunnel_host
EOF
chmod 0600 "$config_dir/site.env"

cat >"$bin_dir/interlink-slurm-start" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
config_dir="$HOME/.config/interlink"
state_dir="$HOME/.local/state/interlink"
bin_dir="$HOME/.local/bin"
source "$config_dir/site.env"
mkdir -p "$state_dir"

start_process() {
  local name="$1"
  shift
  local pid_file="$state_dir/$name.pid"
  if [[ -f "$pid_file" ]] && kill -0 "$(cat "$pid_file")" 2>/dev/null; then
    printf '%s is already running (PID %s).\n' "$name" "$(cat "$pid_file")"
    return
  fi
  nohup "$@" >>"$state_dir/$name.log" 2>&1 &
  echo "$!" >"$pid_file"
  printf 'Started %s (PID %s).\n' "$name" "$!"
}

start_process plugin env \
  SLURMCONFIGPATH="$config_dir/SlurmConfig.yaml" \
  "$bin_dir/interlink-sidecar-slurm"

path_prefix=$(tr -d '\r\n' <"$config_dir/tunnel-path-prefix")
start_process tunnel "$bin_dir/wstunnel" client \
  --http-upgrade-path-prefix "$path_prefix" \
  --remote-to-local "tcp://0.0.0.0:4001:127.0.0.1:4001" \
  "wss://$TUNNEL_HOST"

sleep 2
"$bin_dir/interlink-slurm-status"
EOF

cat >"$bin_dir/interlink-slurm-stop" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
state_dir="$HOME/.local/state/interlink"
for name in tunnel plugin; do
  pid_file="$state_dir/$name.pid"
  if [[ -f "$pid_file" ]] && kill -0 "$(cat "$pid_file")" 2>/dev/null; then
    pid=$(cat "$pid_file")
    kill "$pid"
    printf 'Stopped %s (PID %s).\n' "$name" "$pid"
  else
    printf '%s is not running.\n' "$name"
  fi
  rm -f "$pid_file"
done
EOF

cat >"$bin_dir/interlink-slurm-status" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
state_dir="$HOME/.local/state/interlink"
failed=0
for name in plugin tunnel; do
  pid_file="$state_dir/$name.pid"
  if [[ -f "$pid_file" ]] && kill -0 "$(cat "$pid_file")" 2>/dev/null; then
    printf '%s: running (PID %s)\n' "$name" "$(cat "$pid_file")"
  else
    printf '%s: stopped\n' "$name"
    failed=1
  fi
done
exit "$failed"
EOF

chmod 0755 "$bin_dir/interlink-slurm-start" \
  "$bin_dir/interlink-slurm-stop" "$bin_dir/interlink-slurm-status"

cat <<EOF

Installation complete.

Review: $config_file
Start:  $bin_dir/interlink-slurm-start
Status: $bin_dir/interlink-slurm-status
Stop:   $bin_dir/interlink-slurm-stop
Logs:   tail -f $state_dir/plugin.log $state_dir/tunnel.log

The installer has not started either process. Review the generated configuration,
then run interlink-slurm-start and ask the NRP administrator to validate the node.
EOF
