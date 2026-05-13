
import * as XLSX from 'xlsx'

/**
 * Excel файлынан барлық тапсырмаларды оқып, quiz форматына айналдырады
 * @param {File} file — пайдаланушы жүктеген .xlsx файлы
 * @returns {Promise<Array>} — quizzes массиві
 */
export async function loadQuizzesFromExcel(file) {
    const data   = await file.arrayBuffer()
    const wb     = XLSX.read(data, { type: 'array' })
    const result = []

    // ── 1. MCQ Тест ─────────────────────────────────────
    const mcqSheet = wb.Sheets['📝 Тест']
    if (mcqSheet) {
        const rows = XLSX.utils.sheet_to_json(mcqSheet, { range: 4, defval: '' })
        const questions = rows
            .filter(r => r['Сұрақ мәтіні'] || r['__EMPTY_2'])
            .map(r => {
                const text    = r['Сұрақ мәтіні'] || r['__EMPTY_2'] || ''
                const optA    = r['Нұсқа A']    || r['__EMPTY_3'] || ''
                const optB    = r['Нұсқа B']    || r['__EMPTY_4'] || ''
                const optC    = r['Нұсқа C']    || r['__EMPTY_5'] || ''
                const optD    = r['Нұсқа D']    || r['__EMPTY_6'] || ''
                const ansRaw  = r['Дұрыс\nжауап'] ?? r['__EMPTY_7'] ?? 1
                const explain = r['Түсіндірме']  || r['__EMPTY_10'] || ''
                return {
                    type: 'mcq',
                    text: String(text),
                    options: [optA, optB, optC, optD].map(String).filter(Boolean),
                    answer: Math.max(0, Number(ansRaw) - 1),  // 1-based → 0-based
                    explanation: String(explain),
                }
            })
            .filter(q => q.text && q.options.length >= 2)

        if (questions.length) {
            result.push({
                id: Date.now() + 1,
                type: 'mcq',
                diff: 'medium',
                cat: 'excel',
                title: 'Excel — Тест',
                desc: `Excel файлынан жүктелді · ${questions.length} сұрақ`,
                time: Math.max(3, Math.ceil(questions.length * 1.5)),
                lastScore: null,
                questions,
            })
        }
    }

    // ── 2. Дұрыс/Бұрыс ─────────────────────────────────
    const tfSheet = wb.Sheets['✅ Дурыс-Бурыс']
    if (tfSheet) {
        const rows = XLSX.utils.sheet_to_json(tfSheet, { range: 4, defval: '' })
        const questions = rows
            .filter(r => {
                const text = r['Тұжырым мәтіні'] || r['__EMPTY_2'] || ''
                return String(text).trim()
            })
            .map(r => {
                const text    = r['Тұжырым мәтіні'] || r['__EMPTY_2'] || ''
                const ansRaw  = r['Дұрыс\nжауап']  ?? r['__EMPTY_3'] ?? 'TRUE'
                const explain = r['Түсіндірме']     || r['__EMPTY_6'] || ''
                const answer  = String(ansRaw).toUpperCase() === 'TRUE' || ansRaw === true
                return { type: 'truefalse', text: String(text), answer, explanation: String(explain) }
            })
            .filter(q => q.text)

        if (questions.length) {
            result.push({
                id: Date.now() + 2,
                type: 'truefalse',
                diff: 'easy',
                cat: 'excel',
                title: 'Excel — Дұрыс/Бұрыс',
                desc: `Excel файлынан жүктелді · ${questions.length} тұжырым`,
                time: Math.max(2, Math.ceil(questions.length * 0.75)),
                lastScore: null,
                questions,
            })
        }
    }

    // ── 3. Бос орын ────────────────────────────────────
    const fbSheet = wb.Sheets['✍️ Бос орын']
    if (fbSheet) {
        const rows = XLSX.utils.sheet_to_json(fbSheet, { range: 4, defval: '' })
        const questions = rows
            .filter(r => {
                const text = r['Мәтін (бос орынды ___ деп белгілеңіз)'] || r['__EMPTY_2'] || ''
                return String(text).trim()
            })
            .map(r => {
                const rawText   = String(r['Мәтін (бос орынды ___ деп белгілеңіз)'] || r['__EMPTY_2'] || '')
                const rawAns    = String(r['Дұрыс жауаптар\n(үтірмен бөліп)'] || r['__EMPTY_3'] || '')
                const explain   = String(r['Түсіндірме'] || r['__EMPTY_6'] || '')
                const correctBlanks = rawAns.split(',').map(s => s.trim()).filter(Boolean)

                // Parse parts: split on ___
                const segments = rawText.split('___')
                const parts = []
                segments.forEach((seg, i) => {
                    if (seg) parts.push({ type: 'text', val: seg })
                    if (i < segments.length - 1) parts.push({ type: 'blank', idx: i })
                })

                return { type: 'fillblank', text: rawText, parts, correctBlanks, explanation: explain }
            })
            .filter(q => q.correctBlanks.length > 0)

        if (questions.length) {
            result.push({
                id: Date.now() + 3,
                type: 'fillblank',
                diff: 'medium',
                cat: 'excel',
                title: 'Excel — Бос орын',
                desc: `Excel файлынан жүктелді · ${questions.length} сұрақ`,
                time: Math.max(3, Math.ceil(questions.length * 1.2)),
                lastScore: null,
                questions,
            })
        }
    }

    // ── 4. Сәйкестендіру ───────────────────────────────
    const matchSheet = wb.Sheets['🔗 Сәйкестендіру']
    if (matchSheet) {
        const rows = XLSX.utils.sheet_to_json(matchSheet, { range: 4, defval: '' })
        const groups = {}

        rows.forEach(r => {
            const grp   = String(r['Топ №'] || r['__EMPTY_1'] || '').trim()
            const title = String(r['Тапсырма атауы'] || r['__EMPTY_2'] || '').trim()
            const left  = String(r['Сол баған (автор/ұғым)']       || r['__EMPTY_3'] || '').trim()
            const right = String(r['Оң баған (шығарма/анықтама)']  || r['__EMPTY_4'] || '').trim()
            const exp   = String(r['Түсіндірме'] || r['__EMPTY_7'] || '')
            if (!grp || !left || !right) return
            if (!groups[grp]) groups[grp] = { title, pairs: [], explanation: exp }
            groups[grp].pairs.push({ left, right })
        })

        Object.entries(groups).forEach(([grp, g], i) => {
            if (g.pairs.length < 2) return
            result.push({
                id: Date.now() + 10 + i,
                type: 'match',
                diff: 'medium',
                cat: 'excel',
                title: `Excel — Сәйкестендіру (${g.title || 'Топ ' + grp})`,
                desc: `Excel файлынан жүктелді · ${g.pairs.length} жұп`,
                time: Math.max(4, g.pairs.length),
                lastScore: null,
                questions: [{
                    type: 'match',
                    text: g.title || 'Сол жақты оң жақпен сәйкестендіріңіз',
                    pairs: g.pairs,
                    explanation: g.explanation,
                }],
            })
        })
    }

    if (!result.length) {
        throw new Error('Excel файлынан тапсырма табылмады. Бет атауларын тексеріңіз.')
    }

    return result
}
