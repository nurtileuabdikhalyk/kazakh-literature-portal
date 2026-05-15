<template>
  <section class="main-carousel" aria-label="Басты слайдер">

    <!-- ══ SLIDES ════════════════════════════════════════ -->
    <div class="slides-wrap">
      <transition-group name="slide-anim" tag="div" class="slides-inner">
        <div
            v-for="(slide, i) in slides"
            v-show="i === current"
            :key="slide.id"
            class="slide"
            :class="slide.accent"
        >
          <!-- Background -->
          <div class="slide-bg">
            <img :src="slide.image" :alt="slide.title" class="slide-img"/>
            <div class="slide-gradient" :class="slide.accent"/>
            <div class="slide-noise"/>
          </div>

          <!-- Decorative SVG ornament -->
          <div class="slide-ornament" aria-hidden="true">
            <svg viewBox="0 0 320 320" fill="none">
              <circle cx="160" cy="160" r="140" stroke="rgba(255,255,255,.06)" stroke-width="1"/>
              <circle cx="160" cy="160" r="100" stroke="rgba(255,255,255,.04)" stroke-width="1"/>
              <polygon points="160,20 300,100 300,220 160,300 20,220 20,100" fill="none" stroke="rgba(255,255,255,.05)" stroke-width="1"/>
            </svg>
          </div>

          <!-- Content -->
          <div class="slide-content">
            <div class="slide-inner">

              <!-- Category tag -->
              <div class="slide-tag">
                <span class="tag-icon"><i :class="'pi ' + slide.icon"/></span>
                <span>{{ slide.tag }}</span>
              </div>

              <!-- Class badge -->
              <div class="class-badge">8-сынып · Қазақ әдебиеті</div>

              <h1 class="slide-title">{{ slide.title }}</h1>
              <p class="slide-subtitle">{{ slide.subtitle }}</p>

              <!-- Key points -->
              <ul class="slide-points" v-if="slide.points">
                <li v-for="pt in slide.points" :key="pt">
                  <i class="pi pi-check-circle"/>
                  {{ pt }}
                </li>
              </ul>

              <!-- CTA buttons -->
