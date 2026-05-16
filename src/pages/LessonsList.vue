<template>
  <div class="lessons-list-page">

    <!-- ══ PAGE HEADER ══════════════════════════════════ -->
    <div class="page-hero">
      <div class="ph-bg"/>
      <div class="ph-content">
        <nav class="breadcrumb">
          <button class="bc-btn" @click="$router.push('/')"><i class="pi pi-home"/> Басты</button>
          <span class="bc-sep">›</span>
          <span class="bc-cur">Барлық сабақтар</span>
        </nav>
        <h1 class="ph-title">Сабақтар каталогы</h1>
        <p class="ph-sub">Қазақ әдебиеті бойынша барлық видео, конспект және PDF материалдар</p>
        <div class="ph-stats" v-if="!loading">
          <span class="ph-stat"><strong>{{ allLessons.length }}</strong> сабақ</span>
          <span class="ph-stat"><strong>{{ countByType('video') }}</strong> видео</span>
          <span class="ph-stat"><strong>{{ countByType('text') }}</strong> конспект</span>
          <span class="ph-stat"><strong>{{ countByType('pdf') }}</strong> PDF</span>
        </div>
      </div>
    </div>

    <!-- ══ TOOLBAR ══════════════════════════════════════ -->
    <div class="toolbar">
      <div class="toolbar-inner">
        <!-- Search -->
        <div class="search-box" :class="{ focused: searchFocused }">
          <i class="pi pi-search sb-icon"/>
          <input
              v-model="search"
              type="text"
              placeholder="Сабақ, автор, тақырып іздеу…"
              class="sb-input"
              @focus="searchFocused = true"
              @blur="searchFocused = false"
          />
          <button v-if="search" class="sb-clear" @click="search = ''">
            <i class="pi pi-times"/>
          </button>
        </div>

        <!-- Type filter -->
        <div class="filter-group">
          <button
              v-for="t in TYPE_TABS" :key="t.key"
              class="filter-btn" :class="[t.key, { active: activeType === t.key }]"
              @click="activeType = t.key; currentPage = 1"
          >
            <i :class="'pi ' + t.icon"/>
            {{ t.label }}
            <span class="fb-cnt">{{ t.key === 'all' ? allLessons.length : countByType(t.key) }}</span>
          </button>
        </div>

        <!-- Right controls -->
        <div class="toolbar-right">
          <!-- Topic select -->
          <div class="select-wrap">
            <select v-model="activeTopic" class="topic-select" @change="currentPage = 1">
              <option value="all">Барлық тақырып</option>
              <option v-for="t in topicOptions" :key="t" :value="t">{{ t }}</option>
            </select>
            <i class="pi pi-angle-down select-caret"/>
          </div>

          <!-- Level select -->
          <div class="select-wrap">
            <select v-model="activeLevel" class="topic-select" @change="currentPage = 1">
              <option value="all">Барлық деңгей</option>
              <option value="Оңай">Оңай</option>
              <option value="Орташа">Орташа</option>
              <option value="Жоғары">Жоғары</option>
            </select>
            <i class="pi pi-angle-down select-caret"/>
          </div>

          <!-- Sort -->
          <div class="select-wrap">
            <select v-model="sortBy" class="topic-select" @change="currentPage = 1">
              <option value="default">Стандарт</option>
              <option value="alpha">Алфавит</option>
              <option value="level">Деңгей</option>
            </select>
            <i class="pi pi-angle-down select-caret"/>
          </div>

          <!-- View mode -->
          <div class="view-toggle">
            <button :class="{ active: viewMode === 'grid' }" @click="viewMode = 'grid'" title="Тор">
              <i class="pi pi-th-large"/>
            </button>
            <button :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'" title="Тізім">
              <i class="pi pi-list"/>
            </button>
          </div>
        </div>
      </div>

      <!-- Active filters row -->
      <div class="active-filters" v-if="hasFilters">
        <span class="af-label">Фильтрлер:</span>
        <span v-if="activeType !== 'all'" class="af-chip" @click="activeType = 'all'">
          {{ typeLabel(activeType) }} <i class="pi pi-times"/>
        </span>
        <span v-if="activeTopic !== 'all'" class="af-chip" @click="activeTopic = 'all'">
          {{ activeTopic }} <i class="pi pi-times"/>
        </span>
        <span v-if="activeLevel !== 'all'" class="af-chip" @click="activeLevel = 'all'">
          {{ activeLevel }} <i class="pi pi-times"/>
        </span>
        <span v-if="search" class="af-chip" @click="search = ''">
          «{{ search }}» <i class="pi pi-times"/>
        </span>
        <button class="af-clear" @click="clearFilters">Барлығын тазалау</button>
      </div>
    </div>

    <!-- ══ LOADING ══════════════════════════════════════ -->
    <div v-if="loading" class="state-wrap">
      <div class="spinner"/>
      <p>Supabase-тен жүктелуде…</p>
      <p class="state-hint" style="color:#3ecf8e; font-family:monospace">
        Supabase · lessons
      </p>
    </div>

    <!-- ══ ERROR ════════════════════════════════════════ -->
    <div v-else-if="loadError" class="state-wrap error">
      <i class="pi pi-exclamation-triangle"/>
      <p>{{ loadError }}</p>
      <button class="btn-gold" @click="init(true)">
        <i class="pi pi-refresh"/> Қайта жүктеу
      </button>
    </div>

    <!-- ══ CONTENT ══════════════════════════════════════ -->
    <div v-else class="list-body">

      <!-- Results count -->
      <div class="results-bar">
        <span class="results-cnt">
          <strong>{{ totalFiltered }}</strong> сабақ табылды
          <span v-if="hasFilters"> · {{ totalPages }} бет</span>
        </span>
        <span class="results-page" v-if="totalPages > 1">
          {{ currentPage }} / {{ totalPages }} бет
        </span>
      </div>

      <!-- GRID view -->
      <div v-if="viewMode === 'grid'" class="grid-view">
        <transition-group name="fade-grid" tag="div" class="grid-wrap">
          <article
              v-for="lesson in paginatedLessons"
              :key="lesson.id + '_' + lesson.type"
              class="grid-card"
              @click="openLesson(lesson)"
          >
            <div class="gc-thumb">
              <img :src="lesson.cover || defaultCover(lesson.type)" :alt="lesson.title" class="gc-img"/>
              <div class="gc-dark"/>
              <div v-if="lesson.type === 'video'" class="gc-play"><i class="pi pi-play"/></div>
              <span class="gc-type" :class="lesson.type">
                <i :class="'pi ' + typeIcon(lesson.type)"/>
              </span>
              <span class="gc-dur">{{ lesson.duration }}</span>
              <span class="gc-level" :class="lvlClass(lesson.level)">{{ lesson.level }}</span>
            </div>
            <div class="gc-body">
              <span class="gc-topic" :style="{ color: topicColor(lesson.topic) }">{{ lesson.topic }}</span>
              <h3 class="gc-title">{{ lesson.title }}</h3>
              <p class="gc-desc">{{ lesson.description }}</p>
              <div class="gc-footer">
                <span class="gc-author"><i class="pi pi-user"/>{{ lesson.author }}</span>
                <span class="gc-cat">{{ lesson.category }}</span>
              </div>
            </div>
          </article>
        </transition-group>
      </div>

      <!-- LIST view -->
      <div v-else class="list-view">
        <transition-group name="fade-list" tag="div" class="list-wrap">
          <article
              v-for="lesson in paginatedLessons"
              :key="lesson.id + '_' + lesson.type"
              class="list-card"
              @click="openLesson(lesson)"
          >
            <div class="lc-thumb-wrap">
              <img :src="lesson.cover || defaultCover(lesson.type)" :alt="lesson.title" class="lc-img"/>
              <div v-if="lesson.type === 'video'" class="lc-play-sm"><i class="pi pi-play"/></div>
              <span class="gc-type" :class="lesson.type" style="position:absolute;top:.4rem;left:.4rem">
                <i :class="'pi ' + typeIcon(lesson.type)"/>
              </span>
            </div>
            <div class="list-body-col">
              <div class="list-top">
                <span class="gc-topic" :style="{ color: topicColor(lesson.topic) }">{{ lesson.topic }}</span>
                <span class="gc-level" :class="lvlClass(lesson.level)">{{ lesson.level }}</span>
                <span class="list-type-label" :class="lesson.type">{{ typeLabel(lesson.type) }}</span>
              </div>
              <h3 class="list-title">{{ lesson.title }}</h3>
              <p class="list-desc">{{ lesson.description }}</p>
              <div class="list-meta">
                <span><i class="pi pi-user"/>{{ lesson.author }}</span>
                <span><i class="pi pi-clock"/>{{ lesson.duration }}</span>
                <span><i class="pi pi-folder"/>{{ lesson.category }}</span>
              </div>
            </div>
            <div class="list-action">
              <button class="btn-gold btn-sm">
                <i :class="'pi ' + (lesson.type === 'video' ? 'pi-play' : 'pi-book')"/>
                {{ lesson.type === 'video' ? 'Қарау' : 'Оқу' }}
              </button>
            </div>
          </article>
        </transition-group>
      </div>

      <!-- EMPTY -->
      <div v-if="!paginatedLessons.length" class="empty-wrap">
        <i class="pi pi-search"/>
        <p>Сабақ табылмады</p>
        <p class="state-hint">Фильтрлерді өзгертіп көріңіз</p>
        <button class="btn-gold" @click="clearFilters">Фильтрлерді тазалау</button>
      </div>

      <!-- PAGINATION -->
      <div class="pagination" v-if="totalPages > 1">
        <button class="pg-btn" :disabled="currentPage === 1" @click="currentPage--">
          <i class="pi pi-chevron-left"/>
        </button>

        <template v-for="p in pagesRange" :key="p">
          <span v-if="p === '...'" class="pg-dots">…</span>
          <button
              v-else
              class="pg-num" :class="{ active: p === currentPage }"
              @click="currentPage = p"
          >{{ p }}</button>
        </template>

        <button class="pg-btn" :disabled="currentPage === totalPages" @click="currentPage++">
          <i class="pi pi-chevron-right"/>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLessonsStore } from '@/composables/useLessonsStore'

