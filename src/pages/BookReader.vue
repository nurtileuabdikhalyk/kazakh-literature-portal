
<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// ─── pdf.js CDN ───────────────────────────────────────
const PDFJS_CDN    = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

// ─── Books registry ───────────────────────────────────
const BOOKS = {
  1: {
    id: 1, title: 'Абай жолы', author: 'Мұхтар Әуезов', rating: 4.9,
    cover: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&q=80',
    pdf: '/books/abai-zholy.pdf',
    chapters: [
      { num: 'I',   title: 'Балалық шақ',    page: 1   },
      { num: 'II',  title: 'Жастық кезең',   page: 18  },
      { num: 'III', title: 'Ғашықтық',       page: 36  },
      { num: 'IV',  title: 'Толысу жылдары', page: 58  },
      { num: 'V',   title: 'Ақындық жол',    page: 80  },
      { num: 'VI',  title: 'Халық жырауы',   page: 102 },
    ],
  },
  2: {
    id: 2, title: 'Өлеңдер мен қарасөздер', author: 'Абай Құнанбайұлы', rating: 4.8,
    cover: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=300&q=80',
    pdf: '/books/abai-olender.pdf',
    chapters: [
      { num: 'I',   title: 'Жастық өлеңдер', page: 1  },
      { num: 'II',  title: 'Философия',       page: 24 },
      { num: 'III', title: 'Қарасөздер',      page: 48 },
    ],
  },
  3: {
    id: 3, title: 'Көшпенділер', author: 'Ілияс Есенберлин', rating: 4.7,
    cover: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300&q=80',
    pdf: '/books/koshpendiler.pdf',
    chapters: [
      { num: 'I',   title: 'Алғашқы тарау', page: 1  },
      { num: 'II',  title: 'Жорық',         page: 30 },
      { num: 'III', title: 'Ұлы жеңіс',     page: 68 },
    ],
  },
}

const bookId = Number(route.params.id) || 1
const book   = BOOKS[bookId] ?? BOOKS[1]

// ─── State ────────────────────────────────────────────
const status        = ref('loading')
const pdfDoc        = ref(null)
const totalPages    = ref(0)
const currentPage   = ref(1)
const inputPage     = ref(1)
const scale         = ref(1.3)
const nightMode     = ref(false)
const showSidebar   = ref(true)
const isFullscreen  = ref(false)
const bookmarks     = ref([])

const canvasMap     = ref({})
const renderedSet   = new Set()
const renderedPages = ref([])

const pdfAreaEl  = ref(null)
const pagesWrapEl = ref(null)

const readPercent = computed(() =>
    totalPages.value ? Math.round((currentPage.value / totalPages.value) * 100) : 0
)

// ─── Load pdf.js ──────────────────────────────────────
function loadScript(src) {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) { res(); return }
    const s = Object.assign(document.createElement('script'), { src })
    s.onload = res; s.onerror = rej
    document.head.appendChild(s)
  })
}

async function loadPdf() {
  status.value = 'loading'
  canvasMap.value = {}
  renderedSet.clear()
  renderedPages.value = []

  try {
    if (!window.pdfjsLib) {
      await loadScript(PDFJS_CDN)
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER
    }

    const pdfTask = window.pdfjsLib.getDocument(book.pdf)
    pdfDoc.value     = await pdfTask.promise
    totalPages.value = pdfDoc.value.numPages
    renderedPages.value = Array.from({ length: totalPages.value }, (_, i) => i + 1)

    status.value = 'ready'
    await nextTick()

    // Render first 3 pages eagerly
    await renderRange(1, Math.min(3, totalPages.value))
    setupObserver()

  } catch (e) {
    console.error('PDF error:', e)
    status.value = 'error'
  }
}

// ─── Render ───────────────────────────────────────────
async function renderRange(from, to) {
  for (let p = from; p <= to; p++) await renderPage(p)
}

