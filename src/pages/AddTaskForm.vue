<template>
  <div class="atf-page">

    <!-- ══ HEADER ══════════════════════════════════════ -->
    <div class="atf-header">
      <button class="back-btn" @click="goBack">
        <i class="pi pi-arrow-left"/>
      </button>
      <div>
        <h1 class="atf-title">
          {{ editMode ? 'Тапсырманы өзгерту' : 'Жаңа тапсырма қосу' }}
        </h1>
      </div>
      <button class="export-btn" @click="exportToExcel">
        <i class="pi pi-file-excel"/> Excel-ге экспорт
      </button>
    </div>

    <!-- ══ BODY ═════════════════════════════════════════ -->
    <div class="atf-body">

      <!-- ─ LEFT: FORM ─────────────────────────────── -->
      <div class="form-col">

        <!-- TYPE selector -->
        <div class="form-card">
          <div class="fc-head"><span class="fc-dot">1</span> Тапсырма түрі</div>
          <div class="type-grid">
            <button
                v-for="t in TYPES" :key="t.val"
                class="type-btn" :class="[t.key, { active: form.type === t.val }]"
                @click="onTypeChange(t.val)"
                type="button"
            >
              <i :class="'pi ' + t.icon"/>
              <span class="tb-label">{{ t.label }}</span>
              <span class="tb-hint">{{ t.hint }}</span>
            </button>
          </div>
        </div>

        <!-- COMMON fields -->
        <div class="form-card">
          <div class="fc-head"><span class="fc-dot">2</span> Негізгі мәліметтер</div>
          <div class="fgrid">

            <div class="field">
              <label class="flabel">Тақырып <span class="req">*</span></label>
              <select v-model="form.topic" class="finput fsel" :class="{ err: ve.topic }">
                <option value="">— Таңдаңыз —</option>
                <option v-for="t in TOPICS" :key="t">{{ t }}</option>
              </select>
              <p v-if="ve.topic" class="ferr">{{ ve.topic }}</p>
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

          </div>
        </div>

        <!-- TYPE-SPECIFIC fields -->

        <!-- ── MCQ ─────────────────────────────────── -->
        <div class="form-card" v-if="form.type === 'mcq'">
          <div class="fc-head"><span class="fc-dot">3</span> Тест сұрағы</div>
          <div class="fgrid">
            <div class="field full">
              <label class="flabel">Сұрақ мәтіні <span class="req">*</span></label>
              <textarea v-model="form.text" class="finput fta" rows="2"
                        :class="{ err: ve.text }" placeholder="Сұрақты жазыңыз…"/>
              <p v-if="ve.text" class="ferr">{{ ve.text }}</p>
            </div>

            <div class="field full">
              <label class="flabel">Жауап нұсқалары <span class="req">*</span></label>
              <div class="options-grid">
                <div v-for="(opt, idx) in mcqOptions" :key="idx" class="opt-row">
                  <span class="opt-letter" :class="{ correct: form.answer === idx + 1 }">
                    {{ String.fromCharCode(65 + idx) }}
                  </span>
                  <input
                      v-model="mcqOptions[idx]"
                      class="finput opt-input"
                      :placeholder="`${String.fromCharCode(65+idx)} нұсқасы`"
                  />
                  <button
                      class="opt-correct-btn"
                      :class="{ active: form.answer === idx + 1 }"
                      @click="form.answer = idx + 1"
                      type="button"
                      title="Дұрыс жауап"
                  >
                    <i :class="form.answer === idx+1 ? 'pi pi-check-circle' : 'pi pi-circle'"/>
                  </button>
                </div>
              </div>
              <p v-if="ve.answer" class="ferr">{{ ve.answer }}</p>
            </div>

            <div class="field full">
              <label class="flabel">Түсіндірме</label>
              <input v-model="form.explanation" class="finput" placeholder="Дұрыс жауапты түсіндіріңіз…"/>
            </div>
          </div>
        </div>

        <!-- ── TRUE/FALSE ─────────────────────────── -->
        <div class="form-card" v-else-if="form.type === 'truefalse'">
          <div class="fc-head"><span class="fc-dot">3</span> Дұрыс / Бұрыс</div>
          <div class="fgrid">
            <div class="field full">
              <label class="flabel">Тұжырым мәтіні <span class="req">*</span></label>
              <textarea v-model="form.text" class="finput fta" rows="2"
                        :class="{ err: ve.text }" placeholder="Тұжырымды жазыңыз…"/>
              <p v-if="ve.text" class="ferr">{{ ve.text }}</p>
            </div>

            <div class="field full">
              <label class="flabel">Дұрыс жауап <span class="req">*</span></label>
              <div class="tf-btns">
                <button
                    class="tf-btn true-btn" :class="{ active: form.answer === true }"
                    @click="form.answer = true" type="button"
                >
                  <i class="pi pi-check"/> Дұрыс
                </button>
                <button
                    class="tf-btn false-btn" :class="{ active: form.answer === false }"
                    @click="form.answer = false" type="button"
                >
                  <i class="pi pi-times"/> Бұрыс
                </button>
              </div>
            </div>

            <div class="field full">
              <label class="flabel">Түсіндірме</label>
              <input v-model="form.explanation" class="finput" placeholder="Дұрыс жауапты түсіндіріңіз…"/>
            </div>
          </div>
        </div>

        <!-- ── FILL BLANK ─────────────────────────── -->
        <div class="form-card" v-else-if="form.type === 'fillblank'">
          <div class="fc-head"><span class="fc-dot">3</span> Бос орынды толтыру</div>
          <div class="fgrid">
            <div class="field full">
              <label class="flabel">
                Мәтін <span class="req">*</span>
                <span class="flabel-hint">Бос орынды <code>___</code> деп белгілеңіз</span>
              </label>
              <textarea v-model="form.text" class="finput fta" rows="2"
                        :class="{ err: ve.text }"
                        placeholder="«Қараңғы түнде тау ___, / Ұйқыға кетер ___»"/>
              <p v-if="ve.text" class="ferr">{{ ve.text }}</p>

              <!-- Blank count preview -->
              <div v-if="blankCount > 0" class="blank-preview">
                <i class="pi pi-info-circle"/>
                <span>{{ blankCount }} бос орын табылды → {{ blankCount }} жауап қажет</span>
              </div>
            </div>

            <div class="field full">
              <label class="flabel">
                Дұрыс жауаптар <span class="req">*</span>
                <span class="flabel-hint">Үтірмен бөліңіз: қалғып, далбаса</span>
              </label>
              <input v-model="form.answersRaw" class="finput"
                     :class="{ err: ve.answers }"
                     placeholder="жауап1, жауап2, жауап3"/>
              <p v-if="ve.answers" class="ferr">{{ ve.answers }}</p>
            </div>

            <div class="field full">
              <label class="flabel">Түсіндірме</label>
              <input v-model="form.explanation" class="finput" placeholder="Дұрыс жауапты түсіндіріңіз…"/>
            </div>
          </div>
        </div>

        <!-- ── MATCH ──────────────────────────────── -->
        <div class="form-card" v-else-if="form.type === 'match'">
          <div class="fc-head"><span class="fc-dot">3</span> Сәйкестендіру</div>
          <div class="fgrid">
            <div class="field full">
              <label class="flabel">Тапсырма атауы <span class="req">*</span></label>
              <input v-model="form.title" class="finput"
                     :class="{ err: ve.title }"
                     placeholder="Мысалы: Автор — Шығарма"/>
              <p v-if="ve.title" class="ferr">{{ ve.title }}</p>
            </div>

            <div class="field full">
              <label class="flabel">
                Жұптар <span class="req">*</span>
                <span class="flabel-hint">Минимум 2 жұп</span>
              </label>

              <div class="pairs-list">
                <div v-for="(pair, idx) in form.pairs" :key="idx" class="pair-row">
                  <span class="pair-idx">{{ idx + 1 }}</span>
                  <input
                      v-model="pair.left"
                      class="finput pair-input"
                      placeholder="Сол жақ (автор, ұғым…)"
                  />
                  <i class="pi pi-arrows-h pair-arrow"/>
                  <input
                      v-model="pair.right"
                      class="finput pair-input"
                      placeholder="Оң жақ (шығарма, анықтама…)"
                  />
                  <button class="pair-del" @click="removePair(idx)" type="button"
                          :disabled="form.pairs.length <= 2">
                    <i class="pi pi-times"/>
                  </button>
                </div>
              </div>

              <button class="add-pair-btn" @click="addPair" type="button">
                <i class="pi pi-plus"/> Жұп қосу
              </button>
              <p v-if="ve.pairs" class="ferr">{{ ve.pairs }}</p>
            </div>

            <div class="field full">
              <label class="flabel">Түсіндірме</label>
              <input v-model="form.explanation" class="finput" placeholder="Түсіндірме (міндетті емес)"/>
            </div>
          </div>
        </div>

        <!-- ACTIONS -->
        <div class="action-row">
          <button class="btn-save" @click="save" :disabled="saving">
            <div v-if="saving" class="spin"/>
            <template v-else>
              <i :class="editMode ? 'pi pi-check' : 'pi pi-plus'"/>
              {{ editMode ? 'Өзгертулерді сақтау' : 'Тапсырманы қосу' }}
            </template>
          </button>
          <button class="btn-clear" @click="resetForm" type="button">
            <i class="pi pi-refresh"/> Тазалау
          </button>
          <button class="btn-outline" @click="goBack" type="button">
            <i class="pi pi-arrow-left"/> Артқа
          </button>
        </div>

      </div><!-- end form-col -->

      <!-- ─ RIGHT: PREVIEW + STATS ─────────────────── -->
      <div class="preview-col">
        <div class="sticky-wrap">

          <!-- Preview -->
          <p class="preview-lbl"><i class="pi pi-eye"/> Алдын ала қарау</p>
          <div class="preview-card" :class="form.type">
            <div class="pc-header">
              <span class="pc-badge" :class="form.type">
                <i :class="'pi ' + currentType?.icon"/>
                {{ currentType?.label }}
              </span>
              <span class="pc-lv" :class="lvCls(form.level)">{{ form.level }}</span>
            </div>
            <p class="pc-topic">{{ form.topic || 'Тақырып' }}</p>
            <p class="pc-text">{{ previewText || 'Сұрақ мәтіні…' }}</p>

            <!-- MCQ preview -->
            <div v-if="form.type === 'mcq'" class="pc-options">
              <div v-for="(opt, i) in mcqOptions" :key="i"
                   class="pc-opt" :class="{ correct: form.answer === i + 1 }">
                <span class="pc-opt-letter">{{ String.fromCharCode(65+i) }}</span>
                <span>{{ opt || '—' }}</span>
              </div>
            </div>

            <!-- TF preview -->
            <div v-else-if="form.type === 'truefalse'" class="pc-tf">
              <span class="pc-tf-badge" :class="form.answer === true ? 'true' : 'false'">
                {{ form.answer === true ? '✓ Дұрыс' : form.answer === false ? '✗ Бұрыс' : '—' }}
              </span>
            </div>

            <!-- Fill preview -->
            <div v-else-if="form.type === 'fillblank'" class="pc-fill">
              <span class="pc-fill-ans">
                {{ form.answersRaw || '—' }}
              </span>
            </div>

            <!-- Match preview -->
            <div v-else-if="form.type === 'match'" class="pc-pairs">
              <div v-for="(p, i) in form.pairs.slice(0, 3)" :key="i" class="pc-pair">
                <span>{{ p.left || '—' }}</span>
                <i class="pi pi-arrow-right"/>
                <span>{{ p.right || '—' }}</span>
              </div>
              <span v-if="form.pairs.length > 3" class="pc-more">
                +{{ form.pairs.length - 3 }} жұп
              </span>
            </div>

            <p v-if="form.explanation" class="pc-exp">
              <i class="pi pi-lightbulb"/> {{ form.explanation }}
            </p>
          </div>

          <!-- Store stats -->
          <div class="ls-info-card">
            <div class="li-head"><i class="pi pi-database"/> localStorage</div>
            <div class="li-rows">
              <div class="li-row">
                <span>Жалпы тапсырма</span>
                <strong class="li-total">{{ stats.total }}</strong>
              </div>
              <div class="li-row">
                <span><i class="pi pi-list-check"/> Тест</span>
                <span class="li-chip mcq">{{ stats.mcq }}</span>
              </div>
              <div class="li-row">
                <span><i class="pi pi-check-square"/> Дұрыс/Бұрыс</span>
                <span class="li-chip tf">{{ stats.tf }}</span>
              </div>
              <div class="li-row">
                <span><i class="pi pi-pencil"/> Бос орын</span>
                <span class="li-chip fill">{{ stats.fill }}</span>
              </div>
              <div class="li-row">
                <span><i class="pi pi-arrows-h"/> Сәйкестендіру</span>
                <span class="li-chip match">{{ stats.match }}</span>
              </div>
              <div class="li-row" v-if="lsMeta">
                <span>Соңғы сақтау</span>
                <span class="li-date">{{ formatDate(lsMeta.savedAt) }}</span>
              </div>
            </div>
            <button class="li-reload" @click="handleReload" :disabled="loading">
              <i class="pi pi-refresh" :class="{ spinning: loading }"/>
              Excel-ден қайта жүктеу
            </button>
          </div>

        </div>
      </div>

    </div><!-- end body -->

    <!-- ══ TOAST ═════════════════════════════════════════ -->
    <transition name="toast-slide">
      <div v-if="toast.show" class="toast" :class="toast.type">
        <i :class="toast.type === 'success' ? 'pi pi-check-circle' : 'pi pi-exclamation-triangle'"/>
        {{ toast.msg }}
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTasksStore, getLSTasksMeta } from '@/composables/useTasksStore'

