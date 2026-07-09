<template>
    <ConfirmDialog />
    <Card class="my-8">
        <template #title>Editing {{ selectedNamespace.Name }}</template>
        <template #content>

            <Card>
                <template #subtitle>Current features (not editable)</template>
                <template #content>
                    <div class="flex gap-2">
                        <span  v-for="feature of features" :key="feature.key">
                            <Checkbox v-model="initialValues.features" :inputId="feature.key" name="feature" :value="feature.key" :disabled="true" />
                            <label class="m-1" :for="feature.key"> {{ feature.name }} </label>
                        </span>
                    </div>
                </template>
            </Card>

            <Card class="mt-4">
                <template #subtitle>Enable features</template>
                <template #content>
                    <div v-if="convertibleFeatures.length === 0" class="text-sm text-surface-500 dark:text-surface-400">
                        All available features are already enabled on this group.
                    </div>
                    <div v-else class="flex flex-col gap-3">
                        <Message severity="info" size="small" variant="simple" class="mt-0">
                            Turn this group into a Kubernetes namespace, LLM group, and/or Milvus database. This is additive &mdash; features can be enabled here but not removed.
                        </Message>
                        <div class="flex gap-2 flex-wrap">
                            <span v-for="feature of convertibleFeatures" :key="feature.key">
                                <Checkbox v-model="convertFeatures" :inputId="`convert_${feature.key}`" name="convertFeature" :value="feature.key" />
                                <label class="m-1" :for="`convert_${feature.key}`"> {{ feature.name }} </label>
                            </span>
                        </div>
                        <Button label="Enable selected features" icon="pi pi-bolt" severity="secondary" size="small" class="self-start" :loading="convertFeaturesLoading" :disabled="convertFeatures.length === 0" @click="convertGroupFeatures" />
                    </div>
                </template>
            </Card>

            <Card v-if="currentUserIsNrpAdmin" class="mt-4">
                <template #subtitle>
                    Commercial <Badge severity="warn" size="small" value="NRP Admins only" />
                </template>
                <template #content>
                    <div class="flex items-center gap-3">
                        <span>
                            <Checkbox v-model="isCommercial" :binary="true" inputId="is_commercial" name="is_commercial" />
                            <label class="m-1" for="is_commercial"> Commercial namespace (is_commercial) </label>
                        </span>
                        <Button label="Save" size="small" severity="secondary" :loading="commercialSaveLoading" @click="saveCommercial" />
                    </div>
                </template>
            </Card>

            <Form v-slot="$form" ref="form" :resolver :initialValues @submit="onFormSubmit" class="flex flex-col gap-4 w-full">
                <VueSpinnerPie v-if="isFormLoading" size="40" style="z-index: 10; position: relative; top: 50%; left: 50%; transform: translate(-50%, -50%);" color="red" />
                <div class="flex flex-col gap-1">
                    <FloatLabel variant="on">
                        <InputText name="pi" id="pi" fluid />
                        <label for="pi">PI</label>
                    </FloatLabel>
                    <FloatLabel variant="on">
                        <InputText name="grant" id="grant" fluid />
                        <label for="grant">Grant</label>
                    </FloatLabel>
                    <FloatLabel variant="on">
                        <Textarea name="description" id="description" rows="8" fluid />
                        <label for="description">Description</label>
                    </FloatLabel>
                    <Message v-if="$form.description?.invalid" severity="error" size="small" variant="simple">{{ $form.description.error?.message }}</Message>
                    <FloatLabel variant="on">
                        <AutoComplete
                            name="institution"
                            forceSelection
                            id="institution"
                            type="text"
                            :suggestions="filteredOrganizations"
                            @complete="getOrganizationsFilter"
                            fluid
                        >
                            <template #item="slotProps">
                                <div>{{ slotProps.item }}</div>
                            </template>
                        </AutoComplete>
                        <label for="institution">Institution</label>
                    </FloatLabel>
                    <Message v-if="$form.institution?.invalid" severity="error" size="small" variant="simple">{{ $form.institution.error?.message }}</Message>
                    <FloatLabel variant="on">
                        <InputText name="software" id="software" fluid />
                        <label for="software">Software</label>
                    </FloatLabel>
                    <FloatLabel variant="on">
                        <Textarea name="publications" id="publications" rows="8" fluid></Textarea>
                        <label for="publications">Publications</label>
                    </FloatLabel>
                    <Message v-if="$form.publications?.invalid" severity="error" size="small" variant="simple">{{ $form.publications.error?.message }}</Message>
                </div>
                <Button type="submit" :loading="saveLoading" severity="secondary" label="Save" />
            </Form>
        </template>
    </Card>
    <!-- <Card>
        <template #title>Namespace Logo</template>
        <template #content>
            <FileUpload ref="fileupload" mode="basic" name="avatar" @select="onFileChange" customUpload accept="image/*" :maxFileSize="1000000" @upload="onFileChange" :auto="true"/>
        </template>
    </Card> -->
    <Card class="my-8" id="users">
        <template #title>Users</template>
        <template #content>
            <VueSpinnerPie v-if="isUsersLoading" size="40" style="z-index: 10; position: relative; top: 50%; left: 50%; transform: translate(-50%, -50%);" color="red" />
            <div class="flex flex-col p-6 gap-2">
                <InputGroup>
                    <FloatLabel variant="on">
                        <AutoComplete name="newUser" v-model="newUser" optionLabel="Title" id="newUser" type="text" :suggestions="filteredUsers" @complete="getUsersFilter" fluid>
                        <template #option="slotProps">
                            <div class="flex flex-col">
                                <div class="font-medium">{{ slotProps.option.Name || slotProps.option.Title || slotProps.option.Email }}
                                    <Badge v-if="slotProps.option.IDP" severity="info" size="small" :value="slotProps.option.IDP"/>
                                </div>
                                <div v-if="slotProps.option.Email" class="text-xs text-surface-500 dark:text-surface-400 break-all">{{ slotProps.option.Email }}</div>
                                <div v-if="slotProps.option.ID" class="text-xs text-surface-400 dark:text-surface-500 break-all">{{ slotProps.option.ID }}</div>
                            </div>
                        </template>
                    </AutoComplete>
                        <label for="newUser">Add user by name or email</label>
                    </FloatLabel>
                    <Button :label="addButtonLabel" :icon="addButtonIcon" :loading="addUserLoading || inviteUserLoading" :disabled="!canSubmitUser" @click="submitUser" />
                </InputGroup>
                <div class="text-xs text-surface-500 dark:text-surface-400">
                    <template v-if="typedEmailReady">
                        <i class="pi pi-envelope mr-1"></i>Press <b>Invite</b> to add <b class="break-all">{{ typedText }}</b>: existing accounts are added right away, everyone else is added the first time they sign in (invites expire after 2 months).
                    </template>
                    <template v-else>
                        Search existing users by name or email. Can't find someone? Type their full email address to invite them.
                    </template>
                </div>
            </div>
            <Inplace class="p-3">
                <template #display severity="secondary">
                    <Button icon="pi pi-users" label="Add many users at once" />
                </template>
                <template #content="{ closeCallback }">
                    <div class="flex flex-col w-full items-center gap-2">
                        <FloatLabel variant="on"  class="w-full">
                            <Textarea v-model="bulkUsers" name="bulkUsers" id="bulkUsers" class="w-full" rows="12" autofocus></Textarea>
                            <label for="bulkUsers">Email addresses, one per line</label>
                        </FloatLabel>
                        <div class="text-xs text-surface-500 dark:text-surface-400 w-full">
                            Works exactly like the field above: existing accounts are added immediately, everyone else gets an invite that's redeemed when they first sign in.
                        </div>
                        <Button class="w-full" icon="pi pi-user-plus" :loading="addBulkUserLoading" @click="bulkAddUsers" label="Add or invite everyone listed" />
                    </div>
                </template>
            </Inplace>
            <DataView :value="users">
                <template #list="slotProps">
                    <div class="flex flex-col">
                        <div v-for="(item, index) in slotProps.items" :key="index">
                            <div class="flex flex-col sm:flex-row sm:items-center p-6 gap-4" :class="{ 'border-t border-surface-200 dark:border-surface-700': index !== 0 }">
                                <div class="md:w-20 relative">
                                    <img class="block xl:block mx-auto rounded w-full hovercard" :src="`https://www.gravatar.com/avatar/${CryptoJS.SHA256( item.Email )}?d=robohash&s=80`" />
                                </div>
                                <div class="flex flex-col md:flex-row justify-between md:items-center flex-1 gap-6">
                                    <div class="flex flex-row md:flex-col justify-between items-start gap-2">
                                        <div>
                                            <div class="text-lg font-medium">{{ item.Name }} <Badge severity="success" size="small" :value="`${ item.IsAdmin ? 'admin' : 'user' }`"/> <Badge severity="info" size="small" :value="item.IDP"/></div>
                                            <div class="font-medium text-surface-500 dark:text-surface-400 text-sm break-all mt-1">{{ item.Email }}</div>
                                            <div class="text-xs text-surface-400 dark:text-surface-500 break-all">{{ item.ID }}</div>
                                        </div>
                                    </div>
                                    <div class="flex flex-col md:items-end gap-8">
                                        <div class="flex flex-row-reverse md:flex-row gap-2">
                                            <Button v-if="!item.IsAdmin || item.CanDemote" severity="warn" icon="pi pi-user-edit" :loading="promoteUserLoading[item.Email]" @click="promoteToggleUser(item, index)" :label="`${item.IsAdmin? 'Make not admin':'Make admin'}`" class="flex-auto md:flex-initial whitespace-nowrap"></Button>
                                            <Button icon="pi pi-user-minus" severity="warn" :loading="delUserLoading[item.Email]" @click="delUser(item, index)" label="Remove" class="flex-auto md:flex-initial whitespace-nowrap"></Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </DataView>
            <div v-if="pendingInvites.length > 0" class="px-6 pb-2">
                <div class="text-sm font-medium text-surface-500 dark:text-surface-400 mb-2">Pending invites (not yet registered in Authentik)</div>
                <div class="flex flex-col gap-2">
                    <div v-for="invite in pendingInvites" :key="invite.Email" class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded border border-surface-200 dark:border-surface-700">
                        <div class="flex flex-col">
                            <span class="font-medium break-all">{{ invite.Email }}</span>
                            <span class="text-xs text-surface-500 dark:text-surface-400">invited by {{ invite.InvitedBy }} &middot; expires {{ formatInviteDate(invite.ExpiresAt) }}</span>
                        </div>
                        <Button icon="pi pi-times" severity="warn" size="small" :loading="delInviteLoading[invite.Email]" label="Cancel invite" class="whitespace-nowrap" @click="deletePendingInvite(invite.Email)" />
                    </div>
                </div>
            </div>
            <div v-if="users.length > 0" class="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                    icon="pi pi-users"
                    severity="info"
                    label="Email All Users"
                    @click="emailAllUsers"
                    class="px-6 py-2"
                />
                <Button 
                    icon="pi pi-shield" 
                    severity="warning" 
                    label="Email Admins Only" 
                    @click="emailNamespaceAdmins"
                    class="px-6 py-2"
                />
            </div>
        </template>
    </Card>

    <Card class="my-8">
    <template #title>Create subgroup</template>

    <template #content>

        <Message severity="info" class="mb-4">
        <div class="flex flex-col gap-2 text-sm">
            <div class="font-medium">
            Create a subgroup under this parent group
            </div>

            <div>
            • Make sure you selected the correct parent group.
            </div>

            <div>
            • Group names must be <b>unique across the cluster</b>.
            </div>

            <div>
            • Use <b>lowercase letters, numbers, and dashes only</b>.
            </div>

            <div>
            • Names must contain <b>at least one dash</b> (two parts minimum).
            </div>

            <div>
            • Each part must be <b>at least 2 characters</b>.
            </div>

            <div>
            • Forbidden patterns: <code>sys-*</code>, <code>kube-*</code>, <code>*sys*</code>.
            </div>

            <div>
            • One-word names like <code>test</code>, <code>dev</code>, <code>llm</code> are not allowed.
            </div>

            <div>
            • Choose clear, descriptive names (e.g., <code>physics-group</code>, <code>ml-training</code>).
            </div>

            <div>
            • For Kubernetes namespaces (subgroups), fill out PI, Description, and Institution after creation.
            </div>
        </div>
        </Message>

        <!-- Feature Legend -->
        <Card class="mb-4">
        <template #title>Feature Legend</template>
        <template #content>
            <div class="flex flex-col gap-2 text-sm">
            <div class="flex items-center gap-2">
                <span class="w-4 h-4 rounded" style="background-color: #ff6b6b;"></span>
                <span>Red: Organizational group (no special features)</span>
            </div>
            <div class="flex items-center gap-2">
                <span class="w-4 h-4 rounded" style="background-color: #ffd93d;"></span>
                <span>Yellow: LLM group</span>
            </div>
            <div class="flex items-center gap-2">
                <span class="w-4 h-4 rounded" style="background-color: #4dabf7;"></span>
                <span>Blue: Kubernetes namespace only</span>
            </div>
            <div class="flex items-center gap-2">
                <span class="w-4 h-4 rounded" style="background-color: #51cf66;"></span>
                <span>Green: Kubernetes namespace + LLM access</span>
            </div>
            <div class="flex items-center gap-2">
                <span class="w-4 h-4 rounded" style="background-color: #cc5de8;"></span>
                <span>Purple: Group with Milvus Vector DB access</span>
            </div>
            </div>
        </template>
        </Card>

        <InputGroup>
        <FloatLabel variant="on">
            <InputText
                name="newNamespace"
                v-model="newNamespace"
                id="newNamespace"
                fluid
                @blur="onNamespaceBlur"
                @keyup="onNamespaceKeyup"
                :placeholder="`${parentNamespace}-`"
                :class="{ 'p-invalid': !namespaceValidation.valid && newNamespace.length > 0 }"
            />
            <label for="newNamespace">New subgroup name</label>
        </FloatLabel>
        <Button
            label="Create"
            :loading="createNamespaceLoading"
            :disabled="!namespaceValidation.valid || createNamespaceLoading"
            @click="createNamespace"
        />
        </InputGroup>
        <!-- Error message under input -->
        <Message
            v-if="namespaceValidation.message && newNamespace.length > 0"
            severity="error"
            size="small"
            variant="simple"
            class="mt-0"
        >
            {{ namespaceValidation.message }}
        </Message>
        <!-- Info message when empty -->
        <Message v-if="!namespaceValidation.message && newNamespace.length === 0" severity="info" size="small" variant="simple" class="mt-0">
            Enter a name with at least one dash (e.g., <code>{{ parentNamespace }}-group</code>)
        </Message>

        <Card>
        <template #subtitle>Features</template>
        <template #content>
            <div class="flex gap-2">
            <span v-for="feature of features" :key="feature.key">
                <Checkbox
                v-model="selectedFeatures"
                :inputId="feature.key"
                name="feature"
                :value="feature.key"
                :disabled="feature.disabled"
                />
                <label class="m-1" :for="feature.key"> {{ feature.name }} </label>
            </span>
            </div>
        </template>
        </Card>

    </template>
    </Card>


    <Card class="my-8">
        <template #title>Group tenants (hardware owners)</template>
        <template #content>
            <div class="flex flex-col sm:flex-row sm:items-center p-6 gap-4">
                <Chip v-for="tenant in tenants" :key="tenant.Slug" :label="tenant.Name" removable @remove="removeTenant(tenant.Slug)" />
            </div>
            <InputGroup>
                <FloatLabel variant="on">
                    <Select name="addTenant" v-model="assignTenantObj" optionLabel="Name" id="addTenant" type="text" :options="alltenants" fluid />
                    <label for="addTenant">Assign a tenant</label>
                </FloatLabel>
                <Button label="Assign" :loading="assignTenantLoading" @click="assignTenant" />
            </InputGroup>

        </template>
    </Card>
    <Card>
        <template #title><span class="text-red-500">Danger Zone</span></template>
        <template #content>
                <Button label="Delete the group" :loading="deleteNamespaceLoading" @click="deleteNamespace" severity="danger" />
        </template>
    </Card>
