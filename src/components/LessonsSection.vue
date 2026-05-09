<script setup>
import { ref, computed } from 'vue'
import Dialog from 'primevue/dialog'
import {useRouter} from "vue-router";

// ─── Type config ──────────────────────────────────────
const types = [
  { key: 'all',   label: 'Барлығы',     icon: 'pi-th-large'  },
  { key: 'video', label: 'Видео сабақ', icon: 'pi-play-circle' },
  { key: 'text',  label: 'Конспект',    icon: 'pi-file-edit'  },
  { key: 'pdf',   label: 'PDF',         icon: 'pi-file-pdf'   },
]
const router = useRouter()

const typeIcons  = { video: 'pi-play-circle', text: 'pi-file-edit', pdf: 'pi-file-pdf' }
const typeLabels = { video: 'Видео', text: 'Конспект', pdf: 'PDF' }

function typeIcon(t)  { return typeIcons[t]  || 'pi-book' }
function typeLabel(t) { return typeLabels[t] || t }

// ─── Topics ───────────────────────────────────────────
const topics = [
  { key: 'all',       label: 'Барлығы',           color: '#c4922a' },
  { key: 'classic',   label: 'Классика',           color: '#8b3a1e' },
  { key: 'poetry',    label: 'Поэзия',             color: '#4a5e4c' },
  { key: 'prose',     label: 'Проза',              color: '#2a3a5c' },
  { key: 'history',   label: 'Тарихи әдебиет',    color: '#5c3a1e' },
  { key: 'modern',    label: 'Заманауи әдебиет',   color: '#3a5a4a' },
  { key: 'theory',    label: 'Әдебиет теориясы',  color: '#5a3a5a' },
]

function topicColor(key) { return topics.find(t => t.key === key)?.color || '#c4922a' }
function topicName(key)  { return topics.find(t => t.key === key)?.label || key }

// ─── Level ────────────────────────────────────────────
const levelLabels = { beginner: 'Бастауыш', intermediate: 'Орта', advanced: 'Жоғары' }
function levelLabel(l) { return levelLabels[l] || l }

// ─── Data ─────────────────────────────────────────────
const lessons = ref([
  {
    id: 1, type: 'video', topic: 'classic', level: 'beginner',
    title: 'Абай Құнанбайұлының өмірі мен шығармашылығы',
    description: 'Ұлы ақынның туған жылынан бастап соңғы туындыларына дейінгі толық шығармашылық жолы.',
    author: 'Айгүл Сейткали', date: '20 сәуір, 2026', duration: '45:20', views: '12 840',
    rating: 4.9, progress: 65, featured: true,
    thumb: 'https://images.unsplash.com/photo-1476820865390-c52aeebb9891?w=800&q=80',
  },
  {
    id: 2, type: 'text', topic: 'poetry', level: 'intermediate',
    title: 'Мұқағали Мақатаев лирикасының ерекшеліктері',
    description: 'Ақынның поэтикалық тілі, образ жүйесі және лирикалық кейіпкері туралы толық конспект.',
    author: 'Берік Әшімов', date: '18 сәуір, 2026', duration: '25 мин', views: '8 210',
    rating: 4.8, progress: null,
    thumb: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&q=80',
  },
  {
    id: 3, type: 'pdf', topic: 'prose', level: 'advanced',
    title: '«Абай жолы» эпопеясының тақырыптық-идеялық мазмұны',
    description: 'Мұхтар Әуезовтің шедеврін тереңнен талдайтын ғылыми-әдістемелік материал.',
    author: 'Зарина Нұрланова', date: '15 сәуір, 2026', duration: '48 бет', views: '5 630',
    rating: 4.7, progress: 30,
    thumb: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80',
  },
  {
    id: 4, type: 'video', topic: 'history', level: 'intermediate',
    title: 'Қазақ эпостарының жанрлық ерекшеліктері',
    description: '«Қобыланды батыр», «Алпамыс», «Ер Тарғын» эпостарының салыстырмалы талдауы.',
    author: 'Мадина Оспанова', date: '12 сәуір, 2026', duration: '38:45', views: '7 480',
    rating: 4.6, progress: null,
    thumb: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600&q=80',
  },
  {
    id: 5, type: 'text', topic: 'theory', level: 'beginner',
    title: 'Әдебиет теориясының негізгі ұғымдары',
    description: 'Жанр, стиль, тақырып, идея — әдебиеттану ғылымының іргелі ұғымдарына кіріспе.',
    author: 'Асем Бекова', date: '10 сәуір, 2026', duration: '15 мин', views: '9 920',
    rating: 4.5, progress: 100,
    thumb: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600&q=80',
  },
  {
    id: 6, type: 'pdf', topic: 'modern', level: 'intermediate',
    title: 'Заманауи қазақ прозасы: тенденциялар мен бағыттар',
    description: '2000–2020 жылдардағы прозалық туындыларды жүйелі талдайтын оқу құралы.',
    author: 'Дина Сәрсенова', date: '8 сәуір, 2026', duration: '62 бет', views: '4 150',
    rating: 4.4, progress: null,
    thumb: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=600&q=80',
  },
  {
    id: 7, type: 'video', topic: 'poetry', level: 'advanced',
    title: 'Фариза Оңғарсынова: феминдік поэзияның дауысы',
    description: 'Ақынның шығармашылық портреті, эстетикасы және қазақ поэзиясына қосқан үлесі.',
    author: 'Айгүл Сейткали', date: '5 сәуір, 2026', duration: '52:10', views: '6 300',
    rating: 4.9, progress: null,
    thumb: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&q=80',
  },
  {
    id: 8, type: 'text', topic: 'classic', level: 'beginner',
    title: 'Абайдың қара сөздері: мазмұны мен маңызы',
    description: 'Отыз сегіз қара сөздің қысқаша талдауы — мектеп пен жоғары оқу орындарына арналған.',
    author: 'Берік Әшімов', date: '3 сәуір, 2026', duration: '20 мин', views: '11 440',
    rating: 4.8, progress: null,
    thumb: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&q=80',
  },
])