const router = useRouter()
const route  = useRoute()
const { tasks, loading, stats, init, reloadFromExcel, addTask, updateTask, getById, exportToExcel } = useTasksStore()

// ── Constants ─────────────────────────────────────────
const TYPES = [
  { val:'mcq',        key:'mcq',   label:'Тест',        icon:'pi-list-check',  hint:'4 нұсқа'         },
  { val:'truefalse',  key:'tf',    label:'Дұрыс / Бұрыс',   icon:'pi-check-square',hint:'TRUE / FALSE'    },
  { val:'fillblank',  key:'fill',  label:'Бос орын',         icon:'pi-pencil',      hint:'___ белгісі'     },
  { val:'match',      key:'match', label:'Сәйкестендіру',    icon:'pi-arrows-h',    hint:'Жұп жасау'       },
]
const LEVELS = ['Оңай', 'Орташа', 'Жоғары']
const TOPICS = ['Классика', 'Поэзия', 'Проза', 'Эпос', 'Теория', 'Авторлар', 'Шығармалар']

// ── Edit mode ─────────────────────────────────────────
const editMode = computed(() => !!route.query.id)
const editId   = computed(() => route.query.id || null)

// ── Form ──────────────────────────────────────────────
const form = reactive({
  type:        'mcq',
  topic:       '',
  level:       'Оңай',
  text:        '',
  explanation: '',
  // MCQ
  answer:      null,
  // TF — answer reused (true/false)
  // Fill
  answersRaw:  '',
  // Match
  title:       '',
  pairs:       [{ left:'', right:'' }, { left:'', right:'' }, { left:'', right:'' }],
})

