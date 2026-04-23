<template>
  <div v-if="isNoNamespaces">
    <div class="mx-auto max-w-sm items-center gap-x-4 rounded-xl bg-white p-6 shadow-lg outline outline-black/5 dark:bg-slate-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
      You don't have assigned namespaces yet.
      Please refer to <a class="text-blue-500 hover:text-blue-700 font-bold cursor-pointer" href="/documentation/userdocs/start/getting-started">documentation</a> on how to join a namespace or create a new one.
    </div>
  </div>
  <VueSpinnerPie v-if="isTreeLoading" size="40" style="z-index: 10; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);" color="red" />
  <div v-if="user && !isNoNamespaces && filteredCount === 0 && !isTreeLoading" class="mx-auto max-w-md text-center text-surface-500 dark:text-surface-400 py-4">
    No namespaces match "<span class="font-semibold">{{ filter }}</span>".
  </div>
  <div v-if="user" id="graph-plot" class="flex justify-between flex-col sm:flex-row max-w-6xl mx-auto mt-0 mb-2 px-4 sm:px-6"></div>
</template>

<script setup>
  import {ref, onMounted, watch} from 'vue';

  import {VueSpinnerPie} from 'vue3-spinners';

  import * as Plot from '@observablehq/plot';
  import * as d3 from 'd3';

  import { useStore } from '@nanostores/vue';
  import { userStore } from '../../auth.ts';

  import { RequestManager, HTTPTransport, Client } from "@open-rpc/client-js";
  const baseUrl = import.meta.env.PUBLIC_SVC_URL;
  const transport = new HTTPTransport(baseUrl+"/rpc",
    {
      credentials: 'include',
    },
  );

  const selectedNamespace = defineModel();

  const props = defineProps({
    filter: {
      type: String,
      default: '',
    },
  });

  const emit = defineEmits(['update:matchCount', 'namespaces-loaded']);

  let isNoNamespaces = ref(false);
  const filteredCount = ref(0);

  const user = useStore(userStore);

  const isTreeLoading = ref(false);
  const allNamespaces = ref([]);

  // Filter namespaces by the search string. A match includes the matched
  // namespace and all of its ancestors so the tree path remains intact.
  const computeFiltered = (namespaces, filter) => {
    const trimmed = (filter || '').trim().toLowerCase();
    if (!trimmed) return namespaces.slice();
    const matched = namespaces.filter(n => n.Name && n.Name.toLowerCase().includes(trimmed));
    const keep = new Set();
    for (const n of matched) {
      const parts = n.Name.split('/');
      for (let i = 1; i <= parts.length; i++) {
        keep.add(parts.slice(0, i).join('/'));
      }
    }
    return namespaces.filter(n => keep.has(n.Name));
  };

  const renderTree = () => {
    const div = document.querySelector("#graph-plot");
    if (!div) return;
    div.innerHTML = '';

    const filtered = computeFiltered(allNamespaces.value, props.filter);
    filteredCount.value = filtered.length;
    emit('update:matchCount', filtered.length);

    if (filtered.length === 0) return;

    const calculatedHeight = filtered.length * 15;

    const plot = Plot.plot({
      width: 1600,
      height: calculatedHeight,
      margin: 10,
      marginLeft: 80,
      marginRight: 360,
      style: "font-size: 1em",
      axis: null,
      marks: [
        Plot.tree(filtered, {
          path: "Name",
          delimiter: "/",
          treeSort: "node:name",
          title: d => d.Name,
          symbol: node => {
            if (node.IsK8sNamespace && node.IsLiteLLMOrg) {
              return "hexagon";
            } else if (node.IsK8sNamespace) {
              return "square";
            } else if (node.IsLiteLLMOrg) {
              return "triangle-up";
            } else {
              return "circle";
            }
          },
        }),
      ],
    });

    d3.select(plot)
    .selectAll("text")
    .data(filtered, function(d) {
      if(d.Name) {
        return d.Name;
      } else {
        return this.querySelector('title').textContent;
      }
    })
    .on("click", function (event, d) {
      selectedNamespace.value = d;
    }).style("cursor", function(d) {
      return "pointer";
    }).style("fill", function(d) {
      if (d.IsK8sNamespace && d.IsLiteLLMOrg) {
        return "green";
      } else if (d.IsK8sNamespace) {
        return "blue";
      } else if (d.IsLiteLLMOrg) {
        return "orange";
      } else if (d.IsMilvusDB) {
        return "violet";
      } else {
        return "red";
      }
    }).style("font-weight", function(d) {
      if (d.IsMember) {
        return "bold";
      }
    }).style("font-size", function(d) {
      if (d.IsMember) {
        return "1em";
      }
    });

    div.append(plot);
  };

  onMounted(() => {
    isTreeLoading.value = true;
    const client = new Client(new RequestManager([transport]));
    client.request({method: "groups.ListUserGroups"}).then((namespaces) => {
      isNoNamespaces.value = namespaces.Namespaces == null || namespaces.Namespaces.length == 0;
      if (isNoNamespaces.value) {
        isTreeLoading.value = false;
        return;
      }

      allNamespaces.value = namespaces.Namespaces;
      emit('namespaces-loaded', namespaces.Namespaces);
      renderTree();
      isTreeLoading.value = false;
    });

  });

  watch(() => props.filter, () => {
    if (allNamespaces.value.length > 0) {
      renderTree();
    }
  });


</script>

<style>
  #graph-plot text {
    stroke: white;
  }
  html.dark #graph-plot text {
    stroke: black;
  }
  </style>
