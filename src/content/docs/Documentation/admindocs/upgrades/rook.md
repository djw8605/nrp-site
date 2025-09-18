---
title: Rook/Ceph Upgrades
description: Rook/Ceph upgrade procedures
---

:::warning[Admin Documentation]
This page contains administrative documentation intended for cluster administrators and operators. This content may not be relevant for regular users.
:::




Follow the [most recent docs corresponding the the version being upgraded to](https://rook.io/docs/rook/v1.12/Upgrade/rook-upgrade/).

It's important to also use the [template for the 2nd cluster](https://github.com/rook/rook/blob/master/deploy/examples/common-second-cluster.yaml) for all additional Ceph clusters (there are 5+ deployed). Remove all the PSP stuff from it.

```bash
cd deploy/examples
export ROOK_OPERATOR_NAMESPACE=rook-system
export ROOK_CLUSTER_NAMESPACE=rook
sed -i.bak \
    -e "s/\(.*\):.*# namespace:operator/\1: $ROOK_OPERATOR_NAMESPACE # namespace:operator/g" \
    -e "s/\(.*\):.*# namespace:cluster/\1: $ROOK_CLUSTER_NAMESPACE # namespace:cluster/g" \
  common.yaml
```

Delete all related to PSP from common-second-cluster.yaml

```
mkdir clusters

export ROOK_OPERATOR_NAMESPACE="rook-system"

for SECOND_ROOK_CLUSTER_NAMESPACE in rook-central rook-haosu rook-east rook-pacific rook-south-east rook-tide; do

  sed \
      -e "s/\(.*\):.*# namespace:operator/\1: $ROOK_OPERATOR_NAMESPACE # namespace:operator/g" \
      -e "s/\(.*\):.*# namespace:cluster/\1: $SECOND_ROOK_CLUSTER_NAMESPACE # namespace:cluster/g" \
    common-second-cluster.yaml > clusters/$SECOND_ROOK_CLUSTER_NAMESPACE.yaml
; done

cp common.yaml clusters/

kubectl diff -f clusters
```

Fix `rook-ceph-mgr-system-secondary` stuff

see if changes make sense, then follow the guide:

```
kubectl apply -f clusters -f crds.yaml
```

... other commands from the guide

fix toolbox pods

## Upgrading Ceph

**Before upgrading the major version, [make sure the OS and kernel support it](https://docs.ceph.com/en/latest/start/os-recommendations/)**

```
