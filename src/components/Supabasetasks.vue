<template>
  <section class="tasks-section">

    <!-- ══ HEADER ══════════════════════════════════════ -->
    <div class="ts-header">
      <div class="orn-row">
        <span class="orn-line"/><span class="orn-gem">◆</span><span class="orn-line"/>
      </div>
      <h2 class="ts-title">Тапсырмалар <span class="sb-badge">Supabase</span></h2>
    </div>

    <!-- ══ LOADING ══════════════════════════════════════ -->
    <div v-if="loading" class="ts-state">
      <div class="ts-spinner"/>
      <p>Supabase-тен жүктелуде…</p>
    </div>

    <!-- ══ ERROR ════════════════════════════════════════ -->
    <div v-else-if="error" class="ts-state error">
      <i class="pi pi-exclamation-triangle"/>
      <p>{{ error }}</p>
      <button class="ts-retry" @click="init(true)">
        <i class="pi pi-refresh"/> Қайта жүктеу
      </button>
    </div>

    <!-- ══ QUIZ LIST ══════════════════════════════════════ -->
    <template v-else-if="!activeQuiz">

      <!-- Stats -->
      <div class="stats-strip">
        <div class="ss-item">
          <span class="ss-val">{{ stats.total }}</span>
          <span class="ss-lbl">Тест тобы</span>
        </div>
        <div class="ss-item">
          <span class="ss-val">{{ stats.totalQuestions }}</span>
          <span class="ss-lbl">Сұрақтар</span>
        </div>
        <div class="ss-item" v-for="(cnt, lv) in stats.byLevel" :key="lv">
          <span class="ss-val" :class="`lv-${lv}`">{{ cnt }}</span>
          <span class="ss-lbl">{{ lv }}</span>
        </div>
      </div>

      <!-- Level filter -->
      <div class="level-filter">
        <button
            v-for="tab in levelTabs" :key="tab.key"
            class="lf-btn" :class="[`lf-${tab.key}`, { active: activeLevel === tab.key }]"
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
            class="quiz-card" :class="`qc-${quiz.level}`"
            @click="startQuiz(quiz)"
        >
          <div class="qc-side" :class="`qc-side-${quiz.level}`"/>
          <div class="qc-top">
            <span class="qc-lvl" :class="`lvl-${quiz.level}`">{{ quiz.level }}</span>
            <span class="qc-cnt">{{ quiz.questions.length }} сұрақ</span>
          </div>
          <h3 class="qc-title">{{ quiz.topic }}</h3>
          <div class="qc-types">
            <span v-for="t in typeCounts(quiz)" :key="t.type"
                  class="qc-chip" :class="`chip-${t.type}`">
              <i :class="'pi '+typeIcon(t.type)"/> {{ t.count }}
            </span>
          </div>
          <div class="qc-meta">
            <span><i class="pi pi-clock"/> ~{{ quiz.time_min }} мин</span>
            <span v-if="quiz.lastScore !== null" class="qc-last"
                  :style="{ color: scoreColor(quiz.lastScore) }">
              {{ quiz.lastScore }}%
            </span>
          </div>
          <div v-if="quiz.lastScore !== null" class="qc-bar">
            <div class="qc-bar-fill"
                 :style="{ width: quiz.lastScore+'%', background: scoreColor(quiz.lastScore) }"/>
          </div>
          <button class="qc-start">Бастау <i class="pi pi-arrow-right"/></button>
        </article>
      </div>

      <div v-if="!filteredQuizzes.length" class="ts-state">
        <i class="pi pi-search" style="font-size:2rem;color:#d9cdb8"/>
        <p>Тапсырма жоқ</p>
      </div>

    </template>

    <!-- ══ ACTIVE QUIZ ═══════════════════════════════════ -->
    <div v-else class="arena">

      <!-- Header -->
      <div class="arena-hd">
        <button class="ah-back" @click="exitQuiz">
          <i class="pi pi-arrow-left"/> Артқа
        </button>
        <div class="ah-info">
          <span class="ah-topic">{{ activeQuiz.topic }}</span>
          <span class="ah-lv" :class="`lvl-${activeQuiz.level}`">{{ activeQuiz.level }}</span>
        </div>
        <div class="ah-timer" :class="{ warn: timeLeft < 60 }">
          <i class="pi pi-clock"/> {{ fmtTime(timeLeft) }}
        </div>
      </div>

      <!-- Progress -->
      <div class="arena-prog">
        <div class="ap-track">
          <div class="ap-fill"
               :style="{ width: (checkedSet.size / activeQuiz.questions.length * 100)+'%' }"/>
        </div>
        <div class="ap-dots">
          <button v-for="(q,i) in activeQuiz.questions" :key="i"
                  class="ap-dot"
                  :class="{
              'ap-cur':  i === qIdx,
              'ap-ok':   checkedSet.has(i) && isCorrect(i),
              'ap-bad':  checkedSet.has(i) && !isCorrect(i),
            }"
                  @click="goToQ(i)" :title="`${i+1}. ${typeLabel(q.type)}`"
          >
            <span class="dot-n">{{ i+1 }}</span>
          </button>
        </div>
        <span class="ap-cnt">{{ qIdx+1 }} / {{ activeQuiz.questions.length }}</span>
      </div>

      <!-- Question -->
      <div class="q-card" v-if="currentQ">
        <div class="q-card-hd">
          <span class="q-num">{{ qIdx+1 }}-сұрақ</span>
          <span class="q-tag" :class="`tag-${currentQ.type}`">
            <i :class="'pi '+typeIcon(currentQ.type)"/>
            {{ typeLabel(currentQ.type) }}
          </span>
        </div>
        <div class="q-card-body">
          <p class="q-text">{{ currentQ.type === 'match' ? currentQ.matchTitle : currentQ.text }}</p>
        </div>

        <!-- MCQ -->
        <div v-if="currentQ.type === 'mcq'" class="mcq-list">
          <button v-for="(opt,oi) in currentQ.options" :key="oi"
                  class="mcq-opt" :class="mcqCls(oi)"
                  :disabled="checkedSet.has(qIdx)" @click="pickMCQ(oi)">
            <span class="mcq-ltr">{{ String.fromCharCode(65+oi) }}</span>
            <span class="mcq-txt">{{ opt }}</span>
            <i v-if="checkedSet.has(qIdx) && oi===currentQ.answer"
               class="pi pi-check-circle mcq-ic ok"/>
            <i v-else-if="checkedSet.has(qIdx) && oi===answers[qIdx] && oi!==currentQ.answer"
               class="pi pi-times-circle mcq-ic fail"/>
          </button>
        </div>

        <!-- TF -->
        <div v-else-if="currentQ.type === 'truefalse'" class="tf-pair">
          <button class="tf-btn tf-true" :class="tfCls(true)"
                  :disabled="checkedSet.has(qIdx)" @click="pickTF(true)">
            <i class="pi pi-check"/> Дұрыс
          </button>
          <button class="tf-btn tf-false" :class="tfCls(false)"
                  :disabled="checkedSet.has(qIdx)" @click="pickTF(false)">
            <i class="pi pi-times"/> Бұрыс
          </button>
        </div>

        <!-- Fill -->
        <div v-else-if="currentQ.type === 'fillblank'" class="fill-area">
          <div class="fill-sent">
            <template v-for="(part,pi) in currentQ.parts" :key="pi">
              <span v-if="part.type==='text'" class="fill-txt">{{ part.val }}</span>
              <span v-else class="fill-slot">
                <input v-model="blanks[part.idx]" class="fill-in"
                       :class="fillCls(part.idx)" :disabled="checkedSet.has(qIdx)"
                       :placeholder="`${part.idx+1}-орын`"
                       @keyup.enter="canCheck && checkCurrent()"/>
                <span v-if="checkedSet.has(qIdx)" class="fill-ans">
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
              <div v-for="(p,i) in currentQ.pairs" :key="'l'+i"
                   class="match-item" :class="leftCls(i)"
                   @click="!checkedSet.has(qIdx) && pickLeft(i)">
                <span class="ml-ltr">{{ String.fromCharCode(65+i) }}</span>
                {{ p.left }}
              </div>
            </div>
            <div class="match-col">
              <div v-for="(p,i) in shuffled" :key="'r'+i"
                   class="match-item match-right" :class="rightCls(i)"
                   @click="!checkedSet.has(qIdx) && pickRight(i)">
                {{ p.right }}
              </div>
            </div>
          </div>
          <div v-if="Object.keys(matchDone).length" class="match-links">
            <div v-for="(ri,li) in matchDone" :key="li"
                 class="match-link"
                 :class="checkedSet.has(qIdx) ? (matchOk(+li,ri)?'lk-ok':'lk-fail') : 'lk-pend'">
              <span>{{ currentQ.pairs[+li]?.left }}</span>
              <i class="pi pi-arrow-right lk-arr"/>
              <span>{{ shuffled[ri]?.right }}</span>
              <i v-if="checkedSet.has(qIdx) && matchOk(+li,ri)"  class="pi pi-check  lk-ic ok"/>
              <i v-else-if="checkedSet.has(qIdx)"                class="pi pi-times  lk-ic fail"/>
              <button v-if="!checkedSet.has(qIdx)" class="lk-del"
                      @click.stop="delete matchDone[li]">
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
      </div>

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
            <i :class="isCorrect(qIdx) ? 'pi pi-check-circle vd-ok' : 'pi pi-times-circle vd-fail'"/>
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

      <!-- ══ RESULT OVERLAY ════════════════════════════════ -->
      <transition name="res-pop">
        <div v-if="quizDone" class="res-overlay">
          <div class="res-panel">
            <div class="orn-row" style="margin-bottom:.75rem">
              <span class="orn-line"/><span class="orn-gem">◆</span><span class="orn-line"/>
            </div>

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
              <div class="res-ring-in">
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
            </div>

            <!-- Supabase saved indicator -->
            <div class="res-saved" :class="saving ? 'saving' : savedOk ? 'ok' : 'fail'">
              <i :class="saving ? 'pi pi-spin pi-spinner' : savedOk ? 'pi pi-check-circle' : 'pi pi-exclamation-circle'"/>
              <span>
                {{ saving ? 'Supabase-ке сақтауда…' : savedOk ? 'Нәтиже Supabase-ке сақталды — барлық құрылғыда көрінеді' : 'Сақтау қатесі — интернет байланысын тексеріңіз' }}
              </span>
            </div>

            <div class="res-actions">
              <button class="res-btn-primary" @click="restartQuiz">
                <i class="pi pi-refresh"/> Қайталау
              </button>
              <button class="res-btn-secondary" @click="exitQuiz">
                <i class="pi pi-list"/> Тізімге
              </button>
            </div>
          </div>
        </div>
      </transition>

    </div><!-- end arena -->

  </section>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useQuizStore } from '@/composables/useQuizStore'
