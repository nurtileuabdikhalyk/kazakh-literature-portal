<script setup>
import img1 from '@/assets/images/mukhtar.png'
import img2 from '@/assets/images/abay.png'
import img3 from '@/assets/images/berdibek.jpg'
import {ref, onMounted} from "vue";
import Carousel from 'primevue/carousel';
import Card from 'primevue/card';



const products = ref([
  {
    id: 1,
    title: "Абай жолы",
    author: "Мұхтар Әуезов",
    image: img1,
    category: "Роман"
  },
  {
    id: 2,
    title: "Қара сөздер",
    author: "Абай Құнанбайұлы",
    image: img2,
    category: "Философия"
  },
  {
    id: 3,
    title: "Менің атым Қожа",
    author: "Бердібек Соқпақбаев",
    image: img3,
    category: "Балалар әдебиеті"
  }
]);

</script>
<template>
  <div class="flex justify-center">
    <Carousel
        :value="products"
        :numVisible="1"
        :numScroll="1"
        orientation="horizontal"
        circular
        :autoplayInterval="3000"
        class="w-full mx-auto"
    >
      <template #item="slotProps">
        <Card style="width: 100%; overflow: hidden">

          <template #content>
            <div
                class="relative w-full max-w-3xl mx-auto border-2 border-gray-300 rounded-xl overflow-hidden shadow-md">
              <img :src="slotProps.data.image"
                   class="w-full h-[600px] object-cover"
              />
              <!-- Overlay -->
              <div class="absolute inset-0 bg-black/50"></div>

              <!-- Text content -->
              <div class="absolute bottom-10 left-10 right-10 text-white">

                <p class="text-sm opacity-80 mb-2">
                  {{ slotProps.data.category }}
                </p>

                <h1 class="text-2xl md:text-4xl font-bold leading-tight max-w-3xl">
                  {{ slotProps.data.title }}
                </h1>

              </div>

            </div>
          </template>
          <template #footer>
            <div class="flex gap-4 mt-1">
              <Button label="Cancel" severity="secondary" variant="outlined" class="w-full" />
              <Button label="Save" class="w-full" />
            </div>
          </template>
        </Card>
<!--        <div-->
<!--            class="relative w-full max-w-3xl mx-auto border-2 border-gray-300 rounded-xl overflow-hidden shadow-md">-->
<!--          <img :src="slotProps.data.image"-->
<!--               class="w-full h-[600px] object-cover"-->
<!--          />-->
<!--          &lt;!&ndash; Overlay &ndash;&gt;-->
<!--          <div class="absolute inset-0 bg-black/50"></div>-->

<!--          &lt;!&ndash; Text content &ndash;&gt;-->
<!--          <div class="absolute bottom-10 left-10 right-10 text-white">-->

<!--            <p class="text-sm opacity-80 mb-2">-->
<!--              {{ slotProps.data.category }}-->
<!--            </p>-->

<!--            <h1 class="text-2xl md:text-4xl font-bold leading-tight max-w-3xl">-->
<!--              {{ slotProps.data.title }}-->
<!--            </h1>-->

<!--          </div>-->

<!--        </div>-->
      </template>

    </Carousel>
  </div>
</template>