</template>

<script setup>
import 'primeicons/primeicons.css'
import {Form} from '@primevue/forms';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from "primevue/useconfirm";
import ConfirmDialog from 'primevue/confirmdialog';
import AutoComplete from "primevue/autocomplete";
import Badge from 'primevue/badge';
import Button from "primevue/button";
import Card from 'primevue/card';
import Checkbox from "primevue/checkbox";
import Chip from 'primevue/chip';
import DataView from 'primevue/dataview';
import FileUpload from 'primevue/fileupload';
import FloatLabel from "primevue/floatlabel";
import Inplace from 'primevue/inplace';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import InputText from "primevue/inputtext";
import Message from 'primevue/message';
import Select from "primevue/select";
import Textarea from "primevue/textarea";
import {VueSpinnerPie} from 'vue3-spinners';

import { RequestManager, HTTPTransport, Client } from "@open-rpc/client-js";

import CryptoJS from 'crypto-js';

import {ref, onMounted, defineEmits, watch, computed} from 'vue';
import { reactive } from 'vue';

import {Hovercards} from '@gravatar-com/hovercards';
import '@gravatar-com/hovercards/dist/style.css';
const hovercards = new Hovercards( { /* Options */ } );

const props = defineProps(['selectedNamespace']);

const form = ref();

