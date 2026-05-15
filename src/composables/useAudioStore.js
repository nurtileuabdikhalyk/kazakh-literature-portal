import { ref, computed } from 'vue'
import * as XLSX from 'xlsx'

const EXCEL_PATH  = '/data/AudioVisual_MB.xlsx'
const LS_KEY      = 'audio_store_v1'
const LS_META_KEY = 'audio_store_meta'

// ── Singleton state ───────────────────────────────────
const tracks      = ref([])
const loading     = ref(false)
const error       = ref('')
const initialized = ref(false)

// ── localStorage helpers ──────────────────────────────
function saveToLS(data) {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(data))
        localStorage.setItem(LS_META_KEY, JSON.stringify({
            savedAt: new Date().toISOString(),
            count:   data.length,
        }))
    } catch(e) { console.warn('[AudioStore] LS write error:', e) }
}

function loadFromLS() {
    try {
        const raw = localStorage.getItem(LS_KEY)
        return raw ? JSON.parse(raw) : null
    } catch { return null }
}

// ── Parse Excel ───────────────────────────────────────
// Sheet 1: 🎵 Аудио треки  — row 6+
// cols: 0=skip 1=№ 2=title 3=author 4=genre 5=duration 6=totalSec 7=color 8=cover 9=bookmarked
// Sheet 2: 📝 Мәтін жолдары — row 6+
// cols: 0=skip 1=trackNo 2=lineNo 3=timeSec 4=text
// Sheet 3: 📖 Сөздік — row 6+
// cols: 0=skip 1=trackNo 2=word 3=def 4=example 5=tag

async function fetchFromExcel() {
    const res = await fetch(EXCEL_PATH)
    if (!res.ok) throw new Error(`AudioVisual_MB.xlsx табылмады (${res.status})`)
    const wb = XLSX.read(await res.arrayBuffer(), { type: 'array' })

    // ── 1. Tracks ─────────────────────────────────────
    const trackSheet = wb.Sheets['🎵 Аудио треки']
    if (!trackSheet) throw new Error('«🎵 Аудио треки» беті жоқ')

    const trackRows = XLSX.utils.sheet_to_json(trackSheet, { range: 5, header: 1, defval: '' })
        .filter(r => r[1]) // №  бос емес

    // ── 2. Lines ──────────────────────────────────────
    const lineSheet = wb.Sheets['📝 Мәтін жолдары']
    const lineRows  = lineSheet
        ? XLSX.utils.sheet_to_json(lineSheet, { range: 5, header: 1, defval: '' }).filter(r => r[1])
        : []

    // ── 3. Glossary ───────────────────────────────────
    const glossSheet = wb.Sheets['📖 Сөздік']
    const glossRows  = glossSheet
        ? XLSX.utils.sheet_to_json(glossSheet, { range: 5, header: 1, defval: '' }).filter(r => r[2])
        : []

    // Build glossary map: trackNo → { word → { def, example, tag } }
    const glossMap = {}
    glossRows.forEach(r => {
        const tno  = Number(r[1])
        const word = String(r[2]).trim()
        if (!glossMap[tno]) glossMap[tno] = {}
        glossMap[tno][word] = {
            def:     String(r[3] || ''),
            example: String(r[4] || ''),
            tag:     String(r[5] || 'Ескі сөз'),
        }
    })

    // Build lines map: trackNo → [ { time, text, words[] } ]
    const linesMap = {}
    lineRows.forEach(r => {
        const tno  = Number(r[1])
        const time = Number(r[3] || 0)
        const text = String(r[4] || '').trim()
        if (!linesMap[tno]) linesMap[tno] = []

        // Parse words — highlight hard words from glossary
        const gloss = glossMap[tno] || {}
        const words = text.split(/\s+/).map(raw => {
            const clean = raw.replace(/[,.'!?—]/g, '')
            if (gloss[clean]) {
                return { text: raw, hard: true, ...gloss[clean] }
            }
            return { text: raw }
        })

        linesMap[tno].push({ time, text, words })
    })

    // Assemble final tracks array
    // cols: 0=skip 1=№ 2=title 3=author 4=genre 5=duration 6=totalSec 7=color 8=cover 9=fileUrl 10=bookmarked
    const data = trackRows.map(r => {
        const tno = Number(r[1])
        return {
            id:         tno,
            title:      String(r[2] || ''),
            author:     String(r[3] || ''),
            genre:      String(r[4] || ''),
            duration:   String(r[5] || ''),
            totalSec:   Number(r[6] || 0),
            color:      String(r[7] || '#c4922a'),
            cover:      String(r[8] || ''),
            fileUrl:    String(r[9] || ''),   // /audios/fayl.mp3
            bookmarked: String(r[10]).toUpperCase() === 'TRUE',
            lines:      (linesMap[tno] || []).sort((a, b) => a.time - b.time),
        }
    })

    return data
}

// ── PUBLIC COMPOSABLE ─────────────────────────────────
export function useAudioStore() {

    async function init(forceReload = false) {
        if (initialized.value && !forceReload) return
        loading.value = true
        error.value   = ''

        // Try localStorage cache first
        if (!forceReload) {
            const cached = loadFromLS()
            if (cached && cached.length > 0) {
                tracks.value      = cached
                initialized.value = true
                loading.value     = false
                return
            }
        }

        // Read from Excel
        try {
            const data        = await fetchFromExcel()
            tracks.value      = data
            initialized.value = true
            saveToLS(data)
        } catch(e) {
            error.value = e.message
            const cached = loadFromLS()
            if (cached) { tracks.value = cached; initialized.value = true }
        } finally {
            loading.value = false
        }
    }

    async function reloadFromExcel() { await init(true) }

    // Bookmark-ты localStorage-ке сақтайды
    function toggleBookmark(trackId) {
        const t = tracks.value.find(t => t.id === trackId)
        if (!t) return
        t.bookmarked = !t.bookmarked
        tracks.value = [...tracks.value]
        saveToLS(tracks.value)
    }

    const stats = computed(() => ({
        total:      tracks.value.length,
        bookmarked: tracks.value.filter(t => t.bookmarked).length,
        genres:     [...new Set(tracks.value.map(t => t.genre).filter(Boolean))],
    }))

    return {
        tracks, loading, error, initialized, stats,
        init, reloadFromExcel, toggleBookmark,
    }
}