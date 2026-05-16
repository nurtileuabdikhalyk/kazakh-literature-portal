
import { ref, computed } from 'vue'
import { supabase } from './useSupabase'

// ── Singleton state ───────────────────────────────────
const quizzes     = ref([])   // { id, topic, level, time_min, questions[] }
const loading     = ref(false)
const error       = ref('')
const initialized = ref(false)

// ── PUBLIC COMPOSABLE ─────────────────────────────────
export function useQuizStore() {

    // ── Supabase-тен quizzes + questions жүктеу ─────────
    async function init(forceReload = false) {
        if (initialized.value && !forceReload) return
        loading.value = true
        error.value   = ''

        try {
            // 1. Барлық тест топтарын аламыз
            const { data: quizData, error: qErr } = await supabase
                .from('quizzes')
                .select('*')
                .order('level', { ascending: true })
                .order('topic', { ascending: true })

            if (qErr) throw qErr

            // 2. Барлық сұрақтарды аламыз
            const { data: qsData, error: qsErr } = await supabase
                .from('questions')
                .select('*')
                .order('id', { ascending: true })

            if (qsErr) throw qsErr

            // 3. Сұрақтарды тест топтарына топтастырамыз
            quizzes.value = quizData.map(quiz => ({
                ...quiz,
                questions: (qsData || [])
                    .filter(q => q.quiz_id === quiz.id)
                    .map(parseQuestion),
                lastScore: null,  // UI state
            }))

            initialized.value = true
        } catch(e) {
            error.value = e.message || 'Supabase қосылу қатесі'
            console.error('[QuizStore]', e)
        } finally {
            loading.value = false
        }
    }

    // ── Excel-дегі parseQuestion-мен бірдей форматқа ────
    function parseQuestion(r) {
        const base = {
            id:          r.id,
            quiz_id:     r.quiz_id,
            type:        r.type,
            text:        r.text || '',
            topic:       r.topic || '',
            explanation: r.explanation || '',
        }

        if (r.type === 'mcq') {
            return {
                ...base,
                options: [r.option_a, r.option_b, r.option_c, r.option_d].filter(Boolean),
                answer:  (r.answer_index || 1) - 1,  // 0-based
            }
        }

        if (r.type === 'truefalse') {
            return { ...base, answer: r.answer_bool }
        }

        if (r.type === 'fillblank') {
            const raw  = r.blanks_text || ''
            const segs = raw.split('___')
            const parts = []
            segs.forEach((s, i) => {
                if (s) parts.push({ type: 'text', val: s })
                if (i < segs.length - 1) parts.push({ type: 'blank', idx: i })
            })
            const correctBlanks = (r.blanks_answer || '').split(',').map(s => s.trim())
            return { ...base, parts, correctBlanks, matchTitle: raw }
        }

        if (r.type === 'match') {
            const pairs = Array.isArray(r.match_pairs)
                ? r.match_pairs
                : (typeof r.match_pairs === 'string' ? JSON.parse(r.match_pairs) : [])
            return { ...base, pairs, matchTitle: r.text }
        }

        return base
    }

    // ── Нәтижені Supabase-ке сақтау ─────────────────────
    async function saveResult(payload) {
        const { data, error: err } = await supabase
            .from('results')
            .insert([{
                student_id:   payload.studentId   || 'guest',
                student_name: payload.studentName || 'Оқушы',
                class:        payload.class       || '',
                quiz_id:      payload.quizId      || null,
                quiz_topic:   payload.quizTopic   || '',
                quiz_level:   payload.quizLevel   || '',
                correct:      payload.correct     || 0,
                total:        payload.total       || 0,
                pct:          payload.pct         || 0,
                grade:        calcGrade(payload.pct),
            }])
            .select()
            .single()

        if (err) { console.error('[QuizStore] saveResult error:', err); return null }
        return data
    }

    // ── Нәтижелерді оқу (мұғалімге) ─────────────────────
    async function fetchResults({ studentId, quizId, limit = 100 } = {}) {
        let query = supabase
            .from('results')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit)

        if (studentId) query = query.eq('student_id', studentId)
        if (quizId)    query = query.eq('quiz_id',    quizId)

        const { data, error: err } = await query
        if (err) { console.error('[QuizStore] fetchResults error:', err); return [] }
        return data || []
    }

    // ── Grade helper ──────────────────────────────────────
    function calcGrade(pct) {
        const p = Number(pct || 0)
        if (p >= 90) return 'Өте жақсы'
        if (p >= 70) return 'Жақсы'
        if (p >= 50) return 'Қанағат.'
        return 'Қайталаңыз'
    }

    // ── Computed ─────────────────────────────────────────
    const totalQuestions = computed(() =>
        quizzes.value.reduce((s, q) => s + q.questions.length, 0)
    )

    const stats = computed(() => {
        const all = quizzes.value
        const byLevel = { 'Оңай': 0, 'Орташа': 0, 'Жоғары': 0 }
        all.forEach(q => { if (byLevel[q.level] !== undefined) byLevel[q.level]++ })
        return { total: all.length, totalQuestions: totalQuestions.value, byLevel }
    })

    return {
        quizzes, loading, error, initialized, stats,
        init, saveResult, fetchResults, calcGrade,
    }
}