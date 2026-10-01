<template>
    <Message v-if="join.code" :severity="joinSeverity" :closable="false" class="mb-6">
        <template v-if="join.state === 'loading'">Checking your training link…</template>
        <template v-else-if="join.state === 'login'">
            <template v-if="join.info.Status === 'full'">
                <b>{{ join.info.Name }}</b> is full. If you already joined, log in to get a new API key.
            </template>
            <template v-else>
                You've been invited to <b>{{ join.info.Name }}</b> in the <b>{{ join.info.Namespace }}</b> namespace.
                Log in to the NRP to get your API key. If this is your first time, logging in creates your NRP account.
            </template>
            <div class="mt-3"><Button label="Log in to continue" icon="pi pi-sign-in" @click="loginForJoin" /></div>
        </template>
        <template v-else-if="join.state === 'redeeming'">
            Adding you to <b>{{ join.info.Namespace }}</b> and creating your API key…
        </template>
        <template v-else-if="join.state === 'done'">
            You've joined <b>{{ join.info.Name }}</b>. Your access ends {{ fmtDate(join.accessUntil) }}.
            Opening the training link again replaces your training key.
        </template>
        <template v-else-if="join.state === 'error'">{{ join.error }}</template>
    </Message>
    <div v-if="!user && !join.code" class="mx-auto flex max-w-sm items-center gap-x-4 rounded-xl bg-white p-6 shadow-lg  dark:bg-slate-800 dark:shadow-none">Please log in to see the info.</div>
    <VueSpinnerPie v-if="isTokensLoading" size="40" style="z-index: 10; position: relative; top: 50%; left: 50%; transform: translate(-50%, -50%);" color="red" />

    <div v-if="user && (tokensInfo.Tokens != null && tokensInfo.Tokens.length > 0)" id="userInfo" class="flex flex-col">
        <DataTable :value="tokensInfo.Tokens" class="w-full">
            <Column field="TokenAlias" header="Alias"></Column>
            <Column field="GroupName" header="Group"></Column>
            <Column field="TokenName" header="API key"></Column>
            <Column class="w-1" header="Actions">
                <template #body="slotProps">
                    <Button icon="pi pi-trash" iconPos="right" severity="danger" :loading="isDeletingTokenLoading" @click="deleteToken(slotProps.data.TokenAlias)"/>
                </template>
            </Column>
        </DataTable>
    </div>

    <div v-if="tokensInfo.Tokens == null || (tokensInfo.Tokens.length === 0 && !isTokensLoading)" class="mx-auto flex max-w-lg items-center gap-x-4 rounded-xl bg-white p-6 shadow-lg  dark:bg-slate-800 dark:shadow-none">
        You have no API keys yet. Create one to use LLMs.
    </div>

    <Card class="my-8" id="users">
        <template #title>Create new API key</template>
        <template #content>
            <div v-if="!llmgroups || llmgroups.length === 0" class="mx-auto flex max-w-lg items-center gap-x-4 rounded-xl bg-white p-6 shadow-lg  dark:bg-slate-800 dark:shadow-none">
                You have no LLM groups to create an API key in. Please join a group first.
            </div>
            <div v-if="user && llmgroups.length > 0" class="flex flex-col p-6 gap-4">
                <FloatLabel variant="on">
                    <InputText name="createTokenAlias" fluid v-model="newTokenAlias" id="createTokenAlias"/>
                    <label for="createTokenAlias">Alias</label>
                </FloatLabel>
                <FloatLabel variant="on">
                    <Select name="createTokenGroup" v-model="newTokenGroup" optionLabel="Name" class="w-full" id="createTokenGroup" type="text" :options="llmgroups"></Select>
                    <label for="createTokenGroup">Group</label>
                </FloatLabel>
                <Button label="Create new API key for general LLM API access" :loading="isCreatingTokenLoading" @click="createToken"/>

                <div class="text-sm text-center">
                    <Button label="Generate a Chatbox configuration instead" severity="secondary" text size="small" :loading="isCreatingChatboxTokenLoading" @click="createChatboxToken"/>
                    <a class="underline cursor-pointer text-primary ml-1" href="/documentation/userdocs/ai/llm-managed/chat-interfaces#chatbox">Read more about Chatbox</a>
                </div>

                <Message v-if="createTokenError" severity="error" :closable="true" @close="createTokenError = null">{{ createTokenError }}</Message>
            </div>
        </template>
    </Card>

    <Card v-if="isAdmin && adminGroups.length > 0" class="my-8" id="adminKeys">
        <template #title>Manage members' API keys (admin)</template>
        <template #content>
            <div class="flex flex-col p-6 gap-4">
                <FloatLabel variant="on">
                    <Select name="adminGroup" v-model="adminSelectedGroup" optionLabel="Name" class="w-full" id="adminGroup" :options="adminGroups" @change="onAdminGroupChange"></Select>
                    <label for="adminGroup">Namespace</label>
                </FloatLabel>

                <VueSpinnerPie v-if="isAdminTokensLoading" size="30" color="red" />

                <DataTable v-if="adminTokens.length > 0" :value="adminTokens" class="w-full">
                    <Column field="Username" header="User"></Column>
                    <Column field="TokenAlias" header="Alias"></Column>
                    <Column field="TokenName" header="API key"></Column>
                    <Column class="w-1" header="Actions">
                        <template #body="slotProps">
                            <Button icon="pi pi-trash" iconPos="right" severity="danger" :loading="isAdminDeletingToken" @click="deleteMemberToken(slotProps.data.Username, slotProps.data.TokenAlias)"/>
                        </template>
                    </Column>
                </DataTable>

                <div v-if="adminSelectedGroup && adminTokens.length === 0 && !isAdminTokensLoading" class="text-sm text-slate-500">
                    No API keys exist for members of this namespace yet.
                </div>

                <div v-if="adminSelectedGroup" class="flex flex-col gap-4 border-t pt-4 mt-2">
                    <div class="font-medium">Create an API key for a member</div>
                    <div class="text-sm text-slate-500">The key is never shown to you. It is emailed to the member as a one-time secure link.</div>
                    <FloatLabel variant="on">
                        <Select name="adminTargetUser" v-model="adminTargetUser" optionLabel="label" class="w-full" id="adminTargetUser" :options="adminMembers"></Select>
                        <label for="adminTargetUser">Member</label>
                    </FloatLabel>
                    <FloatLabel variant="on">
                        <InputText name="adminNewAlias" fluid v-model="adminNewAlias" id="adminNewAlias"/>
                        <label for="adminNewAlias">Alias</label>
                    </FloatLabel>
                    <Button label="Create API key and email it to the member" :loading="isAdminCreatingToken" @click="createMemberToken"/>

                    <Message v-if="adminCreateTokenError" severity="error" :closable="true" @close="adminCreateTokenError = null">{{ adminCreateTokenError }}</Message>
                </div>
            </div>
        </template>
    </Card>

    <Dialog v-model:visible="dialogVisible" modal header="Please save and secure your API key. It will not be shown again. If you lose it, you’ll need to regenerate a new one." :style="{ width: '40rem' }">
        <div class="flex flex-col gap-4">
            <Message severity="success"><span ref="tokenTextRef" class="break-all">{{ newToken }}</span></Message>
            <p v-if="newTokenAccessUntil" class="text-sm">Access ends {{ fmtDate(newTokenAccessUntil) }}.</p>
            <Button :label="copiedToken ? 'Copied' : 'Copy API key'" :icon="copiedToken ? 'pi pi-check' : 'pi pi-copy'" severity="secondary" class="self-start" @click="copyToken"/>
        </div>
    </Dialog>

    <Dialog v-model:visible="chatboxDialogVisible" modal header="Please copy the config. It will not be shown again. If you lose it, you’ll need to regenerate a new one." :style="{ width: '40rem' }">
        <Message severity="success">{{ newChatboxConfig }}</Message>
    </Dialog>
