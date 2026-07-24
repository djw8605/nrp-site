<template>
    <Toast />
    <ConfirmDialog />

    <div class="flex flex-col items-center justify-center">
        <h1 class="text-2xl font-bold mb-4">S3 Storage Credentials</h1>
    </div>

    <div v-if="!user" class="mx-auto flex max-w-sm items-center gap-x-4 rounded-xl bg-white p-6 shadow-lg dark:bg-slate-800 dark:shadow-none">
        Please log in to manage your S3 keys.
    </div>

    <template v-if="user">
        <!-- Pool selector: the primary control; everything below is scoped to it -->
        <div v-if="creds && creds.Pools && creds.Pools.length"
            class="flex flex-wrap items-center justify-between gap-3 mb-6 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3">
            <div class="flex items-center gap-3">
                <label for="pool-select" class="text-sm font-medium">Pool</label>
                <Select id="pool-select" v-model="selectedPool" :options="poolOptions" optionLabel="label"
                    optionValue="value" :disabled="loading" class="w-44" @change="onPoolChange" />
            </div>
            <Button icon="pi pi-refresh" label="Refresh" text severity="secondary" :loading="loading" @click="loadCredentials()" />
        </div>

        <!-- Loading (initial load OR pool switch): skeleton keeps the layout
             stable and signals which pool is loading, instead of freezing the
             previous pool's data on screen. -->
        <div v-if="loading">
            <Card class="my-6">
                <template #title><Skeleton width="16rem" height="1.5rem" /></template>
                <template #content>
                    <div class="grid md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <Skeleton width="7rem" height="0.7rem" class="mb-2" />
                            <Skeleton width="12rem" height="1.75rem" />
                        </div>
                        <div>
                            <Skeleton width="5rem" height="0.7rem" class="mb-2" />
                            <Skeleton width="16rem" height="1.75rem" />
                        </div>
                    </div>
                    <div class="border-t border-slate-200 dark:border-slate-700 pt-4">
                        <Skeleton width="6rem" height="1.2rem" class="mb-3" />
                        <Skeleton width="11rem" height="1.75rem" />
                    </div>
                </template>
            </Card>
            <Card class="my-6">
                <template #title><Skeleton width="10rem" height="1.5rem" /></template>
                <template #content>
                    <Skeleton v-for="n in 3" :key="n" width="100%" height="2.25rem" class="mb-2" />
                </template>
            </Card>
        </div>

        <Message v-else-if="loadError" severity="error" class="my-4">
            <div class="flex items-center justify-between gap-4 w-full">
                <span>{{ loadError }}</span>
                <Button label="Retry" size="small" severity="secondary" @click="loadCredentials()" />
            </div>
        </Message>

        <!-- Selected pool is temporarily unreachable — the pool dropdown above
             stays available so the user can switch instead of being stuck. -->
        <Message v-else-if="creds && creds.PoolUnavailable" severity="warn" class="my-4">
            {{ poolLabel(selectedPool) }} is temporarily unavailable — try another pool or <b>Refresh</b>.
        </Message>

        <!-- No account in this pool -->
        <Card v-else-if="creds && creds.HasAccount === false" class="my-6">
            <template #title>No S3 account in {{ poolLabel(selectedPool) }}</template>
            <template #content>
                <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Create your <b>{{ poolLabel(selectedPool) }}</b> account — keys are emailed as a one-time link.
                </p>
                <p class="text-xs text-slate-400 dark:text-slate-500 mb-4">
                    Expected an account here? The pool may be briefly unreachable — try <b>Refresh</b>.
                </p>
                <Button :label="'Create my account in ' + poolLabel(selectedPool) + ' and email me the credentials'"
                    icon="pi pi-envelope" :loading="isEmailing" @click="emailMyKeys" />
            </template>
        </Card>

        <!-- Account overview for the selected pool -->
        <template v-else-if="creds && creds.HasAccount">
            <Message v-if="readOnly" severity="warn" class="my-4">
                Showing cached data — {{ poolLabel(selectedPool) }} dashboard temporarily unavailable. Key changes paused; existing keys still work.
            </Message>
            <Card class="my-6">
                <template #title>My S3 account — {{ poolLabel(selectedPool) }}</template>
                <template #content>
                    <div class="grid md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <div class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">S3 username</div>
                            <div class="flex items-center gap-1">
                                <code class="text-sm px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 break-all">{{ creds.UID }}</code>
                                <Button icon="pi pi-copy" text rounded size="small" severity="secondary"
                                    aria-label="Copy S3 username" @click="copyText(creds.UID, 'S3 username')" />
                            </div>
                        </div>
                        <div>
                            <div class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Endpoint</div>
                            <code class="text-sm px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 break-all">https://s3-{{ selectedPool }}.nrp-nautilus.io</code>
                        </div>
                    </div>

                    <!-- Main key -->
                    <div class="border-t border-slate-200 dark:border-slate-700 pt-4">
                        <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <h3 class="font-semibold m-0">Main key</h3>
                            <Button :label="'Email me my ' + poolLabel(selectedPool) + ' credentials'" icon="pi pi-envelope" size="small"
                                :loading="isEmailing" :disabled="readOnly" @click="emailMyKeys" />
                        </div>
                        <p class="text-sm text-slate-500 dark:text-slate-400 mb-3">
                            Full access to your buckets. Emailed as a one-time link, never shown.
                        </p>
                        <div v-if="creds.MainAccessKeys && creds.MainAccessKeys.length" class="flex flex-wrap gap-2">
                            <span v-for="ak in creds.MainAccessKeys" :key="ak" class="inline-flex items-center">
                                <code class="text-sm px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 break-all">{{ ak }}</code>
                                <Button icon="pi pi-copy" text rounded size="small" severity="secondary"
                                    aria-label="Copy access key" @click="copyText(ak, 'Access key')" />
                            </span>
                        </div>
                        <p v-else class="text-sm text-slate-500">No main key found.</p>
                    </div>
                </template>
            </Card>

            <!-- App keys -->
            <Card class="my-6">
                <template #title>
                    <div class="flex flex-wrap items-center justify-between gap-2">
                        <span>
                            App keys
                            <span v-if="creds.MaxAppKeys > 0" class="text-sm font-normal text-slate-500">
                                ({{ appKeyCount }} of {{ creds.MaxAppKeys }} used in {{ poolLabel(selectedPool) }})
                            </span>
                        </span>
                        <Button label="New app key" icon="pi pi-plus" size="small"
                            :disabled="atKeyLimit || readOnly" @click="openCreateDialog" />
                    </div>
                </template>
                <template #content>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Revocable per-app credentials. Secrets are emailed as a one-time link.
                    </p>

                    <DataTable v-if="creds.AppKeys && creds.AppKeys.length" :value="creds.AppKeys" class="w-full">
                        <Column field="Name" header="Name">
                            <template #body="{ data }"><span class="font-medium">{{ data.Name }}</span></template>
                        </Column>
                        <Column header="S3 username">
                            <template #body="{ data }">
                                <div class="flex items-center gap-1">
                                    <code class="text-xs break-all">{{ creds.UID }}:{{ data.Name }}</code>
                                    <Button icon="pi pi-copy" text rounded size="small" severity="secondary"
                                        aria-label="Copy S3 username" @click="copyText(creds.UID + ':' + data.Name, 'S3 username')" />
                                </div>
                            </template>
                        </Column>
                        <Column header="Access key">
                            <template #body="{ data }">
                                <div class="flex items-center gap-1">
                                    <code class="text-xs break-all">{{ data.AccessKey }}</code>
                                    <Button icon="pi pi-copy" text rounded size="small" severity="secondary"
                                        aria-label="Copy access key" @click="copyText(data.AccessKey, 'Access key')" />
                                </div>
                            </template>
                        </Column>
                        <Column header="Permissions">
                            <template #body="{ data }">
                                <Tag :value="data.Permissions" :severity="data.Permissions === 'full' ? 'danger' : 'info'" />
                            </template>
                        </Column>
                        <Column header="Actions" class="w-1">
                            <template #body="{ data }">
                                <div class="flex gap-1 whitespace-nowrap">
                                    <Button icon="pi pi-refresh" label="Regenerate" size="small" severity="warn"
                                        :loading="busy[data.Name] === 'regen'" :disabled="!!busy[data.Name] || readOnly"
                                        @click="confirmRegenerate(data)" />
                                    <Button icon="pi pi-trash" label="Delete" size="small" severity="danger"
                                        :loading="busy[data.Name] === 'delete'" :disabled="!!busy[data.Name] || readOnly"
                                        @click="confirmDelete(data)" />
                                </div>
                            </template>
                        </Column>
                    </DataTable>

                    <div v-else class="text-sm text-slate-500">
                        No app keys yet in this pool. Create one to give an application its own revocable credentials.
                    </div>
                </template>
            </Card>

            <!-- Storage usage (account-level, this pool; shared by all keys) -->
            <Card class="my-6">
                <template #title>
                    <div class="flex flex-wrap items-center justify-between gap-2">
                        <span>
                            Storage usage
                            <span class="text-sm font-normal text-slate-500">
                                — {{ formatBytes(creds.TotalSizeUsed) }} in {{ bucketCount }} bucket(s)
                            </span>
                        </span>
                        <span v-if="usageAsOf" class="text-xs text-slate-500">as of {{ usageAsOf }}</span>
                    </div>
                </template>
                <template #content>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Shared by all your keys in this pool. Refreshed periodically.
                    </p>
                    <DataTable v-if="creds.Buckets && creds.Buckets.length" :value="creds.Buckets" class="w-full">
                        <Column field="Bucket" header="Bucket">
                            <template #body="{ data }"><span class="font-medium">{{ data.Bucket }}</span></template>
                        </Column>
                        <Column header="Size">
                            <template #body="{ data }">{{ formatBytes(data.SizeUsed) }}</template>
                        </Column>
                        <Column header="Last activity">
                            <template #body="{ data }">{{ isZeroDate(data.LastAccessed) ? '—' : formatDate(data.LastAccessed) }}</template>
                        </Column>
                    </DataTable>
                    <div v-else class="text-sm text-slate-500">
                        No buckets yet.
                    </div>
                </template>
            </Card>
        </template>

        <p class="text-sm text-center text-slate-500 my-4">
            <a class="underline cursor-pointer text-primary" href="/documentation/userdocs/storage/ceph-s3/">Read more about S3 storage on the NRP</a>
        </p>
    </template>

    <!-- Create app key dialog -->
    <Dialog v-model:visible="createDialogVisible" modal :header="'New app key in ' + poolLabel(selectedPool)" :style="{ width: '32rem' }">
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Credentials are emailed as a one-time link.
        </p>
        <div class="flex flex-col gap-4">
            <FloatLabel variant="on">
                <InputText id="createName" v-model.trim="createName" fluid @keyup.enter="submitCreate" />
                <label for="createName">Key name</label>
            </FloatLabel>
            <small class="text-slate-500 -mt-2">2–32 chars: lowercase letters, digits, dashes.</small>
            <FloatLabel variant="on">
                <Select id="createAccess" v-model="createAccess" :options="accessOptions" optionLabel="label"
                    optionValue="value" class="w-full" />
                <label for="createAccess">Permissions</label>
            </FloatLabel>
            <Message v-if="createError" severity="error">{{ createError }}</Message>
        </div>
        <template #footer>
            <Button label="Cancel" text severity="secondary" :disabled="isCreating" @click="createDialogVisible = false" />
            <Button label="Create &amp; email to me" icon="pi pi-key" :loading="isCreating" @click="submitCreate" />
        </template>
    </Dialog>