const route  = useRoute()
const router = useRouter()

// ── Store — Supabase ──────────────────────────────────
const { lessons: allLessons, loading, error: loadError, init } = useLessonsStore()

// ── Config ────────────────────────────────────────────
const PER_PAGE = 12

const TYPE_TABS = [
  { key: 'all',   label: 'Барлығы',    icon: 'pi-th-large'    },
  { key: 'video', label: 'Видео сабақ', icon: 'pi-play-circle' },
  { key: 'text',  label: 'Конспект',   icon: 'pi-file-edit'   },
  { key: 'pdf',   label: 'PDF',        icon: 'pi-file-pdf'    },
]
const TOPIC_COLORS = {
  'Классика':'#8b3a1e','Поэзия':'#4a5e4c','Проза':'#2a3a5c',
  'Эпос':'#5c3a1e','Теория':'#5a3a5a','Авторлар':'#c4922a','Шығармалар':'#2a5c3a',
}

// ── State ─────────────────────────────────────────────
const search       = ref('')
const searchFocused = ref(false)
const activeType   = ref('all')
const activeTopic  = ref('all')
const activeLevel  = ref('all')
const sortBy       = ref('default')
const viewMode     = ref('grid')
const currentPage  = ref(1)

// ── Init — route query + Supabase ─────────────────────
onMounted(async () => {
  if (route.query.type && route.query.type !== 'all')
    activeType.value = String(route.query.type)
  if (route.query.topic)
    activeTopic.value = String(route.query.topic)
  await init()   // useLessonsStore → Supabase lessons кестесі
})

