<template>
  <Toast />

  <div
    v-if="!user"
    class="mx-auto flex max-w-sm items-center gap-x-4 rounded-xl bg-white p-6 shadow-lg dark:bg-slate-800 dark:shadow-none"
  >
    Please log in to diagnose your pods.
  </div>

  <div v-if="user" class="flex flex-col gap-4">
    <div class="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label for="pod-search" class="mb-1 block text-sm font-medium">Search</label>
          <input
            id="pod-search"
            v-model="searchQuery"
            type="text"
            placeholder="Search pod, namespace, container, node, phase..."
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
            :disabled="isLoadingNamespaces || isLoadingPods"
          />
        </div>

        <div>
          <label for="namespace-filter" class="mb-1 block text-sm font-medium">Namespace filter</label>
          <select
            id="namespace-filter"
            v-model="selectedNamespaceFilter"
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
            :disabled="isLoadingNamespaces || isLoadingPods"
            @change="onNamespaceFilterChanged"
          >
            <option :value="ALL_NAMESPACES">All namespaces</option>
            <option v-for="ns in namespaces" :key="ns.label" :value="ns.apiName">{{ ns.label }}</option>
          </select>
        </div>
      </div>

      <div class="mt-3 flex flex-wrap items-center gap-3">
        <button class="btn-primary px-4 py-2 text-sm" :disabled="isLoadingPods" @click="loadPods">
          Refresh Pods
        </button>
        <button
          class="rounded-md border border-slate-400 px-4 py-2 text-sm dark:border-slate-500"
          :disabled="isLoadingPods"
          @click="clearFilters"
        >
          Clear Filters
        </button>
        <input id="running-only" v-model="showRunningOnly" type="checkbox" />
        <label for="running-only" class="text-sm">Show running pods only</label>
        <span class="text-sm text-slate-600 dark:text-slate-300">
          Showing {{ filteredPods.length }} pods
        </span>
        <span v-if="pendingPodCount > 0" class="text-sm text-amber-700 dark:text-amber-300">
          {{ pendingPodCount }} pending
        </span>
        <span class="text-sm text-slate-500 dark:text-slate-400">
          ({{ namespaces.length }} namespaces)
        </span>
      </div>
    </div>

    <div
      v-if="isLoadingNamespaces || isLoadingPods"
      class="relative h-20 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
    >
      <VueSpinnerPie
        size="40"
        style="z-index: 10; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"
        color="red"
      />
    </div>

    <div
      v-else-if="filteredPods.length === 0"
      class="mx-auto flex max-w-xl items-center gap-x-4 rounded-xl bg-white p-6 shadow-lg dark:bg-slate-800 dark:shadow-none"
    >
      No pods found for the current filters.
    </div>

    <div
      v-else
      class="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
    >
      <DataTable
        :value="filteredPods"
        paginator
        :rows="rowsPerPage"
        :first="firstRow"
        :rowsPerPageOptions="[10, 25, 50, 100]"
        sortMode="multiple"
        removableSort
        @page="onPage"
      >
        <Column field="podName" header="Pod" sortable></Column>
        <Column field="namespace" header="Namespace" sortable></Column>
        <Column field="phase" header="Phase" sortable>
          <template #body="slotProps">
            <span
              class="rounded px-2 py-1 text-xs font-semibold"
              :class="phaseClass(slotProps.data.phase)"
            >
              {{ slotProps.data.phase }}
            </span>
          </template>
        </Column>
        <Column field="ready" header="Ready" sortable></Column>
        <Column field="restarts" header="Restarts" sortable></Column>
        <Column field="cpu" header="CPU" sortable></Column>
        <Column field="memory" header="Memory" sortable></Column>
        <Column field="node" header="Node" sortable></Column>
        <Column field="age" header="Age" sortable></Column>
        <Column header="Container">
          <template #body="slotProps">
            <select
              v-if="slotProps.data.containers.length > 0"
              v-model="selectedContainerByPod[slotProps.data.key]"
              class="w-44 rounded-md border border-slate-300 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-900"
            >
              <option value="">All containers</option>
              <option
                v-for="container in slotProps.data.containers"
                :key="`${slotProps.data.key}/${container}`"
                :value="container"
              >
                {{ container }}
              </option>
            </select>
            <span v-else class="text-xs text-slate-500 dark:text-slate-400">-</span>
          </template>
        </Column>
        <Column header="Action">
          <template #body="slotProps">
            <button class="btn-primary px-3 py-1 text-xs" @click="openDiagnose(slotProps.data)">
              AI Diagnose
            </button>
          </template>
        </Column>
      </DataTable>
    </div>

    <PodAIDiagnosePanel
      v-if="isDiagnosePanelOpen"
      :visible="isDiagnosePanelOpen"
      :namespace="diagnoseNamespace"
      :pod-name="diagnosePodName"
      :container="diagnoseContainer"
      @close="closeDiagnosePanel"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useStore } from '@nanostores/vue';
