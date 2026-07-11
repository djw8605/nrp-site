<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6">
    <div class="flex flex-wrap items-end gap-3 mt-2 mb-3">
      <div>
        <label for="lp-start" class="mb-1 block text-sm font-medium">Start date</label>
        <input
          id="lp-start"
          v-model="startDate"
          type="date"
          :max="endDate"
          class="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
        />
      </div>
      <div>
        <label for="lp-end" class="mb-1 block text-sm font-medium">End date</label>
        <input
          id="lp-end"
          v-model="endDate"
          type="date"
          :min="startDate"
          :max="today"
          class="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
        />
      </div>
      <div>
        <label for="lp-threshold" class="mb-1 block text-sm font-medium">Min CPU/GPU hours</label>
        <input
          id="lp-threshold"
          v-model="thresholdInput"
          type="text"
          inputmode="decimal"
          class="w-32 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          @keyup.enter="handleGoClick"
        />
      </div>
      <div>
        <button
          type="button"
          class="rounded-md bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-700"
          @click="handleGoClick"
        >
          Go
        </button>
      </div>
    </div>

    <div
      v-if="errorMessage"
      class="mb-3 rounded-md border border-red-400 bg-red-50 px-4 py-2 text-sm text-red-800 dark:border-red-600 dark:bg-red-950 dark:text-red-200"
    >
      {{ errorMessage }}
    </div>

    <VueSpinnerPie v-if="isLoading" size="40" style="z-index: 10; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);" color="red" />

    <section class="mt-4">
      <h2 class="mb-2 text-lg font-semibold">By namespace (all labels)</h2>
      <div class="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 md:flex-row dark:border-slate-700">
        <div id="log-plot-namespace-labels" class="w-full md:w-3/4"></div>
        <div class="flex w-full flex-col gap-3 md:w-1/4">
          <button
            type="button"
            class="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-600 dark:hover:bg-slate-800"
            :disabled="!hasNamespaceLabelsPlot"
            @click="downloadPng('log-plot-namespace-labels', 'namespace-all-labels')"
          >
            Download plot PNG
          </button>

          <div v-if="namespaceTop.length" class="overflow-x-auto">
            <h3 class="mb-2 text-sm font-medium">Top 10 namespaces by GPU hours</h3>
            <table class="w-full text-sm border-collapse">
              <thead>
                <tr class="border-b border-slate-300 dark:border-slate-600">
                  <th class="py-1 pr-4 text-left">Namespace</th>
                  <th class="py-1 pr-4 text-right">GPU hours</th>
                  <th class="py-1 text-right">CPU hours</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="entry in namespaceTop" :key="entry.namespace" class="border-b border-slate-100 dark:border-slate-800">
                  <td class="py-1 pr-4">{{ entry.namespace }}</td>
                  <td class="py-1 pr-4 text-right">{{ formatHours(entry.gpu) }}</td>
                  <td class="py-1 text-right">{{ formatHours(entry.cpu) }}</td>
                </tr>
              </tbody>
            </table>
            <div class="mt-2 flex gap-2">
              <button
                type="button"
                class="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-600 dark:hover:bg-slate-800"
                :disabled="!namespaceFullVals.length"
                @click="downloadCsv(namespaceFullVals, 'namespace', 'Namespace', 'namespace')"
              >
                Download CSV
              </button>
              <button
                type="button"
                class="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-600 dark:hover:bg-slate-800"
                :disabled="!namespaceFullVals.length"
                @click="downloadTablePng(namespaceFullVals, 'namespace', 'Namespace', 'namespace')"
              >
                Download table PNG
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="text-center mt-3 mb-3">Total namespaces: {{ namespaceTotal }}, omitted: {{ namespaceOmitted }}, range: {{ startDate }} to {{ endDate }}</div>
    </section>

    <section class="mt-10">
      <h2 class="mb-2 text-lg font-semibold">By organization</h2>
      <div class="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 md:flex-row dark:border-slate-700">
        <div id="log-plot-org" class="w-full md:w-3/4"></div>
        <div class="flex w-full flex-col gap-3 md:w-1/4">
          <button
            type="button"
            class="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-600 dark:hover:bg-slate-800"
            :disabled="!hasOrgPlot"
            @click="downloadPng('log-plot-org', 'by-org')"
          >
            Download plot PNG
          </button>

          <div v-if="orgTop.length" class="overflow-x-auto">
            <h3 class="mb-2 text-sm font-medium">Top 10 organizations by GPU hours</h3>
            <table class="w-full text-sm border-collapse">
              <thead>
                <tr class="border-b border-slate-300 dark:border-slate-600">
                  <th class="py-1 pr-4 text-left">Organization</th>
                  <th class="py-1 pr-4 text-right">GPU hours</th>
                  <th class="py-1 text-right">CPU hours</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="entry in orgTop" :key="entry.org" class="border-b border-slate-100 dark:border-slate-800">
                  <td class="py-1 pr-4">{{ entry.org }}</td>
                  <td class="py-1 pr-4 text-right">{{ formatHours(entry.gpu) }}</td>
                  <td class="py-1 text-right">{{ formatHours(entry.cpu) }}</td>
                </tr>
              </tbody>
            </table>
            <div class="mt-2 flex gap-2">
              <button
                type="button"
                class="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-600 dark:hover:bg-slate-800"
                :disabled="!orgFullVals.length"
                @click="downloadCsv(orgFullVals, 'org', 'Organization', 'by-org')"
              >
                Download CSV
              </button>
              <button
                type="button"
                class="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-600 dark:hover:bg-slate-800"
                :disabled="!orgFullVals.length"
                @click="downloadTablePng(orgFullVals, 'org', 'Organization', 'by-org')"
              >
                Download table PNG
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="text-center mt-3 mb-3">Total orgs: {{ orgTotal }}, omitted: {{ orgOmitted }}, range: {{ startDate }} to {{ endDate }}</div>
    </section>

    <section class="mt-10">
      <h2 class="mb-2 text-lg font-semibold">By namespace</h2>
      <div class="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 md:flex-row dark:border-slate-700">
        <div id="log-plot-namespace" class="w-full md:w-3/4"></div>
        <div class="flex w-full flex-col gap-3 md:w-1/4">
          <button
            type="button"
            class="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-600 dark:hover:bg-slate-800"
            :disabled="!hasNamespacePlot"
            @click="downloadPng('log-plot-namespace', 'namespace')"
          >
            Download plot PNG
          </button>

          <div v-if="namespaceTop.length" class="overflow-x-auto">
            <h3 class="mb-2 text-sm font-medium">Top 10 namespaces by GPU hours</h3>
            <table class="w-full text-sm border-collapse">
              <thead>
                <tr class="border-b border-slate-300 dark:border-slate-600">
                  <th class="py-1 pr-4 text-left">Namespace</th>
                  <th class="py-1 pr-4 text-right">GPU hours</th>
                  <th class="py-1 text-right">CPU hours</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="entry in namespaceTop" :key="entry.namespace" class="border-b border-slate-100 dark:border-slate-800">
                  <td class="py-1 pr-4">{{ entry.namespace }}</td>
                  <td class="py-1 pr-4 text-right">{{ formatHours(entry.gpu) }}</td>
                  <td class="py-1 text-right">{{ formatHours(entry.cpu) }}</td>
                </tr>
              </tbody>
            </table>
            <div class="mt-2 flex gap-2">
              <button
                type="button"
                class="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-600 dark:hover:bg-slate-800"
                :disabled="!namespaceFullVals.length"
                @click="downloadCsv(namespaceFullVals, 'namespace', 'Namespace', 'namespace')"
              >
                Download CSV
              </button>
              <button
                type="button"
                class="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-600 dark:hover:bg-slate-800"
                :disabled="!namespaceFullVals.length"
                @click="downloadTablePng(namespaceFullVals, 'namespace', 'Namespace', 'namespace')"
              >
                Download table PNG
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="text-center mt-3 mb-3">Total namespaces: {{ namespaceTotal }}, omitted: {{ namespaceOmitted }}, range: {{ startDate }} to {{ endDate }}</div>
    </section>
  </div>
