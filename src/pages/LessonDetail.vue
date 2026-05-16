<template>
  <div class="lesson-detail-page">

    <!-- ══ LOADING ══════════════════════════════════════ -->
    <div v-if="status === 'loading'" class="state-screen">
      <div class="spinner"/>
      <p>Сабақ жүктелуде…</p>
    </div>

    <!-- ══ ERROR ════════════════════════════════════════ -->
    <div v-else-if="status === 'error'" class="state-screen error">
      <i class="pi pi-exclamation-triangle"/>
      <p>{{ errorMsg }}</p>
      <div class="state-btns">
        <button class="btn-gold" @click="init"><i class="pi pi-refresh"/> Қайта жүктеу</button>
        <button class="btn-outline" @click="$router.back()"><i class="pi pi-arrow-left"/> Артқа</button>
      </div>
    </div>

    <!-- ══ NOT FOUND ════════════════════════════════════ -->
    <div v-else-if="status === 'notfound'" class="state-screen error">
      <i class="pi pi-search"/>
      <p>Сабақ табылмады</p>
      <p class="state-hint">ID: {{ route.params.id }} · Тип: {{ route.params.type }}</p>
      <button class="btn-outline" @click="$router.back()">
        <i class="pi pi-arrow-left"/> Сабақтар тізіміне
      </button>
    </div>

    <!-- ══ READY ══════════════════════════════════════════ -->
    <template v-else-if="status === 'ready' && lesson">

      <!-- ── HERO ─────────────────────────────────────── -->
      <section class="hero" :class="lesson.type">
        <div class="hero-bg">
          <img :src="lesson.cover" class="hero-bg-img" :alt="lesson.title"/>
          <div class="hero-gradient"/>
          <div class="hero-dots"/>
        </div>

        <div class="hero-wrap">
          <!-- Breadcrumb -->
          <nav class="breadcrumb">
            <button class="bc-btn" @click="$router.push('/')"><i class="pi pi-home"/></button>
            <span class="bc-sep">›</span>
            <button class="bc-btn" @click="$router.push('/lessons')">Сабақтар</button>
            <span class="bc-sep">›</span>
            <span class="bc-cur">{{ lesson.title }}</span>
          </nav>

          <div class="hero-grid">
            <!-- Left -->
            <div class="hero-left">
              <div class="badge-row">
                <span class="badge-type" :class="lesson.type">
                  <i :class="'pi ' + typeIcon(lesson.type)"/>
                  {{ typeLabel(lesson.type) }}
                </span>
                <span class="badge-level" :class="lvlClass(lesson.level)">{{ lesson.level }}</span>
                <span class="badge-topic">{{ lesson.topic }}</span>
              </div>

              <h1 class="hero-title">{{ lesson.title }}</h1>
              <p class="hero-desc">{{ lesson.description }}</p>

              <div class="hero-meta">
                <div class="author-row">
                  <div class="author-ava">{{ lesson.author?.[0] || 'A' }}</div>
                  <div>
                    <span class="author-role">Оқытушы</span>
                    <span class="author-name">{{ lesson.author }}</span>
                  </div>
                </div>
                <div class="meta-chips">
                  <span class="mc"><i class="pi pi-clock"/>{{ lesson.duration }}</span>
                  <span class="mc"><i class="pi pi-folder"/>{{ lesson.category }}</span>
                  <span class="mc"><i class="pi pi-list"/>{{ chapters.length }} тарау</span>
                  <span class="mc"><i class="pi pi-paperclip"/>{{ materials.length }} файл</span>
                </div>
              </div>

              <div class="hero-stars" v-if="avgRating > 0">
                <span v-for="i in 5" :key="i" class="hstar" :class="{ on: i <= Math.round(avgRating) }">★</span>
                <span class="hstar-num">{{ avgRating.toFixed(1) }}</span>
                <span class="hstar-cnt">({{ comments.length }} пікір)</span>
              </div>

              <div class="hero-btns">
                <button class="btn-gold" @click="scrollToContent">
                  <i :class="'pi ' + (lesson.type === 'video' ? 'pi-play' : 'pi-book')"/>
                  {{ lesson.type === 'video' ? 'Видеоны қарау' : 'Оқуды бастау' }}
                </button>
                <button class="btn-ghost" @click="saved = !saved">
                  <i :class="saved ? 'pi pi-bookmark-fill' : 'pi pi-bookmark'"/>
                  {{ saved ? 'Сақталды' : 'Сақтау' }}
                </button>
              </div>
            </div>

            <!-- Right: card -->
            <div class="hero-card">
              <div class="hc-thumb" @click="scrollToContent">
                <img :src="lesson.cover" class="hc-img"/>
                <div class="hc-dark"/>
                <button v-if="lesson.type === 'video'" class="hc-play">
                  <i class="pi pi-play"/>
                </button>
                <div v-else class="hc-type-ico">
                  <i :class="'pi ' + typeIcon(lesson.type)"/>
                </div>
              </div>
              <div class="hc-rows">
                <div class="hc-row"><i class="pi pi-clock"/>{{ lesson.duration }}</div>
                <div class="hc-row"><i class="pi pi-list"/>{{ chapters.length }} тарау</div>
                <div class="hc-row"><i class="pi pi-paperclip"/>{{ materials.length }} материал</div>
                <div class="hc-row hc-db">
                  <i class="pi pi-database"/>Excel дерекқордан
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── BODY ─────────────────────────────────────── -->
      <div class="body-wrap">
        <div class="body-grid">

          <!-- Main column -->
          <main class="main-col">

            <!-- Tab nav -->
            <div class="tab-nav" id="lesson-content-anchor">
              <button
                  v-for="tab in tabList" :key="tab.key"
                  class="tab-btn" :class="{ active: activeTab === tab.key }"
                  @click="activeTab = tab.key"
              >
                <i :class="'pi ' + tab.icon"/>{{ tab.label }}
              </button>
            </div>

            <!-- ══ TAB: МАЗМҰН ════════════════════════ -->
            <div v-show="activeTab === 'content'" class="tab-panel">

              <!-- ─── VIDEO ────────────────────────── -->
              <VideoPlayer
                  v-if="lesson.type === 'video'"
                  :src="lesson.fileUrl"
                  :poster="lesson.cover"
                  :title="lesson.title"
                  :duration="lesson.duration"
                  @progress="videoProgress = $event"
              />

              <!-- ─── PDF ──────────────────────────── -->
              <PdfViewer
                  v-else-if="lesson.type === 'pdf'"
                  :src="lesson.fileUrl"
                  :title="lesson.title"
              />

              <!-- Chapters list -->
              <div v-if="chapters.length" class="chapters-panel">
                <div class="panel-head">
                  <i class="pi pi-list-check"/>Тараулар
                  <span class="panel-cnt">{{ chapters.length }}</span>
                </div>
                <div
                    v-for="ch in chapters"
                    :key="ch.order"
                    class="chapter-row"
                    :class="{ active: activeCh === ch.order }"
                    @click="activeCh = ch.order"
                >
                  <span class="ch-num">{{ ch.order }}</span>
                  <div class="ch-body">
                    <span class="ch-title">{{ ch.title }}</span>
                    <span class="ch-sub">{{ ch.content }}</span>
                  </div>
                  <span class="ch-time">{{ ch.time }}</span>
                </div>
              </div>
            </div>

            <!-- ══ TAB: МАТЕРИАЛДАР ════════════════ -->
            <div v-show="activeTab === 'materials'" class="tab-panel">
              <div v-if="materials.length" class="materials-list">
                <div v-for="mat in materials" :key="mat.order" class="mat-row">
                  <div class="mat-ico" :class="mat.fileType">
                    <i :class="'pi ' + matIcon(mat.fileType)"/>
                  </div>
                  <div class="mat-info">
                    <span class="mat-name">{{ mat.title }}</span>
                    <span class="mat-sub">{{ mat.size }} · {{ (mat.fileType || '').toUpperCase() }}</span>
                    <code class="mat-path">{{ mat.fileUrl }}</code>
                  </div>
                  <a :href="mat.fileUrl" download class="mat-dl">
                    <i class="pi pi-download"/>Жүктеу
                  </a>
                </div>
              </div>
              <div v-else class="empty-state">
                <i class="pi pi-paperclip"/>
                <p>Материал жоқ</p>
                <span class="empty-hint">Supabase · lesson_materials кестесіне қосыңыз</span>
              </div>
            </div>

            <!-- ══ TAB: КОНСПЕКТ (Notes) ══════════ -->
            <div v-show="activeTab === 'notes'" class="tab-panel">
              <textarea
                  v-model="notes"
                  class="notes-ta"
                  placeholder="Конспект жазыңыз…"
                  rows="14"
              />
              <div class="notes-bar">
                <span class="notes-hint"><i class="pi pi-info-circle"/>{{ notesWordCount }} сөз</span>
                <button class="btn-gold btn-sm" @click="saveNotes">
                  <i class="pi pi-check"/>Сақтау
                </button>
              </div>
            </div>

            <!-- ══ TAB: ПІКІРЛЕР ══════════════════════ -->
            <div v-show="activeTab === 'comments'" class="tab-panel">
              <div v-if="comments.length" class="comments-list">
                <div v-for="c in comments" :key="c.id" class="comment-card">
                  <div class="cc-ava" :class="{ 'ava-user': c.isNew }">
                    {{ (c.studentName || c.author || '?')[0] }}
                  </div>
                  <div class="cc-body">
                    <div class="cc-top">
                      <span class="cc-name">{{ c.studentName || c.author }}</span>
                      <span class="cc-date">{{ c.date }}</span>
                      <span v-if="c.isNew" class="cc-new-badge">Жаңа</span>
                    </div>
                    <div class="cc-stars">
                      <span v-for="i in 5" :key="i" class="cstar" :class="{ on: i <= c.rating }">★</span>
                      <span class="cstar-num">{{ c.rating }}.0</span>
                    </div>
                    <p class="cc-text">{{ c.text }}</p>
                    <!-- Мұғалім жауабы -->
                    <div v-if="c.reply" class="cc-reply">
                      <span class="cc-reply-label">
                        <i class="pi pi-reply"/> Мұғалім жауабы
                      </span>
                      <p class="cc-reply-text">{{ c.reply }}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="empty-state">
                <i class="pi pi-comments"/>
                <p>Пікір жоқ — бірінші болыңыз!</p>
              </div>

              <div class="comment-form">
                <h4 class="cf-head">Пікір қалдыру</h4>
                <div class="cf-stars">
                  <span
                      v-for="i in 5" :key="i"
                      class="cf-star" :class="{ on: i <= myRating }"
                      @click="myRating = i"
                  >★</span>
                </div>
                <textarea
                    v-model="myComment"
                    class="cf-ta"
                    placeholder="Пікіріңізді жазыңыз…"
                    rows="3"
                />
                <button class="btn-gold btn-sm" @click="submitComment"
                        :disabled="!myComment.trim() || sending">
                  <div v-if="sending" class="cf-spin"/>
                  <template v-else>
                    <i class="pi pi-send"/> Жіберу
                  </template>
                </button>
                <p class="cf-hint">
                  <i class="pi pi-database" style="color:#3ecf8e"/>
                  Пікір Supabase-ке сақталады
                </p>
              </div>
            </div>

          </main>

          <!-- Sidebar -->
          <aside class="sidebar-col">

            <div class="sb-card">
              <div class="inst-row">
                <div class="inst-ava">{{ lesson.author?.[0] || 'A' }}</div>
                <div>
                  <p class="inst-name">{{ lesson.author }}</p>
                  <p class="inst-role">Әдебиет оқытушысы</p>
                </div>
              </div>
            </div>

            <div class="sb-card">
              <div class="sb-head"><i class="pi pi-info-circle"/>Сабақ туралы</div>
              <ul class="info-list">
                <li v-for="row in infoRows" :key="row.label">
                  <span class="il-label"><i :class="'pi ' + row.icon"/>{{ row.label }}</span>
                  <span class="il-val">{{ row.val }}</span>
                </li>
              </ul>
            </div>

            <!-- Type-specific info card -->
            <div class="sb-card type-card" :class="lesson.type">
              <div class="tc-icon"><i :class="'pi ' + typeIcon(lesson.type)"/></div>
              <div>
                <span class="tc-title">{{ typeLabel(lesson.type) }}</span>
                <span class="tc-desc">
                  <template v-if="lesson.type === 'video'">
                    YouTube немесе MP4 форматта ойнатылады
                  </template>
                  <template v-else-if="lesson.type === 'pdf'">
                    vue-pdf-embed арқылы іштен ашылады
                  </template>
                  <template v-else>
                    Markdown/текст форматты конспект
                  </template>
                </span>
              </div>
            </div>

            <div class="sb-card sb-dark">
              <i class="pi pi-database sb-db-icon"/>
              <div>
                <span class="sb-db-title">Дерекқор көзі</span>
                <span class="sb-db-desc">Сабақтар · Тараулар · Материалдар · Пікірлер</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth }          from '@/composables/useAuth'
