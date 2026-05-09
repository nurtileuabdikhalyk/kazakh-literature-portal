<template>
  <section class="tasks-section">

    <!-- ══ HEADER ══════════════════════════════════════ -->
    <div class="section-header">
      <div class="orn-row">
        <span class="orn-line"/><span class="orn-diamond">◆</span><span class="orn-line"/>
      </div>
      <h2 class="section-title">
        <span class="title-kz">Тапсырмалар</span>
      </h2>
      <p class="section-sub">Білімді тексеріңіз — интерактивті жаттығулар мен тесттер</p>
    </div>

    <!-- ══ IF NO ACTIVE QUIZ ════════════════════════════ -->
    <div v-if="!activeQuiz" class="quiz-picker">

      <!-- Stats bar -->
      <div class="stats-bar">
        <div class="sb-item" v-for="s in globalStats" :key="s.label">
          <i :class="'pi '+s.icon"/>
          <div>
            <span class="sb-val">{{ s.val }}</span>
            <span class="sb-label">{{ s.label }}</span>
          </div>
        </div>
      </div>

      <!-- Category filter -->
      <div class="cat-tabs">
        <button
            v-for="c in categories" :key="c.key"
            class="cat-tab" :class="{ active: activeCat === c.key }"
            @click="activeCat = c.key"
        >{{ c.label }}</button>
      </div>

      <!-- Quiz cards grid -->
      <div class="quiz-grid">
        <div
            v-for="quiz in filteredQuizzes" :key="quiz.id"
            class="quiz-card"
            :class="quiz.type"
            @click="startQuiz(quiz)"
        >
          <div class="qc-top">
            <span class="qc-type-badge" :class="quiz.type">
              <i :class="'pi '+typeIcon(quiz.type)"/>
              {{ typeLabel(quiz.type) }}
            </span>
            <span class="qc-diff" :class="quiz.diff">{{ diffLabel(quiz.diff) }}</span>
          </div>
          <div class="qc-icon-wrap">
            <i :class="'pi '+typeIcon(quiz.type)" class="qc-big-icon"/>
          </div>
          <h3 class="qc-title">{{ quiz.title }}</h3>
          <p class="qc-desc">{{ quiz.desc }}</p>
          <div class="qc-meta">
            <span><i class="pi pi-list"/> {{ quiz.questions.length }} сұрақ</span>
            <span><i class="pi pi-clock"/> {{ quiz.time }} мин</span>
          </div>
          <div class="qc-footer">
            <div class="qc-progress-wrap" v-if="quiz.lastScore !== null">
              <div class="qcp-bar">
                <div class="qcp-fill" :style="{ width: quiz.lastScore + '%' }"/>
              </div>
              <span class="qcp-label">Соңғы: {{ quiz.lastScore }}%</span>
            </div>
            <button class="qc-start-btn">
              Бастау <i class="pi pi-arrow-right"/>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ ACTIVE QUIZ ═══════════════════════════════════ -->
    <div v-else class="quiz-arena">

      <!-- Quiz header -->
      <div class="qa-header">
        <button class="qa-back" @click="exitQuiz">
          <i class="pi pi-arrow-left"/> Артқа
        </button>
        <div class="qa-title-row">
          <span class="qa-type-badge" :class="activeQuiz.type">
            <i :class="'pi '+typeIcon(activeQuiz.type)"/>
            {{ typeLabel(activeQuiz.type) }}
          </span>
          <h3 class="qa-title">{{ activeQuiz.title }}</h3>
        </div>
        <!-- Timer -->
        <div class="qa-timer" :class="{ warning: timeLeft < 60 }">
          <i class="pi pi-clock"/>
          {{ fmtTime(timeLeft) }}
        </div>
      </div>

      <!-- Progress -->
      <div class="qa-progress">
        <div class="qap-steps">
          <div
              v-for="(q, i) in activeQuiz.questions" :key="i"
              class="qap-dot"
              :class="{
              done:    answers[i] !== undefined,
              current: i === qIdx,
              correct: submitted && isCorrect(i),
              wrong:   submitted && !isCorrect(i) && answers[i] !== undefined
            }"
              @click="!submitted && (qIdx = i)"
          />
        </div>
        <span class="qap-label">{{ qIdx + 1 }} / {{ activeQuiz.questions.length }}</span>
      </div>

      <!-- Question card -->
      <div class="question-card">
        <div class="question-body">
          <span class="q-num">{{ qIdx + 1 }}-сұрақ</span>
          <p class="q-text">{{ currentQ.text }}</p>
          <p v-if="currentQ.excerpt" class="q-excerpt">{{ currentQ.excerpt }}</p>
        </div>

        <!-- ── MCQ ── -->
        <div v-if="currentQ.type === 'mcq'" class="options-list">
          <button
              v-for="(opt, oi) in currentQ.options" :key="oi"
              class="option-btn"
              :class="optionClass(oi)"
              :disabled="submitted"
              @click="pickOption(oi)"
          >
            <span class="opt-letter">{{ String.fromCharCode(65+oi) }}</span>
            <span class="opt-text">{{ opt }}</span>
            <i v-if="submitted && oi === currentQ.answer" class="pi pi-check opt-icon correct"/>
            <i v-else-if="submitted && oi === answers[qIdx] && oi !== currentQ.answer" class="pi pi-times opt-icon wrong"/>
          </button>
        </div>

        <!-- ── TRUE/FALSE ── -->
        <div v-else-if="currentQ.type === 'truefalse'" class="tf-row">
          <button
              class="tf-btn true-btn"
              :class="tfClass(true)"
              :disabled="submitted"
              @click="pickTF(true)"
          >
            <i class="pi pi-check"/> Дұрыс
          </button>
          <button
              class="tf-btn false-btn"
              :class="tfClass(false)"
              :disabled="submitted"
              @click="pickTF(false)"
          >
            <i class="pi pi-times"/> Бұрыс
          </button>
        </div>

        <!-- ── FILL BLANK ── -->
        <div v-else-if="currentQ.type === 'fillblank'" class="fill-wrap">
          <div class="fill-sentence">
            <span
                v-for="(part, pi) in currentQ.parts" :key="pi"
            >
              <span v-if="part.type === 'text'" class="fb-text">{{ part.val }}</span>
              <input
                  v-else
                  v-model="blanks[pi]"
                  type="text"
                  class="fb-input"
                  :class="fillInputClass(pi)"
                  :disabled="submitted"
                  :placeholder="'___'"
                  @keyup.enter="!submitted && checkCurrent()"
              />
            </span>
          </div>
          <p v-if="submitted && !isCorrect(qIdx)" class="fill-hint">
            Дұрыс жауап: <strong>{{ currentQ.correctBlanks.join(', ') }}</strong>
          </p>
        </div>

        <!-- ── MATCH ── -->
        <div v-else-if="currentQ.type === 'match'" class="match-wrap">
          <div class="match-cols">
            <!-- Left column -->
            <div class="match-col left-col">
              <div
                  v-for="(item, i) in currentQ.pairs" :key="'l'+i"
                  class="match-item left"
                  :class="{ selected: matchLeft === i, matched: matchDone[i] !== undefined }"
                  @click="!submitted && selectMatchLeft(i)"
              >
                <span class="mi-letter">{{ String.fromCharCode(65+i) }}</span>
                <span>{{ item.left }}</span>
              </div>
            </div>
            <!-- Arrows -->
            <div class="match-arrows">
              <div v-for="(_, i) in currentQ.pairs" :key="'a'+i" class="ma-row">
                <div class="ma-line" :class="{ done: matchDone[i] !== undefined }"/>
              </div>
            </div>
            <!-- Right column -->
            <div class="match-col right-col">
              <div
                  v-for="(item, i) in shuffledRight" :key="'r'+i"
                  class="match-item right"
                  :class="matchRightClass(i)"
                  @click="!submitted && selectMatchRight(i)"
              >
                <span>{{ item.right }}</span>
              </div>
            </div>
          </div>
          <p v-if="submitted" class="match-result">
            <span v-if="isCorrect(qIdx)" class="mr-correct"><i class="pi pi-check-circle"/> Барлығы дұрыс!</span>
            <span v-else class="mr-wrong"><i class="pi pi-times-circle"/> Дұрыс сәйкестіктер жоғарыда көрсетілді</span>
          </p>
        </div>

        <!-- Explanation after submit -->
        <transition name="exp-fade">
          <div v-if="submitted && currentQ.explanation" class="explanation">
            <i class="pi pi-lightbulb"/>
            <p>{{ currentQ.explanation }}</p>
          </div>
        </transition>
      </div>

      <!-- Nav buttons -->
      <div class="qa-nav">
        <button class="nav-btn" :disabled="qIdx === 0" @click="qIdx--">
          <i class="pi pi-chevron-left"/> Алдыңғы
        </button>
        <div class="nav-center">
          <button
              v-if="!submitted"
              class="check-btn"
              :disabled="!canCheck"
              @click="checkCurrent"
          >
            <i class="pi pi-check"/> Тексеру
          </button>
        </div>
        <button
            class="nav-btn next-btn"
            v-if="qIdx < activeQuiz.questions.length - 1"
            @click="qIdx++"
        >
          Келесі <i class="pi pi-chevron-right"/>
        </button>
        <button
            class="nav-btn finish-btn"
            v-else-if="!quizDone"
            @click="finishQuiz"
        >
          Аяқтау <i class="pi pi-flag"/>
        </button>
      </div>

      <!-- ══ RESULT SCREEN ══════════════════════════════ -->
      <transition name="result-pop">
        <div v-if="quizDone" class="result-overlay">
          <div class="result-card">
            <!-- Score ring -->
            <div class="score-ring-wrap">
              <svg viewBox="0 0 100 100" class="score-ring-svg">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(196,146,42,.15)" stroke-width="8"/>
                <circle
                    cx="50" cy="50" r="42" fill="none"
                    :stroke="scoreColor" stroke-width="8"
                    stroke-linecap="round"
                    stroke-dasharray="263.9"
                    :stroke-dashoffset="263.9 - (263.9 * finalScore / 100)"
                    transform="rotate(-90 50 50)"
                    style="transition: stroke-dashoffset 1s ease"
                />
              </svg>
              <div class="score-ring-center">
                <span class="score-pct">{{ finalScore }}%</span>
                <span class="score-grade">{{ scoreGrade }}</span>
              </div>
            </div>

            <h3 class="result-title">{{ resultTitle }}</h3>

            <div class="result-stats">
              <div class="rs-item correct">
                <i class="pi pi-check-circle"/>
                <span class="rs-num">{{ correctCount }}</span>
                <span class="rs-label">Дұрыс</span>
              </div>
              <div class="rs-item wrong">
                <i class="pi pi-times-circle"/>
                <span class="rs-num">{{ activeQuiz.questions.length - correctCount }}</span>
                <span class="rs-label">Қате</span>
              </div>
              <div class="rs-item time">
                <i class="pi pi-clock"/>
                <span class="rs-num">{{ fmtTime(activeQuiz.time * 60 - timeLeft) }}</span>
                <span class="rs-label">Уақыт</span>
              </div>
            </div>

            <div class="result-actions">
              <button class="ra-btn primary" @click="restartQuiz">
                <i class="pi pi-refresh"/> Қайталау
              </button>
              <button class="ra-btn secondary" @click="exitQuiz">
                <i class="pi pi-list"/> Тізімге оралу
              </button>
            </div>
          </div>
        </div>
      </transition>
    </div>

  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