</template>

<script setup>
import 'primeicons/primeicons.css'

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
import Select from 'primevue/select';

import { useStore } from '@nanostores/vue';
import { userStore } from '../../auth.ts';

import { RequestManager, HTTPTransport, Client } from '@open-rpc/client-js';

import { ref, reactive, computed, onMounted } from 'vue';

const user = useStore(userStore);
const toast = useToast();
const confirm = useConfirm();

const creds = ref(null);
const selectedPool = ref('');
const isLoading = ref(false);
const loading = isLoading; // template alias
const loadError = ref(null);

const isEmailing = ref(false);

const busy = reactive({}); // per-key action state: 'regen' | 'delete'

const createDialogVisible = ref(false);
const createName = ref('');
const createAccess = ref('full');
const createError = ref(null);
const isCreating = ref(false);

const accessOptions = [
    { label: 'full — full control of all buckets', value: 'full' },
    { label: 'readwrite — read and write objects', value: 'readwrite' },
    { label: 'read — read-only', value: 'read' },
    { label: 'write — write-only', value: 'write' },
];

const nameRegex = /^[a-z0-9][a-z0-9-]{0,30}[a-z0-9]$/;
const POOL_KEY = 's3_selected_pool';

const baseUrl = import.meta.env.PUBLIC_SVC_URL;
const transport = new HTTPTransport(baseUrl + '/rpc', { credentials: 'include' });
const client = new Client(new RequestManager([transport]));

