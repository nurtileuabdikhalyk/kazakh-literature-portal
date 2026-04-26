
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

// ─── Scroll ────────────────────────────────────────────
const isScrolled = ref(false)
function onScroll() { isScrolled.value = window.scrollY > 60 }
onMounted(() => window.addEventListener('scroll', onScroll))
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))

// ─── State ────────────────────────────────────────────
const mobileOpen    = ref(false)
const searchOpen    = ref(false)
const searchQuery   = ref('')
const activeDropdown = ref(null)
const profileOpen   = ref(false)
const activeLang    = ref('ҚАЗ')
const searchInput   = ref(null)
const langs         = ['ҚАЗ', 'РУС', 'ENG']

function toggleSearch() {
  searchOpen.value = !searchOpen.value
  if (searchOpen.value) setTimeout(() => searchInput.value?.focus(), 100)
}
function closeSearch() {
  if (!searchQuery.value) searchOpen.value = false
}
function doSearch() { console.log('Search:', searchQuery.value) }

// ─── Date ─────────────────────────────────────────────
const currentDate = new Date().toLocaleDateString('kk-KZ', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
})

// ─── Nav data ─────────────────────────────────────────
const navItems = ref([
  { label: 'Басты бет', href: '/', active: true },
  {
    label: 'Классика',
    href: '#',
    children: [
      {
        heading: 'Ақындар',
        links: [
          { label: 'Абай Құнанбайұлы', href: '#' },
          { label: 'Мұқағали Мақатаев', href: '#' },
          { label: 'Фариза Оңғарсынова', href: '#' },
          { label: 'Қадыр Мырза Әли', href: '#' },
        ],
      },
      {
        heading: 'Жазушылар',
        links: [
          { label: 'Мұхтар Әуезов', href: '#' },
          { label: 'Ілияс Есенберлин', href: '#' },
          { label: 'Дулат Исабеков', href: '#' },
          { label: 'Сәбит Мұқанов', href: '#' },
        ],
      },
    ],
    featured: {
      tag: 'Таңдаулы',
      title: 'Абайдың қара сөздері — даналықтың қазынасы',
      image: 'https://images.unsplash.com/photo-1476820865390-c52aeebb9891?w=400&q=75',
    },
  },
  {
    label: 'Заманауи',
    href: '#',
    children: [
      {
        heading: 'Проза',
        links: [
          { label: 'Романдар', href: '#' },
          { label: 'Әңгімелер', href: '#' },
          { label: 'Повестер', href: '#' },
        ],
      },
      {
        heading: 'Поэзия',
        links: [
          { label: 'Жыр жинақтары', href: '#' },
          { label: 'Жас ақындар', href: '#' },
          { label: 'Аудармалар', href: '#' },
        ],
      },
    ],
    featured: null,
  },
  { label: 'Жаңалықтар', href: '#' },
  { label: 'Іс-шаралар', href: '#' },
  { label: 'Кітапхана', href: '#' },
  { label: 'Біз туралы', href: '#' },
])

// ─── v-click-outside directive ─────────────────────────
const vClickOutside = {
  mounted(el, binding) {
    el._handler = (e) => { if (!el.contains(e.target)) binding.value(e) }
    document.addEventListener('click', el._handler)
  },
  unmounted(el) { document.removeEventListener('click', el._handler) },
}
</script>

