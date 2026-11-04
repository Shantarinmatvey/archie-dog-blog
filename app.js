/**
 * ============================================================================
 * РЭДЖИ ЗОЛОТОЕ СЕРДЦЕ 🐾 — SPA С ОБЛАЧНОЙ СИНХРОНИЗАЦИЕЙ (FIREBASE REALTIME DB)
 * ============================================================================
 * - База данных: https://blog-site-50c99-default-rtdb.firebaseio.com/
 * - Мгновенная синхронизация между смартфоном, ПК и любыми устройствами
 * - Инстаграм-карусель для альбомов с поддержкой свайпов
 * - Интерактивная реакция «Дай лапу!» со счётчиком, начинающимся с нуля
 * - Настоящие комментарии читателей в реальном времени
 * ============================================================================
 */

(function () {
  'use strict';

  // --- НАСТРОЙКИ ОБЛАЧНОЙ БАЗЫ ДАННЫХ (FIREBASE) ---
  const FIREBASE_BASE_URL = 'https://blog-site-50c99-default-rtdb.firebaseio.com';

  const STORAGE_KEYS = {
    POSTS_CACHE: 'reggie_blog_posts_cache_v5',
    PROFILE_CACHE: 'reggie_blog_profile_cache_v5',
    LIKED_POSTS: 'reggie_blog_liked_ids_v5'
  };

  // Исходные посты фотодневника (все счётчики лапок с нуля, без заглушек)
  const DEFAULT_POSTS = [
    {
      id: 'reggie-post-01',
      media: [
        { type: 'photo', url: 'assets/reggie/reggie-snow.jpg' }
      ],
      text: 'Официально заявляю: свежий снег на вкус — 10 из 10! ❄️🐾 Проинспектировал первый сугроб, зарылся носом до самого дна и собрал коллекцию идеальных снежинок прямо на усах. Зима, я готов к сугробам!',
      likes: 0,
      createdAt: '2026-11-04T16:00:00.000Z',
      comments: []
    },
    {
      id: 'reggie-post-02',
      media: [
        { type: 'photo', url: 'assets/reggie/reggie-portrait.jpg' }
      ],
      text: 'Тот самый фирменный взгляд, когда услышал шуршание пакета с сыром за три комнаты от кухни 🧀✨ Говорят, золотистые ретриверы умеют улыбаться глазами. Ну правда же, как можно отказать этому взгляду?',
      likes: 0,
      createdAt: '2026-11-02T13:20:00.000Z',
      comments: []
    },
    {
      id: 'reggie-post-03',
      media: [
        { type: 'photo', url: 'assets/reggie/reggie-car-copilot.jpg' },
        { type: 'photo', url: 'assets/reggie/reggie-car-sunlight.jpg' },
        { type: 'photo', url: 'assets/reggie/reggie-car-sleepy.jpg' }
      ],
      text: 'Хроники автопутешествий Рэджи 🚗💨 Листайте карусель:\n1️⃣ Главный штурман контролирует маршрут строго между сиденьями.\n2️⃣ Ловлю тёплые лучи солнца и кайфую от скорости.\n3️⃣ Полный собачий дзен и релакс в гамаке — когда укачало под любимую музыку.',
      likes: 0,
      createdAt: '2026-10-26T11:15:00.000Z',
      comments: []
    },
    {
      id: 'reggie-post-04',
      media: [
        { type: 'photo', url: 'assets/reggie/reggie-blue-hood.jpg' }
      ],
      text: 'Сказали, на улице осенний ветер, поэтому экипировали по последнему слову собачьей моды 🧢💙 Теперь я похож то ли на космонавта, то ли на стильного сибирского хаски. Зато уши в тепле и комфорте!',
      likes: 0,
      createdAt: '2026-10-18T17:40:00.000Z',
      comments: []
    },
    {
      id: 'reggie-post-05',
      media: [
        { type: 'photo', url: 'assets/reggie/reggie-window.jpg' }
      ],
      text: 'Минутка собачьей философии у вечернего окна 🪟🌙 Подбородок в надёжной руке Человека, за стеклом зажигаются городские огни, а дома пахнет ужином и уютом. Золотое сердце бьётся в ритме спокойствия.',
      likes: 0,
      createdAt: '2026-10-10T19:25:00.000Z',
      comments: []
    },
    {
      id: 'reggie-post-06',
      media: [
        { type: 'photo', url: 'assets/reggie/reggie-birthday.jpg' }
      ],
      text: 'Праздничный день и любимый торт! 🎂🎉 Самый вкусный тортик с нашей совместной фотографией и кучей сердечек. Бесконечные игры, погони за бабочками, искренняя любовь и счастливые виляния хвостом!',
      likes: 0,
      createdAt: '2026-09-30T15:00:00.000Z',
      comments: []
    },
    {
      id: 'reggie-post-07',
      media: [
        { type: 'photo', url: 'assets/reggie/reggie-beavers.jpg' }
      ],
      text: 'Провёл важные дипломатические переговоры с местными бобрами у лесного ручья 🪵🦫 Подошёл на цыпочках, осторожно обнюхал — пахнут сосной, ведут себя подозрительно неподвижно. Проверка пройдена, территория под контролем!',
      likes: 0,
      createdAt: '2026-09-15T13:30:00.000Z',
      comments: []
    },
    {
      id: 'reggie-post-08',
      media: [
        { type: 'photo', url: 'assets/reggie/reggie-bears.jpg' }
      ],
      text: 'Ночная сказка в парке ✨🐻 Встретили целое семейство светящихся белых медведей! Решил не лаять, а гордо сесть рядом для фото — показать, кто здесь самый дружелюбный великан с золотым сердцем.',
      likes: 0,
      createdAt: '2026-08-28T21:45:00.000Z',
      comments: []
    },
    {
      id: 'reggie-post-09',
      media: [
        { type: 'photo', url: 'assets/reggie/reggie-forest.jpg' }
      ],
      text: 'Летняя экспедиция в сосновый бор 🌲🌾 Солнце, птичьи трели, аромат клевера и мой любимый Человек рядом. Набегался так, что язык еле помещается во рту — вот оно, абсолютное собачье счастье!',
      likes: 0,
      createdAt: '2026-08-10T10:45:00.000Z',
      comments: []
    },
    {
      id: 'reggie-post-10',
      media: [
        { type: 'photo', url: 'assets/reggie/reggie-twilight.jpg' }
      ],
      text: 'Вечерний час тишины 🌅 Розовый закат, прохладная трава и мой стильный ошейник. Люблю после активных догонялок просто лечь на поляне и слушать, как засыпает вечерний парк.',
      likes: 0,
      createdAt: '2026-07-22T21:10:00.000Z',
      comments: []
    },
    {
      id: 'reggie-post-11',
      media: [
        { type: 'photo', url: 'assets/reggie/reggie-walk.jpg' }
      ],
      text: 'Бодрый утренний шаг! ☀️🐾 Уши назад, хвост трубой, поводок натянут ровно настолько, чтобы успевать исследовать каждый встречный куст. Всем пушистого, бодрого и радостного дня!',
      likes: 0,
      createdAt: '2026-07-05T09:20:00.000Z',
      comments: []
    }
  ];

  const DEFAULT_PROFILE = {
    name: 'Рэджи',
    breed: 'Золотистый ретривер',
    status: 'Любитель автопутешествий, снежных сугробов и бесконечных обнимашек 🦴🌾💛',
    avatarUrl: 'assets/avatar.jpg'
  };

  // --- СОСТОЯНИЕ (STATE) ---
  const state = {
    posts: [],
    profile: { ...DEFAULT_PROFILE },
    likedPostIds: new Set(),
    activeFilter: 'all', // 'all' | 'liked'
    isSyncing: false,
    lastSyncHash: ''
  };

  // --- DOM ЭЛЕМЕНТЫ ---
  const DOM = {
    header: document.querySelector('.site-header'),
    logoLink: document.getElementById('logoLink'),
    navLinks: document.querySelectorAll('.nav-link'),

    // Hero Profile
    profileAvatarImg: document.getElementById('profileAvatarImg'),
    profileName: document.getElementById('profileName'),
    profileBreed: document.getElementById('profileBreed'),
    profileStatus: document.getElementById('profileStatus'),
    statPostsCount: document.getElementById('statPostsCount'),
    statLikesCount: document.getElementById('statLikesCount'),

    // Feed & Filters
    filterTabs: document.querySelectorAll('.filter-tab'),
    countAll: document.getElementById('countAll'),
    countLiked: document.getElementById('countLiked'),
    feedContainer: document.getElementById('feedContainer'),
    feedEmptyState: document.getElementById('feedEmptyState'),
    emptyStateDesc: document.getElementById('emptyStateDesc'),
    emptyStateResetBtn: document.getElementById('emptyStateResetBtn'),

    // Lightbox
    lightboxOverlay: document.getElementById('lightboxOverlay'),
    lightboxImg: document.getElementById('lightboxImg'),
    lightboxCaption: document.getElementById('lightboxCaption'),
    lightboxCloseBtn: document.getElementById('lightboxCloseBtn')
  };

  // ==========================================================================
  // 1. ОБЛАЧНАЯ СИНХРОНИЗАЦИЯ (FIREBASE REST API)
  // ==========================================================================

  function normalizePostMedia(post) {
    if (!post || typeof post !== 'object') return null;

    if (!Array.isArray(post.media)) {
      if (post.mediaUrl) {
        post.media = [
          {
            type: 'photo',
            url: post.mediaUrl,
            fallbackUrl: post.fallbackMediaUrl
          }
        ];
      } else {
        post.media = [];
      }
    }

    // Нормализуем каждый медиафайл внутри поста (только фото)
    post.media = post.media.filter(Boolean).map(m => {
      if (typeof m === 'string') {
        return { type: 'photo', url: m };
      }
      return {
        type: 'photo',
        url: m.url || '',
        fallbackUrl: m.fallbackUrl || '',
        name: m.name || ''
      };
    });

    if (!Array.isArray(post.comments)) {
      post.comments = [];
    }
    if (typeof post.likes !== 'number' || post.likes < 0) {
      post.likes = 0;
    }
    if (typeof post.text !== 'string') {
      post.text = post.text ? String(post.text) : '';
    }
    if (!post.createdAt) {
      post.createdAt = new Date().toISOString();
    }
    if (!post.id) {
      post.id = 'post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }

    return post;
  }

  // Загрузка постов из Firebase
  async function fetchCloudPosts() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${FIREBASE_BASE_URL}/posts.json`, {
        cache: 'no-cache',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data) return null;

      let rawPosts = [];
      if (Array.isArray(data)) {
        rawPosts = data.filter(Boolean);
      } else if (typeof data === 'object') {
        rawPosts = Object.values(data).filter(Boolean);
      }

      const normalized = rawPosts.map(normalizePostMedia).filter(Boolean);
      normalized.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return normalized;
    } catch (err) {
      console.warn('Ошибка связи с Firebase:', err);
      return null;
    }
  }

  // Сохранение постов в Firebase
  async function saveCloudPosts(posts) {
    try {
      try {
        localStorage.setItem(STORAGE_KEYS.POSTS_CACHE, JSON.stringify(posts));
      } catch (e) {
        console.warn('Кэш localStorage недоступен:', e);
      }

      const res = await fetch(`${FIREBASE_BASE_URL}/posts.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(posts)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return true;
    } catch (err) {
      console.error('Ошибка сохранения постов в Firebase:', err);
      return false;
    }
  }

  // Загрузка профиля из Firebase
  async function fetchCloudProfile() {
    try {
      const res = await fetch(`${FIREBASE_BASE_URL}/profile.json`, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data ? Object.assign({}, DEFAULT_PROFILE, data) : null;
    } catch (err) {
      return null;
    }
  }

  // Синхронизация данных
  async function syncDataWithCloud(isInitial = false) {
    if (state.isSyncing) return;
    state.isSyncing = true;

    try {
      const cloudPosts = await fetchCloudPosts();
      const cloudProfile = await fetchCloudProfile();

      let postsToUse = cloudPosts;
      if (!postsToUse || postsToUse.length === 0) {
        postsToUse = JSON.parse(JSON.stringify(DEFAULT_POSTS)).map(normalizePostMedia);
        postsToUse.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        await saveCloudPosts(postsToUse);
      }

      if (cloudProfile) {
        // Убеждаемся, что возраст удален
        delete cloudProfile.age;
        state.profile = Object.assign({}, DEFAULT_PROFILE, cloudProfile);
      }

      postsToUse.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      const currentHash = JSON.stringify(postsToUse.map(p => ({ id: p.id, likes: p.likes, c: (p.comments || []).length })));
      if (currentHash !== state.lastSyncHash || isInitial) {
        state.posts = postsToUse;
        state.lastSyncHash = currentHash;
        renderProfile();
        renderFeed();
      }
    } catch (err) {
      console.warn('Синхронизация временно недоступна, работаем с локальными данными:', err);
    } finally {
      state.isSyncing = false;
    }
  }

  // ==========================================================================
  // 2. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ И ОТОБРАЖЕНИЕ
  // ==========================================================================

  function formatDate(isoString) {
    if (!isoString) return 'Только что';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return 'Только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) {
      const isToday = now.toDateString() === date.toDateString();
      const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      return isToday ? `Сегодня, ${timeStr}` : `Вчера, ${timeStr}`;
    }

    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderProfile() {
    if (DOM.profileName) DOM.profileName.textContent = state.profile.name;
    if (DOM.profileBreed) DOM.profileBreed.textContent = state.profile.breed || 'Золотистый ретривер';
    if (DOM.profileStatus) DOM.profileStatus.textContent = state.profile.status;
    if (DOM.profileAvatarImg) DOM.profileAvatarImg.src = state.profile.avatarUrl;

    updateCounters();
  }

  function updateCounters() {
    const totalPosts = state.posts.length;
    const totalLikes = state.posts.reduce((sum, p) => sum + (p.likes || 0), 0);
    const likedCount = state.likedPostIds.size;

    if (DOM.statPostsCount) DOM.statPostsCount.textContent = totalPosts;
    if (DOM.statLikesCount) {
      if (totalLikes >= 1000) {
        DOM.statLikesCount.textContent = (totalLikes / 1000).toFixed(1).replace('.0', '') + 'k';
      } else {
        DOM.statLikesCount.textContent = totalLikes;
      }
    }

    if (DOM.countAll) DOM.countAll.textContent = totalPosts;
    if (DOM.countLiked) DOM.countLiked.textContent = likedCount;
  }

  // ==========================================================================
  // 3. ОТРИСОВКА ЛЕНТЫ ПУБЛИКАЦИЙ
  // ==========================================================================

  function getFilteredPosts() {
    return state.posts.filter(post => {
      if (state.activeFilter === 'liked') {
        return state.likedPostIds.has(post.id);
      }
      return true;
    });
  }

  function renderFeed() {
    updateCounters();
    const filtered = getFilteredPosts();

    DOM.feedContainer.innerHTML = '';

    if (filtered.length === 0) {
      DOM.feedContainer.style.display = 'none';
      DOM.feedEmptyState.style.display = 'block';

      if (state.activeFilter === 'liked') {
        DOM.emptyStateDesc.textContent = 'Вы еще не поставили ни одной лапки 🐾 Нажмите «Дай лапу!» под любой историей Рэджи.';
      } else {
        DOM.emptyStateDesc.textContent = 'В дневнике пока нет записей.';
      }
      return;
    }

    DOM.feedContainer.style.display = '';
    DOM.feedEmptyState.style.display = 'none';

    filtered.forEach(post => {
      try {
        const card = createPostCardElement(post);
        if (card) {
          DOM.feedContainer.appendChild(card);
        }
      } catch (err) {
        console.error('Ошибка при создании карточки поста:', post?.id, err);
      }
    });
  }

  function createPostCardElement(post) {
    if (!post || typeof post !== 'object') return null;

    const card = document.createElement('article');
    card.className = 'post-card';
    card.dataset.postId = post.id || '';

    const isLiked = state.likedPostIds.has(post.id);
    const commentsCount = (post.comments || []).length;
    const mediaList = Array.isArray(post.media) ? post.media : [];

    const typeLabel = mediaList.length > 1 ? `📸 Альбом (${mediaList.length})` : '📸 Фото';

    let mediaHtml = '';
    if (mediaList.length > 1) {
      mediaHtml = createCarouselHtml(post.id, mediaList, post.text);
    } else if (mediaList.length === 1 && mediaList[0]) {
      mediaHtml = createSingleMediaHtml(post.id, mediaList[0], post.text);
    }

    const commentsListHtml = (post.comments || []).map(c => `
      <div class="comment-item">
        <div class="comment-author-avatar">${escapeHtml(c.author ? c.author.charAt(0).toUpperCase() : '🐾')}</div>
        <div class="comment-bubble">
          <div class="comment-author-row">
            <span class="comment-author-name">${escapeHtml(c.author || 'Друг Рэджи')}</span>
            <span class="comment-time">${formatDate(c.createdAt)}</span>
          </div>
          <div class="comment-text">${escapeHtml(c.text)}</div>
        </div>
      </div>
    `).join('');

    card.innerHTML = `
      <header class="post-card-header">
        <div class="post-author-info">
          <img 
            src="${escapeHtml(state.profile.avatarUrl)}" 
            alt="${escapeHtml(state.profile.name)}" 
            class="post-author-avatar"
            onerror="this.src='assets/avatar.jpg'"
          >
          <div class="post-author-meta">
            <span class="post-author-name">${escapeHtml(state.profile.name)}</span>
            <time class="post-date" datetime="${post.createdAt || ''}">${formatDate(post.createdAt)}</time>
          </div>
        </div>
        <div class="post-header-actions">
          <span class="post-type-tag">${typeLabel}</span>
        </div>
      </header>

      ${mediaHtml}

      <div class="post-body">
        <p class="post-story-text">${escapeHtml(post.text || '')}</p>
      </div>

      <footer class="post-actions-bar">
        <button type="button" class="like-reaction-btn ${isLiked ? 'liked' : ''}" data-action="like-post" title="Дай лапу!">
          <span class="like-paw-icon">🐾</span>
          <span class="like-btn-text">${isLiked ? 'Лапа дана!' : 'Дай лапу!'}</span>
          <span class="like-counter">(${post.likes || 0})</span>
        </button>

        <button type="button" class="comments-toggle-btn" data-action="toggle-comments" title="Открыть комментарии">
          <span>💬</span>
          <span class="comments-btn-label">Комментировать (${commentsCount})</span>
        </button>
      </footer>

      <div class="comments-drawer" id="comments-${post.id}">
        <div class="comments-list">
          ${commentsListHtml.length > 0 ? commentsListHtml : '<div class="comment-empty" style="color:var(--color-text-light);font-size:0.85rem;padding:4px 0;">Пока нет комментариев. Будьте первыми! ✨</div>'}
        </div>
        <form class="comment-form" data-post-id="${post.id}">
          <input 
            type="text" 
            class="comment-input" 
            placeholder="Напишите доброе слово..." 
            required 
            maxlength="240"
          >
          <button type="submit" class="btn-send-comment">Отправить</button>
        </form>
      </div>
    `;

    if (mediaList.length > 1) {
      try {
        const carousel = card.querySelector('.post-carousel-container');
        if (carousel) initPostCarousel(carousel);
      } catch (carouselErr) {
        console.warn('Ошибка инициализации карусели:', carouselErr);
      }
    }

    return card;
  }

  // ==========================================================================
  // 4. ИНСТАГРАМ-КАРУСЕЛЬ МЕДИА В ПОСТАХ
  // ==========================================================================

  function createCarouselHtml(postId, mediaList, caption) {
    const total = mediaList.length;

    const slidesHtml = mediaList.map((m, index) => `
      <div class="carousel-slide" data-slide-index="${index}">
        <img 
          src="${escapeHtml(m.url)}" 
          alt="Фотография" 
          class="carousel-slide-photo" 
          loading="lazy"
          data-lightbox-src="${escapeHtml(m.url)}" 
          data-lightbox-caption="${escapeHtml(caption)}"
          onerror="if(this.src!=='${m.fallbackUrl || ''}') this.src='${m.fallbackUrl || ''}';"
        >
      </div>
    `).join('');

    const dotsHtml = mediaList.map((_, i) => `<span class="carousel-dot ${i === 0 ? 'active' : ''}"></span>`).join('');

    return `
      <div class="post-carousel-container" data-post-id="${postId}">
        <div class="carousel-counter-badge">1 / ${total}</div>
        <div class="carousel-track">
          ${slidesHtml}
        </div>
        <button type="button" class="carousel-nav-btn carousel-prev-btn" style="display: none;" title="Предыдущее">‹</button>
        <button type="button" class="carousel-nav-btn carousel-next-btn" title="Следующее">›</button>
        <div class="carousel-dots">
          ${dotsHtml}
        </div>
      </div>
    `;
  }

  function initPostCarousel(container) {
    if (!container) return;

    const track = container.querySelector('.carousel-track');
    const slides = container.querySelectorAll('.carousel-slide');
    if (!track || !slides || slides.length === 0) return;

    const prevBtn = container.querySelector('.carousel-prev-btn');
    const nextBtn = container.querySelector('.carousel-next-btn');
    const counterBadge = container.querySelector('.carousel-counter-badge');
    const dots = container.querySelectorAll('.carousel-dot');
    const total = slides.length;

    let currentIndex = 0;

    function updateCarousel() {
      if (track) track.style.transform = `translateX(-${currentIndex * 100}%)`;

      if (counterBadge) counterBadge.textContent = `${currentIndex + 1} / ${total}`;
      if (prevBtn) prevBtn.style.display = currentIndex === 0 ? 'none' : 'flex';
      if (nextBtn) nextBtn.style.display = currentIndex === total - 1 ? 'none' : 'flex';

      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentIndex);
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentIndex > 0) {
          currentIndex--;
          updateCarousel();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentIndex < total - 1) {
          currentIndex++;
          updateCarousel();
        }
      });
    }

    // Touch Swipe
    let touchStartX = 0;
    let touchEndX = 0;

    container.addEventListener('touchstart', (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        touchStartX = e.changedTouches[0].screenX;
      }
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      if (!e.changedTouches || !e.changedTouches[0]) return;
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchEndX - touchStartX;
      if (Math.abs(diff) > 40) {
        if (diff < 0 && currentIndex < total - 1) {
          currentIndex++;
          updateCarousel();
        } else if (diff > 0 && currentIndex > 0) {
          currentIndex--;
          updateCarousel();
        }
      }
    }, { passive: true });
  }

  function createSingleMediaHtml(postId, media, caption) {
    return `
      <div class="post-media-wrap" data-lightbox-src="${escapeHtml(media.url)}" data-lightbox-caption="${escapeHtml(caption)}">
        <img 
          src="${escapeHtml(media.url)}" 
          alt="Фотография Рэджи" 
          class="post-photo-img" 
          loading="lazy"
          onerror="if(this.src!=='${media.fallbackUrl || ''}') this.src='${media.fallbackUrl || ''}';"
        >
      </div>
    `;
  }

  // ==========================================================================
  // 5. РЕАКЦИИ И КОММЕНТАРИИ
  // ==========================================================================

  function triggerPawBurst(buttonElement) {
    const pawIcons = ['🐾', '🐾', '🦴', '✨', '🐾'];
    const rect = buttonElement.getBoundingClientRect();

    pawIcons.forEach((icon, i) => {
      const paw = document.createElement('span');
      paw.className = 'floating-paw';
      paw.textContent = icon;
      const randomX = (Math.random() - 0.5) * 40;
      paw.style.left = `${(rect.width / 2) + randomX}px`;
      paw.style.top = `-10px`;
      paw.style.animationDelay = `${i * 0.08}s`;
      buttonElement.appendChild(paw);
      setTimeout(() => paw.remove(), 1000);
    });
  }

  async function handlePostLike(postId, buttonElement) {
    const post = state.posts.find(p => p.id === postId);
    if (!post) return;

    const isCurrentlyLiked = state.likedPostIds.has(postId);

    if (isCurrentlyLiked) {
      state.likedPostIds.delete(postId);
      post.likes = Math.max(0, (post.likes || 1) - 1);
      buttonElement.classList.remove('liked');
      buttonElement.querySelector('.like-btn-text').textContent = 'Дай лапу!';
    } else {
      state.likedPostIds.add(postId);
      post.likes = (post.likes || 0) + 1;
      buttonElement.classList.add('liked');
      buttonElement.querySelector('.like-btn-text').textContent = 'Лапа дана!';
      triggerPawBurst(buttonElement);
    }

    buttonElement.querySelector('.like-counter').textContent = `(${post.likes})`;
    localStorage.setItem(STORAGE_KEYS.LIKED_POSTS, JSON.stringify(Array.from(state.likedPostIds)));
    updateCounters();

    // Синхронизируем счётчик лайков с Firebase
    await saveCloudPosts(state.posts);
  }

  function toggleCommentsDrawer(postId, card) {
    const drawer = card.querySelector(`#comments-${postId}`);
    if (!drawer) return;
    drawer.classList.toggle('open');
    if (drawer.classList.contains('open')) {
      const input = drawer.querySelector('.comment-input');
      if (input) setTimeout(() => input.focus(), 150);
    }
  }

  async function handleAddComment(postId, formElement) {
    const input = formElement.querySelector('.comment-input');
    const commentText = input.value.trim();
    if (!commentText) return;

    const post = state.posts.find(p => p.id === postId);
    if (!post) return;

    if (!post.comments) post.comments = [];
    const authorName = localStorage.getItem('reggie_commenter_name') || 'Друг Рэджи';

    const newComment = {
      id: 'c_' + Date.now(),
      author: authorName,
      text: commentText,
      createdAt: new Date().toISOString()
    };

    post.comments.push(newComment);

    const drawer = formElement.closest('.comments-drawer');
    const list = drawer.querySelector('.comments-list');
    const emptyNotice = list.querySelector('.comment-empty');
    if (emptyNotice) emptyNotice.remove();

    const commentNode = document.createElement('div');
    commentNode.className = 'comment-item';
    commentNode.innerHTML = `
      <div class="comment-author-avatar">${escapeHtml(authorName.charAt(0).toUpperCase())}</div>
      <div class="comment-bubble">
        <div class="comment-author-row">
          <span class="comment-author-name">${escapeHtml(authorName)}</span>
          <span class="comment-time">Только что</span>
        </div>
        <div class="comment-text">${escapeHtml(newComment.text)}</div>
      </div>
    `;
    list.appendChild(commentNode);

    input.value = '';
    const toggleBtn = formElement.closest('.post-card').querySelector('.comments-btn-label');
    if (toggleBtn) toggleBtn.textContent = `Комментировать (${post.comments.length})`;

    // Сохраняем комментарии в Firebase
    await saveCloudPosts(state.posts);
  }

  // ==========================================================================
  // 6. ФИЛЬТРАЦИЯ И НАВИГАЦИЯ
  // ==========================================================================

  DOM.filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      DOM.filterTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      state.activeFilter = tab.dataset.filter;
      renderFeed();
    });
  });

  DOM.navLinks.forEach(link => {
    link.addEventListener('click', () => {
      DOM.navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      const action = link.dataset.action;
      state.activeFilter = action;
      DOM.filterTabs.forEach(t => t.classList.toggle('active', t.dataset.filter === action));
      renderFeed();
      DOM.feedContainer.scrollIntoView({ behavior: 'smooth' });
    });
  });

  DOM.logoLink.addEventListener('click', (e) => {
    e.preventDefault();
    state.activeFilter = 'all';
    DOM.filterTabs.forEach(t => t.classList.toggle('active', t.dataset.filter === 'all'));
    renderFeed();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  DOM.emptyStateResetBtn.addEventListener('click', () => {
    state.activeFilter = 'all';
    DOM.filterTabs.forEach(t => t.classList.toggle('active', t.dataset.filter === 'all'));
    renderFeed();
  });

  // ==========================================================================
  // 7. ДЕЛЕГИРОВАНИЕ СОБЫТИЙ В ЛЕНТЕ
  // ==========================================================================

  DOM.feedContainer.addEventListener('click', (e) => {
    const card = e.target.closest('.post-card');
    if (!card) return;
    const postId = card.dataset.postId;

    const likeBtn = e.target.closest('[data-action="like-post"]');
    if (likeBtn) {
      e.stopPropagation();
      handlePostLike(postId, likeBtn);
      return;
    }

    const commentsToggleBtn = e.target.closest('[data-action="toggle-comments"]');
    if (commentsToggleBtn) {
      e.stopPropagation();
      toggleCommentsDrawer(postId, card);
      return;
    }

    const mediaImg = e.target.closest('[data-lightbox-src]');
    if (mediaImg) {
      const src = mediaImg.dataset.lightboxSrc;
      const caption = mediaImg.dataset.lightboxCaption || '';
      openLightbox(src, caption);
      return;
    }
  });

  DOM.feedContainer.addEventListener('submit', (e) => {
    const commentForm = e.target.closest('.comment-form');
    if (commentForm) {
      e.preventDefault();
      const postId = commentForm.dataset.postId;
      handleAddComment(postId, commentForm);
    }
  });

  // ==========================================================================
  // 8. ПОЛНОЭКРАННЫЙ LIGHTBOX
  // ==========================================================================

  function openLightbox(src, caption) {
    DOM.lightboxImg.src = src;
    DOM.lightboxCaption.textContent = caption;
    DOM.lightboxOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    DOM.lightboxOverlay.style.display = 'none';
    DOM.lightboxImg.src = '';
    DOM.lightboxCaption.textContent = '';
    document.body.style.overflow = '';
  }

  DOM.lightboxCloseBtn.addEventListener('click', closeLightbox);
  DOM.lightboxOverlay.addEventListener('click', (e) => {
    if (e.target === DOM.lightboxOverlay) closeLightbox();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (DOM.lightboxOverlay.style.display === 'flex') {
        closeLightbox();
      }
    }
  });

  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      DOM.header.classList.add('scrolled');
    } else {
      DOM.header.classList.remove('scrolled');
    }
  }, { passive: true });

  // ==========================================================================
  // 9. ЗАПУСК И ФОНОВОЕ АВТООБНОВЛЕНИЕ
  // ==========================================================================

  async function initApp() {
    // 1. Быстро загружаем сохраненные лайки пользователя
    const cachedLiked = localStorage.getItem(STORAGE_KEYS.LIKED_POSTS);
    if (cachedLiked) {
      try { state.likedPostIds = new Set(JSON.parse(cachedLiked)); } catch (e) {}
    }

    // 2. Быстро загружаем кэш для мгновенной отрисовки без задержек
    const cachedPosts = localStorage.getItem(STORAGE_KEYS.POSTS_CACHE);
    if (cachedPosts) {
      try {
        const parsed = JSON.parse(cachedPosts);
        if (Array.isArray(parsed)) {
          state.posts = parsed.filter(Boolean).map(normalizePostMedia).filter(Boolean);
          state.posts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          renderProfile();
          renderFeed();
        }
      } catch (e) {}
    }

    // 3. Синхронизируем с Firebase в реальном времени
    await syncDataWithCloud(true);

    // 4. Фоновое обновление: каждые 10 секунд опрашиваем облако для синхронизации лапок и комментариев
    setInterval(() => {
      syncDataWithCloud(false);
    }, 10000);

    // 5. При возвращении на вкладку браузера сразу проверяем обновления
    window.addEventListener('focus', () => {
      syncDataWithCloud(false);
    });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        syncDataWithCloud(false);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
