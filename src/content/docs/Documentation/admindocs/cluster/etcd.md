---
title: Etcd purging
description: Purging etcd database when it exceeds the limit.
---

Make sure the etcd size fits the one in `/etc/kubernetes/manifests/etcd.yaml`, quota-backend-bytes (5GB).

`nerdctl run --rm --network host     -v /etc/kubernetes/pki/etcd:/etc/kubernetes/pki/etcd:ro     --env ETCDCTL_API=3     k8s.gcr.io/etcd:3.5.6-0     etcdctl --endpoints=https://127.0.0.1:2379     --cacert=/etc/kubernetes/pki/etcd/ca.crt     --cert=/etc/kubernetes/pki/etcd/healthcheck-client.crt     --key=/etc/kubernetes/pki/etcd/healthcheck-client.key     --write-out=table endpoint status`

If it doesn't, [perform compaction](https://etcd.io/blog/2023/how_to_debug_large_db_size_issue/).

```bash
root@controller0:/home/nautilus# nerdctl run --rm --network host -v /etc/kubernetes/pki/etcd:/etc/kubernetes/pki/etcd:ro --env ETCDCTL_API=3 registry.k8s.io/etcd:3.5.16-0 etcdctl --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/healthcheck-client.crt --key=/etc/kubernetes/pki/etcd/healthcheck-client.key endpoint status --write-out="json" | egrep -o '"revision":[0-9]*' | egrep -o '[0-9].*'
7783737844
root@controller0:/home/nautilus# nerdctl run --rm --network host -v /etc/kubernetes/pki/etcd:/etc/kubernetes/pki/etcd:ro --env ETCDCTL_API=3 registry.k8s.io/etcd:3.5.16-0 etcdctl --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/healthcheck-client.crt --key=/etc/kubernetes/pki/etcd/healthcheck-client.key compact <the revision from above>
compacted revision 7783737844
root@controller0:/home/nautilus# nerdctl run --rm --network host -v /etc/kubernetes/pki/etcd:/etc/kubernetes/pki/etcd:ro --env ETCDCTL_API=3 registry.k8s.io/etcd:3.5.16-0 etcdctl --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/healthcheck-client.crt --key=/etc/kubernetes/pki/etcd/healthcheck-client.key --command-timeout=30s defrag
Finished defragmenting etcd member[https://127.0.0.1:2379]
```
