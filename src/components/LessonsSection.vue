<template>
  <section class="lessons-section">

    <!-- ══ HEADER ══════════════════════════════════════ -->
    <div class="section-header">
      <div class="orn-row">
        <span class="orn-line"/><span class="orn-diamond">◆</span><span class="orn-line"/>
      </div>
      <h2 class="section-title">
        <span class="title-kz">Сабақтар</span>
        <span class="title-div">/</span>
        <span class="title-ru">Уроки</span>
      </h2>
      <p class="section-sub">Қазақ әдебиеті бойынша жүйеленген оқу материалдары</p>
    </div>

    <!-- ══ LOADING ══════════════════════════════════════ -->
    <div v-if="loading" class="db-state">
      <div class="db-spinner"/>
      <p>Сабақтар жүктелуде…</p>
    </div>

    <!-- ══ ERROR ════════════════════════════════════════ -->
    <div v-else-if="loadError" class="db-state error">
      <i class="pi pi-exclamation-triangle"/>
      <p>{{ loadError }}</p>
      <button class="retry-btn" @click="init(true)">
        <i class="pi pi-refresh"/> Қайта жүктеу
      </button>
    </div>

    <!-- ══ CONTENT ══════════════════════════════════════ -->
    <template v-else>

      <!-- DB badge -->
      <div class="db-badge">
        <i class="pi pi-database"/>
        <span>
          <strong>{{ allLessons.length }}</strong> сабақ ·
          <span class="btype video">{{ countByType('video') }} видео</span>
          <span class="btype pdf">{{ countByType('pdf') }} PDF</span>
        </span>
        <span class="db-file">📁 Sabaqtar_MB.xlsx</span>
      </div>

      <!-- Type tabs -->
      <div class="type-tabs">
        <button
            v-for="t in TYPE_TABS" :key="t.key"
            class="type-tab" :class="[t.key, { active: activeType === t.key }]"
            @click="activeType = t.key"
        >
          <i :class="'pi ' + t.icon"/>
          {{ t.label }}
          <span class="tab-cnt">{{ t.key === 'all' ? allLessons.length : countByType(t.key) }}</span>
        </button>
      </div>

      <!-- Featured lesson -->
      <div v-if="featured" class="featured-lesson" @click="openLesson(featured)">
        <div class="fl-media">
          <img :src="featured.cover" :alt="featured.title" class="fl-img"/>
          <div class="fl-dark"/>
          <div v-if="featured.type === 'video'" class="fl-play"><i class="pi pi-play"/></div>
          <span class="fl-badge" :class="featured.type">
            <i :class="'pi ' + typeIcon(featured.type)"/>
            {{ typeLabel(featured.type) }}
          </span>
          <span class="fl-dur">{{ featured.duration }}</span>
        </div>
        <div class="fl-body">
          <div class="fl-top">
            <span class="topic-chip" :style="{ borderColor: topicColor(featured.topic) }">{{ featured.topic }}</span>
            <span class="level-chip" :class="lvlClass(featured.level)">{{ featured.level }}</span>
          </div>
          <h3 class="fl-title">{{ featured.title }}</h3>
          <p class="fl-desc">{{ featured.description }}</p>
          <div class="fl-meta">
            <span><i class="pi pi-user"/> {{ featured.author }}</span>
            <span><i class="pi pi-clock"/> {{ featured.duration }}</span>
            <span><i class="pi pi-folder"/> {{ featured.category }}</span>
          </div>
          <button class="btn-gold">
            <i :class="'pi ' + (featured.type === 'video' ? 'pi-play' : 'pi-book')"/>
            {{ featured.type === 'video' ? 'Видеоны қарау' : 'Оқуды бастау' }}
          </button>
        </div>
      </div>

      <!-- Grid — max 12 items -->
      <div class="lessons-grid">
        <transition-group name="card-fade" tag="div" class="grid-inner">
          <article
              v-for="lesson in previewLessons"
              :key="lesson.id"
              class="lesson-card"
              @click="openLesson(lesson)"
          >
            <div class="lc-thumb">
              <img :src="lesson.cover" :alt="lesson.title" class="lc-img"/>
              <div class="lc-dark"/>
              <div v-if="lesson.type === 'video'" class="lc-play"><i class="pi pi-play"/></div>
              <span class="lc-badge" :class="lesson.type">
                <i :class="'pi ' + typeIcon(lesson.type)"/>
              </span>
              <span class="lc-dur">{{ lesson.duration }}</span>
            </div>
            <div class="lc-body">
              <div class="lc-top">
                <span class="lc-topic" :style="{ color: topicColor(lesson.topic) }">{{ lesson.topic }}</span>
                <span class="level-chip" :class="lvlClass(lesson.level)">{{ lesson.level }}</span>
              </div>
              <h3 class="lc-title">{{ lesson.title }}</h3>
              <p class="lc-desc">{{ lesson.description }}</p>
              <div class="lc-footer">
                <span class="lc-author">{{ lesson.author }}</span>
                <span class="lc-cat">{{ lesson.category }}</span>
              </div>
            </div>
          </article>
        </transition-group>

        <div v-if="!previewLessons.length" class="empty-state">
          <i class="pi pi-search"/>
          <p>Сабақ табылмады</p>
        </div>
      </div>

      <!-- Load more — goes to LessonsList page -->
      <div class="load-more-row" v-if="allLessons.length > PREVIEW_LIMIT">
        <button class="load-more-btn" @click="goToAll">
          <i class="pi pi-th-large"/>
          Барлық сабақтар
          <span class="lm-cnt">{{ allLessons.length }}</span>
          <i class="pi pi-arrow-right"/>
        </button>
      </div>
    </template>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLessonsStoreCopy } from '@/composables/useLessonsStoreCopy.js'

