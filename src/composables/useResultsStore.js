
import { ref, computed } from 'vue'
import * as XLSX from 'xlsx'

const LS_KEY      = 'results_store_v1'
const LS_META_KEY = 'results_store_meta'

// ── Singleton state ───────────────────────────────────
const results = ref([])
const initialized = ref(false)

// ── localStorage helpers ──────────────────────────────
function saveToLS(data) {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(data))
        localStorage.setItem(LS_META_KEY, JSON.stringify({
            savedAt: new Date().toISOString(),
            count:   data.length,
        }))
    } catch(e) { console.warn('[ResultsStore]', e) }
}

function loadFromLS() {
    try {
        const raw = localStorage.getItem(LS_KEY)
        return raw ? JSON.parse(raw) : []
    } catch { return [] }
}

export function getLSResultsMeta() {
    try {
        const raw = localStorage.getItem(LS_META_KEY)
        return raw ? JSON.parse(raw) : null
    } catch { return null }
}

export function useResultsStore() {

    function init() {
        if (initialized.value) return
        results.value = loadFromLS()
        initialized.value = true
    }

    // ── SAVE result ───────────────────────────────────────
    // Бір тапсырма аяқталғанда шақырылады
    function saveResult(data) {
        const now = new Date()
        const entry = {
            id:          `result_${Date.now()}`,
            studentId:   data.studentId   || '',
            studentName: data.studentName || '',
            class:       data.class       || '',
            taskId:      data.taskId      || '',
            taskType:    data.taskType    || '',
            taskTitle:   data.taskTitle   || '',
            topic:       data.topic       || '',
            correct:     Number(data.correct || 0),
            total:       Number(data.total   || 0),
            pct:         Number(data.pct     || 0),
            grade:       calcGrade(data.pct),
            answers:     data.answers     || [],   // оқушы берген жауаптар
            date:        now.toLocaleDateString('kk-KZ'),
            time:        now.toLocaleTimeString('kk-KZ', { hour:'2-digit', minute:'2-digit' }),
            createdAt:   now.toISOString(),
        }
        results.value = [entry, ...results.value]
        saveToLS(results.value)
        return entry
    }

    function deleteResult(id) {
        results.value = results.value.filter(r => r.id !== id)
        saveToLS(results.value)
    }

    function clearAll() {
        results.value = []
        saveToLS(results.value)
    }

    // ── Grade label ───────────────────────────────────────
    function calcGrade(pct) {
        const p = Number(pct || 0)
        if (p >= 90) return 'Өте жақсы'
        if (p >= 70) return 'Жақсы'
        if (p >= 50) return 'Қанағат.'
        return 'Қайталаңыз'
    }

    // ── Getters ───────────────────────────────────────────
    const getByStudent = (studentId) =>
        computed(() => results.value.filter(r => r.studentId === studentId))

    const stats = computed(() => {
        const all = results.value
        const avg = all.length
            ? Math.round(all.reduce((s,r) => s + r.pct, 0) / all.length)
            : 0
        return {
            total:  all.length,
            avg,
            best:   all.reduce((best,r) => r.pct > (best?.pct||0) ? r : best, null),
            grades: {
                'Өте жақсы': all.filter(r => r.grade === 'Өте жақсы').length,
                'Жақсы':     all.filter(r => r.grade === 'Жақсы').length,
                'Қанағат.':  all.filter(r => r.grade === 'Қанағат.').length,
                'Қайталаңыз':all.filter(r => r.grade === 'Қайталаңыз').length,
            }
        }
    })

    // ── Export to Excel ───────────────────────────────────
    function exportToExcel() {
        const wb  = XLSX.utils.book_new()
        const hdr = ['','Оқушы ID','Оқушы аты','Сынып','Тапсырма атауы',
            'Тип','Тақырып','Дұрыс','Барлығы','Пайыз %','Деңгей','Күн','Уақыт']
        const rows = results.value.map(r => [
            '', r.studentId, r.studentName, r.class, r.taskTitle,
            r.taskType, r.topic, r.correct, r.total, r.pct, r.grade, r.date, r.time,
        ])
        const ws = XLSX.utils.aoa_to_sheet([[], [], [], [], hdr, ...rows])
        ws['!cols'] = [{wch:3},{wch:10},{wch:20},{wch:8},{wch:35},{wch:14},
            {wch:18},{wch:8},{wch:8},{wch:10},{wch:14},{wch:14},{wch:10}]
        XLSX.utils.book_append_sheet(wb, ws, '📊 Оқушы нәтижелері')
        XLSX.writeFile(wb, 'Results_MB.xlsx')
    }

    return {
        results, initialized, stats,
        init, saveResult, deleteResult, clearAll,
        getByStudent, calcGrade, exportToExcel,
    }
}