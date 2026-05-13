import { ref, computed } from 'vue'
import * as XLSX from 'xlsx'

const EXCEL_PATH  = '/data/Auth_MB.xlsx'
const LS_KEY      = 'comments_store_v1'
const LS_META_KEY = 'comments_store_meta'

// ── Singleton state ───────────────────────────────────
const comments    = ref([])
const loading     = ref(false)
const error       = ref('')
const initialized = ref(false)

// ── Helpers ───────────────────────────────────────────
function saveToLS(data) {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(data))
        localStorage.setItem(LS_META_KEY, JSON.stringify({
            savedAt:     new Date().toISOString(),
            total:       data.length,
            unread:      data.filter(c => !c.reply).length,
            withReply:   data.filter(c => !!c.reply).length,
        }))
    } catch(e) { console.warn('[CommentsStore] LS write error:', e) }
}

function loadFromLS() {
    try {
        const raw = localStorage.getItem(LS_KEY)
        return raw ? JSON.parse(raw) : null
    } catch { return null }
}

export function getLSCommentsMeta() {
    try {
        const raw = localStorage.getItem(LS_META_KEY)
        return raw ? JSON.parse(raw) : null
    } catch { return null }
}

// ── Parse Excel row ───────────────────────────────────
// cols: 0=skip 1=studentId 2=name 3=class 4=lessonName
//        5=rating 6=text 7=date 8=reply 9=replyDate
function parseRow(r, i) {
    return {
        id:          `comment_${i}_${Date.now()}`,
        studentId:   String(r[1] || ''),
        studentName: String(r[2] || ''),
        class:       String(r[3] || ''),
        lessonName:  String(r[4] || ''),
        rating:      Number(r[5] || 5),
        text:        String(r[6] || ''),
        date:        String(r[7] || ''),
        reply:       r[8] ? String(r[8]) : '',
        replyDate:   r[9] ? String(r[9]) : '',
        createdAt:   new Date().toISOString(),
    }
}

async function fetchFromExcel() {
    const res = await fetch(EXCEL_PATH)
    if (!res.ok) throw new Error(`Auth_MB.xlsx табылмады (${res.status})`)
    const buf   = await res.arrayBuffer()
    const wb    = XLSX.read(buf, { type: 'array' })
    const sheet = wb.Sheets['💬 Пікірлер']
    if (!sheet) throw new Error('«💬 Пікірлер» беті жоқ')
    return XLSX.utils.sheet_to_json(sheet, { range: 5, header: 1, defval: '' })
        .filter(r => String(r[1] || '').trim())
        .map((r, i) => parseRow(r, i))
}

// ── PUBLIC COMPOSABLE ─────────────────────────────────
export function useCommentsStore() {

    async function init(forceReload = false) {
        if (initialized.value && !forceReload) return
        loading.value = true; error.value = ''
        if (!forceReload) {
            const cached = loadFromLS()
            if (cached && cached.length > 0) {
                comments.value = cached; initialized.value = true
                loading.value = false; return
            }
        }
        try {
            const data = await fetchFromExcel()
            comments.value = data; initialized.value = true
            saveToLS(data)
        } catch(e) {
            error.value = e.message
            const cached = loadFromLS()
            if (cached) { comments.value = cached; initialized.value = true }
        } finally { loading.value = false }
    }

    async function reloadFromExcel() { await init(true) }

    // ── CREATE (оқушы пікір жазады) ──────────────────────
    function addComment(data) {
        const now = new Date()
        const c = {
            id:          `comment_${Date.now()}`,
            studentId:   data.studentId   || '',
            studentName: data.studentName || '',
            class:       data.class       || '',
            lessonName:  data.lessonName  || '',
            rating:      Number(data.rating) || 5,
            text:        String(data.text || '').trim(),
            date:        now.toLocaleDateString('kk-KZ'),
            reply:       '',
            replyDate:   '',
            createdAt:   now.toISOString(),
            isNew:       true,   // мұғалімге жаңа екенін белгілейді
        }
        comments.value = [c, ...comments.value]
        saveToLS(comments.value)
        return c
    }

    // ── REPLY (мұғалім жауап береді) ─────────────────────
    function addReply(commentId, replyText) {
        const idx = comments.value.findIndex(c => c.id === commentId)
        if (idx === -1) return false
        comments.value[idx] = {
            ...comments.value[idx],
            reply:       String(replyText).trim(),
            replyDate:   new Date().toLocaleDateString('kk-KZ'),
            isNew:       false,
            updatedAt:   new Date().toISOString(),
        }
        comments.value = [...comments.value]
        saveToLS(comments.value)
        return true
    }

    // ── UPDATE reply ──────────────────────────────────────
    function updateReply(commentId, newText) {
        return addReply(commentId, newText)
    }

    // ── DELETE ────────────────────────────────────────────
    function deleteComment(commentId) {
        const before = comments.value.length
        comments.value = comments.value.filter(c => c.id !== commentId)
        if (comments.value.length !== before) { saveToLS(comments.value); return true }
        return false
    }

    // ── MARK AS READ ──────────────────────────────────────
    function markRead(commentId) {
        const idx = comments.value.findIndex(c => c.id === commentId)
        if (idx !== -1) {
            comments.value[idx] = { ...comments.value[idx], isNew: false }
            comments.value = [...comments.value]
            saveToLS(comments.value)
        }
    }

    // ── GETTERS ───────────────────────────────────────────
    const getByLesson   = (name) => computed(() => comments.value.filter(c => c.lessonName === name))
    const getByStudent  = (id)   => computed(() => comments.value.filter(c => c.studentId === id))
    const unreadCount   = computed(() => comments.value.filter(c => !c.reply).length)
    const newCount      = computed(() => comments.value.filter(c => c.isNew).length)

    const stats = computed(() => ({
        total:     comments.value.length,
        unread:    comments.value.filter(c => !c.reply).length,
        replied:   comments.value.filter(c => !!c.reply).length,
        avgRating: comments.value.length
            ? Math.round(comments.value.reduce((s,c) => s+c.rating, 0) / comments.value.length * 10) / 10
            : 0,
    }))

    // ── EXPORT to Excel ───────────────────────────────────
    function exportToExcel() {
        const wb  = XLSX.utils.book_new()
        const hdr = ['','Оқушы ID','Оқушы аты','Сынып','Сабақ / Тест атауы','Рейтинг','Пікір мәтіні','Жазылған күн','Мұғалім жауабы','Жауап күні']
        const rows = comments.value.map(c => [
            '', c.studentId, c.studentName, c.class, c.lessonName,
            c.rating, c.text, c.date, c.reply, c.replyDate,
        ])
        const ws = XLSX.utils.aoa_to_sheet([[], [], [], [], hdr, ...rows])
        ws['!cols'] = [{wch:3},{wch:10},{wch:20},{wch:8},{wch:28},{wch:8},{wch:45},{wch:16},{wch:45},{wch:16}]
        XLSX.utils.book_append_sheet(wb, ws, '💬 Пікірлер')
        XLSX.writeFile(wb, 'Auth_MB_comments.xlsx')
    }

    return {
        comments, loading, error, initialized,
        stats, unreadCount, newCount,
        init, reloadFromExcel,
        addComment, addReply, updateReply, deleteComment, markRead,
        getByLesson, getByStudent,
        exportToExcel, getLSCommentsMeta,
    }
}