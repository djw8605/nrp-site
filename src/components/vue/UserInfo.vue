<template>
    <div v-if="!user" class="mx-auto flex max-w-sm items-center gap-x-4 rounded-xl bg-white p-6 shadow-lg  dark:bg-slate-800 dark:shadow-none">Please log in to see the info.</div>
    <VueSpinnerPie v-if="isUserLoading" size="40" style="z-index: 10; position: relative; top: 50%; left: 50%; transform: translate(-50%, -50%);" color="red" />
    <InputGroup v-if="currentUserIsAdmin">
        <Button label="Search" :loading="searchUserLoading" @click="searchUser" />
        <FloatLabel variant="on">
            <AutoComplete name="chooseUser" v-model="chooseUser" forceSelection optionLabel="Title" id="chooseUser" type="text" :suggestions="filteredUsers" @complete="getUsersFilter" fluid />
            <label for="chooseUser">Choose the user to see the info</label>
        </FloatLabel>
    </InputGroup>
    <div v-if="user" id="userInfo" class="flex flex-col">
        <div class="flex flex-col sm:flex-row sm:items-center p-6 gap-4" :class="{ 'border-t border-surface-200 dark:border-surface-700': index !== 0 }">
            <div class="md:w-20 relative">
                <img class="block xl:block mx-auto rounded w-full hovercard" :src="`https://www.gravatar.com/avatar/${CryptoJS.SHA256( userInfo.Email )}?d=robohash&s=80`" />
            </div>
            <div class="flex flex-col md:flex-row justify-between md:items-center flex-1 gap-6">
                <div class="flex flex-row md:flex-col justify-between items-start gap-2">
                    <div>
                        <span class="font-medium text-surface-500 dark:text-surface-400 text-sm">{{ userInfo.Email }}</span>
                        <div class="text-lg font-medium mt-2">
                            {{ userInfo.Name }}
                            <Badge severity="success" size="small" :value="`${ userInfo.IsAdmin ? 'admin' : 'user' }`"/> 
                            <Badge severity="info" size="small" :value="userInfo.IDP" class="ml-2"/> 
                            <Badge severity="info" v-if="userInfo.PromotedBy" size="small" class="ml-2">Promoted by: {{userInfo.PromotedBy}}</Badge>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <Card v-if="user" class="my-8">
        <template #title>Namespaces & Groups</template>
        <template #content>
            <div class="flex flex-wrap">
                <span v-for="ns in userInfo.Namespaces" :key="ns" class="text-sm font-medium p-2 text-surface-500 dark:text-surface-400">{{ ns }} </span>
            </div>
        </template>
    </Card>
    <Card v-if="user" class="my-8">
        <template #title>Utilization violations</template>
        <template v-if="userInfo.AllowedUtilization" #subtitle>
            Allowed:
            <Badge class="m-2" severity="info">GPU: >{{ userInfo.AllowedUtilization.gpuMinPercent*100 }}%</Badge>
            <Badge class="m-2" severity="info">CPU: {{ userInfo.AllowedUtilization.cpuMinPercent*100 }}% - {{ userInfo.AllowedUtilization.cpuMaxPercent*100 }}%</Badge>
            <Badge class="m-2" severity="info">Memory {{ userInfo.AllowedUtilization.memMinPercent*100 }}% - {{ userInfo.AllowedUtilization.memMaxPercent*100 }}%</Badge>
            Ignored:
            <Badge class="m-2" severity="success">Memory: ≤{{ humanBytes(userInfo.AllowedUtilization.ignoreMem) }}</Badge>
            <Badge class="m-2" severity="success">CPU: ≤{{ userInfo.AllowedUtilization.ignoreCpu }}</Badge>
        </template>
        <template #content>
            <DataTable :value="userInfo.Violations">
                <Column field="Namespace" header="Namespace">
                </Column>
                <Column field="Name" header="Name"></Column>
                <Column field="GpuUtilization" header="GPU util">
                    <template #body="slotProps">
                        <a class="underline" :href="'https://grafana.nrp-nautilus.io/d/dRG9q0Ymz/k8s-compute-resources-namespace-gpus?var-namespace='+slotProps.data.Namespace">
                            <Badge v-if="slotProps.data.GpuRequest > 0" :value="(slotProps.data.GpuUtilization*100).toFixed(0)+'%'" :severity="getUtilizationSeverity(slotProps.data.GpuUtilization, 'gpu')" />
                        </a>
                    </template>
                </Column>
                <Column field="CpuUtilization" header="CPU util">
                    <template #body="slotProps">
                        <a class="underline" :href="'https://grafana.nrp-nautilus.io/d/85a562078cdf77779eaa1add43ccec1e/kubernetes-compute-resources-namespace-pods?var-namespace='+slotProps.data.Namespace">
                            <Badge :value="(slotProps.data.CpuUtilization*100).toFixed(0)+'%'" :severity="getUtilizationSeverity(slotProps.data.CpuUtilization, 'cpu')" />
                        </a>
                    </template>
                </Column>
                <Column field="MemoryUtilization" header="Mem util">
                    <template #body="slotProps">
                        <a class="underline" :href="'https://grafana.nrp-nautilus.io/d/85a562078cdf77779eaa1add43ccec1e/kubernetes-compute-resources-namespace-pods?var-namespace='+slotProps.data.Namespace">
                            <Badge :value="(slotProps.data.MemoryUtilization*100).toFixed(0)+'%'" :severity="getUtilizationSeverity(slotProps.data.MemoryUtilization, 'mem')" />
                        </a>
                    </template>
                </Column>
                <Column field="GpuRequest" header="GPU requested">
                    <template #body="slotProps">
                        {{ slotProps.data.GpuRequest ? slotProps.data.GpuRequest : '' }}
                    </template>
                </Column>
                <Column field="CpuRequest" header="CPU requested"></Column>
                <Column field="MemoryRequest" header="Mem requested">
                    <template #body="slotProps">
                        {{ humanBytes(slotProps.data.MemoryRequest) }}
                    </template>
                </Column>
            </DataTable>
        </template>
    </Card>
    <Card v-if="user && currentUserIsAdmin" class="my-8">
        <template #title>Utilization violations for other users</template>
        <template #content>
            <Card v-for="(item, key, index) in userInfo.OtherViolations" :index="index" :key="key" class="my-4">
                <template #subtitle>
                    {{ key }}
                </template>
                <template #content>
                    <DataTable :value="item">
                        <Column field="Namespace" header="Namespace"></Column>
                        <Column field="Name" header="Name"></Column>
                        <Column field="GpuUtilization" header="GPU util">
                            <template #body="slotProps">
                                <a class="underline" :href="'https://grafana.nrp-nautilus.io/d/dRG9q0Ymz/k8s-compute-resources-namespace-gpus?var-namespace='+slotProps.data.Namespace">
                                    <Badge v-if="slotProps.data.GpuRequest > 0" :value="(slotProps.data.GpuUtilization*100).toFixed(0)+'%'" :severity="getUtilizationSeverity(slotProps.data.GpuUtilization, 'gpu')" />
                                </a>
                            </template>
                        </Column>
                        <Column field="CpuUtilization" header="CPU util">
                            <template #body="slotProps">
                                <a class="underline" :href="'https://grafana.nrp-nautilus.io/d/85a562078cdf77779eaa1add43ccec1e/kubernetes-compute-resources-namespace-pods?var-namespace='+slotProps.data.Namespace">
                                    <Badge :value="(slotProps.data.CpuUtilization*100).toFixed(0)+'%'" :severity="getUtilizationSeverity(slotProps.data.CpuUtilization, 'cpu')" />
                                </a>
                            </template>
                        </Column>
                        <Column field="MemoryUtilization" header="Mem util">
                            <template #body="slotProps">
                                <a class="underline" :href="'https://grafana.nrp-nautilus.io/d/85a562078cdf77779eaa1add43ccec1e/kubernetes-compute-resources-namespace-pods?var-namespace='+slotProps.data.Namespace">
                                    <Badge :value="(slotProps.data.MemoryUtilization*100).toFixed(0)+'%'" :severity="getUtilizationSeverity(slotProps.data.MemoryUtilization, 'mem')" />
                                </a>
                            </template>
                        </Column>
                        <Column field="GpuRequest" header="GPU requested">
                            <template #body="slotProps">
                                {{ slotProps.data.GpuRequest ? slotProps.data.GpuRequest : '' }}
                            </template>
                        </Column>
                        <Column field="CpuRequest" header="CPU requested"></Column>
                        <Column field="MemoryRequest" header="Mem requested">
                            <template #body="slotProps">
                                {{ humanBytes(slotProps.data.MemoryRequest) }}
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>
        </template>
    </Card>

