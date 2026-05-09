<template>
  <div class="lesson-detail-page">

    <!-- ══ HERO ═════════════════════════════════════════ -->
    <div class="lesson-hero" :class="lesson.type">
      <div class="hero-bg">
        <img :src="lesson.thumb" :alt="lesson.title" class="hero-bg-img" />
        <div class="hero-bg-overlay" />
        <div class="hero-pattern" aria-hidden="true" />
      </div>

      <div class="hero-inner">
        <!-- Breadcrumb -->
        <nav class="breadcrumb">
          <button class="bc-link" @click="$router.back()">
            <i class="pi pi-home" /> Басты
          </button>
          <span class="bc-sep">›</span>
          <button class="bc-link" @click="$router.push('/lessons')">Сабақтар</button>
          <span class="bc-sep">›</span>
          <span class="bc-current">{{ lesson.title }}</span>
        </nav>

        <div class="hero-content">
          <div class="hero-left">
            <!-- Badges -->
            <div class="hero-badges">
              <span class="type-badge" :class="lesson.type">
                <i :class="'pi ' + typeIcon(lesson.type)" />
                {{ typeLabel(lesson.type) }}
              </span>
              <span class="level-badge" :class="lesson.level">{{ levelLabel(lesson.level) }}</span>
              <span class="topic-badge">{{ topicName(lesson.topic) }}</span>
            </div>

            <h1 class="hero-title">{{ lesson.title }}</h1>
            <p class="hero-desc">{{ lesson.description }}</p>

            <div class="hero-meta">
              <div class="meta-author">
                <div class="author-avatar">{{ lesson.author[0] }}</div>
                <div>
                  <span class="author-label">Оқытушы</span>
                  <span class="author-name">{{ lesson.author }}</span>
                </div>
              </div>
              <div class="meta-stats">
                <span class="ms-item"><i class="pi pi-eye" /> {{ lesson.views }}</span>
                <span class="ms-item"><i class="pi pi-clock" /> {{ lesson.duration }}</span>
                <span class="ms-item"><i class="pi pi-calendar" /> {{ lesson.date }}</span>
              </div>
            </div>

            <!-- Rating -->
            <div class="hero-rating">
              <span v-for="i in 5" :key="i" class="star" :class="{ on: i <= Math.round(lesson.rating) }">★</span>
              <span class="rating-num">{{ lesson.rating }}</span>
              <span class="rating-cnt">({{ lesson.reviews }} пікір)</span>
            </div>

            <!-- CTA -->
            <div class="hero-cta">
              <button class="cta-primary" @click="startLesson">
                <i :class="'pi ' + (lesson.type === 'video' ? 'pi-play' : 'pi-book')" />
                {{ lesson.type === 'video' ? 'Видеоны қарау' : 'Оқуды бастау' }}
              </button>
              <button class="cta-ghost" @click="toggleSave">
                <i :class="saved ? 'pi pi-bookmark-fill' : 'pi pi-bookmark'" />
                {{ saved ? 'Сақталды' : 'Сақтау' }}
              </button>
              <button class="cta-icon" @click="shareLesson" title="Бөлісу">
                <i class="pi pi-share-alt" />
              </button>
            </div>
          </div>

          <!-- Hero card -->
          <div class="hero-card">
            <div class="hc-thumb-wrap">
              <img :src="lesson.thumb" :alt="lesson.title" class="hc-thumb" />
              <div class="hc-thumb-overlay" />
              <button v-if="lesson.type === 'video'" class="hc-play" @click="startLesson">
                <i class="pi pi-play" />
              </button>
              <div v-else class="hc-type-icon">
                <i :class="'pi ' + typeIcon(lesson.type)" />
              </div>
            </div>
            <div class="hc-info">
              <div class="hc-row">
                <i class="pi pi-clock" />
                <span>{{ lesson.duration }}</span>
              </div>
              <div class="hc-row">
                <i class="pi pi-file" />
                <span>{{ lesson.materialsCount }} материал</span>
              </div>
              <div class="hc-row">
                <i class="pi pi-users" />
                <span>{{ lesson.students }} оқушы</span>
              </div>
              <div class="hc-row">
                <i class="pi pi-certificate" />
                <span>Сертификат берілмейді</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ BODY ══════════════════════════════════════════ -->
    <div class="detail-body">
      <div class="detail-inner">

        <!-- ── Left: Main content ─────────────────────── -->
        <main class="detail-main">

          <!-- Progress bar (if started) -->
          <div v-if="lesson.progress" class="progress-block">
            <div class="pb-header">
              <span class="pb-label">Орындалды</span>
              <span class="pb-pct">{{ lesson.progress }}%</span>
            </div>
            <div class="pb-track"><div class="pb-fill" :style="{ width: lesson.progress + '%' }" /></div>
            <p class="pb-hint">{{ lesson.progress === 100 ? '✓ Сабақ аяқталды' : `${100 - lesson.progress}% қалды` }}</p>
          </div>

          <!-- Tab nav -->
          <div class="detail-tabs">
            <button
                v-for="tab in detailTabs"
                :key="tab.key"
                class="detail-tab"
                :class="{ active: activeTab === tab.key }"
                @click="activeTab = tab.key"
            >
              <i :class="'pi ' + tab.icon" />
              {{ tab.label }}
            </button>
          </div>

          <!-- ── TAB: Content ───── -->
          <div v-show="activeTab === 'content'" class="tab-panel">

            <!-- Video player -->
            <div v-if="lesson.type === 'video'" class="video-player" :class="{ playing }">
              <img :src="lesson.thumb" :alt="lesson.title" class="vp-poster" />
              <div class="vp-overlay" :class="{ hidden: playing }" />

              <div class="vp-controls" :class="{ visible: !playing || showControls }">
                <div class="vp-progress-wrap" @click="seekVideo">
                  <div class="vp-progress-track">
                    <div class="vp-progress-fill" :style="{ width: videoProgress + '%' }" />
                    <div class="vp-progress-thumb" :style="{ left: videoProgress + '%' }" />
                  </div>
                  <div class="vp-time-row">
                    <span>{{ formatTime(videoTime) }}</span>
                    <span>{{ lesson.duration }}</span>
                  </div>
                </div>
                <div class="vp-btn-row">
                  <button class="vp-btn" @click="skip(-10)"><i class="pi pi-replay" /><span>10</span></button>
                  <button class="vp-btn main-btn" @click="togglePlay">
                    <i :class="playing ? 'pi pi-pause' : 'pi pi-play'" />
                  </button>
                  <button class="vp-btn" @click="skip(10)"><i class="pi pi-refresh" /><span>10</span></button>
                  <div class="vp-spacer" />
                  <button class="vp-btn" @click="toggleMute">
                    <i :class="muted ? 'pi pi-volume-off' : 'pi pi-volume-up'" />
                  </button>
                  <select v-model="playbackSpeed" class="vp-speed">
                    <option v-for="s in speeds" :key="s" :value="s">{{ s }}x</option>
                  </select>
                  <button class="vp-btn" @click="toggleFullscreen"><i class="pi pi-window-maximize" /></button>
                </div>
              </div>
            </div>

            <!-- PDF viewer -->
            <div v-else-if="lesson.type === 'pdf'" class="pdf-preview">
              <div class="pdf-header">
                <i class="pi pi-file-pdf" />
                <span>{{ lesson.title }}.pdf</span>
                <a href="#" class="pdf-dl-btn"><i class="pi pi-download" /> Жүктеу</a>
              </div>
              <div class="pdf-pages-demo">
                <div v-for="p in 3" :key="p" class="pdf-page-demo">
                  <div class="ppd-header">
                    <div class="ppd-line w-60" />
                    <div class="ppd-line w-40" />
                  </div>
                  <div class="ppd-body">
                    <div v-for="l in 8" :key="l" class="ppd-line" :class="'w-' + [90,80,95,70,85,75,90,60][l-1]" />
                  </div>
                  <div class="ppd-page-num">{{ p }}</div>
                </div>
              </div>
              <button class="open-pdf-btn" @click="$router.push(`/lessons/${lesson.id}/pdf`)">
                <i class="pi pi-expand" /> Толық ашу
              </button>
            </div>

            <!-- Text lesson -->
            <div v-else class="text-content">
              <div v-for="(block, i) in lesson.content" :key="i" class="content-block" :class="block.type">
                <h2 v-if="block.type === 'heading'" class="cb-heading">{{ block.text }}</h2>
                <h3 v-else-if="block.type === 'subheading'" class="cb-subheading">{{ block.text }}</h3>
                <p  v-else-if="block.type === 'paragraph'" class="cb-paragraph">{{ block.text }}</p>
                <blockquote v-else-if="block.type === 'quote'" class="cb-quote">
                  <p>{{ block.text }}</p>
                  <cite v-if="block.cite">— {{ block.cite }}</cite>
                </blockquote>
                <div v-else-if="block.type === 'list'" class="cb-list">
                  <ul>
                    <li v-for="item in block.items" :key="item">{{ item }}</li>
                  </ul>
                </div>
                <div v-else-if="block.type === 'highlight'" class="cb-highlight">
                  <i class="pi pi-lightbulb" />
                  <p>{{ block.text }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- ── TAB: Materials ─── -->
          <div v-show="activeTab === 'materials'" class="tab-panel">
            <div class="materials-list">
              <div
                  v-for="mat in lesson.materials"
                  :key="mat.id"
                  class="material-item"
              >
                <div class="mat-icon" :class="mat.type">
                  <i :class="'pi ' + matIcon(mat.type)" />
                </div>
                <div class="mat-body">
                  <span class="mat-title">{{ mat.title }}</span>
                  <span class="mat-meta">{{ mat.size }} · {{ mat.type.toUpperCase() }}</span>
                </div>
                <a href="#" class="mat-dl">
                  <i class="pi pi-download" />
                </a>
              </div>
            </div>
          </div>

          <!-- ── TAB: Notes ──────── -->
          <div v-show="activeTab === 'notes'" class="tab-panel">
            <div class="notes-area">
              <textarea
                  v-model="userNotes"
                  class="notes-textarea"
                  placeholder="Конспект жазыңыз…"
                  rows="10"
              />
              <div class="notes-footer">
                <span class="notes-hint">Жазбаларыңыз автоматты сақталады</span>
                <button class="notes-save" @click="saveNotes">
                  <i class="pi pi-check" /> Сақтау
                </button>
              </div>
            </div>
          </div>

          <!-- ── TAB: Comments ───── -->
          <div v-show="activeTab === 'comments'" class="tab-panel">
            <div class="comments-list">
              <div v-for="c in lesson.comments" :key="c.id" class="comment-item">
                <div class="ci-avatar">{{ c.author[0] }}</div>
                <div class="ci-body">
                  <div class="ci-header">
                    <span class="ci-name">{{ c.author }}</span>
                    <span class="ci-date">{{ c.date }}</span>
                  </div>
                  <div class="ci-stars">
                    <span v-for="i in 5" :key="i" class="star-sm" :class="{ on: i <= c.rating }">★</span>
                  </div>
                  <p class="ci-text">{{ c.text }}</p>
                </div>
              </div>
            </div>
            <!-- Comment form -->
            <div class="comment-form">
              <p class="cf-title">Пікір қалдыру</p>
              <div class="cf-stars">
                <span
                    v-for="i in 5" :key="i"
                    class="cf-star" :class="{ on: i <= myRating }"
                    @click="myRating = i"
                >★</span>
              </div>
              <textarea v-model="myComment" class="cf-input" placeholder="Пікіріңізді жазыңыз…" rows="3" />
              <button class="cf-submit" @click="submitComment">
                <i class="pi pi-send" /> Жіберу
              </button>
            </div>
          </div>

        </main>

        <!-- ── Right: Sidebar ─────────────────────────── -->
        <aside class="detail-sidebar">

          <!-- Instructor card -->
          <div class="instructor-card">
            <div class="ic-avatar">{{ lesson.author[0] }}</div>
            <div class="ic-info">
              <p class="ic-name">{{ lesson.author }}</p>
              <p class="ic-role">Әдебиет оқытушысы</p>
              <div class="ic-stats">
                <span><i class="pi pi-book" /> 12 сабақ</span>
                <span><i class="pi pi-users" /> 4.2к оқушы</span>
              </div>
            </div>
          </div>

          <!-- Lesson info -->
          <div class="info-card">
            <p class="ic-head"><i class="pi pi-info-circle" /> Сабақ туралы</p>
            <ul class="info-list">
              <li v-for="info in lessonInfo" :key="info.label">
                <span class="il-label"><i :class="'pi ' + info.icon" /> {{ info.label }}</span>
                <span class="il-val">{{ info.val }}</span>
              </li>
            </ul>
          </div>

          <!-- Related lessons -->
          <div class="related-card">
            <p class="ic-head"><i class="pi pi-list" /> Ұқсас сабақтар</p>
            <div class="related-list">
              <div
                  v-for="rel in relatedLessons"
                  :key="rel.id"
                  class="related-item"
                  @click="$router.push(`/lessons/${rel.id}`)"
              >
                <div class="ri-thumb-wrap">
                  <img :src="rel.thumb" :alt="rel.title" class="ri-thumb" />
                  <span class="ri-type" :class="rel.type">
                    <i :class="'pi ' + typeIcon(rel.type)" />
                  </span>
                </div>
                <div class="ri-body">
                  <p class="ri-title">{{ rel.title }}</p>
                  <span class="ri-meta">{{ rel.duration }} · {{ rel.author }}</span>
                </div>
              </div>
            </div>
          </div>

        </aside>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route  = useRoute()
const router = useRouter()

// ─── Lesson registry ──────────────────────────────────
const LESSONS = {
  1: {
    id: 1, type: 'video', topic: 'classic', level: 'beginner',
    title: 'Абай Құнанбайұлының өмірі мен шығармашылығы',
    description: 'Ұлы ақынның туған жылынан бастап соңғы туындыларына дейінгі толық шығармашылық жолы. Абайдың поэзиясы, прозасы және ағартушылық қызметі кеңінен қарастырылады.',
    author: 'Айгүл Сейткали', date: '20 сәуір, 2026', duration: '45:20',
    views: '12 840', rating: 4.9, reviews: 284, progress: 65,
    students: '3 240', materialsCount: 5,
    thumb: 'https://images.unsplash.com/photo-1476820865390-c52aeebb9891?w=1200&q=85',
    materials: [
      { id: 1, title: 'Сабақ конспекті',       type: 'pdf',  size: '1.2 MB' },
      { id: 2, title: 'Тест сұрақтары',         type: 'docx', size: '245 KB' },
      { id: 3, title: 'Абай өлеңдері жинағы',  type: 'pdf',  size: '3.8 MB' },
      { id: 4, title: 'Хронология кестесі',    type: 'pdf',  size: '520 KB' },
      { id: 5, title: 'Қосымша ресурстар',     type: 'link', size: '—' },
    ],
    comments: [
      { id: 1, author: 'Нұрия Алиева',   date: '22 сәуір', rating: 5, text: 'Өте сапалы сабақ! Абайдың шығармашылығы туралы жаңа нәрселер білдім.' },
      { id: 2, author: 'Бекзат Омаров',  date: '21 сәуір', rating: 5, text: 'Оқытушы материалды өте түсінікті жеткізді. Рахмет!' },
      { id: 3, author: 'Айдана Смаилова',date: '19 сәуір', rating: 4, text: 'Сабақ қызықты, бірақ кейбір тараулар тезірек өтілсе болатын еді.' },
    ],
    content: [],
  },
  2: {
    id: 2, type: 'text', topic: 'poetry', level: 'intermediate',
    title: 'Мұқағали Мақатаев лирикасының ерекшеліктері',
    description: 'Ақынның поэтикалық тілі, образ жүйесі және лирикалық кейіпкері туралы толық конспект.',
    author: 'Берік Әшімов', date: '18 сәуір, 2026', duration: '25 мин',
    views: '8 210', rating: 4.8, reviews: 196, progress: null,
    students: '2 180', materialsCount: 3,
    thumb: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&q=85',
    materials: [
      { id: 1, title: 'Конспект (PDF)',         type: 'pdf',  size: '890 KB' },
      { id: 2, title: 'Өлең мысалдары',         type: 'pdf',  size: '1.1 MB' },
      { id: 3, title: 'Терминдер сөздігі',     type: 'docx', size: '180 KB' },
    ],
    comments: [
      { id: 1, author: 'Салтанат Нурова', date: '20 сәуір', rating: 5, text: 'Мұқағали поэзиясын жаңаша түсіндім. Керемет!' },
      { id: 2, author: 'Ерлан Касымов',  date: '18 сәуір', rating: 4, text: 'Материал тереңдетілген, ғылыми деңгейде жазылған.' },
    ],
    content: [
      { type: 'heading',    text: 'Кіріспе' },
      { type: 'paragraph',  text: 'Мұқағали Мақатаев (1931–1976) — қазақ лирикасының классигі. Оның поэзиясы табиғат суреттері мен адам жан дүниесінің тереңдігімен ерекшеленеді.' },
      { type: 'quote',      text: 'Өмір — өзен, ағады да кетеді, / Артынан кім іздеп тауып жетеді?', cite: 'Мұқағали Мақатаев' },
      { type: 'subheading', text: '1. Поэтикалық тіл ерекшеліктері' },
      { type: 'paragraph',  text: 'Ақын образ жасауда дәстүрлі қазақ поэзиясының тәсілдерін жаңашыл тұрғыдан пайдаланды. Оның лексикасы — қарапайым, бірақ тереңдікке толы.' },
      { type: 'list',       items: ['Табиғат образдарының молдығы', 'Ішкі монологтың кең қолданылуы', 'Философиялық сарын', 'Романтикалық идеал'] },
      { type: 'highlight',  text: 'Мұқағали поэзиясындағы "Жер", "Су", "Жел" образдары — жай суреттеу емес, терең символикалық мағынаға ие.' },
      { type: 'subheading', text: '2. Лирикалық кейіпкер' },
      { type: 'paragraph',  text: 'Ақынның лирикалық кейіпкері — ізденуші, сезімтал, өз халқын сүйетін азамат. Ол табиғатпен бірлікте, заманымен қайшылықта бейнеленеді.' },
      { type: 'paragraph',  text: 'Лирикалық "мен" образы Мұқағали поэзиясында тұтас философиялық тұжырымдаманы қалыптастырады. Бұл — романтикалық дәстүрдің ұлттық поэзиядағы жаңғыруы.' },
    ],
  },
}

const lessonId = Number(route.params.id) || 1
const lesson   = LESSONS[lessonId] ?? LESSONS[2]

// ─── Helpers ──────────────────────────────────────────
const typeIcons  = { video: 'pi-play-circle', text: 'pi-file-edit', pdf: 'pi-file-pdf' }
const typeLabels = { video: 'Видео сабақ', text: 'Конспект', pdf: 'PDF' }
const topicNames = {
  classic: 'Классика', poetry: 'Поэзия', prose: 'Проза',
  history: 'Тарихи', modern: 'Заманауи', theory: 'Теория',
}
const levelLabels = { beginner: 'Бастауыш', intermediate: 'Орта', advanced: 'Жоғары' }
const matIcons    = { pdf: 'pi-file-pdf', docx: 'pi-file-word', link: 'pi-link' }

function typeIcon(t)  { return typeIcons[t]  || 'pi-book' }
function typeLabel(t) { return typeLabels[t] || t }
function topicName(t) { return topicNames[t] || t }
function levelLabel(l){ return levelLabels[l] || l }
function matIcon(t)   { return matIcons[t]   || 'pi-file' }

// ─── State ────────────────────────────────────────────
const activeTab     = ref('content')
const saved         = ref(false)
const playing       = ref(false)
const showControls  = ref(true)
const muted         = ref(false)
const videoProgress = ref(lesson.progress || 0)
const videoTime     = ref(0)
const playbackSpeed = ref(1)
const userNotes     = ref('')
const myComment     = ref('')
const myRating      = ref(0)
const speeds        = [0.5, 0.75, 1, 1.25, 1.5, 2]

// ─── Tabs ─────────────────────────────────────────────
const detailTabs = [
  { key: 'content',   label: 'Мазмұн',    icon: 'pi-play-circle' },
  { key: 'materials', label: 'Материалдар', icon: 'pi-folder'    },
  { key: 'notes',     label: 'Конспект',  icon: 'pi-pencil'      },
  { key: 'comments',  label: `Пікірлер (${lesson.comments?.length || 0})`, icon: 'pi-comments' },
]

// ─── Lesson info ──────────────────────────────────────
const lessonInfo = [
  { icon: 'pi-clock',       label: 'Ұзақтығы',   val: lesson.duration     },
  { icon: 'pi-tag',         label: 'Тақырып',    val: topicName(lesson.topic)  },
  { icon: 'pi-chart-bar',   label: 'Деңгей',     val: levelLabel(lesson.level) },
  { icon: 'pi-calendar',    label: 'Жарияланды', val: lesson.date          },
  { icon: 'pi-users',       label: 'Оқушылар',   val: lesson.students      },
  { icon: 'pi-star',        label: 'Рейтинг',    val: `${lesson.rating} / 5` },
]

// ─── Related (mock) ───────────────────────────────────
const relatedLessons = [
  {
    id: lesson.id === 1 ? 2 : 1, type: lesson.id === 1 ? 'text' : 'video',
    title: lesson.id === 1 ? 'Мұқағали Мақатаев лирикасы' : 'Абай Құнанбайұлы',
    author: lesson.id === 1 ? 'Берік Әшімов' : 'Айгүл Сейткали',
    duration: lesson.id === 1 ? '25 мин' : '45:20',
    thumb: lesson.id === 1
        ? 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=200&q=75'
        : 'https://images.unsplash.com/photo-1476820865390-c52aeebb9891?w=200&q=75',
  },
  {
    id: 3, type: 'pdf',
    title: '«Абай жолы» эпопеясының талдауы',
    author: 'Зарина Нұрланова', duration: '48 бет',
    thumb: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&q=75',
  },
  {
    id: 4, type: 'video',
    title: 'Қазақ эпостарының ерекшеліктері',
    author: 'Мадина Оспанова', duration: '38:45',
    thumb: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=200&q=75',
  },
]

// ─── Actions ──────────────────────────────────────────
function startLesson() { if (lesson.type === 'video') playing.value = true }
function togglePlay()  { playing.value = !playing.value }
function toggleMute()  { muted.value = !muted.value }
function toggleSave()  { saved.value = !saved.value }
function shareLesson() { navigator.clipboard?.writeText(window.location.href) }
function toggleFullscreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen()
  else document.exitFullscreen()
}
function skip(sec) {
  const total  = parseDuration(lesson.duration)
  videoTime.value = Math.max(0, Math.min(videoTime.value + sec, total))
  videoProgress.value = Math.round((videoTime.value / total) * 100)
}
function seekVideo(e) {
  const rect  = e.currentTarget.getBoundingClientRect()
  const pct   = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1))
  const total = parseDuration(lesson.duration)
  videoTime.value     = Math.round(pct * total)
  videoProgress.value = Math.round(pct * 100)
}
function parseDuration(str) {
  const parts = str.split(':').map(Number)
  return parts.length === 2 ? parts[0] * 60 + parts[1] : parts[0]
}
function formatTime(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}
function saveNotes() { localStorage.setItem(`notes_${lesson.id}`, userNotes.value) }
function submitComment() {
  if (!myComment.value.trim()) return
  lesson.comments?.unshift({
    id: Date.now(), author: 'Сіз', date: 'Қазір', rating: myRating.value || 5, text: myComment.value,
  })
  myComment.value = ''
  myRating.value  = 0
}

