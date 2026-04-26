
<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
import { ref, computed } from 'vue'
import Dialog from 'primevue/dialog'

// ─── State ────────────────────────────────────────────
const activeTab   = ref('all')
const search      = ref('')
const sort        = ref('popular')
const viewMode    = ref('grid')
const page        = ref(1)
const perPage     = 8

const dialogVisible = ref(false)
const selectedBook  = ref(null)

// ─── Tabs ─────────────────────────────────────────────
const tabs = [
  { key: 'all',     label: 'Барлығы'  },
  { key: 'poetry',  label: 'Поэзия'   },
  { key: 'prose',   label: 'Проза'    },
  { key: 'novel',   label: 'Роман'    },
  { key: 'classic', label: 'Классика' },
  { key: 'modern',  label: 'Заманауи' },
]

// ─── Books data ───────────────────────────────────────
const books = ref([
  {
    id: 1, tag: ['classic','prose','novel'],
    title: 'Абай жолы',
    author: 'Мұхтар Әуезов',
    genre: 'Эпопея',
    year: 1942,
    pages: 896,
    rating: 4.9,
    reviews: 3840,
    description: 'Ұлы ақын Абай Құнанбайұлының өмірі мен шығармашылығын суреттейтін эпопея роман. Қазақ прозасының шыңы.',
    cover: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&q=80',
    spineColor: '#8b3a1e',
    badge: { label: '№1 Классика', type: 'gold' },
    saved: false,
    featured: true,
  },
  {
    id: 2, tag: ['classic','poetry'],
    title: 'Өлеңдер мен қарасөздер',
    author: 'Абай Құнанбайұлы',
    genre: 'Поэзия',
    year: 1909,
    pages: 312,
    rating: 4.8,
    reviews: 2910,
    description: 'Ұлы Абайдың лирикалық шығармалары мен философиялық қарасөздерінің жинағы.',
    cover: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=300&q=80',
    spineColor: '#4a5e4c',
    badge: { label: 'Мұра', type: 'rust' },
    saved: false,
  },
  {
    id: 3, tag: ['classic','novel'],
    title: 'Көшпенділер',
    author: 'Ілияс Есенберлин',
    genre: 'Тарихи роман',
    year: 1969,
    pages: 1200,
    rating: 4.7,
    reviews: 2240,
    description: 'Қазақ халқының тарихын суреттейтін үш томдық эпикалық роман. Ұлттық рухты жырлаған шығарма.',
    cover: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300&q=80',
    spineColor: '#2a3a5c',
    badge: null,
    saved: true,
  },
  {
    id: 4, tag: ['poetry','classic'],
    title: 'Өмір — өзен',
    author: 'Мұқағали Мақатаев',
    genre: 'Лирика',
    year: 1974,
    pages: 248,
    rating: 4.9,
    reviews: 3100,
    description: 'Мұқағалидың ең үздік лирикалық туындыларын қамтыған жыр жинағы. Жүрекке жылы тиетін поэзия.',
    cover: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=300&q=80',
    spineColor: '#5c3a1e',
    badge: { label: 'Ұзтаулы', type: 'gold' },
    saved: false,
  },
  {
    id: 5, tag: ['modern','prose'],
    title: 'Боран',
    author: 'Нұрлан Қабылбеков',
    genre: 'Заманауи роман',
    year: 2023,
    pages: 384,
    rating: 4.5,
    reviews: 876,
    description: 'Қазіргі қазақ қоғамының тынысын бейнелейтін психологиялық роман.',
    cover: 'https://images.unsplash.com/photo-1476820865390-c52aeebb9891?w=300&q=80',
    spineColor: '#1a2a3a',
    badge: { label: 'Жаңа', type: 'green' },
    saved: false,
  },
  {
    id: 6, tag: ['classic','prose'],
    title: 'Қаһар',
    author: 'Ғабит Мүсірепов',
    genre: 'Роман',
    year: 1961,
    pages: 440,
    rating: 4.6,
    reviews: 1420,
    description: 'Қазақ халқының тарихи кезеңін шынайы суреттейтін күшті реалистік роман.',
    cover: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=300&q=80',
    spineColor: '#3a2a1e',
    badge: null,
    saved: false,
  },
  {
    id: 7, tag: ['modern','poetry'],
    title: 'Алтын сақа',
    author: 'Ұлжан Бейсенова',
    genre: 'Заманауи поэзия',
    year: 2022,
    pages: 160,
    rating: 4.3,
    reviews: 540,
    description: 'Жас ақынның дебюттік жинағы. Табиғат пен жан дүниесінің тоғысы.',
    cover: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=300&q=80',
    spineColor: '#4a3a0a',
    badge: { label: 'Жаңа дем', type: 'green' },
    saved: false,
  },
  {
    id: 8, tag: ['classic','novel'],
    title: 'Жер қазынасы',
    author: 'Сәбит Мұқанов',
    genre: 'Роман',
    year: 1949,
    pages: 520,
    rating: 4.4,
    reviews: 980,
    description: 'Кеңестік дәуірдегі қазақ даласының өзгерісін суреттейтін кең тынысты шығарма.',
    cover: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=300&q=80',
    spineColor: '#2a4a2a',
    badge: null,
    saved: false,
  },
  {
    id: 9, tag: ['modern','prose'],
    title: 'Таңертеңгі жарық',
    author: 'Дина Мұратқызы',
    genre: 'Повесть',
    year: 2024,
    pages: 220,
    rating: 4.2,
    reviews: 312,
    description: 'Замануи қазақ әйелінің болмысын тереңнен зерттейтін психологиялық повесть.',
    cover: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&q=85',
    spineColor: '#5a2a4a',
    badge: { label: '2024', type: 'green' },
    saved: false,
  },
])

