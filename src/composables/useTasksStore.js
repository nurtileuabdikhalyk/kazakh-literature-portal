
import { ref, computed } from 'vue'
import { supabase } from './useSupabase'

// ── Singleton ─────────────────────────────────────────
const tasks       = ref([])   // flat questions list (UI үшін)
const quizzes     = ref([])   // grouped by quiz
const loading     = ref(false)
const error       = ref('')
const initialized = ref(false)

export function useTasksStore() {

    // ── FETCH — барлық сұрақтарды жүктеу ─────────────────
    async function init(forceReload = false) {
        if (initialized.value && !forceReload) return
        loading.value = true
        error.value   = ''
        try {
            // Quizzes
            const { data: qzData, error: qzErr } = await supabase
                .from('quizzes')
                .select('*')
                .order('id')
            if (qzErr) throw qzErr

            // Questions
            const { data: qsData, error: qsErr } = await supabase
                .from('questions')
                .select('*')
                .order('id')
            if (qsErr) throw qsErr

            quizzes.value     = qzData || []
            tasks.value       = (qsData || []).map(mapQuestion)
            initialized.value = true
        } catch(e) {
            error.value = e.message || 'Supabase қосылу қатесі'
            console.error('[TasksStore]', e)
        } finally {
            loading.value = false
        }
    }

    // ── MAP Supabase row → app format ─────────────────────
    function mapQuestion(r) {
        const base = {
            id:          r.id,
            quiz_id:     r.quiz_id,
            type:        r.type,
            text:        r.text        || '',
            topic:       r.topic       || '',
            explanation: r.explanation || '',
        }
        if (r.type === 'mcq') return {
            ...base,
            optionA:      r.option_a      || '',
            optionB:      r.option_b      || '',
            optionC:      r.option_c      || '',
            optionD:      r.option_d      || '',
            answer:       r.answer_index  || 1,
        }
        if (r.type === 'truefalse') return {
            ...base,
            answer: r.answer_bool ?? true,
        }
        if (r.type === 'fillblank') {
            const correctBlanks = (r.blanks_answer || '').split(',').map(s => s.trim()).filter(Boolean)
            const segs  = (r.blanks_text || r.text || '').split('___')
            const parts = []
            segs.forEach((s, i) => {
                if (s) parts.push({ type:'text', val:s })
                if (i < segs.length-1) parts.push({ type:'blank', idx:i })
            })
            return { ...base, text: r.blanks_text || r.text, parts, correctBlanks, answers: correctBlanks }
        }
        if (r.type === 'match') {
            const pairs = Array.isArray(r.match_pairs)
                ? r.match_pairs
                : (r.match_pairs ? JSON.parse(r.match_pairs) : [])
            return { ...base, title: r.text, matchTitle: r.text, pairs }
        }
        return base
    }

    // ── ADD TASK (сұрақ + quiz жасау) ────────────────────
    // Мұғалім жаңа тапсырма жасағанда:
    //   1. Сол topic+level quiz бар ма? → бар болса қолдан
    //   2. Жоқ болса → жаңа quiz жасайды
    //   3. Question жасайды → quiz-ға байланыстырады
    async function addTask(data) {
        // 1. Quiz табу немесе жасау
        const quizId = await ensureQuiz(data.topic, data.level)

        // 2. Question жасау
        const row = taskToRow(data, quizId)
        const { data: q, error: err } = await supabase
            .from('questions')
            .insert([row])
            .select()
            .single()
        if (err) throw err

        const mapped = mapQuestion(q)
        tasks.value = [mapped, ...tasks.value]
        return mapped
    }

    // ── UPDATE TASK ───────────────────────────────────────
    async function updateTask(id, data) {
        const quizId = await ensureQuiz(data.topic, data.level)
        const row    = taskToRow(data, quizId)
        const { data: q, error: err } = await supabase
            .from('questions')
            .update(row)
            .eq('id', id)
            .select()
            .single()
        if (err) throw err

        const mapped = mapQuestion(q)
        tasks.value  = tasks.value.map(t => t.id === id ? mapped : t)
        return mapped
    }

    // ── DELETE TASK ───────────────────────────────────────
    async function deleteTask(id) {
        const { error: err } = await supabase.from('questions').delete().eq('id', id)
        if (err) throw err
        tasks.value = tasks.value.filter(t => t.id !== id)
    }

    // ── GET BY ID ─────────────────────────────────────────
    function getById(id) {
        return tasks.value.find(t => String(t.id) === String(id)) || null
    }

    // ── ensureQuiz — topic+level бойынша quiz табу/жасау ──
    async function ensureQuiz(topic, level) {
        // Бар quiz іздейміз
        const existing = quizzes.value.find(q => q.topic === topic && q.level === level)
        if (existing) return existing.id

        // Жоқ — жаңасын жасаймыз
        const { data: q, error: err } = await supabase
            .from('quizzes')
            .insert([{ topic, level, time_min: 10 }])
            .select()
            .single()
        if (err) throw err
        quizzes.value = [...quizzes.value, q]
        return q.id
    }

    // ── app format → Supabase questions row ───────────────
    function taskToRow(d, quizId) {
        const base = {
            quiz_id:     quizId,
            type:        d.type        || 'mcq',
            text:        d.text        || d.title || '',
            topic:       d.topic       || '',
            explanation: d.explanation || '',
        }
        if (d.type === 'mcq') return {
            ...base,
            option_a:     d.optionA     || '',
            option_b:     d.optionB     || '',
            option_c:     d.optionC     || '',
            option_d:     d.optionD     || '',
            answer_index: d.answer      || 1,
        }
        if (d.type === 'truefalse') return {
            ...base,
            answer_bool: d.answer === true || d.answer === 'true',
        }
        if (d.type === 'fillblank') {
            const answers = Array.isArray(d.answers)
                ? d.answers
                : (d.answersRaw || '').split(',').map(s => s.trim()).filter(Boolean)
            return {
                ...base,
                blanks_text:   d.text || '',
                blanks_answer: answers.join(','),
            }
        }
        if (d.type === 'match') {
            const pairs = (d.pairs || []).filter(p => p.left?.trim() && p.right?.trim())
            return {
                ...base,
                text:        d.title || d.text || '',
                match_pairs: JSON.stringify(pairs),
            }
        }
        return base
    }

    // ── Computed stats ────────────────────────────────────
    const stats = computed(() => ({
        total: tasks.value.length,
        mcq:   tasks.value.filter(t => t.type === 'mcq').length,
        tf:    tasks.value.filter(t => t.type === 'truefalse').length,
        fill:  tasks.value.filter(t => t.type === 'fillblank').length,
        match: tasks.value.filter(t => t.type === 'match').length,
    }))

    return {
        tasks, quizzes, loading, error, initialized, stats,
        init,
        addTask,
        updateTask,
        deleteTask,
        getById,
    }
}