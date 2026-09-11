<template>
  <Toast />
  <ConfirmDialog />

  <Message v-if="!user" severity="info" class="my-6">Please log in to manage MCP servers.</Message>

  <template v-else>
    <!-- First paint: the registry may be disabled on this portal, so nothing
         below is rendered until GetMCPRegistryInfo answers. -->
    <div v-if="isInfoLoading" class="my-6 flex flex-col gap-3">
      <Skeleton width="18rem" height="1.5rem" />
      <Skeleton width="100%" height="9rem" />
    </div>

    <Message v-else-if="infoError" severity="error" class="my-6">
      <div class="flex w-full items-center justify-between gap-4">
        <span>{{ infoError }}</span>
        <Button label="Retry" size="small" severity="secondary" @click="loadRegistryInfo" />
      </div>
    </Message>

    <Message v-else-if="!registryEnabled" severity="warn" class="my-6">
      The MCP registry is not enabled on this portal yet.
    </Message>

    <template v-else>
      <!-- ---------------------------------------------------------------- -->
      <!-- My registrations                                                  -->
      <!-- ---------------------------------------------------------------- -->
      <Card class="my-6">
        <template #title>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-h3 text-heading m-0">My registrations</h2>
            <Button
              icon="pi pi-refresh"
              label="Refresh"
              text
              size="small"
              severity="secondary"
              :loading="isServersLoading"
              @click="loadServers"
            />
          </div>
        </template>
        <template #content>
          <div v-if="isServersLoading && servers.length === 0" class="flex flex-col gap-2">
            <Skeleton v-for="n in 3" :key="n" width="100%" height="2.25rem" />
          </div>

          <Message v-else-if="servers.length === 0" severity="secondary">
            You have no MCP servers registered yet.
          </Message>

          <DataTable v-else :value="servers" dataKey="ID" class="w-full">
            <Column header="Path">
              <template #body="{ data }">
                <a
                  v-if="data.Status === 'approved'"
                  class="link font-mono text-sm break-all"
                  :href="data.PublicURL"
                  rel="noopener"
                  >{{ data.PublicPath }}</a
                >
                <span v-else class="font-mono text-sm break-all text-muted">{{ data.PublicPath }}</span>
              </template>
            </Column>
            <Column header="Tier">
              <template #body="{ data }">
                <Tag severity="secondary" :value="tierLabel(data.Tier)" />
              </template>
            </Column>
            <Column header="Target">
              <template #body="{ data }">
                <span class="font-mono text-sm break-all">{{ targetLabel(data) }}</span>
              </template>
            </Column>
            <Column header="Status">
              <template #body="{ data }">
                <Tag :severity="statusChip(data).severity" :value="statusChip(data).label" />
                <div v-if="data.StatusReason" class="mt-1 text-sm text-muted">{{ data.StatusReason }}</div>
                <div v-if="data.LastError" class="mt-1 text-sm text-muted">
                  <i class="pi pi-exclamation-triangle" aria-hidden="true"></i> {{ data.LastError }}
                </div>
              </template>
            </Column>
            <Column header="Route">
              <template #body="{ data }">
                <Tag :severity="routeChip(data).severity" :value="routeChip(data).label" />
                <div v-if="routeDetail(data)" class="mt-1 text-sm text-muted">{{ routeDetail(data) }}</div>
              </template>
            </Column>
            <Column header="Requested">
              <template #body="{ data }">
                <span class="text-sm text-muted">{{ formatDate(data.RequestedAt) }}</span>
              </template>
            </Column>
            <Column header="Actions" class="w-1">
              <template #body="{ data }">
                <div class="flex flex-wrap gap-1">
                  <Button
                    v-if="!isTerminal(data)"
                    icon="pi pi-pencil"
                    label="Edit"
                    size="small"
                    severity="secondary"
                    @click="openEdit(data)"
                  />
                  <Button
                    v-if="!isTerminal(data)"
                    icon="pi pi-times"
                    label="Withdraw"
                    size="small"
                    severity="danger"
                    text
                    :loading="busy[data.ID] === 'withdraw'"
                    :disabled="!!busy[data.ID]"
                    @click="confirmWithdraw(data)"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>

      <!-- ---------------------------------------------------------------- -->
      <!-- Register a server                                                 -->
      <!-- ---------------------------------------------------------------- -->
      <Card class="my-6">
        <template #title>
          <h2 class="text-h3 text-heading m-0">Register a server</h2>
        </template>
        <template #content>
          <Message v-if="namespaces.length === 0" severity="warn">
            You are not a direct member of any namespace, so there is nowhere to run a server yet. Join or request one
            on the <a class="link" href="/namespaces">namespaces page</a>, then come back here.
          </Message>

          <div v-else class="flex flex-col gap-5">
            <p class="m-0 text-sm text-muted">
              The server itself is a Deployment and a Service you run in your own namespace. Registration adds no YAML
              and no custom resource: the portal writes the gateway objects for you.
            </p>

            <FloatLabel variant="on">
              <Select
                id="mcpNamespace"
                v-model="form.Namespace"
                :options="namespaces"
                class="w-full"
                :disabled="isSubmitting"
              />
              <label for="mcpNamespace">Namespace</label>
            </FloatLabel>

            <fieldset class="m-0 flex flex-col gap-3 border-0 p-0">
              <legend class="mb-1 p-0 text-sm font-medium text-heading">Path tier</legend>
              <div class="flex items-start gap-2">
                <RadioButton
                  v-model="form.Tier"
                  inputId="mcpTierNamespace"
                  name="mcpTier"
                  value="namespace"
                  :disabled="isSubmitting"
                />
                <label for="mcpTierNamespace" class="text-sm">
                  <span class="font-mono">{{ publicHost }}/&lt;namespace&gt;/&lt;name&gt;</span>
                  <span class="block text-muted">Goes live immediately, no review.</span>
                </label>
              </div>
              <div class="flex items-start gap-2">
                <RadioButton
                  v-model="form.Tier"
                  inputId="mcpTierTop"
                  name="mcpTier"
                  value="toplevel"
                  :disabled="isSubmitting"
                />
                <label for="mcpTierTop" class="text-sm">
                  <span class="font-mono">{{ publicHost }}/&lt;name&gt;</span>
                  <span class="block text-muted">
                    Reviewed by an NRP admin. Reserved words, names that collide with a namespace, and names already
                    taken are refused.
                  </span>
                </label>
              </div>
            </fieldset>

            <div>
              <FloatLabel variant="on">
                <InputText id="mcpName" v-model.trim="form.Name" fluid :disabled="isSubmitting" />
                <label for="mcpName">Name</label>
              </FloatLabel>
              <small class="mt-1 block text-sm text-muted">
                Lowercase letters, digits and dashes, up to {{ maxNameLength }} characters, no leading or trailing dash.
              </small>
              <small v-if="nameError" class="mt-1 block text-sm text-muted">{{ nameError }}</small>
            </div>

            <div class="grid gap-5 md:grid-cols-2">
              <div>
                <FloatLabel variant="on">
                  <InputText id="mcpService" v-model.trim="form.ServiceName" fluid :disabled="isSubmitting" />
                  <label for="mcpService">Service name</label>
                </FloatLabel>
                <small class="mt-1 block text-sm text-muted">The Kubernetes Service in front of your pods.</small>
              </div>
              <div>
                <FloatLabel variant="on">
                  <InputNumber
                    id="mcpPort"
                    v-model="form.ServicePort"
                    :useGrouping="false"
                    :min="1"
                    :max="65535"
                    fluid
                    :disabled="isSubmitting"
                  />
                  <label for="mcpPort">Service port</label>
                </FloatLabel>
                <small class="mt-1 block text-sm text-muted">The port on the Service, not on the container.</small>
              </div>
            </div>

            <div>
              <FloatLabel variant="on">
                <InputText id="mcpBackendPath" v-model.trim="form.BackendPath" fluid :disabled="isSubmitting" />
                <label for="mcpBackendPath">Backend path</label>
              </FloatLabel>
              <small class="mt-1 block text-sm text-muted">
                The path your server serves MCP on. The gateway replaces the whole public path with this one, so it is
                independent of the public URL.
              </small>
            </div>

            <FloatLabel variant="on">
              <Textarea id="mcpDescription" v-model.trim="form.Description" rows="2" fluid :disabled="isSubmitting" />
              <label for="mcpDescription">Description (optional)</label>
            </FloatLabel>

            <FloatLabel variant="on">
              <InputText id="mcpContact" v-model.trim="form.Contact" fluid :disabled="isSubmitting" />
              <label for="mcpContact">Contact email (optional)</label>
            </FloatLabel>

            <!-- Live preview: both halves of what registration means, the public
                 URL and the in-cluster target the gateway rewrites it to. -->
            <div class="rounded-lg border border-hairline bg-sunken px-4 py-3">
              <div class="font-mono text-sm break-all text-heading">{{ previewURL }}</div>
              <div class="font-mono text-sm break-all text-muted">-&gt; {{ previewTarget }}</div>
              <p class="mt-2 mb-0 text-sm text-muted">
                Clients must use the public URL exactly, with no trailing slash. The gateway matches it as an exact path
                and rewrites the whole path to your backend path.
              </p>
            </div>

            <div>
              <Button
                :label="form.Tier === 'toplevel' ? 'Request top-level name' : 'Register (goes live now)'"
                icon="pi pi-plus"
                :loading="isSubmitting"
                @click="submitApply"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- ---------------------------------------------------------------- -->
      <!-- Admin approval queue. Shown to NRP admins; the server enforces the -->
      <!-- same check on every admin.* method, so this is convenience only.   -->
      <!-- ---------------------------------------------------------------- -->
      <Card v-if="isNrpAdmin" class="my-6">
        <template #title>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-h3 text-heading m-0">Approval queue (NRP admin)</h2>
            <Button
              icon="pi pi-refresh"
              label="Reconcile now"
              text
              size="small"
              severity="secondary"
              :loading="isReconciling"
              @click="forceReconcile"
            />
          </div>
        </template>
        <template #content>
          <div class="mb-4 flex flex-wrap items-center gap-3">
            <label for="mcpAdminStatus" class="text-sm font-medium">Status</label>
            <Select
              id="mcpAdminStatus"
              v-model="adminStatusFilter"
              :options="adminStatusOptions"
              optionLabel="label"
              optionValue="value"
              class="w-56"
              :disabled="isAdminLoading"
              @change="loadAdminServers"
            />
          </div>

          <div v-if="isAdminLoading && adminServers.length === 0" class="flex flex-col gap-2">
            <Skeleton v-for="n in 3" :key="n" width="100%" height="2.25rem" />
          </div>

          <Message v-else-if="adminServers.length === 0" severity="secondary">
            No registrations match this filter.
          </Message>

          <DataTable v-else :value="adminServers" dataKey="ID" class="w-full">
            <Column header="Owner">
              <template #body="{ data }">
                <div class="text-sm">{{ data.OwnerName || 'Unknown' }}</div>
                <div class="text-sm text-muted break-all">{{ data.OwnerEmail }}</div>
              </template>
            </Column>
            <Column header="Namespace">
              <template #body="{ data }">
                <span class="font-mono text-sm">{{ data.Namespace }}</span>
              </template>
            </Column>
            <Column header="Path">
              <template #body="{ data }">
                <span class="font-mono text-sm break-all">{{ data.PublicPath }}</span>
                <div class="text-sm text-muted">{{ tierLabel(data.Tier) }}</div>
              </template>
            </Column>
            <Column header="Target">
              <template #body="{ data }">
                <span class="font-mono text-sm break-all">{{ targetLabel(data) }}</span>
              </template>
            </Column>
            <Column header="Status">
              <template #body="{ data }">
                <Tag :severity="statusChip(data).severity" :value="statusChip(data).label" />
                <div v-if="data.StatusReason" class="mt-1 text-sm text-muted">{{ data.StatusReason }}</div>
                <div v-if="data.LastError" class="mt-1 text-sm text-muted">
                  <i class="pi pi-exclamation-triangle" aria-hidden="true"></i> {{ data.LastError }}
                </div>
              </template>
            </Column>
            <Column header="Route">
              <template #body="{ data }">
                <Tag :severity="routeChip(data).severity" :value="routeChip(data).label" />
                <div v-if="routeDetail(data)" class="mt-1 text-sm text-muted">{{ routeDetail(data) }}</div>
                <div v-if="data.LastReconciledAt" class="mt-1 text-sm text-muted">
                  Reconciled {{ formatDate(data.LastReconciledAt) }}
                </div>
              </template>
            </Column>
            <Column header="Requested">
              <template #body="{ data }">
                <span class="text-sm text-muted">{{ formatDate(data.RequestedAt) }}</span>
              </template>
            </Column>
            <Column header="Actions" class="w-1">
              <template #body="{ data }">
                <div class="flex flex-wrap gap-1">
                  <Button
                    v-if="data.Status === 'pending'"
                    icon="pi pi-check"
                    label="Approve"
                    size="small"
                    severity="success"
                    :loading="busy[data.ID] === 'approve'"
                    :disabled="!!busy[data.ID]"
                    @click="confirmApprove(data)"
                  />
                  <Button
                    v-if="data.Status === 'pending'"
                    icon="pi pi-ban"
                    label="Reject"
                    size="small"
                    severity="danger"
                    :loading="busy[data.ID] === 'reject'"
                    :disabled="!!busy[data.ID]"
                    @click="openReason('reject', data)"
                  />
                  <Button
                    v-if="data.Status === 'approved'"
                    icon="pi pi-pause"
                    label="Suspend"
                    size="small"
                    severity="warn"
                    :loading="busy[data.ID] === 'suspend'"
                    :disabled="!!busy[data.ID]"
                    @click="openReason('suspend', data)"
                  />
                  <Button
                    v-if="data.Status === 'suspended'"
                    icon="pi pi-play"
                    label="Resume"
                    size="small"
                    severity="success"
                    :loading="busy[data.ID] === 'resume'"
                    :disabled="!!busy[data.ID]"
                    @click="confirmResume(data)"
                  />
                  <Button
                    icon="pi pi-trash"
                    label="Delete"
                    size="small"
                    severity="danger"
                    text
                    :loading="busy[data.ID] === 'delete'"
                    :disabled="!!busy[data.ID]"
                    @click="confirmDelete(data)"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>

      <p class="my-6 text-center text-sm text-muted">
        <a class="link" :href="docsHref">How to run and publish an MCP server on the NRP</a>
      </p>
    </template>
  </template>

  <!-- Owner edit dialog. Namespace, name and tier are the public identity of the
       registration and are immutable: changing them means a new path. -->
  <Dialog v-model:visible="editVisible" modal header="Edit registration" :style="{ width: '34rem' }">
    <div v-if="editRow" class="flex flex-col gap-4">
      <div class="rounded-lg border border-hairline bg-sunken px-4 py-3">
        <div class="font-mono text-sm break-all text-heading">{{ editRow.PublicURL }}</div>
        <p class="mt-2 mb-0 text-sm text-muted">Withdraw and re-register to change the path.</p>
      </div>
      <FloatLabel variant="on">
        <InputText id="editService" v-model.trim="editForm.ServiceName" fluid :disabled="isSaving" />
        <label for="editService">Service name</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <InputNumber
          id="editPort"
          v-model="editForm.ServicePort"
          :useGrouping="false"
          :min="1"
          :max="65535"
          fluid
          :disabled="isSaving"
        />
        <label for="editPort">Service port</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <InputText id="editBackendPath" v-model.trim="editForm.BackendPath" fluid :disabled="isSaving" />
        <label for="editBackendPath">Backend path</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <Textarea id="editDescription" v-model.trim="editForm.Description" rows="2" fluid :disabled="isSaving" />
        <label for="editDescription">Description</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <InputText id="editContact" v-model.trim="editForm.Contact" fluid :disabled="isSaving" />
        <label for="editContact">Contact email</label>
      </FloatLabel>
      <Message v-if="editError" severity="error">{{ editError }}</Message>
    </div>
    <template #footer>
      <Button label="Cancel" text severity="secondary" :disabled="isSaving" @click="editVisible = false" />
      <Button label="Save changes" icon="pi pi-check" :loading="isSaving" @click="submitEdit" />
    </template>
  </Dialog>

  <!-- Reject and suspend both take a required reason; it is shown to the owner. -->
  <Dialog v-model:visible="reasonVisible" modal :header="reasonHeader" :style="{ width: '32rem' }">
    <div class="flex flex-col gap-4">
      <p class="m-0 text-sm text-muted">{{ reasonHelp }}</p>
      <FloatLabel variant="on">
        <Textarea id="reasonText" v-model.trim="reasonText" rows="3" fluid :disabled="isReasonBusy" />
        <label for="reasonText">Reason</label>
      </FloatLabel>
      <Message v-if="reasonError" severity="error">{{ reasonError }}</Message>
    </div>
    <template #footer>
      <Button label="Cancel" text severity="secondary" :disabled="isReasonBusy" @click="reasonVisible = false" />
      <Button
        :label="reasonAction === 'reject' ? 'Reject' : 'Suspend'"
        :severity="reasonAction === 'reject' ? 'danger' : 'warn'"
        :loading="isReasonBusy"
        @click="submitReason"
      />
    </template>
  </Dialog>
