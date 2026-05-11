<template>
  <section class="creative-section">

    <!-- ══ HEADER ══════════════════════════════════════ -->
    <div class="section-header">
      <div class="orn-row">
        <span class="orn-line"/><span class="orn-diamond">◆</span><span class="orn-line"/>
      </div>
      <h2 class="section-title">
        <span class="title-kz">Шығармашылық</span>
      </h2>
      <p class="section-sub">Жазу өнерін дамытыңыз — эссе, сторителлинг, кроссенс</p>
    </div>

    <!-- ══ TYPE CARDS GRID ══════════════════════════════ -->
    <div v-if="!activeTask" class="task-type-grid">
      <div
          v-for="type in taskTypes"
          :key="type.key"
          class="type-card"
          :class="type.key"
          @click="openType(type)"
      >
        <div class="tc-deco" aria-hidden="true"/>
        <div class="tc-icon-wrap">
          <i :class="'pi ' + type.icon"/>
        </div>
        <div class="tc-body">
          <h3 class="tc-title">{{ type.title }}</h3>
          <p class="tc-sub">{{ type.subtitle }}</p>
          <p class="tc-desc">{{ type.desc }}</p>
          <div class="tc-tags">
            <span v-for="tag in type.tags" :key="tag" class="tc-tag">{{ tag }}</span>
          </div>
        </div>
        <div class="tc-footer">
          <span class="tc-count">{{ type.tasks.length }} тапсырма</span>
          <button class="tc-btn">
            Бастау <i class="pi pi-arrow-right"/>
          </button>
        </div>
      </div>
    </div>

    <!-- ══ TASK WORKSPACE ═══════════════════════════════ -->
    <div v-else class="workspace">

      <!-- Workspace header -->
      <div class="ws-header">
        <button class="ws-back" @click="exitTask">
          <i class="pi pi-arrow-left"/> Артқа
        </button>
        <div class="ws-title-row">
          <span class="ws-type-badge" :class="activeType.key">
            <i :class="'pi ' + activeType.icon"/>
            {{ activeType.title }}
          </span>
          <h3 class="ws-title">{{ activeTask.title }}</h3>
        </div>
        <div class="ws-actions-right">
          <button class="ws-btn" @click="prevTask" :disabled="taskIdx === 0">
            <i class="pi pi-chevron-left"/>
          </button>
          <span class="ws-counter">{{ taskIdx + 1 }} / {{ activeType.tasks.length }}</span>
          <button class="ws-btn" @click="nextTask" :disabled="taskIdx === activeType.tasks.length - 1">
            <i class="pi pi-chevron-right"/>
          </button>
        </div>
      </div>

      <!-- ── ESSAY ─────────────────────────────────────── -->
      <div v-if="activeType.key === 'essay'" class="essay-workspace">
        <div class="essay-left">
          <div class="task-card">
            <span class="task-card-label">Тапсырма</span>
            <p class="task-card-text">{{ activeTask.prompt }}</p>
            <div class="task-card-meta" v-if="activeTask.tips">
              <p class="task-tips-head"><i class="pi pi-lightbulb"/> Кеңестер:</p>
              <ul class="task-tips">
                <li v-for="tip in activeTask.tips" :key="tip">{{ tip }}</li>
              </ul>
            </div>
          </div>

          <!-- Structure guide -->
          <div class="structure-guide">
            <p class="sg-head"><i class="pi pi-list"/> Эссе құрылымы</p>
            <div class="sg-steps">
              <div
                  v-for="(step, i) in essayStructure"
                  :key="i"
                  class="sg-step"
                  :class="{ active: activeStructure === i }"
                  @click="activeStructure = i"
              >
                <span class="sgs-num">{{ i + 1 }}</span>
                <div>
                  <span class="sgs-name">{{ step.name }}</span>
                  <span class="sgs-hint">{{ step.hint }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Word counter -->
          <div class="word-stat">
            <div class="ws-stat-row">
              <span><i class="pi pi-file-edit"/> Сөздер: <strong>{{ wordCount }}</strong></span>
              <span><i class="pi pi-clock"/> {{ readTime }} мин оқу</span>
            </div>
            <div class="ws-stat-bar">
              <div class="ws-stat-fill" :style="{ width: Math.min(wordCount / (activeTask.minWords || 200) * 100, 100) + '%' }"/>
            </div>
            <span class="ws-stat-hint">Минимум: {{ activeTask.minWords || 200 }} сөз</span>
          </div>
        </div>

        <div class="essay-right">
          <!-- Toolbar -->
          <div class="editor-toolbar">
            <button class="et-btn" @click="applyFormat('bold')" title="Жирный"><b>Б</b></button>
            <button class="et-btn" @click="applyFormat('italic')" title="Курсив"><i>К</i></button>
            <div class="et-sep"/>
            <button class="et-btn" @click="insertPhrase('Менің ойымша, ')" title="Фраза">💬</button>
            <button class="et-btn" @click="insertPhrase('Мысалы, ')" title="Мысал">📌</button>
            <button class="et-btn" @click="insertPhrase('Қорытындылай келе, ')" title="Қорытынды">📝</button>
            <div class="et-sep"/>
            <button class="et-btn danger" @click="clearText" title="Тазалау"><i class="pi pi-trash"/></button>
          </div>

          <!-- Editor -->
          <div class="editor-area">
            <textarea
                ref="editorRef"
                v-model="userText"
                class="essay-editor"
                :placeholder="activeTask.placeholder || 'Эссені осы жерге жазыңыз…'"
                spellcheck="false"
            />
          </div>

          <!-- Bottom actions -->
          <div class="editor-bottom">
            <button class="eb-btn save" @click="saveWork">
              <i class="pi pi-save"/> Сақтау
            </button>
            <button class="eb-btn submit" @click="submitWork" :disabled="wordCount < 20">
              <i class="pi pi-send"/> Жіберу
            </button>
            <button class="eb-btn hint" @click="showHint = !showHint">
              <i class="pi pi-question-circle"/> Кеңес
            </button>
          </div>

          <transition name="hint-slide">
            <div v-if="showHint" class="hint-box">
              <i class="pi pi-lightbulb"/>
              <p>{{ activeTask.hint || 'Жазбастан бұрын тақырыпты ойланыңыз. Тезис → дәлел → мысал → қорытынды.' }}</p>
            </div>
          </transition>
        </div>
      </div>

      <!-- ── STORYTELLING ────────────────────────────── -->
      <div v-else-if="activeType.key === 'story'" class="story-workspace">
        <div class="story-left">
          <!-- Story card -->
          <div class="task-card story-card">
            <span class="task-card-label">Сторителлинг тапсырмасы</span>
            <p class="task-card-text">{{ activeTask.prompt }}</p>

            <!-- Story elements -->
            <div class="story-elements" v-if="activeTask.elements">
              <p class="se-head">Міндетті элементтер:</p>
              <div class="se-chips">
                <span
                    v-for="el in activeTask.elements"
                    :key="el.label"
                    class="se-chip"
                    :class="{ used: userText.includes(el.trigger || el.label) }"
                >
                  <i :class="'pi ' + el.icon"/>
                  {{ el.label }}
                  <i v-if="userText.includes(el.trigger || el.label)" class="pi pi-check se-done"/>
                </span>
              </div>
            </div>
          </div>

          <!-- Story arc -->
          <div class="story-arc">
            <p class="sg-head"><i class="pi pi-sort-alt-slash"/> Сюжет доғасы</p>
            <div class="arc-steps">
              <div v-for="(arc, i) in storyArc" :key="i" class="arc-step" :class="{ glow: activeArcStep === i }">
                <div class="arc-dot"><span>{{ i + 1 }}</span></div>
                <div class="arc-info">
                  <span class="arc-name">{{ arc.name }}</span>
                  <span class="arc-hint">{{ arc.hint }}</span>
                </div>
              </div>
              <div class="arc-line"/>
            </div>
          </div>

          <div class="word-stat">
            <div class="ws-stat-row">
              <span><i class="pi pi-file-edit"/> Сөздер: <strong>{{ wordCount }}</strong></span>
              <span>Мақсат: {{ activeTask.minWords || 150 }}+</span>
            </div>
            <div class="ws-stat-bar">
              <div class="ws-stat-fill story" :style="{ width: Math.min(wordCount/(activeTask.minWords||150)*100,100)+'%'}"/>
            </div>
          </div>
        </div>

        <div class="story-right">
          <div class="editor-toolbar">
            <button class="et-btn" @click="insertPhrase('Бір күні ')">📅</button>
            <button class="et-btn" @click="insertPhrase('Кенеттен ')">⚡</button>
            <button class="et-btn" @click="insertPhrase('Соның нәтижесінде ')">🔗</button>
            <button class="et-btn" @click="insertPhrase('Ақыр соңында ')">🏁</button>
            <div class="et-sep"/>
            <span class="et-label">Диалог:</span>
            <button class="et-btn" @click="insertPhrase('— ')">«»</button>
          </div>
          <textarea
              ref="editorRef"
              v-model="userText"
              class="essay-editor story-editor"
              :placeholder="activeTask.placeholder || 'Хикаяңызды осы жерге жазыңыз…'"
          />
          <div class="editor-bottom">
            <button class="eb-btn save" @click="saveWork"><i class="pi pi-save"/> Сақтау</button>
            <button class="eb-btn submit" @click="submitWork" :disabled="wordCount < 15">
              <i class="pi pi-send"/> Жіберу
            </button>
          </div>
        </div>
      </div>

      <!-- ── IMAGE TEXT ──────────────────────────────── -->
      <div v-else-if="activeType.key === 'imagetext'" class="image-workspace">
        <div class="image-left">
          <div class="image-display">
            <img :src="activeTask.image" :alt="activeTask.title" class="task-image"/>
            <div class="image-overlay">
              <span class="image-label">Суретті мұқият қараңыз</span>
            </div>
          </div>
          <div class="image-questions" v-if="activeTask.questions">
            <p class="sg-head"><i class="pi pi-question-circle"/> Бағыттаушы сұрақтар:</p>
            <ul class="iq-list">
              <li v-for="q in activeTask.questions" :key="q" @click="insertPhrase(q + ' ')">
                <i class="pi pi-chevron-right"/> {{ q }}
              </li>
            </ul>
            <p class="iq-hint">Сұраққа басыңыз — мәтінге қосылады</p>
          </div>
        </div>

        <div class="image-right">
          <div class="task-card" style="margin-bottom:.85rem">
            <span class="task-card-label">Тапсырма</span>
            <p class="task-card-text">{{ activeTask.prompt }}</p>
          </div>
          <div class="editor-toolbar">
            <button class="et-btn" @click="insertPhrase('Суретте ')">🖼️</button>
            <button class="et-btn" @click="insertPhrase('Мен байқадым, ')">👁️</button>
            <button class="et-btn" @click="insertPhrase('Бұл маған еске түсіреді ')">💭</button>
            <div class="et-sep"/>
            <button class="et-btn danger" @click="clearText"><i class="pi pi-trash"/></button>
          </div>
          <textarea
              ref="editorRef"
              v-model="userText"
              class="essay-editor"
              :placeholder="activeTask.placeholder || 'Сурет бойынша мәтін жазыңыз…'"
          />
          <div class="editor-bottom">
            <div class="ws-stat-row" style="margin-right:auto;font-size:.75rem;color:#9a8a72">
              <span>{{ wordCount }} сөз</span>
            </div>
            <button class="eb-btn save" @click="saveWork"><i class="pi pi-save"/> Сақтау</button>
            <button class="eb-btn submit" @click="submitWork" :disabled="wordCount < 10">
              <i class="pi pi-send"/> Жіберу
            </button>
          </div>
        </div>
      </div>

      <!-- ── CROSSENSE ───────────────────────────────── -->
      <div v-else-if="activeType.key === 'crossense'" class="crossense-workspace">
        <div class="crossense-left">
          <div class="task-card">
            <span class="task-card-label">Кроссенс тапсырмасы</span>
            <p class="task-card-text">{{ activeTask.prompt }}</p>
            <p class="task-card-rule">
              <i class="pi pi-info-circle"/>
              Кроссенс — 9 суреттің ассоциациялық тізбегі. Іргелес суреттер бір-бірімен байланысты болуы тиіс.
            </p>
          </div>

          <!-- Crossense grid -->
          <div class="crossense-grid">
            <div
                v-for="(cell, i) in crossenseCells"
                :key="i"
                class="cs-cell"
                :class="{
                center: i === 4,
                active: selectedCell === i,
                filled: cell.text || cell.image,
                empty: !cell.text && !cell.image
              }"
                @click="selectCell(i)"
            >
              <div class="cs-cell-inner" v-if="cell.image || cell.text">
                <img v-if="cell.image" :src="cell.image" :alt="cell.text" class="cs-img"/>
                <span v-else class="cs-text">{{ cell.text }}</span>
              </div>
              <div class="cs-cell-empty" v-else>
                <i class="pi pi-plus"/>
                <span>{{ i === 4 ? 'Негізгі' : i + 1 }}</span>
              </div>

              <!-- Connection indicators -->
              <div class="cs-conn-right"  v-if="[0,1,3,4,6,7].includes(i)"/>
              <div class="cs-conn-bottom" v-if="[0,1,2,3,4,5].includes(i)"/>
            </div>
          </div>

          <!-- Connection arrows legend -->
          <div class="cs-legend">
            <span class="cs-leg-item"><span class="cs-arr"/>Ассоциация байланысы</span>
            <span class="cs-leg-item"><span class="cs-center-dot"/>Орталық тақырып</span>
          </div>
        </div>

        <div class="crossense-right">
          <!-- Cell editor -->
          <div class="cell-editor" v-if="selectedCell !== null">
            <div class="ce-header">
              <span class="ce-title">
                {{ selectedCell === 4 ? '🎯 Орталық тақырып' : `📦 ${selectedCell + 1}-ұяшық` }}
              </span>
              <button class="ce-clear" @click="clearCell(selectedCell)">
                <i class="pi pi-trash"/>
              </button>
            </div>
            <input
                v-model="crossenseCells[selectedCell].text"
                class="ce-input"
                :placeholder="selectedCell === 4 ? 'Негізгі тақырып (мыс: Абай)' : 'Ассоциация немесе ұғым'"
            />
            <p class="ce-or">немесе сурет URL-і:</p>
            <input
                v-model="crossenseCells[selectedCell].image"
                class="ce-input"
                placeholder="https://..."
            />
            <div class="ce-preview" v-if="crossenseCells[selectedCell].image">
              <img :src="crossenseCells[selectedCell].image" alt="preview" class="ce-preview-img"/>
            </div>
            <div v-if="selectedCell !== 4 && selectedCell !== null" class="ce-connection">
              <p class="ce-conn-head">Байланысты сипаттаңыз:</p>
              <input
                  v-model="crossenseCells[selectedCell].connection"
                  class="ce-input"
                  placeholder="Бұл ұяшықты іргелесімен не байланыстырады?"
              />
            </div>
          </div>

          <div class="cell-editor-empty" v-else>
            <i class="pi pi-hand-pointer"/>
            <p>Ұяшықты таңдаңыз</p>
          </div>

          <!-- Description area -->
          <div class="cs-description">
            <p class="sg-head"><i class="pi pi-align-left"/> Кроссенсті сипаттаңыз</p>
            <textarea
                v-model="userText"
                class="essay-editor cs-editor"
                placeholder="Суреттердің байланысын түсіндіріңіз — тізбекті ассоциацияларды сипаттаңыз…"
            />
            <div class="editor-bottom">
              <span class="ws-stat-row" style="font-size:.72rem;color:#9a8a72">{{ wordCount }} сөз</span>
              <button class="eb-btn save" @click="saveWork"><i class="pi pi-save"/> Сақтау</button>
              <button class="eb-btn submit" @click="submitWork">
                <i class="pi pi-send"/> Жіберу
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ SUBMIT SUCCESS ══════════════════════════════ -->
      <transition name="success-pop">
        <div v-if="submitted" class="submit-success">
          <div class="ss-card">
            <div class="ss-icon"><i class="pi pi-check-circle"/></div>
            <h3 class="ss-title">Жұмыс жіберілді!</h3>
            <p class="ss-sub">Шығармашылық тапсырма сәтті аяқталды</p>
            <div class="ss-stats">
              <span><i class="pi pi-file-edit"/> {{ wordCount }} сөз</span>
              <span><i class="pi pi-clock"/> {{ savedTime }}</span>
            </div>
            <div class="ss-actions">
              <button class="ra-btn primary" @click="nextTask">
                <i class="pi pi-arrow-right"/> Келесі тапсырма
              </button>
              <button class="ra-btn secondary" @click="submitted = false; userText = ''">
                <i class="pi pi-refresh"/> Қайта жазу
              </button>
              <button class="ra-btn ghost" @click="exitTask">
                <i class="pi pi-list"/> Тізімге
              </button>
            </div>
          </div>
        </div>
      </transition>
    </div>

  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// ─── Task types ───────────────────────────────────────
