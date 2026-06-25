---
title: Rook/Ceph Upgrades
description: Rook and Ceph upgrade procedures
---

:::caution
Upgrade one Ceph cluster at a time. Do not continue until the cluster is healthy and the upgrade is complete. The operator runs in `rook-system`. Local CephCluster names normally match their namespaces.
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

### Production compatibility matrix

Use the exact target-version docs before each step. For Nautilus on Kubernetes 1.33.8:

| Rook version | Kubernetes 1.33 supported | Ceph versions in official docs | Use in this plan |
| --- | --- | --- | --- |
| v1.16 | No; docs list Kubernetes v1.27-v1.32 | Reef and Squid | Current operator version only. Do not use for Tentacle. |
| v1.17 | Yes; docs list Kubernetes v1.28-v1.33 | Reef and Squid | Intermediate operator step only. |
| v1.18 | Yes; docs list Kubernetes v1.29-v1.34 | Reef, Squid, and Tentacle | First version line that supports Tentacle. |
| v1.19 | Yes; docs list Kubernetes v1.30-v1.35 | Squid and Tentacle | Preferred minimum line before Tentacle. |
| v1.20 | Yes; docs list Kubernetes v1.31-v1.36 | Squid and Tentacle | Latest checked line for Kubernetes 1.33.8; includes CSI migration changes. |

Do not attempt the Tentacle upgrade while the operator is still on v1.16.9. Upgrade the operator through each minor release first. If targeting v1.20, upgrade to at least v1.19.5 before v1.20, then follow the v1.20 CSI migration steps.

Official references used for this matrix:

- [Rook v1.17 prerequisites](https://rook.io/docs/rook/v1.17/Getting-Started/Prerequisites/prerequisites/) and [Ceph upgrade docs](https://rook.io/docs/rook/v1.17/Upgrade/ceph-upgrade/)
- [Rook v1.18 prerequisites](https://rook.io/docs/rook/v1.18/Getting-Started/Prerequisites/prerequisites/) and [Ceph upgrade docs](https://rook.io/docs/rook/v1.18/Upgrade/ceph-upgrade/)
- [Rook v1.19 prerequisites](https://rook.io/docs/rook/v1.19/Getting-Started/Prerequisites/prerequisites/) and [Ceph upgrade docs](https://rook.io/docs/rook/v1.19/Upgrade/ceph-upgrade/)
- [Rook v1.20 prerequisites](https://rook.io/docs/rook/v1.20/Getting-Started/Prerequisites/prerequisites/), [Ceph upgrade docs](https://rook.io/docs/rook/v1.20/Upgrade/ceph-upgrade/), and [operator upgrade docs](https://rook.io/docs/rook/v1.20/Upgrade/rook-upgrade/)

## Production upgrade order

For the Nautilus production cluster, use this order:

1. Upgrade each local Ceph cluster to the approved Squid image, one cluster at a time.
2. Upgrade the Rook operator one minor release at a time: v1.16.9 → v1.17 → v1.18 → v1.19.5+ → v1.20.x, or stop at the newest approved release that supports Kubernetes 1.33.8.
3. After the operator is on a release that supports Tentacle, plan the Squid to Tentacle Ceph upgrade.

Do not use Rook v1.16 as the final operator target for Kubernetes 1.33.8. Check the exact target Rook docs before each operator step.

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

Some clusters may have slow OSDs or other `HEALTH_WARN` items. Confirm those warnings are understood and safe before continuing.

### 1. Upgrade to the approved Reef patch

Use the exact approved production image tag. Date-suffixed tags are preferred in production. This example uses Reef 18.2.8:

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

Run the health checks again, then use the approved Squid image. Date-suffixed tags are preferred in production. This example uses Squid 19.2.4:

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

## Ceph upgrade: Squid to Tentacle

Do this only after all local Ceph clusters are on Squid and the Rook operator has been upgraded to a release that supports Tentacle.

Use the official target-version Rook and Ceph docs and an approved Tentacle image. Avoid Ceph Tentacle 20.2.0; use an approved 20.2.2 or newer production image tag.

Follow the same per-cluster pattern:

1. Set `NS` to one local Ceph namespace.
2. Verify `HEALTH_OK`, `active+clean` PGs, and all OSDs `up` and `in`.
3. Patch only that CephCluster to the approved Tentacle image.
4. Watch `ceph status` and `ceph versions`.
5. Update that namespace's toolbox image after the Ceph upgrade finishes.
6. Repeat for the next local Ceph namespace.

## Rook operator upgrade

Follow the official Rook upgrade guide for every minor version you cross. Use files from the exact target release, not `master`.

For Kubernetes 1.33.8, choose a target Rook release whose official prerequisites list Kubernetes 1.33 as supported. Newer Rook releases may also include extra upgrade steps, such as CSI migration; follow the target-version guide exactly. Rook v1.20 moves CSI management to the ceph-csi-operator, so do not treat it as a simple image-only upgrade.

Before changing the operator, confirm every local Ceph cluster is healthy:

```bash
kubectl get cephcluster -A \
  -o custom-columns='NAMESPACE:.metadata.namespace,NAME:.metadata.name,EXTERNAL:.spec.external.enable,IMAGE:.spec.cephVersion.image,HEALTH:.status.ceph.health'
```

```bash
# Use the approved target Rook version, for example v1.16.9
TARGET_ROOK_VERSION=vX.Y.Z
ROOK_OPERATOR_IMAGE="docker.io/rook/ceph:$TARGET_ROOK_VERSION"

git clone --single-branch --depth=1 --branch "$TARGET_ROOK_VERSION" \
  https://github.com/rook/rook.git

cd rook/deploy/examples
```

Apply the target-version CRDs and RBAC before changing the operator image.

- Apply `crds.yaml` from `TARGET_ROOK_VERSION` once. CRDs are cluster-wide.
- Use `common.yaml` for the primary Ceph namespace, `rook`.
- Use the target release's [`common-second-cluster.yaml`](https://github.com/rook/rook/blob/v1.16.9/deploy/examples/common-second-cluster.yaml) for each secondary Ceph namespace.

The operator still runs in `rook-system`. These files give that operator the target-version resources and permissions it needs in the Ceph cluster namespaces.

Do not generate ordinary secondary-cluster RBAC for `rook-fullerton`; it is an external CephCluster.

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

grep "namespace:" clusters/rook.yaml | head -5
grep "namespace:" clusters/rook-central.yaml | head -5

kubectl diff -f crds.yaml -f clusters/
kubectl apply -f crds.yaml -f clusters/
```

Review the diff before applying. Do not add PodSecurityPolicy (PSP) resources; PSP is removed from modern Kubernetes.

Check for pinned CSI image variables before changing the operator image. `kubectl set image` only changes the operator container image.

```bash
kubectl -n rook-system get deploy rook-ceph-operator \
  -o jsonpath='{range .spec.template.spec.containers[0].env[*]}{.name}={.value}{"\n"}{end}' \
  | grep -i csi
```

If any CSI image is pinned to a version that is not compatible with the target Rook release, update the operator Deployment before or immediately after the operator image change.

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
  echo -n "$NS: "
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

After the operator starts, it reconciles CephClusters one at a time. If one namespace is stuck, the others can wait behind it. Watch the operator logs if any cluster does not return to `HEALTH_OK`:

```bash
kubectl -n rook-system logs deploy/rook-ceph-operator -f | grep -E "ERROR|WARN|reconcile"
```
