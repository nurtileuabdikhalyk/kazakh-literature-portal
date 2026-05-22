<template>
  <div class="teacher-cabinet">

    <!-- ══ SIDEBAR ══════════════════════════════════════ -->
    <aside class="tc-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <div class="sb-avatar">{{ currentUser?.name?.[0] || 'М' }}</div>
        <div v-if="!sidebarCollapsed" class="sb-info">
          <span class="sb-name">{{ currentUser?.name }}</span>
          <span class="sb-role">Мұғалім</span>
        </div>
        <button class="sb-collapse-btn" @click="sidebarCollapsed = !sidebarCollapsed">
          <i :class="sidebarCollapsed ? 'pi pi-chevron-right' : 'pi pi-chevron-left'"/>
        </button>
      </div>

      <nav class="sb-nav">
        <button
            v-for="item in navItems" :key="item.key"
            class="sb-nav-item" :class="{ active: activeSection === item.key }"
            @click="activeSection = item.key"
            :title="item.label"
        >
          <i :class="'pi ' + item.icon"/>
          <span v-if="!sidebarCollapsed">{{ item.label }}</span>
          <span v-if="!sidebarCollapsed && item.badge" class="nav-badge">{{ item.badge }}</span>
        </button>
      </nav>

      <div class="sb-footer">
        <button class="sb-logout" @click="doLogout" :title="'Шығу'">
          <i class="pi pi-sign-out"/>
          <span v-if="!sidebarCollapsed">Шығу</span>
        </button>
      </div>
    </aside>

    <!-- ══ MAIN ══════════════════════════════════════════ -->
    <main class="tc-main">

      <!-- Top bar -->
      <div class="tc-topbar">
        <div class="tb-left">
          <h1 class="tb-title">{{ currentNavItem?.label }}</h1>
          <span class="tb-sub">{{ currentUser?.school }}</span>
        </div>
        <div class="tb-right">
          <span class="tb-date">{{ today }}</span>
          <div class="tb-avatar">{{ currentUser?.name?.[0] || 'М' }}</div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="tc-loading">
        <div class="tc-spinner"/>
        <p>Деректер жүктелуде…</p>
      </div>

      <template v-else>

        <!-- ──────────────────────────────────────────── -->
        <!-- SECTION: DASHBOARD (Статистика)             -->
        <!-- ──────────────────────────────────────────── -->
        <div v-if="activeSection === 'dashboard'" class="section-wrap">

          <!-- Stat cards -->
          <div class="stat-cards">
            <div class="stat-card" v-for="s in dashStats" :key="s.label">
              <div class="sc-icon" :style="{ background: s.bg, color: s.color }">
                <i :class="'pi ' + s.icon"/>
              </div>
              <div>
                <span class="sc-val">{{ s.val }}</span>
                <span class="sc-label">{{ s.label }}</span>
              </div>
            </div>
          </div>

          <!-- Recent results table -->
          <div class="section-card">
            <div class="sc-head">
              <span><i class="pi pi-list"/> Соңғы нәтижелер</span>
            </div>
            <div class="results-table-wrap">
              <table class="results-table">
                <thead>
                <tr>
                  <th>Оқушы</th><th>Сынып</th><th>Тапсырма</th>
                  <th>Балл</th><th>Деңгей</th><th>Күн</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="r in storeResults.slice(0,8)" :key="r.id">
                  <td class="rt-name">{{ r.student_name }}</td>
                  <td>{{ r.class }}</td>
                  <td class="rt-task">{{ r.quiz_topic }}</td>
                  <td>
                    <span class="pct-badge" :class="pctClass(r.pct)">{{ r.pct }}%</span>
                  </td>
                  <td><span class="grade-chip" :class="gradeClass(r.grade)">{{ r.grade }}</span></td>
                  <td class="rt-date">
                    {{ r.created_at ? new Date(r.created_at).toLocaleDateString('kk-KZ') : '—' }}
                  </td>
                </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ──────────────────────────────────────────── -->
        <!-- SECTION: САБАҚТАР (localStorage + store)  -->
        <!-- ──────────────────────────────────────────── -->
        <div v-else-if="activeSection === 'lessons'" class="section-wrap">

          <!-- Toolbar -->
          <div class="lessons-toolbar">
            <!-- Search -->
            <div class="lt-search">
              <i class="pi pi-search"/>
              <input v-model="lessonsSearch" class="lt-input" placeholder="Іздеу…"/>
              <button v-if="lessonsSearch" class="lt-clear" @click="lessonsSearch = ''">
                <i class="pi pi-times"/>
              </button>
            </div>
            <!-- Type filter -->
            <div class="lt-types">
              <button
                  v-for="t in [{ val:'all', label:'Барлығы' }, ...LESSON_TYPES]"
                  :key="t.val"
                  class="lt-type-btn"
                  :class="[t.val, { active: lessonsFilter === t.val }]"
                  @click="lessonsFilter = t.val"
              >{{ t.label }}</button>
            </div>
            <!-- Actions -->
            <div class="lt-actions">
              <button class="btn-gold" @click="$router.push({ name: 'add-lesson' })">
                <i class="pi pi-plus"/> Сабақ қосу
              </button>
              <button class="btn-excel" @click="storeExportToExcel" title="Барлығын Excel-ге жүктеу">
                <i class="pi pi-file-excel"/> Excel
              </button>
              <button class="btn-reload" @click="storeReload" :disabled="storeLoading" title="Supabase-тен қайта жүктеу">
                <i class="pi pi-refresh" :class="{ spinning: storeLoading }"/>
              </button>
            </div>
          </div>

          <!-- Stats chips -->
          <div class="store-stats-row">
            <span class="ssr-item total">
              <i class="pi pi-database"/> Барлығы: <strong>{{ storeStats.total }}</strong>
              <span class="ssr-item" style="color:#3ecf8e">
                <i class="pi pi-database"/> Supabase · lessons
              </span>            </span>
            <span class="ssr-item video"><i class="pi pi-play-circle"/> {{ storeStats.video }} видео</span>
            <span class="ssr-item pdf"><i class="pi pi-file-pdf"/> {{ storeStats.pdf }} PDF</span>

          </div>

          <!-- Loading -->
          <div v-if="storeLoading" class="store-loading">
            <div class="tc-spinner"/> Supabase-тен жүктелуде…
          </div>

          <!-- Grid -->
          <div v-else class="lessons-grid">
            <transition-group name="lesson-card-fade" tag="div" class="lg-inner">
              <div
                  v-for="lesson in filteredStoreLessons"
                  :key="lesson.id"
                  class="lesson-manage-card"
              >
                <!-- Мұқаба сурет -->
                <div class="lmc-cover" :class="lesson.type">
                  <img
                      v-if="lesson.cover"
                      :src="lesson.cover"
                      :alt="lesson.title"
                      class="lmc-cover-img"
                  />
                  <div v-else class="lmc-cover-placeholder">
                    <i :class="'pi ' + typeIcon(lesson.type)"/>
                  </div>
                </div>

                <!-- Тип badge -->
                <div class="lmc-type-row">
                  <span class="lmc-type-badge" :class="lesson.type">
                    <i :class="'pi ' + typeIcon(lesson.type)"/>
                    {{ { video:'Видео', pdf:'PDF' }[lesson.type] }}
                  </span>
                </div>

                <!-- Body -->
                <div class="lmc-body">
                  <!-- Тақырып + деңгей -->
                  <div class="lmc-top">
                    <span class="lmc-topic">{{ lesson.topic }}</span>
                    <span class="lmc-level" :class="lvClass(lesson.level)">
                      {{ lesson.level }}
                    </span>
                  </div>

                  <!-- Автор (үлкен, сілтеме тәрізді) -->
                  <p class="lmc-author">{{ lesson.author }}</p>

                  <!-- Атауы -->
                  <h3 class="lmc-title">{{ lesson.title }}</h3>

                  <!-- Сипаттама -->
                  <p v-if="lesson.description" class="lmc-desc">
                    {{ lesson.description }}
                  </p>

                  <!-- Мета -->
                  <div class="lmc-meta">
                    <span v-if="lesson.author">
                      <i class="pi pi-user"/> {{ lesson.author }}
                    </span>
                    <span v-if="lesson.duration">
                      <i class="pi pi-clock"/> {{ lesson.duration }}
                    </span>
                  </div>
                </div>

                <!-- Батырмалар -->
                <div class="lmc-actions">
                  <button class="lmc-btn edit"
                          @click="$router.push({ name: 'add-lesson', query: { id: lesson.id } })">
                    <i class="pi pi-pencil"/> Өзгерту
                  </button>
                  <button class="lmc-btn delete" @click="confirmDelete(lesson)">
                    <i class="pi pi-trash"/> Өшіру
                  </button>
                </div>
              </div>
            </transition-group>

            <!-- Қосу карточкасы -->
            <div class="lesson-add-card" @click="$router.push({ name: 'add-lesson' })">
              <i class="pi pi-plus"/>
              <span>Жаңа сабақ қосу</span>
            </div>
          </div>

          <!-- Empty state -->
          <div v-if="!storeLoading && !filteredStoreLessons.length" class="empty-state">
            <i class="pi pi-book"/>
            <p>Сабақ табылмады</p>
            <button class="btn-gold" @click="storeReload">
              <i class="pi pi-refresh"/> Supabase-тен жаңарту
            </button>
          </div>

        </div><!-- /lessons section -->

        <!-- ──────────────────────────────────────────── -->
        <!-- SECTION: АУДИО                              -->
        <!-- ──────────────────────────────────────────── -->
        <div v-else-if="activeSection === 'audio'" class="section-wrap">

          <!-- Toolbar -->
          <div class="lessons-toolbar">
            <div class="lt-search">
              <i class="pi pi-search"/>
              <input v-model="audioSearch" class="lt-input" placeholder="Трек іздеу…"/>
              <button v-if="audioSearch" class="lt-clear" @click="audioSearch=''">
                <i class="pi pi-times"/>
              </button>
            </div>
            <div class="lt-actions">
              <button class="btn-gold" @click="$router.push({ name:'add-audio' })">
                <i class="pi pi-plus"/> Трек қосу
              </button>
              <button class="btn-reload" @click="audioInit(true)" :disabled="audioLoading"
                      title="Supabase-тен жаңарту">
                <i class="pi pi-refresh" :class="{ spinning: audioLoading }"/>
              </button>
            </div>
          </div>

          <!-- Stats -->
          <div class="store-stats-row">
            <span class="ssr-item total">
              <i class="pi pi-database"/> Барлығы: <strong>{{ audioStats.total }}</strong>
              <span class="ssr-item" style="color:#3ecf8e">
                <i class="pi pi-database"/> Supabase · audio_tracks
              </span>
            </span>
          </div>

          <!-- Loading -->
          <div v-if="audioLoading" class="store-loading">
            <div class="tc-spinner"/> Supabase-тен жүктелуде…
          </div>

          <!-- Audio tracks grid -->
          <div v-else class="lessons-grid">
            <transition-group name="lesson-card-fade" tag="div" class="lg-inner">
              <div
                  v-for="track in filteredAudioTracks"
                  :key="track.id"
                  class="lesson-manage-card"
              >
                <!-- Мұқаба -->
                <div class="lmc-cover">
                  <img v-if="track.cover" :src="track.cover" :alt="track.title" class="lmc-cover-img"/>
                  <div v-else class="lmc-cover-placeholder">
                    <i class="pi pi-headphones"/>
                  </div>
                </div>

                <!-- Тип -->
                <div class="lmc-type-row">
                  <span class="lmc-type-badge" style="color:#c4922a">
                    <i class="pi pi-headphones"/>
                    {{ track.genre || 'Аудио' }}
                  </span>
                </div>

                <!-- Body -->
                <div class="lmc-body">
                  <div class="lmc-top">
                    <span class="lmc-topic">{{ track.author }}</span>
                    <span v-if="track.bookmarked" style="color:var(--gold); font-size:.72rem">
                      <i class="pi pi-bookmark-fill"/>
                    </span>
                  </div>
                  <h3 class="lmc-title">{{ track.title }}</h3>
                  <div class="lmc-meta">
                    <span v-if="track.duration"><i class="pi pi-clock"/> {{ track.duration }}</span>
                    <span><i class="pi pi-align-left"/> {{ track.lines?.length || 0 }} жол</span>
                    <span v-if="track.fileUrl" class="audio-url-badge">
                      <i class="pi pi-volume-up"/> {{ track.fileUrl.split('/').pop() }}
                    </span>
                  </div>
                </div>

                <!-- Батырмалар -->
                <div class="lmc-actions">
                  <button class="lmc-btn edit"
                          @click="$router.push({ name:'add-audio', query:{ id: track.id } })">
                    <i class="pi pi-pencil"/> Өзгерту
                  </button>
                  <button class="lmc-btn delete" @click="confirmAudioDelete(track)">
                    <i class="pi pi-trash"/> Өшіру
                  </button>
                </div>
              </div>
            </transition-group>

            <!-- Қосу карточкасы -->
            <div class="lesson-add-card" @click="$router.push({ name:'add-audio' })">
              <i class="pi pi-plus"/>
              <span>Жаңа трек қосу</span>
            </div>
          </div>

          <!-- Empty -->
          <div v-if="!audioLoading && !filteredAudioTracks.length" class="empty-state">
            <i class="pi pi-headphones"/>
            <p>Трек табылмады</p>
            <button class="btn-gold" @click="audioInit(true)">
              <i class="pi pi-refresh"/> Жаңарту
            </button>
          </div>

        </div><!-- /audio section -->

        <!-- ──────────────────────────────────────────── -->
        <!-- SECTION: ТЕСТТЕР                           -->
        <!-- ──────────────────────────────────────────── -->
        <div v-else-if="activeSection === 'tests'" class="section-wrap">

          <!-- Toolbar -->
          <div class="ts-toolbar">
            <div class="lt-search">
              <i class="pi pi-search"/>
              <input v-model="tasksSearch" class="lt-input" placeholder="Тапсырма іздеу…"/>
              <button v-if="tasksSearch" class="lt-clear" @click="tasksSearch = ''">
                <i class="pi pi-times"/>
              </button>
            </div>
            <div class="ts-type-tabs">
              <button
                  v-for="t in taskTypeTabs" :key="t.val"
                  class="ts-tab" :class="[t.key, { active: tasksFilter === t.val }]"
                  @click="tasksFilter = t.val"
              >
                <i :class="'pi ' + taskTypeIcon(t.val)"/>
                {{ t.label }}
                <span class="ts-tab-cnt">
                  {{ t.val === 'all' ? tasksStats.total : tasksStats[t.key] || 0 }}
                </span>
              </button>
            </div>
            <div class="lt-actions">
              <button class="btn-gold" @click="$router.push({ name: 'add-task' })">
                <i class="pi pi-plus"/> Тапсырма қосу
              </button>
              <button class="btn-reload" @click="tasksInit(true)" :disabled="tasksLoading"
                      title="Supabase-тен жаңарту">
                <i class="pi pi-refresh" :class="{ spinning: tasksLoading }"/>
              </button>
            </div>
          </div>

          <!-- Stats strip -->
          <div class="ts-stats-strip">
            <div class="tss-item">
              <span class="tss-val">{{ tasksStats.total }}</span>
              <span class="tss-lbl">Барлығы</span>
            </div>
            <div class="tss-sep"/>
            <div class="tss-item tss-mcq">
              <i class="pi pi-list-check"/> <span>{{ tasksStats.mcq }}</span> MCQ
            </div>
            <div class="tss-item tss-tf">
              <i class="pi pi-check-square"/> <span>{{ tasksStats.tf }}</span> Д/Б
            </div>
            <div class="tss-item tss-fill">
              <i class="pi pi-pencil"/> <span>{{ tasksStats.fill }}</span> Бос орын
            </div>
            <div class="tss-item tss-match">
              <i class="pi pi-arrows-h"/> <span>{{ tasksStats.match }}</span> Сәйкест.
            </div>
            <span class="tss-src">
              <i class="pi pi-database" style="color:#3ecf8e"/> Supabase
            </span>
          </div>

          <!-- Loading -->
          <div v-if="tasksLoading" class="store-loading">
            <div class="tc-spinner"/> Supabase-тен жүктелуде…
          </div>

          <!-- Tasks grid -->
          <div v-else class="task-cards-grid">
            <div
                v-for="task in filteredTasks" :key="task.id"
                class="task-card" :class="`tc-${taskTypeKey(task.type)}`"
            >
              <!-- Тип stripe -->
              <div class="tc-stripe"/>

              <!-- Карточка header -->
              <div class="tc-head">
                <span class="tc-type-badge" :class="`tcb-${taskTypeKey(task.type)}`">
                  <i :class="'pi ' + taskTypeIcon(task.type)"/>
                  {{ taskTypeLabel(task.type) }}
                </span>
                <span class="tc-level" :class="lvClass(task.level)">{{ task.level }}</span>
              </div>

              <!-- Сұрақ мәтіні -->
              <p class="tc-text">
                {{ task.type !== 'match' ? task.text : task.title }}
              </p>

              <!-- Тип preview -->
              <div class="tc-preview">
                <template v-if="task.type === 'mcq'">
                  <div class="tcp-opts">
                    <span v-for="(opt,i) in [task.optionA,task.optionB,task.optionC,task.optionD].filter(Boolean).slice(0,4)"
                          :key="i" class="tcp-opt" :class="{ correct: task.answer === i+1 }">
                      <span class="tcp-ltr">{{ String.fromCharCode(65+i) }}</span>
                      {{ opt }}
                      <i v-if="task.answer === i+1" class="pi pi-check-circle tcp-ok"/>
                    </span>
                  </div>
                </template>
                <template v-else-if="task.type === 'truefalse'">
                  <div class="tcp-tf">
                    <span class="tcp-tf-opt" :class="{ 'tf-selected': task.answer === true }">
                      <i class="pi pi-check"/> Дұрыс
                    </span>
                    <span class="tcp-tf-opt" :class="{ 'tf-selected': task.answer === false }">
                      <i class="pi pi-times"/> Бұрыс
                    </span>
                  </div>
                </template>
                <template v-else-if="task.type === 'fillblank'">
                  <div class="tcp-fill">
                    <i class="pi pi-pencil"/>
                    Жауап: <strong>{{ task.answers?.join(' / ') }}</strong>
                  </div>
                </template>
                <template v-else-if="task.type === 'match'">
                  <div class="tcp-match">
                    <div v-for="(p,i) in (task.pairs || []).slice(0,3)" :key="i" class="tcp-pair">
                      <span class="tcp-left">{{ p.left }}</span>
                      <i class="pi pi-arrow-right"/>
                      <span class="tcp-right">{{ p.right }}</span>
                    </div>
                    <span v-if="(task.pairs||[]).length > 3" class="tcp-more">
                      +{{ task.pairs.length - 3 }} жұп
                    </span>
                  </div>
                </template>
              </div>

              <!-- Footer -->
              <div class="tc-footer">
                <span class="tc-topic">
                  <i class="pi pi-tag"/> {{ task.topic }}
                </span>
                <div class="tc-actions">
                  <button class="tc-btn tc-edit"
                          @click="$router.push({ name:'add-task', query:{ id: task.id } })">
                    <i class="pi pi-pencil"/>
                  </button>
                  <button class="tc-btn tc-del" @click="confirmTaskDelete(task)">
                    <i class="pi pi-trash"/>
                  </button>
                </div>
              </div>
            </div>

            <!-- Қосу карточкасы -->
            <div class="task-add-card" @click="$router.push({ name: 'add-task' })">
              <i class="pi pi-plus"/>
              <span>Жаңа тапсырма</span>
            </div>
          </div>

          <div v-if="!tasksLoading && !filteredTasks.length" class="empty-state">
            <i class="pi pi-list-check"/>
            <p>Тапсырма табылмады</p>
            <button class="btn-gold" @click="tasksInit(true)">
              <i class="pi pi-refresh"/> Суpabase-тен жаңарту
            </button>
          </div>

        </div><!-- end tests section -->

        <!-- ──────────────────────────────────────────── -->
        <!-- SECTION: НӘТИЖЕЛЕР (useResultsStore)       -->
        <!-- ──────────────────────────────────────────── -->
        <div v-else-if="activeSection === 'results'" class="section-wrap">

          <!-- Stats cards -->
          <div class="results-stats-row">
            <div class="rsr-card">
              <span class="rsr-val">{{ storeResults.length }}</span>
              <span class="rsr-lbl">Барлық нәтиже</span>
            </div>
            <div class="rsr-card">
              <span class="rsr-val" style="color:var(--sage)">
                {{ resultsStats.avg }}%
              </span>
              <span class="rsr-lbl">Орташа балл</span>
            </div>
            <div class="rsr-card" v-for="(cnt, grade) in resultsStats.grades" :key="grade">
              <span class="rsr-val">{{ cnt }}</span>
              <span class="rsr-lbl">{{ grade }}</span>
            </div>
          </div>

          <!-- Filter toolbar -->
          <div class="filter-row">
            <div class="fr-search">
              <i class="pi pi-search"/>
              <input v-model="resultsSearch" type="text"
                     placeholder="Оқушы немесе тапсырма іздеу…" class="fr-input"/>
              <button v-if="resultsSearch" class="fr-clear" @click="resultsSearch = ''">
                <i class="pi pi-times"/>
              </button>
            </div>
            <select v-model="resultsClass" class="fr-select">
              <option value="">Барлық сынып</option>
              <option>8А</option><option>8Ә</option><option>8Б</option>
            </select>
            <button class="btn-reload-results" @click="resultsInit()" title="Жаңарту">
              <i class="pi pi-refresh" :class="{ spinning: resultsLoading }"/>
              Жаңарту
            </button>
          </div>

          <!-- Table -->
          <div class="section-card">
            <div class="sc-head">
              <span>
                <i class="pi pi-list"/> Нәтижелер
                <span class="sc-count">({{ filteredResults.length }})</span>
              </span>
              <div class="sc-head-actions">
                <span class="sc-source-badge">
                  <i class="pi pi-database"/> Supabase · results
                </span>
                <button class="sc-export" @click="exportResults">
                  <i class="pi pi-file-excel"/> Excel-ге жүктеу
                </button>
              </div>
            </div>

            <!-- Loading / Error state -->
            <div v-if="resultsLoading" class="results-loading">
              <div class="tc-spinner"/> Supabase-тен жүктелуде…
            </div>
            <div v-else-if="resultsError" class="results-loading" style="color:#8b3a1e">
              <i class="pi pi-exclamation-triangle"/> {{ resultsError }}
            </div>

            <div v-else-if="!resultsError" class="results-table-wrap">
              <table class="results-table">
                <thead>
                <tr>
                  <th @click="sortBy('studentName')" class="sortable">
                    Оқушы <i class="pi pi-sort-alt"/>
                  </th>
                  <th>Сынып</th>
                  <th>Тапсырма</th>
                  <th @click="sortBy('pct')" class="sortable">
                    Балл % <i class="pi pi-sort-alt"/>
                  </th>
                  <th>Деңгей</th>
                  <th @click="sortBy('date')" class="sortable">
                    Күн <i class="pi pi-sort-alt"/>
                  </th>
                  <th></th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="r in filteredResults" :key="r.id">
                  <td class="rt-name">{{ r.student_name }}</td>
                  <td><span class="class-tag">{{ r.class }}</span></td>
                  <td class="rt-task">{{ r.quiz_topic }}</td>
                  <td>
                    <div class="pct-bar-wrap">
                      <div class="pct-bar"
                           :style="{ width: r.pct+'%', background: pctColor(r.pct) }"/>
                      <span class="pct-num">{{ r.pct }}%</span>
                    </div>
                  </td>
                  <td>
                      <span class="grade-chip" :class="gradeClass(r.grade)">
                        {{ r.grade }}
                      </span>
                  </td>
                  <td class="rt-date">
                    {{ r.created_at ? new Date(r.created_at).toLocaleDateString('kk-KZ') : '—' }}
                  </td>
                  <td>
                    <button class="rt-del-btn" @click="confirmDeleteResult(r)" title="Өшіру">
                      <i class="pi pi-trash"/>
                    </button>
                  </td>
                </tr>
                <tr v-if="!filteredResults.length">
                  <td colspan="7" class="rt-empty">
                    <i class="pi pi-search"/> Нәтиже табылмады
                  </td>
                </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ──────────────────────────────────────────── -->
        <!-- SECTION: ПІКІРЛЕР                          -->
        <!-- ──────────────────────────────────────────── -->
        <div v-else-if="activeSection === 'comments'" class="section-wrap comments-wrap">

          <!-- Stats strip -->
