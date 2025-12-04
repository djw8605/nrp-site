<script setup>
import { ref, onMounted, watch } from 'vue';
import { useStore } from '@nanostores/vue';
import { userStore } from '../../auth.ts';

import { Client, RequestManager, HTTPTransport } from '@open-rpc/client-js';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime)

const props = defineProps(['baseUrl']);

const transport = new HTTPTransport(props.baseUrl+"/rpc", {
    credentials: 'include',
});
let client = new Client(new RequestManager([transport]));

const folders = ref([]);
const pool = ref("west");
const isAdmin = ref("false");
const isNrpAdmin = ref(false);
const loadingUsers = ref({});
const user = useStore(userStore);

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
            var isS3 = pool.value.endsWith("_s3");
            var namespace = {
                "Volumes": namespaces[curns],
                "Name": curns+(isS3?" user":" namespace"),
                "Namespace": curns, // Store the actual namespace name (or user ID for S3)
                "IsS3": isS3, // Flag to indicate if this is S3 storage (not a Kubernetes namespace)
                "Pool": pool.value, // Store the pool name for S3 user lookup
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
        console.log('[Storage.vue] Folders loaded:', curFolders); //debugging-logging
        console.log('[Storage.vue] Folder namespaces:', curFolders.map(f => ({ Name: f.Name, Namespace: f.Namespace }))); //debugging-logging
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
    console.log('[Storage.vue] checkNrpAdmin called', { userLoggedIn: !!user.value }); //debugging-logging
    
    // Only check if user is logged in
    if (!user.value) {
        console.log('[Storage.vue] User not logged in, setting isNrpAdmin to false'); //debugging-logging
        isNrpAdmin.value = false;
        return;
    }
    
    console.log('[Storage.vue] User logged in, checking admin status...', { email: user.value.email }); //debugging-logging
    
    try {
        console.log('[Storage.vue] Making GetUserInfo request...'); //debugging-logging
        const response = await client.request({
            method: 'user.GetUserInfo',
            params: { UserID: '' },
        });
        console.log('[Storage.vue] GetUserInfo full response:', JSON.stringify(response, null, 2)); //debugging-logging
        console.log('[Storage.vue] GetUserInfo response values:', { 
            IsNrpAdmin: response.IsNrpAdmin, 
            IsAdmin: response.IsAdmin,
            Email: response.Email,
            Username: response.Username,
            Name: response.Name
        }); //debugging-logging
        isNrpAdmin.value = response.IsNrpAdmin || false;
        console.log('[Storage.vue] isNrpAdmin set to:', isNrpAdmin.value); //debugging-logging
    } catch (error) {
        // Silently fail if unauthorized (user not logged in) or other errors
        // Only log if it's not an authorization error
        if (error.message && !error.message.includes('unauthorized') && !error.message.includes('Unauthorized')) {
            console.error('Error checking NRP admin status:', error);
        }
        console.log('[Storage.vue] Error checking admin status, setting to false:', error.message); //debugging-logging
        isNrpAdmin.value = false;
    }
};

