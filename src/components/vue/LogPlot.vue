<template>
    <div class="card flex justify-content-center">
        <Dropdown v-model="selectedMode" :options="modes" optionLabel="name" placeholder="Select the mode" class="w-full md:w-14rem" />
    </div>

    <LogPlotDefault v-if="selectedMode.code === 'default'" :period="period" />
    <LogPlotAllLabels v-if="selectedMode.code === 'all_labels'" :period="period" />
    <LogPlotByOrg v-if="selectedMode.code === 'by_org'" :period="period" />
</template>

<script setup>
import { ref } from "vue";

import Dropdown from "primevue/dropdown";

import LogPlotDefault from "./LogPlotDefault.vue";
import LogPlotAllLabels from "./LogPlotAllLabels.vue";
import LogPlotByOrg from "./LogPlotByOrg.vue";

const period= "1y";

const selectedMode = ref("default");
const modes = ref([
    { name: 'Regular', code: 'default'},
    { name: 'All labels', code: 'all_labels'},
    { name: 'By organization', code: 'by_org'},
]);
</script>
