<template>
  <section class="bg-blue-50 dark:bg-slate-800 not-prose">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-1 mb-4 text-md text-center font-medium">
        <a href="/documentation/userdocs/start/hierarchy">Read more</a>
    </div>
  </section>
  <div v-if="!user" class="mx-auto flex max-w-sm items-center gap-x-4 rounded-xl bg-white p-6 shadow-lg  dark:bg-slate-800 dark:shadow-none">Please log in to see your namespaces.</div>
  <div v-if="user" ref="topRef" class="sticky top-[72px] z-20 bg-page border-b border-surface-200 dark:border-surface-700 py-2">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center gap-2">
      <IconField class="flex-1">
        <InputIcon class="pi pi-search" />
        <InputText
          v-model="search"
          placeholder="Filter namespaces..."
          class="w-full"
          fluid
          aria-label="Filter namespaces"
        />
        <InputIcon
          v-if="search"
          class="pi pi-times cursor-pointer"
          style="right: 0.75rem; left: auto;"
          role="button"
          aria-label="Clear filter"
          @click="search = ''"
        />
      </IconField>
      <span v-if="search" class="text-sm text-surface-500 dark:text-surface-400 whitespace-nowrap">
        {{ matchCount }} match{{ matchCount === 1 ? '' : 'es' }}
      </span>
    </div>
  </div>
  <NamespacesTree
    v-if="user"
    v-model="selectedNamespace"
    :filter="search"
    @update:matchCount="matchCount = $event"
    @namespaces-loaded="onNamespacesLoaded"
    :key="treeRedraw"
  ></NamespacesTree>
  <div ref="detailRef">
    <NamespaceAdminEdit @onNSChanged="onNSChanged" :selectedNamespace="selectedNamespace" v-if="selectedNamespace" :key="selectedNamespace.Name"/>
  </div>
  <Button
    v-if="showBackToTop"
    icon="pi pi-arrow-up"
    severity="secondary"
    rounded
    raised
    aria-label="Back to top"
    class="back-to-top"
    @click="scrollToTop"
  />
</template>

<script setup>
  import {ref, nextTick, watch, onMounted, onUnmounted} from 'vue';

  import NamespaceAdminEdit from './NamespaceAdminEdit.vue';
  import NamespacesTree from './NamespacesTree.vue';

  import IconField from 'primevue/iconfield';
  import InputIcon from 'primevue/inputicon';
  import InputText from 'primevue/inputtext';
  import Button from 'primevue/button';

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
  const search = ref('');
  const matchCount = ref(0);
  const topRef = ref(null);
  const detailRef = ref(null);
  const showBackToTop = ref(false);

  const treeRedraw = ref(0);

  const user = useStore(userStore);

  const onNSChanged = () => {
    treeRedraw.value++;
  };

  // Site header is ~72px; add the sticky search bar's height when scrolling to
  // the detail panel so it isn't hidden behind either.
  const SITE_HEADER_OFFSET = 80;

  const scrollToDetail = (el) => {
    if (!el) return;
    const stickyHeight = topRef.value ? topRef.value.offsetHeight : 0;
    const top = el.getBoundingClientRect().top + window.scrollY - SITE_HEADER_OFFSET - stickyHeight;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const QUERY_KEY = 'ns';

  const updateUrlForNamespace = (name) => {
    const url = new URL(window.location.href);
    if (name) {
      url.searchParams.set(QUERY_KEY, name);
    } else {
      url.searchParams.delete(QUERY_KEY);
    }
    window.history.replaceState({}, '', url);
  };

  const onNamespacesLoaded = (namespaces) => {
    // Only apply URL selection on initial load, not on redraws after edits.
    if (selectedNamespace.value) return;
    const params = new URLSearchParams(window.location.search);
    const wanted = params.get(QUERY_KEY);
    if (!wanted) return;
    const match = namespaces.find(n => n.Name === wanted);
    if (match) selectedNamespace.value = match;
  };

  watch(selectedNamespace, (ns) => {
    updateUrlForNamespace(ns ? ns.Name : null);
    if (!ns) return;
    nextTick(() => scrollToDetail(detailRef.value));
  });

  const onScroll = () => {
    showBackToTop.value = window.scrollY > 400;
  };

  onMounted(() => {
    window.addEventListener('scroll', onScroll, { passive: true });
  });

  onUnmounted(() => {
    window.removeEventListener('scroll', onScroll);
  });

</script>

<style scoped>
  .back-to-top {
    position: fixed;
    right: 1.5rem;
    bottom: 1.5rem;
    z-index: 50;
  }
</style>
