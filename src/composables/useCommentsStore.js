// composables/useCommentsStore.js
// ─────────────────────────────────────────────────────
// Supabase → comments кестесі
// Excel жоқ, localStorage жоқ — тек Supabase
// Оқушы пікір жазады → INSERT
// Мұғалім жауап береді → UPDATE reply
// ─────────────────────────────────────────────────────
import { ref, computed } from 'vue'
import { supabase } from './useSupabase'

// ── Singleton ─────────────────────────────────────────
const comments    = ref([])
const loading     = ref(false)
const error       = ref('')
const initialized = ref(false)

// ── MAP Supabase row → app format ─────────────────────
function mapRow(r) {
    return {
        id:          r.id,
        studentId:   r.student_id,
        studentName: r.student_name,
        class:       r.class        || '',
        lessonName:  r.lesson_name  || '',
        rating:      r.rating       || 5,
        text:        r.text         || '',
        reply:       r.reply        || '',
        replyDate:   r.reply_date
            ? new Date(r.reply_date).toLocaleDateString('kk-KZ')
            : '',
        isNew:       r.is_new       ?? true,
        date:        r.created_at
            ? new Date(r.created_at).toLocaleDateString('kk-KZ')
            : '',
        createdAt:   r.created_at   || '',
    }
}

// ── PUBLIC COMPOSABLE ─────────────────────────────────
export function useCommentsStore() {

    // ── FETCH ─────────────────────────────────────────────
    async function init(forceReload = false) {
        if (initialized.value && !forceReload) return
        loading.value = true
        error.value   = ''
        try {
            const { data, error: err } = await supabase
                .from('comments')
                .select('*')
                .order('created_at', { ascending: false })
            if (err) throw err
            comments.value    = (data || []).map(mapRow)
            initialized.value = true
        } catch(e) {
            error.value = e.message || 'Supabase қосылу қатесі'
            console.error('[CommentsStore]', e)
        } finally {
            loading.value = false
        }
    }

    async function reloadFromExcel() { await init(true) } // alias

    // ── ADD COMMENT (оқушы жазады) ────────────────────────
    async function addComment(data) {
        const { data: row, error: err } = await supabase
            .from('comments')
            .insert([{
                student_id:   data.studentId   || '',
                student_name: data.studentName || '',
                class:        data.class       || '',
                lesson_name:  data.lessonName  || '',
                rating:       data.rating      || 5,
                text:         data.text        || '',
                is_new:       true,
            }])
            .select()
            .single()
        if (err) throw err
        const mapped = mapRow(row)
        comments.value = [mapped, ...comments.value]
        return mapped
    }

    // ── ADD REPLY (мұғалім жауап береді) ─────────────────
    async function addReply(commentId, replyText) {
        const { data: row, error: err } = await supabase
            .from('comments')
            .update({
                reply:      replyText,
                reply_date: new Date().toISOString(),
                is_new:     false,
            })
            .eq('id', commentId)
            .select()
            .single()
        if (err) throw err
        const mapped = mapRow(row)
        comments.value = comments.value.map(c => c.id === commentId ? mapped : c)
        return mapped
    }

    // ── UPDATE REPLY (мұғалім жауапты өзгертеді) ─────────
    async function updateReply(commentId, newText) {
        return addReply(commentId, newText)
    }

    // ── DELETE (мұғалім өшіреді) ──────────────────────────
    async function deleteComment(commentId) {
        const { error: err } = await supabase
            .from('comments')
            .delete()
            .eq('id', commentId)
        if (err) throw err
        comments.value = comments.value.filter(c => c.id !== commentId)
    }

    // ── MARK AS READ ──────────────────────────────────────
    async function markRead(commentId) {
        await supabase
            .from('comments')
            .update({ is_new: false })
            .eq('id', commentId)
        comments.value = comments.value.map(c =>
            c.id === commentId ? { ...c, isNew: false } : c
        )
    }

    // ── Getters ───────────────────────────────────────────
    const getByLesson  = (name) => computed(() =>
        comments.value.filter(c => c.lessonName === name)
    )
    const getByStudent = (id) => computed(() =>
        comments.value.filter(c => c.studentId === id)
    )

    const unreadCount = computed(() =>
        comments.value.filter(c => !c.reply).length
    )
    const newCount = computed(() =>
        comments.value.filter(c => c.isNew).length
    )

    const stats = computed(() => ({
        total:     comments.value.length,
        unread:    comments.value.filter(c => !c.reply).length,
        replied:   comments.value.filter(c => !!c.reply).length,
        avgRating: comments.value.length
            ? Math.round(
            comments.value.reduce((s, c) => s + c.rating, 0)
            / comments.value.length * 10
        ) / 10
            : 0,
    }))

    return {
        comments, loading, error, initialized,
        stats, unreadCount, newCount,
        init, reloadFromExcel,
        addComment, addReply, updateReply,
        deleteComment, markRead,
        getByLesson, getByStudent,
    }
}