<!--          <div class="cs-stats-strip">-->
<!--            <div class="css-item">-->
<!--              <span class="css-val">{{ commentsStats.total }}</span>-->
<!--              <span class="css-lbl">Барлық пікір</span>-->
<!--            </div>-->
<!--            <div class="css-sep"/>-->
<!--            <div class="css-item css-unread">-->
<!--              <i class="pi pi-reply"/>-->
<!--              <span>{{ commentsStats.unread }}</span>-->
<!--              <span class="css-lbl">Жауапсыз</span>-->
<!--            </div>-->
<!--            <div class="css-item css-replied">-->
<!--              <i class="pi pi-check-circle"/>-->
<!--              <span>{{ commentsStats.replied }}</span>-->
<!--              <span class="css-lbl">Жауап берілді</span>-->
<!--            </div>-->
<!--            <div class="css-item css-rating">-->
<!--              <i class="pi pi-star-fill"/>-->
<!--              <span>{{ commentsStats.avgRating || 0 }}</span>-->
<!--              <span class="css-lbl">Орт. рейтинг</span>-->
<!--            </div>-->
<!--            <span class="css-src">-->
<!--              <i class="pi pi-database" style="color:#3ecf8e"/> Supabase-->
<!--            </span>-->
<!--          </div>-->

          <!-- CommentsSection компоненті -->
          <div class="cs-embed">
            <CommentsSection/>
          </div>

        </div>

        <!-- ──────────────────────────────────────────── -->
        <!-- SECTION: ПРОФИЛЬ                           -->
        <!-- ──────────────────────────────────────────── -->
        <div v-else-if="activeSection === 'profile'" class="section-wrap">
          <div class="profile-grid">
            <div class="section-card profile-card">
              <div class="profile-hero">
                <div class="ph-avatar">{{ currentUser?.name?.[0] || 'М' }}</div>
                <div>
                  <h2 class="ph-name">{{ currentUser?.name }}</h2>
                  <span class="ph-role-badge teacher">Мұғалім</span>
                </div>
              </div>
              <div class="profile-rows">
                <div class="pr-row" v-for="(val,key) in teacherProfile" :key="key">
                  <span class="pr-key">{{ key }}</span>
                  <span class="pr-val">{{ val }}</span>
                </div>
                <div class="pr-row">
                  <span class="pr-key">Email / Логин</span>
                  <span class="pr-val">{{ currentUser?.login }}</span>
                </div>
                <div class="pr-row">
                  <span class="pr-key">Мектеп</span>
                  <span class="pr-val">{{ currentUser?.school }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </template>
    </main>
  </div>

  <!-- ══ AUDIO DELETE MODAL ══════════════════════════ -->
  <teleport to="body">
    <transition name="del-modal-fade">
      <div v-if="audioDeleteDialog.show" class="del-modal-overlay"
           @click.self="audioDeleteDialog.show = false">
        <div class="del-modal">
          <div class="del-modal-icon"><i class="pi pi-exclamation-triangle"/></div>
          <h3 class="del-modal-title">Тректі өшіру</h3>
          <p class="del-modal-body">
            <strong>«{{ audioDeleteDialog.track?.title }}»</strong><br/>
            тректі, оның жолдары мен сөздігімен өшіріледі.
          </p>
          <p class="del-modal-hint">
            <i class="pi pi-info-circle"/>
            Supabase-тен өшіріледі. Барлық құрылғыда жойылады.
          </p>
          <div class="del-modal-actions">
            <button class="del-btn-confirm" @click="doDeleteAudio">
              <i class="pi pi-trash"/> Өшіру
            </button>
            <button class="del-btn-cancel" @click="audioDeleteDialog.show = false">
              Бас тарту
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>

  <!-- ══ LESSON DELETE MODAL ══════════════════════════ -->
  <teleport to="body">
    <transition name="del-modal-fade">
      <div v-if="deleteDialog.show" class="del-modal-overlay"
           @click.self="deleteDialog.show = false">
        <div class="del-modal">
          <div class="del-modal-icon"><i class="pi pi-exclamation-triangle"/></div>
          <h3 class="del-modal-title">Сабақты өшіру</h3>
          <p class="del-modal-body">
            <strong>«{{ deleteDialog.lesson?.title }}»</strong><br/>
            сабағын өшіргіңіз келе ме?
          </p>
          <div class="del-modal-actions">
            <button class="del-btn-confirm" @click="doDelete">
              <i class="pi pi-trash"/> Өшіру
            </button>
            <button class="del-btn-cancel" @click="deleteDialog.show = false">
              Бас тарту
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>

  <!-- ══ TASK DELETE MODAL ════════════════════════════ -->
  <teleport to="body">
    <transition name="del-modal-fade">
      <div v-if="deleteTaskDialog.show" class="del-modal-overlay"
           @click.self="deleteTaskDialog.show = false">
        <div class="del-modal">
          <div class="del-modal-icon"><i class="pi pi-exclamation-triangle"/></div>
          <h3 class="del-modal-title">Тапсырманы өшіру</h3>
          <p class="del-modal-body">
            <strong>«{{ deleteTaskDialog.task?.text || deleteTaskDialog.task?.title }}»</strong><br/>
            тапсырмасын өшіргіңіз келе ме?
          </p>
          <div class="del-modal-actions">
            <button class="del-btn-confirm" @click="doTaskDelete">
              <i class="pi pi-trash"/> Өшіру
            </button>
            <button class="del-btn-cancel" @click="deleteTaskDialog.show = false">
              Бас тарту
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>

  <!-- ══ RESULT DELETE MODAL ══════════════════════════ -->
  <teleport to="body">
    <transition name="del-modal-fade">
      <div v-if="deleteResultDialog.show" class="del-modal-overlay"
           @click.self="deleteResultDialog.show = false">
        <div class="del-modal">
          <div class="del-modal-icon"><i class="pi pi-exclamation-triangle"/></div>
          <h3 class="del-modal-title">Нәтижені өшіру</h3>
          <p class="del-modal-body">
            <strong>{{ deleteResultDialog.result?.studentName }}</strong> —
            <em>{{ deleteResultDialog.result?.taskTitle }}</em><br/>
            нәтижесін өшіргіңіз келе ме?
          </p>
          <div class="del-modal-actions">
            <button class="del-btn-confirm" @click="doDeleteResult">
              <i class="pi pi-trash"/> Өшіру
            </button>
            <button class="del-btn-cancel" @click="deleteResultDialog.show = false">
              Бас тарту
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>

</template>

<script setup>
import {ref, computed, onMounted, reactive} from 'vue'
import {useRouter} from 'vue-router'
import {useAuth} from '@/composables/useAuth'
import {useLessonsStore} from '@/composables/useLessonsStore'
import {useTasksStore} from '@/composables/useTasksStore'
import {useCommentsStore} from '@/composables/useCommentsStore'
import {useQuizStore} from '@/composables/useQuizStore'
import {useAudioStore} from '@/composables/useAudioStore'
import CommentsSection from '@/components/CommentsSection.vue'
import Dialog from 'primevue/dialog'

const router = useRouter()
const {currentUser, logout, loadTeacherProfile} = useAuth()

// ── Audio store — Supabase ────────────────────────────
const {
  tracks: audioTracks,
  loading: audioLoading,
  stats: audioStats,
  init: audioInit,
  toggleBookmark: audioToggleBookmark,
} = useAudioStore()
const {
  lessons: storeLessons,
  loading: storeLoading,
  stats: storeStats,
  init: storeInit,
  reloadFromExcel: storeReload,
  deleteLesson: storeDelete,
} = useLessonsStore()

// ── Constants ─────────────────────────────────────────
const LESSON_TYPES = [
  {val: 'video', label: 'Видео', icon: 'pi-play-circle'},
  {val: 'pdf', label: 'PDF', icon: 'pi-file-pdf'},
]
const taskTypeTabs = [
  {val: 'all', key: 'all', label: 'Барлығы'},
  {val: 'mcq', key: 'mcq', label: 'MCQ тест'},
  {val: 'truefalse', key: 'tf', label: 'Дұрыс/Бұрыс'},
  {val: 'fillblank', key: 'fill', label: 'Бос орын'},
  {val: 'match', key: 'match', label: 'Сәйкестендіру'},
]

// ── Comments store ────────────────────────────────────
const commentsStore = useCommentsStore()
const {unreadCount: commentsUnread} = commentsStore

// ── Results — Supabase ────────────────────────────────
const {fetchResults} = useQuizStore()

const storeResults = ref([])
const resultsLoading = ref(false)
const resultsError = ref('')

async function resultsInit() {
  resultsLoading.value = true
  resultsError.value = ''
  try {
    storeResults.value = await fetchResults({limit: 500})
  } catch (e) {
    resultsError.value = e.message
  } finally {
    resultsLoading.value = false
  }
}

const resultsStats = computed(() => {
  const all = storeResults.value
  const avg = all.length
      ? Math.round(all.reduce((s, r) => s + (r.pct || 0), 0) / all.length)
      : 0
  return {
    total: all.length,
    avg,
    grades: {
      'Өте жақсы': all.filter(r => r.grade === 'Өте жақсы').length,
      'Жақсы': all.filter(r => r.grade === 'Жақсы').length,
      'Қанағат.': all.filter(r => r.grade === 'Қанағат.').length,
      'Қайталаңыз': all.filter(r => r.grade === 'Қайталаңыз').length,
    },
  }
})

async function resultsDelete(id) {
  const {supabase} = await import('@/composables/useSupabase')
  const {error} = await supabase.from('results').delete().eq('id', id)
  if (!error) storeResults.value = storeResults.value.filter(r => r.id !== id)
}

function resultsExport() {
  import('xlsx').then(XLSX => {
    const wb = XLSX.utils.book_new()
    const hdr = ['', 'Оқушы аты', 'Сынып', 'Тест тақырыбы', 'Деңгей', 'Дұрыс', 'Барлығы', '%', 'Деңгей', 'Күн']
    const rows = storeResults.value.map(r => [
      '', r.student_name, r.class, r.quiz_topic, r.quiz_level,
      r.correct, r.total, r.pct, r.grade,
      r.created_at ? new Date(r.created_at).toLocaleDateString('kk-KZ') : '',
    ])
    const ws = XLSX.utils.aoa_to_sheet([[], [], [], [], hdr, ...rows])
    ws['!cols'] = [{wch: 3}, {wch: 22}, {wch: 8}, {wch: 35}, {wch: 10}, {wch: 8}, {wch: 8}, {wch: 8}, {wch: 14}, {wch: 14}]
    XLSX.utils.book_append_sheet(wb, ws, '📊 Нәтижелер')
    XLSX.writeFile(wb, `Нәтижелер_${new Date().toLocaleDateString('kk-KZ')}.xlsx`)
  })
}

const {
  tasks: storeTasks,
  loading: tasksLoading,
  stats: tasksStats,
  init: tasksInit,
  deleteTask: tasksDelete
} = useTasksStore()

// ── State ─────────────────────────────────────────────
const loading = ref(true)
const sidebarCollapsed = ref(false)
const activeSection = ref('dashboard')
const teacherProfile = ref({})
const resultsSearch = ref('')
const resultsClass = ref('')
const replyTexts = reactive({})
const sortField = ref('date')
const sortDir = ref(-1)

// Lessons filter/search
const lessonsSearch = ref('')
const lessonsFilter = ref('all')

// Audio filter/search
const audioSearch = ref('')
const audioDeleteDialog = reactive({show: false, track: null})

// Tasks filter/search
const tasksSearch = ref('')
const tasksFilter = ref('all')

// Delete dialogs
const deleteDialog = reactive({show: false, lesson: null})
const deleteTaskDialog = reactive({show: false, task: null})
const deleteResultDialog = reactive({show: false, result: null})

const today = new Date().toLocaleDateString('kk-KZ', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})