const taskTypes = [
  {
    key: 'essay', icon: 'pi-pencil',
    title: 'Эссе жазу',
    subtitle: 'Пікір · Талдау · Сын',
    desc: 'Ойыңызды дәлелдермен жеткізіңіз. Тезис, аргумент, қорытынды.',
    tags: ['Аналитика', 'Стиль', 'Логика'],
    tasks: [
      {
        id: 1, title: 'Абайдың ағартушылық рөлі',
        prompt: 'Абай Құнанбайұлының қазақ мәдениеті мен білімінің дамуындағы ролін талдаңыз. Ол қандай жаңалықтар әкелді? Оның ізі бүгінде қалай сезіледі?',
        tips: ['Нақты мысалдар келтіріңіз', 'Өз пікіріңізді дәлелдеңіз', 'Қорытындыны ұмытпаңыз'],
        hint: 'Абайдың «Қарасөздерін», орыс мәдениетімен байланысын, ағартушылық идеяларын негіз етіп алыңыз.',
        minWords: 200, placeholder: 'Эссені осы жерге жазыңыз…',
      },
      {
        id: 2, title: 'Мұқағали поэзиясының өзектілігі',
        prompt: 'Мұқағали Мақатаев өлеңдері неліктен XXI ғасырда да актуальды? Оның лирикасындағы мәңгілік тақырыптарды талдаңыз.',
        tips: ['Нақты өлең мысалдарын алыңыз', 'Замандастарымен салыстырыңыз'],
        hint: 'Өмір, өлім, табиғат, сүйіспеншілік — Мұқағали тақырыптары.',
        minWords: 150, placeholder: 'Пікіріңізді жазыңыз…',
      },
      {
        id: 3, title: 'Қазақ әдебиеті мен жаhандану',
        prompt: 'Жаhандану дәуірінде ұлттық әдебиетті сақтаудың маңызы қандай? Қазақ тілінде жазудың болашағы туралы ойланыңыз.',
        tips: ['Мысал ретінде басқа халықтар тәжірибесін алыңыз'],
        hint: 'Тіл — ұлт рухының айнасы. Абай, Мұқағали, қазіргі авторлар.',
        minWords: 200, placeholder: 'Толғанысыңызды жазыңыз…',
      },
    ],
  },
  {
    key: 'story', icon: 'pi-book',
    title: 'Сторителлинг',
    subtitle: 'Хикая · Диалог · Кейіпкер',
    desc: 'Кейіпкер, қақтығыс, шешім — қысқа әдеби хикая жазыңыз.',
    tags: ['Кейіпкер', 'Сюжет', 'Диалог'],
    tasks: [
      {
        id: 1, title: 'Дала мен қала',
        prompt: 'Ауылдан қалаға оқуға келген жас жігіт немесе қыздың алғашқы жылдарын суреттеңіз. Ішкі қайшылықты, іңкәрлікті бейнелеңіз.',
        elements: [
          { label: 'Диалог', icon: 'pi-comment', trigger: '—' },
          { label: 'Табиғат суреті', icon: 'pi-sun', trigger: 'жер' },
          { label: 'Ішкі монолог', icon: 'pi-heart', trigger: 'ойладым' },
        ],
        minWords: 150, placeholder: 'Хикаяны осы жерге жазыңыз…',
      },
      {
        id: 2, title: 'Кітап пен уақыт',
        prompt: 'Ескі кітапханада ескі кітап тапқан адам туралы хикая жазыңыз. Кітаптың сыры не болды?',
        elements: [
          { label: 'Диалог', icon: 'pi-comment', trigger: '—' },
          { label: 'Сипаттама', icon: 'pi-eye', trigger: 'көрді' },
          { label: 'Жұмбақ', icon: 'pi-question', trigger: '?' },
        ],
        minWords: 120, placeholder: 'Хикаяңызды жазыңыз…',
      },
      {
        id: 3, title: 'Соңғы хат',
        prompt: 'Бабасынан тілін білмей өскен немере немесе немерешара атасына хат жазады. Хат формасында шығарма жазыңыз.',
        elements: [
          { label: 'Сезім', icon: 'pi-heart', trigger: 'жүрег' },
          { label: 'Өткен шақ', icon: 'pi-clock', trigger: 'болды' },
          { label: 'Үміт', icon: 'pi-star', trigger: 'болашақ' },
        ],
        minWords: 100, placeholder: 'Хатты осы жерге жазыңыз…',
      },
    ],
  },
  {
    key: 'imagetext', icon: 'pi-image',
    title: 'Сурет → Мәтін',
    subtitle: 'Бақылау · Сипаттама · Интерпретация',
    desc: 'Суретке қарап мәтін жазыңыз — сипаттама, хикая немесе өлең.',
    tags: ['Бақылау', 'Шығармашылық', 'Тіл'],
    tasks: [
      {
        id: 1, title: 'Дала кеші',
        prompt: 'Суретте не көресіз? Кем дегенде 3 абзац жазыңыз: не бейнеленген, сізде қандай сезім туды, бұл сізге нені еске түсіреді.',
        image: 'https://images.unsplash.com/photo-1476820865390-c52aeebb9891?w=800&q=85',
        questions: ['Суретте не бейнеленген?', 'Қандай сезім тудырады?', 'Бұл сізге нені еске түсіреді?', 'Суреттегі адам не ойлап тұрған шығар?'],
        placeholder: 'Сурет бойынша мәтін жазыңыз…',
      },
      {
        id: 2, title: 'Кітап пен шам',
        prompt: 'Суретке қарап қысқа поэтикалық проза немесе өлең жазыңыз. Жарық, білім, уақыт символикасын пайдалануға болады.',
        image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=85',
        questions: ['Жарық нені символдайды?', 'Кітаптар туралы не айтасыз?', 'Уақыт тақырыбын қалай ашасыз?'],
        placeholder: 'Поэтикалық мәтін жазыңыз…',
      },
      {
        id: 3, title: 'Тау шыңы',
        prompt: 'Осы суретті «Мақсатқа жету» тақырыбымен байланыстырып, мотивациялық эссе немесе хикая жазыңыз.',
        image: 'https://images.unsplash.com/photo-1515705576963-95cad62945b6?w=800&q=85',
        questions: ['Тау нені символдайды?', 'Жолдың қиындығы туралы не айтасыз?', 'Шыңға жеткен адам кім?'],
        placeholder: 'Тақырыпты дамытыңыз…',
      },
    ],
  },
  {
    key: 'crossense', icon: 'pi-th-large',
    title: 'Кроссенс',
    subtitle: '9 ұяшық · Ассоциация · Тізбек',
    desc: '9 суреттің ассоциациялық тізбегін жасаңыз. Іргелес ұяшықтар байланысты болуы тиіс.',
    tags: ['Ассоциация', 'Тізбек', '9 ұяшық'],
    tasks: [
      {
        id: 1, title: 'Абай тақырыбы бойынша кроссенс',
        prompt: 'Абай Құнанбайұлы тақырыбы бойынша кроссенс жасаңыз. Орталық ұяшыққа — Абай есімін, іргелес ұяшықтарға ассоциацияларды орналастырыңыз.',
        suggestions: ['Абай', 'Қарасөздер', 'Поэзия', 'Дала', 'Ағарту', 'Орыс мәдениеті', 'Шыңғыс тауы', 'Сөз', 'Рух'],
      },
      {
        id: 2, title: 'Қазақ табиғаты',
        prompt: 'Қазақстан табиғатының 9 символын ассоциациялық тізбекке байлаңыз.',
        suggestions: ['Дала', 'Жайлау', 'Тау', 'Өзен', 'Бүркіт', 'Күн', 'Ат', 'Боз үй', 'Жұлдыз'],
      },
    ],
  },
]

