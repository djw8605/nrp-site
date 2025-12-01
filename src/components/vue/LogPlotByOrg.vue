<template>
  <VueSpinnerPie v-if="isLoading" size="40" style="z-index: 10; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);" color="red" />
  <div id="log-plot" class="flex justify-between flex-col sm:flex-row max-w-6xl mx-auto mt-0 mt-4 mb-2 px-4 sm:px-6"></div>
  <div class="text-center mt-10 mb-3">Total orgs: {{total}}, omitted: {{ omitted }}, period: {{period}}</div>
</template>
  
<script setup>
  import {ref, onMounted} from 'vue';

  import {VueSpinnerPie} from 'vue3-spinners';

  import * as Plot from '@observablehq/plot';

  var total = ref(0);
  var omitted = ref(0);

  const props = defineProps(['period'])

  const isLoading = ref(false);

  const fetchNamespaceInfo = async () => {
      try {
          const { HTTPTransport, Client, RequestManager } = await import('@open-rpc/client-js');
          const baseUrl = import.meta.env.PUBLIC_SVC_URL || "https://portal.nrp.ai";
          const transport = new HTTPTransport(`${baseUrl}/rpc`);
          const client = new Client(new RequestManager([transport]));
          const result = await client.request({method: 'guest.ListNsInfo', params: {}});
          console.log('Namespace RPC result:', result);
          return result?.Namespaces || [];
      } catch (error) {
          console.error('Error fetching namespace info:', error);
          return [];
      }
  };

  onMounted(async () => {
    isLoading.value = true;

    const namespaceInfo = await fetchNamespaceInfo().catch(() => {
      console.warn('Namespace info unavailable, continuing with empty data');
      return [];
    });

    const ns_map = new Map(
      namespaceInfo.map((element) => [
        element.Name,
        element
      ])
    );

    const gpu_req = fetch(
      "https://thanos.nrp-nautilus.io/api/v1/query?query=sum_over_time(namespace_gpu_usage["+props.period+":1h])"
    );
    
    const cpu_req = fetch(
      "https://thanos.nrp-nautilus.io/api/v1/query?query=sum_over_time(namespace_cpu_usage["+props.period+":1h])"
    );
    
    const [gpu_resp, cpu_resp] = await Promise.all([
      gpu_req,
      cpu_req
    ]);

    const [gpu, cpu] = await Promise.all([
      gpu_resp.json(),
      cpu_resp.json(),
    ]);

    const gpu_org_map = new Map();
    gpu.data.result.forEach((element) => {
      const namespace = element.metric.namespace;
      var org = ns_map.has(namespace) ? ns_map.get(namespace).Institution : "Unknown";
      if (!org || org === "") {
        org = "Unknown: "+namespace;
      }
      gpu_org_map.set(org, (gpu_org_map.get(org) || 0) + parseInt(element.value[1]));
    });

    const cpu_org_map = new Map();
    cpu.data.result.forEach((element) => {
      const namespace = element.metric.namespace;
      var org = ns_map.has(namespace) ? ns_map.get(namespace).Institution : "Unknown";
      if (!org || org === "") {
        org = "Unknown: "+namespace;
      }
      cpu_org_map.set(org, (cpu_org_map.get(org) || 0) + parseInt(element.value[1]));
    });

    const vals = [];
    gpu_org_map.forEach((val, key) => {
      if(cpu_org_map.has(key) && key != "gpu-mon" && key != "kube-system" && key != "default") {
        if(gpu_org_map.get(key) > 1000 && cpu_org_map.get(key) > 1000) {
          vals.push({
            org: key,
            gpu: gpu_org_map.get(key),
            cpu: cpu_org_map.get(key),
          });
          total.value++;
        } else {
          omitted.value++;
        }
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
          title: (d) => d.org,
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
        Plot.text(vals, {
          x: "cpu",
          y: "gpu",
          text: (d) => d.org,
          dy: -14,         // Offset the text slightly above the point
          fill: "currentColor",
          fontSize: 10          
        }),
      ],
      x: {
        type: "log",
        base: 10,
      },
      y: {
        type: "log",
        base: 10,
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