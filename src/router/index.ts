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
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