// ─── State ────────────────────────────────────────────
const activeType  = ref(null)
const activeTask  = ref(null)
const taskIdx     = ref(0)
const userText    = ref('')
const showHint    = ref(false)
const submitted   = ref(false)
const savedTime   = ref('')
const editorRef   = ref(null)
const activeStructure = ref(0)
const activeArcStep   = ref(0)

// Crossense
const selectedCell = ref(null)
const crossenseCells = ref(Array.from({ length: 9 }, () => ({ text: '', image: '', connection: '' })))

// ─── Essay structure ──────────────────────────────────
const essayStructure = [
  { name: 'Кіріспе',    hint: 'Тезис + өзектілік' },
  { name: 'Дәлел 1',   hint: 'Аргумент + мысал' },
  { name: 'Дәлел 2',   hint: 'Аргумент + мысал' },
  { name: 'Қарсы пікір',hint: 'Антитезис + жауап' },
  { name: 'Қорытынды', hint: 'Тезисті растау' },
]

const storyArc = [
  { name: 'Экспозиция',    hint: 'Кейіпкер, орын, уақыт' },
  { name: 'Шиеленіс',      hint: 'Мәселе немесе қақтығыс' },
  { name: 'Кульминация',   hint: 'Ең шиеленіскен сәт' },
  { name: 'Шешім',         hint: 'Қақтығыстың шешілуі' },
  { name: 'Эпилог',        hint: 'Нәтиже, ой' },
]

