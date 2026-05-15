
import { ref, computed } from 'vue'
import * as XLSX from 'xlsx'
const EXCEL_PATH = '/data/Тапсырмалар_Мәліметтер_Базасы.xlsx'

const LS_KEY      = 'tasks_store_v1'
const LS_META_KEY = 'tasks_store_meta'

// ── Singleton state ───────────────────────────────────
const tasks       = ref([])
const loading     = ref(false)
const error       = ref('')
const initialized = ref(false)

// ── Sheet config ──────────────────────────────────────
// MCQ:     col1=№ col2=text col3=A col4=B col5=C col6=D col7=answer col8=topic col9=level col10=explanation
// TF:      col1=№ col2=text col3=answer col4=topic col5=level col6=explanation
// Fill:    col1=№ col2=text col3=answers col4=topic col5=level col6=explanation
// Match:   col1=groupId col2=title col3=left col4=right col5=topic col6=level col7=explanation

// ── Parse functions ───────────────────────────────────
function parseMCQ(rows) {
    return rows
        .filter(r => String(r[2] || '').trim())
        .map((r, i) => ({
            id:          `mcq_${Number(r[1]) || i + 1}_${Date.now()}`,
            type:        'mcq',
            numId:       Number(r[1]) || i + 1,
            text:        String(r[2]  || ''),
            optionA:     String(r[3]  || ''),
            optionB:     String(r[4]  || ''),
            optionC:     String(r[5]  || ''),
            optionD:     String(r[6]  || ''),
            answer:      Number(r[7]  || 1),   // 1-based
            topic:       String(r[8]  || ''),
            level:       String(r[9]  || 'Оңай'),
            explanation: String(r[10] || ''),
            createdAt:   new Date().toISOString(),
        }))
}

function parseTF(rows) {
    return rows
        .filter(r => String(r[2] || '').trim())
        .map((r, i) => ({
            id:          `tf_${Number(r[1]) || i + 1}_${Date.now()}`,
            type:        'truefalse',
            numId:       Number(r[1]) || i + 1,
            text:        String(r[2]  || ''),
            answer:      r[3] === true || String(r[3]).toUpperCase() === 'TRUE',
            topic:       String(r[4]  || ''),
            level:       String(r[5]  || 'Оңай'),
            explanation: String(r[6]  || ''),
            createdAt:   new Date().toISOString(),
        }))
}

function parseFill(rows) {
    return rows
        .filter(r => String(r[2] || '').trim() && String(r[3] || '').trim())
        .map((r, i) => {
            const rawText = String(r[2] || '')
            const answers = String(r[3] || '').split(',').map(s => s.trim()).filter(Boolean)
            const segments = rawText.split('___')
            const parts = []
            segments.forEach((seg, si) => {
                if (seg) parts.push({ type: 'text', val: seg })
                if (si < segments.length - 1) parts.push({ type: 'blank', idx: si })
            })
            return {
                id:          `fill_${Number(r[1]) || i + 1}_${Date.now()}`,
                type:        'fillblank',
                numId:       Number(r[1]) || i + 1,
                text:        rawText,
                parts,
                answers,
                topic:       String(r[4]  || ''),
                level:       String(r[5]  || 'Орташа'),
                explanation: String(r[6]  || ''),
                createdAt:   new Date().toISOString(),
            }
        })
}

function parseMatch(rows) {
    // Group by groupId (col1)
    const groups = {}
    rows
        .filter(r => String(r[1] || '').trim() && String(r[3] || '').trim() && String(r[4] || '').trim())
        .forEach((r, i) => {
            const gid = String(r[1])
            if (!groups[gid]) {
                groups[gid] = {
                    id:          `match_${gid}_${Date.now() + i}`,
                    type:        'match',
                    numId:       Number(gid) || i + 1,
                    title:       String(r[2] || `Сәйкестендіру ${gid}`),
                    pairs:       [],
                    topic:       String(r[5] || ''),
                    level:       String(r[6] || 'Орташа'),
                    explanation: String(r[7] || ''),
                    createdAt:   new Date().toISOString(),
                }
            }
            groups[gid].pairs.push({
                left:  String(r[3] || ''),
                right: String(r[4] || ''),
            })
        })
    return Object.values(groups).filter(g => g.pairs.length >= 2)
}

