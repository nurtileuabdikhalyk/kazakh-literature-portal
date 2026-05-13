<template>
  <div class="alf-page">

    <!-- ══ HEADER ══════════════════════════════════════ -->
    <div class="alf-header">
      <button class="back-btn" @click="goBack">
        <i class="pi pi-arrow-left"/>
      </button>
      <div>
        <h1 class="alf-title">
          {{ editMode ? 'Сабақты өзгерту' : 'Жаңа сабақ қосу' }}
        </h1>
      </div>
      <!-- Export Excel button -->
      <button class="export-btn" @click="exportToExcel" title="Барлық сабақтарды Excel-ге жүктеу">
        <i class="pi pi-file-excel"/> Excel-ге экспорт
      </button>
    </div>

    <!-- ══ FORM BODY ══════════════════════════════════════ -->
    <div class="alf-body">

      <!-- ─ LEFT: FORM ────────────────────────────────── -->
      <div class="form-col">

        <!-- TYPE -->
        <div class="form-card">
          <div class="fc-head">
            <span class="fc-dot">1</span> Сабақ түрі
          </div>
          <div class="type-row">
            <button
                v-for="t in TYPES" :key="t.val"
                class="type-btn" :class="[t.val, { active: form.type === t.val }]"
                @click="form.type = t.val" type="button"
            >
              <i :class="'pi '+t.icon"/>
              <span>{{ t.label }}</span>
            </button>
          </div>
        </div>

        <!-- BASIC INFO -->
        <div class="form-card">
          <div class="fc-head"><span class="fc-dot">2</span> Негізгі мәліметтер</div>
          <div class="fgrid">

            <div class="field full">
              <label class="flabel">Сабақ атауы <span class="req">*</span></label>
              <input v-model="form.title" class="finput" :class="{ err: ve.title }"
                     placeholder="Мысалы: Абай өмірі мен шығармашылығы"/>
              <p v-if="ve.title" class="ferr">{{ ve.title }}</p>
            </div>

            <div class="field">
              <label class="flabel">Тақырып <span class="req">*</span></label>
              <select v-model="form.topic" class="finput fsel" :class="{ err: ve.topic }">
                <option value="">— Таңдаңыз —</option>
                <option v-for="t in TOPICS" :key="t">{{ t }}</option>
              </select>
              <p v-if="ve.topic" class="ferr">{{ ve.topic }}</p>
            </div>

            <div class="field">
              <label class="flabel">Санат</label>
              <input v-model="form.category" class="finput" placeholder="Авторлар, Жанрлар…"/>
            </div>

            <div class="field">
              <label class="flabel">Деңгей</label>
              <div class="lv-row">
                <button v-for="lv in LEVELS" :key="lv"
                        class="lv-btn" :class="[lvCls(lv), { active: form.level === lv }]"
                        @click="form.level = lv" type="button"
                >{{ lv }}</button>
              </div>
            </div>

            <div class="field">
              <label class="flabel">Оқытушы</label>
              <input v-model="form.author" class="finput"
                     :placeholder="currentUser?.name || 'Аты-жөні'"/>
            </div>

            <div class="field">
              <label class="flabel">Ұзақтығы / Беттер</label>
              <input v-model="form.duration" class="finput" :placeholder="durPlaceholder"/>
            </div>

            <div class="field full">
              <label class="flabel">Сыныптар</label>
              <div class="cls-row">
                <button v-for="cls in CLASSES" :key="cls"
                        class="cls-btn" :class="{ active: form.classes.includes(cls) }"
                        @click="toggleCls(cls)" type="button"
                >{{ cls }}</button>
              </div>
            </div>

            <div class="field full">
              <label class="flabel">Сипаттама</label>
              <textarea v-model="form.description" class="finput fta" rows="2"
                        placeholder="Сабақтың мазмұнын қысқаша сипаттаңыз…"/>
            </div>
          </div>
        </div>

        <!-- FILES -->
        <div class="form-card">
          <div class="fc-head"><span class="fc-dot">3</span> Файл жолдары</div>
          <div class="fgrid">

            <div class="field full">
              <label class="flabel">
                {{ urlLabel }} <span class="req">*</span>
                <span class="flabel-sub">{{ urlHint }}</span>
              </label>
              <input v-model="form.fileUrl" class="finput" :class="{ err: ve.fileUrl }"
                     :placeholder="urlPlaceholder"/>
              <p v-if="ve.fileUrl" class="ferr">{{ ve.fileUrl }}</p>

              <!-- YouTube preview -->
              <div v-if="ytId" class="yt-prev">
                <img :src="`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`" class="yt-img"/>
                <span class="yt-ok"><i class="pi pi-check-circle"/> YouTube дұрыс · ID: {{ ytId }}</span>
              </div>
            </div>

            <div class="field full">
              <label class="flabel">
                Мұқаба сурет URL
                <span class="flabel-sub">/covers/сурет.jpg немесе Unsplash</span>
              </label>
              <div class="cover-row">
                <input v-model="form.cover" class="finput"
                       placeholder="https://images.unsplash.com/…"/>
                <img v-if="form.cover" :src="form.cover" class="cover-mini"
                     @error="form.cover = ''"/>
              </div>
            </div>

          </div>
        </div>

        <!-- ACTIONS -->
        <div class="action-row">
          <button class="btn-save" @click="save" :disabled="saving">
            <div v-if="saving" class="spin"/>
            <template v-else>
              <i :class="editMode ? 'pi pi-check' : 'pi pi-plus'"/>
              {{ editMode ? 'Өзгертулерді сақтау' : 'Сабақты қосу' }}
            </template>
          </button>
          <button class="btn-clear" @click="resetForm" type="button">
            <i class="pi pi-refresh"/> Тазалау
          </button>
          <button class="btn-outline" @click="goBack" type="button">
            <i class="pi pi-arrow-left"/> Артқа
          </button>
        </div>
      </div>

      <!-- ─ RIGHT: PREVIEW + LS INFO ──────────────────── -->
      <div class="preview-col">
        <div class="sticky-wrap">

          <!-- Card preview -->
          <p class="preview-lbl"><i class="pi pi-eye"/> Алдын ала қарау</p>
          <div class="preview-card" :class="form.type">
            <div class="pc-thumb">
              <img v-if="form.cover" :src="form.cover" class="pc-img" @error="form.cover=''"/>
              <div v-else class="pc-no-img">
                <i :class="'pi '+typeIcon"/>
              </div>
              <span class="pc-badge" :class="form.type">
                <i :class="'pi '+typeIcon"/> {{ form.type||'—' }}
              </span>
              <span class="pc-dur">{{ form.duration||'—' }}</span>
            </div>
            <div class="pc-body">
              <span class="pc-topic">{{ form.topic||'Тақырып' }}</span>
              <h3 class="pc-title">{{ form.title||'Сабақ атауы' }}</h3>
              <p class="pc-desc">{{ form.description||'Сипаттама жоқ' }}</p>
              <div class="pc-meta">
                <span><i class="pi pi-user"/>{{ form.author||currentUser?.name||'Мұғалім' }}</span>
                <span class="pc-lv" :class="lvCls(form.level)">{{ form.level }}</span>
              </div>
            </div>
          </div>

          <!-- LocalStorage info -->
          <div class="ls-info-card">
            <div class="li-head">
              <i class="pi pi-database"/> localStorage
            </div>
            <div class="li-rows">
              <div class="li-row">
                <span>Жалпы сабақ</span>
                <span class="li-val">{{ stats.total }}</span>
              </div>
              <div class="li-row">
                <span>Видео</span>
                <span class="li-val video">{{ stats.video }}</span>
              </div>
              <div class="li-row">
                <span>Конспект</span>
                <span class="li-val text">{{ stats.text }}</span>
              </div>
              <div class="li-row">
                <span>PDF</span>
                <span class="li-val pdf">{{ stats.pdf }}</span>
              </div>
              <div class="li-row" v-if="lsMeta">
                <span>Соңғы сақтау</span>
                <span class="li-date">{{ formatDate(lsMeta.savedAt) }}</span>
              </div>
            </div>
            <button class="li-reload" @click="reloadFromExcel">
              <i class="pi pi-refresh"/> Excel-ден қайта жүктеу
            </button>
          </div>

        </div>
      </div>

    </div>

    <!-- ══ SUCCESS TOAST ══════════════════════════════════ -->
    <transition name="toast-slide">
      <div v-if="toast.show" class="toast" :class="toast.type">
        <i :class="'pi ' + (toast.type === 'success' ? 'pi-check-circle' : 'pi-exclamation-triangle')"/>
        {{ toast.msg }}
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth }         from '@/composables/useAuth'
import { useLessonsStore, getLSMeta } from '@/composables/useLessonsStore'

