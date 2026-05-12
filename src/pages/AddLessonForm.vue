<template>
  <div class="alf-page">

    <!-- ══ HEADER ══════════════════════════════════════ -->
    <div class="alf-header">
      <button class="back-btn" @click="goBack">
        <i class="pi pi-arrow-left"/>
      </button>
      <div class="alf-header-text">
        <h1 class="alf-title">Жаңа сабақ қосу</h1>
        <p class="alf-sub">
          Форманы толтырыңыз →
          <strong style="color:var(--gold-l)">Сақтау</strong> батырмасын басыңыз →
          жаңартылған Excel файл жүктеледі →
          <code>/public/data/</code> папкасына ауыстырыңыз
        </p>
      </div>
    </div>

    <!-- ══ FLOW STEPS ═══════════════════════════════════ -->
    <div class="flow-bar">
      <div v-for="(s,i) in flowSteps" :key="i" class="flow-step">
        <span class="fs-num">{{ i+1 }}</span>
        <i :class="'pi '+s.icon"/>
        <span>{{ s.text }}</span>
        <i v-if="i < flowSteps.length-1" class="pi pi-chevron-right fs-arrow"/>
      </div>
    </div>

    <div class="alf-body">

      <!-- ══ LEFT: FORM ════════════════════════════════ -->
      <div class="alf-form-col">

        <!-- ─ TYPE SELECTOR ─────────────────────────── -->
        <div class="form-section">
          <div class="fs-head">
            <span class="fs-num-badge">1</span>
            Сабақ түрін таңдаңыз
          </div>
          <div class="type-cards">
            <button
                v-for="t in TYPES" :key="t.val"
                class="type-card" :class="[t.val, { active: form.type === t.val }]"
                @click="form.type = t.val"
                type="button"
            >
              <i :class="'pi '+t.icon"/>
              <span class="tc-label">{{ t.label }}</span>
              <span class="tc-hint">{{ t.hint }}</span>
            </button>
          </div>
        </div>

        <!-- ─ BASIC INFO ─────────────────────────────── -->
        <div class="form-section">
          <div class="fs-head">
            <span class="fs-num-badge">2</span>
            Негізгі мәліметтер
          </div>
          <div class="fields-grid">

            <div class="field full">
              <label class="flabel">
                Сабақ атауы <span class="req">*</span>
              </label>
              <input
                  v-model="form.title"
                  class="finput" :class="{ 'finput-err': errors.title }"
                  placeholder="Мысалы: Абай өмірі мен шығармашылығы"
              />
              <p v-if="errors.title" class="ferr">{{ errors.title }}</p>
            </div>

            <div class="field">
              <label class="flabel">
                Тақырып <span class="req">*</span>
              </label>
              <select v-model="form.topic" class="finput fselect" :class="{ 'finput-err': errors.topic }">
                <option value="">— Таңдаңыз —</option>
                <option v-for="t in TOPICS" :key="t">{{ t }}</option>
              </select>
              <p v-if="errors.topic" class="ferr">{{ errors.topic }}</p>
            </div>

            <div class="field">
              <label class="flabel">Санат</label>
              <input v-model="form.category" class="finput" placeholder="Авторлар, Жанрлар…"/>
            </div>

            <div class="field">
              <label class="flabel">Деңгей</label>
              <div class="level-row">
                <button
                    v-for="lv in LEVELS" :key="lv"
                    class="level-btn" :class="[lvCls(lv), { active: form.level === lv }]"
                    @click="form.level = lv" type="button"
                >{{ lv }}</button>
              </div>
            </div>

            <div class="field">
              <label class="flabel">Оқытушы</label>
              <input
                  v-model="form.author"
                  class="finput"
                  :placeholder="currentUser?.name || 'Аты-жөні'"
              />
            </div>

            <div class="field">
              <label class="flabel">Ұзақтығы / Беттер</label>
              <input
                  v-model="form.duration"
                  class="finput"
                  :placeholder="durationPlaceholder"
              />
            </div>

            <div class="field full">
              <label class="flabel">Сыныптар</label>
              <div class="class-row">
                <button
                    v-for="cls in CLASSES" :key="cls"
                    class="class-btn" :class="{ active: form.classes.includes(cls) }"
                    @click="toggleClass(cls)" type="button"
                >{{ cls }}</button>
              </div>
            </div>

            <div class="field full">
              <label class="flabel">Сипаттама</label>
              <textarea
                  v-model="form.description"
                  class="finput ftextarea"
                  rows="2"
                  placeholder="Сабақтың мазмұнын қысқаша сипаттаңыз…"
              />
            </div>

          </div>
        </div>

        <!-- ─ FILE URLS ──────────────────────────────── -->
        <div class="form-section">
          <div class="fs-head">
            <span class="fs-num-badge">3</span>
            Файл жолдары
          </div>
          <div class="fields-grid">

            <!-- Main file URL -->
            <div class="field full">
              <label class="flabel">
                <span class="url-type-dot" :class="form.type"/>
                {{ urlLabel }} <span class="req">*</span>
                <span class="flabel-hint">{{ urlHint }}</span>
              </label>
              <input
                  v-model="form.fileUrl"
                  class="finput" :class="{ 'finput-err': errors.fileUrl }"
                  :placeholder="urlPlaceholder"
              />
              <p v-if="errors.fileUrl" class="ferr">{{ errors.fileUrl }}</p>

              <!-- YouTube preview -->
              <div v-if="ytId" class="yt-preview">
                <img :src="`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`" class="yt-thumb"/>
                <div class="yt-info">
                  <span class="yt-ok"><i class="pi pi-check-circle"/> YouTube URL дұрыс</span>
                  <span class="yt-id">ID: {{ ytId }}</span>
                </div>
              </div>
            </div>

            <!-- Cover image URL -->
            <div class="field full">
              <label class="flabel">
                Мұқаба сурет URL
                <span class="flabel-hint">/covers/сурет.jpg немесе Unsplash URL</span>
              </label>
              <div class="cover-input-row">
                <input
                    v-model="form.cover"
                    class="finput"
                    placeholder="https://images.unsplash.com/…"
                />
                <div v-if="form.cover" class="cover-mini">
                  <img :src="form.cover" class="cover-mini-img" @error="form.cover = ''"/>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- ─ ACTIONS ────────────────────────────────── -->
        <div class="form-actions">
          <button class="btn-save" @click="saveToExcel" :disabled="saving">
            <div v-if="saving" class="btn-spin"/>
            <template v-else>
              <i class="pi pi-file-excel"/>
              Сақтап Excel-ге жүктеу
            </template>
          </button>
          <button class="btn-clear" @click="resetForm" type="button">
            <i class="pi pi-trash"/> Тазалау
          </button>
        </div>

      </div><!-- end form-col -->

      <!-- ══ RIGHT: PREVIEW ════════════════════════════ -->
      <div class="alf-preview-col">
        <div class="preview-sticky">
          <p class="preview-label"><i class="pi pi-eye"/> Алдын ала қарау</p>

          <!-- Card preview -->
          <div class="preview-card" :class="form.type">
            <div class="pc-thumb">
              <img v-if="form.cover" :src="form.cover" class="pc-img" @error="form.cover = ''"/>
              <div v-else class="pc-empty">
                <i :class="'pi '+typeIcon"/>
              </div>
              <span class="pc-badge" :class="form.type">
                <i :class="'pi '+typeIcon"/>
                {{ form.type || '—' }}
              </span>
              <span class="pc-dur">{{ form.duration || '—' }}</span>
            </div>
            <div class="pc-body">
              <span class="pc-topic">{{ form.topic || 'Тақырып' }}</span>
              <h3 class="pc-title">{{ form.title || 'Сабақ атауы' }}</h3>
              <p class="pc-desc">{{ form.description || 'Сипаттама жоқ' }}</p>
              <div class="pc-meta">
                <span><i class="pi pi-user"/>{{ form.author || currentUser?.name || 'Мұғалім' }}</span>
                <span class="pc-level" :class="lvCls(form.level)">{{ form.level }}</span>
              </div>
            </div>
          </div>

          <!-- Excel info -->
          <div class="excel-info">
            <div class="ei-header">
              <i class="pi pi-database"/> Excel-ге жазылатын мәліметтер
            </div>
            <div class="ei-rows">
              <div class="ei-row" v-for="r in excelPreviewRows" :key="r.key">
                <span class="ei-key">{{ r.key }}</span>
                <span class="ei-val" :class="{ empty: !r.val }">
                  {{ r.val || '—' }}
                </span>
              </div>
              <div class="ei-row">
                <span class="ei-key">Бет (Sheet)</span>
                <span class="ei-val sheet">{{ sheetName }}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div><!-- end alf-body -->

    <!-- ══ SUCCESS DIALOG ════════════════════════════════ -->
    <transition name="pop">
      <div v-if="showSuccess" class="success-overlay">
        <div class="success-card">
          <div class="suc-icon"><i class="pi pi-check-circle"/></div>
          <h3 class="suc-title">Сабақ сәтті қосылды!</h3>
          <p class="suc-file">
            <i class="pi pi-download"/> <strong>{{ savedFilename }}</strong> жүктелді
          </p>
          <div class="suc-steps">
            <div class="ss-step" v-for="(s,i) in successSteps" :key="i">
              <span class="ss-num">{{ i+1 }}</span>
              <span v-html="s"/>
            </div>
          </div>
          <div class="suc-actions">
            <button class="btn-save" @click="addAnother">
              <i class="pi pi-plus"/> Тағы қосу
            </button>
            <button class="btn-clear" @click="goBack">
              <i class="pi pi-arrow-left"/> Кабинетке
            </button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import * as XLSX from 'xlsx'