const mcqOptions = ref(['', '', '', ''])
const ve = reactive({ text:'', topic:'', answer:'', answers:'', title:'', pairs:'' })
const saving   = ref(false)
const lsMeta   = ref(getLSTasksMeta())
const toast    = reactive({ show:false, msg:'', type:'success' })
let   toastTimer = null

// ── Computed ──────────────────────────────────────────
const currentType  = computed(() => TYPES.find(t => t.val === form.type))
const blankCount   = computed(() => (form.text.match(/___/g) || []).length)
const previewText  = computed(() => form.text || (form.type === 'match' ? form.title : ''))

// ── Init ──────────────────────────────────────────────
onMounted(async () => {
  await init()
  lsMeta.value = getLSTasksMeta()
  if (editId.value) {
    const task = getById(editId.value)
    if (task) loadTask(task)
  }
})

function loadTask(task) {
  form.type        = task.type
  form.topic       = task.topic
  form.level       = task.level
  form.text        = task.text || ''
  form.explanation = task.explanation || ''
  form.answer      = task.answer ?? null
  form.answersRaw  = task.answers?.join(', ') || ''
  form.title       = task.title || ''
  form.pairs       = task.pairs?.length
      ? task.pairs.map(p => ({ ...p }))
      : [{ left:'', right:'' }, { left:'', right:'' }]
  if (task.type === 'mcq') {
    mcqOptions.value = [task.optionA||'', task.optionB||'', task.optionC||'', task.optionD||'']
  }
}