</template>

<script setup>
import 'primeicons/primeicons.css'

import { useToast } from 'primevue/usetoast';
import Card from "primevue/card";
import Button from "primevue/button";

import Dialog from "primevue/dialog";
import Message from "primevue/message";

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

import FloatLabel from "primevue/floatlabel";
import InputGroup from 'primevue/inputgroup';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import {VueSpinnerPie} from 'vue3-spinners';

import { useStore } from '@nanostores/vue';
import { userStore } from '../../auth.ts';
import { LLM_ENDPOINT } from '../../data/llm-endpoint.ts';

import { RequestManager, HTTPTransport, Client } from "@open-rpc/client-js";

import {ref, reactive, computed, watch, onMounted} from 'vue';

const user = useStore(userStore);

const tokensInfo= ref([]);

const llmgroups = ref([]);
const newTokenGroup = ref(null);
const newTokenAlias = ref(null);

const newToken = ref(null);
const newChatboxConfig = ref(null);

const tokenTextRef = ref(null);
const copiedToken = ref(false);
let copiedTokenReset = null;

// Same clipboard ladder as EndpointPanel on this page: navigator.clipboard is
// unavailable on insecure origins and can be permission-blocked, so fall back
// to execCommand, and failing that select the key so the visitor can copy it
// by hand -- an error that names its recovery, not a button that does nothing.
const writeClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        /* fall through */
    }
    try {
        const scratch = document.createElement('textarea');
        scratch.value = text;
        scratch.setAttribute('readonly', '');
        scratch.style.position = 'fixed';
        scratch.style.top = '0';
        scratch.style.opacity = '0';
        document.body.appendChild(scratch);
        scratch.select();
        const ok = document.execCommand('copy');
        scratch.remove();
        return ok;
    } catch {
        return false;
    }
};