const users = ref([]);

const newUser = ref(null);
const userQuery = ref("");

const pendingInvites = ref([]);
const delInviteLoading = ref({});
const inviteUserLoading = ref(false);

const convertFeatures = ref([]);
const convertFeaturesLoading = ref(false);

const filteredOrganizations = ref([]);
const filteredUsers = ref([]);
const alltenants = ref([]);
const tenants = ref([]);

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value || "").trim());

// The one Add/Invite control: while typing, v-model holds the raw string; once
// a suggestion is picked it becomes the user object. The button adapts.
const selectedUser = computed(() => (newUser.value && typeof newUser.value === 'object') ? newUser.value : null);
const typedText = computed(() => typeof newUser.value === 'string' ? newUser.value.trim() : '');
const typedEmailReady = computed(() => !selectedUser.value && isValidEmail(typedText.value));
const canSubmitUser = computed(() => !!selectedUser.value || typedEmailReady.value);
const addButtonLabel = computed(() => typedEmailReady.value ? 'Invite' : 'Add');
const addButtonIcon = computed(() => typedEmailReady.value ? 'pi pi-envelope' : 'pi pi-user-plus');

const submitUser = () => {
    if (selectedUser.value) {
        addUser();
    } else if (typedEmailReady.value) {
        sendInvite(typedText.value);
    }
};

const convertibleFeatures = computed(() => {
    const current = initialValues.features || [];
    return features.value.filter(f => !current.includes(f.key));
});

const bulkUsers = ref("");

const toast = useToast();
const confirm = useConfirm();

