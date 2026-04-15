<template>
    <div class="flex flex-col items-center justify-center">
        <h1 class="text-2xl font-bold mb-4">Create LLM tokens</h1>
    </div>

    <div v-if="!user" class="mx-auto flex max-w-sm items-center gap-x-4 rounded-xl bg-white p-6 shadow-lg  dark:bg-slate-800 dark:shadow-none">Please log in to see the info.</div>
    <VueSpinnerPie v-if="isTokensLoading" size="40" style="z-index: 10; position: relative; top: 50%; left: 50%; transform: translate(-50%, -50%);" color="red" />

    <div v-if="user && (tokensInfo.Tokens != null && tokensInfo.Tokens.length > 0)" id="userInfo" class="flex flex-col">
        <DataTable :value="tokensInfo.Tokens" class="w-full">
            <Column field="TokenAlias" header="Alias"></Column>
            <Column field="GroupName" header="Group"></Column>
            <Column field="TokenName" header="Token"></Column>
            <Column class="w-1" header="Actions">
                <template #body="slotProps">
                    <Button icon="pi pi-trash" iconPos="right" severity="danger" :loading="isDeletingTokenLoading" @click="deleteToken(slotProps.data.TokenAlias)"/>
                </template>
            </Column>
        </DataTable>
    </div>

    <div v-if="tokensInfo.Tokens == null || (tokensInfo.Tokens.length === 0 && !isTokensLoading)" class="mx-auto flex max-w-lg items-center gap-x-4 rounded-xl bg-white p-6 shadow-lg  dark:bg-slate-800 dark:shadow-none">
        You have no tokens yet. Create one to use LLMs.
    </div>

    <Card class="my-8" id="users">
        <template #title>Create new token</template>
        <template #content>
            <div v-if="!llmgroups || llmgroups.length === 0" class="mx-auto flex max-w-lg items-center gap-x-4 rounded-xl bg-white p-6 shadow-lg  dark:bg-slate-800 dark:shadow-none">
                You have no LLM groups to create a token in. Please join a group first.
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
                <Button label="Create new token for general LLM API access" :loading="isCreatingTokenLoading" @click="createToken"/>
                <Button label="Create new token and generate the Chatbox configuration" :loading="isCreatingChatboxTokenLoading" @click="createChatboxToken"/>

                <a class="underline cursor-pointer text-primary" href="/documentation/userdocs/ai/llm-managed#chatbox">Read more about Chatbox</a>
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
				contextWindow: 262144
			},
			{
				modelId: "qwen3-small",
				capabilities: ["reasoning", "vision", "tool_use"],
				contextWindow: 262144
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
				contextWindow: 131072
			},
			{
				modelId: "kimi",
				capabilities: ["reasoning", "vision", "tool_use"],
				contextWindow: 262144
			},
			{
				modelId: "glm-4.7",
				capabilities: ["reasoning", "tool_use"],
				contextWindow: 202752
			},
			{
				modelId: "minimax-m2",
				capabilities: ["reasoning", "tool_use"],
				contextWindow: 196608
			},
			{
				modelId: "olmo",
				capabilities: ["tool_use"],
				contextWindow: 65536
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
            reject(response.error);
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
        

});

const getUserLLMTokens = () => {
    isTokensLoading.value = true;
    client.request({
        method: "user.GetUserLLMTokens",
        params: {
        }
    }).then((response) => {
        if (response.error) {
            console.error('Error fetching tokens:', response.error);
            reject(response.error);
            return;
        }
        tokensInfo.value = response;
        console.log('Fetched tokens:', response);
    }).catch((err) => {
        toast.add({
            severity: 'error',
            summary: 'Error fetching tokens',
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

    const nsNameSplit = newTokenGroup.value.Name.split("/");
    const nsName = nsNameSplit[nsNameSplit.length - 1];

    client.request({
        method: "user.CreateUserLLMToken",
        params: {
            GroupName: nsName,
            TokenAlias: newTokenAlias.value,
        }
    }).then((response) => {
        if (response.error) {
            console.error('Error creating token:', response.error);
            reject(response.error);
            return;
        }
        newToken.value = response.Token;
        dialogVisible.value = true;
        getUserLLMTokens();
    }).catch((err) => {
        toast.add({
            severity: 'error',
            summary: 'Error creating token',
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

    const nsNameSplit = newTokenGroup.value.Name.split("/");
    const nsName = nsNameSplit[nsNameSplit.length - 1];

    client.request({
        method: "user.CreateUserLLMToken",
        params: {
            GroupName: nsName,
            TokenAlias: newTokenAlias.value,
        }
    }).then((response) => {
        if (response.error) {
            console.error('Error creating token:', response.error);
            reject(response.error);
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
            summary: 'Error creating token',
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
            console.error('Error deleting token:', response.error);
            reject(response.error);
            return;
        }
        getUserLLMTokens();
    }).catch((err) => {
        toast.add({
            severity: 'error',
            summary: 'Error deleting token',
            detail: err.message,
            life: 3000
        });
    }).finally(() => {
        isDeletingTokenLoading.value = false;
    });    
};
</script>