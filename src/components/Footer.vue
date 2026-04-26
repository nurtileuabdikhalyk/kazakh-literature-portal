
<script setup lang="ts">
import { ref } from 'vue'

const email      = ref('')
const subscribed = ref(false)
const year       = new Date().getFullYear()

function subscribe() {
  if (!email.value) return
  subscribed.value = true
  email.value = ''
  setTimeout(() => subscribed.value = false, 4000)
}

const socials = [
  { icon: 'pi-telegram',  href: '#', label: 'Telegram' },
  { icon: 'pi-youtube',   href: '#', label: 'YouTube'  },
  { icon: 'pi-instagram', href: '#', label: 'Instagram' },
  { icon: 'pi-facebook',  href: '#', label: 'Facebook'  },
]

const footerCols = [
  {
    heading: 'Бөлімдер',
    links: [
      { label: 'Классика',     href: '#' },
      { label: 'Заманауи проза', href: '#' },
      { label: 'Поэзия',       href: '#' },
      { label: 'Аудармалар',   href: '#' },
      { label: 'Балалар әдебиеті', href: '#' },
      { label: 'Драматургия',  href: '#' },
    ],
  },
  {
    heading: 'Авторлар',
    links: [
      { label: 'Абай Құнанбайұлы', href: '#' },
      { label: 'Мұқағали Мақатаев', href: '#' },
      { label: 'Мұхтар Әуезов',    href: '#' },
      { label: 'Фариза Оңғарсынова', href: '#' },
      { label: 'Ілияс Есенберлин', href: '#' },
      { label: 'Барлық авторлар →', href: '#' },
    ],
  },
  {
    heading: 'Портал',
    links: [
      { label: 'Біз туралы',   href: '#' },
      { label: 'Редакция',     href: '#' },
      { label: 'Жаңалықтар',  href: '#' },
      { label: 'Іс-шаралар',  href: '#' },
      { label: 'Жарнама',      href: '#' },
      { label: 'Серіктестер',  href: '#' },
    ],
  },
]

