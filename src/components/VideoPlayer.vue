<template>
  <div class="video-player-wrap" ref="playerWrap">

    <!-- ── YouTube ── -->
    <template v-if="isYoutube">
      <div v-if="!started" class="vp-poster" @click="started = true">
        <img :src="youtubeThumbnail" class="vp-poster-img" alt="poster"/>
        <div class="vp-poster-dark"/>
        <button class="vp-big-play"><i class="pi pi-play"/></button>
        <span class="vp-dur" v-if="duration">{{ duration }}</span>
      </div>
      <iframe
        v-else
        :src="youtubeEmbedUrl + '?autoplay=1&rel=0&modestbranding=1'"
        class="vp-iframe"
        allowfullscreen frameborder="0"
        allow="autoplay; fullscreen"
      />
    </template>

    <!-- ── Native video file (/videos/...) ── -->
    <template v-else>
      <div v-if="!started" class="vp-poster" @click="startNative">
        <img :src="poster" class="vp-poster-img" :alt="title"/>
        <div class="vp-poster-dark"/>
        <button class="vp-big-play"><i class="pi pi-play"/></button>
        <span class="vp-dur" v-if="duration">{{ duration }}</span>
      </div>

      <div v-else class="vp-native-wrap" @mousemove="showControls" @mouseleave="hideControls">
        <video
          ref="videoEl"
          :src="src"
          class="vp-video"
          @timeupdate="onTimeUpdate"
          @loadedmetadata="onLoaded"
          @ended="onEnded"
          @waiting="buffering = true"
          @playing="buffering = false"
          @click="togglePlay"
        />

        <!-- Buffering -->
        <div v-if="buffering" class="vp-buffering">
          <div class="vp-spinner"/>
        </div>

        <!-- Controls overlay -->
        <transition name="ctrl-fade">
          <div v-show="controlsVisible || !playing" class="vp-controls">

            <!-- Progress bar -->
            <div class="vp-progress" @click="seekTo" ref="progressBar">
              <div class="vp-progress-bg"/>
              <div class="vp-progress-fill" :style="{ width: progressPct + '%' }"/>
              <div class="vp-progress-thumb" :style="{ left: progressPct + '%' }"/>
            </div>

            <!-- Btn row -->
            <div class="vp-btn-row">
              <button class="vp-btn" @click="skip(-10)">
                <i class="pi pi-replay"/> <span class="vp-skip-lbl">10</span>
              </button>
              <button class="vp-btn vp-play-btn" @click="togglePlay">
                <i :class="playing ? 'pi pi-pause' : 'pi pi-play'"/>
              </button>
              <button class="vp-btn" @click="skip(10)">
                <i class="pi pi-refresh"/> <span class="vp-skip-lbl">10</span>
              </button>

              <div class="vp-time">{{ fmtTime(currentTime) }} / {{ fmtTime(totalTime) }}</div>

              <div class="vp-spacer"/>

              <!-- Volume -->
              <button class="vp-btn" @click="toggleMute">
                <i :class="muted ? 'pi pi-volume-off' : 'pi pi-volume-up'"/>
              </button>
              <input
                type="range" v-model.number="volume"
                min="0" max="100" step="1"
                class="vp-vol-slider"
                @input="setVolume"
              />

              <!-- Speed -->
              <div class="vp-speed-wrap">
                <button class="vp-btn vp-speed-btn" @click="speedOpen = !speedOpen">
                  {{ playbackRate }}x
                </button>
                <div v-if="speedOpen" class="vp-speed-menu">
                  <button
                    v-for="s in [0.5,0.75,1,1.25,1.5,2]" :key="s"
                    class="vp-speed-item" :class="{ active: playbackRate === s }"
                    @click="setSpeed(s)"
                  >{{ s }}x</button>
                </div>
              </div>

              <!-- Fullscreen -->
              <button class="vp-btn" @click="toggleFullscreen">
                <i :class="isFullscreen ? 'pi pi-window-minimize' : 'pi pi-window-maximize'"/>
              </button>
            </div>
          </div>
        </transition>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'