<template>
  <header class="site-header" :class="{ scrolled: isScrolled, 'menu-open': mobileOpen }">

    <!-- ── Top Bar ─────────────────────────────────────── -->
    <div class="top-bar">
      <div class="top-bar-inner">
        <div class="top-bar-left">
          <span class="top-date">
            <i class="pi pi-calendar" />
            {{ currentDate }}
          </span>
          <span class="top-sep">·</span>
          <span class="top-quote">« Оқыған озады, тоқыған тозады »</span>
        </div>

      </div>
    </div>

    <!-- ── Brand Bar ───────────────────────────────────── -->
    <div class="brand-bar">
      <div class="brand-bar-inner">

        <!-- Logo -->
        <router-link to="/" class="logo-wrap">
          <div class="logo-emblem" aria-hidden="true">
            <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- Outer hexagon -->
              <polygon points="28,3 52,16 52,40 28,53 4,40 4,16"
                       stroke="#c4922a" stroke-width="1.4" fill="none"/>
              <!-- Inner ring -->
              <circle cx="28" cy="28" r="13" stroke="#c4922a" stroke-width="1" fill="none" opacity=".5"/>
              <!-- Stylised Kh letter / open book shape -->
              <path d="M18 20 L18 36 M18 28 L28 22 M28 22 L38 28 M38 20 L38 36"
                    stroke="#c4922a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <!-- Diamond centre -->
              <rect x="26" y="26" width="4" height="4" transform="rotate(45 28 28)"
                    fill="#c4922a"/>
            </svg>
          </div>
          <div class="logo-text">
            <span class="logo-kz">Қазақ Әдебиет</span>
            <span class="logo-ru">Портал</span>
          </div>
        </router-link>

        <!-- Search (desktop) -->
        <div class="search-wrap" :class="{ expanded: searchOpen }">
          <div class="search-box">
            <i class="pi pi-search search-icon" />
            <input
                ref="searchInput"
                v-model="searchQuery"
                type="text"
                placeholder="Ақын, шығарма, тақырып іздеу…"
                class="search-input"
                @keyup.enter="doSearch"
                @blur="closeSearch"
            />
            <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''">
              <i class="pi pi-times" />
            </button>
          </div>
        </div>

        <!-- Right icons -->
        <div class="brand-actions">
          <button class="icon-btn search-toggle" @click="toggleSearch" aria-label="Іздеу">
            <i class="pi pi-search" />
          </button>
          <button class="icon-btn" aria-label="Хабарландырулар">
            <i class="pi pi-bell" />
            <span class="badge-dot" />
          </button>
          <button class="icon-btn avatar-btn" aria-label="Профиль" @click="profileOpen = !profileOpen">
            <span class="avatar-initials">АБ</span>
          </button>
          <!-- Profile dropdown -->
          <div v-if="profileOpen" class="profile-drop" v-click-outside="() => profileOpen = false">
            <div class="profile-header">
              <span class="profile-name">Асем Бекова</span>
              <span class="profile-role">Оқырман</span>
            </div>
            <a href="#" class="drop-item"><i class="pi pi-user" /> Профиль</a>
            <a href="#" class="drop-item"><i class="pi pi-bookmark" /> Сақталғандар</a>
            <a href="#" class="drop-item"><i class="pi pi-cog" /> Баптаулар</a>
            <div class="drop-sep" />
            <a href="#" class="drop-item drop-exit"><i class="pi pi-sign-out" /> Шығу</a>
          </div>
        </div>

        <!-- Hamburger -->
        <button class="hamburger" @click="mobileOpen = !mobileOpen" aria-label="Мәзір">
          <span /><span /><span />
        </button>
      </div>
    </div>

    <!-- ── Nav Bar ─────────────────────────────────────── -->
    <nav class="nav-bar" role="navigation" aria-label="Басты мәзір">
      <div class="nav-inner">
        <ul class="nav-list">
          <li
              v-for="item in navItems"
              :key="item.label"
              class="nav-item"
              :class="{ 'has-drop': item.children }"
              @mouseenter="item.children && (activeDropdown = item.label)"
              @mouseleave="activeDropdown = null"
          >
            <a :href="item.href" class="nav-link" :class="{ active: item.active }">
              {{ item.label }}
              <i v-if="item.children" class="pi pi-angle-down nav-caret" />
            </a>

            <!-- Mega dropdown -->
            <div
                v-if="item.children"
                class="mega-drop"
                :class="{ visible: activeDropdown === item.label }"
            >
              <div class="mega-inner">
                <div
                    v-for="col in item.children"
                    :key="col.heading"
                    class="mega-col"
                >
                  <h4 class="mega-heading">{{ col.heading }}</h4>
                  <ul class="mega-links">
                    <li v-for="link in col.links" :key="link.label">
                      <a :href="link.href" class="mega-link">
                        <span class="mega-dot">◆</span>
                        {{ link.label }}
                      </a>
                    </li>
                  </ul>
                </div>
                <!-- Featured panel -->
                <div v-if="item.featured" class="mega-featured">
                  <img :src="item.featured.image" :alt="item.featured.title" class="mf-img" />
                  <div class="mf-body">
                    <span class="mf-tag">{{ item.featured.tag }}</span>
                    <p class="mf-title">{{ item.featured.title }}</p>
                    <a href="#" class="mf-link">Оқу <i class="pi pi-arrow-right" /></a>
                  </div>
                </div>
              </div>
            </div>
          </li>
        </ul>

        <!-- Right of nav -->
        <div class="nav-right">
          <a href="#" class="nav-subscribe-btn">
            <i class="pi pi-send" />
            Жазылу
          </a>
        </div>
      </div>
    </nav>

    <!-- ── Mobile Drawer ───────────────────────────────── -->
    <transition name="drawer">
      <div v-if="mobileOpen" class="mobile-drawer">
        <div class="mobile-search">
          <i class="pi pi-search" />
          <input type="text" placeholder="Іздеу…" class="mobile-search-input" />
        </div>
        <ul class="mobile-nav">
          <li v-for="item in navItems" :key="'m-' + item.label" class="mobile-nav-item">
            <button
                class="mobile-nav-link"
                @click="item.children ? (item._open = !item._open) : null"
            >
              {{ item.label }}
              <i v-if="item.children" class="pi" :class="item._open ? 'pi-angle-up' : 'pi-angle-down'" />
            </button>
            <ul v-if="item.children && item._open" class="mobile-sub">
              <template v-for="col in item.children" :key="col.heading">
                <li class="mobile-sub-head">{{ col.heading }}</li>
                <li v-for="link in col.links" :key="link.label">
                  <a :href="link.href" class="mobile-sub-link">{{ link.label }}</a>
                </li>
              </template>
            </ul>
          </li>
        </ul>
        <a href="#" class="mobile-subscribe">
          <i class="pi pi-send" /> Жазылу
        </a>
      </div>
    </transition>

    <!-- Overlay -->
    <div v-if="mobileOpen" class="mobile-overlay" @click="mobileOpen = false" />
  </header>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;900&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,300&display=swap');

