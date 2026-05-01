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
            placeholder="Search pod, namespace, node, phase..."
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
            :disabled="isLoadingNamespaces || isLoadingPods"
          />
        </div>

        <div>
          <label for="namespace-filter" class="mb-1 block text-sm font-medium">Namespace filter</label>
          <Select
            id="namespace-filter"
            v-model="selectedNamespaceFilter"
            :options="namespaceFilterOptions"
            optionLabel="label"
            optionValue="apiName"
            filter
            filterPlaceholder="Search namespaces"
            placeholder="All namespaces"
            class="w-full text-sm"
            :disabled="isLoadingNamespaces || isLoadingPods"
            @change="onNamespaceFilterChanged"
          />
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
        v-model:expandedRows="expandedRows"
        :value="filteredPods"
        dataKey="key"
        paginator
        :rows="rowsPerPage"
        :first="firstRow"
        :rowsPerPageOptions="[10, 25, 50, 100]"
        sortMode="multiple"
        removableSort
        @page="onPage"
      >
        <Column header="Diagnose" frozen>
          <template #body="slotProps">
            <button
              class="btn-primary whitespace-nowrap px-3 py-1 text-xs"
              :disabled="isDiagnosing"
              @click="startDiagnose(slotProps.data)"
            >
              {{ diagnoseButtonLabel(slotProps.data) }}
            </button>
          </template>
        </Column>
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
        <Column field="node" header="Node" sortable></Column>
        <Column field="age" header="Age" sortable></Column>

        <template #expansion="slotProps">
          <div class="h-96 overflow-hidden border-y border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
            <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 class="text-sm font-semibold">
                  AI Diagnosis: {{ slotProps.data.namespace }}/{{ slotProps.data.podName }}
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  Live query, tool activity, and final diagnosis
                </p>
              </div>
              <div class="flex items-center gap-2">
                <span
                  class="rounded px-2 py-1 text-xs font-semibold"
                  :class="diagnoseStatusClass"
                >
                  {{ diagnoseStatusLabel }}
                </span>
                <button
                  class="rounded-md border border-slate-300 px-2 py-1 text-xs dark:border-slate-600"
                  type="button"
                  @click="closeInlineDiagnosis"
                >
                  {{ isDiagnosing ? 'Stop' : 'Close' }}
                </button>
              </div>
            </div>

            <div class="grid h-[18.5rem] grid-cols-1 gap-3 lg:grid-cols-[18rem_1fr]">
              <div class="overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                <div class="border-b border-slate-200 px-3 py-2 text-xs font-semibold dark:border-slate-700">
                  Diagnostic Activity
                </div>
                <div ref="timelineScrollEl" class="h-[16rem] overflow-y-auto p-3">
                  <div v-if="timelineEvents.length === 0" class="text-xs text-slate-600 dark:text-slate-300">
                    Waiting for diagnostic activity.
                  </div>
                  <ol v-else class="space-y-3">
                    <li
                      v-for="event in timelineEvents"
                      :key="event.localId"
                      class="flex gap-2 text-xs"
                    >
                      <span class="mt-0.5" :class="eventTypeClass(event.type)">
                        <i :class="eventTypeIcon(event.type)"></i>
                      </span>
                      <span>
                        <span class="block font-medium" :class="eventTypeClass(event.type)">
                          {{ event.message }}
                        </span>
                        <span class="block text-[11px] text-slate-500 dark:text-slate-400">
                          {{ event.timestamp }}
                        </span>
                      </span>
                    </li>
                  </ol>

                  <div v-if="isThinking" class="mt-3 flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                    <i class="pi pi-spin pi-spinner"></i>
                    <span>AI is thinking...</span>
                  </div>
                </div>
              </div>

              <div class="overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-3 py-2 dark:border-slate-700">
                  <span class="text-xs font-semibold">Diagnosis</span>
                  <div class="flex items-center gap-2">
                    <span v-if="streamError" class="text-xs text-red-700 dark:text-red-300">{{ streamError }}</span>
                    <span v-else-if="doneMessage" class="text-xs text-green-700 dark:text-green-300">{{ doneMessage }}</span>
                    <button
                      class="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600"
                      type="button"
                      :disabled="markdownBody.length === 0"
                      title="Copy full diagnosis"
                      @click="copyDiagnosis"
                    >
                      <i class="pi pi-copy"></i>
                      Copy
                    </button>
                  </div>
                </div>
                <div
                  class="diagnosis-scroll h-[16rem] overflow-auto p-3"
                >
                  <div v-if="markdownBody.length === 0" class="text-xs text-slate-600 dark:text-slate-300">
                    The diagnosis will stream here as the AI reaches its conclusion.
                  </div>
                  <div
                    v-else
                    class="diagnosis-markdown prose prose-sm max-w-none dark:prose-invert prose-pre:text-xs prose-code:text-xs"
                    v-html="renderedMarkdown"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useStore } from '@nanostores/vue';
