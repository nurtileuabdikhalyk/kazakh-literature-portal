<template>
  <section class="audio-section">

    <!-- ══ HEADER ══════════════════════════════════════ -->
    <div class="section-header">
      <div class="orn-row">
        <span class="orn-line"/><span class="orn-diamond">◆</span><span class="orn-line"/>
      </div>
      <h2 class="section-title">
        <span class="title-kz">Аудио-Визуал</span>
      </h2>
      <p class="section-sub">Әдеби шығармаларды тыңдаңыз — мәтін мен аудио қатар жүреді</p>
    </div>

    <!-- ══ LOADING ══════════════════════════════════════ -->
    <div v-if="loading" class="db-state">
      <div class="db-spinner"/>
      <p>Жүктелуде…</p>
      <p class="db-hint">AudioVisual_MB.xlsx → localStorage['audio_store_v1']</p>
    </div>

    <!-- ══ ERROR ════════════════════════════════════════ -->
    <div v-else-if="error" class="db-state error">
      <i class="pi pi-exclamation-triangle"/>
      <p>{{ error }}</p>
      <button class="retry-btn" @click="reloadFromExcel">
        <i class="pi pi-refresh"/> Қайта жүктеу
      </button>
    </div>

    <!-- ══ PLAYER LAYOUT ════════════════════════════════ -->
    <div v-else class="player-layout">

      <!-- ── Жасырын <audio> тег ── -->
      <audio
          v-if="currentTrack?.fileUrl"
          ref="audioEl"
          :src="currentTrack.fileUrl"
          :loop="repeat"
          preload="metadata"
          @timeupdate="onTimeUpdate"
          @loadedmetadata="onLoadedMeta"
          @ended="onEnded"
          style="display:none"
      />

      <!-- ── Track list ──────────────────────────────── -->
      <div class="track-list-panel">
        <div class="tlp-head">
          <span class="tlp-title">
            <i class="pi pi-headphones"/> Шығармалар
            <span class="tlp-cnt">{{ tracks.length }}</span>
          </span>
          <div class="tlp-search">
            <i class="pi pi-search"/>
            <input v-model="searchQ" type="text" placeholder="Іздеу…" class="tlp-input"/>
          </div>
        </div>

        <!-- SCROLL бар -->
        <ul class="track-list">
          <li
              v-for="(track, idx) in filteredTracks" :key="track.id"
              class="track-item" :class="{ active: currentTrack?.id === track.id }"
              @click="selectTrack(track)"
          >
            <div class="ti-num" :class="{ playing: currentTrack?.id === track.id && isPlaying }">
              <span v-if="!(currentTrack?.id === track.id && isPlaying)" class="ti-index">
                {{ idx + 1 }}
              </span>
              <span v-else class="ti-wave">
                <span/><span/><span/>
              </span>
            </div>
            <div class="ti-cover">
              <img :src="track.cover" :alt="track.title"/>
            </div>
            <div class="ti-info">
              <p class="ti-title">{{ track.title }}</p>
              <p class="ti-author">{{ track.author }}</p>
            </div>
            <div class="ti-right">
              <span class="ti-genre">{{ track.genre }}</span>
              <span class="ti-dur">{{ track.duration }}</span>
              <i v-if="track.bookmarked" class="pi pi-bookmark-fill ti-bm"/>
            </div>
          </li>
        </ul>
      </div>

      <!-- ── Main player + text ──────────────────────── -->
      <div class="main-player-panel" v-if="currentTrack">

        <!-- Player card -->
        <div class="player-card">
          <!-- Album art -->
          <div class="album-art-wrap">
            <div class="album-spin" :class="{ spinning: isPlaying }">
              <img :src="currentTrack.cover" :alt="currentTrack.title" class="album-img"/>
              <div class="album-ring"/>
              <div class="album-center"/>
            </div>
            <div class="album-glow"
                 :style="{ background: `radial-gradient(circle, ${currentTrack.color}33 0%, transparent 70%)` }"/>
          </div>

          <!-- Track info -->
          <div class="player-info">
            <span class="player-genre">{{ currentTrack.genre }}</span>
            <h3 class="player-title">{{ currentTrack.title }}</h3>
            <p class="player-author">{{ currentTrack.author }}</p>

            <!-- Аудио файл URL badge -->
            <div v-if="currentTrack.fileUrl" class="audio-url-badge">
              <i class="pi pi-volume-up"/>
              <span>{{ currentTrack.fileUrl }}</span>
            </div>
            <div v-else class="audio-no-file">
              <i class="pi pi-exclamation-circle"/>
              Аудио файл жоқ — Excel-де fileUrl қосыңыз
            </div>

            <!-- Progress -->
            <div class="progress-wrap" @click="seek" ref="progressEl">
              <div class="progress-track">
                <div class="progress-fill" :style="{ width: progressPct + '%' }"/>
                <div class="progress-thumb" :style="{ left: progressPct + '%' }"/>
              </div>
              <div class="progress-times">
                <span>{{ fmtTime(elapsed) }}</span>
                <span>{{ fmtTime(totalSec) }}</span>
              </div>
            </div>

            <!-- Controls -->
            <div class="player-controls">
              <button class="pc-btn" @click="toggleShuffle" :class="{ on: shuffle }" title="Кездейсоқ">
                <i class="pi pi-sort-alt"/>
              </button>
              <button class="pc-btn" @click="prevTrack" title="Алдыңғы">
                <i class="pi pi-step-backward"/>
              </button>
              <button class="pc-btn play-btn" @click="togglePlay"
                      :disabled="!currentTrack.fileUrl"
                      :class="{ 'play-disabled': !currentTrack.fileUrl }"
                      :title="currentTrack.fileUrl ? (isPlaying ? 'Тоқтату' : 'Ойнату') : 'Аудио файл жоқ'">
                <i :class="isPlaying ? 'pi pi-pause' : 'pi pi-play'"/>
              </button>
              <button class="pc-btn" @click="nextTrack" title="Келесі">
                <i class="pi pi-step-forward"/>
              </button>
              <button class="pc-btn" @click="toggleRepeat" :class="{ on: repeat }" title="Қайталау">
                <i class="pi pi-refresh"/>
              </button>
            </div>

            <!-- Volume + speed -->
            <div class="player-extras">
              <div class="vol-row">
                <button class="pe-btn" @click="toggleMute">
                  <i :class="muted || volume === 0 ? 'pi pi-volume-off' : 'pi pi-volume-up'"/>
                </button>
                <input type="range" v-model.number="volume" min="0" max="100" class="vol-slider"/>
                <span class="vol-num">{{ volume }}%</span>
              </div>
              <div class="speed-row">
                <i class="pi pi-clock"/>
                <span class="speed-label">Жылдамдық:</span>
                <button
                    v-for="s in speeds" :key="s"
                    class="speed-btn" :class="{ active: playSpeed === s }"
                    @click="playSpeed = s"
                >{{ s }}x</button>
              </div>
            </div>

            <!-- Actions -->
            <div class="player-actions">
              <button class="pa-btn" @click="toggleBookmark(currentTrack.id)">
                <i :class="currentTrack.bookmarked ? 'pi pi-bookmark-fill' : 'pi pi-bookmark'"/>
                {{ currentTrack.bookmarked ? 'Сақталды' : 'Сақтау' }}
              </button>
              <button class="pa-btn" @click="showText = !showText">
                <i class="pi pi-align-left"/>
                {{ showText ? 'Жасыру' : 'Мәтінді көру' }}
              </button>
              <button class="pa-btn" @click="reloadFromExcel" title="Excel-ден қайта жүктеу">
                <i class="pi pi-refresh"/> Жаңарту
              </button>
            </div>
          </div>
        </div>

        <!-- ── Text panel ──────────────────────────────── -->
        <transition name="text-slide">
          <div v-if="showText && currentTrack.lines?.length" class="text-panel">
            <div class="tp-header">
              <div class="tp-header-left">
                <i class="pi pi-align-left"/>
                <span>Мәтін</span>
                <span class="tp-lines-cnt">{{ currentTrack.lines.length }} жол</span>
              </div>
              <div class="tp-header-right">
                <span class="tp-hint">
                  <i class="pi pi-info-circle"/>
                  Қиын сөзге басыңыз
                </span>
                <div class="font-controls">
                  <button class="fc-btn" @click="fontSize = Math.max(13, fontSize - 1)">A−</button>
                  <span class="fc-size">{{ fontSize }}</span>
                  <button class="fc-btn" @click="fontSize = Math.min(22, fontSize + 1)">A+</button>
                </div>
              </div>
            </div>

            <div class="text-body" :style="{ fontSize: fontSize + 'px' }">
              <div
                  v-for="(line, li) in currentTrack.lines"
                  :key="li"
                  class="text-line"
                  :class="{ active: activeLine === li }"
                  :id="'line-' + li"
                  @click="jumpToLine(li)"
              >
                <span
                    v-for="(word, wi) in line.words"
                    :key="wi"
                    class="text-word"
                    :class="{ hard: word.hard }"
                    @click.stop="word.hard && showGloss(word)"
                >{{ word.text }}&nbsp;</span>
              </div>
            </div>

            <!-- Glossary tooltip -->
            <transition name="gloss-fade">
              <div v-if="glossWord" class="gloss-card" @click="glossWord = null">
                <div class="gloss-header">
                  <span class="gloss-word">{{ glossWord.text }}</span>
                  <button class="gloss-close" @click.stop="glossWord = null">
                    <i class="pi pi-times"/>
                  </button>
                </div>
                <p class="gloss-def">{{ glossWord.def }}</p>
                <p v-if="glossWord.example" class="gloss-example">
                  <i class="pi pi-book"/> {{ glossWord.example }}
                </p>
                <span class="gloss-tag">{{ glossWord.tag || 'Ескі сөз' }}</span>
              </div>
            </transition>
          </div>
        </transition>

      </div><!-- end main-player-panel -->

      <!-- Empty state -->
      <div v-else class="empty-player">
        <div class="ep-icon"><i class="pi pi-headphones"/></div>
        <p>Тыңдау үшін шығарма таңдаңыз</p>
      </div>

    </div><!-- end player-layout -->

    <!-- ══ WAVEFORM ════════════════════════════════════════ -->
    <div class="waveform-bar" v-if="currentTrack && !loading">
      <div
          v-for="i in 60" :key="i"
          class="wf-bar" :class="{ active: isPlaying }"
          :style="{
          height: wfHeights[i % wfHeights.length] + 'px',
          animationDelay: (i * 0.04) + 's',
          background: i / 60 <= progressPct / 100 ? 'var(--gold)' : 'var(--border)',
        }"
      />
    </div>

  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useAudioStore } from '@/composables/useAudioStore'

