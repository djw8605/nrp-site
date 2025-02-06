---
title: Title
description: Description
---

#### Kubernetes upgrades

Check the [versions skew policy](https://kubernetes.io/releases/version-skew-policy/)

1. Scale down admiralty deployments and delete all virtual nodes - those prevent the upgrades
2. Make sure the etcd size fits the standard limit (2GB).

`nerdctl run --rm --network host     -v /etc/kubernetes/pki/etcd:/etc/kubernetes/pki/etcd:ro     --env ETCDCTL_API=3     k8s.gcr.io/etcd:3.5.6-0     etcdctl --endpoints=https://127.0.0.1:2379     --cacert=/etc/kubernetes/pki/etcd/ca.crt     --cert=/etc/kubernetes/pki/etcd/healthcheck-client.crt     --key=/etc/kubernetes/pki/etcd/healthcheck-client.key     --write-out=table endpoint status`

If it doesn't, [perform compaction](https://etcd.io/blog/2023/how_to_debug_large_db_size_issue/).

```bash
root@controller0:/home/nautilus# nerdctl run --rm --network host -v /etc/kubernetes/pki/etcd:/etc/kubernetes/pki/etcd:ro --env ETCDCTL_API=3 registry.k8s.io/etcd:3.5.9-0 etcdctl --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/healthcheck-client.crt --key=/etc/kubernetes/pki/etcd/healthcheck-client.key endpoint status --write-out="json" | egrep -o '"revision":[0-9]*' | egrep -o '[0-9].*'
7783737844
root@controller0:/home/nautilus# nerdctl run --rm --network host -v /etc/kubernetes/pki/etcd:/etc/kubernetes/pki/etcd:ro --env ETCDCTL_API=3 registry.k8s.io/etcd:3.5.9-0 etcdctl --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/healthcheck-client.crt --key=/etc/kubernetes/pki/etcd/healthcheck-client.key compact <the revision from above>
compacted revision 7783737844
root@controller0:/home/nautilus# nerdctl run --rm --network host -v /etc/kubernetes/pki/etcd:/etc/kubernetes/pki/etcd:ro --env ETCDCTL_API=3 registry.k8s.io/etcd:3.5.9-0 etcdctl --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/healthcheck-client.crt --key=/etc/kubernetes/pki/etcd/healthcheck-client.key defrag
Finished defragmenting etcd member[https://127.0.0.1:2379]
```

3. Follow the [upgrade guide](https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-upgrade/) for master.
   1. During the upgrade it's better to pre-pull the new images with `kubeadm config images pull`
4. If those were made and not in config, bring back all custom changes to controller-manager and etcd manifests in /etc/kubernetes/manifests.

   Etcd change not in config now: `- --quota-backend-bytes=5368709120`

   Controller-manager: `- --allocate-node-cidrs=false`

5. Do the last step in the upgrade manual to restart the control place again.

-- Breathe out! The master upgrade is done. --

5. Do rolling upgrade of compute nodes using ansible upgrade playbook.
6. Upgrade the kubernetes version in the [portal dependencies libraries](https://gitlab.nrp-nautilus.io/prp/k8s_portal/-/blob/master/go.mod)