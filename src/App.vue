<script setup lang="ts">
import DynamicDialog from "primevue/dynamicdialog";
import ConfirmDialog from "primevue/confirmdialog";
import Header from '@/components/Header.vue'
import Footer from "@/components/Footer.vue";
import { computed } from 'vue'
import { useRoute } from 'vue-router'


const route = useRoute()
const isAuthPage  = computed(() => route.name === 'login')
const isDashboard = computed(() => ['teacher-cabinet','student-profile'].includes(route.name))
</script>
<template>
  <Header v-if="!isAuthPage && !isDashboard"/>
  <router-view/>
  <DynamicDialog/>
  <Toast/>
  <ScrollTop/>
  <ConfirmDialog/>
  <Footer v-if="!isAuthPage && !isDashboard"/>
</template>