async function renderPage(num) {
  if (renderedSet.has(num) || !pdfDoc.value) return
  const canvas = canvasMap.value[num]
  if (!canvas) return
  try {
    const page     = await pdfDoc.value.getPage(num)
    const viewport = page.getViewport({ scale: 2 })        // render @2x for sharpness
    canvas.width   = viewport.width
    canvas.height  = viewport.height
    canvas.style.width  = (viewport.width  / 2) + 'px'    // display @1x
    canvas.style.height = (viewport.height / 2) + 'px'
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
    renderedSet.add(num)
  } catch (e) { console.warn('Page render error', num, e) }
}

function registerCanvas(el, p) { if (el) canvasMap.value[p] = el }

// ─── Intersection observer ────────────────────────────
let observer = null
function setupObserver() {
  observer?.disconnect()
  observer = new IntersectionObserver(entries => {
    entries.forEach(async entry => {
      const num = Number(entry.target.dataset.page)
      if (!num) return
      if (entry.isIntersecting) {
        if (!renderedSet.has(num)) await renderPage(num)
        if (entry.intersectionRatio > 0.25) {
          currentPage.value = num
          inputPage.value   = num
        }
      }
    })
  }, { root: pdfAreaEl.value, threshold: [0.1, 0.25, 0.6] })

  nextTick(() => {
    document.querySelectorAll('.pdf-page-box').forEach(el => {
      el.dataset.page = el.id.replace('pdf-page-', '')
      observer.observe(el)
    })
  })
}

// ─── Navigation ───────────────────────────────────────
async function changePage(delta) {
  await jumpTo(currentPage.value + delta)
}