const router = useRouter()
const { lessons: allLessons, loading, error: loadError, init } = useLessonsStoreCopy()

// ── Config ────────────────────────────────────────────
const PREVIEW_LIMIT = 12

const TYPE_TABS = [
  { key: 'all',   label: 'Барлығы',     icon: 'pi-th-large'    },
  { key: 'video', label: 'Видео сабақ', icon: 'pi-play-circle' },
  { key: 'pdf',   label: 'PDF',         icon: 'pi-file-pdf'    },
]

const TOPIC_COLORS = {
  'Классика':'#8b3a1e','Поэзия':'#4a5e4c','Проза':'#2a3a5c',
  'Эпос':'#5c3a1e','Теория':'#5a3a5a','Авторлар':'#c4922a','Шығармалар':'#2a5c3a',
}

// ── State ─────────────────────────────────────────────
const activeType = ref('all')

// ── Load ──────────────────────────────────────────────
onMounted(() => init())

function defaultCover(type) {
  return { video:'https://images.unsplash.com/photo-1476820865390-c52aeebb9891?w=600&q=80', text:'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&q=80', pdf:'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80' }[type]
}

// ── Computed ──────────────────────────────────────────
function countByType(t) { return allLessons.value.filter(l => l.type === t).length }

const filtered = computed(() => {
  if (activeType.value === 'all') return allLessons.value
  return allLessons.value.filter(l => l.type === activeType.value)
})

const featured = computed(() => filtered.value.find(l => l.featured) || filtered.value[0] || null)

// Max 12, без featured
const previewLessons = computed(() => {
  const list = filtered.value.filter(l => l.id !== featured.value?.id || l.type !== featured.value?.type)
  return list.slice(0, PREVIEW_LIMIT)
})

// ── Helpers ───────────────────────────────────────────
function typeIcon(t)  { return { video:'pi-play-circle', text:'pi-file-edit', pdf:'pi-file-pdf' }[t] || 'pi-book' }
function topicColor(t){ return TOPIC_COLORS[t] || '#c4922a' }
function lvlClass(l)  { return l === 'Оңай' ? 'lv-easy' : l === 'Жоғары' ? 'lv-hard' : 'lv-mid' }

