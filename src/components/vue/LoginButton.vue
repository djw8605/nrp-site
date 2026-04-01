<template>
    <Toast />
    <div v-if="user" class="flex items-center justify-center h-full w-full">
        <div class="flex items-center justify-center w-full h-full">
            <Avatar id="user-avatar" :image="user.pic" aria-label="User profile avatar" class="flex items-center justify-center cursor-pointer" size="normal" @click="toggle"/>
        </div>
        <Popover ref="op">
            <div class="flex flex-col gap-4 w-[15rem]">
                <div>
                    {{ user.email }}<br/>
                    {{ user.idp }}
                </div>
                <button class="btn-primary py-2 px-4 md:px-2 text-xs" @click="handleLogout">Log Out</button>
            </div>
        </Popover>
    </div>
    <div v-else class="flex items-center justify-center h-full w-full">
        <button class="btn-primary py-2 px-4 md:px-2 text-xs" @click="handleLogin">Log In</button>
    </div>
</template>

<script setup lang="ts">
    import { useStore } from '@nanostores/vue';
    import { baseUrl, userStore, setUser } from '../../auth.ts';
    import { onMounted, onUnmounted, ref } from 'vue';

    import CryptoJS from 'crypto-js';

    import Toast from "primevue/toast";
    import Popover from "primevue/popover";
    import Avatar from "primevue/avatar";

    import {Hovercards} from '@gravatar-com/hovercards';
    import '@gravatar-com/hovercards/dist/style.css';

    const user = useStore(userStore);

    const handleLogin = () => {
        window.location.href = baseUrl+"/auth";
    };
    const handleLogout = () => {
        window.location.href = baseUrl+"/logout";
    };

    const checkLoginStatus = async () => {
        const response = await fetch(baseUrl+"/ping", {
            method: 'GET',
            credentials: 'include'
        });
        if (response.ok) {
            const data = await response.json();
            const gravatarUrl = "https://www.gravatar.com/avatar/"+CryptoJS.SHA256( data.Email.trim().toLowerCase() )+"?d=robohash&s=65";

            setUser({'email': data.Email, 'idp': data.IDP, 'pic': gravatarUrl});
        } else {
            setUser(null);
        }
    };

    const op = ref(false);

    let intervalId: number | null = null;
    onMounted(() => {
        checkLoginStatus(); // Check immediately on mount
        intervalId = setInterval(checkLoginStatus, 60 * 1000); // Check every 60 seconds
        hovercards.attach( document.getElementById( 'user-avatar' ) );
    });

    const hovercards = new Hovercards( { additionalClass: '-z-100' } );

    // Clean up interval on unmount
    onUnmounted(() => {
        if (intervalId !== null) {
            clearInterval(intervalId);
        }
    });

    const members = ref([
        { name: 'Amy Elsner', image: 'amyelsner.png', email: 'amy@email.com', role: 'Owner' },
        { name: 'Bernardo Dominic', image: 'bernardodominic.png', email: 'bernardo@email.com', role: 'Editor' },
        { name: 'Ioni Bowcher', image: 'ionibowcher.png', email: 'ioni@email.com', role: 'Viewer' }
    ]);

    const toggle = (event) => {
        op.value.toggle(event);
    }

</script>
