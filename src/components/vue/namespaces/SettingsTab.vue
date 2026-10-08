<template>
  <div class="grid max-w-2xl gap-8">
    <section class="grid gap-2 border-b border-hairline pb-6" aria-labelledby="ns-commercial-h">
      <h2 id="ns-commercial-h" class="font-display text-h4 font-semibold text-heading">Commercial use</h2>
      <template v-if="isNrpAdmin">
        <label class="flex items-center gap-2 text-sm text-body">
          <input v-model="commercial" type="checkbox" class="ns-check" />
          {{ name }} is used commercially
        </label>
        <div>
          <button
            type="button"
            class="btn-secondary !px-4 !py-2 text-sm"
            :disabled="savingCommercial || commercial === !!info.is_commercial"
            @click="saveCommercial"
          >
            {{ savingCommercial ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </template>
      <div v-else class="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span class="text-heading">{{ info.is_commercial ? 'Yes' : 'No' }}</span>
        <span class="text-xs text-muted">Set by NRP admins</span>
      </div>
    </section>

    <section class="grid gap-3" aria-labelledby="ns-delete-h">
      <h2 id="ns-delete-h" class="font-display text-h4 font-semibold text-heading">Delete {{ name }}</h2>
      <template v-if="children.length">
        <p class="text-sm text-body">
          {{ name }} cannot be deleted while it has subgroups.
          {{ children.length === 1 ? 'Delete this one first:' : `Delete these ${children.length} first:` }}
        </p>
        <ul class="grid gap-1 text-sm">
          <li v-for="c in children" :key="c">
            <a
              class="link font-mono text-sm"
              :href="`?ns=${encodeURIComponent(c)}`"
              @click.prevent="$emit('select', c)"
              >{{ leaf(c) }}</a
            >
          </li>
        </ul>
      </template>
      <template v-else>
        <p class="text-sm text-body">
          Deleting removes {{ name }} and everything that depends on it. This cannot be undone.
        </p>
        <div>
          <button type="button" class="ns-danger-outline" @click="open = true">Delete {{ name }}…</button>
        </div>
      </template>
    </section>

    <Dialog v-model:visible="open" modal :header="`Delete ${name}?`" :style="{ width: '32rem' }" @hide="typed = ''">
      <div class="grid gap-3 text-sm text-body">
        <p>This cannot be undone. Deleting {{ name }}:</p>
        <ul class="grid list-disc gap-1 pl-5">
          <li v-if="features.includes('is_k8s_namespace')">
            deletes the Kubernetes namespace and everything in it: running pods, storage volumes and the data on them
          </li>
          <li v-if="features.includes('is_litellm_org')">
            deletes its LLM group, so API keys that rely on it stop working
          </li>
          <li v-if="features.includes('is_milvus_db')">deletes its Milvus database</li>
          <li>removes the group, so its members lose access through it</li>
        </ul>
        <div class="grid gap-1.5">
          <label for="ns-del-confirm" class="text-heading"
            >Type <span class="font-mono">{{ name }}</span> to confirm</label
          >
          <input
            id="ns-del-confirm"
            v-model="typed"
            class="ns-field px-3 py-2 font-mono text-sm text-heading"
            autocomplete="off"
            spellcheck="false"
            aria-describedby="ns-del-hint"
            @keydown.enter="matches && remove()"
          />
          <p id="ns-del-hint" class="text-xs text-muted">The delete button turns on when the name matches.</p>
        </div>
      </div>
      <template #footer>
        <button type="button" class="btn-secondary !px-4 !py-2 text-sm" @click="open = false">Cancel</button>
        <button
          type="button"
          class="ns-danger-btn"
          :disabled="!matches || deleting"
          aria-describedby="ns-del-hint"
          @click="remove"
        >
          {{ deleting ? 'Deleting…' : 'Delete namespace' }}
        </button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import { useToast } from 'primevue/usetoast';
import { leaf, rpc, type Index } from './model';

const props = defineProps<{
  name: string;
  path: string;
  index: Index;
  info: Record<string, any>;
  features: string[];
  isNrpAdmin: boolean;
}>();
const emit = defineEmits<{ select: [path: string]; deleted: []; saved: [] }>();
const toast = useToast();

const children = computed(() => props.index.children.get(props.path) ?? []);

const commercial = ref(!!props.info.is_commercial);
watch(
  () => props.info.is_commercial,
  (v) => (commercial.value = !!v)
);
const savingCommercial = ref(false);
const saveCommercial = async () => {
  savingCommercial.value = true;
  try {
    const r = await rpc.request({
      method: 'admin.SetNamespaceCommercial',
      params: { Namespace: props.name, IsCommercial: commercial.value },
    });
    if (r?.error) throw new Error(r.error.message);
    toast.add({
      severity: 'success',
      summary: commercial.value ? 'Marked as commercial' : 'Marked as not commercial',
      life: 3000,
    });
    emit('saved');
  } catch (err: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Could not save',
      detail: err instanceof Error ? err.message : String(err),
      life: 8000,
    });
  } finally {
    savingCommercial.value = false;
  }
};

const open = ref(false);
const typed = ref('');
const matches = computed(() => typed.value === props.name);
const deleting = ref(false);
const remove = async () => {
  if (!matches.value) return;
  deleting.value = true;
  try {
    const r = await rpc.request({ method: 'admin.DeleteNamespace', params: { Namespace: props.name } });
    if (r?.error) throw new Error(r.error.message);
    open.value = false;
    emit('deleted');
  } catch (err: unknown) {
    toast.add({
      severity: 'error',
      summary: `Could not delete ${props.name}`,
      detail: err instanceof Error ? err.message : String(err),
      life: 10000,
    });
  } finally {
    deleting.value = false;
  }
};
</script>

<style>
.ns-danger-outline {
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--nrp-danger);
  box-shadow: inset 0 0 0 1px var(--nrp-danger);
}
.ns-danger-outline:hover {
  background: var(--nrp-surface-2);
}
.ns-danger-outline:focus-visible {
  outline: 2px solid var(--nrp-ring);
  outline-offset: 2px;
}
</style>
