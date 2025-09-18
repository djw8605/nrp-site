---
title: KubeRay Operator Installation and Management
description: Instructions for installing and managing the KubeRay operator in the Kubernetes cluster.
---

:::caution
This page contains administrative documentation intended for cluster administrators and operators. This content may not be relevant for regular users.
:::




## Deploying the KubeRay Operator

Deploy the KubeRay operator in the `ray` namespace using the [Helm chart repository](https://github.com/ray-project/kuberay-helm). If you don't have `helm` installed, [install Helm](https://helm.sh/docs/intro/install/) first.

```bash
helm repo add kuberay https://ray-project.github.io/kuberay-helm/
helm repo update
```

Update the `values.yaml` to override the [default settings](https://github.com/ray-project/kuberay/blob/master/helm-chart/kuberay-operator/values.yaml). For example, update the `requests` section:

```yaml
requests:
   cpu: 100m
   memory: 512Mi
```

If this is a new installation, install both the CRDs and the KubeRay operator:

```bash
helm install kuberay-operator kuberay/kuberay-operator -f values.yaml -n ray
```

If this is an upgrade to an existing installation, use the following command to upgrade:

```bash
helm upgrade --install kuberay-operator kuberay/kuberay-operator -f values.yaml -n ray
```

To confirm that the operator is running, check the pods:

```bash
kubectl get pods
```

A `kuberay-operator-` pod should appear, as shown below:

```bash
# NAME                                          READY   STATUS    RESTARTS       AGE
# kuberay-operator-5bc8dbcfb-wddp8              1/1     Running   3 (130m ago)   138m
```

## Allow Other Namespaces to Create Ray Resources

To allow other namespaces to create Ray resources, run `kubectl edit clusterrole kubeless-user` and add the following section:

```yaml
- apiGroups:
  - ray.io
  resources:
  - rayjobs
  - rayservices
  - rayclusters
  verbs:
  - list
  - watch
  - get
  - update
  - delete
```

## Cleaning Up KubeRay Operator

To uninstall the KubeRay Operator, run the following command:

```bash
helm uninstall kuberay-operator
# release "kuberay-operator" uninstalled
```

It may take a few seconds for the KubeRay Operator pod to terminate. Confirm that the pods are gone by running:

```bash
kubectl get pods
```
