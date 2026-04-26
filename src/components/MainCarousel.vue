<template>
  <section class="main-carousel" aria-label="Басты слайдер">
    <!-- Slides -->
    <div class="slides-wrapper">
      <transition-group name="slide-fade" tag="div" class="slides-inner">
        <div
            v-for="(slide, i) in slides"
            v-show="i === current"
            :key="slide.id"
            class="slide"
        >
          <!-- Background image -->
          <div class="slide-bg">
            <img :src="slide.image" :alt="slide.title" class="slide-img" />
            <div class="slide-gradient" />
            <!-- Decorative ornament overlay -->
            <div class="slide-ornament-bg">
              <svg viewBox="0 0 400 400" class="ornament-svg" aria-hidden="true">
                <polygon points="200,10 390,105 390,295 200,390 10,295 10,105" fill="none" stroke="rgba(196,146,42,0.18)" stroke-width="1.5"/>
                <polygon points="200,40 360,120 360,280 200,360 40,280 40,120" fill="none" stroke="rgba(196,146,42,0.10)" stroke-width="1"/>
                <circle cx="200" cy="200" r="120" fill="none" stroke="rgba(196,146,42,0.08)" stroke-width="1"/>
              </svg>
            </div>
          </div>

          <!-- Content -->
          <div class="slide-content">
            <div class="slide-inner">
              <div class="slide-eyebrow">
                <span class="eyebrow-line" />
                <span class="eyebrow-text">{{ slide.category }}</span>
                <span class="eyebrow-line" />
              </div>

              <h1 class="slide-title">{{ slide.title }}</h1>

              <p class="slide-subtitle">{{ slide.subtitle }}</p>

              <div class="slide-meta">
                <span class="meta-item">
                  <i class="pi pi-user" />
                  {{ slide.author }}
                </span>
                <span class="meta-sep">·</span>
                <span class="meta-item">
                  <i class="pi pi-calendar" />
                  {{ slide.date }}
                </span>
              </div>

              <div class="slide-actions">
                <button class="btn-primary" @click="openSlide(slide)">
                  <span>Толығырақ оқу</span>
                  <i class="pi pi-arrow-right" />
                </button>
              </div>
            </div>
          </div>

          <!-- Side badge -->
          <div class="slide-badge">
            <span class="badge-num">{{ String(i + 1).padStart(2, '0') }}</span>
            <span class="badge-label">{{ slide.badge }}</span>
          </div>
        </div>
      </transition-group>
    </div>

    <!-- Progress bar -->
    <div class="progress-bar">
      <div
          class="progress-fill"
          :style="{ width: progressWidth + '%', transition: autoplay ? `width ${interval}ms linear` : 'none' }"
      />
    </div>

    <!-- Controls -->
    <div class="carousel-controls">
      <!-- Prev / Next -->
      <button class="ctrl-arrow ctrl-prev" @click="prev" aria-label="Алдыңғы">
        <i class="pi pi-chevron-left" />
      </button>

      <!-- Dots -->
      <div class="dots">
        <button
            v-for="(slide, i) in slides"
            :key="slide.id"
            class="dot"
            :class="{ active: i === current }"
            @click="goTo(i)"
            :aria-label="`Слайд ${i + 1}`"
        />
      </div>

      <!-- Next -->
      <button class="ctrl-arrow ctrl-next" @click="next" aria-label="Келесі">
        <i class="pi pi-chevron-right" />
      </button>

      <!-- Autoplay toggle -->
      <button class="ctrl-play" @click="toggleAutoplay" :aria-label="autoplay ? 'Тоқтату' : 'Ойнату'">
        <i :class="autoplay ? 'pi pi-pause' : 'pi pi-play'" />
      </button>
    </div>

    <!-- Thumbnail strip -->
    <div class="thumb-strip">
      <button
          v-for="(slide, i) in slides"
          :key="'th-' + slide.id"
          class="thumb"
          :class="{ active: i === current }"
          @click="goTo(i)"
      >
        <img :src="slide.image" :alt="slide.title" class="thumb-img" />
        <div class="thumb-overlay" />
        <span class="thumb-title">{{ slide.shortTitle }}</span>
      </button>
    </div>

    <!-- Dialog -->
    <Dialog
        v-model:visible="dialogVisible"
        :header="selectedSlide?.title"
        :style="{ width: '720px', maxWidth: '95vw' }"
        modal
        class="slide-dialog"
    >
      <div v-if="selectedSlide" class="dialog-body">
        <img :src="selectedSlide.image" :alt="selectedSlide.title" class="dialog-hero" />
        <div class="dialog-meta-row">
          <Tag :value="selectedSlide.category" severity="warning" />
          <span class="dmeta"><i class="pi pi-user" /> {{ selectedSlide.author }}</span>
          <span class="dmeta"><i class="pi pi-calendar" /> {{ selectedSlide.date }}</span>
        </div>
        <p class="dialog-text">{{ selectedSlide.body }}</p>
      </div>
    </Dialog>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'