import { RequestManager, HTTPTransport, Client } from '@open-rpc/client-js';
import { VueSpinnerPie } from 'vue3-spinners';
import { marked } from 'marked';

import Toast from 'primevue/toast';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Select from 'primevue/select';
import { useToast } from 'primevue/usetoast';

import { userStore } from '../../auth.ts';

interface PodRow {
  key: string;
  podName: string;
  namespace: string;
  isRunning: boolean;
  phase: string;
  ready: string;
  restarts: number;
  node: string;
  age: string;
}

interface NamespaceOption {
  label: string;
  apiName: string;
}

interface StreamEventRow {
  localId: string;
  timestamp: string;
  type: string;
  message: string;
}

type DiagnoseState = 'idle' | 'connecting' | 'streaming' | 'completed' | 'failed';

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
const expandedRows = ref<Record<string, boolean>>({});

const activeDiagnosePodKey = ref('');
const activeDiagnoseNamespace = ref('');
const activeDiagnosePodName = ref('');
const diagnoseState = ref<DiagnoseState>('idle');
const timelineEvents = ref<StreamEventRow[]>([]);
const markdownBody = ref('');
const doneMessage = ref('');
const streamError = ref('');
const eventSource = ref<EventSource | null>(null);
const timelineScrollEl = ref<HTMLElement | null>(null);
const lastTokenAtMs = ref(0);
const lastStatusAtMs = ref(0);
const lastToolCallAtMs = ref(0);
const nowMs = ref(Date.now());
let localEventCounter = 0;
let activeTokenEventId: string | null = null;
let thinkingTimer: ReturnType<typeof setInterval> | null = null;

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

const TOOL_ACTIVITY_LABELS: Record<string, string> = {
  get_pod_logs: 'Reading current pod logs',
  get_previous_container_logs: 'Checking previous container logs',
  describe_pod: 'Inspecting pod status and events',
  get_pod_yaml: 'Reviewing the pod spec',
  get_namespace_events: 'Looking at recent namespace events',
  get_namespace_resource_quotas: 'Checking namespace quotas',
  get_pvc_status: 'Checking attached storage',
  get_node_conditions: 'Checking node health',
  get_node_events: 'Reviewing node events',
  get_nodes_capacity: 'Comparing pending pod requests with cluster capacity',
};

const podsInScope = computed(() => {
  if (selectedNamespaceFilter.value === ALL_NAMESPACES) {
    return pods.value;
  }
  return pods.value.filter((pod) => pod.namespace === selectedNamespaceFilter.value);
});

