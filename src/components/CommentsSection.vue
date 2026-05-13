<template>
  <div class="cs-wrap">

    <!-- ══ HEADER ══════════════════════════════════════ -->
    <div class="cs-header">
      <div class="cs-header-top">
        <div>
          <h2 class="cs-title">Пікірлер</h2>
          <p class="cs-sub">
            <template v-if="isTeacher">
              Оқушылардың пікірлері · Жауапсыздар:
              <strong style="color:#e8b94f">{{ stats.unread }}</strong>
            </template>
            <template v-else>
              Сабақ туралы пікір қалдырыңыз · Мұғалім жауап береді
            </template>
          </p>
        </div>
        <div class="cs-header-actions">
          <button v-if="isTeacher" class="cs-btn-export" @click="exportToExcel">
            <i class="pi pi-file-excel"/> Excel
          </button>
          <button class="cs-btn-reload" @click="handleReload" :disabled="loading">
            <i class="pi pi-refresh" :class="{ spin: loading }"/>
          </button>
        </div>
      </div>

      <!-- Мұғалім статистикасы -->
      <div v-if="isTeacher" class="cs-stats-row">
        <span class="cs-stat" v-for="s in statsItems" :key="s.label">
          <span class="cs-stat-val" :style="{ color: s.color }">{{ s.val }}</span>
          <span class="cs-stat-lbl">{{ s.label }}</span>
        </span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="cs-loading">
      <div class="cs-spinner"/>
      <p>Пікірлер жүктелуде…</p>
    </div>

    <template v-else>

      <!-- ══ ОҚУШЫ: ЖАҢА ПІКІР ФОРМАСЫ ═══════════════ -->
      <div v-if="isStudent" class="new-comment-card">
        <div class="nc-head">
          <i class="pi pi-edit"/> Жаңа пікір жазу
        </div>
        <div class="nc-body">

          <!-- Сабақ -->
          <div class="nc-field">
            <label class="nc-label">Сабақ таңдаңыз <span class="req">*</span></label>
            <select v-model="nf.lessonName" class="nc-input nc-sel"
                    :class="{ 'nc-err': nfError.lesson }">
              <option value="">— Таңдаңыз —</option>
              <option v-for="l in lessonOptions" :key="l" :value="l">{{ l }}</option>
            </select>
            <p v-if="nfError.lesson" class="nc-err-msg">{{ nfError.lesson }}</p>
            <p v-if="!lessonOptions.length" class="nc-hint">
              <i class="pi pi-info-circle"/> Сабақтар жүктелуде…
            </p>
          </div>

          <!-- Рейтинг -->
          <div class="nc-field">
            <label class="nc-label">Бағалау <span class="req">*</span></label>
            <div class="star-row">
              <button
                  v-for="i in 5" :key="i"
                  class="star-pick"
                  :class="{ on: i <= (hoverStar || nf.rating) }"
                  @click="nf.rating = i"
                  @mouseenter="hoverStar = i"
                  @mouseleave="hoverStar = 0"
                  type="button"
              >★</button>
              <span class="star-text">{{ STAR_TEXTS[nf.rating - 1] }}</span>
            </div>
          </div>

          <!-- Мәтін -->
          <div class="nc-field">
            <label class="nc-label">Пікір <span class="req">*</span></label>
            <textarea
                v-model="nf.text"
                class="nc-input nc-ta"
                :class="{ 'nc-err': nfError.text }"
                rows="3"
                placeholder="Сабақ туралы ойыңызды жазыңыз…"
                maxlength="500"
            />
            <div class="nc-footer-row">
              <p v-if="nfError.text" class="nc-err-msg">{{ nfError.text }}</p>
              <span class="nc-char">{{ nf.text.length }} / 500</span>
            </div>
          </div>

          <button class="cs-btn-send" @click="submitComment" :disabled="sending">
            <div v-if="sending" class="btn-spin"/>
            <template v-else>
              <i class="pi pi-send"/> Жіберу
            </template>
          </button>
        </div>
      </div>

      <!-- ══ ФИЛЬТР ═══════════════════════════════════ -->
      <div class="cs-filter-bar">
        <!-- Іздеу -->
        <div class="cfb-search">
          <i class="pi pi-search"/>
          <input v-model="search" class="cfb-input" placeholder="Іздеу…"/>
          <button v-if="search" class="cfb-clear" @click="search = ''">
            <i class="pi pi-times"/>
          </button>
        </div>

        <!-- Filter tabs (мұғалімге ғана) -->
        <div v-if="isTeacher" class="cfb-tabs">
          <button
              v-for="tab in filterTabs" :key="tab.val"
              class="cfb-tab" :class="{ active: activeFilter === tab.val }"
              @click="activeFilter = tab.val"
          >
            {{ tab.label }}
            <span class="cfb-cnt">{{ tab.count }}</span>
          </button>
        </div>

        <!-- Sort -->
        <select v-model="sortOrder" class="cfb-sort">
          <option value="newest">Жаңасы алда</option>
          <option value="oldest">Ескісі алда</option>
          <option value="rating_high">Рейтинг ↓</option>
          <option value="rating_low">Рейтинг ↑</option>
        </select>
      </div>

      <!-- ══ ПІКІР ТІЗІМІ ══════════════════════════════ -->
      <transition-group name="c-fade" tag="div" class="cs-list">
        <div
            v-for="c in displayed"
            :key="c.id"
            class="c-card"
            :class="{
            'c-unread': !c.reply && isTeacher,
            'c-isnew':   c.isNew  && isTeacher,
          }"
        >
          <!-- Comment header -->
          <div class="c-head">
            <div class="c-ava" :style="{ background: avaColor(c.studentName) }">
              {{ c.studentName?.[0] || '?' }}
            </div>
            <div class="c-meta">
              <span class="c-name">{{ c.studentName }}</span>
              <span class="c-class">{{ c.class }}</span>
              <span class="c-sep"/>
              <span class="c-date">{{ c.date }}</span>
            </div>
            <div class="c-right">
              <div class="c-stars">
                <span v-for="i in 5" :key="i" class="c-star"
                      :class="{ on: i <= c.rating }">★</span>
                <span class="c-rnum">{{ c.rating }}.0</span>
              </div>
              <span class="c-lesson">{{ c.lessonName }}</span>
              <span v-if="c.isNew && isTeacher" class="c-new">Жаңа</span>
              <button v-if="isTeacher" class="c-del-btn" @click="askDelete(c)">
                <i class="pi pi-trash"/>
              </button>
            </div>
          </div>

          <!-- Comment text -->
          <p class="c-text">{{ c.text }}</p>

          <!-- ── ЖАУАП БЛОГЫ ── -->
          <div v-if="c.reply" class="reply-block">
            <div class="rb-head">
              <div class="rb-ava">М</div>
              <span class="rb-label">Мұғалім жауабы</span>
              <span class="rb-date">{{ c.replyDate }}</span>
              <button v-if="isTeacher" class="rb-edit-btn" @click="startEdit(c)">
                <i class="pi pi-pencil"/>
              </button>
            </div>
            <!-- Edit mode -->
            <div v-if="editId === c.id" class="rb-edit-form">
              <textarea v-model="editText" class="rb-ta" rows="2"/>
              <div class="rb-edit-actions">
                <button class="rb-save-btn" @click="saveEdit(c.id)">
                  <i class="pi pi-check"/> Сақтау
                </button>
                <button class="rb-cancel-btn" @click="cancelEdit">Бас тарту</button>
              </div>
            </div>
            <p v-else class="rb-text">{{ c.reply }}</p>
          </div>

          <!-- ── ЖАУАП ФОРМАСЫ (мұғалімге) ── -->
          <div v-else-if="isTeacher" class="reply-form-wrap">
            <div v-if="replyId === c.id" class="rf-open">
              <div class="rf-row">
                <div class="rf-ava">М</div>
                <textarea
                    v-model="replyText"
                    ref="replyTaRef"
                    class="rf-ta"
                    rows="2"
                    placeholder="Жауап жазыңыз… (Ctrl+Enter — жіберу)"
                    @keydown.ctrl.enter="doReply(c.id)"
                />
              </div>
              <div class="rf-actions">
                <button class="rf-send-btn" @click="doReply(c.id)"
                        :disabled="!replyText.trim()">
                  <i class="pi pi-send"/> Жіберу
                  <span class="rf-hint">Ctrl+Enter</span>
                </button>
                <button class="rf-cancel-btn" @click="cancelReply">Бас тарту</button>
              </div>
            </div>
            <button v-else class="rf-open-btn" @click="openReply(c)">
              <i class="pi pi-reply"/> Жауап беру
            </button>
          </div>

          <!-- ── КҮТУ (оқушыға) ── -->
          <div v-else-if="isStudent && !c.reply" class="c-awaiting">
            <i class="pi pi-clock"/> Мұғалім жауабы күтілуде…
          </div>

        </div>
      </transition-group>

      <!-- Empty -->
      <div v-if="!displayed.length" class="cs-empty">
        <i class="pi pi-comments"/>
        <p>{{ search ? 'Іздеу нәтижесі жоқ' : isStudent ? 'Пікір жоқ — жоғарыдан жазыңыз' : 'Пікір жоқ' }}</p>
      </div>

    </template><!-- end !loading -->

    <!-- ══ DELETE MODAL ══════════════════════════════════ -->
    <teleport to="body">
      <transition name="modal-anim">
        <div v-if="delDialog.show" class="del-overlay" @click.self="delDialog.show = false">
          <div class="del-box">
            <div class="del-icon-wrap"><i class="pi pi-exclamation-triangle"/></div>
            <h3 class="del-title">Пікірді өшіру</h3>
            <p class="del-body">
              <strong>{{ delDialog.comment?.studentName }}</strong>
              жазған пікірді өшіргіңіз келе ме?
            </p>
            <p class="del-note">
              <i class="pi pi-info-circle"/>
              localStorage-тен өшіріледі. Excel өзгермейді.
            </p>
            <div class="del-actions">
              <button class="del-ok" @click="doDelete">
                <i class="pi pi-trash"/> Өшіру
              </button>
              <button class="del-cancel" @click="delDialog.show = false">
                Бас тарту
              </button>
            </div>
          </div>
        </div>
      </transition>
    </teleport>

    <!-- ══ TOAST ══════════════════════════════════════════ -->
    <transition name="toast-anim">
      <div v-if="toast.show" class="cs-toast" :class="toast.type">
        <i :class="toast.type === 'success' ? 'pi pi-check-circle' : 'pi pi-times-circle'"/>
        {{ toast.msg }}
      </div>
    </transition>

  </div>
