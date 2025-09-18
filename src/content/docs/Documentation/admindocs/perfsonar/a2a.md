---
title: A2A Maddash
description: Description
---

:::caution
This page contains administrative documentation intended for cluster administrators and operators. This content may not be relevant for regular users.
:::




#### All to All maddash

The [NRP][maddash1] maddash shows the connectivity between a node selected at each site. The sites are labelled in Kubernetes by the `topology.kubernetes.io/zone` label.

To get the node participating in the maddash, you can run this query (for example, starlight is the zone we're interested in):

```bash
kubectl get nodes -l nautilus.io/a2a-latency,topology.kubernetes.io/zone=starlight
NAME                    STATUS   ROLES    AGE    VERSION
dtn101.sl.startap.net   Ready    <none>   2y4d   v1.23.14
```

[maddash1]: https://perfsonar.nrp-nautilus.io/maddash-webui/