const namespaceFilterOptions = computed<NamespaceOption[]>(() => {
  return [
    {
      label: 'All namespaces',
      apiName: ALL_NAMESPACES,
    },
    ...namespaces.value,
  ];
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
      pod.node,
      pod.age,
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

const isDiagnosing = computed(() => {
  return diagnoseState.value === 'connecting' || diagnoseState.value === 'streaming';
});

const isReceivingTokens = computed(() => {
  return nowMs.value - lastTokenAtMs.value <= 800;
});

const hasActiveStatusOrTool = computed(() => {
  return nowMs.value - lastStatusAtMs.value <= 1200 || nowMs.value - lastToolCallAtMs.value <= 1200;
});

const isThinking = computed(() => {
  return isDiagnosing.value && !isReceivingTokens.value && !hasActiveStatusOrTool.value;
});

const diagnoseStatusLabel = computed(() => {
  if (diagnoseState.value === 'connecting') return 'Connecting';
  if (diagnoseState.value === 'streaming') return 'Diagnosing';
  if (diagnoseState.value === 'completed') return 'Done';
  if (diagnoseState.value === 'failed') return 'Failed';
  return 'Ready';
});

const diagnoseStatusClass = computed(() => {
  if (isDiagnosing.value) return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200';
  if (diagnoseState.value === 'completed') return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200';
  if (diagnoseState.value === 'failed') return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200';
  return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
});

const renderedMarkdown = computed(() => {
  return renderMarkdown(markdownBody.value);
});

const phaseClass = (phase: string): string => {
  const normalizedPhase = phase.toLowerCase();
  if (normalizedPhase === 'running') return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200';
  if (normalizedPhase === 'pending') return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
  if (normalizedPhase === 'failed') return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200';
  if (normalizedPhase === 'succeeded') return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200';
  return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
};

const eventTypeIcon = (eventType: string): string => {
  if (eventType === 'status') return 'pi pi-spin pi-spinner';
  if (eventType === 'tool_call') return 'pi pi-search';
  if (eventType === 'token') return 'pi pi-file-edit';
  if (eventType === 'done') return 'pi pi-check-circle';
  if (eventType === 'error') return 'pi pi-exclamation-triangle';
  return 'pi pi-info-circle';
};

const eventTypeClass = (eventType: string): string => {
  if (eventType === 'status') return 'text-blue-700 dark:text-blue-300';
  if (eventType === 'tool_call') return 'text-purple-700 dark:text-purple-300';
  if (eventType === 'done') return 'text-green-700 dark:text-green-300';
  if (eventType === 'error') return 'text-red-700 dark:text-red-300';
  if (eventType === 'token') return 'text-slate-700 dark:text-slate-200';
  return 'text-slate-700 dark:text-slate-200';
};

const diagnoseButtonLabel = (pod: PodRow): string => {
  if (activeDiagnosePodKey.value !== pod.key) return 'AI Diagnose';
  if (isDiagnosing.value) return 'Diagnosing...';
  if (diagnoseState.value === 'completed') return 'Diagnose Again';
  if (diagnoseState.value === 'failed') return 'Retry Diagnosis';
  return 'AI Diagnose';
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
      node: stringOrDash(rawPod.Node ?? rawPod.NodeName ?? rawPod.node ?? rawPod.spec?.nodeName),
      age: deriveAge(rawPod),
    };
  });
};

const renderMarkdown = (source: string): string => {
  if (!source) return '';
  const escaped = source
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
  return marked.parse(escaped, { gfm: true, breaks: true, async: false }) as string;
};

const safeJsonParse = (value: string): unknown => {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const compactStatusMessage = (payload: unknown): string => {
  if (typeof payload === 'string') return payload || 'Checking pod';
  const payloadObject = (payload ?? {}) as Record<string, any>;
  if (typeof payloadObject.message === 'string' && payloadObject.message.length > 0) {
    return payloadObject.message;
  }
  if (typeof payloadObject.step === 'string' && payloadObject.step.length > 0) {
    return payloadObject.step;
  }
  return 'Checking pod';
};

const compactToolMessage = (payload: unknown): string => {
  if (payload === null || typeof payload !== 'object') return 'Gathering pod context';
  const toolName = String((payload as Record<string, any>).tool ?? '');
  return TOOL_ACTIVITY_LABELS[toolName] ?? 'Gathering pod context';
};

const pushTimelineEvent = (type: string, message: string) => {
  localEventCounter += 1;
  const localId = `${localEventCounter}`;
  timelineEvents.value.push({
    localId,
    timestamp: new Date().toLocaleTimeString(),
    type,
    message,
  });
  void queueTimelineAutoScroll();
  return localId;
};

const copyWithFallback = (text: string): boolean => {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();

  try {
    return document.execCommand('copy');
  } finally {
    document.body.removeChild(textarea);
  }
};

const copyDiagnosis = async () => {
  const diagnosisText = markdownBody.value.trim();
  if (!diagnosisText) return;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(diagnosisText);
    } else if (!copyWithFallback(diagnosisText)) {
      throw new Error('Clipboard copy failed');
    }

    toast.add({
      severity: 'success',
      summary: 'Diagnosis copied',
      detail: 'The full diagnosis was copied to the clipboard.',
      life: 2500,
    });
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Copy failed',
      detail: error?.message || 'Unable to copy the diagnosis.',
      life: 3500,
    });
  }
};

const queueTimelineAutoScroll = async () => {
  await nextTick();
  if (timelineScrollEl.value) {
    timelineScrollEl.value.scrollTop = timelineScrollEl.value.scrollHeight;
  }
};

const closeStream = () => {
  if (eventSource.value) {
    eventSource.value.close();
    eventSource.value = null;
  }
};

const resetDiagnosis = () => {
  closeStream();
  timelineEvents.value = [];
  markdownBody.value = '';
  doneMessage.value = '';
  streamError.value = '';
  diagnoseState.value = 'idle';
  localEventCounter = 0;
  activeTokenEventId = null;
  lastTokenAtMs.value = 0;
  lastStatusAtMs.value = 0;
  lastToolCallAtMs.value = 0;
};