const router = useRouter()
const { currentUser } = useAuth()

// ── Constants ─────────────────────────────────────────
const EXCEL_PATH = '/data/Sabaqtar_MB.xlsx'

const TYPES = [
  { val:'video', label:'Видео',    icon:'pi-play-circle', hint:'YouTube немесе MP4' },
  { val:'text',  label:'Конспект', icon:'pi-file-edit',   hint:'.md немесе .html'   },
  { val:'pdf',   label:'PDF',      icon:'pi-file-pdf',    hint:'.pdf файл'          },
]
const LEVELS  = ['Оңай', 'Орташа', 'Жоғары']
const TOPICS  = ['Классика', 'Поэзия', 'Проза', 'Эпос', 'Теория', 'Авторлар', 'Шығармалар']
const CLASSES = ['8А', '8Ә', '8Б', '8В']

const SHEET_MAP = {
  video: '🎬 Видео сабақтар',
  text:  '📄 Конспекттер',
  pdf:   '📑 PDF материалдар',
}

// ── Form state ────────────────────────────────────────
const form = reactive({
  type:        'video',
  title:       '',
  topic:       '',
  category:    '',
  level:       'Орташа',
  author:      '',
  duration:    '',
  classes:     ['8А', '8Ά', '8Б'],
  description: '',
  fileUrl:     '',
  cover:       '',
})