const router = useRouter()
const route  = useRoute()
const { currentUser } = useAuth()
const { lessons, loading, stats, init, reloadFromExcel, addLesson, updateLesson, getById, exportToExcel } = useLessonsStore()

// ── Constants ─────────────────────────────────────────
const TYPES   = [
  { val:'video', label:'Видео',    icon:'pi-play-circle' },
  { val:'text',  label:'Конспект', icon:'pi-file-edit'   },
  { val:'pdf',   label:'PDF',      icon:'pi-file-pdf'    },
]
const LEVELS  = ['Оңай', 'Орташа', 'Жоғары']
const TOPICS  = ['Классика', 'Поэзия', 'Проза', 'Эпос', 'Теория', 'Авторлар', 'Шығармалар']
const CLASSES = ['8А', '8Ά', '8Б', '8В']

// ── Edit mode (if ?id= passed) ────────────────────────
const editMode  = computed(() => !!route.query.id)
const editId    = computed(() => route.query.id || null)

// ── Form ──────────────────────────────────────────────
const form = reactive({
  type:'video', title:'', topic:'', category:'', level:'Орташа',
  author:'', duration:'', classes:['8А','8Ά','8Б'],
  description:'', fileUrl:'', cover:'',
})
const ve     = reactive({ title:'', topic:'', fileUrl:'' })
const saving = ref(false)
const lsMeta = ref(getLSMeta())