</template>

<script setup>
import {ref, computed, reactive, onMounted, nextTick} from 'vue'
import {useCommentsStore} from '@/composables/useCommentsStore'
import {useLessonsStore} from '@/composables/useLessonsStore'
import {useAuth} from '@/composables/useAuth'

// ─────────────────────────────────────────────────────
// AUTH — рөлді computed арқылы аламыз
// ─────────────────────────────────────────────────────
const {currentUser} = useAuth()

const isTeacher = computed(() => currentUser.value?.role === 'мұғалім')
const isStudent = computed(() => currentUser.value?.role === 'оқушы')

// ─────────────────────────────────────────────────────
// STORES
// ─────────────────────────────────────────────────────
const {
  comments, loading, stats,
  init, reloadFromExcel,
  addComment, addReply, updateReply,
  deleteComment, markRead, exportToExcel,
} = useCommentsStore()

const {lessons, init: lessonsInit} = useLessonsStore()

// ─────────────────────────────────────────────────────
// lessonOptions — localStorage-тен (useLessonsStore)
// ─────────────────────────────────────────────────────
const lessonOptions = computed(() => {
  if (!lessons.value.length) return []
  return [...new Set(lessons.value.map(l => l.title).filter(Boolean))]
})

// ─────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────
const STAR_TEXTS = ['Нашар', 'Орташа', 'Жақсы', 'Өте жақсы', 'Керемет!']
const AVA_COLORS = ['#c4922a', '#3a5c3a', '#8b3a1e', '#2a3a5c', '#5a3a5a', '#6a4a2a']