// ─── Type helpers ─────────────────────────────────────
const typeIcons  = { mcq:'pi-list-check', truefalse:'pi-check-square', fillblank:'pi-pencil', match:'pi-arrows-h' }
const typeLabels = { mcq:'Тест', truefalse:'Дұрыс/Бұрыс', fillblank:'Бос орын', match:'Сәйкестендіру' }
const diffLabels = { easy:'Оңай', medium:'Орташа', hard:'Қиын' }

function typeIcon(t)  { return typeIcons[t]  || 'pi-question' }
function typeLabel(t) { return typeLabels[t] || t }
function diffLabel(d) { return diffLabels[d] || d }

// ─── Quizzes ──────────────────────────────────────────
const quizzes = ref([
  {
    id: 1, type: 'mcq', diff: 'easy', cat: 'classic',
    title: 'Абай өмірі мен шығармашылығы',
    desc:  'Ұлы ақынның өмірбаяны мен негізгі туындылары бойынша тест.',
    time: 5, lastScore: 80,
    questions: [
      {
        type: 'mcq',
        text: 'Абай Құнанбайұлы қай жылы дүниеге келді?',
        options: ['1840', '1845', '1850', '1835'],
        answer: 1,
        explanation: 'Абай 1845 жылы 10 тамызда Семей облысының Шыңғыс тауларының баурайында дүниеге келді.',
      },
      {
        type: 'mcq',
        text: 'Абайдың әйгілі «Қарасөздері» неше сөзден тұрады?',
        options: ['24', '30', '38', '45'],
        answer: 2,
        explanation: 'Абайдың «Қарасөздері» отыз сегіз (38) философиялық толғаудан тұрады.',
      },
      {
        type: 'mcq',
        text: '«Абай жолы» эпопеясының авторы кім?',
        options: ['Ілияс Есенберлин', 'Мұхтар Әуезов', 'Ғабит Мүсірепов', 'Сәбит Мұқанов'],
        answer: 1,
        explanation: 'Мұхтар Омарханұлы Әуезов — «Абай жолы» роман-эпопеясының авторы.',
      },
      {
        type: 'mcq',
        text: 'Абай қай тілден аударма жасады?',
        options: ['Француз', 'Орыс', 'Парсы', 'Барлығы'],
        answer: 3,
        explanation: 'Абай орыс, неміс, парсы тілдерінен аударма жасап, қазақ поэзиясын байытты.',
      },
    ],
  },
  {
    id: 2, type: 'truefalse', diff: 'easy', cat: 'classic',
    title: 'Дұрыс па, бұрыс па?',
    desc:  'Қазақ әдебиеті туралы тұжырымдарды бағалаңыз.',
    time: 3, lastScore: null,
    questions: [
      {
        type: 'truefalse',
        text: 'Мұқағали Мақатаев 1976 жылы дүниеден өтті.',
        answer: true,
        explanation: 'Иә, Мұқағали Мақатаев 1976 жылы 23 наурызда 45 жасында қайтыс болды.',
      },
      {
        type: 'truefalse',
        text: '«Көшпенділер» трилогиясының авторы — Мұхтар Әуезов.',
        answer: false,
        explanation: '«Көшпенділер» трилогиясын Ілияс Есенберлин жазды (1969–1976).',
      },
      {
        type: 'truefalse',
        text: 'Абайдың толық аты — Ибраһим Құнанбайұлы.',
        answer: true,
        explanation: 'Иә, «Абай» — лақап ат. Оның нақты аты Ибраһим (Ибрагим) болған.',
      },
      {
        type: 'truefalse',
        text: 'Фариза Оңғарсынова — қазақ прозасының өкілі.',
        answer: false,
        explanation: 'Фариза Оңғарсынова — қазақ поэзиясының ұлы ақыны, проза жазбаған.',
      },
    ],
  },
  {
    id: 3, type: 'fillblank', diff: 'medium', cat: 'poetry',
    title: 'Өлең жолдарын толықтыр',
    desc:  'Атақты өлең жолдарындағы бос орындарды дұрыс сөздермен толтырыңыз.',
    time: 4, lastScore: null,
    questions: [
      {
        type: 'fillblank',
        text: 'Абайдың атақты өлеңіндегі бос орынды толтырыңыз:',
        parts: [
          { type:'text', val:'«Қараңғы түнде тау ' },
          { type:'blank', idx:0 },
          { type:'text', val:', / Ұйқыға кетер ' },
          { type:'blank', idx:1 },
          { type:'text', val:'»' },
        ],
        correctBlanks: ['қалғып', 'далбаса'],
        explanation: 'Абайдың «Қараңғы түнде тау қалғып, Ұйқыға кетер далбаса» — атақты өлеңінің басы.',
      },
      {
        type: 'fillblank',
        text: 'Мұқағалидың «Өмір — өзен» өлеңін толықтырыңыз:',
        parts: [
          { type:'text', val:'«Өмір — ' },
          { type:'blank', idx:0 },
          { type:'text', val:', ағады да ' },
          { type:'blank', idx:1 },
          { type:'text', val:'»' },
        ],
        correctBlanks: ['өзен', 'кетеді'],
        explanation: 'Мұқағали Мақатаевтың «Өмір — өзен, ағады да кетеді» деп басталатын атақты өлеңі.',
      },
      {
        type: 'fillblank',
        text: 'Абайдың «Жазғытұры» өлеңінен:',
        parts: [
          { type:'text', val:'«' },
          { type:'blank', idx:0 },
          { type:'text', val:' жер жүзін жасыл ' },
          { type:'blank', idx:1 },
          { type:'text', val:'басты»' },
        ],
        correctBlanks: ['Жасыл', 'майса'],
        explanation: 'Абайдың «Жасыл жер жүзін жасыл майса басты» деп келетін жазғытұрылық суреті.',
      },
    ],
  },
  {
    id: 4, type: 'match', diff: 'medium', cat: 'authors',
    title: 'Автор мен шығармасын сәйкестендір',
    desc:  'Оң жақтағы шығармаларды сол жақтағы авторлармен сәйкестендіріңіз.',
    time: 5, lastScore: 60,
    questions: [
      {
        type: 'match',
        text: 'Авторды шығармасымен сәйкестендіріңіз:',
        pairs: [
          { left:'Мұхтар Әуезов',      right:'Абай жолы'              },
          { left:'Ілияс Есенберлин',   right:'Көшпенділер'            },
          { left:'Ғабит Мүсірепов',    right:'Оянған өлке'            },
          { left:'Сәбит Мұқанов',      right:'Өмір мектебі'           },
        ],
        explanation: 'Бұл шығармалар қазақ прозасының классикалық туындылары болып табылады.',
      },
      {
        type: 'match',
        text: 'Ақынды жыр жолымен сәйкестендіріңіз:',
        pairs: [
          { left:'Абай',        right:'«Қараңғы түнде тау қалғып»'    },
          { left:'Мұқағали',   right:'«Өмір — өзен, ағады да кетеді»' },
          { left:'Фариза',      right:'«Ана туралы жыр»'              },
          { left:'Қадыр',       right:'«Өлмейді ақын»'               },
        ],
        explanation: 'Бұл жыр жолдары қазақ лирикасының маржандары болып саналады.',
      },
    ],
  },
  {
    id: 5, type: 'mcq', diff: 'hard', cat: 'theory',
    title: 'Әдебиет теориясы',
    desc:  'Жанр, стиль, тропологиялық тәсілдер бойынша күрделі тест.',
    time: 8, lastScore: null,
    questions: [
      {
        type: 'mcq',
        text: 'Лирикалық кейіпкер деген не?',
        options: [
          'Романдағы негізгі кейіпкер',
          'Ақынның жалпы образы, поэтикалық «мен»',
          'Дастандағы батыр',
          'Сатиралық тип',
        ],
        answer: 1,
        explanation: 'Лирикалық кейіпкер — поэзияда ақынның сезімі мен ойын жеткізетін жалпыланған «мен» образы.',
      },
      {
        type: 'mcq',
        text: 'Эпитет деген не?',
        options: [
          'Ұқсату тәсілі',
          'Заттың ерекшелігін бейнелейтін көркем анықтауыш',
          'Өмір шындығын бейнелеу',
          'Сөздің қайталануы',
        ],
        answer: 1,
        explanation: 'Эпитет — зат немесе құбылыстың ерекшелігін суреттейтін көркем анықтауыш сөз.',
      },
    ],
  },
])