// ─── Computed ─────────────────────────────────────────
const wordCount = computed(() =>
    userText.value.trim() ? userText.value.trim().split(/\s+/).length : 0
)
const readTime = computed(() => Math.max(1, Math.ceil(wordCount.value / 200)))

// ─── Actions ──────────────────────────────────────────
function openType(type) {
  activeType.value = type
  taskIdx.value    = 0
  openTask(type.tasks[0])
}

function openTask(task) {
  activeTask.value = task
  userText.value   = localStorage.getItem(`creative_${task.id}`) || ''
  submitted.value  = false
  showHint.value   = false
  selectedCell.value = null
  if (activeType.value?.key === 'crossense') {
    const saved = localStorage.getItem(`crossense_${task.id}`)
    crossenseCells.value = saved
        ? JSON.parse(saved)
        : Array.from({ length: 9 }, () => ({ text: '', image: '', connection: '' }))
    // Pre-fill suggestions
    if (task.suggestions && !crossenseCells.value.some(c => c.text)) {
      task.suggestions.forEach((s, i) => {
        if (i < 9) crossenseCells.value[i].text = s
      })
      crossenseCells.value[4].text = task.suggestions[0] || ''
    }
  }
}

function exitTask() {
  activeType.value = null
  activeTask.value = null
  submitted.value  = false
}

