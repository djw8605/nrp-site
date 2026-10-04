<template>
  <div class="grid gap-8">
    <section class="grid gap-3" aria-labelledby="ns-sub-list">
      <h2 id="ns-sub-list" class="font-display text-h4 font-semibold text-heading">Subgroups of {{ name }}</h2>
      <p v-if="!children.length" class="text-sm text-muted">{{ name }} has no subgroups yet.</p>
      <ul v-else class="grid gap-1">
        <li v-for="c in children" :key="c">
          <a
            :href="`?ns=${encodeURIComponent(c)}`"
            class="ns-row flex items-center justify-between gap-3 rounded-md px-3 py-2"
            @click.prevent="$emit('select', c)"
          >
            <span class="font-mono text-sm text-heading">{{ leaf(c) }}</span>
            <span class="flex gap-1">
              <span v-for="f in nodeFeatures(index.byPath.get(c))" :key="f" class="ns-chip">{{ f }}</span>
            </span>
          </a>
        </li>
      </ul>
    </section>

    <section class="grid max-w-xl gap-4" aria-labelledby="ns-sub-create">
      <h2 id="ns-sub-create" class="font-display text-h4 font-semibold text-heading">Create a subgroup</h2>
      <div class="grid gap-1.5">
        <label for="ns-new-name" class="text-sm font-medium text-heading">Name</label>
        <input
          id="ns-new-name"
          v-model="newName"
          class="ns-field px-3 py-2 font-mono text-sm text-heading"
          :class="{ 'ns-field-invalid': showErrors }"
          autocomplete="off"
          spellcheck="false"
          :placeholder="`${name}-group`"
          :aria-invalid="showErrors ? 'true' : undefined"
          aria-describedby="ns-new-help"
          @input="normalize"
        />
        <p id="ns-new-help" class="text-xs text-muted">
          Lowercase letters, numbers and dashes, at least two parts joined by a dash (for example
          <span class="font-mono">physics-ml</span>). Names are unique across the cluster.
        </p>
        <ul v-if="showErrors" class="grid gap-0.5 text-sm text-danger" role="alert">
          <li v-for="m in validation.issues" :key="m">{{ m }}</li>
        </ul>
        <p v-else-if="newName" class="text-sm text-body">
          Creates <span class="font-mono text-heading">{{ path }}/{{ newName }}</span>
        </p>
      </div>

      <fieldset class="grid gap-2">
        <legend class="mb-1 text-sm font-medium text-heading">Features</legend>
        <label v-for="f in FEATURE_CHOICES" :key="f.key" class="flex items-start gap-2 text-sm text-body">
          <input v-model="features" type="checkbox" class="ns-check mt-0.5" :value="f.key" />
          <span
            ><span class="font-medium text-heading">{{ f.title }}</span
            >. {{ f.help }}</span
          >
        </label>
      </fieldset>

      <div>
        <button
          type="button"
          class="btn-primary !px-5 !py-2 text-sm"
          :disabled="!validation.valid || creating"
          @click="create"
        >
          {{ creating ? 'Creating…' : 'Create subgroup' }}
        </button>
      </div>
      <p class="text-xs text-muted">
        Fill in the PI, description and institution on the new subgroup's Details tab afterwards.
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import { leaf, nodeFeatures, rpc, type Index } from './model';

const props = defineProps<{ path: string; index: Index; isNrpAdmin: boolean }>();
const emit = defineEmits<{ select: [path: string]; changed: [] }>();
const toast = useToast();

const name = computed(() => leaf(props.path));
const children = computed(() => props.index.children.get(props.path) ?? []);

const FEATURE_CHOICES = [
  { key: 'is_k8s_namespace', title: 'Kubernetes namespace', help: 'Members can run workloads with kubectl.' },
  { key: 'is_litellm_org', title: 'LLM access', help: 'Members can create API keys for the hosted LLMs.' },
  { key: 'is_milvus_db', title: 'Milvus database', help: 'A vector database for the group.' },
];

const newName = ref('');
const features = ref<string[]>(['is_k8s_namespace']);
const creating = ref(false);

// "physicsGroup" -> "physics-group", as the previous form did.
const normalize = () => {
  if (!props.isNrpAdmin && /[A-Z]/.test(newName.value)) {
    newName.value = newName.value.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }
};

// Typo guardrails carried over from the previous form. NRP staff bypass them.
const GENERIC = [
  'test',
  'dev',
  'production',
  'staging',
  'stage',
  'temp',
  'tmp',
  'example',
  'fake',
  'dummy',
  'my',
  'group',
];
const validation = computed(() => {
  const v = newName.value;
  if (!v.trim()) return { valid: false, issues: [] as string[] };
  if (props.isNrpAdmin) return { valid: true, issues: [] };
  const issues: string[] = [];
  const bad = v.replace(/[a-z0-9-]/g, '');
  if (bad) issues.push(`Remove "${bad}": only lowercase letters, numbers and dashes are allowed.`);
  if (!v.includes('-')) issues.push('Add a dash to join at least two parts, for example "physics-ml".');
  if (v.includes('--') || v.startsWith('-') || v.endsWith('-')) issues.push('Dashes must sit between two parts.');
  const parts = v.split('-').filter(Boolean);
  parts.forEach((p) => {
    if (p.length < 2) issues.push(`"${p}" is too short. Each part needs at least 2 characters.`);
    if (p === 'system' || GENERIC.includes(p)) issues.push(`"${p}" is too generic. Use a specific word.`);
  });
  if (/^(sys|kube)(-|$)/.test(v)) issues.push('Names cannot start with "sys" or "kube".');
  return { valid: issues.length === 0, issues: [...new Set(issues)] };
});
const showErrors = computed(
  () => newName.value.length > 0 && !validation.value.valid && validation.value.issues.length > 0
);

const create = async () => {
  if (!validation.value.valid) return;
  creating.value = true;
  try {
    const r = await rpc.request({
      method: 'admin.CreateNamespace',
      params: { Namespace: name.value, NewNamespace: newName.value, GroupFeatures: features.value },
    });
    if (r?.error) throw new Error(r.error.message);
    toast.add({ severity: 'success', summary: `Created ${newName.value}`, detail: `Under ${name.value}.`, life: 5000 });
    newName.value = '';
    emit('changed');
  } catch (err: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Could not create the subgroup',
      detail: err instanceof Error ? err.message : String(err),
      life: 8000,
    });
  } finally {
    creating.value = false;
  }
};
</script>

<style>
.ns-field-invalid {
  box-shadow: inset 0 0 0 2px var(--nrp-danger);
}
</style>
