---
title: SENSE/Multus
description: SENSE/Multus
---

# SENSE/Multus L2 Path Provisioning Guide

Follow these steps to provision an L2 path using SENSE and Multus.

---

## Step 1: Verify SENSE Path
Ensure a plumbed SENSE path exists between the source and destination (e.g., two NRP nodes or an NRP node and FABRIC Facility Port).
Contact Nautilus Support on Matrix if needed.

---

## Step 2: Configure the Node
On the relevant node, execute these commands, replacing placeholders with actual values:

```bash
# Add a MACVLAN interface
sudo ip link add link <interface> name <macvlan> type macvlan mode bridge

# Assign an IPv6 address
sudo ip -6 addr add <ipv6-address>/<prefix-length> dev <macvlan>

# Set the interface up
sudo ip link set up <macvlan>
```

---

## Step 3: Create a Multus NetworkAttachmentDefinition

Define a Multus `NetworkAttachmentDefinition` using the MACVLAN interface.
Save the following YAML as `network.yaml`:

```yaml
apiVersion: "k8s.cni.cncf.io/v1"
kind: NetworkAttachmentDefinition
metadata:
  name: macvlan-network
  namespace: <namespace>
spec:
  config: '{
    "cniVersion": "0.3.1",
    "type": "macvlan",
    "master": "<interface>",
    "mode": "bridge",
    "ipam": {
      "type": "static",
      "addresses": [
        {
          "address": "<ipv6-address>/<prefix-length>",
          "gateway": "<gateway-ip>"
        }
      ]
    }
  }'
```

Apply it:
```bash
kubectl apply -f network.yaml
```

---

## Step 4: Create a Pod

Deploy a pod using the network. Save the following YAML as `pod.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: macvlan-pod
  namespace: <namespace>
  annotations:
    k8s.v1.cni.cncf.io/networks: macvlan-network
spec:
  containers:
  - name: test-container
    image: alpine
    command: ["sh", "-c", "sleep 3600"]
    resources:
      limits:
        memory: "256Mi"
        cpu: "500m"
      requests:
        memory: "128Mi"
        cpu: "250m"
```

Apply it:
```bash
kubectl apply -f pod.yaml
```

---

## Step 5: Verify Connectivity
1. Exec into the pod:
   ```bash
   kubectl exec -it macvlan-pod -n <namespace> -- sh
   ```
2. Test connectivity using `ping6` or other tools.