import { useLessonsStore }  from '@/composables/useLessonsStore'
import { useCommentsStore } from '@/composables/useCommentsStore'
import { supabase }         from '@/composables/useSupabase'
import PdfViewer from "@/components/PdfViewer.vue";
import VideoPlayer from "@/components/VideoPlayer.vue";

const route  = useRoute()
const router = useRouter()

const { currentUser }     = useAuth()
const { init: lessonsInit, getById } = useLessonsStore()
const {
  init:       commentsInit,
  addComment,
  getByLesson,
} = useCommentsStore()

// ─── State ────────────────────────────────────────────
const status    = ref('loading')
const errorMsg  = ref('')
const lesson    = ref(null)
const chapters  = ref([])
const materials = ref([])

const activeTab  = ref('content')
const activeCh   = ref(1)
const notes      = ref('')
const myComment  = ref('')
const myRating   = ref(0)
const sending    = ref(false)

// ─── Пікірлер — useCommentsStore арқылы ──────────────
// lesson.value?.title бойынша getByLesson computed қайтарады
const comments = computed(() =>
    lesson.value
        ? getByLesson(lesson.value.title).value
        : []
)

// ─── Init ─────────────────────────────────────────────
onMounted(() => init())
watch(() => [route.params.type, route.params.id], () => init())

