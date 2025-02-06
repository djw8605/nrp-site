---
title: Title
description: Description
---

Our cluster combines various hardware resources from multiple universities and other organizations. By default you can only use the nodes **having NO Taints** (see the [resources page](https://portal.nrp-nautilus.io/resources) of the portal).

#### All taints

Here's the full list of taints on the nodes. To run on the node having a taint, you need to [use the node toleration in your pod](https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/). Some are set automatically on deployed jobs by our cluster, some can only be used by privileged users. Please refer to this list and **only set the ones you were allowed to use by cluster admins**.

| Taint | Purpose | Who can set manually |
|--|--|--|
| **Public** |||
| nautilus.io/arm64 | ARM64 node, make sure your image supports ARM64. If you want to solely use ARM nodes in your pod, set the affinity `kubernetes.io/arch=arm64`, automatically tolerating this taint. | All |
| **Reserved for group use** |||
| nautilus.io/bluefield2 | Measuring and monitoring for SENSE | @jjgraham |
| nautilus.io/csu-tide | Reserved for the TIDE cluster | @youngsu_kim |
| nautilus.io/csusb | CSUSB reserved nodes. | Namespaces: csusb-chaseci, csusb-hpc, csusb-cousins-lab, csusb-jupyterhub, csusb-mpi, csusb-salloum, prp-dvu-csusb |
| nautilus.io/fpga-testing | Reserved for FPGA experiments and flashing | @jjgraham, @msada |
| nautilus.io/mizzou | Private use by Missouri researchers on Missouri resources | Missouri Researchers |
| nautilus.io/prism-center | RESERVED for PRISM Center | @jjgraham |
| nautilus.io/stashcache | Private OSG nodes | @fandri |
| nautilus.io/sdsc-llm | Reserved for an SDSC LLMs | sdsc-llm |
| nautilus.io/suncave-head | Suncave head node is only used for suncave operations | suncave |
| nautilus.io/suncave | Suncave operations until June 1st | suncave |
| nautilus.io/smash-hackathon| UCSD SMASH Hackathon (Jan 10th..12th 2025) | @ekhoda, @msada |
| nautilus.io/genai-lab | genai-lab, till 02-14-2025 | [Daniel Salas](mailto:salas.daniel@bcg.com	) [Olivia Alexander](mailto:oalexander@usra.edu)| 
| msu-cache, um-cache | Michigan State Cache for ATLAS | @ivukotic |
| **Set by system to user jobs** |||
| nvidia.com/gpu=Exists:PreferNoSchedule | Fence GPU nods from CPU jobs (Preferred! Jobs can still go on the node if there are no free CPU nodes) | No |
| nautilus.io/large-gpu | Node accepts 4- and 8-GPU jobs only. Set automatically. | No |
| **Reserved for system use** |||
| gitlab.com/issue | There's a GitLab issue describing the problem | No |
| nautilus.io/ceph | Don't run any user jobs on ceph storage nodes | No |
| nautilus.io/gitlab-issue | There's a GitLab issue describing the problem | No |
| nautilus.io/linstor-server | Don't run any user jobs on linstor storage nodes | No |

[Observable notebook with taints summary](https://observablehq.com/d/1cb451398e09c3ff)

#### Running in group namespaces


Our cluster contains several sets of nodes dedicated to certain groups.

User can target **ONLY THE GROUP NODES** by using the nodeAffinity such as:

```yaml
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: nautilus.io/group
            operator: In
            values:
            - group1
```

for large jobs to avoid taking over all shared cluster resources. Optionally a higher priority can be used for such jobs (talk to admins before using one).

#### Other taints

Some nodes in the cluster don't have access to public Internet, and can only access educational network. They still can pull images from Docker Hub using a proxy.

If your workload is not using the public Internet resources, you might tolerate the `nautilus.io/science-dmz` and get access to additional nodes.

