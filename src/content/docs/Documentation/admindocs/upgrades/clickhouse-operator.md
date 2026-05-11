---
title: ClickHouse operator
description: Altinity ClickHouse operator
---

:::caution
This page contains administrative documentation intended for cluster administrators and operators. This content may not be relevant for regular users.
:::

#### Architecture

A single cluster-wide Altinity ClickHouse operator is deployed in the `clickhouse` namespace and reconciles `ClickHouseInstallation` (CHI) custom resources in an allowlist of namespaces. The `signoz` namespace runs its own pinned operator (0.21.2) — keep it out of the cluster-wide watch list.

- Helm release: `clickhouse-operator` in namespace `clickhouse`
- Chart: `altinity-clickhouse-operator-0.26.1`
- Current watch list: `[clickhouse, syndb, monitoring]` (rendered into the operator's `config.yaml` ConfigMap)
- Operator image: `altinity/clickhouse-operator:0.26.1` (+ `altinity/metrics-exporter:0.26.1` sidecar)

CRDs are cluster-scoped and shared by both the cluster-wide operator and the per-namespace SigNoz operator:

```
clickhouseinstallations.clickhouse.altinity.com
clickhouseinstallationtemplates.clickhouse.altinity.com
clickhousekeeperinstallations.clickhouse-keeper.altinity.com
clickhouseoperatorconfigurations.clickhouse.altinity.com
```

All four are at `v1`. SigNoz's 0.21.2 and the cluster-wide 0.26.1 both speak `v1`, so the shared CRD is safe.

#### Adding a namespace to the watch list

```
helm upgrade clickhouse-operator \
  altinity-clickhouse-operator/altinity-clickhouse-operator \
  --version 0.26.1 \
  --namespace clickhouse \
  --reuse-values \
  --set 'configs.files.config\.yaml.watch.namespaces={clickhouse,syndb,monitoring,NEW_NS}'
```

The operator pod will roll. Then create the CHI in `NEW_NS` as usual.

To **remove** a namespace from the watch list, do the same upgrade with the namespace omitted. The operator will stop reconciling that namespace's CHIs (existing resources are NOT deleted; they become unmanaged).

#### Upgrading the operator

Instructions: https://github.com/Altinity/clickhouse-operator/tree/master/docs

```
helm repo update altinity-clickhouse-operator
helm upgrade clickhouse-operator \
  altinity-clickhouse-operator/altinity-clickhouse-operator \
  --version <NEW_VERSION> \
  --namespace clickhouse \
  --reuse-values
```

Before bumping a major version, verify the new operator's rendered users.xml / config.xml templates against existing CHIs — schema-breaking changes have happened (e.g., `distributed_ddl_task_timeout` placement).

The chart's helm hook `clickhouse-operator-altinity-clickhouse-operator-crd-install` runs a Job on each upgrade that re-applies the four CRDs. This is idempotent when CRDs match; on major version bumps where the CRD shape changes, the hook will update them and force a re-reconcile of every CHI.

#### Memory sizing

The chart default `1Gi` memory limit is too small for clusters with many tables (the syndb CHI with ~250 tables OOM-killed at 1Gi). Set `2Gi`:

```
--set 'operator.resources.requests.memory=2Gi' \
--set 'operator.resources.limits.memory=2Gi'
```

#### Things NOT to do

- **`helm uninstall`** the cluster-wide operator. The chart owns the cluster-scoped `ClusterRole` and `ClusterRoleBinding` (`clickhouse-operator-altinity-clickhouse-operator`) that every CHI's reconcile depends on. Uninstall deletes them and breaks every namespace at once.
- **Add `signoz` to the watch list.** SigNoz pins its own operator at 0.21.2 (their Helm chart enforces it). Running both 0.21.2 and 0.26.x against the same CHI causes duplicate reconciles and config drift.
- **Helm-installed CHI charts that include `operator.install: true`** (e.g., the Altinity all-in-one chart). They will try to deploy a per-namespace operator that conflicts with the cluster-wide one. Tenants should set `operator.install: false` when using the cluster-wide operator.

#### CHI status reference

```
kubectl get chi -A -o custom-columns=NS:.metadata.namespace,NAME:.metadata.name,STATUS:.status.status,VERSION:.status.chop-version
```

A CHI whose `status.chop-version` does not match the cluster-wide operator's version (0.26.1) is being reconciled by a different operator (likely the SigNoz one) or is in an inconsistent state.
