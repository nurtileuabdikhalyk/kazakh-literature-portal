
<script setup lang="ts">
import { ref, computed } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'

const activeTab = ref('all')
const dialogVisible = ref(false)
const selectedNews = ref(null)

const tabs = [
  { key: 'all',      label: 'Барлығы' },
  { key: 'poetry',   label: 'Поэзия' },
  { key: 'prose',    label: 'Проза' },
  { key: 'events',   label: 'Іс-шаралар' },
  { key: 'reviews',  label: 'Рецензиялар' },
]

const allNews = [
  {
    id: 1,
    category: 'Іс-шара',
    date: '24 сәуір, 2026',
    title: 'Абай оқулары — 2026: Халықаралық ғылыми конференция',
    excerpt: 'Алматыда Абай Құнанбайұлының шығармашылығына арналған халықаралық конференция өтті. Әлемнің 15 елінен 200-ден астам ғалым қатысты.',
    image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80',
    author: 'Айгүл Сейткали',
    views: '4 821',
    featured: true,
    tag: 'events',
  },
  {
    id: 2,
    category: 'Поэзия',
    date: '22 сәуір, 2026',
    title: 'Мұқағали Мақатаевтың жаңадан табылған өлеңдері жарияланды',
    excerpt: 'Ұлы ақынның архивінен бұрын белгісіз болған он жеті өлең табылды.',
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&q=80',
    author: 'Берік Әшімов',
    views: '3 140',
    featured: false,
    tag: 'poetry',
  },
  {
    id: 3,
    category: 'Проза',
    date: '20 сәуір, 2026',
    title: 'Дулат Исабеков: «Жазушы — халқының айнасы»',
    excerpt: 'Белгілі жазушы жаңа романы және қазіргі қазақ прозасының болашағы туралы сұхбат берді.',
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80',
    author: 'Зарина Нұрланова',
    views: '2 870',
    featured: false,
    tag: 'prose',
  },
  {
    id: 4,
    category: 'Рецензия',
    date: '19 сәуір, 2026',
    title: 'Ілияс Есенберлиннің «Көшпенділері» — тарих пен поэзияның тоғысы',
    excerpt: 'Классикалық трилогияның жаңа басылымына арналған әдеби шолу.',
    image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600&q=80',
    author: 'Мадина Оспанова',
    views: '1 990',
    featured: false,
    tag: 'reviews',
  },
  {
    id: 5,
    category: 'Іс-шара',
    date: '18 сәуір, 2026',
    title: 'Жас жазушылар байқауының жеңімпаздары анықталды',
    excerpt: 'Республикалық байқауда 18-35 жас аралығындағы авторлар арасынан үздік шығармалар таңдалды.',
    image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&q=80',
    author: 'Асем Бекова',
    views: '2 450',
    featured: false,
    tag: 'events',
  },
  {
    id: 6,
    category: 'Поэзия',
    date: '17 сәуір, 2026',
    title: 'Фариза Оңғарсынова мұражайы Алматыда ашылды',
    excerpt: 'Ақынның туған күніне орай оның есімімен аталған мұражай-үй жұртшылыққа есігін ашты.',
    image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=600&q=80',
    author: 'Дина Сәрсенова',
    views: '3 670',
    featured: false,
    tag: 'poetry',
  },
]

const filteredNews = computed(() =>
    activeTab.value === 'all'
        ? allNews
        : allNews.filter(n => n.tag === activeTab.value)
)

const featuredNews = computed(() => filteredNews.value.find(n => n.featured) || filteredNews.value[0])
const sideNews = computed(() => filteredNews.value.filter(n => n.id !== featuredNews.value?.id).slice(0, 2))
const bottomNews = computed(() => filteredNews.value.filter(n => n.id !== featuredNews.value?.id).slice(2, 5))

function openNews(item) {
  selectedNews.value = item
  dialogVisible.value = true
}

