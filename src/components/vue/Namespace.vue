<template>
  <section class="bg-blue-50 dark:bg-slate-800 not-prose">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-1 mb-4 text-md text-center font-medium">
        <a href="/documentation/userdocs/start/hierarchy">Read more</a>
    </div>
  </section>
  <div v-if="!user" class="mx-auto flex max-w-sm items-center gap-x-4 rounded-xl bg-white p-6 shadow-lg outline outline-black/5 dark:bg-slate-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">Please log in to see your namespaces.</div>
  <NamespacesTree v-if="user" v-model="selectedNamespace" :key="treeRedraw"></NamespacesTree>
  <NamespaceAdminEdit @onNSChanged="onNSChanged" :selectedNamespace="selectedNamespace" v-if="selectedNamespace" :key="selectedNamespace.Name"/>
</template>
  
<script setup>
  import {ref, onMounted} from 'vue';

  import NamespaceAdminEdit from './NamespaceAdminEdit.vue';
  import NamespacesTree from './NamespacesTree.vue';

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

  const treeRedraw = ref(0);

  const user = useStore(userStore);

  const onNSChanged = () => {
    treeRedraw.value++;
  };

</script>
