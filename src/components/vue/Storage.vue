<script setup>
import { ref, onMounted, watch } from 'vue';

import { Client, RequestManager, HTTPTransport } from '@open-rpc/client-js';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime)

const props = defineProps(['baseUrl']);

let client = new Client(new RequestManager([new HTTPTransport(props.baseUrl+"/rpc")]));

const folders = ref([]);
const pool = ref("west");
const isAdmin = ref("false");
const isNrpAdmin = ref(false);
const loadingUsers = ref({});

const getStorage = async () => {
    try {
        const response = await client.request({
            method: 'guest.ListFolderInfo',
            params: { pool: pool.value },
        });
        var respFolders = response.Folders;

        var namespaces = {};
        var curFolders = [];

        for (var key in respFolders) {
            var folder = respFolders[key];
            for (var userNum in folder.Users) {
                var spl = folder.Users[userNum].split('|');
                folder.Name = spl[1];
                if(!namespaces[spl[0]]) {
                    namespaces[spl[0]] = [];
                }
                namespaces[spl[0]].push(folder);
            }
        }

        for (var curns in namespaces) {
            var namespace = {
                "Volumes": namespaces[curns],
                "Name": curns+(pool.value.endsWith("_s3")?" user":" namespace"),
                "Namespace": curns, // Store the actual namespace name
                "SizeUsed": 0,
                "SizeProvisioned": 0,
                "Collapsed": true
            };

            for (var nsi in namespace.Volumes) {
                namespace.SizeUsed += namespace.Volumes[nsi].SizeUsed;
                namespace.SizeProvisioned += namespace.Volumes[nsi].SizeProvisioned;
            }

            namespace.Volumes.sort((a, b) => {
                return b.SizeUsed - a.SizeUsed;
            })

            curFolders.push(namespace);
        }

        curFolders.sort((a, b) => {
            return b.SizeUsed - a.SizeUsed;
        })

        folders.value = curFolders;
        console.log(curFolders);
    } catch (error) {
        console.error('Error fetching storage data:', error);
    }
};

