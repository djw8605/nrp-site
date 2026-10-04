<template>
  <section v-if="visible" id="join-links" aria-labelledby="join-links-h">
    <h2 id="join-links-h" class="font-display text-h4 font-semibold text-heading">Training join links</h2>
    <div>
      <div class="mt-3 flex flex-col gap-4">
        <p class="text-sm text-muted">
          Anyone who opens a join link and logs in to the NRP is added to this namespace until access ends. Then the
          people the link added are removed again, which ends their access, including any LLM API keys. People who were
          already members are never removed, and attendees keep their NRP accounts.
        </p>
        <Message v-if="isK8sNamespace" severity="info" :closable="false">
          This namespace has Kubernetes enabled, so attendees get Kubernetes <code>edit</code> access to it until access
          ends.
        </Message>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FloatLabel variant="on">
            <InputText id="joinName" v-model="form.name" maxlength="100" fluid />
            <label for="joinName">Training name</label>
          </FloatLabel>
          <FloatLabel variant="on">
            <InputNumber inputId="joinMaxUses" v-model="form.maxUses" :min="1" :max="1000" fluid />
            <label for="joinMaxUses">Maximum attendees</label>
          </FloatLabel>
          <FloatLabel variant="on">
            <DatePicker inputId="joinUntil" v-model="form.joinUntil" showTime hourFormat="24" fluid />
            <label for="joinUntil">Joins accepted until</label>
          </FloatLabel>
          <FloatLabel variant="on">
            <DatePicker inputId="accessUntil" v-model="form.accessUntil" showTime hourFormat="24" fluid />
            <label for="accessUntil">Access ends</label>
          </FloatLabel>
        </div>
        <div v-if="isLLMNamespace" class="flex items-center gap-2">
          <Checkbox v-model="form.issueLLMKey" inputId="joinIssueLLMKey" :binary="true" />
          <label for="joinIssueLLMKey">Also give each attendee an LLM API key</label>
        </div>
        <Message v-if="createError" severity="error" :closable="false">{{ createError }}</Message>
        <Button
          icon="pi pi-link"
          label="Create join link"
          class="self-start"
          :loading="creating"
          :disabled="!form.name.trim() || !form.joinUntil || !form.accessUntil || !form.maxUses"
          @click="createLink"
        />
      </div>
      <DataTable :value="links" :loading="loading" dataKey="ID" class="mt-4">
        <Column field="Name" header="Training" />
        <Column header="Access">
          <template #body="{ data }">{{ data.IssueLLMKey ? 'Membership + LLM key' : 'Membership' }}</template>
        </Column>
        <Column header="Link">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <span class="whitespace-nowrap font-mono text-sm" :title="linkUrl(data)">{{ data.Code }}</span>
              <Button
                icon="pi pi-copy"
                text
                size="small"
                :aria-label="`Copy the join link for ${data.Name}`"
                @click="copyLink(data)"
              />
            </div>
          </template>
        </Column>
        <Column header="Attendees">
          <template #body="{ data }">{{ data.Uses }} / {{ data.MaxUses }}</template>
        </Column>
        <Column header="Joins until">
          <template #body="{ data }">{{ fmt(data.JoinUntil) }}</template>
        </Column>
        <Column header="Access ends">
          <template #body="{ data }">{{ fmt(data.AccessUntil) }}</template>
        </Column>
        <Column header="Status">
          <template #body="{ data }"><Tag :value="data.Status" :severity="statusSeverity(data.Status)" /></template>
        </Column>
        <Column header="">
          <template #body="{ data }">
            <div v-if="data.Status !== 'ended'" class="flex gap-2">
              <Button
                v-if="data.Status !== 'revoked'"
                label="Revoke"
                severity="secondary"
                size="small"
                :loading="!!busy[data.ID]"
                @click="revoke(data)"
              />
              <Button
                label="End now…"
                severity="secondary"
                outlined
                size="small"
                :loading="!!busy[data.ID]"
                @click="askEnd(data)"
              />
            </div>
          </template>
        </Column>
        <template #empty>No join links yet.</template>
      </DataTable>
    </div>
  </section>
  <p v-else-if="!loading" class="text-sm text-muted">
    Join links are not available for this namespace. Ask in the support chat if you need them for a training.
  </p>
  <Dialog v-model:visible="endDialogVisible" modal header="End this training now?" :style="{ width: '30rem' }">
    <p>
      Everyone who joined through <b>{{ endTarget?.Name }}</b> and wasn't already a member will be removed from the
      namespace within 15 minutes, which ends their access to it. The link stops working immediately.
    </p>
    <div class="flex justify-end gap-2 mt-4">
      <Button label="Cancel" severity="secondary" @click="endDialogVisible = false" />
      <Button label="End now" severity="danger" :loading="!!(endTarget && busy[endTarget.ID])" @click="endNow" />
    </div>
  </Dialog>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { RequestManager, HTTPTransport, Client } from '@open-rpc/client-js';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import DatePicker from 'primevue/datepicker';