async function jumpTo(n) {
  const num = Math.max(1, Math.min(Number(n) || 1, totalPages.value))
  currentPage.value = num
  inputPage.value   = num
  await renderPage(num)
  document.getElementById(`pdf-page-${num}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ─── Zoom ─────────────────────────────────────────────
function zoom(d) {
  scale.value = Math.round(Math.max(0.5, Math.min(3, scale.value + d)) * 100) / 100
}
function fitWidth() {
  if (!pdfAreaEl.value) return
  const areaW = pdfAreaEl.value.clientWidth - 64
  const firstCanvas = Object.values(canvasMap.value)[0]
  if (!firstCanvas) return
  const pdfW = parseFloat(firstCanvas.style.width) || firstCanvas.width / 2
  if (pdfW > 0) scale.value = Math.round((areaW / pdfW) * 100) / 100
}
function onCtrlWheel(e) { zoom(e.deltaY < 0 ? 0.1 : -0.1) }

// ─── Fullscreen ───────────────────────────────────────
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}
function onFsChange() { isFullscreen.value = !!document.fullscreenElement }

// ─── Bookmarks ────────────────────────────────────────
const BM_KEY = `bm_book_${book.id}`
function loadBookmarks() { bookmarks.value = JSON.parse(localStorage.getItem(BM_KEY) || '[]') }
function saveBookmarks() { localStorage.setItem(BM_KEY, JSON.stringify(bookmarks.value)) }
function addBookmark() {
  if (!bookmarks.value.includes(currentPage.value)) {
    bookmarks.value = [...bookmarks.value, currentPage.value].sort((a, b) => a - b)
    saveBookmarks()
  }
}
function removeBookmark(p) {
  bookmarks.value = bookmarks.value.filter(b => b !== p)
  saveBookmarks()
}

// ─── TOC active ───────────────────────────────────────
function isChapterActive(ch, idx) {
  const next = book.chapters[idx + 1]
  return currentPage.value >= ch.page && (!next || currentPage.value < next.page)
}

// ─── Keyboard ─────────────────────────────────────────
function onKey(e) {
  if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') changePage(1)
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   changePage(-1)
  if (e.key === '+' || e.key === '=') zoom(0.1)
  if (e.key === '-')                  zoom(-0.1)
  if (e.key === 'b' || e.key === 'B') addBookmark()
  if (e.key === 'n' || e.key === 'N') nightMode.value = !nightMode.value
  if (e.key === 'f' || e.key === 'F') toggleFullscreen()
}

watch(currentPage, v => { inputPage.value = v })

onMounted(() => {
  loadBookmarks()
  loadPdf()
  window.addEventListener('keydown', onKey)
  document.addEventListener('fullscreenchange', onFsChange)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  document.removeEventListener('fullscreenchange', onFsChange)
  observer?.disconnect()
})
</script>

<template>
  <div class="reader-page" :class="{ 'night-mode': nightMode, 'sidebar-hidden': !showSidebar }">

    <!-- ══ TOP BAR ══════════════════════════════════════ -->
    <header class="topbar">
      <div class="tb-left">
        <button class="tb-icon-btn" @click="$router.back()" title="Артқа">
          <i class="pi pi-arrow-left" />
        </button>
        <div class="tb-breadcrumb">
          <span class="tb-book-title">{{ book.title }}</span>
          <span class="tb-book-author">— {{ book.author }}</span>
        </div>
      </div>

      <div class="tb-center">
        <button class="tb-icon-btn" :disabled="currentPage <= 1" @click="changePage(-1)">
          <i class="pi pi-chevron-left" />
        </button>
        <div class="tb-page-ctrl">
          <input
              type="number" v-model.number="inputPage"
              class="tb-page-input" :min="1" :max="totalPages"
              @keyup.enter="jumpTo(inputPage)"
              @blur="jumpTo(inputPage)"
          />
          <span class="tb-page-sep">/</span>
          <span class="tb-page-total">{{ totalPages || '—' }}</span>
        </div>
        <button class="tb-icon-btn" :disabled="currentPage >= totalPages" @click="changePage(1)">
          <i class="pi pi-chevron-right" />
        </button>
      </div>

      <div class="tb-right">
        <button class="tb-icon-btn" @click="zoom(-0.15)" :disabled="scale <= 0.5" title="Кішірейту">
          <i class="pi pi-minus" />
        </button>
        <span class="tb-zoom">{{ Math.round(scale * 100) }}%</span>
        <button class="tb-icon-btn" @click="zoom(0.15)" :disabled="scale >= 3" title="Үлкейту">
          <i class="pi pi-plus" />
        </button>

        <div class="tb-divider" />

        <button class="tb-icon-btn" @click="fitWidth" title="Енге сыйдыру">
          <i class="pi pi-arrows-h" />
        </button>
        <button class="tb-icon-btn" @click="nightMode = !nightMode" :title="nightMode ? 'Ашық' : 'Түнгі'">
          <i :class="nightMode ? 'pi pi-sun' : 'pi pi-moon'" />
        </button>
        <button class="tb-icon-btn" @click="toggleFullscreen" title="Толық экран">
          <i :class="isFullscreen ? 'pi pi-window-minimize' : 'pi pi-window-maximize'" />
        </button>

        <div class="tb-divider" />

        <button class="tb-icon-btn" @click="showSidebar = !showSidebar" title="Панель">
          <i class="pi pi-bars" />
        </button>
      </div>
    </header>

    <!-- Reading progress -->
    <div class="read-progress-bar">
      <div class="rpb-fill" :style="{ width: readPercent + '%' }" />
    </div>

    <!-- ══ BODY ══════════════════════════════════════════ -->
    <div class="reader-body">

      <!-- ── Sidebar ─────────────────────────────────── -->
      <aside class="sidebar" ref="sidebarEl">
        <!-- Book card -->
        <div class="sb-book">
          <div class="sb-cover-wrap">
            <img :src="book.cover" :alt="book.title" class="sb-cover" />
            <div class="sb-cover-shine" />
          </div>
          <div class="sb-info">
            <p class="sb-title">{{ book.title }}</p>
            <p class="sb-author">{{ book.author }}</p>
            <div class="sb-stars">
              <span v-for="i in 5" :key="i" class="star" :class="{ on: i <= Math.round(book.rating) }">★</span>
              <span class="sb-rating-num">{{ book.rating }}</span>
            </div>
          </div>
        </div>

        <!-- Progress -->
        <div class="sb-progress-block">
          <div class="sbp-row">
            <span class="sbp-label">Оқылды</span>
            <span class="sbp-pct">{{ readPercent }}%</span>
          </div>
          <div class="sbp-track"><div class="sbp-bar" :style="{ width: readPercent + '%' }" /></div>
        </div>

        <!-- TOC -->
        <div class="sb-toc">
          <p class="sb-section-head"><i class="pi pi-list" /> Тараулар</p>
          <ul class="toc-list">
            <li
                v-for="(ch, idx) in book.chapters" :key="idx"
                class="toc-item"
                :class="{ active: isChapterActive(ch, idx) }"
                @click="jumpTo(ch.page)"
            >
              <span class="toc-num">{{ ch.num }}</span>
              <span class="toc-name">{{ ch.title }}</span>
              <span class="toc-pg">{{ ch.page }}</span>
            </li>
          </ul>
        </div>

        <!-- Bookmarks -->
        <div class="sb-bookmarks" v-if="bookmarks.length">
          <p class="sb-section-head"><i class="pi pi-bookmark" /> Бетбелгілер</p>
          <ul class="bm-list">
            <li
                v-for="bm in bookmarks" :key="bm"
                class="bm-item"
                @click="jumpTo(bm)"
            >
              <span>{{ bm }}-бет</span>
              <button class="bm-del" @click.stop="removeBookmark(bm)">
                <i class="pi pi-times" />
              </button>
            </li>
          </ul>
        </div>

        <!-- Actions -->
        <div class="sb-actions">
          <button class="sba-btn" @click="addBookmark">
            <i class="pi pi-bookmark" /> Бетбелгі қою
          </button>
          <a :href="book.pdf" download class="sba-btn">
            <i class="pi pi-download" /> Жүктеу
          </a>
        </div>
      </aside>

      <!-- ── PDF Canvas Area ─────────────────────────── -->
      <main class="pdf-area" ref="pdfAreaEl" @wheel.ctrl.prevent="onCtrlWheel">

        <transition name="fade">
          <div v-if="status === 'loading'" class="pdf-state">
            <div class="spinner" />
            <p>PDF жүктелуде…</p>
            <p class="state-hint">{{ book.pdf }}</p>
          </div>
        </transition>

        <transition name="fade">
          <div v-if="status === 'error'" class="pdf-state error">
            <i class="pi pi-exclamation-triangle" />
            <p>PDF файл табылмады</p>
            <p class="state-hint">{{ book.pdf }}</p>
            <p class="state-hint">Файлды <strong>/public/books/</strong> папкасына салыңыз</p>
            <button class="retry-btn" @click="loadPdf">Қайта жүктеу</button>
          </div>
        </transition>

        <div
            v-show="status === 'ready'"
            class="pdf-pages-wrap"
            :style="{ transform: `scale(${scale})`, transformOrigin: 'top center' }"
            ref="pagesWrapEl"
        >
          <div
              v-for="p in renderedPages" :key="p"
              :id="`pdf-page-${p}`"
              class="pdf-page-box"
          >
            <canvas :ref="el => registerCanvas(el, p)" class="pdf-canvas" />
            <div class="pdf-page-num">{{ p }}</div>
          </div>
        </div>

        <div v-if="status === 'ready'" class="key-hint">
          <span>← →</span> бет &nbsp;·&nbsp; <span>Ctrl + scroll</span> zoom &nbsp;·&nbsp; <span>B</span> бетбелгі
        </div>
      </main>
    </div>

    <!-- Float nav arrows -->
    <button class="float-arrow left"  :disabled="currentPage <= 1"          @click="changePage(-1)"><i class="pi pi-chevron-left"  /></button>
    <button class="float-arrow right" :disabled="currentPage >= totalPages" @click="changePage(1)"><i class="pi pi-chevron-right" /></button>

  </div>
</template>


<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,300&display=swap');

.reader-page {
  --gold:      #c4922a;
  --gold-l:    #e8b94f;
  --rust:      #8b3a1e;
  --ink:       #1a1208;
  --parchment: #faf6ef;
  --border:    #d9cdb8;
  --sb-w:      284px;
  --tb-h:      52px;

  display: flex; flex-direction: column;
  height: 100dvh; overflow: hidden;
  background: #cec5b8;
  font-family: 'Source Serif 4', Georgia, serif;
  transition: background .35s;
}
.night-mode {
  --parchment: #17110b;
  --ink:       #e8dcc8;
  --border:    #2c2218;
  background: #0b0806;
}

/* ── Topbar ── */
.topbar {
  display: flex; align-items: center; justify-content: space-between;
  height: var(--tb-h); padding: 0 .875rem; gap: .5rem;
  background: var(--parchment); border-bottom: 2px solid var(--gold);
  flex-shrink: 0; z-index: 60; transition: background .35s;
}
.tb-left   { display: flex; align-items: center; gap: .55rem; flex: 1; min-width: 0; }
.tb-center { display: flex; align-items: center; gap: .35rem; flex-shrink: 0; }
.tb-right  { display: flex; align-items: center; gap: .2rem;  flex-shrink: 0; }

.tb-icon-btn {
  width: 32px; height: 32px;
  border: 1.5px solid var(--border); border-radius: 2px;
  background: transparent; color: #7a6a52;
  display: flex; align-items: center; justify-content: center;
  font-size: .8rem; cursor: pointer; flex-shrink: 0;
  transition: border-color .18s, color .18s;
}
.tb-icon-btn:hover:not(:disabled) { border-color: var(--gold); color: var(--gold); }
.tb-icon-btn:disabled { opacity: .25; cursor: not-allowed; }

.tb-breadcrumb { display: flex; align-items: baseline; gap: .35rem; min-width: 0; overflow: hidden; }
.tb-book-title {
  font-family: 'Playfair Display', serif;
  font-size: .88rem; font-weight: 700; color: var(--ink);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.tb-book-author { font-size: .72rem; color: var(--rust); font-style: italic; white-space: nowrap; }

.tb-page-ctrl { display: flex; align-items: center; gap: .28rem; }
.tb-page-input {
  width: 44px; text-align: center;
  border: 1.5px solid var(--border); border-radius: 2px; background: transparent;
  padding: .22rem; font-family: 'Source Serif 4', serif;
  font-size: .8rem; color: var(--ink); outline: none;
  transition: border-color .18s;
}
.tb-page-input:focus { border-color: var(--gold); }
.tb-page-sep, .tb-page-total { font-size: .78rem; color: #9a8a72; }
.tb-zoom    { font-size: .72rem; color: #7a6a52; min-width: 38px; text-align: center; }
.tb-divider { width: 1px; height: 18px; background: var(--border); margin: 0 .1rem; }

/* ── Progress ── */
.read-progress-bar { height: 3px; background: rgba(196,146,42,.12); flex-shrink: 0; }
.rpb-fill          { height: 100%; background: linear-gradient(90deg, var(--gold), var(--gold-l)); transition: width .5s ease; }

/* ── Body ── */
.reader-body { display: flex; flex: 1; overflow: hidden; }

/* ── Sidebar ── */
.sidebar {
  width: var(--sb-w); flex-shrink: 0;
  background: var(--parchment); border-right: 1px solid var(--border);
  display: flex; flex-direction: column; overflow: hidden;
  transition: width .3s ease, opacity .3s, background .35s;
}
.sidebar-hidden .sidebar { width: 0; opacity: 0; pointer-events: none; }

.sb-book {
  display: flex; gap: .75rem; padding: .9rem 1rem;
  border-bottom: 1px solid var(--border); flex-shrink: 0;
}
.sb-cover-wrap { position: relative; flex-shrink: 0; }
.sb-cover {
  width: 50px; height: 74px; object-fit: cover; border-radius: 1px; display: block;
  box-shadow: 3px 4px 14px rgba(26,18,8,.28);
}
.sb-cover-shine {
  position: absolute; top: 0; left: 0; bottom: 0; width: 9px;
  background: linear-gradient(90deg, rgba(255,255,255,.2), transparent);
  pointer-events: none;
}
.sb-info { flex: 1; min-width: 0; }
.sb-title  { font-family:'Playfair Display',serif; font-size:.78rem; font-weight:700; color:var(--ink); margin:0 0 .12rem; line-height:1.3; }
.sb-author { font-size:.68rem; color:var(--rust); font-style:italic; margin:0 0 .4rem; }
.sb-stars  { display:flex; align-items:center; gap:.1rem; }
.star      { font-size:.72rem; color:#d9cdb8; }
.star.on   { color:var(--gold); }
.sb-rating-num { font-size:.65rem; font-weight:700; color:var(--ink); margin-left:.18rem; }

.sb-progress-block { padding:.65rem 1rem; border-bottom:1px solid var(--border); flex-shrink:0; }
.sbp-row   { display:flex; justify-content:space-between; font-size:.7rem; color:#9a8a72; margin-bottom:.3rem; }
.sbp-pct   { color:var(--gold); font-weight:700; }
.sbp-track { height:4px; background:var(--border); border-radius:2px; overflow:hidden; }
.sbp-bar   { height:100%; background:var(--gold); border-radius:2px; transition:width .5s; }

.sb-toc { flex:1; overflow-y:auto; padding:.4rem 0; }
.sb-section-head {
  font-size:.64rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase;
  color:#9a8a72; padding:.2rem 1rem .35rem; margin:0;
  display:flex; align-items:center; gap:.4rem;
}
.sb-section-head i { font-size:.68rem; color:var(--gold); }

.toc-list { list-style:none; margin:0; padding:0; }
.toc-item {
  display:flex; align-items:center; gap:.4rem; padding:.4rem 1rem; cursor:pointer;
  border-left:2px solid transparent; transition:background .15s, border-color .15s;
}
.toc-item:hover   { background:rgba(196,146,42,.07); }
.toc-item.active  { border-left-color:var(--gold); background:rgba(196,146,42,.1); }
.toc-num  { font-size:.62rem; font-weight:700; color:var(--gold); min-width:16px; }
.toc-name { flex:1; font-size:.75rem; color:var(--ink); }
.toc-item.active .toc-name { font-weight:600; }
.toc-pg   { font-size:.62rem; color:#b0a090; }

.sb-bookmarks { border-top:1px solid var(--border); }
.bm-list  { list-style:none; margin:0; padding:0; }
.bm-item  {
  display:flex; align-items:center; justify-content:space-between;
  padding:.35rem 1rem; font-size:.75rem; color:var(--ink); cursor:pointer;
  transition:background .15s;
}
.bm-item:hover { background:rgba(196,146,42,.07); }
.bm-del { background:none; border:none; color:#b0a090; font-size:.68rem; cursor:pointer; padding:0; transition:color .15s; }
.bm-del:hover { color:var(--rust); }

.sb-actions { padding:.65rem 1rem; border-top:1px solid var(--border); display:flex; flex-direction:column; gap:.38rem; flex-shrink:0; }
.sba-btn {
  display:flex; align-items:center; gap:.42rem; width:100%; padding:.42rem .7rem;
  border:1.5px solid var(--border); border-radius:2px; background:transparent;
  color:#7a6a52; font-family:'Source Serif 4',serif; font-size:.75rem;
  cursor:pointer; text-decoration:none; transition:border-color .18s, color .18s;
}
.sba-btn i { font-size:.75rem; color:var(--gold); }
.sba-btn:hover { border-color:var(--gold); color:var(--gold); }

/* ── PDF Area ── */
.pdf-area {
  flex:1; overflow:auto; position:relative;
  display:flex; flex-direction:column; align-items:center;
  padding:2rem 2.5rem 5rem;
  background:#cec5b8; transition:background .35s;
}
.night-mode .pdf-area { background:#090604; }

.pdf-pages-wrap {
  display:flex; flex-direction:column; align-items:center; gap:1.5rem;
  transform-origin:top center; transition:transform .2s;
}
.pdf-page-box {
  position:relative;
  box-shadow:0 8px 40px rgba(0,0,0,.32), 0 2px 10px rgba(0,0,0,.18);
  border-radius:1px; background:#fff;
}
.night-mode .pdf-page-box { box-shadow:0 8px 48px rgba(0,0,0,.7); }
.pdf-canvas   { display:block; }
.pdf-page-num {
  position:absolute; bottom:-1.5rem; left:0; right:0;
  text-align:center; font-size:.65rem; color:rgba(255,255,255,.32);
  font-style:italic; pointer-events:none;
}

/* States */
.pdf-state {
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:1rem; padding:5rem 2rem; text-align:center;
  color:rgba(255,255,255,.48); font-style:italic;
}
.pdf-state.error i { font-size:2.5rem; color:var(--gold); }
.state-hint { font-size:.75rem; color:rgba(255,255,255,.28); font-family:monospace; font-style:normal; }
.state-hint strong { color:var(--gold-l); }
.spinner {
  width:44px; height:44px;
  border:3px solid rgba(196,146,42,.18);
  border-top-color:var(--gold); border-radius:50%;
  animation:spin .75s linear infinite;
}
@keyframes spin { to { transform:rotate(360deg); } }
.retry-btn {
  background:var(--gold); color:#fff; border:none;
  padding:.48rem 1.4rem; border-radius:2px;
  font-family:'Source Serif 4',serif; font-size:.875rem; font-weight:600;
  cursor:pointer; transition:background .2s;
}
.retry-btn:hover { background:var(--gold-l); }

/* Key hint */
.key-hint {
  position:fixed; bottom:1.1rem; left:50%; transform:translateX(-50%);
  font-size:.68rem; color:rgba(255,255,255,.25);
  background:rgba(0,0,0,.28); padding:.28rem .8rem;
  border-radius:10px; pointer-events:none; white-space:nowrap;
}
.key-hint span { color:var(--gold); }

/* Float arrows */
.float-arrow {
  position:fixed; top:50%; z-index:50; transform:translateY(-50%);
  width:38px; height:38px;
  background:rgba(196,146,42,.8); color:#fff;
  border:none; border-radius:2px;
  display:flex; align-items:center; justify-content:center;
  font-size:.85rem; cursor:pointer; backdrop-filter:blur(4px);
  transition:background .2s, opacity .2s;
}
.float-arrow.left  { left:.5rem; }
.float-arrow.right { right:.5rem; }
.float-arrow:hover:not(:disabled) { background:var(--gold-l); }
.float-arrow:disabled { opacity:.18; cursor:not-allowed; }

/* Transitions */
.fade-enter-active, .fade-leave-active { transition:opacity .28s; }
.fade-enter-from,   .fade-leave-to     { opacity:0; }

/* Responsive */
@media (max-width:900px) {
  .sidebar {
    position:fixed; left:0;
    top:calc(var(--tb-h) + 3px);
    height:calc(100dvh - var(--tb-h) - 3px);
    z-index:80; box-shadow:4px 0 24px rgba(0,0,0,.22);
  }
  .sidebar-hidden .sidebar { width:0; }
  .pdf-area { padding:1.25rem .75rem 5rem; }
}
@media (max-width:560px) {
  .tb-book-author { display:none; }
  .tb-zoom        { display:none; }
}
</style>