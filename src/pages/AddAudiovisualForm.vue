<template>
  <div class="aaf-page">

    <!-- ── HEADER ────────────────────────────────────── -->
    <div class="aaf-header">
      <button class="back-btn" @click="goBack">
        <i class="pi pi-arrow-left"/> Артқа
      </button>
      <div>
        <h1 class="aaf-title">
          {{ editMode ? 'Аудио треккі өзгерту' : 'Жаңа аудио трек қосу' }}
        </h1>
        <p class="aaf-sub">
          Деректер <strong style="color:#3ecf8e">Supabase</strong>-ке сақталады ·
          барлық құрылғыда бірден көрінеді
        </p>
      </div>
    </div>

    <!-- ── BODY ──────────────────────────────────────── -->
    <div class="aaf-body">

      <!-- LEFT: FORM -->
      <div class="form-col">

        <!-- ═══ ТРЕК НЕГІЗГІ ДЕРЕКТЕР ═══════════════════ -->
        <div class="form-section">
          <div class="fs-head">
            <i class="pi pi-music"/> Трек деректері
          </div>

          <div class="fields-grid">

            <!-- Атауы -->
            <div class="field full">
              <label class="flabel">Атауы <span class="req">*</span></label>
              <input v-model="form.title" class="finput" :class="{ err: ve.title }"
                placeholder="Қараңғы түнде тау қалғып"/>
              <p v-if="ve.title" class="ferr">{{ ve.title }}</p>
            </div>

            <!-- Автор -->
            <div class="field">
              <label class="flabel">Автор</label>
              <input v-model="form.author" class="finput" placeholder="Абай Құнанбайұлы"/>
            </div>

            <!-- Жанр -->
            <div class="field">
              <label class="flabel">Жанр</label>
              <select v-model="form.genre" class="finput fsel">
                <option value="">Таңдаңыз</option>
                <option v-for="g in GENRES" :key="g">{{ g }}</option>
              </select>
            </div>

            <!-- Ұзақтық -->
            <div class="field">
              <label class="flabel">Ұзақтығы</label>
              <input v-model="form.duration" class="finput" placeholder="4:32"/>
            </div>

            <!-- Секунд (totalSec) -->
            <div class="field">
              <label class="flabel">
                Барлық секунд
                <span class="flabel-sub">Прогресс бар үшін</span>
              </label>
              <input v-model.number="form.totalSec" type="number" class="finput"
                placeholder="272" min="0"/>
            </div>

            <!-- Аудио файл URL -->
            <div class="field full">
              <label class="flabel">
                Аудио файл URL <span class="req">*</span>
                <span class="flabel-sub">/audios/fayl.mp3 немесе https://...</span>
              </label>
              <input v-model="form.fileUrl" class="finput" :class="{ err: ve.fileUrl }"
                placeholder="/audios/qarangy-tune.mp3"/>
              <p v-if="ve.fileUrl" class="ferr">{{ ve.fileUrl }}</p>
            </div>

            <!-- Мұқаба сурет -->
            <div class="field full">
              <label class="flabel">
                Мұқаба сурет
                <span class="flabel-sub">/icons/image.png немесе https://...</span>
              </label>
              <div class="cover-row">
                <input v-model="form.cover" class="finput"
                  placeholder="/covers/track.jpg немесе https://images.unsplash.com/…"/>
                <img v-if="form.cover && !coverBroken" :src="form.cover"
                  class="cover-mini" @error="coverBroken=true" @load="coverBroken=false"/>
                <div v-else-if="!form.cover" class="cover-empty">
                  <i class="pi pi-image"/>
                </div>
              </div>
              <p v-if="coverBroken && form.cover" class="ferr-soft">
                <i class="pi pi-exclamation-circle"/> Сурет жүктелмеді
              </p>
            </div>

            <!-- Түс -->
            <div class="field">
              <label class="flabel">
                Accent түс
                <span class="flabel-sub">Waveform үшін</span>
              </label>
              <div class="color-row">
                <input v-model="form.color" type="color" class="color-pick"/>
                <input v-model="form.color" class="finput color-hex" placeholder="#c4922a"/>
                <div class="color-swatches">
                  <div v-for="c in COLORS" :key="c" class="swatch"
                    :style="{ background:c }" @click="form.color=c"
                    :class="{ active: form.color===c }"/>
                </div>
              </div>
            </div>

            <!-- Bookmark -->
            <div class="field">
              <label class="flabel">Статус</label>
              <label class="toggle-row">
                <input type="checkbox" v-model="form.bookmarked" class="toggle-cb"/>
                <span class="toggle-lbl">
                  <i :class="form.bookmarked ? 'pi pi-bookmark-fill' : 'pi pi-bookmark'"/>
                  {{ form.bookmarked ? 'Сақталды' : 'Сақтамаған' }}
                </span>
              </label>
            </div>

          </div>
        </div>

        <!-- ═══ МӘТІН ЖОЛДАРЫ ════════════════════════════ -->
        <div class="form-section">
          <div class="fs-head">
            <i class="pi pi-align-left"/> Мәтін жолдары
            <span class="fs-hint">Аудиомен синхрондалады (уақыт → секунд)</span>
            <button class="fs-add" @click="addLine">
              <i class="pi pi-plus"/> Жол қосу
            </button>
          </div>

          <div class="lines-list">
            <div v-for="(line, idx) in form.lines" :key="idx" class="line-row">
              <span class="line-num">{{ idx + 1 }}</span>
              <div class="line-time-wrap">
                <input v-model.number="line.time" type="number" class="finput time-in"
                  placeholder="0" min="0" title="Уақыт (секунд)"/>
                <span class="time-unit">с</span>
              </div>
              <input v-model="line.text" class="finput line-text"
                :placeholder="`${idx+1}-жол мәтіні…`"/>
              <button class="line-del" @click="removeLine(idx)" title="Өшіру">
                <i class="pi pi-times"/>
              </button>
            </div>
            <div v-if="!form.lines.length" class="lines-empty">
              <i class="pi pi-info-circle"/> Жол қосу үшін «Жол қосу» батырмасын басыңыз
            </div>
          </div>
        </div>

        <!-- ═══ СӨЗДІК ════════════════════════════════════ -->
        <div class="form-section">
          <div class="fs-head">
            <i class="pi pi-book"/> Қиын сөздер сөздігі
            <span class="fs-hint">Мәтіндегі сөздер ерекшеленеді</span>
            <button class="fs-add" @click="addGloss">
              <i class="pi pi-plus"/> Сөз қосу
            </button>
          </div>

          <div class="gloss-list">
            <div v-for="(g, idx) in form.glossary" :key="idx" class="gloss-row">
              <input v-model="g.word" class="finput gloss-word" placeholder="Сөз"/>
              <input v-model="g.definition" class="finput gloss-def" placeholder="Анықтама"/>
              <input v-model="g.example" class="finput gloss-ex" placeholder="Мысал"/>
              <select v-model="g.tag" class="finput gloss-tag">
                <option v-for="t in TAGS" :key="t">{{ t }}</option>
              </select>
              <button class="line-del" @click="removeGloss(idx)">
                <i class="pi pi-times"/>
              </button>
            </div>
            <div v-if="!form.glossary.length" class="lines-empty">
              <i class="pi pi-info-circle"/> Сөздік бос
            </div>
          </div>
        </div>

        <!-- ═══ ACTIONS ════════════════════════════════════ -->
        <div class="aaf-actions">
          <button class="btn-gold" @click="save" :disabled="saving">
            <div v-if="saving" class="btn-spin"/>
            <template v-else>
              <i class="pi pi-check"/>
              {{ editMode ? 'Жаңарту' : 'Сақтау' }}
            </template>
          </button>
          <button class="btn-outline" @click="goBack">
            <i class="pi pi-times"/> Бас тарту
          </button>
          <button v-if="editMode" class="btn-danger" @click="confirmDel = true">
            <i class="pi pi-trash"/> Өшіру
          </button>
        </div>

      </div><!-- end form-col -->

      <!-- RIGHT: PREVIEW + INFO -->
      <div class="preview-col">
        <div class="sticky-wrap">

          <!-- Preview карточка -->
          <p class="preview-lbl"><i class="pi pi-eye"/> Алдын ала қарау</p>
          <div class="preview-card">
            <div class="pc-cover">
              <img v-if="form.cover && !coverBroken" :src="form.cover" class="pc-img"
                @error="coverBroken=true"/>
              <div v-else class="pc-no-img">
                <i class="pi pi-headphones"/>
              </div>
              <div class="pc-overlay" :style="{ background: form.color+'22' }"/>
            </div>
            <div class="pc-body">
              <span class="pc-genre">{{ form.genre || 'Жанр' }}</span>
              <h4 class="pc-title">{{ form.title || 'Трек атауы' }}</h4>
              <p class="pc-author">{{ form.author || 'Автор' }}</p>
              <div class="pc-meta">
                <span><i class="pi pi-clock"/> {{ form.duration || '--:--' }}</span>
                <span><i class="pi pi-align-left"/> {{ form.lines.length }} жол</span>
                <span><i class="pi pi-book"/> {{ form.glossary.length }} сөз</span>
              </div>
              <div class="pc-bar">
                <div class="pc-bar-fill" :style="{ background: form.color }"/>
              </div>
            </div>
          </div>

          <!-- Supabase info -->
          <div class="sb-info-card">
            <div class="si-head">
              <i class="pi pi-database" style="color:#3ecf8e"/> Supabase кестелері
            </div>
            <div class="si-rows">
              <div class="si-row">
                <span class="si-key">audio_tracks</span>
                <span class="si-val">{{ tracks.length }} трек</span>
              </div>
              <div class="si-row">
                <span class="si-key">audio_lines</span>
                <span class="si-val">{{ form.lines.length }} жол</span>
              </div>
              <div class="si-row">
                <span class="si-key">audio_glossary</span>
                <span class="si-val">{{ form.glossary.length }} сөз</span>
              </div>
            </div>
            <button class="si-reload" @click="init(true)" :disabled="loading">
              <i class="pi pi-refresh" :class="{ spinning: loading }"/>
              Supabase-тен жаңарту
            </button>
          </div>

        </div>
      </div>

    </div><!-- end aaf-body -->

    <!-- ── DELETE MODAL ───────────────────────────────── -->
    <teleport to="body">
      <transition name="modal-fade">
        <div v-if="confirmDel" class="del-overlay" @click.self="confirmDel=false">
          <div class="del-modal">
            <div class="del-icon"><i class="pi pi-exclamation-triangle"/></div>
            <h3 class="del-title">Тректі өшіру</h3>
            <p class="del-body">
              <strong>«{{ form.title }}»</strong><br/>
              трегі, оның барлық жолдары мен сөздігі өшіріледі.
            </p>
            <div class="del-actions">
              <button class="del-ok" @click="doDelete" :disabled="saving">
                <div v-if="saving" class="btn-spin"/>
                <template v-else><i class="pi pi-trash"/> Өшіру</template>
              </button>
              <button class="del-cancel" @click="confirmDel=false">Бас тарту</button>
            </div>
          </div>
        </div>
      </transition>
    </teleport>

    <!-- ── TOAST ──────────────────────────────────────── -->
    <transition name="toast-pop">
      <div v-if="toast.show" class="toast" :class="toast.type">
        <i :class="toast.type==='success' ? 'pi pi-check-circle' : 'pi pi-times-circle'"/>
        {{ toast.msg }}
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAudioStore } from '@/composables/useAudioStore'
import { supabase }      from '@/composables/useSupabase'

