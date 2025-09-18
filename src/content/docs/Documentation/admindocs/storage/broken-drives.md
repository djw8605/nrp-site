---
title: Broken Drives
description: Broken Drives
---

:::warning[Admin Documentation]
This page contains administrative documentation intended for cluster administrators and operators. This content may not be relevant for regular users.
:::




## List of broken drives in the cluster by Prometheus monitoring:

<div id="observablehq-b-080dd118"></div>
<p><a href="https://observablehq.com/d/ad3be6949516bf98">Broken drives notebook</a></p>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@observablehq/inspector@5/dist/inspector.css">
<script type="module">
import {Runtime, Inspector} from "https://cdn.jsdelivr.net/npm/@observablehq/runtime@5/dist/runtime.js";
import define from "https://api.observablehq.com/d/ad3be6949516bf98.js?v=4";
new Runtime().module(define, name => {
  if (name === "b") return new Inspector(document.querySelector("#observablehq-b-080dd118"));
});
</script>

To remove the OSD first instead of `osd out` use this: `ceph osd crush reweight osd.<id> 0.0`. OSD OUT will shift the weight to other OSDs around, and will require another rebalance.