</template>

<script setup>
import 'primeicons/primeicons.css';

import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Message from 'primevue/message';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Skeleton from 'primevue/skeleton';
import FloatLabel from 'primevue/floatlabel';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Textarea from 'primevue/textarea';
import RadioButton from 'primevue/radiobutton';
import Select from 'primevue/select';

import { useStore } from '@nanostores/vue';
import { userStore } from '../../auth.ts';
import { MCP_ENDPOINT } from '../../data/mcp-endpoint.ts';

import { RequestManager, HTTPTransport, Client } from '@open-rpc/client-js';

import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue';

const user = useStore(userStore);
const toast = useToast();
const confirm = useConfirm();

const docsHref = MCP_ENDPOINT.docsHref;

const baseUrl = import.meta.env.PUBLIC_SVC_URL;
const transport = new HTTPTransport(baseUrl + '/rpc', { credentials: 'include' });
const client = new Client(new RequestManager([transport]));

// guest.GetMCPRegistryInfo answers before anything else renders: the feature is
// off by default on a portal, and the same reply carries the validation hints
// (name pattern, caps, default backend path) this form checks against.
const info = ref(null);
const registryEnabled = ref(false);
const isInfoLoading = ref(true);
const infoError = ref(null);

const namespaces = ref([]);
const servers = ref([]);
const isServersLoading = ref(false);

