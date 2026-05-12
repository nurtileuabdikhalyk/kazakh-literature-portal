<template>
  <div class="student-profile">

    <!-- ── HEADER ──────────────────────────────────── -->
    <div class="sp-header">
      <div class="sph-bg"/>
      <div class="sph-content">
        <div class="sph-user">
          <div class="sph-avatar">{{ currentUser?.name?.[0] || 'О' }}</div>
          <div class="sph-info">
            <div class="sph-badges">
              <span class="sph-badge student">Оқушы</span>
              <span class="sph-badge class-badge">{{ currentUser?.class }} сынып</span>
            </div>
            <h1 class="sph-name">{{ currentUser?.name }}</h1>
            <p class="sph-school">{{ currentUser?.school }}</p>
          </div>
        </div>
        <div class="sph-actions">
          <button class="btn-ghost" @click="doLogout">
            <i class="pi pi-sign-out"/> Шығу
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="sph-stats">
        <div class="sphs-item" v-for="s in headerStats" :key="s.label">
          <span class="sphs-val">{{ s.val }}</span>
          <span class="sphs-label">{{ s.label }}</span>
        </div>
      </div>
    </div>

    <!-- ── TABS ─────────────────────────────────────── -->
    <div class="sp-body">
      <div class="sp-tabs">
        <button
          v-for="tab in tabs" :key="tab.key"
          class="sp-tab" :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          <i :class="'pi ' + tab.icon"/>
          {{ tab.label }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="sp-loading">
        <div class="sp-spinner"/>
        <p>Деректер жүктелуде…</p>
      </div>

      <div v-else class="sp-tab-content">

        <!-- ──── TAB: МЕНІҢ НӘТИЖЕЛЕРІМ ──────────── -->
        <div v-if="activeTab === 'results'">

          <!-- Progress ring + avg -->
          <div class="results-overview">
            <div class="ro-ring-wrap">
              <svg viewBox="0 0 100 100" class="ro-ring">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(196,146,42,.15)" stroke-width="8"/>
                <circle cx="50" cy="50" r="42" fill="none"
                  :stroke="avgColor" stroke-width="8" stroke-linecap="round"
                  stroke-dasharray="263.9"
                  :stroke-dashoffset="263.9 - (263.9 * avgScore / 100)"
                  transform="rotate(-90 50 50)"
                  style="transition: stroke-dashoffset 1s ease"
                />
              </svg>
              <div class="ro-ring-center">
                <span class="ro-pct">{{ avgScore }}%</span>
                <span class="ro-lbl">Орт. балл</span>
              </div>
            </div>
            <div class="ro-summary">
              <h3 class="ro-title">Нәтижелерім</h3>
              <p class="ro-sub">{{ myResults.length }} тапсырма орындалды</p>
              <div class="ro-grade-row">
                <div v-for="g in gradeBreakdown" :key="g.label" class="ro-grade-item">
                  <div class="ro-gi-bar" :style="{ height: g.pct+'%', background: g.color }"/>
                  <span class="ro-gi-label">{{ g.label }}</span>
                  <span class="ro-gi-cnt">{{ g.count }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Results list -->
          <div class="results-cards">
            <div v-for="r in myResults" :key="r.taskName+r.date" class="result-card">
              <div class="rc-left">
                <div class="rc-pct-ring">
                  <svg viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(196,146,42,.15)" stroke-width="4"/>
                    <circle cx="24" cy="24" r="18" fill="none"
                      :stroke="pctColor(r.pct)" stroke-width="4" stroke-linecap="round"
                      :stroke-dasharray="113.1"
                      :stroke-dashoffset="113.1 - (113.1 * r.pct / 100)"
                      transform="rotate(-90 24 24)"
                    />
                  </svg>
                  <span class="rc-pct-num">{{ r.pct }}%</span>
                </div>
              </div>
              <div class="rc-body">
                <h4 class="rc-task">{{ r.taskName }}</h4>
                <div class="rc-meta">
                  <span><i class="pi pi-check-circle" style="color:#3a5c3a"/> {{ r.correct }} / {{ r.total }} дұрыс</span>
                  <span><i class="pi pi-calendar"/> {{ r.date }}</span>
                </div>
                <span class="rc-grade" :class="gradeClass(r.grade)">{{ r.grade }}</span>
              </div>
              <div class="rc-note" v-if="r.note">{{ r.note }}</div>
            </div>

            <div v-if="!myResults.length" class="sp-empty">
              <i class="pi pi-list"/><p>Нәтиже жоқ</p>
            </div>
          </div>
        </div>

        <!-- ──── TAB: МЕНІҢ ПІКІРЛЕРІМ ───────────── -->
        <div v-else-if="activeTab === 'comments'">

          <!-- Add comment form -->
          <div class="add-comment-card">
            <h3 class="acc-title">Пікір жазу</h3>
            <div class="acc-lesson-sel">
              <label>Сабақ таңдаңыз:</label>
              <select v-model="newComment.lessonName" class="acc-select">
                <option value="">— Таңдаңыз —</option>
                <option v-for="l in lessonOptions" :key="l" :value="l">{{ l }}</option>
              </select>
            </div>
            <div class="acc-stars-row">
              <label>Бағалау:</label>
              <div class="acc-stars">
                <span v-for="i in 5" :key="i" class="acc-star"
                  :class="{ on: i <= newComment.rating }" @click="newComment.rating = i">★</span>
              </div>
            </div>
            <textarea v-model="newComment.text" class="acc-ta" placeholder="Пікіріңізді жазыңыз…" rows="3"/>
            <button class="btn-gold" @click="submitComment" :disabled="!newComment.lessonName || !newComment.text.trim()">
              <i class="pi pi-send"/> Жіберу
            </button>
          </div>

          <!-- My comments list -->
          <div class="my-comments">
            <div v-for="c in myComments" :key="c.lessonName+c.date" class="my-comment-card">
              <div class="mcc-header">
                <span class="mcc-lesson">{{ c.lessonName }}</span>
                <span class="mcc-date">{{ c.date }}</span>
                <div class="mcc-stars">
                  <span v-for="i in 5" :key="i" class="mcc-star" :class="{ on: i <= c.rating }">★</span>
                </div>
              </div>
              <p class="mcc-text">{{ c.text }}</p>
              <div v-if="c.reply" class="mcc-reply">
                <div class="mcc-reply-label">
                  <i class="pi pi-reply"/> Мұғалім жауабы:
                </div>
                <p class="mcc-reply-text">{{ c.reply }}</p>
                <span class="mcc-reply-date">{{ c.replyDate }}</span>
              </div>
              <div v-else class="mcc-pending">
                <i class="pi pi-clock"/> Мұғалім жауабы күтілуде…
              </div>
            </div>

            <div v-if="!myComments.length" class="sp-empty">
              <i class="pi pi-comments"/><p>Пікір жоқ</p>
            </div>
          </div>
        </div>

        <!-- ──── TAB: ПРОФИЛЬ ─────────────────────── -->
        <div v-else-if="activeTab === 'profile'">
          <div class="profile-info-card">
            <div class="pic-rows">
              <div class="pic-row">
                <span class="pic-label"><i class="pi pi-user"/> Толық аты</span>
                <span class="pic-val">{{ currentUser?.name }}</span>
              </div>
              <div class="pic-row">
                <span class="pic-label"><i class="pi pi-envelope"/> Логин</span>
                <span class="pic-val">{{ currentUser?.login }}</span>
              </div>
              <div class="pic-row">
                <span class="pic-label"><i class="pi pi-users"/> Сынып</span>
                <span class="pic-val">{{ currentUser?.class }}</span>
              </div>
              <div class="pic-row">
                <span class="pic-label"><i class="pi pi-building"/> Мектеп</span>
                <span class="pic-val">{{ currentUser?.school }}</span>
              </div>
              <div class="pic-row">
                <span class="pic-label"><i class="pi pi-tag"/> Рөл</span>
                <span class="pic-val">Оқушы</span>
              </div>
            </div>
            <p class="pic-note">
              <i class="pi pi-info-circle"/>
              Мәліметтерді өзгерту үшін мұғалімге хабарласыңыз.
              Деректер <strong>Auth_MB.xlsx</strong> файлында сақталады.
            </p>
          </div>
        </div>

      </div><!-- end tab-content -->
    </div><!-- end sp-body -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth }   from '@/composables/useAuth'

const router = useRouter()
const { currentUser, logout, loadResults, loadComments } = useAuth()

const loading    = ref(true)
const activeTab  = ref('results')
const myResults  = ref([])
const myComments = ref([])

const newComment = reactive({ lessonName: '', rating: 5, text: '' })

const tabs = [
  { key: 'results',  label: 'Нәтижелерім', icon: 'pi-chart-bar'  },
  { key: 'comments', label: 'Пікірлерім',  icon: 'pi-comments'   },
  { key: 'profile',  label: 'Профиль',     icon: 'pi-user'        },
]

// Fixed lesson options (in real app — load from Sabaqtar_MB.xlsx)
const lessonOptions = [
  'Абай өмірі мен шығармашылығы',
  'Мұқағали лирикасы — конспект',
  '«Абай жолы» эпопеясы',
  'Қазақ эпостары',
  'Шығарма талдау — видео',
]

onMounted(async () => {
  try {
    const [res, com] = await Promise.all([
      loadResults(currentUser.value?.id),
      loadComments(),
    ])
    myResults.value  = res
    myComments.value = com.filter(c => c.studentId === currentUser.value?.id)
  } catch(e) { console.error(e) }
  finally { loading.value = false }
})

// ── Computed ──────────────────────────────────────────
const avgScore = computed(() => {
  if (!myResults.value.length) return 0
  return Math.round(myResults.value.reduce((s,r) => s+r.pct, 0) / myResults.value.length)
})
const avgColor = computed(() => avgScore.value >= 80 ? '#3a5c3a' : avgScore.value >= 50 ? '#c4922a' : '#8b3a1e')

const headerStats = computed(() => [
  { val: myResults.value.length,  label: 'Тапсырма'  },
  { val: avgScore.value + '%',    label: 'Орт. балл' },
  { val: myComments.value.length, label: 'Пікір'     },
  { val: currentUser.value?.class || '—', label: 'Сынып' },
])

const gradeBreakdown = computed(() => {
  const defs = [
    { label:'Өте жақсы', key:'Өте жақсы', color:'#3a5c3a' },
    { label:'Жақсы',     key:'Жақсы',     color:'#2a3a5c' },
    { label:'Қанағат.',  key:'Қанағат.',  color:'#c4922a' },
    { label:'Қайталаңыз',key:'Қайталаңыз',color:'#8b3a1e' },
  ]
  const total = myResults.value.length || 1
  return defs.map(d => ({
    ...d,
    count: myResults.value.filter(r => r.grade === d.key).length,
    pct:   Math.round(myResults.value.filter(r => r.grade === d.key).length / total * 100),
  }))
})

// ── Helpers ───────────────────────────────────────────
function pctColor(p) { return p >= 80 ? '#3a5c3a' : p >= 50 ? '#c4922a' : '#8b3a1e' }
function gradeClass(g) { return { 'Өте жақсы':'very-good', 'Жақсы':'good', 'Қанағат.':'mid', 'Қайталаңыз':'low' }[g] || '' }
function doLogout() { logout(); router.push({ name:'login' }) }
function submitComment() {
  if (!newComment.lessonName || !newComment.text.trim()) return
  myComments.value.unshift({
    studentId: currentUser.value?.id,
    studentName: currentUser.value?.name,
    class: currentUser.value?.class,
    lessonName: newComment.lessonName,
    rating: newComment.rating,
    text: newComment.text,
    date: new Date().toLocaleDateString('kk-KZ'),
    reply: '', replyDate: '',
  })
  newComment.text = ''; newComment.lessonName = ''; newComment.rating = 5
  alert('Пікір жіберілді! Auth_MB.xlsx → 💬 Пікірлер бетіне қолмен жазыңыз.')
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap');

.student-profile {
  --gold:#c4922a; --gold-l:#e8b94f; --rust:#8b3a1e; --sage:#3a5c3a;
  --navy:#2a3a5c; --dark:#1a1208; --border:#d9cdb8;
  background: #f4ede0; font-family: 'Source Serif 4', Georgia, serif;
  color: var(--dark); min-height: 100dvh;
}

/* ── Header ── */
.sp-header { position: relative; background: var(--dark); overflow: hidden; }
.sph-bg { position: absolute; inset: 0; background-image: radial-gradient(circle,rgba(196,146,42,.06) 1px,transparent 1px); background-size: 22px 22px; }
.sph-content { position: relative; z-index: 1; max-width: 1024px; margin: 0 auto; padding: 1.5rem 1.5rem .75rem; display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.sph-user { display: flex; align-items: center; gap: 1rem; }
.sph-avatar { width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg,var(--gold),var(--rust)); color: #fff; display: flex; align-items: center; justify-content: center; font-family: 'Playfair Display', serif; font-size: 1.75rem; font-weight: 900; flex-shrink: 0; border: 2px solid rgba(196,146,42,.4); }
.sph-badges { display: flex; gap: .4rem; margin-bottom: .4rem; }
.sph-badge { font-size: .6rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; padding: .18rem .55rem; border-radius: 1px; }
.sph-badge.student    { background: rgba(42,58,92,.6); color: #90caf9; }
.sph-badge.class-badge{ background: rgba(196,146,42,.2); color: var(--gold-l); }
.sph-name   { font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 900; color: #fff; margin: 0 0 .2rem; }
.sph-school { font-size: .72rem; color: rgba(255,255,255,.4); margin: 0; font-style: italic; }
.btn-ghost { display: inline-flex; align-items: center; gap: .45rem; background: transparent; border: 1.5px solid rgba(255,255,255,.2); color: rgba(255,255,255,.6); padding: .55rem 1.1rem; border-radius: 2px; font-family: 'Source Serif 4', serif; font-size: .82rem; cursor: pointer; transition: all .2s; }
.btn-ghost:hover { border-color: var(--rust); color: #ef9a9a; }

.sph-stats { position: relative; z-index: 1; max-width: 1024px; margin: 0 auto; padding: .85rem 1.5rem 1.25rem; display: flex; gap: 2rem; flex-wrap: wrap; }
.sphs-item { display: flex; flex-direction: column; }
.sphs-val  { font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 900; color: var(--gold-l); }
.sphs-label{ font-size: .65rem; color: rgba(255,255,255,.35); text-transform: uppercase; letter-spacing: .08em; }

/* ── Body ── */
.sp-body { max-width: 1024px; margin: 0 auto; padding: 1.5rem; }

.sp-tabs { display: flex; gap: 0; border-bottom: 2px solid var(--border); margin-bottom: 1.5rem; flex-wrap: wrap; }
.sp-tab  { display: flex; align-items: center; gap: .4rem; padding: .7rem 1.1rem; border: none; background: transparent; color: #9a8a72; font-family: 'Source Serif 4', serif; font-size: .82rem; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all .2s; white-space: nowrap; }
.sp-tab i { font-size: .78rem; }
.sp-tab:hover { color: var(--gold); }
.sp-tab.active { color: var(--gold); border-bottom-color: var(--gold); font-weight: 600; }

.sp-loading { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem; color: #9a8a72; }
.sp-spinner { width: 40px; height: 40px; border: 3px solid rgba(196,146,42,.18); border-top-color: var(--gold); border-radius: 50%; animation: spin .75s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Results overview */
.results-overview { display: flex; gap: 2rem; align-items: center; background: #fff; border: 1px solid var(--border); border-radius: 3px; padding: 1.5rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
.ro-ring-wrap { position: relative; width: 110px; height: 110px; flex-shrink: 0; }
.ro-ring { width: 100%; height: 100%; }
.ro-ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.ro-pct { font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 900; color: var(--dark); line-height: 1; }
.ro-lbl { font-size: .62rem; color: #9a8a72; text-transform: uppercase; letter-spacing: .08em; }
.ro-summary { flex: 1; }
.ro-title { font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 700; color: var(--dark); margin: 0 0 .25rem; }
.ro-sub   { font-size: .78rem; color: #9a8a72; margin: 0 0 1rem; font-style: italic; }
.ro-grade-row { display: flex; gap: .75rem; align-items: flex-end; }
.ro-grade-item { display: flex; flex-direction: column; align-items: center; gap: .25rem; flex: 1; max-width: 60px; }
.ro-gi-bar { width: 100%; border-radius: 2px 2px 0 0; min-height: 4px; transition: height .5s; }
.ro-gi-label { font-size: .6rem; color: #9a8a72; text-align: center; }
.ro-gi-cnt   { font-size: .72rem; font-weight: 700; color: var(--dark); }

/* Result cards */
.results-cards { display: flex; flex-direction: column; gap: .75rem; }
.result-card { background: #fff; border: 1px solid var(--border); border-radius: 3px; padding: .9rem 1.1rem; display: flex; align-items: center; gap: 1rem; transition: box-shadow .2s; }
.result-card:hover { box-shadow: 0 4px 20px rgba(26,18,8,.08); }
.rc-left { flex-shrink: 0; }
.rc-pct-ring { position: relative; width: 48px; height: 48px; }
.rc-pct-ring svg { width: 100%; height: 100%; }
.rc-pct-num { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: .62rem; font-weight: 700; color: var(--dark); }
.rc-body { flex: 1; }
.rc-task { font-family: 'Playfair Display', serif; font-size: .9rem; font-weight: 700; color: var(--dark); margin: 0 0 .3rem; }
.rc-meta { display: flex; flex-wrap: wrap; gap: .65rem; font-size: .72rem; color: #9a8a72; margin-bottom: .35rem; }
.rc-meta i { font-size: .68rem; margin-right: .2rem; }
.rc-grade { font-size: .65rem; font-weight: 700; padding: .12rem .45rem; border-radius: 1px; }
.rc-grade.very-good { background: rgba(46,125,50,.1);  color: #2e7d32; }
.rc-grade.good      { background: rgba(21,101,192,.1); color: #1565c0; }
.rc-grade.mid       { background: rgba(230,81,0,.1);   color: #e65100; }
.rc-grade.low       { background: rgba(183,28,28,.1);  color: #b71c1c; }
.rc-note { font-size: .72rem; color: var(--rust); font-style: italic; margin-left: auto; max-width: 150px; text-align: right; }

/* Comments */
.add-comment-card { background: #fff; border: 1px solid var(--border); border-top: 3px solid var(--gold); border-radius: 3px; padding: 1.25rem; margin-bottom: 1.25rem; }
.acc-title { font-family: 'Playfair Display', serif; font-size: 1rem; font-weight: 700; color: var(--dark); margin: 0 0 .85rem; }
.acc-lesson-sel { display: flex; flex-direction: column; gap: .3rem; margin-bottom: .75rem; }
.acc-lesson-sel label { font-size: .7rem; font-weight: 700; color: #9a8a72; text-transform: uppercase; letter-spacing: .07em; }
.acc-select { width: 100%; border: 1.5px solid var(--border); border-radius: 2px; background: #fdf9f4; padding: .52rem .75rem; font-family: 'Source Serif 4', serif; font-size: .85rem; color: var(--dark); outline: none; }
.acc-stars-row { display: flex; align-items: center; gap: .75rem; margin-bottom: .75rem; }
.acc-stars-row label { font-size: .7rem; font-weight: 700; color: #9a8a72; text-transform: uppercase; letter-spacing: .07em; }
.acc-stars { display: flex; gap: .3rem; }
.acc-star   { font-size: 1.4rem; color: #d9cdb8; cursor: pointer; transition: color .15s; }
.acc-star.on{ color: var(--gold); }
.acc-ta { width: 100%; border: 1.5px solid var(--border); border-radius: 2px; padding: .65rem .75rem; font-family: 'Source Serif 4', serif; font-size: .85rem; color: var(--dark); background: #fdf9f4; resize: vertical; outline: none; transition: border-color .2s; display: block; margin-bottom: .75rem; }
.acc-ta:focus { border-color: var(--gold); }
.acc-ta::placeholder { color: #b0a090; font-style: italic; }

.my-comments { display: flex; flex-direction: column; gap: .75rem; }
.my-comment-card { background: #fff; border: 1px solid var(--border); border-radius: 3px; padding: 1rem 1.1rem; }
.mcc-header { display: flex; align-items: center; gap: .65rem; margin-bottom: .5rem; flex-wrap: wrap; }
.mcc-lesson { font-size: .78rem; font-weight: 700; color: var(--dark); flex: 1; }
.mcc-date   { font-size: .65rem; color: #b0a090; }
.mcc-stars  { display: flex; gap: .1rem; }
.mcc-star   { font-size: .72rem; color: #d9cdb8; }
.mcc-star.on{ color: var(--gold); }
.mcc-text   { font-size: .82rem; color: #3a2a15; line-height: 1.6; margin: 0 0 .6rem; }
.mcc-reply  { background: rgba(58,92,58,.05); border: 1px solid rgba(58,92,58,.2); border-radius: 2px; padding: .6rem .85rem; }
.mcc-reply-label { font-size: .65rem; font-weight: 700; color: var(--sage); margin-bottom: .3rem; display: flex; align-items: center; gap: .3rem; }
.mcc-reply-text  { font-size: .8rem; color: #3a5c3a; margin: 0 0 .25rem; }
.mcc-reply-date  { font-size: .62rem; color: #9a8a72; }
.mcc-pending { font-size: .72rem; color: #b0a090; font-style: italic; display: flex; align-items: center; gap: .35rem; }
.mcc-pending i { color: var(--gold); }

/* Profile info card */
.profile-info-card { background: #fff; border: 1px solid var(--border); border-radius: 3px; padding: 1.5rem; }
.pic-rows { display: flex; flex-direction: column; gap: 0; margin-bottom: 1rem; }
.pic-row  { display: flex; justify-content: space-between; padding: .55rem 0; border-bottom: 1px solid rgba(217,205,184,.5); }
.pic-row:last-child { border-bottom: none; }
.pic-label { font-size: .78rem; color: #9a8a72; display: flex; align-items: center; gap: .35rem; }
.pic-label i { font-size: .7rem; color: var(--gold); }
.pic-val   { font-size: .82rem; font-weight: 600; color: var(--dark); }
.pic-note  { font-size: .75rem; color: #9a8a72; font-style: italic; background: rgba(196,146,42,.06); border: 1px solid rgba(196,146,42,.2); padding: .65rem .85rem; border-radius: 2px; margin: 0; display: flex; align-items: flex-start; gap: .4rem; }
.pic-note i { color: var(--gold); flex-shrink: 0; margin-top: .1rem; }
.pic-note strong { color: var(--dark); font-style: normal; }

/* Empty state */
.sp-empty { display: flex; flex-direction: column; align-items: center; gap: .6rem; padding: 4rem; color: #9a8a72; font-style: italic; }
.sp-empty i { font-size: 2rem; color: var(--border); }
.sp-empty p { margin: 0; }

/* Buttons */
.btn-gold { display: inline-flex; align-items: center; gap: .45rem; background: var(--gold); color: #fff; border: none; padding: .6rem 1.35rem; border-radius: 2px; font-family: 'Source Serif 4', serif; font-size: .85rem; font-weight: 700; cursor: pointer; transition: background .2s; }
.btn-gold:hover:not(:disabled) { background: var(--gold-l); }
.btn-gold:disabled { opacity: .45; cursor: not-allowed; }
</style>