// ── Computed ──────────────────────────────────────────
function countByType(t) { return allLessons.value.filter(l => l.type === t).length }

const topicOptions = computed(() =>
    [...new Set(allLessons.value.map(l => l.topic).filter(Boolean))].sort()
)

const hasFilters = computed(() =>
    activeType.value !== 'all' || activeTopic.value !== 'all' ||
    activeLevel.value !== 'all' || search.value.trim()
)

const filteredLessons = computed(() => {
  let list = [...allLessons.value]
  if (activeType.value  !== 'all') list = list.filter(l => l.type  === activeType.value)
  if (activeTopic.value !== 'all') list = list.filter(l => l.topic === activeTopic.value)
  if (activeLevel.value !== 'all') list = list.filter(l => l.level === activeLevel.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(l =>
        (l.title       || '').toLowerCase().includes(q) ||
        (l.author      || '').toLowerCase().includes(q) ||
        (l.topic       || '').toLowerCase().includes(q) ||
        (l.description || '').toLowerCase().includes(q)
    )
  }
  if (sortBy.value === 'alpha') list.sort((a, b) => a.title.localeCompare(b.title, 'kk'))
  if (sortBy.value === 'level') {
    const ord = { 'Оңай':0, 'Орташа':1, 'Жоғары':2 }
    list.sort((a, b) => (ord[a.level]||0) - (ord[b.level]||0))
  }
  return list
})