function prevTask() {
  if (taskIdx.value > 0) {
    taskIdx.value--
    openTask(activeType.value.tasks[taskIdx.value])
  }
}

function nextTask() {
  if (taskIdx.value < activeType.value.tasks.length - 1) {
    taskIdx.value++
    openTask(activeType.value.tasks[taskIdx.value])
  } else {
    submitted.value = false
  }
}

function saveWork() {
  localStorage.setItem(`creative_${activeTask.value.id}`, userText.value)
  if (activeType.value?.key === 'crossense')
    localStorage.setItem(`crossense_${activeTask.value.id}`, JSON.stringify(crossenseCells.value))
}

function submitWork() {
  saveWork()
  savedTime.value = new Date().toLocaleTimeString('kk-KZ', { hour: '2-digit', minute: '2-digit' })
  submitted.value = true
}

function clearText()  { if (confirm('Мәтінді тазаламақшысыз ба?')) userText.value = '' }
function applyFormat(fmt) { /* can extend with execCommand for contenteditable */ }
function insertPhrase(phrase) {
  const el = editorRef.value
  if (!el) { userText.value += phrase; return }
  const start = el.selectionStart, end = el.selectionEnd
  userText.value = userText.value.slice(0, start) + phrase + userText.value.slice(end)
  setTimeout(() => { el.setSelectionRange(start + phrase.length, start + phrase.length); el.focus() }, 0)
}

// Crossense
function selectCell(i)  { selectedCell.value = i }
function clearCell(i)   { crossenseCells.value[i] = { text: '', image: '', connection: '' } }
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,300&display=swap');

.creative-section {
  --ink:    #1a1208; --parch:  #faf6ef;
  --gold:   #c4922a; --gold-l: #e8b94f;
  --rust:   #8b3a1e; --sage:   #3a5c3a;
  --navy:   #2a3a5c; --border: #d9cdb8;
  --dark:   #130e07;
  --shd:    0 4px 24px rgba(26,18,8,.10);
  --shd-lg: 0 14px 48px rgba(26,18,8,.18);
  background: var(--parch);
  padding: 3.5rem 1.5rem;
  max-width: 1280px;
  margin: 0 auto;
  font-family: 'Source Serif 4', Georgia, serif;
}

/* Header */
.section-header { text-align:center; margin-bottom:2.5rem; }
.orn-row { display:flex; align-items:center; justify-content:center; gap:.75rem; margin-bottom:1rem; }
.orn-line { display:block; height:1px; width:80px; background:linear-gradient(90deg,transparent,var(--gold)); }
.orn-line:last-child { background:linear-gradient(90deg,var(--gold),transparent); }
.orn-diamond { color:var(--gold); font-size:.7rem; }
.section-title { font-family:'Playfair Display',serif; font-size:clamp(2rem,4vw,2.75rem); font-weight:900; color:var(--ink); margin:0 0 .5rem; }
.title-kz { color:var(--ink); } .title-div { color:var(--gold); margin:0 .5rem; }
.title-ru { color:var(--rust); font-style:italic; font-weight:600; font-size:80%; }
.section-sub { color:#7a6a52; font-size:.95rem; font-style:italic; margin:0; }

/* ── Type card grid ── */
.task-type-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(270px,1fr)); gap:1.5rem; }