const contacts = [
  { icon: 'pi-map-marker', label: 'Мекенжай',    value: 'Алматы, Абай даңғылы, 44',  href: '#'                      },
  { icon: 'pi-envelope',   label: 'Email',        value: 'info@kazlit.kz',             href: 'mailto:info@kazlit.kz'  },
  { icon: 'pi-phone',      label: 'Телефон',      value: '+7 (727) 123-45-67',         href: 'tel:+77271234567'        },
  { icon: 'pi-clock',      label: 'Жұмыс уақыты', value: 'Дүйсенбі – Жұма, 9:00–18:00', href: '#'                   },
]
</script>
<template>
  <footer class="site-footer">

    <!-- ── Newsletter Band ─────────────────────────────── -->
    <div class="newsletter-band">
      <div class="nl-inner">
        <div class="nl-ornament" aria-hidden="true">
          <span class="nl-line" />
          <span class="nl-diamond">◆</span>
          <span class="nl-line" />
        </div>
        <h2 class="nl-title">Жаңалықтарға жазылыңыз</h2>
        <p class="nl-sub">Қазақ әдебиетінің соңғы жаңалықтары тікелей сіздің поштаңызға</p>
        <form class="nl-form" @submit.prevent="subscribe">
          <input
              v-model="email"
              type="email"
              placeholder="email@example.com"
              class="nl-input"
              required
          />
          <button type="submit" class="nl-btn">
            <i class="pi pi-send" />
            <span>Жазылу</span>
          </button>
        </form>
        <p v-if="subscribed" class="nl-success">
          <i class="pi pi-check-circle" /> Сәтті жазылдыңыз!
        </p>
      </div>
    </div>

    <!-- ── Main Footer Body ────────────────────────────── -->
    <div class="footer-body">
      <div class="footer-inner">

        <!-- Brand column -->
        <div class="footer-col brand-col">
          <div class="footer-logo">
            <svg viewBox="0 0 56 56" fill="none" class="f-emblem" aria-hidden="true">
              <polygon points="28,3 52,16 52,40 28,53 4,40 4,16"
                       stroke="#c4922a" stroke-width="1.4" fill="none"/>
              <circle cx="28" cy="28" r="13" stroke="#c4922a" stroke-width="1" fill="none" opacity=".5"/>
              <path d="M18 20 L18 36 M18 28 L28 22 M28 22 L38 28 M38 20 L38 36"
                    stroke="#c4922a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <rect x="26" y="26" width="4" height="4" transform="rotate(45 28 28)" fill="#c4922a"/>
            </svg>
            <div class="f-logo-text">
              <span class="f-logo-kz">Қазақ Әдебиет</span>
              <span class="f-logo-ru">Портал</span>
            </div>
          </div>
          <p class="brand-desc">
            Қазақ әдебиетінің байлығын сақтап, насихаттаушы ұлттық цифрлық платформа.
            Классикадан заманауи прозаға дейін.
          </p>
          <div class="social-row">
            <a v-for="s in socials" :key="s.icon" :href="s.href" :aria-label="s.label" class="social-link">
              <i :class="'pi ' + s.icon" />
            </a>
          </div>
          <div class="app-badges">
            <a href="#" class="app-badge">
              <i class="pi pi-apple" />
              <span>App Store</span>
            </a>
            <a href="#" class="app-badge">
              <i class="pi pi-android" />
              <span>Google Play</span>
            </a>
          </div>
        </div>

        <!-- Nav columns -->
        <div class="footer-col" v-for="col in footerCols" :key="col.heading">
          <h4 class="col-heading">
            <span class="col-heading-diamond">◆</span>
            {{ col.heading }}
          </h4>
          <ul class="col-links">
            <li v-for="link in col.links" :key="link.label">
              <a :href="link.href" class="col-link">
                <span class="col-link-arrow">›</span>
                {{ link.label }}
              </a>
            </li>
          </ul>
        </div>

        <!-- Contact column -->
        <div class="footer-col contact-col">
          <h4 class="col-heading">
            <span class="col-heading-diamond">◆</span>
            Байланыс
          </h4>
          <ul class="contact-list">
            <li v-for="c in contacts" :key="c.label" class="contact-item">
              <span class="contact-icon"><i :class="'pi ' + c.icon" /></span>
              <div>
                <span class="contact-label">{{ c.label }}</span>
                <a :href="c.href" class="contact-value">{{ c.value }}</a>
              </div>
            </li>
          </ul>

          <!-- Quote block -->
          <blockquote class="footer-quote">
            <p>« Өнер алды — қызыл тіл »</p>
            <cite>— Қазақ мақалы</cite>
          </blockquote>
        </div>

      </div>
    </div>

    <!-- ── Divider ornament ────────────────────────────── -->
    <div class="footer-divider">
      <span class="fd-line" />
      <span class="fd-center">
        <svg viewBox="0 0 60 20" fill="none" width="60" height="20" aria-hidden="true">
          <line x1="0" y1="10" x2="20" y2="10" stroke="#c4922a" stroke-width=".8" opacity=".5"/>
          <polygon points="30,4 36,10 30,16 24,10" fill="none" stroke="#c4922a" stroke-width=".9"/>
          <line x1="40" y1="10" x2="60" y2="10" stroke="#c4922a" stroke-width=".8" opacity=".5"/>
        </svg>
      </span>
      <span class="fd-line" />
    </div>

    <!-- ── Bottom Bar ──────────────────────────────────── -->
    <div class="footer-bottom">
      <div class="fb-inner">
        <p class="copyright">
          © {{ year }} Қазақ Әдебиет Порталы. Барлық құқықтар қорғалған.
        </p>
        <nav class="legal-nav" aria-label="Заңдық сілтемелер">
          <a href="#" class="legal-link">Құпиялылық саясаты</a>
          <span class="legal-sep">·</span>
          <a href="#" class="legal-link">Пайдалану шарттары</a>
          <span class="legal-sep">·</span>
          <a href="#" class="legal-link">Куки</a>
        </nav>
        <p class="made-with">
          <span>Жасалды</span>
          <i class="pi pi-heart" style="color: var(--rust);" />
          <span>Алматыда</span>
        </p>
      </div>
    </div>

  </footer>
</template>


<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,300&display=swap');

/* ─── Tokens ─── */
.site-footer {
  --ink:       #1a1208;
  --parchment: #faf6ef;
  --gold:      #c4922a;
  --gold-l:    #e8b94f;
  --rust:      #8b3a1e;
  --border:    rgba(196,146,42,.22);
  --body-bg:   #120d04;
  --muted:     rgba(255,255,255,.42);

  font-family: 'Source Serif 4', Georgia, serif;
  background: var(--body-bg);
  color: rgba(255,255,255,.72);
}