async function init() {
  const type = String(route.params.type || 'video')
  const id   = Number(route.params.id   || 1)

  status.value   = 'loading'
  errorMsg.value = ''
  lesson.value   = null
  chapters.value = []
  materials.value= []
  notes.value    = ''

  try {
    // 1. Lessons store-ын жүктеу (singleton — бір рет жүктеледі)
    await lessonsInit()

    // 2. Сабақты id бойынша табу
    const found = getById(id)
    if (!found) { status.value = 'notfound'; return }
    if (found.type !== type) {
      // type параметрі дұрыс емес — redirect
      router.replace({ name:'lesson-detail', params:{ type: found.type, id } })
      return
    }
    lesson.value = found

    // 3. Chapters — Supabase lesson_chapters кестесі (болса)
    await loadChapters(id)

    // 4. Materials — Supabase lesson_materials кестесі (болса)
    await loadMaterials(id)

    // 5. Пікірлер — useCommentsStore (Supabase comments кестесі)
    await commentsInit()

    status.value = 'ready'
  } catch(e) {
    status.value   = 'error'
    errorMsg.value = e.message
    console.error('[LessonDetail]', e)
  }
}

// ─── Chapters — Supabase ──────────────────────────────
async function loadChapters(lessonId) {
  try {
    const { data, error } = await supabase
        .from('lesson_chapters')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_num', { ascending: true })
    if (error) throw error
    chapters.value = (data || []).map(r => ({
      title:   r.title   || '',
      time:    r.time    || '',
      content: r.content || '',
      fileUrl: r.file_url|| '',
      order:   r.order_num || 0,
    }))
  } catch {
    // Кесте жоқ болса — бос тізім (қосымша кесте міндетті емес)
    chapters.value = []
  }
}

