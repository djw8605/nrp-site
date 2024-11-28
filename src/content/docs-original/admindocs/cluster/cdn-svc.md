## Creating cluster-wide CDN-like services

The cluster nodes are grouped by topology.kubernbetes.io/{region,zone} labels. For applications that require faster or larger network connectivity, it's possible to distribute the pods through most or all zones and'or (larger) regions, and also make kubernetes service aware of that.

** I was not able to make this work yet, most likely because of [safeguards](https://kubernetes.io/docs/concepts/services-networking/topology-aware-hints/#safeguards) which we violate several of. **

#### Pod affinities

First step is to set the pod affinities to make sure that:

1. Pods are geographically repelled from each other

2. Optionally: pods are attracted to some other points (for example if you want to place pods next to the Ingress points of the cluster)

To spread the pods between zones, add the podAntiAffinity to your deployment:

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

It's also possible to do required instead of preferred:

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

To attract the pods to HAProxies, add the podAffinity:

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

(you can adjust the weights too)

#### Service topology awareness

Now your service can be [topology zone aware](https://kubernetes.io/docs/concepts/services-networking/topology-aware-hints/) and prefer serving traffic locally inside the zone:

```yaml
kind: Service
metadata:
  annotations:
    service.kubernetes.io/topology-aware-hints: auto
```

(Seems like this is [being deprecated already](https://github.com/kubernetes/kubernetes/pull/116522))