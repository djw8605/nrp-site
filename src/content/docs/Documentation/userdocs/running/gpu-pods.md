---
title: GPU Pods
description: GPU Pods
---

!!! info
    
    In this section you will request GPUs. Make sure you don't waste those and delete your pods when not using the GPUs.


!!! warning
    
    The NRP is in a transition in how some specific high-memory GPUs are requested. The old syntax involved setting node affinity, the new
    only requires the gpu type in the container `resource` requests and limits.

#### Running GPU pods

Use this definition to create your own pod and deploy it to kubernetes:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: gpu-pod-example
spec:
  containers:
  - name: gpu-container
    image: tensorflow/tensorflow:latest-gpu
    command: ["sleep", "infinity"]
    resources:
      limits:
        nvidia.com/gpu: 1
      requests:
        nvidia.com/gpu: 1
```

This example requests 1 GPU device. You can have up to 8 per node if you're [using jobs](/userdocs/running/jobs/), and up to 2 for pods. If you request GPU devices in your pod, 
kubernetes will auto schedule your pod to the appropriate node. There's no need to specify the location manually.

**You should always delete your pod** when your computation is done to let other users use the GPUs.
Consider using [Jobs](/userdocs/running/jobs/) **with actual script instead of `sleep`** whenever possible to ensure your pod is not wasting GPU time.
If you have never used Kubernetes before, see the [tutorial](/userdocs/tutorial/intro).

#### Requesting special GPUs

Certain kinds of GPUs are advertised on nodes as a special resource, f.e. "nvidia.com/rtx-8000". You have to request that resource instead of the "nvidia.com/gpu" one.

The current list is:

GPU Type | resource
---|---
A40 | nvidia.com/a40
A100 | nvidia.com/a100
Nvidia RTX A6000 | nvidia.com/rtxa6000
Quadro RTX 8000 | nvidia.com/rtx8000
Grace Hopper GH200 | nvidia.com/gh200
A100 MIG 1g.10gb | nvidia.com/mig-small

For example, modifying the above example for one of these GPUs, the new yaml would be:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: gpu-pod-example
spec:
  containers:
  - name: gpu-container
    image: tensorflow/tensorflow:latest-gpu
    command: ["sleep", "infinity"]
    resources:
      limits:
        nvidia.com/a100: 1
      requests:
        nvidia.com/a100: 1
```

For Grace Hopper node make sure you're also using the image with `arm` support (`nvidia/cuda:12.4.1-cudnn-devel-ubuntu22.04` is a good one) and [tolerating the arm64 architecture](/userdocs/running/special/):

```yaml
tolerations:
- key: "nautilus.io/arm64"
  operator: "Exists"
  effect: "NoSchedule"
```

#### Requesting many GPUs

Since 1 and 2 GPU jobs are blocking nodes from getting 4 and 8-GPU jobs, there are some nodes reserved for those. Once you submit a job with 4 or 8 GPUs request, a controller will automatically add toleration which will allow you to use the node reserved for more GPUs. You don't need to do anything manually for that.

#### Choosing GPU type

**See [requesting high-end GPUs](#requesting-high-end-gpus) for special types of GPU**

We have a variety of GPU flavors attached to Nautilus. This table describes the types of GPUs available for use, but is not up to date - it's better to use the actual cluster information (f.e. `kubectl get nodes -L nvidia.com/gpu.product`).

<div id="observablehq-chart-35acf314"></div>
<p>Credit: <a href="https://observablehq.com/d/7c0f46855b4212e0">GPU types by NRP Nautilus</a></p>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@observablehq/inspector@5/dist/inspector.css">
<script type="module">
import {Runtime, Inspector} from "https://cdn.jsdelivr.net/npm/@observablehq/runtime@5/dist/runtime.js";
import define from "https://api.observablehq.com/d/7c0f46855b4212e0.js?v=4";
new Runtime().module(define, name => {
  if (name === "chart") return new Inspector(document.querySelector("#observablehq-chart-35acf314"));
});
</script>

If you need more graphical memory, use this table or official specs to choose the type:

GPU Type | Memory size (GB)
---|---
NVIDIA-GeForce-GTX-1070 | 8G
NVIDIA-GeForce-GTX-1080 | 8G
Quadro-M4000 | 8G
NVIDIA-A100-PCIE-40GB-MIG-2g.10gb | 10G
NVIDIA-GeForce-GTX-1080-Ti | 12G
NVIDIA-GeForce-RTX-2080-Ti | 12G
NVIDIA-TITAN-Xp | 12G
Tesla-T4 | 16G
NVIDIA-A10 | 24G
NVIDIA-GeForce-RTX-3090 | 24G
NVIDIA-GeForce-RTX-4090 | 24G
NVIDIA-TITAN-RTX | 24G
NVIDIA-RTX-A5000 | 24G
Quadro-RTX-6000 | 24G
Tesla-V100-SXM2-32GB | 32G
NVIDIA-A40 | 48G
NVIDIA-L40 | 48G
NVIDIA-RTX-A6000 | 48G
Quadro-RTX-8000 | 48G
NVIDIA-A100-SXM4-80GB | 80G

**NOTE**: [Not all nodes are available to all users](/userdocs/running/special/). You can consult about your available resources in [Matrix](/userdocs/start/contact) and on [resources page](https://portal.nrp-nautilus.io/resources). 
Labs connecting their hardware to our cluster have preferential access to all our resources.

!!! warning

    This is the old syntax below. For higher end GPUs, the use the syntax documented above!

To use a **specific type of GPU**, add the affinity definition to you pod yaml
file. The example below specifies *1080Ti* GPU:
```yaml
spec:
 affinity:
   nodeAffinity:
     requiredDuringSchedulingIgnoredDuringExecution:
       nodeSelectorTerms:
       - matchExpressions:
         - key: nvidia.com/gpu.product
           operator: In
           values:
           - NVIDIA-GeForce-GTX-1080-Ti
```

**To make sure you did everything correctly** after you've submited the job, look at the corresponding pod yaml (`kubectl get pod ... -o yaml`) and check that resulting nodeAffinity is as expected.

#### Selecting CUDA version

In general the higher CUDA versions support the lower and same driver version. The nodes are labelled with the major and minor CUDA and driver versions. You can check those at the [resources page](https://portal.nrp-nautilus.io/resources) or list with this command (it will also choose only GPU nodes):

```bash
kubectl get nodes -L nvidia.com/cuda.driver.major,nvidia.com/cuda.driver.minor,nvidia.com/cuda.runtime.major,nvidia.com/cuda.runtime.minor -l nvidia.com/gpu.product
```

If you're using the container image with higher CUDA version, you have to pick the nodes supporting it. Example:

```yaml
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: nvidia.com/cuda.runtime.major
            operator: In
            values:
            - "12"
          - key: nvidia.com/cuda.runtime.minor
            operator: In
            values:
            - "2"
```

Also you can choose the driver above something if you know which one you need (this will pick drivers **above** 535):

```yaml
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: nvidia.com/cuda.driver.major
            operator: Gt
            values:
            - "535"
```