const router = useRouter()
const route  = useRoute()

const { tracks, loading, init } = useAudioStore()

// ── Constants ─────────────────────────────────────────
const GENRES = ['Лирика', 'Проза', 'Жыр', 'Эпос', 'Балада']
const TAGS   = ['Кітаби','Ауызекі','Поэтикалық','Грамматика','Табиғат','Тұрмыс','Ескі сөз','Ауыл шаруашылығы']
const COLORS = ['#c4922a','#4a5e4c','#8b3a1e','#2a3a5c','#5a3a5a','#6a4a2a','#3a5c3a']

// ── Edit mode ─────────────────────────────────────────
const editMode = computed(() => !!route.query.id)
const editId   = computed(() => route.query.id ? Number(route.query.id) : null)

// ── Form ──────────────────────────────────────────────
const form = reactive({
  title:     '',
  author:    '',
  genre:     '',
  duration:  '',
  totalSec:  0,
  color:     '#c4922a',
  cover:     '',
  fileUrl:   '',
  bookmarked:false,
  lines:     [],    // [{ time, text }]
  glossary:  [],    // [{ word, definition, example, tag }]
})

const ve          = reactive({ title:'', fileUrl:'' })
const saving      = ref(false)
const coverBroken = ref(false)
const confirmDel  = ref(false)
const toast       = reactive({ show:false, msg:'', type:'success' })
let toastTimer    = null