// ─── Data ───────────────────────────────────────────────
const slides = [
  {
    id: 1,
    category: 'Ұлы Дала Поэзиясы',
    badge: 'Таңдаулы',
    shortTitle: 'Абай мұрасы',
    title: 'Абайдың сөз өнері — рухани байлығымыздың бастауы',
    subtitle: 'Ұлы ақын Абай Құнанбайұлының өлеңдері мен қарасөздері бүгін де жүректерге жол табады.',
    author: 'Мұхтар Мағауин',
    date: '24 сәуір, 2026',
    image: 'https://images.unsplash.com/photo-1476820865390-c52aeebb9891?w=1400&q=85',
    body: 'Абай Құнанбайұлы қазақ халқының ұлы ақыны, ағартушысы және философы болды. Оның шығармашылығы ғасырлар бойы ұмытылмас із қалдырды. Абайдың өлеңдері мен қарасөздері бүгінгі ұрпаққа рухани азық болып табылады.',
  },
  {
    id: 2,
    category: 'Жаңа Проза',
    badge: 'Танымал',
    shortTitle: 'Заманауи роман',
    title: '«Боран» — заманауи қазақ прозасының жаңа шыңы',
    subtitle: 'Жас жазушы Нұрлан Қабылбековтіңебедейсіз романы оқырмандар мен сыншылар назарын аударды.',
    author: 'Зарина Нұрланова',
    date: '21 сәуір, 2026',
    image: 'https://images.unsplash.com/photo-1515705576963-95cad62945b6?w=1400&q=85',
    body: '«Боран» романы қазіргі қазақ қоғамының шындығын шебер суреттейді. Автор өзінің бірінші ірі шығармасында-ақ кемел стиль мен тереңдікті танытты. Роман жарыққа шыққаннан бері бестселлер болып саналады.',
  },
  {
    id: 3,
    category: 'Іс-шара',
    badge: 'Маңызды',
    shortTitle: 'Абай оқулары',
    title: 'Абай оқулары — 2026: Дүние жүзі ғалымдары Алматыда',
    subtitle: '15 елден 200-ден астам зерттеуші қатысқан халықаралық конференция аяқталды.',
    author: 'Айгүл Сейткали',
    date: '19 сәуір, 2026',
    image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1400&q=85',
    body: 'Алматыда өткен «Абай оқулары — 2026» конференциясы ғылыми ортада үлкен қызығушылық тудырды. Шетелдік ғалымдар қазақ әдебиетінің жаһандық маңызы туралы баяндамалар жасады.',
  },
  {
    id: 4,
    category: 'Мұрағат жаңалығы',
    badge: 'Жаңалық',
    shortTitle: 'Мұқағали өлеңдері',
    title: 'Мұқағали Мақатаевтың жаңадан табылған он жеті өлеңі',
    subtitle: 'Ұлы ақынның жеке мұрағатынан бұрын жарияланбаған шығармалар анықталды.',
    author: 'Берік Әшімов',
    date: '17 сәуір, 2026',
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1400&q=85',
    body: 'Зерттеушілер Мұқағали Мақатаевтың жеке мұрағатын зерттей отырып, бұрын белгісіз болған он жеті өлеңді тапты. Бұл табылым қазақ поэзиясы тарихы үшін баға жетпес олжа болды.',
  },
]

// ─── State ──────────────────────────────────────────────
const current   = ref(0)
const autoplay  = ref(true)
const interval  = 5000
let   timer     = null
const progressWidth  = ref(0)
let   progressTimer  = null

const dialogVisible  = ref(false)
const selectedSlide  = ref(null)

// ─── Navigation ─────────────────────────────────────────
function next() {
  current.value = (current.value + 1) % slides.length
  resetProgress()
}
function prev() {
  current.value = (current.value - 1 + slides.length) % slides.length
  resetProgress()
}
function goTo(i) {
  current.value = i
  resetProgress()
}

// ─── Autoplay ───────────────────────────────────────────
function startAutoplay() {
  stopAutoplay()
  timer = setInterval(next, interval)
  startProgress()
}
function stopAutoplay() {
  clearInterval(timer)
  clearInterval(progressTimer)
}
function toggleAutoplay() {
  autoplay.value = !autoplay.value
  autoplay.value ? startAutoplay() : stopAutoplay()
}

// ─── Progress bar ───────────────────────────────────────
function startProgress() {
  progressWidth.value = 0
  clearInterval(progressTimer)
  const step = 100 / (interval / 50)
  progressTimer = setInterval(() => {
    progressWidth.value = Math.min(progressWidth.value + step, 100)
  }, 50)
}
function resetProgress() {
  progressWidth.value = 0
  if (autoplay.value) startAutoplay()
}