// ─── Materials — Supabase ─────────────────────────────
async function loadMaterials(lessonId) {
  try {
    const { data, error } = await supabase
        .from('lesson_materials')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_num', { ascending: true })
    if (error) throw error
    materials.value = (data || []).map(r => ({
      title:   r.title    || '',
      fileType:(r.file_type || 'pdf').toLowerCase(),
      size:    r.size     || '',
      fileUrl: r.file_url || '',
      order:   r.order_num|| 0,
    }))
  } catch {
    materials.value = []
  }
}

// ─── Computed ─────────────────────────────────────────
const avgRating = computed(() =>
    !comments.value.length ? 0
        : comments.value.reduce((s, c) => s + c.rating, 0) / comments.value.length
)

const notesWordCount = computed(() =>
    notes.value.trim() ? notes.value.trim().split(/\s+/).length : 0
)

const tabList = computed(() => [
  { key:'content',   label:'Мазмұн',                                   icon:'pi-play-circle' },
  { key:'materials', label:`Материалдар (${materials.value.length})`,   icon:'pi-folder'      },
  { key:'notes',     label:'Конспект',                                  icon:'pi-pencil'      },
  { key:'comments',  label:`Пікірлер (${comments.value.length})`,       icon:'pi-comments'    },
])

const infoRows = computed(() => lesson.value ? [
  { icon:'pi-clock',     label:'Ұзақтығы',    val: lesson.value.duration                                },
  { icon:'pi-tag',       label:'Тақырып',     val: lesson.value.topic                                  },
  { icon:'pi-chart-bar', label:'Деңгей',      val: lesson.value.level                                  },
  { icon:'pi-folder',    label:'Санат',        val: lesson.value.category                               },
  { icon:'pi-list',      label:'Тараулар',    val: chapters.value.length  + ' бөлім'                  },
  { icon:'pi-paperclip', label:'Материалдар', val: materials.value.length + ' файл'                   },
  { icon:'pi-star',      label:'Рейтинг',     val: avgRating.value > 0 ? avgRating.value.toFixed(1) + ' / 5' : '—' },
] : [])

// ─── Helpers ──────────────────────────────────────────
function typeIcon(t)  { return { video:'pi-play-circle', text:'pi-file-edit', pdf:'pi-file-pdf' }[t] || 'pi-book' }
function typeLabel(t) { return { video:'Видео сабақ', text:'Конспект', pdf:'PDF материал' }[t] || t }
function matIcon(t)   { return { pdf:'pi-file-pdf', docx:'pi-file-word', link:'pi-link', mp4:'pi-video' }[t] || 'pi-file' }
function lvlClass(l)  { return l === 'Оңай' ? 'lv-easy' : l === 'Жоғары' ? 'lv-hard' : 'lv-mid' }

function defaultCover(t) {
  return {
    video:'https://images.unsplash.com/photo-1476820865390-c52aeebb9891?w=900&q=80',
    text: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=900&q=80',
    pdf:  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=900&q=80',
  }[t]
}

// ─── Actions ──────────────────────────────────────────
function scrollToContent() {
  document.getElementById('lesson-content-anchor')?.scrollIntoView({ behavior:'smooth' })
}

// Notes — localStorage-те сақтайды (жеке оқушының жазбалары)
function saveNotes() {
  const key = `lesson_notes_${route.params.type}_${route.params.id}`
  localStorage.setItem(key, notes.value)
}

onMounted(() => {
  const key = `lesson_notes_${route.params.type}_${route.params.id}`
  notes.value = localStorage.getItem(key) || ''
})