// ─── Featured ─────────────────────────────────────────
const featured = computed(() => books.value.find(b => b.featured))

// ─── Filtered ─────────────────────────────────────────
const filteredBooks = computed(() => {
  let list = books.value.filter(b => !b.featured)

  if (activeTab.value !== 'all')
    list = list.filter(b => b.tag.includes(activeTab.value))

  if (search.value.trim())
    list = list.filter(b =>
        b.title.toLowerCase().includes(search.value.toLowerCase()) ||
        b.author.toLowerCase().includes(search.value.toLowerCase())
    )

  if (sort.value === 'newest')  list = [...list].sort((a,b) => b.year - a.year)
  if (sort.value === 'rating')  list = [...list].sort((a,b) => b.rating - a.rating)
  if (sort.value === 'alpha')   list = [...list].sort((a,b) => a.title.localeCompare(b.title, 'kk'))
  if (sort.value === 'popular') list = [...list].sort((a,b) => b.reviews - a.reviews)

  const start = (page.value - 1) * perPage
  return list.slice(start, start + perPage)
})

const totalPages = computed(() => {
  let list = books.value.filter(b => !b.featured)
  if (activeTab.value !== 'all') list = list.filter(b => b.tag.includes(activeTab.value))
  if (search.value.trim()) list = list.filter(b =>
      b.title.toLowerCase().includes(search.value.toLowerCase()) ||
      b.author.toLowerCase().includes(search.value.toLowerCase())
  )
  return Math.max(1, Math.ceil(list.length / perPage))
})

// ─── Actions ──────────────────────────────────────────
// function openBook(book) { selectedBook.value = book; dialogVisible.value = true }
function openBook(book) {
  router.push({ name: 'book-reader', params: { id: book.id } })
}
function toggleSave(book) { book.saved = !book.saved }
</script>

