<template>
  <section class="tasks-section">

    <!-- ══ HEADER ══════════════════════════════════════ -->
    <div class="ts-header">
      <div class="orn-row">
        <span class="orn-line"/><span class="orn-gem">◆</span><span class="orn-line"/>
      </div>
      <h2 class="ts-title">Тапсырмалар</h2>
      <p class="ts-sub">Тақырып бойынша топтастырылған білім тексеру тесттері</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="ts-state">
      <div class="ts-spinner"/>
      <p>Жүктелуде…</p>
    </div>

    <!-- Error -->
    <div v-else-if="loadError" class="ts-state error">
      <i class="pi pi-exclamation-triangle"/>
      <p>{{ loadError }}</p>
      <button class="ts-retry" @click="loadFromExcel">
        <i class="pi pi-refresh"/> Қайта жүктеу
      </button>
    </div>

    <!-- ══ QUIZ LIST ══════════════════════════════════════ -->
    <template v-else-if="!activeQuiz">

      <!-- Stats strip -->
      <div class="stats-strip">
        <div class="ss-item" v-for="s in typeStats" :key="s.label">
          <i :class="'pi '+s.icon" :style="{ color: s.color }"/>
          <div>
            <span class="ss-val">{{ s.val }}</span>
            <span class="ss-lbl">{{ s.label }}</span>
          </div>
        </div>
      </div>

      <!-- Level filter -->
      <div class="level-filter">
        <button
            v-for="tab in levelTabs" :key="tab.key"
            class="lf-btn"
            :class="{ active: activeLevel === tab.key, [`lf-${tab.key}`]: true }"
            @click="activeLevel = tab.key"
        >
          {{ tab.label }}
          <span class="lf-cnt">{{ tab.count }}</span>
        </button>
      </div>

      <!-- Quiz cards -->
      <div class="quiz-grid">
        <article
            v-for="quiz in filteredQuizzes" :key="quiz.id"
            class="quiz-card"
            :class="`qc-${quiz.level}`"
            @click="startQuiz(quiz)"
        >
          <!-- Top: level badge + question count -->
          <div class="qc-top">
            <span class="qc-lvl-badge" :class="`lvl-${quiz.level}`">
              {{ diffLabel(quiz.level) }}
            </span>
            <span class="qc-q-count">{{ quiz.questions.length }} сұрақ</span>
          </div>

          <!-- Title -->
          <h3 class="qc-title">{{ quiz.topic }}</h3>

          <!-- Type chips -->
          <div class="qc-types">
            <span
                v-for="t in quiz.typeCounts" :key="t.type"
                class="qc-chip" :class="`chip-${t.type}`"
            >
              <i :class="'pi '+typeIcon(t.type)"/>
              {{ t.count }}
            </span>
          </div>

          <!-- Meta row -->
          <div class="qc-meta">
            <span><i class="pi pi-clock"/> ~{{ quiz.time }} мин</span>
            <span v-if="quiz.lastScore !== null" class="qc-last-score">
              <i class="pi pi-chart-bar"/> {{ quiz.lastScore }}%
            </span>
          </div>

          <!-- Last score bar -->
          <div v-if="quiz.lastScore !== null" class="qc-bar">
            <div class="qc-bar-fill"
                 :style="{ width: quiz.lastScore+'%', background: scoreColor(quiz.lastScore) }"/>
          </div>

          <!-- CTA -->
          <button class="qc-start">
            Бастау <i class="pi pi-arrow-right"/>
          </button>
        </article>
      </div>

      <div v-if="!filteredQuizzes.length" class="ts-state">
        <i class="pi pi-search" style="font-size:2rem;color:#d9cdb8"/>
        <p>Тапсырма табылмады</p>
      </div>

    </template>

    <!-- ══ ACTIVE QUIZ ═══════════════════════════════════ -->
    <div v-else class="arena">

      <!-- Arena header -->
      <div class="arena-header">
        <button class="ah-back" @click="exitQuiz">
          <i class="pi pi-arrow-left"/> Артқа
        </button>
        <div class="ah-info">
          <span class="ah-topic">{{ activeQuiz.topic }}</span>
          <span class="ah-lvl" :class="`lvl-${activeQuiz.level}`">
            {{ diffLabel(activeQuiz.level) }}
          </span>
        </div>
        <div class="ah-timer" :class="{ warn: timeLeft < 60 }">
          <i class="pi pi-clock"/> {{ fmtTime(timeLeft) }}
        </div>
      </div>

      <!-- Progress -->
      <div class="arena-progress">
        <div class="ap-track">
          <div class="ap-fill"
               :style="{ width: (checkedSet.size / activeQuiz.questions.length * 100)+'%' }"/>
        </div>
        <div class="ap-dots">
          <button
              v-for="(q,i) in activeQuiz.questions" :key="i"
              class="ap-dot"
              :class="{
              'ap-current': i === qIdx,
              'ap-ok':  checkedSet.has(i) && isCorrect(i),
              'ap-bad': checkedSet.has(i) && !isCorrect(i),
            }"
              @click="goToQ(i)"
              :title="`${i+1}. ${typeLabel(q.type)}`"
          />
        </div>
        <span class="ap-count">{{ qIdx+1 }} / {{ activeQuiz.questions.length }}</span>
      </div>

      <!-- Question card -->
      <div class="q-card" v-if="currentQ">

        <div class="q-card-head">
          <span class="q-num">{{ qIdx+1 }}-сұрақ</span>
          <span class="q-type-tag" :class="`tag-${currentQ.type}`">
            <i :class="'pi '+typeIcon(currentQ.type)"/>
            {{ typeLabel(currentQ.type) }}
          </span>
          <span class="q-topic-tag">{{ currentQ.topic }}</span>
        </div>

        <div class="q-card-body">
          <p class="q-text">{{ currentQ.type === 'match' ? currentQ.matchTitle : currentQ.text }}</p>
        </div>

        <!-- MCQ -->
        <div v-if="currentQ.type === 'mcq'" class="mcq-list">
          <button
              v-for="(opt,oi) in currentQ.options" :key="oi"
              class="mcq-opt" :class="mcqCls(oi)"
              :disabled="checkedSet.has(qIdx)"
              @click="pickMCQ(oi)"
          >
            <span class="mcq-ltr">{{ String.fromCharCode(65+oi) }}</span>
            <span class="mcq-txt">{{ opt }}</span>
            <i v-if="checkedSet.has(qIdx) && oi===currentQ.answer"
               class="pi pi-check-circle mcq-ico ok"/>
            <i v-else-if="checkedSet.has(qIdx) && oi===answers[qIdx] && oi!==currentQ.answer"
               class="pi pi-times-circle mcq-ico fail"/>
          </button>
        </div>

        <!-- TF -->
        <div v-else-if="currentQ.type === 'truefalse'" class="tf-pair">
          <button class="tf-btn tf-true" :class="tfCls(true)"
                  :disabled="checkedSet.has(qIdx)" @click="pickTF(true)">
            <i class="pi pi-check"/>
            Дұрыс
          </button>
          <button class="tf-btn tf-false" :class="tfCls(false)"
                  :disabled="checkedSet.has(qIdx)" @click="pickTF(false)">
            <i class="pi pi-times"/>
            Бұрыс
          </button>
        </div>

        <!-- Fill blank -->
        <div v-else-if="currentQ.type === 'fillblank'" class="fill-area">
          <div class="fill-sentence">
            <template v-for="(part,pi) in currentQ.parts" :key="pi">
              <span v-if="part.type==='text'" class="fill-txt">{{ part.val }}</span>
              <span v-else class="fill-slot">
                <input
                    v-model="blanks[part.idx]"
                    class="fill-in" :class="fillCls(part.idx)"
                    :disabled="checkedSet.has(qIdx)"
                    :placeholder="`${part.idx+1}-орын`"
                    @keyup.enter="canCheck && checkCurrent()"
                />
                <span v-if="checkedSet.has(qIdx)" class="fill-hint">
                  ✓ {{ currentQ.correctBlanks[part.idx] }}
                </span>
              </span>
            </template>
          </div>
        </div>

        <!-- Match -->
        <div v-else-if="currentQ.type === 'match'" class="match-area">
          <p class="match-guide">
            <i class="pi pi-info-circle"/> Сол жақты таңдап, оң жақпен байланыстырыңыз
          </p>
          <div class="match-cols">
            <div class="match-col">
              <div
                  v-for="(p,i) in currentQ.pairs" :key="'l'+i"
                  class="match-item" :class="leftCls(i)"
                  @click="!checkedSet.has(qIdx) && pickLeft(i)"
              >
                <span class="ml-ltr">{{ String.fromCharCode(65+i) }}</span>
                {{ p.left }}
              </div>
            </div>
            <div class="match-col">
              <div
                  v-for="(p,i) in shuffledRight" :key="'r'+i"
                  class="match-item match-right" :class="rightCls(i)"
                  @click="!checkedSet.has(qIdx) && pickRight(i)"
              >
                {{ p.right }}
              </div>
            </div>
          </div>

          <div v-if="Object.keys(matchDone).length" class="match-links">
            <div
                v-for="(ri,li) in matchDone" :key="li"
                class="match-link"
                :class="checkedSet.has(qIdx) ? (matchOk(+li,ri)?'link-ok':'link-fail') : 'link-pend'"
            >
              <span>{{ currentQ.pairs[+li]?.left }}</span>
              <i class="pi pi-arrow-right link-arr"/>
              <span>{{ shuffledRight[ri]?.right }}</span>
              <i v-if="checkedSet.has(qIdx) && matchOk(+li,ri)"  class="pi pi-check  link-ic ok"/>
              <i v-else-if="checkedSet.has(qIdx)"                class="pi pi-times  link-ic fail"/>
              <button v-if="!checkedSet.has(qIdx)" class="link-del" @click.stop="delete matchDone[li]">
                <i class="pi pi-times"/>
              </button>
            </div>
          </div>
        </div>

        <!-- Explanation -->
        <transition name="exp-fade">
          <div v-if="checkedSet.has(qIdx) && currentQ.explanation" class="q-exp">
            <i class="pi pi-lightbulb"/>
            <p>{{ currentQ.explanation }}</p>
          </div>
        </transition>

      </div><!-- end q-card -->

      <!-- Nav -->
      <div class="arena-nav">
        <button class="nav-btn" :disabled="qIdx===0" @click="qIdx--">
          <i class="pi pi-chevron-left"/> Алдыңғы
        </button>
        <div class="nav-mid">
          <button v-if="!checkedSet.has(qIdx)" class="nav-check"
                  :disabled="!canCheck" @click="checkCurrent">
            <i class="pi pi-search"/> Тексеру
          </button>
          <div v-else class="nav-verdict">
            <i :class="isCorrect(qIdx) ? 'pi pi-check-circle verd-ok' : 'pi pi-times-circle verd-fail'"/>
            <span>{{ isCorrect(qIdx) ? 'Дұрыс!' : 'Қате' }}</span>
          </div>
        </div>
        <button v-if="qIdx < activeQuiz.questions.length-1"
                class="nav-btn nav-next" @click="qIdx++">
          Келесі <i class="pi pi-chevron-right"/>
        </button>
        <button v-else-if="!quizDone" class="nav-btn nav-finish" @click="finishQuiz">
          Аяқтау <i class="pi pi-flag"/>
        </button>
      </div>

      <!-- ── RESULT OVERLAY ── -->
      <transition name="res-pop">
        <div v-if="quizDone" class="res-overlay">
          <div class="res-panel">

            <div class="orn-row" style="margin-bottom:.75rem">
              <span class="orn-line"/><span class="orn-gem">◆</span><span class="orn-line"/>
            </div>

            <!-- Ring -->
            <div class="res-ring">
              <svg viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none"
                        stroke="rgba(196,146,42,.15)" stroke-width="10"/>
                <circle cx="60" cy="60" r="50" fill="none"
                        :stroke="scoreColor(finalScore)" stroke-width="10"
                        stroke-linecap="round" stroke-dasharray="314.2"
                        :stroke-dashoffset="314.2 - 314.2 * finalScore / 100"
                        transform="rotate(-90 60 60)"
                        style="transition:stroke-dashoffset 1.2s ease"/>
              </svg>
              <div class="res-ring-inner">
                <span class="res-pct">{{ finalScore }}%</span>
                <span class="res-grade" :style="{ color: scoreColor(finalScore) }">
                  {{ scoreGrade }}
                </span>
              </div>
            </div>

            <h3 class="res-title">{{ resultTitle }}</h3>
            <p class="res-topic">{{ activeQuiz.topic }}</p>

            <div class="res-nums">
              <div class="res-num">
                <span class="rn-v" style="color:var(--sage)">{{ correctCount }}</span>
                <span class="rn-l">Дұрыс</span>
              </div>
              <div class="res-num">
                <span class="rn-v" style="color:var(--rust)">
                  {{ activeQuiz.questions.length - correctCount }}
                </span>
                <span class="rn-l">Қате</span>
              </div>
              <div class="res-num">
                <span class="rn-v">{{ activeQuiz.questions.length }}</span>
                <span class="rn-l">Барлығы</span>
              </div>
              <div class="res-num">
                <span class="rn-v" style="color:var(--gold)">{{ fmtTime(elapsed) }}</span>
                <span class="rn-l">Уақыт</span>
              </div>
            </div>

            <!-- Type breakdown -->
            <div class="res-breakdown">
              <div v-for="tb in typeBreakdown" :key="tb.type" class="rb-row">
                <span class="rb-type" :class="`chip-${tb.type}`">
                  <i :class="'pi '+typeIcon(tb.type)"/>
                  {{ typeLabel(tb.type) }}
                </span>
                <div class="rb-bar-wrap">
                  <div class="rb-bar"
                       :style="{ width: tb.pct+'%', background: scoreColor(tb.pct) }"/>
                </div>
                <span class="rb-frac">{{ tb.correct }}/{{ tb.total }}</span>
              </div>
            </div>

            <div class="res-actions">
              <button class="res-btn-primary" @click="restartQuiz">
                <i class="pi pi-refresh"/> Қайталау
              </button>
              <button class="res-btn-secondary" @click="exitQuiz">
                <i class="pi pi-list"/> Тізімге
              </button>
            </div>

            <p class="res-saved-note">
              <i class="pi pi-check-circle"/> Нәтиже сақталды — мұғалім кабинетінде көрінеді
            </p>
          </div>
        </div>
      </transition>

    </div><!-- end arena -->

  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, reactive } from 'vue'
