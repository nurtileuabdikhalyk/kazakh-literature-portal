<template>
  <div class="pdf-viewer-wrap">

    <!-- Header bar -->
    <div class="pv-header">
      <i class="pi pi-file-pdf pv-icon"/>
      <span class="pv-title">{{ title }}</span>
      <div class="pv-controls">
        <button class="pv-btn" :disabled="currentPage <= 1" @click="currentPage--">
          <i class="pi pi-chevron-left"/>
        </button>
        <span class="pv-page-info">
          <input
            type="number" v-model.number="inputPage"
            class="pv-page-input"
            :min="1" :max="totalPages"
            @keyup.enter="jumpTo(inputPage)"
            @blur="jumpTo(inputPage)"
          />
          / {{ totalPages }}
        </span>
        <button class="pv-btn" :disabled="currentPage >= totalPages" @click="currentPage++">
          <i class="pi pi-chevron-right"/>
        </button>
        <div class="pv-sep"/>
        <button class="pv-btn" @click="zoom(-0.15)" :disabled="scale <= 0.5"><i class="pi pi-minus"/></button>
        <span class="pv-zoom-lbl">{{ Math.round(scale * 100) }}%</span>
        <button class="pv-btn" @click="zoom(0.15)"  :disabled="scale >= 3"><i class="pi pi-plus"/></button>
        <div class="pv-sep"/>
        <a :href="src" target="_blank" class="pv-btn" title="Жаңа бетте ашу">
          <i class="pi pi-external-link"/>
        </a>
        <a :href="src" download class="pv-btn" title="Жүктеу">
          <i class="pi pi-download"/>
        </a>
      </div>
    </div>

    <!-- PDF render area -->
    <div class="pv-body" ref="pvBody" @wheel.ctrl.prevent="onCtrlWheel">

      <!-- Loading state -->
      <div v-if="pdfStatus === 'loading'" class="pv-state">
        <div class="pv-spinner"/>
        <p>PDF жүктелуде…</p>
        <p class="pv-hint">{{ src }}</p>
      </div>

      <!-- Error state -->
      <div v-else-if="pdfStatus === 'error'" class="pv-state error">
        <i class="pi pi-exclamation-triangle"/>
        <p>PDF файл ашылмады</p>
        <p class="pv-hint">{{ src }}</p>
        <a :href="src" target="_blank" class="pv-open-btn">
          <i class="pi pi-external-link"/> Браузерде ашу
        </a>
        <a :href="src" download class="pv-dl-btn">
          <i class="pi pi-download"/> Жүктеу
        </a>
      </div>

      <!-- vue-pdf-embed renders here -->
      <div v-show="pdfStatus === 'ready'" class="pv-canvas-wrap" :style="{ transform: `scale(${scale})`, transformOrigin: 'top center' }">
        <!-- vue-pdf-embed component (installed via npm install vue-pdf-embed) -->
        <VuePdfEmbed
          v-if="VuePdfEmbed"
          :source="src"
          :page="currentPage"
          class="pv-embed"
          @loaded="onLoaded"
          @loading-failed="onError"
          @rendered="onRendered"
        />
        <!-- Fallback: iframe if vue-pdf-embed not installed -->
        <iframe
          v-else
          :src="src + '#page=' + currentPage"
          class="pv-iframe-fallback"
        />
      </div>
    </div>

    <!-- Footer: progress -->
    <div class="pv-footer" v-if="totalPages > 1">
      <div class="pv-progress-track">
        <div class="pv-progress-fill" :style="{ width: readPct + '%' }"/>
      </div>
      <span class="pv-progress-lbl">{{ readPct }}% оқылды</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, shallowRef } from 'vue'

const props = defineProps({
  src:   { type: String, required: true },
  title: { type: String, default: 'PDF материал' },
})

const currentPage = ref(1)
const inputPage   = ref(1)
const totalPages  = ref(1)
const scale       = ref(1.0)
const pdfStatus   = ref('loading')   // 'loading' | 'ready' | 'error'
const pvBody      = ref(null)

// Dynamically import vue-pdf-embed
const VuePdfEmbed = shallowRef(null)

onMounted(async () => {
  try {
    // npm install vue-pdf-embed
    const mod = await import('vue-pdf-embed')
    VuePdfEmbed.value = mod.default || mod.VuePdfEmbed
  } catch {
    // vue-pdf-embed орнатылмаған → iframe fallback пайдаланылады
    console.warn('[PdfViewer] vue-pdf-embed табылмады, iframe fallback қолданылады')
    VuePdfEmbed.value = null
    pdfStatus.value = 'ready'   // iframe-мен ашады
  }
})

const readPct = computed(() =>
  totalPages.value ? Math.round((currentPage.value / totalPages.value) * 100) : 0
)

function onLoaded(pdf) {
  totalPages.value  = pdf?.numPages || 1
  pdfStatus.value   = 'ready'
}
function onRendered()   { pdfStatus.value = 'ready' }
function onError(err)   {
  console.error('[PdfViewer] PDF қате:', err)
  pdfStatus.value = 'error'
}

