---
title: Nodes
description: Nodes
---

:::caution
This page contains administrative documentation intended for cluster administrators and operators. This content may not be relevant for regular users.
:::




### Upgrade compute nodes
#### Upgrade GPU driver
1. Verify that the target driver is available at https://yumrepo.nrp-nautilus.io/nvidia/. If not, obtain the driver file from nvidia.com, and transfer it to the pod `repo` in the `kernel` namespace, in directory `/repo/nvidia`. Make sure the name of the driver file is in the format of `NVIDIA-Linux-<architecture>-<driver-version>.run`. For example: `NVIDIA-Linux-x86_64-550.76.run`.
2. Pull the latest Ansible playbook repo from https://gitlab.nrp-nautilus.io/prp/nautilus-ansible, update the `nvidia_version` variable. The `nvidia_version` variable can be under a single host in `nautilus-hosts.yaml`, or in the group variable files under `group_vars` directory, depending on which nodes will get GPU driver updated.
3. Run command `ansible-playbook upgrade.yml -l <node> -t gpu -e netbox_token=<your-netbox-token>`. With the extra variable `netbox_token`, a record regarding node rebooting due to GPU upgrade will be generated in https://netbox-3.nrp-nautilus.io, but it's optional.

#### Upgrade all packages
Pull the latest Ansible playbook repo and run `ansible-playbook upgrade.yml -l <node> -t os -e netbox_token=<your-netbox-token>`.

#### Upgrade Kubernetes
Pull the latest Ansible playbook repo, and edit the file `group_vars/all` with the matching versions of `kubernetes`, `kubernetes_repo` and `crio`. 

Here's an example of the configs:
```
kubernetes_version: "1.26.11"
kubernetes_repo_version: "v1.26"
crio_version: "1.26"
```

The value of `kubernetes_repo` should include the patch version and match the version of `kubernetes` installed on the master node, for example, `1.26.11`. The value of `crio_version` only applies to the nodes that are runnning `crio` runtime, instead of `containerd`.

After updating the versions, run `ansible-playbook upgrade.yml -l <node> -t kubernetes`.

#### Upgrade Ubuntu release
Pull the latest Ansible playbook repo and run `ansible-playbook upgrade.yml -l <node> -t dist-upgrade -e netbox_token=<your-netbox-token>`.
Notice that release upgrade requires all installed packages to be the latest version. If it complaints, [upgrade all packages](#upgrade-all-packages) first.

#### Upgrade above tasks at once
Pull the latest Ansible playbook repo and run `ansible-playbook upgrade.yml -l <node> -e netbox_token=<your-netbox-token>`.