// ─────────────────────────────────────────────────────
// UI STATE
// ─────────────────────────────────────────────────────
const search = ref('')
const activeFilter = ref('all')
const sortOrder = ref('newest')
const hoverStar = ref(0)
const sending = ref(false)

// New comment form
const nf = reactive({lessonName: '', rating: 5, text: ''})
const nfError = reactive({lesson: '', text: ''})

// Reply
const replyId = ref(null)
const replyText = ref('')
const replyTaRef = ref(null)

// Edit reply
const editId = ref(null)
const editText = ref('')

// Delete
const delDialog = reactive({show: false, comment: null})

// Toast
const toast = reactive({show: false, msg: '', type: 'success'})
let toastTimer = null

// ─────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────
onMounted(async () => {
  // Параллельно жүктейміз
  console.log(isStudent.value)
  console.log(isTeacher.value)
  await Promise.all([
    init(),
    lessonsInit(),
  ])
})

// ─────────────────────────────────────────────────────
// COMPUTED — stats, filters, displayed list
// ─────────────────────────────────────────────────────
const statsItems = computed(() => [
  {val: stats.value.total, label: 'Барлық', color: '#c4922a'},
  {val: stats.value.unread, label: 'Жауапсыз', color: '#8b3a1e'},
  {val: stats.value.replied, label: 'Жауап берілді', color: '#3a5c3a'},
  {val: stats.value.avgRating, label: 'Орт. рейтинг', color: '#2a3a5c'},
])

const filterTabs = computed(() => [
  {val: 'all', label: 'Барлығы', count: comments.value.length},
  {val: 'unread', label: 'Жауапсыз', count: stats.value.unread},
  {val: 'replied', label: 'Жауап берілді', count: stats.value.replied},
])