// ── Type change ───────────────────────────────────────
function onTypeChange(type) {
  form.type   = type
  form.answer = type === 'truefalse' ? null : type === 'mcq' ? null : null
}

// ── Validate ──────────────────────────────────────────
function validate() {
  Object.keys(ve).forEach(k => ve[k] = '')
  let ok = true
  if (!form.topic) { ve.topic = 'Тақырып таңдаңыз'; ok = false }

  if (form.type === 'mcq') {
    if (!form.text.trim())           { ve.text   = 'Сұрақ мәтінін жазыңыз'; ok = false }
    if (!form.answer)                { ve.answer = 'Дұрыс жауапты белгілеңіз'; ok = false }
    if (mcqOptions.value.filter(o => o.trim()).length < 2) { ve.answer = 'Кем дегенде 2 нұсқа толтырыңыз'; ok = false }
  } else if (form.type === 'truefalse') {
    if (!form.text.trim())           { ve.text   = 'Тұжырым мәтінін жазыңыз'; ok = false }
    if (form.answer === null)        { ve.answer = 'Дұрыс/Бұрыс таңдаңыз'; ok = false }
  } else if (form.type === 'fillblank') {
    if (!form.text.trim())           { ve.text    = 'Мәтінді жазыңыз'; ok = false }
    if (!form.answersRaw.trim())     { ve.answers = 'Дұрыс жауаптарды жазыңыз'; ok = false }
    if (blankCount.value === 0)      { ve.text    = 'Мәтінде ___ белгісі жоқ'; ok = false }
  } else if (form.type === 'match') {
    if (!form.title.trim())          { ve.title = 'Атауын жазыңыз'; ok = false }
    const validPairs = form.pairs.filter(p => p.left.trim() && p.right.trim())
    if (validPairs.length < 2)       { ve.pairs = 'Кем дегенде 2 толық жұп керек'; ok = false }
  }
  return ok
}

// ── Save ──────────────────────────────────────────────
async function save() {
  if (!validate()) return
  saving.value = true
  try {
    const data = buildTaskData()
    if (editMode.value && editId.value) {
      updateTask(editId.value, data)
      showToast('Тапсырма жаңартылды!')
    } else {
      addTask(data)
      showToast('Тапсырма қосылды!')
      resetForm()
    }
    lsMeta.value = getLSTasksMeta()
  } catch (e) {
    showToast('Қате: ' + e.message, 'error')
  } finally {
    saving.value = false
  }
}