const props = defineProps({
  src:      { type: String, required: true },
  poster:   { type: String, default: '' },
  title:    { type: String, default: '' },
  duration: { type: String, default: '' },
})
const emit = defineEmits(['progress'])

// ── YouTube detection ─────────────────────────────────
const isYoutube = computed(() =>
  props.src && (props.src.includes('youtube.com') || props.src.includes('youtu.be'))
)
const youtubeId = computed(() => {
  if (!isYoutube.value) return ''
  const m = props.src.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : ''
})
const youtubeEmbedUrl = computed(() =>
  youtubeId.value ? `https://www.youtube.com/embed/${youtubeId.value}` : ''
)
const youtubeThumbnail = computed(() =>
  props.poster || (youtubeId.value ? `https://img.youtube.com/vi/${youtubeId.value}/maxresdefault.jpg` : '')
)

// ── Native video state ────────────────────────────────
const started       = ref(false)
const videoEl       = ref(null)
const progressBar   = ref(null)
const playerWrap    = ref(null)

const playing       = ref(false)
const buffering     = ref(false)
const muted         = ref(false)
const volume        = ref(80)
const currentTime   = ref(0)
const totalTime     = ref(0)
const playbackRate  = ref(1)
const isFullscreen  = ref(false)
const speedOpen     = ref(false)
const controlsVisible = ref(true)
let   hideTimer     = null

const progressPct = computed(() =>
  totalTime.value ? (currentTime.value / totalTime.value) * 100 : 0
)

function startNative() {
  started.value = true
  setTimeout(() => {
    if (videoEl.value) {
      videoEl.value.volume = volume.value / 100
      videoEl.value.play()
      playing.value = true
    }
  }, 100)
}

function togglePlay() {
  if (!videoEl.value) return
  if (playing.value) { videoEl.value.pause(); playing.value = false }
  else               { videoEl.value.play();  playing.value = true  }
}

function skip(sec) {
  if (!videoEl.value) return
  videoEl.value.currentTime = Math.max(0, Math.min(videoEl.value.currentTime + sec, totalTime.value))
}

function seekTo(e) {
  if (!progressBar.value || !videoEl.value) return
  const rect = progressBar.value.getBoundingClientRect()
  const pct  = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1))
  videoEl.value.currentTime = pct * totalTime.value
}

function toggleMute() {
  if (!videoEl.value) return
  muted.value = !muted.value
  videoEl.value.muted = muted.value
}

function setVolume() {
  if (!videoEl.value) return
  videoEl.value.volume = volume.value / 100
  if (volume.value === 0) muted.value = true
  else muted.value = false
}

