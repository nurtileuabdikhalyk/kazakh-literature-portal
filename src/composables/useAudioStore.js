// composables/useAudioStore.js
// ─────────────────────────────────────────────────────
// Supabase → audio_tracks + audio_lines + audio_glossary
// Excel жоқ, localStorage жоқ — тек Supabase
// ─────────────────────────────────────────────────────
import { ref, computed } from 'vue'
import { supabase } from './useSupabase'

// ── Singleton ─────────────────────────────────────────
const tracks      = ref([])
const loading     = ref(false)
const error       = ref('')
const initialized = ref(false)

// ── MAP ───────────────────────────────────────────────
function mapTrack(r, lines = [], glossary = []) {
    // Glossary map: word → { definition, example, tag }
    const glossMap = {}
    glossary.filter(g => g.track_id === r.id).forEach(g => {
        glossMap[g.word.trim()] = { def: g.definition || '', example: g.example || '', tag: g.tag || 'Ескі сөз' }
    })

    // Lines → words with hard words highlighted
    const mappedLines = lines
        .filter(l => l.track_id === r.id)
        .sort((a, b) => a.line_order - b.line_order)
        .map(l => {
            const words = (l.text || '').split(/\s+/).map(raw => {
                const clean = raw.replace(/[,.'!?—:;()]/g, '')
                return glossMap[clean]
                    ? { text: raw, hard: true, ...glossMap[clean] }
                    : { text: raw }
            })
            return { time: l.time_sec || 0, text: l.text, words }
        })

    return {
        id:         r.id,
        title:      r.title      || '',
        author:     r.author     || '',
        genre:      r.genre      || '',
        duration:   r.duration   || '',
        totalSec:   r.total_sec  || 0,
        color:      r.color      || '#c4922a',
        cover:      r.cover      || '',
        fileUrl:    r.file_url   || '',
        bookmarked: r.bookmarked || false,
        lines:      mappedLines,
    }
}

// ── PUBLIC COMPOSABLE ─────────────────────────────────
export function useAudioStore() {

    async function init(forceReload = false) {
        if (initialized.value && !forceReload) return
        loading.value = true
        error.value   = ''
        try {
            // Параллельді 3 сұраным
            const [tracksRes, linesRes, glossRes] = await Promise.all([
                supabase.from('audio_tracks') .select('*').order('id'),
                supabase.from('audio_lines')  .select('*').order('line_order'),
                supabase.from('audio_glossary').select('*'),
            ])

            if (tracksRes.error) throw tracksRes.error
            if (linesRes.error)  throw linesRes.error
            if (glossRes.error)  throw glossRes.error

            tracks.value      = (tracksRes.data || []).map(r =>
                mapTrack(r, linesRes.data || [], glossRes.data || [])
            )
            initialized.value = true
        } catch(e) {
            error.value = e.message || 'Supabase қосылу қатесі'
            console.error('[AudioStore]', e)
        } finally {
            loading.value = false
        }
    }

    async function reloadFromExcel() { await init(true) } // alias

    // Bookmark → Supabase UPDATE
    async function toggleBookmark(trackId) {
        const track = tracks.value.find(t => t.id === trackId)
        if (!track) return
        const newVal = !track.bookmarked
        const { error: err } = await supabase
            .from('audio_tracks')
            .update({ bookmarked: newVal })
            .eq('id', trackId)
        if (err) { console.error('[AudioStore] toggleBookmark:', err); return }
        tracks.value = tracks.value.map(t =>
            t.id === trackId ? { ...t, bookmarked: newVal } : t
        )
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