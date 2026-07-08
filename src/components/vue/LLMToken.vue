<template>
    <div class="flex flex-col items-center justify-center">
        <h1 class="text-2xl font-bold mb-4">Create LLM API keys</h1>
    </div>

    <div v-if="!user" class="mx-auto flex max-w-sm items-center gap-x-4 rounded-xl bg-white p-6 shadow-lg  dark:bg-slate-800 dark:shadow-none">Please log in to see the info.</div>
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
                </div>
            </div>
        </template>
    </Card>

    <Dialog v-model:visible="dialogVisible" modal header="Please save and secure your API key. It will not be shown again. If you lose it, you’ll need to regenerate a new one." :style="{ width: '40rem' }">
        <Message severity="success">{{ newToken }}</Message>
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

import { RequestManager, HTTPTransport, Client } from "@open-rpc/client-js";

import {ref, onMounted} from 'vue';

const user = useStore(userStore);

const tokensInfo= ref([]);

const llmgroups = ref([]);
const newTokenGroup = ref(null);
const newTokenAlias = ref(null);

const newToken = ref(null);
const newChatboxConfig = ref(null);

const toast = useToast();

const dialogVisible = ref(false);
const chatboxDialogVisible = ref(false);

const isTokensLoading = ref(false);
const isCreatingTokenLoading = ref(false);
const isCreatingChatboxTokenLoading = ref(false);
const isDeletingTokenLoading = ref(false);

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
		apiHost: "https://ellm.nrp-nautilus.io",
		apiKey: "",
		models: [
			{
				modelId: "qwen3",
				capabilities: ["reasoning", "vision", "tool_use"],
				contextWindow: 1010000
			},
			{
				modelId: "qwen3-small",
				capabilities: ["reasoning", "vision", "tool_use"],
				contextWindow: 1010000
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
				contextWindow: 262144
			},
			{
				modelId: "glm-5",
				capabilities: ["reasoning", "tool_use"],
				contextWindow: 524288
			},
			{
				modelId: "minimax-m2",
				capabilities: ["reasoning", "tool_use"],
				contextWindow: 204800
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

onMounted(async () => {
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
            return;
        }
        newToken.value = response.Token;
        dialogVisible.value = true;
        getUserLLMTokens();
    }).catch((err) => {
        toast.add({
            severity: 'error',
            summary: 'Error creating API key',
            detail: err.message,
            life: 3000
        });
    }).finally(() => {
        isCreatingTokenLoading.value = false;
    });
};

const createChatboxToken = () => {
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
            return;
        }
        var token = response.Token;
        newChatboxConfig.value = {...chatboxConfigTemplate};
        newChatboxConfig.value.settings.apiKey = token;
        chatboxDialogVisible.value = true;
        getUserLLMTokens();
    }).catch((err) => {
        toast.add({
            severity: 'error',
            summary: 'Error creating API key',
            detail: err.message,
            life: 3000
        });
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
        toast.add({
            severity: 'error',
            summary: 'Error creating API key',
            detail: err.message,
            life: 5000
        });
    }).finally(() => {
        isAdminCreatingToken.value = false;
    });
};
</script>
