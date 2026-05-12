<template>
  <header class="app-header" :class="{ scrolled: isScrolled, 'nav-open': mobileOpen }">

    <div class="header-inner">

      <!-- ── LOGO ─────────────────────────────────── -->
      <router-link to="/" class="logo">
        <svg viewBox="0 0 36 36" fill="none" class="logo-icon" aria-hidden="true">
          <polygon points="18,2 34,10 34,26 18,34 2,26 2,10"
                   stroke="#c4922a" stroke-width="1.4" fill="none"/>
          <path d="M12 13 L12 23 M12 18 L18 15 M18 15 L24 18 M24 13 L24 23"
                stroke="#c4922a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div class="logo-text">
          <span class="logo-main">Аудиовизуалды Әдебиет</span>
          <span class="logo-sub">8-сынып · Қазақ әдебиеті</span>
        </div>
      </router-link>

      <!-- ── NAV (desktop) ─────────────────────────── -->
      <nav class="nav-links" aria-label="Басты мәзір">
        <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="nav-link"
            :class="{ active: isActive(item) }"
        >
          <i :class="'pi ' + item.icon"/>
          {{ item.label }}
        </router-link>
      </nav>

      <!-- ── RIGHT ACTIONS ─────────────────────────── -->
      <div class="header-actions">

        <!-- Auth buttons -->
        <template v-if="isLoggedIn">
          <router-link
              :to="isTeacher ? '/teacher' : '/profile'"
              class="action-btn profile-btn"
          >
            <div class="profile-ava">{{ currentUser?.name?.[0] || '?' }}</div>
            <span class="profile-name">{{ firstName }}</span>
          </router-link>
          <button class="icon-action" @click="doLogout" title="Шығу">
            <i class="pi pi-sign-out"/>
          </button>
        </template>

        <template v-else>
          <router-link to="/login" class="login-btn">
            <i class="pi pi-sign-in"/>
            <span>Кіру</span>
          </router-link>
        </template>

        <!-- Mobile toggle -->
        <button class="burger" @click="mobileOpen = !mobileOpen" aria-label="Мәзір">
          <span/><span/><span/>
        </button>
      </div>
    </div>

    <!-- ── MOBILE MENU ───────────────────────────── -->
    <transition name="mobile-drop">
      <div v-if="mobileOpen" class="mobile-menu">
        <router-link
            v-for="item in navItems"
            :key="'m-'+item.path"
            :to="item.path"
            class="mobile-link"
            @click="mobileOpen = false"
        >
          <i :class="'pi ' + item.icon"/>
          {{ item.label }}
        </router-link>
        <div class="mobile-sep"/>
        <template v-if="isLoggedIn">
          <router-link
              :to="isTeacher ? '/teacher' : '/profile'"
              class="mobile-link"
              @click="mobileOpen = false"
          >
            <i class="pi pi-user"/> {{ currentUser?.name }}
          </router-link>
          <button class="mobile-link mobile-logout" @click="doLogout">
            <i class="pi pi-sign-out"/> Шығу
          </button>
        </template>
        <template v-else>
          <router-link to="/login" class="mobile-link" @click="mobileOpen = false">
            <i class="pi pi-sign-in"/> Кіру
          </router-link>
        </template>
      </div>
    </transition>

    <!-- overlay -->
    <div v-if="mobileOpen" class="mobile-overlay" @click="mobileOpen = false"/>

  </header>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const route  = useRoute()
const router = useRouter()
const { currentUser, isLoggedIn, isTeacher, logout } = useAuth()

const isScrolled  = ref(false)
const mobileOpen  = ref(false)

const navItems = [
  { label: 'Басты',      path: '/',            icon: 'pi-home'         },
  { label: 'Сабақтар',   path: '/lessons',     icon: 'pi-book'         },
  { label: 'Аудио',      path: '/audio',       icon: 'pi-headphones'   },
  { label: 'Тапсырмалар',path: '/interactive', icon: 'pi-list-check'   },
]

const firstName = computed(() => currentUser.value?.name?.split(' ')[0] || '')

function isActive(item) {
  if (item.path === '/') return route.path === '/'
  return route.path.startsWith(item.path)
}

function doLogout() {
  logout()
  mobileOpen.value = false
  router.push({ name: 'login' })
}

function onScroll() { isScrolled.value = window.scrollY > 40 }
onMounted(()    => window.addEventListener('scroll', onScroll, { passive: true }))
onBeforeUnmount(()=> window.removeEventListener('scroll', onScroll))
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:wght@400;600&display=swap');

/* ── Tokens ── */
.app-header {
  --ink:    #1a1208;
  --gold:   #c4922a;
  --gold-l: #e8b94f;
  --border: #d9cdb8;
  --dark:   #130e07;
  --parch:  #faf6ef;

  position: sticky; top: 0; z-index: 200;
  background: var(--parch);
  border-bottom: 2px solid var(--gold);
  font-family: 'Source Serif 4', Georgia, serif;
  transition: box-shadow .3s;
}
.app-header.scrolled {
  box-shadow: 0 4px 24px rgba(26,18,8,.12);
}