// Pool ids are lowercase (east/west/central); show them Capitalized in the UI
// while keeping the real id as the value/endpoint.
function poolLabel(p) {
    return p ? p.charAt(0).toUpperCase() + p.slice(1) : p;
}
const poolOptions = computed(() => (creds.value?.Pools || []).map((p) => ({ label: poolLabel(p), value: p })));

// Data served from cache because the dashboard is down → reads are fine but
// key changes must be paused until the live dashboard recovers.
const readOnly = computed(() => creds.value?.Stale === true);

const appKeyCount = computed(() => creds.value?.AppKeys?.length || 0);
const bucketCount = computed(() => creds.value?.Buckets?.length || 0);
const atKeyLimit = computed(() =>
    creds.value?.MaxAppKeys > 0 && appKeyCount.value >= creds.value.MaxAppKeys);
const usageAsOf = computed(() => {
    const d = creds.value?.UsageUpdatedAt;
    return d && !isZeroDate(d) ? formatDate(d) : '';
});

onMounted(() => {
    if (user.value == null) return;
    // Restore the last pool the user worked in, so we don't default to a
    // pool that happens to be unreachable/empty for them.
    try {
        const saved = localStorage.getItem(POOL_KEY);
        if (saved) selectedPool.value = saved;
    } catch (e) { /* localStorage unavailable — ignore */ }
    triedPools.clear();
    loadCredentials(true);
});