// ── Nav items ─────────────────────────────────────────
const navItems = computed(() => [
  {key: 'dashboard', label: 'Басты бет', icon: 'pi-home'},
  {key: 'lessons', label: 'Сабақтар', icon: 'pi-book', badge: storeStats.value.total || null},
  {key: 'audio', label: 'Аудио', icon: 'pi-headphones', badge: audioStats.value.total || null},
  {key: 'tests', label: 'Тесттер', icon: 'pi-list-check'},
  {
    key: 'results', label: 'Нәтижелер', icon: 'pi-chart-bar', get badge() {
      return storeResults.value.length || null
    }
  },
  {key: 'comments', label: 'Пікірлер', icon: 'pi-comments', badge: commentsUnread.value || null},
  {key: 'profile', label: 'Профиль', icon: 'pi-user'},
])
const currentNavItem = computed(() => navItems.value.find(n => n.key === activeSection.value))

// ── Filtered lessons from store ───────────────────────
const filteredStoreLessons = computed(() => {
  let list = storeLessons.value
  if (lessonsFilter.value !== 'all') list = list.filter(l => l.type === lessonsFilter.value)
  if (lessonsSearch.value.trim()) {
    const q = lessonsSearch.value.toLowerCase()
    list = list.filter(l =>
        l.title.toLowerCase().includes(q) ||
        (l.topic || '').toLowerCase().includes(q) ||
        (l.author || '').toLowerCase().includes(q)
    )
  }
  return list
})

