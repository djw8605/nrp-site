---
title: Ceph FS / RBD
description: Ceph FS / RBD
---

:::danger[No Conda or PIP on CephFS]

Installing `conda` and `pip` packages on all CephFS (shared) filesystems is strictly prohibited!

:::

## Best Practices for File Access in shared filesystems

**Use Unique Files:** Always create or use unique files rather than sharing the same file to minimize conflicts.

**Avoid Long-Lived Open Handles:** Close files as soon as you are done working with them to prevent holding locks longer than necessary.

**Favor Copy Operations:** If multiple clients need to work with the same data, consider using a copy of the file rather than the original.

## Avoiding Write Conflicts in shared filesystems

When using CephFS, it is crucial not to open the same file for write from multiple parallel clients. Doing so can lead to:

**File Locking Issues:** Concurrent writes can lock the file, potentially blocking other clients.

**Data Corruption:** Simultaneous writes to a single file can corrupt the file system or the data contained within.

## Recommended Strategies to Avoid Conflicts:

**File Versioning:** Implement a versioning system for files that multiple clients may need to update.

**Locking Mechanisms:** Utilize designated locking mechanisms to control access to shared resources if required for specific applications.

**Coordination Among Clients:** Use coordination protocols or systems to manage write access among different clients.


## Ceph filesystems data use

<div id="observablehq-plot-087dc8ea"></div>
<p>Credit: <a href="https://observablehq.com/d/b9c19d9f7c57a186">Ceph data usage</a></p>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@observablehq/inspector@5/dist/inspector.css">
<script type="module">
import {Runtime, Inspector} from "https://cdn.jsdelivr.net/npm/@observablehq/runtime@5/dist/runtime.js";
import define from "https://api.observablehq.com/d/b9c19d9f7c57a186.js?v=3";
new Runtime().module(define, name => {
  if (name === "plot") return new Inspector(document.querySelector("#observablehq-plot-087dc8ea"));
});
</script>