const buildDiagnoseStreamUrl = (): string => {
  const endpoint = baseUrl ? `${baseUrl}/api/user/ai/diagnose-pod` : '/api/user/ai/diagnose-pod';
  const url = endpoint.startsWith('http://') || endpoint.startsWith('https://')
    ? new URL(endpoint)
    : new URL(endpoint, window.location.origin);

  url.searchParams.set('namespace', activeDiagnoseNamespace.value);
  url.searchParams.set('pod', activeDiagnosePodName.value);
  return url.toString();
};

const handleSSEEvent = (eventType: string, event: MessageEvent) => {
  const parsed = safeJsonParse(event.data);

  if (eventType === 'token') {
    lastTokenAtMs.value = Date.now();
    const tokenPayload = (parsed ?? {}) as Record<string, any>;
    const token = typeof tokenPayload.token === 'string' ? tokenPayload.token : '';
    if (token) {
      markdownBody.value += token;
      if (!activeTokenEventId) {
        activeTokenEventId = pushTimelineEvent('token', 'Writing diagnosis');
      }
    }
    if (diagnoseState.value === 'connecting') {
      diagnoseState.value = 'streaming';
    }
    return;
  }

  activeTokenEventId = null;

  if (eventType === 'status') {
    lastStatusAtMs.value = Date.now();
    if (diagnoseState.value === 'connecting') {
      diagnoseState.value = 'streaming';
    }
    pushTimelineEvent('status', compactStatusMessage(parsed));
    return;
  }

  if (eventType === 'tool_call') {
    lastToolCallAtMs.value = Date.now();
    if (diagnoseState.value === 'connecting') {
      diagnoseState.value = 'streaming';
    }
    pushTimelineEvent('tool_call', compactToolMessage(parsed));
    return;
  }

  if (eventType === 'done') {
    diagnoseState.value = 'completed';
    const payloadObject = (parsed ?? {}) as Record<string, any>;
    doneMessage.value = String(payloadObject.message ?? 'Diagnosis complete');
    pushTimelineEvent('done', 'Diagnosis complete');
    closeStream();
    return;
  }

  if (eventType === 'error') {
    diagnoseState.value = 'failed';
    const payloadObject = (parsed ?? {}) as Record<string, any>;
    const code = payloadObject.code ? `[${String(payloadObject.code)}] ` : '';
    const message = String(payloadObject.error ?? payloadObject.message ?? 'Diagnosis failed');
    streamError.value = `${code}${message}`;
    pushTimelineEvent('error', streamError.value);
    toast.add({
      severity: 'error',
      summary: 'AI Diagnose failed',
      detail: streamError.value,
      life: 5000,
    });
    closeStream();
  }
};