import FloatLabel from 'primevue/floatlabel';
import Message from 'primevue/message';
import Checkbox from 'primevue/checkbox';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import { useToast } from 'primevue/usetoast';

const props = defineProps({
  namespace: { type: String, required: true }, // short name, as the RPCs expect
  isK8sNamespace: { type: Boolean, default: false },
  isLLMNamespace: { type: Boolean, default: false },
});

const baseUrl = import.meta.env.PUBLIC_SVC_URL;
const client = new Client(new RequestManager([new HTTPTransport(baseUrl + '/rpc', { credentials: 'include' })]));
const toast = useToast();

// Shown only once ListJoinLinks succeeds: the server allows it only for
// admins of this namespace, and only when the feature is enabled.
const visible = ref(false);
const links = ref([]);
const loading = ref(false);
const creating = ref(false);
const createError = ref(null);
const busy = reactive({});
const endDialogVisible = ref(false);
const endTarget = ref(null);

const endOfToday = () => {
  const d = new Date();
  d.setHours(23, 59, 0, 0);
  return d;
};
const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};
const form = reactive({
  name: '',
  maxUses: 50,
  joinUntil: endOfToday(),
  accessUntil: daysFromNow(7),
  issueLLMKey: props.isLLMNamespace,
});

const linkUrl = (link) => `${window.location.origin}/join?code=${link.Code}`;
const fmt = (iso) =>
  new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const statusSeverity = (s) =>
  ({ active: 'success', full: 'warn', expired: 'secondary', revoked: 'secondary', ended: 'contrast' })[s] || 'info';

const loadLinks = () => {
  loading.value = true;
  return client
    .request({ method: 'admin.ListJoinLinks', params: { Namespace: props.namespace } })
    .then((resp) => {
      links.value = resp.Links || [];
      visible.value = true;
    })
    .catch(() => {
      visible.value = false;
    })
    .finally(() => {
      loading.value = false;
    });
};

const createLink = () => {
  createError.value = null;
  creating.value = true;
  client
    .request({
      method: 'admin.CreateJoinLink',
      params: {
        Namespace: props.namespace,
        Name: form.name.trim(),
        JoinUntil: form.joinUntil.toISOString(),
        AccessUntil: form.accessUntil.toISOString(),
        MaxUses: form.maxUses,
        IssueLLMKey: props.isLLMNamespace && form.issueLLMKey,
      },
    })
    .then(() => {
      form.name = '';
      toast.add({
        severity: 'success',
        summary: 'Join link created',
        detail: 'Copy it from the table below.',
        life: 4000,
      });
      return loadLinks();
    })
    .catch((err) => {
      createError.value = err.message;
    })
    .finally(() => {
      creating.value = false;
    });
};

const copyLink = (link) => {
  navigator.clipboard.writeText(linkUrl(link)).then(
    () => toast.add({ severity: 'success', summary: 'Link copied', life: 2000 }),
    () => toast.add({ severity: 'error', summary: 'Could not copy the link', detail: linkUrl(link), life: 8000 })
  );
};

const runAction = (method, link) => {
  busy[link.ID] = true;
  return client
    .request({ method, params: { Namespace: props.namespace, ID: link.ID } })
    .then(() => loadLinks())
    .catch((err) => toast.add({ severity: 'error', summary: 'Action failed', detail: err.message, life: 5000 }))
    .finally(() => {
      busy[link.ID] = false;
    });
};

const revoke = (link) => runAction('admin.RevokeJoinLink', link);
const askEnd = (link) => {
  endTarget.value = link;
  endDialogVisible.value = true;
};
const endNow = () =>
  runAction('admin.EndJoinLink', endTarget.value).then(() => {
    endDialogVisible.value = false;
  });

onMounted(loadLinks);
</script>
