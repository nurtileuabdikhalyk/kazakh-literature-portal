<template>
  <div class="konspekt-viewer">

    <!-- Header -->
    <div class="kv-header">
      <i class="pi pi-file-edit kv-icon"/>
      <span class="kv-title">{{ title }}</span>
      <div class="kv-tools">
        <div class="kv-font-ctrl">
          <button class="kv-btn" @click="fontSize = Math.max(13, fontSize - 1)">A-</button>
          <button class="kv-btn" @click="fontSize = Math.min(22, fontSize + 1)">A+</button>
        </div>
        <button class="kv-btn" @click="nightMode = !nightMode" :title="nightMode ? 'Ашық' : 'Түнгі'">
          <i :class="nightMode ? 'pi pi-sun' : 'pi pi-moon'"/>
        </button>
        <a v-if="src" :href="src" target="_blank" class="kv-btn" title="Жаңа бетте ашу">
          <i class="pi pi-external-link"/>
        </a>
      </div>
    </div>

    <!-- Body -->
    <div class="kv-body" :class="{ 'night-mode': nightMode }" :style="{ fontSize: fontSize + 'px' }">

      <!-- Loading -->
      <div v-if="status === 'loading'" class="kv-state">
        <div class="kv-spinner"/>
        <p>Конспект жүктелуде…</p>
      </div>

      <!-- Error / not found -->
      <div v-else-if="status === 'error'" class="kv-state error">
        <i class="pi pi-exclamation-triangle"/>
        <p>{{ errorMsg }}</p>
        <p class="kv-hint">{{ src }}</p>
        <a v-if="src" :href="src" target="_blank" class="kv-open-btn">
          <i class="pi pi-external-link"/> Тікелей ашу
        </a>
      </div>

      <!-- Rendered markdown content -->
      <article
        v-else-if="status === 'ready' && renderedHtml"
        class="kv-content"
        v-html="renderedHtml"
      />

      <!-- Fallback: plain text -->
      <pre v-else-if="status === 'ready' && rawText" class="kv-plain">{{ rawText }}</pre>

    </div>

    <!-- Footer: reading progress -->
    <div class="kv-footer">
      <div class="kv-progress-track">
        <div class="kv-progress-fill" :style="{ width: scrollPct + '%' }"/>
      </div>
      <span class="kv-pct-lbl">{{ scrollPct }}% оқылды</span>
      <span class="kv-word-cnt">{{ wordCount }} сөз</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const props = defineProps({
  src:     { type: String, default: '' },
  // Егер src жоқ болса, мазмұнды тікелей беруге болады
  content: { type: String, default: '' },
  title:   { type: String, default: 'Конспект' },
})

const status      = ref('loading')
const rawText     = ref('')
const renderedHtml= ref('')
const errorMsg    = ref('')
const fontSize    = ref(16)
const nightMode   = ref(false)
const scrollPct   = ref(0)

const wordCount = computed(() =>
  rawText.value.trim() ? rawText.value.trim().split(/\s+/).length : 0
)

onMounted(async () => {
  if (props.content) {
    rawText.value = props.content
    renderedHtml.value = renderMarkdown(props.content)
    status.value = 'ready'
  } else if (props.src) {
    await loadFile()
  } else {
    status.value = 'error'
    errorMsg.value = 'Файл жолы немесе мазмұн берілмеген'
  }

  // Scroll tracking
  window.addEventListener('scroll', trackScroll, { passive: true })
})

import { onBeforeUnmount } from 'vue'
onBeforeUnmount(() => window.removeEventListener('scroll', trackScroll))

watch(() => props.src, () => { if (props.src) loadFile() })

