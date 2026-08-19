---
title: Postgres operators
description: Zalando and CloudNativePG operators
---

## Upgrading Zalando Postgres operator

Instructions: https://postgres-operator.readthedocs.io/en/latest/administrator/#upgrading-the-operator

```
kubectl apply -f https://raw.githubusercontent.com/zalando/postgres-operator/v1.9.0/charts/postgres-operator/crds/operatorconfigurations.yaml
kubectl apply -f https://raw.githubusercontent.com/zalando/postgres-operator/v1.9.0/charts/postgres-operator/crds/postgresqls.yaml
kubectl apply -f https://raw.githubusercontent.com/zalando/postgres-operator/v1.9.0/charts/postgres-operator/crds/postgresteams.yaml
```

```
helm upgrade -n postgres-operator postgres-operator postgres-operator-charts/postgres-operator
```

## Upgrading CloudNativePG

Instructions: https://cloudnative-pg.io/docs/1.29/installation_upgrade/

Download the target static manifest and replace `cnpg-system` with `cnpg-operator`.

```bash
kubectl apply --server-side --dry-run=server -f cnpg-nrp.yaml
kubectl apply --server-side -f cnpg-nrp.yaml
kubectl rollout status deployment/cnpg-controller-manager -n cnpg-operator
```

Upgrading the operator can roll CNPG database pods. Zalando-managed clusters are not affected.

After upgrading, make sure the operator is not being OOM-killed. The current `manager` requests are `500m` CPU/`2Gi` memory, with limits of `3` CPU/`6Gi` memory.
