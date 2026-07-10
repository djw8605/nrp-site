<template>
  <VueSpinnerPie v-if="isLoading" size="40" style="z-index: 10; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);" color="red" />
  <div id="log-plot" class="flex justify-between flex-col sm:flex-row max-w-6xl mx-auto mt-0 mt-4 mb-2 px-4 sm:px-6"></div>
  <div class="text-center mt-10 mb-3">Total namespaces: {{total}}, omitted: {{ omitted }}, period: {{period}}</div>
</template>
  
<script setup>
  import {ref, onMounted} from 'vue';

  import {VueSpinnerPie} from 'vue3-spinners';

  import * as Plot from '@observablehq/plot';

  var total = ref(0);
  var omitted = ref(0);

  const props = defineProps(['period'])

  const isLoading = ref(false);

  onMounted(async () => {
    isLoading.value = true;

    const gpu_req = fetch(
      "https://thanos.nrp-nautilus.io/api/v1/query?query=sum_over_time(namespace_gpu_usage["+props.period+":1h])>100"
    );
    
    const cpu_req = fetch(
      "https://thanos.nrp-nautilus.io/api/v1/query?query=sum_over_time(namespace_cpu_usage["+props.period+":1h])>100"
    );
    
    const [gpu_resp, cpu_resp] = await Promise.all([
      gpu_req,
      cpu_req
    ]);

    const [gpu, cpu] = await Promise.all([
      gpu_resp.json(),
      cpu_resp.json(),
    ]);

    const gpu_map = new Map(
      gpu.data.result.map((element) => [
        element.metric.namespace,
        parseInt(element.value[1])
      ])
    );

    const cpu_map = new Map(
      cpu.data.result.map((element) => [
        element.metric.namespace,
        parseInt(element.value[1])
      ])
    );

    const vals = [];
    gpu_map.forEach((val, key) => {
      if(cpu_map.has(key) && key != "gpu-mon" && key != "kube-system" && key != "default" && key != "gpu-operator") {
        vals.push({
          namespace: key,
          gpu: gpu_map.get(key),
          cpu: cpu_map.get(key),
        });
        total.value++;
      }
    });

    const plot = Plot.plot({
      width: 1200,
      height: 1200,
      inset: 8,
      grid: true,
      style: "font-size: 0.7em",
      color: {
        legend: false,
        scheme: "Warm",
      },
      marks: [
        Plot.dot(vals, {
          x: "cpu",
          y: "gpu",
          stroke: "gpu",
          fill: "gpu",
          strokeWidth: 1,
          title: (d) => d.namespace,
        }),
        Plot.axisX({
          label: "CPU Usage",
          grid: true,
          ticks: [10, 100, 1000, 10000, 100000, 1000000],
          // inset: 10,
        }),
        Plot.axisY({
          label: "GPU Usage",
          grid: true,
          ticks: [10, 100, 1000, 10000, 100000],
          // inset: 10,
        }),
        Plot.text(vals, {
          x: "cpu",
          y: "gpu",
          text: (d) => d.namespace,
          dy: -14,         // Offset the text slightly above the point
          fill: "currentColor",
          fontSize: 12
        }),
      ],
      x: {
        type: "log",
        base: 10,
        ticks: [10, 100, 1000, 10000, 100000, 1000000],
      },
      y: {
        type: "log",
        base: 10,
        ticks: [10, 100, 1000, 10000, 100000],
      },
    });

    const div = document.querySelector("#log-plot");
    div.append(plot);
    isLoading.value = false;

    const gpu_req_omit = fetch(
      "https://thanos.nrp-nautilus.io/api/v1/query?query=sum_over_time(namespace_gpu_usage["+props.period+":1h])<1000"
    );
    
    const cpu_req_omit = fetch(
      "https://thanos.nrp-nautilus.io/api/v1/query?query=sum_over_time(namespace_cpu_usage["+props.period+":1h])<1000"
    );

    const [gpu_resp_omit, cpu_resp_omit] = await Promise.all([
      gpu_req_omit,
      cpu_req_omit
    ]);

    const [gpu_omit, cpu_omit] = await Promise.all([
      gpu_resp_omit.json(),
      cpu_resp_omit.json(),
    ]);

    const gpu_map_omit = new Map(
      gpu_omit.data.result.map((element) => [
        element.metric.namespace,
        parseInt(element.value[1])
      ])
    );

    const cpu_map_omit = new Map(
      cpu_omit.data.result.map((element) => [
        element.metric.namespace,
        parseInt(element.value[1])
      ])
    );

    gpu_map_omit.forEach((val, key) => {
      omitted.value ++;
    });

    cpu_map_omit.forEach((val, key) => {
      if (!gpu_map_omit.has(key)) {
        omitted.value ++;
      }
    });

    cpu_map.forEach((val, key) => {
      if (!gpu_map.has(key)) {
        omitted.value ++;
      }
    });

    gpu_map.forEach((val, key) => {
      if (!cpu_map.has(key)) {
        omitted.value ++;
      }
    });
  });


</script>

<style>
  /* #log-plot-2 text {
    stroke: white;
  } */
  /* html.dark #log-plot tip {
    stroke: black;
  } */
  </style>