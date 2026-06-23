---
title: Rook/Ceph Upgrades
description: Rook and Ceph upgrade procedures
---

:::caution
Upgrade one Ceph cluster at a time. Do not continue until the cluster is healthy and the upgrade is complete. The Operator is in rook-system, ceph clusters match their respective namespace names.
:::

## Check versions and compatibility

```bash
# Check Kubernetes
kubectl version

# Check the Rook operator image
kubectl -n rook-system get deploy rook-ceph-operator \
  -o jsonpath='{.spec.template.spec.containers[0].image}{"\n"}'

# Check all CephClusters
kubectl get cephcluster -A \
  -o custom-columns='NAMESPACE:.metadata.namespace,NAME:.metadata.name,EXTERNAL:.spec.external.enable,IMAGE:.spec.cephVersion.image,HEALTH:.status.ceph.health'
```

Before upgrading, check the official docs for the exact Rook version you plan to install:

- Rook supports the installed Kubernetes version.
- Rook supports the current and target Ceph versions.
- The Ceph target version supports the host OS and kernel.
- The upgrade path does not require another version first.

Replace `v1.16` in these links when targeting another Rook release:

- [Rook v1.16 prerequisites and Kubernetes versions](https://rook.io/docs/rook/v1.16/Getting-Started/Prerequisites/prerequisites/)
- [Rook v1.16 Ceph upgrade and supported Ceph versions](https://rook.io/docs/rook/v1.16/Upgrade/ceph-upgrade/)
- [Rook v1.16 operator upgrade](https://rook.io/docs/rook/v1.16/Upgrade/rook-upgrade/)
- [Ceph OS recommendations](https://docs.ceph.com/en/latest/start/os-recommendations/)
- [Ceph Squid release and upgrade notes](https://docs.ceph.com/en/latest/releases/squid/)

If the installed Rook version does not support the target Ceph version, upgrade Rook first.

## Ceph upgrade: Reef to Squid

### Pick one cluster

```bash
# Set NS to the namespace of the Ceph cluster you are upgrading
NS=rook-central
CEPH_CLUSTER="$NS"
```

Change `NS` to the cluster you want to upgrade. Upgrade only one local Ceph cluster at a time.

### Check Ceph health

```bash
# Check overall Ceph status
kubectl -n "$NS" exec deploy/rook-ceph-tools -- ceph -s

kubectl -n "$NS" exec deploy/rook-ceph-tools -- ceph status
kubectl -n "$NS" exec deploy/rook-ceph-tools -- ceph health detail
kubectl -n "$NS" exec deploy/rook-ceph-tools -- ceph versions
kubectl -n "$NS" exec deploy/rook-ceph-tools -- ceph osd stat
```

Do not continue unless:

- Health is `HEALTH_OK`.
- All PGs are `active+clean`.
- No PGs or objects are misplaced, degraded, recovering, or backfilling.
- All OSDs are `up` and `in`.

In our ceph environment there may be slow OSDs or other health issues, confirm these will not affect the upgrade before continuing

### 1. Upgrade to the approved Reef patch

Use the approved production image tag. This example uses Reef 18.2.8:

```bash
REEF_IMAGE=quay.io/ceph/ceph:v18.2.8

kubectl -n "$NS" patch cephcluster "$CEPH_CLUSTER" --type merge \
  -p "{\"spec\":{\"cephVersion\":{\"image\":\"$REEF_IMAGE\"}}}"
```

```bash
# Wait until all daemons use the new version and health is HEALTH_OK
kubectl -n "$NS" exec deploy/rook-ceph-tools -- ceph versions
kubectl -n "$NS" exec deploy/rook-ceph-tools -- ceph status

# Update the toolbox image after the Ceph upgrade finishes
kubectl -n "$NS" set image deploy/rook-ceph-tools \
  rook-ceph-tools="$REEF_IMAGE"
kubectl -n "$NS" rollout status deploy/rook-ceph-tools
```

### 2. Upgrade Reef to Squid

Run the health checks again, then use the approved Squid image. This example uses Squid 19.2.4:

```bash
SQUID_IMAGE=quay.io/ceph/ceph:v19.2.4

kubectl -n "$NS" patch cephcluster "$CEPH_CLUSTER" --type merge \
  -p "{\"spec\":{\"cephVersion\":{\"image\":\"$SQUID_IMAGE\"}}}"
```

Mixed Reef and Squid versions are normal while the rollout is running.

```bash
# Watch the rollout
kubectl -n "$NS" exec deploy/rook-ceph-tools -- ceph versions
kubectl -n "$NS" exec deploy/rook-ceph-tools -- ceph status

# Update the toolbox image after the Ceph upgrade finishes
kubectl -n "$NS" set image deploy/rook-ceph-tools \
  rook-ceph-tools="$SQUID_IMAGE"
kubectl -n "$NS" rollout status deploy/rook-ceph-tools
```

```bash
# Final verification
kubectl -n "$NS" exec deploy/rook-ceph-tools -- ceph health
kubectl -n "$NS" exec deploy/rook-ceph-tools -- ceph versions
kubectl -n "$NS" exec deploy/rook-ceph-tools -- ceph pg stat
kubectl -n "$NS" exec deploy/rook-ceph-tools -- ceph osd stat
```

Repeat by changing `NS` to each locally managed cluster: `rook`, `rook-central`, `rook-east`, `rook-haosu`, `rook-pacific`, `rook-south-east`, `rook-tide`, and `rook-ucsd`.

`rook-system` is the shared operator namespace, not a Ceph cluster. Do not patch `rook-fullerton`; it is an external CephCluster.

## Rook operator upgrade

Follow the official Rook upgrade guide for every minor version you cross. Use files from the exact target release, not `master`.

```bash
# Use the approved target Rook version, for example v1.16.9
TARGET_ROOK_VERSION=vX.Y.Z
ROOK_OPERATOR_IMAGE="rook/ceph:$TARGET_ROOK_VERSION"

git clone --single-branch --depth=1 --branch "$TARGET_ROOK_VERSION" \
  https://github.com/rook/rook.git

cd rook/deploy/examples
```

Apply the target-version CRDs and RBAC before changing the operator image.

- Apply `crds.yaml` from `TARGET_ROOK_VERSION` once. CRDs are cluster-wide.
- Use `common.yaml` for the primary Ceph namespace, `rook`.
- Use the target release's [`common-second-cluster.yaml`](https://github.com/rook/rook/blob/v1.16.9/deploy/examples/common-second-cluster.yaml) for each secondary Ceph namespace.

The operator still runs in `rook-system`. These files give that operator the target-version resources and permissions it needs in the Ceph cluster namespaces.

The link above is only an example pinned to v1.16.9. In the commands below, use the file from `TARGET_ROOK_VERSION`.

```bash
export ROOK_OPERATOR_NAMESPACE=rook-system
mkdir -p clusters

sed \
  -e "s/\(.*\):.*# namespace:operator/\1: $ROOK_OPERATOR_NAMESPACE # namespace:operator/g" \
  -e "s/\(.*\):.*# namespace:cluster/\1: rook # namespace:cluster/g" \
  common.yaml > clusters/rook.yaml

for NS in rook-central rook-east rook-haosu rook-pacific rook-south-east rook-tide rook-ucsd; do
  sed \
    -e "s/\(.*\):.*# namespace:operator/\1: $ROOK_OPERATOR_NAMESPACE # namespace:operator/g" \
    -e "s/\(.*\):.*# namespace:cluster/\1: $NS # namespace:cluster/g" \
    common-second-cluster.yaml > "clusters/$NS.yaml"
done

kubectl diff -f crds.yaml -f clusters/
kubectl apply -f crds.yaml -f clusters/
```

Review the diff before applying. Do not add PodSecurityPolicy (PSP) resources; PSP is removed from modern Kubernetes.

```bash
kubectl -n rook-system set image deploy/rook-ceph-operator \
  rook-ceph-operator="$ROOK_OPERATOR_IMAGE"

kubectl -n rook-system rollout status deploy/rook-ceph-operator
```

### Check operator access

The operator runs in `rook-system`, but it must manage CephClusters in other namespaces. Check that namespace-only mode is off:

```bash
kubectl -n rook-system get deploy rook-ceph-operator \
  -o jsonpath='{.spec.template.spec.containers[0].env[?(@.name=="ROOK_CURRENT_NAMESPACE_ONLY")].value}{"\n"}'
```

Expected:

```text
false
```

Check that the operator service account can read CephClusters in every local namespace:

```bash
for NS in rook rook-central rook-east rook-haosu rook-pacific rook-south-east rook-tide rook-ucsd; do
  kubectl auth can-i get cephclusters.ceph.rook.io \
    --as=system:serviceaccount:rook-system:rook-ceph-system \
    -n "$NS"
done
```

Every result should be `yes`. If any result is `no`, regenerate and apply that namespace's target-version `common-second-cluster.yaml`. Do not give `cluster-admin` to the operator, fix the missing namespace RBAC instead.

```bash
kubectl get cephcluster -A \
  -o custom-columns='NAMESPACE:.metadata.namespace,NAME:.metadata.name,EXTERNAL:.spec.external.enable,IMAGE:.spec.cephVersion.image,HEALTH:.status.ceph.health'
```
