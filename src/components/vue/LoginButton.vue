<template>
    <div v-if="user">
        <button class="btn-primary py-2 px-4 md:px-2 text-xs" @click="handleLogout">Log Out</button>
    </div>
    <div v-else>
        <button class="btn-primary py-2 px-4 md:px-2 text-xs" @click="handleLogin">Log In</button>
    </div>
</template>

<script setup lang="ts">
    import { useStore } from '@nanostores/vue';
    import { baseUrl, userStore, setUser } from '../../auth.ts';
    import { onMounted, onUnmounted } from 'vue';

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
            const data = await response.text();
            setUser({'email': data});
        } else {
            setUser(null);
        }
    };

    let intervalId: number | null = null;
    onMounted(() => {
        checkLoginStatus(); // Check immediately on mount
        intervalId = setInterval(checkLoginStatus, 60 * 1000); // Check every 60 seconds
    });

    // Clean up interval on unmount
    onUnmounted(() => {
        if (intervalId !== null) {
            clearInterval(intervalId);
        }
    });
</script>
