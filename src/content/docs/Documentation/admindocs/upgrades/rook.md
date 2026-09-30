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

### Back up the current operator and RBAC

The production layout uses one shared Rook operator in `rook-system` to manage all local Ceph namespaces. Preserve the live operator Deployment because it contains site-specific environment variables, tolerations, affinity, and node placement that are not represented by the stock manifest.

```bash
BACKUP_DIR="rook-operator-upgrade-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

kubectl -n rook-system get deploy rook-ceph-operator -o yaml \
  > "$BACKUP_DIR/rook-ceph-operator.yaml"
kubectl -n rook-system get configmap rook-ceph-operator-config -o yaml \
  > "$BACKUP_DIR/rook-ceph-operator-config.yaml"
kubectl -n rook-system get daemonset \
  csi-rbdplugin csi-cephfsplugin -o yaml \
  > "$BACKUP_DIR/csi-daemonsets.yaml"
kubectl -n rook-system get deployment \
  csi-rbdplugin-provisioner csi-cephfsplugin-provisioner -o yaml \
  > "$BACKUP_DIR/csi-provisioners.yaml"
kubectl get csidriver -o yaml > "$BACKUP_DIR/csidrivers.yaml"
kubectl get storageclass -o yaml > "$BACKUP_DIR/storageclasses.yaml"
kubectl get crd -o yaml > "$BACKUP_DIR/crds.yaml"
kubectl -n rook-system get sa,role,rolebinding -o yaml \
  > "$BACKUP_DIR/rook-system-rbac.yaml"
kubectl get clusterrole,clusterrolebinding -o yaml \
  > "$BACKUP_DIR/cluster-rbac.yaml"

for NS in rook rook-central rook-east rook-haosu rook-pacific rook-south-east rook-tide rook-ucsd; do
  kubectl -n "$NS" get sa,role,rolebinding -o yaml \
    > "$BACKUP_DIR/$NS-rbac.yaml"
  kubectl -n "$NS" get cephcluster -o yaml \
    > "$BACKUP_DIR/$NS-cephcluster.yaml"
done

# Save files from the exact currently installed Rook release as well as the
# live objects. These are needed to restore RBAC and operator configuration.
cp /path/to/current-release/deploy/examples/{crds.yaml,common.yaml,common-second-cluster.yaml} \
  "$BACKUP_DIR/"

(cd "$BACKUP_DIR" && find . -type f ! -name SHA256SUMS -print0 | \
  sort -z | xargs -0 sha256sum > SHA256SUMS)
(cd "$BACKUP_DIR" && sha256sum -c SHA256SUMS)
```

Take a new snapshot before every Rook minor-version step. This is a
control-plane configuration backup, not a Ceph data backup. Do not routinely
downgrade CRDs during rollback; restore the previous operator image and
compatible RBAC/configuration first, then follow the target-version rollback
guidance.

Do not include `rook-fullerton` in ordinary local-cluster RBAC generation. It is an external CephCluster and must follow the external-cluster upgrade procedure.

### Download the exact target release

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

The primary `common.yaml` contains namespace markers in object namespaces, service-account subjects, and CSI driver names. Apply all five substitutions from the official alternate-namespace procedure. Replacing only the two `namespace:` markers can leave RBAC subjects or CSI driver names pointing at the default namespace.

```bash
export ROOK_OPERATOR_NAMESPACE=rook-system
export ROOK_CLUSTER_NAMESPACE=rook
mkdir -p clusters

sed \
  -e "s/\(.*\):.*# namespace:operator/\1: $ROOK_OPERATOR_NAMESPACE # namespace:operator/g" \
  -e "s/\(.*\):.*# namespace:cluster/\1: $ROOK_CLUSTER_NAMESPACE # namespace:cluster/g" \
  -e "s/\(.*serviceaccount\):.*:\(.*\) # serviceaccount:namespace:operator/\1:$ROOK_OPERATOR_NAMESPACE:\2 # serviceaccount:namespace:operator/g" \
  -e "s/\(.*serviceaccount\):.*:\(.*\) # serviceaccount:namespace:cluster/\1:$ROOK_CLUSTER_NAMESPACE:\2 # serviceaccount:namespace:cluster/g" \
  -e "s/\(.*\): [-_A-Za-z0-9]*\.\(.*\) # driver:namespace:cluster/\1: $ROOK_CLUSTER_NAMESPACE.\2 # driver:namespace:cluster/g" \
  common.yaml > clusters/rook.yaml

for NS in rook-central rook-east rook-haosu rook-pacific rook-south-east rook-tide rook-ucsd; do
  sed \
    -e "s/\(.*\):.*# namespace:operator/\1: $ROOK_OPERATOR_NAMESPACE # namespace:operator/g" \
    -e "s/\(.*\):.*# namespace:cluster/\1: $NS # namespace:cluster/g" \
    common-second-cluster.yaml > "clusters/$NS.yaml"
done

# Inspect every namespace-sensitive marker before applying.
grep -nE 'namespace:operator|namespace:cluster|serviceaccount:namespace|driver:namespace' \
  common.yaml common-second-cluster.yaml

grep -nE 'namespace:|system:serviceaccount:|driverName:' clusters/rook.yaml
grep -nE 'namespace:|system:serviceaccount:' clusters/rook-central.yaml

kubectl diff -f crds.yaml -f clusters/
kubectl apply -f crds.yaml -f clusters/
```