// ─── State ────────────────────────────────────────────
const activeCat  = ref('all')
const activeQuiz = ref(null)
const qIdx       = ref(0)
const answers    = ref({})
const blanks     = ref({})
const matchLeft  = ref(null)
const matchDone  = ref({})
const shuffledRight = ref([])
const submitted  = ref(false)
const quizDone   = ref(false)
const timeLeft   = ref(0)
let   timer      = null

// ─── Categories ───────────────────────────────────────
const categories = [
  { key:'all',     label:'Барлығы'    },
  { key:'classic', label:'Классика'   },
  { key:'poetry',  label:'Поэзия'     },
  { key:'authors', label:'Авторлар'   },
  { key:'theory',  label:'Теория'     },
]

const filteredQuizzes = computed(() =>
    activeCat.value === 'all' ? quizzes.value
        : quizzes.value.filter(q => q.cat === activeCat.value)
)

const globalStats = [
  { icon:'pi-check-circle', val:'78%',  label:'Орташа нәтиже' },
  { icon:'pi-list-check',   val:'5',    label:'Тест түрі'      },
  { icon:'pi-users',        val:'2800+',label:'Қатысушы'       },
  { icon:'pi-star',         val:'4.7',  label:'Баға'           },
]

// ─── Current question ─────────────────────────────────
const currentQ = computed(() =>
    activeQuiz.value ? activeQuiz.value.questions[qIdx.value] : null
)