/* ─── Newsletter Band ─── */
.newsletter-band {
  background: linear-gradient(135deg, #1e1204 0%, #2a1a06 50%, #1e1204 100%);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  padding: 3rem 1.5rem;
  text-align: center;
  position: relative;
  overflow: hidden;
}
/* Subtle pattern */
.newsletter-band::before {
  content: '';
  position: absolute; inset: 0;
  background-image: radial-gradient(circle, rgba(196,146,42,.06) 1px, transparent 1px);
  background-size: 28px 28px;
  pointer-events: none;
}

.nl-inner { position: relative; z-index: 1; max-width: 540px; margin: 0 auto; }

.nl-ornament { display: flex; align-items: center; justify-content: center; gap: .75rem; margin-bottom: 1rem; }
.nl-line     { display: block; height: 1px; width: 60px; background: linear-gradient(90deg, transparent, var(--gold)); }
.nl-line:last-child { background: linear-gradient(90deg, var(--gold), transparent); }
.nl-diamond  { color: var(--gold); font-size: .65rem; }

.nl-title {
  font-family: 'Playfair Display', serif;
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 900;
  color: #fff;
  margin: 0 0 .5rem;
}
.nl-sub {
  font-size: .875rem;
  color: var(--muted);
  font-style: italic;
  margin: 0 0 1.5rem;
}

.nl-form {
  display: flex;
  gap: 0;
  max-width: 420px;
  margin: 0 auto;
  border: 1.5px solid var(--border);
  border-radius: 2px;
  overflow: hidden;
  transition: border-color .25s;
}
.nl-form:focus-within { border-color: var(--gold); }

.nl-input {
  flex: 1;
  background: rgba(255,255,255,.06);
  border: none;
  outline: none;
  padding: .7rem 1rem;
  font-family: 'Source Serif 4', serif;
  font-size: .875rem;
  color: #fff;
}
.nl-input::placeholder { color: rgba(255,255,255,.3); font-style: italic; }

.nl-btn {
  display: flex; align-items: center; gap: .45rem;
  background: var(--gold);
  border: none;
  padding: .7rem 1.25rem;
  color: #fff;
  font-family: 'Source Serif 4', serif;
  font-size: .82rem;
  font-weight: 700;
  letter-spacing: .04em;
  cursor: pointer;
  white-space: nowrap;
  transition: background .2s;
}
.nl-btn:hover { background: var(--gold-l); }

.nl-success {
  margin: .85rem 0 0;
  font-size: .82rem;
  color: var(--gold-l);
  display: flex; align-items: center; justify-content: center; gap: .4rem;
  animation: fadeIn .4s ease;
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; } }

/* ─── Footer Body ─── */
.footer-body { padding: 3.5rem 1.5rem; }
.footer-inner {
  max-width: 1280px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1fr 1.3fr;
  gap: 2.5rem;
}
@media (max-width: 1100px) {
  .footer-inner { grid-template-columns: 1fr 1fr 1fr; }
  .brand-col    { grid-column: 1 / -1; display: grid; grid-template-columns: auto 1fr; gap: 0 2rem; align-items: start; }
  .brand-col .brand-desc { grid-column: 2; margin-top: 0; }
  .brand-col .social-row,
  .brand-col .app-badges { grid-column: 2; }
  .contact-col  { grid-column: 1 / -1; }
}
@media (max-width: 640px) {
  .footer-inner { grid-template-columns: 1fr 1fr; }
  .brand-col    { grid-column: 1 / -1; display: block; }
  .contact-col  { grid-column: 1 / -1; }
}
@media (max-width: 420px) {
  .footer-inner { grid-template-columns: 1fr; }
}

/* Brand col */
.footer-logo {
  display: flex; align-items: center; gap: .85rem;
  margin-bottom: 1rem;
}
.f-emblem { width: 50px; height: 50px; flex-shrink: 0; }
.f-logo-text { display: flex; flex-direction: column; line-height: 1.2; }
.f-logo-kz {
  font-family: 'Playfair Display', serif;
  font-size: 1.15rem;
  font-weight: 900;
  color: #fff;
}
.f-logo-ru {
  font-size: .65rem;
  font-weight: 700;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: var(--gold);
}

.brand-desc {
  font-size: .82rem;
  color: var(--muted);
  line-height: 1.7;
  margin: 0 0 1.25rem;
  font-style: italic;
}

