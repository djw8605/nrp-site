<template>
  <section class="p-5 md:p-7" aria-labelledby="ns-name">
    <p v-if="notice" class="mb-4 rounded-md bg-surface-2 px-3 py-2 text-sm text-heading" role="status">{{ notice }}</p>

    <nav class="flex flex-wrap items-center gap-x-1 text-sm text-muted" aria-label="Breadcrumb">
      <a class="link-quiet" href="/namespaces" @click.prevent="$emit('back')">Namespaces</a>
      <template v-for="a in crumbs" :key="a">
        <span class="mx-1" aria-hidden="true">/</span>
        <a
          class="font-mono text-sm text-muted underline underline-offset-2 hover:text-link"
          :href="`?ns=${encodeURIComponent(a)}`"
          @click.prevent="$emit('select', a)"
          >{{ leaf(a) }}</a
        >
      </template>
    </nav>

    <div class="mt-1.5 flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
      <div class="grid min-w-0 gap-2.5">
        <div class="flex flex-wrap items-center gap-2">
          <h1 id="ns-name" class="min-w-0 break-all font-mono text-h2 font-semibold text-heading">{{ name }}</h1>
          <button type="button" class="ns-copy" :aria-label="`Copy the name ${name}`" @click="copyName">
            {{ copied ? 'Copied' : 'Copy name' }}
          </button>
        </div>
        <div class="flex flex-wrap items-center gap-1.5">
          <span v-for="f in FEATURES" :key="f.key" class="ns-chip" :class="{ 'is-off': !featureOn(f.key) }">
            {{ f.label }}<template v-if="!featureOn(f.key)">&nbsp;off</template>
          </span>
          <span v-if="featureOn('is_milvus_db')" class="ns-chip">Milvus</span>
          <button
            v-if="canManage && offFeatures.length"
            type="button"
            class="link-quiet ml-1 text-sm"
            @click="setTab('details')"
          >
            Enable {{ offFeatures.length === 1 ? offFeatures[0].label : 'features' }}
          </button>
        </div>
      </div>
      <span class="rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-heading">{{ accessLabel }}</span>
    </div>

    <dl class="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-y border-hairline py-4 text-sm sm:grid-cols-3">
      <div>
        <dt class="text-xs text-muted">PI</dt>
        <dd class="font-medium text-heading">{{ info.pi || '—' }}</dd>
      </div>
      <div>
        <dt class="text-xs text-muted">Institution</dt>
        <dd class="font-medium text-heading">{{ info.institution || '—' }}</dd>
      </div>
      <div>
        <dt class="text-xs text-muted">Grant</dt>
        <dd class="font-mono text-sm text-heading">{{ info.grant || '—' }}</dd>
      </div>
    </dl>

    <template v-if="canManage">
      <div class="mt-4 sm:hidden">
        <label for="ns-section" class="text-xs text-muted">Section</label>
        <select
          id="ns-section"
          class="ns-field mt-1 block w-full px-3 py-2.5 text-sm text-heading"
          :value="tab"
          @change="setTab(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="t in tabs" :key="t.id" :value="t.id">{{ t.label }}{{ t.count ? ` (${t.count})` : '' }}</option>
        </select>
      </div>
      <div
        class="mt-4 hidden gap-6 overflow-x-auto border-b border-hairline text-sm sm:flex"
        role="tablist"
        aria-label="Namespace sections"
        @keydown="onTabKey"
      >
        <button
          v-for="t in tabs"
          :id="`ns-tab-${t.id}`"
          :key="t.id"
          type="button"
          role="tab"
          class="ns-tab -mb-px whitespace-nowrap border-b-2 pb-2.5 pt-1"
          :class="
            t.id === tab
              ? 'border-teal-700 font-semibold text-heading dark:border-teal-300'
              : 'border-transparent text-muted hover:text-heading'
          "
          :aria-selected="t.id === tab"
          :aria-controls="`ns-panel-${t.id}`"
          :tabindex="t.id === tab ? 0 : -1"
          @click="setTab(t.id)"
        >
          {{ t.label }}<span v-if="t.count" class="ml-1 text-xs text-muted">{{ t.count }}</span>
        </button>
      </div>

      <div :id="`ns-panel-${tab}`" role="tabpanel" :aria-labelledby="`ns-tab-${tab}`" class="mt-5">
        <MembersTab
          v-if="tab === 'members'"
          :name="name"
          :path="path"
          :via="via"
          :me="me"
          @count="memberCount = $event"
        />
        <JoinLinks
          v-else-if="tab === 'joinlinks'"
          :namespace="name"
          :isK8sNamespace="featureOn('is_k8s_namespace')"
          :isLLMNamespace="featureOn('is_litellm_org')"
        />
        <SubgroupsTab
          v-else-if="tab === 'subgroups'"
          :path="path"
          :index="index"
          :is-nrp-admin="isNrpAdmin"
          @select="$emit('select', $event)"
          @changed="$emit('changed')"
        />
        <DetailsTab
          v-else-if="tab === 'details'"
          :name="name"
          :info="info"
          :features="enabledFeatures"
          @saved="loadInfo"
          @changed="onFeaturesChanged"
        />
        <SettingsTab
          v-else-if="tab === 'settings'"
          :name="name"
          :path="path"
          :index="index"
          :info="info"
          :features="enabledFeatures"
          :is-nrp-admin="isNrpAdmin"
          @select="$emit('select', $event)"
          @deleted="$emit('deleted', path, parentPath(path))"
          @saved="loadInfo"
        />
      </div>
    </template>

    <div v-else class="mt-5 grid max-w-2xl gap-4">
      <p class="text-body">
        <template v-if="isMember"
          >You are a member of {{ name }}. Its admins manage who has access, join links and subgroups.</template
        >
        <template v-else
          >You are not a member of {{ name }}. To join, ask one of its admins, usually the PI, to add you.</template
        >
      </p>
      <p v-if="isMember && featureOn('is_litellm_org')" class="text-body">
        {{ name }} has LLM access. <a class="link" href="/llmtoken">Get an LLM API key</a>
      </p>
      <div v-if="info.description" class="grid gap-1">
        <h2 class="font-display text-h4 font-semibold text-heading">About</h2>
        <p class="whitespace-pre-line text-body">{{ info.description }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import JoinLinks from '../JoinLinks.vue';
import MembersTab from './MembersTab.vue';
import SubgroupsTab from './SubgroupsTab.vue';
import DetailsTab from './DetailsTab.vue';
import SettingsTab from './SettingsTab.vue';
import { ancestors, FEATURES, leaf, managedThrough, parentPath, rpc, type Feature, type Index } from './model';

const props = defineProps<{
  path: string;
  index: Index;
  isAdmin: boolean;
  isNrpAdmin: boolean;
  me: string;
  initialTab: string;
  notice: string;
}>();
const emit = defineEmits<{
  select: [path: string];
  tab: [tab: string];
  changed: [];
  deleted: [path: string, parent: string];
  back: [];
}>();

const toast = useToast();
const name = computed(() => leaf(props.path));
const crumbs = computed(() => ancestors(props.path).filter((a) => props.index.byPath.has(a)));
const node = computed(() => props.index.byPath.get(props.path));
const isMember = computed(() => props.index.memberPaths.has(props.path));
const via = computed(() => managedThrough(props.path, props.index, props.isAdmin));
const canManage = computed(() => via.value !== null);
const accessLabel = computed(() => {
  if (via.value === props.path) return 'You can manage this';
  if (via.value) return `You can manage this through ${leaf(via.value)}`;
  return isMember.value ? 'You are a member' : 'You are not a member';
});

// GetNamespaceInfo is the source of truth for features once loaded; the list's
// flags cover the moment before it answers.
const info = ref<Record<string, any>>({});
const loadInfo = async () => {
  try {
    info.value = (await rpc.request({ method: 'user.GetNamespaceInfo', params: { Namespace: name.value } })) ?? {};
  } catch (err: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Could not load namespace details',
      detail: err instanceof Error ? err.message : String(err),
      life: 6000,
    });
  }
};
loadInfo();