import { useAuth }      from '@/composables/useAuth'

const { quizzes, loading, error, stats, init, saveResult, calcGrade } = useQuizStore()
const { currentUser } = useAuth()

const LEVEL_ORDER = ['Оңай', 'Орташа', 'Жоғары']

// ── State ─────────────────────────────────────────────
const activeLevel = ref('all')
const activeQuiz  = ref(null)
const qIdx        = ref(0)

const answers     = reactive({})
const blanks      = reactive({})
const matchDone   = reactive({})
const checkedSet  = ref(new Set())
const savedBlanks = reactive({})
const savedMatch  = reactive({})
const leftPick    = ref(null)
const shuffled    = ref([])

const quizDone    = ref(false)
const timeLeft    = ref(0)
const elapsed     = ref(0)
const saving      = ref(false)
const savedOk     = ref(false)
let timer = null

// ── Init ──────────────────────────────────────────────
onMounted(() => init())
onBeforeUnmount(() => clearInterval(timer))

// ── Computed ──────────────────────────────────────────
const levelTabs = computed(() => {
  const c = { Оңай: 0, Орташа: 0, Жоғары: 0 }
  quizzes.value.forEach(q => { if (c[q.level] !== undefined) c[q.level]++ })
  return [
    { key: 'all',    label: 'Барлығы', count: quizzes.value.length },
    { key: 'Оңай',   label: 'Оңай',    count: c['Оңай']   },
    { key: 'Орташа', label: 'Орташа',  count: c['Орташа'] },
    { key: 'Жоғары', label: 'Жоғары',  count: c['Жоғары'] },
  ]
})