<template>
  <section class="books-section">

    <!-- ── Section Header ─────────────────────────────── -->
    <div class="section-header">
      <div class="header-ornament">
        <span class="orn-line" /><span class="orn-diamond">◆</span><span class="orn-line" />
      </div>
      <h2 class="section-title">
        <span class="title-kz">Кітаптар</span>
      </h2>
      <p class="section-sub">Қазақ әдебиетінің алтын қорынан таңдаулы шығармалар</p>
    </div>

    <!-- ── Filter Row ──────────────────────────────────── -->
    <div class="filter-row">
      <div class="tabs">
        <button
            v-for="tab in tabs"
            :key="tab.key"
            class="tab-btn"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
        >{{ tab.label }}</button>
      </div>

      <div class="filter-right">
        <div class="search-box">
          <i class="pi pi-search" />
          <input v-model="search" type="text" placeholder="Кітап іздеу…" class="search-input" />
        </div>
        <div class="sort-wrap">
          <select v-model="sort" class="sort-select">
            <option value="popular">Танымал</option>
            <option value="newest">Жаңа</option>
            <option value="alpha">Алфавит</option>
            <option value="rating">Рейтинг</option>
          </select>
          <i class="pi pi-angle-down sort-caret" />
        </div>
        <button
            class="view-toggle"
            :class="{ grid: viewMode === 'grid' }"
            @click="viewMode = viewMode === 'grid' ? 'list' : 'grid'"
            :aria-label="viewMode === 'grid' ? 'Тізім' : 'Тор'"
        >
          <i :class="viewMode === 'grid' ? 'pi pi-list' : 'pi pi-th-large'" />
        </button>
      </div>
    </div>

    <!-- ── Featured Book (hero) ────────────────────────── -->
    <div class="featured-book" v-if="featured">
      <div class="fb-cover-wrap">
        <div class="fb-cover-shadow" />
        <img :src="featured.cover" :alt="featured.title" class="fb-cover" />
        <div class="fb-cover-shine" />
      </div>
      <div class="fb-content">
        <span class="fb-badge">✦ Редакция таңдауы</span>
        <h3 class="fb-title">{{ featured.title }}</h3>
        <p class="fb-author">{{ featured.author }}</p>
        <div class="fb-rating">
          <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= Math.round(featured.rating) }">★</span>
          <span class="rating-num">{{ featured.rating }}</span>
          <span class="rating-count">({{ featured.reviews }} пікір)</span>
        </div>
        <p class="fb-desc">{{ featured.description }}</p>
        <div class="fb-meta">
          <span class="meta-chip"><i class="pi pi-bookmark" /> {{ featured.genre }}</span>
          <span class="meta-chip"><i class="pi pi-calendar" /> {{ featured.year }}</span>
          <span class="meta-chip"><i class="pi pi-file" /> {{ featured.pages }} бет</span>
        </div>
        <div class="fb-actions">
          <button class="btn-read" @click="openBook(featured)">
            <i class="pi pi-book" /> Оқу
          </button>

          <button class="btn-share">
            <i class="pi pi-share-alt" />
          </button>
        </div>
      </div>
    </div>

    <!-- ── Books Grid / List ───────────────────────────── -->
    <transition-group
        :name="viewMode === 'grid' ? 'fade-grid' : 'fade-list'"
        tag="div"
        :class="['books-container', viewMode]"
    >
      <article
          v-for="book in filteredBooks"
          :key="book.id"
          class="book-card"
          :class="viewMode"
          @click="openBook(book)"
      >
        <!-- Grid card -->
        <template v-if="viewMode === 'grid'">
          <div class="book-cover-wrap">
            <div class="book-spine" :style="{ background: book.spineColor }" />
            <img :src="book.cover" :alt="book.title" class="book-cover" />
            <div class="book-cover-overlay">
              <button class="quick-read" @click.stop="openBook(book)">
                <i class="pi pi-book" /> Оқу
              </button>
            </div>

            <span v-if="book.badge" class="book-badge" :class="book.badge.type">{{ book.badge.label }}</span>
          </div>
          <div class="book-info">
            <p class="book-genre">{{ book.genre }}</p>
            <h3 class="book-title">{{ book.title }}</h3>
            <p class="book-author">{{ book.author }}</p>
            <div class="book-rating">
              <span v-for="i in 5" :key="i" class="star-sm" :class="{ filled: i <= Math.round(book.rating) }">★</span>
              <span class="rating-sm">{{ book.rating }}</span>
            </div>
          </div>
        </template>

        <!-- List card -->
        <template v-else>
          <div class="list-cover-wrap">
            <img :src="book.cover" :alt="book.title" class="list-cover" />
            <span v-if="book.badge" class="book-badge list-badge" :class="book.badge.type">{{ book.badge.label }}</span>
          </div>
          <div class="list-body">
            <div class="list-top">
              <span class="book-genre">{{ book.genre }}</span>
              <span class="list-year">{{ book.year }}</span>
            </div>
            <h3 class="list-title">{{ book.title }}</h3>
            <p class="list-author">{{ book.author }}</p>
            <p class="list-desc">{{ book.description }}</p>
            <div class="list-footer">
              <div class="book-rating">
                <span v-for="i in 5" :key="i" class="star-sm" :class="{ filled: i <= Math.round(book.rating) }">★</span>
                <span class="rating-sm">{{ book.rating }}</span>
                <span class="rating-count-sm">({{ book.reviews }})</span>
              </div>
              <div class="list-actions">
                <button class="btn-read-sm" @click.stop="openBook(book)"><i class="pi pi-book" /> Оқу</button>
                <button class="btn-save-sm" @click.stop="toggleSave(book)">
                  <i :class="book.saved ? 'pi pi-bookmark-fill' : 'pi pi-bookmark'" />
                </button>
              </div>
            </div>
          </div>
        </template>
      </article>
    </transition-group>

    <!-- Empty state -->
    <div v-if="filteredBooks.length === 0" class="empty-state">
      <i class="pi pi-search" />
      <p>Кітап табылмады</p>
    </div>

    <!-- ── Pagination ──────────────────────────────────── -->
    <div class="pagination">
      <button class="page-btn" :disabled="page === 1" @click="page--">
        <i class="pi pi-chevron-left" />
      </button>
      <button
          v-for="p in totalPages"
          :key="p"
          class="page-num"
          :class="{ active: p === page }"
          @click="page = p"
      >{{ p }}</button>
      <button class="page-btn" :disabled="page === totalPages" @click="page++">
        <i class="pi pi-chevron-right" />
      </button>
    </div>

    <!-- ── Book Dialog ─────────────────────────────────── -->
    <Dialog
        v-model:visible="dialogVisible"
        :header="selectedBook?.title"
        :style="{ width: '700px', maxWidth: '95vw' }"
        modal
        class="book-dialog"
    >
      <div v-if="selectedBook" class="dialog-body">
        <div class="dialog-top">
          <div class="dialog-cover-wrap">
            <div class="dialog-cover-shadow" />
            <img :src="selectedBook.cover" :alt="selectedBook.title" class="dialog-cover" />
          </div>
          <div class="dialog-info">
            <span class="book-genre">{{ selectedBook.genre }}</span>
            <h3 class="dialog-title">{{ selectedBook.title }}</h3>
            <p class="dialog-author">{{ selectedBook.author }}</p>
            <div class="book-rating" style="margin-bottom:.75rem">
              <span v-for="i in 5" :key="i" class="star-sm" :class="{ filled: i <= Math.round(selectedBook.rating) }">★</span>
              <span class="rating-sm">{{ selectedBook.rating }}</span>
              <span class="rating-count-sm">({{ selectedBook.reviews }} пікір)</span>
            </div>
            <div class="fb-meta">
              <span class="meta-chip"><i class="pi pi-calendar" /> {{ selectedBook.year }}</span>
              <span class="meta-chip"><i class="pi pi-file" /> {{ selectedBook.pages }} бет</span>
            </div>
            <div class="dialog-actions">
              <button class="btn-read">
                <i class="pi pi-book" /> Оқуды бастау
              </button>
              <button class="btn-save" @click="toggleSave(selectedBook)">
                <i :class="selectedBook.saved ? 'pi pi-bookmark-fill' : 'pi pi-bookmark'" />
              </button>
            </div>
          </div>
        </div>
        <div class="dialog-desc-wrap">
          <h4 class="dialog-desc-head">Шығарма туралы</h4>
          <p class="dialog-desc">{{ selectedBook.description }}</p>
          <p class="dialog-desc">
            Бұл шығарма қазақ әдебиетінің алтын қорына кірген туынды болып табылады.
            Автор өз заманының шындығын шебер суреттей отырып, оқырман жүрегіне жол тапты.
          </p>
        </div>
      </div>
    </Dialog>

  </section>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,300&display=swap');