const filteredAudioTracks = computed(() => {
  let list = audioTracks.value
  if (audioSearch.value.trim()) {
    const q = audioSearch.value.toLowerCase()
    list = list.filter(t =>
        (t.title || '').toLowerCase().includes(q) ||
        (t.author || '').toLowerCase().includes(q) ||
        (t.genre || '').toLowerCase().includes(q)
    )
  }
  return list
})
onMounted(async () => {
  try {
    await storeInit()           // Supabase-тен lessons
    await tasksInit()           // Supabase-тен tasks
    await audioInit()           // Supabase-тен audio tracks
    await commentsStore.init()  // Supabase-тен comments
    await resultsInit()         // Supabase-тен results
    teacherProfile.value = await loadTeacherProfile(currentUser.value?.id)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})

// ── Filtered tasks from store ──────────────────────────
const filteredTasks = computed(() => {
  let list = storeTasks.value
  if (tasksFilter.value !== 'all') list = list.filter(t => t.type === tasksFilter.value)
  if (tasksSearch.value.trim()) {
    const q = tasksSearch.value.toLowerCase()
    list = list.filter(t =>
        (t.text || '').toLowerCase().includes(q) ||
        (t.title || '').toLowerCase().includes(q) ||
        (t.topic || '').toLowerCase().includes(q)
    )
  }
  return list
})

function taskTypeKey(type) {
  return {mcq: 'mcq', truefalse: 'tf', fillblank: 'fill', match: 'match'}[type] || ''
}

function taskTypeIcon(type) {
  return {
    mcq: 'pi-list-check',
    truefalse: 'pi-check-square',
    fillblank: 'pi-pencil',
    match: 'pi-arrows-h'
  }[type] || 'pi-question'
}

function taskTypeLabel(type) {
  return {mcq: 'MCQ', truefalse: 'Д/Б', fillblank: 'Бос орын', match: 'Сәйкест.'}[type] || type
}

function confirmTaskDelete(task) {
  deleteTaskDialog.task = task;
  deleteTaskDialog.show = true
}

async function doTaskDelete() {
  if (deleteTaskDialog.task) await tasksDelete(deleteTaskDialog.task.id)
  deleteTaskDialog.show = false;
  deleteTaskDialog.task = null
}

function confirmDelete(lesson) {
  deleteDialog.lesson = lesson
  deleteDialog.show = true
}

function confirmAudioDelete(track) {
  audioDeleteDialog.track = track
  audioDeleteDialog.show = true
}

async function doDeleteAudio() {
  if (!audioDeleteDialog.track) return
  const {supabase} = await import('@/composables/useSupabase')
  await supabase.from('audio_tracks').delete().eq('id', audioDeleteDialog.track.id)
  await audioInit(true)
  audioDeleteDialog.show = false
  audioDeleteDialog.track = null
}

// ── Dashboard stats ───────────────────────────────────
const dashStats = computed(() => {
  const avg = storeResults.value.length
      ? Math.round(storeResults.value.reduce((s, r) => s + r.pct, 0) / storeResults.value.length)
      : 0
  return [
    {
      label: 'Барлық нәтиже',
      val: storeResults.value.length,
      icon: 'pi-list',
      bg: 'rgba(196,146,42,.1)',
      color: '#c4922a'
    },
    {label: 'Орташа балл', val: avg + '%', icon: 'pi-chart-bar', bg: 'rgba(58,92,58,.1)', color: '#3a5c3a'},
    {label: 'Сабақтар саны', val: storeStats.value.total, icon: 'pi-book', bg: 'rgba(42,58,92,.1)', color: '#2a3a5c'},
    {
      label: 'Жауапсыз пікір',
      val: commentsUnread.value,
      icon: 'pi-comments',
      bg: 'rgba(139,58,30,.1)',
      color: '#8b3a1e'
    },
  ]
})

// ── Filtered results (store-дан) ──────────────────────
const filteredResults = computed(() => {
  let list = [...storeResults.value]
  if (resultsClass.value) list = list.filter(r => r.class === resultsClass.value)
  if (resultsSearch.value.trim()) {
    const q = resultsSearch.value.toLowerCase()
    list = list.filter(r =>
        (r.student_name || '').toLowerCase().includes(q) ||
        (r.quiz_topic || '').toLowerCase().includes(q)
    )
  }
  return list.sort((a, b) => {
    const fieldMap = {
      studentName: 'student_name',
      taskTitle: 'quiz_topic',
      date: 'created_at',
      pct: 'pct',
    }
    const f = fieldMap[sortField.value] || sortField.value
    const av = String(a[f] || '')
    const bv = String(b[f] || '')
    return sortDir.value * av.localeCompare(bv)
  })
})

function sortBy(field) {
  if (sortField.value === field) sortDir.value *= -1
  else {
    sortField.value = field;
    sortDir.value = 1
  }
}

// ── Helpers ───────────────────────────────────────────
function typeIcon(t) {
  return {video: 'pi-play-circle', text: 'pi-file-edit', pdf: 'pi-file-pdf'}[t] || 'pi-book'
}

function pctClass(p) {
  return p >= 80 ? 'good' : p >= 50 ? 'mid' : 'low'
}

function pctColor(p) {
  return p >= 80 ? '#3a5c3a' : p >= 50 ? '#c4922a' : '#8b3a1e'
}

function gradeClass(g) {
  return {'Өте жақсы': 'very-good', 'Жақсы': 'good', 'Қанағат.': 'mid', 'Қайталаңыз': 'low'}[g] || ''
}

function lvClass(lv) {
  return {'Оңай': 'lv-easy', 'Орташа': 'lv-mid', 'Жоғары': 'lv-hard'}[lv] || ''
}

function doLogout() {
  logout();
  router.push({name: 'login'})
}

function exportResults() {
  resultsExport()
}

function confirmDeleteResult(result) {
  deleteResultDialog.result = result
  deleteResultDialog.show = true
}

async function doDeleteResult() {
  if (deleteResultDialog.result?.id) {
    await resultsDelete(deleteResultDialog.result.id)
  }
  deleteResultDialog.show = false
  deleteResultDialog.result = null
}

function sendReply(c) {
  const key = c.studentId + c.date
  const text = replyTexts[key]?.trim()
  if (!text) return
  c.reply = text
  c.replyDate = new Date().toLocaleDateString('kk-KZ')
  delete replyTexts[key]
  alert('Жауап тіркелді. Excel-ге қолмен жазыңыз: Auth_MB.xlsx → 💬 Пікірлер')
}
async function doDelete() {
  if (deleteDialog.lesson) await storeDelete(deleteDialog.lesson.id)
  deleteDialog.show   = false
  deleteDialog.lesson = null
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap');

.teacher-cabinet {
  display: flex;
  min-height: 100dvh;
  background: #f4ede0;
  font-family: 'Source Serif 4', Georgia, serif;
  --gold: #c4922a;
  --gold-l: #e8b94f;
  --rust: #8b3a1e;
  --sage: #3a5c3a;
  --navy: #2a3a5c;
  --dark: #1a1208;
  --border: #d9cdb8;
  --parch: #faf6ef;
}

/* ── SIDEBAR ── */
.tc-sidebar {
  width: 240px;
  flex-shrink: 0;
  background: #1a1208;
  border-right: 1px solid rgba(196, 146, 42, .2);
  display: flex;
  flex-direction: column;
  transition: width .3s ease;
  position: sticky;
  top: 0;
  height: 100dvh;
  overflow: hidden;
}

.tc-sidebar.collapsed {
  width: 64px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: .65rem;
  padding: 1.1rem .85rem;
  border-bottom: 1px solid rgba(196, 146, 42, .15);
  min-height: 72px;
}

.sb-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--gold), var(--rust));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
}