[General ceph grafana dashboard](https://grafana.nrp-nautilus.io/d/r6lloPJmz/ceph-cluster)

## Currently available storageClasses:

<table>
  <thead>
    <tr class="header">
      <th>StorageClass</th>
      <th>Filesystem Type</th>
      <th>Region</th>
      <th>AccessModes</th>
      <th><span style="color:red">Restrictions</span></th>
      <th>Storage Type</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td markdown="span">rook-cephfs</td>
      <td markdown="span">CephFS</td>
      <td markdown="span">US West</td>
      <td markdown="span">ReadWriteMany</td>
      <td markdown="span"></td>
      <td markdown="span">Spinning drives with NVME meta</td>
    </tr>
    <tr>
      <td markdown="span">rook-cephfs-central</td>
      <td markdown="span">CephFS</td>
      <td markdown="span">US Central</td>
      <td markdown="span">ReadWriteMany</td>
      <td markdown="span"></td>
      <td markdown="span">Spinning drives with NVME meta</td>
    </tr>
    <tr>
      <td markdown="span">rook-cephfs-east</td>
      <td markdown="span">CephFS</td>
      <td markdown="span">US East</td>
      <td markdown="span">ReadWriteMany</td>
      <td markdown="span"></td>
      <td markdown="span">Mixed</td>
    </tr>
    <tr>
      <td markdown="span">rook-cephfs-south-east</td>
      <td markdown="span">CephFS</td>
      <td markdown="span">US South East</td>
      <td markdown="span">ReadWriteMany</td>
      <td markdown="span"></td>
      <td markdown="span">Spinning drives with NVME meta</td>
    </tr>
    <tr>
      <td markdown="span">rook-cephfs-pacific</td>
      <td markdown="span">CephFS</td>
      <td markdown="span">Hawaii+Guam</td>
      <td markdown="span">ReadWriteMany</td>
      <td markdown="span"></td>
      <td markdown="span">Spinning drives with NVME meta</td>
    </tr>
    <tr>
      <td markdown="span">rook-cephfs-haosu</td>
      <td markdown="span">CephFS</td>
      <td markdown="span">US West (local)</td>
      <td markdown="span">ReadWriteMany</td>
      <td markdown="span"><span style="color:red">Hao Su and Ravi cluster</span></td>
      <td markdown="span">Spinning drives with NVME, meta on NVME</td>
    </tr>
    <tr>
      <td markdown="span">rook-cephfs-tide</td>
      <td markdown="span">CephFS</td>
      <td markdown="span">US West (local)</td>
      <td markdown="span">ReadWriteMany</td>
      <td markdown="span"><span style="color:red">SDSU Tide cluster</span></td>
      <td markdown="span">Spinning drives with NVME meta</td>
    </tr>
    <tr>
      <td markdown="span">rook-cephfs-fullerton</td>
      <td markdown="span">CephFS</td>
      <td markdown="span">US West (local)</td>
      <td markdown="span">ReadWriteMany</td>
      <td markdown="span"></td>
      <td markdown="span">Spinning drives with NVME meta</td>
    </tr>
    <tr>
      <td markdown="span">rook-cephfs-ucsd</td>
      <td markdown="span">CephFS</td>
      <td markdown="span">US West (local)</td>
      <td markdown="span">ReadWriteMany</td>
      <td markdown="span"><span style="color:red"><a href="#ucsd-nvme-cephfs-filesystem-policy">Read the Policy</a></span></td>
      <td markdown="span">NVME</td>
    </tr>
    <tr>
      <td markdown="span">rook-ceph-block (*default*)</td>
      <td markdown="span">RBD</td>
      <td markdown="span">US West</td>
      <td markdown="span">ReadWriteOnce</td>
      <td markdown="span"></td>
      <td markdown="span">Spinning drives with NVME meta</td>
    </tr>
    <tr>
      <td markdown="span">rook-ceph-block-east</td>
      <td markdown="span">RBD</td>
      <td markdown="span">US East</td>
      <td markdown="span">ReadWriteOnce</td>
      <td markdown="span"></td>
      <td markdown="span">Mixed</td>
    </tr>
    <tr>
      <td markdown="span">rook-ceph-block-south-east</td>
      <td markdown="span">RBD</td>
      <td markdown="span">US South East</td>
      <td markdown="span">ReadWriteOnce</td>
      <td markdown="span"></td>
      <td markdown="span">Spinning drives with NVME meta</td>
    </tr>
    <tr>
      <td markdown="span">rook-ceph-block-pacific</td>
      <td markdown="span">RBD</td>
      <td markdown="span">Hawaii+Guam</td>
      <td markdown="span">ReadWriteOnce</td>
      <td markdown="span"></td>
      <td markdown="span">Spinning drives with NVME meta</td>
    </tr>
    <tr>
      <td markdown="span">rook-ceph-block-tide</td>
      <td markdown="span">RBD</td>
      <td markdown="span">US West (local)</td>
      <td markdown="span">ReadWriteOnce</td>
      <td markdown="span"><span style="color:red">SDSU Tide cluster</span></td>
      <td markdown="span">Spinning drives with NVME meta</td>
    </tr>
    <tr>
      <td markdown="span">rook-ceph-block-fullerton</td>
      <td markdown="span">RBD</td>
      <td markdown="span">US West (local)</td>
      <td markdown="span">ReadWriteOnce</td>
      <td markdown="span"></td>
      <td markdown="span">Spinning drives with NVME meta</td>
    </tr>
    <tr>
      <td markdown="span">rook-ceph-block-central</td>
      <td markdown="span">RBD</td>
      <td markdown="span">US Central</td>
      <td markdown="span">ReadWriteOnce</td>
      <td markdown="span"></td>
      <td markdown="span">Spinning drives with NVME meta</td>
    </tr>
  </tbody>
</table>

Ceph shared filesystem ([**CephFS**](https://docs.ceph.com/en/latest/cephfs/)) is the primary way of storing data in nautilus and allows mounting same volumes from multiple PODs in parallel (*ReadWriteMany*).

Ceph block storage allows [**RBD** (Rados Block Devices)](https://docs.ceph.com/docs/master/rbd/) to be attached to a **single pod** at a time (*ReadWriteOnce*). Provides fastest access to the data, and **is preferred for all datasets not needing shared access from multiple pods**.

## UCSD NVMe CephFS filesystem policy

:::caution
**This policy applies to the `rook-cephfs-ucsd` storageclass**
:::

The filesystem is very fast and small. We expect all data on it to be used for currently running computation and then promptly deleted. We reserve the right to purge any data that's staying there longer than needed at admin's discretion without any notifications.