// ── Navigation ────────────────────────────────────────
function openLesson(lesson) {
  router.push({ name: 'lesson-detail', params: { type: lesson.type, id: lesson.id } })
}
function goToAll() {
  router.push({ name: 'lessons-list', query: { type: activeType.value } })
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,300&display=swap');

.lessons-section {
  --ink:    #1a1208; --parch: #faf6ef;
  --gold:   #c4922a; --gold-l:#e8b94f;
  --rust:   #8b3a1e; --sage:  #3a5c3a;
  --navy:   #2a3a5c; --border:#d9cdb8;
  --dark:   #130e07;
  --shd:    0 4px 24px rgba(26,18,8,.10);
  --shd-lg: 0 12px 48px rgba(26,18,8,.18);
  background: var(--parch);
  padding: 3.5rem 1.5rem;
  max-width: 1280px; margin: 0 auto;
  font-family: 'Source Serif 4', Georgia, serif;
}

/* Header */
.section-header { text-align:center; margin-bottom:2.5rem }
.orn-row  { display:flex; align-items:center; justify-content:center; gap:.75rem; margin-bottom:1rem }
.orn-line { display:block; height:1px; width:80px; background:linear-gradient(90deg,transparent,var(--gold)) }
.orn-line:last-child { background:linear-gradient(90deg,var(--gold),transparent) }
.orn-diamond { color:var(--gold); font-size:.7rem }
.section-title { font-family:'Playfair Display',serif; font-size:clamp(2rem,4vw,2.75rem); font-weight:900; color:var(--ink); margin:0 0 .5rem }
.title-kz { color:var(--ink) } .title-div { color:var(--gold); margin:0 .5rem }
.title-ru { color:var(--rust); font-style:italic; font-weight:600; font-size:80% }
.section-sub { color:#7a6a52; font-size:.95rem; font-style:italic; margin:0 }

/* DB state */
.db-state { display:flex; flex-direction:column; align-items:center; gap:1rem; padding:5rem 2rem; text-align:center; color:#7a6a52 }
.db-state.error i { font-size:2.5rem; color:var(--gold) }
.db-spinner { width:44px; height:44px; border:3px solid rgba(196,146,42,.18); border-top-color:var(--gold); border-radius:50%; animation:spin .75s linear infinite }
@keyframes spin { to { transform:rotate(360deg) } }
.retry-btn { display:inline-flex; align-items:center; gap:.4rem; background:var(--gold); color:#fff; border:none; padding:.5rem 1.3rem; border-radius:2px; font-family:'Source Serif 4',serif; font-size:.85rem; font-weight:600; cursor:pointer; transition:background .2s }
.retry-btn:hover { background:var(--gold-l) }

/* DB badge */
.db-badge { display:flex; flex-wrap:wrap; align-items:center; gap:.6rem; padding:.6rem 1rem; background:#fff; border:1px solid var(--border); border-left:4px solid var(--gold); border-radius:2px; font-size:.78rem; color:#5a4a35; margin-bottom:1.5rem }
.db-badge i { color:var(--gold) } .db-badge strong { color:var(--ink) }
.db-file { margin-left:auto; font-size:.65rem; color:#b0a090; font-family:monospace }
.btype { font-weight:700; padding:.1rem .42rem; border-radius:10px; font-size:.68rem }
.btype.video { background:rgba(139,58,30,.1); color:var(--rust) }
.btype.text  { background:rgba(58,92,58,.1);  color:var(--sage) }
.btype.pdf   { background:rgba(42,58,92,.1);  color:var(--navy) }

/* Type tabs */
.type-tabs { display:flex; flex-wrap:wrap; gap:.5rem; margin-bottom:2rem }
.type-tab { display:flex; align-items:center; gap:.4rem; padding:.48rem 1rem; border:1.5px solid var(--border); border-radius:2px; background:transparent; color:#7a6a52; font-family:'Source Serif 4',serif; font-size:.82rem; cursor:pointer; transition:all .22s }
.type-tab:hover { border-color:var(--gold); color:var(--gold) }
.type-tab.active { font-weight:600; color:#fff; border-color:transparent }
.type-tab.all.active { background:var(--gold) }
.type-tab.video.active { background:var(--rust) }
.type-tab.text.active  { background:var(--sage) }
.type-tab.pdf.active   { background:var(--navy) }
.tab-cnt { font-size:.65rem; background:rgba(255,255,255,.25); padding:.05rem .35rem; border-radius:10px }
.type-tab:not(.active) .tab-cnt { background:rgba(196,146,42,.1); color:var(--gold) }

/* Featured */
.featured-lesson { display:grid; grid-template-columns:1fr 1fr; background:#fff; border:1px solid var(--border); border-radius:3px; overflow:hidden; cursor:pointer; box-shadow:var(--shd); margin-bottom:1.75rem; transition:box-shadow .3s }
.featured-lesson:hover { box-shadow:var(--shd-lg) }
@media(max-width:700px) { .featured-lesson { grid-template-columns:1fr } }

.fl-media { position:relative; min-height:240px; overflow:hidden }
.fl-img   { width:100%; height:100%; object-fit:cover; transition:transform .5s }
.featured-lesson:hover .fl-img { transform:scale(1.04) }
.fl-dark  { position:absolute; inset:0; background:linear-gradient(135deg,rgba(26,18,8,.45),transparent 60%) }
.fl-play  { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:52px; height:52px; border-radius:50%; background:rgba(196,146,42,.9); color:#fff; display:flex; align-items:center; justify-content:center; font-size:1.1rem; transition:transform .25s, background .25s }
.featured-lesson:hover .fl-play { transform:translate(-50%,-50%) scale(1.1); background:var(--gold-l) }
.fl-badge { position:absolute; top:.75rem; left:.75rem; display:flex; align-items:center; gap:.3rem; font-size:.62rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; padding:.2rem .6rem; border-radius:1px; color:#fff }
.fl-badge.video { background:rgba(139,58,30,.9) } .fl-badge.text { background:rgba(58,92,58,.9) } .fl-badge.pdf { background:rgba(42,58,92,.9) }
.fl-dur { position:absolute; bottom:.75rem; right:.75rem; font-size:.7rem; color:#fff; background:rgba(26,18,8,.65); padding:.18rem .5rem; border-radius:1px }

.fl-body  { padding:1.5rem; display:flex; flex-direction:column }
.fl-top   { display:flex; align-items:center; gap:.55rem; margin-bottom:.85rem }
.topic-chip { font-size:.62rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--gold); border:1px solid; padding:.15rem .5rem; border-radius:1px }
.level-chip { font-size:.6rem; font-weight:700; letter-spacing:.07em; text-transform:uppercase; padding:.15rem .48rem; border-radius:1px }
.level-chip.lv-easy { background:#e8f5e9; color:#2e7d32 }
.level-chip.lv-mid  { background:#fff3e0; color:#e65100 }
.level-chip.lv-hard { background:#fce4ec; color:#b71c1c }
.fl-title { font-family:'Playfair Display',serif; font-size:1.35rem; font-weight:900; color:var(--ink); margin:0 0 .65rem; line-height:1.3 }
.fl-desc  { font-size:.875rem; color:#5a4a35; line-height:1.7; margin:0 0 1rem; flex:1 }
.fl-meta  { display:flex; flex-wrap:wrap; gap:.65rem; font-size:.72rem; color:#9a8a72; margin-bottom:1.25rem }
.fl-meta i { color:var(--gold); margin-right:.2rem; font-size:.7rem }
.btn-gold { display:inline-flex; align-items:center; gap:.5rem; align-self:flex-start; background:var(--gold); color:#fff; border:none; padding:.62rem 1.4rem; border-radius:2px; font-family:'Source Serif 4',serif; font-size:.85rem; font-weight:700; cursor:pointer; transition:background .22s }
.btn-gold:hover { background:var(--gold-l) }

/* Grid */
.lessons-grid { margin-bottom:1.75rem }
.grid-inner { display:grid; grid-template-columns:repeat(auto-fill,minmax(230px,1fr)); gap:1.25rem }
.lesson-card { background:#fff; border:1px solid var(--border); border-radius:3px; overflow:hidden; cursor:pointer; transition:transform .3s, box-shadow .3s }
.lesson-card:hover { transform:translateY(-5px); box-shadow:var(--shd-lg) }

.lc-thumb { position:relative; height:165px; overflow:hidden }
.lc-img   { width:100%; height:100%; object-fit:cover; transition:transform .5s }
.lesson-card:hover .lc-img { transform:scale(1.05) }
.lc-dark  { position:absolute; inset:0; background:linear-gradient(to top,rgba(26,18,8,.4),transparent 55%) }
.lc-play  { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:38px; height:38px; border-radius:50%; background:rgba(196,146,42,.88); color:#fff; display:flex; align-items:center; justify-content:center; font-size:.85rem; opacity:0; transition:opacity .25s }
.lesson-card:hover .lc-play { opacity:1 }
.lc-badge { position:absolute; top:.5rem; left:.5rem; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:.68rem; color:#fff }
.lc-badge.video { background:rgba(139,58,30,.88) } .lc-badge.text { background:rgba(58,92,58,.88) } .lc-badge.pdf { background:rgba(42,58,92,.88) }
.lc-dur { position:absolute; bottom:.45rem; right:.5rem; font-size:.62rem; color:#fff; background:rgba(26,18,8,.62); padding:.15rem .42rem; border-radius:1px }

.lc-body  { padding:.9rem }
.lc-top   { display:flex; align-items:center; justify-content:space-between; margin-bottom:.35rem }
.lc-topic { font-size:.62rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase }
.lc-title { font-family:'Playfair Display',serif; font-size:.9rem; font-weight:700; color:var(--ink); margin:0 0 .3rem; line-height:1.35 }
.lc-desc  { font-size:.72rem; color:#5a4a35; line-height:1.55; margin:0 0 .6rem }
.lc-footer { display:flex; align-items:center; justify-content:space-between }
.lc-author { font-size:.68rem; color:#9a8a72; font-style:italic }
.lc-cat    { font-size:.62rem; color:var(--gold); background:rgba(196,146,42,.08); padding:.1rem .38rem; border-radius:10px }

/* Empty */
.empty-state { text-align:center; padding:3rem; color:#9a8a72; font-style:italic }
.empty-state i { font-size:2rem; display:block; margin-bottom:.75rem; color:var(--border) }

/* Load more */
.load-more-row { display:flex; justify-content:center }
.load-more-btn {
  display:inline-flex; align-items:center; gap:.6rem;
  border:1.5px solid var(--gold); border-radius:2px;
  background:transparent; color:var(--gold);
  font-family:'Source Serif 4',serif; font-size:.9rem; font-weight:700;
  padding:.75rem 2rem; cursor:pointer; transition:all .25s;
}
.load-more-btn:hover { background:var(--gold); color:#fff }
.lm-cnt { background:rgba(196,146,42,.15); color:var(--gold); font-size:.72rem; font-weight:700; padding:.1rem .5rem; border-radius:10px; transition:all .25s }
.load-more-btn:hover .lm-cnt { background:rgba(255,255,255,.25); color:#fff }

/* Transitions */
.card-fade-enter-active,.card-fade-leave-active { transition:opacity .28s, transform .28s }
.card-fade-enter-from,.card-fade-leave-to { opacity:0; transform:scale(.97) }
</style>