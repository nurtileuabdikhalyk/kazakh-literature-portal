<template>
  <footer class="app-footer">
    <div class="footer-inner">

      <!-- Left: brand -->
      <div class="footer-brand">
        <svg viewBox="0 0 28 28" fill="none" class="fb-icon" aria-hidden="true">
          <polygon points="14,2 26,8 26,20 14,26 2,20 2,8"
                   stroke="#c4922a" stroke-width="1.2" fill="none"/>
          <path d="M9 10 L9 18 M9 14 L14 12 M14 12 L19 14 M19 10 L19 18"
                stroke="#c4922a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div>
          <span class="fb-name">Аудиовизуалды Әдебиет</span>
          <span class="fb-sub">8-сынып · Қазақ әдебиеті</span>
        </div>
      </div>

      <!-- Center: nav links -->
      <nav class="footer-nav">
        <a
            v-for="item in links" :key="item.label"
            class="footer-link"
            :href="item.path"
            @click.prevent="navigate(item)"
        >
          {{ item.label }}
        </a>
      </nav>

      <!-- Right: copyright -->
      <div class="footer-copy">
        <span>© {{ year }}</span>
        <span class="fc-sep">·</span>
        <span>8-сынып · Аудиовизуалды оқыту</span>
      </div>

    </div>
  </footer>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'

const route  = useRoute()
const router = useRouter()
const year   = new Date().getFullYear()

const links = [
  { label: 'Басты',       path: '/',             hash: '' },
  { label: 'Сабақтар',    path: '/lessons',      hash: '' },
  { label: 'Аудио',       path: '/#audio',       hash: 'audio' },
  { label: 'Тапсырмалар', path: '/#interactive', hash: 'interactive' },
  { label: 'Кіру',        path: '/login',        hash: '' },
]

async function navigate(item) {
  if (item.hash) {
    if (route.path !== '/') {
      await router.push({ path: '/', hash: '#' + item.hash })
      setTimeout(() => scrollTo(item.hash), 350)
    } else {
      // Hash бірдей болса да — тікелей scroll жасаймыз
      scrollTo(item.hash)
      if (route.hash !== '#' + item.hash) {
        router.replace({ hash: '#' + item.hash })
      }
    }
  } else {
    router.push(item.path)
  }
}

function scrollTo(id) {
  const el = document.getElementById(id)
  if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY - 70
    window.scrollTo({ top, behavior: 'smooth' })
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;600&display=swap');

.app-footer {
  background: #130e07;
  border-top: 1px solid rgba(196,146,42,.2);
  font-family: 'Source Serif 4', Georgia, serif;
}

.footer-inner {
  max-width: 1280px; margin: 0 auto;
  padding: 1.1rem 1.5rem;
  display: flex; align-items: center;
  flex-wrap: wrap; gap: 1rem;
}

/* Brand */
.footer-brand {
  display: flex; align-items: center; gap: .6rem; flex-shrink: 0;
}
.fb-icon { width: 26px; height: 26px; flex-shrink: 0; }
.fb-name {
  display: block; font-size: .78rem; font-weight: 600; color: rgba(255,255,255,.65);
  white-space: nowrap;
}
.fb-sub  {
  display: block; font-size: .6rem; color: #c4922a;
  letter-spacing: .09em; text-transform: uppercase;
}

/* Nav */
.footer-nav {
  display: flex; flex-wrap: wrap; gap: .15rem;
  margin: 0 auto;
}
.footer-link {
  font-size: .75rem; color: rgba(255,255,255,.35);
  text-decoration: none; padding: .22rem .55rem; border-radius: 1px;
  transition: color .2s;
}
.footer-link:hover { color: #c4922a; }

/* Copy */
.footer-copy {
  display: flex; align-items: center; gap: .4rem;
  font-size: .7rem; color: rgba(255,255,255,.22);
  flex-shrink: 0; white-space: nowrap;
}
.fc-sep { color: rgba(196,146,42,.35); }

@media (max-width: 640px) {
  .footer-inner   { flex-direction: column; align-items: flex-start; gap: .75rem; }
  .footer-nav     { margin: 0; }
}
</style>