// Пікір жіберу → Supabase INSERT (useCommentsStore)
async function submitComment() {
  if (!myComment.value.trim() || !lesson.value) return
  sending.value = true
  try {
    await addComment({
      studentId:   currentUser.value?.id    || 'guest',
      studentName: currentUser.value?.name  || 'Оқушы',
      class:       currentUser.value?.class || '',
      lessonName:  lesson.value.title,
      rating:      myRating.value || 5,
      text:        myComment.value.trim(),
    })
    myComment.value = ''
    myRating.value  = 0
  } catch(e) {
    console.error('[LessonDetail] submitComment:', e)
  } finally {
    sending.value = false
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,300&display=swap');

.lesson-detail-page {
  --ink:    #1a1208; --parch: #faf6ef; --gold: #c4922a; --gold-l:#e8b94f;
  --rust:   #8b3a1e; --sage:  #3a5c3a; --navy: #2a3a5c; --border:#d9cdb8;
  --dark:   #130e07; --shd: 0 4px 24px rgba(26,18,8,.10); --shd-lg: 0 12px 48px rgba(26,18,8,.18);
  background: var(--parch); font-family: 'Source Serif 4', Georgia, serif;
  color: var(--ink); min-height: 100vh;
}

/* ── States ── */
.state-screen { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1rem; padding:8rem 2rem; min-height:60vh; text-align:center; color:#7a6a52; }
.state-screen.error i { font-size:2.5rem; color:var(--gold); }
.state-hint { font-size:.72rem; color:#b0a090; font-family:monospace; margin:0; }
.state-btns { display:flex; gap:.75rem; flex-wrap:wrap; justify-content:center; }
.spinner { width:44px; height:44px; border:3px solid rgba(196,146,42,.18); border-top-color:var(--gold); border-radius:50%; animation:spin .75s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }

/* ── Buttons ── */
.btn-gold { display:inline-flex; align-items:center; gap:.5rem; background:var(--gold); color:#fff; border:none; padding:.65rem 1.5rem; border-radius:2px; font-family:'Source Serif 4',serif; font-size:.875rem; font-weight:700; cursor:pointer; transition:background .2s; }
.btn-gold:hover { background:var(--gold-l); }
.btn-gold.btn-sm { padding:.45rem .95rem; font-size:.8rem; }
.btn-ghost { display:inline-flex; align-items:center; gap:.45rem; background:transparent; border:1.5px solid rgba(255,255,255,.28); color:rgba(255,255,255,.75); padding:.62rem 1.2rem; border-radius:2px; font-family:'Source Serif 4',serif; font-size:.875rem; cursor:pointer; transition:all .2s; }
.btn-ghost:hover { border-color:var(--gold); color:var(--gold-l); }
.btn-outline { display:inline-flex; align-items:center; gap:.45rem; background:transparent; border:1.5px solid var(--border); color:var(--ink); padding:.62rem 1.2rem; border-radius:2px; font-family:'Source Serif 4',serif; font-size:.875rem; cursor:pointer; transition:all .2s; }
.btn-outline:hover { border-color:var(--gold); color:var(--gold); }

/* ── Hero ── */
.hero { position:relative; overflow:hidden; }
.hero-bg { position:absolute; inset:0; }
.hero-bg-img { width:100%; height:100%; object-fit:cover; filter:brightness(.2) saturate(.5); }
.hero-gradient { position:absolute; inset:0; background:linear-gradient(120deg,rgba(19,14,7,.97) 0%,rgba(19,14,7,.75) 55%,rgba(19,14,7,.5) 100%); }
.hero-dots { position:absolute; inset:0; background-image:radial-gradient(circle,rgba(196,146,42,.05) 1px,transparent 1px); background-size:24px 24px; }
.hero-wrap { position:relative; z-index:2; max-width:1280px; margin:0 auto; padding:1.5rem 1.5rem 3rem; }
.breadcrumb { display:flex; align-items:center; gap:.4rem; margin-bottom:2rem; flex-wrap:wrap; }
.bc-btn { background:none; border:none; color:rgba(255,255,255,.38); font-family:'Source Serif 4',serif; font-size:.75rem; cursor:pointer; padding:0; transition:color .2s; }
.bc-btn:hover { color:var(--gold-l); }
.bc-sep { color:rgba(255,255,255,.18); font-size:.75rem; }
.bc-cur { font-size:.75rem; color:var(--gold-l); max-width:280px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.hero-grid { display:grid; grid-template-columns:1fr 290px; gap:3rem; align-items:start; }
@media(max-width:900px){ .hero-grid { grid-template-columns:1fr; } }

/* Badges */
.badge-row { display:flex; flex-wrap:wrap; gap:.45rem; margin-bottom:1rem; }
.badge-type { display:inline-flex; align-items:center; gap:.3rem; font-size:.6rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; padding:.2rem .58rem; border-radius:1px; color:#fff; }
.badge-type.video { background:rgba(139,58,30,.9); } .badge-type.text { background:rgba(58,92,58,.9); } .badge-type.pdf { background:rgba(42,58,92,.9); }
.badge-level { font-size:.6rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; padding:.2rem .55rem; border-radius:1px; }
.badge-level.lv-easy { background:rgba(232,245,233,.15); color:#81c784; border:1px solid rgba(129,199,132,.35); }
.badge-level.lv-mid  { background:rgba(255,243,224,.12); color:#ffb74d; border:1px solid rgba(255,183,77,.35); }
.badge-level.lv-hard { background:rgba(252,228,236,.12); color:#ef9a9a; border:1px solid rgba(239,154,154,.35); }
.badge-topic { font-size:.6rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--gold-l); border:1px solid rgba(196,146,42,.38); padding:.2rem .55rem; border-radius:1px; }

.hero-title { font-family:'Playfair Display',serif; font-size:clamp(1.6rem,3vw,2.5rem); font-weight:900; color:#fff; line-height:1.2; margin:0 0 .85rem; }
.hero-desc  { font-size:.9rem; color:rgba(255,255,255,.6); line-height:1.7; margin:0 0 1.2rem; font-style:italic; }

.hero-meta { display:flex; flex-wrap:wrap; gap:1.25rem; align-items:center; margin-bottom:1rem; }
.author-row { display:flex; align-items:center; gap:.6rem; }
.author-ava  { width:36px; height:36px; border-radius:50%; background:var(--gold); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:.85rem; flex-shrink:0; }
.author-role { display:block; font-size:.6rem; color:rgba(255,255,255,.3); text-transform:uppercase; letter-spacing:.07em; }
.author-name { display:block; font-size:.82rem; color:#fff; font-weight:600; }
.meta-chips  { display:flex; flex-wrap:wrap; gap:.55rem; }
.mc          { font-size:.72rem; color:rgba(255,255,255,.4); display:flex; align-items:center; gap:.25rem; }
.mc i        { color:var(--gold); font-size:.65rem; }

.hero-stars  { display:flex; align-items:center; gap:.2rem; margin-bottom:1.4rem; }
.hstar       { font-size:.95rem; color:rgba(255,255,255,.15); }
.hstar.on    { color:var(--gold-l); }
.hstar-num   { font-weight:700; font-size:.82rem; color:#fff; margin-left:.15rem; }
.hstar-cnt   { font-size:.68rem; color:rgba(255,255,255,.3); }

.hero-btns  { display:flex; align-items:center; gap:.6rem; flex-wrap:wrap; }

/* Hero card */
.hero-card  { background:rgba(255,255,255,.06); border:1px solid rgba(196,146,42,.25); border-radius:3px; overflow:hidden; backdrop-filter:blur(8px); }
.hc-thumb   { position:relative; height:175px; overflow:hidden; cursor:pointer; }
.hc-img     { width:100%; height:100%; object-fit:cover; filter:brightness(.55); transition:filter .3s; }
.hc-thumb:hover .hc-img { filter:brightness(.42); }
.hc-dark    { position:absolute; inset:0; background:rgba(26,18,8,.2); }
.hc-play    { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:48px; height:48px; border-radius:50%; background:rgba(196,146,42,.9); border:none; color:#fff; display:flex; align-items:center; justify-content:center; font-size:1rem; cursor:pointer; transition:transform .25s,background .25s; }
.hc-play:hover { transform:translate(-50%,-50%) scale(1.1); background:var(--gold-l); }
.hc-type-ico { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:2.25rem; color:rgba(196,146,42,.55); }
.hc-rows    { padding:.9rem 1rem; display:flex; flex-direction:column; gap:.5rem; }
.hc-row     { display:flex; align-items:center; gap:.55rem; font-size:.75rem; color:rgba(255,255,255,.5); }
.hc-row i   { color:var(--gold); font-size:.68rem; }
.hc-db      { font-size:.68rem; color:var(--gold-l); font-style:italic; border-top:1px solid rgba(196,146,42,.15); padding-top:.5rem; margin-top:.15rem; }

/* ── Body ── */
.body-wrap { padding:2.5rem 1.5rem; }
.body-grid { max-width:1280px; margin:0 auto; display:grid; grid-template-columns:1fr 295px; gap:2.5rem; }
@media(max-width:1024px){ .body-grid { grid-template-columns:1fr; } }

/* Tab nav */
.tab-nav { display:flex; border-bottom:2px solid var(--border); margin-bottom:1.75rem; flex-wrap:wrap; }
.tab-btn { display:flex; align-items:center; gap:.4rem; padding:.7rem 1.1rem; border:none; background:transparent; color:#9a8a72; font-family:'Source Serif 4',serif; font-size:.82rem; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-2px; transition:color .2s, border-color .2s; white-space:nowrap; }
.tab-btn i { font-size:.78rem; }
.tab-btn:hover { color:var(--gold); }
.tab-btn.active { color:var(--gold); border-bottom-color:var(--gold); font-weight:600; }
.tab-panel { animation:fadeUp .22s ease; }
@keyframes fadeUp { from { opacity:0; transform:translateY(5px); } to { opacity:1; } }

/* Chapters */
.chapters-panel { background:#fff; border:1px solid var(--border); border-radius:3px; overflow:hidden; margin-top:1.5rem; }
.panel-head { display:flex; align-items:center; gap:.45rem; font-size:.68rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:#9a8a72; padding:.75rem 1.1rem; border-bottom:1px solid var(--border); background:#fdf9f4; }
.panel-head i { color:var(--gold); font-size:.72rem; }
.panel-cnt { margin-left:auto; font-size:.62rem; background:rgba(196,146,42,.1); color:var(--gold); padding:.08rem .38rem; border-radius:10px; }
.chapter-row { display:flex; align-items:center; gap:.75rem; padding:.65rem 1.1rem; border-bottom:1px solid rgba(217,205,184,.4); cursor:pointer; border-left:2px solid transparent; transition:all .15s; }
.chapter-row:last-child { border-bottom:none; }
.chapter-row:hover { background:#fdf8f0; }
.chapter-row.active { border-left-color:var(--gold); background:rgba(196,146,42,.06); }
.ch-num  { width:28px; height:28px; border-radius:50%; background:rgba(196,146,42,.12); color:var(--gold); display:flex; align-items:center; justify-content:center; font-size:.7rem; font-weight:700; flex-shrink:0; }
.chapter-row.active .ch-num { background:var(--gold); color:#fff; }
.ch-body { flex:1; }
.ch-title { display:block; font-size:.82rem; font-weight:600; color:var(--ink); }
.ch-sub   { display:block; font-size:.68rem; color:#9a8a72; margin-top:.1rem; }
.ch-time  { font-size:.68rem; color:#b0a090; white-space:nowrap; }

/* Materials */
.materials-list { display:flex; flex-direction:column; gap:.55rem; }
.mat-row  { display:flex; align-items:center; gap:.85rem; background:#fff; border:1px solid var(--border); border-radius:2px; padding:.85rem 1rem; transition:box-shadow .2s; }
.mat-row:hover { box-shadow:var(--shd); }
.mat-ico  { width:40px; height:40px; border-radius:2px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:1rem; }
.mat-ico.pdf  { background:rgba(42,58,92,.1);  color:var(--navy); }
.mat-ico.docx { background:rgba(58,92,58,.1);  color:var(--sage); }
.mat-ico.link { background:rgba(196,146,42,.1); color:var(--gold); }
.mat-ico.mp4  { background:rgba(139,58,30,.1); color:var(--rust); }
.mat-info { flex:1; }
.mat-name { display:block; font-size:.85rem; font-weight:600; color:var(--ink); }
.mat-sub  { display:block; font-size:.7rem; color:#9a8a72; margin-top:.1rem; }
.mat-path { display:block; font-family:monospace; font-size:.62rem; color:#b0a090; margin-top:.15rem; }
.mat-dl   { display:inline-flex; align-items:center; gap:.38rem; border:1.5px solid var(--border); border-radius:2px; background:transparent; color:#7a6a52; text-decoration:none; font-family:'Source Serif 4',serif; font-size:.75rem; padding:.38rem .75rem; transition:all .2s; flex-shrink:0; }
.mat-dl:hover { border-color:var(--gold); color:var(--gold); }

/* Empty */
.empty-state { display:flex; flex-direction:column; align-items:center; gap:.6rem; padding:3.5rem 2rem; text-align:center; color:#9a8a72; font-style:italic; }
.empty-state i { font-size:2rem; color:var(--border); }
.empty-state p { margin:0; }
.empty-hint { font-size:.72rem; color:#b0a090; font-style:normal; font-family:monospace; }

/* Notes */
.notes-ta { width:100%; border:1.5px solid var(--border); border-radius:2px; padding:1rem; font-family:'Source Serif 4',serif; font-size:.9rem; color:var(--ink); background:#fff; resize:vertical; outline:none; line-height:1.75; transition:border-color .22s; display:block; }
.notes-ta:focus { border-color:var(--gold); }
.notes-ta::placeholder { color:#b0a090; font-style:italic; }
.notes-bar  { display:flex; justify-content:space-between; align-items:center; margin-top:.75rem; }
.notes-hint { font-size:.72rem; color:#b0a090; font-style:italic; display:flex; align-items:center; gap:.3rem; }
.notes-hint i { color:var(--gold); }

/* Comments */
.comments-list { display:flex; flex-direction:column; gap:1.25rem; margin-bottom:2rem; }
.comment-card  { display:flex; gap:.85rem; }
.cc-ava  { width:38px; height:38px; border-radius:50%; flex-shrink:0; background:linear-gradient(135deg,var(--gold),var(--rust)); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:.9rem; }
.cc-ava.ava-user { background:linear-gradient(135deg,var(--sage),#2a5c3a); }
.cc-new-badge { font-size:.6rem; font-weight:700; background:var(--gold); color:#fff; padding:.1rem .42rem; border-radius:10px; text-transform:uppercase; letter-spacing:.07em; margin-left:auto; animation:pulse-badge 2s ease infinite; }
@keyframes pulse-badge { 0%,100%{opacity:1} 50%{opacity:.6} }
.cf-hint { font-size:.68rem; color:#9a8a72; display:flex; align-items:center; gap:.3rem; margin:.5rem 0 0; font-style:italic; }
.cf-hint i { color:var(--gold); font-size:.7rem; }
.cf-spin { width:14px; height:14px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin2 .7s linear infinite; }
@keyframes spin2 { to { transform:rotate(360deg); } }
.cc-reply { background:rgba(58,92,58,.06); border:1px solid rgba(58,92,58,.2); border-radius:2px; padding:.55rem .75rem; margin-top:.5rem; }
.cc-reply-label { font-size:.65rem; font-weight:700; color:var(--sage); display:flex; align-items:center; gap:.3rem; margin-bottom:.3rem; text-transform:uppercase; letter-spacing:.07em; }
.cc-reply-text  { font-size:.8rem; color:#3a5c3a; margin:0; line-height:1.55; }
.cc-body { flex:1; }
.cc-top  { display:flex; align-items:baseline; gap:.6rem; margin-bottom:.3rem; }
.cc-name { font-weight:700; font-size:.85rem; color:var(--ink); }
.cc-date { font-size:.68rem; color:#b0a090; }
.cc-stars { display:flex; align-items:center; gap:.1rem; margin-bottom:.35rem; }
.cstar    { font-size:.75rem; color:#d9cdb8; }
.cstar.on { color:var(--gold); }
.cstar-num { font-size:.68rem; color:#9a8a72; margin-left:.2rem; }
.cc-text   { font-size:.82rem; color:#5a4a35; line-height:1.65; margin:0; }
.comment-form { background:#fff; border:1px solid var(--border); border-radius:3px; padding:1.25rem; border-top:3px solid var(--gold); margin-top:1.5rem; }
.cf-head  { font-family:'Playfair Display',serif; font-size:1rem; font-weight:700; color:var(--ink); margin:0 0 .85rem; }
.cf-stars { display:flex; gap:.3rem; margin-bottom:.85rem; }
.cf-star  { font-size:1.4rem; color:#d9cdb8; cursor:pointer; transition:color .15s; }
.cf-star.on { color:var(--gold); }
.cf-ta    { width:100%; border:1.5px solid var(--border); border-radius:2px; padding:.75rem; font-family:'Source Serif 4',serif; font-size:.875rem; color:var(--ink); resize:vertical; outline:none; background:#fdf9f4; transition:border-color .22s; display:block; margin-bottom:.75rem; }
.cf-ta:focus { border-color:var(--gold); }

/* ── Sidebar ── */
.sidebar-col { display:flex; flex-direction:column; gap:1.25rem; }
.sb-card     { background:#fff; border:1px solid var(--border); border-radius:3px; overflow:hidden; }
.inst-row    { padding:1.1rem; display:flex; gap:.85rem; align-items:center; }
.inst-ava    { width:50px; height:50px; border-radius:50%; flex-shrink:0; background:linear-gradient(135deg,var(--gold),var(--rust)); color:#fff; display:flex; align-items:center; justify-content:center; font-family:'Playfair Display',serif; font-size:1.3rem; font-weight:700; }
.inst-name   { font-family:'Playfair Display',serif; font-size:.95rem; font-weight:700; color:var(--ink); margin:0 0 .15rem; }
.inst-role   { font-size:.72rem; color:var(--rust); font-style:italic; margin:0; }
.sb-head     { display:flex; align-items:center; gap:.45rem; font-size:.68rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:#9a8a72; padding:.7rem 1rem; border-bottom:1px solid var(--border); background:#faf6ef; }
.sb-head i   { font-size:.7rem; color:var(--gold); }
.info-list   { list-style:none; margin:0; padding:.35rem 0; }
.info-list li { display:flex; align-items:center; justify-content:space-between; padding:.42rem 1rem; border-bottom:1px solid rgba(217,205,184,.4); }
.info-list li:last-child { border-bottom:none; }
.il-label    { font-size:.72rem; color:#9a8a72; display:flex; align-items:center; gap:.35rem; }
.il-label i  { font-size:.68rem; color:var(--gold); }
.il-val      { font-size:.75rem; font-weight:600; color:var(--ink); text-align:right; }

/* Type card */
.type-card { display:flex !important; align-items:center; gap:.75rem; padding:1rem !important; }
.tc-icon   { width:42px; height:42px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.1rem; flex-shrink:0; }
.type-card.video .tc-icon { background:rgba(139,58,30,.1); color:var(--rust); }
.type-card.text  .tc-icon { background:rgba(58,92,58,.1);  color:var(--sage); }
.type-card.pdf   .tc-icon { background:rgba(42,58,92,.1);  color:var(--navy); }
.tc-title  { display:block; font-size:.82rem; font-weight:700; color:var(--ink); margin-bottom:.2rem; }
.tc-desc   { display:block; font-size:.7rem; color:#9a8a72; line-height:1.5; }

/* Excel badge */
.sb-dark { background:var(--dark) !important; border-color:rgba(196,146,42,.2) !important; display:flex !important; align-items:flex-start; gap:.75rem; padding:1rem !important; }
.sb-db-icon  { font-size:1.1rem; color:var(--gold); flex-shrink:0; margin-top:.1rem; }
.sb-db-title { display:block; font-size:.62rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:rgba(255,255,255,.32); }
.sb-db-file  { display:block; font-size:.7rem; color:var(--gold-l); font-family:monospace; margin:.2rem 0 .3rem; }
.sb-db-desc  { display:block; font-size:.62rem; color:rgba(255,255,255,.25); font-style:italic; }
</style>