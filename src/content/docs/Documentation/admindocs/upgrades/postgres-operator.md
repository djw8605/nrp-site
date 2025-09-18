---
title: Postgres operator
description: Zalando Postgres operator
---

:::caution
This page contains administrative documentation intended for cluster administrators and operators. This content may not be relevant for regular users.
:::




#### Upgrading Zalando Postgres operator

Instructions: https://postgres-operator.readthedocs.io/en/latest/administrator/#upgrading-the-operator

```
kubectl apply -f https://raw.githubusercontent.com/zalando/postgres-operator/v1.9.0/charts/postgres-operator/crds/operatorconfigurations.yaml
kubectl apply -f https://raw.githubusercontent.com/zalando/postgres-operator/v1.9.0/charts/postgres-operator/crds/postgresqls.yaml
kubectl apply -f https://raw.githubusercontent.com/zalando/postgres-operator/v1.9.0/charts/postgres-operator/crds/postgresteams.yaml
```

```
helm upgrade -n postgres-operator postgres-operator postgres-operator-charts/postgres-operator
```