const email = async (folderName) => {
    try {
        await client.request({
            method: 'emailStorage',
            params: { folderName },
        });
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

const checkNrpAdmin = async () => {
    try {
        const response = await client.request({
            method: 'user.GetUserInfo',
            params: { UserID: '' },
        });
        isNrpAdmin.value = response.IsNrpAdmin || false;
    } catch (error) {
        console.error('Error checking NRP admin status:', error);
        isNrpAdmin.value = false;
    }
};

const emailNamespaceUsers = async (namespace) => {
    if (loadingUsers.value[namespace]) return;
    
    loadingUsers.value[namespace] = true;
    try {
        const response = await client.request({
            method: 'admin.GetNSUsers',
            params: { Namespace: namespace },
        });
        
        const allUsers = [...(response.Users || []), ...(response.Admins || [])];
        
        if (allUsers.length === 0) {
            alert('No users found in this namespace.');
            return;
        }
        
        const allEmails = allUsers.map(user => user.Email).join(',');
        const subject = `[NAUTILUS] Storage - ${namespace}`;
        const body = `Hello,\n\nThis email is regarding storage usage in the namespace: ${namespace}\n\nPlease let me know if you have any questions.\n\nBest regards`;
        
        const mailtoLink = `mailto:${allEmails}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink, '_blank');
    } catch (error) {
        console.error('Error fetching namespace users:', error);
        alert('Error fetching users: ' + (error.message || 'Unknown error'));
    } finally {
        loadingUsers.value[namespace] = false;
    }
};

const emailNamespaceAdmins = async (namespace) => {
    if (loadingUsers.value[namespace + '_admins']) return;
    
    loadingUsers.value[namespace + '_admins'] = true;
    try {
        const response = await client.request({
            method: 'admin.GetNSUsers',
            params: { Namespace: namespace },
        });
        
        const adminUsers = response.Admins || [];
        
        if (adminUsers.length === 0) {
            alert('No admin users found in this namespace.');
            return;
        }
        
        const adminEmails = adminUsers.map(user => user.Email).join(',');
        const subject = `[NAUTILUS] Storage - ${namespace}`;
        const body = `Hello,\n\nThis email is regarding storage usage in the namespace: ${namespace}\n\nPlease let me know if you have any questions.\n\nBest regards`;
        
        const mailtoLink = `mailto:${adminEmails}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink, '_blank');
    } catch (error) {
        console.error('Error fetching namespace admins:', error);
        alert('Error fetching admins: ' + (error.message || 'Unknown error'));
    } finally {
        loadingUsers.value[namespace + '_admins'] = false;
    }
};

onMounted(() => {
    checkNrpAdmin();
    getStorage();
});

watch(pool, (newPool) => {
    getStorage();
});

const size = (bytes) => {
    var i = bytes == 0 ? 0 : Math.floor( Math.log(bytes) / Math.log(1024) );
    return ( bytes / Math.pow(1024, i) ).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB', 'PB'][i];
};

</script>

<template>
    <div id="storage" class="container-fluid" style="margin-top: 10px">
        <span style="padding: 10px;">
            <label for="pool">Pool: </label>
            <select id="pool" name="pool" v-model="pool">
                <option value="west">West</option>
                <option value="west_s3">West S3</option>
                <option value="east">East</option>
                <option value="east_s3">East S3</option>
                <option value="southeast">South East</option>
                <option value="central">Central</option>
                <option value="central_s3">Central S3</option>
                <option value="haosu">HaoSu</option>
                <option value="haosu_s3">HaoSu S3</option>
                <option value="tide">TIDE</option>
                <option value="tide_s3">TIDE S3</option>
                <option value="ucsd">UCSD</option>
                <option value="pacific">Pacific</option>
            </select>
        </span>

        <div class="table-row namespace" v-for="folder in folders" v-bind:key="folder.Name" v-on:click="folder.Collapsed = !folder.Collapsed">
            <div class="text table-cell"><div class="title">Name</div>{{ folder.Name }}</div>
            <div class="text table-cell"><div class="title">Used</div>{{ size( folder.SizeUsed ) }}</div>
            <div class="text table-cell"><div class="title">Provisioned</div>{{ size( folder.SizeProvisioned ) }}</div>
            <div class="text table-cell" v-if="isAdmin == 'true'"><button @click.stop="email(folder.Name)">Email</button></div>
            <div class="text table-cell" v-if="isNrpAdmin && folder.Namespace" @click.stop>
                <button 
                    @click="emailNamespaceUsers(folder.Namespace)" 
                    :disabled="loadingUsers[folder.Namespace]"
                    style="margin-right: 5px; padding: 5px 10px; cursor: pointer;"
                >
                    {{ loadingUsers[folder.Namespace] ? 'Loading...' : 'Email Users' }}
                </button>
                <button 
                    @click="emailNamespaceAdmins(folder.Namespace)" 
                    :disabled="loadingUsers[folder.Namespace + '_admins']"
                    style="padding: 5px 10px; cursor: pointer;"
                >
                    {{ loadingUsers[folder.Namespace + '_admins'] ? 'Loading...' : 'Email Admins' }}
                </button>
            </div>
            <div class="table-row" v-if="!folder.Collapsed">
                <div class="table-row" v-for="vol in folder.Volumes" v-bind:key="vol.Name">
                    <div class="text table-cell"><div class="title">Name</div>{{ 
                        vol.Users.
                        map(function(v){
                            let spl = v.split("|");
                            return (spl.length > 1)?spl[1]:v;
                        }).
                        join(', ')
                    }}</div>
                    <div class="text table-cell"><div class="title">Used</div>{{ size(vol.SizeUsed) }}</div>
                    <div class="text table-cell"><div class="title">Provisioned</div>{{ size( vol.SizeProvisioned )}}</div>
                    <div class="text table-cell"><div class="title">LastChecked</div>{{dayjs(vol.LastChecked).fromNow()}}</div>
                    <div class="text table-cell"><div class="title">LastAccessed</div>{{dayjs(vol.LastAccessed).fromNow()}}</div>
                </div>
            </div>
        </div>
    </div>
</template>

<style >
    .table-cell {
        padding: 10px;
    }

    .title {
        font-size: 0.7em;
        color: #505050;
        font-family: 'Roboto Mono', monospace;
    }

    .table-row {
        display: flex;           display: -webkit-flex;
        flex-direction: row;     -webkit-flex-direction: row;
        flex-grow: 0;            -webkit-flex-grow: 0;
        flex-wrap: wrap;         -webkit-flex-wrap: wrap;
        width: 100%;
        padding-left: 15px;
        padding-right: 15px;
        padding-bottom: 15px;
        border: 1px solid black;
    }

    .text {
        flex-grow: 0;            -webkit-flex-grow: 0;
        overflow: hidden;
        white-space: wrap;
        text-overflow: ellipsis;
        padding-right: 20px;
    }

    .text {
        width: 200px;
        flex-grow: 1;
    }

    .longtext {
        /*width: 480px;*/
        flex: 1;
        flex-grow: 1;
        flex-basis: 25em;
        white-space: pre-wrap;
    }

    .table-row {
        border-bottom: 2px solid #e0e0e0;
        border-collapse: collapse;
        padding-top: 5px;
    }

    .table-row.header {
        /* background-color: #FFEEDB; */
        font-weight: bold;
        padding-top: 8px;
        padding-bottom: 8px;
    }

    .namespace {
        cursor: pointer;
        /* background-color: #EEEEEE; */
    }

    html.dark .namespace {
        background-color: #040329 !important;
    }

</style>