</template>

<script setup>
import 'primeicons/primeicons.css'

import { useToast } from 'primevue/usetoast';
import AutoComplete from "primevue/autocomplete";
import Button from "primevue/button";
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import FloatLabel from "primevue/floatlabel";
import Card from 'primevue/card';
import InputGroup from 'primevue/inputgroup';
import Badge from 'primevue/badge';
import {VueSpinnerPie} from 'vue3-spinners';

import { useStore } from '@nanostores/vue';
import { userStore } from '../../auth.ts';

import { RequestManager, HTTPTransport, Client } from "@open-rpc/client-js";

import CryptoJS from 'crypto-js';

import {ref, onMounted} from 'vue';

import {Hovercards} from '@gravatar-com/hovercards';
import '@gravatar-com/hovercards/dist/style.css';
const hovercards = new Hovercards( { /* Options */ } );

const user = useStore(userStore);

const userInfo= ref({});
const chooseUser = ref(null);
const filteredUsers = ref([]);

const currentUserIsAdmin = ref(false);

const toast = useToast();

const isUserLoading = ref(true);
const searchUserLoading = ref(false);

const baseUrl = import.meta.env.PUBLIC_SVC_URL;
const transport = new HTTPTransport(baseUrl+"/rpc",
    {
        credentials: 'include',
    },
);
const client = new Client(new RequestManager([transport]));

