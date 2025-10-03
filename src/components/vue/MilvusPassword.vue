<template>
    <div v-if="!user" class="mx-auto flex max-w-sm items-center gap-x-4 rounded-xl bg-white p-6 shadow-lg  dark:bg-slate-800 dark:shadow-none">Please log in.</div>

    <Card v-if="user" class="my-8">
        <template #title>Click this button to get your milvus password in your registered email.</template>
        <template #content>
            <Button @click="getKeys" :loading="isTokensLoading">Get milvus password</Button>
            <p v-if="retrieving == 1">Retrieving password...</p>
            <p v-if="retrieving == 2">The link to get the password was sent to your email address.</p>
            <p>Requesting the password again will reset the password to the new one.</p>

            <p><a class="underline cursor-pointer text-primary" href="/documentation/userdocs/ai/vector-database">Read more about Milvus service</a></p>

        </template>
    </Card>
</template>

<script setup>
import 'primeicons/primeicons.css'

import { useToast } from 'primevue/usetoast';
import Card from "primevue/card";
import Button from "primevue/button";

import { useStore } from '@nanostores/vue';
import { userStore } from '../../auth.ts';

import { RequestManager, HTTPTransport, Client } from "@open-rpc/client-js";

import {ref} from 'vue';

const user = useStore(userStore);

const toast = useToast();

const retrieving= ref(0);
const isLoading = ref(false);

const baseUrl = import.meta.env.PUBLIC_SVC_URL;
const transport = new HTTPTransport(baseUrl+"/rpc",
    {
        credentials: 'include',
    },
);
const client = new Client(new RequestManager([transport]));

const getKeys = () => {
    retrieving.value = 1;
    isLoading.value = true;
    client.request({
        method: "user.GetMilvusPassword",
        params: {
        }
    }).then((response) => {
        if (response.error) {
            console.error('Error fetching password:', response.error);
            reject(response.error);
            retrieving.value = 0;
            return;
        }
        retrieving.value = 2;
    }).catch((err) => {
        toast.add({
            severity: 'error',
            summary: 'Error fetching password',
            detail: err.message,
            life: 3000
        });
        retrieving.value = 0;
    }).finally(() => {
        isLoading.value = false;
    });
}

</script>