<script setup lang="ts">
import MainCarousel from "@/components/MainCarousel.vue";
import LessonsSection from "@/components/LessonsSection.vue";
import AudiovisualSection from "@/components/AudiovisualSection.vue";
import InteractiveTasks from "@/components/InteractiveTasks.vue";
import {onMounted, watch} from 'vue'
import { useRoute }          from 'vue-router'


const route = useRoute()

function scrollToHash(hash) {
  if (!hash) return
  const id = hash.replace('#', '')
  const el = document.getElementById(id)
  if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY - 70
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

// Бет алғаш жүктелгенде
onMounted(() => {
  if (route.hash) setTimeout(() => scrollToHash(route.hash), 400)
})

// Бір бетте hash өзгергенде (Аудио → Тапсырмалар → Аудио...)
watch(() => route.hash, (hash) => {
  if (hash) setTimeout(() => scrollToHash(hash), 50)
})
</script>

<template>
  <MainCarousel/>
  <section id="lessons">
    <LessonsSection/>
  </section>
  <section id="audio">
    <AudiovisualSection />
  </section>
  <section id="interactive">
    <InteractiveTasks />
  </section>
<!--  <CreativeTasks />-->
</template>

<style scoped>

</style>