const enabledFeatures = computed<string[]>(() => {
  if (Array.isArray(info.value.features)) return info.value.features;
  const n = node.value;
  return [
    n?.IsK8sNamespace && 'is_k8s_namespace',
    n?.IsLiteLLMOrg && 'is_litellm_org',
    n?.IsMilvusDB && 'is_milvus_db',
  ].filter(Boolean) as string[];
});
const featureOn = (key: Feature['key']) => enabledFeatures.value.includes(key);
const offFeatures = computed(() => FEATURES.filter((f) => !featureOn(f.key)));
const onFeaturesChanged = () => {
  loadInfo();
  emit('changed');
};

const memberCount = ref<number | null>(null);
const subgroupCount = computed(() => (props.index.children.get(props.path) ?? []).length);
const tabs = computed(() => [
  { id: 'members', label: 'Members', count: memberCount.value ?? undefined },
  { id: 'joinlinks', label: 'Join links' },
  { id: 'subgroups', label: 'Subgroups', count: subgroupCount.value || undefined },
  { id: 'details', label: 'Details' },
  { id: 'settings', label: 'Settings' },
]);
const tab = ref(tabs.value.some((t) => t.id === props.initialTab) ? props.initialTab : 'members');
const setTab = (id: string) => {
  tab.value = id;
  emit('tab', id);
};
const onTabKey = (e: KeyboardEvent) => {
  const ids = tabs.value.map((t) => t.id);
  const i = ids.indexOf(tab.value);
  const next =
    e.key === 'ArrowRight'
      ? ids[(i + 1) % ids.length]
      : e.key === 'ArrowLeft'
        ? ids[(i - 1 + ids.length) % ids.length]
        : null;
  if (!next) return;
  e.preventDefault();
  setTab(next);
  document.getElementById(`ns-tab-${next}`)?.focus();
};

const copied = ref(false);
const copyName = async () => {
  try {
    await navigator.clipboard.writeText(name.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2400);
  } catch {
    toast.add({
      severity: 'warn',
      summary: 'Copy blocked',
      detail: `Select the name and copy it: ${name.value}`,
      life: 6000,
    });
  }
};
</script>

<style>
/* DESIGN.md §6 copy-control idiom: border-current, quiet until hovered. */
.ns-copy {
  border: 1px solid currentColor;
  border-radius: 0.375rem;
  padding: 0.15rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--nrp-text-muted);
}
.ns-copy:hover {
  color: var(--nrp-link);
}
.ns-copy:focus-visible {
  outline: 2px solid var(--nrp-ring);
  outline-offset: 2px;
}
</style>