import * as XLSX from 'xlsx'
import { useResultsStore } from '@/composables/useResultsStore'
import { useAuth }         from '@/composables/useAuth'

const EXCEL_PATH  = '/src/assets/datas/Тапсырмалар_Мәліметтер_Базасы.xlsx'
const TYPE_ICONS  = { mcq:'pi-list-check', truefalse:'pi-check-square', fillblank:'pi-pencil', match:'pi-arrows-h' }
const TYPE_LABELS = { mcq:'MCQ', truefalse:'Дұрыс/Бұрыс', fillblank:'Бос орын', match:'Сәйкестендіру' }
const LEVEL_ORDER = ['Оңай','Орташа','Жоғары']

function typeIcon(t)  { return TYPE_ICONS[t]  || 'pi-question' }
function typeLabel(t) { return TYPE_LABELS[t] || t }
function diffLabel(d) {
  return { Оңай:'Оңай', Орташа:'Орташа', Жоғары:'Жоғары', Қиын:'Жоғары' }[d] || d
}

// ── Stores ────────────────────────────────────────────
const { currentUser }              = useAuth()
const { init: rsInit, saveResult } = useResultsStore()

// ── State ─────────────────────────────────────────────
const loading    = ref(true)
const loadError  = ref('')
const allGroups  = ref([])
const activeLevel= ref('all')
const activeQuiz = ref(null)
const qIdx       = ref(0)