const displayed = computed(() => {
  let list = [...comments.value]

  // Оқушы тек өз пікірлерін көреді
  if (isStudent.value && currentUser.value?.id) {
    list = list.filter(c => c.studentId === currentUser.value.id)
  }

  // Filter (мұғалімге)
  if (isTeacher.value) {
    if (activeFilter.value === 'unread') list = list.filter(c => !c.reply)
    if (activeFilter.value === 'replied') list = list.filter(c => !!c.reply)
  }

  // Search
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(c =>
        (c.studentName || '').toLowerCase().includes(q) ||
        (c.lessonName || '').toLowerCase().includes(q) ||
        (c.text || '').toLowerCase().includes(q)
    )
  }

  // Sort
  switch (sortOrder.value) {
    case 'oldest':
      list.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
      break
    case 'rating_high':
      list.sort((a, b) => b.rating - a.rating);
      break
    case 'rating_low':
      list.sort((a, b) => a.rating - b.rating);
      break
    default:
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
  }
  return list
})

// ─────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────
function avaColor(name) {
  if (!name) return AVA_COLORS[0]
  return AVA_COLORS[name.charCodeAt(0) % AVA_COLORS.length]
}

function showToast(msg, type = 'success') {
  clearTimeout(toastTimer)
  Object.assign(toast, {show: true, msg, type})
  toastTimer = setTimeout(() => {
    toast.show = false
  }, 3200)
}

async function handleReload() {
  await reloadFromExcel()
  showToast('Пікірлер жаңартылды!')
}

// ─────────────────────────────────────────────────────
// STUDENT — пікір жіберу
// ─────────────────────────────────────────────────────
function validateNew() {
  nfError.lesson = nf.lessonName ? '' : 'Сабақ таңдаңыз'
  nfError.text = nf.text.trim() ? '' : 'Пікір мәтінін жазыңыз'
  return !nfError.lesson && !nfError.text
}

async function submitComment() {
  if (!validateNew()) return
  sending.value = true
  try {
    addComment({
      studentId: currentUser.value?.id || 'guest',
      studentName: currentUser.value?.name || 'Оқушы',
      class: currentUser.value?.class || '8А',
      lessonName: nf.lessonName,
      rating: nf.rating,
      text: nf.text.trim(),
    })
    nf.lessonName = '';
    nf.text = '';
    nf.rating = 5
    showToast('Пікіріңіз жіберілді!')
  } finally {
    sending.value = false
  }
}

// ─────────────────────────────────────────────────────
// TEACHER — жауап беру
// ─────────────────────────────────────────────────────
async function openReply(comment) {
  replyId.value = comment.id
  replyText.value = ''
  if (comment.isNew) markRead(comment.id)
  await nextTick()
  replyTaRef.value?.focus?.()
}

function cancelReply() {
  replyId.value = null
  replyText.value = ''
}

function doReply(commentId) {
  const text = replyText.value.trim()
  if (!text) return
  addReply(commentId, text)
  cancelReply()
  showToast('Жауап жіберілді!')
}

// ─────────────────────────────────────────────────────
// TEACHER — жауапты өзгерту
// ─────────────────────────────────────────────────────
function startEdit(comment) {
  editId.value = comment.id
  editText.value = comment.reply
}

function cancelEdit() {
  editId.value = null
  editText.value = ''
}

function saveEdit(commentId) {
  const text = editText.value.trim()
  if (!text) return
  updateReply(commentId, text)
  cancelEdit()
  showToast('Жауап жаңартылды!')
}

// ─────────────────────────────────────────────────────
// TEACHER — өшіру
// ─────────────────────────────────────────────────────
function askDelete(comment) {
  delDialog.comment = comment
  delDialog.show = true
}