onMounted(() => {
  userNotes.value = localStorage.getItem(`notes_${lesson.id}`) || ''
  if (lesson.progress) videoProgress.value = lesson.progress
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,300&display=swap');

.lesson-detail-page {
  --ink:       #1a1208;
  --parchment: #faf6ef;
  --gold:      #c4922a;
  --gold-l:    #e8b94f;
  --rust:      #8b3a1e;
  --border:    #d9cdb8;
  --shadow:    0 4px 24px rgba(26,18,8,.10);
  --shadow-lg: 0 12px 48px rgba(26,18,8,.18);
  background: var(--parchment);
  font-family: 'Source Serif 4', Georgia, serif;
  min-height: 100vh;
}

/* ══ HERO ══ */
.lesson-hero { position: relative; overflow: hidden; padding-bottom: 3rem; }
.lesson-hero.video { --hero-accent: #8b3a1e; }
.lesson-hero.text  { --hero-accent: #4a5e4c; }
.lesson-hero.pdf   { --hero-accent: #2a3a5c; }

.hero-bg { position: absolute; inset: 0; }
.hero-bg-img {
  width: 100%; height: 100%; object-fit: cover;
  filter: brightness(.25) saturate(.6);
}
.hero-bg-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(26,18,8,.92) 0%, rgba(26,18,8,.7) 60%, rgba(26,18,8,.5) 100%);
}
.hero-pattern {
  position: absolute; inset: 0;
  background-image: radial-gradient(circle, rgba(196,146,42,.06) 1px, transparent 1px);
  background-size: 28px 28px;
}

.hero-inner {
  position: relative; z-index: 2;
  max-width: 1280px; margin: 0 auto;
  padding: 1.5rem 1.5rem 0;
}

/* Breadcrumb */
.breadcrumb { display: flex; align-items: center; gap: .5rem; margin-bottom: 2rem; flex-wrap: wrap; }
.bc-link {
  background: none; border: none; color: rgba(255,255,255,.5);
  font-family: 'Source Serif 4', serif; font-size: .78rem; cursor: pointer;
  display: flex; align-items: center; gap: .3rem; padding: 0;
  transition: color .2s;
}
.bc-link:hover { color: var(--gold-l); }
.bc-link i { font-size: .72rem; }
.bc-sep    { color: rgba(255,255,255,.25); font-size: .75rem; }
.bc-current { font-size: .78rem; color: var(--gold-l); }

/* Hero content */
.hero-content {
  display: grid; grid-template-columns: 1fr 300px; gap: 3rem; align-items: start;
  padding-bottom: 2.5rem;
}
@media (max-width: 900px) { .hero-content { grid-template-columns: 1fr; } }

.hero-badges { display: flex; flex-wrap: wrap; gap: .5rem; margin-bottom: 1.1rem; }
.type-badge {
  display: inline-flex; align-items: center; gap: .35rem;
  font-size: .65rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
  padding: .22rem .65rem; border-radius: 1px; color: #fff;
}
.type-badge.video { background: rgba(139,58,30,.9); }
.type-badge.text  { background: rgba(74,94,76,.9);  }
.type-badge.pdf   { background: rgba(42,58,92,.9);  }
.level-badge {
  font-size: .62rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
  padding: .22rem .55rem; border-radius: 1px;
}
.level-badge.beginner     { background: rgba(232,245,233,.15); color: #81c784; border: 1px solid rgba(129,199,132,.4); }
.level-badge.intermediate { background: rgba(255,243,224,.12); color: #ffb74d; border: 1px solid rgba(255,183,77,.4); }
.level-badge.advanced     { background: rgba(252,228,236,.12); color: #ef9a9a; border: 1px solid rgba(239,154,154,.4); }
.topic-badge {
  font-size: .62rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
  color: var(--gold-l); border: 1px solid rgba(196,146,42,.4);
  padding: .22rem .55rem; border-radius: 1px;
}

.hero-title {
  font-family: 'Playfair Display', serif;
  font-size: clamp(1.65rem, 3vw, 2.5rem); font-weight: 900; color: #fff;
  line-height: 1.2; margin: 0 0 .9rem;
}
.hero-desc { font-size: .9rem; color: rgba(255,255,255,.7); line-height: 1.7; margin: 0 0 1.25rem; font-style: italic; }

.hero-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 1.5rem; margin-bottom: 1rem; }
.meta-author { display: flex; align-items: center; gap: .65rem; }
.author-avatar {
  width: 38px; height: 38px; border-radius: 50%;
  background: var(--gold); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: .9rem; flex-shrink: 0;
}
.author-label { display: block; font-size: .62rem; color: rgba(255,255,255,.4); text-transform: uppercase; letter-spacing: .08em; }
.author-name  { display: block; font-size: .82rem; color: #fff; font-weight: 600; }

.meta-stats { display: flex; gap: 1rem; flex-wrap: wrap; }
.ms-item { font-size: .78rem; color: rgba(255,255,255,.5); display: flex; align-items: center; gap: .3rem; }
.ms-item i { color: var(--gold); font-size: .72rem; }

.hero-rating { display: flex; align-items: center; gap: .25rem; margin-bottom: 1.5rem; }
.star    { font-size: 1rem; color: rgba(255,255,255,.2); }
.star.on { color: var(--gold-l); }
.rating-num { font-weight: 700; font-size: .88rem; color: #fff; margin-left: .2rem; }
.rating-cnt { font-size: .75rem; color: rgba(255,255,255,.4); }

.hero-cta { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; }
.cta-primary {
  display: inline-flex; align-items: center; gap: .55rem;
  background: var(--gold); color: #fff; border: none;
  padding: .72rem 1.75rem; border-radius: 2px;
  font-family: 'Source Serif 4', serif; font-size: .9rem; font-weight: 700;
  cursor: pointer; transition: background .22s, transform .2s;
}
.cta-primary:hover { background: var(--gold-l); transform: translateY(-1px); }
.cta-ghost {
  display: inline-flex; align-items: center; gap: .5rem;
  background: transparent; border: 1.5px solid rgba(255,255,255,.3); color: rgba(255,255,255,.8);
  padding: .68rem 1.25rem; border-radius: 2px;
  font-family: 'Source Serif 4', serif; font-size: .85rem;
  cursor: pointer; transition: border-color .2s, color .2s;
}
.cta-ghost:hover { border-color: var(--gold); color: var(--gold-l); }
.cta-icon {
  width: 40px; height: 40px;
  border: 1.5px solid rgba(255,255,255,.25); border-radius: 2px;
  background: transparent; color: rgba(255,255,255,.6);
  display: flex; align-items: center; justify-content: center;
  font-size: .85rem; cursor: pointer; transition: border-color .2s, color .2s;
}
.cta-icon:hover { border-color: var(--gold); color: var(--gold-l); }

/* Hero card */
.hero-card {
  background: rgba(255,255,255,.07); border: 1px solid rgba(196,146,42,.3);
  border-radius: 3px; overflow: hidden; backdrop-filter: blur(8px);
}
.hc-thumb-wrap { position: relative; height: 200px; overflow: hidden; }
.hc-thumb { width: 100%; height: 100%; object-fit: cover; filter: brightness(.65); }
.hc-thumb-overlay { position: absolute; inset: 0; background: rgba(26,18,8,.3); }
.hc-play {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
  width: 52px; height: 52px; border-radius: 50%;
  background: rgba(196,146,42,.9); border: none; color: #fff;
  display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
  cursor: pointer; transition: transform .25s, background .25s;
}
.hc-play:hover { transform: translate(-50%,-50%) scale(1.1); background: var(--gold-l); }
.hc-type-icon {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
  font-size: 2.5rem; color: rgba(196,146,42,.7);
}
.hc-info { padding: 1rem 1.1rem; display: flex; flex-direction: column; gap: .6rem; }
.hc-row  { display: flex; align-items: center; gap: .6rem; font-size: .8rem; color: rgba(255,255,255,.65); }
.hc-row i { color: var(--gold); font-size: .78rem; }

/* ══ BODY ══ */
.detail-body  { padding: 2.5rem 1.5rem; }
.detail-inner {
  max-width: 1280px; margin: 0 auto;
  display: grid; grid-template-columns: 1fr 320px; gap: 2.5rem;
}
@media (max-width: 1024px) { .detail-inner { grid-template-columns: 1fr; } }

/* Progress block */
.progress-block {
  background: #fff; border: 1px solid var(--border); border-radius: 3px;
  padding: 1.1rem 1.25rem; margin-bottom: 1.5rem;
  border-left: 3px solid var(--gold);
}
.pb-header { display: flex; justify-content: space-between; margin-bottom: .5rem; font-size: .8rem; }
.pb-label  { color: #7a6a52; }
.pb-pct    { font-weight: 700; color: var(--gold); }
.pb-track  { height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; margin-bottom: .35rem; }
.pb-fill   { height: 100%; background: linear-gradient(90deg, var(--gold), var(--gold-l)); border-radius: 3px; transition: width .5s; }
.pb-hint   { font-size: .72rem; color: #9a8a72; margin: 0; }

/* Detail tabs */
.detail-tabs { display: flex; border-bottom: 2px solid var(--border); margin-bottom: 1.75rem; gap: 0; flex-wrap: wrap; }
.detail-tab {
  display: flex; align-items: center; gap: .4rem;
  padding: .7rem 1.1rem;
  border: none; background: transparent; color: #9a8a72;
  font-family: 'Source Serif 4', serif; font-size: .82rem;
  cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px;
  transition: color .2s, border-color .2s;
}
.detail-tab i { font-size: .8rem; }
.detail-tab:hover  { color: var(--gold); }
.detail-tab.active { color: var(--gold); border-bottom-color: var(--gold); font-weight: 600; }

.tab-panel { animation: fadeIn .25s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

/* Video player */
.video-player {
  background: #0a0704; border-radius: 3px; overflow: hidden;
  box-shadow: var(--shadow-lg); margin-bottom: 1.5rem; position: relative;
}
.vp-poster { width: 100%; display: block; max-height: 420px; object-fit: cover; filter: brightness(.6); }
.vp-overlay {
  position: absolute; inset: 0;
  background: rgba(26,18,8,.3);
  transition: opacity .3s;
}
.vp-overlay.hidden { opacity: 0; pointer-events: none; }
.vp-controls {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: linear-gradient(to top, rgba(10,7,4,.95) 0%, transparent 100%);
  padding: 1.5rem 1rem .75rem; opacity: 1; transition: opacity .3s;
}
.vp-progress-wrap { cursor: pointer; margin-bottom: .65rem; }
.vp-progress-track { position: relative; height: 4px; background: rgba(255,255,255,.2); border-radius: 2px; }
.vp-progress-fill  { height: 100%; background: var(--gold); border-radius: 2px; transition: width .3s; }
.vp-progress-thumb {
  position: absolute; top: 50%; transform: translate(-50%,-50%);
  width: 12px; height: 12px; border-radius: 50%;
  background: var(--gold-l); box-shadow: 0 0 4px rgba(196,146,42,.6);
}
.vp-time-row { display: flex; justify-content: space-between; font-size: .65rem; color: rgba(255,255,255,.4); margin-top: .3rem; }
.vp-btn-row  { display: flex; align-items: center; gap: .35rem; }
.vp-btn {
  background: none; border: none; color: rgba(255,255,255,.7);
  font-size: .9rem; cursor: pointer; padding: .25rem .35rem;
  display: flex; align-items: center; gap: .15rem;
  transition: color .2s;
}
.vp-btn span { font-size: .65rem; }
.vp-btn:hover { color: #fff; }
.vp-btn.main-btn {
  width: 40px; height: 40px; border-radius: 50%;
  background: var(--gold); color: #fff;
  justify-content: center; font-size: 1rem;
  transition: background .2s, transform .2s;
}
.vp-btn.main-btn:hover { background: var(--gold-l); transform: scale(1.05); }
.vp-spacer { flex: 1; }
.vp-speed {
  background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.2);
  color: rgba(255,255,255,.7); font-size: .72rem; padding: .2rem .4rem;
  border-radius: 2px; cursor: pointer; outline: none;
  font-family: 'Source Serif 4', serif;
}

/* PDF preview */
.pdf-preview { background: #fff; border: 1px solid var(--border); border-radius: 3px; overflow: hidden; margin-bottom: 1.5rem; }
.pdf-header {
  display: flex; align-items: center; gap: .6rem;
  padding: .75rem 1rem; border-bottom: 1px solid var(--border);
  background: #f8f3ec; font-size: .82rem; color: var(--ink);
}
.pdf-header i { color: #2a3a5c; font-size: 1.1rem; }
.pdf-dl-btn {
  margin-left: auto; display: inline-flex; align-items: center; gap: .35rem;
  font-size: .75rem; color: var(--gold); text-decoration: none;
  border: 1px solid rgba(196,146,42,.3); padding: .22rem .65rem; border-radius: 1px;
  transition: background .2s;
}
.pdf-dl-btn:hover { background: rgba(196,146,42,.08); }
.pdf-pages-demo { display: flex; gap: 1rem; padding: 1.25rem; overflow-x: auto; }
.pdf-page-demo {
  flex-shrink: 0; width: 160px; background: var(--parchment);
  border: 1px solid var(--border); border-radius: 1px; padding: 1rem;
  position: relative;
}
.ppd-header { margin-bottom: .75rem; display: flex; flex-direction: column; gap: .3rem; }
.ppd-body   { display: flex; flex-direction: column; gap: .35rem; }
.ppd-line   { height: 8px; background: rgba(26,18,8,.1); border-radius: 1px; }
.w-40  { width: 40%; }
.w-60  { width: 60%; }
.w-70  { width: 70%; }
.w-75  { width: 75%; }
.w-80  { width: 80%; }
.w-85  { width: 85%; }
.w-90  { width: 90%; }
.w-95  { width: 95%; }
.ppd-page-num {
  position: absolute; bottom: .4rem; right: .6rem;
  font-size: .62rem; color: rgba(26,18,8,.3); font-style: italic;
}
.open-pdf-btn {
  display: flex; align-items: center; gap: .5rem; justify-content: center;
  width: 100%; padding: .75rem;
  border: none; border-top: 1px solid var(--border); background: #fdf8f0;
  color: var(--gold); font-family: 'Source Serif 4', serif; font-size: .82rem; font-weight: 600;
  cursor: pointer; transition: background .2s;
}
.open-pdf-btn:hover { background: #f5ede0; }

/* Text content */
.text-content { max-width: 720px; }
.cb-heading    { font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 900; color: var(--ink); margin: 1.75rem 0 .75rem; }
.cb-subheading { font-family: 'Playfair Display', serif; font-size: 1.15rem; font-weight: 700; color: var(--rust); margin: 1.5rem 0 .6rem; }
.cb-paragraph  { font-size: .9rem; color: #3a2a15; line-height: 1.85; margin: 0 0 1rem; }
.cb-quote {
  border-left: 3px solid var(--gold); margin: 1.5rem 0;
  padding: .85rem 1.25rem; background: rgba(196,146,42,.06);
  border-radius: 0 2px 2px 0;
}
.cb-quote p    { font-family: 'Playfair Display', serif; font-size: 1.05rem; font-style: italic; color: var(--ink); margin: 0 0 .4rem; }
.cb-quote cite { font-size: .75rem; color: var(--gold); }
.cb-list ul { list-style: none; margin: 0 0 1rem; padding: 0; display: flex; flex-direction: column; gap: .4rem; }
.cb-list li { display: flex; align-items: flex-start; gap: .5rem; font-size: .875rem; color: #3a2a15; }
.cb-list li::before { content: '◆'; color: var(--gold); font-size: .5rem; margin-top: .35rem; flex-shrink: 0; }
.cb-highlight {
  display: flex; gap: .75rem; align-items: flex-start;
  background: linear-gradient(135deg, rgba(196,146,42,.08), rgba(196,146,42,.04));
  border: 1px solid rgba(196,146,42,.25); border-radius: 2px;
  padding: 1rem 1.15rem; margin: 1.25rem 0;
}
.cb-highlight i { color: var(--gold); font-size: 1.1rem; flex-shrink: 0; margin-top: .1rem; }
.cb-highlight p { font-size: .875rem; color: var(--ink); line-height: 1.65; margin: 0; }

/* Materials */
.materials-list { display: flex; flex-direction: column; gap: .6rem; }
.material-item {
  display: flex; align-items: center; gap: 1rem;
  background: #fff; border: 1px solid var(--border); border-radius: 2px;
  padding: .85rem 1rem; transition: box-shadow .2s;
}
.material-item:hover { box-shadow: var(--shadow); }
.mat-icon {
  width: 38px; height: 38px; border-radius: 2px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  font-size: 1rem;
}
.mat-icon.pdf  { background: rgba(42,58,92,.1);  color: #2a3a5c; }
.mat-icon.docx { background: rgba(42,92,58,.1);  color: #2a5c3a; }
.mat-icon.link { background: rgba(196,146,42,.1); color: var(--gold); }
.mat-body  { flex: 1; }
.mat-title { display: block; font-size: .85rem; font-weight: 600; color: var(--ink); }
.mat-meta  { display: block; font-size: .72rem; color: #9a8a72; margin-top: .15rem; }
.mat-dl {
  width: 34px; height: 34px; border-radius: 2px;
  border: 1.5px solid var(--border); background: transparent; color: #7a6a52;
  display: flex; align-items: center; justify-content: center;
  font-size: .8rem; text-decoration: none; transition: border-color .2s, color .2s;
}
.mat-dl:hover { border-color: var(--gold); color: var(--gold); }

/* Notes */
.notes-area { display: flex; flex-direction: column; gap: .75rem; }
.notes-textarea {
  width: 100%; border: 1.5px solid var(--border); border-radius: 2px;
  padding: 1rem; font-family: 'Source Serif 4', serif; font-size: .9rem; color: var(--ink);
  background: #fff; resize: vertical; outline: none; line-height: 1.7;
  transition: border-color .22s;
}
.notes-textarea:focus { border-color: var(--gold); }
.notes-textarea::placeholder { color: #b0a090; font-style: italic; }
.notes-footer { display: flex; justify-content: space-between; align-items: center; }
.notes-hint   { font-size: .72rem; color: #b0a090; font-style: italic; }
.notes-save {
  display: inline-flex; align-items: center; gap: .4rem;
  background: var(--gold); color: #fff; border: none;
  padding: .48rem 1.1rem; border-radius: 2px;
  font-family: 'Source Serif 4', serif; font-size: .8rem; font-weight: 600;
  cursor: pointer; transition: background .2s;
}
.notes-save:hover { background: var(--gold-l); }

/* Comments */
.comments-list { display: flex; flex-direction: column; gap: 1.25rem; margin-bottom: 2rem; }
.comment-item  { display: flex; gap: .9rem; }
.ci-avatar {
  width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, var(--gold), var(--rust));
  color: #fff; display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: .9rem;
}
.ci-header { display: flex; align-items: baseline; gap: .65rem; margin-bottom: .3rem; }
.ci-name   { font-weight: 700; font-size: .85rem; color: var(--ink); }
.ci-date   { font-size: .7rem; color: #b0a090; }
.ci-stars  { display: flex; gap: .1rem; margin-bottom: .4rem; }
.star-sm   { font-size: .75rem; color: #d9cdb8; }
.star-sm.on{ color: var(--gold); }
.ci-text   { font-size: .82rem; color: #5a4a35; line-height: 1.65; margin: 0; }

.comment-form {
  background: #fff; border: 1px solid var(--border); border-radius: 3px;
  padding: 1.25rem; border-top: 3px solid var(--gold);
}
.cf-title  { font-family: 'Playfair Display', serif; font-size: 1rem; font-weight: 700; color: var(--ink); margin: 0 0 .85rem; }
.cf-stars  { display: flex; gap: .3rem; margin-bottom: .85rem; }
.cf-star   { font-size: 1.4rem; color: #d9cdb8; cursor: pointer; transition: color .15s; }
.cf-star.on{ color: var(--gold); }
.cf-input  {
  width: 100%; border: 1.5px solid var(--border); border-radius: 2px;
  padding: .75rem; font-family: 'Source Serif 4', serif; font-size: .875rem;
  color: var(--ink); resize: vertical; outline: none; background: #fdf9f4;
  transition: border-color .22s;
}
.cf-input:focus { border-color: var(--gold); }
.cf-submit {
  display: inline-flex; align-items: center; gap: .45rem; margin-top: .75rem;
  background: var(--gold); color: #fff; border: none;
  padding: .55rem 1.35rem; border-radius: 2px;
  font-family: 'Source Serif 4', serif; font-size: .85rem; font-weight: 700;
  cursor: pointer; transition: background .2s;
}
.cf-submit:hover { background: var(--gold-l); }

/* ══ SIDEBAR ══ */
.detail-sidebar { display: flex; flex-direction: column; gap: 1.25rem; }

.instructor-card {
  background: #fff; border: 1px solid var(--border); border-radius: 3px;
  padding: 1.1rem; display: flex; gap: .85rem; align-items: flex-start;
}
.ic-avatar {
  width: 48px; height: 48px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, var(--gold), var(--rust));
  color: #fff; display: flex; align-items: center; justify-content: center;
  font-family: 'Playfair Display', serif; font-size: 1.25rem; font-weight: 700;
}
.ic-name  { font-family: 'Playfair Display', serif; font-size: .95rem; font-weight: 700; color: var(--ink); margin: 0 0 .15rem; }
.ic-role  { font-size: .72rem; color: var(--rust); font-style: italic; margin: 0 0 .5rem; }
.ic-stats { display: flex; gap: .75rem; font-size: .72rem; color: #9a8a72; }
.ic-stats i { color: var(--gold); margin-right: .2rem; }

.info-card, .related-card {
  background: #fff; border: 1px solid var(--border); border-radius: 3px; overflow: hidden;
}
.ic-head {
  font-size: .68rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
  color: #9a8a72; padding: .75rem 1rem; margin: 0; border-bottom: 1px solid var(--border);
  display: flex; align-items: center; gap: .4rem; background: #faf6ef;
}
.ic-head i { font-size: .7rem; color: var(--gold); }
.info-list { list-style: none; margin: 0; padding: .35rem 0; }
.info-list li {
  display: flex; align-items: center; justify-content: space-between;
  padding: .42rem 1rem; border-bottom: 1px solid rgba(217,205,184,.5);
}
.info-list li:last-child { border-bottom: none; }
.il-label { font-size: .75rem; color: #9a8a72; display: flex; align-items: center; gap: .35rem; }
.il-label i { font-size: .7rem; color: var(--gold); }
.il-val   { font-size: .78rem; font-weight: 600; color: var(--ink); }

.related-list { padding: .5rem 0; }
.related-item {
  display: flex; gap: .75rem; padding: .65rem 1rem; cursor: pointer;
  transition: background .15s;
}
.related-item:hover { background: #fdf8f0; }
.ri-thumb-wrap { flex-shrink: 0; position: relative; width: 64px; height: 48px; border-radius: 1px; overflow: hidden; }
.ri-thumb { width: 100%; height: 100%; object-fit: cover; }
.ri-type {
  position: absolute; top: 3px; left: 3px; width: 18px; height: 18px;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: .55rem; color: #fff;
}
.ri-type.video { background: rgba(139,58,30,.88); }
.ri-type.text  { background: rgba(74,94,76,.88);  }
.ri-type.pdf   { background: rgba(42,58,92,.88);  }
.ri-body { flex: 1; min-width: 0; }
.ri-title { font-size: .78rem; font-weight: 600; color: var(--ink); margin: 0 0 .2rem; line-height: 1.3; }
.ri-meta  { font-size: .68rem; color: #9a8a72; }

/* Responsive */
@media (max-width: 640px) {
  .hero-cta  { flex-wrap: wrap; }
  .detail-tabs { overflow-x: auto; }
  .detail-tab  { white-space: nowrap; }
}
</style>