---
title: Hardware
description: Hardware
---

:::caution
This page contains administrative documentation intended for cluster administrators and operators. This content may not be relevant for regular users.
:::




<div class="border">
<strong>FIONA</strong>
</div>

1.  [FIONA][esnet-fiona]: low-cost, high-performance server-grade hardware
   - Flash I/O Network Appliance
   - Participant-built, based on NRP-tested hardware configurations
   -  10/40/100Gbps, <1 PB storage, Intel x86 CPU & optionally GPU or FPGA compute capability 
   -  see [ESNet] https://fasterdata.es.net/science-dmz/DTN/fiona-flash-i-o-network-appliance
1. NRP Pilot Components: FIONA System Types
   - [DataTransferNodes][dtn] - network performance-optimized on Science DMZs to conduct research data transfers 
   - Compute Nodes: compute-optimized to host researcher code and software running on federated Kubernetes (Linux Containers)
   - Storage Nodes: storage-optimized to host distributed Ceph Storage Clusters (similar to Amazon S3), can be bundled with Compute Node or dedicated


<div class="border">
<strong>FPGA boards</strong>
</div>
<br> [Xilinx Alveo][xlinks] 
<br> [Xilinx XUP-P3R][bittware]


<div class="border">
<strong>Development boards</strong>
</div>

[Google Coral beta dev board][dev-board]: a development board to quickly prototype on-device ML products
<br>[System on Module (SOM)][som]: a fully integrated system for accelerated ML applications
<br>[Intel: Odroid H2][odroid-h2] 
<br>[Single board computer: Odroid N2][odroid-n2]

[odroid-n2]: https://www.hardkernel.com/blog-2/odroid-n2/
[odroid-h2]: https://www.hardkernel.com/shop/odroid-h2/
[som]: https://coral.withgoogle.com/products/som/
[dev-board]: https://coral.withgoogle.com/products/dev-board/
[xlinks]: https://www.xilinx.com/products/boards-and-kits/alveo.html
[bittware]: https://www.bittware.com/fpga/xupp3r/

[esnet-fiona]: https://fasterdata.es.net/science-dmz/DTN/fiona-flash-i-o-network-appliance
[dtn]: https://fasterdata.es.net/science-dmz/DTN
