---
title: KubeVirt GPU
description: KubeVirt GPU configuration and management.
---

:::warning[Admin Documentation]
This page contains administrative documentation intended for cluster administrators and operators. This content may not be relevant for regular users.
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
kubectl label nodes node-name nautilus.io/vfio=true
```

#### Step 3: SSH into the Node
SSH into the node.

#### Step 4: Record Installed NVIDIA Driver Names
List the installed NVIDIA drivers to note the versions for potential reinstallation later:

```bash
dpkg -l | grep nvidia
```

#### Step 5: Uninstall All NVIDIA Drivers
Uninstall the NVIDIA drivers from the node:

```bash
sudo apt-get remove --purge '^nvidia-.*'
```

#### Step 6: Enable IOMMU and Shut Down the Node
Modify the `GRUB_CMDLINE_LINUX_DEFAULT` line in `/etc/default/grub` to include `iommu=pt amd_iommu=on`:

```bash
sudo vim /etc/default/grub
```

Then update GRUB and shut down the node:

```bash
sudo update-grub
sudo shutdown now
```

#### Step 7: Enable IOMMU in BIOS
Reboot the machine and enter BIOS/UEFI settings. Locate and enable the **IOMMU** option, usually under **Advanced Settings**, **Chipset**, or **CPU Configuration**. Save the changes and exit the BIOS.

#### Step 8: Start the Node Back Up
Reboot the node after enabling IOMMU.

#### Step 9: Verify Driver Removal
Check that the NVIDIA drivers and device plugin are no longer present:

```bash
dpkg -l | grep nvidia
```

#### Step 10: Install `driverctl`
Install `driverctl` to manage device bindings:

```bash
sudo apt install driverctl -y
```

#### Step 11: Bind the GPU to `vfio-pci`
Bind the specific GPU (e.g., `81:00.0`) to `vfio-pci`:

```bash
sudo driverctl set-override 0000:81:00.0 vfio-pci
```

Replace `81:00.0` with the correct PCI address for your GPU.

#### Step 12: Check if the Devices are Bound to `vfio-pci`
Verify that the GPUs are bound to `vfio-pci`:

```bash
lspci -k -s 81:00.0
```

For all `vfio-pci` bound devices:

```bash
lspci -nnk | grep -i vfio
```

#### Step 13: Verify DaemonSet for GPU Management
After binding the GPUs, check the logs of the `nvidia-kubevirt-gpu-dp-daemonset` pod:

```bash
kubectl logs nvidia-kubevirt-gpu-dp-daemonset-pod-name
```

Look for lines like:

```bash
2024/10/31 03:16:06 Allocated devices map[PCI_RESOURCE_NVIDIA_COM_TU102GL_QUADRO_RTX_6000_8000:0000:81:00.0]
```


This confirms how KubeVirt manages the GPU.

#### Step 14: Add the GPU Resource Name to KubeVirt
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

##### Step 15: Restart the DaemonSet Pod
After updating the configuration, restart the NVIDIA DaemonSet pod:

```bash
kubectl delete pod -l app=nvidia-kubevirt-gpu-dp -n kubevirt
```

### Conclusion
Your Kubernetes node is now fully configured for VFIO passthrough, enabling GPU resources for KubeVirt VMs. You can test this configuration using one of the KubeVirt virtualization examples, such as [Running Virtualization on Windows](https://docs.nrp.ai/userdocs/running/virtualization-windows/).