const errors = reactive({ title:'', topic:'', fileUrl:'' })
const saving      = ref(false)
const showSuccess = ref(false)
const savedFilename = ref('Sabaqtar_MB.xlsx')

// ── Computed helpers ──────────────────────────────────
const typeIcon = computed(() =>
    ({ video:'pi-play-circle', text:'pi-file-edit', pdf:'pi-file-pdf' })[form.type] || 'pi-book'
)

const sheetName = computed(() => SHEET_MAP[form.type] || '—')

const urlLabel = computed(() =>
    ({ video:'Видео URL', text:'Конспект файл жолы', pdf:'PDF файл жолы' })[form.type]
)
const urlHint = computed(() =>
    ({ video:'YouTube немесе /videos/файл.mp4', text:'/texts/файл.md', pdf:'/pdfs/файл.pdf' })[form.type]
)
const urlPlaceholder = computed(() =>
    ({ video:'https://youtube.com/watch?v=... немесе /videos/abai.mp4', text:'/texts/abai-notes.md', pdf:'/pdfs/abai-zholy.pdf' })[form.type]
)
const durationPlaceholder = computed(() =>
    ({ video:'45:20', text:'25 мин', pdf:'48 бет' })[form.type]
)

// YouTube ID extract
const ytId = computed(() => {
  const url = form.fileUrl
  if (!url || (!url.includes('youtube.com') && !url.includes('youtu.be'))) return ''
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : ''
})