const totalFiltered = computed(() => filteredLessons.value.length)
const totalPages    = computed(() => Math.max(1, Math.ceil(totalFiltered.value / PER_PAGE)))

const paginatedLessons = computed(() => {
  const start = (currentPage.value - 1) * PER_PAGE
  return filteredLessons.value.slice(start, start + PER_PAGE)
})

const pagesRange = computed(() => {
  const total = totalPages.value
  const cur   = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = [1]
  if (cur > 3)        pages.push('...')
  for (let p = Math.max(2, cur-1); p <= Math.min(total-1, cur+1); p++) pages.push(p)
  if (cur < total-2)  pages.push('...')
  pages.push(total)
  return pages
})

// Reset page on filter change
watch([search, activeType, activeTopic, activeLevel, sortBy], () => { currentPage.value = 1 })

// ── Helpers ───────────────────────────────────────────
function typeIcon(t)   { return { video:'pi-play-circle', text:'pi-file-edit', pdf:'pi-file-pdf' }[t] || 'pi-book' }
function typeLabel(t)  { return { video:'Видео', text:'Конспект', pdf:'PDF' }[t] || t }
function topicColor(t) { return TOPIC_COLORS[t] || '#c4922a' }
function lvlClass(l)   { return l === 'Оңай' ? 'lv-easy' : l === 'Жоғары' ? 'lv-hard' : 'lv-mid' }

function defaultCover(type) {
  return {
    video: 'https://images.unsplash.com/photo-1476820865390-c52aeebb9891?w=600&q=80',
    text:  'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&q=80',
    pdf:   'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80',
  }[type] || ''
}

