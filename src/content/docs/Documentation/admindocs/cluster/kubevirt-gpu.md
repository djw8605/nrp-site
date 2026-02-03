---
title: KubeVirt GPU
description: KubeVirt GPU configuration and management.
---

:::caution
This page contains administrative documentation intended for cluster administrators and operators. This content may not be relevant for regular users.
:::


:::note
The steps below are using the NVIDIA GPU Operator to bind the correct drivers.
:::



Follow these steps to configure a Kubernetes node for VFIO passthrough, enabling GPU resources for KubeVirt VMs.

#### Step 1: Cordon and Drain the Node
To prevent new pods from being scheduled and to safely migrate existing workloads, cordon and drain the node:

```bash
kubectl drain {node name} --ignore-daemonsets --delete-emptydir-data --force
```

#### Step 2: Label the Node
Add a label to the node indicating it is configured for VFIO passthrough:

```bash
kubectl label nodes node-name nvidia.com/gpu.workload.config=vm-passthrough
```

#### Step 3: Enable IOMMU and Shut Down the Node
Modify the `GRUB_CMDLINE_LINUX_DEFAULT` line in `/etc/default/grub` to include `iommu=pt amd_iommu=on`:

```bash
sudo vim /etc/default/grub
```

Then update GRUB and shut down the node:

```bash
sudo update-grub
sudo reboot
```


#### Step 4: Verify

SSH into the node and verify that the GPUs are bound to `vfio-pci`.

```bash
lspci -k -s 81:00.0
```

For all `vfio-pci` bound devices:

```bash
lspci -nnk | grep -i vfio
```

#### Step 5: Add the GPU Resource Name to KubeVirt
Edit the KubeVirt configuration to add the GPU resource name:

```bash
kubectl edit kubevirt kubevirt
```

In the `permittedHostDevices` section, add your GPU entry:

```yaml
permittedHostDevices:
  pciHostDevices:
    - externalResourceProvider: true
      pciVendorSelector: 10de:2236
      resourceName: nvidia.com/GA102GL_A10
    - externalResourceProvider: true
      pciVendorSelector: 10de:20b5
      resourceName: nvidia.com/GA100_A100_PCIE_80GB
    - externalResourceProvider: true
      pciVendorSelector: 10de:1e30
      resourceName: nvidia.com/TU102GL_QUADRO_RTX_6000_8000
```

Find the `pciVendorSelector` values by running:

```bash
lspci -nn
```
#### Step 6: Switching back

To switch back to the nvidia drivers, remove the added node label, and observe the gpu operator device plugin and driver pods start. After a few minutes, you can verify that node lists GPUs as allocatable resource, and can be safe to untaint after a test gpu pod.

### Conclusion
Your Kubernetes node is now fully configured for VFIO passthrough, enabling GPU resources for KubeVirt VMs. You can test this configuration using one of the KubeVirt virtualization examples, such as [Running Virtualization on Windows](https://docs.nrp.ai/userdocs/running/virtualization-windows/).