const toast  = reactive({ show:false, msg:'', type:'success' })
let toastTimer = null

// ── Computed ──────────────────────────────────────────
const typeIcon = computed(() =>
    ({video:'pi-play-circle',text:'pi-file-edit',pdf:'pi-file-pdf'})[form.type]||'pi-book'
)
const urlLabel = computed(() =>
    ({video:'Видео URL',text:'Файл жолы',pdf:'PDF файл жолы'})[form.type]
)
const urlHint = computed(() =>
    ({video:'YouTube немесе /videos/файл.mp4',text:'/texts/файл.md',pdf:'/pdfs/файл.pdf'})[form.type]
)
const urlPlaceholder = computed(() =>
    ({video:'https://youtube.com/watch?v=...',text:'/texts/abai.md',pdf:'/pdfs/abai.pdf'})[form.type]
)
const durPlaceholder = computed(() =>
    ({video:'45:20',text:'25 мин',pdf:'48 бет'})[form.type]
)
const ytId = computed(() => {
  const url = form.fileUrl
  if (!url || (!url.includes('youtube.com') && !url.includes('youtu.be'))) return ''
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return m?.[1] || ''
})

// ── Init ──────────────────────────────────────────────
onMounted(async () => {
  await init()
  lsMeta.value = getLSMeta()
  // If editing — fill form
  if (editId.value) {
    const lesson = getById(editId.value)
    if (lesson) Object.assign(form, lesson)
  } else {
    form.author = currentUser.value?.name || ''
  }
})

// ── Helpers ───────────────────────────────────────────
function lvCls(lv) {
  return {Оңай:'lv-easy',Орташа:'lv-mid',Жоғары:'lv-hard'}[lv]||''
}
function toggleCls(cls) {
  const i = form.classes.indexOf(cls)
  i === -1 ? form.classes.push(cls) : form.classes.splice(i,1)
}
function validate() {
  ve.title   = form.title.trim()   ? '' : 'Сабақ атауын енгізіңіз'
  ve.topic   = form.topic          ? '' : 'Тақырып таңдаңыз'
  ve.fileUrl = form.fileUrl.trim() ? '' : 'Файл жолын енгізіңіз'
  return !ve.title && !ve.topic && !ve.fileUrl
}
function resetForm() {
  Object.assign(form, {
    type:'video',title:'',topic:'',category:'',level:'Орташа',
    author: currentUser.value?.name||'',
    duration:'',classes:['8А','8Ά','8Б'],description:'',fileUrl:'',cover:'',
  })
  Object.assign(ve, {title:'',topic:'',fileUrl:''})
}
function showToast(msg, type='success') {
  clearTimeout(toastTimer)
  Object.assign(toast, { show:true, msg, type })
  toastTimer = setTimeout(() => { toast.show = false }, 3500)
}
function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('kk-KZ', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
}
function goBack() { router.push({ name:'teacher-cabinet' }) }