<!--              <div class="slide-cta">-->
<!--                <button class="cta-primary" @click="openSlide(slide)">-->
<!--                  <i :class="'pi ' + (slide.type === 'video' ? 'pi-play' : 'pi-arrow-right')"/>-->
<!--                  {{ slide.cta || 'Толығырақ' }}-->
<!--                </button>-->
<!--                <button class="cta-secondary">-->
<!--                  <i class="pi pi-bookmark"/>-->
<!--                  Сақтау-->
<!--                </button>-->
<!--              </div>-->

            </div>
          </div>

          <!-- Side info card -->
          <div class="slide-info-card">
            <div class="sic-icon"><i :class="'pi ' + slide.icon"/></div>
            <p class="sic-label">{{ slide.cardLabel }}</p>
            <p class="sic-value">{{ slide.cardValue }}</p>
            <div class="sic-sep"/>
            <div class="sic-meta">
              <span><i class="pi pi-book"/> {{ slide.subject }}</span>
              <span><i class="pi pi-users"/> {{ slide.audience }}</span>
            </div>
          </div>

          <!-- Slide number badge -->
          <div class="slide-num-badge">
            <span class="snb-cur">{{ String(i+1).padStart(2,'0') }}</span>
            <span class="snb-sep">/</span>
            <span class="snb-total">{{ String(slides.length).padStart(2,'0') }}</span>
          </div>
        </div>
      </transition-group>
    </div>

    <!-- ══ PROGRESS BAR ══════════════════════════════════ -->
    <div class="progress-rail">
      <div
          class="progress-fill"
          :style="{ width: progressPct + '%', transition: isPlaying ? `width ${INTERVAL}ms linear` : 'none' }"
      />
    </div>

    <!-- ══ CONTROLS ══════════════════════════════════════ -->
    <div class="carousel-controls">
      <button class="ctrl-arrow" @click="prev" aria-label="Алдыңғы">
        <i class="pi pi-chevron-left"/>
      </button>

      <!-- Dots -->
      <div class="ctrl-dots">
        <button
            v-for="(slide, i) in slides" :key="slide.id"
            class="ctrl-dot" :class="{ active: i === current }"
            @click="goTo(i)"
            :aria-label="`Слайд ${i+1}: ${slide.title}`"
        />
      </div>

      <button class="ctrl-arrow" @click="next" aria-label="Келесі">
        <i class="pi pi-chevron-right"/>
      </button>

      <!-- Play/Pause -->
      <button class="ctrl-playpause" @click="toggleAutoplay" :title="isPlaying ? 'Тоқтату' : 'Ойнату'">
        <i :class="isPlaying ? 'pi pi-pause' : 'pi pi-play'"/>
      </button>
    </div>

    <!-- ══ THUMBNAIL STRIP ══════════════════════════════ -->
    <div class="thumb-strip">
      <button
          v-for="(slide, i) in slides" :key="'th-'+slide.id"
          class="thumb-item" :class="{ active: i === current }"
          @click="goTo(i)"
      >
        <img :src="slide.image" :alt="slide.title" class="thumb-img"/>
        <div class="thumb-overlay"/>
        <div class="thumb-body">
          <span class="thumb-tag">{{ slide.tag }}</span>
          <span class="thumb-title">{{ slide.shortTitle }}</span>
        </div>
        <div class="thumb-active-line"/>
      </button>
    </div>

    <!-- ══ DIALOG ════════════════════════════════════════ -->
    <Dialog
        v-model:visible="dialogVisible"
        :header="selectedSlide?.title"
        :style="{ width: '720px', maxWidth: '95vw' }"
        modal
    >
      <div v-if="selectedSlide" class="dialog-body">
        <img :src="selectedSlide.image" :alt="selectedSlide.title" class="dialog-hero"/>
        <div class="dialog-meta">
          <Tag :value="selectedSlide.tag" severity="warning"/>
          <span class="dm-item"><i class="pi pi-book"/> {{ selectedSlide.subject }}</span>
          <span class="dm-item"><i class="pi pi-users"/> {{ selectedSlide.audience }}</span>
        </div>
        <p class="dialog-text">{{ selectedSlide.subtitle }}</p>
        <ul v-if="selectedSlide.points" class="dialog-points">
          <li v-for="pt in selectedSlide.points" :key="pt">
            <i class="pi pi-check-circle"/> {{ pt }}
          </li>
        </ul>
      </div>
    </Dialog>

  </section>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Dialog from 'primevue/dialog'
import Tag    from 'primevue/tag'

const INTERVAL = 6000

