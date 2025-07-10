<template>
    <div class="container-fluid" style="margin-top: 10px; height: 80vh">
        <ag-grid-vue
            style="width: 100%; height: 100%;"
            animateRows="true"
            :columnDefs="columnDefs"
            :defaultColDef="defaultColDef"
            :rowData="nodes"
            :rowClassRules="rowClassRules"
            :gridOptions="gridOptions"
            :data-ag-theme-mode="darkMode"
            @grid-ready="onGridReady"
        >
        </ag-grid-vue>
    </div>
</template>

<script setup>
    import { ref, shallowRef, onMounted, watch, onUnmounted } from 'vue';
    import { Client, RequestManager, HTTPTransport } from '@open-rpc/client-js';
    const props = defineProps(['baseUrl']);


    const darkMode = ref("light");
    const darkObserver = new MutationObserver(updateDarkMode);

    function updateDarkMode() {
        console.log("darkMode: ", darkMode.value);
        darkMode.value = document.documentElement.classList.contains('dark')? "dark" : "light";
    }

    let client = new Client(new RequestManager([new HTTPTransport(props.baseUrl+"/rpc")]));

    import {
        AllCommunityModule,
        ModuleRegistry,
    } from "ag-grid-community";
    ModuleRegistry.registerModules([AllCommunityModule]);

    import {AgGridVue} from "ag-grid-vue3";
    import prettyBytes from 'pretty-bytes';

    const nodes = ref([]);
    const gridOptions = ref({
        getRowId: params => params.data.Name,
    });
    const gridApi = shallowRef(null);
    let timer = '';
    const rowClassRules = {
        'rag-red': 'data.IsUnschedulable',
    };
    const defaultColDef = {sortable: true, filter: true, enableCellChangeFlash:true, floatingFilter: true, resizable: true, autoHeaderHeight: true, wrapHeaderText: true};
    const columnDefs = [
        { headerName: "Name", field: "Name", flex: 4, minWidth: 200, cellRenderer: params =>
            {
                if(params.data.NetboxID != "") {
                    return `<a href="https://netbox-4.nrp-nautilus.io/dcim/devices/${params.data.NetboxID}" target="_blank">${params.data.Name}</a>`;
                }
                return params.data.Name;
            },
            floatingFilter: true },
        { headerName: "Taints", minWidth: 130, flex: 2, valueGetter: params => 
            {
                if(params.data.Taints != null) {
                    return params.data.Taints.filter((taint) => taint.effect != "PreferNoSchedule").map((taint) => `${taint.key}=${taint.value}`).join(" ");
                }
                return "";
            },
            floatingFilter: true 
        },
        { headerName: "GPUType", minWidth: 110, field: "GPUType", flex: 2},
        { headerName: "CPU Free", field: "CPUAvailableFloat", filter: 'agNumberColumnFilter', type: 'numericColumn', minWidth: 80, maxWidth: 130, comparator: (valueA, valueB) => valueA - valueB},
        { headerName: "GPU Free", field: "GPUAvailable", filter: 'agNumberColumnFilter', type: 'numericColumn', minWidth: 80, maxWidth: 130, comparator: (valueA, valueB) => valueA - valueB},
        { headerName: "FPGA Free", field: "FPGAAvailable", filter: 'agNumberColumnFilter', type: 'numericColumn', minWidth: 80, maxWidth: 130, comparator: (valueA, valueB) => valueA - valueB},
        { headerName: "Mem Free", field: "MemoryAvailable", filter: 'agNumberColumnFilter', type: 'numericColumn', valueFormatter: params => {return prettyBytes(params.value, 1)}, minWidth: 100, maxWidth: 150, comparator: (valueA, valueB) => valueA - valueB},
        { headerName: "Disk Free", field: "EphemeralAvailable", filter: 'agNumberColumnFilter', type: 'numericColumn', valueFormatter: params => {return prettyBytes(params.value, 1)}, minWidth: 100, maxWidth: 150, comparator: (valueA, valueB) => valueA - valueB},
        { headerName: "CPU Total", field: "CPUCapacity", filter: 'agNumberColumnFilter', type: 'numericColumn', minWidth: 80, maxWidth: 130, comparator: (valueA, valueB) => valueA - valueB},
        { headerName: "GPU Total", field: "GPUCapacity", filter: 'agNumberColumnFilter', type: 'numericColumn', minWidth: 80, maxWidth: 130, comparator: (valueA, valueB) => valueA - valueB},
        { headerName: "Mem Total", field: "MemoryCapacity", filter: 'agNumberColumnFilter', type: 'numericColumn', valueFormatter: params => {return prettyBytes(params.value,1 )}, minWidth: 100, maxWidth: 150, comparator: (valueA, valueB) => valueA - valueB},
        { headerName: "Disk Total", field: "EphemeralCapacity", filter: 'agNumberColumnFilter', type: 'numericColumn', valueFormatter: params => {return prettyBytes(params.value,1 )}, minWidth: 100, maxWidth: 150, comparator: (valueA, valueB) => valueA - valueB},
        { headerName: "FPGA Total", field: "FPGACapacity", filter: 'agNumberColumnFilter', type: 'numericColumn', minWidth: 80, maxWidth: 130, comparator: (valueA, valueB) => valueA - valueB},
        { headerName: "GPU Memory", field: "GPUMem", filter: 'agNumberColumnFilter', type: 'numericColumn', valueFormatter: params => {
            if (params.value == "") {
                return "";
            } else {
                return prettyBytes(params.value,1 )
            }
        }, minWidth: 100, maxWidth: 150, comparator: (valueA, valueB) => valueA - valueB},
        { headerName: "FPGAType", field: "FPGAType", width: 120},
        { headerName: "Network", field: "Network", type: 'numericColumn', filter: 'agNumberColumnFilter', valueFormatter: params => {
            return (params.value/1000)+"G";
        }, width: 90, comparator: (valueA, valueB) => valueA - valueB},
        { headerName: "Region", field: "Region", flex: 1, minWidth: 100, floatingFilter: true},
        { headerName: "Zone", field: "Zone", flex: 1, minWidth: 100, floatingFilter: true },
        { headerName: "CPU Type", field: "CPUType", width: 90},
        { headerName: "Huge Pages 1G Free", field: "Huge1GAvailable", minWidth: 80, maxWidth: 130},
        { headerName: "Huge Pages 2M Free", field: "Huge2MAvailable", minWidth: 80, maxWidth: 130},
        { headerName: "Huge Pages 1G Total", field: "Huge1GCapacity", minWidth: 80, maxWidth: 130},
        { headerName: "Huge Pages 2M Total", field: "Huge2MCapacity", minWidth: 80, maxWidth: 130},
        { headerName: "IPV6", field: "IsIPV6", minWidth: 80, cellDataType: 'boolean', maxWidth: 130},
        { headerName: "GPU driver", field: "GPUDriver", minWidth: 80, maxWidth: 130},
        { headerName: "CUDA", field: "CUDA", minWidth: 80, maxWidth: 130},
        { headerName: "Owner", field: "OwnerName", minWidth: 50},
    ];

    onMounted(() => {
        getNodes();
        timer = setInterval(getNodes, 15000);

        updateDarkMode();
        darkObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    });

    const onGridReady = (params) => {
      gridApi.value = params.api;
    };

    onUnmounted(() => {
        darkObserver.disconnect();
        clearInterval(timer);
    });
    const getNodes = async () => {
        try {
            const response = await client.request({
                method: 'guest.ListNodeInfo',
                params: {},
            });
            var respNodes = response.Nodes;

            var nodesMap = {};

            for (var ii=0; ii<respNodes.length; ii++) {
                nodesMap[respNodes[ii].Name] = respNodes[ii];
            }

            for(var i=0; i<nodes.value.length; i++) {
                if (nodesMap.hasOwnProperty(nodes.value[i].Name)) {
                    var incomingObj = nodesMap[nodes.value[i].Name];
                    for (var k = 0; k < Object.keys(incomingObj).length; k++) {
                        if (nodes.value[i][Object.keys(incomingObj)[k]] != incomingObj[Object.keys(incomingObj)[k]]) {
                            nodes.value[i][Object.keys(incomingObj)[k]] = incomingObj[Object.keys(incomingObj)[k]];
                        }
                    }
                    delete nodesMap[nodes.value[i].Name];
                } else {
                    nodes.value.splice(i,1);
                }
            }

            for (var iii = 0; iii < Object.values(nodesMap).length; iii++) {
                nodes.value.push(Object.values(nodesMap)[iii]);
            }

            if(gridApi.value) {
                gridApi.value.refreshCells();
            }
        } catch (error) {
            console.error('Error fetching nodes data:', error);
        }

    };
</script>

<style>
.rag-red {
    background-color: lightcoral;
}
.rag-orange {
    background-color: orange;
}
</style>
