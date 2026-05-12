<template>
  <div class="login-page">

    <!-- Background -->
    <div class="lp-bg">
      <img src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1400&q=80" class="lp-bg-img" alt=""/>
      <div class="lp-bg-overlay"/>
      <div class="lp-bg-dots"/>
    </div>

    <div class="lp-wrap">

      <!-- Logo / project title -->
      <div class="lp-brand">
        <div class="lp-logo">
          <svg viewBox="0 0 48 48" fill="none" width="48" height="48">
            <polygon points="24,3 45,14 45,34 24,45 3,34 3,14" stroke="#c4922a" stroke-width="1.5" fill="none"/>
            <circle cx="24" cy="24" r="10" stroke="#c4922a" stroke-width="1" fill="none" opacity=".5"/>
            <path d="M16 18 L16 30 M16 24 L24 20 M24 20 L32 24 M32 18 L32 30" stroke="#c4922a" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="lp-brand-text">
          <span class="lp-brand-main">Аудиовизуалды Әдебиет</span>
          <span class="lp-brand-sub">8-сынып · Оқу платформасы</span>
        </div>
      </div>

      <!-- Login card -->
      <div class="login-card">

        <!-- Role selector -->
        <div class="role-selector">
          <button
            class="role-btn" :class="{ active: role === 'оқушы' }"
            @click="role = 'оқушы'"
          >
            <div class="role-icon student"><i class="pi pi-user"/></div>
            <span class="role-label">Оқушы</span>
            <span class="role-sub">Шәкірт кабинеті</span>
          </button>
          <button
            class="role-btn" :class="{ active: role === 'мұғалім' }"
            @click="role = 'мұғалім'"
          >
            <div class="role-icon teacher"><i class="pi pi-briefcase"/></div>
            <span class="role-label">Мұғалім</span>
            <span class="role-sub">Мұғалім кабинеті</span>
          </button>
        </div>

        <!-- Form header -->
        <div class="card-header">
          <h2 class="card-title">
            {{ role === 'мұғалім' ? 'Мұғалім ретінде кіру' : 'Оқушы ретінде кіру' }}
          </h2>
          <p class="card-sub">Жүйеге кіру үшін логин мен парольді енгізіңіз</p>
        </div>

        <!-- Fields -->
        <div class="form-fields">

          <!-- Login -->
          <div class="field-wrap" :class="{ error: fieldErrors.login }">
            <label class="field-label">
              <i class="pi pi-envelope"/> Email / Логин
            </label>
            <div class="field-input-wrap">
              <input
                v-model="loginInput"
                type="email"
                class="field-input"
                :placeholder="role === 'мұғалім' ? 'teacher@school.kz' : 'pupil@school.kz'"
                @keyup.enter="submit"
                autocomplete="username"
              />
            </div>
            <span v-if="fieldErrors.login" class="field-error">{{ fieldErrors.login }}</span>
          </div>

          <!-- Password -->
          <div class="field-wrap" :class="{ error: fieldErrors.password }">
            <label class="field-label">
              <i class="pi pi-lock"/> Пароль
            </label>
            <div class="field-input-wrap">
              <input
                v-model="password"
                :type="showPwd ? 'text' : 'password'"
                class="field-input"
                placeholder="••••••••"
                @keyup.enter="submit"
                autocomplete="current-password"
              />
              <button class="toggle-pwd" @click="showPwd = !showPwd" type="button">
                <i :class="showPwd ? 'pi pi-eye-slash' : 'pi pi-eye'"/>
              </button>
            </div>
            <span v-if="fieldErrors.password" class="field-error">{{ fieldErrors.password }}</span>
          </div>

          <!-- Auth error -->
          <transition name="err-fade">
            <div v-if="authError" class="auth-error">
              <i class="pi pi-exclamation-triangle"/>
              {{ authError }}
            </div>
          </transition>

          <!-- Demo hint -->
          <div class="demo-hint" v-if="showDemoHint">
            <p class="dh-title"><i class="pi pi-info-circle"/> Тест деректемелері:</p>
            <div class="dh-row" v-if="role === 'мұғалім'">
              <span>Логин: <code>aigul@school.kz</code></span>
              <span>Пароль: <code>teacher123</code></span>
            </div>
            <div class="dh-row" v-else>
              <span>Логин: <code>dana.s@pupil.kz</code></span>
              <span>Пароль: <code>pupil001</code></span>
            </div>
          </div>

          <!-- Submit -->
          <button class="submit-btn" @click="submit" :disabled="authLoading">
            <div v-if="authLoading" class="btn-spinner"/>
            <template v-else>
              <i :class="'pi ' + (role === 'мұғалім' ? 'pi-briefcase' : 'pi-user')"/>
              Кіру
            </template>
          </button>

          <!-- Toggle demo hint -->
          <button class="demo-toggle" @click="showDemoHint = !showDemoHint" type="button">
            <i class="pi pi-question-circle"/>
            {{ showDemoHint ? 'Жасыру' : 'Тест деректемелерін көру' }}
          </button>

        </div>
      </div>

      <!-- Footer -->
      <p class="lp-footer">
        8-сынып · Қазақ әдебиеті · Аудиовизуалды технологиялар арқылы оқыту
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth }   from '@/composables/useAuth'