const openSSE = (url: string) => {
  closeStream();
  diagnoseState.value = 'connecting';
  pushTimelineEvent('status', `Querying ${activeDiagnoseNamespace.value}/${activeDiagnosePodName.value}`);

  const source = new EventSource(url, { withCredentials: true });
  eventSource.value = source;

  source.onopen = () => {
    lastStatusAtMs.value = Date.now();
    if (diagnoseState.value === 'connecting') {
      diagnoseState.value = 'streaming';
    }
    pushTimelineEvent('status', 'Connected to diagnose stream');
  };

  source.onmessage = (event) => {
    const payload = safeJsonParse(event.data);
    if (typeof payload === 'object' && payload !== null) {
      const payloadObject = payload as Record<string, any>;
      if (typeof payloadObject.token === 'string') {
        handleSSEEvent('token', event);
        return;
      }
    }
    activeTokenEventId = null;
    pushTimelineEvent('status', compactStatusMessage(payload));
  };

  source.addEventListener('status', (event) => handleSSEEvent('status', event as MessageEvent));
  source.addEventListener('tool_call', (event) => handleSSEEvent('tool_call', event as MessageEvent));
  source.addEventListener('token', (event) => handleSSEEvent('token', event as MessageEvent));
  source.addEventListener('done', (event) => handleSSEEvent('done', event as MessageEvent));
  source.addEventListener('error', (event) => {
    const typedEvent = event as MessageEvent;
    if (typeof typedEvent.data === 'string' && typedEvent.data.length > 0) {
      handleSSEEvent('error', typedEvent);
    }
  });

  source.onerror = (event) => {
    if (diagnoseState.value === 'completed' || diagnoseState.value === 'failed') {
      return;
    }

    const typedEvent = event as MessageEvent;
    if (typeof typedEvent.data === 'string' && typedEvent.data.length > 0) {
      handleSSEEvent('error', typedEvent);
      return;
    }

    diagnoseState.value = 'failed';
    streamError.value =
      'SSE stream closed before completion. Verify namespace/pod access and backend diagnose availability.';
    pushTimelineEvent('error', streamError.value);
    toast.add({
      severity: 'error',
      summary: 'AI Diagnose stream error',
      detail: streamError.value,
      life: 5000,
    });
    closeStream();
  };
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

    if (activeDiagnosePodKey.value && !mergedPods.some((pod) => pod.key === activeDiagnosePodKey.value)) {
      closeInlineDiagnosis();
    }

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

const startDiagnose = (pod: PodRow) => {
  activeDiagnosePodKey.value = pod.key;
  activeDiagnoseNamespace.value = pod.namespace;
  activeDiagnosePodName.value = pod.podName;
  expandedRows.value = { [pod.key]: true };
  resetDiagnosis();

  try {
    openSSE(buildDiagnoseStreamUrl());
  } catch (error: any) {
    diagnoseState.value = 'failed';
    streamError.value = error?.message || 'Unable to start AI diagnose';
    pushTimelineEvent('error', streamError.value);
    toast.add({
      severity: 'error',
      summary: 'Unable to start AI diagnose',
      detail: streamError.value,
      life: 4500,
    });
  }
};

const closeInlineDiagnosis = () => {
  closeStream();
  expandedRows.value = {};
  activeDiagnosePodKey.value = '';
  activeDiagnoseNamespace.value = '';
  activeDiagnosePodName.value = '';
  resetDiagnosis();
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

watch(isDiagnosing, (diagnosing) => {
  if (diagnosing) {
    if (!thinkingTimer) {
      thinkingTimer = setInterval(() => {
        nowMs.value = Date.now();
      }, 200);
    }
    return;
  }

  if (thinkingTimer) {
    clearInterval(thinkingTimer);
    thinkingTimer = null;
  }
});

onUnmounted(() => {
  if (thinkingTimer) {
    clearInterval(thinkingTimer);
    thinkingTimer = null;
  }
  closeStream();
});
</script>

<style scoped>
.diagnosis-scroll {
  overflow-anchor: none;
}

.diagnosis-markdown {
  overflow-anchor: none;
  color: rgb(51 65 85);
  font-size: 0.925rem;
  line-height: 1.65;
}

.diagnosis-markdown :deep(*) {
  overflow-wrap: anywhere;
}

.diagnosis-markdown :deep(h1),
.diagnosis-markdown :deep(h2),
.diagnosis-markdown :deep(h3),
.diagnosis-markdown :deep(h4) {
  color: rgb(15 23 42);
  font-weight: 750;
  letter-spacing: 0;
}

.diagnosis-markdown :deep(h1) {
  margin: 0 0 0.875rem;
  font-size: 1.625rem;
  line-height: 2rem;
}

.diagnosis-markdown :deep(h2) {
  margin: 0 0 0.75rem;
  font-size: 1.375rem;
  line-height: 1.85rem;
}

.diagnosis-markdown :deep(h3) {
  margin: 1.25rem 0 0.5rem;
  font-size: 1.125rem;
  line-height: 1.55rem;
}

.diagnosis-markdown :deep(h4) {
  margin: 1rem 0 0.375rem;
  font-size: 1rem;
  line-height: 1.45rem;
}

.diagnosis-markdown :deep(h1:first-child),
.diagnosis-markdown :deep(h2:first-child),
.diagnosis-markdown :deep(h3:first-child),
.diagnosis-markdown :deep(h4:first-child) {
  margin-top: 0;
}

.diagnosis-markdown :deep(p) {
  margin: 0.625rem 0;
}

.diagnosis-markdown :deep(strong) {
  color: rgb(15 23 42);
  font-weight: 700;
}

.diagnosis-markdown :deep(a) {
  color: rgb(37 99 235);
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 0.18em;
}

.diagnosis-markdown :deep(ul),
.diagnosis-markdown :deep(ol) {
  margin: 0.625rem 0 0.875rem;
  padding-left: 1.35rem;
}

.diagnosis-markdown :deep(ul) {
  list-style: disc;
}

.diagnosis-markdown :deep(ol) {
  list-style: decimal;
}

.diagnosis-markdown :deep(li) {
  margin: 0.4rem 0;
  padding-left: 0.15rem;
}

.diagnosis-markdown :deep(li > p) {
  margin: 0.35rem 0;
}

.diagnosis-markdown :deep(blockquote) {
  margin: 0.875rem 0;
  border-left: 3px solid rgb(147 197 253);
  border-radius: 0 0.375rem 0.375rem 0;
  background-color: rgb(239 246 255);
  padding: 0.65rem 0.85rem;
  color: rgb(30 58 138);
}

.diagnosis-markdown :deep(hr) {
  margin: 1.25rem 0;
  border: 0;
  border-top: 1px solid rgb(226 232 240);
}

.diagnosis-markdown :deep(:not(pre) > code) {
  border: 1px solid rgb(226 232 240);
  border-radius: 0.35rem;
  background-color: rgb(248 250 252);
  padding: 0.1rem 0.3rem;
  color: rgb(51 65 85);
  font-size: 0.84em;
  font-weight: 600;
  white-space: nowrap;
}

.diagnosis-markdown :deep(pre) {
  margin: 0.75rem 0 1rem;
  overflow-x: auto;
  border: 1px solid rgb(30 41 59);
  border-radius: 0.55rem;
  background-color: rgb(15 23 42);
  padding: 0.875rem 1rem;
  color: rgb(226 232 240);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.05);
}

.diagnosis-markdown :deep(pre code) {
  display: block;
  min-width: max-content;
  background: transparent;
  color: inherit;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    "Courier New", monospace;
  font-size: 0.78rem;
  font-weight: 500;
  line-height: 1.65;
  white-space: pre;
}

.diagnosis-markdown :deep(table) {
  display: table;
  width: 100%;
  min-width: 32rem;
  margin: 0.875rem 0 1.125rem;
  border-collapse: collapse;
  overflow: hidden;
  border: 1px solid rgb(203 213 225);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  line-height: 1.4;
}

.diagnosis-markdown :deep(thead) {
  background-color: rgb(241 245 249);
}

.diagnosis-markdown :deep(th),
.diagnosis-markdown :deep(td) {
  border: 1px solid rgb(203 213 225);
  padding: 0.5rem 0.75rem;
  text-align: left;
  vertical-align: top;
}

.diagnosis-markdown :deep(th) {
  color: rgb(30 41 59);
  font-weight: 700;
}

.diagnosis-markdown :deep(tbody tr:nth-child(even)) {
  background-color: rgb(248 250 252);
}

.diagnosis-markdown :deep(td code),
.diagnosis-markdown :deep(th code) {
  white-space: nowrap;
}

:global(.dark) .diagnosis-markdown :deep(table) {
  border-color: rgb(51 65 85);
}

:global(.dark) .diagnosis-markdown {
  color: rgb(203 213 225);
}

:global(.dark) .diagnosis-markdown :deep(h1),
:global(.dark) .diagnosis-markdown :deep(h2),
:global(.dark) .diagnosis-markdown :deep(h3),
:global(.dark) .diagnosis-markdown :deep(h4),
:global(.dark) .diagnosis-markdown :deep(strong) {
  color: rgb(248 250 252);
}

:global(.dark) .diagnosis-markdown :deep(a) {
  color: rgb(147 197 253);
}

:global(.dark) .diagnosis-markdown :deep(blockquote) {
  border-left-color: rgb(59 130 246);
  background-color: rgb(30 41 59 / 0.8);
  color: rgb(191 219 254);
}

:global(.dark) .diagnosis-markdown :deep(hr) {
  border-top-color: rgb(51 65 85);
}

:global(.dark) .diagnosis-markdown :deep(:not(pre) > code) {
  border-color: rgb(51 65 85);
  background-color: rgb(15 23 42);
  color: rgb(226 232 240);
}

:global(.dark) .diagnosis-markdown :deep(pre) {
  border-color: rgb(51 65 85);
  background-color: rgb(2 6 23);
  color: rgb(226 232 240);
}

:global(.dark) .diagnosis-markdown :deep(thead) {
  background-color: rgb(30 41 59);
}

:global(.dark) .diagnosis-markdown :deep(th),
:global(.dark) .diagnosis-markdown :deep(td) {
  border-color: rgb(51 65 85);
}

:global(.dark) .diagnosis-markdown :deep(th) {
  color: rgb(226 232 240);
}

:global(.dark) .diagnosis-markdown :deep(tbody tr:nth-child(even)) {
  background-color: rgb(15 23 42);
}
</style>