const emailNamespaceUsers = async (namespace) => {
    console.log('[Storage.vue] emailNamespaceUsers called', { namespace, isNrpAdmin: isNrpAdmin.value }); //debugging-logging
    
    if (loadingUsers.value[namespace]) return;
    
    loadingUsers.value[namespace] = true;
    try {
        console.log('[Storage.vue] Fetching users for namespace:', namespace); //debugging-logging
        const response = await client.request({
            method: 'admin.GetNSUsers',
            params: { Namespace: namespace },
        });
        
        console.log('[Storage.vue] GetNSUsers response:', { Users: response.Users?.length || 0, Admins: response.Admins?.length || 0 }); //debugging-logging
        
        const allUsers = [...(response.Users || []), ...(response.Admins || [])];
        
        if (allUsers.length === 0) {
            console.log('[Storage.vue] No users found in namespace:', namespace); //debugging-logging
            alert('No users found in this namespace.');
            return;
        }
        
        const allEmails = allUsers.map(user => user.Email).join(',');
        const subject = `[NAUTILUS] Storage - ${namespace}`;
        const body = `Hello,\n\nThis email is regarding storage usage in the namespace: ${namespace}\n\nPlease let me know if you have any questions.\n\nBest regards`;
        
        console.log('[Storage.vue] Opening mailto link', { emailCount: allUsers.length, subject }); //debugging-logging
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
    console.log('[Storage.vue] emailNamespaceAdmins called', { namespace, isNrpAdmin: isNrpAdmin.value }); //debugging-logging
    
    if (loadingUsers.value[namespace + '_admins']) return;
    
    loadingUsers.value[namespace + '_admins'] = true;
    try {
        console.log('[Storage.vue] Fetching admins for namespace:', namespace); //debugging-logging
        const response = await client.request({
            method: 'admin.GetNSUsers',
            params: { Namespace: namespace },
        });
        
        console.log('[Storage.vue] GetNSUsers response:', { Users: response.Users?.length || 0, Admins: response.Admins?.length || 0 }); //debugging-logging
        
        const adminUsers = response.Admins || [];
        
        if (adminUsers.length === 0) {
            console.log('[Storage.vue] No admins found in namespace:', namespace); //debugging-logging
            alert('No admin users found in this namespace.');
            return;
        }
        
        const adminEmails = adminUsers.map(user => user.Email).join(',');
        const subject = `[NAUTILUS] Storage - ${namespace}`;
        const body = `Hello,\n\nThis email is regarding storage usage in the namespace: ${namespace}\n\nPlease let me know if you have any questions.\n\nBest regards`;
        
        console.log('[Storage.vue] Opening mailto link', { emailCount: adminUsers.length, subject }); //debugging-logging
        const mailtoLink = `mailto:${adminEmails}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink, '_blank');
    } catch (error) {
        console.error('Error fetching namespace admins:', error);
        alert('Error fetching admins: ' + (error.message || 'Unknown error'));
    } finally {
        loadingUsers.value[namespace + '_admins'] = false;
    }
};

const emailS3User = async (s3UserId, pool) => {
    console.log('[Storage.vue] emailS3User called', { s3UserId, pool, isNrpAdmin: isNrpAdmin.value }); //debugging-logging
    
    const loadingKey = `s3_${pool}_${s3UserId}`;
    if (loadingUsers.value[loadingKey]) return;
    
    loadingUsers.value[loadingKey] = true;
    try {
        console.log('[Storage.vue] Fetching S3 user email for user ID:', s3UserId, 'pool:', pool); //debugging-logging
        const response = await client.request({
            method: 'admin.GetS3UserEmail',
            params: { 
                Pool: pool,
                UserID: s3UserId 
            },
        });
        
        console.log('[Storage.vue] GetS3UserEmail response:', response); //debugging-logging
        
        if (!response.Email) {
            console.log('[Storage.vue] No email found for S3 user:', s3UserId); //debugging-logging
            alert('No email address found for this S3 user.');
            return;
        }
        
        const subject = `[NAUTILUS] S3 Storage - ${pool}`;
        const body = `Hello ${response.Name || 'there'},\n\nThis email is regarding S3 storage usage in the ${pool} pool.\n\nPlease let me know if you have any questions.\n\nBest regards`;
        
        console.log('[Storage.vue] Opening mailto link for S3 user', { email: response.Email, subject }); //debugging-logging
        const mailtoLink = `mailto:${response.Email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink, '_blank');
    } catch (error) {
        console.error('Error fetching S3 user email:', error);
        alert('Error fetching S3 user email: ' + (error.message || 'Unknown error'));
    } finally {
        loadingUsers.value[loadingKey] = false;
    }
};

onMounted(() => {
    checkNrpAdmin();
    getStorage();
});

watch(pool, (newPool) => {
    getStorage();
});

// Re-check admin status when user logs in/out
watch(user, (newUser) => {
    console.log('[Storage.vue] User state changed', { loggedIn: !!newUser, email: newUser?.email }); //debugging-logging
    checkNrpAdmin();
});

// debugging-logging: Log button visibility state
watch([isNrpAdmin, folders], ([newIsNrpAdmin, newFolders]) => {
    console.log('[Storage.vue] Button visibility state:', { 
        isNrpAdmin: newIsNrpAdmin, 
        foldersCount: newFolders?.length || 0,
        foldersWithNamespace: newFolders?.filter(f => f.Namespace).length || 0
    }); //debugging-logging
}, { immediate: true });

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
            <!-- debugging-logging: Button visibility check -->
            <!-- Email buttons for Kubernetes namespaces -->
            <div class="text table-cell" v-if="isNrpAdmin && folder.Namespace && !folder.IsS3" @click.stop>
                <div class="email-buttons-container">
                    <button 
                        @click="emailNamespaceUsers(folder.Namespace)" 
                        :disabled="loadingUsers[folder.Namespace]"
                        class="email-btn email-btn-users"
                    >
                        {{ loadingUsers[folder.Namespace] ? 'Loading...' : 'Email Users' }}
                    </button>
                    <button 
                        @click="emailNamespaceAdmins(folder.Namespace)" 
                        :disabled="loadingUsers[folder.Namespace + '_admins']"
                        class="email-btn email-btn-admins"
                    >
                        {{ loadingUsers[folder.Namespace + '_admins'] ? 'Loading...' : 'Email Admins' }}
                    </button>
                </div>
            </div>
            <!-- Email button for S3 buckets (single user) -->
            <div class="text table-cell" v-if="isNrpAdmin && folder.Namespace && folder.IsS3" @click.stop>
                <button 
                    @click="emailS3User(folder.Namespace, folder.Pool)" 
                    :disabled="loadingUsers['s3_' + folder.Pool + '_' + folder.Namespace]"
                    class="email-btn email-btn-s3"
                >
                    {{ loadingUsers['s3_' + folder.Pool + '_' + folder.Namespace] ? 'Loading...' : 'Email User' }}
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

    .email-buttons-container {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }

    .email-btn {
        padding: 8px 16px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background-color: #ffffff;
        color: #374151;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }

    .email-btn:hover:not(:disabled) {
        background-color: #f9fafb;
        border-color: #9ca3af;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        transform: translateY(-1px);
    }

    .email-btn:active:not(:disabled) {
        transform: translateY(0);
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }

    .email-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        background-color: #f3f4f6;
    }

    .email-btn-users {
        background-color: #3b82f6;
        color: #ffffff;
        border-color: #3b82f6;
    }

    .email-btn-users:hover:not(:disabled) {
        background-color: #2563eb;
        border-color: #2563eb;
        color: #ffffff;
    }

    .email-btn-admins {
        background-color: #f59e0b;
        color: #ffffff;
        border-color: #f59e0b;
    }

    .email-btn-admins:hover:not(:disabled) {
        background-color: #d97706;
        border-color: #d97706;
        color: #ffffff;
    }

    .email-btn-s3 {
        background-color: #10b981;
        color: #ffffff;
        border-color: #10b981;
    }

    .email-btn-s3:hover:not(:disabled) {
        background-color: #059669;
        border-color: #059669;
        color: #ffffff;
    }

    /* Dark mode support */
    html.dark .email-btn {
        background-color: #1f2937;
        color: #f3f4f6;
        border-color: #4b5563;
    }

    html.dark .email-btn:hover:not(:disabled) {
        background-color: #374151;
        border-color: #6b7280;
    }

    html.dark .email-btn:disabled {
        background-color: #111827;
        opacity: 0.5;
    }

    html.dark .email-btn-users {
        background-color: #3b82f6;
        border-color: #3b82f6;
    }

    html.dark .email-btn-users:hover:not(:disabled) {
        background-color: #2563eb;
        border-color: #2563eb;
    }

    html.dark .email-btn-admins {
        background-color: #f59e0b;
        border-color: #f59e0b;
    }

    html.dark .email-btn-admins:hover:not(:disabled) {
        background-color: #d97706;
        border-color: #d97706;
    }

    html.dark .email-btn-s3 {
        background-color: #10b981;
        border-color: #10b981;
    }

    html.dark .email-btn-s3:hover:not(:disabled) {
        background-color: #059669;
        border-color: #059669;
    }

</style>