// ─── Slides ───────────────────────────────────────────
const slides = [
  {
    id: 1,
    accent: 'blue',
    icon: 'pi-video',
    tag: 'Аудиовизуалды технологиялар',
    shortTitle: 'Видео сабақтар',
    subject: '8-сынып · Қазақ әдебиеті',
    audience: 'Оқушылар мен мұғалімдер',
    cardLabel: 'Оқыту технологиясы',
    cardValue: 'Видео + Мәтін',
    cta: 'Видео сабақты қарау',
    type: 'video',
    title: 'Аудиовизуалды технологиялар арқылы әдебиетті оқыту',
    subtitle: '8-сынып оқушыларына арналған заманауи оқыту әдістемесі — видео, аудио және интерактивті материалдар.',
    points: [
      'Видео сабақтар мен анимациялар',
      'Мәтін мен аудио қатар жүреді',
      'Интерактивті тапсырмалар',
    ],
    image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1400&q=85',
  },
  {
    id: 2,
    accent: 'gold',
    icon: 'pi-book',
    tag: 'Абай Құнанбайұлы',
    shortTitle: 'Абай шығармалары',
    subject: '8-сынып · Лирика',
    audience: 'Оқушылар',
    cardLabel: 'Шығарма жанры',
    cardValue: 'Өлең · Қарасөз',
    cta: 'Сабақты бастау',
    type: 'lesson',
    title: '«Қараңғы түнде тау қалғып» — аудиовизуалды талдау',
    subtitle: 'Абайдың лирикасын бейне және аудио материалдармен тереңдетіп оқу. Қиын сөздерге түсіндірме, мәтін мен аудио синхронды.',
    points: [
      'Аудио оқылым + мәтін синхроны',
      'Қиын сөздерге жылдам түсіндірме',
      'Ритм пен ырғақты бейнелеу',
    ],
    image: 'https://images.unsplash.com/photo-1476820865390-c52aeebb9891?w=1400&q=85',
  },
  {
    id: 3,
    accent: 'rust',
    icon: 'pi-list-check',
    tag: 'Интерактивті тапсырмалар',
    shortTitle: 'Тест жүйесі',
    subject: '8-сынып · Тексеру',
    audience: 'Оқушылар',
    cardLabel: 'Тапсырма түрлері',
    cardValue: '4 формат',
    cta: 'Тапсырманы орындау',
    type: 'task',
    title: 'Білімді тексерудің интерактивті жүйесі',
    subtitle: 'Тест, дұрыс/бұрыс, бос орын толтыру, сәйкестендіру — автоматты тексеру мен нәтиже.',
    points: [
      'Автоматты тексеру жүйесі',
      'Excel-ден сұрақтарды жүктеу',
      'Нәтиже мен қателер талдауы',
    ],
    image: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=1400&q=85',
  },
  {
    id: 4,
    accent: 'sage',
    icon: 'pi-headphones',
    tag: 'Аудио кітапхана',
    shortTitle: 'Тыңдалым',
    subject: '8-сынып · Тыңдалым',
    audience: 'Оқушылар мен мұғалімдер',
    cardLabel: 'Аудио формат',
    cardValue: 'MP3 + Мәтін',
    cta: 'Тыңдауды бастау',
    type: 'audio',
    title: 'Шығармаларды тыңдау — мәтін мен аудио қатар',
    subtitle: 'Әдеби шығармаларды кәсіби дауыспен тыңдаңыз. Мәтін жолдары аудиомен синхронды жылжиды, қиын сөздерге бассаңыз — түсіндірме шығады.',
    points: [
      'Профессионал дикторлық оқылым',
      'Мәтін–аудио синхрондалуы',
      'Қиын сөздер сөздігі',
    ],
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1400&q=85',
  },
  {
    id: 5,
    accent: 'navy',
    icon: 'pi-pencil',
    tag: 'Шығармашылық тапсырмалар',
    shortTitle: 'Шығармашылық',
    subject: '8-сынып · Жазылым',
    audience: 'Оқушылар',
    cardLabel: 'Тапсырма форматы',
    cardValue: 'Эссе · Кроссенс',
    cta: 'Тапсырманы ашу',
    type: 'creative',
    title: 'Шығармашылық тапсырмалар — эссе, сторителлинг, кроссенс',
    subtitle: 'Оқушылардың шығармашылық қабілетін дамытатын жаттығулар: эссе жазу, сурет бойынша мәтін, кроссенс әдісі.',
    points: [
      'Эссе жазу нұсқаулығы',
      'Сурет бойынша мәтін',
      'Кроссенс — 9 ұяшықты ассоциация',
    ],
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1400&q=85',
  },
]

// ─── State ────────────────────────────────────────────
const current        = ref(0)
const isPlaying      = ref(true)
const progressPct    = ref(0)
const dialogVisible  = ref(false)
const selectedSlide  = ref(null)

let   autoTimer      = null
let   progressTimer  = null

// ─── Navigation ───────────────────────────────────────
function prev() { current.value = (current.value - 1 + slides.length) % slides.length; resetProgress() }
function next() { current.value = (current.value + 1) % slides.length; resetProgress() }
function goTo(i) { current.value = i; resetProgress() }

// ─── Autoplay ─────────────────────────────────────────
function startAutoplay() {
  stopAutoplay()
  autoTimer = setInterval(next, INTERVAL)
  startProgress()
}
function stopAutoplay() {
  clearInterval(autoTimer)
  clearInterval(progressTimer)
}
function toggleAutoplay() {
  isPlaying.value = !isPlaying.value
  isPlaying.value ? startAutoplay() : stopAutoplay()
}

// ─── Progress ─────────────────────────────────────────
function startProgress() {
  progressPct.value = 0
  clearInterval(progressTimer)
  const step = 100 / (INTERVAL / 50)
  progressTimer = setInterval(() => {
    progressPct.value = Math.min(progressPct.value + step, 100)
  }, 50)
}
function resetProgress() {
  progressPct.value = 0
  if (isPlaying.value) startAutoplay()
}

