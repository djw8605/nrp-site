---
title: Opportunistic Use
description: When to set priorityClassName on your pods, and the only one you usually want — opportunistic
---

In 95% of cases you don't need to set `priorityClassName`. The only common reason to set it is to use
**A100 / H100 / H200 / GH200** GPUs without a reservation, by setting `priorityClassName: opportunistic`.

:::tip[Rules of thumb]
- **Default workload?** Don't set `priorityClassName`. Done.
- **Want a special GPU without a reservation?** Set `priorityClassName: opportunistic` — your pod bypasses the GPU
  quota but can be preempted at any time.
- Don't set `default`, `owner`, `nice`, `batch-low`, or any `*-critical` class — admission will reject the pod.
:::

## What you're allowed to set

| Priority class | Value | User pods | GPU quota |
|---|---:|---|---|
| *(unset — the default)* | 0 | ✅ allowed | enforced |
| `armada-default` | 0 | ✅ allowed | enforced |
| `owner-no-preempt` | 10 | ✅ allowed | enforced |
| `opportunistic2` | −1.99×10⁹ | ✅ allowed | 🔓 bypassed |
| `opportunistic` | −2×10⁹ | ✅ allowed | 🔓 bypassed |

Everything else (`default`, `owner`, `nice`, `batch-low`, `system-*`, `kubevirt-*`, `*-batch-high`, etc.) is banned in
user namespaces. If your tooling auto-sets one of these, remove that line — your pod will run at the unset default,
which is what you want. Exemption requests for legitimate cases go through [Nautilus Support](/contact).

## Using opportunistic for special GPUs

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: h200-opportunistic
spec:
  priorityClassName: opportunistic
  containers:
  - name: gpu-container
    image: nvidia/cuda:12.4.1-cudnn-devel-ubuntu22.04
    command: ["python", "train.py"]
    resources:
      limits:
        nvidia.com/h200: 1
      requests:
        nvidia.com/h200: 1
```

The pod can be preempted by any other pod in the cluster, so checkpoint frequently or run it as a
[Job](/documentation/userdocs/running/jobs/) so the controller can restart it.

`opportunistic2` is the same idea but sits one step above `opportunistic` in priority — useful only if you don't want
to be preempted by *other* opportunistic workloads.

## If your pod is rejected

`pods "..." is forbidden: exceeded quota: high-priority-ban` or `low-priority-ban` means your `priorityClassName` is on
the ban list. Drop the field or switch to one of the allowed classes above.