/* ── Inner ── */
.header-inner {
  max-width: 1280px; margin: 0 auto;
  padding: 0 1.5rem;
  height: 58px;
  display: flex; align-items: center; gap: 1.5rem;
}

/* ── Logo ── */
.logo {
  display: flex; align-items: center; gap: .7rem;
  text-decoration: none; flex-shrink: 0;
}
.logo-icon { width: 34px; height: 34px; flex-shrink: 0; }
.logo-text  { display: flex; flex-direction: column; line-height: 1.2; }
.logo-main  {
  font-family: 'Playfair Display', serif;
  font-size: .95rem; font-weight: 900; color: var(--ink);
  white-space: nowrap;
}
.logo-sub   {
  font-size: .6rem; font-weight: 600;
  letter-spacing: .1em; text-transform: uppercase;
  color: var(--gold);
}

/* ── Nav ── */
.nav-links {
  display: flex; align-items: center; gap: .15rem;
  flex: 1;
}
.nav-link {
  display: flex; align-items: center; gap: .35rem;
  padding: .42rem .8rem;
  border-radius: 2px;
  font-size: .8rem; font-weight: 600;
  color: #7a6a52; text-decoration: none;
  transition: color .2s, background .2s;
  white-space: nowrap;
}
.nav-link i { font-size: .75rem; }
.nav-link:hover  { color: var(--gold); background: rgba(196,146,42,.07); }
.nav-link.active { color: var(--gold); background: rgba(196,146,42,.1); }

/* ── Actions ── */
.header-actions {
  display: flex; align-items: center; gap: .5rem;
  flex-shrink: 0; margin-left: auto;
}

/* Profile */
.profile-btn {
  display: flex; align-items: center; gap: .5rem;
  border: 1.5px solid var(--border); border-radius: 2px;
  background: transparent; text-decoration: none;
  padding: .32rem .7rem; transition: border-color .2s;
}
.profile-btn:hover { border-color: var(--gold); }
.profile-ava {
  width: 26px; height: 26px; border-radius: 50%;
  background: var(--gold); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: .72rem; font-weight: 700; flex-shrink: 0;
}
.profile-name {
  font-size: .78rem; font-weight: 600; color: var(--ink);
  max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.icon-action {
  width: 34px; height: 34px;
  border: 1.5px solid var(--border); border-radius: 2px;
  background: transparent; color: #7a6a52;
  display: flex; align-items: center; justify-content: center;
  font-size: .82rem; cursor: pointer; transition: all .2s;
}
.icon-action:hover { border-color: #8b3a1e; color: #8b3a1e; }

/* Login btn */
.login-btn {
  display: inline-flex; align-items: center; gap: .4rem;
  background: var(--gold); color: #fff; text-decoration: none;
  padding: .42rem 1rem; border-radius: 2px;
  font-family: 'Source Serif 4', serif; font-size: .8rem; font-weight: 700;
  transition: background .2s;
}
.login-btn:hover { background: var(--gold-l); }
.login-btn i { font-size: .78rem; }

/* Burger */
.burger {
  display: none; flex-direction: column; gap: 5px;
  background: none; border: none; cursor: pointer; padding: .3rem;
}
.burger span {
  display: block; width: 22px; height: 2px;
  background: var(--ink); border-radius: 1px; transition: all .3s;
}
.nav-open .burger span:nth-child(1) { transform: rotate(45deg) translate(5px,5px); }
.nav-open .burger span:nth-child(2) { opacity: 0; }
.nav-open .burger span:nth-child(3) { transform: rotate(-45deg) translate(5px,-5px); }

/* ── Mobile menu ── */
.mobile-menu {
  position: absolute; top: 100%; left: 0; right: 0;
  background: var(--parch);
  border-bottom: 2px solid var(--gold);
  box-shadow: 0 8px 32px rgba(26,18,8,.15);
  display: flex; flex-direction: column; padding: .5rem 0;
  z-index: 100;
}
.mobile-link {
  display: flex; align-items: center; gap: .6rem;
  padding: .72rem 1.5rem;
  font-size: .88rem; font-weight: 600; color: #7a6a52;
  text-decoration: none; background: none; border: none;
  cursor: pointer; font-family: 'Source Serif 4', serif;
  text-align: left; transition: color .15s, background .15s;
}
.mobile-link i { font-size: .82rem; color: var(--gold); }
.mobile-link:hover { color: var(--gold); background: rgba(196,146,42,.06); }
.mobile-logout:hover { color: #8b3a1e !important; }
.mobile-sep { height: 1px; background: var(--border); margin: .35rem 1.5rem; }

.mobile-drop-enter-active, .mobile-drop-leave-active { transition: opacity .22s, transform .22s; }
.mobile-drop-enter-from,   .mobile-drop-leave-to     { opacity: 0; transform: translateY(-8px); }

.mobile-overlay {
  position: fixed; inset: 0; z-index: 50;
  background: rgba(26,18,8,.3); backdrop-filter: blur(2px);
}

/* ── Responsive ── */
@media (max-width: 860px) {
  .nav-links { display: none; }
  .burger    { display: flex; }
  .profile-name { display: none; }
}
@media (max-width: 480px) {
  .logo-sub  { display: none; }
  .logo-main { font-size: .85rem; }
}
</style>