watch(() => form.cover, () => { coverBroken.value = false })

// ── Init ──────────────────────────────────────────────
onMounted(async () => {
  await init()
  if (editId.value) await loadForEdit(editId.value)
})

async function loadForEdit(id) {
  // Тректі store-дан аламыз
  const track = tracks.value.find(t => t.id === id)
  if (!track) return

  Object.assign(form, {
    title:      track.title,
    author:     track.author,
    genre:      track.genre,
    duration:   track.duration,
    totalSec:   track.totalSec,
    color:      track.color,
    cover:      track.cover,
    fileUrl:    track.fileUrl,
    bookmarked: track.bookmarked,
  })

  // Lines — track-тен
  form.lines = (track.lines || []).map(l => ({
    time: l.time || 0,
    text: l.text || '',
  }))

  // Glossary — Supabase-тен тікелей
  const { data } = await supabase
    .from('audio_glossary')
    .select('*')
    .eq('track_id', id)
    .order('id')
  form.glossary = (data || []).map(g => ({
    word:       g.word       || '',
    definition: g.definition || '',
    example:    g.example    || '',
    tag:        g.tag        || 'Ескі сөз',
  }))
}

// ── Line helpers ──────────────────────────────────────
function addLine()        { form.lines.push({ time: 0, text: '' }) }
function removeLine(idx)  { form.lines.splice(idx, 1) }

