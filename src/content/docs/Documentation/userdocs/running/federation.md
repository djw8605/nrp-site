---
title: Federation
description: Federation
---

# Establishing cluster federation from your cluster to Nautilus cluster via admiralty

## Before Start

Create a namespace on your cluster with the **same** name as the one on Nautilus. Otherwise, federation wont work.

```bash
kubectl create namespace <the-same-namespace>
```

(optional) set a new context with the new namespace on your cluster.

```bash
kubectl config set-context <context-name> --namespace=<the-same-namespace> \
  --cluster=<your-cluster> \
  --user=<your-user>
```

## On Nautilus Cluster (Target)

First, change the currrent context to use your namespace inside the Nautilus cluster.

#### Create a service account in Nautilus cluster for your cluster to access

```bash
kubectl create serviceaccount my-sa
```

Nautilus cluster will automatically create a secret token associated with the service account you just created.

```bash
kubectl get secret
NAME                              TYPE                                  DATA   AGE
default-token-j29lh               kubernetes.io/service-account-token   3      2y178d
kubernetes-dashboard-key-holder   Opaque                                2      42d
my-sa-token-qfz8b                 kubernetes.io/service-account-token   3      11s
```

#### Create a config file named `config_sa` that includes the token emitted for the service account that you just created

First get the name of the secret:

```bash
TOKENNAME=`kubectl get serviceaccount/my-sa -o jsonpath='{.secrets[0].name}'` 
echo $TOKENNAME
```

Then get the secret using the `TOKENNAME` we found:

```bash
TOKEN=`kubectl get secret $TOKENNAME -o jsonpath='{.data.token}'| base64 --decode` 
echo $TOKEN
```

After that copy the OIDC config file you use to access Nautilus cluster and add the new user instead of the current one. Change `<nautilus-config>` and `<your_cilogon_user_id>` accordingly.

```bash
cd ~
cp .kube/<nautilus-config> .kube/config_sa
kubectl --kubeconfig=.kube/config_sa config set-credentials my-sa --token=$TOKEN
kubectl --kubeconfig=.kube/config_sa config set-context --current --user=my-sa
kubectl --kubeconfig=.kube/config_sa config view
kubectl --kubeconfig=.kube/config_sa config unset users.http://cilogon.org/server<your_cilogon_user_id>
```

Now you need to let the service account act on behalf of user. To do this, change `<your-namespace>` accordingly and run:

```bash
kubectl create rolebinding my-sa-rb --clusterrole=edit --serviceaccount=<your-namespace>:my-sa
```

Now check if you can list pods:

```bash
kubectl --kubeconfig=.kube/config_sa get pods
```

The resulting `config_sa` file looks like:

```yaml
apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: DATA+OMITTED
    server: <nautilus-apiserver>
  name: nautilus
contexts:
- context:
    cluster: nautilus
    namespace: <your-namespace>
    user: my-sa
  name: nautilus
current-context: nautilus
kind: Config
preferences: {}
users:
- name: my-sa
  user:
    token: REDACTED
```

#### Create a `Source` object in the same namespace. Use the same service account name you used in the previous step

```yaml
#source.yaml
apiVersion: multicluster.admiralty.io/v1alpha1
kind: Source
metadata:
  name: my-cluster #name of this source object
spec:
  serviceAccountName: my-sa
```

```bash
kubectl apply -f source.yaml
```

## On Your Cluster (Source)

First, change the currrent context to use your namespace (mine is `default`) inside your cluster.

#### Create the secret holding credentials to access target cluster

Encode the config file you just created in Base64 format and copy the output of the encoded config file.

```bash
cat ~/.kube/config_sa | base64 -w 0
```

Then create a `secret` object and paste the encoded config file into the `config` field.

```yaml
#secret.yaml
apiVersion: v1
data:
  config: <Base64-encoded config file to access the target cluster>
kind: Secret
metadata:
  name: my-secret
type: Opaque
```

```bash
kubectl apply -f secret.yaml
```

#### Create a `Target` object, referencing the secret we just created

```yaml
#target.yaml
apiVersion: multicluster.admiralty.io/v1alpha1
kind: Target
metadata:
  name: nautilus-cluster #name of this target object
spec:
  kubeconfigSecret:
    name: my-secret
```

```bash
kubectl apply -f target.yaml
```

#### Label the namespace as being federated

`kubectl label ns default multicluster-scheduler=enabled`

#### Check if the virual node is up

```bash
kubectl get nodes --watch
NAME                                             STATUS   ROLES                          AGE     VERSION
admiralty-dev-namespace-nautilus-tg-2e2a858480   Ready    cluster,control-plane,master   4d23h
```

#### Try to run a federated pod by adding the annotation

```yaml
#test-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  annotations:
    multicluster.admiralty.io/elect: ""
  name: test-pod
spec:
  containers:
  - name: mypod
    image: centos:centos7
    resources:
      limits:
        memory: 100Mi
        cpu: 100m
      requests:
        memory: 100Mi
        cpu: 100m
    command: ["sh", "-c", "echo 'Im a new pod' && sleep infinity"]
```

```bash
kubectl apply -f test-pod.yaml
```

#### Check if the proxy and delegate pods are running on source and target cluster respectively

```bash
#proxy pod
kubectl --context=<your-cluster-context> get pods
NAME         READY   STATUS    RESTARTS   AGE
test-pod      1/1     Running   0          20m
```

```bash
#delegate pod
kubectl --context=nautilus get pods
NAME               READY   STATUS    RESTARTS   AGE
test-pod-stdhg     1/1     Running   0          15m
```
