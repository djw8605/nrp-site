<template>
  <Toast />
  <section v-if="!user" class="ns-panel grid max-w-xl gap-4 p-6 md:p-8" aria-labelledby="ns-h1">
    <h1 id="ns-h1" class="font-display text-h2 font-bold text-heading">Namespaces</h1>
    <p class="text-body">Log in to see the namespaces you belong to and manage who has access to them.</p>
    <div><a class="btn-primary !px-5 !py-2 text-sm" :href="loginUrl()">Log in</a></div>
  </section>

  <div v-else-if="loading" class="ns-panel grid gap-3 p-6" aria-busy="true">
    <h1 class="font-display text-h2 font-bold text-heading">Namespaces</h1>
    <p class="text-sm text-muted" role="status">Loading your namespaces…</p>
    <div v-for="i in 4" :key="i" class="h-10 animate-pulse rounded-md bg-surface-2 motion-reduce:animate-none"></div>
  </div>

  <section v-else-if="loadError" class="ns-panel grid max-w-xl gap-3 p-6" aria-labelledby="ns-h1">
    <h1 id="ns-h1" class="font-display text-h2 font-bold text-heading">Namespaces</h1>
    <p class="text-body" role="alert">Could not load your namespaces: {{ loadError }}</p>
    <div><button type="button" class="btn-secondary !px-4 !py-2 text-sm" @click="load">Try again</button></div>
  </section>

  <section v-else-if="index.byPath.size === 0" class="ns-panel grid max-w-xl gap-5 p-6 md:p-10" aria-labelledby="ns-h1">
    <h1 id="ns-h1" class="font-display text-h2 font-bold text-heading">Namespaces</h1>
    <div class="grid gap-3">
      <h2 class="font-display text-h4 font-semibold text-heading">You are not in any namespaces yet</h2>
      <p class="text-body">
        A namespace is where your work runs on the NRP, and its admins decide who can use it. To join one, ask its
        admin, usually your PI or course instructor, to add you. Give them the email you sign in with:
        <span class="font-mono text-sm text-heading">{{ user.email }}</span>
      </p>
      <p class="text-body">If you were sent a join link for a training, open it and you are added automatically.</p>
      <p class="text-body">
        Starting a new research group or course? Ask in the support chat and an NRP admin will set up a namespace with
        you.
      </p>
    </div>
    <div class="flex flex-wrap gap-3">
      <a class="btn-primary !px-5 !py-2 text-sm" href="/contact">Ask in the support chat</a>
      <a class="btn-secondary !px-5 !py-2 text-sm" href="/documentation/userdocs/start/hierarchy"
        >How namespaces are organized</a
      >
    </div>
  </section>

  <div
    v-else
    class="grid grid-cols-[minmax(0,1fr)] rounded-lg border border-hairline lg:grid-cols-[19rem_minmax(0,1fr)]"
  >
    <aside
      class="rounded-lg border-hairline bg-surface-1 lg:block lg:rounded-r-none lg:border-r"
      :class="selected ? 'hidden' : 'block'"
      aria-label="Namespaces"
    >
      <h1 v-if="!selected" class="px-3 pt-4 font-display text-h3 font-bold text-heading lg:sr-only">Namespaces</h1>
      <NamespaceList
        :index="index"
        :selected="selected"
        :default-view="userInfo.IsNrpAdmin ? 'tree' : 'mine'"
        @select="select"
      />
    </aside>

    <div class="min-w-0 bg-surface-page lg:rounded-r-lg" :class="selected ? 'block' : 'hidden lg:block'">
      <NamespaceDetail
        v-if="selected && index.byPath.has(selected)"
        :key="selected"
        :path="selected"
        :index="index"
        :is-admin="!!userInfo.IsAdmin"
        :is-nrp-admin="!!userInfo.IsNrpAdmin"
        :me="user.email"
        :initial-tab="initialTab"
        :notice="notice"
        @select="select"
        @tab="onTab"
        @changed="load"
        @deleted="onDeleted"
        @back="select(null)"
      />
      <section v-else class="hidden gap-3 p-7 lg:grid" aria-labelledby="ns-pick">
        <h2 id="ns-pick" class="font-display text-h3 font-semibold text-heading">Choose a namespace</h2>
        <p class="max-w-xl text-body">
          Pick a namespace from the list to see its members, join links and subgroups. Namespaces you belong to are
          under
          <span class="font-semibold text-heading">Mine</span>; the whole hierarchy you can see is under
          <span class="font-semibold text-heading">Tree</span>.
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useStore } from '@nanostores/vue';
import Toast from 'primevue/toast';
import { userStore } from '../../../auth.ts';
import NamespaceList from './NamespaceList.vue';
import NamespaceDetail from './NamespaceDetail.vue';
import { buildIndex, leaf, loginUrl, rpc, type GroupNode } from './model';

const user = useStore(userStore);

