---
title: Broken Drives
description: Broken Drives
---

:::caution
This page contains administrative documentation intended for cluster administrators and operators. This content may not be relevant for regular users.
:::

## Using the linstor console

```bash
kubectl exec -it -n piraeus-datastore $(kubectl get pods -n piraeus-datastore --selector=app.kubernetes.io/component=linstor-controller --output=jsonpath={.items..metadata.name}) -- bash
```

All commands start with "linstor".

Listing broken resources: `linstor r l --faulty`

Listing specific resources: `linstor r l -r <resource-name>`

Listing resources on a specific node: `linstor r l -n <node-name>`

Listing nodes grouped by status: `linstor n l -g state`

### Statuses

`UpToDate` means there's data stored on a storage node and it's consistent.

`Diskless` means it's a remote volume that is physically stored on the node.

`InUse` means the volume is currently mounted on this node.

`Outdated`, `Inconsistent` is an indication of an issue and needs to be repaired.

## Fixing stuff

Always make sure there's a good copy of the volume before attempting to fix it.

### Fixing `Outdated`, `Inconsistent` resource having a good copy (for resources with redundancy)

**Same procedure applies to volumes stuck in Sync**

1. Delete the bad copy (having the bad status):

```
linstor r d <node-name> <resource-name>
```

2. Make linstor create a good copy again and sync it from existing copy:

```
linstor rd auto-place <resource-name>
```

## Cleaning up a node

1. Find volumes on the node:

```
linstor v l -n <node-name>
```

2. Delete the volumes:

```
linstor r l -n <node-name>
```

All should be `Diskless`. For example:

```
┊ pvc-ef9aadb2-9839-4cdc-92f4-d563491512d8 ┊ rci-nrp-dtn-01.sdsu.edu              ┊ DRBD,STORAGE ┊ Unused ┊ Ok    ┊           UpToDate ┊ 2023-08-22 20:32:36 ┊
┊ pvc-ef9aadb2-9839-4cdc-92f4-d563491512d8 ┊ rci-nrp-dtn-03.sdsu.edu              ┊ DRBD,STORAGE ┊ Unused ┊ Ok    ┊           UpToDate ┊ 2023-08-22 20:32:30 ┊
┊ pvc-ef9aadb2-9839-4cdc-92f4-d563491512d8 ┊ rci-nrp-gpu-03.sdsu.edu              ┊ DRBD,STORAGE ┊ Unused ┊ Ok    ┊           Diskless ┊ 2025-09-24 23:59:05 ┊
┊ pvc-ef9aadb2-9839-4cdc-92f4-d563491512d8 ┊ rci-nrp-cpu-02.sdsu.edu              ┊ DRBD,STORAGE ┊ Unused ┊ Ok    ┊           Diskless ┊ 2025-09-24 23:59:05 ┊
```

In this case you can delete the one from rci-nrp-gpu-03.sdsu.edu or rci-nrp-cpu-02.sdsu.edu. Deleting the stored volumes is not covered in this doc.

Delete the diskless resource:

```
linstor r d <node-name> <resource-name>
```

Check it still has enough copies.

Repeat for all volumes on the node. Once all are gone, you can remove the node from the cluster.

TieBreakers are fine to be deleted too, and should be re-created by linstor when needed.
