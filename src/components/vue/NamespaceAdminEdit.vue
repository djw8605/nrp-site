<template>
    <Card class="my-8">
        <template #title>Editing {{ selectedNamespace.Name }}</template>
        <template #content>
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
                        <AutoComplete name="institution" forceSelection id="institution" type="text" :suggestions="filteredOrganizations" @complete="getOrganizationsFilter" fluid />
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
            <div class="flex flex-col sm:flex-row sm:items-center p-6 gap-4">
                <InputGroup>
                    <FloatLabel variant="on">
                        <AutoComplete name="newUser" v-model="newUser" forceSelection optionLabel="Title" id="newUser" type="text" :suggestions="filteredUsers" @complete="getUsersFilter" fluid />
                        <label for="newUser">Add New User</label>
                    </FloatLabel>
                    <Button label="Add" :loading="addUserLoading" @click="addUser" />
                </InputGroup>
            </div>
            <Inplace class="p-3">
                <template #display severity="secondary">
                    <Button>Open bulk users add form</Button>
                </template>
                <template #content="{ closeCallback }">
                    <div class="flex flex-col w-full items-center gap-2">
                        <FloatLabel variant="on"  class="w-full">
                            <Textarea v-model="bulkUsers" name="bulkUsers" id="bulkUsers" class="w-full" rows="12" autofocus></Textarea>
                            <label for="bulkUsers">Users emails, one per line</label>
                        </FloatLabel>
                        <Button text="Add" class="w-full" :loading="addBulkUserLoading" @click="bulkAddUsers">Bulk add users by email</Button>
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
                                            <span class="font-medium text-surface-500 dark:text-surface-400 text-sm">{{ item.Email }}</span>
                                            <div class="text-lg font-medium mt-2">{{ item.Name }} <Badge severity="success" size="small" :value="`${ item.IsAdmin ? 'admin' : 'user' }`"/> <Badge severity="info" size="small" :value="item.IDP"/></div>
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
        </template>
    </Card>
    <Card class="my-8" >
        <template #title>Create subgroup</template>
        <template #content>
            <InputGroup>
                <FloatLabel variant="on">
                    <InputText name="newNamespace" v-model="newNamespace" id="newNamespace" fluid />
                    <label for="newNamespace">New group (should not exist already)</label>
                </FloatLabel>
                <Button label="Create" :loading="createNamespaceLoading" @click="createNamespace" />
            </InputGroup>
            <Card>
                <template #subtitle>Features</template>
                <template #content>
                    <div class="flex gap-2">
                        <span  v-for="feature of features" :key="feature.key">
                            <Checkbox v-model="selectedFeatures" :inputId="feature.key" name="feature" :value="feature.key" :disabled="feature.disabled" />
                            <label class="m-1" :for="feature.key"> {{ feature.name }} </label>
                        </span>
                    </div>
                </template>
            </Card>
        </template>
    </Card>
    <Card>
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
</template>

<script setup>
import 'primeicons/primeicons.css'
import {Form} from '@primevue/forms';
import { useToast } from 'primevue/usetoast';
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

import {ref, onMounted, defineEmits, watch} from 'vue';
import { reactive } from 'vue';

import {Hovercards} from '@gravatar-com/hovercards';
import '@gravatar-com/hovercards/dist/style.css';
const hovercards = new Hovercards( { /* Options */ } );

const props = defineProps(['selectedNamespace']);

const form = ref();

const users = ref([]);

const newUser = ref(null);

const filteredOrganizations = ref([]);
const filteredUsers = ref([]);
const alltenants = ref([]);
const tenants = ref([]);

const bulkUsers = ref("");

const toast = useToast();

const emit = defineEmits(['onNSChanged']);

const newNamespace = ref("");

const selectedFeatures = ref(["is_k8s_namespace"]);

const features = ref([
    {name: "K8s namespace", key: "is_k8s_namespace", disabled: false},
    {name: "LiteLLM", key: "is_litellm_org", disabled: false},
]);

const initialValues = reactive({
    });

const addUserLoading = ref(false);
const delUserLoading = ref({});
const createNamespaceLoading = ref(false);
const promoteUserLoading = ref({});
const addBulkUserLoading = ref(false);
const assignTenantLoading = ref(false);
const saveLoading = ref(false);
const isFormLoading = ref(true);
const isUsersLoading = ref(true);

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
            return;
        }

        fetch(`https://api.ror.org/organizations?query=${encodeURIComponent(org.query.trim())}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                filteredOrganizations.value = data.items.map(item => item.name);
                
                // resolve(organizations);
                resolve();
                return;
            })
            .catch(error => {
                console.error('Error fetching organizations:', error);
                reject(error);
            });
    });
};

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

onMounted(async () => {
    const nsNameSplit = props["selectedNamespace"].Name.split("/");
    const nsName = nsNameSplit[nsNameSplit.length - 1];

    isFormLoading.value = true;
    client.request({
        method: "user.GetNamespaceInfo",
        params: {
            Namespace: nsName
        }
    }).then((namespaceInfo) => {
        Object.assign(initialValues, namespaceInfo);
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

    readNSUsers(nsName);
    readAllTenants();
    readTenants(nsName);
});

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

const resolver = ({ states, values }) => {
    const errors = {};

    if (!values.description) {
        errors.description = [{ message: 'Description is required.' }];
    } else if (values.description.length < 50) {
        errors.description = [{ message: 'Please provide a longer meaningful description.' }];
    }

    if (!values.institution) {
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

    if (!newUser.value) {
        return;
    }

    addUserLoading.value = true;
    client.request({
        method: "admin.AddNSUser",
        params: {
            Namespace: nsName,
            UserID: newUser.value.ID
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
        method: "admin.BulkAddNSUsers",
        params: {
            Namespace: nsName,
            Users: bulkUsers.value.split("\n").map(user => user.trim()),
        }
    }).then((response) => {
        if (response.error) {
            toast.add({
                severity: 'error',
                summary: 'Error adding users',
                detail: response.error.message,
                life: 3000
            });
            return;
        }
        
        if (response.Success.length === 0) {
            toast.add({
                severity: 'error',
                summary: 'No users added',
                life: 3000
            });
        } else {
            toast.add({
                severity: 'success',
                summary: 'Successfully added '+response.Success.length+' users',
                life: 3000
            });
            users.value.push(...response.Success);
        }
        if (response.NotFound.length > 0) {
            toast.add({
                severity: 'error',
                summary: 'Error adding '+response.NotFound.length+' users',
                detail: response.NotFound.join(", "),
                life: 3000
            });
        }
        // readNSUsers();
    }).catch((err) => {
        toast.add({
            severity: 'error',
            summary: 'Error adding users',
            detail: err,
            life: 3000
        });
    }).finally(() => {
        addBulkUserLoading.value = false;
    });
};

const createNamespace = () => {
    const nsNameSplit = props["selectedNamespace"].Name.split("/");
    const nsName = nsNameSplit[nsNameSplit.length - 1];

    if (!newNamespace.value) {
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
</script>