.sb-info {
  flex: 1;
  min-width: 0;
}

.sb-name {
  display: block;
  font-size: .82rem;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sb-role {
  display: block;
  font-size: .65rem;
  color: var(--gold);
  text-transform: uppercase;
  letter-spacing: .08em;
}

.sb-collapse-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, .35);
  cursor: pointer;
  padding: 0;
  font-size: .75rem;
  flex-shrink: 0;
  transition: color .2s;
}

.sb-collapse-btn:hover {
  color: var(--gold);
}

.sb-nav {
  flex: 1;
  padding: .75rem 0;
  display: flex;
  flex-direction: column;
  gap: .1rem;
  overflow-y: auto;
}

.sb-nav-item {
  display: flex;
  align-items: center;
  gap: .7rem;
  padding: .65rem .85rem;
  background: none;
  border: none;
  color: rgba(255, 255, 255, .5);
  font-family: 'Source Serif 4', serif;
  font-size: .82rem;
  cursor: pointer;
  text-align: left;
  border-left: 2px solid transparent;
  transition: all .18s;
  white-space: nowrap;
}

.sb-nav-item i {
  font-size: .9rem;
  flex-shrink: 0;
}

.sb-nav-item:hover {
  color: rgba(255, 255, 255, .85);
  background: rgba(255, 255, 255, .05);
}

.sb-nav-item.active {
  color: var(--gold);
  border-left-color: var(--gold);
  background: rgba(196, 146, 42, .08);
}

.nav-badge {
  margin-left: auto;
  background: var(--rust);
  color: #fff;
  font-size: .6rem;
  font-weight: 700;
  padding: .1rem .42rem;
  border-radius: 10px;
}

.sb-footer {
  padding: .75rem;
  border-top: 1px solid rgba(196, 146, 42, .15);
}

.sb-logout {
  display: flex;
  align-items: center;
  gap: .6rem;
  width: 100%;
  padding: .55rem .75rem;
  background: none;
  border: none;
  color: rgba(255, 255, 255, .35);
  font-family: 'Source Serif 4', serif;
  font-size: .8rem;
  cursor: pointer;
  border-radius: 2px;
  transition: all .2s;
}

.sb-logout:hover {
  color: var(--rust);
  background: rgba(139, 58, 30, .1);
}

/* ── MAIN ── */
.tc-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.tc-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.75rem;
  background: #fff;
  border-bottom: 2px solid var(--gold);
  flex-wrap: wrap;
  gap: .5rem;
}

.tb-title {
  font-family: 'Playfair Display', serif;
  font-size: 1.35rem;
  font-weight: 900;
  color: var(--dark);
  margin: 0;
}

.tb-sub {
  font-size: .72rem;
  color: #9a8a72;
  display: block;
  font-style: italic;
}

.tb-right {
  display: flex;
  align-items: center;
  gap: .75rem;
}

.tb-date {
  font-size: .72rem;
  color: #9a8a72;
}

.tb-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--gold), var(--rust));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: .85rem;
}

.tc-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 5rem 2rem;
  color: #9a8a72;
}

.tc-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(196, 146, 42, .18);
  border-top-color: var(--gold);
  border-radius: 50%;
  animation: spin .75s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.section-wrap {
  padding: 1.5rem 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Stat cards */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 3px;
  padding: 1.1rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 12px rgba(26, 18, 8, .06);
}

.sc-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.sc-val {
  display: block;
  font-family: 'Playfair Display', serif;
  font-size: 1.6rem;
  font-weight: 900;
  color: var(--dark);
  line-height: 1;
}

.sc-label {
  display: block;
  font-size: .7rem;
  color: #9a8a72;
  margin-top: .2rem;
}

/* Section card */
.section-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 3px;
  overflow: hidden;
}

.sc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: .75rem 1.1rem;
  border-bottom: 1px solid var(--border);
  font-size: .72rem;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: #9a8a72;
  background: #faf6ef;
}

.sc-head i {
  color: var(--gold);
  margin-right: .4rem;
}

.sc-export {
  display: inline-flex;
  align-items: center;
  gap: .35rem;
  font-size: .72rem;
  color: var(--sage);
  background: none;
  border: 1px solid rgba(58, 92, 58, .3);
  padding: .2rem .6rem;
  border-radius: 1px;
  cursor: pointer;
}

/* Table */
.results-table-wrap {
  overflow-x: auto;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
  font-size: .8rem;
}

.results-table th {
  padding: .55rem .85rem;
  text-align: left;
  background: #faf6ef;
  border-bottom: 2px solid var(--border);
  color: #9a8a72;
  font-size: .68rem;
  font-weight: 700;
  letter-spacing: .07em;
  text-transform: uppercase;
  cursor: pointer;
  white-space: nowrap;
}

.results-table th i {
  font-size: .6rem;
  margin-left: .2rem;
}

.results-table td {
  padding: .5rem .85rem;
  border-bottom: 1px solid rgba(217, 205, 184, .5);
  color: var(--dark);
  vertical-align: middle;
}

.results-table tr:last-child td {
  border-bottom: none;
}

.results-table tr:hover td {
  background: #fdf8f0;
}

.rt-name {
  font-weight: 600;
}

.rt-task {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #5a4a35;
}

.rt-date {
  font-size: .7rem;
  color: #b0a090;
  white-space: nowrap;
}

.rt-note {
  font-size: .7rem;
  color: #9a8a72;
  font-style: italic;
}

.rt-empty {
  text-align: center;
  padding: 2rem;
  color: #9a8a72;
  font-style: italic;
}

.class-tag {
  background: rgba(42, 58, 92, .1);
  color: var(--navy);
  font-size: .68rem;
  font-weight: 700;
  padding: .12rem .42rem;
  border-radius: 1px;
}

.pct-badge {
  font-size: .72rem;
  font-weight: 700;
  padding: .15rem .5rem;
  border-radius: 1px;
}

.pct-badge.good {
  background: rgba(58, 92, 58, .1);
  color: var(--sage);
}

.pct-badge.mid {
  background: rgba(196, 146, 42, .1);
  color: var(--gold);
}

.pct-badge.low {
  background: rgba(139, 58, 30, .1);
  color: var(--rust);
}

.pct-bar-wrap {
  display: flex;
  align-items: center;
  gap: .5rem;
  min-width: 90px;
}

.pct-bar {
  height: 5px;
  border-radius: 3px;
  transition: width .4s;
}

.pct-num {
  font-size: .72rem;
  font-weight: 600;
  color: var(--dark);
}

.grade-chip {
  font-size: .65rem;
  font-weight: 700;
  padding: .12rem .45rem;
  border-radius: 1px;
}

.grade-chip.very-good {
  background: rgba(46, 125, 50, .1);
  color: #2e7d32;
}

.grade-chip.good {
  background: rgba(21, 101, 192, .1);
  color: #1565c0;
}

.grade-chip.mid {
  background: rgba(230, 81, 0, .1);
  color: #e65100;
}

.grade-chip.low {
  background: rgba(183, 28, 28, .1);
  color: #b71c1c;
}

/* Lessons toolbar */
.lessons-toolbar {
  display: flex;
  align-items: center;
  gap: .65rem;
  flex-wrap: wrap;
  margin-bottom: .75rem;
}

.lt-search {
  display: flex;
  align-items: center;
  gap: .45rem;
  flex: 1;
  min-width: 180px;
  background: #fff;
  border: 1.5px solid var(--border);
  border-radius: 2px;
  padding: .42rem .7rem;
}

.lt-search i {
  color: #b0a090;
  font-size: .78rem;
}

.lt-input {
  flex: 1;
  border: none;
  outline: none;
  font-family: 'Source Serif 4', serif;
  font-size: .8rem;
  color: var(--dark);
}

.lt-input::placeholder {
  color: #b0a090;
  font-style: italic;
}

.lt-clear {
  background: none;
  border: none;
  color: #b0a090;
  cursor: pointer;
  font-size: .72rem;
}

.lt-clear:hover {
  color: var(--rust);
}

.lt-types {
  display: flex;
  gap: .3rem;
  flex-wrap: wrap;
}

.lt-type-btn {
  padding: .38rem .75rem;
  border: 1.5px solid var(--border);
  border-radius: 2px;
  background: transparent;
  font-family: 'Source Serif 4', serif;
  font-size: .75rem;
  font-weight: 600;
  color: #7a6a52;
  cursor: pointer;
  transition: all .2s;
}

.lt-type-btn:hover {
  border-color: var(--gold);
  color: var(--gold);
}

.lt-type-btn.active {
  color: #fff;
  border-color: transparent;
}

.lt-type-btn.all.active {
  background: var(--gold);
}

.lt-type-btn.video.active {
  background: var(--rust);
}

.lt-type-btn.text.active {
  background: var(--sage);
}

.lt-type-btn.pdf.active {
  background: var(--navy);
}

.lt-actions {
  display: flex;
  align-items: center;
  gap: .4rem;
  margin-left: auto;
}

.btn-excel {
  display: inline-flex;
  align-items: center;
  gap: .35rem;
  background: rgba(58, 92, 58, .1);
  border: 1px solid rgba(58, 92, 58, .3);
  color: var(--sage);
  padding: .48rem .85rem;
  border-radius: 2px;
  font-size: .78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all .2s;
}

.btn-excel:hover {
  background: var(--sage);
  color: #fff;
}