// ── Glossary helpers ──────────────────────────────────
function addGloss()       { form.glossary.push({ word:'', definition:'', example:'', tag:'Ескі сөз' }) }
function removeGloss(idx) { form.glossary.splice(idx, 1) }

// ── Validate ──────────────────────────────────────────
function validate() {
  ve.title   = form.title.trim()   ? '' : 'Трек атауын енгізіңіз'
  ve.fileUrl = form.fileUrl.trim() ? '' : 'Аудио файл жолын енгізіңіз'
  return !ve.title && !ve.fileUrl
}

// ── SAVE → Supabase ───────────────────────────────────
async function save() {
  if (!validate()) return
  saving.value = true
  try {
    if (editMode.value && editId.value) {
      await updateTrack(editId.value)
      showToast('Трек Supabase-те жаңартылды!')
    } else {
      await createTrack()
      showToast('Трек Supabase-ке қосылды!')
      resetForm()
    }
    await init(true) // store-ды жаңарту
  } catch(e) {
    showToast('Қате: ' + e.message, 'error')
  } finally {
    saving.value = false
  }
}

// ── CREATE ────────────────────────────────────────────
async function createTrack() {
  // 1. Track жасау
  const { data: trackRow, error: tErr } = await supabase
    .from('audio_tracks')
    .insert([{
      title:      form.title,
      author:     form.author,
      genre:      form.genre,
      duration:   form.duration,
      total_sec:  form.totalSec,
      color:      form.color,
      cover:      form.cover,
      file_url:   form.fileUrl,
      bookmarked: form.bookmarked,
    }])
    .select()
    .single()
  if (tErr) throw tErr

  const trackId = trackRow.id

  // 2. Lines жасау
  if (form.lines.length) {
    const linesData = form.lines
      .filter(l => l.text.trim())
      .map((l, i) => ({
        track_id:   trackId,
        time_sec:   l.time  || 0,
        text:       l.text.trim(),
        line_order: i + 1,
      }))
    if (linesData.length) {
      const { error: lErr } = await supabase.from('audio_lines').insert(linesData)
      if (lErr) throw lErr
    }
  }

  // 3. Glossary жасау
  if (form.glossary.length) {
    const glossData = form.glossary
      .filter(g => g.word.trim())
      .map(g => ({
        track_id:   trackId,
        word:       g.word.trim(),
        definition: g.definition,
        example:    g.example,
        tag:        g.tag || 'Ескі сөз',
      }))
    if (glossData.length) {
      const { error: gErr } = await supabase.from('audio_glossary').insert(glossData)
      if (gErr) throw gErr
    }
  }
}