function jumpTo(n) {
  const num = Math.max(1, Math.min(Number(n) || 1, totalPages.value))
  currentPage.value = num
  inputPage.value   = num
}

function zoom(delta) {
  scale.value = Math.round(Math.max(0.5, Math.min(3, scale.value + delta)) * 100) / 100
}

function onCtrlWheel(e) { zoom(e.deltaY < 0 ? 0.1 : -0.1) }

watch(currentPage, v => { inputPage.value = v })
watch(() => props.src, () => {
  currentPage.value = 1
  totalPages.value  = 1
  pdfStatus.value   = 'loading'
})
</script>

<style scoped>
.pdf-viewer-wrap {
  background: #fff;
  border: 1px solid #d9cdb8;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 24px rgba(26,18,8,.10);
}

/* Header */
.pv-header {
  display: flex; align-items: center; gap: .6rem;
  padding: .65rem 1rem; background: #f8f3ec;
  border-bottom: 1px solid #d9cdb8; flex-wrap: wrap;
}
.pv-icon  { font-size: 1rem; color: #2a3a5c; flex-shrink: 0; }
.pv-title { flex: 1; font-size: .82rem; font-weight: 600; color: #1a1208; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pv-controls { display: flex; align-items: center; gap: .3rem; flex-wrap: wrap; }
.pv-btn {
  width: 30px; height: 30px;
  border: 1px solid #d9cdb8; border-radius: 1px;
  background: #fff; color: #7a6a52;
  display: flex; align-items: center; justify-content: center;
  font-size: .78rem; cursor: pointer; text-decoration: none;
  transition: border-color .2s, color .2s;
}
.pv-btn:hover:not(:disabled) { border-color: #c4922a; color: #c4922a; }
.pv-btn:disabled { opacity: .28; cursor: not-allowed; }
.pv-page-info  { display: flex; align-items: center; gap: .25rem; font-size: .78rem; color: #9a8a72; }
.pv-page-input { width: 38px; text-align: center; border: 1px solid #d9cdb8; border-radius: 1px; padding: .18rem .25rem; font-size: .78rem; color: #1a1208; outline: none; transition: border-color .2s; }
.pv-page-input:focus { border-color: #c4922a; }
.pv-zoom-lbl   { font-size: .72rem; color: #7a6a52; min-width: 38px; text-align: center; }
.pv-sep        { width: 1px; height: 18px; background: #d9cdb8; margin: 0 .1rem; }

/* Body */
.pv-body {
  min-height: 500px;
  background: #c8bfb2;
  display: flex; flex-direction: column; align-items: center;
  padding: 1.5rem;
  overflow: auto;
}

.pv-canvas-wrap {
  transform-origin: top center;
  transition: transform .2s;
  width: 100%;
  display: flex; justify-content: center;
}
.pv-embed { display: block; }

.pv-iframe-fallback {
  width: 100%; height: 560px;
  border: none; display: block;
  border-radius: 2px;
  box-shadow: 0 8px 32px rgba(0,0,0,.25);
}

/* State */
.pv-state {
  display: flex; flex-direction: column; align-items: center; gap: 1rem;
  padding: 4rem 2rem; text-align: center; color: rgba(255,255,255,.5); font-style: italic;
}
.pv-state.error i { font-size: 2.5rem; color: #c4922a; }
.pv-hint { font-size: .72rem; color: rgba(255,255,255,.3); font-family: monospace; font-style: normal; }
.pv-spinner {
  width: 44px; height: 44px;
  border: 3px solid rgba(196,146,42,.2);
  border-top-color: #c4922a;
  border-radius: 50%; animation: spin .75s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.pv-open-btn, .pv-dl-btn {
  display: inline-flex; align-items: center; gap: .4rem;
  padding: .5rem 1.25rem; border-radius: 2px;
  font-size: .82rem; font-weight: 600; cursor: pointer;
  text-decoration: none;
}
.pv-open-btn { background: #c4922a; color: #fff; border: none; }
.pv-open-btn:hover { background: #e8b94f; }
.pv-dl-btn { background: transparent; color: rgba(255,255,255,.65); border: 1.5px solid rgba(255,255,255,.25); }
.pv-dl-btn:hover { border-color: #c4922a; color: #e8b94f; }

/* Footer */
.pv-footer { display: flex; align-items: center; gap: .85rem; padding: .55rem 1rem; border-top: 1px solid #d9cdb8; background: #fdf8f0; }
.pv-progress-track { flex: 1; height: 4px; background: #d9cdb8; border-radius: 2px; overflow: hidden; }
.pv-progress-fill  { height: 100%; background: #c4922a; border-radius: 2px; transition: width .4s; }
.pv-progress-lbl   { font-size: .68rem; color: #9a8a72; white-space: nowrap; }
</style>
