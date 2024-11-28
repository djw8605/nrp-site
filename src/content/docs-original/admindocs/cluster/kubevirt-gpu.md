### Guide: Switch Kubernetes Node to VFIO Passthrough for KubeVirt

#### Step 1: Cordon and Drain the Node
To prevent any new pods from being scheduled on the node and to safely migrate existing workloads, you need to cordon and drain the node.

```bash
kubectl cordon node-name
kubectl drain node-name --ignore-daemonsets --delete-local-data
```

#### Step 2: Label the Node
Add a label to the node to indicate that it is now configured for VFIO passthrough.

```bash
kubectl label nodes node-name nautilus.io/vfio=true
```

#### Step 3: SSH into the Node
SSH into the node.

#### Step 4: Record Installed NVIDIA Driver Names
List the installed NVIDIA drivers to know which versions you might want to reinstall later. You can do this with:

```bash
dpkg -l | grep nvidia
```

Make a note of the driver names and versions, as you'll need this information if you want to switch back to K8s-managed GPUs later.

#### Step 5: Uninstall All NVIDIA Drivers
Uninstall the NVIDIA drivers from the node.

```bash
sudo apt-get remove --purge '^nvidia-.*'
```

#### Step 6: Shut Down the Node
Once the NVIDIA drivers are uninstalled, shut down the node:

```bash
sudo shutdown now
```

#### Step 7: Enable IOMMU in BIOS
Reboot the machine and enter the BIOS/UEFI settings. Locate and enable the **IOMMU** option. This is typically found under **Advanced Settings**, **Chipset**, or **CPU Configuration**. Save the changes and exit the BIOS.

#### Step 8: Start the Node Back Up
After enabling IOMMU, start the node again.

#### Step 9: Verify Driver Removal
After the node is back up, check that the NVIDIA drivers and device plugin are no longer present:

```bash
lspci | grep -i nvidia
```

There should be no NVIDIA drivers listed.

#### Step 10: Bind the Devices Using VFIO
You can now bind the GPU devices to the `vfio-pci` driver. For example, if your device ID is `10de:2204`, run the following command:

```bash
echo "10de 2204" | sudo tee /sys/bus/pci/drivers/vfio-pci/new_id
```

Replace `10de 2204` with the appropriate vendor and device IDs for your GPUs.

#### Step 11: Bind the GPU to `vfio-pci`
To bind the specific GPU (e.g., `81:00.0`) to `vfio-pci`, run:

```bash
echo "81:00.0" | sudo tee /sys/bus/pci/drivers/vfio-pci/bind
```

Make sure to replace `81:00.0` with the correct PCI address for your GPU.

#### Step 12: Check if the Devices are Bound to `vfio-pci`
To verify that the GPUs are correctly bound to the `vfio-pci` driver, run:

```bash
lspci -k -s 81:00.0
```

This command should show that the `vfio-pci` driver is in use for the specified PCI address. To check all `vfio-pci` bound devices, you can also run:

```bash
lspci -nnk | grep -i vfio
```

You should see entries corresponding to your GPUs confirming they are bound to `vfio-pci`.

#### Step 13: Verify DaemonSet for GPU Management
After binding the GPUs, you will see a pod from the `nvidia-kubevirt-gpu-dp-daemonset`. Check the logs of this pod to verify the allocation of devices:

```bash
kubectl logs nvidia-kubevirt-gpu-dp-daemonset-pod-name
```

In the logs, look for a line similar to:

```
2024/10/31 03:16:06 Allocated devices map[PCI_RESOURCE_NVIDIA_COM_TU102GL_QUADRO_RTX_6000_8000:0000:81:00.0]
```

This line indicates how KubeVirt manages the GPU, showing the name which translates to `nvidia.com/TU102GL_QUADRO_RTX_6000_8000`. Note that this name differs from the Kubernetes resource name, which typically refers to it as `nvidia.com/gpu` or `nvidia.com/rtx6000`.

#### Step 14: Add the GPU Resource Name to KubeVirt
Now that you have the name of the GPU, add it to KubeVirt by editing the KubeVirt configuration:

```bash
kubectl edit kubevirt kubevirt
```

In the `permittedHostDevices` section, add your GPU entry as follows:

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

You can find the `pciVendorSelector` values by running:

```bash
lspci -nn
```

Look for the output that corresponds to your GPU devices.

#### Step 15: Restart the DaemonSet Pod
After updating the KubeVirt configuration, restart the NVIDIA DaemonSet to ensure it recognizes the new GPU configuration:

```bash
kubectl delete pod -l app=nvidia-kubevirt-gpu-dp -n kubevirt
```

This command deletes the pods associated with the NVIDIA DaemonSet, allowing them to restart and apply the new configuration.

### Conclusion
Your Kubernetes node is now fully configured for VFIO passthrough, enabling GPU resources for KubeVirt VMs. You can test the configuration using one of the virtualization examples in the KubeVirt documentation, such as:

- [Running Virtualization on Windows](https://docs.nrp.ai/userdocs/running/virtualization-windows/)