const emit = defineEmits(['onNSChanged']);

const newNamespace = ref("");

const namespaceValidation = ref({ valid: true, message: '' });

const parentNamespace = computed(() => {
    const nsNameSplit = props["selectedNamespace"].Name.split("/");
    return nsNameSplit[nsNameSplit.length - 1];
});

const selectedFeatures = ref(["is_k8s_namespace"]);

const features = ref([
    {name: "K8s Namespace", key: "is_k8s_namespace", disabled: false},
    {name: "LLM Access", key: "is_litellm_org", disabled: false},
    {name: "Milvus database", key: "is_milvus_db", disabled: false},
]);

const initialValues = reactive({});

const addUserLoading = ref(false);
const delUserLoading = ref({});
const createNamespaceLoading = ref(false);
const promoteUserLoading = ref({});
const addBulkUserLoading = ref(false);
const deleteNamespaceLoading = ref(false);
const assignTenantLoading = ref(false);
const saveLoading = ref(false);
const isFormLoading = ref(true);
const isUsersLoading = ref(true);

const currentUserIsClusterAdmin = ref(false);
const currentUserIsNrpAdmin = ref(false);
const isCommercial = ref(false);
const commercialSaveLoading = ref(false);

const assignTenantObj = ref({});

const baseUrl = import.meta.env.PUBLIC_SVC_URL;
const transport = new HTTPTransport(baseUrl+"/rpc",
    {
        credentials: 'include',
    },
);
const client = new Client(new RequestManager([transport]));

const onFormSubmit = async ({ valid, states, values }) => {
    if (valid) {
        saveLoading.value = true;
        const nsNameSplit = props["selectedNamespace"].Name.split("/");
        const nsName = nsNameSplit[nsNameSplit.length - 1];
        values.Namespace = nsName;

        client.request({
            method: "admin.SetNamespaceInfo",
            params: values,
        }).then((response) => {
            if (response.error) {
                toast.add({
                    severity: 'error',
                    summary: 'Error saving namespace info',
                    detail: response.error.message,
                    life: 3000
                });
                return;
            }

            toast.add({
                severity: 'success',
                summary: 'Namespace information is saved.',
                life: 3000
            });

        }).catch((err) => {
            toast.add({
                severity: 'error',
                summary: 'Error saving namespace info',
                detail: err.message,
                life: 3000
            });
        }).finally(() => {
            saveLoading.value = false;
        });
    }
};

const onFileChange = (e) => {
    var files = e.files;
    if (!files.length || files.length > 1)
        return;

    var file = files[0];

    var reader  = new FileReader();

    reader.addEventListener("load", () => {
        this.client.request('admin.SaveNSAvatar', {
            Namespace: this.chosen,
            Image: reader.result.toString(),
        }, (err, response) => {
            if (err) throw err;
            if(!response["error"]) {
                toast.add({
                    severity: 'success',
                    summary: "Successfully uploaded the image for namespace "+this.chosen+".",
                    life: 3000
                });
                this.avatar = this.getAvatarUrl();
            } else {
                toast.add({
                    severity: 'danger',
                    summary: 'Error uploading image', message: "Error uploading the image for namespace "+this.chosen+": "+response["error"].message,
                    life: 3000
                });
            }
        });
    }, false);

    if (file) {
        reader.readAsDataURL(file);
    }

};

const getOrganizationsFilter = (org) => {
    return new Promise((resolve, reject) => {
        if(!org.query.trim().length) {
            resolve();  // resolve to avoid hanging Promise
            return;
        }

        const query = org.query.trim();
        const url = `https://api.ror.org/organizations?query=${encodeURIComponent(query)}`;

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    const error = new Error('Network response was not ok');
                    console.error('Error fetching organizations:', error);
                    throw error;
                }
                return response.json();
            })
            .then(data => {                
                filteredOrganizations.value = data.items.map(item => {
                    let nameObj = item.names.find(n => 
                        n.lang === 'en' && (n.types.includes('ror_display') || n.types.includes('label'))
                    );
                    if (!nameObj) {
                        nameObj = item.names.find(n => n.lang === 'en');
                    }
                    if (!nameObj) {
                        nameObj = item.names.find(n => n.types.includes('ror_display') || n.types.includes('label'));
                    }
                    if (!nameObj) {
                        nameObj = item.names[0] || { value: '(No name)' };
                    }

                    return nameObj.value;
                });
                
                resolve();
                return;
            })
            .catch(error => {
                console.error('Error fetching organizations:', error);
                reject(error);
            });
    });
};


let usersSearchSeq = 0;
const getUsersFilter = (org) => {
    return new Promise((resolve) => {
        const term = org.query.trim();
        userQuery.value = term;
        if (term.length < 3) {
            filteredUsers.value = [];
            resolve();
            return;
        }

        // Sequence guard: user searches can take several seconds while the
        // backend cache warms, and typing fires one request per keystroke. Only
        // let the most recent query update the list so a slow/stale earlier
        // response can't clobber the results for what the user actually typed.
        const seq = ++usersSearchSeq;
        client.request({
            method: "admin.ListUsersAC",
            params: { Term: term },
        }).then((response) => {
            if (seq !== usersSearchSeq) {
                resolve();
                return;
            }
            if (response && response.error) {
                console.error('Error fetching users:', response.error);
                filteredUsers.value = [];
            } else {
                filteredUsers.value = (response && response.Users) ? response.Users : [];
            }
            resolve();
        }).catch((err) => {
            if (seq === usersSearchSeq) {
                console.error('Error fetching users:', err);
                filteredUsers.value = [];
            }
            resolve();
        });
    });
};

const readNamespaceInfo = (nsName) => {
    isFormLoading.value = true;
    return client.request({
        method: "user.GetNamespaceInfo",
        params: {
            Namespace: nsName
        }
    }).then((namespaceInfo) => {
        Object.assign(initialValues, namespaceInfo);
        isCommercial.value = !!namespaceInfo.is_commercial;
        form.value?.reset();
    }).catch((err) => {
        toast.add({
            severity: 'error',
            summary: 'Error fetching namespace info',
            detail: err.message,
            life: 3000
        });
    }).finally(() => {
        isFormLoading.value = false;
    });
};