import { RequestManager, HTTPTransport, Client } from '@open-rpc/client-js';
import { VueSpinnerPie } from 'vue3-spinners';

import Toast from 'primevue/toast';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { useToast } from 'primevue/usetoast';
import PodAIDiagnosePanel from './PodAIDiagnosePanel.vue';

import { userStore } from '../../auth.ts';

interface PodRow {
  key: string;
  podName: string;
  namespace: string;
  isRunning: boolean;
  phase: string;
  ready: string;
  restarts: number;
  cpu: string;
  memory: string;
  node: string;
  age: string;
  containers: string[];
}

interface NamespaceOption {
  label: string;
  apiName: string;
}

const ALL_NAMESPACES = '__all__';

const user = useStore(userStore);
const toast = useToast();

const namespaces = ref<NamespaceOption[]>([]);
const selectedNamespaceFilter = ref<string>(ALL_NAMESPACES);
const pods = ref<PodRow[]>([]);
const showRunningOnly = ref(false);
const searchQuery = ref('');
const rowsPerPage = ref(25);
const firstRow = ref(0);
const selectedContainerByPod = ref<Record<string, string>>({});
const isDiagnosePanelOpen = ref(false);
const diagnoseNamespace = ref('');
const diagnosePodName = ref('');
const diagnoseContainer = ref('');

const isLoadingNamespaces = ref(false);
const isLoadingPods = ref(false);

const toK8sNamespace = (namespaceName: string): string => {
  const parts = String(namespaceName).split('/').filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : String(namespaceName);
};

const baseUrl = String(import.meta.env.PUBLIC_SVC_URL ?? '').trim().replace(/\/$/, '');
const rpcUrl = baseUrl ? `${baseUrl}/rpc` : '/rpc';
const transport = new HTTPTransport(rpcUrl, {
  credentials: 'include',
});
const client = new Client(new RequestManager([transport]));

const podsInScope = computed(() => {
  if (selectedNamespaceFilter.value === ALL_NAMESPACES) {
    return pods.value;
  }
  return pods.value.filter((pod) => pod.namespace === selectedNamespaceFilter.value);
});

const filteredPods = computed(() => {
  let data = podsInScope.value;

  if (showRunningOnly.value) {
    data = data.filter((pod) => pod.isRunning);
  }

  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return data;

  return data.filter((pod) => {
    const searchable = [
      pod.podName,
      pod.namespace,
      pod.phase,
      pod.ready,
      String(pod.restarts),
      pod.cpu,
      pod.memory,
      pod.node,
      pod.age,
      pod.containers.join(' '),
      pod.isRunning ? 'yes running' : 'no not running',
    ]
      .join(' ')
      .toLowerCase();
    return searchable.includes(query);
  });
});

const pendingPodCount = computed(() => {
  return podsInScope.value.filter((pod) => pod.phase.toLowerCase() === 'pending').length;
});

const phaseClass = (phase: string): string => {
  const normalizedPhase = phase.toLowerCase();
  if (normalizedPhase === 'running') return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200';
  if (normalizedPhase === 'pending') return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
  if (normalizedPhase === 'failed') return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200';
  if (normalizedPhase === 'succeeded') return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200';
  return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
};

const stringOrDash = (value: unknown): string => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  return String(value);
};

const boolFromValue = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  if (typeof value === 'number') return value > 0;
  return false;
};

const deriveReady = (pod: Record<string, any>): string => {
  if (pod.Ready !== undefined || pod.ready !== undefined) {
    return String(pod.Ready ?? pod.ready);
  }
  const statuses =
    pod.ContainerStatuses ??
    pod.containerStatuses ??
    pod.Status?.ContainerStatuses ??
    pod.status?.containerStatuses;
  if (Array.isArray(statuses) && statuses.length > 0) {
    const readyCount = statuses.filter((s: Record<string, any>) => s.Ready ?? s.ready).length;
    return `${readyCount}/${statuses.length}`;
  }
  return '-';
};