const copyToken = async () => {
    const ok = await writeClipboard(newToken.value ?? '');
    if (ok) {
        copiedToken.value = true;
        if (copiedTokenReset) window.clearTimeout(copiedTokenReset);
        copiedTokenReset = window.setTimeout(() => {
            copiedToken.value = false;
        }, 2400);
        return;
    }
    if (tokenTextRef.value) {
        const range = document.createRange();
        range.selectNodeContents(tokenTextRef.value);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
    }
    toast.add({
        severity: 'warn',
        summary: 'Clipboard blocked',
        detail: 'The API key is selected — copy it with Ctrl/Cmd+C.',
        life: 6000
    });
};

const toast = useToast();

const dialogVisible = ref(false);
const chatboxDialogVisible = ref(false);

const isTokensLoading = ref(false);
const isCreatingTokenLoading = ref(false);
const isCreatingChatboxTokenLoading = ref(false);
const isDeletingTokenLoading = ref(false);

// Persistent (non-fading) inline error messages for the two "create API key"
// flows, shown in red right under their buttons. Unlike the toast (shared
// site-wide via the header's <Toast/>, life: a few seconds), these stay on
// the page until the user dismisses them or tries again.
const createTokenError = ref(null);
const adminCreateTokenError = ref(null);

// Admin: manage members' API keys
const isAdmin = ref(false);
const adminGroups = ref([]);
const adminSelectedGroup = ref(null);
const adminTokens = ref([]);
const adminMembers = ref([]);
const adminTargetUser = ref(null);
const adminNewAlias = ref(null);
const isAdminTokensLoading = ref(false);
const isAdminDeletingToken = ref(false);
const isAdminCreatingToken = ref(false);

// https://github.com/chatboxai/chatbox/blob/main/src/renderer/utils/provider-config.ts#L59