// Excel preview rows
const excelPreviewRows = computed(() => [
  { key:'Атауы',       val: form.title },
  { key:'Автор',       val: form.author || currentUser.value?.name },
  { key:'Файл жолы',  val: form.fileUrl },
  { key:'Мұқаба',     val: form.cover },
  { key:'Ұзақтығы',   val: form.duration },
  { key:'Деңгей',     val: form.level },
  { key:'Тақырып',    val: form.topic },
  { key:'Санат',      val: form.category },
  { key:'Сипаттама',  val: form.description },
])

const successSteps = [
  'Жүктелген <code>Sabaqtar_MB.xlsx</code> файлын ашыңыз',
  '<code>/public/data/</code> папкасына ауыстырыңыз (ескі файлды алмастырыңыз)',
  'Бетті жаңартыңыз — сабақ тізімде пайда болады',
]

const flowSteps = [
  { icon:'pi-pencil',      text:'Форманы толтыру'        },
  { icon:'pi-download',    text:'Excel жүктеу'            },
  { icon:'pi-folder-open', text:'/public/data/ қою'       },
  { icon:'pi-refresh',     text:'Бетті жаңарту'          },
]

// ── Helpers ───────────────────────────────────────────
function lvCls(lv) {
  return { 'Оңай':'lv-easy', 'Орташа':'lv-mid', 'Жоғары':'lv-hard' }[lv] || ''
}

function toggleClass(cls) {
  const i = form.classes.indexOf(cls)
  if (i === -1) form.classes.push(cls)
  else form.classes.splice(i, 1)
}

function validate() {
  errors.title   = form.title.trim()   ? '' : 'Сабақ атауын енгізіңіз'
  errors.topic   = form.topic          ? '' : 'Тақырып таңдаңыз'
  errors.fileUrl = form.fileUrl.trim() ? '' : 'Файл жолын енгізіңіз'
  return !errors.title && !errors.topic && !errors.fileUrl
}

function resetForm() {
  Object.assign(form, {
    type:'video', title:'', topic:'', category:'',
    level:'Орташа', author:'', duration:'',
    classes:['8А', '8Ά', '8Б'], description:'', fileUrl:'', cover:'',
  })
  Object.assign(errors, { title:'', topic:'', fileUrl:'' })
}

function goBack() {
  router.push({ name:'teacher-cabinet' })
}

function addAnother() {
  showSuccess.value = false
  resetForm()
}

// ── CORE: Save to Excel ───────────────────────────────
// 1. Existing Sabaqtar_MB.xlsx fetch
// 2. Correct sheet-ке жаңа жол қосу
// 3. Browser-ге download
async function saveToExcel() {
  if (!validate()) return
  saving.value = true

  try {
    // Step 1 — fetch existing Excel
    let wb
    try {
      const res = await fetch(EXCEL_PATH)
      if (!res.ok) throw new Error()
      wb = XLSX.read(await res.arrayBuffer(), { type:'array' })
    } catch {
      // File not found → create minimal workbook with required sheets
      wb = buildFreshWorkbook()
    }

    // Step 2 — find target sheet
    if (!wb.SheetNames.includes(sheetName.value)) {
      // Add missing sheet
      const ws = XLSX.utils.aoa_to_sheet([
        [], [], [], [],                         // rows 1-4 (title area)
        ['','№','Сабақ атауы','Автор / Оқытушы', // row 5 header
          sheetName.value === '🎬 Видео сабақтар'
              ? 'Видео URL (YouTube немесе /videos/файл.mp4)'
              : sheetName.value === '📄 Конспекттер'
                  ? 'Файл жолы (/texts/...) немесе URL'
                  : 'PDF файл жолы (/pdfs/файл.pdf)',
          'Мұқаба сурет URL','Ұзақтығы','Деңгей','Тақырып','Санат','Сипаттама'],
      ])
      XLSX.utils.book_append_sheet(wb, ws, sheetName.value)
    }

    const ws = wb.Sheets[sheetName.value]

    // Step 3 — find next empty row & next ID
    const allRows = XLSX.utils.sheet_to_json(ws, { header:1, defval:'' })
    // Header is at row index 4 (0-based) = Excel row 5
    // Data starts at row index 5 (0-based) = Excel row 6
    const dataRows = allRows.slice(5).filter(r => String(r[2]||'').trim())
    const nextRowIdx = 5 + dataRows.length   // 0-based index for new row
    const nextId = dataRows.length
        ? Math.max(...dataRows.map(r => Number(r[1])||0)) + 1
        : 1

    // Step 4 — build new row
    // Columns: A=skip B=№ C=title D=author E=fileUrl F=cover G=duration H=level I=topic J=category K=description
    const newRow = [
      '',
      nextId,
      form.title.trim(),
      (form.author.trim() || currentUser.value?.name || ''),
      form.fileUrl.trim(),
      form.cover.trim(),
      form.duration.trim(),
      form.level,
      form.topic,
      form.category.trim() || form.topic,
      form.description.trim(),
    ]

    // Step 5 — append to sheet
    XLSX.utils.sheet_add_aoa(ws, [newRow], { origin: { r: nextRowIdx, c: 0 } })

    // Step 6 — also update Auth_MB (📚 Сабақ тізімі) if that sheet exists in same file
    // (Sabaqtar_MB doesn't have this sheet — it's in Auth_MB.
    //  If teacher wants, they can update Auth_MB separately)

    // Step 7 — trigger browser download
    const filename = 'Sabaqtar_MB.xlsx'
    XLSX.writeFile(wb, filename)

    savedFilename.value = filename
    showSuccess.value   = true

  } catch (e) {
    console.error('[AddLessonForm]', e)
    alert('Қате орын алды: ' + (e.message || e))
  } finally {
    saving.value = false
  }
}