.btn-reload {
  width: 34px;
  height: 34px;
  border: 1.5px solid var(--border);
  border-radius: 2px;
  background: #fff;
  color: #7a6a52;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .82rem;
  cursor: pointer;
  transition: all .2s;
}

.btn-reload:hover:not(:disabled) {
  border-color: var(--gold);
  color: var(--gold);
}

.btn-reload:disabled {
  opacity: .4;
  cursor: not-allowed;
}

.spinning {
  animation: spin .8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Store stats row */
.store-stats-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: .5rem;
  margin-bottom: .75rem;
}

.ssr-item {
  display: inline-flex;
  align-items: center;
  gap: .3rem;
  font-size: .72rem;
  padding: .2rem .55rem;
  border-radius: 10px;
}

.ssr-item i {
  font-size: .68rem;
}

.ssr-item.total {
  background: rgba(196, 146, 42, .1);
  color: var(--gold);
}

.ssr-item.total strong {
  font-weight: 700;
}

.ssr-item.video {
  background: rgba(139, 58, 30, .08);
  color: var(--rust);
}

.ssr-item.text {
  background: rgba(58, 92, 58, .08);
  color: var(--sage);
}

.ssr-item.pdf {
  background: rgba(42, 58, 92, .08);
  color: var(--navy);
}

.ssr-source {
  margin-left: auto;
  font-size: .68rem;
  color: #b0a090;
  font-style: italic;
  display: flex;
  align-items: center;
  gap: .3rem;
}

/* Store loading */
.store-loading {
  display: flex;
  align-items: center;
  gap: .75rem;
  padding: 2rem;
  color: #9a8a72;
  font-style: italic;
}

/* ══ LESSON CARDS ═══════════════════════════════════ */
.lessons-grid {
  margin-bottom: .75rem;
}

.lg-inner {
  display: grid;
  grid-template-columns:repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.25rem;
}

.lesson-manage-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: box-shadow .25s, transform .25s;
}

.lesson-manage-card:hover {
  box-shadow: 0 8px 28px rgba(26, 18, 8, .13);
  transform: translateY(-3px);
}

/* Мұқаба сурет */
.lmc-cover {
  width: 100%;
  height: 180px;
  overflow: hidden;
  background: #f0e8db;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lmc-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.lmc-cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.lmc-cover-placeholder i {
  font-size: 3rem;
  opacity: .18;
  color: var(--dark);
}

/* Тип badge жолы — мұқабадан кейін */
.lmc-type-row {
  padding: .75rem 1rem .1rem;
}

.lmc-type-badge {
  display: inline-flex;
  align-items: center;
  gap: .3rem;
  font-size: .72rem;
  font-weight: 600;
  color: #5a4a35;
}

.lmc-type-badge i {
  font-size: .78rem;
  color: #8a7a62;
}

.lmc-type-badge.video i {
  color: var(--rust);
}

.lmc-type-badge.text i {
  color: var(--sage);
}

.lmc-type-badge.pdf i {
  color: var(--navy);
}

/* Body */
.lmc-body {
  padding: .35rem 1rem .65rem;
  display: flex;
  flex-direction: column;
  gap: .3rem;
  flex: 1;
}

/* Тақырып + Деңгей */
.lmc-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .4rem;
  margin-bottom: .1rem;
}

.lmc-topic {
  font-size: .8rem;
  font-weight: 400;
  color: #7a6a52;
}

.lmc-level {
  font-size: .68rem;
  font-weight: 700;
  padding: .18rem .55rem;
  border-radius: 2px;
  flex-shrink: 0;
}

.lmc-level.lv-easy {
  background: #e8f5e9;
  color: #2e7d32;
}

.lmc-level.lv-mid {
  background: #fff3e0;
  color: #e65100;
}

.lmc-level.lv-hard {
  background: #fce4ec;
  color: #c62828;
}

/* Автор — тақырып ретінде (скриншоттағы үлкен мәтін) */
.lmc-author {
  font-size: .85rem;
  font-weight: 400;
  color: #6a5a42;
  margin: 0;
  font-style: normal;
}

/* Атауы — қалың */
.lmc-title {
  font-family: 'Playfair Display', serif;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--dark);
  margin: 0;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Сипаттама */
.lmc-desc {
  font-size: .78rem;
  color: #5a4a35;
  line-height: 1.55;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Мета — автор + ұзақтық (астыңғы кіші мәтін) */
.lmc-meta {
  display: flex;
  gap: .85rem;
  flex-wrap: wrap;
  font-size: .72rem;
  color: #9a8a72;
  margin-top: auto;
  padding-top: .35rem;
}

.lmc-meta i {
  color: #c4922a;
  margin-right: .2rem;
  font-size: .68rem;
}

/* Батырмалар */
.lmc-actions {
  display: flex;
  gap: .5rem;
  padding: .75rem 1rem;
  border-top: 1px solid var(--border);
  background: #faf6ef;
}

.lmc-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .32rem;
  font-size: .78rem;
  font-family: 'Source Serif 4', serif;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: #fff;
  cursor: pointer;
  padding: .42rem .85rem;
  transition: all .2s;
  color: #5a4a35;
  flex: 1;
}

.lmc-btn i {
  font-size: .78rem;
}

.lmc-btn.edit:hover {
  border-color: var(--gold);
  color: var(--gold);
  background: rgba(196, 146, 42, .04);
}

.lmc-btn.delete {
  color: var(--rust);
  border-color: rgba(139, 58, 30, .22);
  background: #fff;
}

.lmc-btn.delete:hover {
  border-color: var(--rust);
  background: rgba(139, 58, 30, .05);
}

/* Қосу карточкасы */
.lesson-add-card {
  background: transparent;
  border: 1.5px dashed var(--border);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: .55rem;
  padding: 2rem;
  color: #b0a090;
  cursor: pointer;
  transition: all .2s;
  min-height: 200px;
}

.lesson-add-card:hover {
  border-color: var(--gold);
  color: var(--gold);
  background: rgba(196, 146, 42, .03);
}

.lesson-add-card i {
  font-size: 1.6rem;
}

.lesson-add-card span {
  font-size: .82rem;
  font-weight: 600;
}

/* Transition */
.lesson-card-fade-enter-active,
.lesson-card-fade-leave-active {
  transition: opacity .22s, transform .22s;
}

.lesson-card-fade-enter-from,
.lesson-card-fade-leave-to {
  opacity: 0;
  transform: scale(.97);
}

/* Delete modal */
.del-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(19, 14, 7, 0.72);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.del-modal {
  background: #faf6ef;
  border: 1px solid #d9cdb8;
  border-top: 4px solid #8b3a1e;
  border-radius: 4px;
  padding: 2rem 2rem 1.75rem;
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.35);
}

.del-modal-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(139, 58, 30, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.del-modal-icon i {
  font-size: 1.6rem;
  color: #8b3a1e;
}

.del-modal-title {
  font-family: 'Playfair Display', serif;
  font-size: 1.15rem;
  font-weight: 900;
  color: #1a1208;
  margin: 0;
}

.del-modal-body {
  font-size: .88rem;
  color: #3a2a15;
  line-height: 1.65;
  margin: 0;
}

.del-modal-body strong {
  color: #1a1208;
}

.del-modal-hint {
  display: flex;
  align-items: flex-start;
  gap: .4rem;
  font-size: .75rem;
  color: #9a8a72;
  font-style: italic;
  background: rgba(196, 146, 42, .07);
  border: 1px solid rgba(196, 146, 42, .2);
  border-radius: 2px;
  padding: .55rem .75rem;
  text-align: left;
  width: 100%;
}

.del-modal-hint i {
  color: #c4922a;
  flex-shrink: 0;
  margin-top: .1rem;
}

.del-modal-hint strong {
  color: #1a1208;
  font-style: normal;
}

.del-modal-actions {
  display: flex;
  gap: .65rem;
  width: 100%;
  justify-content: center;
}

.del-btn-confirm {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .45rem;
  background: #8b3a1e;
  color: #fff;
  border: none;
  padding: .65rem 1rem;
  border-radius: 2px;
  font-family: 'Source Serif 4', serif;
  font-size: .875rem;
  font-weight: 700;
  cursor: pointer;
  transition: background .2s;
}

.del-btn-confirm:hover {
  background: #a04428;
}

.del-btn-cancel {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .45rem;
  background: transparent;
  border: 1.5px solid #d9cdb8;
  color: #7a6a52;
  padding: .65rem 1rem;
  border-radius: 2px;
  font-family: 'Source Serif 4', serif;
  font-size: .875rem;
  cursor: pointer;
  transition: all .2s;
}

.del-btn-cancel:hover {
  border-color: #c4922a;
  color: #c4922a;
}

/* Modal animation */
.del-modal-fade-enter-active, .del-modal-fade-leave-active {
  transition: opacity .25s ease;
}

.del-modal-fade-enter-active .del-modal,
.del-modal-fade-leave-active .del-modal {
  transition: transform .25s ease;
}

.del-modal-fade-enter-from, .del-modal-fade-leave-to {
  opacity: 0;
}

.del-modal-fade-enter-from .del-modal {
  transform: scale(.93) translateY(8px);
}

.del-modal-fade-leave-to .del-modal {
  transform: scale(.93) translateY(8px);
}

/* Filter row */
.filter-row {
  display: flex;
  gap: .6rem;
  flex-wrap: wrap;
}

.fr-search {
  display: flex;
  align-items: center;
  gap: .5rem;
  flex: 1;
  min-width: 200px;
  background: #fff;
  border: 1.5px solid var(--border);
  border-radius: 2px;
  padding: .45rem .75rem;
}

.fr-search i {
  color: #b0a090;
  font-size: .8rem;
}

.fr-input {
  flex: 1;
  border: none;
  outline: none;
  font-family: 'Source Serif 4', serif;
  font-size: .82rem;
  color: var(--dark);
}

.fr-input::placeholder {
  color: #b0a090;
  font-style: italic;
}

.fr-select {
  border: 1.5px solid var(--border);
  border-radius: 2px;
  background: #fff;
  padding: .45rem .75rem;
  font-family: 'Source Serif 4', serif;
  font-size: .82rem;
  color: var(--dark);
  outline: none;
  cursor: pointer;
}

/* Comments */
.comments-list {
  display: flex;
  flex-direction: column;
  gap: .85rem;
}

.comment-manage-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 3px;
  padding: 1.1rem;
}

.cmc-header {
  display: flex;
  align-items: center;
  gap: .75rem;
  margin-bottom: .75rem;
  flex-wrap: wrap;
}

.cmc-ava {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--gold), var(--rust));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: .85rem;
  flex-shrink: 0;
}

.cmc-meta {
  display: flex;
  flex-direction: column;
}

.cmc-name {
  font-size: .85rem;
  font-weight: 700;
  color: var(--dark);
}

.cmc-class {
  font-size: .65rem;
  color: var(--navy);
  font-weight: 700;
}

.cmc-date {
  font-size: .65rem;
  color: #b0a090;
}

.cmc-stars {
  display: flex;
  gap: .1rem;
}

