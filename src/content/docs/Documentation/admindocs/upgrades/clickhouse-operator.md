---
title: ClickHouse operator
description: Altinity ClickHouse operator
---

:::caution
Admin documentation. Not relevant for regular users.
:::

A single cluster-wide Altinity ClickHouse operator in the `clickhouse` namespace reconciles every `ClickHouseInstallation` (CHI) in the cluster.

- Helm release `clickhouse-operator`, chart `altinity-clickhouse-operator-0.26.1`
- Watch scope: all namespaces (`namespaces: [.*]`)
- Memory request/limit set to `2Gi` (chart default of 1Gi OOMs on large CHIs)

#### Upgrade

```
helm repo update altinity-clickhouse-operator
helm upgrade clickhouse-operator \
  altinity-clickhouse-operator/altinity-clickhouse-operator \
  --version <NEW_VERSION> --namespace clickhouse --reuse-values
```

Before a major bump, diff the new chart's rendered `users.xml` / `config.xml` against existing CHIs — schema changes happen (e.g. `distributed_ddl_task_timeout` moved from `settings` to `profiles` between 0.21 and 0.26).

#### Don't

- `helm uninstall` — the chart owns the cluster-scoped RBAC that every CHI depends on.
- Deploy a per-namespace operator alongside (tenant charts that set `operator.install: true`, e.g. Altinity all-in-one). Set `operator.install: false`, or scale the bundled operator deployment to 0.

#### Status

```
kubectl get chi -A -o custom-columns=NS:.metadata.namespace,NAME:.metadata.name,STATUS:.status.status,VERSION:.status.chop-version
```

A CHI whose `chop-version` doesn't match the cluster-wide operator is being reconciled by something else (e.g. a leftover bundled operator) or is in an inconsistent state.