const deriveRestarts = (pod: Record<string, any>): number => {
  if (typeof pod.Restarts === 'number') return pod.Restarts;
  if (typeof pod.restarts === 'number') return pod.restarts;
  const statuses =
    pod.ContainerStatuses ??
    pod.containerStatuses ??
    pod.Status?.ContainerStatuses ??
    pod.status?.containerStatuses;
  if (Array.isArray(statuses)) {
    return statuses.reduce((sum: number, s: Record<string, any>) => sum + Number(s.RestartCount ?? s.restartCount ?? 0), 0);
  }
  return 0;
};

const deriveAge = (pod: Record<string, any>): string => {
  if (pod.Age || pod.age) return String(pod.Age ?? pod.age);

  const start =
    pod.StartTime ??
    pod.startTime ??
    pod.CreationTimestamp ??
    pod.creationTimestamp ??
    pod.metadata?.creationTimestamp;

  if (!start) return '-';

  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) return '-';

  const diffMs = Date.now() - startDate.getTime();
  if (diffMs < 0) return '0m';

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
};

const deriveContainers = (pod: Record<string, any>): string[] => {
  const direct = pod.Containers ?? pod.containers;
  if (Array.isArray(direct)) {
    return Array.from(new Set(direct.map((item: unknown) => String(item)).filter((name) => name.length > 0)));
  }

  const fromSpec = pod.Spec?.Containers ?? pod.spec?.containers;
  if (Array.isArray(fromSpec)) {
    return Array.from(
      new Set(
        fromSpec
          .map((container: Record<string, any>) => String(container?.Name ?? container?.name ?? ''))
          .filter((name) => name.length > 0)
      )
    );
  }

  const fromStatus = pod.ContainerStatuses ?? pod.containerStatuses;
  if (Array.isArray(fromStatus)) {
    return Array.from(
      new Set(
        fromStatus
          .map((container: Record<string, any>) => String(container?.Name ?? container?.name ?? ''))
          .filter((name) => name.length > 0)
      )
    );
  }

  return [];
};

const normalizePods = (response: Record<string, any>, namespaceHint = ''): PodRow[] => {
  const payload = (response?.result as Record<string, any>) ?? response;
  const rawPods = payload?.Pods ?? payload?.pods ?? payload?.Items ?? payload?.items ?? [];
  if (!Array.isArray(rawPods)) return [];

  return rawPods.map((rawPod: Record<string, any>, index: number) => {
    const podName = String(rawPod.PodName ?? rawPod.Name ?? rawPod.podName ?? rawPod.metadata?.name ?? `pod-${index}`);
    const namespace = toK8sNamespace(
      String(rawPod.Namespace ?? rawPod.namespace ?? rawPod.metadata?.namespace ?? namespaceHint ?? '')
    );
    const phase = String(rawPod.Phase ?? rawPod.phase ?? rawPod.Status?.Phase ?? rawPod.status?.phase ?? '-');
    const running = rawPod.Running !== undefined ? boolFromValue(rawPod.Running) : phase.toLowerCase() === 'running';

    return {
      key: `${namespace}/${podName}`,
      podName,
      namespace,
      isRunning: running,
      phase,
      ready: deriveReady(rawPod),
      restarts: deriveRestarts(rawPod),
      cpu: stringOrDash(rawPod.CPUUsage ?? rawPod.CPU ?? rawPod.Cpu ?? rawPod.Metrics?.CPU ?? rawPod.metrics?.cpu),
      memory: stringOrDash(
        rawPod.MemoryUsage ?? rawPod.Memory ?? rawPod.memory ?? rawPod.Metrics?.Memory ?? rawPod.metrics?.memory
      ),
      node: stringOrDash(rawPod.Node ?? rawPod.NodeName ?? rawPod.node ?? rawPod.spec?.nodeName),
      age: deriveAge(rawPod),
      containers: deriveContainers(rawPod),
    };
  });
};

const loadNamespaces = async () => {
  isLoadingNamespaces.value = true;
  try {
    const response = (await client.request({
      method: 'groups.ListUserGroups',
    })) as Record<string, any>;

    if (response.error) {
      throw new Error(response.error.message || 'Failed to load namespaces');
    }

    const payload = (response?.result as Record<string, any>) ?? response;
    const raw = Array.isArray(payload.Namespaces) ? payload.Namespaces : [];
    const userNamespaces = raw
      .filter((ns: Record<string, any>) => (ns.IsMember ?? true) && (ns.IsK8sNamespace ?? true))
      .map((ns: Record<string, any>) => {
        const label = String(ns.Name);
        return {
          label,
          apiName: toK8sNamespace(label),
        };
      });

    namespaces.value = userNamespaces;
    if (
      selectedNamespaceFilter.value !== ALL_NAMESPACES &&
      !namespaces.value.some((namespace) => namespace.apiName === selectedNamespaceFilter.value)
    ) {
      selectedNamespaceFilter.value = ALL_NAMESPACES;
    }
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error loading namespaces',
      detail: error?.message || 'Unable to load namespaces',
      life: 4000,
    });
  } finally {
    isLoadingNamespaces.value = false;
  }
};