Review the diff before applying. `common-second-cluster.yaml` creates the namespace-scoped RBAC needed by the shared operator; it assumes the primary `common.yaml` resources already exist.

:::danger[Do not overwrite shared multi-cluster bindings]
`common-second-cluster.yaml` can contain fixed-name cluster-scoped bindings and
a fixed-name RoleBinding in `rook-system`. Applying one independently rendered
copy per namespace makes the last file overwrite subjects installed by earlier
files.

Remove duplicate shared bindings from the secondary files and keep one
consolidated copy containing service-account subjects for all eight local
clusters. In particular, verify the subjects in `rook-ceph-mgr-cluster`,
`rook-ceph-osd`, and `rook-system/rook-ceph-mgr-system`. Preserve any existing
rules that are not present in the new release, such as access to `nodes/proxy`,
unless the release notes explicitly require their removal. Never add a
`rook-fullerton` subject to ordinary local-cluster bindings.
:::

Do not add PodSecurityPolicy (PSP) resources; PSP is removed from modern Kubernetes. Old `*-psp` RoleBindings or ClusterRoleBindings that reference a missing `psp:rook` ClusterRole are legacy residue, not a reason to recreate that ClusterRole. Audit and remove those stale bindings separately from the upgrade after confirming they are unused.

### Update the operator without overwriting site configuration

Do not blindly apply the stock `operator.yaml` to production. It can overwrite the customized operator environment, tolerations, affinity, security context, and node selector. Apply the target CRDs and RBAC, review the target operator manifest for required changes, and then change only the operator image unless the target-version upgrade guide explicitly requires another field.

Check for pinned CSI image variables before changing the operator image. `kubectl set image` only changes the operator container image.

```bash
kubectl -n rook-system get deploy rook-ceph-operator \
  -o jsonpath='{range .spec.template.spec.containers[0].env[*]}{.name}={.value}{"\n"}{end}' \
  | grep -i csi
```

If any CSI image is pinned to a version that is not compatible with the target Rook release, update the operator Deployment before or immediately after the operator image change.

For Rook v1.18 and v1.19, decide CSI ownership before changing the image. The
operator defaults `ROOK_USE_CSI_OPERATOR` to `true` if the setting is absent.
If a separate Ceph CSI operator is not already installed and ready, make the
working built-in mode explicit:

```bash
kubectl -n rook-system apply -f - <<'EOF'
apiVersion: v1
kind: ConfigMap
metadata:
  name: rook-ceph-operator-config
  namespace: rook-system
data:
  ROOK_USE_CSI_OPERATOR: "false"
  ROOK_CSI_DISABLE_DRIVER: "false"
EOF
```

`ROOK_USE_CSI_OPERATOR: "false"` does not disable CSI. It tells Rook to keep
directly managing the RBD and CephFS DaemonSets and provisioners. Without this
setting, Rook can remove those workloads while expecting a separately installed
CSI operator to recreate them. New mounts then fail because the driver is not
present in the kubelet's list of registered CSI drivers.

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

Check that the operator service account can perform its normal reconciliation operations in every local namespace:

```bash
for NS in rook rook-central rook-east rook-haosu rook-pacific rook-south-east rook-tide rook-ucsd; do
  echo "== $NS =="
  kubectl auth can-i get cephclusters.ceph.rook.io \
    --as=system:serviceaccount:rook-system:rook-ceph-system \
    -n "$NS"
  kubectl auth can-i update cephclusters.ceph.rook.io/status \
    --as=system:serviceaccount:rook-system:rook-ceph-system \
    -n "$NS"
  kubectl auth can-i create deployments.apps \
    --as=system:serviceaccount:rook-system:rook-ceph-system \
    -n "$NS"
  kubectl auth can-i create jobs.batch \
    --as=system:serviceaccount:rook-system:rook-ceph-system \
    -n "$NS"
  kubectl auth can-i create services \
    --as=system:serviceaccount:rook-system:rook-ceph-system \
    -n "$NS"
  kubectl auth can-i create secrets \
    --as=system:serviceaccount:rook-system:rook-ceph-system \
    -n "$NS"
  kubectl auth can-i create configmaps \
    --as=system:serviceaccount:rook-system:rook-ceph-system \
    -n "$NS"
done

kubectl auth can-i get nodes/proxy \
  --as=system:serviceaccount:rook-system:rook-ceph-system \
  --all-namespaces
```

