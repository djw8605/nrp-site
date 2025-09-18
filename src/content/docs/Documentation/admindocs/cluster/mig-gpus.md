---
title: MIG GPUs
description: Managing MIG GPUs in the cluster.
---

:::caution
This page contains administrative documentation intended for cluster administrators and operators. This content may not be relevant for regular users.
:::




1. Drain the node.

2. Run the command to convert **ALL** GPUs to MIGs:

```bash
sudo nvidia-smi -mig 1
```

3. Install `nvidia-mig-parted` on the node.

4. Install `nvidia-mig-manager` on the node. You can find the installation details [here](https://github.com/NVIDIA/mig-parted/tree/main/deployments/systemd).

5. Create a `config.yaml` file for the node and place it in **/etc/nvidia-mig-manager/config.yaml**. Example:

```yaml
version: v1
mig-configs:
  current:
  - devices: all
    mig-enabled: true
    mig-devices:
      1g.10gb: 7
  all-disabled:
  - devices: all
    mig-enabled: true
    mig-devices:
      1g.10gb: 7
```

You can also SSH into an existing MIG node and run `sudo nvidia-mig-parted export`.

6. Test persistence with reboots to ensure MIG settings are retained.

7. Don't forget to **uncordon** the node.