const loadPods = async () => {
  const namespacesToQuery =
    selectedNamespaceFilter.value === ALL_NAMESPACES
      ? namespaces.value
      : namespaces.value.filter((namespace) => namespace.apiName === selectedNamespaceFilter.value);

  if (namespacesToQuery.length === 0) {
    pods.value = [];
    return;
  }

  isLoadingPods.value = true;
  try {
    const requests = namespacesToQuery.map((namespace) =>
      client.request({
        method: 'user.ListNamespacePods',
        params: {
          Namespace: namespace.apiName,
        },
      })
    );
    const results = await Promise.allSettled(requests);

    const mergedPods: PodRow[] = [];
    const failedNamespaces: string[] = [];

    for (let idx = 0; idx < results.length; idx += 1) {
      const result = results[idx];
      const namespace = namespacesToQuery[idx];

      if (result.status === 'rejected') {
        failedNamespaces.push(namespace.label);
        continue;
      }

      const response = result.value as Record<string, any>;
      if (response.error) {
        failedNamespaces.push(namespace.label);
        continue;
      }

      mergedPods.push(...normalizePods(response, namespace.apiName));
    }

    mergedPods.sort((a, b) => {
      if (a.namespace !== b.namespace) return a.namespace.localeCompare(b.namespace);
      return a.podName.localeCompare(b.podName);
    });

    pods.value = mergedPods;
    const nextSelected: Record<string, string> = {};
    for (const pod of mergedPods) {
      const previouslySelected = selectedContainerByPod.value[pod.key];
      if (previouslySelected && pod.containers.includes(previouslySelected)) {
        nextSelected[pod.key] = previouslySelected;
      }
    }
    selectedContainerByPod.value = nextSelected;

    if (failedNamespaces.length > 0) {
      const isSelectedNamespace = selectedNamespaceFilter.value !== ALL_NAMESPACES;
      toast.add({
        severity: isSelectedNamespace ? 'error' : 'warn',
        summary: isSelectedNamespace ? 'Unable to load selected namespace' : 'Partial pod list',
        detail: isSelectedNamespace
          ? `Failed to load pods for ${failedNamespaces[0]}.`
          : `Failed to load pods for ${failedNamespaces.length} namespace(s).`,
        life: 5000,
      });
    }
  } catch (error: any) {
    pods.value = [];
    toast.add({
      severity: 'error',
      summary: 'Error loading pods',
      detail: error?.message || 'Unable to load pods',
      life: 4000,
    });
  } finally {
    isLoadingPods.value = false;
  }
};

const onPage = (event: any) => {
  firstRow.value = event.first;
  rowsPerPage.value = event.rows;
};

const clearFilters = () => {
  selectedNamespaceFilter.value = ALL_NAMESPACES;
  searchQuery.value = '';
  showRunningOnly.value = false;
  rowsPerPage.value = 25;
  firstRow.value = 0;
  void loadPods();
};

const getSelectedContainer = (pod: PodRow): string => {
  return selectedContainerByPod.value[pod.key] ?? '';
};

const openDiagnose = (pod: PodRow) => {
  diagnoseNamespace.value = pod.namespace;
  diagnosePodName.value = pod.podName;
  diagnoseContainer.value = getSelectedContainer(pod);
  isDiagnosePanelOpen.value = true;
};

const closeDiagnosePanel = () => {
  isDiagnosePanelOpen.value = false;
  diagnoseNamespace.value = '';
  diagnosePodName.value = '';
  diagnoseContainer.value = '';
};

const onNamespaceFilterChanged = () => {
  firstRow.value = 0;
  void loadPods();
};

onMounted(async () => {
  if (!user.value) return;

  const query = new URLSearchParams(window.location.search);
  const namespaceFromQuery = query.get('namespace');
  if (namespaceFromQuery && namespaceFromQuery.trim().length > 0) {
    selectedNamespaceFilter.value = toK8sNamespace(namespaceFromQuery);
  }

  await loadNamespaces();
  await loadPods();
});

watch([showRunningOnly, searchQuery, selectedNamespaceFilter, rowsPerPage], () => {
  firstRow.value = 0;
});
</script>
