---
title: Volume Mounting Troubleshooting
description: Volume Mounting Troubleshooting
---

This article describes how to resolve stuck Ceph RBD volumes and CephFS volumes.

# Get the volume's StorageClass

You'll need to get the storageclass to determine how to debug this. Block storage means it should be on one node at a time, and thus if it's stuck on a node it will prevent other nodes from using it. The non-blocked class should allow other nodes to mount as well.

    kubectl describe -n mizzou pvc/claim-hikf3-40mail-2emissouri-2eedu | grep StorageClass

    StorageClass:  rook-ceph-block

Here we're getting the storage class via a PVC name. The namespace here is mizzou, and the PVC name is claim-hikf3-40mail-2emissouri-2eedu

If you have the pv name, that can also be used the same way:

    kubectl describe -n mizzou pv/pvc-ae8904a6-23f2-46d0-ac5c-4e9e9271c6f7 | grep StorageClass

    StorageClass:    rook-ceph-block

Here the storage class is rook-ceph-block, but there are variations of storage class based on the region the ceph cluster is in. For example, rook-ceph-block-central, rook-ceph-block-east. Basically you want to be looking for whether it says block or not.

# If the StorageClass is rook-ceph-block

## Get the name of PV:

If you only have the PVC name, you can find the pv name by doing the following command:

    kubectl get pv | grep claim-hikf3-40mail-2emissouri-2eedu

    pvc-ae8904a6-23f2-46d0-ac5c-4e9e9271c6f7                                    5Gi                    RWO            Delete           Bound      mizzou/claim-hikf3-40mail-2emissouri-2eedu                                               rook-ceph-block                          185d

Here in this example the PVC name is claim-hikf3-40mail-2emissouri-2eedu and the pv name is pvc-ae8904a6-23f2-46d0-ac5c-4e9e9271c6f7

## Find Node a pv is currently mounted on:

We can get the volume attachments and grep for the pv name to find what nodes it's attached to:

    kubectl get volumeattachments | grep pvc-ae8904a6-23f2-46d0-ac5c-4e9e9271c6f7

    csi-68ba7951a0c04649cd3e80156c355e899e753e50b9030a424dbe8dd872061067   rook-system.rbd.csi.ceph.com      pvc-ae8904a6-23f2-46d0-ac5c-4e9e9271c6f7   k8s-bharadia-02.sdsc.optiputer.net     true       2d19h

Here the pv name is pvc-ae8904a6-23f2-46d0-ac5c-4e9e9271c6f7 and the node it's attached to is k8s-bharadia-02.sdsc.optiputer.net 

## Rebooting the node:

Reach out to an admin to reboot the node the volume is attached to. 

If you have permissions to reboot yourself, you can do the following:

Drain node: `kubectl drain {node name} --ignore-daemonsets --delete-emptydir-data --force`

SSH into node and reboot: `ssh {user}@{node name} reboot`

If GPU, check if nvidia-smi is up: `nvidia-smi`

Uncordon Node: `kubectl uncordon {node name}`

Or use the Ansible playbook: `ansible-playbook reboot.yaml -l {node name}`

# If the StorageClass is rook-cephfs

Since this type of storage class allows the Ceph volume to be mounted on multiple nodes, a stuck node is likely not the issue. The most common issue is that the user has configured their volume incorrectly, and their access mode is set to ReadWriteOnce when it should be set to ReadWriteMany for this type of storageclass. 

You can do this by outputting the config for a PVC or PV and grepping for the `accessMode` as I do in the following:

    kubectl get -n mizzou pvc/claim-hikf3-40mail-2emissouri-2eedu -o yaml | grep accessModes: -A 1

Here the PVC name is claim-hikf3-40mail-2emissouri-2eedu, namespace is mizzou, and I added a -A 1 to the end to display the line below accessModes

    accessModes:
    - ReadWriteOnce