const router = useRouter()
const { login, authLoading, authError, isTeacher } = useAuth()

const role        = ref('оқушы')
const loginInput  = ref('')
const password    = ref('')
const showPwd     = ref(false)
const showDemoHint= ref(false)
const fieldErrors = reactive({ login: '', password: '' })

function validate() {
  fieldErrors.login    = ''
  fieldErrors.password = ''
  let ok = true
  if (!loginInput.value.trim()) { fieldErrors.login = 'Логинді енгізіңіз'; ok = false }
  if (!password.value)          { fieldErrors.password = 'Парольді енгізіңіз'; ok = false }
  return ok
}

async function submit() {
  if (!validate()) return
  const success = await login(loginInput.value, password.value)
  if (success) {
    if (isTeacher.value) router.push({ name: 'teacher-cabinet' })
    else                 router.push({ name: 'student-profile' })
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap');

.login-page {
  min-height: 100dvh;
  display: flex; align-items: center; justify-content: center;
  position: relative; padding: 2rem 1rem;
  font-family: 'Source Serif 4', Georgia, serif;
}

/* Background */
.lp-bg { position: fixed; inset: 0; z-index: 0; }
.lp-bg-img { width: 100%; height: 100%; object-fit: cover; filter: brightness(.22) saturate(.5); }
.lp-bg-overlay { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(19,14,7,.95) 0%, rgba(19,14,7,.8) 100%); }
.lp-bg-dots { position: absolute; inset: 0; background-image: radial-gradient(circle, rgba(196,146,42,.05) 1px, transparent 1px); background-size: 24px 24px; }

.lp-wrap {
  position: relative; z-index: 1;
  width: 100%; max-width: 460px;
  display: flex; flex-direction: column; align-items: center; gap: 1.5rem;
}

/* Brand */
.lp-brand { display: flex; align-items: center; gap: .85rem; }
.lp-logo  { flex-shrink: 0; }
.lp-brand-text { display: flex; flex-direction: column; }
.lp-brand-main { font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 900; color: #fff; }
.lp-brand-sub  { font-size: .68rem; color: rgba(196,146,42,.8); letter-spacing: .1em; text-transform: uppercase; }

/* Login card */
.login-card {
  width: 100%;
  background: rgba(255,255,255,.05);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 4px;
  padding: 2rem;
  box-shadow: 0 24px 64px rgba(0,0,0,.4);
}

/* Role selector */
.role-selector { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; margin-bottom: 1.5rem; }
.role-btn {
  display: flex; flex-direction: column; align-items: center; gap: .4rem;
  padding: .9rem .5rem; border-radius: 3px;
  border: 1.5px solid rgba(255,255,255,.12);
  background: rgba(255,255,255,.04); cursor: pointer;
  transition: all .22s;
}
.role-btn:hover { border-color: rgba(196,146,42,.4); background: rgba(196,146,42,.06); }
.role-btn.active { border-color: #c4922a; background: rgba(196,146,42,.12); }

.role-icon {
  width: 44px; height: 44px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem;
}
.role-icon.student { background: rgba(42,58,92,.4); color: #90caf9; }
.role-icon.teacher { background: rgba(58,92,42,.4); color: #a5d6a7; }
.role-btn.active .role-icon.student { background: rgba(42,58,92,.6); }
.role-btn.active .role-icon.teacher { background: rgba(58,92,42,.6); }

.role-label { font-size: .88rem; font-weight: 700; color: #fff; }
.role-sub   { font-size: .65rem; color: rgba(255,255,255,.4); }

/* Card header */
.card-header   { margin-bottom: 1.5rem; }
.card-title    { font-family: 'Playfair Display', serif; font-size: 1.25rem; font-weight: 700; color: #fff; margin: 0 0 .35rem; }
.card-sub      { font-size: .78rem; color: rgba(255,255,255,.45); margin: 0; font-style: italic; }

/* Fields */
.form-fields { display: flex; flex-direction: column; gap: .9rem; }

.field-wrap { display: flex; flex-direction: column; gap: .35rem; }
.field-wrap.error .field-input { border-color: rgba(239,154,154,.6) !important; }

.field-label {
  font-size: .72rem; font-weight: 700; letter-spacing: .07em; text-transform: uppercase;
  color: rgba(255,255,255,.45); display: flex; align-items: center; gap: .35rem;
}
.field-label i { font-size: .7rem; color: #c4922a; }

.field-input-wrap { position: relative; }
.field-input {
  width: 100%; background: rgba(255,255,255,.07); border: 1.5px solid rgba(255,255,255,.15);
  border-radius: 2px; color: #fff;
  font-family: 'Source Serif 4', serif; font-size: .9rem;
  padding: .65rem .95rem; outline: none;
  transition: border-color .22s, background .22s;
}
.field-input:focus { border-color: #c4922a; background: rgba(255,255,255,.1); }
.field-input::placeholder { color: rgba(255,255,255,.25); font-style: italic; }

.toggle-pwd {
  position: absolute; right: .75rem; top: 50%; transform: translateY(-50%);
  background: none; border: none; color: rgba(255,255,255,.35);
  font-size: .85rem; cursor: pointer; transition: color .2s; padding: 0;
}
.toggle-pwd:hover { color: rgba(255,255,255,.7); }

.field-error { font-size: .7rem; color: #ef9a9a; }

/* Auth error */
.auth-error {
  display: flex; align-items: center; gap: .55rem;
  background: rgba(183,28,28,.18); border: 1px solid rgba(239,154,154,.3);
  border-radius: 2px; padding: .65rem .85rem;
  font-size: .8rem; color: #ef9a9a;
}
.auth-error i { font-size: .85rem; flex-shrink: 0; }
.err-fade-enter-active, .err-fade-leave-active { transition: opacity .3s, transform .3s; }
.err-fade-enter-from, .err-fade-leave-to { opacity: 0; transform: translateY(-6px); }

/* Demo hint */
.demo-hint {
  background: rgba(196,146,42,.08); border: 1px solid rgba(196,146,42,.25);
  border-radius: 2px; padding: .75rem .9rem;
}
.dh-title { font-size: .72rem; color: #e8b94f; margin: 0 0 .45rem; display: flex; align-items: center; gap: .35rem; }
.dh-row   { display: flex; flex-wrap: wrap; gap: 1rem; font-size: .75rem; color: rgba(255,255,255,.55); }
.dh-row code { background: rgba(255,255,255,.1); padding: .15rem .45rem; border-radius: 2px; color: #e8b94f; font-family: monospace; }

/* Submit */
.submit-btn {
  width: 100%; padding: .78rem;
  background: #c4922a; border: none; border-radius: 2px;
  color: #fff; font-family: 'Source Serif 4', serif;
  font-size: .95rem; font-weight: 700;
  cursor: pointer; transition: background .22s, transform .2s;
  display: flex; align-items: center; justify-content: center; gap: .55rem;
}
.submit-btn:hover:not(:disabled) { background: #e8b94f; transform: translateY(-1px); }
.submit-btn:disabled { opacity: .55; cursor: not-allowed; }

.btn-spinner {
  width: 20px; height: 20px;
  border: 2.5px solid rgba(255,255,255,.3);
  border-top-color: #fff; border-radius: 50%;
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.demo-toggle {
  background: none; border: none; color: rgba(255,255,255,.3);
  font-size: .72rem; cursor: pointer; display: flex; align-items: center; gap: .35rem;
  padding: 0; margin: 0 auto; transition: color .2s;
}
.demo-toggle:hover { color: #c4922a; }

/* Footer */
.lp-footer { font-size: .68rem; color: rgba(255,255,255,.25); text-align: center; font-style: italic; }
</style>