// Build a minimal fresh workbook if /public/data/Sabaqtar_MB.xlsx not found
function buildFreshWorkbook() {
  const wb = XLSX.utils.book_new()
  const headerRow = ['','№','Сабақ атауы','Автор / Оқытушы','Файл жолы','Мұқаба сурет URL','Ұзақтығы','Деңгей','Тақырып','Санат','Сипаттама']
  ;['🎬 Видео сабақтар','📄 Конспекттер','📑 PDF материалдар'].forEach(name => {
    const aoa = [[],[],[],[],headerRow]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), name)
  })
  return wb
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,300&display=swap');

.alf-page {
  --ink:   #1a1208; --parch: #faf6ef;
  --gold:  #c4922a; --gold-l:#e8b94f;
  --rust:  #8b3a1e; --sage:  #3a5c3a;
  --navy:  #2a3a5c; --border:#d9cdb8;
  --dark:  #130e07;

  background: #f0e8da;
  font-family: 'Source Serif 4', Georgia, serif;
  min-height: 100dvh;
  color: var(--ink);
}

/* ── Header ── */
.alf-header {
  display: flex; align-items: center; gap: 1rem;
  background: var(--dark); padding: 1rem 1.75rem;
  border-bottom: 2px solid var(--gold); flex-wrap: wrap;
}
.back-btn {
  width: 36px; height: 36px; border-radius: 2px;
  border: 1px solid rgba(255,255,255,.18); background: none;
  color: rgba(255,255,255,.5); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: .82rem; transition: all .2s; flex-shrink: 0;
}
.back-btn:hover { border-color: var(--gold); color: var(--gold-l); }
.alf-title { font-family:'Playfair Display',serif; font-size:1.2rem; font-weight:900; color:#fff; margin:0 0 .2rem; }
.alf-sub   { font-size:.72rem; color:rgba(255,255,255,.45); margin:0; font-style:italic; }
.alf-sub code { font-family:monospace; color:var(--gold-l); font-style:normal; }

/* ── Flow bar ── */
.flow-bar {
  display: flex; align-items: center; flex-wrap: wrap;
  background: rgba(196,146,42,.08); border-bottom: 1px solid rgba(196,146,42,.2);
  padding: .6rem 1.75rem; gap: 0;
}
.flow-step {
  display: flex; align-items: center; gap: .4rem;
  font-size: .72rem; color: #7a6a52;
  padding: .2rem .7rem;
  border-right: 1px solid rgba(196,146,42,.2);
}
.flow-step:last-child { border-right: none; }
.flow-step i:not(.fs-arrow) { color: var(--gold); font-size: .72rem; }
.fs-num  { width: 18px; height: 18px; border-radius: 50%; background: var(--gold); color: #fff; display: flex; align-items: center; justify-content: center; font-size: .6rem; font-weight: 700; flex-shrink: 0; }
.fs-arrow { color: rgba(196,146,42,.3) !important; font-size: .6rem !important; margin-left: .25rem; }

/* ── Body layout ── */
.alf-body {
  display: grid; grid-template-columns: 1fr 320px; gap: 1.5rem;
  max-width: 1100px; margin: 0 auto; padding: 1.5rem;
}
@media(max-width:900px) { .alf-body { grid-template-columns: 1fr; } }

/* ── Form column ── */
.alf-form-col { display: flex; flex-direction: column; gap: 1.1rem; }

.form-section {
  background: #fff; border: 1px solid var(--border); border-radius: 3px; overflow: hidden;
}
.fs-head {
  display: flex; align-items: center; gap: .6rem;
  padding: .7rem 1.1rem; background: var(--parch);
  border-bottom: 1px solid var(--border);
  font-size: .72rem; font-weight: 700; letter-spacing: .08em;
  text-transform: uppercase; color: #9a8a72;
}
.fs-num-badge {
  width: 20px; height: 20px; border-radius: 50%;
  background: var(--gold); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: .62rem; font-weight: 700; flex-shrink: 0;
}

/* Type cards */
.type-cards { display: flex; gap: .85rem; padding: 1rem; flex-wrap: wrap; }
.type-card {
  flex: 1; min-width: 110px;
  display: flex; flex-direction: column; align-items: center; gap: .35rem;
  padding: .9rem .5rem; border: 1.5px solid var(--border); border-radius: 3px;
  background: transparent; cursor: pointer; transition: all .22s;
}
.type-card i { font-size: 1.3rem; }
.type-card:hover { border-color: var(--gold); }
.tc-label { font-size: .82rem; font-weight: 700; color: var(--ink); }
.tc-hint  { font-size: .62rem; color: #b0a090; }

.type-card.active        { color: #fff; }
.type-card.video.active  { border-color: var(--rust); background: var(--rust); }
.type-card.text.active   { border-color: var(--sage); background: var(--sage); }
.type-card.pdf.active    { border-color: var(--navy); background: var(--navy); }
.type-card.active .tc-label { color: #fff; }
.type-card.active .tc-hint  { color: rgba(255,255,255,.65); }
.type-card.active i         { color: #fff; }

/* Fields */
.fields-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .85rem; padding: 1rem; }
.field.full  { grid-column: 1 / -1; }
@media(max-width:560px){ .fields-grid { grid-template-columns: 1fr; } .field.full { grid-column: 1; } }

.field { display: flex; flex-direction: column; gap: .32rem; }
.flabel {
  font-size: .7rem; font-weight: 700; color: #9a8a72;
  text-transform: uppercase; letter-spacing: .06em;
  display: flex; align-items: center; gap: .35rem; flex-wrap: wrap;
}
.flabel-hint { font-size: .62rem; color: #b0a090; font-weight: 400; text-transform: none; letter-spacing: 0; font-style: italic; margin-left: auto; }
.req { color: var(--rust); }

.finput {
  border: 1.5px solid var(--border); border-radius: 2px;
  background: var(--parch); padding: .52rem .75rem;
  font-family: 'Source Serif 4', serif; font-size: .85rem;
  color: var(--ink); outline: none; width: 100%;
  transition: border-color .22s, background .22s;
}
.finput:focus  { border-color: var(--gold); background: #fff; }
.finput-err    { border-color: var(--rust) !important; }
.fselect       { appearance: none; cursor: pointer; }
.ftextarea     { resize: vertical; }
.finput::placeholder { color: #b0a090; font-style: italic; }
.ferr { font-size: .68rem; color: var(--rust); margin: 0; }

/* Level buttons */
.level-row { display: flex; gap: .4rem; }
.level-btn {
  flex: 1; padding: .45rem .25rem; border: 1.5px solid var(--border);
  border-radius: 2px; background: transparent;
  font-family: 'Source Serif 4', serif; font-size: .78rem; font-weight: 600;
  cursor: pointer; transition: all .2s; text-align: center;
}
.level-btn:hover { border-color: var(--gold); color: var(--gold); }
.level-btn.lv-easy.active  { background: #2e7d32; border-color: #2e7d32; color: #fff; }
.level-btn.lv-mid.active   { background: var(--gold); border-color: var(--gold); color: #fff; }
.level-btn.lv-hard.active  { background: var(--rust); border-color: var(--rust); color: #fff; }

/* Class buttons */
.class-row { display: flex; gap: .4rem; flex-wrap: wrap; }
.class-btn {
  padding: .38rem .7rem; border: 1.5px solid var(--border); border-radius: 2px;
  background: transparent; font-family: 'Source Serif 4', serif;
  font-size: .8rem; font-weight: 700; cursor: pointer; color: #7a6a52;
  transition: all .2s;
}
.class-btn:hover { border-color: var(--navy); color: var(--navy); }
.class-btn.active { border-color: var(--navy); background: var(--navy); color: #fff; }

/* URL type dot */
.url-type-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.url-type-dot.video { background: var(--rust); }
.url-type-dot.text  { background: var(--sage); }
.url-type-dot.pdf   { background: var(--navy); }

/* YouTube preview */
.yt-preview { display: flex; align-items: center; gap: .75rem; margin-top: .5rem; }
.yt-thumb   { width: 80px; height: 56px; object-fit: cover; border-radius: 2px; border: 1px solid var(--border); flex-shrink: 0; }
.yt-info    { display: flex; flex-direction: column; gap: .2rem; }
.yt-ok      { font-size: .72rem; color: var(--sage); display: flex; align-items: center; gap: .3rem; }
.yt-ok i    { font-size: .7rem; }
.yt-id      { font-size: .65rem; color: #b0a090; font-family: monospace; }

/* Cover mini */
.cover-input-row { display: flex; gap: .5rem; align-items: flex-start; }
.cover-input-row .finput { flex: 1; }
.cover-mini     { flex-shrink: 0; }
.cover-mini-img { width: 56px; height: 42px; object-fit: cover; border-radius: 2px; border: 1px solid var(--border); display: block; }

/* ── Actions ── */
.form-actions { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; }

.btn-save {
  display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
  background: var(--sage); color: #fff; border: none;
  padding: .75rem 1.75rem; border-radius: 2px;
  font-family: 'Source Serif 4', serif; font-size: .92rem; font-weight: 700;
  cursor: pointer; transition: background .22s; min-width: 220px;
}
.btn-save:hover:not(:disabled) { background: #4a7a4a; }
.btn-save:disabled { opacity: .45; cursor: not-allowed; }

.btn-spin {
  width: 20px; height: 20px;
  border: 2.5px solid rgba(255,255,255,.3); border-top-color: #fff;
  border-radius: 50%; animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.btn-clear {
  display: inline-flex; align-items: center; gap: .4rem;
  border: 1.5px solid var(--border); border-radius: 2px;
  background: transparent; color: #7a6a52; padding: .72rem 1.1rem;
  font-family: 'Source Serif 4', serif; font-size: .85rem; cursor: pointer;
  transition: all .2s;
}
.btn-clear:hover { border-color: var(--rust); color: var(--rust); }

/* ── Preview column ── */
.alf-preview-col { /* sticky handled inside */ }
.preview-sticky { position: sticky; top: 80px; display: flex; flex-direction: column; gap: 1rem; }
.preview-label  { font-size: .68rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #9a8a72; display: flex; align-items: center; gap: .4rem; margin: 0; }
.preview-label i{ color: var(--gold); }

/* Preview card */
.preview-card { background: #fff; border: 1px solid var(--border); border-radius: 3px; overflow: hidden; }
.preview-card::before { content:''; display:block; height:3px; }
.preview-card.video::before { background: var(--rust); }
.preview-card.text::before  { background: var(--sage); }
.preview-card.pdf::before   { background: var(--navy); }

.pc-thumb { position: relative; height: 130px; overflow: hidden; background: #e8e0d4; }
.pc-img   { width: 100%; height: 100%; object-fit: cover; }
.pc-empty { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
.pc-empty i { font-size: 2rem; color: #d9cdb8; }
.pc-badge {
  position: absolute; top: .5rem; left: .5rem;
  display: flex; align-items: center; gap: .28rem;
  font-size: .6rem; font-weight: 700; text-transform: uppercase;
  padding: .18rem .5rem; border-radius: 1px; color: #fff;
}
.pc-badge.video { background: rgba(139,58,30,.9); }
.pc-badge.text  { background: rgba(58,92,58,.9);  }
.pc-badge.pdf   { background: rgba(42,58,92,.9);  }
.pc-dur { position: absolute; bottom: .4rem; right: .4rem; font-size: .6rem; color: #fff; background: rgba(26,18,8,.65); padding: .12rem .4rem; border-radius: 1px; }
.pc-body  { padding: .85rem; }
.pc-topic { font-size: .6rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--gold); display: block; margin-bottom: .28rem; }
.pc-title { font-family: 'Playfair Display', serif; font-size: .88rem; font-weight: 700; color: var(--ink); margin: 0 0 .28rem; line-height: 1.3; }
.pc-desc  { font-size: .7rem; color: #5a4a35; line-height: 1.5; margin: 0 0 .55rem; }
.pc-meta  { display: flex; align-items: center; justify-content: space-between; font-size: .68rem; color: #9a8a72; }
.pc-meta i{ color: var(--gold); margin-right: .2rem; font-size: .62rem; }
.pc-level { font-size: .62rem; font-weight: 700; padding: .1rem .38rem; border-radius: 1px; }
.pc-level.lv-easy { background: #e8f5e9; color: #2e7d32; }
.pc-level.lv-mid  { background: #fff3e0; color: #e65100; }
.pc-level.lv-hard { background: #fce4ec; color: #b71c1c; }

/* Excel info */
.excel-info { background: #fff; border: 1px solid var(--border); border-radius: 3px; overflow: hidden; }
.ei-header  { display: flex; align-items: center; gap: .4rem; padding: .6rem .85rem; background: var(--dark); font-size: .68rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--gold-l); }
.ei-header i{ font-size: .72rem; }
.ei-rows    { display: flex; flex-direction: column; }
.ei-row     { display: flex; padding: .38rem .85rem; border-bottom: 1px solid rgba(217,205,184,.4); gap: .5rem; }
.ei-row:last-child { border-bottom: none; }
.ei-key { font-size: .67rem; color: #9a8a72; min-width: 72px; flex-shrink: 0; }
.ei-val { font-size: .67rem; color: var(--ink); font-family: monospace; word-break: break-all; }
.ei-val.empty { color: #d9cdb8; font-style: italic; font-family: inherit; }
.ei-val.sheet { color: var(--sage); font-weight: 700; font-family: inherit; }

/* ── Success ── */
.success-overlay {
  position: fixed; inset: 0; z-index: 500;
  background: rgba(19,14,7,.8); backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center; padding: 1rem;
}
.pop-enter-active,.pop-leave-active { transition: opacity .35s, transform .35s; }
.pop-enter-from,.pop-leave-to { opacity: 0; transform: scale(.9); }

.success-card {
  background: var(--parch); border: 1px solid var(--border);
  border-top: 4px solid var(--sage); border-radius: 4px;
  padding: 2.25rem; max-width: 480px; width: 100%;
  display: flex; flex-direction: column; align-items: center; gap: 1.1rem;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,.35);
}
.suc-icon { width: 60px; height: 60px; border-radius: 50%; background: rgba(58,92,58,.12); display: flex; align-items: center; justify-content: center; }
.suc-icon i { font-size: 1.75rem; color: var(--sage); }
.suc-title  { font-family: 'Playfair Display', serif; font-size: 1.3rem; font-weight: 900; color: var(--ink); margin: 0; }
.suc-file   { font-size: .82rem; color: #5a4a35; margin: 0; display: flex; align-items: center; gap: .4rem; }
.suc-file i { color: var(--sage); }

.suc-steps { display: flex; flex-direction: column; gap: .45rem; width: 100%; }
.ss-step   { display: flex; align-items: center; gap: .6rem; background: #f5ede0; border: 1px solid var(--border); border-radius: 2px; padding: .5rem .8rem; font-size: .78rem; color: #5a4a35; text-align: left; }
.ss-num    { width: 20px; height: 20px; border-radius: 50%; background: var(--gold); color: #fff; display: flex; align-items: center; justify-content: center; font-size: .62rem; font-weight: 700; flex-shrink: 0; }
.ss-step :deep(code) { font-family: monospace; background: rgba(139,58,30,.08); color: var(--rust); padding: .1rem .35rem; border-radius: 2px; font-size: .75rem; }

.suc-actions { display: flex; gap: .65rem; flex-wrap: wrap; justify-content: center; }
</style>