// ── UPDATE ────────────────────────────────────────────
async function updateTrack(id) {
  // 1. Track жаңарту
  const { error: tErr } = await supabase
    .from('audio_tracks')
    .update({
      title:      form.title,
      author:     form.author,
      genre:      form.genre,
      duration:   form.duration,
      total_sec:  form.totalSec,
      color:      form.color,
      cover:      form.cover,
      file_url:   form.fileUrl,
      bookmarked: form.bookmarked,
    })
    .eq('id', id)
  if (tErr) throw tErr

  // 2. Lines: ескілерін өшіріп, жаңаларын жасаймыз
  await supabase.from('audio_lines').delete().eq('track_id', id)
  const linesData = form.lines
    .filter(l => l.text.trim())
    .map((l, i) => ({
      track_id:   id,
      time_sec:   l.time  || 0,
      text:       l.text.trim(),
      line_order: i + 1,
    }))
  if (linesData.length) {
    const { error: lErr } = await supabase.from('audio_lines').insert(linesData)
    if (lErr) throw lErr
  }

  // 3. Glossary: ескілерін өшіріп, жаңаларын жасаймыз
  await supabase.from('audio_glossary').delete().eq('track_id', id)
  const glossData = form.glossary
    .filter(g => g.word.trim())
    .map(g => ({
      track_id:   id,
      word:       g.word.trim(),
      definition: g.definition,
      example:    g.example,
      tag:        g.tag || 'Ескі сөз',
    }))
  if (glossData.length) {
    const { error: gErr } = await supabase.from('audio_glossary').insert(glossData)
    if (gErr) throw gErr
  }
}

// ── DELETE ────────────────────────────────────────────
async function doDelete() {
  if (!editId.value) return
  saving.value = true
  try {
    // ON DELETE CASCADE — lines мен glossary автоматты өшіріледі
    const { error: err } = await supabase
      .from('audio_tracks')
      .delete()
      .eq('id', editId.value)
    if (err) throw err
    await init(true)
    showToast('Трек өшірілді')
    setTimeout(() => goBack(), 1200)
  } catch(e) {
    showToast('Қате: ' + e.message, 'error')
  } finally {
    saving.value  = false
    confirmDel.value = false
  }
}

// ── Helpers ───────────────────────────────────────────
function resetForm() {
  Object.assign(form, {
    title:'', author:'', genre:'', duration:'', totalSec:0,
    color:'#c4922a', cover:'', fileUrl:'', bookmarked:false,
    lines:[], glossary:[],
  })
  Object.assign(ve, { title:'', fileUrl:'' })
  coverBroken.value = false
}

function goBack() {
  router.push({ name:'teacher-cabinet', query:{ section:'audio' } })
}