var chatboxConfigTemplate = {
	id: "custom-provider-963ccbe7-7e74-4dbe-beda-8054a6590245",
	name: "NRP",
	type: "openai",
	settings: {
		apiHost: LLM_ENDPOINT.host,
		apiKey: "",
		models: [
			{
				modelId: "qwen3",
				capabilities: ["reasoning", "vision", "tool_use"],
				contextWindow: 1000000
			},
			{
				modelId: "qwen3-small",
				capabilities: ["reasoning", "vision", "tool_use"],
				contextWindow: 1000000
			},
			{
				modelId: "gpt-oss",
				capabilities: ["reasoning", "tool_use"],
				contextWindow: 131072
			},
			{
				modelId: "gemma",
				capabilities: ["reasoning", "vision", "tool_use"],
				contextWindow: 262144
			},
			{
				modelId: "gemma-small",
				capabilities: ["reasoning", "vision", "tool_use"],
				contextWindow: 262144
			},
			{
				modelId: "kimi",
				capabilities: ["reasoning", "vision", "tool_use"],
				contextWindow: 131072
			},
			{
				modelId: "glm-5",
				capabilities: ["reasoning", "tool_use"],
				contextWindow: 1048576
			},
			{
				modelId: "minimax-m2",
				capabilities: ["reasoning", "tool_use"],
				contextWindow: 204800
			},
			{
				modelId: "deepseek-v4-flash",
				capabilities: ["reasoning", "vision", "tool_use"],
				contextWindow: 1048576
			},
		]
	}
};

const baseUrl = import.meta.env.PUBLIC_SVC_URL;
const transport = new HTTPTransport(baseUrl+"/rpc",
    {
        credentials: 'include',
    },
);
const client = new Client(new RequestManager([transport]));

// Training join links: /llmtoken?join=<code>. See k8s_portal
// docs/superpowers/specs/2026-10-01-llm-join-links-design.md.
const joinCode = new URLSearchParams(window.location.search).get('join');
const join = reactive({ code: joinCode, state: joinCode ? 'loading' : null, info: null, error: null, accessUntil: null });
const newTokenAccessUntil = ref(null);
const joinMessages = {
    expired: 'This training link has expired. Ask the training organizer for a new one.',
    invalid: 'This training link is not valid. Check that you copied the whole link, or ask the training organizer for a new one.',
};
const joinSeverity = computed(() => ({ error: 'error', done: 'success' })[join.state] || 'info');
const fmtDate = (iso) => new Date(iso).toLocaleString();

const loginForJoin = () => {
    window.location.href = baseUrl + '/auth?next=' + encodeURIComponent(window.location.href);
};

const redeemJoin = () => {
    if (join.state === 'redeeming' || join.state === 'done') {
        return;
    }
    join.state = 'redeeming';
    client.request({
        method: 'user.RedeemLLMJoinLink',
        params: { Code: join.code },
    }).then((resp) => {
        join.state = 'done';
        join.accessUntil = resp.AccessUntil;
        newToken.value = resp.Token;
        newTokenAccessUntil.value = resp.AccessUntil;
        copiedToken.value = false;
        dialogVisible.value = true;
        getUserLLMTokens();
        // Drop ?join= so a refresh does not replace the key again.
        const url = new URL(window.location.href);
        url.searchParams.delete('join');
        window.history.replaceState(null, '', url.toString());
    }).catch((err) => {
        // A stale login in localStorage outlives the portal session; send
        // the visitor back through login instead of a dead end.
        if (err.message === 'unauthorized') {
            join.state = 'login';
            return;
        }
        join.state = 'error';
        join.error = err.message;
    });
};

const startJoin = () => {
    client.request({
        method: 'guest.GetLLMJoinLinkInfo',
        params: { Code: join.code },
    }).then((info) => {
        join.info = info;
        if (info.Status === 'expired' || info.Status === 'invalid') {
            join.state = 'error';
            join.error = joinMessages[info.Status];
        } else if (user.value) {
            redeemJoin();
        } else {
            join.state = 'login';
        }
    }).catch((err) => {
        join.state = 'error';
        join.error = 'Could not check this training link: ' + err.message;
    });
};

// The login state arrives asynchronously (LoginButton pings the portal), so
// redeem as soon as the user appears.
watch(user, (u) => {
    if (u && join.state === 'login') {
        redeemJoin();
    }
});