// ─── Dialog ───────────────────────────────────────────
function openSlide(slide) {
  selectedSlide.value = slide
  dialogVisible.value = true
}

// ─── Keyboard ─────────────────────────────────────────
function onKey(e) {
  if (e.key === 'ArrowLeft')  prev()
  if (e.key === 'ArrowRight') next()
}

onMounted(() => {
  startAutoplay()
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  stopAutoplay()
  window.removeEventListener('keydown', onKey)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,300&display=swap');

/* ── Tokens ── */
.main-carousel {
  --gold:   #c4922a;
  --gold-l: #e8b94f;
  --rust:   #8b3a1e;
  --sage:   #3a5c3a;
  --navy:   #1e3a5c;
  --blue:   #1a3a5c;
  --ink:    #1a1208;
  --dark:   #0e0c10;

  position: relative;
  width: 100%;
  background: var(--dark);
  overflow: hidden;
  font-family: 'Source Serif 4', Georgia, serif;
  user-select: none;
}

/* ── Slide wrapper ── */
.slides-wrap  { position: relative; width: 100%; height: clamp(480px, 72vh, 700px); }
.slides-inner { position: relative; width: 100%; height: 100%; }

/* ── Single slide ── */
.slide {
  position: absolute; inset: 0;
  display: flex; align-items: center;
}

/* ── Background ── */
.slide-bg { position: absolute; inset: 0; }
.slide-img {
  width: 100%; height: 100%; object-fit: cover;
  filter: brightness(.32) saturate(.7);
  transition: transform 8s ease;
}
.slide:hover .slide-img { transform: scale(1.04); }

/* Gradient by accent */
.slide-gradient {
  position: absolute; inset: 0;
}
.slide-gradient.blue  { background: linear-gradient(110deg, rgba(26,58,92,.95) 0%, rgba(14,12,16,.65) 55%, rgba(14,12,16,.35) 100%); }
.slide-gradient.gold  { background: linear-gradient(110deg, rgba(80,50,10,.95) 0%, rgba(14,12,16,.65) 55%, rgba(14,12,16,.35) 100%); }
.slide-gradient.rust  { background: linear-gradient(110deg, rgba(90,25,10,.95) 0%, rgba(14,12,16,.65) 55%, rgba(14,12,16,.35) 100%); }
.slide-gradient.sage  { background: linear-gradient(110deg, rgba(20,55,30,.95) 0%, rgba(14,12,16,.65) 55%, rgba(14,12,16,.35) 100%); }
.slide-gradient.navy  { background: linear-gradient(110deg, rgba(15,35,70,.95) 0%, rgba(14,12,16,.65) 55%, rgba(14,12,16,.35) 100%); }

.slide-noise {
  position: absolute; inset: 0;
  background-image: radial-gradient(circle, rgba(255,255,255,.03) 1px, transparent 1px);
  background-size: 22px 22px;
}

/* ── SVG Ornament ── */
.slide-ornament {
  position: absolute; right: -40px; top: 50%;
  transform: translateY(-50%);
  width: clamp(220px, 32vw, 380px);
  opacity: .5; pointer-events: none;
}
.slide-ornament svg { width: 100%; height: auto; }

/* ── Content ── */
.slide-content {
  position: relative; z-index: 2;
  width: 100%;
  padding: 0 clamp(1.5rem, 6vw, 5rem);
}
.slide-inner { max-width: 620px; }

/* Tag */
.slide-tag {
  display: inline-flex; align-items: center; gap: .5rem;
  font-size: .7rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase;
  color: var(--gold-l); margin-bottom: .85rem;
}
.tag-icon {
  width: 26px; height: 26px; border-radius: 50%;
  background: rgba(196,146,42,.18); border: 1px solid rgba(196,146,42,.35);
  display: flex; align-items: center; justify-content: center; font-size: .72rem; color: var(--gold-l);
}

/* Class badge */
.class-badge {
  display: inline-block;
  font-size: .68rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
  color: rgba(255,255,255,.55); background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.15);
  padding: .22rem .75rem; border-radius: 2px; margin-bottom: 1rem;
}

/* Title */
.slide-title {
  font-family: 'Playfair Display', serif;
  font-size: clamp(1.6rem, 3vw, 2.65rem);
  font-weight: 900; color: #fff; line-height: 1.2;
  margin: 0 0 .9rem;
  text-shadow: 0 2px 20px rgba(0,0,0,.4);
}

/* Subtitle */
.slide-subtitle {
  font-size: clamp(.82rem, 1.3vw, 1rem);
  color: rgba(255,255,255,.68); line-height: 1.65;
  font-style: italic; margin: 0 0 1.1rem; max-width: 540px;
}

/* Key points */
.slide-points {
  list-style: none; margin: 0 0 1.5rem; padding: 0;
  display: flex; flex-direction: column; gap: .45rem;
}
.slide-points li {
  display: flex; align-items: center; gap: .55rem;
  font-size: .82rem; color: rgba(255,255,255,.72);
}
.slide-points li i { color: var(--gold-l); font-size: .78rem; flex-shrink: 0; }

/* CTA */
.slide-cta { display: flex; align-items: center; gap: .85rem; flex-wrap: wrap; }
.cta-primary {
  display: inline-flex; align-items: center; gap: .55rem;
  background: var(--gold); color: #fff; border: none;
  padding: .72rem 1.65rem; border-radius: 2px;
  font-family: 'Source Serif 4', serif; font-size: .9rem; font-weight: 700;
  cursor: pointer; transition: background .25s, transform .2s;
}
.cta-primary:hover { background: var(--gold-l); transform: translateY(-1px); }
.cta-secondary {
  display: inline-flex; align-items: center; gap: .45rem;
  background: transparent; border: 1.5px solid rgba(255,255,255,.3);
  color: rgba(255,255,255,.75); padding: .68rem 1.2rem; border-radius: 2px;
  font-family: 'Source Serif 4', serif; font-size: .85rem;
  cursor: pointer; transition: border-color .2s, color .2s;
}
.cta-secondary:hover { border-color: var(--gold); color: var(--gold-l); }

/* ── Info card ── */
.slide-info-card {
  position: absolute; right: clamp(1.5rem, 5vw, 4rem); top: 50%;
  transform: translateY(-50%); z-index: 3;
  background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12);
  backdrop-filter: blur(12px); border-radius: 3px;
  padding: 1.25rem 1.4rem; min-width: 180px; max-width: 220px;
}
.sic-icon {
  width: 44px; height: 44px; border-radius: 50%;
  background: rgba(196,146,42,.2); border: 1px solid rgba(196,146,42,.4);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem; color: var(--gold-l); margin-bottom: .85rem;
}
.sic-label { font-size: .65rem; color: rgba(255,255,255,.38); text-transform: uppercase; letter-spacing: .1em; margin: 0 0 .2rem; }
.sic-value { font-family: 'Playfair Display', serif; font-size: 1.05rem; font-weight: 700; color: #fff; margin: 0 0 .85rem; }
.sic-sep   { height: 1px; background: rgba(255,255,255,.1); margin-bottom: .75rem; }
.sic-meta  { display: flex; flex-direction: column; gap: .35rem; }
.sic-meta span { font-size: .7rem; color: rgba(255,255,255,.5); display: flex; align-items: center; gap: .35rem; }
.sic-meta i { color: var(--gold); font-size: .65rem; }

@media(max-width: 900px) { .slide-info-card { display: none; } }

/* ── Slide number badge ── */
.slide-num-badge {
  position: absolute; left: clamp(1.5rem, 5vw, 4rem); bottom: 2.5rem;
  z-index: 3; display: flex; align-items: baseline; gap: .3rem;
}
.snb-cur   { font-family: 'Playfair Display', serif; font-size: 2.5rem; font-weight: 900; color: rgba(255,255,255,.12); line-height: 1; }
.snb-sep   { font-size: 1rem; color: rgba(255,255,255,.1); }
.snb-total { font-size: .9rem; color: rgba(255,255,255,.1); }

/* ── Progress bar ── */
.progress-rail {
  height: 3px; background: rgba(255,255,255,.1);
  position: relative; z-index: 10;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--gold), var(--gold-l));
}