function doDelete() {
  if (delDialog.comment) {
    deleteComment(delDialog.comment.id)
    showToast('Пікір өшірілді')
  }
  delDialog.show = false
  delDialog.comment = null
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:ital,wght@0,300;0,400;0,600&display=swap');

.cs-wrap {
  --ink: #1a1208;
  --parch: #faf6ef;
  --gold: #c4922a;
  --gold-l: #e8b94f;
  --rust: #8b3a1e;
  --sage: #3a5c3a;
  --navy: #2a3a5c;
  --border: #d9cdb8;
  --dark: #130e07;
  font-family: 'Source Serif 4', Georgia, serif;
  color: var(--ink);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* ── Header ── */
.cs-header {
  background: var(--dark);
  border-radius: 3px;
  overflow: hidden;
}

.cs-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  flex-wrap: wrap;
  gap: .75rem;
}

.cs-title {
  font-family: 'Playfair Display', serif;
  font-size: 1.15rem;
  font-weight: 900;
  color: #fff;
  margin: 0 0 .2rem;
}

.cs-sub {
  font-size: .72rem;
  color: rgba(255, 255, 255, .4);
  margin: 0;
  font-style: italic;
}

.cs-header-actions {
  display: flex;
  gap: .5rem;
}

.cs-btn-export {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  background: rgba(58, 92, 58, .4);
  border: 1px solid rgba(58, 92, 58, .6);
  color: #a5d6a7;
  padding: .42rem .9rem;
  border-radius: 2px;
  font-size: .78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all .2s;
}

.cs-btn-export:hover {
  background: var(--sage);
  color: #fff;
}

.cs-btn-reload {
  width: 32px;
  height: 32px;
  border: 1px solid rgba(255, 255, 255, .18);
  border-radius: 2px;
  background: none;
  color: rgba(255, 255, 255, .45);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .8rem;
  cursor: pointer;
  transition: all .2s;
}

.cs-btn-reload:hover:not(:disabled) {
  border-color: var(--gold);
  color: var(--gold-l);
}

.cs-btn-reload:disabled {
  opacity: .3;
  cursor: not-allowed;
}

.cs-stats-row {
  display: flex;
  gap: 2rem;
  padding: .65rem 1.25rem .9rem;
  border-top: 1px solid rgba(255, 255, 255, .07);
  flex-wrap: wrap;
}

.cs-stat {
  display: flex;
  flex-direction: column;
}

.cs-stat-val {
  font-family: 'Playfair Display', serif;
  font-size: 1.2rem;
  font-weight: 900;
  line-height: 1;
}

.cs-stat-lbl {
  font-size: .6rem;
  color: rgba(255, 255, 255, .3);
  text-transform: uppercase;
  letter-spacing: .08em;
  margin-top: .15rem;
}

/* Loading */
.cs-loading {
  display: flex;
  align-items: center;
  gap: .75rem;
  padding: 3rem;
  justify-content: center;
  color: #9a8a72;
}

.cs-spinner {
  width: 34px;
  height: 34px;
  border: 3px solid rgba(196, 146, 42, .18);
  border-top-color: var(--gold);
  border-radius: 50%;
  animation: spin .75s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.spin {
  animation: spin .8s linear infinite;
}

/* ── New comment (student) ── */
.new-comment-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 3px;
  overflow: hidden;
}

.nc-head {
  display: flex;
  align-items: center;
  gap: .45rem;
  padding: .65rem 1.1rem;
  background: rgba(196, 146, 42, .07);
  border-bottom: 1px solid var(--border);
  font-size: .7rem;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: #9a8a72;
}

.nc-head i {
  color: var(--gold);
}

.nc-body {
  padding: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: .85rem;
}

.nc-field {
  display: flex;
  flex-direction: column;
  gap: .3rem;
}

.nc-label {
  font-size: .7rem;
  font-weight: 700;
  color: #9a8a72;
  text-transform: uppercase;
  letter-spacing: .06em;
}

.req {
  color: var(--rust);
}

.nc-input {
  border: 1.5px solid var(--border);
  border-radius: 2px;
  background: var(--parch);
  padding: .52rem .75rem;
  font-family: 'Source Serif 4', serif;
  font-size: .875rem;
  color: var(--ink);
  outline: none;
  width: 100%;
  transition: border-color .22s;
}

.nc-input:focus {
  border-color: var(--gold);
}

.nc-input.nc-err {
  border-color: var(--rust);
}

.nc-sel {
  appearance: none;
  cursor: pointer;
}

.nc-ta {
  resize: vertical;
}

.nc-ta::placeholder {
  color: #b0a090;
  font-style: italic;
}

.nc-err-msg {
  font-size: .68rem;
  color: var(--rust);
  margin: 0;
}

.nc-hint {
  font-size: .68rem;
  color: #b0a090;
  font-style: italic;
  margin: 0;
  display: flex;
  align-items: center;
  gap: .3rem;
}

.nc-footer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nc-char {
  font-size: .65rem;
  color: #b0a090;
}

/* Stars */
.star-row {
  display: flex;
  align-items: center;
  gap: .18rem;
}

.star-pick {
  background: none;
  border: none;
  font-size: 1.55rem;
  color: #d9cdb8;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: color .15s, transform .15s;
}

.star-pick.on {
  color: var(--gold);
  transform: scale(1.08);
}

.star-text {
  font-size: .78rem;
  color: #9a8a72;
  font-style: italic;
  margin-left: .5rem;
}

.cs-btn-send {
  display: inline-flex;
  align-items: center;
  gap: .45rem;
  background: var(--gold);
  color: #fff;
  border: none;
  padding: .6rem 1.35rem;
  border-radius: 2px;
  font-family: 'Source Serif 4', serif;
  font-size: .875rem;
  font-weight: 700;
  cursor: pointer;
  transition: background .2s;
  align-self: flex-start;
}

.cs-btn-send:hover:not(:disabled) {
  background: var(--gold-l);
}

.cs-btn-send:disabled {
  opacity: .45;
  cursor: not-allowed;
}

.btn-spin {
  width: 18px;
  height: 18px;
  border: 2.5px solid rgba(255, 255, 255, .3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin .7s linear infinite;
}

/* ── Filter bar ── */
.cs-filter-bar {
  display: flex;
  align-items: center;
  gap: .6rem;
  flex-wrap: wrap;
}

.cfb-search {
  display: flex;
  align-items: center;
  gap: .42rem;
  background: #fff;
  border: 1.5px solid var(--border);
  border-radius: 2px;
  padding: .4rem .7rem;
  flex: 1;
  min-width: 160px;
}

.cfb-search i {
  color: #b0a090;
  font-size: .75rem;
}

.cfb-input {
  flex: 1;
  border: none;
  outline: none;
  font-family: 'Source Serif 4', serif;
  font-size: .8rem;
  color: var(--ink);
}

.cfb-input::placeholder {
  color: #b0a090;
  font-style: italic;
}

.cfb-clear {
  background: none;
  border: none;
  color: #b0a090;
  cursor: pointer;
  font-size: .7rem;
}

.cfb-clear:hover {
  color: var(--rust);
}

.cfb-tabs {
  display: flex;
  gap: .35rem;
  flex-wrap: wrap;
}

.cfb-tab {
  display: flex;
  align-items: center;
  gap: .35rem;
  padding: .36rem .75rem;
  border: 1.5px solid var(--border);
  border-radius: 2px;
  background: transparent;
  font-family: 'Source Serif 4', serif;
  font-size: .75rem;
  font-weight: 600;
  color: #7a6a52;
  cursor: pointer;
  transition: all .2s;
}

.cfb-tab:hover {
  border-color: var(--gold);
  color: var(--gold);
}

.cfb-tab.active {
  background: var(--gold);
  border-color: var(--gold);
  color: #fff;
}

.cfb-cnt {
  font-size: .62rem;
  background: rgba(255, 255, 255, .22);
  padding: .04rem .32rem;
  border-radius: 8px;
}

.cfb-tab:not(.active) .cfb-cnt {
  background: rgba(196, 146, 42, .1);
  color: var(--gold);
}

.cfb-sort {
  border: 1.5px solid var(--border);
  border-radius: 2px;
  background: var(--parch);
  padding: .38rem .65rem;
  font-family: 'Source Serif 4', serif;
  font-size: .78rem;
  color: var(--ink);
  outline: none;
  cursor: pointer;
}

/* ── Comment list ── */
.cs-list {
  display: flex;
  flex-direction: column;
  gap: .85rem;
}

.c-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 3px;
  padding: 1.1rem;
  border-left: 3px solid transparent;
  transition: box-shadow .2s;
}

.c-card:hover {
  box-shadow: 0 4px 20px rgba(26, 18, 8, .08);
}

.c-unread {
  border-left-color: var(--rust);
}

.c-isnew {
  border-left-color: var(--gold);
  background: #fdf9f3;
}

/* Comment head */
.c-head {
  display: flex;
  align-items: center;
  gap: .65rem;
  margin-bottom: .75rem;
  flex-wrap: wrap;
}

.c-ava {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  flex-shrink: 0;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: .9rem;
}

.c-meta {
  display: flex;
  align-items: center;
  gap: .35rem;
  flex: 1;
  flex-wrap: wrap;
  min-width: 0;
}

.c-name {
  font-size: .88rem;
  font-weight: 700;
  color: var(--ink);
  white-space: nowrap;
}

.c-class {
  font-size: .68rem;
  color: var(--navy);
  font-weight: 700;
  background: rgba(42, 58, 92, .08);
  padding: .1rem .38rem;
  border-radius: 1px;
}

.c-sep {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #b0a090;
  flex-shrink: 0;
}

.c-date {
  font-size: .68rem;
  color: #b0a090;
}

.c-right {
  display: flex;
  align-items: center;
  gap: .5rem;
  flex-wrap: wrap;
  margin-left: auto;
}

.c-stars {
  display: flex;
  align-items: center;
  gap: .08rem;
}

.c-star {
  font-size: .78rem;
  color: #d9cdb8;
}

.c-star.on {
  color: var(--gold);
}

.c-rnum {
  font-size: .65rem;
  color: #9a8a72;
  margin-left: .15rem;
}

.c-lesson {
  font-size: .65rem;
  color: #7a6a52;
  background: #f5ede0;
  border: 1px solid var(--border);
  padding: .12rem .45rem;
  border-radius: 1px;
  max-width: 170px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.c-new {
  font-size: .58rem;
  font-weight: 700;
  background: var(--gold);
  color: #fff;
  padding: .1rem .42rem;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: .08em;
  animation: pulse 2s ease infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1
  }
  50% {
    opacity: .6
  }
}

.c-del-btn {
  background: none;
  border: none;
  color: #b0a090;
  cursor: pointer;
  font-size: .78rem;
  padding: .2rem;
  transition: color .2s;
}

.c-del-btn:hover {
  color: var(--rust);
}

.c-text {
  font-size: .875rem;
  color: #3a2a15;
  line-height: 1.72;
  margin: 0 0 .85rem;
}

/* Reply block */
.reply-block {
  background: rgba(58, 92, 58, .05);
  border: 1px solid rgba(58, 92, 58, .18);
  border-radius: 2px;
  padding: .8rem 1rem;
}

.rb-head {
  display: flex;
  align-items: center;
  gap: .5rem;
  margin-bottom: .45rem;
  flex-wrap: wrap;
}

.rb-ava {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--sage);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .72rem;
  font-weight: 700;
  flex-shrink: 0;
}