.social-row { display: flex; gap: .5rem; margin-bottom: 1.1rem; }
.social-link {
  width: 34px; height: 34px;
  border: 1px solid var(--border);
  border-radius: 2px;
  display: flex; align-items: center; justify-content: center;
  color: var(--muted);
  font-size: .85rem;
  text-decoration: none;
  transition: border-color .2s, color .2s, background .2s;
}
.social-link:hover { border-color: var(--gold); color: var(--gold); background: rgba(196,146,42,.08); }

.app-badges { display: flex; gap: .6rem; flex-wrap: wrap; }
.app-badge {
  display: inline-flex; align-items: center; gap: .4rem;
  border: 1px solid var(--border);
  border-radius: 2px;
  padding: .38rem .75rem;
  font-size: .72rem;
  font-weight: 600;
  color: rgba(255,255,255,.55);
  text-decoration: none;
  letter-spacing: .04em;
  transition: border-color .2s, color .2s;
}
.app-badge:hover { border-color: var(--gold); color: var(--gold-l); }
.app-badge i { font-size: .85rem; }

/* Nav columns */
.col-heading {
  display: flex; align-items: center; gap: .5rem;
  font-family: 'Playfair Display', serif;
  font-size: .78rem;
  font-weight: 700;
  color: var(--gold);
  letter-spacing: .1em;
  text-transform: uppercase;
  margin: 0 0 1.1rem;
  padding-bottom: .6rem;
  border-bottom: 1px solid var(--border);
}
.col-heading-diamond { font-size: .5rem; flex-shrink: 0; }

.col-links { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .05rem; }
.col-link {
  display: flex; align-items: center; gap: .45rem;
  padding: .32rem 0;
  font-size: .82rem;
  color: var(--muted);
  text-decoration: none;
  transition: color .2s, gap .2s;
}
.col-link:hover { color: var(--gold-l); gap: .65rem; }
.col-link-arrow { color: var(--gold); font-size: .9rem; flex-shrink: 0; }

/* Contact col */
.contact-list { list-style: none; margin: 0 0 1.5rem; padding: 0; display: flex; flex-direction: column; gap: .9rem; }
.contact-item { display: flex; align-items: flex-start; gap: .75rem; }
.contact-icon {
  width: 30px; height: 30px;
  border: 1px solid var(--border);
  border-radius: 2px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  color: var(--gold);
  font-size: .75rem;
}
.contact-label { display: block; font-size: .67rem; letter-spacing: .08em; text-transform: uppercase; color: rgba(255,255,255,.28); margin-bottom: .1rem; }
.contact-value { font-size: .8rem; color: rgba(255,255,255,.65); text-decoration: none; transition: color .2s; }
.contact-value:hover { color: var(--gold-l); }

/* Quote */
.footer-quote {
  border-left: 2px solid var(--gold);
  margin: 0;
  padding: .65rem 1rem;
  background: rgba(196,146,42,.06);
  border-radius: 0 2px 2px 0;
}
.footer-quote p {
  font-family: 'Playfair Display', serif;
  font-style: italic;
  font-size: .95rem;
  color: rgba(255,255,255,.75);
  margin: 0 0 .25rem;
}
.footer-quote cite { font-size: .72rem; color: var(--gold); letter-spacing: .06em; }

/* ─── Divider ─── */
.footer-divider {
  display: flex; align-items: center;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1.5rem;
}
.fd-line { flex: 1; height: 1px; background: var(--border); }
.fd-center { padding: 0 1rem; flex-shrink: 0; }

/* ─── Bottom Bar ─── */
.footer-bottom {
  padding: 1.1rem 1.5rem;
  border-top: 1px solid var(--border);
}
.fb-inner {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: .75rem 2rem;
}

.copyright {
  font-size: .75rem;
  color: rgba(255,255,255,.28);
  margin: 0;
  flex: 1;
  min-width: 200px;
}

.legal-nav { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; }
.legal-link {
  font-size: .72rem;
  color: rgba(255,255,255,.35);
  text-decoration: none;
  transition: color .2s;
}
.legal-link:hover { color: var(--gold); }
.legal-sep { color: var(--border); }

.made-with {
  display: flex; align-items: center; gap: .35rem;
  font-size: .72rem;
  color: rgba(255,255,255,.28);
  margin: 0;
  white-space: nowrap;
}
.made-with i { font-size: .7rem; }
</style>