</template>

<script setup>
  import {ref, onMounted} from 'vue';

  import {VueSpinnerPie} from 'vue3-spinners';

  import * as Plot from '@observablehq/plot';
  import { forceSimulation, forceCollide, forceX, forceY } from 'd3-force';

  const isLoading = ref(false);
  const errorMessage = ref("");

  const hasNamespacePlot = ref(false);
  const hasNamespaceLabelsPlot = ref(false);
  const hasOrgPlot = ref(false);

  const namespaceTotal = ref(0);
  const namespaceOmitted = ref(0);
  const namespaceTop = ref([]);
  const namespaceFullVals = ref([]);

  const orgTotal = ref(0);
  const orgOmitted = ref(0);
  const orgTop = ref([]);
  const orgFullVals = ref([]);

  const EXCLUDED_NAMESPACES = new Set(["gpu-mon", "kube-system", "default", "gpu-operator"]);
  const X_TICKS = [10, 100, 1000, 10000, 100000, 1000000];
  const Y_TICKS = [10, 100, 1000, 10000, 100000];

  const PLOT_WIDTH = 1800;
  const PLOT_HEIGHT = 1275;
  const PLOT_MARGIN_TOP = 100;
  const PLOT_MARGIN_BOTTOM = 75;
  const PLOT_MARGIN_LEFT = 90;
  const PLOT_MARGIN_RIGHT = 180;

  function toDateInputValue(date) {
    return date.toISOString().slice(0, 10);
  }

  function firstOfMonth(date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  }

  function formatHours(n) {
    return n == null || Number.isNaN(n) ? "—" : n.toLocaleString(undefined, { maximumFractionDigits: 1 });
  }

  const today = toDateInputValue(new Date());

  // Defaults to the 1st of this month a year ago through the 1st of this month.
  const defaultEnd = firstOfMonth(new Date());
  const defaultStart = firstOfMonth(new Date());
  defaultStart.setUTCFullYear(defaultStart.getUTCFullYear() - 1);

  const startDate = ref(toDateInputValue(defaultStart));
  const endDate = ref(toDateInputValue(defaultEnd));
  const threshold = ref(10000);
  const thresholdInput = ref("10000");

  function handleGoClick() {
    if (!startDate.value || !endDate.value) {
      errorMessage.value = "Please select both a start and end date.";
      return;
    }
    if (startDate.value > endDate.value) {
      errorMessage.value = "Start date must be before the end date.";
      return;
    }

    const trimmed = thresholdInput.value.trim();
    const parsed = Number(trimmed);
    if (trimmed === "" || !Number.isFinite(parsed)) {
      errorMessage.value = "Please enter a valid number for the CPU/GPU hour threshold.";
      return;
    }

    threshold.value = parsed;
    fetchAndRender();
  }

  function buildQueryUrl(metric, windowSeconds, endUnix) {
    const params = new URLSearchParams({
      query: `sum_over_time(${metric}[${windowSeconds}s:1h])`,
      time: String(endUnix),
    });
    return `https://thanos.nrp-nautilus.io/api/v1/query?${params.toString()}`;
  }

  function downloadPng(targetId, filenameSuffix) {
    const svg = document.querySelector(`#${targetId} svg`);
    if (!svg) {
      errorMessage.value = "No plot to download yet.";
      return;
    }

    const svgString = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const width = svg.viewBox?.baseVal?.width || svg.width?.baseVal?.value || img.width;
      const height = svg.viewBox?.baseVal?.height || svg.height?.baseVal?.value || img.height;
      const padding = 40;
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = (width + padding * 2) * scale;
      canvas.height = (height + padding * 2) * scale;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, padding, padding, width, height);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        triggerBlobDownload(blob, `cpu-gpu-usage-${filenameSuffix}-${startDate.value}-to-${endDate.value}.png`);
      }, "image/png");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      errorMessage.value = "Failed to render the plot image for download.";
    };
    img.src = url;
  }

  function triggerBlobDownload(blob, filename) {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  function downloadCsv(rows, labelField, headerLabel, filenameSuffix) {
    if (!rows.length) {
      errorMessage.value = "No data to download yet.";
      return;
    }

    const sorted = [...rows].sort((a, b) => b.gpu - a.gpu);
    const escapeCell = (value) => `"${String(value).replace(/"/g, '""')}"`;
    const lines = [
      [headerLabel, "GPU hours", "CPU hours"].map(escapeCell).join(","),
      ...sorted.map((r) => [r[labelField], r.gpu, r.cpu].map(escapeCell).join(",")),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    triggerBlobDownload(blob, `cpu-gpu-usage-${filenameSuffix}-${startDate.value}-to-${endDate.value}.csv`);
  }

  function truncateToWidth(ctx, text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let low = 0;
    let high = text.length;
    while (low < high) {
      const mid = (low + high + 1) >> 1;
      if (ctx.measureText(text.slice(0, mid) + "…").width <= maxWidth) {
        low = mid;
      } else {
        high = mid - 1;
      }
    }
    return text.slice(0, low) + "…";
  }

  function downloadTablePng(rows, labelField, headerLabel, filenameSuffix) {
    if (!rows.length) {
      errorMessage.value = "No data to download yet.";
      return;
    }

    const sorted = [...rows].sort((a, b) => b.gpu - a.gpu);
    const colWidths = [280, 140, 140];
    const cellPadding = 12;
    const tableWidth = colWidths.reduce((a, b) => a + b, 0);
    const rowHeight = 28;
    const headerHeight = 34;
    const padding = 16;
    const tableHeight = headerHeight + sorted.length * rowHeight;
    const width = tableWidth + padding * 2;
    const height = tableHeight + padding * 2;
    const scale = 2;

    // Drawn directly with Canvas 2D (no SVG/Image round trip) so the canvas
    // never gets tainted and toBlob() always succeeds.
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#0f172a";

    const drawRow = (cells, rowTop, rowH, bold) => {
      ctx.font = `${bold ? "bold " : ""}14px system-ui, sans-serif`;
      let x = padding;
      cells.forEach((text, i) => {
        ctx.textAlign = i === 0 ? "left" : "right";
        const maxWidth = colWidths[i] - cellPadding * 2;
        const cellText = i === 0 ? truncateToWidth(ctx, String(text), maxWidth) : String(text);
        const cellX = i === 0 ? x + cellPadding : x + colWidths[i] - cellPadding;
        ctx.fillText(cellText, cellX, rowTop + rowH / 2);
        x += colWidths[i];
      });
    };

    let y = padding;
    drawRow([headerLabel, "GPU hours", "CPU hours"], y, headerHeight, true);
    y += headerHeight;

    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(padding + tableWidth, y);
    ctx.stroke();

    sorted.forEach((r) => {
      drawRow([r[labelField], formatHours(r.gpu), formatHours(r.cpu)], y, rowHeight, false);
      y += rowHeight;

      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + tableWidth, y);
      ctx.stroke();
    });

    canvas.toBlob((blob) => {
      triggerBlobDownload(blob, `cpu-gpu-usage-table-${filenameSuffix}-${startDate.value}-to-${endDate.value}.png`);
    }, "image/png");
  }

  let measureCtx = null;
  function measureTextWidth(text, font) {
    if (!measureCtx) {
      measureCtx = document.createElement("canvas").getContext("2d");
    }
    measureCtx.font = font;
    return measureCtx.measureText(text).width;
  }

  const LABEL_FONT = "14px system-ui, sans-serif";
  const LABEL_SVG_NS = "http://www.w3.org/2000/svg";

  // Places each point's text label using a force simulation: a collision
  // force pushes overlapping labels apart, while a weak spring pulls each
  // one back toward its dot. Labels that end up displaced get a thin leader
  // line back to their dot, matching the common "ggrepel" technique.
  function addDeoverlappedLabels(svg, vals, labelField, labelSubset) {
    const circles = [...svg.querySelectorAll("circle")];
    if (circles.length !== vals.length) return;

    const subset = labelSubset ?? vals;
    const nodes = subset.map((d) => {
      const i = vals.indexOf(d);
      const cx = parseFloat(circles[i].getAttribute("cx"));
      const cy = parseFloat(circles[i].getAttribute("cy"));
      const text = String(d[labelField]);
      const width = measureTextWidth(text, LABEL_FONT);
      return {
        text,
        anchorX: cx,
        anchorY: cy,
        x: cx,
        y: cy - 16,
        halfWidth: width / 2,
        radius: Math.sqrt(width * width + 14 * 14) / 2 + 2,
      };
    });

    const simulation = forceSimulation(nodes)
      .force("collide", forceCollide((d) => d.radius).iterations(3))
      .force("x", forceX((d) => d.anchorX).strength(0.15))
      .force("y", forceY((d) => d.anchorY - 14).strength(0.15))
      .stop();

    for (let i = 0; i < 300; i++) simulation.tick();

    // Keep labels from drifting outside the plot's frame even when the
    // collision force pushes them hard, e.g. for points near an edge.
    const frameLeft = PLOT_MARGIN_LEFT + 4;
    const frameRight = PLOT_WIDTH - PLOT_MARGIN_RIGHT - 4;
    const frameTop = PLOT_MARGIN_TOP + 4;
    const frameBottom = PLOT_HEIGHT - PLOT_MARGIN_BOTTOM - 4;
    const labelHalfHeight = 8;
    nodes.forEach((node) => {
      node.x = Math.min(Math.max(node.x, frameLeft + node.halfWidth), frameRight - node.halfWidth);
      node.y = Math.min(Math.max(node.y, frameTop + labelHalfHeight), frameBottom - labelHalfHeight);
    });

    const labelGroup = document.createElementNS(LABEL_SVG_NS, "g");
    labelGroup.setAttribute("aria-label", "point-labels");

    nodes.forEach((node) => {
      if (Math.hypot(node.x - node.anchorX, node.y - node.anchorY) > 18) {
        const line = document.createElementNS(LABEL_SVG_NS, "line");
        line.setAttribute("x1", node.anchorX);
        line.setAttribute("y1", node.anchorY);
        line.setAttribute("x2", node.x);
        line.setAttribute("y2", node.y);
        line.setAttribute("stroke", "currentColor");
        line.setAttribute("stroke-opacity", "0.35");
        line.setAttribute("stroke-width", "1");
        labelGroup.appendChild(line);
      }

      const text = document.createElementNS(LABEL_SVG_NS, "text");
      text.setAttribute("x", node.x);
      text.setAttribute("y", node.y);
      text.setAttribute("dy", "0.32em");
      text.setAttribute("font-size", "14");
      text.setAttribute("fill", "currentColor");
      text.setAttribute("text-anchor", "middle");
      text.textContent = node.text;
      labelGroup.appendChild(text);
    });

    svg.appendChild(labelGroup);
  }

  function renderPlot({ targetId, vals, titlePrefix, labelField, showTextLabels }) {
    const marks = [
      Plot.dot(vals, {
        x: "cpu",
        y: "gpu",
        stroke: "gpu",
        fill: "gpu",
        strokeWidth: 1,
        title: (d) => d[labelField],
      }),
      Plot.axisX({
        label: null,
        grid: true,
        ticks: X_TICKS,
      }),
      Plot.axisY({
        label: null,
        grid: true,
        ticks: Y_TICKS,
      }),
      Plot.text([`${titlePrefix}, ${startDate.value} to ${endDate.value}  (CPU > ${threshold.value} h and GPU > ${threshold.value} h)`], {
        frameAnchor: "top",
        dy: -50,
        fontSize: 26,
        fontWeight: "bold",
      }),
      Plot.text(["CPU-Hours"], {
        frameAnchor: "bottom",
        dy: 42,
        fontSize: 20,
        fontWeight: "bold",
      }),
      Plot.text(["GPU-Hours"], {
        frameAnchor: "left",
        dx: -60,
        rotate: -90,
        fontSize: 20,
        fontWeight: "bold",
      }),
    ];

    marks.push(
      Plot.tip(vals, Plot.pointer({
        x: "cpu",
        y: "gpu",
        title: (d) => d[labelField],
      })),
    );

    const plot = Plot.plot({
      width: PLOT_WIDTH,
      height: PLOT_HEIGHT,
      inset: 8,
      grid: true,
      marginTop: PLOT_MARGIN_TOP,
      marginBottom: PLOT_MARGIN_BOTTOM,
      marginLeft: PLOT_MARGIN_LEFT,
      marginRight: PLOT_MARGIN_RIGHT,
      style: "font-size: 16px", // governs axis tick labels
      color: {
        legend: false,
        scheme: "Warm",
      },
      marks,
      x: {
        type: "log",
        base: 10,
        ticks: X_TICKS,
      },
      y: {
        type: "log",
        base: 10,
        ticks: Y_TICKS,
      },
    });

    const targetDiv = document.getElementById(targetId);
    if (targetDiv) {
      targetDiv.replaceChildren();
      targetDiv.append(plot);
      if (showTextLabels) {
        const labelSubset = [...vals].sort((a, b) => b.gpu - a.gpu).slice(0, 30);
        addDeoverlappedLabels(plot, vals, labelField, labelSubset);
      }
    }
    return !!targetDiv;
  }

  const fetchNamespaceInfo = async () => {
      try {
          const { HTTPTransport, Client, RequestManager } = await import('@open-rpc/client-js');
          const baseUrl = import.meta.env.PUBLIC_SVC_URL || "https://portal.nrp.ai";
          const transport = new HTTPTransport(`${baseUrl}/rpc`);
          const client = new Client(new RequestManager([transport]));
          const result = await client.request({method: 'guest.ListNsInfo', params: {}});
          return result?.Namespaces || [];
      } catch (error) {
          console.error('Error fetching namespace info:', error);
          return [];
      }
  };

  let ns_map = new Map();
  let namespaceInfoLoaded = false;

  async function ensureNamespaceInfo() {
    if (namespaceInfoLoaded) return;
    const namespaceInfo = await fetchNamespaceInfo().catch(() => {
      console.warn('Namespace info unavailable, continuing with empty data');
      return [];
    });
    ns_map = new Map(namespaceInfo.map((element) => [element.Name, element]));
    namespaceInfoLoaded = true;
  }

  let requestToken = 0;
  let activeController = null;

  // In-memory only — cleared on page reload, never persisted. Keyed by date
  // range since the raw query doesn't depend on the threshold at all (that's
  // applied client-side), so re-fetching on a threshold-only change is wasted.
  const rangeQueryCache = new Map();

  async function fetchAndRender() {
    const token = ++requestToken;

    if (activeController) activeController.abort();
    const controller = new AbortController();
    activeController = controller;

    isLoading.value = true;
    errorMessage.value = "";
    namespaceTotal.value = 0;
    namespaceOmitted.value = 0;
    orgTotal.value = 0;
    orgOmitted.value = 0;

    try {
      await ensureNamespaceInfo();
      if (token !== requestToken) return;

      const cacheKey = `${startDate.value}|${endDate.value}`;
      let gpu, cpu;

      if (rangeQueryCache.has(cacheKey)) {
        ({ gpu, cpu } = rangeQueryCache.get(cacheKey));
      } else {
        const start = new Date(`${startDate.value}T00:00:00Z`);
        const end = new Date(`${endDate.value}T23:59:59Z`);
        const windowSeconds = Math.round((end - start) / 1000);
        const endUnix = Math.floor(end.getTime() / 1000);

        // A single unthresholded fetch per metric supplies data for all three plots below.
        const [gpu_resp, cpu_resp] = await Promise.all([
          fetch(buildQueryUrl("namespace_gpu_usage", windowSeconds, endUnix), { signal: controller.signal }),
          fetch(buildQueryUrl("namespace_cpu_usage", windowSeconds, endUnix), { signal: controller.signal }),
        ]);

        [gpu, cpu] = await Promise.all([
          gpu_resp.json(),
          cpu_resp.json(),
        ]);

        if (token !== requestToken) return;

        if (gpu.status !== "success" || cpu.status !== "success") {
          errorMessage.value = "Failed to load usage data from Thanos for the selected range.";
          return;
        }

        const warnings = [...(gpu.warnings ?? []), ...(cpu.warnings ?? [])];
        if (warnings.length > 0) {
          console.warn("Thanos returned warnings for this range (data may be incomplete):", warnings);
        }

        rangeQueryCache.set(cacheKey, { gpu, cpu });
      }

      const gpu_map = new Map(
        gpu.data.result.map((element) => [
          element.metric.namespace,
          Number(element.value[1])
        ])
      );

      const cpu_map = new Map(
        cpu.data.result.map((element) => [
          element.metric.namespace,
          Number(element.value[1])
        ])
      );

      // Full per-namespace dataset (no threshold applied yet) — feeds all three views below.
      const allNamespaceEntries = [];
      gpu_map.forEach((gpuValue, namespace) => {
        if (EXCLUDED_NAMESPACES.has(namespace)) return;
        allNamespaceEntries.push({
          namespace,
          gpu: gpuValue,
          cpu: cpu_map.has(namespace) ? cpu_map.get(namespace) : undefined,
        });
      });

      // --- By namespace / By namespace (all labels) ---
      const namespaceVals = allNamespaceEntries.filter(
        (e) => e.gpu > threshold.value && e.cpu != null && e.cpu > threshold.value
      );
      namespaceTotal.value = namespaceVals.length;
      namespaceOmitted.value = allNamespaceEntries.length - namespaceVals.length;
      namespaceTop.value = [...namespaceVals].sort((a, b) => b.gpu - a.gpu).slice(0, 10);
      namespaceFullVals.value = namespaceVals;

      // --- By organization ---
      const orgGpuMap = new Map();
      const orgCpuMap = new Map();
      allNamespaceEntries.forEach((entry) => {
        const org = ns_map.has(entry.namespace) ? ns_map.get(entry.namespace).Institution : "Unknown: " + entry.namespace;
        if (!org) return;
        orgGpuMap.set(org, (orgGpuMap.get(org) || 0) + entry.gpu);
        if (entry.cpu != null) {
          orgCpuMap.set(org, (orgCpuMap.get(org) || 0) + entry.cpu);
        }
      });

      const orgValsAll = [];
      orgGpuMap.forEach((gpuSum, org) => {
        if (orgCpuMap.has(org)) {
          orgValsAll.push({ org, gpu: gpuSum, cpu: orgCpuMap.get(org) });
        }
      });
      const orgVals = orgValsAll.filter((e) => e.gpu > threshold.value && e.cpu > threshold.value);
      orgTotal.value = orgVals.length;
      orgOmitted.value = orgValsAll.length - orgVals.length;
      orgTop.value = [...orgVals].sort((a, b) => b.gpu - a.gpu).slice(0, 10);
      orgFullVals.value = orgVals;

      hasNamespacePlot.value = renderPlot({
        targetId: "log-plot-namespace",
        vals: namespaceVals,
        titlePrefix: "NRP namespace usage",
        labelField: "namespace",
        showTextLabels: false,
      });

      hasNamespaceLabelsPlot.value = renderPlot({
        targetId: "log-plot-namespace-labels",
        vals: namespaceVals,
        titlePrefix: "NRP namespace usage (all labels)",
        labelField: "namespace",
        showTextLabels: true,
      });

      hasOrgPlot.value = renderPlot({
        targetId: "log-plot-org",
        vals: orgVals,
        titlePrefix: "NRP organization usage",
        labelField: "org",
        showTextLabels: true,
      });
    } catch (err) {
      if (token !== requestToken) return;
      errorMessage.value = `Failed to load usage data: ${err.message}`;
    } finally {
      if (token === requestToken) isLoading.value = false;
    }
  }

  onMounted(() => {
    fetchAndRender();
  });
</script>

<style>
  #log-plot-namespace svg,
  #log-plot-namespace-labels svg,
  #log-plot-org svg {
    width: 100%;
    height: auto;
  }

  /* #log-plot-2 text {
    stroke: white;
  } */
  /* html.dark #log-plot tip {
    stroke: black;
  } */
  </style>