onMounted(async () => {
    if (join.code) {
        startJoin();
    }
    if(user.value == null) {
        return;
    }
    getUserLLMTokens();
    client.request({
        method: "groups.ListUserGroups",
    }).then((response) => {
        if (response.error) {
            console.error('Error fetching groups:', response.error);
            return;
        }
        for (const group of response.Namespaces) {
            if (!group.IsLiteLLMOrg || !group.IsMember) {
                continue;
            }
            llmgroups.value.push({Name: group.Name});
        }
    }).catch((err) => {
        toast.add({
            severity: 'error',
            summary: 'Error fetching groups',
            detail: err.message,
            life: 3000
        });
    });

    // Determine admin status; the admin management card is only shown to
    // namespace admins (per-namespace access is still enforced server-side).
    client.request({
        method: "user.GetUserInfo",
        params: {},
    }).then((response) => {
        if (response.error) {
            console.error('Error fetching user info:', response.error);
            return;
        }
        isAdmin.value = response.IsAdmin === true;
        if (isAdmin.value) {
            // Admin can manage keys for the LLM namespaces they belong to.
            adminGroups.value = llmgroups.value;
        }
    }).catch((err) => {
        console.error('Error fetching user info:', err);
    });
});

const shortNsName = (fullName) => {
    const parts = fullName.split("/");
    return parts[parts.length - 1];
};

const getUserLLMTokens = () => {
    isTokensLoading.value = true;
    client.request({
        method: "user.GetUserLLMTokens",
        params: {
        }
    }).then((response) => {
        if (response.error) {
            console.error('Error fetching API keys:', response.error);
            return;
        }
        tokensInfo.value = response;
    }).catch((err) => {
        toast.add({
            severity: 'error',
            summary: 'Error fetching API keys',
            detail: err.message,
            life: 3000
        });
    }).finally(() => {
        isTokensLoading.value = false;
    });
}

const createToken = () => {
    createTokenError.value = null;
    if (!newTokenGroup.value || !newTokenAlias.value) {
        toast.add({
            severity: 'error',
            summary: 'Validation Error',
            detail: 'Group and Alias are required.',
            life: 3000
        });
        return;
    };
    isCreatingTokenLoading.value = true;

    client.request({
        method: "user.CreateUserLLMToken",
        params: {
            GroupName: shortNsName(newTokenGroup.value.Name),
            TokenAlias: newTokenAlias.value,
        }
    }).then((response) => {
        if (response.error) {
            console.error('Error creating API key:', response.error);
            createTokenError.value = response.error.message || String(response.error);
            return;
        }
        newToken.value = response.Token;
        newTokenAccessUntil.value = null;
        copiedToken.value = false;
        dialogVisible.value = true;
        getUserLLMTokens();
    }).catch((err) => {
        createTokenError.value = err.message;
    }).finally(() => {
        isCreatingTokenLoading.value = false;
    });
};

const createChatboxToken = () => {
    createTokenError.value = null;
    if (!newTokenGroup.value || !newTokenAlias.value) {
        toast.add({
            severity: 'error',
            summary: 'Validation Error',
            detail: 'Group and Alias are required.',
            life: 3000
        });
        return;
    };
    isCreatingChatboxTokenLoading.value = true;

    client.request({
        method: "user.CreateUserLLMToken",
        params: {
            GroupName: shortNsName(newTokenGroup.value.Name),
            TokenAlias: newTokenAlias.value,
        }
    }).then((response) => {
        if (response.error) {
            console.error('Error creating API key:', response.error);
            createTokenError.value = response.error.message || String(response.error);
            return;
        }
        var token = response.Token;
        newChatboxConfig.value = {...chatboxConfigTemplate};
        newChatboxConfig.value.settings.apiKey = token;
        chatboxDialogVisible.value = true;
        getUserLLMTokens();
    }).catch((err) => {
        createTokenError.value = err.message;
    }).finally(() => {
        isCreatingChatboxTokenLoading.value = false;
    });
};

