<template>
  <Toast />
  <div v-if="!user">
    <center>Please log in to see your namespaces.</center>
  </div>
  <div v-if="isNoNamespaces">
    <center>You don't have assigned namespaces yet.</center>
  </div>
  <div v-if="user" id="plot" class="flex justify-between flex-col sm:flex-row max-w-6xl mx-auto mt-0 mb-2 px-4 sm:px-6"></div>
  <NamespaceAdminEdit :selectedNamespace="selectedNamespace" v-if="selectedNamespace" :key="selectedNamespace.Name"/>
</template>
  
<script setup>
  import {ref, onMounted} from 'vue';

  import * as Plot from '@observablehq/plot';
  import * as d3 from 'd3';
  import NamespaceAdminEdit from './NamespaceAdminEdit.vue';

  import { useStore } from '@nanostores/vue';
  import { userStore } from '../../auth.ts';

  import { RequestManager, HTTPTransport, Client } from "@open-rpc/client-js";
  const baseUrl = import.meta.env.PUBLIC_SVC_URL;
  const transport = new HTTPTransport(baseUrl+"/rpc",
    {
      credentials: 'include',
    },
  );
  const selectedNamespace = ref(null);

  let isNoNamespaces = ref(false);

  const user = useStore(userStore);

  onMounted(async () => {
    const client = new Client(new RequestManager([transport]));
    const namespaces = await client.request({method: "groups.ListUserGroups"});

    isNoNamespaces.value = namespaces.length == 0;

    const plot = Plot.plot({
      width: 1200,
      margin: 10,
      marginLeft: 80,
      marginRight: 360,
      style: "font-size: 1em",
      axis: null,
      marks: [
        // Plot.link(namespaces.Namespaces, Plot.treeLink({
        //   path: "Name", 
        //   delimiter: "/"
        // })),
        // Plot.dot(namespaces.Namespaces, Plot.treeNode({
        //   path: "Name", 
        //   delimiter: "/"
        // })),
        // Plot.text(namespaces.Namespaces, Plot.treeNode({
        //   path: "Name", 
        //   delimiter: "/", 
        //   text: "node:name", 
        //   dx: 6, dy: -4})),
      

        Plot.tree(namespaces.Namespaces, {
          path: "Name", 
          delimiter: "/",
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
    .data(namespaces.Namespaces, function(d) {
      if(d.Name) {
        return d.Name;
      } else {
        return this.querySelector('title').textContent;
      }
    })
    .on("click", function (event, d) {
      if (d.IsMember) {
        console.log("click", d);
        selectedNamespace.value = d;
      }
      // plot.value = data[i];
      // plot.dispatchEvent(new CustomEvent("input"));
    }).style("cursor", function(d) {
      if (d.IsMember) {
        return "pointer";
      }
    }).style("fill", function(d) {
      if (d.IsK8sNamespace && d.IsLiteLLMOrg) {
        return "green";
      } else if (d.IsK8sNamespace) {
        return "blue";
      } else if (d.IsLiteLLMOrg) {
        return "orange";
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

    const div = document.querySelector("#plot");
    div.append(plot);
  });


</script>