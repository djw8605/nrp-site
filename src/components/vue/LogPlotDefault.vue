<template>
  <VueSpinnerPie v-if="isLoading" size="40" style="z-index: 10; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);" color="red" />
  <div id="log-plot" class="flex justify-between flex-col sm:flex-row max-w-6xl mx-auto mt-0 mb-2 px-4 sm:px-6"></div>
</template>
  
<script setup>
  import {ref, onMounted} from 'vue';

  import {VueSpinnerPie} from 'vue3-spinners';

  import * as Plot from '@observablehq/plot';
  import * as d3 from 'd3';

  const isLoading = ref(false);

  const props = defineProps(['period'])

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
      if(key != "gpu-mon" && key != "kube-system" && key != "default") {
        vals.push({
          namespace: key,
          gpu: gpu_map.get(key),
          cpu: cpu_map.get(key),
        });
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
          // inset: 10,
        }),
        Plot.axisY({
          label: "GPU Usage",
          grid: true,
          // inset: 10,
        }),        
        Plot.tip(vals, Plot.pointer({
          x: "cpu",
          y: "gpu",
          title: (d) => d.namespace,
          // stroke: "black",
          // fill: "black",
        }),
      ),
      ],
      x: {
        type: "log",
        base: 10,
        tickValues: [10, 100, 1000, 10000, 100000, 1000000],
      },
      y: {
        type: "log",
        base: 10,
        tickValues: [10, 100, 1000, 10000, 100000],
      },
    });

    const div = document.querySelector("#log-plot");
    div.append(plot);
    isLoading.value = false;
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