const filteredQuizzes = computed(() =>
    activeLevel.value === 'all'
        ? quizzes.value
        : quizzes.value.filter(q => q.level === activeLevel.value)
)

const currentQ = computed(() => activeQuiz.value?.questions[qIdx.value] || null)

const canCheck = computed(() => {
  const q = currentQ.value
  if (!q || checkedSet.value.has(qIdx.value)) return false
  if (q.type === 'mcq' || q.type === 'truefalse') return answers[qIdx.value] !== undefined
  if (q.type === 'fillblank') return q.parts.filter(p => p.type === 'blank').every(p => (blanks[p.idx] || '').trim())
  if (q.type === 'match') return Object.keys(matchDone).length === q.pairs.length
  return false
})

const correctCount = computed(() =>
    activeQuiz.value ? activeQuiz.value.questions.filter((_, i) => isCorrect(i)).length : 0
)
const finalScore = computed(() =>
    activeQuiz.value ? Math.round(correctCount.value / activeQuiz.value.questions.length * 100) : 0
)
const scoreGrade  = computed(() => calcGrade(finalScore.value))
const resultTitle = computed(() => {
  const p = finalScore.value
  return p >= 80 ? 'Керемет нәтиже! 🎉' : p >= 50 ? 'Жаман емес! 👍' : 'Қайталап көріңіз 📚'
})