// ── Store ─────────────────────────────────────────────
const { tracks, loading, error, init, reloadFromExcel, toggleBookmark } = useAudioStore()

// ── Constants ─────────────────────────────────────────
const speeds    = [0.5, 0.75, 1, 1.25, 1.5]
const wfHeights = [8,14,22,18,30,24,16,28,20,12,26,32,18,24,14,36,20,28,16,22,30,18,24,12,34,20,26,16,28,22,18,32,14,24,20,16,28,22,30,18,26,12,24,20,16,28,22,18,30,14,26,20,24,16,28,22,18,30,26,14]

// ── Refs ──────────────────────────────────────────────
const audioEl    = ref(null)   // <audio> тег
const progressEl = ref(null)

// ── State ─────────────────────────────────────────────
const currentTrack = ref(null)
const isPlaying    = ref(false)
const elapsed      = ref(0)
const duration     = ref(0)
const volume       = ref(80)
const muted        = ref(false)
const shuffle      = ref(false)
const repeat       = ref(false)
const playSpeed    = ref(1)
const showText     = ref(true)
const fontSize     = ref(16)
const searchQ      = ref('')
const glossWord    = ref(null)
const activeLine   = ref(0)

// ── Init ──────────────────────────────────────────────
onMounted(async () => {
  await init()
  if (tracks.value.length) selectTrack(tracks.value[0])
})

