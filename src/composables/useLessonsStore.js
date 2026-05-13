
import { ref, computed } from 'vue'
import * as XLSX from 'xlsx'

const EXCEL_PATH = '/src/assets/datas/Sabaqtar_MB.xlsx'
const LS_KEY      = 'lessons_store_v1'
const LS_META_KEY = 'lessons_store_meta'

// ── Singleton state ───────────────────────────────────
const lessons  = ref([])   // barлық сабақтар
const loading  = ref(false)
const error    = ref('')
const initialized = ref(false)

// ── Sheet → type mapping ──────────────────────────────
const SHEET_TYPE = {
    '🎬 Видео сабақтар': 'video',
    '📄 Конспекттер':    'text',
    '📑 PDF материалдар':'pdf',
}
const TYPE_SHEET = {
    video: '🎬 Видео сабақтар',
    text:  '📄 Конспекттер',
    pdf:   '📑 PDF материалдар',
}

// ── Columns (0-indexed) ───────────────────────────────
// 0=skip 1=№ 2=title 3=author 4=fileUrl
// 5=cover 6=duration 7=level 8=topic 9=category 10=description

function rowToLesson(row, type, sheetRowIndex) {
    return {
        id:          `${type}_${Number(row[1]) || sheetRowIndex}`,
        type,
        numId:       Number(row[1]) || sheetRowIndex,
        title:       String(row[2]  || ''),
        author:      String(row[3]  || ''),
        fileUrl:     String(row[4]  || ''),
        cover:       String(row[5]  || ''),
        duration:    String(row[6]  || ''),
        level:       String(row[7]  || 'Орташа'),
        topic:       String(row[8]  || ''),
        category:    String(row[9]  || ''),
        description: String(row[10] || ''),
        featured:    type === 'video' && sheetRowIndex === 0,
        createdAt:   new Date().toISOString(),
    }
}

// ── localStorage helpers ──────────────────────────────
function saveToLS(data) {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(data))
        localStorage.setItem(LS_META_KEY, JSON.stringify({
            savedAt: new Date().toISOString(),
            count:   data.length,
        }))
    } catch(e) {
        console.warn('[LessonsStore] localStorage write error:', e)
    }
}

function loadFromLS() {
    try {
        const raw = localStorage.getItem(LS_KEY)
        return raw ? JSON.parse(raw) : null
    } catch {
        return null
    }
}

export function getLSMeta() {
    try {
        const raw = localStorage.getItem(LS_META_KEY)
        return raw ? JSON.parse(raw) : null
    } catch { return null }
}

// ── Read Excel → parse → return array ────────────────
async function fetchFromExcel() {
    const res = await fetch(EXCEL_PATH)
    if (!res.ok) throw new Error(`Excel файл табылмады: ${EXCEL_PATH} (${res.status})`)
    const buf = await res.arrayBuffer()
    const wb  = XLSX.read(buf, { type: 'array' })
    const data = []

    Object.entries(SHEET_TYPE).forEach(([sheetName, type]) => {
        if (!wb.SheetNames.includes(sheetName)) return
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { range:5, header:1, defval:'' })
        rows
            .filter(r => String(r[2]||'').trim())
            .forEach((r, i) => data.push(rowToLesson(r, type, i)))
    })

    return data
}