// ─── State ────────────────────────────────────────────
const activeType  = ref('all')
const activeTopic = ref('all')
const search      = ref('')
const dialogVisible  = ref(false)
const selectedLesson = ref(null)

// ─── Derived ──────────────────────────────────────────
const topicList = computed(() => topics.map(t => ({
  ...t,
  cnt: t.key === 'all'
      ? lessons.value.length
      : lessons.value.filter(l => l.topic === t.key).length,
})))

const featured = computed(() => lessons.value.find(l => l.featured))

const filteredLessons = computed(() => {
  let list = lessons.value.filter(l => !l.featured)
  if (activeType.value  !== 'all') list = list.filter(l => l.type  === activeType.value)
  if (activeTopic.value !== 'all') list = list.filter(l => l.topic === activeTopic.value)
  if (search.value.trim())
    list = list.filter(l =>
        l.title.toLowerCase().includes(search.value.toLowerCase()) ||
        l.author.toLowerCase().includes(search.value.toLowerCase())
    )
  return list
})

function countByType(key)  { return key === 'all' ? lessons.value.length : lessons.value.filter(l => l.type  === key).length }
function countByTopic(key) { return key === 'all' ? lessons.value.length : lessons.value.filter(l => l.topic === key).length }

// ─── Stats ────────────────────────────────────────────
const stats = [
  { icon: 'pi-play-circle', val: '24', label: 'Видео сабақ' },
  { icon: 'pi-file-edit',   val: '38', label: 'Конспект'    },
  { icon: 'pi-file-pdf',    val: '16', label: 'PDF файл'    },
  { icon: 'pi-users',       val: '4 200+', label: 'Оқушы'  },
]

