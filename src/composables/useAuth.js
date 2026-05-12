// composables/useAuth.js
import { ref, computed } from 'vue'
import * as XLSX from 'xlsx'

const EXCEL_PATH  = '/data/Auth_MB.xlsx'
const SESSION_KEY = 'auth_session_v1'

// ── Singleton state ───────────────────────────────────
const currentUser = ref(null)
const allUsers    = ref([])
const authLoading = ref(false)
const authError   = ref('')

// Restore session
try {
  const s = localStorage.getItem(SESSION_KEY)
  if (s) currentUser.value = JSON.parse(s)
} catch { /**/ }

// ── SHA-256 (browser built-in) ────────────────────────
async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('').slice(0,32)
}

// ── Read Excel once ───────────────────────────────────
async function getWorkbook() {
  const res = await fetch(EXCEL_PATH)
  if (!res.ok) throw new Error(`Auth_MB.xlsx табылмады (${res.status})`)
  return XLSX.read(await res.arrayBuffer(), { type:'array' })
}

async function loadUsers() {
  if (allUsers.value.length) return allUsers.value
  const wb    = await getWorkbook()
  const sheet = wb.Sheets['👤 Пайдаланушылар']
  if (!sheet) throw new Error('«👤 Пайдаланушылар» беті жоқ')
  // cols: 0=skip 1=ID 2=name 3=login 4=hash 5=role 6=class 7=status 8=reg 9=last 10=school 11=note
  allUsers.value = XLSX.utils.sheet_to_json(sheet, { range:5, header:1, defval:'' })
    .filter(r => String(r[1]).trim() && String(r[3]).trim())
    .map(r => ({
      id:     String(r[1]),
      name:   String(r[2]),
      login:  String(r[3]).toLowerCase().trim(),
      hash:   String(r[4]),
      role:   String(r[5]).toLowerCase().trim(),
      class:  String(r[6]),
      status: String(r[7]),
      school: String(r[10]),
      note:   String(r[11]),
    }))
    .filter(u => u.status === 'белсенді')
  return allUsers.value
}

// ── Public composable ─────────────────────────────────
export function useAuth() {
  const isLoggedIn = computed(() => !!currentUser.value)
  const isTeacher  = computed(() => currentUser.value?.role === 'мұғалім')
  const isStudent  = computed(() => currentUser.value?.role === 'оқушы')

  async function login(loginInput, password) {
    authLoading.value = true
    authError.value   = ''
    try {
      const users = await loadUsers();
      const user  = users.find(u => u.login === loginInput.toLowerCase().trim())
      if (!user) { authError.value = 'Пайдаланушы табылмады'; return false }
      // const hash = await sha256(password)
      const hash = password;
      if (hash !== user.hash) { authError.value = 'Пароль қате'; return false }
      currentUser.value = user
      localStorage.setItem(SESSION_KEY, JSON.stringify(user))
      return true
    } catch(e) {
      authError.value = e.message
      return false
    } finally { authLoading.value = false }
  }

  function logout() {
    currentUser.value = null
    localStorage.removeItem(SESSION_KEY)
    allUsers.value = []
  }

  function updateProfile(fields) {
    if (!currentUser.value) return
    currentUser.value = { ...currentUser.value, ...fields }
    localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser.value))
  }

  // ── Data loaders ──────────────────────────────────
  async function loadResults(filterStudentId = null) {
    const wb = await getWorkbook()
    const s  = wb.Sheets['📊 Оқушы нәтижелері']
    if (!s) return []
    let rows = XLSX.utils.sheet_to_json(s, { range:5, header:1, defval:'' })
      .filter(r => String(r[1]).trim())
      .map(r => ({
        studentId: String(r[1]), studentName: String(r[2]),
        class: String(r[3]),     taskName: String(r[4]),
        correct: Number(r[5]),   total: Number(r[6]),
        pct: Number(r[7]),       grade: String(r[8]),
        date: String(r[9]),      note: String(r[10]),
      }))
    if (filterStudentId) rows = rows.filter(r => r.studentId === filterStudentId)
    return rows
  }

  async function loadComments(lessonName = null) {
    const wb = await getWorkbook()
    const s  = wb.Sheets['💬 Пікірлер']
    if (!s) return []
    let rows = XLSX.utils.sheet_to_json(s, { range:5, header:1, defval:'' })
      .filter(r => String(r[1]).trim())
      .map(r => ({
        studentId: String(r[1]), studentName: String(r[2]),
        class: String(r[3]),     lessonName: String(r[4]),
        rating: Number(r[5]),    text: String(r[6]),
        date: String(r[7]),      reply: String(r[8]),
        replyDate: String(r[9]),
      }))
    if (lessonName) rows = rows.filter(c => c.lessonName === lessonName)
    return rows
  }

  async function loadTeacherProfile(userId) {
    const wb = await getWorkbook()
    const s  = wb.Sheets['🎓 Мұғалім профилі']
    if (!s) return {}
    const profile = {}
    XLSX.utils.sheet_to_json(s, { range:5, header:1, defval:'' })
      .filter(r => String(r[1]) === userId)
      .forEach(r => { profile[String(r[2])] = String(r[3]) })
    return profile
  }

  async function loadTeacherLessons(userId) {
    const wb = await getWorkbook()
    const s  = wb.Sheets['📚 Сабақ тізімі']
    if (!s) return []
    return XLSX.utils.sheet_to_json(s, { range:5, header:1, defval:'' })
      .filter(r => String(r[1]) === userId && String(r[2]).trim())
      .map(r => ({
        teacherId: String(r[1]), title: String(r[2]),
        type: String(r[3]),      level: String(r[4]),
        topic: String(r[5]),     status: String(r[6]),
        date: String(r[7]),      classes: String(r[8]),
      }))
  }

  return {
    currentUser, isLoggedIn, isTeacher, isStudent,
    authLoading, authError,
    login, logout, updateProfile,
    loadResults, loadComments, loadTeacherProfile, loadTeacherLessons,
  }
}
