import {createRouter, createWebHistory} from "vue-router";

import {useAuth} from "../composables/useAuth"

const routes = [
    {
        path: "/",
        name: "Main",
        component: () =>
            import( "@/pages/Main.vue"),
    },
    {
        path: '/login',
        name: 'login',
        component: () =>
            import( "@/pages/LoginPage.vue"),
        meta: {guestOnly: true},  // Кірген адам /login-ге баса алмайды
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
    {
        path: '/teacher/add-lesson',
        name: 'add-lesson', component: () =>
            import( "@/pages/AddLessonForm.vue"),
        meta: {requiresAuth: true, role: 'мұғалім'}
    },
    {
        path: '/teacher',
        name: 'teacher-cabinet',
        component: () =>
            import( "@/pages/TeacherCabinet.vue"),
        meta: {requiresAuth: true, role: 'мұғалім'},
    },
    {
        path: '/teacher/add-task',
        name: 'add-task',
        component: () =>
            import( "@/pages/AddTaskForm.vue"),
        meta: {requiresAuth: true, role: 'мұғалім'},
    },
    // {
    //     path: '/interactive',
    //     name: 'interactive',
    //     component: () =>
    //         import( "@/pages/InteractiveTasks.vue"),
    //
    // },


    // ── Student only ────────────────────────────────────
    {
        path: '/profile',
        name: 'student-profile',
        component: () =>
            import( "@/pages/StudentProfile.vue"),
        meta: {requiresAuth: true, role: 'оқушы'},
    },

    // ── Catch all ───────────────────────────────────────
    {
        path: '/:pathMatch(.*)*',
        redirect: '/',
    },
]


const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior() {
        return {top: 0}
    },
})

// ── Navigation Guard ────────────────────────────────
router.beforeEach((to) => {
    const {currentUser, isTeacher, isStudent} = useAuth()
    const user = currentUser.value

    // Кірген адам /login-ге бармасын
    if (to.meta.guestOnly && user) {
        return isTeacher.value
            ? {name: 'teacher-cabinet'}
            : {name: 'student-profile'}
    }

    // Auth қажет беттер
    if (to.meta.requiresAuth) {
        if (!user) return {name: 'login', query: {redirect: to.fullPath}}

        // Рөл тексеру
        if (to.meta.role === 'мұғалім' && !isTeacher.value) {
            return {name: 'student-profile'}
        }
        if (to.meta.role === 'оқушы' && !isStudent.value) {
            return {name: 'teacher-cabinet'}
        }
    }
})

export default router