const answers    = reactive({})
const blanks     = reactive({})
const matchDone  = reactive({})
const checkedSet = ref(new Set())
const savedBlanks= reactive({})
const savedMatch = reactive({})
const matchLeft  = ref(null)
const shuffledRight = ref([])
const quizDone   = ref(false)
const timeLeft   = ref(0)
const elapsed    = ref(0)
let timer = null

// ── Load ──────────────────────────────────────────────
onMounted(() => { rsInit(); loadFromExcel() })
onBeforeUnmount(() => clearInterval(timer))

async function loadFromExcel() {
  loading.value = true; loadError.value = ''; allGroups.value = []
  try {
    const res = await fetch(EXCEL_PATH)
    if (!res.ok) throw new Error(`Файл табылмады: ${EXCEL_PATH}`)
    const wb = XLSX.read(await res.arrayBuffer(), { type:'array', cellDates:true })
    const all = []

    // MCQ
    for (const sn of ['📝 Тест','📝 MCQ Тест']) {
      if (!wb.SheetNames.includes(sn)) continue
      XLSX.utils.sheet_to_json(wb.Sheets[sn], { range:5, header:1, defval:null })
          .filter(r => r[2])
          .forEach(r => {
            const opts = [r[3],r[4],r[5],r[6]].filter(v=>v!=null).map(String)
            if (opts.length < 2) return
            all.push({ type:'mcq', text:String(r[2]), options:opts,
              answer:Math.max(0,Number(r[7]||1)-1),
              topic:String(r[8]||'Жалпы'), level:normLevel(String(r[9]||'')),
              explanation:String(r[10]||'') })
          }); break
    }
    // TF
    for (const sn of ['✅ Дурыс-Бурыс','✅ Дұрыс-Бұрыс']) {
      if (!wb.SheetNames.includes(sn)) continue
      XLSX.utils.sheet_to_json(wb.Sheets[sn], { range:5, header:1, defval:null })
          .filter(r => r[2])
          .forEach(r => {
            const a = r[3]
            all.push({ type:'truefalse', text:String(r[2]),
              answer: a===true || String(a).toUpperCase()==='TRUE',
              topic:String(r[4]||'Жалпы'), level:normLevel(String(r[5]||'')),
              explanation:String(r[6]||'') })
          }); break
    }
    // Fill
    for (const sn of ['✍️ Бос орын','✍ Бос орын']) {
      if (!wb.SheetNames.includes(sn)) continue
      XLSX.utils.sheet_to_json(wb.Sheets[sn], { range:5, header:1, defval:null })
          .filter(r => r[2] && r[3])
          .forEach(r => {
            const raw = String(r[2])
            const correctBlanks = String(r[3]).split(',').map(s=>s.trim()).filter(Boolean)
            const segs = raw.split('___')
            const parts = []
            segs.forEach((s,i) => { if(s) parts.push({type:'text',val:s}); if(i<segs.length-1) parts.push({type:'blank',idx:i}) })
            all.push({ type:'fillblank', text:raw, parts, correctBlanks,
              topic:String(r[4]||'Жалпы'), level:normLevel(String(r[5]||'')),
              explanation:String(r[6]||'') })
          }); break
    }
    // Match
    if (wb.SheetNames.includes('🔗 Сәйкестендіру')) {
      const grps = {}
      XLSX.utils.sheet_to_json(wb.Sheets['🔗 Сәйкестендіру'], { range:5, header:1, defval:null })
          .filter(r => r[1] && r[3] && r[4])
          .forEach(r => {
            const g = String(r[1])
            if (!grps[g]) grps[g] = { matchTitle:String(r[2]||'Сәйкестендіру'), pairs:[],
              topic:String(r[5]||'Жалпы'), level:normLevel(String(r[6]||'')), explanation:String(r[7]||'') }
            grps[g].pairs.push({ left:String(r[3]), right:String(r[4]) })
          })
      Object.values(grps).filter(g=>g.pairs.length>=2).forEach(g => {
        all.push({ type:'match', text:g.matchTitle, matchTitle:g.matchTitle,
          pairs:g.pairs, topic:g.topic, level:g.level, explanation:g.explanation })
      })
    }

    if (!all.length) throw new Error('Тапсырма табылмады. Excel файлын тексеріңіз.')

    // Group by topic + level
    const map = {}
    all.forEach(q => {
      const k = `${q.topic}__${q.level}`
      if (!map[k]) map[k] = { topic:q.topic, level:q.level, questions:[] }
      map[k].questions.push(q)
    })

    allGroups.value = Object.values(map)
        .sort((a,b) => {
          const d = LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level)
          return d !== 0 ? d : a.topic.localeCompare(b.topic,'kk')
        })
        .map((g,i) => ({
          id: `q_${i}`,
          topic: g.topic,
          level: g.level,
          questions: g.questions,
          time: Math.max(3, Math.ceil(g.questions.length * 1.5)),
          lastScore: null,
          typeCounts: calcTypeCounts(g.questions),
        }))
  } catch(e) {
    loadError.value = e.message; console.error(e)
  } finally { loading.value = false }
}