// ─── Actions ──────────────────────────────────────────
function openLesson(lesson) {

  router.push({ name: 'lesson-detail', params: { id: lesson.id } })
}
</script>
<template>
  <section class="lessons-section">

    <!-- ══ HEADER ══════════════════════════════════════ -->
    <div class="section-header">
      <div class="orn-row">
        <span class="orn-line" /><span class="orn-diamond">◆</span><span class="orn-line" />
      </div>
      <h2 class="section-title">
        <span class="title-kz">Сабақтар</span>
      </h2>
      <p class="section-sub">Қазақ әдебиеті бойынша жүйеленген оқу материалдары</p>

      <!-- Stats row -->
      <div class="stats-row">
        <div class="stat-chip" v-for="s in stats" :key="s.label">
          <i :class="'pi ' + s.icon" />
          <span class="stat-val">{{ s.val }}</span>
          <span class="stat-label">{{ s.label }}</span>
        </div>
      </div>
    </div>

    <!-- ══ TYPE TABS ════════════════════════════════════ -->
    <div class="type-tabs">
      <button
          v-for="t in types"
          :key="t.key"
          class="type-tab"
          :class="{ active: activeType === t.key }"
          @click="activeType = t.key; activeTopic = 'all'"
      >
        <span class="type-icon"><i :class="'pi ' + t.icon" /></span>
        <span class="type-label">{{ t.label }}</span>
        <span class="type-count">{{ countByType(t.key) }}</span>
      </button>
    </div>

    <!-- ══ LAYOUT ════════════════════════════════════════ -->
    <div class="lessons-layout">

      <!-- ── Topic sidebar ─────────────────────────────── -->
      <aside class="topic-sidebar">
        <p class="topic-head"><i class="pi pi-tag" /> Тақырыптар</p>
        <ul class="topic-list">
          <li
              v-for="topic in topicList"
              :key="topic.key"
              class="topic-item"
              :class="{ active: activeTopic === topic.key }"
              @click="activeTopic = topic.key"
          >
            <span class="topic-dot" :style="{ background: topic.color }" />
            <span class="topic-name">{{ topic.label }}</span>
            <span class="topic-cnt">{{ countByTopic(topic.key) }}</span>
          </li>
        </ul>

        <!-- Search -->
        <div class="topic-search">
          <i class="pi pi-search" />
          <input v-model="search" type="text" placeholder="Іздеу…" class="ts-input" />
        </div>
      </aside>

      <!-- ── Main content ───────────────────────────────── -->
      <div class="lessons-main">

        <!-- Featured lesson (hero) -->
        <div class="featured-lesson" v-if="featured" @click="openLesson(featured)">
          <div class="fl-media">
            <img :src="featured.thumb" :alt="featured.title" class="fl-thumb" />
            <div class="fl-overlay" />
            <div v-if="featured.type === 'video'" class="fl-play">
              <i class="pi pi-play" />
            </div>
            <span class="fl-type-badge" :class="featured.type">
              <i :class="'pi ' + typeIcon(featured.type)" />
              {{ typeLabel(featured.type) }}
            </span>
            <span class="fl-duration">{{ featured.duration }}</span>
          </div>
          <div class="fl-body">
            <div class="fl-eyebrow">
              <span class="topic-pill" :style="{ borderColor: topicColor(featured.topic) }">
                {{ topicName(featured.topic) }}
              </span>
              <span class="fl-level" :class="featured.level">{{ levelLabel(featured.level) }}</span>
            </div>
            <h3 class="fl-title">{{ featured.title }}</h3>
            <p class="fl-desc">{{ featured.description }}</p>
            <div class="fl-meta">
              <span class="fl-author"><i class="pi pi-user" /> {{ featured.author }}</span>
              <span class="fl-date"><i class="pi pi-calendar" /> {{ featured.date }}</span>
              <span class="fl-views"><i class="pi pi-eye" /> {{ featured.views }}</span>
            </div>
            <div class="fl-progress" v-if="featured.progress">
              <div class="fl-progress-bar">
                <div class="fl-progress-fill" :style="{ width: featured.progress + '%' }" />
              </div>
              <span class="fl-progress-label">{{ featured.progress }}% аяқталды</span>
            </div>
            <button class="fl-btn">
              <i :class="'pi ' + (featured.type === 'video' ? 'pi-play' : 'pi-book')" />
              {{ featured.type === 'video' ? 'Видеоны қарау' : 'Оқуды бастау' }}
            </button>
          </div>
        </div>

        <!-- Grid -->
        <div class="lessons-grid">
          <transition-group name="lesson-fade" tag="div" class="grid-inner">
            <article
                v-for="lesson in filteredLessons"
                :key="lesson.id"
                class="lesson-card"
                :class="lesson.type"
                @click="openLesson(lesson)"
            >
              <!-- Thumbnail -->
              <div class="lc-thumb-wrap">
                <img :src="lesson.thumb" :alt="lesson.title" class="lc-thumb" />
                <div class="lc-thumb-overlay" />

                <div v-if="lesson.type === 'video'" class="lc-play">
                  <i class="pi pi-play" />
                </div>

                <span class="lc-type-badge" :class="lesson.type">
                  <i :class="'pi ' + typeIcon(lesson.type)" />
                </span>

                <span class="lc-duration">{{ lesson.duration }}</span>

                <!-- Progress ring for in-progress -->
                <svg v-if="lesson.progress" class="lc-ring" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,.15)" stroke-width="2.5"/>
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#c4922a" stroke-width="2.5"
                          stroke-dasharray="94.25" :stroke-dashoffset="94.25 - (94.25 * lesson.progress / 100)"
                          stroke-linecap="round" transform="rotate(-90 18 18)"/>
                </svg>
              </div>

              <!-- Body -->
              <div class="lc-body">
                <div class="lc-top">
                  <span class="lc-topic" :style="{ color: topicColor(lesson.topic) }">
                    {{ topicName(lesson.topic) }}
                  </span>
                  <span class="lc-level" :class="lesson.level">{{ levelLabel(lesson.level) }}</span>
                </div>
                <h3 class="lc-title">{{ lesson.title }}</h3>
                <p class="lc-desc">{{ lesson.description }}</p>
                <div class="lc-footer">
                  <span class="lc-author">{{ lesson.author }}</span>
                  <div class="lc-rating">
                    <i class="pi pi-star-fill" />
                    <span>{{ lesson.rating }}</span>
                  </div>
                </div>
              </div>
            </article>
          </transition-group>

          <!-- Empty -->
          <div v-if="filteredLessons.length === 0" class="empty-state">
            <i class="pi pi-search" />
            <p>Сабақ табылмады</p>
          </div>
        </div>

        <!-- Load more -->
        <div class="load-more-row" v-if="filteredLessons.length > 0">
          <button class="load-more-btn">
            Барлық сабақтар <i class="pi pi-arrow-right" />
          </button>
        </div>
      </div>
    </div>

    <!-- ══ LESSON DIALOG ════════════════════════════════ -->
    <Dialog
        v-model:visible="dialogVisible"
        :header="selectedLesson?.title"
        :style="{ width: '760px', maxWidth: '95vw' }"
        modal
        class="lesson-dialog"
    >
      <div v-if="selectedLesson" class="dialog-body">

        <!-- Video player mockup -->
        <div v-if="selectedLesson.type === 'video'" class="dialog-video">
          <img :src="selectedLesson.thumb" :alt="selectedLesson.title" class="dv-poster" />
          <div class="dv-overlay">
            <button class="dv-play"><i class="pi pi-play" /></button>
          </div>
          <div class="dv-controls">
            <div class="dv-progress"><div class="dv-prog-fill" :style="{ width: (selectedLesson.progress || 0) + '%' }" /></div>
            <div class="dv-ctrl-row">
              <button class="dv-btn"><i class="pi pi-step-backward" /></button>
              <button class="dv-btn main"><i class="pi pi-play" /></button>
              <button class="dv-btn"><i class="pi pi-step-forward" /></button>
              <span class="dv-time">0:00 / {{ selectedLesson.duration }}</span>
              <button class="dv-btn ml-auto"><i class="pi pi-volume-up" /></button>
              <button class="dv-btn"><i class="pi pi-window-maximize" /></button>
            </div>
          </div>
        </div>

        <!-- PDF / text preview -->
        <div v-else class="dialog-preview">
          <img :src="selectedLesson.thumb" :alt="selectedLesson.title" class="dp-img" />
          <span class="dp-type-badge" :class="selectedLesson.type">
            <i :class="'pi ' + typeIcon(selectedLesson.type)" />
            {{ typeLabel(selectedLesson.type) }}
          </span>
        </div>

        <!-- Meta -->
        <div class="dialog-meta-row">
          <span class="topic-pill" :style="{ borderColor: topicColor(selectedLesson.topic) }">{{ topicName(selectedLesson.topic) }}</span>
          <span class="fl-level" :class="selectedLesson.level">{{ levelLabel(selectedLesson.level) }}</span>
          <span class="dm-item"><i class="pi pi-user" /> {{ selectedLesson.author }}</span>
          <span class="dm-item"><i class="pi pi-calendar" /> {{ selectedLesson.date }}</span>
          <span class="dm-item"><i class="pi pi-eye" /> {{ selectedLesson.views }}</span>
        </div>

        <!-- Description -->
        <p class="dialog-desc">{{ selectedLesson.description }}</p>
        <p class="dialog-desc">
          Бұл сабақта қазақ әдебиетінің негізгі ерекшеліктері мен тарихи кезеңдері қарастырылады.
          Материал толық зерттелген деректерге сүйенеді.
        </p>

        <!-- Actions -->
        <div class="dialog-actions">
          <button class="fl-btn">
            <i :class="'pi ' + (selectedLesson.type === 'video' ? 'pi-play' : 'pi-book')" />
            {{ selectedLesson.type === 'video' ? 'Бастау' : 'Оқу' }}
          </button>
          <button class="btn-outline" v-if="selectedLesson.type === 'pdf'">
            <i class="pi pi-download" /> Жүктеу
          </button>
          <button class="btn-outline">
            <i class="pi pi-bookmark" /> Сақтау
          </button>
        </div>
      </div>
    </Dialog>

  </section>