/* ── Controls ── */
.carousel-controls {
  position: absolute; bottom: 1.5rem; left: 50%; transform: translateX(-50%);
  z-index: 10;
  display: flex; align-items: center; gap: .75rem;
  background: rgba(14,12,16,.65); backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 2px; padding: .45rem .9rem;
}
.ctrl-arrow {
  width: 30px; height: 30px; background: none; border: none;
  color: rgba(255,255,255,.5); font-size: .8rem; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  border-radius: 1px; transition: color .2s, background .2s;
}
.ctrl-arrow:hover { color: var(--gold-l); background: rgba(196,146,42,.12); }

.ctrl-dots { display: flex; gap: .4rem; align-items: center; }
.ctrl-dot  {
  height: 3px; width: 20px; border-radius: 2px;
  background: rgba(255,255,255,.25); border: none;
  cursor: pointer; padding: 0; transition: all .28s;
}
.ctrl-dot.active { width: 36px; background: var(--gold); }

.ctrl-playpause {
  background: none; border: none;
  color: rgba(255,255,255,.4); font-size: .75rem;
  cursor: pointer; padding: .2rem .3rem;
  border-left: 1px solid rgba(255,255,255,.12); margin-left: .2rem; padding-left: .65rem;
  transition: color .2s;
}
.ctrl-playpause:hover { color: var(--gold-l); }