function normLevel(raw) {
  if (!raw) return 'Оңай'
  if (raw.includes('Жоғары')||raw.includes('Қиын')||raw.toLowerCase().includes('hard')) return 'Жоғары'
  if (raw.includes('Орташа')||raw.toLowerCase().includes('med')) return 'Орташа'
  return 'Оңай'
}
function calcTypeCounts(qs) {
  const c = {}
  qs.forEach(q => { c[q.type]=(c[q.type]||0)+1 })
  return Object.entries(c).map(([type,count]) => ({ type, count }))
}

// ── Computed ──────────────────────────────────────────
const typeStats = computed(() => {
  const all = allGroups.value.flatMap(g => g.questions)
  return [
    { icon:'pi-list-check',   label:'MCQ',          val:all.filter(q=>q.type==='mcq').length,       color:'#c4922a' },
    { icon:'pi-check-square', label:'Дұрыс/Бұрыс',  val:all.filter(q=>q.type==='truefalse').length, color:'#3a5c3a' },
    { icon:'pi-pencil',       label:'Бос орын',      val:all.filter(q=>q.type==='fillblank').length, color:'#8b3a1e' },
    { icon:'pi-arrows-h',     label:'Сәйкестендіру', val:all.filter(q=>q.type==='match').length,     color:'#2a3a5c' },
  ]
})

const levelTabs = computed(() => {
  const c = { Оңай:0, Орташа:0, Жоғары:0 }
  allGroups.value.forEach(g => { if (c[g.level]!==undefined) c[g.level]++ })
  return [
    { key:'all',    label:'Барлығы',  count: allGroups.value.length },
    { key:'Оңай',   label:'Оңай',     count: c['Оңай']   },
    { key:'Орташа', label:'Орташа',   count: c['Орташа'] },
    { key:'Жоғары', label:'Жоғары',   count: c['Жоғары'] },
  ]
})

const filteredQuizzes = computed(() =>
    activeLevel.value === 'all'
        ? allGroups.value
        : allGroups.value.filter(g => g.level === activeLevel.value)
)

const currentQ = computed(() => activeQuiz.value?.questions[qIdx.value] || null)

const canCheck = computed(() => {
  const q = currentQ.value
  if (!q || checkedSet.value.has(qIdx.value)) return false
  if (q.type==='mcq'||q.type==='truefalse') return answers[qIdx.value] !== undefined
  if (q.type==='fillblank') return q.parts.filter(p=>p.type==='blank').every(p=>(blanks[p.idx]||'').trim())
  if (q.type==='match') return Object.keys(matchDone).length === q.pairs.length
  return false
})

const correctCount = computed(() =>
    activeQuiz.value ? activeQuiz.value.questions.filter((_,i)=>isCorrect(i)).length : 0
)
const finalScore = computed(() =>
    activeQuiz.value ? Math.round(correctCount.value/activeQuiz.value.questions.length*100) : 0
)
const scoreGrade  = computed(() => {
  const p = finalScore.value
  return p>=90?'Өте жақсы':p>=75?'Жақсы':p>=50?'Қанағат.':'Қайталаңыз'
})
const resultTitle = computed(() => {
  const p = finalScore.value
  return p>=80?'Керемет нәтиже! 🎉':p>=50?'Жаман емес! 👍':'Қайталап көріңіз 📚'
})
const typeBreakdown = computed(() => {
  if (!activeQuiz.value) return []
  return [...new Set(activeQuiz.value.questions.map(q=>q.type))].map(type => {
    const qs = activeQuiz.value.questions.map((q,i)=>({q,i})).filter(({q})=>q.type===type)
    const correct = qs.filter(({i})=>isCorrect(i)).length
    const total = qs.length
    return { type, correct, total, pct:total?Math.round(correct/total*100):0 }
  })
})

// ── isCorrect ─────────────────────────────────────────
function isCorrect(i) {
  const q = activeQuiz.value?.questions[i]
  if (!q || !checkedSet.value.has(i)) return false
  if (q.type==='mcq'||q.type==='truefalse') return answers[i]===q.answer
  if (q.type==='fillblank') {
    const s = savedBlanks[i]||{}
    return q.correctBlanks.every((a,j)=>(s[j]||'').trim().toLowerCase()===(a||'').toLowerCase())
  }
  if (q.type==='match') {
    const s = savedMatch[i]||{}
    return q.pairs.every((_,li)=>matchOk(li,s[li]))
  }
  return false
}

// ── Actions ───────────────────────────────────────────
function pickMCQ(oi) { if (!checkedSet.value.has(qIdx.value)) answers[qIdx.value]=oi }
function pickTF(val) { if (!checkedSet.value.has(qIdx.value)) answers[qIdx.value]=val }
function pickLeft(i) { matchLeft.value = i }
function pickRight(i) {
  if (matchLeft.value===null) return
  Object.keys(matchDone).forEach(k=>{ if(matchDone[k]===i) delete matchDone[k] })
  matchDone[matchLeft.value]=i; matchLeft.value=null
}
function matchOk(li,ri) { return shuffledRight.value[ri]?.origIdx===li }

function checkCurrent() {
  if (!canCheck.value) return
  const q=currentQ.value; const i=qIdx.value
  if (q.type==='fillblank') {
    const s={}
    q.parts.filter(p=>p.type==='blank').forEach((p,j)=>{ s[j]=blanks[p.idx]||'' })
    savedBlanks[i]=s; answers[i]='done'
  }
  if (q.type==='match') { savedMatch[i]={...matchDone}; answers[i]='done' }
  checkedSet.value = new Set([...checkedSet.value, i])
}

function goToQ(i) {
  if (currentQ.value?.type==='fillblank' && !checkedSet.value.has(qIdx.value)) {
    const s={}
    currentQ.value.parts.filter(p=>p.type==='blank').forEach((p,j)=>{ s[j]=blanks[p.idx]||'' })
    savedBlanks[qIdx.value]=s
  }
  qIdx.value=i
}

watch(qIdx, newIdx => {
  const q=activeQuiz.value?.questions[newIdx]; if(!q) return
  Object.keys(blanks).forEach(k=>delete blanks[k])
  if (q.type==='fillblank' && savedBlanks[newIdx]) {
    q.parts.filter(p=>p.type==='blank').forEach((p,j)=>{ blanks[p.idx]=savedBlanks[newIdx][j]||'' })
  }
  Object.keys(matchDone).forEach(k=>delete matchDone[k])
  if (q.type==='match') {
    if (savedMatch[newIdx]) Object.entries(savedMatch[newIdx]).forEach(([k,v])=>{ matchDone[k]=v })
    matchLeft.value=null
    shuffledRight.value=checkedSet.value.has(newIdx)
        ? q.pairs.map((p,i)=>({...p,origIdx:i}))
        : shuffle(q.pairs.map((p,i)=>({...p,origIdx:i})))
  }
})

