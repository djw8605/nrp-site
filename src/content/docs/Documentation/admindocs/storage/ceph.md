---
title: Ceph Recover
description: "Ceph cluster recovery steps run through the kubectl-rook-ceph plugin."
---

## Finding lost objects

Install [kubectl-rook-ceph](https://github.com/rook/kubectl-rook-ceph)

`kubectl rook-ceph --operator-namespace rook-system -n rook debug start rook-ceph-osd-<id>`

`ceph-objectstore-tool --data-path=/var/lib/rook/rook/... --mon-initial-members=... --dry-run --op=fix-lost`

`kubectl rook-ceph --operator-namespace rook-system -n rook debug stop rook-ceph-osd-<id>`