// ─── Dialog ─────────────────────────────────────────────
function openSlide(slide) {
  selectedSlide.value = slide
  dialogVisible.value = true
}

// ─── Lifecycle ──────────────────────────────────────────
onMounted(() => startAutoplay())
onBeforeUnmount(() => stopAutoplay())
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Source+Serif+4:ital,wght@0,300;0,400;1,300&display=swap');

/* ─── Tokens ─── */
.main-carousel {
  --ink:       #1a1208;
  --parchment: #faf6ef;
  --gold:      #c4922a;
  --gold-l:    #e8b94f;
  --rust:      #8b3a1e;
  --border:    rgba(196,146,42,.35);
  --shadow:    0 8px 40px rgba(26,18,8,.45);

  position: relative;
  width: 100%;
  background: var(--ink);
  overflow: hidden;
  font-family: 'Source Serif 4', Georgia, serif;
  user-select: none;
}

/* ─── Slide wrapper ─── */
.slides-wrapper { position: relative; width: 100%; height: clamp(480px, 72vh, 700px); }
.slides-inner   { position: relative; width: 100%; height: 100%; }

/* ─── Single slide ─── */
.slide {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
}

/* ─── Background ─── */
.slide-bg { position: absolute; inset: 0; }
.slide-img {
  width: 100%; height: 100%;
  object-fit: cover;
  filter: brightness(.45) saturate(.8);
  transition: transform 8s ease;
}
.slide:hover .slide-img { transform: scale(1.04); }

.slide-gradient {
  position: absolute; inset: 0;
  background:
      linear-gradient(100deg, rgba(26,18,8,.92) 0%, rgba(26,18,8,.6) 55%, rgba(26,18,8,.2) 100%),
      linear-gradient(to top, rgba(26,18,8,.7) 0%, transparent 40%);
}

/* ─── Ornament SVG ─── */
.slide-ornament-bg {
  position: absolute;
  right: -60px; top: 50%;
  transform: translateY(-50%);
  width: clamp(280px, 38vw, 480px);
  opacity: .6;
  pointer-events: none;
}
.ornament-svg { width: 100%; height: auto; }

/* ─── Content ─── */
.slide-content {
  position: relative; z-index: 2;
  width: 100%;
  padding: 0 clamp(1.5rem, 6vw, 5rem);
}
.slide-inner { max-width: 600px; }

/* Eyebrow */
.slide-eyebrow {
  display: flex; align-items: center; gap: .75rem;
  margin-bottom: 1.25rem;
}
.eyebrow-line {
  display: block; height: 1px; width: 40px;
  background: var(--gold);
}
.eyebrow-text {
  font-size: .75rem;
  font-weight: 700;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--gold-l);
}

/* Title */
.slide-title {
  font-family: 'Playfair Display', serif;
  font-size: clamp(1.75rem, 3.5vw, 3rem);
  font-weight: 900;
  color: #fff;
  line-height: 1.15;
  margin: 0 0 1rem;
  text-shadow: 0 2px 20px rgba(0,0,0,.4);
}

/* Subtitle */
.slide-subtitle {
  font-size: clamp(.875rem, 1.4vw, 1.05rem);
  color: rgba(255,255,255,.78);
  line-height: 1.65;
  font-style: italic;
  margin: 0 0 1.25rem;
  max-width: 520px;
}

/* Meta */
.slide-meta {
  display: flex; flex-wrap: wrap; align-items: center; gap: .5rem;
  font-size: .8rem;
  color: rgba(255,255,255,.55);
  margin-bottom: 2rem;
}
.meta-item i { margin-right: .3rem; }
.meta-sep { color: var(--gold); }

/* Actions */
.slide-actions { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }

.btn-primary {
  display: inline-flex; align-items: center; gap: .6rem;
  background: var(--gold);
  color: #fff;
  border: none;
  padding: .7rem 1.6rem;
  font-family: 'Source Serif 4', serif;
  font-size: .9rem;
  font-weight: 600;
  letter-spacing: .03em;
  border-radius: 2px;
  cursor: pointer;
  transition: background .25s, gap .2s;
}
.btn-primary:hover { background: var(--gold-l); gap: .9rem; }

.btn-ghost {
  display: inline-flex; align-items: center; gap: .45rem;
  background: transparent;
  border: 1.5px solid rgba(255,255,255,.35);
  color: rgba(255,255,255,.75);
  padding: .65rem 1.2rem;
  font-family: 'Source Serif 4', serif;
  font-size: .85rem;
  border-radius: 2px;
  cursor: pointer;
  transition: border-color .25s, color .25s;
}
.btn-ghost:hover { border-color: var(--gold); color: var(--gold-l); }