// Pools tried during an automatic fall-forward, so we don't loop.
const triedPools = new Set();

// auto=true only on the initial/automatic load: if the pool we land on is
// unreachable, advance to the next untried pool so the user isn't stranded on a
// down pool. On an explicit pool choice or manual Refresh (auto=false) we stay
// put and show the "temporarily unavailable" message for that pool.
function loadCredentials(auto = false) {
    isLoading.value = true;
    loadError.value = null;
    client.request({ method: 'user.GetS3Credentials', params: { Pool: selectedPool.value } })
        .then((response) => {
            creds.value = response;
            selectedPool.value = response.SelectedPool;
            try { localStorage.setItem(POOL_KEY, response.SelectedPool); } catch (e) { /* ignore */ }
            triedPools.add(response.SelectedPool);
            if (response.PoolUnavailable && auto) {
                const next = (response.Pools || []).find((p) => !triedPools.has(p));
                if (next) {
                    selectedPool.value = next;
                    loadCredentials(true); // keep the skeleton up through the chain
                    return;
                }
            }
            isLoading.value = false;
        })
        .catch((err) => {
            loadError.value = err.message || 'Failed to load S3 credentials';
            isLoading.value = false;
        });
}

function onPoolChange() {
    triedPools.clear();
    loadCredentials(false);
}

function emailMyKeys() {
    isEmailing.value = true;
    client.request({ method: 'user.GetS3Keys', params: { Pool: selectedPool.value } })
        .then(() => {
            toast.add({
                severity: 'success',
                summary: 'Credentials sent',
                detail: 'Check your email for a one-time link to your ' + poolLabel(selectedPool.value) + ' S3 credentials.',
                life: 5000,
            });
            loadCredentials();
        })
        .catch((err) => {
            toast.add({ severity: 'error', summary: 'Failed to send credentials', detail: err.message, life: 5000 });
        })
        .finally(() => { isEmailing.value = false; });
}