function showToast(msg, type='success') {
  clearTimeout(toastTimer)
  Object.assign(toast, { show:true, msg, type })
  toastTimer = setTimeout(() => { toast.show=false }, 3500)
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:ital,wght@0,400;0,600&display=swap');

.aaf-page {
  --gold:#c4922a; --gold-l:#e8b94f; --rust:#8b3a1e; --sage:#3a5c3a;
  --navy:#2a3a5c; --dark:#1a1208; --border:#d9cdb8; --parch:#faf6ef;
  min-height:100dvh; background:#f4ede0;
  font-family:'Source Serif 4',Georgia,serif; color:var(--dark);
}

/* ── Header ── */
.aaf-header { display:flex; align-items:flex-start; gap:1rem; padding:1.25rem 1.75rem; background:#fff; border-bottom:2px solid var(--gold); flex-wrap:wrap; }
.back-btn   { display:inline-flex; align-items:center; gap:.4rem; background:none; border:1.5px solid var(--border); border-radius:2px; color:#7a6a52; font-family:'Source Serif 4',serif; font-size:.8rem; padding:.45rem .9rem; cursor:pointer; transition:all .2s; flex-shrink:0; }
.back-btn:hover { border-color:var(--gold); color:var(--gold); }
.aaf-title  { font-family:'Playfair Display',serif; font-size:1.25rem; font-weight:900; color:var(--dark); margin:0 0 .2rem; }
.aaf-sub    { font-size:.75rem; color:#9a8a72; margin:0; }

/* ── Body layout ── */
.aaf-body { display:grid; grid-template-columns:1fr 280px; gap:1.5rem; max-width:1100px; margin:0 auto; padding:1.5rem; align-items:start; }
@media(max-width:860px) { .aaf-body { grid-template-columns:1fr; } }

/* ── Form section ── */
.form-col { display:flex; flex-direction:column; gap:1.25rem; }
.form-section { background:#fff; border:1px solid var(--border); border-radius:3px; overflow:hidden; }

.fs-head { display:flex; align-items:center; gap:.55rem; padding:.75rem 1.1rem; background:var(--parch); border-bottom:1px solid var(--border); font-size:.72rem; font-weight:700; letter-spacing:.09em; text-transform:uppercase; color:#7a6a52; flex-wrap:wrap; }
.fs-head i { color:var(--gold); font-size:.85rem; }
.fs-hint { font-size:.65rem; color:#b0a090; font-weight:400; text-transform:none; letter-spacing:0; margin-left:.25rem; font-style:italic; }
.fs-add  { margin-left:auto; display:inline-flex; align-items:center; gap:.3rem; background:var(--gold); color:#fff; border:none; padding:.3rem .75rem; border-radius:2px; font-family:'Source Serif 4',serif; font-size:.72rem; font-weight:700; cursor:pointer; transition:background .2s; }
.fs-add:hover { background:var(--gold-l); }

/* ── Fields ── */
.fields-grid { display:grid; grid-template-columns:1fr 1fr; gap:.85rem; padding:1.1rem; }
.field { display:flex; flex-direction:column; gap:.28rem; }
.field.full { grid-column:1 / -1; }
.flabel { font-size:.68rem; font-weight:700; color:#9a8a72; text-transform:uppercase; letter-spacing:.07em; display:flex; align-items:baseline; gap:.3rem; flex-wrap:wrap; }
.flabel-sub { font-size:.62rem; color:#b0a090; font-weight:400; text-transform:none; letter-spacing:0; }
.req { color:var(--rust); }
.finput { border:1.5px solid var(--border); border-radius:2px; padding:.5rem .75rem; font-family:'Source Serif 4',serif; font-size:.85rem; color:var(--dark); background:var(--parch); outline:none; transition:border-color .2s; width:100%; box-sizing:border-box; }
.finput:focus { border-color:var(--gold); }
.finput.err   { border-color:var(--rust); }
.fsel { cursor:pointer; }
.ferr     { font-size:.68rem; color:var(--rust); margin:0; display:flex; align-items:center; gap:.3rem; }
.ferr-soft{ font-size:.68rem; color:var(--gold); margin:.2rem 0 0; display:flex; align-items:center; gap:.3rem; }

/* Cover row */
.cover-row  { display:flex; gap:.6rem; align-items:center; }
.cover-row .finput { flex:1; }
.cover-mini { width:52px; height:38px; object-fit:cover; border-radius:2px; border:1px solid var(--border); flex-shrink:0; }
.cover-empty{ width:52px; height:38px; border:1.5px dashed var(--border); border-radius:2px; display:flex; align-items:center; justify-content:center; color:#d9cdb8; flex-shrink:0; }

/* Color picker */
.color-row    { display:flex; align-items:center; gap:.5rem; flex-wrap:wrap; }
.color-pick   { width:36px; height:36px; border:none; border-radius:2px; cursor:pointer; padding:0; flex-shrink:0; }
.color-hex    { width:110px; flex-shrink:0; }
.color-swatches { display:flex; gap:.3rem; flex-wrap:wrap; }
.swatch       { width:22px; height:22px; border-radius:50%; cursor:pointer; border:2px solid transparent; transition:transform .15s; }
.swatch:hover { transform:scale(1.15); }
.swatch.active{ border-color:var(--dark); transform:scale(1.1); }

/* Toggle */
.toggle-row { display:flex; align-items:center; gap:.5rem; cursor:pointer; user-select:none; }
.toggle-cb  { width:16px; height:16px; accent-color:var(--gold); cursor:pointer; }
.toggle-lbl { font-size:.82rem; color:var(--dark); display:flex; align-items:center; gap:.35rem; }
.toggle-lbl i { color:var(--gold); }

/* ── Lines ── */
.lines-list { padding:.75rem 1.1rem; display:flex; flex-direction:column; gap:.45rem; }
.line-row   { display:flex; align-items:center; gap:.5rem; }
.line-num   { font-size:.65rem; color:#b0a090; min-width:18px; text-align:right; flex-shrink:0; }
.line-time-wrap { display:flex; align-items:center; gap:.25rem; flex-shrink:0; }
.time-in    { width:60px; padding:.42rem .5rem; text-align:center; }
.time-unit  { font-size:.65rem; color:#b0a090; }
.line-text  { flex:1; }
.line-del   { background:none; border:none; color:#b0a090; cursor:pointer; font-size:.78rem; padding:.25rem; transition:color .18s; flex-shrink:0; }
.line-del:hover { color:var(--rust); }
.lines-empty{ font-size:.78rem; color:#b0a090; font-style:italic; padding:.5rem 0; display:flex; align-items:center; gap:.4rem; }

/* ── Glossary ── */
.gloss-list  { padding:.75rem 1.1rem; display:flex; flex-direction:column; gap:.45rem; }
.gloss-row   { display:grid; grid-template-columns:120px 1fr 1fr 110px 28px; gap:.4rem; align-items:center; }
.gloss-word  { } .gloss-def { } .gloss-ex { } .gloss-tag { }
@media(max-width:700px) { .gloss-row { grid-template-columns:1fr 1fr; } }

/* ── Actions ── */
.aaf-actions { display:flex; gap:.65rem; flex-wrap:wrap; padding:.25rem 0; }
.btn-gold    { display:inline-flex; align-items:center; gap:.45rem; background:var(--gold); color:#fff; border:none; padding:.65rem 1.5rem; border-radius:2px; font-family:'Source Serif 4',serif; font-size:.88rem; font-weight:700; cursor:pointer; transition:background .2s; }
.btn-gold:hover:not(:disabled) { background:var(--gold-l); }
.btn-gold:disabled { opacity:.45; cursor:not-allowed; }
.btn-outline { display:inline-flex; align-items:center; gap:.45rem; background:transparent; border:1.5px solid var(--border); color:var(--dark); padding:.65rem 1.35rem; border-radius:2px; font-family:'Source Serif 4',serif; font-size:.88rem; cursor:pointer; transition:all .2s; }
.btn-outline:hover { border-color:var(--gold); color:var(--gold); }
.btn-danger  { display:inline-flex; align-items:center; gap:.45rem; background:rgba(139,58,30,.1); border:1.5px solid rgba(139,58,30,.3); color:var(--rust); padding:.65rem 1.35rem; border-radius:2px; font-family:'Source Serif 4',serif; font-size:.88rem; cursor:pointer; transition:all .2s; margin-left:auto; }
.btn-danger:hover { background:var(--rust); color:#fff; border-color:var(--rust); }
.btn-spin    { width:16px; height:16px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
.spinning    { animation:spin .8s linear infinite; }

/* ── Preview ── */
.preview-col  { }
.sticky-wrap  { position:sticky; top:1rem; display:flex; flex-direction:column; gap:1rem; }
.preview-lbl  { font-size:.65rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:#9a8a72; margin:0 0 .4rem; display:flex; align-items:center; gap:.35rem; }
.preview-lbl i{ color:var(--gold); }

.preview-card { background:var(--dark); border:1px solid rgba(196,146,42,.2); border-radius:3px; overflow:hidden; }
.pc-cover     { position:relative; height:130px; overflow:hidden; background:rgba(255,255,255,.05); display:flex; align-items:center; justify-content:center; }
.pc-img       { width:100%; height:100%; object-fit:cover; }
.pc-overlay   { position:absolute; inset:0; }
.pc-no-img    { display:flex; align-items:center; justify-content:center; width:100%; height:100%; }
.pc-no-img i  { font-size:2.5rem; color:rgba(255,255,255,.15); }
.pc-body      { padding:.85rem; }
.pc-genre     { font-size:.6rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--gold); display:block; margin-bottom:.3rem; }
.pc-title     { font-family:'Playfair Display',serif; font-size:.9rem; font-weight:700; color:#fff; margin:0 0 .2rem; line-height:1.3; }
.pc-author    { font-size:.72rem; color:rgba(255,255,255,.45); margin:0 0 .6rem; font-style:italic; }
.pc-meta      { display:flex; flex-wrap:wrap; gap:.5rem; font-size:.65rem; color:rgba(255,255,255,.35); margin-bottom:.6rem; }
.pc-meta i    { color:var(--gold); margin-right:.15rem; font-size:.62rem; }
.pc-bar       { height:3px; background:rgba(255,255,255,.1); border-radius:2px; overflow:hidden; }
.pc-bar-fill  { width:35%; height:100%; border-radius:2px; }

/* ── SB Info card ── */
.sb-info-card { background:#fff; border:1px solid var(--border); border-radius:3px; overflow:hidden; }
.si-head  { padding:.65rem .9rem; background:var(--parch); border-bottom:1px solid var(--border); font-size:.68rem; font-weight:700; color:#7a6a52; display:flex; align-items:center; gap:.4rem; }
.si-rows  { padding:.6rem .9rem; display:flex; flex-direction:column; gap:.4rem; }
.si-row   { display:flex; justify-content:space-between; align-items:center; font-size:.72rem; }
.si-key   { font-family:monospace; color:#9a8a72; font-size:.68rem; }
.si-val   { font-weight:700; color:var(--dark); }
.si-reload{ display:flex; align-items:center; gap:.4rem; width:100%; padding:.52rem .9rem; background:none; border:none; border-top:1px solid var(--border); color:rgba(196,146,42,.7); font-family:'Source Serif 4',serif; font-size:.72rem; cursor:pointer; transition:color .2s; }
.si-reload:hover:not(:disabled) { color:var(--gold-l); }
.si-reload:disabled { opacity:.4; cursor:not-allowed; }

/* ── Delete modal ── */
.del-overlay { position:fixed; inset:0; z-index:9999; background:rgba(19,14,7,.72); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; padding:1rem; }
.del-modal   { background:var(--parch); border:1px solid var(--border); border-top:4px solid var(--rust); border-radius:4px; padding:2rem; max-width:400px; width:100%; display:flex; flex-direction:column; align-items:center; gap:.85rem; text-align:center; box-shadow:0 24px 64px rgba(0,0,0,.35); }
.del-icon    { width:52px; height:52px; border-radius:50%; background:rgba(139,58,30,.1); display:flex; align-items:center; justify-content:center; }
.del-icon i  { font-size:1.5rem; color:var(--rust); }
.del-title   { font-family:'Playfair Display',serif; font-size:1.1rem; font-weight:900; color:var(--dark); margin:0; }
.del-body    { font-size:.85rem; color:#5a4a35; line-height:1.65; margin:0; }
.del-actions { display:flex; gap:.6rem; width:100%; }
.del-ok      { flex:1; display:inline-flex; align-items:center; justify-content:center; gap:.4rem; background:var(--rust); color:#fff; border:none; padding:.65rem 1rem; border-radius:2px; font-family:'Source Serif 4',serif; font-size:.875rem; font-weight:700; cursor:pointer; transition:background .2s; }
.del-ok:hover:not(:disabled) { background:#a04428; }
.del-ok:disabled { opacity:.5; cursor:not-allowed; }
.del-cancel  { flex:1; background:transparent; border:1.5px solid var(--border); color:#7a6a52; padding:.65rem 1rem; border-radius:2px; font-family:'Source Serif 4',serif; font-size:.875rem; cursor:pointer; transition:all .2s; }
.del-cancel:hover { border-color:var(--gold); color:var(--gold); }

/* ── Toast ── */
.toast { position:fixed; bottom:1.5rem; right:1.5rem; z-index:9999; display:flex; align-items:center; gap:.5rem; padding:.75rem 1.25rem; border-radius:3px; font-size:.85rem; font-weight:600; box-shadow:0 8px 32px rgba(0,0,0,.2); }
.toast.success { background:#1a4a2a; color:#a5d6a7; border:1px solid rgba(165,214,167,.25); }
.toast.error   { background:#4a1a1a; color:#ef9a9a;  border:1px solid rgba(239,154,154,.25); }
.toast-pop-enter-active,.toast-pop-leave-active { transition:opacity .3s, transform .3s; }
.toast-pop-enter-from,.toast-pop-leave-to { opacity:0; transform:translateY(12px); }
.modal-fade-enter-active,.modal-fade-leave-active { transition:opacity .25s; }
.modal-fade-enter-from,.modal-fade-leave-to { opacity:0; }
</style>