const getUsersFilter = (org) => {
    return new Promise((resolve, reject) => {
        if(org.query.trim().length < 3) {
            resolve();
            return;
        }

        client.request({
            method: "admin.ListUsersAC",
            params: {Term: org.query.trim()},
        }).then((response) => {
            if (response.error) {
                console.error('Error fetching users:', response.error);
                reject(response.error);
                return;
            } else {
                filteredUsers.value = response.Users;
                resolve();
                return;
            }
        });
    });
};

const getUtilizationSeverity = (value, type) => {
    switch (type) {
        case 'cpu': {
            if (value > userInfo.value.AllowedUtilization.cpuMinPercent && value < userInfo.value.AllowedUtilization.cpuMaxPercent) {
                return 'success';
            }
            return 'danger';
        }

        case 'gpu': {
            if (value > userInfo.value.AllowedUtilization.gpuMinPercent) {
                return 'success';
            }
            return 'danger';
        }

        case 'mem': {
            if (value > userInfo.value.AllowedUtilization.memMinPercent && value < userInfo.value.AllowedUtilization.memMaxPercent) {
                return 'success';
            }
            return 'danger';
        }

        default:
            return null;
    }
};

const humanBytes = (size) => {
    var i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
    return +((size / Math.pow(1024, i)).toFixed(2)) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
}

const searchUser = () => {
    if(chooseUser.value == null || chooseUser.value == "" || chooseUser.value.ID == "") {
        return;
    }
    console.log("searchUser", chooseUser.value.ID);
    getUserInfo(chooseUser.value.ID);
};

onMounted(async () => {
    if(user.value == null) {
        return;
    }
    getUserInfo("");
});

const getUserInfo = (username) => {
    isUserLoading.value = true;
    client.request({
        method: "user.GetUserInfo",
        params: {
            UserID: username
        }
    }).then((response) => {
        if (response.error) {
            console.error('Error fetching user:', response.error);
            reject(response.error);
            return;
        }
        userInfo.value = response;
        if(username == "" && response.IsAdmin) {
            currentUserIsAdmin.value = true;
        }
        console.log("userInfo", userInfo.value);
    }).catch((err) => {
        toast.add({
            severity: 'error',
            summary: 'Error fetching user',
            detail: err.message,
            life: 3000
        });
    }).finally(() => {
        isUserLoading.value = false;
        hovercards.attach( document.getElementById( 'userInfo' ) );
    });
}

</script>