// ── Actions ───────────────────────────────────────────
function openLesson(lesson) {
  router.push({ name: 'lesson-detail', params: { type: lesson.type, id: lesson.id } })
}
function clearFilters() {
  search.value = ''; activeType.value = 'all'
  activeTopic.value = 'all'; activeLevel.value = 'all'
  sortBy.value = 'default'; currentPage.value = 1
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,300&display=swap');

.lessons-list-page {
  --ink:    #1a1208; --parch: #faf6ef;
  --gold:   #c4922a; --gold-l:#e8b94f;
  --rust:   #8b3a1e; --sage:  #3a5c3a;
  --navy:   #2a3a5c; --border:#d9cdb8;
  --dark:   #130e07;
  --shd:    0 4px 24px rgba(26,18,8,.10);
  --shd-lg: 0 12px 48px rgba(26,18,8,.18);
  background: var(--parch);
  font-family: 'Source Serif 4', Georgia, serif;
  color: var(--ink); min-height: 100vh;
}

/* ── PAGE HERO ── */
.page-hero { position:relative; background:var(--dark); overflow:hidden; padding:3rem 1.5rem 2.5rem }
.ph-bg { position:absolute; inset:0; background-image:radial-gradient(circle,rgba(196,146,42,.06) 1px,transparent 1px); background-size:24px 24px; }
.ph-content { position:relative; z-index:1; max-width:1280px; margin:0 auto }
.breadcrumb { display:flex; align-items:center; gap:.4rem; margin-bottom:1.5rem; flex-wrap:wrap }
.bc-btn { background:none; border:none; color:rgba(255,255,255,.4); font-family:'Source Serif 4',serif; font-size:.75rem; cursor:pointer; padding:0; transition:color .2s; display:flex; align-items:center; gap:.25rem }
.bc-btn:hover { color:var(--gold-l) }
.bc-sep { color:rgba(255,255,255,.2); font-size:.75rem }
.bc-cur { font-size:.75rem; color:var(--gold-l) }
.ph-title { font-family:'Playfair Display',serif; font-size:clamp(1.75rem,3vw,2.5rem); font-weight:900; color:#fff; margin:0 0 .6rem }
.ph-sub   { font-size:.9rem; color:rgba(255,255,255,.5); margin:0 0 1.5rem; font-style:italic }
.ph-stats { display:flex; flex-wrap:wrap; gap:.75rem }
.ph-stat  { font-size:.8rem; color:rgba(255,255,255,.5); background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); padding:.3rem .8rem; border-radius:2px }
.ph-stat strong { color:var(--gold-l) }

/* ── TOOLBAR ── */
.toolbar { background:#fff; border-bottom:2px solid var(--border); position:sticky; top:0; z-index:50; box-shadow:var(--shd) }
.toolbar-inner { max-width:1280px; margin:0 auto; padding:.85rem 1.5rem; display:flex; align-items:center; gap:.75rem; flex-wrap:wrap }

.search-box { display:flex; align-items:center; gap:.5rem; border:1.5px solid var(--border); border-radius:2px; background:#faf6ef; padding:.42rem .75rem; transition:border-color .22s, box-shadow .22s; flex:1; min-width:200px; max-width:340px }
.search-box.focused { border-color:var(--gold); box-shadow:0 0 0 3px rgba(196,146,42,.1) }
.sb-icon  { color:#b0a090; font-size:.8rem; flex-shrink:0 }
.sb-input { flex:1; border:none; outline:none; background:transparent; font-family:'Source Serif 4',serif; font-size:.82rem; color:var(--ink) }
.sb-input::placeholder { color:#b0a090; font-style:italic }
.sb-clear { background:none; border:none; color:#b0a090; cursor:pointer; padding:0; font-size:.75rem; transition:color .2s }
.sb-clear:hover { color:var(--rust) }

.filter-group { display:flex; gap:.35rem; flex-wrap:wrap }
.filter-btn { display:flex; align-items:center; gap:.35rem; padding:.38rem .85rem; border:1.5px solid var(--border); border-radius:2px; background:transparent; color:#7a6a52; font-family:'Source Serif 4',serif; font-size:.78rem; cursor:pointer; transition:all .2s }
.filter-btn:hover { border-color:var(--gold); color:var(--gold) }
.filter-btn.active { font-weight:600; color:#fff; border-color:transparent }
.filter-btn.all.active { background:var(--gold) }
.filter-btn.video.active { background:var(--rust) }
.filter-btn.text.active  { background:var(--sage) }
.filter-btn.pdf.active   { background:var(--navy) }
.fb-cnt { font-size:.62rem; background:rgba(255,255,255,.25); padding:.04rem .32rem; border-radius:8px }
.filter-btn:not(.active) .fb-cnt { background:rgba(196,146,42,.1); color:var(--gold) }

.toolbar-right { display:flex; align-items:center; gap:.5rem; margin-left:auto; flex-wrap:wrap }
.select-wrap { position:relative }
.topic-select { appearance:none; border:1.5px solid var(--border); border-radius:2px; background:var(--parch); padding:.38rem 2rem .38rem .75rem; font-family:'Source Serif 4',serif; font-size:.78rem; color:var(--ink); cursor:pointer; outline:none; transition:border-color .2s }
.topic-select:focus { border-color:var(--gold) }
.select-caret { position:absolute; right:.55rem; top:50%; transform:translateY(-50%); font-size:.65rem; color:#b0a090; pointer-events:none }

.view-toggle { display:flex; border:1.5px solid var(--border); border-radius:2px; overflow:hidden }
.view-toggle button { width:32px; height:32px; border:none; background:transparent; color:#9a8a72; display:flex; align-items:center; justify-content:center; font-size:.8rem; cursor:pointer; transition:all .2s }
.view-toggle button.active { background:var(--gold); color:#fff }
.view-toggle button:hover:not(.active) { background:#f5ede0 }

.active-filters { display:flex; align-items:center; gap:.5rem; padding:.55rem 1.5rem; background:#fdf8f0; border-top:1px solid var(--border); flex-wrap:wrap; max-width:1280px; margin:0 auto }
.af-label { font-size:.72rem; color:#9a8a72; font-weight:600 }
.af-chip  { display:inline-flex; align-items:center; gap:.35rem; font-size:.72rem; background:rgba(196,146,42,.12); color:var(--gold); border:1px solid rgba(196,146,42,.3); padding:.2rem .6rem; border-radius:10px; cursor:pointer; transition:all .2s }
.af-chip:hover { background:rgba(196,146,42,.2) }
.af-chip i { font-size:.6rem }
.af-clear { font-size:.72rem; color:var(--rust); background:none; border:none; cursor:pointer; padding:0; transition:color .2s; margin-left:.25rem }
.af-clear:hover { color:var(--ink) }

/* ── STATES ── */
.state-wrap { display:flex; flex-direction:column; align-items:center; gap:1rem; padding:6rem 2rem; text-align:center; color:#7a6a52 }
.state-wrap.error i { font-size:2.5rem; color:var(--gold) }
.spinner { width:44px; height:44px; border:3px solid rgba(196,146,42,.18); border-top-color:var(--gold); border-radius:50%; animation:spin .75s linear infinite }
@keyframes spin { to { transform:rotate(360deg) } }
.state-hint { font-size:.72rem; color:#b0a090; font-family:monospace }
.btn-gold { display:inline-flex; align-items:center; gap:.45rem; background:var(--gold); color:#fff; border:none; padding:.6rem 1.35rem; border-radius:2px; font-family:'Source Serif 4',serif; font-size:.85rem; font-weight:700; cursor:pointer; transition:background .2s }
.btn-gold:hover { background:var(--gold-l) }
.btn-gold.btn-sm { padding:.42rem .9rem; font-size:.78rem }

/* ── LIST BODY ── */
.list-body { max-width:1280px; margin:0 auto; padding:1.5rem 1.5rem 3rem }

.results-bar { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.25rem; font-size:.8rem; color:#9a8a72 }
.results-cnt strong { color:var(--ink); font-size:.9rem }
.results-page { font-weight:600; color:var(--gold) }

/* GRID */
.grid-wrap { display:grid; grid-template-columns:repeat(auto-fill,minmax(230px,1fr)); gap:1.25rem }
.grid-card { background:#fff; border:1px solid var(--border); border-radius:3px; overflow:hidden; cursor:pointer; transition:transform .3s, box-shadow .3s }
.grid-card:hover { transform:translateY(-5px); box-shadow:var(--shd-lg) }

.gc-thumb { position:relative; height:165px; overflow:hidden }
.gc-img   { width:100%; height:100%; object-fit:cover; transition:transform .5s }
.grid-card:hover .gc-img { transform:scale(1.05) }
.gc-dark  { position:absolute; inset:0; background:linear-gradient(to top,rgba(26,18,8,.4),transparent 55%) }
.gc-play  { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:38px; height:38px; border-radius:50%; background:rgba(196,146,42,.88); color:#fff; display:flex; align-items:center; justify-content:center; font-size:.85rem; opacity:0; transition:opacity .25s }
.grid-card:hover .gc-play { opacity:1 }
.gc-type  { position:absolute; top:.5rem; left:.5rem; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:.68rem; color:#fff }
.gc-type.video { background:rgba(139,58,30,.88) } .gc-type.text { background:rgba(58,92,58,.88) } .gc-type.pdf { background:rgba(42,58,92,.88) }
.gc-dur   { position:absolute; bottom:.45rem; right:.5rem; font-size:.62rem; color:#fff; background:rgba(26,18,8,.62); padding:.15rem .42rem; border-radius:1px }
.gc-level { position:absolute; top:.5rem; right:.5rem; font-size:.58rem; font-weight:700; text-transform:uppercase; padding:.12rem .4rem; border-radius:1px }
.gc-level.lv-easy { background:rgba(46,125,50,.88); color:#fff }
.gc-level.lv-mid  { background:rgba(230,81,0,.88);  color:#fff }
.gc-level.lv-hard { background:rgba(183,28,28,.88); color:#fff }

.gc-body  { padding:.9rem }
.gc-topic { font-size:.62rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; display:block; margin-bottom:.35rem }
.gc-title { font-family:'Playfair Display',serif; font-size:.9rem; font-weight:700; color:var(--ink); margin:0 0 .3rem; line-height:1.35 }
.gc-desc  { font-size:.72rem; color:#5a4a35; line-height:1.55; margin:0 0 .65rem }
.gc-footer { display:flex; align-items:center; justify-content:space-between }
.gc-author { font-size:.68rem; color:#9a8a72; font-style:italic; display:flex; align-items:center; gap:.25rem }
.gc-author i { color:var(--gold); font-size:.62rem }
.gc-cat { font-size:.62rem; color:var(--gold); background:rgba(196,146,42,.08); padding:.1rem .38rem; border-radius:10px }

/* LIST */
.list-wrap { display:flex; flex-direction:column; gap:1rem }
.list-card { display:flex; align-items:center; gap:1rem; background:#fff; border:1px solid var(--border); border-radius:3px; overflow:hidden; cursor:pointer; transition:transform .25s, box-shadow .25s; padding:.85rem 1rem }
.list-card:hover { transform:translateX(4px); box-shadow:var(--shd) }

.lc-thumb-wrap { position:relative; flex-shrink:0; width:110px; height:72px; border-radius:2px; overflow:hidden }
.lc-img   { width:100%; height:100%; object-fit:cover }
.lc-play-sm { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:28px; height:28px; border-radius:50%; background:rgba(196,146,42,.9); color:#fff; display:flex; align-items:center; justify-content:center; font-size:.7rem; opacity:0; transition:opacity .2s }
.list-card:hover .lc-play-sm { opacity:1 }

.list-body-col { flex:1; min-width:0 }
.list-top  { display:flex; align-items:center; gap:.5rem; margin-bottom:.3rem; flex-wrap:wrap }
.list-type-label { font-size:.6rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; padding:.12rem .42rem; border-radius:1px; color:#fff }
.list-type-label.video { background:var(--rust) } .list-type-label.text { background:var(--sage) } .list-type-label.pdf { background:var(--navy) }
.list-title { font-family:'Playfair Display',serif; font-size:1rem; font-weight:700; color:var(--ink); margin:0 0 .25rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.list-desc  { font-size:.78rem; color:#5a4a35; margin:0 0 .4rem; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical }
.list-meta  { display:flex; flex-wrap:wrap; gap:.65rem; font-size:.7rem; color:#9a8a72 }
.list-meta i { color:var(--gold); margin-right:.2rem; font-size:.65rem }
.list-action { flex-shrink:0; margin-left:auto; padding-left:.5rem }

/* Shared chips */
.lv-easy { background:#e8f5e9; color:#2e7d32 }
.lv-mid  { background:#fff3e0; color:#e65100 }
.lv-hard { background:#fce4ec; color:#b71c1c }

/* Empty */
.empty-wrap { display:flex; flex-direction:column; align-items:center; gap:.75rem; padding:5rem 2rem; text-align:center; color:#9a8a72; font-style:italic }
.empty-wrap i { font-size:2.5rem; color:var(--border) }
.empty-wrap p { margin:0; font-size:1rem; color:#7a6a52 }

/* Pagination */
.pagination { display:flex; align-items:center; justify-content:center; gap:.4rem; margin-top:2.5rem; flex-wrap:wrap }
.pg-btn { width:36px; height:36px; border:1.5px solid var(--border); border-radius:2px; background:#fff; color:#7a6a52; display:flex; align-items:center; justify-content:center; font-size:.8rem; cursor:pointer; transition:all .2s }
.pg-btn:hover:not(:disabled) { border-color:var(--gold); color:var(--gold) }
.pg-btn:disabled { opacity:.28; cursor:not-allowed }
.pg-num { width:36px; height:36px; border:1.5px solid var(--border); border-radius:2px; background:#fff; color:#7a6a52; font-family:'Source Serif 4',serif; font-size:.82rem; cursor:pointer; transition:all .2s }
.pg-num:hover { border-color:var(--gold); color:var(--gold) }
.pg-num.active { background:var(--gold); border-color:var(--gold); color:#fff; font-weight:700 }
.pg-dots { font-size:.85rem; color:#b0a090; padding:0 .25rem }

/* Transitions */
.fade-grid-enter-active,.fade-grid-leave-active { transition:opacity .25s, transform .25s }
.fade-grid-enter-from,.fade-grid-leave-to { opacity:0; transform:scale(.97) }
.fade-list-enter-active,.fade-list-leave-active { transition:opacity .22s }
.fade-list-enter-from,.fade-list-leave-to { opacity:0 }
</style>