.type-card {
  background:#fff; border:1px solid var(--border); border-radius:4px;
  overflow:hidden; cursor:pointer; position:relative;
  display:flex; flex-direction:column;
  transition:transform .3s, box-shadow .3s;
}
.type-card:hover { transform:translateY(-6px); box-shadow:var(--shd-lg); }
.type-card::before { content:''; position:absolute; top:0; left:0; right:0; height:4px; }
.type-card.essay::before      { background:linear-gradient(90deg,var(--gold),var(--gold-l)); }
.type-card.story::before      { background:linear-gradient(90deg,var(--rust),#c4622a); }
.type-card.imagetext::before  { background:linear-gradient(90deg,var(--sage),#5a8c5a); }
.type-card.crossense::before  { background:linear-gradient(90deg,var(--navy),#3a5a8c); }

.tc-deco {
  position:absolute; top:-30px; right:-30px; width:120px; height:120px; border-radius:50%;
  opacity:.05;
}
.type-card.essay     .tc-deco { background:var(--gold); }
.type-card.story     .tc-deco { background:var(--rust); }
.type-card.imagetext .tc-deco { background:var(--sage); }
.type-card.crossense .tc-deco { background:var(--navy); }

.tc-icon-wrap {
  width:56px; height:56px; border-radius:50%; margin:1.5rem 1.5rem .5rem;
  display:flex; align-items:center; justify-content:center;
}
.type-card.essay     .tc-icon-wrap { background:rgba(196,146,42,.12); }
.type-card.story     .tc-icon-wrap { background:rgba(139,58,30,.12); }
.type-card.imagetext .tc-icon-wrap { background:rgba(58,92,58,.12); }
.type-card.crossense .tc-icon-wrap { background:rgba(42,58,92,.12); }

.tc-icon-wrap i { font-size:1.5rem; }
.type-card.essay     .tc-icon-wrap i { color:var(--gold); }
.type-card.story     .tc-icon-wrap i { color:var(--rust); }
.type-card.imagetext .tc-icon-wrap i { color:var(--sage); }
.type-card.crossense .tc-icon-wrap i { color:var(--navy); }

.tc-body { padding:0 1.5rem 1rem; flex:1; }
.tc-title { font-family:'Playfair Display',serif; font-size:1.2rem; font-weight:900; color:var(--ink); margin:0 0 .2rem; }
.tc-sub   { font-size:.72rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--gold); margin:0 0 .6rem; }
.tc-desc  { font-size:.82rem; color:#5a4a35; line-height:1.65; margin:0 0 .85rem; }
.tc-tags  { display:flex; flex-wrap:wrap; gap:.35rem; }
.tc-tag   { font-size:.65rem; background:#f5ede0; border:1px solid var(--border); color:#7a6a52; padding:.15rem .55rem; border-radius:10px; }

.tc-footer { display:flex; align-items:center; justify-content:space-between; padding:.85rem 1.5rem; border-top:1px solid var(--border); background:#fdf9f4; }
.tc-count  { font-size:.72rem; color:#9a8a72; }
.tc-btn    { display:inline-flex; align-items:center; gap:.4rem; background:var(--gold); color:#fff; border:none; padding:.42rem .9rem; border-radius:2px; font-family:'Source Serif 4',serif; font-size:.78rem; font-weight:700; cursor:pointer; transition:background .2s; }
.tc-btn:hover { background:var(--gold-l); }
.type-card.story     .tc-btn { background:var(--rust); }
.type-card.story     .tc-btn:hover { background:#a04428; }
.type-card.imagetext .tc-btn { background:var(--sage); }
.type-card.imagetext .tc-btn:hover { background:#4a7a4a; }
.type-card.crossense .tc-btn { background:var(--navy); }
.type-card.crossense .tc-btn:hover { background:#3a4a7c; }

/* ── Workspace ── */
.workspace { display:flex; flex-direction:column; gap:1.25rem; }

.ws-header { display:flex; align-items:center; gap:1rem; background:var(--dark); border-radius:3px; padding:.85rem 1.25rem; border:1px solid rgba(196,146,42,.2); }
.ws-back   { display:flex; align-items:center; gap:.4rem; background:none; border:1px solid rgba(255,255,255,.15); border-radius:2px; color:rgba(255,255,255,.55); font-family:'Source Serif 4',serif; font-size:.78rem; padding:.35rem .75rem; cursor:pointer; transition:all .2s; white-space:nowrap; }
.ws-back:hover { border-color:var(--gold); color:var(--gold-l); }
.ws-title-row { flex:1; display:flex; align-items:center; gap:.7rem; min-width:0; }
.ws-type-badge { display:inline-flex; align-items:center; gap:.35rem; flex-shrink:0; font-size:.6rem; font-weight:700; letter-spacing:.09em; text-transform:uppercase; padding:.2rem .6rem; border-radius:1px; color:#fff; }
.ws-type-badge.essay     { background:var(--gold); }
.ws-type-badge.story     { background:var(--rust); }
.ws-type-badge.imagetext { background:var(--sage); }
.ws-type-badge.crossense { background:var(--navy); }
.ws-title { font-family:'Playfair Display',serif; font-size:.95rem; font-weight:700; color:#fff; margin:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ws-actions-right { display:flex; align-items:center; gap:.5rem; flex-shrink:0; }
.ws-btn   { width:30px; height:30px; border:1px solid rgba(255,255,255,.18); border-radius:2px; background:transparent; color:rgba(255,255,255,.55); display:flex; align-items:center; justify-content:center; font-size:.8rem; cursor:pointer; transition:all .2s; }
.ws-btn:hover:not(:disabled) { border-color:var(--gold); color:var(--gold-l); }
.ws-btn:disabled { opacity:.25; cursor:not-allowed; }
.ws-counter { font-size:.75rem; color:rgba(255,255,255,.45); min-width:40px; text-align:center; }

/* ── Task card ── */
.task-card { background:#fff; border:1px solid var(--border); border-radius:3px; padding:1.25rem; border-left:3px solid var(--gold); margin-bottom:1rem; }
.task-card-label { font-size:.65rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--gold); display:block; margin-bottom:.5rem; }
.task-card-text  { font-family:'Playfair Display',serif; font-size:1rem; font-weight:700; color:var(--ink); margin:0 0 .85rem; line-height:1.5; }
.task-card-rule  { font-size:.78rem; color:#5a4a35; font-style:italic; display:flex; align-items:flex-start; gap:.4rem; margin:0; }
.task-card-rule i { color:var(--gold); margin-top:.15rem; flex-shrink:0; }
.task-card-meta  { border-top:1px solid var(--border); padding-top:.75rem; margin-top:.75rem; }
.task-tips-head  { font-size:.72rem; font-weight:700; color:var(--gold); margin:0 0 .4rem; display:flex; align-items:center; gap:.3rem; }
.task-tips       { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:.28rem; }
.task-tips li    { font-size:.78rem; color:#5a4a35; display:flex; align-items:flex-start; gap:.4rem; }
.task-tips li::before { content:'◆'; color:var(--gold); font-size:.45rem; margin-top:.4rem; flex-shrink:0; }

/* ── Structure guide ── */
.structure-guide,.story-arc { background:#fff; border:1px solid var(--border); border-radius:3px; padding:1rem; margin-bottom:1rem; }
.sg-head { font-size:.68rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:#9a8a72; margin:0 0 .75rem; display:flex; align-items:center; gap:.4rem; }
.sg-head i { color:var(--gold); font-size:.75rem; }
.sg-steps { display:flex; flex-direction:column; gap:.35rem; }
.sg-step  { display:flex; align-items:center; gap:.65rem; padding:.42rem .6rem; border-radius:2px; cursor:pointer; transition:background .15s; border-left:2px solid transparent; }
.sg-step:hover  { background:#fdf8f0; }
.sg-step.active { background:rgba(196,146,42,.08); border-left-color:var(--gold); }
.sgs-num  { width:22px; height:22px; border-radius:50%; background:rgba(196,146,42,.12); color:var(--gold); display:flex; align-items:center; justify-content:center; font-size:.68rem; font-weight:700; flex-shrink:0; }
.sgs-name { display:block; font-size:.78rem; font-weight:600; color:var(--ink); }
.sgs-hint { display:block; font-size:.68rem; color:#9a8a72; }

/* Story arc */
.arc-steps { display:flex; flex-direction:column; gap:.35rem; position:relative; }
.arc-line  { position:absolute; left:17px; top:11px; bottom:11px; width:2px; background:linear-gradient(to bottom,var(--gold),transparent); pointer-events:none; }
.arc-step  { display:flex; align-items:center; gap:.65rem; padding:.42rem .6rem .42rem 0; position:relative; z-index:1; }
.arc-dot   { width:22px; height:22px; border-radius:50%; background:#fff; border:2px solid var(--border); display:flex; align-items:center; justify-content:center; font-size:.65rem; font-weight:700; color:#9a8a72; flex-shrink:0; transition:all .25s; }
.arc-step.glow .arc-dot { border-color:var(--gold); color:var(--gold); background:rgba(196,146,42,.08); }
.arc-name { display:block; font-size:.78rem; font-weight:600; color:var(--ink); }
.arc-hint { display:block; font-size:.65rem; color:#9a8a72; }

/* Word stat */
.word-stat { background:#fff; border:1px solid var(--border); border-radius:3px; padding:.85rem 1rem; }
.ws-stat-row { display:flex; justify-content:space-between; font-size:.75rem; color:#9a8a72; margin-bottom:.4rem; }
.ws-stat-row i { color:var(--gold); margin-right:.25rem; }
.ws-stat-bar  { height:5px; background:var(--border); border-radius:3px; overflow:hidden; margin-bottom:.28rem; }
.ws-stat-fill { height:100%; background:linear-gradient(90deg,var(--gold),var(--gold-l)); border-radius:3px; transition:width .4s; }
.ws-stat-fill.story { background:linear-gradient(90deg,var(--rust),#c4622a); }
.ws-stat-hint { font-size:.65rem; color:#b0a090; }

/* ── Editor ── */
.essay-workspace,
.story-workspace,
.image-workspace,
.crossense-workspace { display:grid; gap:1.5rem; }
.essay-workspace,
.story-workspace      { grid-template-columns:280px 1fr; }
.image-workspace      { grid-template-columns:1fr 1fr; }
.crossense-workspace  { grid-template-columns:1fr 1fr; }
@media(max-width:900px) {
  .essay-workspace,.story-workspace,.image-workspace,.crossense-workspace { grid-template-columns:1fr; }
}

.editor-toolbar { display:flex; align-items:center; gap:.3rem; padding:.5rem .75rem; background:var(--dark); border-radius:2px 2px 0 0; flex-wrap:wrap; }
.et-btn { background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.12); border-radius:1px; color:rgba(255,255,255,.65); font-size:.8rem; padding:.25rem .55rem; cursor:pointer; transition:all .18s; font-family:'Source Serif 4',serif; min-width:28px; height:26px; display:flex; align-items:center; justify-content:center; }
.et-btn:hover { background:rgba(196,146,42,.2); border-color:var(--gold); color:var(--gold-l); }
.et-btn.danger:hover { background:rgba(139,58,30,.2); border-color:var(--rust); color:#ef9a9a; }
.et-sep   { width:1px; height:18px; background:rgba(255,255,255,.12); margin:0 .15rem; }
.et-label { font-size:.65rem; color:rgba(255,255,255,.3); white-space:nowrap; }

.editor-area { flex:1; }
.essay-editor {
  width:100%; min-height:320px; border:1.5px solid var(--border);
  border-top:none; border-radius:0 0 3px 3px;
  padding:1.25rem; font-family:'Source Serif 4',Georgia,serif;
  font-size:.95rem; color:var(--ink); line-height:1.85;
  background:#fff; resize:vertical; outline:none;
  transition:border-color .22s;
}
.essay-editor:focus { border-color:var(--gold); }
.essay-editor::placeholder { color:#b0a090; font-style:italic; }
.story-editor { min-height:380px; }
.cs-editor    { min-height:180px; }

.editor-bottom { display:flex; align-items:center; gap:.6rem; margin-top:.75rem; flex-wrap:wrap; }
.eb-btn { display:inline-flex; align-items:center; gap:.4rem; border-radius:2px; font-family:'Source Serif 4',serif; font-size:.8rem; font-weight:600; padding:.48rem 1rem; cursor:pointer; border:none; transition:all .2s; }
.eb-btn.save   { background:var(--dark); color:var(--gold-l); border:1px solid rgba(196,146,42,.3); }
.eb-btn.save:hover { background:var(--gold); color:#fff; }
.eb-btn.submit { background:var(--gold); color:#fff; }
.eb-btn.submit:hover:not(:disabled) { background:var(--gold-l); }
.eb-btn.submit:disabled { opacity:.35; cursor:not-allowed; }
.eb-btn.hint   { background:transparent; color:#7a6a52; border:1.5px solid var(--border); }
.eb-btn.hint:hover { border-color:var(--gold); color:var(--gold); }

.hint-box { display:flex; gap:.65rem; align-items:flex-start; background:rgba(196,146,42,.07); border:1px solid rgba(196,146,42,.22); border-radius:2px; padding:.85rem 1rem; margin-top:.5rem; }
.hint-box i { color:var(--gold); font-size:.95rem; flex-shrink:0; margin-top:.1rem; }
.hint-box p { font-size:.82rem; color:var(--ink); line-height:1.6; margin:0; }
.hint-slide-enter-active,.hint-slide-leave-active { transition:all .3s; }
.hint-slide-enter-from,.hint-slide-leave-to { opacity:0; transform:translateY(-8px); }

/* ── Story elements ── */
.story-card { border-left-color:var(--rust); }
.story-elements { margin-top:.75rem; border-top:1px solid var(--border); padding-top:.75rem; }
.se-head  { font-size:.68rem; font-weight:700; color:#9a8a72; margin:0 0 .5rem; text-transform:uppercase; letter-spacing:.08em; }
.se-chips { display:flex; flex-wrap:wrap; gap:.4rem; }
.se-chip  { display:inline-flex; align-items:center; gap:.3rem; font-size:.72rem; background:#f5ede0; border:1px solid var(--border); color:#7a6a52; padding:.22rem .6rem; border-radius:10px; transition:all .25s; }
.se-chip.used { background:rgba(58,92,58,.1); border-color:var(--sage); color:var(--sage); }
.se-done  { font-size:.65rem; color:var(--sage); }

/* ── Image ── */
.image-display { position:relative; border-radius:3px; overflow:hidden; margin-bottom:1rem; }
.task-image    { width:100%; height:280px; object-fit:cover; display:block; }
.image-overlay { position:absolute; bottom:0; left:0; right:0; background:linear-gradient(to top,rgba(26,18,8,.7),transparent); padding:.75rem; }
.image-label   { font-size:.72rem; color:rgba(255,255,255,.7); font-style:italic; }
.image-questions { background:#fff; border:1px solid var(--border); border-radius:3px; padding:.85rem 1rem; }
.iq-list  { list-style:none; margin:.5rem 0 0; padding:0; display:flex; flex-direction:column; gap:.3rem; }
.iq-list li { display:flex; align-items:center; gap:.45rem; font-size:.78rem; color:#5a4a35; cursor:pointer; padding:.28rem .35rem; border-radius:2px; transition:background .15s; }
.iq-list li:hover { background:#fdf8f0; color:var(--gold); }
.iq-list li i { font-size:.65rem; color:var(--gold); }
.iq-hint { font-size:.65rem; color:#b0a090; margin:.5rem 0 0; font-style:italic; }

/* ── Crossense ── */
.crossense-grid {
  display:grid; grid-template-columns:repeat(3,1fr); gap:6px;
  margin-bottom:1rem;
}
.cs-cell {
  aspect-ratio:1; border:1.5px solid var(--border); border-radius:3px;
  cursor:pointer; position:relative; overflow:hidden; background:#fff;
  transition:all .25s;
}
.cs-cell:hover { border-color:var(--gold); box-shadow:0 0 0 2px rgba(196,146,42,.15); }
.cs-cell.active { border-color:var(--gold); box-shadow:0 0 0 3px rgba(196,146,42,.2); }
.cs-cell.center { border-color:var(--gold); border-width:2px; background:rgba(196,146,42,.04); }
.cs-cell.filled { background:#fdf8f0; }

.cs-cell-inner { width:100%; height:100%; display:flex; align-items:center; justify-content:center; padding:.35rem; }
.cs-img  { width:100%; height:100%; object-fit:cover; border-radius:2px; }
.cs-text { font-size:.7rem; font-weight:600; color:var(--ink); text-align:center; line-height:1.3; word-break:break-word; }

.cs-cell-empty { width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:.2rem; color:#d9cdb8; }
.cs-cell-empty i { font-size:.85rem; }
.cs-cell-empty span { font-size:.6rem; font-weight:600; }
.cs-cell.center .cs-cell-empty { color:rgba(196,146,42,.4); }

/* Connection lines */
.cs-conn-right,.cs-conn-bottom { position:absolute; background:rgba(196,146,42,.35); pointer-events:none; }
.cs-conn-right  { right:-3px; top:50%; transform:translateY(-50%); width:6px; height:2px; }
.cs-conn-bottom { bottom:-3px; left:50%; transform:translateX(-50%); width:2px; height:6px; }

.cs-legend { display:flex; gap:1rem; font-size:.68rem; color:#9a8a72; margin-bottom:.5rem; flex-wrap:wrap; }
.cs-leg-item { display:flex; align-items:center; gap:.4rem; }
.cs-arr      { display:inline-block; width:20px; height:2px; background:var(--gold); position:relative; }
.cs-arr::after { content:'▶'; position:absolute; right:-6px; top:-5px; font-size:.5rem; color:var(--gold); }
.cs-center-dot { display:inline-block; width:10px; height:10px; border-radius:2px; border:2px solid var(--gold); }

/* Cell editor */
.cell-editor { background:#fff; border:1px solid var(--border); border-radius:3px; padding:1rem; margin-bottom:1rem; }
.ce-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:.75rem; }
.ce-title  { font-size:.75rem; font-weight:700; color:var(--ink); }
.ce-clear  { background:none; border:none; color:#b0a090; cursor:pointer; font-size:.8rem; padding:0; transition:color .18s; }
.ce-clear:hover { color:var(--rust); }
.ce-input  { width:100%; border:1.5px solid var(--border); border-radius:2px; padding:.45rem .65rem; font-family:'Source Serif 4',serif; font-size:.82rem; color:var(--ink); outline:none; transition:border-color .2s; margin-bottom:.5rem; background:#fdf9f4; }
.ce-input:focus { border-color:var(--gold); }
.ce-input::placeholder { color:#b0a090; font-style:italic; }
.ce-or { font-size:.68rem; color:#b0a090; margin:.35rem 0 .35rem; font-style:italic; }
.ce-preview { margin-top:.5rem; border-radius:2px; overflow:hidden; }
.ce-preview-img { width:100%; max-height:100px; object-fit:cover; }
.ce-connection { margin-top:.65rem; border-top:1px solid var(--border); padding-top:.65rem; }
.ce-conn-head { font-size:.68rem; color:#9a8a72; margin:0 0 .35rem; }

.cell-editor-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:.5rem; background:#fff; border:1px solid var(--border); border-radius:3px; padding:2rem; margin-bottom:1rem; color:#b0a090; }
.cell-editor-empty i { font-size:1.5rem; }
.cell-editor-empty p { font-size:.8rem; font-style:italic; margin:0; }

.cs-description { background:#fff; border:1px solid var(--border); border-radius:3px; padding:1rem; }

/* ── Success overlay ── */
.submit-success { position:fixed; inset:0; z-index:500; background:rgba(19,14,7,.75); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; padding:1rem; }
.success-pop-enter-active,.success-pop-leave-active { transition:opacity .35s,transform .35s; }
.success-pop-enter-from,.success-pop-leave-to { opacity:0; transform:scale(.9); }

.ss-card { background:var(--parch); border:1px solid var(--border); border-top:4px solid var(--sage); border-radius:4px; padding:2.5rem; max-width:420px; width:100%; display:flex; flex-direction:column; align-items:center; gap:1.25rem; box-shadow:var(--shd-lg); text-align:center; }
.ss-icon { width:64px; height:64px; border-radius:50%; background:rgba(58,92,58,.12); display:flex; align-items:center; justify-content:center; }
.ss-icon i { font-size:1.75rem; color:var(--sage); }
.ss-title  { font-family:'Playfair Display',serif; font-size:1.4rem; font-weight:900; color:var(--ink); margin:0; }
.ss-sub    { font-size:.85rem; color:#7a6a52; font-style:italic; margin:0; }
.ss-stats  { display:flex; gap:1.5rem; font-size:.78rem; color:#9a8a72; }
.ss-stats i { color:var(--gold); margin-right:.25rem; }
.ss-actions { display:flex; gap:.65rem; flex-wrap:wrap; justify-content:center; }

.ra-btn { display:inline-flex; align-items:center; gap:.45rem; border-radius:2px; font-family:'Source Serif 4',serif; font-size:.82rem; font-weight:700; padding:.58rem 1.25rem; cursor:pointer; border:none; transition:all .22s; }
.ra-btn.primary   { background:var(--gold); color:#fff; }
.ra-btn.primary:hover { background:var(--gold-l); }
.ra-btn.secondary { background:var(--sage); color:#fff; }
.ra-btn.secondary:hover { background:#4a7a4a; }
.ra-btn.ghost     { background:transparent; border:1.5px solid var(--border); color:var(--ink); }
.ra-btn.ghost:hover { border-color:var(--gold); color:var(--gold); }
</style>