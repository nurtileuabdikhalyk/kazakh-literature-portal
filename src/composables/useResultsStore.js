// composables/useResultsStore.js
// ─────────────────────────────────────────────────────
// Схема:
//   Оқушы тест орындайды → saveResult() → localStorage['results_store_v1']
//   Мұғалім кабинеті    → results ref   → сол localStorage-тен оқиды
//
//   Excel қажет емес. Бір localStorage — екі жақ пайдаланады.
// ─────────────────────────────────────────────────────
import { ref, computed } from 'vue'
import * as XLSX from 'xlsx'

const LS_KEY = 'results_store_v1'

// ── Singleton ─────────────────────────────────────────
const results     = ref([])
const initialized = ref(false)

// ── Helpers ───────────────────────────────────────────
function persist(data) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(data)) }
    catch(e) { console.warn('[ResultsStore]', e) }
}

function hydrate() {
    try {
        const raw = localStorage.getItem(LS_KEY)
        return raw ? JSON.parse(raw) : []
    } catch { return [] }
}

function calcGrade(pct) {
    const p = Number(pct || 0)
    if (p >= 90) return 'Өте жақсы'
    if (p >= 70) return 'Жақсы'
    if (p >= 50) return 'Қанағат.'
    return 'Қайталаңыз'
}

// ── PUBLIC COMPOSABLE ─────────────────────────────────
export function useResultsStore() {

    // onMounted-та шақырылады — LS-тен жүктейді
    function init() {
        if (initialized.value) return
        results.value     = hydrate()
        initialized.value = true
    }

    // Оқушы тест аяқтады → localStorage-ке жазады
    function saveResult(payload) {
        if (!initialized.value) init()
        const now = new Date()
        const entry = {
            id:          `r_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            studentId:   String(payload.studentId   || ''),
            studentName: String(payload.studentName || ''),
            class:       String(payload.class       || ''),
            taskId:      String(payload.taskId      || ''),
            taskType:    String(payload.taskType    || ''),
            taskTitle:   String(payload.taskTitle   || ''),
            topic:       String(payload.topic       || ''),
            correct:     Number(payload.correct     || 0),
            total:       Number(payload.total       || 0),
            pct:         Number(payload.pct         || 0),
            grade:       calcGrade(payload.pct),
            date:        now.toLocaleDateString('kk-KZ'),
            time:        now.toLocaleTimeString('kk-KZ', { hour: '2-digit', minute: '2-digit' }),
            createdAt:   now.toISOString(),
        }
        results.value = [entry, ...results.value]
        persist(results.value)
        return entry
    }

    // Мұғалім жеке нәтижені өшіреді
    function deleteResult(id) {
        results.value = results.value.filter(r => r.id !== id)
        persist(results.value)
    }

    // Барлығын тазалау
    function clearAll() {
        results.value = []
        localStorage.removeItem(LS_KEY)
        initialized.value = false
    }

    // Оқушының өз нәтижелері (StudentProfile үшін)
    const getByStudent = (studentId) =>
        computed(() => results.value.filter(r => r.studentId === studentId))

    // Мұғалімнің статистикасы
    const stats = computed(() => {
        const all = results.value
        const avg = all.length
            ? Math.round(all.reduce((s, r) => s + r.pct, 0) / all.length)
            : 0
        return {
            total: all.length,
            avg,
            grades: {
                'Өте жақсы':  all.filter(r => r.grade === 'Өте жақсы').length,
                'Жақсы':      all.filter(r => r.grade === 'Жақсы').length,
                'Қанағат.':   all.filter(r => r.grade === 'Қанағат.').length,
                'Қайталаңыз': all.filter(r => r.grade === 'Қайталаңыз').length,
            },
        }
    })

    // localStorage → .xlsx жүктеу (мұғалімге)
    function exportToExcel() {
        const wb  = XLSX.utils.book_new()
        const hdr = [
            '', 'Оқушы аты', 'Сынып', 'Тапсырма',
            'Тип', 'Тақырып', 'Дұрыс', 'Барлығы', '%', 'Деңгей', 'Күн', 'Уақыт',
        ]
        const rows = results.value.map(r => [
            '', r.studentName, r.class, r.taskTitle,
            r.taskType, r.topic, r.correct, r.total, r.pct, r.grade, r.date, r.time,
        ])
        const ws = XLSX.utils.aoa_to_sheet([[], [], [], [], hdr, ...rows])
        ws['!cols'] = [
            {wch:3},{wch:22},{wch:8},{wch:38},
            {wch:14},{wch:18},{wch:8},{wch:8},{wch:8},{wch:14},{wch:14},{wch:10},
        ]
        XLSX.utils.book_append_sheet(wb, ws, '📊 Нәтижелер')
        XLSX.writeFile(wb, `Нәтижелер_${new Date().toLocaleDateString('kk-KZ')}.xlsx`)
    }

    return {
        results, initialized, stats, calcGrade,
        init, saveResult, deleteResult, clearAll,
        getByStudent, exportToExcel,
    }
}