Every result should be `yes`. If any result is `no`, regenerate and apply that namespace's target-version `common-second-cluster.yaml`. Do not give `cluster-admin` to the operator; fix the missing namespace RBAC instead.

```bash
kubectl get cephcluster -A \
  -o custom-columns='NAMESPACE:.metadata.namespace,NAME:.metadata.name,EXTERNAL:.spec.external.enable,IMAGE:.spec.cephVersion.image,HEALTH:.status.ceph.health'
```

After the operator starts, it reconciles CephClusters one at a time. If one namespace is stuck, the others can wait behind it. Watch the operator logs if any cluster does not return to `HEALTH_OK`:

```bash
kubectl -n rook-system logs deploy/rook-ceph-operator -f | grep -E "ERROR|WARN|reconcile"
```

After each operator minor version, verify the operator rollout, inspect its logs, and confirm every local CephCluster is still `Ready` before proceeding to the next minor version.

Also confirm CSI ownership and mounts after every step:

```bash
kubectl -n rook-system get configmap rook-ceph-operator-config -o yaml
kubectl -n rook-system get daemonset csi-rbdplugin csi-cephfsplugin
kubectl -n rook-system get deployment \
  csi-rbdplugin-provisioner csi-cephfsplugin-provisioner
kubectl get csidriver
```

Record the CSI DaemonSet UIDs before the upgrade. In built-in mode they may roll
their pods and update Ceph-CSI images, but the DaemonSet objects must not enter
deletion. Test both an existing mounted workload and a newly provisioned PVC by
mounting it in a pod, writing a file, reading it back, and deleting the test
resources. A Bound PVC proves provisioning, but only a successful pod test
proves node registration, attachment, and mounting.

Before upgrading to Rook v1.19, inspect every local CephCluster's CephX policy:

```bash
kubectl get cephcluster -A \
  -o jsonpath='{range .items[*]}{.metadata.namespace}{"\t"}{.spec.security.cephx}{"\n"}{end}'
```

Do not enable key rotation or increment `keyGeneration` during the operator
upgrade. Leaving `spec.security.cephx.allowedCiphers` unset in Rook v1.19 allows
both `aes` and `aes256k`, preserving existing keys. Plan cipher and key rotation
as a separate change after all clients and peers have been checked.

### Planned Ceph CSI operator migration

In built-in mode, the CSI DaemonSets and provisioners are not manually managed:
the Rook operator generates and continuously reconciles them. A migration moves
that ownership from the Rook operator to the separate Ceph CSI operator.

Do not combine a CSI ownership migration with an ordinary Rook minor-version
upgrade. Keep built-in CSI management through a stable Rook v1.19 checkpoint,
then schedule a separate maintenance window. Follow the exact target-release
operator and CSI migration guides; if targeting Rook v1.20, upgrade to at least
Rook v1.19.5 first.

At a high level:

1. Keep `ROOK_USE_CSI_OPERATOR: "false"` while installing the exact
   release-matched CSI operator CRDs, RBAC, and controller.
2. Wait for the CSI operator controller to become healthy without changing
   ownership.
3. Preserve the existing driver names, operator namespace, provisioner
   affinity, tolerations, snapshot settings, host-network settings, and any
   pinned images.
4. Record CSI DaemonSet UIDs, ready counts, provisioner status, CSIDriver
   objects, and working PVC mounts.
5. Set `ROOK_USE_CSI_OPERATOR: "true"` while leaving
   `ROOK_CSI_DISABLE_DRIVER: "false"`, then monitor the handoff continuously.
6. Require both CSI provisioners, both node-plugin DaemonSets, existing mounts,
   and new RBD and CephFS mount tests to pass before completing the window.

The ownership handoff can temporarily interrupt new provisioning, attachment,
or mounts even when already-mounted filesystems remain usable. Do not manually
delete CSI DaemonSets, pods, finalizers, or VolumeAttachments merely because a
handoff is slow. First establish which controller owns each resource and inspect
node-plugin registration and active attachments.

Before upgrading to v1.20, install or verify the target CSI CRDs and save the generated CSI resources if they exist:

```bash
kubectl -n rook-system get drivers.csi.ceph.io -o yaml \
  > preupgrade-drivers.yaml
kubectl -n rook-system get operatorconfigs.csi.ceph.io -o yaml \
  > preupgrade-opconfig.yaml
```

On versions before the CSI operator is installed, `kubectl` may report that these resource types do not exist. That is expected, but do not proceed to v1.20 until the target guide's CSI installation and migration steps have been prepared.

Preserve the current CSI settings from the live Rook operator Deployment, including provisioner affinity and CSI tolerations. Do not fully apply a stock v1.20 `operator.yaml` later without first transferring those settings to the ceph-csi-operator configuration; stock defaults can overwrite site-specific values.

If the migration fails, set `ROOK_USE_CSI_OPERATOR: "false"`, restart the Rook
operator, and verify that it recreates and registers the built-in CSI workloads.
Confirm the old driver names and mount tests before removing any CSI-operator
resources.
