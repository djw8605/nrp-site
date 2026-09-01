---
title: Postgres Cluster
description: "Deploy a PostgreSQL cluster in your namespace with the Zalando Postgres operator."
---

## Using Zalando Postgres Operator in Kubernetes

This guide provides instructions for end users on how to deploy a PostgreSQL cluster using the [Zalando Postgres Operator](https://postgres-operator.readthedocs.io/en/latest/) in a Kubernetes environment.

:::tip[Picking the right database]
Postgres is the right pick for transactional and relational workloads (rows, foreign keys, OLTP). For append-heavy analytic workloads — time-series, event logs, observability data, columnar aggregates over large tables — see [ClickHouse cluster](/documentation/userdocs/running/clickhouse/) instead.
:::

## 1. Deploying a PostgreSQL Cluster

You can deploy your PostgreSQL cluster by creating a `Postgresql` custom resource (CR).

### Example: `postgres-cluster.yaml`

```yaml
apiVersion: 'acid.zalan.do/v1'
kind: 'postgresql'
metadata:
  name: 'my-postgres-cluster'
spec:
  teamId: 'my-team'
  volume:
    size: 10Gi
  numberOfInstances: 3
  users:
    myapp: # database users
      - superuser
      - createdb
  databases:
    mydatabase: myapp # database name: owner
  postgresql:
    version: '14' # Postgres version
  resources:
    requests:
      cpu: '500m'
      memory: '500Mi'
    limits:
      cpu: '1'
      memory: '1Gi'
```

### Apply the Cluster Manifest:

```bash
kubectl apply -n default -f postgres-cluster.yaml
```

**Replace "default" here and later with your actual namespace.**

This command will create a PostgreSQL cluster with the following configuration:

- 3 instances of PostgreSQL
- A database named `mydatabase` owned by `myapp` user
- 10Gi of storage per instance
- Resource requests and limits configured for each instance
- PostgreSQL version 14

## 2. Accessing the PostgreSQL Cluster

Once the cluster is running, you can connect to PostgreSQL using a Kubernetes service that is automatically created by the operator. The service will follow this format:

- **Cluster Service**: `my-postgres-cluster` (default name)
- **Primary Endpoint**: `my-postgres-cluster.default.svc.cluster.local`
- **Replica Endpoints**: `my-postgres-cluster-repl.default.svc.cluster.local`

Get password for user `postgres`:

```bash
kubectl get secret postgres.my-postgres-cluster.credentials.postgresql.acid.zalan.do -o 'jsonpath={.data.password}' | base64 -d
```

You can connect to the primary endpoint like this:

```bash
kubectl run -i --tty --rm debug --image=postgres -- bash
psql -h my-postgres-cluster -U postgres
```

The user for your created database (`mydatabase`) will have a different password stored in `myapp.my-postgres-cluster.credentials.postgresql.acid.zalan.do`.

## 3. Scaling the PostgreSQL Cluster

To scale the cluster, you can modify the `numberOfInstances` field in your `postgres-cluster.yaml` file. For example, to scale to 5 instances:

```yaml
numberOfInstances: 5
```

Apply the changes:

```bash
kubectl apply -f postgres-cluster.yaml
```

The operator will handle scaling up or down the number of PostgreSQL instances automatically.

## 4. Monitoring the Cluster

The Zalando Postgres Operator provides built-in support for monitoring the health and performance of the PostgreSQL cluster. You can check the status of your cluster by running:

```bash
kubectl get postgresql
```

You should see output like:

```bash
NAME                TEAM   VERSION   STATUS    INSTANCES   AGE
my-postgres-cluster my-team 14       Running   3           5m
```

## 4. Choosing the storage for the cluster

Linstor storageClass is preferred as it provides the best performance for postgres. Refer to [linstor storage docs](/documentation/userdocs/storage/linstor/). Example of adding the linstor storage:

```yaml
volume:
  size: 10Gi
  storageClass: linstor-igrok
```

This is how you can manage and deploy a PostgreSQL cluster using the Zalando Postgres Operator in Kubernetes. For more advanced configurations, refer to the [full documentation of the operator](https://postgres-operator.readthedocs.io/en/latest/user/).

---

## Using CloudNativePG in Kubernetes

CloudNativePG (CNPG) is also available for deploying PostgreSQL clusters. Use CNPG when you need PostgreSQL 18 or prefer the CloudNativePG API.

## 1. Deploying a CloudNativePG Cluster

Create a `Cluster` custom resource in your namespace.

### Example: `cnpg-cluster.yaml`

```yaml
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: my-postgres-cluster
spec:
  instances: 3
  imageName: ghcr.io/cloudnative-pg/postgresql:18.4-system-trixie
  bootstrap:
    initdb:
      database: mydatabase
      owner: myapp
  resources:
    requests:
      cpu: '500m'
      memory: '1Gi'
    limits:
      cpu: '2'
      memory: '2Gi'
  storage:
    size: 10Gi
    storageClass: linstor-igrok
```

Apply the manifest:

```bash
kubectl apply -n default -f cnpg-cluster.yaml
```

**Replace "default" here and later with your actual namespace.**

This creates three PostgreSQL 18 instances, a database named `mydatabase` owned by `myapp`, and a 10Gi volume for each instance. Set `instances: 1` for a non-high-availability test deployment.

## 2. Accessing the CloudNativePG Cluster

CNPG creates Kubernetes services and an application credentials secret automatically:

- **Primary endpoint**: `my-postgres-cluster-rw.default.svc.cluster.local`
- **Read-only endpoint**: `my-postgres-cluster-ro.default.svc.cluster.local`
- **Application credentials**: `my-postgres-cluster-app`

Get the password for `myapp`:

```bash
kubectl get secret my-postgres-cluster-app -n default -o 'jsonpath={.data.password}' | base64 -d
```

Connect to the primary endpoint from the same namespace:

```bash
kubectl run -n default -i --tty --rm debug --image=postgres:18 -- bash
psql -h my-postgres-cluster-rw -U myapp -d mydatabase
```

## 3. Scaling and Monitoring the Cluster

Check the cluster status:

```bash
kubectl get clusters.postgresql.cnpg.io -n default
```

To scale the cluster, change the `instances` value in `cnpg-cluster.yaml` and apply the manifest again. CNPG will create or remove instances automatically.

For more advanced configurations, backups, and recovery, refer to the [CloudNativePG documentation](https://cloudnative-pg.io/docs/1.29/).