// ── Helpers ───────────────────────────────────────────
function typeIcon(t)  { return { mcq:'pi-list-check', truefalse:'pi-check-square', fillblank:'pi-pencil', match:'pi-arrows-h' }[t] || 'pi-question' }
function typeLabel(t) { return { mcq:'MCQ', truefalse:'Д/Б', fillblank:'Бос орын', match:'Сәйкест.' }[t] || t }
function scoreColor(p){ const n = Number(p||0); return n>=80?'#3a5c3a':n>=50?'#c4922a':'#8b3a1e' }
function fmtTime(s)   { return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}` }
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]
  }
  return a
}
function typeCounts(quiz) {
  const c = {}
  quiz.questions.forEach(q => { c[q.type] = (c[q.type]||0)+1 })
  return Object.entries(c).map(([type,count]) => ({ type, count }))
}

// ── isCorrect ─────────────────────────────────────────
function isCorrect(i) {
  const q = activeQuiz.value?.questions[i]
  if (!q || !checkedSet.value.has(i)) return false
  if (q.type === 'mcq' || q.type === 'truefalse') return answers[i] === q.answer
  if (q.type === 'fillblank') {
    const s = savedBlanks[i] || {}
    return q.correctBlanks.every((a,j) => (s[j]||'').trim().toLowerCase() === (a||'').toLowerCase())
  }
  if (q.type === 'match') {
    const s = savedMatch[i] || {}
    return q.pairs.every((_,li) => matchOk(li, s[li]))
  }
  return false
}

// ── Actions ───────────────────────────────────────────
function pickMCQ(oi) { if (!checkedSet.value.has(qIdx.value)) answers[qIdx.value] = oi }
function pickTF(val) { if (!checkedSet.value.has(qIdx.value)) answers[qIdx.value] = val }
function pickLeft(i) { leftPick.value = i }
function pickRight(i) {
  if (leftPick.value === null) return
  Object.keys(matchDone).forEach(k => { if (matchDone[k] === i) delete matchDone[k] })
  matchDone[leftPick.value] = i; leftPick.value = null
}
function matchOk(li, ri) { return shuffled.value[ri]?.origIdx === li }

function checkCurrent() {
  if (!canCheck.value) return
  const q = currentQ.value; const i = qIdx.value
  if (q.type === 'fillblank') {
    const s = {}
    q.parts.filter(p => p.type === 'blank').forEach((p, j) => { s[j] = blanks[p.idx]||'' })
    savedBlanks[i] = s; answers[i] = 'done'
  }
  if (q.type === 'match') { savedMatch[i] = {...matchDone}; answers[i] = 'done' }
  checkedSet.value = new Set([...checkedSet.value, i])
}

function goToQ(i) {
  if (currentQ.value?.type === 'fillblank' && !checkedSet.value.has(qIdx.value)) {
    const s = {}
    currentQ.value.parts.filter(p=>p.type==='blank').forEach((p,j) => { s[j]=blanks[p.idx]||'' })
    savedBlanks[qIdx.value] = s
  }
  qIdx.value = i
}

watch(qIdx, newIdx => {
  const q = activeQuiz.value?.questions[newIdx]; if (!q) return
  Object.keys(blanks).forEach(k => delete blanks[k])
  if (q.type === 'fillblank' && savedBlanks[newIdx]) {
    q.parts.filter(p=>p.type==='blank').forEach((p,j) => { blanks[p.idx]=savedBlanks[newIdx][j]||'' })
  }
  Object.keys(matchDone).forEach(k => delete matchDone[k])
  if (q.type === 'match') {
    if (savedMatch[newIdx]) Object.entries(savedMatch[newIdx]).forEach(([k,v]) => { matchDone[k]=v })
    leftPick.value = null
    shuffled.value = checkedSet.value.has(newIdx)
        ? q.pairs.map((p,i) => ({...p, origIdx:i}))
        : shuffle(q.pairs.map((p,i) => ({...p, origIdx:i})))
  }
})

function startQuiz(quiz) {
  activeQuiz.value = quiz; qIdx.value = 0
  ;[answers, blanks, matchDone, savedBlanks, savedMatch].forEach(o => Object.keys(o).forEach(k => delete o[k]))
  checkedSet.value = new Set(); leftPick.value = null; quizDone.value = false
  savedOk.value = false; elapsed.value = 0; timeLeft.value = quiz.time_min * 60
  const q = quiz.questions[0]
  if (q?.type === 'match') shuffled.value = shuffle(q.pairs.map((p,i) => ({...p, origIdx:i})))
  clearInterval(timer)
  timer = setInterval(() => { if (timeLeft.value > 0) timeLeft.value--; else finishQuiz() }, 1000)
}

function exitQuiz()    { clearInterval(timer); activeQuiz.value = null; quizDone.value = false }
function restartQuiz() { const q = activeQuiz.value; exitQuiz(); setTimeout(() => startQuiz(q), 50) }

async function finishQuiz() {
  clearInterval(timer)
  elapsed.value = activeQuiz.value.time_min * 60 - timeLeft.value

  // lastScore UI update
  const found = quizzes.value.find(q => q.id === activeQuiz.value.id)
  if (found) found.lastScore = finalScore.value

  quizDone.value = true
  saving.value   = true
  savedOk.value  = false

  // ── Supabase-ке сақтау ────────────────────────────
  const result = await saveResult({
    studentId:   currentUser.value?.id    || 'guest',
    studentName: currentUser.value?.name  || 'Оқушы',
    class:       currentUser.value?.class || '',
    quizId:      activeQuiz.value.id,
    quizTopic:   activeQuiz.value.topic,
    quizLevel:   activeQuiz.value.level,
    correct:     correctCount.value,
    total:       activeQuiz.value.questions.length,
    pct:         finalScore.value,
  })

  saving.value  = false
  savedOk.value = !!result
}

function mcqCls(oi) {
  const ch = checkedSet.value.has(qIdx.value)
  if (!ch) return answers[qIdx.value] === oi ? 'mcq-sel' : ''
  if (oi === currentQ.value.answer) return 'mcq-ok'
  if (oi === answers[qIdx.value])   return 'mcq-bad'
  return 'mcq-dim'
}
function tfCls(val) {
  const ch = checkedSet.value.has(qIdx.value)
  if (!ch) return answers[qIdx.value] === val ? 'tf-sel' : ''
  if (val === currentQ.value.answer) return 'tf-ok'
  if (val === answers[qIdx.value])   return 'tf-bad'
  return ''
}
function fillCls(idx) {
  if (!checkedSet.value.has(qIdx.value)) return ''
  const q  = currentQ.value
  const bi = q.parts.filter(p => p.type === 'blank').findIndex(p => p.idx === idx)
  const ok = (blanks[idx]||'').trim().toLowerCase() === (q.correctBlanks[bi]||'').toLowerCase()
  return ok ? 'fill-ok' : 'fill-bad'
}
function leftCls(i) {
  if (matchDone[i] !== undefined) return 'mi-match'
  if (leftPick.value === i)       return 'mi-sel'
  return ''
}
function rightCls(i) { return Object.values(matchDone).includes(i) ? 'mi-used' : '' }
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,300&display=swap');

.tasks-section {
  --ink:#1a1208; --parch:#faf6ef; --gold:#c4922a; --gold-l:#e8b94f;
  --rust:#8b3a1e; --sage:#3a5c3a; --navy:#2a3a5c; --border:#d9cdb8; --dark:#130e07;
  background:var(--parch); padding:3.5rem 1.5rem; max-width:1280px; margin:0 auto;
  font-family:'Source Serif 4',Georgia,serif; color:var(--ink);
}

/* Header */
.ts-header { text-align:center; margin-bottom:2.5rem; }
.orn-row   { display:flex; align-items:center; justify-content:center; gap:.75rem; margin-bottom:1rem; }
.orn-line  { display:block; height:1px; width:80px; background:linear-gradient(90deg,transparent,var(--gold)); }
.orn-line:last-child { background:linear-gradient(90deg,var(--gold),transparent); }
.orn-gem   { color:var(--gold); font-size:.7rem; }
.ts-title  { font-family:'Playfair Display',serif; font-size:clamp(2rem,4vw,2.75rem); font-weight:900; color:var(--ink); margin:0 0 .5rem; display:flex; align-items:center; justify-content:center; gap:.75rem; }
.sb-badge  { font-family:'Source Serif 4',serif; font-size:.55rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; background:linear-gradient(135deg,#3ecf8e,#1ea87c); color:#fff; padding:.25rem .65rem; border-radius:20px; vertical-align:middle; }
.ts-sub    { color:#7a6a52; font-size:.95rem; font-style:italic; margin:0; }

/* States */
.ts-state { display:flex; flex-direction:column; align-items:center; gap:1rem; padding:5rem 2rem; color:#9a8a72; text-align:center; }
.ts-state.error i { font-size:2rem; color:var(--gold); }
.ts-spinner { width:44px; height:44px; border:3px solid rgba(196,146,42,.18); border-top-color:var(--gold); border-radius:50%; animation:spin .75s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
.ts-retry { display:inline-flex; align-items:center; gap:.4rem; background:var(--gold); color:#fff; border:none; padding:.55rem 1.35rem; border-radius:2px; font-family:'Source Serif 4',serif; font-size:.875rem; font-weight:600; cursor:pointer; }

/* Stats strip */
.stats-strip { display:flex; flex-wrap:wrap; gap:.85rem; justify-content:center; margin-bottom:2rem; }
.ss-item { display:flex; flex-direction:column; align-items:center; background:#fff; border:1px solid var(--border); border-radius:2px; padding:.65rem 1.2rem; }
.ss-val  { font-family:'Playfair Display',serif; font-size:1.2rem; font-weight:900; color:var(--ink); }
.ss-lbl  { font-size:.65rem; color:#9a8a72; text-transform:uppercase; letter-spacing:.07em; }
.lv-Оңай   { color:#2e7d32; } .lv-Орташа { color:var(--gold); } .lv-Жоғары { color:var(--rust); }

/* Level filter */
.level-filter { display:flex; flex-wrap:wrap; gap:.45rem; margin-bottom:1.75rem; }
.lf-btn { display:inline-flex; align-items:center; gap:.4rem; padding:.42rem .95rem; border:1.5px solid var(--border); border-radius:2px; background:transparent; color:#7a6a52; font-family:'Source Serif 4',serif; font-size:.82rem; font-weight:600; cursor:pointer; transition:all .2s; }
.lf-btn:hover { border-color:var(--gold); color:var(--gold); }
.lf-btn.active { color:#fff; border-color:transparent; }
.lf-btn.lf-all.active    { background:var(--ink);  }
.lf-btn.lf-Оңай.active   { background:#2e7d32;    }
.lf-btn.lf-Орташа.active { background:var(--gold); }
.lf-btn.lf-Жоғары.active { background:var(--rust); }
.lf-cnt { font-size:.65rem; background:rgba(196,146,42,.12); color:var(--gold); padding:.04rem .35rem; border-radius:8px; }
.lf-btn.active .lf-cnt { background:rgba(255,255,255,.22); color:#fff; }

/* Quiz grid */
.quiz-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(230px,1fr)); gap:1.25rem; }
.quiz-card { background:#fff; border:1px solid var(--border); border-radius:3px; padding:1.25rem; display:flex; flex-direction:column; gap:.65rem; cursor:pointer; position:relative; overflow:hidden; transition:transform .28s, box-shadow .28s; }
.quiz-card:hover { transform:translateY(-4px); box-shadow:0 12px 40px rgba(26,18,8,.14); }
.qc-side { position:absolute; left:0; top:0; bottom:0; width:4px; }
.qc-side-Оңай   { background:#2e7d32; }
.qc-side-Орташа { background:var(--gold); }
.qc-side-Жоғары { background:var(--rust); }
.qc-top  { display:flex; align-items:center; justify-content:space-between; }
.qc-lvl  { font-size:.62rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em; padding:.2rem .55rem; border-radius:1px; }
.lvl-Оңай   { background:#e8f5e9; color:#2e7d32; }
.lvl-Орташа { background:#fff3e0; color:#e65100; }
.lvl-Жоғары { background:#fce4ec; color:#b71c1c; }
.qc-cnt { font-size:.72rem; color:#9a8a72; }
.qc-title { font-family:'Playfair Display',serif; font-size:1rem; font-weight:900; color:var(--ink); margin:0; }
.qc-types { display:flex; flex-wrap:wrap; gap:.3rem; }
.qc-chip { display:inline-flex; align-items:center; gap:.25rem; font-size:.65rem; font-weight:700; padding:.18rem .5rem; border-radius:10px; }
.chip-mcq       { background:rgba(196,146,42,.12); color:var(--gold); }
.chip-truefalse { background:rgba(58,92,58,.1);    color:var(--sage); }
.chip-fillblank { background:rgba(139,58,30,.1);   color:var(--rust); }
.chip-match     { background:rgba(42,58,92,.1);    color:var(--navy); }
.qc-meta { display:flex; align-items:center; justify-content:space-between; font-size:.72rem; color:#9a8a72; }
.qc-meta i { color:var(--gold); margin-right:.2rem; font-size:.68rem; }
.qc-last { font-weight:700; }
.qc-bar  { height:4px; background:var(--border); border-radius:2px; overflow:hidden; }
.qc-bar-fill { height:100%; border-radius:2px; }
.qc-start { display:inline-flex; align-items:center; gap:.4rem; align-self:flex-start; background:var(--gold); color:#fff; border:none; padding:.48rem 1.05rem; border-radius:2px; font-family:'Source Serif 4',serif; font-size:.82rem; font-weight:700; cursor:pointer; transition:background .2s; margin-top:auto; }
.qc-start:hover { background:var(--gold-l); }

/* Arena */
.arena { display:flex; flex-direction:column; gap:1.1rem; }
.arena-hd { display:flex; align-items:center; gap:.85rem; background:var(--dark); border-radius:3px; padding:.85rem 1.25rem; border:1px solid rgba(196,146,42,.2); flex-wrap:wrap; }
.ah-back  { display:flex; align-items:center; gap:.4rem; background:none; border:1px solid rgba(255,255,255,.15); border-radius:2px; color:rgba(255,255,255,.55); font-family:'Source Serif 4',serif; font-size:.78rem; padding:.35rem .75rem; cursor:pointer; transition:all .2s; }
.ah-back:hover { border-color:var(--gold); color:var(--gold-l); }
.ah-info  { flex:1; display:flex; align-items:center; gap:.65rem; min-width:0; }
.ah-topic { font-family:'Playfair Display',serif; font-size:.95rem; font-weight:700; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ah-lv    { font-size:.62rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em; padding:.2rem .55rem; border-radius:1px; flex-shrink:0; }
.ah-timer { display:flex; align-items:center; gap:.4rem; font-size:.85rem; font-weight:700; color:var(--gold-l); background:rgba(196,146,42,.1); padding:.3rem .8rem; border-radius:2px; border:1px solid rgba(196,146,42,.25); font-family:monospace; }
.ah-timer.warn { color:#ef9a9a; animation:blink .8s ease infinite; }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:.6} }

/* Progress */
.arena-prog { display:flex; align-items:center; gap:.75rem; flex-wrap:wrap; }
.ap-track   { height:5px; flex:1; min-width:80px; background:rgba(196,146,42,.2); border-radius:3px; overflow:hidden; }
.ap-fill    { height:100%; background:var(--gold); border-radius:3px; transition:width .4s; }
.ap-dots    { display:flex; flex-wrap:wrap; gap:.32rem; }
.ap-dot     { width:22px; height:22px; border-radius:50%; background:rgba(196,146,42,.18); border:1.5px solid transparent; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all .2s; padding:0; }
.dot-n      { font-size:.6rem; font-weight:700; color:rgba(196,146,42,.7); }
.ap-dot.ap-cur { background:var(--gold); border-color:var(--gold); }
.ap-dot.ap-cur .dot-n { color:#fff; }
.ap-dot.ap-ok  { background:rgba(58,92,58,.2); border-color:var(--sage); }
.ap-dot.ap-ok .dot-n { color:var(--sage); }
.ap-dot.ap-bad { background:rgba(139,58,30,.2); border-color:var(--rust); }
.ap-dot.ap-bad .dot-n { color:var(--rust); }
.ap-cnt { font-size:.72rem; color:#9a8a72; }

/* Question */
.q-card { background:#fff; border:1px solid var(--border); border-radius:3px; overflow:hidden; }
.q-card-hd { display:flex; align-items:center; gap:.55rem; flex-wrap:wrap; padding:.65rem 1.5rem; background:var(--parch); border-bottom:1px solid var(--border); }
.q-num { font-size:.65rem; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--gold); }
.q-tag { display:inline-flex; align-items:center; gap:.28rem; font-size:.62rem; font-weight:700; text-transform:uppercase; padding:.18rem .5rem; border-radius:1px; color:#fff; }
.tag-mcq{background:var(--gold);} .tag-truefalse{background:var(--sage);} .tag-fillblank{background:var(--rust);} .tag-match{background:var(--navy);}
.q-card-body { padding:1.25rem 1.75rem .75rem; }
.q-text { font-family:'Playfair Display',serif; font-size:1.1rem; font-weight:700; color:var(--ink); margin:0; line-height:1.45; }

/* MCQ */
.mcq-list { display:flex; flex-direction:column; gap:.5rem; padding:1rem 1.75rem 1.5rem; }
.mcq-opt  { display:flex; align-items:center; gap:.75rem; width:100%; padding:.68rem 1rem; border:1.5px solid var(--border); border-radius:2px; background:#fff; cursor:pointer; font-family:'Source Serif 4',serif; font-size:.9rem; color:var(--ink); transition:all .2s; }
.mcq-opt:hover:not(:disabled) { border-color:var(--gold); background:#fdf8f0; }
.mcq-opt.mcq-sel { border-color:var(--gold); background:rgba(196,146,42,.07); }
.mcq-opt.mcq-ok  { border-color:var(--sage); background:rgba(58,92,58,.07); }
.mcq-opt.mcq-bad { border-color:var(--rust); background:rgba(139,58,30,.06); }
.mcq-opt.mcq-dim { opacity:.38; }
.mcq-opt:disabled:not(.mcq-ok):not(.mcq-bad):not(.mcq-dim) { opacity:.7; cursor:not-allowed; }
.mcq-ltr { width:26px; height:26px; border-radius:50%; flex-shrink:0; background:rgba(196,146,42,.12); color:var(--gold); display:flex; align-items:center; justify-content:center; font-size:.72rem; font-weight:700; }
.mcq-opt.mcq-ok  .mcq-ltr { background:rgba(58,92,58,.18);  color:var(--sage); }
.mcq-opt.mcq-bad .mcq-ltr { background:rgba(139,58,30,.18); color:var(--rust); }
.mcq-txt { flex:1; } .mcq-ic { margin-left:auto; font-size:.95rem; }
.mcq-ic.ok { color:var(--sage); } .mcq-ic.fail { color:var(--rust); }

/* TF */
.tf-pair { display:flex; gap:1rem; padding:1.25rem 1.75rem 1.5rem; }
.tf-btn  { flex:1; min-width:130px; padding:1.1rem; border-radius:3px; border:2px solid var(--border); background:#fff; display:flex; align-items:center; justify-content:center; gap:.55rem; font-family:'Playfair Display',serif; font-size:1rem; font-weight:700; cursor:pointer; transition:all .22s; }
.tf-true { color:var(--sage); } .tf-false { color:var(--rust); }
.tf-btn.tf-sel { border-width:2.5px; }
.tf-true.tf-sel  { border-color:var(--sage); background:rgba(58,92,58,.07); }
.tf-false.tf-sel { border-color:var(--rust); background:rgba(139,58,30,.07); }
.tf-btn.tf-ok  { border-color:var(--sage); background:rgba(58,92,58,.1); }
.tf-btn.tf-bad { border-color:var(--rust); background:rgba(139,58,30,.1); }
.tf-btn:disabled:not(.tf-ok):not(.tf-bad) { opacity:.65; cursor:not-allowed; }

/* Fill */
.fill-area { padding:1.25rem 1.75rem 1.5rem; }
.fill-sent { font-size:1rem; line-height:2.8; display:flex; flex-wrap:wrap; align-items:baseline; }
.fill-txt  { font-family:'Playfair Display',serif; color:#3a2a15; }
.fill-slot { display:inline-flex; flex-direction:column; align-items:center; margin:0 .2rem; vertical-align:bottom; }
.fill-in   { border:none; border-bottom:2.5px solid var(--gold); background:rgba(196,146,42,.06); padding:.2rem .45rem; width:110px; font-family:'Source Serif 4',serif; font-size:.95rem; color:var(--ink); outline:none; text-align:center; transition:all .2s; }
.fill-in:focus { border-bottom-color:var(--gold-l); }
.fill-in.fill-ok   { border-bottom-color:var(--sage); color:var(--sage); }
.fill-in.fill-bad  { border-bottom-color:var(--rust); color:var(--rust); }
.fill-ans { font-size:.65rem; color:var(--sage); margin-top:.15rem; }

/* Match */
.match-area  { padding:1.25rem 1.75rem 1.5rem; display:flex; flex-direction:column; gap:.75rem; }
.match-guide { font-size:.78rem; color:#9a8a72; font-style:italic; margin:0; display:flex; align-items:center; gap:.35rem; }
.match-guide i { color:var(--gold); font-size:.72rem; }
.match-cols  { display:grid; grid-template-columns:1fr 1fr; gap:.85rem; }
.match-col   { display:flex; flex-direction:column; gap:.4rem; }
.match-item  { padding:.55rem .85rem; border:1.5px solid var(--border); border-radius:2px; background:var(--parch); font-size:.82rem; cursor:pointer; display:flex; align-items:center; gap:.5rem; transition:all .2s; user-select:none; }
.match-item:hover    { border-color:var(--gold); }
.match-item.mi-sel   { border-color:var(--gold); background:rgba(196,146,42,.1); }
.match-item.mi-match,.match-item.mi-used { border-color:var(--sage); background:rgba(58,92,58,.07); color:var(--sage); }
.ml-ltr { font-size:.68rem; font-weight:700; color:var(--gold); min-width:16px; }
.match-links { display:flex; flex-direction:column; gap:.38rem; }
.match-link  { display:flex; align-items:center; gap:.5rem; padding:.42rem .75rem; border-radius:2px; border:1px solid var(--border); font-size:.82rem; }
.lk-pend { background:var(--parch); }
.lk-ok   { background:rgba(58,92,58,.07);  border-color:var(--sage); }
.lk-fail { background:rgba(139,58,30,.07); border-color:var(--rust); }
.lk-arr  { color:#b0a090 !important; font-size:.72rem; }
.lk-ic   { margin-left:auto; }
.lk-ic.ok   { color:var(--sage); } .lk-ic.fail { color:var(--rust); }
.lk-del { background:none; border:none; color:#b0a090; cursor:pointer; font-size:.72rem; padding:.2rem; margin-left:auto; }
.lk-del:hover { color:var(--rust); }

/* Explanation */
.q-exp { display:flex; gap:.75rem; align-items:flex-start; margin:0 1.75rem 1.25rem; background:rgba(196,146,42,.07); border:1px solid rgba(196,146,42,.2); border-radius:2px; padding:.85rem 1rem; }
.q-exp i { color:var(--gold); font-size:1rem; flex-shrink:0; }
.q-exp p { font-size:.82rem; color:var(--ink); line-height:1.65; margin:0; }
.exp-fade-enter-active,.exp-fade-leave-active { transition:opacity .3s, transform .3s; }
.exp-fade-enter-from,.exp-fade-leave-to { opacity:0; transform:translateY(-5px); }

/* Nav */
.arena-nav  { display:flex; align-items:center; gap:.75rem; }
.nav-btn    { display:inline-flex; align-items:center; gap:.45rem; background:#fff; border:1.5px solid var(--border); border-radius:2px; color:#7a6a52; font-family:'Source Serif 4',serif; font-size:.82rem; padding:.52rem 1.1rem; cursor:pointer; transition:all .2s; }
.nav-btn:hover:not(:disabled) { border-color:var(--gold); color:var(--gold); }
.nav-btn:disabled { opacity:.3; cursor:not-allowed; }
.nav-next   { margin-left:auto; }
.nav-finish { margin-left:auto; background:var(--gold); border-color:var(--gold); color:#fff; font-weight:700; }
.nav-finish:hover { background:var(--gold-l); }
.nav-mid    { flex:1; display:flex; justify-content:center; align-items:center; }
.nav-check  { display:inline-flex; align-items:center; gap:.45rem; background:var(--dark); color:var(--gold-l); border:1.5px solid rgba(196,146,42,.3); font-family:'Source Serif 4',serif; font-size:.82rem; font-weight:700; padding:.52rem 1.4rem; border-radius:2px; cursor:pointer; transition:all .2s; }
.nav-check:hover:not(:disabled) { background:var(--gold); color:#fff; border-color:var(--gold); }
.nav-check:disabled { opacity:.3; cursor:not-allowed; }
.nav-verdict { display:flex; align-items:center; gap:.5rem; font-size:.9rem; font-weight:700; }
.vd-ok   { color:var(--sage); font-size:1.1rem; }
.vd-fail { color:var(--rust); font-size:1.1rem; }

/* MCQ css helpers */
.mcq-opt { } /* already defined above */
.mcq-opt.mcq-sel { border-color:var(--gold); background:rgba(196,146,42,.07); }

/* fill helpers */
.fill-in.fill-ok  { border-bottom-color:var(--sage); color:var(--sage); }
.fill-in.fill-bad { border-bottom-color:var(--rust); color:var(--rust); }

/* match helpers */
.match-item.mi-sel   { border-color:var(--gold); background:rgba(196,146,42,.1); }
.match-item.mi-match,.match-item.mi-used { border-color:var(--sage); background:rgba(58,92,58,.07); color:var(--sage); }

/* Result overlay */
.res-overlay { position:fixed; inset:0; z-index:500; background:rgba(19,14,7,.75); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; padding:1rem; }
.res-pop-enter-active,.res-pop-leave-active { transition:opacity .35s, transform .35s; }
.res-pop-enter-from,.res-pop-leave-to { opacity:0; transform:scale(.9); }
.res-panel { background:var(--parch); border:1px solid var(--border); border-top:4px solid var(--gold); border-radius:4px; padding:2.25rem; max-width:440px; width:100%; display:flex; flex-direction:column; align-items:center; gap:1.15rem; box-shadow:0 24px 64px rgba(0,0,0,.35); }
.res-ring { position:relative; width:130px; height:130px; }
.res-ring svg { width:100%; height:100%; }
.res-ring-in { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
.res-pct  { font-family:'Playfair Display',serif; font-size:2rem; font-weight:900; color:var(--ink); line-height:1; }
.res-grade{ font-size:.68rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; margin-top:.2rem; }
.res-title{ font-family:'Playfair Display',serif; font-size:1.2rem; font-weight:700; color:var(--ink); margin:0; text-align:center; }
.res-topic{ font-size:.8rem; color:#9a8a72; margin:0; font-style:italic; }
.res-nums { display:flex; gap:1.5rem; flex-wrap:wrap; justify-content:center; }
.res-num  { display:flex; flex-direction:column; align-items:center; gap:.2rem; }
.rn-v     { font-family:'Playfair Display',serif; font-size:1.4rem; font-weight:900; color:var(--ink); }
.rn-l     { font-size:.65rem; color:#9a8a72; text-transform:uppercase; letter-spacing:.08em; }

/* Supabase saved status */
.res-saved { display:flex; align-items:center; gap:.55rem; padding:.55rem 1rem; border-radius:2px; font-size:.78rem; font-weight:600; width:100%; }
.res-saved.saving { background:rgba(196,146,42,.08); border:1px solid rgba(196,146,42,.25); color:var(--gold); }
.res-saved.ok     { background:rgba(58,92,58,.08);   border:1px solid rgba(58,92,58,.25);   color:var(--sage); }
.res-saved.fail   { background:rgba(139,58,30,.08);  border:1px solid rgba(139,58,30,.25);  color:var(--rust); }

.res-actions { display:flex; gap:.75rem; flex-wrap:wrap; justify-content:center; }
.res-btn-primary   { display:inline-flex; align-items:center; gap:.45rem; background:var(--gold); color:#fff; border:none; padding:.65rem 1.4rem; border-radius:2px; font-family:'Source Serif 4',serif; font-size:.875rem; font-weight:700; cursor:pointer; transition:background .2s; }
.res-btn-primary:hover { background:var(--gold-l); }
.res-btn-secondary { display:inline-flex; align-items:center; gap:.45rem; background:transparent; border:1.5px solid var(--border); color:var(--ink); padding:.65rem 1.4rem; border-radius:2px; font-family:'Source Serif 4',serif; font-size:.875rem; cursor:pointer; transition:all .2s; }
.res-btn-secondary:hover { border-color:var(--gold); color:var(--gold); }
</style>