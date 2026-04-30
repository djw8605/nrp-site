<template>
  <div>
    <div
      v-if="visible"
      class="fixed inset-0 z-40 bg-black/35"
      @click="closePanel"
    ></div>

    <div
      class="fixed inset-y-0 left-0 z-50 w-full max-w-[34rem] border-r border-slate-200 bg-white shadow-2xl transition-transform duration-200 dark:border-slate-700 dark:bg-slate-900"
      :class="visible ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <div>
          <h3 class="text-sm font-semibold">
            AI Diagnosis: {{ targetNamespace && targetPodName ? `${targetNamespace}/${targetPodName}` : 'Pending target' }}
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Live status, tool calls, and markdown token stream
          </p>
        </div>
        <button
          class="rounded-md border border-slate-300 px-2 py-1 text-xs dark:border-slate-600"
          type="button"
          @click="closePanel"
        >
          Close
        </button>
      </div>

      <div class="h-[calc(100vh-4rem)] overflow-y-auto p-4">
        <div class="rounded-md border border-slate-200 p-3 text-xs dark:border-slate-700">
          <div class="grid grid-cols-1 gap-1 md:grid-cols-2">
            <div><span class="font-semibold">State:</span> {{ diagnoseState }}</div>
            <div><span class="font-semibold">Events:</span> {{ timelineEvents.length }}</div>
            <div><span class="font-semibold">Namespace:</span> {{ targetNamespace || '-' }}</div>
            <div><span class="font-semibold">Pod:</span> {{ targetPodName || '-' }}</div>
            <div class="md:col-span-2">
              <span class="font-semibold">Container:</span> {{ targetContainer || 'All containers' }}
            </div>
          </div>

          <div v-if="doneMessage" class="mt-2 text-green-700 dark:text-green-300">{{ doneMessage }}</div>
          <div v-if="streamError" class="mt-2 text-red-700 dark:text-red-300">{{ streamError }}</div>
          <div v-if="isThinking" class="mt-2 flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <i class="pi pi-spin pi-spinner"></i>
            <span>AI is thinking...</span>
          </div>
        </div>

        <div class="mt-4 rounded-md border border-slate-200 p-3 dark:border-slate-700">
          <h4 class="mb-2 text-sm font-semibold">Diagnosis Markdown</h4>
          <div
            ref="markdownScrollEl"
            class="max-h-[20rem] overflow-auto rounded-md border border-slate-200 p-3 dark:border-slate-700"
            @scroll="onMarkdownScroll"
          >
            <div v-if="markdownBody.length === 0" class="text-xs text-slate-600 dark:text-slate-300">
              No output yet. Token chunks will stream here in order.
            </div>
            <div
              v-else
              class="prose prose-sm max-w-none dark:prose-invert prose-pre:text-xs prose-code:text-xs"
              v-html="renderedMarkdown"
            ></div>
          </div>
        </div>

        <div class="mt-4 rounded-md border border-slate-200 p-3 dark:border-slate-700">
          <h4 class="mb-2 text-sm font-semibold">Timeline</h4>
          <div v-if="timelineEvents.length === 0" class="text-xs text-slate-600 dark:text-slate-300">
            No timeline events yet.
          </div>

          <div
            v-else
            ref="timelineScrollEl"
            class="max-h-[28rem] overflow-auto rounded-md border border-slate-200 dark:border-slate-700"
            @scroll="onTimelineScroll"
          >
            <table class="min-w-full table-auto text-xs">
              <thead class="bg-slate-100 text-left dark:bg-slate-800">
                <tr>
                  <th class="px-3 py-2 font-semibold">Time</th>
                  <th class="px-3 py-2 font-semibold">Type</th>
                  <th class="px-3 py-2 font-semibold">Message</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="event in timelineEvents"
                  :key="event.localId"
                  class="border-t border-slate-200 dark:border-slate-700"
                >
                  <td class="px-3 py-2 whitespace-nowrap">{{ event.timestamp }}</td>
                  <td class="px-3 py-2 whitespace-nowrap">
                    <div class="flex items-center gap-2" :class="eventTypeClass(event.type)">
                      <i :class="eventTypeIcon(event.type)"></i>
                      <span>{{ eventTypeLabel(event) }}</span>
                    </div>
                  </td>
                  <td class="px-3 py-2">
                    <div
                      v-if="event.type === 'token'"
                      class="prose prose-sm max-w-none dark:prose-invert prose-pre:text-xs prose-code:text-xs"
                      v-html="renderMarkdown(event.payloadText)"
                    ></div>
                    <template v-else>
                      <div class="mb-1" :class="eventTypeClass(event.type)">{{ event.message }}</div>
                      <pre
                        v-if="event.payloadText"
                        class="overflow-x-auto whitespace-pre-wrap text-[11px] text-slate-600 dark:text-slate-300"
                      >{{ event.payloadText }}</pre>
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="streamUrl" class="mt-3 text-xs text-slate-500 dark:text-slate-400">SSE: {{ streamUrl }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';
import { marked } from 'marked';
import { useToast } from 'primevue/usetoast';

interface StreamEventRow {
  localId: string;
  timestamp: string;
  type: string;
  message: string;
  payloadText: string;
}

type DiagnoseState = 'idle' | 'connecting' | 'streaming' | 'completed' | 'failed';

const props = withDefaults(
  defineProps<{
    visible: boolean;
    namespace: string;
    podName: string;
    container?: string;
  }>(),
  {
    container: '',
  }
);

const emit = defineEmits<{
  (event: 'close'): void;
}>();

const toast = useToast();

const targetNamespace = computed(() => String(props.namespace ?? '').trim());
const targetPodName = computed(() => String(props.podName ?? '').trim());
const targetContainer = computed(() => String(props.container ?? '').trim());
const hasTarget = computed(() => Boolean(targetNamespace.value && targetPodName.value));
const streamIdentity = computed(() => `${targetNamespace.value}::${targetPodName.value}::${targetContainer.value}`);

const markdownScrollEl = ref<HTMLElement | null>(null);
const timelineScrollEl = ref<HTMLElement | null>(null);
const isMarkdownPinnedToBottom = ref(true);
const isTimelinePinnedToBottom = ref(true);

const diagnoseState = ref<DiagnoseState>('idle');
const streamUrl = ref('');
const timelineEvents = ref<StreamEventRow[]>([]);
const markdownBody = ref('');
const doneMessage = ref('');
const streamError = ref('');

const eventSource = ref<EventSource | null>(null);
const activeIdentity = ref('');
let localEventCounter = 0;
let activeTokenEventId: string | null = null;
const lastTokenAtMs = ref(0);
const lastStatusAtMs = ref(0);
const lastToolCallAtMs = ref(0);
const nowMs = ref(Date.now());
let thinkingTimer: ReturnType<typeof setInterval> | null = null;

const baseUrl = String(import.meta.env.PUBLIC_SVC_URL ?? '').trim().replace(/\/$/, '');

const TOOL_LABELS: Record<string, string> = {
  get_pod_logs: 'Pod Logs',
  get_previous_container_logs: 'Previous Container Logs',
  describe_pod: 'Describe Pod',
  get_pod_yaml: 'Get Pod YAML',
  get_namespace_events: 'Namespace Events',
  get_namespace_resource_quotas: 'Namespace Resource Quotas',
  get_pvc_status: 'PVC Status',
  get_node_conditions: 'Node Conditions',
  get_node_events: 'Node Events',
  get_nodes_capacity: 'Cluster Resource Capacity',
};

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

const renderMarkdown = (source: string): string => {
  if (!source) return '';
  const escaped = source
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
  return marked.parse(escaped, { gfm: true, breaks: true, async: false }) as string;
};

const renderedMarkdown = computed(() => {
  return renderMarkdown(markdownBody.value);
});

const resolveToolLabel = (toolName: string): string => {
  return TOOL_LABELS[toolName] ?? toolName;
};

const compactJson = (payload: unknown): string => {
  const json = JSON.stringify(payload);
  if (!json) return '';
  if (json.length <= 240) return json;
  return `${json.slice(0, 237)}...`;
};

const eventTypeLabel = (event: StreamEventRow): string => {
  if (event.type === 'tool_call') {
    const prefix = 'Tool call: ';
    if (event.message.startsWith(prefix)) {
      return event.message.slice(prefix.length);
    }
    return event.message || 'Tool Call';
  }
  if (event.type === 'status') return 'Status';
  if (event.type === 'token') return 'Markdown';
  if (event.type === 'done') return 'Done';
  if (event.type === 'error') return 'Error';
  return event.type;
};

const eventTypeIcon = (eventType: string): string => {
  if (eventType === 'status') return 'pi pi-spin pi-spinner';
  if (eventType === 'tool_call') return 'pi pi-cog';
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

const safeJsonParse = (value: string): unknown => {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const toPayloadText = (payload: unknown, eventType = ''): string => {
  if (payload === null || payload === undefined) return '';
  if (eventType === 'token' && typeof payload === 'object') {
    const payloadObject = payload as Record<string, any>;
    if (typeof payloadObject.token === 'string') {
      return payloadObject.token;
    }
  }
  if (eventType === 'tool_call' && typeof payload === 'object') {
    const payloadObject = payload as Record<string, any>;
    if (payloadObject.args !== undefined) {
      return compactJson(payloadObject.args);
    }
  }
  if (typeof payload === 'string') return payload;
  return JSON.stringify(payload, null, 2);
};

const getEventMessage = (eventType: string, payload: unknown, fallbackMessage = ''): string => {
  if (typeof payload === 'string') {
    return payload || fallbackMessage;
  }

  const payloadObject = (payload ?? {}) as Record<string, any>;

  if (typeof payloadObject.message === 'string' && payloadObject.message.length > 0) {
    return payloadObject.message;
  }
  if (typeof payloadObject.error === 'string' && payloadObject.error.length > 0) {
    return payloadObject.error;
  }

  if (eventType === 'status') {
    const step = payloadObject.step ? String(payloadObject.step) : 'status';
    return `${step}${fallbackMessage ? `: ${fallbackMessage}` : ''}`;
  }
  if (eventType === 'tool_call' && payloadObject.tool) {
    return `Tool call: ${resolveToolLabel(String(payloadObject.tool))}`;
  }
  if (eventType === 'done') return 'Diagnosis complete';
  if (eventType === 'error') return 'Diagnosis failed';
  return fallbackMessage;
};

const pushTimelineEvent = (type: string, payload: unknown, fallbackMessage = '') => {
  localEventCounter += 1;
  const localId = `${localEventCounter}`;
  timelineEvents.value.push({
    localId,
    timestamp: new Date().toLocaleString(),
    type,
    message: getEventMessage(type, payload, fallbackMessage),
    payloadText: toPayloadText(payload, type),
  });
  queueAutoScroll();
  return localId;
};

const isNearBottom = (element: HTMLElement): boolean => {
  return element.scrollHeight - element.scrollTop - element.clientHeight <= 40;
};

const onMarkdownScroll = () => {
  if (!markdownScrollEl.value) return;
  isMarkdownPinnedToBottom.value = isNearBottom(markdownScrollEl.value);
};

const onTimelineScroll = () => {
  if (!timelineScrollEl.value) return;
  isTimelinePinnedToBottom.value = isNearBottom(timelineScrollEl.value);
};

const queueAutoScroll = async () => {
  await nextTick();
  if (isMarkdownPinnedToBottom.value && markdownScrollEl.value) {
    markdownScrollEl.value.scrollTop = markdownScrollEl.value.scrollHeight;
  }
  if (isTimelinePinnedToBottom.value && timelineScrollEl.value) {
    timelineScrollEl.value.scrollTop = timelineScrollEl.value.scrollHeight;
  }
};

const closeStream = () => {
  if (eventSource.value) {
    eventSource.value.close();
    eventSource.value = null;
  }
};

const resetStreamForNewRun = () => {
  closeStream();
  timelineEvents.value = [];
  markdownBody.value = '';
  doneMessage.value = '';
  streamError.value = '';
  streamUrl.value = '';
  localEventCounter = 0;
  activeTokenEventId = null;
  lastTokenAtMs.value = 0;
  lastStatusAtMs.value = 0;
  lastToolCallAtMs.value = 0;
  isMarkdownPinnedToBottom.value = true;
  isTimelinePinnedToBottom.value = true;
};

const parseToolCallPayload = (payload: unknown): unknown => {
  if (payload === null || typeof payload !== 'object') return payload;
  const payloadObject = payload as Record<string, any>;
  if (typeof payloadObject.args === 'string') {
    return {
      ...payloadObject,
      args: safeJsonParse(payloadObject.args),
    };
  }
  return payloadObject;
};

const handleSSEEvent = (eventType: string, event: MessageEvent) => {
  const parsed = safeJsonParse(event.data);

  if (eventType === 'token') {
    lastTokenAtMs.value = Date.now();
    const tokenPayload = (parsed ?? {}) as Record<string, any>;
    const token = typeof tokenPayload.token === 'string' ? tokenPayload.token : '';
    if (token) {
      markdownBody.value += token;
      const existingTokenEvent = activeTokenEventId
        ? timelineEvents.value.find((entry) => entry.localId === activeTokenEventId)
        : undefined;
      if (existingTokenEvent && existingTokenEvent.type === 'token') {
        existingTokenEvent.payloadText += token;
      } else {
        activeTokenEventId = pushTimelineEvent('token', { token }, 'AI markdown output');
      }
      queueAutoScroll();
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
    pushTimelineEvent('status', parsed);
    return;
  }

  if (eventType === 'tool_call') {
    lastToolCallAtMs.value = Date.now();
    if (diagnoseState.value === 'connecting') {
      diagnoseState.value = 'streaming';
    }
    pushTimelineEvent('tool_call', parseToolCallPayload(parsed));
    return;
  }

  if (eventType === 'done') {
    diagnoseState.value = 'completed';
    const payloadObject = (parsed ?? {}) as Record<string, any>;
    doneMessage.value = String(payloadObject.message ?? 'Diagnosis complete');
    pushTimelineEvent('done', parsed, 'Diagnosis complete');
    closeStream();
    return;
  }

  if (eventType === 'error') {
    diagnoseState.value = 'failed';
    const payloadObject = (parsed ?? {}) as Record<string, any>;
    const code = payloadObject.code ? `[${String(payloadObject.code)}] ` : '';
    const message = String(payloadObject.error ?? payloadObject.message ?? 'Diagnosis failed');
    streamError.value = `${code}${message}`;
    pushTimelineEvent('error', parsed, message);
    toast.add({
      severity: 'error',
      summary: 'AI Diagnose failed',
      detail: streamError.value,
      life: 5000,
    });
    closeStream();
  }
};

const buildDiagnoseStreamUrl = (): string => {
  const endpoint = baseUrl ? `${baseUrl}/api/user/ai/diagnose-pod` : '/api/user/ai/diagnose-pod';
  const url = endpoint.startsWith('http://') || endpoint.startsWith('https://')
    ? new URL(endpoint)
    : new URL(endpoint, window.location.origin);

  url.searchParams.set('namespace', targetNamespace.value);
  url.searchParams.set('pod', targetPodName.value);
  if (targetContainer.value) {
    url.searchParams.set('container', targetContainer.value);
  }

  return url.toString();
};

const openSSE = (url: string) => {
  closeStream();
  streamUrl.value = url;
  diagnoseState.value = 'connecting';
  let opened = false;

  const source = new EventSource(url, { withCredentials: true });
  eventSource.value = source;

  source.onopen = () => {
    opened = true;
    lastStatusAtMs.value = Date.now();
    if (diagnoseState.value === 'connecting') {
      diagnoseState.value = 'streaming';
    }
    pushTimelineEvent('status', { step: 'connected', message: 'Connected to diagnose stream' });
  };

  source.onmessage = (event) => {
    const payload = safeJsonParse(event.data);
    if (typeof payload === 'object' && payload !== null) {
      const payloadObject = payload as Record<string, any>;
      if (typeof payloadObject.token === 'string') {
        lastTokenAtMs.value = Date.now();
        markdownBody.value += payloadObject.token;
        const existingTokenEvent = activeTokenEventId
          ? timelineEvents.value.find((entry) => entry.localId === activeTokenEventId)
          : undefined;
        if (existingTokenEvent && existingTokenEvent.type === 'token') {
          existingTokenEvent.payloadText += payloadObject.token;
        } else {
          activeTokenEventId = pushTimelineEvent('token', { token: payloadObject.token }, 'AI markdown output');
        }
        queueAutoScroll();
        return;
      }
    }
    activeTokenEventId = null;
    pushTimelineEvent('message', payload);
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
    streamError.value = opened
      ? 'SSE stream closed before completion. Verify namespace/pod access and backend diagnose availability.'
      : 'Unable to open AI diagnose stream. Verify portal session auth and pod/container access (possible 401/403/404/500).';
    pushTimelineEvent('error', {
      code: 'stream_connection_error',
      error: streamError.value,
    });
    toast.add({
      severity: 'error',
      summary: 'AI Diagnose stream error',
      detail: streamError.value,
      life: 5000,
    });
    closeStream();
  };
};

const startDiagnose = () => {
  if (!hasTarget.value) {
    diagnoseState.value = 'failed';
    streamError.value = 'Namespace and pod are required to start diagnosis.';
    return;
  }

  resetStreamForNewRun();
  diagnoseState.value = 'connecting';
  streamError.value = '';

  try {
    const url = buildDiagnoseStreamUrl();
    openSSE(url);
  } catch (error: any) {
    diagnoseState.value = 'failed';
    streamError.value = error?.message || 'Unable to build diagnose stream URL';
    toast.add({
      severity: 'error',
      summary: 'Unable to start AI diagnose',
      detail: streamError.value,
      life: 4500,
    });
  }
};

const closePanel = () => {
  activeIdentity.value = '';
  resetStreamForNewRun();
  diagnoseState.value = 'idle';
  emit('close');
};

watch(
  () => [props.visible, streamIdentity.value] as const,
  ([visible, identity], oldValue) => {
    const wasVisible = oldValue?.[0] ?? false;

    if (!visible) {
      activeIdentity.value = '';
      resetStreamForNewRun();
      diagnoseState.value = 'idle';
      return;
    }

    if (!hasTarget.value) {
      diagnoseState.value = 'failed';
      streamError.value = 'Namespace and pod are required to start diagnosis.';
      return;
    }

    const openedNow = !wasVisible && visible;
    const identityChanged = identity !== activeIdentity.value;
    if (openedNow || identityChanged) {
      activeIdentity.value = identity;
      startDiagnose();
    }
  },
  { immediate: true }
);

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