// ── localStorage helpers ──────────────────────────────
function saveToLS(data) {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(data))
        localStorage.setItem(LS_META_KEY, JSON.stringify({
            savedAt: new Date().toISOString(),
            count:   data.length,
            mcq:     data.filter(t => t.type === 'mcq').length,
            tf:      data.filter(t => t.type === 'truefalse').length,
            fill:    data.filter(t => t.type === 'fillblank').length,
            match:   data.filter(t => t.type === 'match').length,
        }))
    } catch (e) {
        console.warn('[TasksStore] localStorage write error:', e)
    }
}

function loadFromLS() {
    try {
        const raw = localStorage.getItem(LS_KEY)
        return raw ? JSON.parse(raw) : null
    } catch { return null }
}

export function getLSTasksMeta() {
    try {
        const raw = localStorage.getItem(LS_META_KEY)
        return raw ? JSON.parse(raw) : null
    } catch { return null }
}

// ── Read from Excel ───────────────────────────────────
async function fetchFromExcel() {
    const res = await fetch(EXCEL_PATH)
    if (!res.ok) throw new Error(`Excel файл табылмады: ${EXCEL_PATH} (${res.status})`)
    const buf = await res.arrayBuffer()
    const wb  = XLSX.read(buf, { type: 'array', cellDates: true })

    const data = []
    const sheetParsers = {
        '📝 Тест':       parseMCQ,
        '✅ Дурыс-Бурыс':    parseTF,
        '✍️ Бос орын':       parseFill,
        '🔗 Сәйкестендіру':  parseMatch,
    }

    Object.entries(sheetParsers).forEach(([sheet, parser]) => {
        if (!wb.SheetNames.includes(sheet)) return
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { range: 5, header: 1, defval: '' })
        data.push(...parser(rows))
    })

    return data
}