onMounted(async () => {
    const nsNameSplit = props["selectedNamespace"].Name.split("/");
    const nsName = nsNameSplit[nsNameSplit.length - 1];

    readNamespaceInfo(nsName);
    readNSUsers(nsName);
    readPendingInvites(nsName);
    readAllTenants();
    readTenants(nsName);

    client.request({
        method: "user.GetUserInfo",
        params: { UserID: "" }
    }).then((response) => {
        if (response && response.IsAdmin) {
            currentUserIsClusterAdmin.value = true;
        }
        if (response && response.IsNrpAdmin) {
            currentUserIsNrpAdmin.value = true;
        }
    }).catch(() => {});
});

const saveCommercial = () => {
    const nsNameSplit = props["selectedNamespace"].Name.split("/");
    const nsName = nsNameSplit[nsNameSplit.length - 1];

    commercialSaveLoading.value = true;
    client.request({
        method: "admin.SetNamespaceCommercial",
        params: {
            Namespace: nsName,
            IsCommercial: isCommercial.value,
        }
    }).then((response) => {
        if (response && response.error) {
            toast.add({
                severity: 'error',
                summary: 'Error saving commercial flag',
                detail: response.error.message,
                life: 3000
            });
            return;
        }
        toast.add({
            severity: 'success',
            summary: `Commercial flag ${isCommercial.value ? 'enabled' : 'disabled'}.`,
            life: 3000
        });
    }).catch((err) => {
        toast.add({
            severity: 'error',
            summary: 'Error saving commercial flag',
            detail: err.message,
            life: 3000
        });
    }).finally(() => {
        commercialSaveLoading.value = false;
    });
};

const readAllTenants = () => {
    client.request({
        method: "guest.ListTenants",
        params: {},
    }).then((response) => {
        if (response.error) {
            console.error('Error fetching all tenants:', response.error);
            return;
        } else {
            alltenants.value = response.Tenants;
            return;
        }
    });
};

const readTenants = (nsName) => {
    client.request({
        method: "user.GetNamespaceTenants",
        params: {Namespace: nsName},
    }).then((response) => {
        if (response.error) {
            console.error('Error fetching tenants:', response.error);
            return;
        } else {
            tenants.value = response.Tenants;
            return;
        }
    });
};

const readNSUsers = (nsName) => {
    isUsersLoading.value = true;
    client.request({
        method: "admin.GetNSUsers",
        params: {
            Namespace: nsName
        }
    }).then((namespaceUsers) => {
        users.value.splice(0);
        if(namespaceUsers.Admins) {
            namespaceUsers.Admins.forEach((user) => {
                user.IsAdmin = true;
            });
            users.value.push(...namespaceUsers.Admins);
        }
        if(namespaceUsers.Users) {
            namespaceUsers.Users.forEach((user) => {
                user.IsAdmin = false;
            });
            users.value.push(...namespaceUsers.Users);
        }
    }).catch((err) => {
        toast.add({
            severity: 'error',
            summary: 'Error fetching users',
            detail: err.message,
            life: 3000
        });
    }).finally(() => {
        isUsersLoading.value = false;
        hovercards.attach( document.getElementById( 'users' ) );
    });
}

const readPendingInvites = (nsName) => {
    client.request({
        method: "admin.ListPendingNSInvites",
        params: {
            Namespace: nsName
        }
    }).then((response) => {
        if (response && response.error) {
            console.error('Error fetching pending invites:', response.error);
            return;
        }
        pendingInvites.value = (response && response.Invites) ? response.Invites : [];
    }).catch((err) => {
        console.error('Error fetching pending invites:', err);
    });
};

const formatInviteDate = (value) => {
    if (!value) {
        return 'unknown';
    }
    const d = new Date(value);
    if (isNaN(d.getTime())) {
        return value;
    }
    return d.toLocaleDateString();
};

const sendInvite = async (rawEmail) => {
    const nsNameSplit = props["selectedNamespace"].Name.split("/");
    const nsName = nsNameSplit[nsNameSplit.length - 1];

    const email = (rawEmail || "").trim();
    if (!isValidEmail(email)) {
        toast.add({
            severity: 'error',
            summary: 'Invalid email',
            detail: 'Please enter a valid email address to invite.',
            life: 3000
        });
        return;
    }

    inviteUserLoading.value = true;
    client.request({
        method: "admin.InviteNSUsers",
        params: {
            Namespace: nsName,
            Emails: [email],
        }
    }).then((response) => {
        if (response && response.error) {
            toast.add({
                severity: 'error',
                summary: 'Error inviting user',
                detail: response.error.message,
                life: 4000
            });
            return;
        }

        if (response && response.Invalid && response.Invalid.length > 0) {
            toast.add({
                severity: 'error',
                summary: 'Invalid email',
                detail: response.Invalid.join(', '),
                life: 4000
            });
            return;
        }

        if (response && response.Added && response.Added.includes(email)) {
            toast.add({
                severity: 'success',
                summary: 'User added',
                detail: `${email} already has an account and was added to this group.`,
                life: 5000
            });
        } else {
            toast.add({
                severity: 'success',
                summary: 'Invite sent',
                detail: `${email} will be added to this group when they first sign in.`,
                life: 5000
            });
        }
        userQuery.value = "";
        newUser.value = null;
        readPendingInvites(nsName);
        readNSUsers(nsName);
    }).catch((err) => {
        toast.add({
            severity: 'error',
            summary: 'Error inviting user',
            detail: err.message,
            life: 4000
        });
    }).finally(() => {
        inviteUserLoading.value = false;
    });
};

const deletePendingInvite = async (email) => {
    const nsNameSplit = props["selectedNamespace"].Name.split("/");
    const nsName = nsNameSplit[nsNameSplit.length - 1];

    delInviteLoading.value[email] = true;
    client.request({
        method: "admin.DeletePendingNSInvite",
        params: {
            Namespace: nsName,
            Email: email,
        }
    }).then((response) => {
        if (response && response.error) {
            toast.add({
                severity: 'error',
                summary: 'Error cancelling invite',
                detail: response.error.message,
                life: 3000
            });
            return;
        }
        pendingInvites.value = pendingInvites.value.filter(i => i.Email !== email);
        toast.add({
            severity: 'success',
            summary: 'Invite cancelled',
            life: 3000
        });
    }).catch((err) => {
        toast.add({
            severity: 'error',
            summary: 'Error cancelling invite',
            detail: err.message,
            life: 3000
        });
    }).finally(() => {
        delInviteLoading.value[email] = false;
    });
};

