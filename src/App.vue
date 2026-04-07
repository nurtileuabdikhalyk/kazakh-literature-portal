<script setup lang="ts">
import DynamicDialog from "primevue/dynamicdialog";
import ConfirmDialog from "primevue/confirmdialog";
</script>
<template>
  <router-view/>
  <DynamicDialog/>
  <Toast/>
  <ScrollTop/>
  <ConfirmDialog/>
</template>