function loadMore() {
  console.log('Load more news...')
}
</script>
<template>
  <section class="news-section">
    <!-- Header -->
    <div class="section-header">
      <div class="header-ornament">
        <span class="ornament-line" />
        <span class="ornament-diamond">◆</span>
        <span class="ornament-line" />
      </div>
      <h2 class="section-title">
        <span class="title-kz">Жаңалықтар</span>
      </h2>
      <p class="section-subtitle">Қазақ әдебиетінің соңғы жаңалықтары</p>
    </div>

    <!-- Filter Tabs -->
    <div class="filter-tabs">
      <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-btn"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- News Grid -->
    <div class="news-grid">
      <!-- Featured Card -->
      <article
          v-if="featuredNews"
          class="news-card featured"
          @click="openNews(featuredNews)"
      >
        <div class="card-image-wrap">
          <img :src="featuredNews.image" :alt="featuredNews.title" class="card-image" />
          <div class="card-overlay" />
          <span class="card-badge featured-badge">{{ featuredNews.category }}</span>
        </div>
        <div class="card-body">
          <div class="card-meta">
            <span class="card-date">
              <i class="pi pi-calendar" />
              {{ featuredNews.date }}
            </span>
            <span class="card-views">
              <i class="pi pi-eye" />
              {{ featuredNews.views }}
            </span>
          </div>
          <h3 class="card-title featured-title">{{ featuredNews.title }}</h3>
          <p class="card-excerpt">{{ featuredNews.excerpt }}</p>
          <div class="card-footer">
            <div class="card-author">
              <div class="author-avatar">{{ featuredNews.author[0] }}</div>
              <span class="author-name">{{ featuredNews.author }}</span>
            </div>
            <button class="read-more-btn">
              Оқу <i class="pi pi-arrow-right" />
            </button>
          </div>
        </div>
      </article>

      <!-- Side Cards -->
      <div class="side-cards">
        <article
            v-for="item in sideNews"
            :key="item.id"
            class="news-card side"
            @click="openNews(item)"
        >
          <div class="side-image-wrap">
            <img :src="item.image" :alt="item.title" class="side-image" />
            <span class="card-badge">{{ item.category }}</span>
          </div>
          <div class="side-body">
            <div class="card-meta">
              <span class="card-date">
                <i class="pi pi-calendar" />
                {{ item.date }}
              </span>
            </div>
            <h3 class="side-title">{{ item.title }}</h3>
            <p class="side-excerpt">{{ item.excerpt }}</p>
          </div>
        </article>
      </div>
    </div>

    <!-- Bottom Row -->
    <div class="bottom-row">
      <article
          v-for="item in bottomNews"
          :key="item.id"
          class="news-card compact"
          @click="openNews(item)"
      >
        <div class="compact-image-wrap">
          <img :src="item.image" :alt="item.title" class="compact-image" />
        </div>
        <div class="compact-body">
          <span class="card-badge compact-badge">{{ item.category }}</span>
          <h3 class="compact-title">{{ item.title }}</h3>
          <div class="card-meta">
            <span class="card-date">
              <i class="pi pi-calendar" />
              {{ item.date }}
            </span>
            <span class="card-views">
              <i class="pi pi-eye" />
              {{ item.views }}
            </span>
          </div>
        </div>
      </article>
    </div>

    <!-- Load More -->
    <div class="load-more-wrap">
      <Button
          label="Барлық жаңалықтар"
          icon="pi pi-arrow-right"
          iconPos="right"
          class="load-more-btn p-button-outlined"
          @click="loadMore"
      />
    </div>

    <!-- Dialog -->
    <Dialog
        v-model:visible="dialogVisible"
        :header="selectedNews?.title"
        :style="{ width: '680px', maxWidth: '95vw' }"
        modal
        class="news-dialog"
    >
      <div v-if="selectedNews" class="dialog-content">
        <img :src="selectedNews.image" :alt="selectedNews.title" class="dialog-image" />
        <div class="dialog-meta">
          <Tag :value="selectedNews.category" severity="warning" />
          <span class="card-date"><i class="pi pi-calendar" /> {{ selectedNews.date }}</span>
          <span class="card-date"><i class="pi pi-user" /> {{ selectedNews.author }}</span>
        </div>
        <p class="dialog-text">{{ selectedNews.excerpt }}</p>
        <p class="dialog-text">
          Бұл мақала қазақ әдебиетінің дамуына арналған және оқырмандарға терең талдау ұсынады.
          Авторлар мен зерттеушілер осы тақырыпта өз ойларын бөлісті.
        </p>
      </div>
    </Dialog>
  </section>
