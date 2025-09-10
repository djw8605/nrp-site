<template>
    <div v-if="!user" class="mx-auto flex max-w-sm items-center gap-x-4 rounded-xl bg-white p-6 shadow-lg  dark:bg-slate-800 dark:shadow-none">Please log in.</div>

    <Card v-if="user" class="my-8">
        <template #title>Clicking this button will send your S3 keys to your registered email.</template>
        <template #content>
            <Button @click="getKeys" :loading="isTokensLoading">Get S3 keys</Button>
            <p v-if="retrieving == 1">Retrieving keys...</p>
            <p v-if="retrieving == 2">The link to get the keys was sent to your email address.</p>

            <p><i>This page is work in progress. Please refer to <a href="/documentation/userdocs/storage/ceph-s3/">documentation</a> for S3 instructions.</i></p>

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

import { useStore } from '@nanostores/vue';
import { userStore } from '../../auth.ts';

import { RequestManager, HTTPTransport, Client } from "@open-rpc/client-js";

import {ref} from 'vue';

const user = useStore(userStore);

const toast = useToast();

const retrieving= ref(0);
const isTokensLoading = ref(false);

const baseUrl = import.meta.env.PUBLIC_SVC_URL;
const transport = new HTTPTransport(baseUrl+"/rpc",
    {
        credentials: 'include',
    },
);
const client = new Client(new RequestManager([transport]));

const getKeys = () => {
    retrieving.value = 1;
    isTokensLoading.value = true;
    client.request({
        method: "user.GetS3Keys",
        params: {
        }
    }).then((response) => {
        if (response.error) {
            console.error('Error fetching tokens:', response.error);
            reject(response.error);
            retrieving.value = 0;
            return;
        }
        retrieving.value = 2;
    }).catch((err) => {
        toast.add({
            severity: 'error',
            summary: 'Error fetching tokens',
            detail: err.message,
            life: 3000
        });
        retrieving.value = 0;
    }).finally(() => {
        isTokensLoading.value = false;
    });
}

</script>