onBeforeUnmount(() => {
  audioEl.value?.pause()
})

// ── Audio events — нақты аудио ────────────────────────
function onTimeUpdate() {
  if (!audioEl.value) return
  elapsed.value = audioEl.value.currentTime
}

function onLoadedMeta() {
  if (!audioEl.value) return
  duration.value = audioEl.value.duration || currentTrack.value?.totalSec || 0
  audioEl.value.volume      = volume.value / 100
  audioEl.value.muted       = muted.value
  audioEl.value.playbackRate = playSpeed.value
}

function onEnded() {
  isPlaying.value = false
  if (repeat.value) {
    audioEl.value.currentTime = 0
    audioEl.value.play()
    isPlaying.value = true
  } else {
    nextTrack()
  }
}

// ── Computed ──────────────────────────────────────────
const totalSec = computed(() =>
    duration.value || currentTrack.value?.totalSec || 1
)

const progressPct = computed(() =>
    Math.min((elapsed.value / totalSec.value) * 100, 100)
)

const filteredTracks = computed(() => {
  const q = searchQ.value.toLowerCase()
  return q
      ? tracks.value.filter(t =>
          t.title.toLowerCase().includes(q) || t.author.toLowerCase().includes(q)
      )
      : tracks.value
})

// ── Active line sync — аудиомен синхрон ───────────────
watch(elapsed, (val) => {
  if (!currentTrack.value?.lines?.length) return
  const lines = currentTrack.value.lines
  let al = 0
  for (let i = 0; i < lines.length; i++) {
    if (val >= lines[i].time) al = i
  }
  if (al !== activeLine.value) {
    activeLine.value = al
    document.getElementById('line-' + al)
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
})

// Volume watch
watch(volume, (v) => {
  if (audioEl.value) audioEl.value.volume = v / 100
})
watch(muted, (m) => {
  if (audioEl.value) audioEl.value.muted = m
})
watch(playSpeed, (s) => {
  if (audioEl.value) audioEl.value.playbackRate = s
})

// ── Playback control ──────────────────────────────────
async function togglePlay() {
  if (!audioEl.value || !currentTrack.value?.fileUrl) return
  if (isPlaying.value) {
    audioEl.value.pause()
    isPlaying.value = false
  } else {
    try {
      await audioEl.value.play()
      isPlaying.value = true
    } catch(e) {
      console.warn('[Audio] play failed:', e.message)
    }
  }
}

async function selectTrack(track) {
  const wasPlaying = isPlaying.value

  // Pause current
  if (audioEl.value) {
    audioEl.value.pause()
    isPlaying.value = false
    elapsed.value   = 0
    duration.value  = 0
  }

  currentTrack.value = track
  activeLine.value   = 0
  glossWord.value    = null

  // Wait for <audio> src to update
  await nextTick()

  if (!audioEl.value) return
  audioEl.value.load()

  if (wasPlaying && track.fileUrl) {
    try {
      await audioEl.value.play()
      isPlaying.value = true
    } catch(e) {
      console.warn('[Audio] autoplay blocked:', e.message)
    }
  }
}

function prevTrack() {
  const idx  = tracks.value.findIndex(t => t.id === currentTrack.value?.id)
  const prev = shuffle.value
      ? tracks.value[Math.floor(Math.random() * tracks.value.length)]
      : tracks.value[(idx - 1 + tracks.value.length) % tracks.value.length]
  selectTrack(prev)
}

function nextTrack() {
  const idx  = tracks.value.findIndex(t => t.id === currentTrack.value?.id)
  const next = shuffle.value
      ? tracks.value[Math.floor(Math.random() * tracks.value.length)]
      : tracks.value[(idx + 1) % tracks.value.length]
  selectTrack(next)
}

function seek(e) {
  if (!progressEl.value || !audioEl.value) return
  const rect = progressEl.value.getBoundingClientRect()
  const pct  = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1))
  audioEl.value.currentTime = pct * totalSec.value
  elapsed.value = audioEl.value.currentTime
}