</template>


<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,300&display=swap');

.lessons-section {
  --ink:       #1a1208;
  --parchment: #faf6ef;
  --gold:      #c4922a;
  --gold-l:    #e8b94f;
  --rust:      #8b3a1e;
  --border:    #d9cdb8;
  --shadow:    0 4px 24px rgba(26,18,8,.10);
  --shadow-lg: 0 12px 48px rgba(26,18,8,.18);

  background: var(--parchment);
  padding: 3.5rem 1.5rem;
  max-width: 1280px;
  margin: 0 auto;
  font-family: 'Source Serif 4', Georgia, serif;
}

/* ── Header ── */
.section-header { text-align: center; margin-bottom: 2.5rem; }
.orn-row   { display:flex; align-items:center; justify-content:center; gap:.75rem; margin-bottom:1rem; }
.orn-line  { display:block; height:1px; width:80px; background:linear-gradient(90deg, transparent, var(--gold)); }
.orn-line:last-child { background:linear-gradient(90deg,var(--gold),transparent); }
.orn-diamond { color:var(--gold); font-size:.7rem; }
.section-title {
  font-family: 'Playfair Display', serif;
  font-size: clamp(2rem,4vw,2.75rem); font-weight:900; color:var(--ink); margin:0 0 .5rem; line-height:1.1;
}
.title-kz { color:var(--ink); }
.title-div { color:var(--gold); margin:0 .5rem; font-weight:300; }
.title-ru  { color:var(--rust); font-style:italic; font-weight:600; font-size:80%; }
.section-sub { color:#7a6a52; font-size:.95rem; font-style:italic; margin:0 0 1.5rem; }

.stats-row { display:flex; flex-wrap:wrap; justify-content:center; gap:.75rem; }
.stat-chip {
  display:inline-flex; align-items:center; gap:.45rem;
  background:#fff; border:1px solid var(--border); border-radius:2px;
  padding:.4rem .9rem; font-size:.8rem; color:#5a4a35;
}
.stat-chip i { color:var(--gold); font-size:.85rem; }
.stat-val   { font-weight:700; color:var(--ink); }
.stat-label { color:#9a8a72; }

/* ── Type tabs ── */
.type-tabs {
  display:flex; flex-wrap:wrap; gap:.6rem;
  margin-bottom:2rem;
}
.type-tab {
  display:flex; align-items:center; gap:.5rem;
  padding:.5rem 1.1rem;
  border:1.5px solid var(--border); border-radius:2px;
  background:transparent; color:#7a6a52;
  font-family:'Source Serif 4',serif; font-size:.82rem;
  cursor:pointer; transition:all .22s;
}
.type-tab:hover { border-color:var(--gold); color:var(--gold); }
.type-tab.active { background:var(--gold); border-color:var(--gold); color:#fff; font-weight:600; }
.type-icon { font-size:.88rem; }
.type-count {
  font-size:.68rem; font-weight:700;
  background:rgba(255,255,255,.25); padding:.05rem .38rem;
  border-radius:10px; margin-left:.1rem;
}
.type-tab:not(.active) .type-count { background:rgba(196,146,42,.1); color:var(--gold); }

/* ── Layout ── */
.lessons-layout { display:grid; grid-template-columns:220px 1fr; gap:2rem; }
@media(max-width:900px) { .lessons-layout { grid-template-columns:1fr; } }

/* ── Topic sidebar ── */
.topic-sidebar {
  background:#fff; border:1px solid var(--border); border-radius:3px;
  padding:0; height:fit-content; position:sticky; top:1rem;
  overflow:hidden;
}
.topic-head {
  font-size:.68rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase;
  color:#9a8a72; padding:.75rem 1rem .5rem; margin:0; border-bottom:1px solid var(--border);
  display:flex; align-items:center; gap:.4rem;
}
.topic-head i { font-size:.7rem; color:var(--gold); }
.topic-list { list-style:none; margin:0; padding:.35rem 0; }
.topic-item {
  display:flex; align-items:center; gap:.55rem;
  padding:.42rem 1rem; cursor:pointer;
  border-left:2px solid transparent;
  transition:background .15s, border-color .15s;
}
.topic-item:hover  { background:rgba(196,146,42,.06); }
.topic-item.active { border-left-color:var(--gold); background:rgba(196,146,42,.09); }
.topic-dot  { width:8px; height:8px; border-radius:2px; flex-shrink:0; }
.topic-name { flex:1; font-size:.78rem; color:var(--ink); }
.topic-item.active .topic-name { font-weight:600; }
.topic-cnt  { font-size:.65rem; color:#b0a090; background:#f5ede0; padding:.1rem .38rem; border-radius:10px; }

.topic-search {
  display:flex; align-items:center; gap:.5rem;
  border-top:1px solid var(--border); padding:.6rem 1rem;
  background:#fdf9f4;
}
.topic-search i { color:#b0a090; font-size:.8rem; }
.ts-input {
  flex:1; border:none; outline:none; background:transparent;
  font-family:'Source Serif 4',serif; font-size:.8rem; color:var(--ink);
}
.ts-input::placeholder { color:#b0a090; font-style:italic; }

/* ── Featured lesson ── */
.featured-lesson {
  display:grid; grid-template-columns:1fr 1fr; gap:0;
  background:#fff; border:1px solid var(--border); border-radius:3px;
  overflow:hidden; cursor:pointer;
  box-shadow:var(--shadow);
  margin-bottom:1.75rem;
  transition:box-shadow .3s;
}
.featured-lesson:hover { box-shadow:var(--shadow-lg); }
@media(max-width:700px) { .featured-lesson { grid-template-columns:1fr; } }

.fl-media { position:relative; min-height:260px; overflow:hidden; }
.fl-thumb {
  width:100%; height:100%; object-fit:cover;
  transition:transform .5s ease;
}
.featured-lesson:hover .fl-thumb { transform:scale(1.04); }
.fl-overlay { position:absolute; inset:0; background:linear-gradient(135deg,rgba(26,18,8,.5) 0%,transparent 60%); }
.fl-play {
  position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
  width:56px; height:56px; border-radius:50%;
  background:rgba(196,146,42,.9); color:#fff;
  display:flex; align-items:center; justify-content:center; font-size:1.2rem;
  transition:transform .25s, background .25s;
}
.featured-lesson:hover .fl-play { transform:translate(-50%,-50%) scale(1.1); background:var(--gold-l); }
.fl-type-badge {
  position:absolute; top:.75rem; left:.75rem;
  display:flex; align-items:center; gap:.3rem;
  font-size:.65rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase;
  padding:.22rem .6rem; border-radius:1px;
}
.fl-type-badge.video { background:rgba(139,58,30,.9); color:#fff; }
.fl-type-badge.text  { background:rgba(74,94,76,.9);  color:#fff; }
.fl-type-badge.pdf   { background:rgba(42,58,92,.9);  color:#fff; }
.fl-duration {
  position:absolute; bottom:.75rem; right:.75rem;
  font-size:.72rem; color:#fff; background:rgba(26,18,8,.65);
  padding:.2rem .5rem; border-radius:1px;
}

.fl-body { padding:1.75rem; display:flex; flex-direction:column; }
.fl-eyebrow { display:flex; align-items:center; gap:.6rem; margin-bottom:.85rem; }
.topic-pill {
  font-size:.65rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase;
  color:var(--gold); border:1px solid;
  padding:.15rem .55rem; border-radius:1px;
}
.fl-level {
  font-size:.62rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase;
  padding:.15rem .5rem; border-radius:1px;
}
.fl-level.beginner    { background:#e8f5e9; color:#2e7d32; }
.fl-level.intermediate{ background:#fff3e0; color:#e65100; }
.fl-level.advanced    { background:#fce4ec; color:#b71c1c; }

.fl-title {
  font-family:'Playfair Display',serif;
  font-size:1.35rem; font-weight:900; color:var(--ink); margin:0 0 .65rem; line-height:1.3;
}
.fl-desc { font-size:.875rem; color:#5a4a35; line-height:1.7; margin:0 0 1rem; flex:1; }
.fl-meta { display:flex; flex-wrap:wrap; gap:.75rem; font-size:.75rem; color:#9a8a72; margin-bottom:1rem; }
.fl-meta i { margin-right:.25rem; }

.fl-progress { margin-bottom:1rem; }
.fl-progress-bar { height:4px; background:var(--border); border-radius:2px; overflow:hidden; margin-bottom:.3rem; }
.fl-progress-fill { height:100%; background:var(--gold); border-radius:2px; transition:width .5s; }
.fl-progress-label { font-size:.7rem; color:#9a8a72; }

.fl-btn {
  display:inline-flex; align-items:center; gap:.5rem; align-self:flex-start;
  background:var(--gold); color:#fff; border:none;
  padding:.65rem 1.5rem; border-radius:2px;
  font-family:'Source Serif 4',serif; font-size:.875rem; font-weight:700;
  cursor:pointer; transition:background .22s;
}
.fl-btn:hover { background:var(--gold-l); }

/* ── Grid ── */
.lessons-grid { margin-bottom:1.5rem; }
.grid-inner {
  display:grid;
  grid-template-columns:repeat(auto-fill, minmax(240px,1fr));
  gap:1.25rem;
}

/* ── Lesson card ── */
.lesson-card {
  background:#fff; border:1px solid var(--border); border-radius:3px;
  overflow:hidden; cursor:pointer;
  transition:transform .3s, box-shadow .3s;
}
.lesson-card:hover { transform:translateY(-5px); box-shadow:var(--shadow-lg); }

.lc-thumb-wrap { position:relative; height:170px; overflow:hidden; }
.lc-thumb { width:100%; height:100%; object-fit:cover; transition:transform .5s; }
.lesson-card:hover .lc-thumb { transform:scale(1.05); }
.lc-thumb-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(26,18,8,.45) 0%,transparent 55%); }

.lc-play {
  position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
  width:40px; height:40px; border-radius:50%;
  background:rgba(196,146,42,.88); color:#fff;
  display:flex; align-items:center; justify-content:center; font-size:.9rem;
  opacity:0; transition:opacity .25s, transform .25s;
}
.lesson-card:hover .lc-play { opacity:1; transform:translate(-50%,-50%) scale(1.08); }

.lc-type-badge {
  position:absolute; top:.55rem; left:.55rem;
  width:26px; height:26px; border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  font-size:.72rem;
}
.lc-type-badge.video { background:rgba(139,58,30,.88); color:#fff; }
.lc-type-badge.text  { background:rgba(74,94,76,.88);  color:#fff; }
.lc-type-badge.pdf   { background:rgba(42,58,92,.88);  color:#fff; }

.lc-duration {
  position:absolute; bottom:.5rem; right:.5rem;
  font-size:.65rem; color:#fff;
  background:rgba(26,18,8,.62); padding:.15rem .45rem; border-radius:1px;
}

/* Progress ring */
.lc-ring {
  position:absolute; bottom:.45rem; left:.55rem;
  width:36px; height:36px;
}

.lc-body { padding:.9rem; }
.lc-top  { display:flex; align-items:center; justify-content:space-between; margin-bottom:.35rem; }
.lc-topic { font-size:.65rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }
.lc-level { font-size:.6rem; font-weight:700; letter-spacing:.06em; text-transform:uppercase; padding:.12rem .42rem; border-radius:1px; }
.lc-level.beginner     { background:#e8f5e9; color:#2e7d32; }
.lc-level.intermediate { background:#fff3e0; color:#e65100; }
.lc-level.advanced     { background:#fce4ec; color:#b71c1c; }

.lc-title {
  font-family:'Playfair Display',serif;
  font-size:.95rem; font-weight:700; color:var(--ink); margin:0 0 .35rem; line-height:1.35;
}
.lc-desc  { font-size:.75rem; color:#5a4a35; line-height:1.6; margin:0 0 .65rem; }
.lc-footer { display:flex; align-items:center; justify-content:space-between; }
.lc-author { font-size:.7rem; color:#9a8a72; font-style:italic; }
.lc-rating { display:flex; align-items:center; gap:.22rem; font-size:.72rem; font-weight:700; color:var(--gold); }
.lc-rating i { font-size:.68rem; }

/* Empty */
.empty-state { text-align:center; padding:3rem; color:#9a8a72; font-style:italic; }
.empty-state i { font-size:2rem; display:block; margin-bottom:.75rem; color:var(--border); }

/* Load more */
.load-more-row { display:flex; justify-content:center; }
.load-more-btn {
  display:inline-flex; align-items:center; gap:.5rem;
  border:1.5px solid var(--gold); border-radius:2px;
  background:transparent; color:var(--gold);
  font-family:'Source Serif 4',serif; font-size:.875rem; font-weight:600;
  padding:.7rem 2rem; cursor:pointer; transition:background .22s, color .22s;
}
.load-more-btn:hover { background:var(--gold); color:#fff; }

/* ── Transitions ── */
.lesson-fade-enter-active, .lesson-fade-leave-active { transition:opacity .28s, transform .28s; }
.lesson-fade-enter-from,   .lesson-fade-leave-to     { opacity:0; transform:scale(.97); }

/* ── Dialog ── */
.dialog-video { position:relative; border-radius:2px; overflow:hidden; margin-bottom:1rem; }
.dv-poster { width:100%; height:300px; object-fit:cover; display:block; filter:brightness(.7); }
.dv-overlay {
  position:absolute; inset:0;
  display:flex; align-items:center; justify-content:center;
}
.dv-play {
  width:60px; height:60px; border-radius:50%;
  background:rgba(196,146,42,.9); border:none; color:#fff;
  display:flex; align-items:center; justify-content:center; font-size:1.3rem;
  cursor:pointer; transition:transform .25s, background .25s;
}
.dv-play:hover { transform:scale(1.1); background:var(--gold-l); }
.dv-controls { background:#1a1208; padding:.5rem .75rem; }
.dv-progress { height:3px; background:rgba(255,255,255,.15); border-radius:2px; margin-bottom:.5rem; overflow:hidden; }
.dv-prog-fill { height:100%; background:var(--gold); width:0%; }
.dv-ctrl-row { display:flex; align-items:center; gap:.4rem; }
.dv-btn {
  background:none; border:none; color:rgba(255,255,255,.6);
  font-size:.85rem; cursor:pointer; padding:.2rem .3rem;
  transition:color .2s;
}
.dv-btn:hover { color:#fff; }
.dv-btn.main  { color:var(--gold); font-size:1rem; }
.dv-time  { font-size:.72rem; color:rgba(255,255,255,.4); margin-left:.25rem; }
.ml-auto  { margin-left:auto; }

.dialog-preview { position:relative; margin-bottom:1rem; border-radius:2px; overflow:hidden; }
.dp-img { width:100%; height:220px; object-fit:cover; display:block; }
.dp-type-badge {
  position:absolute; top:.75rem; left:.75rem;
  display:flex; align-items:center; gap:.3rem;
  font-size:.65rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase;
  padding:.22rem .6rem; border-radius:1px; color:#fff;
}
.dp-type-badge.text { background:rgba(74,94,76,.9); }
.dp-type-badge.pdf  { background:rgba(42,58,92,.9); }

.dialog-meta-row { display:flex; flex-wrap:wrap; align-items:center; gap:.6rem; margin-bottom:.85rem; }
.dm-item { font-size:.78rem; color:#7a6a52; }
.dm-item i { margin-right:.25rem; }

.dialog-desc { font-family:'Source Serif 4',serif; font-size:.9rem; color:#3a2a15; line-height:1.75; margin-bottom:.85rem; }

.dialog-actions { display:flex; gap:.6rem; flex-wrap:wrap; }
.btn-outline {
  display:inline-flex; align-items:center; gap:.45rem;
  background:transparent; border:1.5px solid var(--border); color:var(--ink);
  padding:.55rem 1.1rem; border-radius:2px;
  font-family:'Source Serif 4',serif; font-size:.82rem; cursor:pointer;
  transition:border-color .2s, color .2s;
}
.btn-outline:hover { border-color:var(--gold); color:var(--gold); }
</style>