---
title: Install an InterLink Virtual Node
description: Install an InterLink virtual node for a participating Slurm site
---

:::caution
This page is for NRP Kubernetes administrators. Complete the site-side steps first.
:::

## 1. Create the tunnel endpoint

Choose these values and send the hostname and generated credential to the site administrator:

```bash
NAMESPACE=<namespace>
SITE=<site-name>
TUNNEL_HOST="${SITE}-interlink-tunnel.nrp-nautilus.io"
CREDENTIAL_FILE="${SITE}-tunnel-path-prefix"
umask 077
openssl rand -hex 32 > "$CREDENTIAL_FILE"
```

Store the credential:

```bash
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
kubectl create secret generic "${SITE}-plugin-wstunnel" \
  --namespace "$NAMESPACE" \
  --from-file=path-prefix="$CREDENTIAL_FILE"
```

Transfer `$CREDENTIAL_FILE` to the site administrator through an approved private channel. Do not paste it into a ticket or public chat. The site installs this exact file as `$HOME/.config/interlink/tunnel-path-prefix`.

Deploy an NRP-approved wstunnel server, `ClusterIP` Service, and HAProxy Ingress using:

- the Secret `${SITE}-plugin-wstunnel` and key `path-prefix`;
- WebSocket listener port `8080`;
- reverse plugin port `4001`; and
- TLS hostname `${SITE}-interlink-tunnel.nrp-nautilus.io`.

The Service must expose port `4001` internally. Do not expose the plugin port through the Ingress.

## 2. Create Helm values

```bash
helm repo add interlink https://interlink-hq.github.io/interlink-helm-chart/
helm repo update interlink
helm show values interlink/interlink --version 0.6.1
```

Create `values.yaml` and replace every value inside angle brackets:

```yaml
nodeName: <site>-interlink

interlink:
  image: ghcr.io/interlink-hq/interlink/interlink:0.6.1
  enabled: true
  address: http://127.0.0.1
  port: 4000
  socket: unix:///var/run/interlink.sock
  exportPodData: true
  dataRootVolume: interlink-data
  pluginEndpoint:
    url: http://<site>-plugin-wstunnel
    port: "4001"

virtualNode:
  image: ghcr.io/interlink-hq/interlink/virtual-kubelet-inttw:0.6.1
  disableCSR: true
  containerResources:
    CPU:
      request: 250m
      limit: "1"
    memory:
      request: 2Gi
      limit: 8Gi
  resources:
    CPUs: <advertised-cpus>
    memGiB: <advertised-memory-gib>
    pods: <maximum-concurrent-jobs>
    accelerators:
      - resourceType: nvidia.com/gpu
        model: <gpu-model>
        available: <advertised-gpus>
  nodeLabels:
    - interlink.hq/backend=slurm
    - interlink.hq/site=<site>
  nodeTaints:
    - key: virtual-node.interlink/workload
      value: <site>
      effect: NoExecute

plugin:
  enabled: false

extraVolumes:
  - name: interlink-data
    emptyDir: {}
```

The advertised values control Kubernetes scheduling only. Slurm still controls physical allocation and queueing. Change capacity through Helm values, not by patching the Node.

## 3. Install the chart

Render and review it first:

```bash
helm template <release> interlink/interlink \
  --namespace <namespace> \
  --version 0.6.1 \
  --values values.yaml \
  --no-hooks > rendered.yaml
```

Install it:

```bash
helm upgrade --install <release> interlink/interlink \
  --namespace <namespace> \
  --create-namespace \
  --version 0.6.1 \
  --values values.yaml \
  --atomic \
  --timeout 10m
```

## 4. Check the node

After the site plugin and tunnel are running:

```bash
kubectl get pods -n <namespace>
kubectl get node <site>-interlink
kubectl describe node <site>-interlink
```

The node must report `Ready=True`. A `503` means the InterLink API cannot reach the site plugin. Check the site plugin, tunnel client, wstunnel server, Service, hostname, and credential.

## 5. Submit a GPU test

Save this as `gpu-check.yaml` and use the flavor name supplied by the site:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: interlink-gpu-check
  namespace: <user-namespace>
  annotations:
    slurm-job.vk.io/flavor: gpu
spec:
  automountServiceAccountToken: false
  nodeSelector:
    kubernetes.io/hostname: <site>-interlink
  tolerations:
    - key: virtual-node.interlink/no-schedule
      operator: Exists
      effect: NoSchedule
    - key: virtual-node.interlink/workload
      operator: Equal
      value: <site>
      effect: NoExecute
  restartPolicy: Never
  containers:
    - name: gpu-check
      image: docker.io/nvidia/cuda:12.8.1-base-ubuntu24.04
      command: ["/bin/bash", "-lc"]
      args:
        - nvidia-smi --query-gpu=name,memory.total,compute_cap --format=csv,noheader
      resources:
        requests:
          cpu: "1"
          memory: 1Gi
          nvidia.com/gpu: "1"
        limits:
          cpu: "1"
          memory: 1Gi
          nvidia.com/gpu: "1"
```

```bash
kubectl apply -f gpu-check.yaml
kubectl get pod -n <user-namespace> interlink-gpu-check -w
kubectl logs -n <user-namespace> -f interlink-gpu-check
```

The logs must show a Slurm job ID, the expected GPU, and exit code zero. Ask the site administrator to verify the same job with `scontrol` or `sacct`.