</template>


<style scoped>
/* ─── Fonts ─── */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;900&family=Source+Serif+4:ital,wght@0,300;0,400;1,300&display=swap');

/* ─── Tokens ─── */
.news-section {
  --ink:        #1a1208;
  --parchment:  #faf6ef;
  --gold:       #c4922a;
  --gold-light: #e8b94f;
  --rust:       #8b3a1e;
  --sage:       #4a5e4c;
  --border:     #d9cdb8;
  --shadow:     0 4px 24px rgba(26,18,8,.10);
  --shadow-lg:  0 12px 48px rgba(26,18,8,.18);

  font-family: 'Source Serif 4', Georgia, serif;
  background: var(--parchment);
  padding: 3.5rem 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* ─── Header ─── */
.section-header { text-align: center; margin-bottom: 2.5rem; }

.header-ornament {
  display: flex; align-items: center; justify-content: center;
  gap: .75rem; margin-bottom: 1rem;
}
.ornament-line {
  display: block; height: 1px; width: 80px;
  background: linear-gradient(90deg, transparent, var(--gold));
}
.ornament-line:last-child { background: linear-gradient(90deg, var(--gold), transparent); }
.ornament-diamond { color: var(--gold); font-size: .7rem; }

.section-title {
  font-family: 'Playfair Display', serif;
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 900;
  color: var(--ink);
  line-height: 1.1;
  margin: 0 0 .5rem;
}
.title-kz { color: var(--ink); }
.title-divider { color: var(--gold); margin: 0 .5rem; font-weight: 300; }
.title-ru { color: var(--rust); font-style: italic; font-weight: 600; font-size: 80%; }

.section-subtitle {
  color: #7a6a52;
  font-size: .95rem;
  font-style: italic;
  margin: 0;
}

/* ─── Tabs ─── */
.filter-tabs {
  display: flex; flex-wrap: wrap; gap: .5rem;
  justify-content: center;
  margin-bottom: 2.5rem;
}
.tab-btn {
  padding: .45rem 1.2rem;
  border: 1.5px solid var(--border);
  border-radius: 2px;
  background: transparent;
  color: #7a6a52;
  font-family: 'Source Serif 4', serif;
  font-size: .875rem;
  cursor: pointer;
  transition: all .25s;
  letter-spacing: .02em;
}
.tab-btn:hover { border-color: var(--gold); color: var(--gold); }
.tab-btn.active {
  background: var(--gold);
  border-color: var(--gold);
  color: #fff;
  font-weight: 600;
}

/* ─── Grid Layout ─── */
.news-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}
@media (max-width: 900px) {
  .news-grid { grid-template-columns: 1fr; }
}

/* ─── Card Base ─── */
.news-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 3px;
  overflow: hidden;
  cursor: pointer;
  transition: transform .3s ease, box-shadow .3s ease;
}
.news-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }

/* ─── Featured Card ─── */
.news-card.featured { display: flex; flex-direction: column; }

.card-image-wrap { position: relative; overflow: hidden; height: 320px; flex-shrink: 0; }
.card-image { width: 100%; height: 100%; object-fit: cover; transition: transform .5s ease; }
.news-card:hover .card-image { transform: scale(1.04); }

.card-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(26,18,8,.5) 0%, transparent 55%);
}

.card-badge {
  position: absolute; top: 1rem; left: 1rem;
  background: var(--gold);
  color: #fff;
  font-size: .7rem;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  padding: .2rem .6rem;
  border-radius: 1px;
}

