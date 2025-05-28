<template>
    <Card class="my-8">
        <template #title>Editing {{ selectedNamespace.Name }}</template>
        <template #content>
            <Form v-slot="$form" ref="form" :resolver :initialValues @submit="onFormSubmit" class="flex flex-col gap-4 w-full">
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
                <Button type="submit" severity="secondary" label="Save" />
            </Form>
        </template>
    </Card>
    <!-- <Card>
        <template #title>Namespace Logo</template>
        <template #content>
            <FileUpload ref="fileupload" mode="basic" name="avatar" @select="onFileChange" customUpload accept="image/*" :maxFileSize="1000000" @upload="onFileChange" :auto="true"/>
        </template>
    </Card> -->
    <Card>
        <template #title>Users</template>
        <template #content>
            <div class="flex flex-col sm:flex-row sm:items-center p-6 gap-4">
                <InputGroup>
                    <FloatLabel variant="on">
                        <AutoComplete name="newUser" v-model="newUser" forceSelection optionLabel="Title" id="newUser" type="text" :suggestions="filteredUsers" @complete="getUsersFilter" fluid />
                        <label for="newUser">Add New User</label>
                    </FloatLabel>
                    <Button label="Add" @click="addUser" />
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
                        <Button text="Add" class="w-full" @click="bulkAddUsers">Bulk add users by email</Button>
                    </div>
                </template>
            </Inplace>
            <DataView :value="users">
                <template #list="slotProps">
                    <div class="flex flex-col">
                        <div v-for="(item, index) in slotProps.items" :key="index">
                            <div class="flex flex-col sm:flex-row sm:items-center p-6 gap-4" :class="{ 'border-t border-surface-200 dark:border-surface-700': index !== 0 }">
                                <div class="md:w-20 relative">
                                    <img class="block xl:block mx-auto rounded w-full" :src="`https://www.gravatar.com/avatar/${CryptoJS.SHA256( item.Email )}?d=robohash&s=80`" />
                                </div>
                                <div class="flex flex-col md:flex-row justify-between md:items-center flex-1 gap-6">
                                    <div class="flex flex-row md:flex-col justify-between items-start gap-2">
                                        <div>
                                            <span class="font-medium text-surface-500 dark:text-surface-400 text-sm">{{ item.Email }}</span>
                                            <div class="text-lg font-medium mt-2">{{ item.Name }} <Badge severity="success" size="small" :value="`${ item.IsAdmin ? 'admin' : 'user' }`"/></div>                                                                                       
                                        </div>
                                    </div>
                                    <div class="flex flex-col md:items-end gap-8">
                                        <div class="flex flex-row-reverse md:flex-row gap-2">
                                            <Button icon="pi pi-trash" @click="delUser(item, index)" label="Remove" class="flex-auto md:flex-initial whitespace-nowrap"></Button>
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
</template>

<script setup>
import {Form} from '@primevue/forms';
import { useToast } from 'primevue/usetoast';
import AutoComplete from "primevue/autocomplete";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import Textarea from "primevue/textarea";
import FloatLabel from "primevue/floatlabel";
import FileUpload from 'primevue/fileupload';
import Card from 'primevue/card';
import DataView from 'primevue/dataview';
import InputGroup from 'primevue/inputgroup';
import Badge from 'primevue/badge';
import Inplace from 'primevue/inplace';

import { RequestManager, HTTPTransport, Client } from "@open-rpc/client-js";

import CryptoJS from 'crypto-js';

import {ref, onMounted, watch} from 'vue';
import { reactive } from 'vue';

const props = defineProps(['selectedNamespace']);

const form = ref();

const users = ref([]);

const newUser = ref(null);

const filteredOrganizations = ref([]);
const filteredUsers = ref([]);

const bulkUsers = ref("");

const toast = useToast();

const initialValues = reactive({
});

const baseUrl = import.meta.env.PUBLIC_SVC_URL;
const transport = new HTTPTransport(baseUrl+"/rpc",
{
    credentials: 'include',
},
);
const client = new Client(new RequestManager([transport]));

const onFormSubmit = async ({ valid, states, values }) => {
    if (valid) {
        const nsNameSplit = props["selectedNamespace"].Name.split("/");
        const nsName = nsNameSplit[nsNameSplit.length - 1];

        values.Namespace = nsName;

        const namespaceInfo = await client.request({
            method: "admin.SetNamespaceInfo",
            params: values,
        });

        toast.add({
            severity: 'success',
            summary: 'Form is submitted.',
            life: 3000
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

        const nsNameSplit = props["selectedNamespace"].Name.split("/");
        const nsName = nsNameSplit[nsNameSplit.length - 1];

        const namespaceInfo = client.request({
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

    client.request({
        method: "admin.GetNamespaceInfo",
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
    });

    readNSUsers(nsName);
});

const readNSUsers = (nsName) => {
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

    const response = await client.request({
        method: "admin.AddNSUser",
        params: {
            Namespace: nsName,
            UserID: newUser.value.ID
        }
    });

    if (response.error) {
        toast.add({
            severity: 'error',
            summary: 'Error adding user',
            detail: response.error.message,
            life: 3000
        });
    } else {
        users.value.push({
            ID: newUser.value.ID,
            Name: newUser.value.Name,
            Email: newUser.value.Email,
            IsAdmin: newUser.value.IsAdmin,
        });
        toast.add({
            severity: 'success',
            summary: 'User added successfully',
            life: 3000
        });
    }
};

const delUser = async (user, index) => {
    const nsNameSplit = props["selectedNamespace"].Name.split("/");
    const nsName = nsNameSplit[nsNameSplit.length - 1];

    if (!user) {
        return;
    }

    const response = await client.request({
        method: "admin.DeleteNSUser",
        params: {
            Namespace: nsName,
            UserID: user.ID,
        }
    });

    if (response.error) {
        toast.add({
            severity: 'error',
            summary: 'Error adding user',
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
};

const bulkAddUsers = async () => {
    const nsNameSplit = props["selectedNamespace"].Name.split("/");
    const nsName = nsNameSplit[nsNameSplit.length - 1];

    if (!bulkUsers.value) {
        return;
    }

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
    });
};
</script>