.rb-label {
  font-size: .68rem;
  font-weight: 700;
  color: var(--sage);
  text-transform: uppercase;
  letter-spacing: .08em;
}

.rb-date {
  font-size: .65rem;
  color: #9a8a72;
}

.rb-edit-btn {
  background: none;
  border: none;
  color: #9a8a72;
  cursor: pointer;
  font-size: .75rem;
  padding: .2rem;
  margin-left: auto;
  transition: color .2s;
}

.rb-edit-btn:hover {
  color: var(--gold);
}

.rb-text {
  font-size: .855rem;
  color: #2a5c3a;
  line-height: 1.65;
  margin: 0;
}

/* Edit form */
.rb-edit-form {
  display: flex;
  flex-direction: column;
  gap: .5rem;
}

.rb-ta {
  width: 100%;
  border: 1.5px solid rgba(58, 92, 58, .3);
  border-radius: 2px;
  padding: .52rem .68rem;
  font-family: 'Source Serif 4', serif;
  font-size: .85rem;
  color: var(--ink);
  resize: vertical;
  outline: none;
  background: #fff;
}

.rb-ta:focus {
  border-color: var(--sage);
}

.rb-edit-actions {
  display: flex;
  gap: .5rem;
}

.rb-save-btn {
  display: inline-flex;
  align-items: center;
  gap: .35rem;
  background: var(--sage);
  color: #fff;
  border: none;
  padding: .42rem .95rem;
  border-radius: 2px;
  font-family: 'Source Serif 4', serif;
  font-size: .78rem;
  font-weight: 700;
  cursor: pointer;
  transition: background .2s;
}

