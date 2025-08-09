<template>
    <div class="flex flex-col items-center justify-center">
        <h1 class="text-2xl font-bold mb-4">Create LLM tokens</h1>
        <p class="text-gray-600 dark:text-gray-400 mb-6">This page is a work in progress. All tokens can be removed without notifications.</p>
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
            <InputGroup v-if="user && llmgroups.length > 0">
                <FloatLabel variant="on">
                    <InputText name="createTokenAlias" v-model="newTokenAlias" id="createTokenAlias" fluid/>
                    <label for="createTokenAlias">Alias</label>
                </FloatLabel>
                <FloatLabel variant="on">
                    <Select name="createTokenGroup" v-model="newTokenGroup" optionLabel="Name" id="createTokenGroup" type="text" :options="llmgroups" fluid></Select>
                    <label for="createTokenGroup">Group</label>
                </FloatLabel>
                <Button label="Create" :loading="isCreatingTokenLoading" @click="createToken"/>
            </InputGroup>
        </template>
    </Card>

    <Dialog v-model:visible="dialogVisible" modal header="Save your token:" :style="{ width: '40rem' }">
        <Message severity="success">{{ newToken }}</Message>
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

const toast = useToast();

const dialogVisible = ref(false);

const isTokensLoading = ref(true);
const isCreatingTokenLoading = ref(false);
const isDeletingTokenLoading = ref(false);

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