// ── PUBLIC COMPOSABLE ─────────────────────────────────
export function useLessonsStore() {

    // Initialize — called once on app start or first use
    async function init(forceReload = false) {
        if (initialized.value && !forceReload) return

        loading.value = true
        error.value   = ''

        // Try localStorage first
        if (!forceReload) {
            const cached = loadFromLS()
            if (cached && cached.length > 0) {
                lessons.value   = cached
                initialized.value = true
                loading.value   = false
                return
            }
        }

        // Fallback: read from Excel
        try {
            const data      = await fetchFromExcel()
            lessons.value   = data
            initialized.value = true
            saveToLS(data)
        } catch(e) {
            error.value = e.message
            // If Excel not available but LS has data — use it
            const cached = loadFromLS()
            if (cached) { lessons.value = cached; initialized.value = true }
        } finally {
            loading.value = false
        }
    }

    // Force reload from Excel (мұғалім «Excel-ден қайта жүктеу» батырмасын бассаңыз)
    async function reloadFromExcel() {
        await init(true)
    }

    // Clear localStorage and reload
    function clearCache() {
        localStorage.removeItem(LS_KEY)
        localStorage.removeItem(LS_META_KEY)
        lessons.value   = []
        initialized.value = false
    }

    // ── CREATE ───────────────────────────────────────────
    function addLesson(lessonData) {
        // Generate unique numId per type
        const sameType = lessons.value.filter(l => l.type === lessonData.type)
        const maxId    = sameType.length ? Math.max(...sameType.map(l => l.numId || 0)) : 0
        const numId    = maxId + 1

        const newLesson = {
            id:          `${lessonData.type}_${numId}_${Date.now()}`,
            numId,
            type:        lessonData.type        || 'video',
            title:       lessonData.title       || '',
            author:      lessonData.author      || '',
            fileUrl:     lessonData.fileUrl     || '',
            cover:       lessonData.cover       || '',
            duration:    lessonData.duration    || '',
            level:       lessonData.level       || 'Орташа',
            topic:       lessonData.topic       || '',
            category:    lessonData.category    || lessonData.topic || '',
            description: lessonData.description || '',
            classes:     lessonData.classes     || [],
            featured:    false,
            createdAt:   new Date().toISOString(),
            updatedAt:   new Date().toISOString(),
        }

        lessons.value = [newLesson, ...lessons.value]
        saveToLS(lessons.value)
        return newLesson
    }

    // ── UPDATE ───────────────────────────────────────────
    function updateLesson(id, changes) {
        const idx = lessons.value.findIndex(l => l.id === id)
        if (idx === -1) return false
        lessons.value[idx] = {
            ...lessons.value[idx],
            ...changes,
            id,
            updatedAt: new Date().toISOString(),
        }
        lessons.value = [...lessons.value]  // trigger reactivity
        saveToLS(lessons.value)
        return true
    }

    // ── DELETE ───────────────────────────────────────────
    function deleteLesson(id) {
        const before = lessons.value.length
        lessons.value = lessons.value.filter(l => l.id !== id)
        if (lessons.value.length !== before) {
            saveToLS(lessons.value)
            return true
        }
        return false
    }

    // ── GETTERS ──────────────────────────────────────────
    const byType = (type) => computed(() =>
        type === 'all' ? lessons.value : lessons.value.filter(l => l.type === type)
    )

    const getById = (id) => lessons.value.find(l => l.id === id) || null

    const stats = computed(() => ({
        total: lessons.value.length,
        video: lessons.value.filter(l => l.type === 'video').length,
        text:  lessons.value.filter(l => l.type === 'text').length,
        pdf:   lessons.value.filter(l => l.type === 'pdf').length,
        topics:[...new Set(lessons.value.map(l => l.topic).filter(Boolean))],
    }))

    // ── EXPORT back to Excel ──────────────────────────────
    // localStorage → .xlsx file download
    function exportToExcel() {
        const wb = XLSX.utils.book_new()

        // Header row (matches original Excel format)
        const headerRow = [
            '', '№', 'Сабақ атауы', 'Автор / Оқытушы',
            'Файл жолы', 'Мұқаба сурет URL',
            'Ұзақтығы', 'Деңгей', 'Тақырып', 'Санат', 'Сипаттама',
        ]

        Object.entries(TYPE_SHEET).forEach(([type, sheetName]) => {
            const typeLessons = lessons.value.filter(l => l.type === type)

            const titleRow = [`${sheetName} — экспорт`]
            const subRow   = [`Жаңартылды: ${new Date().toLocaleString('kk-KZ')}`]
            const emptyRow = []

            const dataRows = typeLessons.map((l, i) => [
                '', i + 1, l.title, l.author, l.fileUrl,
                l.cover, l.duration, l.level, l.topic, l.category, l.description,
            ])

            const aoa = [titleRow, subRow, emptyRow, emptyRow, headerRow, ...dataRows]
            const ws  = XLSX.utils.aoa_to_sheet(aoa)

            // Column widths
            ws['!cols'] = [
                {wch:3},{wch:5},{wch:40},{wch:25},{wch:42},
                {wch:30},{wch:12},{wch:12},{wch:18},{wch:18},{wch:35},
            ]

            XLSX.utils.book_append_sheet(wb, ws, sheetName)
        })

        XLSX.writeFile(wb, 'Sabaqtar_MB.xlsx')
    }

    return {
        // state
        lessons, loading, error, initialized,
        // init
        init, reloadFromExcel, clearCache,
        // crud
        addLesson, updateLesson, deleteLesson,
        // getters
        byType, getById, stats,
        // export
        exportToExcel,
        // meta
        getLSMeta,
    }
}