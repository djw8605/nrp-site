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

onMounted(() => {
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
            <div class="table-row" v-if="!folder.Collapsed">
                <div class="table-row" v-for="vol in folder.Volumes" v-bind:key="vol.Name">
                    <div class="text table-cell"><div class="title">Name</div>{{ vol.Users.join(', ') }}</div>
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