// ── SAVE (CREATE or UPDATE) ───────────────────────────
async function save() {
  if (!validate()) return
  saving.value = true
  try {
    const data = { ...form, author: form.author || currentUser.value?.name || '' }
    if (editMode.value && editId.value) {
      updateLesson(editId.value, data)
      showToast('Сабақ жаңартылды!')
    } else {
      addLesson(data)
      showToast('Сабақ қосылды!')
      resetForm()
    }
    lsMeta.value = getLSMeta()
  } catch(e) {
    showToast('Қате: ' + e.message, 'error')
  } finally {
    saving.value = false
  }
}

// ── Reload from Excel ─────────────────────────────────
async function handleReload() {
  await reloadFromExcel()
  lsMeta.value = getLSMeta()
  showToast('Excel-ден қайта жүктелді!')
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,300&display=swap');

.alf-page {
  --ink:#1a1208; --parch:#faf6ef; --gold:#c4922a; --gold-l:#e8b94f;
  --rust:#8b3a1e; --sage:#3a5c3a; --navy:#2a3a5c; --border:#d9cdb8;
  --dark:#130e07;
  background:#f0e8da; font-family:'Source Serif 4',Georgia,serif;
  min-height:100dvh; color:var(--ink);
}

/* Header */
.alf-header { display:flex; align-items:center; gap:1rem; background:var(--dark); padding:1rem 1.75rem; border-bottom:2px solid var(--gold); flex-wrap:wrap; }
.back-btn { width:36px; height:36px; border-radius:2px; border:1px solid rgba(255,255,255,.18); background:none; color:rgba(255,255,255,.5); cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:.82rem; transition:all .2s; flex-shrink:0; }
.back-btn:hover { border-color:var(--gold); color:var(--gold-l); }
.alf-title { font-family:'Playfair Display',serif; font-size:1.2rem; font-weight:900; color:#fff; margin:0 0 .15rem; }
.alf-sub   { font-size:.72rem; color:rgba(255,255,255,.4); margin:0; font-style:italic; }
.alf-sub strong { color:var(--gold-l); font-style:normal; }
.export-btn { display:flex; align-items:center; gap:.45rem; margin-left:auto; background:rgba(58,92,58,.4); border:1px solid rgba(58,92,58,.6); color:#a5d6a7; padding:.48rem 1.1rem; border-radius:2px; font-family:'Source Serif 4',serif; font-size:.8rem; font-weight:600; cursor:pointer; transition:all .2s; }
.export-btn:hover { background:var(--sage); color:#fff; border-color:var(--sage); }

/* Body layout */
.alf-body { display:grid; grid-template-columns:1fr 310px; gap:1.25rem; max-width:1060px; margin:0 auto; padding:1.25rem; }
@media(max-width:860px){ .alf-body{ grid-template-columns:1fr; } }

.form-col { display:flex; flex-direction:column; gap:1rem; }

/* Form card */
.form-card { background:#fff; border:1px solid var(--border); border-radius:3px; overflow:hidden; }
.fc-head { display:flex; align-items:center; gap:.55rem; padding:.65rem 1.1rem; background:var(--parch); border-bottom:1px solid var(--border); font-size:.7rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:#9a8a72; }
.fc-dot { width:20px; height:20px; border-radius:50%; background:var(--gold); color:#fff; display:flex; align-items:center; justify-content:center; font-size:.62rem; font-weight:700; flex-shrink:0; }

/* Type buttons */
.type-row { display:flex; gap:.75rem; padding:1rem; flex-wrap:wrap; }
.type-btn { flex:1; min-width:100px; display:flex; flex-direction:column; align-items:center; gap:.35rem; padding:.85rem .5rem; border:1.5px solid var(--border); border-radius:3px; background:transparent; cursor:pointer; transition:all .22s; }
.type-btn i { font-size:1.25rem; color:#b0a090; transition:color .22s; }
.type-btn span { font-size:.8rem; font-weight:700; color:#7a6a52; transition:color .22s; }
.type-btn:hover { border-color:var(--gold); }
.type-btn.active i, .type-btn.active span { color:#fff; }
.type-btn.video.active { border-color:var(--rust); background:var(--rust); }
.type-btn.text.active  { border-color:var(--sage); background:var(--sage); }
.type-btn.pdf.active   { border-color:var(--navy); background:var(--navy); }

/* Fields grid */
.fgrid { display:grid; grid-template-columns:1fr 1fr; gap:.85rem; padding:1rem; }
.field.full { grid-column:1/-1; }
@media(max-width:560px){ .fgrid{ grid-template-columns:1fr; } .field.full{ grid-column:1; } }

.field { display:flex; flex-direction:column; gap:.3rem; }
.flabel { font-size:.7rem; font-weight:700; color:#9a8a72; text-transform:uppercase; letter-spacing:.06em; display:flex; align-items:center; gap:.35rem; flex-wrap:wrap; }
.flabel-sub { font-size:.62rem; color:#b0a090; font-weight:400; text-transform:none; letter-spacing:0; font-style:italic; margin-left:auto; }
.req { color:var(--rust); }
.finput { border:1.5px solid var(--border); border-radius:2px; background:var(--parch); padding:.52rem .75rem; font-family:'Source Serif 4',serif; font-size:.85rem; color:var(--ink); outline:none; width:100%; transition:border-color .22s, background .22s; }
.finput:focus { border-color:var(--gold); background:#fff; }
.finput.err { border-color:var(--rust); }
.fsel { appearance:none; cursor:pointer; }
.fta  { resize:vertical; }
.finput::placeholder { color:#b0a090; font-style:italic; }
.ferr { font-size:.68rem; color:var(--rust); margin:0; }

/* Level row */
.lv-row { display:flex; gap:.4rem; }
.lv-btn { flex:1; padding:.45rem; border:1.5px solid var(--border); border-radius:2px; background:transparent; font-family:'Source Serif 4',serif; font-size:.78rem; font-weight:600; cursor:pointer; transition:all .2s; text-align:center; color:#7a6a52; }
.lv-btn.lv-easy.active { background:#2e7d32; border-color:#2e7d32; color:#fff; }
.lv-btn.lv-mid.active  { background:var(--gold); border-color:var(--gold); color:#fff; }
.lv-btn.lv-hard.active { background:var(--rust); border-color:var(--rust); color:#fff; }

/* Class row */
.cls-row { display:flex; gap:.4rem; flex-wrap:wrap; }
.cls-btn { padding:.38rem .7rem; border:1.5px solid var(--border); border-radius:2px; background:transparent; font-family:'Source Serif 4',serif; font-size:.8rem; font-weight:700; cursor:pointer; color:#7a6a52; transition:all .2s; }
.cls-btn.active { border-color:var(--navy); background:var(--navy); color:#fff; }

/* YouTube preview */
.yt-prev { display:flex; align-items:center; gap:.65rem; margin-top:.5rem; }
.yt-img  { width:76px; height:54px; object-fit:cover; border-radius:2px; border:1px solid var(--border); flex-shrink:0; }
.yt-ok   { font-size:.72rem; color:var(--sage); display:flex; align-items:center; gap:.3rem; }

/* Cover row */
.cover-row { display:flex; gap:.5rem; align-items:flex-start; }
.cover-row .finput { flex:1; }
.cover-mini { width:54px; height:40px; object-fit:cover; border-radius:2px; border:1px solid var(--border); flex-shrink:0; display:block; }

/* Action row */
.action-row { display:flex; align-items:center; gap:.65rem; flex-wrap:wrap; }
.btn-save { display:inline-flex; align-items:center; justify-content:center; gap:.5rem; background:var(--sage); color:#fff; border:none; padding:.72rem 1.65rem; border-radius:2px; font-family:'Source Serif 4',serif; font-size:.9rem; font-weight:700; cursor:pointer; transition:background .22s; min-width:200px; }
.btn-save:hover:not(:disabled) { background:#4a7a4a; }
.btn-save:disabled { opacity:.45; cursor:not-allowed; }
.spin { width:18px; height:18px; border:2.5px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
.btn-clear { display:inline-flex; align-items:center; gap:.4rem; border:1.5px solid var(--border); border-radius:2px; background:transparent; color:#7a6a52; padding:.68rem 1rem; font-family:'Source Serif 4',serif; font-size:.85rem; cursor:pointer; transition:all .2s; }
.btn-clear:hover { border-color:var(--rust); color:var(--rust); }
.btn-outline { display:inline-flex; align-items:center; gap:.4rem; border:1.5px solid var(--border); border-radius:2px; background:transparent; color:#7a6a52; padding:.68rem 1rem; font-family:'Source Serif 4',serif; font-size:.85rem; cursor:pointer; transition:all .2s; }
.btn-outline:hover { border-color:var(--gold); color:var(--gold); }

/* Preview column */
.sticky-wrap { position:sticky; top:80px; display:flex; flex-direction:column; gap:1rem; }
.preview-lbl { font-size:.68rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:#9a8a72; display:flex; align-items:center; gap:.4rem; margin:0; }
.preview-lbl i { color:var(--gold); }

/* Preview card */
.preview-card { background:#fff; border:1px solid var(--border); border-radius:3px; overflow:hidden; }
.preview-card::before { content:''; display:block; height:3px; }
.preview-card.video::before { background:var(--rust); }
.preview-card.text::before  { background:var(--sage); }
.preview-card.pdf::before   { background:var(--navy); }

.pc-thumb { position:relative; height:120px; overflow:hidden; background:#e8e0d4; }
.pc-img   { width:100%; height:100%; object-fit:cover; }
.pc-no-img{ width:100%; height:100%; display:flex; align-items:center; justify-content:center; }
.pc-no-img i { font-size:2rem; color:#d9cdb8; }
.pc-badge { position:absolute; top:.5rem; left:.5rem; display:flex; align-items:center; gap:.28rem; font-size:.6rem; font-weight:700; text-transform:uppercase; padding:.18rem .5rem; border-radius:1px; color:#fff; }
.pc-badge.video { background:rgba(139,58,30,.9); }
.pc-badge.text  { background:rgba(58,92,58,.9);  }
.pc-badge.pdf   { background:rgba(42,58,92,.9);  }
.pc-dur { position:absolute; bottom:.4rem; right:.4rem; font-size:.6rem; color:#fff; background:rgba(26,18,8,.65); padding:.12rem .4rem; border-radius:1px; }
.pc-body  { padding:.85rem; }
.pc-topic { font-size:.6rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--gold); display:block; margin-bottom:.25rem; }
.pc-title { font-family:'Playfair Display',serif; font-size:.88rem; font-weight:700; color:var(--ink); margin:0 0 .25rem; line-height:1.3; }
.pc-desc  { font-size:.7rem; color:#5a4a35; line-height:1.5; margin:0 0 .5rem; }
.pc-meta  { display:flex; align-items:center; justify-content:space-between; font-size:.68rem; color:#9a8a72; }
.pc-meta i{ color:var(--gold); margin-right:.2rem; font-size:.62rem; }
.pc-lv    { font-size:.62rem; font-weight:700; padding:.1rem .38rem; border-radius:1px; }
.pc-lv.lv-easy { background:#e8f5e9; color:#2e7d32; }
.pc-lv.lv-mid  { background:#fff3e0; color:#e65100; }
.pc-lv.lv-hard { background:#fce4ec; color:#b71c1c; }

/* LS info card */
.ls-info-card { background:var(--dark); border:1px solid rgba(196,146,42,.2); border-radius:3px; overflow:hidden; }
.li-head { display:flex; align-items:center; gap:.4rem; padding:.6rem .85rem; font-size:.68rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--gold-l); border-bottom:1px solid rgba(196,146,42,.15); }
.li-head i { font-size:.72rem; }
.li-rows { padding:.35rem 0; }
.li-row  { display:flex; justify-content:space-between; padding:.35rem .85rem; font-size:.72rem; color:rgba(255,255,255,.45); border-bottom:1px solid rgba(255,255,255,.06); }
.li-row:last-of-type { border-bottom:none; }
.li-val  { font-weight:700; color:#fff; }
.li-val.video { color:#ef9a9a; }
.li-val.text  { color:#a5d6a7; }
.li-val.pdf   { color:#90caf9; }
.li-date { font-size:.65rem; color:rgba(255,255,255,.3); font-family:monospace; }
.li-reload { display:flex; align-items:center; gap:.4rem; width:100%; padding:.55rem .85rem; background:none; border:none; border-top:1px solid rgba(196,146,42,.15); color:rgba(196,146,42,.7); font-family:'Source Serif 4',serif; font-size:.72rem; cursor:pointer; transition:color .2s; }
.li-reload:hover { color:var(--gold-l); }

/* Toast */
.toast { position:fixed; bottom:1.5rem; right:1.5rem; z-index:1000; display:flex; align-items:center; gap:.6rem; padding:.75rem 1.25rem; border-radius:2px; font-size:.85rem; font-weight:600; box-shadow:0 8px 32px rgba(0,0,0,.25); }
.toast.success { background:var(--sage); color:#fff; }
.toast.error   { background:var(--rust); color:#fff; }
.toast-slide-enter-active,.toast-slide-leave-active { transition:opacity .3s, transform .3s; }
.toast-slide-enter-from,.toast-slide-leave-to { opacity:0; transform:translateX(20px); }
</style>