function startQuiz(quiz) {
  activeQuiz.value=quiz; qIdx.value=0
  ;[answers,blanks,matchDone,savedBlanks,savedMatch].forEach(o=>Object.keys(o).forEach(k=>delete o[k]))
  checkedSet.value=new Set(); matchLeft.value=null; quizDone.value=false
  elapsed.value=0; timeLeft.value=quiz.time*60
  const q=quiz.questions[0]
  if (q?.type==='match') shuffledRight.value=shuffle(q.pairs.map((p,i)=>({...p,origIdx:i})))
  startTimer()
}
function exitQuiz()    { clearInterval(timer); activeQuiz.value=null; quizDone.value=false }
function restartQuiz() { const q=activeQuiz.value; exitQuiz(); setTimeout(()=>startQuiz(q),50) }
function finishQuiz() {
  clearInterval(timer)
  elapsed.value = activeQuiz.value.time * 60 - timeLeft.value

  // Соңғы балды картаға жазу
  const found = allGroups.value.find(g => g.id === activeQuiz.value.id)
  if (found) found.lastScore = finalScore.value

  // ── localStorage-ке сақтау ─────────────────────────
  saveResult({
    studentId:   currentUser.value?.id    || 'guest',
    studentName: currentUser.value?.name  || 'Оқушы',
    class:       currentUser.value?.class || '',
    taskId:      activeQuiz.value.id,
    taskType:    'quiz',
    taskTitle:   activeQuiz.value.topic,
    topic:       activeQuiz.value.topic,
    correct:     correctCount.value,
    total:       activeQuiz.value.questions.length,
    pct:         finalScore.value,
  })

  quizDone.value = true
}
function startTimer() {
  clearInterval(timer)
  timer=setInterval(()=>{ if(timeLeft.value>0) timeLeft.value--; else finishQuiz() },1000)
}

function mcqCls(oi) {
  const ch=checkedSet.value.has(qIdx.value)
  if (!ch) return answers[qIdx.value]===oi?'mcq-sel':''
  if (oi===currentQ.value.answer) return 'mcq-ok'
  if (oi===answers[qIdx.value])   return 'mcq-bad'
  return 'mcq-dim'
}
function tfCls(val) {
  const ch=checkedSet.value.has(qIdx.value)
  if (!ch) return answers[qIdx.value]===val?'tf-sel':''
  if (val===currentQ.value.answer) return 'tf-ok'
  if (val===answers[qIdx.value])   return 'tf-bad'
  return ''
}
function fillCls(idx) {
  if (!checkedSet.value.has(qIdx.value)) return ''
  const q=currentQ.value
  const bi=q.parts.filter(p=>p.type==='blank').findIndex(p=>p.idx===idx)
  const ok=(blanks[idx]||'').trim().toLowerCase()===(q.correctBlanks[bi]||'').toLowerCase()
  return ok?'fill-ok':'fill-bad'
}
function leftCls(i) {
  if (matchDone[i]!==undefined) return 'mi-matched'
  if (matchLeft.value===i)      return 'mi-selected'
  return ''
}
function rightCls(i) { return Object.values(matchDone).includes(i)?'mi-used':'' }