// ─── Can check ────────────────────────────────────────
const canCheck = computed(() => {
  if (!currentQ.value) return false
  const t = currentQ.value.type
  if (t === 'mcq' || t === 'truefalse') return answers.value[qIdx.value] !== undefined
  if (t === 'fillblank') return currentQ.value.parts
      .filter(p => p.type === 'blank')
      .every(p => blanks.value[p.idx]?.trim())
  if (t === 'match') return Object.keys(matchDone.value).length === currentQ.value.pairs.length
  return false
})

// ─── Score ────────────────────────────────────────────
const correctCount = computed(() => {
  if (!activeQuiz.value) return 0
  return activeQuiz.value.questions.filter((_, i) => isCorrect(i)).length
})
const finalScore = computed(() => {
  if (!activeQuiz.value) return 0
  return Math.round((correctCount.value / activeQuiz.value.questions.length) * 100)
})
const scoreColor = computed(() =>
    finalScore.value >= 80 ? '#4a5e4c'
        : finalScore.value >= 50 ? '#c4922a'
            : '#8b3a1e'
)
const scoreGrade = computed(() =>
    finalScore.value >= 90 ? 'Өте жақсы' :
        finalScore.value >= 75 ? 'Жақсы' :
            finalScore.value >= 50 ? 'Қанағат.' : 'Қайталаңыз'
)
const resultTitle = computed(() =>
    finalScore.value >= 80 ? 'Керемет нәтиже! 🎉'
        : finalScore.value >= 50 ? 'Жаман емес! Жалғастырыңыз 👍'
            : 'Қайталап көріңіз 📚'
)

// ─── isCorrect ────────────────────────────────────────
function isCorrect(i) {
  const q = activeQuiz.value?.questions[i]
  if (!q) return false
  if (q.type === 'mcq' || q.type === 'truefalse') return answers.value[i] === q.answer
  if (q.type === 'fillblank') {
    const bls = blanksForQ(i)
    return q.correctBlanks.every((ans, j) =>
        bls[j]?.trim().toLowerCase() === ans.toLowerCase()
    )
  }
  if (q.type === 'match') {
    const done = matchesForQ(i)
    return q.pairs.every((p, j) => done[j] === j)
  }
  return false
}

// Stored blank/match answers per question
const blankHistory  = ref({})
const matchHistory  = ref({})
function blanksForQ(i) { return blankHistory.value[i] || {} }
function matchesForQ(i){ return matchHistory.value[i]  || {} }

// ─── Actions ──────────────────────────────────────────
function pickOption(oi) {
  if (submitted.value) return
  answers.value = { ...answers.value, [qIdx.value]: oi }
}
function pickTF(val) {
  if (submitted.value) return
  answers.value = { ...answers.value, [qIdx.value]: val }
}

