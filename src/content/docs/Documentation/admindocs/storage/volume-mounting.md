---
title: Volume Mounting Troubleshooting
description: Volume Mounting Troubleshooting
---

:::caution
This page contains administrative documentation intended for cluster administrators and operators. This content may not be relevant for regular users.
:::




This article describes how to resolve pods that are in status of `ContainerCreating`, and command `kubectl describe pod <pod-name>` indicates volume mounting failures in the events.

## Mount failed for "PVC already exists"

The error message is similar to 

```
Warning  FailedMount  2m9s (x238 over 7h52m)  kubelet  MountVolume.MountDevice failed for volume "pvc-2f77910e-068f-488c-9e5e-929f88564a76" : rpc error: code = Aborted desc = an operation with the given Volume ID 0001-000c-rook-central-0000000000000001-580865e7-8ef0-4eca-aecb-829f9712f4ee already exists
```

This type of failure is caused by networking issues. Here are some work arounds to fix the issue:

1.  Restart the `kube-proxy` pod, and the `csi-cephfsplugin` pod or `csi-rbdplugin` pod on the node.

Examine the log of the `kube-proxy` pod, if there are repeating errors connecting to the API server at https://67.58.53.148:443:

```
E0403 10:47:08.012312       1 reflector.go:147] k8s.io/client-go@v0.0.0/tools/cache/reflector.go:229: Failed to watch *v1.Node: failed to list *v1.Node: Get "https://67.58.53.148:443/api/v1/nodes?fieldSelector=metadata.name%3Dhcc-nrp-shor-c5934.unl.edu&resourceVersion=9989991954": dial tcp 67.58.53.148:443: connect: no route to host

```
Delete the `kube-proxy` pod and wait for it to restart. 

Then delete the `csi-*plugin` pod depending on the StorageClass of the volume. If it's a `cephfs` storage, delete the `csi-cephfsplugin` pod. If it's a 
Get the volume's StorageClass by command `kubectl describe pv`, e.g.:

```
kubectl describe pv/pvc-f67277a5-dd6e-4150-9937-aac1b88b8bf9 | grep -E "pool|imageName|StorageClass"
StorageClass:    rook-ceph-block
imageName=csi-vol-e96cf3ee-f25b-4282-847c-1d8e307c23be7
pool=rbd
```
In the above example, its a ceph block storage, so delete the `csi-rbdplugin` pod. If it's a cephfs storage, delete the `csi-cephfsplugin` pod. Monitor the pods to start.

2. Delete the `volumeattachment` and restart the `csi-cephfsplugin` or `csi-cephfsplugin` pod.

Run command `kubectl get volumeattachment | grep <PVC-name>` to get the `volumeattachment` of the volume, and then run `kubectl delete volumeattachment csi-xxx` to delete the volumeattachment. After this, delete the `csi-cephfsplugin` or `csi-cephfsplugin` pod depending on the StorageClass and wait for the volume to mount.

## Multi-Attach error

Multi-attach error only applies to block volume, since they are not allowed to be attached to multiple pods. The error message looks like:
``` 
[Warning] Multi-Attach error for volume "pvc-24d9f8f7-82ac-411c-9f2b-25ee93e7259e" Volume is already exclusively attached to one node and can't be attached to another.
```
First, examine if it is really attached to a running pod. If there is no running pod that mounts this volume, find the where the volume is attached to, and apply the steps in as the "PVC already exists" case. the command to find the attachment is `kubectl get volumeattachment | grep <PVC-name>` and the node should be listed there.

There is a chance that the pod still could not mount the volume with the same multi-attach error, but `kubectl get volumeattachment | grep <PVC-name>` could not find the attachment anymore. In this case reboot the node with the attachment previously.

If and only if, there's a stale or orphaned Ceph RBD lock that was not properly released:

⚠️ **Make sure you follow the steps carefully to not damage data or filesystem.**

#### 1. Check for RBD Lock

Obtain the `pool` and `imageName` from the PersistentVolumeClaim:

```
kubectl describe pv/pvc-f67277a5-dd6e-4150-9937-aac1b88b8bf9 | grep -E "pool|imageName|StorageClass"
StorageClass:    rook-ceph-block
imageName=csi-vol-e96cf3ee-f25b-4282-847c-1d8e307c23be7
pool=rbd
```

Then, open a shell into the Ceph tools pod:

```sh
kubectl -n rook exec -it deploy/rook-ceph-tools -- bash
rbd lock list <pool-name>/csi-vol-<uuid>
```

Example output:

```
There is 1 exclusive lock on this image.
Locker            ID                     Address
client.<id>       auto <lock-id>         <ip>:0/<session-id>
```

#### 2. Identify the Node by IP

Use NetBox or node inventory system to find which node matches the IP address from the lock entry. Then:

- Confirm that **no nodes** are using the volume.

#### 3. Reboot The Node

⚠️ **Only reboot the node after verifying it has been drained and no user pods are running on it..**

### 4. Retry Pod or PVC

Once the node is back up and untainted, try the PVC with a test pod to verify it's ready for use.

---

## "Permission denied" error

The error message is similar to:
```
 MountVolume.SetUp failed for volume "pvc-5b0a3f01-7914-45c3-913b-28a49fe3336f" : rpc error: code = Internal desc = stat /var/lib/kubelet/plugins/kubernetes.io/csi/rook-system.ceph fs.csi.ceph.com/e34a4060e2564977fbf8af9a8e7fde65500d9c79898a1739854084c48ade1c6f/globalmount: permission denied
```
If this happens, reboot the node.

## Errors in ceph clusters

If the above steps didn't get the volume issues fixed, check the status of the ceph cluster. For example, get into the shell of the `ceph-tools` pod of the corresponding ceph cluster, and run `ceph -s` command to check the status. If there are errors regarding `mds` or `mgr` services, restart the corresponding pods.

## StorageClass and accessModes mismatch

User configuration error is another reason for volumes fail to mount. StorageClass `cephfs` allows multiple pods to attach the same volume, so the accessModes should be `ReadWriteMany`. StorageClass `ceph-block` is block storage and can only be attached to a single pod, so the accessModes should be `ReadWriteOnce`. If the StorageClass and access mode are mismatched, the volume could not mount. 

Here's an example for how to check the accessModes:

```
kubectl get -n mizzou pvc/claim-hikf3-40mail-2emissouri-2eedu -o yaml | grep accessModes: -A 1
```

Here the PVC name is claim-hikf3-40mail-2emissouri-2eedu, namespace is mizzou, and I added a -A 1 to the end to display the line below accessModes

    accessModes:
    - ReadWriteOnce

Advise the user to update the configuration.

## How to reboot a node:

Admins can reboot a node using the Ansible playbook: `ansible-playbook reboot.yaml -l {node name}`

Steps to reboot a node manually:

Drain node: `kubectl drain {node name} --ignore-daemonsets --delete-emptydir-data --force`

SSH into node and reboot: `ssh {user}@{node name} reboot`

If GPU, check if nvidia-smi is up: `nvidia-smi`

Uncordon Node: `kubectl uncordon {node name}`