function scoreColor(p) {
  const n=Number(p||0)
  return n>=80?'#3a5c3a':n>=50?'#c4922a':'#8b3a1e'
}
function fmtTime(s) { return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}` }
function shuffle(arr) {
  const a=[...arr]
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]] }
  return a
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,300&display=swap');

/* ── TOKENS ── */
.tasks-section {
  --ink:    #1a1208;
  --parch:  #faf6ef;
  --gold:   #c4922a;
  --gold-l: #e8b94f;
  --rust:   #8b3a1e;
  --sage:   #3a5c3a;
  --navy:   #2a3a5c;
  --border: #d9cdb8;
  --dark:   #130e07;
  --shd:    0 4px 24px rgba(26,18,8,.10);
  --shd-lg: 0 14px 48px rgba(26,18,8,.18);

  background: var(--parch);
  padding: 3.5rem 1.5rem;
  max-width: 1280px;
  margin: 0 auto;
  font-family: 'Source Serif 4', Georgia, serif;
  color: var(--ink);
}

/* ── Header ── */
.ts-header { text-align: center; margin-bottom: 2.5rem; }
.orn-row   { display:flex; align-items:center; justify-content:center; gap:.75rem; margin-bottom:1rem; }
.orn-line  { display:block; height:1px; width:80px; background:linear-gradient(90deg,transparent,var(--gold)); }
.orn-line:last-child { background:linear-gradient(90deg,var(--gold),transparent); }
.orn-gem   { color:var(--gold); font-size:.7rem; }
.ts-title  { font-family:'Playfair Display',serif; font-size:clamp(2rem,4vw,2.75rem); font-weight:900; color:var(--ink); margin:0 0 .5rem; }
.ts-sub    { color:#7a6a52; font-size:.95rem; font-style:italic; margin:0; }

/* ── States ── */
.ts-state  { display:flex; flex-direction:column; align-items:center; gap:1rem; padding:5rem 2rem; color:#9a8a72; text-align:center; }
.ts-state.error i { font-size:2rem; color:var(--gold); }
.ts-spinner{ width:44px; height:44px; border:3px solid rgba(196,146,42,.18); border-top-color:var(--gold); border-radius:50%; animation:spin .75s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
.ts-retry  { display:inline-flex; align-items:center; gap:.4rem; background:var(--gold); color:#fff; border:none; padding:.55rem 1.35rem; border-radius:2px; font-family:'Source Serif 4',serif; font-size:.875rem; font-weight:600; cursor:pointer; transition:background .2s; }
.ts-retry:hover { background:var(--gold-l); }

/* ── Stats strip ── */
.stats-strip { display:flex; flex-wrap:wrap; gap:.85rem; justify-content:center; margin-bottom:2rem; }
.ss-item { display:flex; align-items:center; gap:.6rem; background:#fff; border:1px solid var(--border); border-radius:2px; padding:.55rem .95rem; }
.ss-item i { font-size:1.1rem; }
.ss-val { display:block; font-family:'Playfair Display',serif; font-size:1rem; font-weight:700; color:var(--ink); }
.ss-lbl { display:block; font-size:.68rem; color:#9a8a72; }

/* ── Level filter ── */
.level-filter { display:flex; flex-wrap:wrap; gap:.45rem; margin-bottom:1.75rem; }
.lf-btn {
  display:inline-flex; align-items:center; gap:.45rem;
  padding:.42rem .95rem; border:1.5px solid var(--border); border-radius:2px;
  background:transparent; color:#7a6a52;
  font-family:'Source Serif 4',serif; font-size:.82rem; font-weight:600;
  cursor:pointer; transition:all .2s;
}
.lf-btn:hover { border-color:var(--gold); color:var(--gold); }
.lf-btn.active { color:#fff !important; border-color:transparent !important; }
.lf-btn.lf-all.active    { background:var(--ink); }
.lf-btn.lf-Оңай.active   { background:#2e7d32; }
.lf-btn.lf-Орташа.active { background:var(--gold); }
.lf-btn.lf-Жоғары.active { background:var(--rust); }
.lf-cnt { font-size:.65rem; background:rgba(196,146,42,.12); color:var(--gold); padding:.04rem .35rem; border-radius:8px; }
.lf-btn.active .lf-cnt { background:rgba(255,255,255,.22); color:#fff; }

/* ── Quiz grid ── */
.quiz-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 1.25rem;
}

.quiz-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 3px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: .7rem;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: transform .28s, box-shadow .28s;
}
.quiz-card::after {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 4px;
}
.quiz-card.qc-Оңай::after   { background: #2e7d32; }
.quiz-card.qc-Орташа::after { background: var(--gold); }
.quiz-card.qc-Жоғары::after { background: var(--rust); }
.quiz-card:hover { transform:translateY(-4px); box-shadow:var(--shd-lg); }

/* Card top row */
.qc-top { display:flex; align-items:center; justify-content:space-between; }
.qc-lvl-badge { font-size:.62rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em; padding:.2rem .55rem; border-radius:1px; }
.lvl-Оңай   { background:#e8f5e9; color:#2e7d32; }
.lvl-Орташа { background:#fff3e0; color:#e65100; }
.lvl-Жоғары { background:#fce4ec; color:#b71c1c; }
.qc-q-count { font-size:.72rem; color:#9a8a72; }

/* Card title */
.qc-title {
  font-family: 'Playfair Display', serif;
  font-size: 1rem;
  font-weight: 900;
  color: var(--ink);
  margin: 0;
  line-height: 1.35;
}

/* Type chips */
.qc-types { display:flex; flex-wrap:wrap; gap:.3rem; }
.qc-chip {
  display:inline-flex; align-items:center; gap:.25rem;
  font-size:.65rem; font-weight:700;
  padding:.18rem .5rem; border-radius:10px;
}
.chip-mcq        { background:rgba(196,146,42,.12); color:var(--gold); }
.chip-truefalse  { background:rgba(58,92,58,.1);    color:var(--sage); }
.chip-fillblank  { background:rgba(139,58,30,.1);   color:var(--rust); }
.chip-match      { background:rgba(42,58,92,.1);    color:var(--navy); }

/* Meta row */
.qc-meta { display:flex; align-items:center; justify-content:space-between; font-size:.72rem; color:#9a8a72; }
.qc-meta i { color:var(--gold); margin-right:.2rem; font-size:.68rem; }
.qc-last-score { font-weight:700; color:var(--gold); }

/* Score bar */
.qc-bar { height:4px; background:var(--border); border-radius:2px; overflow:hidden; }
.qc-bar-fill { height:100%; border-radius:2px; transition:width .4s; }

/* CTA */
.qc-start {
  display: inline-flex; align-items:center; gap:.4rem; align-self:flex-start;
  background: var(--gold); color: #fff; border: none;
  padding: .48rem 1.05rem; border-radius: 2px;
  font-family: 'Source Serif 4', serif; font-size: .82rem; font-weight: 700;
  cursor: pointer; transition: background .2s;
  margin-top: auto;
}
.qc-start:hover { background:var(--gold-l); }

/* ══ ARENA ══════════════════════════════════════════ */
.arena { display:flex; flex-direction:column; gap:1.1rem; }

/* Arena header */
.arena-header {
  display:flex; align-items:center; gap:.85rem;
  background:var(--dark); border-radius:3px; padding:.85rem 1.25rem;
  border:1px solid rgba(196,146,42,.2); flex-wrap:wrap;
}
.ah-back {
  display:flex; align-items:center; gap:.4rem;
  background:none; border:1px solid rgba(255,255,255,.15); border-radius:2px;
  color:rgba(255,255,255,.55); font-family:'Source Serif 4',serif; font-size:.78rem;
  padding:.35rem .75rem; cursor:pointer; transition:all .2s; white-space:nowrap; flex-shrink:0;
}
.ah-back:hover { border-color:var(--gold); color:var(--gold-l); }
.ah-info { flex:1; display:flex; align-items:center; gap:.65rem; min-width:0; }
.ah-topic { font-family:'Playfair Display',serif; font-size:.95rem; font-weight:700; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ah-lvl { font-size:.62rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em; padding:.2rem .55rem; border-radius:1px; flex-shrink:0; }
.ah-timer {
  display:flex; align-items:center; gap:.4rem;
  font-size:.85rem; font-weight:700; color:var(--gold-l);
  background:rgba(196,146,42,.1); padding:.3rem .8rem; border-radius:2px;
  border:1px solid rgba(196,146,42,.25); font-family:monospace; flex-shrink:0;
}
.ah-timer.warn { color:#ef9a9a; background:rgba(239,154,154,.1); border-color:rgba(239,154,154,.3); animation:blink .8s ease infinite; }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:.6} }

/* Progress */
.arena-progress { display:flex; align-items:center; gap:.75rem; flex-wrap:wrap; }
.ap-track { height:5px; flex:1; min-width:80px; background:rgba(196,146,42,.2); border-radius:3px; overflow:hidden; }
.ap-fill  { height:100%; background:var(--gold); border-radius:3px; transition:width .4s; }
.ap-dots  { display:flex; flex-wrap:wrap; gap:.32rem; }
.ap-dot {
  width:22px; height:22px; border-radius:50%;
  background:rgba(196,146,42,.18); border:1.5px solid transparent;
  display:flex; align-items:center; justify-content:center;
  cursor:pointer; transition:all .2s; padding:0;
}
.ap-dot .dot-num { font-size:.6rem; font-weight:700; color:rgba(196,146,42,.7); line-height:1; }
.ap-dot:hover          { border-color:var(--gold); background:rgba(196,146,42,.28); }
.ap-dot.ap-current     { background:var(--gold); border-color:var(--gold); box-shadow:0 0 8px rgba(196,146,42,.5); }
.ap-dot.ap-current .dot-num { color:#fff; }
.ap-dot.ap-ok          { background:rgba(58,92,58,.2);  border-color:var(--sage); }
.ap-dot.ap-ok .dot-num { color:var(--sage); }
.ap-dot.ap-bad         { background:rgba(139,58,30,.2); border-color:var(--rust); }
.ap-dot.ap-bad .dot-num{ color:var(--rust); }
.ap-count { font-size:.72rem; color:#9a8a72; white-space:nowrap; }

/* Question card */
.q-card { background:#fff; border:1px solid var(--border); border-radius:3px; overflow:hidden; box-shadow:var(--shd); }

.q-card-head {
  display:flex; align-items:center; gap:.55rem; flex-wrap:wrap;
  padding:.65rem 1.5rem; background:var(--parch); border-bottom:1px solid var(--border);
}
.q-num { font-size:.65rem; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--gold); }
.q-type-tag { display:inline-flex; align-items:center; gap:.28rem; font-size:.62rem; font-weight:700; text-transform:uppercase; padding:.18rem .5rem; border-radius:1px; color:#fff; }
.tag-mcq       { background:var(--gold);  }
.tag-truefalse { background:var(--sage);  }
.tag-fillblank { background:var(--rust);  }
.tag-match     { background:var(--navy);  }
.q-topic-tag { font-size:.7rem; color:#9a8a72; font-style:italic; margin-left:auto; }

.q-card-body { padding:1.25rem 1.75rem .75rem; }
.q-text { font-family:'Playfair Display',serif; font-size:1.1rem; font-weight:700; color:var(--ink); margin:0; line-height:1.45; }

/* MCQ */
.mcq-list { display:flex; flex-direction:column; gap:.5rem; padding:1rem 1.75rem 1.5rem; }
.mcq-opt {
  display:flex; align-items:center; gap:.75rem; width:100%;
  padding:.68rem 1rem; border:1.5px solid var(--border); border-radius:2px;
  background:#fff; cursor:pointer; text-align:left;
  font-family:'Source Serif 4',serif; font-size:.9rem; color:var(--ink);
  transition:all .2s;
}
.mcq-opt:hover:not(:disabled) { border-color:var(--gold); background:#fdf8f0; }
.mcq-opt.mcq-sel { border-color:var(--gold); background:rgba(196,146,42,.07); }
.mcq-opt.mcq-ok  { border-color:var(--sage); background:rgba(58,92,58,.07); }
.mcq-opt.mcq-bad { border-color:var(--rust); background:rgba(139,58,30,.06); }
.mcq-opt.mcq-dim { opacity:.38; }
.mcq-opt:disabled:not(.mcq-ok):not(.mcq-bad):not(.mcq-dim) { opacity:.7; cursor:not-allowed; }
.mcq-ltr {
  width:26px; height:26px; border-radius:50%; flex-shrink:0;
  background:rgba(196,146,42,.12); color:var(--gold);
  display:flex; align-items:center; justify-content:center;
  font-size:.72rem; font-weight:700;
}
.mcq-opt.mcq-ok  .mcq-ltr { background:rgba(58,92,58,.18);  color:var(--sage); }
.mcq-opt.mcq-bad .mcq-ltr { background:rgba(139,58,30,.18); color:var(--rust); }
.mcq-txt { flex:1; }
.mcq-ico { margin-left:auto; font-size:.95rem; }
.mcq-ico.ok   { color:var(--sage); }
.mcq-ico.fail { color:var(--rust); }

/* TF */
.tf-pair { display:flex; gap:1rem; padding:1.25rem 1.75rem 1.5rem; flex-wrap:wrap; }
.tf-btn {
  flex:1; min-width:130px; padding:1.1rem; border-radius:3px;
  border:2px solid var(--border); background:#fff;
  display:flex; align-items:center; justify-content:center; gap:.55rem;
  font-family:'Playfair Display',serif; font-size:1rem; font-weight:700;
  cursor:pointer; transition:all .22s;
}
.tf-btn i { font-size:1.25rem; }
.tf-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:var(--shd); }
.tf-true  { color:var(--sage); }
.tf-false { color:var(--rust); }
.tf-btn.tf-sel { border-width:2.5px; }
.tf-true.tf-sel   { border-color:var(--sage); background:rgba(58,92,58,.07); }
.tf-false.tf-sel  { border-color:var(--rust); background:rgba(139,58,30,.07); }
.tf-btn.tf-ok  { border-color:var(--sage); background:rgba(58,92,58,.1); }
.tf-btn.tf-bad { border-color:var(--rust); background:rgba(139,58,30,.1); }
.tf-btn:disabled:not(.tf-ok):not(.tf-bad) { opacity:.65; cursor:not-allowed; }

/* Fill */
.fill-area { padding:1.25rem 1.75rem 1.5rem; }
.fill-sentence { font-size:1rem; line-height:2.8; display:flex; flex-wrap:wrap; align-items:baseline; gap:.1rem; }
.fill-txt  { font-family:'Playfair Display',serif; color:#3a2a15; }
.fill-slot { display:inline-flex; flex-direction:column; align-items:center; margin:0 .2rem; vertical-align:bottom; }
.fill-in {
  border:none; border-bottom:2.5px solid var(--gold);
  background:rgba(196,146,42,.06); padding:.2rem .45rem;
  width:110px; font-family:'Source Serif 4',serif; font-size:.95rem; color:var(--ink);
  outline:none; text-align:center; transition:all .2s;
}
.fill-in:focus { border-bottom-color:var(--gold-l); background:rgba(196,146,42,.1); }
.fill-in.fill-ok  { border-bottom-color:var(--sage); background:rgba(58,92,58,.08); color:var(--sage); }
.fill-in.fill-bad { border-bottom-color:var(--rust); background:rgba(139,58,30,.08); color:var(--rust); }
.fill-hint { font-size:.65rem; color:var(--sage); margin-top:.15rem; }

/* Match */
.match-area  { padding:1.25rem 1.75rem 1.5rem; display:flex; flex-direction:column; gap:.75rem; }
.match-guide { font-size:.78rem; color:#9a8a72; font-style:italic; margin:0; display:flex; align-items:center; gap:.35rem; }
.match-guide i { color:var(--gold); font-size:.72rem; }
.match-cols  { display:grid; grid-template-columns:1fr 1fr; gap:.85rem; }
.match-col   { display:flex; flex-direction:column; gap:.4rem; }
.match-item  {
  padding:.55rem .85rem; border:1.5px solid var(--border); border-radius:2px;
  background:var(--parch); font-size:.82rem; cursor:pointer;
  display:flex; align-items:center; gap:.5rem;
  transition:all .2s; user-select:none;
}
.match-item:hover     { border-color:var(--gold); }
.match-item.mi-selected{ border-color:var(--gold); background:rgba(196,146,42,.1); }
.match-item.mi-matched,
.match-item.mi-used   { border-color:var(--sage); background:rgba(58,92,58,.07); color:var(--sage); }
.ml-ltr { font-size:.68rem; font-weight:700; color:var(--gold); min-width:16px; }
.match-links { display:flex; flex-direction:column; gap:.38rem; }
.match-link  { display:flex; align-items:center; gap:.5rem; padding:.42rem .75rem; border-radius:2px; border:1px solid var(--border); font-size:.82rem; }
.match-link i { font-size:.72rem; color:#b0a090; }
.link-pend{ background:var(--parch); }
.link-ok  { background:rgba(58,92,58,.07);  border-color:var(--sage); }
.link-fail{ background:rgba(139,58,30,.07); border-color:var(--rust); }
.link-arr  { color:#b0a090 !important; }
.link-ic   { margin-left:auto !important; }
.link-ic.ok   { color:var(--sage) !important; }
.link-ic.fail { color:var(--rust) !important; }
.link-del { background:none; border:none; color:#b0a090; cursor:pointer; font-size:.72rem; padding:.2rem; margin-left:auto; transition:color .2s; }
.link-del:hover { color:var(--rust); }

/* Explanation */
.q-exp {
  display:flex; gap:.75rem; align-items:flex-start;
  margin:0 1.75rem 1.25rem;
  background:rgba(196,146,42,.07); border:1px solid rgba(196,146,42,.2);
  border-radius:2px; padding:.85rem 1rem;
}
.q-exp i { color:var(--gold); font-size:1rem; flex-shrink:0; margin-top:.1rem; }
.q-exp p { font-size:.82rem; color:var(--ink); line-height:1.65; margin:0; }
.exp-fade-enter-active,.exp-fade-leave-active { transition:opacity .3s, transform .3s; }
.exp-fade-enter-from,.exp-fade-leave-to { opacity:0; transform:translateY(-5px); }

/* Nav */
.arena-nav { display:flex; align-items:center; gap:.75rem; }
.nav-btn {
  display:inline-flex; align-items:center; gap:.45rem;
  background:#fff; border:1.5px solid var(--border); border-radius:2px;
  color:#7a6a52; font-family:'Source Serif 4',serif; font-size:.82rem;
  padding:.52rem 1.1rem; cursor:pointer; transition:all .2s;
}
.nav-btn:hover:not(:disabled) { border-color:var(--gold); color:var(--gold); }
.nav-btn:disabled { opacity:.3; cursor:not-allowed; }
.nav-next   { margin-left:auto; }
.nav-finish { margin-left:auto; background:var(--gold); border-color:var(--gold); color:#fff; font-weight:700; }
.nav-finish:hover { background:var(--gold-l); }
.nav-mid    { flex:1; display:flex; justify-content:center; align-items:center; }
.nav-check  {
  display:inline-flex; align-items:center; gap:.45rem;
  background:var(--dark); color:var(--gold-l);
  border:1.5px solid rgba(196,146,42,.3);
  font-family:'Source Serif 4',serif; font-size:.82rem; font-weight:700;
  padding:.52rem 1.4rem; border-radius:2px; cursor:pointer; transition:all .2s;
}
.nav-check:hover:not(:disabled) { background:var(--gold); color:#fff; border-color:var(--gold); }
.nav-check:disabled { opacity:.3; cursor:not-allowed; }
.nav-verdict { display:flex; align-items:center; gap:.5rem; font-size:.9rem; font-weight:700; }
.verd-ok   { color:var(--sage); font-size:1.1rem; }
.verd-fail { color:var(--rust); font-size:1.1rem; }

/* ── RESULT OVERLAY ── */
.res-overlay {
  position:fixed; inset:0; z-index:500;
  background:rgba(19,14,7,.75); backdrop-filter:blur(6px);
  display:flex; align-items:center; justify-content:center; padding:1rem;
}
.res-pop-enter-active,.res-pop-leave-active { transition:opacity .35s, transform .35s; }
.res-pop-enter-from,.res-pop-leave-to { opacity:0; transform:scale(.9); }

.res-panel {
  background:var(--parch); border:1px solid var(--border); border-top:4px solid var(--gold);
  border-radius:4px; padding:2.25rem; max-width:440px; width:100%;
  display:flex; flex-direction:column; align-items:center; gap:1.15rem;
  box-shadow:var(--shd-lg);
}

.res-ring { position:relative; width:130px; height:130px; flex-shrink:0; }
.res-ring svg { width:100%; height:100%; }
.res-ring-inner { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
.res-pct  { font-family:'Playfair Display',serif; font-size:2rem; font-weight:900; color:var(--ink); line-height:1; }
.res-grade{ font-size:.68rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; margin-top:.2rem; }

.res-title { font-family:'Playfair Display',serif; font-size:1.2rem; font-weight:700; color:var(--ink); margin:0; text-align:center; }
.res-topic { font-size:.8rem; color:#9a8a72; margin:0; font-style:italic; }

.res-nums  { display:flex; gap:1.5rem; flex-wrap:wrap; justify-content:center; }
.res-num   { display:flex; flex-direction:column; align-items:center; gap:.2rem; }
.rn-v      { font-family:'Playfair Display',serif; font-size:1.4rem; font-weight:900; color:var(--ink); }
.rn-l      { font-size:.65rem; color:#9a8a72; text-transform:uppercase; letter-spacing:.08em; }

/* Breakdown */
.res-breakdown { width:100%; display:flex; flex-direction:column; gap:.5rem; }
.rb-row { display:flex; align-items:center; gap:.65rem; }
.rb-type { display:inline-flex; align-items:center; gap:.3rem; font-size:.65rem; font-weight:700; text-transform:uppercase; padding:.18rem .5rem; border-radius:1px; color:#fff; min-width:108px; flex-shrink:0; }
.rb-type.chip-mcq       { background:var(--gold);  }
.rb-type.chip-truefalse { background:var(--sage);  }
.rb-type.chip-fillblank { background:var(--rust);  }
.rb-type.chip-match     { background:var(--navy);  }
.rb-bar-wrap { flex:1; height:6px; background:var(--border); border-radius:3px; overflow:hidden; }
.rb-bar { height:100%; border-radius:3px; transition:width .5s ease; }
.rb-frac { font-size:.72rem; font-weight:700; color:var(--ink); min-width:32px; text-align:right; }

.res-actions { display:flex; gap:.75rem; flex-wrap:wrap; justify-content:center; }
.res-btn-primary {
  display:inline-flex; align-items:center; gap:.45rem;
  background:var(--gold); color:#fff; border:none;
  padding:.65rem 1.4rem; border-radius:2px;
  font-family:'Source Serif 4',serif; font-size:.875rem; font-weight:700;
  cursor:pointer; transition:background .2s;
}
.res-btn-primary:hover { background:var(--gold-l); }
.res-btn-secondary {
  display:inline-flex; align-items:center; gap:.45rem;
  background:transparent; border:1.5px solid var(--border); color:var(--ink);
  padding:.65rem 1.4rem; border-radius:2px;
  font-family:'Source Serif 4',serif; font-size:.875rem;
  cursor:pointer; transition:all .2s;
}
.res-btn-secondary:hover { border-color:var(--gold); color:var(--gold); }

.res-saved-note {
  font-size: .72rem;
  color: var(--sage);
  display: flex; align-items: center; gap: .38rem;
  background: rgba(58,92,58,.07);
  border: 1px solid rgba(58,92,58,.2);
  padding: .45rem .85rem; border-radius: 2px;
  width: 100%; justify-content: center;
}
.res-saved-note i { font-size: .75rem; }
</style>