.rb-save-btn:hover {
  background: #4a7a4a;
}

.rb-cancel-btn {
  background: transparent;
  border: 1px solid var(--border);
  color: #7a6a52;
  padding: .42rem .85rem;
  border-radius: 2px;
  font-family: 'Source Serif 4', serif;
  font-size: .78rem;
  cursor: pointer;
  transition: all .2s;
}

.rb-cancel-btn:hover {
  border-color: var(--rust);
  color: var(--rust);
}

/* Reply form (teacher) */
.reply-form-wrap {
  margin-top: .65rem;
}

.rf-open {
  background: rgba(196, 146, 42, .05);
  border: 1px solid rgba(196, 146, 42, .2);
  border-radius: 2px;
  padding: .8rem;
  display: flex;
  flex-direction: column;
  gap: .55rem;
}

.rf-row {
  display: flex;
  gap: .65rem;
  align-items: flex-start;
}

.rf-ava {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--gold);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: .8rem;
  flex-shrink: 0;
  margin-top: .1rem;
}

.rf-ta {
  flex: 1;
  border: 1.5px solid rgba(196, 146, 42, .3);
  border-radius: 2px;
  padding: .52rem .68rem;
  font-family: 'Source Serif 4', serif;
  font-size: .85rem;
  color: var(--ink);
  resize: vertical;
  outline: none;
  background: #fff;
  transition: border-color .2s;
}

.rf-ta:focus {
  border-color: var(--gold);
}

.rf-ta::placeholder {
  color: #b0a090;
  font-style: italic;
}

.rf-actions {
  display: flex;
  align-items: center;
  gap: .5rem;
}

.rf-send-btn {
  display: inline-flex;
  align-items: center;
  gap: .38rem;
  background: var(--gold);
  color: #fff;
  border: none;
  padding: .48rem 1.05rem;
  border-radius: 2px;
  font-family: 'Source Serif 4', serif;
  font-size: .82rem;
  font-weight: 700;
  cursor: pointer;
  transition: background .2s;
}

.rf-send-btn:hover:not(:disabled) {
  background: var(--gold-l);
}

.rf-send-btn:disabled {
  opacity: .35;
  cursor: not-allowed;
}

.rf-hint {
  font-size: .6rem;
  color: rgba(255, 255, 255, .6);
}

