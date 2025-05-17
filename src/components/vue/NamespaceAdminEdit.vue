<template>
    <Card class="my-8">
        <template #title>Editing {{ selectedNamespace.Name }}</template>
        <template #content>
            <Form v-slot="$form" :resolver :initialValues @submit="onFormSubmit" class="flex flex-col gap-4 w-full">
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
                        <AutoComplete name="institution" id="institution" type="text" :suggestions="filteredOrganizations" @complete="getOrganizations" fluid />
                        <label for="institution">Institution</label>
                    </FloatLabel>
                    <Message v-if="$form.institution?.invalid" severity="error" size="small" variant="simple">{{ $form.institution.error?.message }}</Message>
                    <FloatLabel variant="on">
                        <InputText name="software" id="software" fluid />
                        <label for="software">Software</label>
                    </FloatLabel>
                    <FloatLabel variant="on">
                        <Textarea name="publications" id="publications" rows="8" fluid />
                        <label for="publications">Publications</label>
                    </FloatLabel>
                    <Message v-if="$form.publications?.invalid" severity="error" size="small" variant="simple">{{ $form.publications.error?.message }}</Message>
                </div>
                <Button type="submit" severity="secondary" label="Save" />
            </Form>
        </template>
    </Card>
    <Card>
        <template #title>Namespace Logo</template>
        <template #content>
            <FileUpload ref="fileupload" mode="basic" name="avatar" @select="onFileChange" customUpload accept="image/*" :maxFileSize="1000000" @upload="onFileChange" :auto="true"/>
        </template>
    </Card>
</template>

<script setup>
import {Form} from '@primevue/forms';
import { useToast } from 'primevue/usetoast';
import AutoComplete from "primevue/autocomplete";
import InputText from "primevue/inputtext";
import Listbox from "primevue/listbox";
import Button from "primevue/button";
import Textarea from "primevue/textarea";
import FloatLabel from "primevue/floatlabel";
import FileUpload from 'primevue/fileupload';
import Card from 'primevue/card';

import { RequestManager, HTTPTransport, Client } from "@open-rpc/client-js";

import {ref, onMounted, watch} from 'vue';
import { reactive } from 'vue';


const props = defineProps(['selectedNamespace']);

const value = ref(null);
const items = ref([]);

const filteredOrganizations = ref([]);

const toast = useToast();

const initialValues = reactive({
});

const baseUrl = import.meta.env.PUBLIC_SVC_URL;
  const transport = new HTTPTransport(baseUrl+"/rpc",
    {
      credentials: 'include',
    },
  );

const onFormSubmit = ({ valid }) => {
    if (valid) {
        toast.add({
            severity: 'success',
            summary: 'Form is submitted.',
            life: 3000
        });
        console.log($form);
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

const getOrganizations = (org) => {
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

onMounted(async () => {
    const client = new Client(new RequestManager([transport]));

    const nsNameSplit = props["selectedNamespace"].Name.split("/");
    const nsName = nsNameSplit[nsNameSplit.length - 1];

    const namespaceInfo = await client.request({
        method: "admin.GetNamespaceInfo",
        params: {
            Namespace: nsName
        }
    });
    Object.assign(initialValues, namespaceInfo);
});

// watch(() => props.selectedNamespace, async (newValue, oldValue) => {
//     const client = new Client(new RequestManager([transport]));

//     const nsNameSplit = newValue.Name.split("/");
//     const nsName = nsNameSplit[nsNameSplit.length - 1];

//     const namespaceInfo = await client.request({
//         method: "admin.GetNamespaceInfo",
//         params: {
//             Namespace: nsName
//         }
//     });
//     Object.assign(initialValues, namespaceInfo);
// });

const resolver = ({ values }) => {
    const errors = {};

    if (!values.description) {
        errors.description = [{ message: 'Description is required.' }];
    }

    if (values.description.length < 50) {
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
</script>