const groups = ref<GroupNode[]>([]);
const userInfo = ref<{ IsAdmin?: boolean; IsNrpAdmin?: boolean }>({});
const loading = ref(true);
const loadError = ref('');
const index = computed(() => buildIndex(groups.value));

const params = new URLSearchParams(window.location.search);
const selected = ref<string | null>(params.get('ns'));
const initialTab = ref(params.get('tab') ?? 'members');
const notice = ref('');

const writeUrl = (ns: string | null, tab: string | null) => {
  const url = new URL(window.location.href);
  if (ns) url.searchParams.set('ns', ns);
  else url.searchParams.delete('ns');
  if (ns && tab && tab !== 'members') url.searchParams.set('tab', tab);
  else url.searchParams.delete('tab');
  window.history.replaceState({}, '', url);
};

const select = (path: string | null) => {
  if (path !== selected.value) notice.value = '';
  selected.value = path;
  initialTab.value = 'members';
  writeUrl(path, null);
  window.scrollTo({ top: 0 });
};
const onTab = (tab: string) => writeUrl(selected.value, tab);
const onDeleted = (deletedPath: string, parent: string) => {
  notice.value = `Deleted ${leaf(deletedPath)}.`;
  selected.value = parent || null;
  initialTab.value = 'subgroups';
  writeUrl(selected.value, 'subgroups');
  load();
};

let loadSeq = 0;
const load = async () => {
  if (!user.value) return;
  const seq = ++loadSeq;
  loadError.value = '';
  try {
    const [g, info] = await Promise.all([
      rpc.request({ method: 'groups.ListUserGroups' }),
      rpc.request({ method: 'user.GetUserInfo', params: { UserID: '' } }).catch(() => ({})),
    ]);
    if (seq !== loadSeq) return;
    groups.value = g?.Namespaces ?? [];
    userInfo.value = info ?? {};
  } catch (err: unknown) {
    if (seq === loadSeq) loadError.value = err instanceof Error ? err.message : String(err);
  } finally {
    if (seq === loadSeq) loading.value = false;
  }
};

watch(
  user,
  (u) => {
    if (u) load();
  },
  { immediate: true }
);
</script>

<style>
/* Shared namespaces-page styles. Colors come only from --nrp-* tokens (DESIGN.md §2). */
.ns-panel {
  border: 1px solid var(--nrp-border-hairline);
  border-radius: 0.5rem;
  background: var(--nrp-surface-page);
}
.ns-field {
  border-radius: 0.375rem;
  background: var(--nrp-surface-page);
  box-shadow: inset 0 0 0 1px var(--nrp-text-muted);
}
.ns-field:focus-within {
  box-shadow: inset 0 0 0 2px var(--nrp-ring);
}
.ns-segment {
  display: inline-flex;
  overflow: hidden;
  border-radius: 0.375rem;
  box-shadow: inset 0 0 0 1px var(--nrp-text-muted);
  font-size: 0.8125rem;
}
.ns-segment button {
  padding: 0.3rem 0.75rem;
  color: var(--nrp-text-muted);
}
.ns-segment button[aria-checked='true'] {
  background: var(--nrp-teal-700);
  color: #fff;
  font-weight: 600;
}
html.dark .ns-segment button[aria-checked='true'] {
  background: var(--nrp-teal-400);
  color: var(--nrp-teal-950);
}
.ns-segment button:focus-visible,
.ns-row:focus-visible,
.ns-tab:focus-visible {
  outline: 2px solid var(--nrp-ring);
  outline-offset: -2px;
}
.ns-row:hover {
  background: var(--nrp-surface-2);
}
.ns-row.is-selected {
  background: var(--nrp-surface-3);
}
.ns-row.is-selected .font-mono:first-child,
.ns-row.is-selected > .ns-tree-name {
  font-weight: 700;
}
/* The name keeps its full width and never shares a line it would have to be
   cut to fit. A name wider than the row wraps, at its dashes first, and is never
   truncated. 1.75rem is the expand button plus its gap. */
.ns-tree-name {
  flex: 1 0 auto;
  max-width: calc(100% - 1.75rem);
}
.ns-tree-name,
.ns-name {
  overflow-wrap: anywhere;
}
.ns-row.is-context {
  opacity: 0.72;
}
.ns-hit {
  background: none;
  color: inherit;
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.ns-chip {
  display: inline-flex;
  align-items: center;
  border: 1px solid currentColor;
  border-radius: 9999px;
  padding: 0 0.45rem;
  font-family: var(--nrp-font-sans);
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.25rem;
  color: var(--nrp-teal-700);
}
html.dark .ns-chip {
  color: var(--nrp-teal-300);
}
/* Tighter chips for the tree, where rows are narrow and indented. */
.ns-chip-tight {
  padding: 0 0.3rem;
  line-height: 1.125rem;
}
.ns-chip.is-off {
  color: var(--nrp-text-muted);
}
</style>
