<script setup lang="ts">
import DynamicDialog from "primevue/dynamicdialog";
import ConfirmDialog from "primevue/confirmdialog";
import Header from '@/components/Header.vue'
</script>
<template>
  <Header />
  <router-view/>
  <DynamicDialog/>
  <Toast/>
  <ScrollTop/>
  <ConfirmDialog/>
</template>