const isNrpAdmin = ref(false);
const adminServers = ref([]);
const isAdminLoading = ref(false);
const isReconciling = ref(false);
const adminStatusFilter = ref('pending');
const adminStatusOptions = [
  { label: 'Pending approval', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Withdrawn', value: 'withdrawn' },
  { label: 'All', value: '' },
];

const busy = reactive({}); // per-row action state, keyed by registration ID

const form = reactive({
  Namespace: null,
  Name: '',
  Tier: 'namespace',
  ServiceName: '',
  ServicePort: 8000,
  BackendPath: '/mcp',
  Description: '',
  Contact: '',
});
const isSubmitting = ref(false);

const editVisible = ref(false);
const editRow = ref(null);
const editError = ref(null);
const isSaving = ref(false);
const editForm = reactive({
  ID: 0,
  ServiceName: '',
  ServicePort: 8000,
  BackendPath: '/mcp',
  Description: '',
  Contact: '',
});

const reasonVisible = ref(false);
const reasonAction = ref('reject');
const reasonRow = ref(null);
const reasonText = ref('');
const reasonError = ref(null);
const isReasonBusy = ref(false);

const publicHost = computed(() => info.value?.PublicHost || MCP_ENDPOINT.hostname);
const maxNameLength = computed(() => info.value?.MaxNameLength || 40);
const defaultBackendPath = computed(() => info.value?.DefaultBackendPath || '/mcp');

const reasonHeader = computed(() => (reasonAction.value === 'reject' ? 'Reject request' : 'Suspend registration'));
const reasonHelp = computed(() =>
  reasonAction.value === 'reject'
    ? 'The requester sees this reason on their registration. Say what would make a resubmission acceptable.'
    : 'The route is removed within about a minute. The record and all its fields are kept, and Resume puts it back.'
);

// The name pattern is the server's own regexp, sent over the wire, so the two
// can never drift. A pattern the browser cannot compile is not fatal: the
// server validates every apply anyway.
const nameRegexp = computed(() => {
  const pattern = info.value?.NamePattern;
  if (!pattern) return null;
  try {
    return new RegExp(pattern);
  } catch {
    return null;
  }
});

const nameError = computed(() => {
  const name = form.Name;
  if (!name) return '';
  if (name.length > maxNameLength.value) return `Too long: ${name.length} of ${maxNameLength.value} characters.`;
  if (nameRegexp.value && !nameRegexp.value.test(name)) {
    return 'That name has characters the gateway will not accept.';
  }
  const reserved = info.value?.ReservedNames || [];
  if (form.Tier === 'toplevel' && reserved.includes(name)) {
    return `"${name}" is a reserved top-level name and will be refused.`;
  }
  return '';
});

const previewPath = computed(() => {
  const name = form.Name || '<name>';
  if (form.Tier === 'toplevel') return '/' + name;
  return '/' + (form.Namespace || '<namespace>') + '/' + name;
});

const previewURL = computed(() => 'https://' + publicHost.value + previewPath.value);

const previewTarget = computed(() => {
  const svc = form.ServiceName || '<service>';
  const ns = form.Namespace || '<namespace>';
  const port = form.ServicePort || 8000;
  const path = form.BackendPath || defaultBackendPath.value;
  return `http://${svc}.${ns}.svc.cluster.local:${port}${path}`;
});

function isTerminal(row) {
  return row.Status === 'rejected' || row.Status === 'withdrawn';
}

function tierLabel(tier) {
  return tier === 'toplevel' ? 'top-level' : 'namespace';
}

function targetLabel(row) {
  return `${row.ServiceName}:${row.ServicePort} -> ${row.BackendPath}`;
}

// Status is the registration's own state; "Live" additionally requires the
// cluster to have confirmed the route, which is why approved has three chips.
function statusChip(row) {
  if (row.Status === 'pending') return { severity: 'warn', label: 'Pending approval' };
  if (row.Status === 'approved') {
    if (row.RouteAccepted === true) return { severity: 'success', label: 'Live' };
    if (row.RouteAccepted === false) return { severity: 'danger', label: 'Route error' };
    return { severity: 'info', label: 'Programming...' };
  }
  if (row.Status === 'suspended') return { severity: 'danger', label: 'Suspended' };
  if (row.Status === 'rejected') return { severity: 'secondary', label: 'Rejected' };
  return { severity: 'secondary', label: 'Withdrawn' };
}

function routeChip(row) {
  if (row.Status !== 'approved') return { severity: 'secondary', label: 'No route' };
  if (row.RouteAccepted === true && row.BackendAccepted !== false) return { severity: 'success', label: 'Accepted' };
  if (row.RouteAccepted === false || row.BackendAccepted === false) {
    return { severity: 'danger', label: 'Not accepted' };
  }
  return { severity: 'info', label: 'Waiting' };
}

function routeDetail(row) {
  const parts = [];
  if (row.RouteMessage) parts.push(row.RouteMessage);
  if (row.BackendMessage) parts.push(row.BackendMessage);
  return parts.join(' ');
}

function formatDate(d) {
  if (!d || String(d).indexOf('0001-01-01') === 0) return '';
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? '' : parsed.toLocaleString();
}

function rpcError(err, summary) {
  toast.add({ severity: 'error', summary, detail: err?.message || String(err), life: 6000 });
}

// ---- Loading ---------------------------------------------------------------

function loadRegistryInfo() {
  isInfoLoading.value = true;
  infoError.value = null;
  client
    .request({ method: 'guest.GetMCPRegistryInfo', params: {} })
    .then((response) => {
      info.value = response;
      registryEnabled.value = response.Enabled === true;
      if (!registryEnabled.value) return;
      form.BackendPath = response.DefaultBackendPath || '/mcp';
      loadNamespaces();
      loadServers();
      loadUserInfo();
    })
    .catch((err) => {
      infoError.value = err?.message || 'Could not reach the portal to check the MCP registry.';
    })
    .finally(() => {
      isInfoLoading.value = false;
    });
}

function loadNamespaces() {
  client
    .request({ method: 'user.GetUserMCPNamespaces', params: {} })
    .then((response) => {
      namespaces.value = response.Namespaces || [];
      if (!form.Namespace && namespaces.value.length === 1) form.Namespace = namespaces.value[0];
    })
    .catch((err) => rpcError(err, 'Error fetching your namespaces'));
}

function loadServers() {
  isServersLoading.value = true;
  client
    .request({ method: 'user.GetUserMCPServers', params: {} })
    .then((response) => {
      servers.value = response.Servers || [];
    })
    .catch((err) => rpcError(err, 'Error fetching your MCP servers'))
    .finally(() => {
      isServersLoading.value = false;
    });
}

// The approval queue is admin-only. This only decides whether to render it; the
// portal repeats the check on every admin.* method.
function loadUserInfo() {
  client
    .request({ method: 'user.GetUserInfo', params: {} })
    .then((response) => {
      isNrpAdmin.value = response.IsNrpAdmin === true;
      if (isNrpAdmin.value) loadAdminServers();
    })
    .catch((err) => {
      console.error('Error fetching user info:', err);
    });
}

function loadAdminServers() {
  if (!isNrpAdmin.value) return;
  isAdminLoading.value = true;
  client
    .request({ method: 'admin.ListMCPServers', params: { Status: adminStatusFilter.value, Tier: '', Namespace: '' } })
    .then((response) => {
      adminServers.value = response.Servers || [];
    })
    .catch((err) => rpcError(err, 'Error fetching registrations'))
    .finally(() => {
      isAdminLoading.value = false;
    });
}

function refreshAll() {
  loadServers();
  if (isNrpAdmin.value) loadAdminServers();
}

// ---- Apply -----------------------------------------------------------------

function submitApply() {
  if (!form.Namespace) {
    toast.add({ severity: 'error', summary: 'Namespace is required', life: 4000 });
    return;
  }
  if (!form.Name || nameError.value) {
    toast.add({ severity: 'error', summary: 'Fix the name first', detail: nameError.value, life: 4000 });
    return;
  }
  if (!form.ServiceName) {
    toast.add({ severity: 'error', summary: 'Service name is required', life: 4000 });
    return;
  }
  isSubmitting.value = true;
  client
    .request({
      method: 'user.ApplyMCPServer',
      params: {
        Namespace: form.Namespace,
        Name: form.Name,
        Tier: form.Tier,
        ServiceName: form.ServiceName,
        ServicePort: form.ServicePort,
        BackendPath: form.BackendPath,
        Description: form.Description,
        Contact: form.Contact,
      },
    })
    .then((response) => {
      const server = response.Server;
      toast.add({
        severity: 'success',
        summary: server && server.Status === 'pending' ? 'Top-level name requested' : 'Registered',
        detail:
          server && server.Status === 'pending'
            ? 'An NRP admin reviews top-level names. You will see the status change here.'
            : 'The route is usually live within about a minute.',
        life: 6000,
      });
      form.Name = '';
      form.ServiceName = '';
      form.ServicePort = 8000;
      form.BackendPath = defaultBackendPath.value;
      form.Description = '';
      form.Contact = '';
      refreshAll();
    })
    .catch((err) => rpcError(err, 'Registration failed'))
    .finally(() => {
      isSubmitting.value = false;
    });
}

// ---- Owner edit and withdraw -----------------------------------------------

function openEdit(row) {
  editRow.value = row;
  editError.value = null;
  editForm.ID = row.ID;
  editForm.ServiceName = row.ServiceName;
  editForm.ServicePort = row.ServicePort;
  editForm.BackendPath = row.BackendPath;
  editForm.Description = row.Description;
  editForm.Contact = row.Contact;
  editVisible.value = true;
}

function submitEdit() {
  if (isSaving.value) return;
  isSaving.value = true;
  editError.value = null;
  client
    .request({
      method: 'user.UpdateMCPServer',
      params: {
        ID: editForm.ID,
        ServiceName: editForm.ServiceName,
        ServicePort: editForm.ServicePort,
        BackendPath: editForm.BackendPath,
        Description: editForm.Description,
        Contact: editForm.Contact,
      },
    })
    .then(() => {
      editVisible.value = false;
      toast.add({ severity: 'success', summary: 'Registration updated', life: 4000 });
      refreshAll();
    })
    .catch((err) => {
      editError.value = err?.message || 'Could not save the changes';
    })
    .finally(() => {
      isSaving.value = false;
    });
}

function confirmWithdraw(row) {
  confirm.require({
    header: 'Withdraw registration',
    message: `Withdraw ${row.PublicPath}? The public URL stops working immediately, and the path becomes available to anyone else.`,
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: 'Cancel', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Withdraw', severity: 'danger' },
    accept: () => withdraw(row),
  });
}

function withdraw(row) {
  busy[row.ID] = 'withdraw';
  client
    .request({ method: 'user.WithdrawMCPServer', params: { ID: row.ID } })
    .then(() => {
      toast.add({ severity: 'success', summary: 'Registration withdrawn', life: 4000 });
      refreshAll();
    })
    .catch((err) => rpcError(err, 'Could not withdraw the registration'))
    .finally(() => {
      delete busy[row.ID];
    });
}

// ---- Admin actions ---------------------------------------------------------

function adminAction(row, method, action, params, summary) {
  busy[row.ID] = action;
  return client
    .request({ method, params: { ID: row.ID, ...params } })
    .then(() => {
      toast.add({ severity: 'success', summary, life: 4000 });
      refreshAll();
    })
    .catch((err) => {
      rpcError(err, 'Action failed');
      throw err;
    })
    .finally(() => {
      delete busy[row.ID];
    });
}

function confirmApprove(row) {
  confirm.require({
    header: 'Approve top-level name',
    message: `Approve ${row.PublicPath} for ${row.OwnerName || row.OwnerEmail}? The route is created on the next reconcile.`,
    icon: 'pi pi-check',
    rejectProps: { label: 'Cancel', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Approve', severity: 'success' },
    accept: () =>
      adminAction(row, 'admin.ApproveMCPServer', 'approve', { Reason: '' }, 'Registration approved').catch(() => {}),
  });
}

function confirmResume(row) {
  confirm.require({
    header: 'Resume registration',
    message: `Resume ${row.PublicPath}? The route is recreated on the next reconcile.`,
    icon: 'pi pi-play',
    rejectProps: { label: 'Cancel', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Resume', severity: 'success' },
    accept: () =>
      adminAction(row, 'admin.ResumeMCPServer', 'resume', { Reason: '' }, 'Registration resumed').catch(() => {}),
  });
}

function confirmDelete(row) {
  confirm.require({
    header: 'Delete registration',
    message: `Delete the record for ${row.PublicPath}? This deletes the record; the route is removed on the next reconcile.`,
    icon: 'pi pi-trash',
    rejectProps: { label: 'Cancel', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Delete', severity: 'danger' },
    accept: () => adminAction(row, 'admin.DeleteMCPServer', 'delete', {}, 'Registration deleted').catch(() => {}),
  });
}

function openReason(action, row) {
  reasonAction.value = action;
  reasonRow.value = row;
  reasonText.value = '';
  reasonError.value = null;
  reasonVisible.value = true;
}

function submitReason() {
  if (isReasonBusy.value) return;
  if (!reasonText.value) {
    reasonError.value = 'A reason is required, and the owner sees it.';
    return;
  }
  const row = reasonRow.value;
  const method = reasonAction.value === 'reject' ? 'admin.RejectMCPServer' : 'admin.SuspendMCPServer';
  const summary = reasonAction.value === 'reject' ? 'Request rejected' : 'Registration suspended';
  isReasonBusy.value = true;
  adminAction(row, method, reasonAction.value, { Reason: reasonText.value }, summary)
    .then(() => {
      reasonVisible.value = false;
    })
    .catch((err) => {
      reasonError.value = err?.message || 'The action failed';
    })
    .finally(() => {
      isReasonBusy.value = false;
    });
}

function forceReconcile() {
  isReconciling.value = true;
  client
    .request({ method: 'admin.ReconcileMCPServers', params: {} })
    .then(() => {
      toast.add({ severity: 'info', summary: 'Reconcile requested', life: 3000 });
      refreshAll();
    })
    .catch((err) => rpcError(err, 'Could not trigger a reconcile'))
    .finally(() => {
      isReconciling.value = false;
    });
}

// ---- Polling ---------------------------------------------------------------
// Rows only move on their own while the reconciler has work to do, so the poll
// runs exactly while something is in flight and stops as soon as nothing is.

const POLL_MS = 15000;
let pollTimer = null;

const inFlight = computed(() => {
  const rows = servers.value.concat(isNrpAdmin.value ? adminServers.value : []);
  return rows.some(
    (r) => r.Status === 'pending' || (r.Status === 'approved' && r.RouteAccepted !== true) || (r.LastError || '') !== ''
  );
});

function startPolling() {
  if (pollTimer !== null) return;
  pollTimer = setInterval(refreshAll, POLL_MS);
}

function stopPolling() {
  if (pollTimer === null) return;
  clearInterval(pollTimer);
  pollTimer = null;
}

watch(inFlight, (active) => {
  if (active) startPolling();
  else stopPolling();
});

onMounted(() => {
  if (user.value == null) {
    isInfoLoading.value = false;
    return;
  }
  loadRegistryInfo();
});

onUnmounted(stopPolling);
</script>