function buildTaskData() {
  const base = { type: form.type, topic: form.topic, level: form.level, explanation: form.explanation || '' }
  if (form.type === 'mcq') {
    return { ...base, text: form.text, answer: form.answer,
      optionA: mcqOptions.value[0], optionB: mcqOptions.value[1],
      optionC: mcqOptions.value[2], optionD: mcqOptions.value[3] }
  }
  if (form.type === 'truefalse') {
    return { ...base, text: form.text, answer: form.answer }
  }
  if (form.type === 'fillblank') {
    const answers = form.answersRaw.split(',').map(s => s.trim()).filter(Boolean)
    return { ...base, text: form.text, answers, answersRaw: form.answersRaw }
  }
  if (form.type === 'match') {
    const pairs = form.pairs.filter(p => p.left.trim() && p.right.trim())
    return { ...base, title: form.title, pairs }
  }
  return base
}

// ── Helpers ───────────────────────────────────────────
function resetForm() {
  form.type='mcq'; form.topic=''; form.level='Оңай'
  form.text=''; form.explanation=''; form.answer=null
  form.answersRaw=''; form.title=''
  form.pairs=[{left:'',right:''},{left:'',right:''},{left:'',right:''}]
  mcqOptions.value=['','','','']
  Object.keys(ve).forEach(k => ve[k]='')
}
function addPair()        { form.pairs.push({ left:'', right:'' }) }
function removePair(idx)  { if (form.pairs.length > 2) form.pairs.splice(idx, 1) }
function lvCls(lv)        { return {Оңай:'lv-easy',Орташа:'lv-mid',Жоғары:'lv-hard'}[lv]||'' }
function goBack()         { router.push({ name:'teacher-cabinet', query:{ section:'tests' } }) }
function formatDate(iso)  {
  if (!iso) return ''
  return new Date(iso).toLocaleString('kk-KZ', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
}
function showToast(msg, type='success') {
  clearTimeout(toastTimer)
  Object.assign(toast, { show:true, msg, type })
  toastTimer = setTimeout(() => { toast.show = false }, 3500)
}
async function handleReload() {
  await reloadFromExcel()
  lsMeta.value = getLSTasksMeta()
  showToast('Excel-ден қайта жүктелді!')
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,300&display=swap');

.atf-page {
  --ink:#1a1208; --parch:#faf6ef; --gold:#c4922a; --gold-l:#e8b94f;
  --rust:#8b3a1e; --sage:#3a5c3a; --navy:#2a3a5c; --border:#d9cdb8;
  --dark:#130e07; --mcq:#c4922a; --tf:#3a5c3a; --fill:#8b3a1e; --match:#2a3a5c;
  background:#f0e8da; font-family:'Source Serif 4',Georgia,serif;
  min-height:100dvh; color:var(--ink);
}

/* Header */
.atf-header { display:flex; align-items:center; gap:1rem; background:var(--dark); padding:1rem 1.75rem; border-bottom:2px solid var(--gold); flex-wrap:wrap; }
.back-btn   { width:36px; height:36px; border-radius:2px; border:1px solid rgba(255,255,255,.18); background:none; color:rgba(255,255,255,.5); cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:.82rem; transition:all .2s; flex-shrink:0; }
.back-btn:hover { border-color:var(--gold); color:var(--gold-l); }
.atf-title  { font-family:'Playfair Display',serif; font-size:1.2rem; font-weight:900; color:#fff; margin:0 0 .15rem; }
.atf-sub    { font-size:.72rem; color:rgba(255,255,255,.4); margin:0; font-style:italic; }
.atf-sub strong { color:var(--gold-l); font-style:normal; }
.export-btn { display:flex; align-items:center; gap:.45rem; margin-left:auto; background:rgba(58,92,58,.4); border:1px solid rgba(58,92,58,.6); color:#a5d6a7; padding:.48rem 1.1rem; border-radius:2px; font-family:'Source Serif 4',serif; font-size:.8rem; font-weight:600; cursor:pointer; transition:all .2s; }
.export-btn:hover { background:var(--sage); color:#fff; border-color:var(--sage); }

/* Body */
.atf-body { display:grid; grid-template-columns:1fr 295px; gap:1.25rem; max-width:1060px; margin:0 auto; padding:1.25rem; }
@media(max-width:860px){ .atf-body{ grid-template-columns:1fr; } }

.form-col { display:flex; flex-direction:column; gap:1rem; }

/* Form card */
.form-card { background:#fff; border:1px solid var(--border); border-radius:3px; overflow:hidden; }
.fc-head   { display:flex; align-items:center; gap:.55rem; padding:.65rem 1.1rem; background:var(--parch); border-bottom:1px solid var(--border); font-size:.7rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:#9a8a72; }
.fc-dot    { width:20px; height:20px; border-radius:50%; background:var(--gold); color:#fff; display:flex; align-items:center; justify-content:center; font-size:.62rem; font-weight:700; flex-shrink:0; }

/* Type grid */
.type-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:.6rem; padding:1rem; }
@media(max-width:560px){ .type-grid{ grid-template-columns:repeat(2,1fr); } }
.type-btn  { display:flex; flex-direction:column; align-items:center; gap:.3rem; padding:.75rem .4rem; border:1.5px solid var(--border); border-radius:3px; background:transparent; cursor:pointer; transition:all .22s; }
.type-btn i { font-size:1.2rem; color:#b0a090; transition:color .22s; }
.tb-label  { font-size:.75rem; font-weight:700; color:#7a6a52; }
.tb-hint   { font-size:.6rem; color:#b0a090; }
.type-btn:hover { border-color:var(--gold); }
.type-btn.active i, .type-btn.active .tb-label { color:#fff; }
.type-btn.active .tb-hint { color:rgba(255,255,255,.65); }
.type-btn.mcq.active   { border-color:var(--gold);  background:var(--gold);  }
.type-btn.tf.active    { border-color:var(--sage);  background:var(--sage);  }
.type-btn.fill.active  { border-color:var(--rust);  background:var(--rust);  }
.type-btn.match.active { border-color:var(--navy);  background:var(--navy);  }

/* Fields */
.fgrid  { display:grid; grid-template-columns:1fr 1fr; gap:.85rem; padding:1rem; }
.field.full { grid-column:1/-1; }
@media(max-width:560px){ .fgrid{ grid-template-columns:1fr; } .field.full{ grid-column:1; } }

.field  { display:flex; flex-direction:column; gap:.3rem; }
.flabel { font-size:.7rem; font-weight:700; color:#9a8a72; text-transform:uppercase; letter-spacing:.06em; display:flex; align-items:center; gap:.35rem; flex-wrap:wrap; }
.flabel-hint { font-size:.62rem; color:#b0a090; font-weight:400; text-transform:none; letter-spacing:0; font-style:italic; margin-left:auto; }
.flabel-hint code { background:#f5ede0; padding:.1rem .3rem; border-radius:2px; font-family:monospace; color:var(--rust); font-style:normal; }
.req    { color:var(--rust); }
.finput { border:1.5px solid var(--border); border-radius:2px; background:var(--parch); padding:.52rem .75rem; font-family:'Source Serif 4',serif; font-size:.85rem; color:var(--ink); outline:none; width:100%; transition:border-color .22s, background .22s; }
.finput:focus { border-color:var(--gold); background:#fff; }
.finput.err   { border-color:var(--rust); }
.fsel   { appearance:none; cursor:pointer; }
.fta    { resize:vertical; }
.finput::placeholder { color:#b0a090; font-style:italic; }
.ferr   { font-size:.68rem; color:var(--rust); margin:0; }

/* Level */
.lv-row { display:flex; gap:.4rem; }
.lv-btn { flex:1; padding:.45rem; border:1.5px solid var(--border); border-radius:2px; background:transparent; font-family:'Source Serif 4',serif; font-size:.78rem; font-weight:600; cursor:pointer; transition:all .2s; text-align:center; color:#7a6a52; }
.lv-btn.lv-easy.active { background:#2e7d32; border-color:#2e7d32; color:#fff; }
.lv-btn.lv-mid.active  { background:var(--gold); border-color:var(--gold); color:#fff; }
.lv-btn.lv-hard.active { background:var(--rust); border-color:var(--rust); color:#fff; }

/* MCQ options */
.options-grid { display:flex; flex-direction:column; gap:.5rem; }
.opt-row  { display:flex; align-items:center; gap:.5rem; }
.opt-letter { width:28px; height:28px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:.72rem; font-weight:700; background:rgba(196,146,42,.12); color:var(--gold); transition:all .2s; }
.opt-letter.correct { background:var(--sage); color:#fff; }
.opt-input { flex:1; }
.opt-correct-btn { background:none; border:none; cursor:pointer; font-size:1.1rem; color:#d9cdb8; flex-shrink:0; padding:0; transition:color .2s; }
.opt-correct-btn.active { color:var(--sage); }
.opt-correct-btn:hover  { color:var(--sage); }

/* TF buttons */
.tf-btns { display:flex; gap:.85rem; }
.tf-btn  { flex:1; display:flex; align-items:center; justify-content:center; gap:.5rem; padding:.75rem; border:1.5px solid var(--border); border-radius:3px; background:transparent; font-family:'Source Serif 4',serif; font-size:.9rem; font-weight:700; cursor:pointer; transition:all .22s; }
.tf-btn i { font-size:1rem; }
.true-btn  { color:var(--sage); }
.false-btn { color:var(--rust); }
.true-btn.active  { background:rgba(58,92,58,.1);  border-color:var(--sage); }
.false-btn.active { background:rgba(139,58,30,.1); border-color:var(--rust); }

/* Fill blank */
.blank-preview { display:flex; align-items:center; gap:.4rem; font-size:.72rem; color:var(--sage); background:rgba(58,92,58,.07); border:1px solid rgba(58,92,58,.2); padding:.4rem .65rem; border-radius:2px; }
.blank-preview i { font-size:.7rem; }

/* Match pairs */
.pairs-list { display:flex; flex-direction:column; gap:.5rem; margin-bottom:.6rem; }
.pair-row   { display:flex; align-items:center; gap:.5rem; }
.pair-idx   { width:20px; font-size:.7rem; font-weight:700; color:#b0a090; flex-shrink:0; text-align:center; }
.pair-input { flex:1; }
.pair-arrow { color:#b0a090; font-size:.85rem; flex-shrink:0; }
.pair-del   { width:28px; height:28px; border:1px solid var(--border); border-radius:2px; background:transparent; color:#b0a090; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:.72rem; transition:all .2s; flex-shrink:0; }
.pair-del:hover:not(:disabled) { border-color:var(--rust); color:var(--rust); }
.pair-del:disabled { opacity:.3; cursor:not-allowed; }
.add-pair-btn { display:inline-flex; align-items:center; gap:.35rem; background:rgba(196,146,42,.08); border:1.5px dashed rgba(196,146,42,.4); border-radius:2px; color:var(--gold); padding:.42rem .85rem; font-family:'Source Serif 4',serif; font-size:.78rem; font-weight:600; cursor:pointer; transition:all .2s; width:100%; justify-content:center; }
.add-pair-btn:hover { background:rgba(196,146,42,.14); border-color:var(--gold); }

/* Actions */
.action-row { display:flex; align-items:center; gap:.65rem; flex-wrap:wrap; }
.btn-save   { display:inline-flex; align-items:center; justify-content:center; gap:.5rem; background:var(--sage); color:#fff; border:none; padding:.72rem 1.65rem; border-radius:2px; font-family:'Source Serif 4',serif; font-size:.9rem; font-weight:700; cursor:pointer; transition:background .22s; min-width:200px; }
.btn-save:hover:not(:disabled) { background:#4a7a4a; }
.btn-save:disabled { opacity:.45; cursor:not-allowed; }
.spin { width:18px; height:18px; border:2.5px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
.btn-clear  { display:inline-flex; align-items:center; gap:.4rem; border:1.5px solid var(--border); border-radius:2px; background:transparent; color:#7a6a52; padding:.68rem 1rem; font-family:'Source Serif 4',serif; font-size:.85rem; cursor:pointer; transition:all .2s; }
.btn-clear:hover  { border-color:var(--rust); color:var(--rust); }
.btn-outline{ display:inline-flex; align-items:center; gap:.4rem; border:1.5px solid var(--border); border-radius:2px; background:transparent; color:#7a6a52; padding:.68rem 1rem; font-family:'Source Serif 4',serif; font-size:.85rem; cursor:pointer; transition:all .2s; }
.btn-outline:hover{ border-color:var(--gold); color:var(--gold); }

/* Preview column */
.sticky-wrap  { position:sticky; top:80px; display:flex; flex-direction:column; gap:1rem; }
.preview-lbl  { font-size:.68rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:#9a8a72; display:flex; align-items:center; gap:.4rem; margin:0; }
.preview-lbl i{ color:var(--gold); }

.preview-card { background:#fff; border:1px solid var(--border); border-radius:3px; padding:1rem; }
.preview-card::before { content:''; display:block; height:3px; margin:-1rem -1rem .85rem; }
.preview-card.mcq::before        { background:var(--gold); }
.preview-card.truefalse::before  { background:var(--sage); }
.preview-card.fillblank::before  { background:var(--rust); }
.preview-card.match::before      { background:var(--navy); }

.pc-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:.5rem; }
.pc-badge  { display:inline-flex; align-items:center; gap:.3rem; font-size:.62rem; font-weight:700; text-transform:uppercase; padding:.18rem .5rem; border-radius:1px; color:#fff; }
.pc-badge.mcq        { background:var(--gold);  }
.pc-badge.truefalse  { background:var(--sage);  }
.pc-badge.fillblank  { background:var(--rust);  }
.pc-badge.match      { background:var(--navy);  }
.pc-lv { font-size:.6rem; font-weight:700; padding:.12rem .38rem; border-radius:1px; }
.pc-lv.lv-easy { background:#e8f5e9; color:#2e7d32; }
.pc-lv.lv-mid  { background:#fff3e0; color:#e65100; }
.pc-lv.lv-hard { background:#fce4ec; color:#b71c1c; }
.pc-topic { font-size:.62rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--gold); margin:0 0 .3rem; }
.pc-text  { font-family:'Playfair Display',serif; font-size:.88rem; font-weight:700; color:var(--ink); margin:0 0 .65rem; line-height:1.4; }

.pc-options { display:flex; flex-direction:column; gap:.3rem; }
.pc-opt     { display:flex; align-items:center; gap:.45rem; padding:.3rem .5rem; border-radius:2px; border:1px solid var(--border); font-size:.75rem; }
.pc-opt.correct { border-color:var(--sage); background:rgba(58,92,58,.07); }
.pc-opt-letter  { width:20px; height:20px; border-radius:50%; background:rgba(196,146,42,.12); color:var(--gold); display:flex; align-items:center; justify-content:center; font-size:.62rem; font-weight:700; flex-shrink:0; }
.pc-opt.correct .pc-opt-letter { background:var(--sage); color:#fff; }

.pc-tf { margin-top:.35rem; }
.pc-tf-badge { display:inline-block; font-size:.85rem; font-weight:700; padding:.35rem .85rem; border-radius:2px; }
.pc-tf-badge.true  { background:rgba(58,92,58,.1);  color:var(--sage); }
.pc-tf-badge.false { background:rgba(139,58,30,.1); color:var(--rust); }

.pc-fill { margin-top:.35rem; }
.pc-fill-ans { font-size:.78rem; font-weight:600; color:var(--rust); background:rgba(139,58,30,.08); padding:.3rem .65rem; border-radius:2px; display:inline-block; }

.pc-pairs { display:flex; flex-direction:column; gap:.3rem; margin-top:.35rem; }
.pc-pair  { display:flex; align-items:center; gap:.4rem; font-size:.75rem; color:var(--ink); }
.pc-pair i{ color:var(--gold); font-size:.65rem; flex-shrink:0; }
.pc-more  { font-size:.7rem; color:#9a8a72; font-style:italic; }

.pc-exp { display:flex; align-items:flex-start; gap:.35rem; font-size:.7rem; color:#7a6a52; font-style:italic; margin:.75rem 0 0; background:rgba(196,146,42,.06); border-left:2px solid var(--gold); padding:.45rem .65rem; border-radius:0 2px 2px 0; }
.pc-exp i { color:var(--gold); flex-shrink:0; margin-top:.1rem; }

/* LS info card */
.ls-info-card { background:var(--dark); border:1px solid rgba(196,146,42,.2); border-radius:3px; overflow:hidden; }
.li-head { display:flex; align-items:center; gap:.4rem; padding:.6rem .85rem; font-size:.68rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--gold-l); border-bottom:1px solid rgba(196,146,42,.15); }
.li-head i{ font-size:.72rem; }
.li-rows  { padding:.35rem 0; }
.li-row   { display:flex; justify-content:space-between; align-items:center; padding:.35rem .85rem; font-size:.72rem; color:rgba(255,255,255,.45); border-bottom:1px solid rgba(255,255,255,.06); }
.li-row:last-of-type { border-bottom:none; }
.li-row i { font-size:.65rem; margin-right:.2rem; }
.li-total { font-family:'Playfair Display',serif; font-size:1rem; font-weight:900; color:#fff; }
.li-chip  { font-size:.68rem; font-weight:700; padding:.1rem .42rem; border-radius:10px; }
.li-chip.mcq   { background:rgba(196,146,42,.2); color:var(--gold-l); }
.li-chip.tf    { background:rgba(58,92,58,.2);   color:#a5d6a7; }
.li-chip.fill  { background:rgba(139,58,30,.2);  color:#ef9a9a; }
.li-chip.match { background:rgba(42,58,92,.2);   color:#90caf9; }
.li-date  { font-size:.65rem; color:rgba(255,255,255,.3); font-family:monospace; }
.li-reload { display:flex; align-items:center; gap:.4rem; width:100%; padding:.55rem .85rem; background:none; border:none; border-top:1px solid rgba(196,146,42,.15); color:rgba(196,146,42,.7); font-family:'Source Serif 4',serif; font-size:.72rem; cursor:pointer; transition:color .2s; }
.li-reload:hover:not(:disabled) { color:var(--gold-l); }
.li-reload:disabled { opacity:.4; cursor:not-allowed; }
.spinning { animation:spin .8s linear infinite; }

/* Toast */
.toast { position:fixed; bottom:1.5rem; right:1.5rem; z-index:1000; display:flex; align-items:center; gap:.6rem; padding:.75rem 1.25rem; border-radius:2px; font-size:.85rem; font-weight:600; box-shadow:0 8px 32px rgba(0,0,0,.25); }
.toast.success { background:var(--sage); color:#fff; }
.toast.error   { background:var(--rust); color:#fff; }
.toast-slide-enter-active,.toast-slide-leave-active { transition:opacity .3s, transform .3s; }
.toast-slide-enter-from,.toast-slide-leave-to { opacity:0; transform:translateX(20px); }
</style>