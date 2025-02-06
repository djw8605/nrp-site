---
title: Title
description: Description
---


Deploy the KubeRay operator with the [Helm chart repository](https://github.com/ray-project/kuberay-helm) in `ray` namespace. If you don't have `helm` on your local computer, [install helm](https://helm.sh/docs/intro/install/) first.
```bash
helm repo add kuberay https://ray-project.github.io/kuberay-helm/
helm repo update
```
Update the `values.yaml` to overwrite [default settings](https://github.com/ray-project/kuberay/blob/master/helm-chart/kuberay-operator/values.yaml), for example, update the `requests` section:
```json
  requests:
     cpu: 100m
     memory: 512Mi
```
If it's the initial installation, install both CRDs and KubeRay operator.
```bash
helm install kuberay-operator kuberay/kuberay-operator -f values.yaml -n ray
```
If it's an upgrade to the existing installation, run the following command to upgrade:
```bash
helm upgrade --install kuberay-operator kuberay/kuberay-operator -f values.yaml -n ray
```
Confirm that the operator is running:
```bash
kubectl get pods
```
A `kuberay-operator-` pod should be listed like shown below:
```bash
# NAME                                          READY   STATUS    RESTARTS       AGE
# kuberay-operator-5bc8dbcfb-wddp8              1/1     Running   3 (130m ago)   138m
```

To allow other namespaces to create Ray resources, run `kubectl edit clusterrole kubeless-user` and add the below section:
```
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

To clean up KubeRay Operator, uninstall the helm chart:

```bash
# Uninstall the KubeRay operator Helm chart
helm uninstall kuberay-operator
# release "kuberay-operator" uninstalled
```
It might take several seconds for the KubeRay Operator pod to terminate. Confirm that the pods are gone by running:
```bash
kubectl get pods
```