.rf-cancel-btn {
  background: transparent;
  border: 1px solid var(--border);
  color: #7a6a52;
  padding: .46rem .85rem;
  border-radius: 2px;
  font-family: 'Source Serif 4', serif;
  font-size: .78rem;
  cursor: pointer;
  transition: all .2s;
}

.rf-cancel-btn:hover {
  border-color: var(--rust);
  color: var(--rust);
}

.rf-open-btn {
  display: inline-flex;
  align-items: center;
  gap: .38rem;
  background: transparent;
  border: 1.5px solid var(--border);
  color: #9a8a72;
  padding: .36rem .82rem;
  border-radius: 2px;
  font-family: 'Source Serif 4', serif;
  font-size: .78rem;
  cursor: pointer;
  transition: all .2s;
}

.rf-open-btn:hover {
  border-color: var(--gold);
  color: var(--gold);
  background: rgba(196, 146, 42, .05);
}

/* Awaiting (student) */
.c-awaiting {
  display: flex;
  align-items: center;
  gap: .38rem;
  font-size: .72rem;
  color: #b0a090;
  font-style: italic;
  margin-top: .55rem;
}

.c-awaiting i {
  color: var(--gold);
  font-size: .7rem;
}

/* Empty */
.cs-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .7rem;
  padding: 3.5rem 2rem;
  color: #9a8a72;
  font-style: italic;
  text-align: center;
}

.cs-empty i {
  font-size: 2.2rem;
  color: var(--border);
}

.cs-empty p {
  margin: 0;
}

/* Transitions */
.c-fade-enter-active, .c-fade-leave-active {
  transition: opacity .25s, transform .25s;
}

.c-fade-enter-from, .c-fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

/* ── Delete modal ── */
.del-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(19, 14, 7, .72);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.del-box {
  background: var(--parch);
  border: 1px solid var(--border);
  border-top: 4px solid var(--rust);
  border-radius: 4px;
  padding: 2rem;
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .85rem;
  text-align: center;
  box-shadow: 0 24px 64px rgba(0, 0, 0, .35);
}

.del-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(139, 58, 30, .1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.del-icon-wrap i {
  font-size: 1.5rem;
  color: var(--rust);
}

.del-title {
  font-family: 'Playfair Display', serif;
  font-size: 1.1rem;
  font-weight: 900;
  color: var(--ink);
  margin: 0;
}

.del-body {
  font-size: .875rem;
  color: #5a4a35;
  margin: 0;
  line-height: 1.6;
}

.del-note {
  display: flex;
  align-items: flex-start;
  gap: .4rem;
  font-size: .72rem;
  color: #9a8a72;
  font-style: italic;
  background: rgba(196, 146, 42, .07);
  border: 1px solid rgba(196, 146, 42, .2);
  border-radius: 2px;
  padding: .5rem .7rem;
  text-align: left;
  width: 100%;
  box-sizing: border-box;
}

.del-note i {
  color: var(--gold);
  flex-shrink: 0;
}

.del-actions {
  display: flex;
  gap: .65rem;
  width: 100%;
}

.del-ok {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .4rem;
  background: var(--rust);
  color: #fff;
  border: none;
  padding: .62rem;
  border-radius: 2px;
  font-family: 'Source Serif 4', serif;
  font-size: .875rem;
  font-weight: 700;
  cursor: pointer;
  transition: background .2s;
}

.del-ok:hover {
  background: #a04428;
}

.del-cancel {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1.5px solid var(--border);
  color: #7a6a52;
  padding: .62rem;
  border-radius: 2px;
  font-family: 'Source Serif 4', serif;
  font-size: .875rem;
  cursor: pointer;
  transition: all .2s;
}

.del-cancel:hover {
  border-color: var(--gold);
  color: var(--gold);
}

.modal-anim-enter-active, .modal-anim-leave-active {
  transition: opacity .25s;
}

.modal-anim-enter-active .del-box, .modal-anim-leave-active .del-box {
  transition: transform .25s;
}

.modal-anim-enter-from, .modal-anim-leave-to {
  opacity: 0;
}

.modal-anim-enter-from .del-box, .modal-anim-leave-to .del-box {
  transform: scale(.93) translateY(8px);
}

/* ── Toast ── */
.cs-toast {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 10000;
  display: flex;
  align-items: center;
  gap: .6rem;
  padding: .72rem 1.2rem;
  border-radius: 2px;
  font-size: .85rem;
  font-weight: 600;
  box-shadow: 0 8px 32px rgba(0, 0, 0, .25);
}

.cs-toast.success {
  background: var(--sage);
  color: #fff;
}

.cs-toast.error {
  background: var(--rust);
  color: #fff;
}

.toast-anim-enter-active, .toast-anim-leave-active {
  transition: opacity .3s, transform .3s;
}

.toast-anim-enter-from, .toast-anim-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>