const convertGroupFeatures = async () => {
    const nsNameSplit = props["selectedNamespace"].Name.split("/");
    const nsName = nsNameSplit[nsNameSplit.length - 1];

    if (convertFeatures.value.length === 0) {
        return;
    }

    convertFeaturesLoading.value = true;
    client.request({
        method: "admin.ConvertGroupFeatures",
        params: {
            Group: nsName,
            Features: convertFeatures.value,
        }
    }).then((response) => {
        if (response && response.error) {
            toast.add({
                severity: 'error',
                summary: 'Error enabling features',
                detail: response.error.message,
                life: 5000
            });
            return;
        }

        const applied = (response && response.Applied) ? response.Applied : [];
        const warnings = (response && response.Warnings) ? response.Warnings : [];

        // Reflect the change immediately: check the feature boxes and re-color
        // the tree without waiting for the backend re-fetch to land.
        if (applied.length > 0) {
            const current = initialValues.features || [];
            initialValues.features = [...new Set([...current, ...applied])];
        }

        if (applied.length > 0) {
            toast.add({
                severity: 'success',
                summary: 'Features enabled',
                detail: applied.join(', '),
                life: 5000
            });
        } else if (warnings.length === 0) {
            toast.add({
                severity: 'info',
                summary: 'No changes',
                detail: 'Selected features were already enabled.',
                life: 4000
            });
        }
        if (warnings.length > 0) {
            toast.add({
                severity: 'warn',
                summary: 'Notes',
                detail: warnings.join('; '),
                life: 6000
            });
        }

        convertFeatures.value = [];
        readNamespaceInfo(nsName);
        emit('onNSChanged');
    }).catch((err) => {
        toast.add({
            severity: 'error',
            summary: 'Error enabling features',
            detail: err.message,
            life: 5000
        });
    }).finally(() => {
        convertFeaturesLoading.value = false;
    });
};

const resolver = ({ states, values }) => {
    const errors = {};

    if (!values.description) {
        errors.description = [{ message: 'Description is required.' }];
    } else if (values.description.length < 50) {
        errors.description = [{ message: 'Please provide a longer meaningful description.' }];
    }

    if (!values.institution || typeof values.institution !== 'string') {
        errors.institution = [{ message: 'Institution is required.' }];
    }

    if (!values.publications) {
        errors.publications = [{ message: 'Please enter publications or "None".' }];
    }

    return {
        values,
        errors
    };
};

const addUser = async () => {
    const nsNameSplit = props["selectedNamespace"].Name.split("/");
    const nsName = nsNameSplit[nsNameSplit.length - 1];

    if (!selectedUser.value || !selectedUser.value.ID) {
        return;
    }

    addUserLoading.value = true;
    client.request({
        method: "admin.AddNSUser",
        params: {
            Namespace: nsName,
            UserID: selectedUser.value.ID
        }
    }).then((response) => {
        if (response.error) {
            toast.add({
                severity: 'error',
                summary: 'Error adding user',
                detail: response.error.message,
                life: 3000
            });
        } else {
            readNSUsers(nsName);
            newUser.value = null;

            toast.add({
                severity: 'success',
                summary: 'User added successfully',
                life: 3000
            });
        }
    }).catch((err) => {
        toast.add({
            severity: 'error',
            summary: 'Error adding user',
            detail: err.message,
            life: 3000
        });
    }).finally(() => {
        addUserLoading.value = false;
    });
};

const assignTenant = async () => {
    const nsNameSplit = props["selectedNamespace"].Name.split("/");
    const nsName = nsNameSplit[nsNameSplit.length - 1];

    if (!assignTenantObj.value) {
        return;
    }

    assignTenantLoading.value = true;
    client.request({
        method: "admin.ModifyNamespaceTenant",
        params: {
            Namespace: nsName,
            TenantSlug: assignTenantObj.value.Slug,
            IsAdding: true,
        }
    }).then((response) => {
        if (response.error) {
            toast.add({
                severity: 'error',
                summary: 'Error assigning tenant',
                detail: response.error.message,
                life: 3000
            });
        } else {
            toast.add({
                severity: 'success',
                summary: 'Tenant assigned successfully',
                life: 3000
            });
        }
    }).catch((err) => {
        toast.add({
            severity: 'error',
            summary: 'Error assigning tenant',
            detail: err.message,
            life: 3000
        });
    }).finally(() => {
        assignTenantLoading.value = false;
        readTenants(nsName);
    });
};

const removeTenant = async (tenantSlug) => {
    const nsNameSplit = props["selectedNamespace"].Name.split("/");
    const nsName = nsNameSplit[nsNameSplit.length - 1];

    client.request({
        method: "admin.ModifyNamespaceTenant",
        params: {
            Namespace: nsName,
            TenantSlug: tenantSlug,
            IsAdding: false,
        }
    }).then((response) => {
        if (response.error) {
            toast.add({
                severity: 'error',
                summary: 'Error unassigning tenant',
                detail: response.error.message,
                life: 3000
            });
        } else {
            toast.add({
                severity: 'success',
                summary: 'Tenant unassigned successfully',
                life: 3000
            });
        }
    }).catch((err) => {
        toast.add({
            severity: 'error',
            summary: 'Error unassigning tenant',
            detail: err.message,
            life: 3000
        });
    }).finally(() => {
    });
}

const promoteToggleUser = async (user, index) => {
    if (!user) {
        return;
    }

    promoteUserLoading.value[user.Email] = true;

    client.request({
        method: "admin.PromoteUser",
        params: {
            UserID: user.ID,
            IsPromoting: !user.IsAdmin,
        }
    }).then((response) => {
        if (response.error) {
            toast.add({
                severity: 'error',
                summary: 'Error '+(user.IsAdmin?"demoting":"promoting")+' user',
                detail: response.error.message,
                life: 3000
            });
        } else {
            const nsNameSplit = props["selectedNamespace"].Name.split("/");
            const nsName = nsNameSplit[nsNameSplit.length - 1];
            readNSUsers(nsName);
            toast.add({
                severity: 'success',
                summary: 'User '+(user.IsAdmin?"demoted":"promoted")+' successfully',
                life: 3000
            });
        }
    }).catch((err) => {
        toast.add({
            severity: 'error',
            summary: 'Error '+(user.IsAdmin?"demoting":"promoting")+' user',
            detail: err.message,
            life: 3000
        });
    }).finally(() => {
        promoteUserLoading.value[user.Email] = false;
    });

};

