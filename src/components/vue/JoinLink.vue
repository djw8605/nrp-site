<template>
  <div class="flex flex-col gap-6 max-w-2xl">
    <Message v-if="state === 'nocode'" severity="error" :closable="false">
      This page needs a training link. Ask the training organizer for the full link.
    </Message>

    <p v-else-if="state === 'loading'" class="text-muted">Checking your training link…</p>

    <template v-else-if="state === 'login'">
      <p v-if="info.Status === 'full'">
        <b>{{ info.Name }}</b> is full. If you already joined, log in to get back in{{
          info.IssueLLMKey ? ' and get a new API key' : ''
        }}.
      </p>
      <p v-else>
        You've been invited to <b>{{ info.Name }}</b> in the
        <span class="font-mono">{{ info.Namespace }}</span> namespace. Log in to the NRP to join{{
          info.IssueLLMKey ? ' and get your LLM API key' : ''
        }}. If this is your first time, logging in creates your NRP account.
      </p>
      <Button label="Log in to continue" icon="pi pi-sign-in" class="self-start" @click="login" />
    </template>

    <p v-else-if="state === 'redeeming'" class="text-muted">
      Adding you to <span class="font-mono">{{ info.Namespace }}</span
      >{{ info.IssueLLMKey ? ' and creating your API key' : '' }}…
    </p>

    <template v-else-if="state === 'done'">
      <Message severity="success" :closable="false">
        You've joined <b>{{ result.Name }}</b
        >. You're a member of the <span class="font-mono">{{ result.Namespace }}</span> namespace until
        {{ fmtDate(result.AccessUntil) }}.
      </Message>

      <section v-if="result.Token" class="flex flex-col gap-3" aria-labelledby="join-key-heading">
        <h2 id="join-key-heading" class="text-h4">Your LLM API key</h2>
        <p class="text-sm text-muted">
          Save it now: it is not shown again. If you lose it, open the training link again to get a new one, which
          replaces this key.
        </p>
        <code ref="tokenRef" class="block break-all rounded-md bg-surface-sunken p-3 font-mono text-sm">{{
          result.Token
        }}</code>
        <Button
          :label="copied ? 'Copied' : 'Copy API key'"
          :icon="copied ? 'pi pi-check' : 'pi pi-copy'"
          severity="secondary"
          class="self-start"
          @click="copyToken"
        />
        <p class="text-sm">
          Base URL for OpenAI-compatible clients: <span class="font-mono">{{ LLM_ENDPOINT.baseUrl }}</span>
        </p>
        <div class="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <a class="link" :href="LLM_ENDPOINT.docsHref">Using the LLM endpoint&nbsp;→</a>
          <a class="link" href="/llmtoken">Manage your API keys&nbsp;→</a>
        </div>
      </section>

      <section v-if="result.IsK8sNamespace" class="flex flex-col gap-3" aria-labelledby="join-k8s-heading">
        <h2 id="join-k8s-heading" class="text-h4">Using the namespace in Kubernetes</h2>
        <p class="text-sm">
          You can run workloads in <span class="font-mono">{{ result.Namespace }}</span> with <code>kubectl</code>. If
          <code>kubectl</code> is already set up for the NRP, run <code>kubectl oidc-login clean</code> so it picks up
          your new namespace.
        </p>
        <a class="link text-sm self-start" :href="kubectlDocsHref">Set up kubectl&nbsp;→</a>
      </section>
    </template>

    <Message v-else-if="state === 'error'" severity="error" :closable="false">{{ error }}</Message>
  </div>
</template>

<script setup>
import 'primeicons/primeicons.css';
import { ref, watch, onMounted } from 'vue';
import { useStore } from '@nanostores/vue';
import { RequestManager, HTTPTransport, Client } from '@open-rpc/client-js';
import Button from 'primevue/button';
import Message from 'primevue/message';
import { useToast } from 'primevue/usetoast';
import { baseUrl, userStore } from '../../auth.ts';
import { LLM_ENDPOINT } from '../../data/llm-endpoint.ts';

// Training join links: /join?code=<code>. The portal side is k8s_portal
// join_links.go; design in its docs/superpowers/specs/2026-10-01-llm-join-links-design.md.

const kubectlDocsHref = '/documentation/userdocs/start/getting-started/#cluster-access-via-kubectl';
const messages = {
  expired: 'This training link has expired. Ask the training organizer for a new one.',
  invalid:
    'This training link is not valid. Check that you copied the whole link, or ask the training organizer for a new one.',
};

const client = new Client(new RequestManager([new HTTPTransport(baseUrl + '/rpc', { credentials: 'include' })]));
const toast = useToast();
const user = useStore(userStore);

const code = new URLSearchParams(window.location.search).get('code');
// nocode | loading | login | redeeming | done | error
const state = ref(code ? 'loading' : 'nocode');
const info = ref(null);
const result = ref(null);
const error = ref(null);
const tokenRef = ref(null);
const copied = ref(false);

const fmtDate = (iso) => new Date(iso).toLocaleString();

const login = () => {
  window.location.href = baseUrl + '/auth?next=' + encodeURIComponent(window.location.href);
};

const redeem = () => {
  if (state.value === 'redeeming' || state.value === 'done') {
    return;
  }
  state.value = 'redeeming';
  client
    .request({ method: 'user.RedeemJoinLink', params: { Code: code } })
    .then((resp) => {
      result.value = resp;
      state.value = 'done';
      // Drop ?code= so a refresh does not replace the key again.
      const url = new URL(window.location.href);
      url.searchParams.delete('code');
      window.history.replaceState(null, '', url.toString());
    })
    .catch((err) => {
      // A stale login in localStorage outlives the portal session; send the
      // visitor back through login instead of a dead end.
      if (err.message === 'unauthorized') {
        state.value = 'login';
        return;
      }
      state.value = 'error';
      error.value = err.message;
    });
};

const copyToken = async () => {
  try {
    await navigator.clipboard.writeText(result.value.Token);
    copied.value = true;
    window.setTimeout(() => {
      copied.value = false;
    }, 2400);
  } catch {
    // Clipboard blocked: select the key so it can be copied by hand.
    const range = document.createRange();
    range.selectNodeContents(tokenRef.value);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    toast.add({
      severity: 'warn',
      summary: 'Clipboard blocked',
      detail: 'The API key is selected. Copy it with Ctrl/Cmd+C.',
      life: 6000,
    });
  }
};

// The login state arrives asynchronously (LoginButton pings the portal), so
// join as soon as the user appears.
watch(user, (u) => {
  if (u && state.value === 'login') {
    redeem();
  }
});

onMounted(() => {
  if (!code) {
    return;
  }
  client
    .request({ method: 'guest.GetJoinLinkInfo', params: { Code: code } })
    .then((resp) => {
      info.value = resp;
      if (resp.Status === 'expired' || resp.Status === 'invalid') {
        state.value = 'error';
        error.value = messages[resp.Status];
      } else if (user.value) {
        redeem();
      } else {
        state.value = 'login';
      }
    })
    .catch((err) => {
      state.value = 'error';
      error.value = 'Could not check this training link: ' + err.message;
    });
});
</script>