function checkCurrent() {
  if (!canCheck.value) return
  // Save blanks
  if (currentQ.value.type === 'fillblank') {
    blankHistory.value[qIdx.value] = { ...blanks.value }
    const correct = currentQ.value.correctBlanks.every((ans, j) =>
        blanks.value[j]?.trim().toLowerCase() === ans.toLowerCase()
    )
    answers.value = { ...answers.value, [qIdx.value]: correct ? 'correct' : 'wrong' }
  }
  // Save match
  if (currentQ.value.type === 'match') {
    matchHistory.value[qIdx.value] = { ...matchDone.value }
    const correct = currentQ.value.pairs.every((_, j) => matchDone.value[j] === j)
    answers.value = { ...answers.value, [qIdx.value]: correct ? 'correct' : 'wrong' }
  }
  submitted.value = true
}

function selectMatchLeft(i) {
  matchLeft.value = i
}
function selectMatchRight(i) {
  if (matchLeft.value === null) return
  matchDone.value = { ...matchDone.value, [matchLeft.value]: i }
  matchLeft.value = null
}

// ─── Quiz lifecycle ───────────────────────────────────
function startQuiz(quiz) {
  activeQuiz.value  = quiz
  qIdx.value        = 0
  answers.value     = {}
  blanks.value      = {}
  blankHistory.value= {}
  matchHistory.value= {}
  matchLeft.value   = null
  matchDone.value   = {}
  submitted.value   = false
  quizDone.value    = false
  timeLeft.value    = quiz.time * 60
  shuffledRight.value = shuffle([...quiz.questions[0]?.pairs || []])
  startTimer()
}

function exitQuiz() {
  clearInterval(timer)
  activeQuiz.value = null
  quizDone.value   = false
  submitted.value  = false
}

function restartQuiz() {
  const q = activeQuiz.value
  exitQuiz()
  setTimeout(() => startQuiz(q), 50)
}

function finishQuiz() {
  clearInterval(timer)
  const quiz = quizzes.value.find(q => q.id === activeQuiz.value.id)
  if (quiz) quiz.lastScore = finalScore.value
  quizDone.value = true
}

function startTimer() {
  clearInterval(timer)
  timer = setInterval(() => {
    if (timeLeft.value > 0) timeLeft.value--
    else finishQuiz()
  }, 1000)
}

// ─── Watchers ─────────────────────────────────────────
watch(qIdx, (newIdx) => {
  submitted.value = answers.value[newIdx] !== undefined
  blanks.value    = blankHistory.value[newIdx] || {}
  matchDone.value = matchHistory.value[newIdx] || {}
  matchLeft.value = null
  const q = activeQuiz.value?.questions[newIdx]
  if (q?.type === 'match') {
    shuffledRight.value = shuffle([...(q.pairs || [])])
  }
})

// ─── CSS classes ──────────────────────────────────────
function optionClass(oi) {
  if (!submitted.value) return answers.value[qIdx.value] === oi ? 'selected' : ''
  if (oi === currentQ.value.answer) return 'correct'
  if (oi === answers.value[qIdx.value]) return 'wrong'
  return 'dimmed'
}
function tfClass(val) {
  if (!submitted.value) return answers.value[qIdx.value] === val ? 'selected' : ''
  if (val === currentQ.value.answer) return 'correct'
  if (val === answers.value[qIdx.value]) return 'wrong'
  return ''
}
function fillInputClass(pi) {
  if (!submitted.value) return ''
  const correct = blanks.value[pi]?.trim().toLowerCase() ===
      currentQ.value.correctBlanks.find((_, j) =>
          currentQ.value.parts.filter(p=>p.type==='blank')[j]?.idx === pi
      )?.toLowerCase()
  return correct ? 'fill-correct' : 'fill-wrong'
}
function matchRightClass(i) {
  const leftKey = Object.keys(matchDone.value).find(k => matchDone.value[k] === i)
  if (leftKey !== undefined) return 'matched'
  return ''
}

