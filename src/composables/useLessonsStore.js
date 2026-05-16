// composables/useLessonsStore.js
// ─────────────────────────────────────────────────────
// Supabase → lessons кестесі
// Excel жоқ, localStorage жоқ — тек Supabase
// ─────────────────────────────────────────────────────
import { ref, computed } from 'vue'
import { supabase } from './useSupabase'

// ── Singleton ─────────────────────────────────────────
const lessons     = ref([])
const loading     = ref(false)
const error       = ref('')
const initialized = ref(false)

export function useLessonsStore() {

    // ── FETCH from Supabase ───────────────────────────────
    async function init(forceReload = false) {
        if (initialized.value && !forceReload) return
        loading.value = true
        error.value   = ''
        try {
            const { data, error: err } = await supabase
                .from('lessons')
                .select('*')
                .order('id', { ascending: true })
            if (err) throw err
            lessons.value     = (data || []).map(mapRow)
            initialized.value = true
        } catch(e) {
            error.value = e.message || 'Supabase қосылу қатесі'
            console.error('[LessonsStore]', e)
        } finally {
            loading.value = false
        }
    }

    async function reloadFromExcel() { await init(true) } // naming kept for compatibility

    // ── MAP Supabase row → app format ─────────────────────
    function mapRow(r) {
        return {
            id:          r.id,
            type:        r.type        || 'video',
            title:       r.title       || '',
            author:      r.author      || '',
            fileUrl:     r.file_url    || '',
            cover:       r.cover       || '',
            duration:    r.duration    || '',
            level:       r.level       || 'Орташа',
            topic:       r.topic       || '',
            category:    r.category    || '',
            description: r.description || '',
            featured:    r.featured    || false,
            createdAt:   r.created_at  || '',
        }
    }

    // ── CRUD ─────────────────────────────────────────────

    async function addLesson(data) {
        const { data: row, error: err } = await supabase
            .from('lessons')
            .insert([toRow(data)])
            .select()
            .single()
        if (err) throw err
        const mapped = mapRow(row)
        lessons.value = [...lessons.value, mapped]
        return mapped
    }

    async function updateLesson(id, data) {
        const { data: row, error: err } = await supabase
            .from('lessons')
            .update({ ...toRow(data), updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()
        if (err) throw err
        const mapped = mapRow(row)
        lessons.value = lessons.value.map(l => l.id === id ? mapped : l)
        return mapped
    }

    async function deleteLesson(id) {
        const { error: err } = await supabase.from('lessons').delete().eq('id', id)
        if (err) throw err
        lessons.value = lessons.value.filter(l => l.id !== id)
    }

    // app format → Supabase row
    function toRow(d) {
        return {
            type:        d.type        || 'video',
            title:       d.title       || '',
            author:      d.author      || '',
            file_url:    d.fileUrl     || '',
            cover:       d.cover       || '',
            duration:    d.duration    || '',
            level:       d.level       || 'Орташа',
            topic:       d.topic       || '',
            category:    d.category    || '',
            description: d.description || '',
            featured:    d.featured    || false,
        }
    }

    // ── GET BY ID ─────────────────────────────────────────
    function getById(id) {
        return lessons.value.find(l => l.id === Number(id)) || null
    }

    // ── Computed ─────────────────────────────────────────
    const stats = computed(() => ({
        total: lessons.value.length,
        video: lessons.value.filter(l => l.type === 'video').length,
        text:  lessons.value.filter(l => l.type === 'text').length,
        pdf:   lessons.value.filter(l => l.type === 'pdf').length,
    }))

    return {
        lessons, loading, error, initialized, stats,
        init,
        reloadFromExcel,
        addLesson, updateLesson, deleteLesson,
        getById,
    }
}