.cmc-star {
  font-size: .75rem;
  color: #d9cdb8;
}

.cmc-star.on {
  color: var(--gold);
}

.cmc-lesson {
  font-size: .7rem;
  color: #9a8a72;
  font-style: italic;
  margin-left: auto;
}

.cmc-text {
  font-size: .85rem;
  color: #3a2a15;
  line-height: 1.65;
  margin: 0 0 .75rem;
}

.cmc-reply {
  background: rgba(58, 92, 58, .05);
  border: 1px solid rgba(58, 92, 58, .2);
  border-radius: 2px;
  padding: .65rem .9rem;
}

.reply-label {
  font-size: .65rem;
  font-weight: 700;
  color: var(--sage);
  text-transform: uppercase;
  letter-spacing: .08em;
  margin-bottom: .35rem;
  display: flex;
  align-items: center;
  gap: .3rem;
}

.reply-text {
  font-size: .82rem;
  color: #3a5c3a;
  margin: 0 0 .3rem;
}

.reply-date {
  font-size: .65rem;
  color: #9a8a72;
}

.cmc-reply-form {
  display: flex;
  flex-direction: column;
  gap: .5rem;
}

.reply-ta {
  width: 100%;
  border: 1.5px solid var(--border);
  border-radius: 2px;
  padding: .6rem .75rem;
  font-family: 'Source Serif 4', serif;
  font-size: .82rem;
  color: var(--dark);
  resize: vertical;
  outline: none;
  background: #fdf9f4;
  transition: border-color .2s;
}

.reply-ta:focus {
  border-color: var(--sage);
}

.reply-ta::placeholder {
  color: #b0a090;
  font-style: italic;
}

/* Profile */
.profile-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.25rem;
}

.profile-card {
  padding: 1.5rem !important;
}

.profile-hero {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--border);
}

.ph-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--gold), var(--rust));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Playfair Display', serif;
  font-size: 1.75rem;
  font-weight: 900;
  flex-shrink: 0;
}

.ph-name {
  font-family: 'Playfair Display', serif;
  font-size: 1.3rem;
  font-weight: 900;
  color: var(--dark);
  margin: 0 0 .35rem;
}

.ph-role-badge {
  display: inline-block;
  font-size: .65rem;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  padding: .2rem .65rem;
  border-radius: 1px;
}

.ph-role-badge.teacher {
  background: rgba(58, 92, 58, .1);
  color: var(--sage);
  border: 1px solid rgba(58, 92, 58, .3);
}

.profile-rows {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.pr-row {
  display: flex;
  justify-content: space-between;
  padding: .52rem 0;
  border-bottom: 1px solid rgba(217, 205, 184, .5);
}

.pr-row:last-child {
  border-bottom: none;
}

.pr-key {
  font-size: .78rem;
  color: #9a8a72;
}

.pr-val {
  font-size: .82rem;
  font-weight: 600;
  color: var(--dark);
  text-align: right;
  max-width: 60%;
}

/* Buttons */
.btn-gold {
  display: inline-flex;
  align-items: center;
  gap: .45rem;
  background: var(--gold);
  color: #fff;
  border: none;
  padding: .6rem 1.35rem;
  border-radius: 2px;
  font-family: 'Source Serif 4', serif;
  font-size: .85rem;
  font-weight: 700;
  cursor: pointer;
  transition: background .2s;
}

.btn-gold:hover {
  background: var(--gold-l);
}

.btn-gold.btn-sm {
  padding: .42rem .9rem;
  font-size: .78rem;
}

.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: .45rem;
  background: transparent;
  border: 1.5px solid var(--border);
  color: var(--dark);
  padding: .6rem 1.35rem;
  border-radius: 2px;
  font-family: 'Source Serif 4', serif;
  font-size: .85rem;
  cursor: pointer;
  transition: all .2s;
}

.btn-outline:hover {
  border-color: var(--gold);
  color: var(--gold);
}

/* Excel info block */
.excel-info-block {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: .75rem;
}

.eib-item {
  display: flex;
  align-items: center;
  gap: .85rem;
  padding: .75rem;
  background: #fdf8f0;
  border: 1px solid var(--border);
  border-radius: 2px;
}

.eib-icon {
  width: 40px;
  height: 40px;
  border-radius: 2px;
  background: rgba(58, 92, 58, .1);
  color: var(--sage);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.eib-title {
  display: block;
  font-size: .82rem;
  font-weight: 700;
  color: var(--dark);
  margin-bottom: .15rem;
  font-family: monospace;
}

.eib-desc {
  display: block;
  font-size: .72rem;
  color: #9a8a72;
}

.eib-dl {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: .35rem;
  font-size: .75rem;
  color: var(--sage);
  text-decoration: none;
  border: 1px solid rgba(58, 92, 58, .3);
  padding: .28rem .65rem;
  border-radius: 1px;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all .2s;
}

.eib-dl:hover {
  background: rgba(58, 92, 58, .08);
}

/* Add lesson form */
.add-lesson-form {
  display: flex;
  flex-direction: column;
  gap: .85rem;
}

.alf-field {
  display: flex;
  flex-direction: column;
  gap: .3rem;
}

.alf-field label {
  font-size: .7rem;
  font-weight: 700;
  color: #9a8a72;
  text-transform: uppercase;
  letter-spacing: .07em;
}

.alf-input, .alf-select {
  width: 100%;
  border: 1.5px solid var(--border);
  border-radius: 2px;
  padding: .52rem .75rem;
  font-family: 'Source Serif 4', serif;
  font-size: .85rem;
  color: var(--dark);
  background: #fdf9f4;
  outline: none;
  transition: border-color .2s;
}

.alf-input:focus, .alf-select:focus {
  border-color: var(--gold);
}

.alf-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: .75rem;
}

.alf-hint {
  font-size: .75rem;
  color: #9a8a72;
  font-style: italic;
  background: rgba(196, 146, 42, .06);
  border: 1px solid rgba(196, 146, 42, .2);
  padding: .6rem .85rem;
  border-radius: 2px;
  margin: 0;
}

.alf-hint i {
  color: var(--gold);
  margin-right: .3rem;
}

.alf-actions {
  display: flex;
  gap: .65rem;
  flex-wrap: wrap;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .6rem;
  padding: 3.5rem 2rem;
  text-align: center;
  color: #9a8a72;
  font-style: italic;
}

.empty-state i {
  font-size: 2rem;
  color: var(--border);
}

.empty-state p {
  margin: 0;
}

/* ══ TESTS SECTION ═══════════════════════════════════ */
.ts-toolbar {
  display: flex;
  align-items: center;
  gap: .65rem;
  flex-wrap: wrap;
}

.ts-type-tabs {
  display: flex;
  gap: .3rem;
  flex-wrap: wrap;
}

.ts-tab {
  display: inline-flex;
  align-items: center;
  gap: .35rem;
  padding: .38rem .85rem;
  border: 1.5px solid var(--border);
  border-radius: 2px;
  background: transparent;
  font-family: 'Source Serif 4', serif;
  font-size: .75rem;
  font-weight: 600;
  color: #7a6a52;
  cursor: pointer;
  transition: all .2s;
}

.ts-tab:hover {
  border-color: var(--gold);
  color: var(--gold);
}

.ts-tab.active {
  color: #fff;
  border-color: transparent;
}

.ts-tab.all.active {
  background: var(--dark);
}

.ts-tab.mcq.active {
  background: var(--gold);
}

.ts-tab.tf.active {
  background: var(--sage);
}

.ts-tab.fill.active {
  background: var(--rust);
}

.ts-tab.match.active {
  background: var(--navy);
}

.ts-tab-cnt {
  font-size: .62rem;
  background: rgba(255, 255, 255, .22);
  padding: .04rem .32rem;
  border-radius: 8px;
}

.ts-tab:not(.active) .ts-tab-cnt {
  background: rgba(196, 146, 42, .1);
  color: var(--gold);
}

.ts-stats-strip {
  display: flex;
  align-items: center;
  gap: .55rem;
  flex-wrap: wrap;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 3px;
  padding: .65rem 1rem;
}

.tss-item {
  display: inline-flex;
  align-items: center;
  gap: .35rem;
  font-size: .78rem;
  color: #5a4a35;
}

.tss-item span {
  font-weight: 700;
  color: var(--dark);
}

.tss-val {
  font-family: 'Playfair Display', serif;
  font-size: 1.35rem;
  font-weight: 900;
  color: var(--dark);
  line-height: 1;
}

.tss-lbl {
  font-size: .62rem;
  color: #9a8a72;
  text-transform: uppercase;
  letter-spacing: .07em;
  display: block;
}

.tss-sep {
  width: 1px;
  height: 28px;
  background: var(--border);
  flex-shrink: 0;
}

.tss-mcq {
  color: var(--gold);
}

.tss-mcq span {
  color: var(--gold);
}

.tss-tf {
  color: var(--sage);
}

.tss-tf span {
  color: var(--sage);
}

.tss-fill {
  color: var(--rust);
}

.tss-fill span {
  color: var(--rust);
}

.tss-match {
  color: var(--navy);
}

.tss-match span {
  color: var(--navy);
}

.tss-src {
  margin-left: auto;
  font-size: .68rem;
  color: #b0a090;
  font-family: monospace;
  display: flex;
  align-items: center;
  gap: .3rem;
}

.task-cards-grid {
  display: grid;
  grid-template-columns:repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.1rem;
}

.task-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  transition: box-shadow .25s, transform .25s;
}

.task-card:hover {
  box-shadow: 0 6px 24px rgba(26, 18, 8, .11);
  transform: translateY(-3px);
}

.tc-stripe {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}

.tc-mcq .tc-stripe {
  background: var(--gold);
}

.tc-tf .tc-stripe {
  background: var(--sage);
}

.tc-fill .tc-stripe {
  background: var(--rust);
}

.tc-match.tc-stripe {
  background: var(--navy);
}

.tc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: .65rem 1rem .4rem 1.2rem;
}

.tc-type-badge {
  display: inline-flex;
  align-items: center;
  gap: .28rem;
  font-size: .62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .07em;
  padding: .18rem .55rem;
  border-radius: 1px;
  color: #fff;
}

.tcb-mcq {
  background: var(--gold);
}

.tcb-tf {
  background: var(--sage);
}

.tcb-fill {
  background: var(--rust);
}

.tcb-match {
  background: var(--navy);
}