function setSpeed(s) {
  playbackRate.value = s
  if (videoEl.value) videoEl.value.playbackRate = s
  speedOpen.value = false
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    playerWrap.value?.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

function onTimeUpdate() {
  if (!videoEl.value) return
  currentTime.value = videoEl.value.currentTime
  emit('progress', Math.round((currentTime.value / totalTime.value) * 100))
}
function onLoaded() {
  if (!videoEl.value) return
  totalTime.value = videoEl.value.duration
}
function onEnded()  { playing.value = false }

function showControls() {
  controlsVisible.value = true
  clearTimeout(hideTimer)
  hideTimer = setTimeout(() => { if (playing.value) controlsVisible.value = false }, 3000)
}
function hideControls() {
  if (playing.value) controlsVisible.value = false
}

function fmtTime(s) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

onBeforeUnmount(() => clearTimeout(hideTimer))
</script>

<style scoped>
.video-player-wrap {
  width: 100%;
  background: #080604;
  border-radius: 3px;
  overflow: hidden;
  box-shadow: 0 12px 48px rgba(0,0,0,.35);
  margin-bottom: 1.5rem;
  position: relative;
}

/* Poster */
.vp-poster { position: relative; cursor: pointer; aspect-ratio: 16/9; }
.vp-poster-img { width: 100%; height: 100%; object-fit: cover; display: block; filter: brightness(.65); }
.vp-poster-dark { position: absolute; inset: 0; background: rgba(19,14,7,.35); }
.vp-big-play {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
  width: 68px; height: 68px; border-radius: 50%;
  background: rgba(196,146,42,.92); border: none; color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem; cursor: pointer;
  transition: transform .25s, background .25s;
  box-shadow: 0 4px 24px rgba(196,146,42,.4);
}
.vp-big-play:hover { transform: translate(-50%,-50%) scale(1.1); background: #e8b94f; }
.vp-dur {
  position: absolute; bottom: .85rem; right: .85rem;
  font-size: .75rem; color: rgba(255,255,255,.75);
  background: rgba(0,0,0,.55); padding: .2rem .6rem; border-radius: 2px;
  font-family: monospace;
}

/* YouTube iframe */
.vp-iframe { width: 100%; aspect-ratio: 16/9; display: block; }

/* Native video */
.vp-native-wrap { position: relative; aspect-ratio: 16/9; background: #000; }
.vp-video { width: 100%; height: 100%; display: block; cursor: pointer; }

.vp-buffering {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,.4);
}
.vp-spinner {
  width: 40px; height: 40px;
  border: 3px solid rgba(196,146,42,.2);
  border-top-color: #c4922a;
  border-radius: 50%;
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Controls */
.vp-controls {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: linear-gradient(to top, rgba(0,0,0,.85) 0%, transparent 100%);
  padding: 1.5rem .75rem .5rem;
}
.ctrl-fade-enter-active, .ctrl-fade-leave-active { transition: opacity .25s; }
.ctrl-fade-enter-from, .ctrl-fade-leave-to { opacity: 0; }

.vp-progress {
  position: relative; height: 4px; margin-bottom: .65rem;
  cursor: pointer; border-radius: 2px; overflow: visible;
}
.vp-progress:hover .vp-progress-thumb { transform: translateX(-50%) scale(1.5); }
.vp-progress-bg   { position: absolute; inset: 0; background: rgba(255,255,255,.2); border-radius: 2px; }
.vp-progress-fill { position: absolute; left: 0; top: 0; bottom: 0; background: #c4922a; border-radius: 2px; transition: width .1s; }
.vp-progress-thumb {
  position: absolute; top: 50%; transform: translate(-50%,-50%);
  width: 12px; height: 12px; border-radius: 50%;
  background: #e8b94f; box-shadow: 0 0 4px rgba(196,146,42,.6);
  transition: transform .15s;
}

.vp-btn-row { display: flex; align-items: center; gap: .35rem; }
.vp-btn {
  background: none; border: none; color: rgba(255,255,255,.7);
  font-size: .9rem; cursor: pointer; padding: .25rem .35rem;
  border-radius: 2px; transition: color .2s;
  display: flex; align-items: center; gap: .1rem;
}
.vp-btn:hover { color: #fff; }
.vp-skip-lbl { font-size: .62rem; }
.vp-play-btn {
  width: 36px; height: 36px; border-radius: 50%;
  background: #c4922a; color: #fff !important;
  justify-content: center; font-size: 1rem;
  transition: background .2s, transform .2s !important;
}
.vp-play-btn:hover { background: #e8b94f !important; transform: scale(1.06); }
.vp-time { font-size: .72rem; color: rgba(255,255,255,.55); font-family: monospace; }
.vp-spacer { flex: 1; }

.vp-vol-slider {
  width: 70px; height: 3px; accent-color: #c4922a; cursor: pointer;
}
.vp-speed-wrap { position: relative; }
.vp-speed-btn  { font-size: .72rem !important; min-width: 32px; font-family: monospace; }
.vp-speed-menu {
  position: absolute; bottom: 100%; right: 0; margin-bottom: .4rem;
  background: rgba(19,14,7,.95); border: 1px solid rgba(196,146,42,.3);
  border-radius: 2px; overflow: hidden; width: 64px;
}
.vp-speed-item {
  display: block; width: 100%; padding: .4rem .6rem;
  background: none; border: none; color: rgba(255,255,255,.65);
  font-family: monospace; font-size: .75rem; text-align: center;
  cursor: pointer; transition: background .15s;
}
.vp-speed-item:hover   { background: rgba(196,146,42,.15); color: #fff; }
.vp-speed-item.active  { color: #c4922a; font-weight: 700; }
</style>