/* ─── Tokens ─── */
.site-header {
  --ink:       #1a1208;
  --parchment: #faf6ef;
  --gold:      #c4922a;
  --gold-l:    #e8b94f;
  --rust:      #8b3a1e;
  --border:    #d9cdb8;
  --nav-bg:    #1e1409;
  --top-bg:    #120d04;

  position: sticky;
  top: 0;
  z-index: 1000;
  font-family: 'Source Serif 4', Georgia, serif;
  transition: box-shadow .3s;
}
.site-header.scrolled { box-shadow: 0 4px 32px rgba(26,18,8,.25); }

/* ─── Top Bar ─── */
.top-bar {
  background: var(--top-bg);
  border-bottom: 1px solid rgba(196,146,42,.2);
  font-size: .72rem;
  letter-spacing: .04em;
  color: rgba(255,255,255,.45);
}
.top-bar-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: .38rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: .5rem;
}
.top-bar-left  { display: flex; align-items: center; gap: .6rem; }
.top-bar-right { display: flex; align-items: center; gap: .75rem; }

.top-date i { margin-right: .3rem; }
.top-sep    { color: var(--gold); }
.top-quote  { font-style: italic; color: rgba(255,255,255,.35); }

.top-link {
  color: rgba(255,255,255,.45);
  text-decoration: none;
  font-size: .8rem;
  transition: color .2s;
}
.top-link:hover { color: var(--gold); }