/* ── Thumbnail strip ── */
.thumb-strip {
  display: flex; gap: 0;
  background: rgba(5,4,6,.9);
  border-top: 1px solid rgba(196,146,42,.18);
}
.thumb-item {
  flex: 1; position: relative; height: 82px;
  overflow: hidden; border: none; cursor: pointer; padding: 0;
  border-right: 1px solid rgba(255,255,255,.05);
  transition: flex .4s ease;
}
.thumb-item.active { flex: 1.7; }
.thumb-item:last-child { border-right: none; }

.thumb-img {
  width: 100%; height: 100%; object-fit: cover;
  filter: brightness(.28) saturate(.5);
  transition: filter .3s;
}
.thumb-item.active .thumb-img { filter: brightness(.45) saturate(.8); }
.thumb-item:hover .thumb-img  { filter: brightness(.38) saturate(.7); }

.thumb-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(14,12,16,.85), transparent 55%);
}

.thumb-body {
  position: absolute; bottom: .5rem; left: .6rem; right: .6rem;
}
.thumb-tag {
  display: block; font-size: .58rem; font-weight: 700;
  letter-spacing: .09em; text-transform: uppercase;
  color: var(--gold); margin-bottom: .15rem;
}
.thumb-title {
  display: block; font-size: .72rem; color: rgba(255,255,255,.75);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  transition: color .25s;
}
.thumb-item.active .thumb-title { color: var(--gold-l); font-weight: 600; }

.thumb-active-line {
  position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
  background: var(--gold); opacity: 0; transition: opacity .3s;
}
.thumb-item.active .thumb-active-line { opacity: 1; }

/* ── Slide transitions ── */
.slide-anim-enter-active,
.slide-anim-leave-active { transition: opacity .55s ease, transform .55s ease; }
.slide-anim-enter-from   { opacity: 0; transform: translateX(30px); }
.slide-anim-leave-to     { opacity: 0; transform: translateX(-30px); }

/* ── Dialog ── */
.dialog-hero   { width: 100%; height: 240px; object-fit: cover; border-radius: 2px; margin-bottom: 1rem; }
.dialog-meta   { display: flex; flex-wrap: wrap; align-items: center; gap: .65rem; margin-bottom: 1rem; font-size: .8rem; color: #7a6a52; }
.dm-item i     { margin-right: .25rem; }
.dialog-text   { font-family: 'Source Serif 4', serif; font-size: .92rem; color: #3a2a15; line-height: 1.75; margin-bottom: 1rem; font-style: italic; }
.dialog-points { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .5rem; }
.dialog-points li { display: flex; align-items: center; gap: .5rem; font-size: .85rem; color: #3a2a15; }
.dialog-points li i { color: #3a5c3a; font-size: .82rem; }

/* ── Responsive ── */
@media(max-width: 640px) {
  .snb-cur, .snb-sep, .snb-total { display: none; }
  .slide-content { padding: 0 1.25rem; }
  .thumb-item { height: 62px; }
  .carousel-controls { bottom: 1rem; gap: .45rem; padding: .35rem .6rem; }
}
</style>