// ── PUBLIC COMPOSABLE ─────────────────────────────────
export function useTasksStore() {

    async function init(forceReload = false) {
        if (initialized.value && !forceReload) return
        loading.value = true
        error.value   = ''

        if (!forceReload) {
            const cached = loadFromLS()
            if (cached && cached.length > 0) {
                tasks.value       = cached
                initialized.value = true
                loading.value     = false
                return
            }
        }

        try {
            const data        = await fetchFromExcel()
            tasks.value       = data
            initialized.value = true
            saveToLS(data)
        } catch (e) {
            error.value = e.message
            const cached = loadFromLS()
            if (cached) { tasks.value = cached; initialized.value = true }
        } finally {
            loading.value = false
        }
    }

    async function reloadFromExcel() { await init(true) }

    function clearCache() {
        localStorage.removeItem(LS_KEY)
        localStorage.removeItem(LS_META_KEY)
        tasks.value       = []
        initialized.value = false
    }

    // ── CREATE ──────────────────────────────────────────
    function addTask(data) {
        const sameType = tasks.value.filter(t => t.type === data.type)
        const maxId    = sameType.length ? Math.max(...sameType.map(t => t.numId || 0)) : 0
        const numId    = maxId + 1
        const newTask  = {
            ...data,
            id:        `${data.type}_${numId}_${Date.now()}`,
            numId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
        // Rebuild parts for fillblank
        if (newTask.type === 'fillblank' && newTask.text) {
            const segs = newTask.text.split('___')
            const parts = []
            segs.forEach((seg, i) => {
                if (seg) parts.push({ type: 'text', val: seg })
                if (i < segs.length - 1) parts.push({ type: 'blank', idx: i })
            })
            newTask.parts = parts
        }
        tasks.value = [newTask, ...tasks.value]
        saveToLS(tasks.value)
        return newTask
    }

    // ── UPDATE ──────────────────────────────────────────
    function updateTask(id, changes) {
        const idx = tasks.value.findIndex(t => t.id === id)
        if (idx === -1) return false
        const updated = { ...tasks.value[idx], ...changes, id, updatedAt: new Date().toISOString() }
        // Rebuild parts if text changed
        if (updated.type === 'fillblank' && changes.text) {
            const segs = updated.text.split('___')
            const parts = []
            segs.forEach((seg, i) => {
                if (seg) parts.push({ type: 'text', val: seg })
                if (i < segs.length - 1) parts.push({ type: 'blank', idx: i })
            })
            updated.parts = parts
        }
        tasks.value[idx] = updated
        tasks.value = [...tasks.value]
        saveToLS(tasks.value)
        return true
    }

    // ── DELETE ──────────────────────────────────────────
    function deleteTask(id) {
        const before = tasks.value.length
        tasks.value  = tasks.value.filter(t => t.id !== id)
        if (tasks.value.length !== before) { saveToLS(tasks.value); return true }
        return false
    }

    // ── GETTERS ─────────────────────────────────────────
    const getById = (id) => tasks.value.find(t => t.id === id) || null

    const stats = computed(() => ({
        total: tasks.value.length,
        mcq:   tasks.value.filter(t => t.type === 'mcq').length,
        tf:    tasks.value.filter(t => t.type === 'truefalse').length,
        fill:  tasks.value.filter(t => t.type === 'fillblank').length,
        match: tasks.value.filter(t => t.type === 'match').length,
        topics:[...new Set(tasks.value.map(t => t.topic).filter(Boolean))],
    }))

    // ── EXPORT to Excel ──────────────────────────────────
    function exportToExcel() {
        const wb = XLSX.utils.book_new()

        // MCQ sheet
        const mcqHeader = ['', '№', 'Сұрақ мәтіні', 'Нұсқа A', 'Нұсқа B', 'Нұсқа C', 'Нұсқа D', 'Жауап', 'Тақырып', 'Деңгей', 'Түсіндірме']
        const mcqRows = tasks.value.filter(t => t.type === 'mcq').map((t, i) => [
            '', i + 1, t.text, t.optionA, t.optionB, t.optionC, t.optionD,
            t.answer, t.topic, t.level, t.explanation,
        ])
        const mcqSheet = XLSX.utils.aoa_to_sheet([[], [], [], [], mcqHeader, ...mcqRows])
        mcqSheet['!cols'] = [{wch:3},{wch:5},{wch:40},{wch:26},{wch:26},{wch:26},{wch:26},{wch:8},{wch:18},{wch:14},{wch:32}]
        XLSX.utils.book_append_sheet(wb, mcqSheet, '📝 Тест')

        // TF sheet
        const tfHeader = ['', '№', 'Тұжырым мәтіні', 'Жауап', 'Тақырып', 'Деңгей', 'Түсіндірме']
        const tfRows = tasks.value.filter(t => t.type === 'truefalse').map((t, i) => [
            '', i + 1, t.text, t.answer ? 'TRUE' : 'FALSE', t.topic, t.level, t.explanation,
        ])
        const tfSheet = XLSX.utils.aoa_to_sheet([[], [], [], [], tfHeader, ...tfRows])
        tfSheet['!cols'] = [{wch:3},{wch:5},{wch:55},{wch:10},{wch:18},{wch:14},{wch:32}]
        XLSX.utils.book_append_sheet(wb, tfSheet, '✅ Дурыс-Бурыс')

        // Fill sheet
        const fillHeader = ['', '№', 'Мәтін (бос орын = ___)', 'Дұрыс жауаптар (үтірмен)', 'Тақырып', 'Деңгей', 'Түсіндірме']
        const fillRows = tasks.value.filter(t => t.type === 'fillblank').map((t, i) => [
            '', i + 1, t.text, t.answers?.join(', ') || '', t.topic, t.level, t.explanation,
        ])
        const fillSheet = XLSX.utils.aoa_to_sheet([[], [], [], [], fillHeader, ...fillRows])
        fillSheet['!cols'] = [{wch:3},{wch:5},{wch:50},{wch:30},{wch:18},{wch:14},{wch:32}]
        XLSX.utils.book_append_sheet(wb, fillSheet, '✍️ Бос орын')

        // Match sheet
        const matchHeader = ['', 'Топ №', 'Тапсырма атауы', 'Сол баған', 'Оң баған', 'Тақырып', 'Деңгей', 'Түсіндірме']
        const matchRows = []
        tasks.value.filter(t => t.type === 'match').forEach((t, gi) => {
            t.pairs?.forEach(pair => {
                matchRows.push(['', gi + 1, t.title, pair.left, pair.right, t.topic, t.level, t.explanation])
            })
            matchRows.push([]) // empty row between groups
        })
        const matchSheet = XLSX.utils.aoa_to_sheet([[], [], [], [], matchHeader, ...matchRows])
        matchSheet['!cols'] = [{wch:3},{wch:8},{wch:26},{wch:32},{wch:32},{wch:18},{wch:14},{wch:32}]
        XLSX.utils.book_append_sheet(wb, matchSheet, '🔗 Сәйкестендіру')

        XLSX.writeFile(wb, 'Тапсырмалар_Мәліметтер_Базасы.xlsx')
    }

    return {
        tasks, loading, error, initialized, stats,
        init, reloadFromExcel, clearCache,
        addTask, updateTask, deleteTask, getById,
        exportToExcel, getLSTasksMeta,
    }
}