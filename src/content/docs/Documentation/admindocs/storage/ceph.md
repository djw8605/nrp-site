---
title: Ceph Recover
description: Ceph Recover
---

:::caution
This page contains administrative documentation intended for cluster administrators and operators. This content may not be relevant for regular users.
:::




## Finding lost objects

Install [kubectl-rook-ceph](https://github.com/rook/kubectl-rook-ceph)

`kubectl rook-ceph --operator-namespace rook-system -n rook debug start rook-ceph-osd-<id>`

`ceph-objectstore-tool --data-path=/var/lib/rook/rook/... --mon-initial-members=... --dry-run --op=fix-lost`

`kubectl rook-ceph --operator-namespace rook-system -n rook debug stop rook-ceph-osd-<id>`