/* ─── Side badge ─── */
.slide-badge {
  position: absolute;
  right: clamp(1.5rem, 4vw, 3.5rem);
  bottom: clamp(5rem, 11vh, 8rem);
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .3rem;
}
.badge-num {
  font-family: 'Playfair Display', serif;
  font-size: 3.5rem;
  font-weight: 900;
  color: rgba(196,146,42,.22);
  line-height: 1;
}
.badge-label {
  font-size: .65rem;
  letter-spacing: .15em;
  text-transform: uppercase;
  color: var(--gold);
  border: 1px solid var(--border);
  padding: .2rem .55rem;
  border-radius: 1px;
}

/* ─── Progress bar ─── */
.progress-bar {
  position: absolute;
  bottom: 0; left: 0;
  width: 100%; height: 2px;
  background: rgba(255,255,255,.12);
  z-index: 10;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--gold), var(--gold-l));
}

/* ─── Controls ─── */
.carousel-controls {
  position: absolute;
  bottom: 1.5rem; left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(26,18,8,.55);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border);
  border-radius: 2px;
  padding: .45rem .85rem;
}

.ctrl-arrow {
  background: none; border: none;
  color: rgba(255,255,255,.6);
  font-size: .85rem;
  cursor: pointer;
  padding: .2rem .35rem;
  border-radius: 1px;
  transition: color .2s;
}
.ctrl-arrow:hover { color: var(--gold-l); }

.dots { display: flex; gap: .45rem; align-items: center; }
.dot {
  width: 22px; height: 2px;
  background: rgba(255,255,255,.3);
  border: none;
  border-radius: 1px;
  cursor: pointer;
  padding: 0;
  transition: background .25s, width .25s;
}
.dot.active { background: var(--gold); width: 36px; }

.ctrl-play {
  background: none; border: none;
  color: rgba(255,255,255,.5);
  font-size: .8rem;
  cursor: pointer;
  padding: .2rem .3rem;
  border-left: 1px solid rgba(255,255,255,.15);
  margin-left: .2rem;
  padding-left: .7rem;
  transition: color .2s;
}
.ctrl-play:hover { color: var(--gold-l); }

/* ─── Thumbnail strip ─── */
.thumb-strip {
  display: flex;
  gap: 0;
  background: rgba(10,7,3,.9);
  border-top: 1px solid var(--border);
}

.thumb {
  flex: 1;
  position: relative;
  height: 80px;
  overflow: hidden;
  border: none;
  cursor: pointer;
  padding: 0;
  border-right: 1px solid rgba(196,146,42,.15);
  transition: flex .35s ease;
}
.thumb:last-child { border-right: none; }
.thumb.active     { flex: 1.6; }

.thumb-img {
  width: 100%; height: 100%;
  object-fit: cover;
  filter: brightness(.35) saturate(.6);
  transition: filter .3s;
}
.thumb.active .thumb-img { filter: brightness(.55) saturate(.85); }
.thumb:hover .thumb-img  { filter: brightness(.45) saturate(.75); }

.thumb-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(26,18,8,.8) 0%, transparent 60%);
}
.thumb.active .thumb-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  border: 1.5px solid var(--gold);
  pointer-events: none;
}

.thumb-title {
  position: absolute;
  bottom: .5rem; left: .6rem; right: .6rem;
  font-size: .68rem;
  color: rgba(255,255,255,.75);
  font-family: 'Source Serif 4', serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color .25s;
}
.thumb.active .thumb-title { color: var(--gold-l); font-weight: 600; }

/* ─── Transitions ─── */
.slide-fade-enter-active,
.slide-fade-leave-active { transition: opacity .6s ease, transform .6s ease; }
.slide-fade-enter-from   { opacity: 0; transform: translateX(30px); }
.slide-fade-leave-to     { opacity: 0; transform: translateX(-30px); }

/* ─── Dialog ─── */
.dialog-hero {
  width: 100%; height: 280px;
  object-fit: cover;
  border-radius: 2px;
  margin-bottom: 1rem;
}
.dialog-meta-row {
  display: flex; flex-wrap: wrap; align-items: center; gap: .75rem;
  margin-bottom: 1rem;
  font-size: .82rem; color: #7a6a52;
}
.dmeta i { margin-right: .3rem; }
.dialog-text {
  font-family: 'Source Serif 4', serif;
  font-size: .95rem; color: #3a2a15;
  line-height: 1.75;
  margin-bottom: 1rem;
}

/* ─── Responsive ─── */
@media (max-width: 640px) {
  .slide-badge { display: none; }
  .slide-ornament-bg { opacity: .25; right: -100px; }
  .thumb { height: 60px; }
  .carousel-controls { bottom: 1rem; gap: .6rem; padding: .35rem .6rem; }
}
</style>