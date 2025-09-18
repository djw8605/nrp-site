---
title: Software
description: Software
---

:::caution
This page contains administrative documentation intended for cluster administrators and operators. This content may not be relevant for regular users.
:::




## For DTNs
[GridFTP ][gridftp] as baseline for disk-to-disk throughput testing


## ESNet Software
- Links to publicly available [ESnet software][esnetlinks] 
- [Esmond-client package][esmond] 
- [Command line tools][esnet-cli]


## AI and related
[Swipe for Science][swipe] - annotating  large data sets of images 


## Multi-Cluster Orchestrators
[Submariner][submariner] - Multi-Cluster network connectivity for Kubernetes<br>
[Cilium][cilium]
- Multi-Cluster service routing using standard Kubernetes services.
- DNS Authorization with DNS request/response aware security policy enforcement to restrict the DNS names a pod can lookup as well as limit 
  the egress connectivity to the IPs returned in the DNS response of that particular pod.
- Transparent encryption and authentication for all service to service communication using X.509 certificates.

[Admiralty][admiralty]
- Multicluster-scheduler is a system of Kubernetes controllers that intelligently schedules workloads across clusters. It is simple to use and simple to integrate with other tools.
- Multicluster-controller is a Go library for building Kubernetes controllers that need to watch resources in multiple clusters. 
- Multicluster-service-account makes it easy to use Kubernetes service accounts as multicluster identities. It imports and automounts remote service account tokens inside pods, 
  for them to call the Kubernetes APIs of other clusters. Multicluster-service-account works well with multicluster-controller, but any cross-cluster Kubernetes client can benefit from it.


[submariner]: https://rancher.com/blog/2019/announcing-submariner-multi-cluster-kubernetes-networking/
[cilium]: https://cilium.io/blog/2018/12/10/cilium-14-preview/ 
[admiralty]: https://admiralty.io/

[gridftp]: https://fasterdata.es.net/data-transfer-tools/gridftp/
[esmond]: http://software.es.net/esmond/perfsonar_gridftp.html
[esnetlinks]: https://software.es.net
[esnet-cli]: https://fasterdata.es.net/data-transfer-tools/other/

[swipe]: https://swipesforscience.org
