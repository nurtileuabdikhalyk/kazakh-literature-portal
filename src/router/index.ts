import {createRouter, createWebHistory} from "vue-router";

const routes = [
  {
    path: "/",
    name: "Main",
    component: () =>
      import( "@/pages/Main.vue"),
  },
  {
    path: '/books/:id/read',
    name: 'book-reader',
    component: () =>
        import( "@/pages/BookReader.vue"),
    meta: { hideHeader: true, hideFooter: true },
  },
  {
    path: '/lessons/:type/:id',
    name: 'lesson-detail',
    component: () =>
        import( "@/pages/LessonDetail.vue"),
  },
  {
    path: '/lessons',
    name: 'lessons-list',
    component: () =>
        import( "@/pages/LessonsList.vue"),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