.lang-switch {
  display: flex;
  border: 1px solid rgba(196,146,42,.3);
  border-radius: 1px;
  overflow: hidden;
  margin-left: .25rem;
}
.lang-btn {
  background: none;
  border: none;
  color: rgba(255,255,255,.4);
  font-size: .65rem;
  font-weight: 700;
  letter-spacing: .06em;
  padding: .2rem .45rem;
  cursor: pointer;
  transition: background .2s, color .2s;
  font-family: 'Source Serif 4', serif;
}
.lang-btn.active { background: var(--gold); color: #fff; }
.lang-btn:hover:not(.active) { color: var(--gold-l); }

/* ─── Brand Bar ─── */
.brand-bar {
  background: var(--parchment);
  border-bottom: 2px solid var(--gold);
}
.brand-bar-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: .85rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

/* Logo */
.logo-wrap {
  display: flex;
  align-items: center;
  gap: .9rem;
  text-decoration: none;
  flex-shrink: 0;
}
.logo-emblem { width: 52px; height: 52px; flex-shrink: 0; }
.logo-text   { display: flex; flex-direction: column; line-height: 1.15; }
.logo-kz {
  font-family: 'Playfair Display', serif;
  font-size: 1.25rem;
  font-weight: 900;
  color: var(--ink);
  letter-spacing: -.01em;
}
.logo-ru {
  font-size: .7rem;
  font-weight: 600;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: var(--gold);
}

/* Search */
.search-wrap { flex: 1; max-width: 480px; }
.search-box {
  display: flex;
  align-items: center;
  border: 1.5px solid var(--border);
  border-radius: 2px;
  background: #fff;
  padding: 0 .75rem;
  gap: .5rem;
  transition: border-color .25s, box-shadow .25s;
}
.search-box:focus-within {
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(196,146,42,.12);
}
.search-icon { color: #b0a090; font-size: .85rem; flex-shrink: 0; }
.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  padding: .6rem 0;
  font-family: 'Source Serif 4', serif;
  font-size: .875rem;
  color: var(--ink);
}
.search-input::placeholder { color: #b0a090; font-style: italic; }
.search-clear {
  background: none; border: none;
  color: #b0a090; cursor: pointer;
  font-size: .75rem;
  padding: 0;
  transition: color .2s;
}
.search-clear:hover { color: var(--rust); }

/* Brand Actions */
.brand-actions {
  display: flex;
  align-items: center;
  gap: .5rem;
  margin-left: auto;
  position: relative;
}
.icon-btn {
  position: relative;
  background: none;
  border: 1.5px solid var(--border);
  border-radius: 2px;
  width: 38px; height: 38px;
  display: flex; align-items: center; justify-content: center;
  color: #7a6a52;
  font-size: .9rem;
  cursor: pointer;
  transition: border-color .2s, color .2s;
}
.icon-btn:hover { border-color: var(--gold); color: var(--gold); }

.badge-dot {
  position: absolute; top: 6px; right: 6px;
  width: 7px; height: 7px;
  background: var(--rust);
  border-radius: 50%;
  border: 1.5px solid var(--parchment);
}

.avatar-btn { border-color: var(--gold); }
.avatar-initials {
  font-size: .7rem; font-weight: 700;
  color: var(--gold);
  letter-spacing: .04em;
}

/* Search toggle (mobile-ish) */
.search-toggle { display: none; }

/* Profile dropdown */
.profile-drop {
  position: absolute;
  top: calc(100% + .75rem);
  right: 0;
  width: 210px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 3px;
  box-shadow: 0 8px 32px rgba(26,18,8,.14);
  z-index: 200;
  overflow: hidden;
  animation: dropIn .2s ease;
}
@keyframes dropIn { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:none } }

.profile-header {
  padding: .85rem 1rem;
  background: var(--top-bg);
  display: flex; flex-direction: column; gap: .15rem;
}
.profile-name { color: #fff; font-weight: 600; font-size: .88rem; }
.profile-role { color: var(--gold); font-size: .72rem; letter-spacing: .06em; }

.drop-item {
  display: flex; align-items: center; gap: .6rem;
  padding: .65rem 1rem;
  font-size: .82rem;
  color: #5a4a35;
  text-decoration: none;
  transition: background .15s, color .15s;
}
.drop-item:hover { background: #faf3e6; color: var(--gold); }
.drop-item i { font-size: .8rem; color: #b0a090; }
.drop-sep { height: 1px; background: var(--border); margin: .25rem 0; }
.drop-exit { color: var(--rust) !important; }
.drop-exit i { color: var(--rust) !important; }

/* Hamburger */
.hamburger {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none; border: none;
  cursor: pointer; padding: .4rem; margin-left: .5rem;
}
.hamburger span {
  display: block; width: 24px; height: 2px;
  background: var(--ink);
  border-radius: 1px;
  transition: all .3s;
}
.menu-open .hamburger span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
.menu-open .hamburger span:nth-child(2) { opacity: 0; }
.menu-open .hamburger span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }

/* ─── Nav Bar ─── */
.nav-bar {
  background: var(--nav-bg);
  border-bottom: 1px solid rgba(196,146,42,.25);
}
.nav-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
}
.nav-list {
  display: flex;
  list-style: none;
  margin: 0; padding: 0;
  flex: 1;
}
.nav-item { position: relative; }

.nav-link {
  display: flex;
  align-items: center;
  gap: .3rem;
  padding: .85rem .95rem;
  font-size: .82rem;
  font-weight: 600;
  letter-spacing: .04em;
  color: rgba(255,255,255,.65);
  text-decoration: none;
  white-space: nowrap;
  transition: color .2s;
  position: relative;
}
.nav-link::after {
  content: '';
  position: absolute;
  bottom: 0; left: .95rem; right: .95rem;
  height: 2px;
  background: var(--gold);
  transform: scaleX(0);
  transition: transform .25s;
  transform-origin: left;
}
.nav-link:hover,
.nav-link.active { color: #fff; }
.nav-link:hover::after,
.nav-link.active::after { transform: scaleX(1); }
.nav-link.active { color: var(--gold-l); }

.nav-caret { font-size: .65rem; transition: transform .2s; }
.nav-item:hover .nav-caret { transform: rotate(180deg); }

/* Mega dropdown */
.mega-drop {
  position: absolute;
  top: 100%; left: 0;
  min-width: 620px;
  background: #fff;
  border: 1px solid var(--border);
  border-top: 2px solid var(--gold);
  box-shadow: 0 12px 48px rgba(26,18,8,.18);
  z-index: 300;
  opacity: 0;
  pointer-events: none;
  transform: translateY(8px);
  transition: opacity .22s ease, transform .22s ease;
  border-radius: 0 0 3px 3px;
}
.mega-drop.visible {
  opacity: 1;
  pointer-events: all;
  transform: none;
}
.mega-inner {
  display: flex;
  padding: 1.5rem;
  gap: 1.5rem;
}
.mega-col { flex: 1; min-width: 140px; }
.mega-heading {
  font-family: 'Playfair Display', serif;
  font-size: .8rem;
  font-weight: 700;
  color: var(--gold);
  letter-spacing: .08em;
  text-transform: uppercase;
  margin: 0 0 .75rem;
  padding-bottom: .5rem;
  border-bottom: 1px solid var(--border);
}
.mega-links { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .1rem; }
.mega-link {
  display: flex;
  align-items: center;
  gap: .5rem;
  padding: .38rem .25rem;
  font-size: .82rem;
  color: #5a4a35;
  text-decoration: none;
  border-radius: 1px;
  transition: color .15s, background .15s;
}
.mega-link:hover { color: var(--gold); background: #fdf8f0; }
.mega-dot { color: var(--gold); font-size: .45rem; flex-shrink: 0; }

/* Featured panel */
.mega-featured {
  width: 200px;
  flex-shrink: 0;
  border-left: 1px solid var(--border);
  padding-left: 1.25rem;
}
.mf-img { width: 100%; height: 110px; object-fit: cover; border-radius: 2px; margin-bottom: .65rem; }
.mf-tag {
  display: inline-block;
  font-size: .62rem;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--gold);
  background: #fdf3e0;
  padding: .15rem .45rem;
  border-radius: 1px;
  margin-bottom: .45rem;
}
.mf-title { font-size: .8rem; font-weight: 600; color: var(--ink); line-height: 1.4; margin: 0 0 .5rem; }
.mf-link {
  display: inline-flex; align-items: center; gap: .3rem;
  font-size: .75rem; font-weight: 700;
  color: var(--gold);
  text-decoration: none;
  transition: gap .15s;
}
.mf-link:hover { gap: .5rem; }

/* Nav right */
.nav-right { margin-left: auto; }
.nav-subscribe-btn {
  display: inline-flex; align-items: center; gap: .45rem;
  background: var(--gold);
  color: #fff;
  padding: .45rem 1rem;
  border-radius: 2px;
  font-size: .75rem;
  font-weight: 700;
  letter-spacing: .05em;
  text-decoration: none;
  white-space: nowrap;
  transition: background .2s;
}
.nav-subscribe-btn:hover { background: var(--gold-l); }
.nav-subscribe-btn i { font-size: .8rem; }

/* ─── Mobile Drawer ─── */
.mobile-drawer {
  position: fixed;
  top: 0; left: 0;
  width: min(320px, 85vw);
  height: 100dvh;
  background: var(--parchment);
  z-index: 900;
  overflow-y: auto;
  padding: 1.25rem 0 2rem;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 40px rgba(26,18,8,.25);
}
.mobile-overlay {
  position: fixed; inset: 0;
  background: rgba(26,18,8,.5);
  z-index: 850;
  backdrop-filter: blur(2px);
}
.drawer-enter-active, .drawer-leave-active { transition: transform .3s ease; }
.drawer-enter-from, .drawer-leave-to { transform: translateX(-100%); }

.mobile-search {
  display: flex; align-items: center; gap: .6rem;
  margin: 0 1.25rem 1rem;
  border: 1.5px solid var(--border);
  border-radius: 2px;
  padding: .5rem .75rem;
  background: #fff;
}
.mobile-search i { color: #b0a090; font-size: .85rem; }
.mobile-search-input {
  flex: 1; border: none; outline: none;
  font-family: 'Source Serif 4', serif;
  font-size: .875rem;
  color: var(--ink);
  background: transparent;
}
.mobile-search-input::placeholder { color: #b0a090; font-style: italic; }

.mobile-nav {
  list-style: none; margin: 0; padding: 0;
  flex: 1;
}
.mobile-nav-item { border-bottom: 1px solid var(--border); }
.mobile-nav-link {
  display: flex; justify-content: space-between; align-items: center;
  width: 100%;
  padding: .85rem 1.25rem;
  background: none; border: none;
  font-family: 'Source Serif 4', serif;
  font-size: .9rem;
  font-weight: 600;
  color: var(--ink);
  cursor: pointer;
  text-align: left;
}
.mobile-nav-link i { font-size: .75rem; color: var(--gold); }

.mobile-sub {
  list-style: none; margin: 0;
  padding: 0 0 .5rem 1.25rem;
  background: #f5ede0;
}
.mobile-sub-head {
  font-size: .68rem;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--gold);
  padding: .6rem .75rem .25rem;
}
.mobile-sub-link {
  display: block;
  padding: .38rem .75rem;
  font-size: .82rem;
  color: #5a4a35;
  text-decoration: none;
  transition: color .15s;
}
.mobile-sub-link:hover { color: var(--gold); }

.mobile-subscribe {
  display: flex; align-items: center; gap: .5rem;
  margin: 1.5rem 1.25rem 0;
  background: var(--gold);
  color: #fff;
  padding: .7rem 1.25rem;
  border-radius: 2px;
  font-size: .85rem;
  font-weight: 700;
  text-decoration: none;
  justify-content: center;
}

/* ─── Responsive ─── */
@media (max-width: 960px) {
  .search-wrap   { display: none; }
  .search-toggle { display: flex; }
  .hamburger     { display: flex; }
  .nav-bar       { display: none; }
  .top-quote     { display: none; }
}
@media (max-width: 480px) {
  .brand-bar-inner { gap: .75rem; }
  .logo-kz { font-size: 1.05rem; }
  .logo-emblem { width: 40px; height: 40px; }
}
</style>