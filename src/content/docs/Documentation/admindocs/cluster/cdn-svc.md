---
title: CDN Services
description: CDN services configuration and management.
---

:::caution
This page contains administrative documentation intended for cluster administrators and operators. This content may not be relevant for regular users.
:::




The nodes in the cluster are grouped by the `topology.kubernetes.io/{region,zone}` labels. For applications requiring faster or larger network connectivity, you can distribute pods across multiple zones or larger regions. Kubernetes services can also be made aware of these topologies to optimize performance.

**Note:** This setup has not been fully successful yet, most likely due to [safeguards](https://kubernetes.io/docs/concepts/services-networking/topology-aware-hints/#safeguards) that are being violated in this configuration.

#### Pod Affinities and Anti-Affinities

The first step is to configure pod affinities and anti-affinities to control where pods are placed within the cluster:

1. **Pod Anti-Affinity:** Ensures that pods are geographically repelled from each other.
2. **Pod Affinity:** Optionally, you can attract pods to certain points (for example, next to ingress points).

To spread the pods across different zones, add `podAntiAffinity` to your deployment:

```yaml
spec:
  affinity:
    podAntiAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
      - podAffinityTerm:
          labelSelector:
            matchExpressions:
            - key: <pod label to watch>
              operator: In
              values:
              - <label value>
          topologyKey: topology.kubernetes.io/zone
        weight: 50
```

You can also use `requiredDuringSchedulingIgnoredDuringExecution` instead of `preferred` to enforce stricter placement rules:

```yaml
spec:
  affinity:
    podAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchExpressions:
          - key: k8s-app
            operator: In
            values:
            - frontier-squid
        topologyKey: topology.kubernetes.io/zone
```

To attract pods to high-availability proxies, use `podAffinity`:

```yaml
spec:
  affinity:
    podAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
      - podAffinityTerm:
          labelSelector:
            matchExpressions:
            - key: app.kubernetes.io/instance
              operator: In
              values:
              - haproxy-ingress
          namespaces:
          - haproxy
          topologyKey: topology.kubernetes.io/zone
        weight: 50
```

You can also adjust the weight to fine-tune the affinity preferences.

#### Service Topology Awareness

To ensure that your service is [topology-aware](https://kubernetes.io/docs/concepts/services-networking/topology-aware-hints/) and prefers serving traffic within the same zone:

```yaml
kind: Service
metadata:
  annotations:
    service.kubernetes.io/topology-aware-hints: auto
```

**Note:** This feature is [being deprecated](https://github.com/kubernetes/kubernetes/pull/116522), so consider alternatives in the future.