async function loadFile() {
  status.value  = 'loading'
  rawText.value = ''
  renderedHtml.value = ''
  errorMsg.value     = ''

  try {
    const res = await fetch(props.src)
    if (!res.ok) throw new Error(`Файл табылмады (${res.status}): ${props.src}`)
    const text = await res.text()
    rawText.value = text

    // Detect markdown
    if (props.src.endsWith('.md') || text.startsWith('#') || text.includes('**')) {
      renderedHtml.value = renderMarkdown(text)
    } else {
      // Plain text or HTML
      renderedHtml.value = `<div class="kv-plain-text">${escapeHtml(text)}</div>`
    }
    status.value = 'ready'
  } catch (e) {
    status.value = 'error'
    errorMsg.value = e.message
    console.error('[KonspektViewer]', e)
  }
}

// ── Simple markdown renderer ──────────────────────────
function renderMarkdown(md) {
  let html = escapeHtml(md)
  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm,  '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm,   '<h1>$1</h1>')
  // Bold, italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g,     '<em>$1</em>')
  // Blockquote
  html = html.replace(/^&gt; (.+)$/gm,  '<blockquote>$1</blockquote>')
  // Unordered list
  html = html.replace(/^\* (.+)$/gm,    '<li>$1</li>')
  html = html.replace(/^- (.+)$/gm,     '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
  // Ordered list
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr/>')
  // Code block
  html = html.replace(/```[\w]*\n?([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
  // Inline code
  html = html.replace(/`(.+?)`/g, '<code>$1</code>')
  // Link
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>')
  // Paragraphs — double newlines
  html = html
    .split(/\n{2,}/)
    .map(block => {
      if (/^<(h[1-6]|ul|ol|blockquote|pre|hr)/.test(block.trim())) return block
      return `<p>${block.trim()}</p>`
    })
    .join('\n')
  return html
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function trackScroll() {
  const el = document.documentElement
  const scrolled = el.scrollTop
  const total    = el.scrollHeight - el.clientHeight
  scrollPct.value = total > 0 ? Math.round((scrolled / total) * 100) : 0
}
</script>

<style scoped>
.konspekt-viewer {
  background: #fff;
  border: 1px solid #d9cdb8;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 24px rgba(26,18,8,.08);
}

/* Header */
.kv-header {
  display: flex; align-items: center; gap: .6rem;
  padding: .65rem 1rem; background: #f0f8f0;
  border-bottom: 2px solid #3a5c3a; flex-wrap: wrap;
}
.kv-icon  { font-size: 1rem; color: #3a5c3a; flex-shrink: 0; }
.kv-title { flex: 1; font-size: .82rem; font-weight: 600; color: #1a1208; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.kv-tools { display: flex; align-items: center; gap: .3rem; }
.kv-font-ctrl { display: flex; border: 1px solid #d9cdb8; border-radius: 1px; overflow: hidden; }
.kv-btn {
  min-width: 30px; height: 30px; padding: 0 .4rem;
  border: 1px solid #d9cdb8; border-radius: 1px;
  background: #fff; color: #7a6a52;
  display: flex; align-items: center; justify-content: center;
  font-size: .78rem; cursor: pointer; font-family: serif;
  text-decoration: none; transition: border-color .2s, color .2s;
}
.kv-font-ctrl .kv-btn { border: none; border-right: 1px solid #d9cdb8; }
.kv-font-ctrl .kv-btn:last-child { border-right: none; }
.kv-btn:hover { border-color: #c4922a; color: #c4922a; }

/* Body */
.kv-body {
  padding: 2rem 2.5rem;
  min-height: 320px;
  background: #fff;
  transition: background .35s, color .35s;
  overflow-y: auto;
  max-height: 620px;
  font-family: 'Source Serif 4', Georgia, serif;
  line-height: 1.85;
  color: #1a1208;
}
.kv-body.night-mode {
  background: #18120c;
  color: #e8dcc8;
}

/* State */
.kv-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem 2rem; text-align: center; color: #9a8a72; font-style: italic; }
.kv-state.error i { font-size: 2rem; color: #c4922a; }
.kv-hint { font-size: .72rem; color: #b0a090; font-family: monospace; font-style: normal; }
.kv-spinner { width: 40px; height: 40px; border: 3px solid rgba(196,146,42,.18); border-top-color: #c4922a; border-radius: 50%; animation: spin .75s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.kv-open-btn { display: inline-flex; align-items: center; gap: .4rem; background: #3a5c3a; color: #fff; border: none; padding: .5rem 1.25rem; border-radius: 2px; font-size: .82rem; text-decoration: none; }
.kv-open-btn:hover { background: #4a7a4a; }

/* Content styles — applied to rendered HTML */
.kv-content :deep(h1) { font-family: 'Playfair Display', serif; font-size: 1.6rem; font-weight: 900; color: #1a1208; margin: 1.5rem 0 .75rem; border-bottom: 2px solid #c4922a; padding-bottom: .4rem; }
.kv-content :deep(h2) { font-family: 'Playfair Display', serif; font-size: 1.25rem; font-weight: 700; color: #8b3a1e; margin: 1.4rem 0 .6rem; }
.kv-content :deep(h3) { font-family: 'Playfair Display', serif; font-size: 1.05rem; font-weight: 700; color: #1a1208; margin: 1.2rem 0 .5rem; }
.kv-content :deep(p)  { margin: 0 0 .85rem; }
.kv-content :deep(blockquote) {
  border-left: 3px solid #c4922a; margin: 1.25rem 0;
  padding: .65rem 1.1rem; background: rgba(196,146,42,.06);
  font-style: italic; border-radius: 0 2px 2px 0; color: #5a4a35;
}
.kv-content :deep(ul), .kv-content :deep(ol) { margin: .5rem 0 .85rem 1.5rem; padding: 0; }
.kv-content :deep(li) { margin-bottom: .3rem; }
.kv-content :deep(strong) { font-weight: 700; color: #1a1208; }
.kv-content :deep(em)     { font-style: italic; color: #5a4a35; }
.kv-content :deep(code)   { font-family: monospace; background: #f5ede0; padding: .15rem .45rem; border-radius: 2px; font-size: .85em; color: #8b3a1e; }
.kv-content :deep(pre)    { background: #1a1208; color: #e8dcc8; padding: 1rem; border-radius: 2px; overflow-x: auto; margin: 1rem 0; }
.kv-content :deep(pre code) { background: none; color: inherit; padding: 0; }
.kv-content :deep(hr)     { border: none; border-top: 1px solid #d9cdb8; margin: 1.5rem 0; }
.kv-content :deep(a)      { color: #c4922a; text-decoration: underline; }
.kv-content :deep(a:hover){ color: #e8b94f; }

.kv-plain { font-family: 'Source Serif 4', Georgia, serif; line-height: 1.85; white-space: pre-wrap; margin: 0; color: inherit; }

/* Night mode overrides */
.night-mode .kv-content :deep(h1) { color: #e8dcc8; }
.night-mode .kv-content :deep(h2) { color: #e8b94f; }
.night-mode .kv-content :deep(h3) { color: #e8dcc8; }
.night-mode .kv-content :deep(p)  { color: #d0c4b0; }
.night-mode .kv-content :deep(code) { background: #2a2018; color: #e8b94f; }
.night-mode .kv-content :deep(blockquote) { background: rgba(196,146,42,.1); color: #c8b89a; }

/* Footer */
.kv-footer { display: flex; align-items: center; gap: .85rem; padding: .55rem 1rem; border-top: 1px solid #d9cdb8; background: #fdf8f0; }
.kv-progress-track { flex: 1; height: 4px; background: #d9cdb8; border-radius: 2px; overflow: hidden; }
.kv-progress-fill  { height: 100%; background: #3a5c3a; border-radius: 2px; transition: width .4s; }
.kv-pct-lbl  { font-size: .68rem; color: #9a8a72; white-space: nowrap; }
.kv-word-cnt { font-size: .68rem; color: #b0a090; margin-left: auto; }
</style>
