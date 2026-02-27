---
title: Linstor
description: Linstor storage
---

[Linstor](https://linbit.com/linstor/) is currently the fastest distributed block storage in the cluster, and can be used for tasks requiring minimal latency, such as VM images, docker build space, databases, etc. Also it doesn't lock the volumes like Ceph does, making it a good option for critical highly available storage volumes. 

It uses the [DRBD](https://linbit.com/drbd/) kernel module that handles the replication, and provides nearly native drive performance for I/O operations.

:::note
- Linstor allocates the space for the requested amount of storage. You should only request the space as needed and extend when necessary.
- `linstor-ha` provides the highest level of redundancy and reliability at a cost of higher replication factor, and can only be used for smaller most critical use cases. (jupyter hub volume is a good example)
:::

### Linstor storage pools data use

<div id="observablehq-plot-93570ad6"></div>
<p>Credit: <a href="https://observablehq.com/d/4d813a19acd33267">Linstor data use</a></p>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@observablehq/inspector@5/dist/inspector.css">
<script type="module">
import {Runtime, Inspector} from "https://cdn.jsdelivr.net/npm/@observablehq/runtime@5/dist/runtime.js";
import define from "https://api.observablehq.com/d/4d813a19acd33267.js?v=3";
new Runtime().module(define, name => {
  if (name === "plot") return new Inspector(document.querySelector("#observablehq-plot-93570ad6"));
});
</script>

[Linstor Grafana dashboard](https://grafana.nrp-nautilus.io/d/f_tZtVlMz/linstor-drbd)

### Currently available Storage Classes:

<table>
  <thead>
    <tr class="header">
      <th>StorageClass</th>
      <th>Region</th>
      <th>AccessModes</th>
      <th>Storage Type</th>
      <th>Replication factor</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td markdown="span">linstor-ha</td>
      <td markdown="span">3 replicas spread through different regions</td>
      <td markdown="span">ReadWriteOnce</td>
      <td markdown="span">Mixed</td>
      <td markdown="span">3x</td>
    </tr>
    <tr>
      <td markdown="span">linstor-unl</td>
      <td markdown="span">US Central / UNL</td>
      <td markdown="span">ReadWriteOnce</td>
      <td markdown="span">Spinning drives RAID 10</td>
      <td markdown="span">1x (raid-z2 storage)</td>
    </tr>
    <tr>
      <td markdown="span">linstor-sdsu</td>
      <td markdown="span">US West / SDSU</td>
      <td markdown="span">ReadWriteOnce</td>
      <td markdown="span">NVME</td>
      <td markdown="span">2x</td>
    </tr>
    <tr>
      <td markdown="span">linstor-igrok</td>
      <td markdown="span">US West / UCSD</td>
      <td markdown="span">ReadWriteOnce</td>
      <td markdown="span">NVME</td>
      <td markdown="span">2x</td>
    </tr>
    <tr>
      <td markdown="span">linstor-csus</td>
      <td markdown="span">US West / CSUS</td>
      <td markdown="span">ReadWriteOnce</td>
      <td markdown="span">NVME</td>
      <td markdown="span">1x (use at your risk)</td>
    </tr>
  </tbody>
</table>