const deleteToken = (tokenAlias) => {
    isDeletingTokenLoading.value = true;

    client.request({
        method: "user.DeleteUserLLMToken",
        params: {
            TokenAlias: tokenAlias,
        }
    }).then((response) => {
        if (response.error) {
            console.error('Error deleting API key:', response.error);
            return;
        }
        getUserLLMTokens();
    }).catch((err) => {
        toast.add({
            severity: 'error',
            summary: 'Error deleting API key',
            detail: err.message,
            life: 3000
        });
    }).finally(() => {
        isDeletingTokenLoading.value = false;
    });
};

// ---- Admin: manage members' API keys ----

const onAdminGroupChange = () => {
    adminTargetUser.value = null;
    adminNewAlias.value = null;
    adminMembers.value = [];
    adminCreateTokenError.value = null;
    loadAdminTokens();
    loadAdminMembers();
};

const loadAdminTokens = () => {
    if (!adminSelectedGroup.value) {
        return;
    }
    isAdminTokensLoading.value = true;
    adminTokens.value = [];
    client.request({
        method: "admin.GetNSLLMTokens",
        params: {
            Namespace: shortNsName(adminSelectedGroup.value.Name),
        }
    }).then((response) => {
        if (response.error) {
            console.error('Error fetching members\' API keys:', response.error);
            return;
        }
        adminTokens.value = response.Tokens || [];
    }).catch((err) => {
        toast.add({
            severity: 'error',
            summary: 'Error fetching members\' API keys',
            detail: err.message,
            life: 4000
        });
    }).finally(() => {
        isAdminTokensLoading.value = false;
    });
};

const loadAdminMembers = () => {
    if (!adminSelectedGroup.value) {
        return;
    }
    client.request({
        method: "admin.GetNSUsers",
        params: {
            Namespace: shortNsName(adminSelectedGroup.value.Name),
        }
    }).then((response) => {
        if (response.error) {
            console.error('Error fetching members:', response.error);
            return;
        }
        const members = [];
        for (const list of [response.Users || [], response.Admins || []]) {
            for (const u of list) {
                members.push({ label: u.Name + " <" + u.Email + ">", id: u.ID });
            }
        }
        adminMembers.value = members;
    }).catch((err) => {
        toast.add({
            severity: 'error',
            summary: 'Error fetching members',
            detail: err.message,
            life: 4000
        });
    });
};

const deleteMemberToken = (username, tokenAlias) => {
    isAdminDeletingToken.value = true;
    client.request({
        method: "admin.DeleteNSLLMToken",
        params: {
            Namespace: shortNsName(adminSelectedGroup.value.Name),
            UserID: username,
            TokenAlias: tokenAlias,
        }
    }).then((response) => {
        if (response.error) {
            console.error('Error deleting API key:', response.error);
            return;
        }
        loadAdminTokens();
    }).catch((err) => {
        toast.add({
            severity: 'error',
            summary: 'Error deleting API key',
            detail: err.message,
            life: 4000
        });
    }).finally(() => {
        isAdminDeletingToken.value = false;
    });
};

const createMemberToken = () => {
    adminCreateTokenError.value = null;
    if (!adminSelectedGroup.value || !adminTargetUser.value || !adminNewAlias.value) {
        toast.add({
            severity: 'error',
            summary: 'Validation Error',
            detail: 'Namespace, member and alias are required.',
            life: 3000
        });
        return;
    }
    isAdminCreatingToken.value = true;
    client.request({
        method: "admin.CreateNSLLMToken",
        params: {
            Namespace: shortNsName(adminSelectedGroup.value.Name),
            UserID: adminTargetUser.value.id,
            TokenAlias: adminNewAlias.value,
        }
    }).then((response) => {
        if (response.error) {
            console.error('Error creating API key:', response.error);
            adminCreateTokenError.value = response.error.message || String(response.error);
            return;
        }
        toast.add({
            severity: 'success',
            summary: 'API key created',
            detail: 'The key was emailed to the member as a one-time secure link.',
            life: 5000
        });
        adminTargetUser.value = null;
        adminNewAlias.value = null;
        loadAdminTokens();
    }).catch((err) => {
        adminCreateTokenError.value = err.message;
    }).finally(() => {
        isAdminCreatingToken.value = false;
    });
};
</script>