/* ─── Tokens ─── */
.books-section {
  --ink:       #1a1208;
  --parchment: #faf6ef;
  --gold:      #c4922a;
  --gold-l:    #e8b94f;
  --rust:      #8b3a1e;
  --sage:      #4a5e4c;
  --border:    #d9cdb8;
  --shadow:    0 4px 24px rgba(26,18,8,.10);
  --shadow-lg: 0 12px 48px rgba(26,18,8,.18);

  background: var(--parchment);
  padding: 3.5rem 1.5rem;
  max-width: 1280px;
  margin: 0 auto;
  font-family: 'Source Serif 4', Georgia, serif;
}

/* ─── Header ─── */
.section-header { text-align: center; margin-bottom: 2.5rem; }
.header-ornament { display: flex; align-items: center; justify-content: center; gap: .75rem; margin-bottom: 1rem; }
.orn-line { display: block; height: 1px; width: 80px; background: linear-gradient(90deg, transparent, var(--gold)); }
.orn-line:last-child { background: linear-gradient(90deg, var(--gold), transparent); }
.orn-diamond { color: var(--gold); font-size: .7rem; }
.section-title {
  font-family: 'Playfair Display', serif;
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 900; color: var(--ink); margin: 0 0 .5rem; line-height: 1.1;
}
.title-kz { color: var(--ink); }
.title-div { color: var(--gold); margin: 0 .5rem; font-weight: 300; }
.title-ru  { color: var(--rust); font-style: italic; font-weight: 600; font-size: 80%; }
.section-sub { color: #7a6a52; font-size: .95rem; font-style: italic; margin: 0; }

/* ─── Filter Row ─── */
.filter-row {
  display: flex; flex-wrap: wrap; align-items: center;
  justify-content: space-between; gap: 1rem;
  margin-bottom: 2.5rem;
}
.tabs { display: flex; flex-wrap: wrap; gap: .4rem; }
.tab-btn {
  padding: .4rem 1.1rem;
  border: 1.5px solid var(--border);
  border-radius: 2px;
  background: transparent;
  color: #7a6a52;
  font-family: 'Source Serif 4', serif;
  font-size: .82rem;
  cursor: pointer;
  transition: all .22s;
}
.tab-btn:hover { border-color: var(--gold); color: var(--gold); }
.tab-btn.active { background: var(--gold); border-color: var(--gold); color: #fff; font-weight: 600; }

.filter-right { display: flex; align-items: center; gap: .6rem; flex-wrap: wrap; }
.search-box {
  display: flex; align-items: center; gap: .5rem;
  border: 1.5px solid var(--border); border-radius: 2px;
  background: #fff; padding: .4rem .75rem;
  transition: border-color .22s;
}
.search-box:focus-within { border-color: var(--gold); }
.search-box i { color: #b0a090; font-size: .8rem; }
.search-input {
  border: none; outline: none; background: transparent;
  font-family: 'Source Serif 4', serif; font-size: .82rem; color: var(--ink); width: 160px;
}
.search-input::placeholder { color: #b0a090; font-style: italic; }

.sort-wrap { position: relative; }
.sort-select {
  appearance: none;
  border: 1.5px solid var(--border); border-radius: 2px;
  background: #fff; padding: .4rem 2rem .4rem .75rem;
  font-family: 'Source Serif 4', serif; font-size: .82rem; color: var(--ink);
  cursor: pointer; outline: none;
  transition: border-color .22s;
}
.sort-select:focus { border-color: var(--gold); }
.sort-caret { position: absolute; right: .6rem; top: 50%; transform: translateY(-50%); font-size: .7rem; color: #b0a090; pointer-events: none; }

.view-toggle {
  width: 36px; height: 36px;
  border: 1.5px solid var(--border); border-radius: 2px;
  background: #fff; color: #7a6a52;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: .85rem;
  transition: border-color .22s, color .22s;
}
.view-toggle:hover { border-color: var(--gold); color: var(--gold); }

/* ─── Featured Book ─── */
.featured-book {
  display: flex; gap: 3rem; align-items: center;
  background: linear-gradient(135deg, #fff 0%, #fdf8f0 100%);
  border: 1px solid var(--border);
  border-left: 4px solid var(--gold);
  border-radius: 3px;
  padding: 2.5rem;
  margin-bottom: 3rem;
  box-shadow: var(--shadow);
  overflow: hidden;
  position: relative;
}
.featured-book::before {
  content: '';
  position: absolute; top: -40px; right: -40px;
  width: 200px; height: 200px;
  background: radial-gradient(circle, rgba(196,146,42,.08) 0%, transparent 70%);
  pointer-events: none;
}
@media (max-width: 700px) { .featured-book { flex-direction: column; gap: 1.5rem; } }

.fb-cover-wrap {
  flex-shrink: 0; position: relative; width: 180px;
  filter: drop-shadow(8px 12px 24px rgba(26,18,8,.25));
}
.fb-cover-shadow {
  position: absolute; bottom: -8px; left: 8px; right: -8px; top: 8px;
  background: rgba(26,18,8,.15); border-radius: 2px; z-index: 0;
}
.fb-cover {
  position: relative; z-index: 1;
  width: 180px; height: 260px; object-fit: cover; border-radius: 2px;
  transition: transform .4s ease;
}
.featured-book:hover .fb-cover { transform: translateY(-4px) rotate(-1deg); }
.fb-cover-shine {
  position: absolute; top: 0; left: 0; bottom: 0; width: 30px;
  background: linear-gradient(90deg, rgba(255,255,255,.18), transparent);
  border-radius: 2px 0 0 2px; z-index: 2; pointer-events: none;
}

.fb-content { flex: 1; }
.fb-badge {
  display: inline-block;
  font-size: .7rem; font-weight: 700; letter-spacing: .1em;
  text-transform: uppercase; color: var(--gold); background: rgba(196,146,42,.1);
  padding: .2rem .65rem; border-radius: 1px; border: 1px solid rgba(196,146,42,.3);
  margin-bottom: .85rem;
}
.fb-title {
  font-family: 'Playfair Display', serif;
  font-size: clamp(1.5rem, 2.5vw, 2.2rem);
  font-weight: 900; color: var(--ink); margin: 0 0 .3rem; line-height: 1.2;
}
.fb-author { font-size: .95rem; color: var(--rust); font-style: italic; margin: 0 0 .85rem; font-weight: 600; }

.fb-rating { display: flex; align-items: center; gap: .3rem; margin-bottom: 1rem; }
.star { font-size: 1.1rem; color: #d9cdb8; transition: color .2s; }
.star.filled { color: var(--gold); }
.rating-num { font-weight: 700; font-size: .88rem; color: var(--ink); }
.rating-count { font-size: .78rem; color: #9a8a72; }

.fb-desc { font-size: .9rem; color: #5a4a35; line-height: 1.7; margin: 0 0 1.1rem; }

.fb-meta { display: flex; flex-wrap: wrap; gap: .5rem; margin-bottom: 1.5rem; }
.meta-chip {
  display: inline-flex; align-items: center; gap: .35rem;
  font-size: .75rem; color: #7a6a52;
  background: #f5ede0; border: 1px solid var(--border);
  padding: .22rem .65rem; border-radius: 1px;
}
.meta-chip i { font-size: .72rem; color: var(--gold); }

.fb-actions { display: flex; gap: .75rem; flex-wrap: wrap; }
.btn-read {
  display: inline-flex; align-items: center; gap: .5rem;
  background: var(--gold); color: #fff; border: none;
  padding: .65rem 1.5rem; border-radius: 2px;
  font-family: 'Source Serif 4', serif; font-size: .875rem; font-weight: 700;
  cursor: pointer; transition: background .22s;
}
.btn-read:hover { background: var(--gold-l); }
.btn-save {
  display: inline-flex; align-items: center; gap: .5rem;
  background: transparent; color: var(--ink);
  border: 1.5px solid var(--border); padding: .65rem 1.25rem;
  border-radius: 2px; font-family: 'Source Serif 4', serif; font-size: .875rem;
  cursor: pointer; transition: border-color .22s, color .22s;
}
.btn-save:hover { border-color: var(--gold); color: var(--gold); }
.btn-share {
  width: 40px; height: 40px;
  border: 1.5px solid var(--border); border-radius: 2px;
  background: transparent; color: #7a6a52;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: .9rem; transition: border-color .22s, color .22s;
}
.btn-share:hover { border-color: var(--gold); color: var(--gold); }

/* ─── Grid ─── */
.books-container.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.75rem;
  margin-bottom: 2.5rem;
}
.books-container.list {
  display: flex; flex-direction: column; gap: 1.25rem;
  margin-bottom: 2.5rem;
}

/* ─── Grid Card ─── */
.book-card.grid { background: #fff; border: 1px solid var(--border); border-radius: 3px; overflow: hidden; cursor: pointer; transition: transform .3s, box-shadow .3s; }
.book-card.grid:hover { transform: translateY(-6px); box-shadow: var(--shadow-lg); }

.book-cover-wrap { position: relative; height: 260px; overflow: hidden; }
.book-spine {
  position: absolute; left: 0; top: 0; bottom: 0;
  width: 6px; z-index: 2;
}
.book-cover { width: 100%; height: 100%; object-fit: cover; transition: transform .5s; }
.book-card.grid:hover .book-cover { transform: scale(1.05); }

.book-cover-overlay {
  position: absolute; inset: 0; background: rgba(26,18,8,.5);
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity .25s;
}
.book-card.grid:hover .book-cover-overlay { opacity: 1; }
.quick-read {
  display: flex; align-items: center; gap: .4rem;
  background: var(--gold); color: #fff; border: none;
  padding: .55rem 1.1rem; border-radius: 2px;
  font-family: 'Source Serif 4', serif; font-size: .8rem; font-weight: 700;
  cursor: pointer; transition: background .2s;
}
.quick-read:hover { background: var(--gold-l); }

.save-btn {
  position: absolute; top: .65rem; right: .65rem; z-index: 3;
  width: 30px; height: 30px; border-radius: 2px;
  background: rgba(255,255,255,.9); border: none;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: .8rem; color: var(--gold);
  transition: background .2s;
}
.save-btn:hover { background: #fff; }

.book-badge {
  position: absolute; bottom: .65rem; left: .65rem; z-index: 3;
  font-size: .62rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
  padding: .18rem .5rem; border-radius: 1px;
}
.book-badge.gold  { background: var(--gold); color: #fff; }
.book-badge.rust  { background: var(--rust); color: #fff; }
.book-badge.green { background: #4a5e4c; color: #fff; }
.list-badge { position: static; display: inline-block; margin-bottom: .4rem; }

.book-info { padding: 1rem; }
.book-genre { font-size: .67rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--gold); margin: 0 0 .3rem; }
.book-title {
  font-family: 'Playfair Display', serif;
  font-size: 1rem; font-weight: 700; color: var(--ink);
  margin: 0 0 .25rem; line-height: 1.3;
}
.book-author { font-size: .78rem; color: var(--rust); font-style: italic; margin: 0 0 .5rem; }
.book-rating { display: flex; align-items: center; gap: .2rem; }
.star-sm { font-size: .8rem; color: #d9cdb8; }
.star-sm.filled { color: var(--gold); }
.rating-sm { font-size: .75rem; font-weight: 700; color: var(--ink); margin-left: .2rem; }
.rating-count-sm { font-size: .7rem; color: #9a8a72; }

/* ─── List Card ─── */
.book-card.list {
  display: flex; gap: 1.25rem;
  background: #fff; border: 1px solid var(--border); border-radius: 3px;
  overflow: hidden; cursor: pointer;
  transition: transform .25s, box-shadow .25s;
}
.book-card.list:hover { transform: translateX(4px); box-shadow: var(--shadow); }

.list-cover-wrap { flex-shrink: 0; position: relative; width: 100px; }
.list-cover { width: 100%; height: 100%; object-fit: cover; }
.list-body { flex: 1; padding: 1rem 1rem 1rem 0; display: flex; flex-direction: column; }
.list-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: .25rem; }
.list-year { font-size: .72rem; color: #9a8a72; }
.list-title { font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 700; color: var(--ink); margin: 0 0 .2rem; }
.list-author { font-size: .82rem; color: var(--rust); font-style: italic; margin: 0 0 .5rem; }
.list-desc { font-size: .82rem; color: #5a4a35; line-height: 1.6; margin: 0 0 auto; padding-bottom: .75rem; }
.list-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: .5rem; margin-top: .5rem; }
.list-actions { display: flex; gap: .5rem; }
.btn-read-sm {
  display: inline-flex; align-items: center; gap: .35rem;
  background: var(--gold); color: #fff; border: none;
  padding: .4rem .9rem; border-radius: 2px;
  font-family: 'Source Serif 4', serif; font-size: .78rem; font-weight: 700;
  cursor: pointer; transition: background .2s;
}
.btn-read-sm:hover { background: var(--gold-l); }
.btn-save-sm {
  width: 32px; height: 32px;
  border: 1.5px solid var(--border); border-radius: 2px;
  background: transparent; color: var(--gold);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: .8rem; transition: border-color .2s;
}
.btn-save-sm:hover { border-color: var(--gold); }

/* ─── Empty ─── */
.empty-state {
  text-align: center; padding: 3rem;
  color: #9a8a72; font-style: italic;
}
.empty-state i { font-size: 2rem; display: block; margin-bottom: .75rem; color: var(--border); }

/* ─── Pagination ─── */
.pagination { display: flex; align-items: center; justify-content: center; gap: .4rem; margin-top: .5rem; }
.page-btn {
  width: 36px; height: 36px;
  border: 1.5px solid var(--border); border-radius: 2px;
  background: #fff; color: #7a6a52;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: .8rem; transition: border-color .2s, color .2s;
}
.page-btn:hover:not(:disabled) { border-color: var(--gold); color: var(--gold); }
.page-btn:disabled { opacity: .35; cursor: not-allowed; }
.page-num {
  width: 36px; height: 36px;
  border: 1.5px solid var(--border); border-radius: 2px;
  background: #fff; color: #7a6a52;
  font-family: 'Source Serif 4', serif; font-size: .82rem;
  cursor: pointer; transition: all .2s;
}
.page-num:hover { border-color: var(--gold); color: var(--gold); }
.page-num.active { background: var(--gold); border-color: var(--gold); color: #fff; font-weight: 700; }

/* ─── Dialog ─── */
.dialog-top { display: flex; gap: 1.75rem; margin-bottom: 1.5rem; }
@media (max-width: 500px) { .dialog-top { flex-direction: column; } }
.dialog-cover-wrap { flex-shrink: 0; position: relative; }
.dialog-cover-shadow {
  position: absolute; bottom: -6px; left: 6px; right: -6px; top: 6px;
  background: rgba(26,18,8,.15); border-radius: 2px;
}
.dialog-cover {
  position: relative; z-index: 1;
  width: 140px; height: 200px; object-fit: cover; border-radius: 2px;
}
.dialog-info { flex: 1; }
.dialog-title { font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 900; color: var(--ink); margin: .35rem 0 .25rem; }
.dialog-author { font-size: .9rem; color: var(--rust); font-style: italic; margin: 0 0 .75rem; }
.dialog-actions { display: flex; gap: .6rem; margin-top: 1rem; flex-wrap: wrap; }
.dialog-desc-wrap { border-top: 1px solid var(--border); padding-top: 1.1rem; }
.dialog-desc-head { font-family: 'Playfair Display', serif; font-size: .95rem; font-weight: 700; color: var(--gold); margin: 0 0 .65rem; letter-spacing: .05em; }
.dialog-desc { font-size: .875rem; color: #5a4a35; line-height: 1.75; margin: 0 0 .75rem; }

/* ─── Transitions ─── */
.fade-grid-enter-active, .fade-grid-leave-active { transition: opacity .3s, transform .3s; }
.fade-grid-enter-from, .fade-grid-leave-to { opacity: 0; transform: scale(.96); }
.fade-list-enter-active, .fade-list-leave-active { transition: opacity .25s; }
.fade-list-enter-from, .fade-list-leave-to { opacity: 0; }
</style>