function jumpToLine(i) {
  if (!currentTrack.value || !audioEl.value) return
  const time = currentTrack.value.lines[i]?.time || 0
  audioEl.value.currentTime = time
  elapsed.value             = time
  activeLine.value          = i
}

function toggleMute()    { muted.value   = !muted.value    }
function toggleShuffle() { shuffle.value = !shuffle.value  }
function toggleRepeat()  { repeat.value  = !repeat.value   }
function showGloss(word) { glossWord.value = word          }

function fmtTime(s) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,300&display=swap');

.audio-section {
  --ink:       #1a1208;
  --parchment: #faf6ef;
  --gold:      #c4922a;
  --gold-l:    #e8b94f;
  --rust:      #8b3a1e;
  --sage:      #4a5e4c;
  --border:    #d9cdb8;
  --dark:      #130e07;
  --shadow:    0 4px 24px rgba(26,18,8,.12);
  --shadow-lg: 0 16px 56px rgba(26,18,8,.2);

  background: var(--parchment);
  padding: 3.5rem 1.5rem;
  max-width: 1280px;
  margin: 0 auto;
  font-family: 'Source Serif 4', Georgia, serif;
}

/* ── Header ── */
.section-header { text-align:center; margin-bottom:2.5rem; }
.orn-row    { display:flex; align-items:center; justify-content:center; gap:.75rem; margin-bottom:1rem; }
.orn-line   { display:block; height:1px; width:80px; background:linear-gradient(90deg,transparent,var(--gold)); }
.orn-line:last-child { background:linear-gradient(90deg,var(--gold),transparent); }
.orn-diamond{ color:var(--gold); font-size:.7rem; }
.section-title { font-family:'Playfair Display',serif; font-size:clamp(2rem,4vw,2.75rem); font-weight:900; color:var(--ink); margin:0 0 .5rem; }
.title-kz   { color:var(--ink); }
.section-sub{ color:#7a6a52; font-size:.95rem; font-style:italic; margin:0; }

/* ── States ── */
.db-state   { display:flex; flex-direction:column; align-items:center; gap:1rem; padding:5rem 2rem; text-align:center; color:#7a6a52; }
.db-state.error i { font-size:2rem; color:var(--gold); }
.db-hint    { font-size:.72rem; color:#b0a090; font-family:monospace; }
.db-spinner { width:44px; height:44px; border:3px solid rgba(196,146,42,.18); border-top-color:var(--gold); border-radius:50%; animation:spin .75s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
.retry-btn  { display:inline-flex; align-items:center; gap:.4rem; background:var(--gold); color:#fff; border:none; padding:.5rem 1.3rem; border-radius:2px; font-family:'Source Serif 4',serif; font-size:.85rem; font-weight:600; cursor:pointer; transition:background .2s; }
.retry-btn:hover { background:var(--gold-l); }

/* ── Layout ── */
.player-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1.5rem;
  align-items: start;
}
@media(max-width:960px) { .player-layout { grid-template-columns:1fr; } }

/* ── Track list panel ── */
.track-list-panel { background:var(--dark); border-radius:4px; overflow:hidden; border:1px solid rgba(196,146,42,.2); box-shadow:var(--shadow-lg); }
.tlp-head  { padding:.85rem 1rem; border-bottom:1px solid rgba(196,146,42,.15); display:flex; flex-direction:column; gap:.6rem; }
.tlp-title { font-size:.72rem; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--gold); display:flex; align-items:center; gap:.4rem; }
.tlp-cnt   { font-size:.65rem; background:rgba(196,146,42,.15); padding:.08rem .38rem; border-radius:8px; }
.tlp-search{ display:flex; align-items:center; gap:.5rem; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:2px; padding:.38rem .65rem; }
.tlp-search i { color:rgba(255,255,255,.3); font-size:.75rem; }
.tlp-input { flex:1; background:transparent; border:none; outline:none; font-family:'Source Serif 4',serif; font-size:.78rem; color:#fff; }
.tlp-input::placeholder { color:rgba(255,255,255,.25); font-style:italic; }

.track-list { list-style:none; margin:0; padding:.35rem 0; max-height:420px; overflow-y:auto; scroll-behavior:smooth; }
.track-list::-webkit-scrollbar { width:4px; }
.track-list::-webkit-scrollbar-track { background:rgba(255,255,255,.04); }
.track-list::-webkit-scrollbar-thumb { background:rgba(196,146,42,.35); border-radius:2px; }
.track-list::-webkit-scrollbar-thumb:hover { background:var(--gold); }
.track-item { display:flex; align-items:center; gap:.75rem; padding:.65rem 1rem; cursor:pointer; transition:background .18s; border-left:2px solid transparent; }
.track-item:hover  { background:rgba(255,255,255,.05); }
.track-item.active { background:rgba(196,146,42,.1); border-left-color:var(--gold); }

.ti-num  { width:22px; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
.ti-index{ font-size:.72rem; color:rgba(255,255,255,.3); }
.ti-wave { display:flex; align-items:flex-end; gap:2px; height:14px; }
.ti-wave span { display:block; width:3px; border-radius:1px; background:var(--gold); animation:wave-b .6s ease-in-out infinite; }
.ti-wave span:nth-child(2){ animation-delay:.15s; }
.ti-wave span:nth-child(3){ animation-delay:.3s;  }
@keyframes wave-b { 0%,100%{height:4px} 50%{height:12px} }

.ti-cover     { width:38px; height:38px; border-radius:2px; overflow:hidden; flex-shrink:0; }
.ti-cover img { width:100%; height:100%; object-fit:cover; }
.ti-info      { flex:1; min-width:0; }
.ti-title     { font-size:.8rem; font-weight:600; color:#fff; margin:0 0 .15rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ti-author    { font-size:.68rem; color:rgba(255,255,255,.4); margin:0; font-style:italic; }
.ti-right     { display:flex; flex-direction:column; align-items:flex-end; gap:.2rem; flex-shrink:0; }
.ti-genre     { font-size:.6rem; color:var(--gold); letter-spacing:.06em; text-transform:uppercase; }
.ti-dur       { font-size:.68rem; color:rgba(255,255,255,.3); }
.ti-bm        { font-size:.72rem; color:var(--gold); }

/* ── Main player panel ── */
.main-player-panel { display:flex; flex-direction:column; gap:1.25rem; }

/* ── Player card ── */
.player-card { background:var(--dark); border:1px solid rgba(196,146,42,.2); border-radius:4px; overflow:hidden; display:grid; grid-template-columns:240px 1fr; box-shadow:var(--shadow-lg); }
@media(max-width:700px) { .player-card { grid-template-columns:1fr; } }

.album-art-wrap { position:relative; padding:2rem; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,.3); }
.album-spin     { position:relative; width:160px; height:160px; flex-shrink:0; }
.album-spin.spinning { animation:vinyl 8s linear infinite; }
@keyframes vinyl { to { transform:rotate(360deg); } }
.album-img    { width:100%; height:100%; object-fit:cover; border-radius:50%; box-shadow:0 8px 32px rgba(0,0,0,.5); }
.album-ring   { position:absolute; inset:0; border-radius:50%; border:2px solid rgba(196,146,42,.3); box-shadow:inset 0 0 0 30px rgba(0,0,0,.2); pointer-events:none; }
.album-center { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:22px; height:22px; border-radius:50%; background:var(--dark); border:2px solid rgba(196,146,42,.5); }
.album-glow   { position:absolute; inset:-20px; pointer-events:none; opacity:.6; }

.player-info   { padding:1.5rem; display:flex; flex-direction:column; gap:.85rem; }
.player-genre  { font-size:.65rem; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--gold); }
.player-title  { font-family:'Playfair Display',serif; font-size:1.25rem; font-weight:900; color:#fff; margin:0; line-height:1.2; }
.player-author { font-size:.82rem; color:rgba(255,255,255,.5); font-style:italic; margin:0; }

/* Аудио URL badge */
.audio-url-badge {
  display: flex; align-items: center; gap: .45rem;
  background: rgba(196,146,42,.1); border: 1px solid rgba(196,146,42,.25);
  border-radius: 2px; padding: .35rem .65rem;
  font-size: .68rem; color: var(--gold-l); font-family: monospace;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.audio-url-badge i { font-size: .75rem; flex-shrink: 0; color: var(--gold); }
.audio-no-file {
  display: flex; align-items: center; gap: .4rem;
  font-size: .72rem; color: rgba(239,154,154,.75);
  background: rgba(239,154,154,.07); border: 1px solid rgba(239,154,154,.2);
  border-radius: 2px; padding: .35rem .65rem;
}
.audio-no-file i { font-size: .75rem; }

/* Progress */
.progress-wrap  { cursor:pointer; user-select:none; }
.progress-track { position:relative; height:4px; background:rgba(255,255,255,.12); border-radius:2px; margin-bottom:.4rem; }
.progress-fill  { height:100%; background:linear-gradient(90deg,var(--gold),var(--gold-l)); border-radius:2px; transition:width .3s; }
.progress-thumb { position:absolute; top:50%; transform:translate(-50%,-50%); width:12px; height:12px; border-radius:50%; background:var(--gold-l); box-shadow:0 0 6px var(--gold); transition:left .3s; }
.progress-times { display:flex; justify-content:space-between; font-size:.65rem; color:rgba(255,255,255,.3); }

/* Controls */
.player-controls { display:flex; align-items:center; justify-content:center; gap:.75rem; }
.pc-btn { background:none; border:none; color:rgba(255,255,255,.5); font-size:1rem; cursor:pointer; padding:.35rem; border-radius:50%; transition:color .2s, transform .2s; display:flex; align-items:center; justify-content:center; }
.pc-btn:hover    { color:#fff; }
.pc-btn.on       { color:var(--gold); }
.pc-btn.play-btn { width:52px; height:52px; background:var(--gold); color:#fff; font-size:1.1rem; transition:background .2s, transform .2s; }
.pc-btn.play-btn:hover:not(:disabled) { background:var(--gold-l); transform:scale(1.06); }
.pc-btn.play-btn.play-disabled { background:rgba(255,255,255,.1); cursor:not-allowed; opacity:.5; }

/* Extras */
.player-extras { display:flex; flex-direction:column; gap:.5rem; }
.vol-row   { display:flex; align-items:center; gap:.5rem; }
.pe-btn    { background:none; border:none; color:rgba(255,255,255,.45); font-size:.82rem; cursor:pointer; transition:color .2s; }
.pe-btn:hover { color:var(--gold-l); }
.vol-slider{ flex:1; height:3px; accent-color:var(--gold); cursor:pointer; }
.vol-num   { font-size:.68rem; color:rgba(255,255,255,.3); min-width:28px; }
.speed-row { display:flex; align-items:center; gap:.4rem; font-size:.72rem; color:rgba(255,255,255,.35); }
.speed-row i { font-size:.75rem; color:var(--gold); }
.speed-label { margin-right:.2rem; }
.speed-btn { background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); color:rgba(255,255,255,.45); font-size:.68rem; padding:.15rem .45rem; border-radius:1px; cursor:pointer; transition:all .18s; font-family:'Source Serif 4',serif; }
.speed-btn:hover  { border-color:var(--gold); color:var(--gold-l); }
.speed-btn.active { background:var(--gold); border-color:var(--gold); color:#fff; }

/* Actions */
.player-actions { display:flex; gap:.5rem; flex-wrap:wrap; }
.pa-btn { display:inline-flex; align-items:center; gap:.4rem; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); color:rgba(255,255,255,.55); font-family:'Source Serif 4',serif; font-size:.72rem; padding:.35rem .75rem; border-radius:1px; cursor:pointer; transition:all .18s; }
.pa-btn:hover { border-color:var(--gold); color:var(--gold-l); }
.pa-btn i { font-size:.75rem; }

/* ── Text panel ── */
.text-panel { background:#fff; border:1px solid var(--border); border-radius:4px; overflow:hidden; box-shadow:var(--shadow); position:relative; }
.tp-header  { display:flex; align-items:center; justify-content:space-between; padding:.75rem 1.1rem; border-bottom:2px solid var(--gold); background:#fdf8f0; flex-wrap:wrap; gap:.5rem; }
.tp-header-left  { display:flex; align-items:center; gap:.5rem; font-size:.72rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--gold); }
.tp-lines-cnt    { font-size:.65rem; background:rgba(196,146,42,.12); padding:.08rem .38rem; border-radius:8px; font-weight:400; text-transform:none; letter-spacing:0; }
.tp-header-right { display:flex; align-items:center; gap:1rem; flex-wrap:wrap; }
.tp-hint  { font-size:.68rem; color:#9a8a72; font-style:italic; display:flex; align-items:center; gap:.3rem; }
.tp-hint i{ color:var(--gold); font-size:.7rem; }
.font-controls { display:flex; align-items:center; gap:.3rem; }
.fc-btn { background:#fff; border:1.5px solid var(--border); border-radius:1px; color:#7a6a52; font-size:.72rem; font-weight:700; padding:.18rem .5rem; cursor:pointer; transition:all .18s; font-family:serif; }
.fc-btn:hover { border-color:var(--gold); color:var(--gold); }
.fc-size{ font-size:.72rem; color:#9a8a72; min-width:18px; text-align:center; }

.text-body { padding:1.5rem 1.75rem 1rem; max-height:320px; overflow-y:auto; line-height:2; scroll-behavior:smooth; }

.text-line  { display:flex; flex-wrap:wrap; align-items:baseline; padding:.3rem .5rem; border-radius:2px; margin-bottom:.15rem; cursor:pointer; transition:background .2s; border-left:2px solid transparent; }
.text-line:hover  { background:#fdf8f0; }
.text-line.active { background:rgba(196,146,42,.1); border-left-color:var(--gold); }
.text-word  { color:var(--ink); cursor:default; transition:color .15s; font-style:italic; }
.text-word.hard { color:var(--rust); border-bottom:1.5px dotted var(--gold); cursor:pointer; font-weight:600; padding:0 .1rem; border-radius:1px; transition:color .18s, background .18s; }
.text-word.hard:hover { color:var(--gold); background:rgba(196,146,42,.1); }

/* Gloss card */
.gloss-card { position:absolute; bottom:1rem; left:1rem; right:1rem; background:var(--dark); border:1px solid rgba(196,146,42,.35); border-radius:3px; padding:1rem 1.1rem; box-shadow:0 8px 32px rgba(0,0,0,.25); z-index:20; cursor:pointer; }
.gloss-header  { display:flex; align-items:center; justify-content:space-between; margin-bottom:.5rem; }
.gloss-word    { font-family:'Playfair Display',serif; font-size:1.1rem; font-weight:700; color:var(--gold-l); }
.gloss-close   { background:none; border:none; color:rgba(255,255,255,.4); cursor:pointer; font-size:.8rem; }
.gloss-def     { font-size:.82rem; color:rgba(255,255,255,.75); line-height:1.6; margin:0 0 .45rem; }
.gloss-example { font-size:.75rem; color:rgba(255,255,255,.4); font-style:italic; margin:0 0 .5rem; display:flex; align-items:center; gap:.35rem; }
.gloss-example i { color:var(--gold); font-size:.72rem; }
.gloss-tag { font-size:.62rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--gold); background:rgba(196,146,42,.12); padding:.15rem .5rem; border-radius:1px; border:1px solid rgba(196,146,42,.25); }

/* No lines */
.no-lines { display:flex; align-items:center; justify-content:center; gap:.65rem; padding:1.5rem; background:#fff; border:1px solid var(--border); border-radius:3px; color:#9a8a72; font-style:italic; font-size:.85rem; }
.no-lines i { color:var(--border); font-size:1.1rem; }

/* ── Transitions ── */
.text-slide-enter-active,.text-slide-leave-active { transition:opacity .3s, transform .3s; }
.text-slide-enter-from,.text-slide-leave-to { opacity:0; transform:translateY(-10px); }
.gloss-fade-enter-active,.gloss-fade-leave-active { transition:opacity .22s; }
.gloss-fade-enter-from,.gloss-fade-leave-to { opacity:0; }

/* ── Waveform ── */
.waveform-bar { display:flex; align-items:center; justify-content:center; gap:3px; padding:1.5rem 0 .5rem; height:60px; }
.wf-bar { width:4px; border-radius:2px; background:var(--border); transition:background .4s; flex-shrink:0; }
.wf-bar.active { animation:wf-a 1.2s ease-in-out infinite; }
@keyframes wf-a { 0%,100%{transform:scaleY(.4)} 50%{transform:scaleY(1)} }

/* ── Empty ── */
.empty-player { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1rem; padding:4rem; background:var(--dark); border-radius:4px; border:1px solid rgba(196,146,42,.15); }
.ep-icon { width:64px; height:64px; border-radius:50%; background:rgba(196,146,42,.1); display:flex; align-items:center; justify-content:center; }
.ep-icon i { font-size:1.75rem; color:var(--gold); }
.empty-player p { color:rgba(255,255,255,.35); font-style:italic; font-size:.9rem; margin:0; }
</style>