function openCreateDialog() {
    createName.value = '';
    createAccess.value = 'full';
    createError.value = null;
    createDialogVisible.value = true;
}

function submitCreate() {
    if (isCreating.value) return;
    if (!nameRegex.test(createName.value)) {
        createError.value = 'Key name must be 2–32 characters: lowercase letters, digits and dashes, starting and ending with a letter or digit.';
        return;
    }
    isCreating.value = true;
    createError.value = null;
    client.request({
        method: 'user.CreateS3AppKey',
        params: { Pool: selectedPool.value, Name: createName.value, Access: createAccess.value },
    })
        .then(() => {
            createDialogVisible.value = false;
            toast.add({
                severity: 'success',
                summary: 'App key created',
                detail: 'A one-time link with the credentials was emailed to you.',
                life: 5000,
            });
            loadCredentials();
        })
        .catch((err) => { createError.value = err.message || 'Failed to create the key'; })
        .finally(() => { isCreating.value = false; });
}

function confirmDelete(key) {
    confirm.require({
        header: 'Delete app key',
        message: `Delete app key "${key.Name}" in ${poolLabel(selectedPool.value)}? Any application using it will immediately lose access.`,
        icon: 'pi pi-exclamation-triangle',
        rejectProps: { label: 'Cancel', severity: 'secondary', outlined: true },
        acceptProps: { label: 'Delete', severity: 'danger' },
        accept: () => deleteKey(key),
    });
}

function deleteKey(key) {
    busy[key.Name] = 'delete';
    client.request({ method: 'user.DeleteS3AppKey', params: { Pool: selectedPool.value, Name: key.Name } })
        .then(() => {
            toast.add({ severity: 'success', summary: 'App key deleted', detail: `"${key.Name}" was revoked in ${poolLabel(selectedPool.value)}.`, life: 4000 });
            loadCredentials();
        })
        .catch((err) => {
            toast.add({ severity: 'error', summary: 'Failed to delete the key', detail: err.message, life: 5000 });
        })
        .finally(() => { delete busy[key.Name]; });
}

function confirmRegenerate(key) {
    confirm.require({
        header: 'Regenerate app key',
        message: `Regenerate app key "${key.Name}" in ${poolLabel(selectedPool.value)}? The current access and secret keys stop working immediately, and a new one is emailed to you as a one-time link.`,
        icon: 'pi pi-refresh',
        rejectProps: { label: 'Cancel', severity: 'secondary', outlined: true },
        acceptProps: { label: 'Regenerate', severity: 'warn' },
        accept: () => regenerateKey(key),
    });
}

function regenerateKey(key) {
    busy[key.Name] = 'regen';
    client.request({ method: 'user.RegenerateS3AppKey', params: { Pool: selectedPool.value, Name: key.Name } })
        .then(() => {
            toast.add({
                severity: 'success',
                summary: 'App key regenerated',
                detail: 'A one-time link with the new credentials was emailed to you.',
                life: 5000,
            });
            loadCredentials();
        })
        .catch((err) => {
            toast.add({ severity: 'error', summary: 'Failed to regenerate the key', detail: err.message, life: 5000 });
        })
        .finally(() => { delete busy[key.Name]; });
}

function copyText(text, label) {
    const done = () => toast.add({ severity: 'info', summary: (label || 'Text') + ' copied', life: 2000 });
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => {});
    } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        done();
    }
}

function formatBytes(bytes) {
    bytes = bytes || 0;
    const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) { bytes /= 1024; i++; }
    return (i === 0 ? bytes : bytes.toFixed(1)) + ' ' + units[i];
}

function isZeroDate(d) {
    return !d || String(d).indexOf('0001-01-01') === 0;
}

function formatDate(d) {
    return new Date(d).toLocaleString();
}
</script>