const delUser = async (user, index) => {
    const nsNameSplit = props["selectedNamespace"].Name.split("/");
    const nsName = nsNameSplit[nsNameSplit.length - 1];

    if (!user) {
        return;
    }

    delUserLoading.value[user.Email] = true;

    client.request({
        method: "admin.DeleteNSUser",
        params: {
            Namespace: nsName,
            UserID: user.ID,
        }
    }).then((response) => {
        if (response.error) {
            toast.add({
                severity: 'error',
                summary: 'Error removing user',
                detail: response.error.message,
                life: 3000
            });
        } else {
            users.value.splice(index, 1);
            toast.add({
                severity: 'success',
                summary: 'User removed successfully',
                life: 3000
            });
        }
    }).catch((err) => {
        toast.add({
            severity: 'error',
            summary: 'Error removing user',
            detail: err.message,
            life: 3000
        });
    }).finally(() => {
        delUserLoading.value[user.Email] = false;
    });

};

const bulkAddUsers = async () => {
    const nsNameSplit = props["selectedNamespace"].Name.split("/");
    const nsName = nsNameSplit[nsNameSplit.length - 1];

    if (!bulkUsers.value) {
        return;
    }

    addBulkUserLoading.value = true;

    client.request({
        method: "admin.InviteNSUsers",
        params: {
            Namespace: nsName,
            Emails: bulkUsers.value.split("\n").map(user => user.trim()).filter(Boolean),
        }
    }).then((response) => {
        if (response && response.error) {
            toast.add({
                severity: 'error',
                summary: 'Error adding users',
                detail: response.error.message,
                life: 4000
            });
            return;
        }

        const added = (response && response.Added) ? response.Added : [];
        const invited = (response && response.Invited) ? response.Invited : [];
        const invalid = (response && response.Invalid) ? response.Invalid : [];

        if (added.length > 0) {
            toast.add({
                severity: 'success',
                summary: `Added ${added.length} existing user${added.length === 1 ? '' : 's'}`,
                life: 4000
            });
        }
        if (invited.length > 0) {
            toast.add({
                severity: 'info',
                summary: `Invited ${invited.length} user${invited.length === 1 ? '' : 's'} by email`,
                detail: 'They will be added when they first sign in.',
                life: 5000
            });
        }
        if (invalid.length > 0) {
            toast.add({
                severity: 'error',
                summary: `${invalid.length} invalid email${invalid.length === 1 ? '' : 's'}`,
                detail: invalid.join(', '),
                life: 6000
            });
        }
        if (added.length === 0 && invited.length === 0 && invalid.length === 0) {
            toast.add({
                severity: 'warn',
                summary: 'Nothing to do',
                detail: 'No email addresses found in the list.',
                life: 4000
            });
        }

        if (added.length > 0 || invited.length > 0) {
            bulkUsers.value = "";
            readNSUsers(nsName);
            readPendingInvites(nsName);
        }
    }).catch((err) => {
        toast.add({
            severity: 'error',
            summary: 'Error adding users',
            detail: err.message || String(err),
            life: 4000
        });
    }).finally(() => {
        addBulkUserLoading.value = false;
    });
};

const createNamespace = () => {
    const nsNameSplit = props["selectedNamespace"].Name.split("/");
    const nsName = nsNameSplit[nsNameSplit.length - 1];

    if (!newNamespace.value) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Please enter a subgroup name', life: 3000 });
        return;
    }

    createNamespaceLoading.value = true;

    client.request({
        method: "admin.CreateNamespace",
        params: {
            Namespace: nsName,
            NewNamespace: newNamespace.value,
            GroupFeatures: selectedFeatures.value,
        }
    }).then((response) => {
        if (response.error) {
            toast.add({
                severity: 'error',
                summary: 'Error creating group',
                detail: response.error.message,
                life: 3000
            });
            return;
        }

        toast.add({
            severity: 'success',
            summary: 'Successfully created group '+newNamespace.value,
            life: 3000
        });
        emit('onNSChanged');
        newNamespace.value = '';
        namespaceValidation.value = { valid: true, message: '' };

    }).catch((err) => {
        toast.add({
            severity: 'error',
            summary: 'Error creating group',
            detail: err,
            life: 3000
        });
    }).finally(() => {
        createNamespaceLoading.value = false;
    });
};

const deleteNamespace = () => {
    
    const nsNameSplit = props["selectedNamespace"].Name.split("/");
    const nsName = nsNameSplit[nsNameSplit.length - 1];

    confirm.require({
        message: 'Do you want to delete this group?',
        header: 'Danger Zone',
        icon: 'pi pi-info-circle',
        rejectLabel: 'Cancel',
        rejectProps: {
            label: 'Cancel',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: 'Delete',
            severity: 'danger'
        },
        accept: () => {
            deleteNamespaceLoading.value = true;
            client.request({
                method: "admin.DeleteNamespace",
                params: {
                    Namespace: nsName,
                }
            }).then((response) => {
                if (response.error) {
                    toast.add({
                        severity: 'error',
                        summary: 'Error deleting group',
                        detail: response.error.message,
                        life: 3000
                    });
                    return;
                }
                
                toast.add({
                    severity: 'success',
                    summary: 'Successfully deleted group '+newNamespace.value,
                    life: 3000
                });
                emit('onNSChanged');

            }).catch((err) => {
                toast.add({
                    severity: 'error',
                    summary: 'Error deleting group',
                    detail: err,
                    life: 3000
                });
            }).finally(() => {
                deleteNamespaceLoading.value = false;
            });
        },
        reject: () => {
            toast.add({ severity: 'error', summary: 'Rejected', detail: 'You have rejected the deletion', life: 3000 });
        }
    });
};