.tc-text {
  font-family: 'Playfair Display', serif;
  font-size: .9rem;
  font-weight: 700;
  color: var(--dark);
  margin: 0;
  line-height: 1.38;
  padding: .25rem 1rem .5rem 1.2rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.tc-preview {
  padding: 0 1rem .65rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: .32rem;
}

.tcp-opts {
  display: flex;
  flex-direction: column;
  gap: .28rem;
}

.tcp-opt {
  display: flex;
  align-items: center;
  gap: .45rem;
  font-size: .75rem;
  color: #5a4a35;
  background: var(--parch);
  border: 1px solid var(--border);
  padding: .3rem .6rem;
  border-radius: 2px;
}

.tcp-opt.correct {
  background: rgba(58, 92, 58, .07);
  border-color: rgba(58, 92, 58, .35);
  color: var(--sage);
}

.tcp-ltr {
  font-size: .65rem;
  font-weight: 700;
  width: 18px;
  flex-shrink: 0;
  color: var(--gold);
}

.tcp-opt.correct .tcp-ltr {
  color: var(--sage);
}

.tcp-ok {
  margin-left: auto;
  color: var(--sage);
  font-size: .78rem;
}

.tcp-tf {
  display: flex;
  gap: .5rem;
}

.tcp-tf-opt {
  display: inline-flex;
  align-items: center;
  gap: .35rem;
  font-size: .78rem;
  font-weight: 600;
  padding: .32rem .75rem;
  border-radius: 2px;
  border: 1.5px solid var(--border);
  color: #9a8a72;
  flex: 1;
  justify-content: center;
}

.tcp-tf-opt.tf-selected {
  border-color: var(--sage);
  background: rgba(58, 92, 58, .08);
  color: var(--sage);
}

.tcp-fill {
  font-size: .78rem;
  color: #5a4a35;
  display: flex;
  align-items: center;
  gap: .4rem;
  background: rgba(139, 58, 30, .06);
  border: 1px solid rgba(139, 58, 30, .2);
  padding: .35rem .65rem;
  border-radius: 2px;
}

.tcp-fill i {
  color: var(--rust);
  font-size: .75rem;
}

.tcp-fill strong {
  color: var(--rust);
}

.tcp-match {
  display: flex;
  flex-direction: column;
  gap: .25rem;
}

.tcp-pair {
  display: flex;
  align-items: center;
  gap: .45rem;
  font-size: .72rem;
  color: #5a4a35;
}

.tcp-left {
  font-weight: 600;
  color: var(--navy);
}

.tcp-right {
  color: var(--dark);
}

.tcp-pair i {
  color: #b0a090;
  font-size: .65rem;
}

.tcp-more {
  font-size: .65rem;
  color: #9a8a72;
  font-style: italic;
}

.tc-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: .6rem 1rem .6rem 1.2rem;
  border-top: 1px solid var(--border);
  background: var(--parch);
  margin-top: auto;
}

.tc-topic {
  font-size: .65rem;
  color: #9a8a72;
  display: flex;
  align-items: center;
  gap: .3rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 140px;
}

.tc-topic i {
  color: var(--gold);
  font-size: .62rem;
}

.tc-actions {
  display: flex;
  gap: .3rem;
  flex-shrink: 0;
}

.tc-btn {
  width: 30px;
  height: 30px;
  border: 1px solid var(--border);
  border-radius: 2px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .75rem;
  cursor: pointer;
  transition: all .2s;
  color: #7a6a52;
}

.tc-edit:hover {
  border-color: var(--gold);
  color: var(--gold);
  background: rgba(196, 146, 42, .05);
}

.tc-del {
  color: var(--rust);
  border-color: rgba(139, 58, 30, .2);
}

.tc-del:hover {
  border-color: var(--rust);
  background: rgba(139, 58, 30, .06);
}

.task-add-card {
  border: 1.5px dashed var(--border);
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: .5rem;
  padding: 2.5rem 1rem;
  color: #b0a090;
  cursor: pointer;
  transition: all .2s;
  min-height: 180px;
}

.task-add-card:hover {
  border-color: var(--gold);
  color: var(--gold);
  background: rgba(196, 146, 42, .03);
}

.task-add-card i {
  font-size: 1.6rem;
}

.task-add-card span {
  font-size: .82rem;
  font-weight: 600;
}

/* ══ COMMENTS SECTION ════════════════════════════════ */
.comments-wrap {
  gap: .85rem !important;
}

.cs-stats-strip {
  display: flex;
  align-items: center;
  gap: .75rem;
  flex-wrap: wrap;
  background: #fff;
  border: 1px solid var(--border);
  border-left: 4px solid var(--gold);
  border-radius: 3px;
  padding: .75rem 1.1rem;
}

.css-item {
  display: flex;
  align-items: center;
  gap: .35rem;
  font-size: .82rem;
  font-weight: 700;
  color: var(--dark);
}

.css-val {
  font-family: 'Playfair Display', serif;
  font-size: 1.4rem;
  font-weight: 900;
  color: var(--dark);
  line-height: 1;
}

.css-lbl {
  font-size: .62rem;
  color: #9a8a72;
  text-transform: uppercase;
  letter-spacing: .07em;
  font-weight: 400;
  display: block;
}

.css-sep {
  width: 1px;
  height: 32px;
  background: var(--border);
  flex-shrink: 0;
}

.css-unread {
  color: var(--rust);
}

.css-unread span {
  color: var(--rust);
  font-size: 1rem;
}

.css-replied {
  color: var(--sage);
}

.css-replied span {
  color: var(--sage);
  font-size: 1rem;
}

.css-rating {
  color: var(--gold);
}

.css-rating span {
  color: var(--gold);
  font-size: 1rem;
}

.css-src {
  margin-left: auto;
  font-size: .68rem;
  color: #b0a090;
  font-family: monospace;
  display: flex;
  align-items: center;
  gap: .3rem;
}

.cs-embed {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 3px;
  overflow: hidden;
}

/* ── Results section ── */
.results-stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: .85rem;
  margin-bottom: 1rem;
}

.rsr-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 3px;
  padding: .9rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: .2rem;
  box-shadow: 0 2px 8px rgba(26, 18, 8, .05);
}

.rsr-val {
  font-family: 'Playfair Display', serif;
  font-size: 1.45rem;
  font-weight: 900;
  color: var(--dark);
  line-height: 1;
}

.rsr-lbl {
  font-size: .68rem;
  color: #9a8a72;
  text-transform: uppercase;
  letter-spacing: .07em;
}

.btn-reload-results {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  background: rgba(58, 92, 58, .1);
  border: 1px solid rgba(58, 92, 58, .3);
  color: var(--sage);
  padding: .45rem .9rem;
  border-radius: 2px;
  font-family: 'Source Serif 4', serif;
  font-size: .78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all .2s;
  white-space: nowrap;
}

.btn-reload-results:hover:not(:disabled) {
  background: var(--sage);
  color: #fff;
}

.btn-reload-results:disabled {
  opacity: .4;
  cursor: not-allowed;
}

.sc-head-actions {
  display: flex;
  align-items: center;
  gap: .65rem;
  flex-wrap: wrap;
}

.sc-source-badge {
  font-size: .68rem;
  color: #9a8a72;
  font-family: monospace;
  display: flex;
  align-items: center;
  gap: .3rem;
}

.sc-source-badge i {
  color: var(--gold);
  font-size: .7rem;
}

.sc-count {
  color: var(--gold);
  font-size: .78rem;
  font-weight: 700;
  margin-left: .3rem;
}

.results-loading {
  display: flex;
  align-items: center;
  gap: .75rem;
  padding: 2rem;
  color: #9a8a72;
  font-style: italic;
}

/* Source badge */
.source-badge {
  display: inline-flex;
  align-items: center;
  gap: .28rem;
  font-size: .65rem;
  font-weight: 700;
  padding: .12rem .42rem;
  border-radius: 1px;
}

.src-excel {
  background: rgba(58, 92, 58, .1);
  color: var(--sage);
}

.src-student {
  background: rgba(42, 58, 92, .1);
  color: var(--navy);
}

/* lmc-type — tasks карточкасындағы тип badge (lmc-type-badge alias) */
.lmc-type {
  display: inline-flex;
  align-items: center;
  gap: .25rem;
  font-size: .6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .07em;
  padding: .18rem .5rem;
  border-radius: 1px;
  color: #fff;
}

.lmc-type.mcq {
  background: var(--gold);
}

.lmc-type.tf {
  background: var(--sage);
}

.lmc-type.fill {
  background: var(--rust);
}

.lmc-type.match {
  background: var(--navy);
}

.audio-url-badge {
  display: inline-flex;
  align-items: center;
  gap: .25rem;
  font-size: .62rem;
  color: rgba(196, 146, 42, .8);
  font-family: monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 130px;
}

/* ── TASK CARDS ── */
.task-card-item {
  cursor: default;
}

.task-card-item .lmc-body {
  gap: .4rem;
}

.task-tag-row {
  display: flex;
  align-items: center;
  gap: .4rem;
  flex-wrap: wrap;
}

.task-type-lbl {
  display: inline-flex;
  align-items: center;
  gap: .25rem;
  font-size: .6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .06em;
  padding: .18rem .5rem;
  border-radius: 1px;
  color: #fff;
  flex-shrink: 0;
}

.task-type-lbl.mcq {
  background: var(--gold);
}

.task-type-lbl.tf {
  background: var(--sage);
}

.task-type-lbl.fill {
  background: var(--rust);
}

.task-type-lbl.match {
  background: var(--navy);
}

.task-topic {
  font-size: .62rem;
  color: #9a8a72;
}

.task-title {
  font-family: 'Playfair Display', serif;
  font-size: .88rem;
  font-weight: 700;
  color: var(--dark);
  margin: 0;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── TASK TABS ── */
.task-tab {
  padding: .38rem .75rem;
  border: 1.5px solid var(--border);
  border-radius: 2px;
  background: transparent;
  font-family: 'Source Serif 4', serif;
  font-size: .75rem;
  font-weight: 600;
  color: #7a6a52;
  cursor: pointer;
  transition: all .2s;
}

.task-tab:hover {
  border-color: var(--gold);
  color: var(--gold);
}

.task-tab.active {
  color: #fff;
  border-color: transparent;
}

.task-tab.all.active {
  background: var(--gold);
}

.task-tab.mcq.active {
  background: var(--gold);
}

.task-tab.tf.active {
  background: var(--sage);
}

.task-tab.fill.active {
  background: var(--rust);
}

.task-tab.match.active {
  background: var(--navy);
}

/* ── SORTABLE TABLE HEADER ── */
.sortable {
  cursor: pointer;
  user-select: none;
}

.sortable:hover {
  color: var(--gold);
}

/* ── COMMENTS SECTION WRAPPER ── */
.comments-embed {
  padding: 0 !important;
}

/* ── DB SPINNER (small) ── */
.db-spinner {
  width: 28px;
  height: 28px;
  border: 2.5px solid rgba(196, 146, 42, .18);
  border-top-color: var(--gold);
  border-radius: 50%;
  animation: spin .75s linear infinite;
}

/* ── RESPONSIVE ── */
@media (max-width: 768px) {
  .tc-sidebar {
    position: fixed;
    z-index: 200;
    height: 100dvh;
  }

  .tc-sidebar:not(.collapsed) {
    box-shadow: 4px 0 24px rgba(0, 0, 0, .25);
  }

  .tc-main {
    margin-left: 64px;
  }

  .section-wrap {
    padding: 1rem;
  }

  .lg-inner {
    grid-template-columns:repeat(auto-fill, minmax(200px, 1fr));
  }

  .stat-cards {
    grid-template-columns:1fr 1fr;
  }
}
</style>