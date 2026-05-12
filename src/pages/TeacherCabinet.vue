<template>
  <div class="teacher-cabinet">

    <!-- ══ SIDEBAR ══════════════════════════════════════ -->
    <aside class="tc-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <div class="sb-avatar">{{ currentUser?.name?.[0] || 'М' }}</div>
        <div v-if="!sidebarCollapsed" class="sb-info">
          <span class="sb-name">{{ currentUser?.name }}</span>
          <span class="sb-role">Мұғалім</span>
        </div>
        <button class="sb-collapse-btn" @click="sidebarCollapsed = !sidebarCollapsed">
          <i :class="sidebarCollapsed ? 'pi pi-chevron-right' : 'pi pi-chevron-left'"/>
        </button>
      </div>

      <nav class="sb-nav">
        <button
          v-for="item in navItems" :key="item.key"
          class="sb-nav-item" :class="{ active: activeSection === item.key }"
          @click="activeSection = item.key"
          :title="item.label"
        >
          <i :class="'pi ' + item.icon"/>
          <span v-if="!sidebarCollapsed">{{ item.label }}</span>
          <span v-if="!sidebarCollapsed && item.badge" class="nav-badge">{{ item.badge }}</span>
        </button>
      </nav>

      <div class="sb-footer">
        <button class="sb-logout" @click="doLogout" :title="'Шығу'">
          <i class="pi pi-sign-out"/>
          <span v-if="!sidebarCollapsed">Шығу</span>
        </button>
      </div>
    </aside>

    <!-- ══ MAIN ══════════════════════════════════════════ -->
    <main class="tc-main">

      <!-- Top bar -->
      <div class="tc-topbar">
        <div class="tb-left">
          <h1 class="tb-title">{{ currentNavItem?.label }}</h1>
          <span class="tb-sub">{{ currentUser?.school }}</span>
        </div>
        <div class="tb-right">
          <span class="tb-date">{{ today }}</span>
          <div class="tb-avatar">{{ currentUser?.name?.[0] || 'М' }}</div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="tc-loading">
        <div class="tc-spinner"/>
        <p>Деректер жүктелуде…</p>
      </div>

      <template v-else>

        <!-- ──────────────────────────────────────────── -->
        <!-- SECTION: DASHBOARD (Статистика)             -->
        <!-- ──────────────────────────────────────────── -->
        <div v-if="activeSection === 'dashboard'" class="section-wrap">

          <!-- Stat cards -->
          <div class="stat-cards">
            <div class="stat-card" v-for="s in dashStats" :key="s.label">
              <div class="sc-icon" :style="{ background: s.bg, color: s.color }">
                <i :class="'pi ' + s.icon"/>
              </div>
              <div>
                <span class="sc-val">{{ s.val }}</span>
                <span class="sc-label">{{ s.label }}</span>
              </div>
            </div>
          </div>

          <!-- Recent results table -->
          <div class="section-card">
            <div class="sc-head">
              <span><i class="pi pi-list"/> Соңғы нәтижелер</span>
            </div>
            <div class="results-table-wrap">
              <table class="results-table">
                <thead>
                  <tr>
                    <th>Оқушы</th><th>Сынып</th><th>Тапсырма</th>
                    <th>Балл</th><th>Деңгей</th><th>Күн</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in results.slice(0,8)" :key="r.studentId+r.taskName">
                    <td class="rt-name">{{ r.studentName }}</td>
                    <td>{{ r.class }}</td>
                    <td class="rt-task">{{ r.taskName }}</td>
                    <td>
                      <span class="pct-badge" :class="pctClass(r.pct)">{{ r.pct }}%</span>
                    </td>
                    <td><span class="grade-chip" :class="gradeClass(r.grade)">{{ r.grade }}</span></td>
                    <td class="rt-date">{{ r.date }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ──────────────────────────────────────────── -->
        <!-- SECTION: САБАҚТАР                          -->
        <!-- ──────────────────────────────────────────── -->
        <div v-else-if="activeSection === 'lessons'" class="section-wrap">
          <div class="section-actions">
            <button class="btn-gold" @click="$router.push({ name: 'add-lesson' })">
              <i class="pi pi-plus"/> Сабақ қосу
            </button>
          </div>

          <div class="lessons-grid">
            <div v-for="lesson in teacherLessons" :key="lesson.title" class="lesson-manage-card">
              <div class="lmc-top">
                <span class="lmc-type" :class="lesson.type">
                  <i :class="'pi ' + typeIcon(lesson.type)"/>
                  {{ lesson.type }}
                </span>
                <span class="lmc-status" :class="lesson.status === 'жарияланды' ? 'pub' : 'hid'">
                  {{ lesson.status }}
                </span>
              </div>
              <h3 class="lmc-title">{{ lesson.title }}</h3>
              <div class="lmc-meta">
                <span><i class="pi pi-tag"/> {{ lesson.topic }}</span>
                <span><i class="pi pi-chart-bar"/> {{ lesson.level }}</span>
                <span><i class="pi pi-users"/> {{ lesson.classes }}</span>
              </div>
              <div class="lmc-actions">
                <button class="lmc-btn edit"><i class="pi pi-pencil"/> Өзгерту</button>
                <button class="lmc-btn delete"><i class="pi pi-trash"/></button>
              </div>
            </div>

            <!-- Add placeholder -->
            <div class="lesson-add-card" @click="$router.push({ name: 'add-lesson' })">
              <i class="pi pi-plus"/>
              <span>Жаңа сабақ қосу</span>
            </div>
          </div>

          <!-- Add lesson dialog -->
          <Dialog v-model:visible="addLessonDialog" header="Жаңа сабақ қосу" :style="{ width:'560px', maxWidth:'95vw' }" modal>
            <div class="add-lesson-form">
              <div class="alf-field">
                <label>Сабақ атауы</label>
                <input v-model="newLesson.title" class="alf-input" placeholder="Сабақ атауын жазыңыз"/>
              </div>
              <div class="alf-row">
                <div class="alf-field">
                  <label>Тип</label>
                  <select v-model="newLesson.type" class="alf-select">
                    <option value="video">Видео</option>
                    <option value="text">Конспект</option>
                    <option value="pdf">PDF</option>
                  </select>
                </div>
                <div class="alf-field">
                  <label>Деңгей</label>
                  <select v-model="newLesson.level" class="alf-select">
                    <option>Оңай</option><option>Орташа</option><option>Жоғары</option>
                  </select>
                </div>
              </div>
              <div class="alf-field">
                <label>Тақырып</label>
                <input v-model="newLesson.topic" class="alf-input" placeholder="Классика, Поэзия…"/>
              </div>
              <div class="alf-field">
                <label>Файл жолы (fileUrl)</label>
                <input v-model="newLesson.fileUrl" class="alf-input" placeholder="/videos/lesson.mp4 немесе YouTube URL"/>
              </div>
              <div class="alf-field">
                <label>Сыныптар</label>
                <input v-model="newLesson.classes" class="alf-input" placeholder="8А,8Ә,8Б"/>
              </div>
              <p class="alf-hint">
                <i class="pi pi-info-circle"/> Сабақ деректері <strong>Sabaqtar_MB.xlsx</strong> файлына қолмен қосылады.
                Бұл форма Excel-ге жазу функциясының үлгісі.
              </p>
              <div class="alf-actions">
                <button class="btn-gold" @click="saveLesson">
                  <i class="pi pi-save"/> Excel-ге қосу (үлгі)
                </button>
                <button class="btn-outline" @click="addLessonDialog = false">Бас тарту</button>
              </div>
            </div>
          </Dialog>
        </div>

        <!-- ──────────────────────────────────────────── -->
        <!-- SECTION: ТЕСТТЕР                           -->
        <!-- ──────────────────────────────────────────── -->
        <div v-else-if="activeSection === 'tests'" class="section-wrap">
          <div class="section-actions">
            <button class="btn-gold" @click="$router.push('/interactive')">
              <i class="pi pi-external-link"/> Тест модуліне өту
            </button>
          </div>
          <div class="section-card">
            <div class="sc-head"><i class="pi pi-file-edit"/> Excel арқылы тест басқару</div>
            <div class="excel-info-block">
              <div class="eib-item">
                <div class="eib-icon"><i class="pi pi-file-excel"/></div>
                <div>
                  <span class="eib-title">Тапсырмалар_МБ.xlsx</span>
                  <span class="eib-desc">MCQ, Дұрыс/Бұрыс, Бос орын, Сәйкестендіру — Excel-де</span>
                </div>
                <a href="/data/Тапсырмалар_МБ.xlsx" download class="eib-dl">
                  <i class="pi pi-download"/> Жүктеу
                </a>
              </div>
              <div class="eib-item">
                <div class="eib-icon"><i class="pi pi-chart-bar"/></div>
                <div>
                  <span class="eib-title">Auth_MB.xlsx → 📊 Оқушы нәтижелері</span>
                  <span class="eib-desc">Барлық нәтижелер автоматты жиналады</span>
                </div>
                <a href="/data/Auth_MB.xlsx" download class="eib-dl">
                  <i class="pi pi-download"/> Жүктеу
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- ──────────────────────────────────────────── -->
        <!-- SECTION: НӘТИЖЕЛЕР                         -->
        <!-- ──────────────────────────────────────────── -->
        <div v-else-if="activeSection === 'results'" class="section-wrap">

          <!-- Filter -->
          <div class="filter-row">
            <div class="fr-search">
              <i class="pi pi-search"/>
              <input v-model="resultsSearch" type="text" placeholder="Оқушы немесе тапсырма іздеу…" class="fr-input"/>
            </div>
            <select v-model="resultsClass" class="fr-select">
              <option value="">Барлық сынып</option>
              <option>8А</option><option>8Ә</option><option>8Б</option>
            </select>
          </div>

          <!-- Table -->
          <div class="section-card">
            <div class="sc-head">
              <span><i class="pi pi-list"/> Барлық нәтижелер ({{ filteredResults.length }})</span>
              <button class="sc-export" @click="exportResults">
                <i class="pi pi-file-excel"/> Excel-ге жүктеу
              </button>
            </div>
            <div class="results-table-wrap">
              <table class="results-table">
                <thead>
                  <tr>
                    <th @click="sortBy('studentName')">Оқушы <i class="pi pi-sort-alt"/></th>
                    <th>Сынып</th>
                    <th>Тапсырма</th>
                    <th @click="sortBy('pct')">Балл % <i class="pi pi-sort-alt"/></th>
                    <th>Деңгей</th>
                    <th>Күн</th>
                    <th>Ескерту</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in filteredResults" :key="r.studentId+r.taskName+r.date">
                    <td class="rt-name">{{ r.studentName }}</td>
                    <td><span class="class-tag">{{ r.class }}</span></td>
                    <td class="rt-task">{{ r.taskName }}</td>
                    <td>
                      <div class="pct-bar-wrap">
                        <div class="pct-bar" :style="{ width: r.pct+'%', background: pctColor(r.pct) }"/>
                        <span class="pct-num">{{ r.pct }}%</span>
                      </div>
                    </td>
                    <td><span class="grade-chip" :class="gradeClass(r.grade)">{{ r.grade }}</span></td>
                    <td class="rt-date">{{ r.date }}</td>
                    <td class="rt-note">{{ r.note }}</td>
                  </tr>
                  <tr v-if="!filteredResults.length">
                    <td colspan="7" class="rt-empty">Нәтиже табылмады</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ──────────────────────────────────────────── -->
        <!-- SECTION: ПІКІРЛЕР                          -->
        <!-- ──────────────────────────────────────────── -->
        <div v-else-if="activeSection === 'comments'" class="section-wrap">
          <div class="section-card">
            <div class="sc-head"><i class="pi pi-comments"/> Оқушы пікірлері</div>
          </div>

          <div class="comments-list">
            <div v-for="c in comments" :key="c.studentId+c.date" class="comment-manage-card">
              <div class="cmc-header">
                <div class="cmc-ava">{{ c.studentName?.[0] || '?' }}</div>
                <div class="cmc-meta">
                  <span class="cmc-name">{{ c.studentName }}</span>
                  <span class="cmc-class">{{ c.class }}</span>
                  <span class="cmc-date">{{ c.date }}</span>
                </div>
                <div class="cmc-stars">
                  <span v-for="i in 5" :key="i" class="cmc-star" :class="{ on: i <= c.rating }">★</span>
                </div>
                <span class="cmc-lesson">{{ c.lessonName }}</span>
              </div>
              <p class="cmc-text">{{ c.text }}</p>

              <!-- Teacher reply -->
              <div v-if="c.reply" class="cmc-reply">
                <div class="reply-label"><i class="pi pi-reply"/> Мұғалім жауабы:</div>
                <p class="reply-text">{{ c.reply }}</p>
                <span class="reply-date">{{ c.replyDate }}</span>
              </div>

              <!-- Reply form -->
              <div v-else class="cmc-reply-form">
                <textarea
                  v-model="replyTexts[c.studentId + c.date]"
                  class="reply-ta"
                  placeholder="Жауап жазыңыз…"
                  rows="2"
                />
                <button class="btn-gold btn-sm" @click="sendReply(c)">
                  <i class="pi pi-send"/> Жіберу
                </button>
              </div>
            </div>

            <div v-if="!comments.length" class="empty-state">
              <i class="pi pi-comments"/>
              <p>Пікір жоқ</p>
            </div>
          </div>
        </div>

        <!-- ──────────────────────────────────────────── -->
        <!-- SECTION: ПРОФИЛЬ                           -->
        <!-- ──────────────────────────────────────────── -->
        <div v-else-if="activeSection === 'profile'" class="section-wrap">
          <div class="profile-grid">
            <div class="section-card profile-card">
              <div class="profile-hero">
                <div class="ph-avatar">{{ currentUser?.name?.[0] || 'М' }}</div>
                <div>
                  <h2 class="ph-name">{{ currentUser?.name }}</h2>
                  <span class="ph-role-badge teacher">Мұғалім</span>
                </div>
              </div>
              <div class="profile-rows">
                <div class="pr-row" v-for="(val,key) in teacherProfile" :key="key">
                  <span class="pr-key">{{ key }}</span>
                  <span class="pr-val">{{ val }}</span>
                </div>
                <div class="pr-row">
                  <span class="pr-key">Email / Логин</span>
                  <span class="pr-val">{{ currentUser?.login }}</span>
                </div>
                <div class="pr-row">
                  <span class="pr-key">Мектеп</span>
                  <span class="pr-val">{{ currentUser?.school }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </template>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth }   from '@/composables/useAuth'
import Dialog from 'primevue/dialog'

const router = useRouter()
const { currentUser, logout, loadResults, loadComments, loadTeacherProfile, loadTeacherLessons } = useAuth()

// ── State ─────────────────────────────────────────────
const loading          = ref(true)
const sidebarCollapsed = ref(false)
const activeSection    = ref('dashboard')
const results          = ref([])
const comments         = ref([])
const teacherProfile   = ref({})
const teacherLessons   = ref([])
const resultsSearch    = ref('')
const resultsClass     = ref('')
const addLessonDialog  = ref(false)
const replyTexts       = reactive({})
const sortField        = ref('date')
const sortDir          = ref(-1)

const newLesson = reactive({ title:'', type:'video', level:'Орташа', topic:'', fileUrl:'', classes:'8А,8Ә,8Б' })

const today = new Date().toLocaleDateString('kk-KZ', { weekday:'long', year:'numeric', month:'long', day:'numeric' })

// ── Nav items ─────────────────────────────────────────
const navItems = computed(() => [
  { key:'dashboard', label:'Басты бет',  icon:'pi-home'         },
  { key:'lessons',   label:'Сабақтар',   icon:'pi-book'         },
  { key:'tests',     label:'Тесттер',    icon:'pi-list-check'   },
  { key:'results',   label:'Нәтижелер',  icon:'pi-chart-bar', badge: results.value.length || null },
  { key:'comments',  label:'Пікірлер',   icon:'pi-comments',  badge: comments.value.filter(c=>!c.reply).length || null },
  { key:'profile',   label:'Профиль',    icon:'pi-user'         },
])
const currentNavItem = computed(() => navItems.value.find(n => n.key === activeSection.value))

// ── Load data ─────────────────────────────────────────
onMounted(async () => {
  try {
    const [res, com, prof, les] = await Promise.all([
      loadResults(),
      loadComments(),
      loadTeacherProfile(currentUser.value?.id),
      loadTeacherLessons(currentUser.value?.id),
    ])
    results.value       = res
    comments.value      = com
    teacherProfile.value= prof
    teacherLessons.value= les
  } catch(e) { console.error(e) }
  finally { loading.value = false }
})

// ── Dashboard stats ───────────────────────────────────
const dashStats = computed(() => {
  const avg = results.value.length
    ? Math.round(results.value.reduce((s,r)=>s+r.pct,0)/results.value.length)
    : 0
  return [
    { label:'Барлық нәтиже',  val: results.value.length,                         icon:'pi-list',     bg:'rgba(196,146,42,.1)',  color:'#c4922a' },
    { label:'Орташа балл',    val: avg+'%',                                       icon:'pi-chart-bar',bg:'rgba(58,92,58,.1)',    color:'#3a5c3a' },
    { label:'Жарияланды',     val: teacherLessons.value.filter(l=>l.status==='жарияланды').length, icon:'pi-book', bg:'rgba(42,58,92,.1)', color:'#2a3a5c' },
    { label:'Жауапсыз пікір', val: comments.value.filter(c=>!c.reply).length,    icon:'pi-comments', bg:'rgba(139,58,30,.1)',   color:'#8b3a1e' },
  ]
})

// ── Filtered results ──────────────────────────────────
const filteredResults = computed(() => {
  let list = [...results.value]
  if (resultsClass.value) list = list.filter(r => r.class === resultsClass.value)
  if (resultsSearch.value) {
    const q = resultsSearch.value.toLowerCase()
    list = list.filter(r => r.studentName.toLowerCase().includes(q) || r.taskName.toLowerCase().includes(q))
  }
  return list.sort((a,b) => sortDir.value * String(a[sortField.value]).localeCompare(String(b[sortField.value])))
})

function sortBy(field) {
  if (sortField.value === field) sortDir.value *= -1
  else { sortField.value = field; sortDir.value = 1 }
}

// ── Helpers ───────────────────────────────────────────
function typeIcon(t)  { return { video:'pi-play-circle', text:'pi-file-edit', pdf:'pi-file-pdf' }[t] || 'pi-book' }
function pctClass(p)  { return p >= 80 ? 'good' : p >= 50 ? 'mid' : 'low' }
function pctColor(p)  { return p >= 80 ? '#3a5c3a' : p >= 50 ? '#c4922a' : '#8b3a1e' }
function gradeClass(g){ return { 'Өте жақсы':'very-good', 'Жақсы':'good', 'Қанағат.':'mid', 'Қайталаңыз':'low' }[g] || '' }

function doLogout() { logout(); router.push({ name:'login' }) }
function saveLesson() { addLessonDialog.value = false; alert('Excel-ге қосу: Sabaqtar_MB.xlsx файлына қолмен енгізіңіз.') }
function exportResults() { alert('Нәтижелер Auth_MB.xlsx → 📊 Оқушы нәтижелері бетінде.') }
function sendReply(c) {
  const key  = c.studentId + c.date
  const text = replyTexts[key]?.trim()
  if (!text) return
  c.reply     = text
  c.replyDate = new Date().toLocaleDateString('kk-KZ')
  delete replyTexts[key]
  alert('Жауап тіркелді. Excel-ге қолмен жазыңыз: Auth_MB.xlsx → 💬 Пікірлер')
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap');

.teacher-cabinet {
  display: flex; min-height: 100dvh;
  background: #f4ede0;
  font-family: 'Source Serif 4', Georgia, serif;
  --gold:#c4922a; --gold-l:#e8b94f; --rust:#8b3a1e; --sage:#3a5c3a;
  --navy:#2a3a5c; --dark:#1a1208; --border:#d9cdb8;
}

/* ── SIDEBAR ── */
.tc-sidebar {
  width: 240px; flex-shrink: 0;
  background: #1a1208;
  border-right: 1px solid rgba(196,146,42,.2);
  display: flex; flex-direction: column;
  transition: width .3s ease;
  position: sticky; top: 0; height: 100dvh; overflow: hidden;
}
.tc-sidebar.collapsed { width: 64px; }

.sidebar-header {
  display: flex; align-items: center; gap: .65rem;
  padding: 1.1rem .85rem;
  border-bottom: 1px solid rgba(196,146,42,.15);
  min-height: 72px;
}
.sb-avatar {
  width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg,var(--gold),var(--rust));
  color: #fff; display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 1rem;
}
.sb-info   { flex: 1; min-width: 0; }
.sb-name   { display: block; font-size: .82rem; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sb-role   { display: block; font-size: .65rem; color: var(--gold); text-transform: uppercase; letter-spacing: .08em; }
.sb-collapse-btn { background: none; border: none; color: rgba(255,255,255,.35); cursor: pointer; padding: 0; font-size: .75rem; flex-shrink: 0; transition: color .2s; }
.sb-collapse-btn:hover { color: var(--gold); }

.sb-nav { flex: 1; padding: .75rem 0; display: flex; flex-direction: column; gap: .1rem; overflow-y: auto; }
.sb-nav-item {
  display: flex; align-items: center; gap: .7rem;
  padding: .65rem .85rem; background: none; border: none;
  color: rgba(255,255,255,.5); font-family: 'Source Serif 4', serif;
  font-size: .82rem; cursor: pointer; text-align: left;
  border-left: 2px solid transparent; transition: all .18s; white-space: nowrap;
}
.sb-nav-item i { font-size: .9rem; flex-shrink: 0; }
.sb-nav-item:hover { color: rgba(255,255,255,.85); background: rgba(255,255,255,.05); }
.sb-nav-item.active { color: var(--gold); border-left-color: var(--gold); background: rgba(196,146,42,.08); }
.nav-badge {
  margin-left: auto; background: var(--rust); color: #fff;
  font-size: .6rem; font-weight: 700; padding: .1rem .42rem; border-radius: 10px;
}

.sb-footer { padding: .75rem; border-top: 1px solid rgba(196,146,42,.15); }
.sb-logout {
  display: flex; align-items: center; gap: .6rem; width: 100%;
  padding: .55rem .75rem; background: none; border: none;
  color: rgba(255,255,255,.35); font-family: 'Source Serif 4', serif;
  font-size: .8rem; cursor: pointer; border-radius: 2px; transition: all .2s;
}
.sb-logout:hover { color: var(--rust); background: rgba(139,58,30,.1); }

/* ── MAIN ── */
.tc-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }

.tc-topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1rem 1.75rem; background: #fff;
  border-bottom: 2px solid var(--gold); flex-wrap: wrap; gap: .5rem;
}
.tb-title { font-family: 'Playfair Display', serif; font-size: 1.35rem; font-weight: 900; color: var(--dark); margin: 0; }
.tb-sub   { font-size: .72rem; color: #9a8a72; display: block; font-style: italic; }
.tb-right { display: flex; align-items: center; gap: .75rem; }
.tb-date  { font-size: .72rem; color: #9a8a72; }
.tb-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: linear-gradient(135deg,var(--gold),var(--rust));
  color: #fff; display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: .85rem;
}

.tc-loading { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 5rem 2rem; color: #9a8a72; }
.tc-spinner { width: 40px; height: 40px; border: 3px solid rgba(196,146,42,.18); border-top-color: var(--gold); border-radius: 50%; animation: spin .75s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.section-wrap { padding: 1.5rem 1.75rem; display: flex; flex-direction: column; gap: 1.25rem; }

/* Stat cards */
.stat-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px,1fr)); gap: 1rem; }
.stat-card {
  background: #fff; border: 1px solid var(--border); border-radius: 3px;
  padding: 1.1rem 1.25rem; display: flex; align-items: center; gap: 1rem;
  box-shadow: 0 2px 12px rgba(26,18,8,.06);
}
.sc-icon { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; }
.sc-val  { display: block; font-family: 'Playfair Display', serif; font-size: 1.6rem; font-weight: 900; color: var(--dark); line-height: 1; }
.sc-label{ display: block; font-size: .7rem; color: #9a8a72; margin-top: .2rem; }

/* Section card */
.section-card { background: #fff; border: 1px solid var(--border); border-radius: 3px; overflow: hidden; }
.sc-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: .75rem 1.1rem; border-bottom: 1px solid var(--border);
  font-size: .72rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
  color: #9a8a72; background: #faf6ef;
}
.sc-head i { color: var(--gold); margin-right: .4rem; }
.sc-export { display: inline-flex; align-items: center; gap: .35rem; font-size: .72rem; color: var(--sage); background: none; border: 1px solid rgba(58,92,58,.3); padding: .2rem .6rem; border-radius: 1px; cursor: pointer; }

/* Table */
.results-table-wrap { overflow-x: auto; }
.results-table { width: 100%; border-collapse: collapse; font-size: .8rem; }
.results-table th { padding: .55rem .85rem; text-align: left; background: #faf6ef; border-bottom: 2px solid var(--border); color: #9a8a72; font-size: .68rem; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; cursor: pointer; white-space: nowrap; }
.results-table th i { font-size: .6rem; margin-left: .2rem; }
.results-table td { padding: .5rem .85rem; border-bottom: 1px solid rgba(217,205,184,.5); color: var(--dark); vertical-align: middle; }
.results-table tr:last-child td { border-bottom: none; }
.results-table tr:hover td { background: #fdf8f0; }
.rt-name  { font-weight: 600; }
.rt-task  { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #5a4a35; }
.rt-date  { font-size: .7rem; color: #b0a090; white-space: nowrap; }
.rt-note  { font-size: .7rem; color: #9a8a72; font-style: italic; }
.rt-empty { text-align: center; padding: 2rem; color: #9a8a72; font-style: italic; }
.class-tag { background: rgba(42,58,92,.1); color: var(--navy); font-size: .68rem; font-weight: 700; padding: .12rem .42rem; border-radius: 1px; }

.pct-badge { font-size: .72rem; font-weight: 700; padding: .15rem .5rem; border-radius: 1px; }
.pct-badge.good { background: rgba(58,92,58,.1); color: var(--sage); }
.pct-badge.mid  { background: rgba(196,146,42,.1); color: var(--gold); }
.pct-badge.low  { background: rgba(139,58,30,.1); color: var(--rust); }

.pct-bar-wrap { display: flex; align-items: center; gap: .5rem; min-width: 90px; }
.pct-bar      { height: 5px; border-radius: 3px; transition: width .4s; }
.pct-num      { font-size: .72rem; font-weight: 600; color: var(--dark); }

.grade-chip { font-size: .65rem; font-weight: 700; padding: .12rem .45rem; border-radius: 1px; }
.grade-chip.very-good { background: rgba(46,125,50,.1); color: #2e7d32; }
.grade-chip.good      { background: rgba(21,101,192,.1); color: #1565c0; }
.grade-chip.mid       { background: rgba(230,81,0,.1);   color: #e65100; }
.grade-chip.low       { background: rgba(183,28,28,.1);  color: #b71c1c; }

/* Lessons grid */
.section-actions { display: flex; gap: .75rem; flex-wrap: wrap; }
.lessons-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px,1fr)); gap: 1rem; }
.lesson-manage-card {
  background: #fff; border: 1px solid var(--border); border-radius: 3px; padding: 1.1rem;
  display: flex; flex-direction: column; gap: .5rem; transition: box-shadow .2s;
}
.lesson-manage-card:hover { box-shadow: 0 4px 20px rgba(26,18,8,.1); }
.lmc-top    { display: flex; justify-content: space-between; align-items: center; }
.lmc-type   { display: inline-flex; align-items: center; gap: .3rem; font-size: .62rem; font-weight: 700; text-transform: uppercase; padding: .18rem .5rem; border-radius: 1px; color: #fff; }
.lmc-type.video { background: var(--rust); } .lmc-type.text { background: var(--sage); } .lmc-type.pdf { background: var(--navy); }
.lmc-status { font-size: .62rem; font-weight: 700; padding: .12rem .42rem; border-radius: 1px; }
.lmc-status.pub { background: rgba(58,92,58,.1); color: var(--sage); }
.lmc-status.hid { background: rgba(196,146,42,.1); color: var(--gold); }
.lmc-title { font-family: 'Playfair Display', serif; font-size: .92rem; font-weight: 700; color: var(--dark); margin: 0; line-height: 1.3; }
.lmc-meta  { display: flex; flex-direction: column; gap: .2rem; font-size: .7rem; color: #9a8a72; }
.lmc-meta i{ color: var(--gold); margin-right: .25rem; font-size: .65rem; }
.lmc-actions { display: flex; gap: .4rem; margin-top: .25rem; }
.lmc-btn { display: inline-flex; align-items: center; gap: .3rem; font-size: .72rem; border: 1px solid var(--border); border-radius: 1px; background: transparent; cursor: pointer; padding: .3rem .65rem; transition: all .2s; }
.lmc-btn.edit:hover   { border-color: var(--gold); color: var(--gold); }
.lmc-btn.delete:hover { border-color: var(--rust); color: var(--rust); }

.lesson-add-card {
  background: transparent; border: 1.5px dashed var(--border); border-radius: 3px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: .5rem; padding: 2rem; color: #b0a090; cursor: pointer; transition: all .2s; min-height: 160px;
}
.lesson-add-card:hover { border-color: var(--gold); color: var(--gold); background: rgba(196,146,42,.04); }
.lesson-add-card i { font-size: 1.5rem; }

/* Filter row */
.filter-row { display: flex; gap: .6rem; flex-wrap: wrap; }
.fr-search { display: flex; align-items: center; gap: .5rem; flex: 1; min-width: 200px; background: #fff; border: 1.5px solid var(--border); border-radius: 2px; padding: .45rem .75rem; }
.fr-search i { color: #b0a090; font-size: .8rem; }
.fr-input  { flex: 1; border: none; outline: none; font-family: 'Source Serif 4', serif; font-size: .82rem; color: var(--dark); }
.fr-input::placeholder { color: #b0a090; font-style: italic; }
.fr-select { border: 1.5px solid var(--border); border-radius: 2px; background: #fff; padding: .45rem .75rem; font-family: 'Source Serif 4', serif; font-size: .82rem; color: var(--dark); outline: none; cursor: pointer; }

/* Comments */
.comments-list { display: flex; flex-direction: column; gap: .85rem; }
.comment-manage-card { background: #fff; border: 1px solid var(--border); border-radius: 3px; padding: 1.1rem; }
.cmc-header { display: flex; align-items: center; gap: .75rem; margin-bottom: .75rem; flex-wrap: wrap; }
.cmc-ava    { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg,var(--gold),var(--rust)); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: .85rem; flex-shrink: 0; }
.cmc-meta   { display: flex; flex-direction: column; }
.cmc-name   { font-size: .85rem; font-weight: 700; color: var(--dark); }
.cmc-class  { font-size: .65rem; color: var(--navy); font-weight: 700; }
.cmc-date   { font-size: .65rem; color: #b0a090; }
.cmc-stars  { display: flex; gap: .1rem; }
.cmc-star   { font-size: .75rem; color: #d9cdb8; }
.cmc-star.on{ color: var(--gold); }
.cmc-lesson { font-size: .7rem; color: #9a8a72; font-style: italic; margin-left: auto; }
.cmc-text   { font-size: .85rem; color: #3a2a15; line-height: 1.65; margin: 0 0 .75rem; }
.cmc-reply  { background: rgba(58,92,58,.05); border: 1px solid rgba(58,92,58,.2); border-radius: 2px; padding: .65rem .9rem; }
.reply-label{ font-size: .65rem; font-weight: 700; color: var(--sage); text-transform: uppercase; letter-spacing: .08em; margin-bottom: .35rem; display: flex; align-items: center; gap: .3rem; }
.reply-text { font-size: .82rem; color: #3a5c3a; margin: 0 0 .3rem; }
.reply-date { font-size: .65rem; color: #9a8a72; }
.cmc-reply-form { display: flex; flex-direction: column; gap: .5rem; }
.reply-ta { width: 100%; border: 1.5px solid var(--border); border-radius: 2px; padding: .6rem .75rem; font-family: 'Source Serif 4', serif; font-size: .82rem; color: var(--dark); resize: vertical; outline: none; background: #fdf9f4; transition: border-color .2s; }
.reply-ta:focus { border-color: var(--sage); }
.reply-ta::placeholder { color: #b0a090; font-style: italic; }

/* Profile */
.profile-grid { display: grid; grid-template-columns: minmax(0,1fr); gap: 1.25rem; }
.profile-card { padding: 1.5rem !important; }
.profile-hero { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem; padding-bottom: 1.25rem; border-bottom: 1px solid var(--border); }
.ph-avatar { width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg,var(--gold),var(--rust)); color: #fff; display: flex; align-items: center; justify-content: center; font-family: 'Playfair Display', serif; font-size: 1.75rem; font-weight: 900; flex-shrink: 0; }
.ph-name { font-family: 'Playfair Display', serif; font-size: 1.3rem; font-weight: 900; color: var(--dark); margin: 0 0 .35rem; }
.ph-role-badge { display: inline-block; font-size: .65rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; padding: .2rem .65rem; border-radius: 1px; }
.ph-role-badge.teacher { background: rgba(58,92,58,.1); color: var(--sage); border: 1px solid rgba(58,92,58,.3); }
.profile-rows { display: flex; flex-direction: column; gap: 0; }
.pr-row { display: flex; justify-content: space-between; padding: .52rem 0; border-bottom: 1px solid rgba(217,205,184,.5); }
.pr-row:last-child { border-bottom: none; }
.pr-key { font-size: .78rem; color: #9a8a72; }
.pr-val { font-size: .82rem; font-weight: 600; color: var(--dark); text-align: right; max-width: 60%; }

/* Buttons */
.btn-gold { display: inline-flex; align-items: center; gap: .45rem; background: var(--gold); color: #fff; border: none; padding: .6rem 1.35rem; border-radius: 2px; font-family: 'Source Serif 4', serif; font-size: .85rem; font-weight: 700; cursor: pointer; transition: background .2s; }
.btn-gold:hover { background: var(--gold-l); }
.btn-gold.btn-sm { padding: .42rem .9rem; font-size: .78rem; }
.btn-outline { display: inline-flex; align-items: center; gap: .45rem; background: transparent; border: 1.5px solid var(--border); color: var(--dark); padding: .6rem 1.35rem; border-radius: 2px; font-family: 'Source Serif 4', serif; font-size: .85rem; cursor: pointer; transition: all .2s; }
.btn-outline:hover { border-color: var(--gold); color: var(--gold); }

/* Excel info block */
.excel-info-block { padding: 1rem; display: flex; flex-direction: column; gap: .75rem; }
.eib-item { display: flex; align-items: center; gap: .85rem; padding: .75rem; background: #fdf8f0; border: 1px solid var(--border); border-radius: 2px; }
.eib-icon { width: 40px; height: 40px; border-radius: 2px; background: rgba(58,92,58,.1); color: var(--sage); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; }
.eib-title { display: block; font-size: .82rem; font-weight: 700; color: var(--dark); margin-bottom: .15rem; font-family: monospace; }
.eib-desc  { display: block; font-size: .72rem; color: #9a8a72; }
.eib-dl { margin-left: auto; display: inline-flex; align-items: center; gap: .35rem; font-size: .75rem; color: var(--sage); text-decoration: none; border: 1px solid rgba(58,92,58,.3); padding: .28rem .65rem; border-radius: 1px; white-space: nowrap; flex-shrink: 0; transition: all .2s; }
.eib-dl:hover { background: rgba(58,92,58,.08); }

/* Add lesson form */
.add-lesson-form { display: flex; flex-direction: column; gap: .85rem; }
.alf-field { display: flex; flex-direction: column; gap: .3rem; }
.alf-field label { font-size: .7rem; font-weight: 700; color: #9a8a72; text-transform: uppercase; letter-spacing: .07em; }
.alf-input, .alf-select { width: 100%; border: 1.5px solid var(--border); border-radius: 2px; padding: .52rem .75rem; font-family: 'Source Serif 4', serif; font-size: .85rem; color: var(--dark); background: #fdf9f4; outline: none; transition: border-color .2s; }
.alf-input:focus, .alf-select:focus { border-color: var(--gold); }
.alf-row { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
.alf-hint { font-size: .75rem; color: #9a8a72; font-style: italic; background: rgba(196,146,42,.06); border: 1px solid rgba(196,146,42,.2); padding: .6rem .85rem; border-radius: 2px; margin: 0; }
.alf-hint i { color: var(--gold); margin-right: .3rem; }
.alf-actions { display: flex; gap: .65rem; flex-wrap: wrap; }

/* Empty state */
.empty-state { display: flex; flex-direction: column; align-items: center; gap: .6rem; padding: 3.5rem 2rem; text-align: center; color: #9a8a72; font-style: italic; }
.empty-state i { font-size: 2rem; color: var(--border); }
.empty-state p { margin: 0; }
</style>