const emailNamespaceAdmins = () => {
    const adminUsers = users.value.filter(user => user.IsAdmin);
    
    if (adminUsers.length === 0) {
        toast.add({
            severity: 'warn',
            summary: 'No admins found',
            detail: 'There are no admin users in this namespace to email.',
            life: 3000
        });
        return;
    }
    
    const adminEmails = adminUsers.map(user => user.Email).join(',');
    const subject = `[NAUTILUS] ${props.selectedNamespace?.Name || 'Unknown'}`;
    const body = `Hello,\n\nThis email is regarding the namespace: ${props.selectedNamespace?.Name || 'Unknown'}\n\nPlease let me know if you have any questions.\n\nBest regards`;
    
    const mailtoLink = `mailto:${adminEmails}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.open(mailtoLink, '_blank');
    
    toast.add({
        severity: 'info',
        summary: 'Email client opened',
        detail: `Opened email to ${adminUsers.length} admin(s) in this namespace.`,
        life: 3000
    });
};

const emailAllUsers = () => {
    const allUsers = users.value;

    if (allUsers.length === 0) {
        toast.add({
            severity: 'warn',
            summary: 'No users found',
            detail: 'There are no users in this namespace to email.',
            life: 3000
        });
        return;
    }

    const allEmails = allUsers.map(user => user.Email).join(',');
    const subject = `[NAUTILUS] ${props.selectedNamespace?.Name || 'Unknown'}`;
    const body = `Hello,\n\nThis email is regarding the namespace: ${props.selectedNamespace?.Name || 'Unknown'}\n\nPlease let me know if you have any questions.\n\nBest regards`;

    const mailtoLink = `mailto:${allEmails}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.open(mailtoLink, '_blank');

    const adminCount = allUsers.filter(user => user.IsAdmin).length;
    const regularUserCount = allUsers.length - adminCount;

    toast.add({
        severity: 'info',
        summary: 'Email client opened',
        detail: `Opened email to ${allUsers.length} user(s) (${adminCount} admin(s), ${regularUserCount} regular user(s)) in this namespace.`,
        life: 3000
    });
};

const validateNamespaceName = (name, parentNamespace) => {
    if (!name || name.trim() === '') {
        return { valid: false, message: '' };
    }

    // Cluster admins (members of the nrp group) bypass typo guardrails.
    if (currentUserIsClusterAdmin.value) {
        return { valid: true, message: '' };
    }

    // Always forbidden: system (complete block)
    const alwaysForbidden = ['system'];

    // Generic/placeholder terms - forbidden as single parts
    const genericTerms = ['test', 'dev', 'production', 'staging', 'stage', 'temp', 'tmp', 'example', 'fake', 'dummy', 'my', 'group'];

    // Forbidden prefixes (must be followed by dash at START of name)
    const forbiddenPrefixes = ['sys-', 'kube-'];

    let issues = [];

    // Check for valid characters (lowercase letters, numbers, dashes only)
    const validCharRegex = /^[a-z0-9-]+$/;
    if (!validCharRegex.test(name)) {
        const invalidChars = name.replace(/[a-z0-9-]/g, '');
        issues.push(`Invalid characters found: '${invalidChars}'. Only lowercase letters (a-z), numbers (0-9), and dashes (-) are allowed.`);
    }

    // Must have at least one dash
    if (!name.includes('-')) {
        issues.push('Missing required dash (-). A dash is mandatory to separate at least two words (e.g., "my-group").');
    }

    // Split by dash and validate
    const parts = name.split('-');

    // Check for consecutive dashes (empty parts)
    const emptyPartIndices = parts
        .map((part, idx) => part === '' ? idx : -1)
        .filter(idx => idx !== -1);

    if (emptyPartIndices.length > 0) {
        issues.push(`Empty parts detected at positions: ${emptyPartIndices.join(', ')}. Consecutive dashes (--) are not allowed.`);
    }

    // Check each part
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];

        // Skip empty parts (already reported)
        if (part.length === 0) continue;

        // Each part must be at least 2 characters
        if (part.length < 2) {
            issues.push(`Part "${part}" at position ${i + 1} is too short. Each part must be at least 2 characters.`);
        }

        // Check always forbidden
        if (alwaysForbidden.includes(part.toLowerCase())) {
            issues.push(`"${part}" is not allowed in subgroup names.`);
        }

        // Check generic/placeholder terms
        if (genericTerms.includes(part.toLowerCase())) {
            issues.push(`"${part}" is not allowed in subgroup names.`);
        }

        // Check forbidden prefixes only at FIRST position
        if (i === 0) {
            const partLower = part.toLowerCase();
            if (forbiddenPrefixes.some(prefix => partLower.startsWith(prefix.replace('-', '')))) {
                issues.push(`"${part}" is a reserved prefix and cannot be used at the start of a subgroup name.`);
            }
        }
    }

    // Check for two-part names where both are generic
    if (parts.length === 2 && !parts.some(p => p.length === 0)) {
        const firstGeneric = genericTerms.includes(parts[0].toLowerCase());
        const secondGeneric = genericTerms.includes(parts[1].toLowerCase());
        if (firstGeneric && secondGeneric) {
            issues.push(`Both parts are generic terms. Use specific, meaningful names (e.g., "physics-cluster" not "my-group").`);
        }
    }

    // Build clean error messages
    if (issues.length > 0) {
        const issueDetails = issues.map(issue => issue).join('\n');
        return {
            valid: false,
            message: issueDetails
        };
    }

    return { valid: true, message: '' };
};

const onNamespaceBlur = () => {
    const nsNameSplit = props["selectedNamespace"].Name.split("/");
    const nsName = nsNameSplit[nsNameSplit.length - 1];
    const validation = validateNamespaceName(newNamespace.value, nsName);
    // Only show verbose errors, not info messages
    if (validation.valid) {
        namespaceValidation.value = { valid: true, message: '' };
    } else {
        namespaceValidation.value = validation;
    }
};

const onNamespaceKeyup = () => {
    // Auto-format: add dash before capital letters (e.g., "physicsGroup" -> "physics-group")
    if (!currentUserIsClusterAdmin.value && newNamespace.value && /[A-Z]/.test(newNamespace.value)) {
        const formatted = newNamespace.value.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
        if (formatted !== newNamespace.value) {
            newNamespace.value = formatted;
            // Validate after auto-format
            setTimeout(() => {
                const nsNameSplit = props["selectedNamespace"].Name.split("/");
                const nsName = nsNameSplit[nsNameSplit.length - 1];
                namespaceValidation.value = validateNamespaceName(newNamespace.value, nsName);
            }, 0);
        }
    }

    // Validate as user types
    if (newNamespace.value.trim()) {
        const nsNameSplit = props["selectedNamespace"].Name.split("/");
        const nsName = nsNameSplit[nsNameSplit.length - 1];
        const validation = validateNamespaceName(newNamespace.value, nsName);
        // Only show verbose errors, not info messages
        if (validation.valid) {
            namespaceValidation.value = { valid: true, message: '' };
        } else {
            namespaceValidation.value = validation;
        }
    } else {
        namespaceValidation.value = { valid: true, message: '' };
    }
};
</script>