<template>
  <div class="grid gap-8">
    <section class="grid gap-3" aria-labelledby="ns-features-h">
      <h2 id="ns-features-h" class="font-display text-h4 font-semibold text-heading">Features</h2>
      <ul class="grid gap-2">
        <li
          v-for="f in FEATURE_CHOICES"
          :key="f.key"
          class="flex flex-wrap items-center justify-between gap-3 rounded-md bg-surface-1 px-3 py-2.5"
        >
          <span class="grid">
            <span class="text-sm font-medium text-heading">{{ f.title }}</span>
            <span class="text-xs text-muted">{{ f.help }}</span>
          </span>
          <span v-if="features.includes(f.key)" class="ns-chip">On</span>
          <button
            v-else
            type="button"
            class="btn-secondary !px-3 !py-1.5 text-sm"
            :disabled="enabling"
            @click="confirmFeature = f"
          >
            Enable…
          </button>
        </li>
      </ul>
    </section>

    <form class="grid max-w-2xl gap-4" aria-labelledby="ns-info-h" novalidate @submit.prevent="save">
      <h2 id="ns-info-h" class="font-display text-h4 font-semibold text-heading">About {{ name }}</h2>
      <p class="text-sm text-muted">
        Fields marked <span aria-hidden="true">*</span><span class="sr-only">required</span> are required. NRP staff use
        them to see who runs what on the cluster.
      </p>

      <div class="grid gap-1">
        <label for="ns-pi" class="text-sm font-medium text-heading">PI</label>
        <input id="ns-pi" v-model="form.pi" class="ns-field px-3 py-2 text-sm text-heading" autocomplete="name" />
      </div>
      <div class="grid gap-1">
        <label for="ns-grant" class="text-sm font-medium text-heading">Grant</label>
        <input id="ns-grant" v-model="form.grant" class="ns-field px-3 py-2 font-mono text-sm text-heading" />
      </div>
      <div class="grid gap-1">
        <label for="ns-desc" class="text-sm font-medium text-heading"
          >Description <span aria-hidden="true" class="text-danger">*</span></label
        >
        <textarea
          id="ns-desc"
          v-model="form.description"
          rows="4"
          class="ns-field px-3 py-2 text-sm text-heading"
          :class="{ 'ns-field-invalid': tried && errors.description }"
          aria-required="true"
          :aria-invalid="tried && errors.description ? 'true' : undefined"
          aria-describedby="ns-desc-help"
        ></textarea>
        <p id="ns-desc-help" class="text-xs" :class="tried && errors.description ? 'text-danger' : 'text-muted'">
          {{
            tried && errors.description
              ? errors.description
              : `What the group does on the NRP, at least 50 characters. ${form.description.trim().length} so far.`
          }}
        </p>
      </div>
      <div class="grid gap-1">
        <label for="ns-inst" class="text-sm font-medium text-heading"
          >Institution <span aria-hidden="true" class="text-danger">*</span></label
        >
        <AutoComplete
          v-model="form.institution"
          input-id="ns-inst"
          :suggestions="orgs"
          fluid
          aria-required="true"
          :invalid="tried && !!errors.institution"
          aria-describedby="ns-inst-help"
          @complete="searchOrgs"
        />
        <p id="ns-inst-help" class="text-xs" :class="tried && errors.institution ? 'text-danger' : 'text-muted'">
          {{
            tried && errors.institution
              ? errors.institution
              : 'Start typing to search the Research Organization Registry.'
          }}
        </p>
      </div>
      <div class="grid gap-1">
        <label for="ns-sw" class="text-sm font-medium text-heading">Software</label>
        <input id="ns-sw" v-model="form.software" class="ns-field px-3 py-2 text-sm text-heading" />
      </div>
      <div class="grid gap-1">
        <label for="ns-pubs" class="text-sm font-medium text-heading"
          >Publications <span aria-hidden="true" class="text-danger">*</span></label
        >
        <textarea
          id="ns-pubs"
          v-model="form.publications"
          rows="3"
          class="ns-field px-3 py-2 text-sm text-heading"
          :class="{ 'ns-field-invalid': tried && errors.publications }"
          aria-required="true"
          :aria-invalid="tried && errors.publications ? 'true' : undefined"
          aria-describedby="ns-pubs-help"
        ></textarea>
        <p id="ns-pubs-help" class="text-xs" :class="tried && errors.publications ? 'text-danger' : 'text-muted'">
          {{ tried && errors.publications ? errors.publications : 'Papers that used the NRP, or "None".' }}
        </p>
      </div>
      <div>
        <button type="submit" class="btn-primary !px-5 !py-2 text-sm" :disabled="saving">
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
      </div>
    </form>

    <Dialog
      :visible="!!confirmFeature"
      modal
      :header="`Enable ${confirmFeature?.title} for ${name}?`"
      :style="{ width: '30rem' }"
      @update:visible="(v: boolean) => !v && (confirmFeature = null)"
    >
      <p class="text-sm text-body">
        {{ confirmFeature?.help }} Once enabled, a feature cannot be turned off from this page.
      </p>
      <template #footer>
        <button type="button" class="btn-secondary !px-4 !py-2 text-sm" @click="confirmFeature = null">Cancel</button>
        <button type="button" class="btn-primary !px-4 !py-2 text-sm" :disabled="enabling" @click="enable">
          {{ enabling ? 'Enabling…' : 'Enable' }}
        </button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import AutoComplete from 'primevue/autocomplete';