// ─── Helpers ──────────────────────────────────────────
function shuffle(arr) {
  for (let i = arr.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
function fmtTime(s) {
  const m = Math.floor(s/60)
  return `${m}:${String(s%60).padStart(2,'0')}`
}

onBeforeUnmount(() => clearInterval(timer))
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap');

.tasks-section {
  --ink:     #1a1208;
  --parch:   #faf6ef;
  --gold:    #c4922a;
  --gold-l:  #e8b94f;
  --rust:    #8b3a1e;
  --sage:    #3a5c3a;
  --border:  #d9cdb8;
  --dark:    #130e07;
  --shd:     0 4px 24px rgba(26,18,8,.10);
  --shd-lg:  0 14px 48px rgba(26,18,8,.18);

  background: var(--parch);
  padding: 3.5rem 1.5rem;
  max-width: 1280px;
  margin: 0 auto;
  font-family: 'Source Serif 4', Georgia, serif;
}

/* ── Header ── */
.section-header { text-align:center; margin-bottom:2.5rem; }
.orn-row { display:flex; align-items:center; justify-content:center; gap:.75rem; margin-bottom:1rem; }
.orn-line { display:block; height:1px; width:80px; background:linear-gradient(90deg,transparent,var(--gold)); }
.orn-line:last-child { background:linear-gradient(90deg,var(--gold),transparent); }
.orn-diamond { color:var(--gold); font-size:.7rem; }
.section-title { font-family:'Playfair Display',serif; font-size:clamp(2rem,4vw,2.75rem); font-weight:900; color:var(--ink); margin:0 0 .5rem; }
.title-kz { color:var(--ink); }
.title-div { color:var(--gold); margin:0 .5rem; font-weight:300; }
.title-ru { color:var(--rust); font-style:italic; font-weight:600; font-size:80%; }
.section-sub { color:#7a6a52; font-size:.95rem; font-style:italic; margin:0; }

/* ── Stats bar ── */
.stats-bar { display:flex; flex-wrap:wrap; gap:1rem; justify-content:center; margin-bottom:2rem; }
.sb-item {
  display:flex; align-items:center; gap:.65rem;
  background:#fff; border:1px solid var(--border); border-radius:2px;
  padding:.6rem 1.1rem;
}
.sb-item i { font-size:1.25rem; color:var(--gold); }
.sb-val   { display:block; font-family:'Playfair Display',serif; font-size:1.1rem; font-weight:700; color:var(--ink); }
.sb-label { display:block; font-size:.7rem; color:#9a8a72; }

/* ── Cat tabs ── */
.cat-tabs { display:flex; flex-wrap:wrap; gap:.45rem; margin-bottom:1.75rem; }
.cat-tab {
  padding:.4rem 1rem; border:1.5px solid var(--border); border-radius:2px;
  background:transparent; color:#7a6a52;
  font-family:'Source Serif 4',serif; font-size:.82rem; cursor:pointer; transition:all .2s;
}
.cat-tab:hover { border-color:var(--gold); color:var(--gold); }
.cat-tab.active { background:var(--gold); border-color:var(--gold); color:#fff; font-weight:600; }

/* ── Quiz grid ── */
.quiz-grid {
  display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:1.25rem;
}

/* ── Quiz card ── */
.quiz-card {
  background:#fff; border:1px solid var(--border); border-radius:3px; overflow:hidden;
  display:flex; flex-direction:column; cursor:pointer;
  transition:transform .3s, box-shadow .3s; padding:1.25rem;
  position:relative;
}
.quiz-card::before {
  content:''; position:absolute; top:0; left:0; right:0; height:3px;
}
.quiz-card.mcq::before       { background:var(--gold); }
.quiz-card.truefalse::before  { background:var(--sage); }
.quiz-card.fillblank::before  { background:var(--rust); }
.quiz-card.match::before      { background:#2a3a5c; }
.quiz-card:hover { transform:translateY(-5px); box-shadow:var(--shd-lg); }

.qc-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:1rem; }
.qc-type-badge {
  display:inline-flex; align-items:center; gap:.35rem;
  font-size:.62rem; font-weight:700; letter-spacing:.09em; text-transform:uppercase;
  padding:.18rem .55rem; border-radius:1px; color:#fff;
}
.qc-type-badge.mcq       { background:var(--gold); }
.qc-type-badge.truefalse { background:var(--sage); }
.qc-type-badge.fillblank { background:var(--rust); }
.qc-type-badge.match     { background:#2a3a5c; }
.qc-diff { font-size:.62rem; font-weight:700; letter-spacing:.07em; text-transform:uppercase; padding:.18rem .5rem; border-radius:1px; }
.qc-diff.easy   { background:#e8f5e9; color:#2e7d32; }
.qc-diff.medium { background:#fff3e0; color:#e65100; }
.qc-diff.hard   { background:#fce4ec; color:#b71c1c; }

.qc-icon-wrap {
  width:52px; height:52px; border-radius:50%; margin-bottom:.85rem;
  display:flex; align-items:center; justify-content:center;
  background:rgba(196,146,42,.1);
}
.qc-big-icon { font-size:1.4rem; color:var(--gold); }
.qc-title { font-family:'Playfair Display',serif; font-size:1rem; font-weight:700; color:var(--ink); margin:0 0 .4rem; }
.qc-desc  { font-size:.78rem; color:#5a4a35; line-height:1.6; flex:1; margin:0 0 .85rem; }
.qc-meta  { display:flex; gap:.85rem; font-size:.72rem; color:#9a8a72; margin-bottom:.85rem; }
.qc-meta i { color:var(--gold); margin-right:.25rem; }

.qc-footer { display:flex; align-items:center; justify-content:space-between; gap:.5rem; }
.qc-progress-wrap { flex:1; }
.qcp-bar  { height:4px; background:var(--border); border-radius:2px; overflow:hidden; margin-bottom:.2rem; }
.qcp-fill { height:100%; background:var(--gold); border-radius:2px; }
.qcp-label{ font-size:.65rem; color:#9a8a72; }
.qc-start-btn {
  display:inline-flex; align-items:center; gap:.35rem;
  background:var(--gold); color:#fff; border:none;
  padding:.42rem .95rem; border-radius:2px;
  font-family:'Source Serif 4',serif; font-size:.78rem; font-weight:700;
  cursor:pointer; transition:background .2s; white-space:nowrap;
}
.qc-start-btn:hover { background:var(--gold-l); }

/* ══ QUIZ ARENA ══ */
.quiz-arena { display:flex; flex-direction:column; gap:1.25rem; }

/* Arena header */
.qa-header {
  display:flex; align-items:center; gap:1rem;
  background:var(--dark); border-radius:3px; padding:.85rem 1.25rem;
  border:1px solid rgba(196,146,42,.2);
}
.qa-back {
  display:flex; align-items:center; gap:.4rem;
  background:none; border:1px solid rgba(255,255,255,.15); border-radius:2px;
  color:rgba(255,255,255,.55); font-family:'Source Serif 4',serif; font-size:.78rem;
  padding:.35rem .75rem; cursor:pointer; transition:all .2s; white-space:nowrap;
}
.qa-back:hover { border-color:var(--gold); color:var(--gold-l); }
.qa-title-row { flex:1; display:flex; align-items:center; gap:.7rem; min-width:0; }
.qa-type-badge {
  display:inline-flex; align-items:center; gap:.3rem; flex-shrink:0;
  font-size:.6rem; font-weight:700; letter-spacing:.09em; text-transform:uppercase;
  padding:.18rem .55rem; border-radius:1px; color:#fff;
}
.qa-type-badge.mcq       { background:var(--gold); }
.qa-type-badge.truefalse { background:var(--sage); }
.qa-type-badge.fillblank { background:var(--rust); }
.qa-type-badge.match     { background:#2a3a5c; }
.qa-title { font-family:'Playfair Display',serif; font-size:.95rem; font-weight:700; color:#fff; margin:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.qa-timer {
  display:flex; align-items:center; gap:.4rem; flex-shrink:0;
  font-size:.85rem; font-weight:700; color:var(--gold-l); background:rgba(196,146,42,.1);
  padding:.3rem .8rem; border-radius:2px; border:1px solid rgba(196,146,42,.25);
}
.qa-timer.warning { color:#ef9a9a; background:rgba(239,154,154,.1); border-color:rgba(239,154,154,.25); animation:pulse .8s ease infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.6} }

/* Progress dots */
.qa-progress { display:flex; align-items:center; gap:.75rem; padding:.25rem 0; }
.qap-steps { display:flex; flex-wrap:wrap; gap:.4rem; flex:1; }
.qap-dot {
  width:28px; height:6px; border-radius:3px;
  background:rgba(196,146,42,.2); cursor:pointer; transition:all .25s;
}
.qap-dot.done    { background:rgba(196,146,42,.5); }
.qap-dot.current { background:var(--gold); box-shadow:0 0 6px var(--gold); }
.qap-dot.correct { background:var(--sage); }
.qap-dot.wrong   { background:var(--rust); }
.qap-label { font-size:.72rem; color:#9a8a72; white-space:nowrap; }

/* Question card */
.question-card {
  background:#fff; border:1px solid var(--border); border-radius:3px;
  overflow:hidden; box-shadow:var(--shd);
}
.question-body {
  padding:1.5rem 1.75rem 1rem;
  background:linear-gradient(135deg,#fff 0%,#fdf8f0 100%);
  border-bottom:1px solid var(--border);
}
.q-num { font-size:.65rem; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--gold); display:block; margin-bottom:.5rem; }
.q-text { font-family:'Playfair Display',serif; font-size:1.15rem; font-weight:700; color:var(--ink); margin:0 0 .5rem; line-height:1.4; }
.q-excerpt { font-size:.82rem; color:#5a4a35; font-style:italic; margin:0; line-height:1.65; background:rgba(196,146,42,.06); padding:.6rem .85rem; border-left:2px solid var(--gold); border-radius:0 2px 2px 0; }

/* MCQ options */
.options-list { display:flex; flex-direction:column; gap:.55rem; padding:1.25rem 1.75rem; }
.option-btn {
  display:flex; align-items:center; gap:.75rem;
  width:100%; padding:.72rem 1rem; border-radius:2px;
  border:1.5px solid var(--border); background:#fff;
  cursor:pointer; text-align:left; transition:all .2s;
  font-family:'Source Serif 4',serif;
}
.option-btn:hover:not(:disabled) { border-color:var(--gold); background:#fdf8f0; }
.option-btn.selected { border-color:var(--gold); background:rgba(196,146,42,.08); }
.option-btn.correct  { border-color:var(--sage); background:rgba(58,92,58,.08); }
.option-btn.wrong    { border-color:var(--rust); background:rgba(139,58,30,.07); }
.option-btn.dimmed   { opacity:.45; }
.opt-letter {
  width:26px; height:26px; border-radius:50%; flex-shrink:0;
  background:rgba(196,146,42,.12); color:var(--gold);
  display:flex; align-items:center; justify-content:center;
  font-size:.72rem; font-weight:700;
}
.option-btn.correct .opt-letter { background:rgba(58,92,58,.15); color:var(--sage); }
.option-btn.wrong   .opt-letter { background:rgba(139,58,30,.15); color:var(--rust); }
.opt-text { flex:1; font-size:.875rem; color:var(--ink); }
.opt-icon { font-size:.85rem; flex-shrink:0; }
.opt-icon.correct { color:var(--sage); }
.opt-icon.wrong   { color:var(--rust); }

/* True/False */
.tf-row { display:flex; gap:1rem; padding:1.5rem 1.75rem; flex-wrap:wrap; }
.tf-btn {
  flex:1; min-width:140px; padding:1.25rem;
  border-radius:3px; border:2px solid var(--border); background:#fff;
  display:flex; flex-direction:column; align-items:center; gap:.5rem;
  font-family:'Playfair Display',serif; font-size:1.05rem; font-weight:700;
  cursor:pointer; transition:all .22s;
}
.tf-btn i { font-size:1.5rem; }
.tf-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:var(--shd); }
.true-btn  { color:var(--sage); }
.false-btn { color:var(--rust); }
.true-btn:hover:not(:disabled)  { border-color:var(--sage); background:rgba(58,92,58,.06); }
.false-btn:hover:not(:disabled) { border-color:var(--rust); background:rgba(139,58,30,.06); }
.tf-btn.selected { border-width:2px; }
.true-btn.selected  { border-color:var(--sage); background:rgba(58,92,58,.08); }
.false-btn.selected { border-color:var(--rust); background:rgba(139,58,30,.08); }
.tf-btn.correct { border-color:var(--sage); background:rgba(58,92,58,.1); }
.tf-btn.wrong   { border-color:var(--rust); background:rgba(139,58,30,.1); }

/* Fill blank */
.fill-wrap { padding:1.5rem 1.75rem; }
.fill-sentence { font-size:1rem; color:var(--ink); line-height:2.4; flex-wrap:wrap; display:flex; align-items:baseline; }
.fb-text { font-style:italic; color:#3a2a15; }
.fb-input {
  display:inline-block; width:120px; border:none; border-bottom:2px solid var(--gold);
  background:rgba(196,146,42,.06); padding:.2rem .5rem; margin:0 .25rem;
  font-family:'Source Serif 4',serif; font-size:1rem; color:var(--ink); outline:none;
  border-radius:1px; transition:border-color .2s, background .2s; text-align:center;
}
.fb-input:focus { border-color:var(--gold-l); background:rgba(196,146,42,.1); }
.fb-input.fill-correct { border-color:var(--sage); background:rgba(58,92,58,.08); color:var(--sage); }
.fb-input.fill-wrong   { border-color:var(--rust); background:rgba(139,58,30,.08); color:var(--rust); }
.fill-hint { font-size:.8rem; color:var(--sage); margin:.85rem 0 0; font-style:italic; }
.fill-hint strong { color:var(--sage); font-style:normal; }

/* Match */
.match-wrap { padding:1.25rem 1.75rem; }
.match-cols { display:grid; grid-template-columns:1fr 40px 1fr; gap:.5rem; align-items:start; }
.match-col  { display:flex; flex-direction:column; gap:.5rem; }
.match-item {
  padding:.55rem .85rem; border:1.5px solid var(--border); border-radius:2px;
  font-size:.82rem; cursor:pointer; transition:all .2s;
  display:flex; align-items:center; gap:.5rem;
}
.match-item:hover { border-color:var(--gold); background:#fdf8f0; }
.match-item.selected { border-color:var(--gold); background:rgba(196,146,42,.1); }
.match-item.matched  { border-color:var(--sage); background:rgba(58,92,58,.07); color:var(--sage); font-weight:600; }
.mi-letter { font-size:.68rem; font-weight:700; color:var(--gold); min-width:16px; }
.match-arrows { display:flex; flex-direction:column; gap:.5rem; align-items:center; }
.ma-row  { height:36px; display:flex; align-items:center; }
.ma-line { width:32px; height:2px; background:var(--border); border-radius:1px; transition:background .25s; }
.ma-line.done { background:var(--gold); }
.match-result { margin-top:1rem; font-size:.82rem; }
.mr-correct { color:var(--sage); display:flex; align-items:center; gap:.4rem; }
.mr-wrong   { color:var(--rust); display:flex; align-items:center; gap:.4rem; }

/* Explanation */
.explanation {
  display:flex; gap:.75rem; align-items:flex-start;
  margin:1rem 1.75rem;
  background:linear-gradient(135deg,rgba(196,146,42,.08),rgba(196,146,42,.04));
  border:1px solid rgba(196,146,42,.2); border-radius:2px; padding:.9rem 1rem;
}
.explanation i { color:var(--gold); font-size:1rem; flex-shrink:0; margin-top:.1rem; }
.explanation p { font-size:.82rem; color:var(--ink); line-height:1.65; margin:0; }
.exp-fade-enter-active,.exp-fade-leave-active { transition:opacity .3s,transform .3s; }
.exp-fade-enter-from,.exp-fade-leave-to       { opacity:0; transform:translateY(-6px); }

/* Nav buttons */
.qa-nav { display:flex; align-items:center; gap:.75rem; }
.nav-btn {
  display:inline-flex; align-items:center; gap:.45rem;
  background:#fff; border:1.5px solid var(--border); border-radius:2px;
  color:#7a6a52; font-family:'Source Serif 4',serif; font-size:.82rem;
  padding:.52rem 1.1rem; cursor:pointer; transition:all .2s;
}
.nav-btn:hover:not(:disabled) { border-color:var(--gold); color:var(--gold); }
.nav-btn:disabled { opacity:.3; cursor:not-allowed; }
.nav-btn.next-btn    { margin-left:auto; }
.nav-btn.finish-btn  { margin-left:auto; background:var(--gold); border-color:var(--gold); color:#fff; font-weight:700; }
.nav-btn.finish-btn:hover { background:var(--gold-l); }
.nav-center { flex:1; display:flex; justify-content:center; }
.check-btn {
  display:inline-flex; align-items:center; gap:.45rem;
  background:var(--dark); color:var(--gold-l); border:1.5px solid rgba(196,146,42,.3);
  font-family:'Source Serif 4',serif; font-size:.82rem; font-weight:700;
  padding:.52rem 1.4rem; border-radius:2px; cursor:pointer; transition:all .2s;
}
.check-btn:hover:not(:disabled) { background:var(--gold); color:#fff; border-color:var(--gold); }
.check-btn:disabled { opacity:.3; cursor:not-allowed; }

/* ══ RESULT ══ */
.result-overlay {
  position:fixed; inset:0; z-index:500;
  background:rgba(19,14,7,.75); backdrop-filter:blur(6px);
  display:flex; align-items:center; justify-content:center; padding:1rem;
}
.result-pop-enter-active,.result-pop-leave-active { transition:opacity .35s,transform .35s; }
.result-pop-enter-from,.result-pop-leave-to       { opacity:0; transform:scale(.9); }

.result-card {
  background:var(--parch); border:1px solid var(--border); border-radius:4px;
  padding:2.5rem; max-width:420px; width:100%;
  display:flex; flex-direction:column; align-items:center; gap:1.5rem;
  box-shadow:var(--shd-lg);
  border-top:4px solid var(--gold);
}
.score-ring-wrap { position:relative; width:140px; height:140px; }
.score-ring-svg  { width:100%; height:100%; transform:rotate(0deg); }
.score-ring-center {
  position:absolute; inset:0; display:flex; flex-direction:column;
  align-items:center; justify-content:center;
}
.score-pct   { font-family:'Playfair Display',serif; font-size:2rem; font-weight:900; color:var(--ink); line-height:1; }
.score-grade { font-size:.68rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--gold); }

.result-title { font-family:'Playfair Display',serif; font-size:1.3rem; font-weight:700; color:var(--ink); text-align:center; margin:0; }

.result-stats { display:flex; gap:1.25rem; }
.rs-item { display:flex; flex-direction:column; align-items:center; gap:.25rem; }
.rs-item i { font-size:1.3rem; }
.rs-item.correct i { color:var(--sage); }
.rs-item.wrong   i { color:var(--rust); }
.rs-item.time    i { color:var(--gold); }
.rs-num   { font-family:'Playfair Display',serif; font-size:1.4rem; font-weight:900; color:var(--ink); }
.rs-label { font-size:.68rem; color:#9a8a72; text-transform:uppercase; letter-spacing:.08em; }

.result-actions { display:flex; gap:.75rem; flex-wrap:wrap; justify-content:center; }
.ra-btn {
  display:inline-flex; align-items:center; gap:.45rem;
  border-radius:2px; font-family:'Source Serif 4',serif; font-size:.85rem; font-weight:700;
  padding:.62rem 1.4rem; cursor:pointer; transition:all .22s; border:none;
}
.ra-btn.primary   { background:var(--gold); color:#fff; }
.ra-btn.primary:hover { background:var(--gold-l); }
.ra-btn.secondary { background:transparent; border:1.5px solid var(--border); color:var(--ink); }
.ra-btn.secondary:hover { border-color:var(--gold); color:var(--gold); }
</style>