.card-body { padding: 1.5rem; display: flex; flex-direction: column; flex: 1; }

.card-meta {
  display: flex; gap: 1rem;
  font-size: .8rem; color: #9a8a72;
  margin-bottom: .75rem;
}
.card-meta i { margin-right: .3rem; }

.card-title {
  font-family: 'Playfair Display', serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.3;
  margin: 0 0 .75rem;
}
.featured-title { font-size: 1.75rem; }

.card-excerpt {
  color: #5a4a35;
  font-size: .9rem;
  line-height: 1.65;
  margin: 0 0 1.25rem;
  flex: 1;
}

.card-footer { display: flex; align-items: center; justify-content: space-between; }

.card-author { display: flex; align-items: center; gap: .6rem; }
.author-avatar {
  width: 32px; height: 32px;
  background: var(--rust);
  color: #fff;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: .85rem;
}
.author-name { font-size: .82rem; color: #7a6a52; }

.read-more-btn {
  display: flex; align-items: center; gap: .4rem;
  background: none; border: none;
  color: var(--gold);
  font-family: 'Source Serif 4', serif;
  font-size: .85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  transition: gap .2s;
}
.read-more-btn:hover { gap: .7rem; }

/* ─── Side Cards ─── */
.side-cards { display: flex; flex-direction: column; gap: 1.5rem; }

.news-card.side { display: flex; flex-direction: row; height: auto; }

.side-image-wrap { position: relative; flex-shrink: 0; width: 130px; overflow: hidden; }
.side-image { width: 100%; height: 100%; object-fit: cover; transition: transform .5s; }
.news-card.side:hover .side-image { transform: scale(1.05); }
.side-image-wrap .card-badge { position: absolute; top: .6rem; left: .6rem; font-size: .62rem; }

.side-body { padding: 1rem; display: flex; flex-direction: column; }
.side-title {
  font-family: 'Playfair Display', serif;
  font-size: 1rem;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.35;
  margin: .4rem 0 .4rem;
}
.side-excerpt { font-size: .82rem; color: #5a4a35; line-height: 1.55; margin: 0; }

/* ─── Bottom Row ─── */
.bottom-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.news-card.compact { display: flex; flex-direction: row; }
.compact-image-wrap { flex-shrink: 0; width: 100px; overflow: hidden; }
.compact-image { width: 100%; height: 100%; object-fit: cover; transition: transform .5s; }
.news-card.compact:hover .compact-image { transform: scale(1.06); }

.compact-body { padding: .85rem; display: flex; flex-direction: column; gap: .35rem; }
.compact-badge { position: static; font-size: .62rem; display: inline-block; margin-bottom: .25rem; }
.compact-title {
  font-family: 'Playfair Display', serif;
  font-size: .88rem;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.35;
  margin: 0;
}

/* ─── Load More ─── */
.load-more-wrap { display: flex; justify-content: center; }
.load-more-btn.p-button-outlined {
  border-color: var(--gold) !important;
  color: var(--gold) !important;
  font-family: 'Source Serif 4', serif !important;
  letter-spacing: .05em;
  border-radius: 2px !important;
  padding: .75rem 2rem !important;
  transition: background .25s, color .25s !important;
}
.load-more-btn.p-button-outlined:hover {
  background: var(--gold) !important;
  color: #fff !important;
}

/* ─── Dialog ─── */
.dialog-image {
  width: 100%; height: 260px;
  object-fit: cover;
  border-radius: 2px;
  margin-bottom: 1rem;
}
.dialog-meta {
  display: flex; flex-wrap: wrap; align-items: center; gap: .75rem;
  margin-bottom: 1rem;
  font-size: .82rem; color: #7a6a52;
}
.dialog-meta i { margin-right: .25rem; }
.dialog-text {
  font-size: .95rem; color: #3a2a15;
  line-height: 1.75;
  margin-bottom: 1rem;
  font-family: 'Source Serif 4', serif;
}
</style>