import Dialog from 'primevue/dialog';
import { useToast } from 'primevue/usetoast';
import { rpc } from './model';

const props = defineProps<{ name: string; info: Record<string, any>; features: string[] }>();
const emit = defineEmits<{ saved: []; changed: [] }>();
const toast = useToast();

const FEATURE_CHOICES = [
  { key: 'is_k8s_namespace', title: 'Kubernetes namespace', help: 'Members can run workloads with kubectl.' },
  { key: 'is_litellm_org', title: 'LLM access', help: 'Members can create API keys for the hosted LLMs.' },
  { key: 'is_milvus_db', title: 'Milvus database', help: 'A vector database for the group.' },
];

const form = reactive({ pi: '', grant: '', description: '', institution: '', software: '', publications: '' });
watch(
  () => props.info,
  (i) => {
    form.pi = i.pi ?? '';
    form.grant = i.grant ?? '';
    form.description = i.description ?? '';
    form.institution = i.institution ?? '';
    form.software = i.software ?? '';
    form.publications = i.publications ?? '';
  },
  { immediate: true }
);

const tried = ref(false);
const errors = computed(() => ({
  description: !form.description.trim()
    ? 'Add a description.'
    : form.description.trim().length < 50
      ? `Add a little more: at least 50 characters, ${form.description.trim().length} so far.`
      : '',
  institution: typeof form.institution === 'string' && form.institution.trim() ? '' : 'Choose an institution.',
  publications: form.publications.trim() ? '' : 'List publications, or write "None".',
}));

const saving = ref(false);
const save = async () => {
  tried.value = true;
  if (Object.values(errors.value).some(Boolean)) return;
  saving.value = true;
  try {
    const r = await rpc.request({ method: 'admin.SetNamespaceInfo', params: { ...form, Namespace: props.name } });
    if (r?.error) throw new Error(r.error.message);
    toast.add({ severity: 'success', summary: 'Saved', life: 3000 });
    emit('saved');
  } catch (err: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Could not save',
      detail: err instanceof Error ? err.message : String(err),
      life: 8000,
    });
  } finally {
    saving.value = false;
  }
};

// Institution search against ror.org, as before.
const orgs = ref<string[]>([]);
const searchOrgs = async (e: { query: string }) => {
  const q = e.query.trim();
  if (!q) return;
  try {
    const res = await fetch(`https://api.ror.org/organizations?query=${encodeURIComponent(q)}`);
    const data = await res.json();
    orgs.value = (data.items ?? []).map((item: any) => {
      const names = item.names ?? [];
      const pick =
        names.find((n: any) => n.lang === 'en' && (n.types.includes('ror_display') || n.types.includes('label'))) ??
        names.find((n: any) => n.lang === 'en') ??
        names[0];
      return pick?.value ?? item.name ?? '(no name)';
    });
  } catch {
    orgs.value = [];
  }
};

const confirmFeature = ref<(typeof FEATURE_CHOICES)[number] | null>(null);
const enabling = ref(false);
const enable = async () => {
  if (!confirmFeature.value) return;
  enabling.value = true;
  try {
    const r = await rpc.request({
      method: 'admin.ConvertGroupFeatures',
      params: { Group: props.name, Features: [confirmFeature.value.key] },
    });
    if (r?.error) throw new Error(r.error.message);
    const warnings: string[] = r?.Warnings ?? [];
    toast.add({
      severity: warnings.length ? 'warn' : 'success',
      summary: `Enabled ${confirmFeature.value.title}`,
      detail: warnings.join('; ') || undefined,
      life: warnings.length ? 10000 : 4000,
    });
    confirmFeature.value = null;
    emit('changed');
  } catch (err: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Could not enable the feature',
      detail: err instanceof Error ? err.message : String(err),
      life: 8000,
    });
  } finally {
    enabling.value = false;
  }
};
</script>
