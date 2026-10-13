/**
 * ============================================================================
 * ДНЕВНИК АРЧИ 🐾 — ПОЛНОФУНКЦИОНАЛЬНЫЙ SPA СКРИПТ
 * ============================================================================
 * Автономный JavaScript (ES6+):
 * - Хранение данных в localStorage с автоинициализацией строго 2 демо-постов
 * - Реактивное обновление счетчиков постов и суммарных «лапок»
 * - Поиск в реальном времени и фильтрация (Все / Фото / Видео / Любимые)
 * - Кастомный HTML5 видеоплеер с полосой прогресса и элементами управления
 * - Полноэкранный Lightbox для фотографий
 * - Микроанимации всплывающих лапок и звуковой/тактильный отклик
 * - Drag-and-Drop и FileReader для загрузки изображений и видео
 * - Редактирование профиля и комментарии
 * ============================================================================
 */

(function () {
  'use strict';

  // --- КЛЮЧИ ХРАНИЛИЩА LOCALSTORAGE ---
  const STORAGE_KEYS = {
    POSTS: 'archie_blog_posts_v1',
    PROFILE: 'archie_blog_profile_v1',
    LIKED_POSTS: 'archie_blog_liked_ids_v1'
  };

  // --- ДЕМО-ДАННЫЕ ПО УМОЛЧАНИЮ (СТРОГО 2 ЗАПИСИ ПО ТРЕБОВАНИЯМ) ---
  const DEFAULT_POSTS = [
    {
      id: 'demo-post-1',
      type: 'photo',
      mediaUrl: 'assets/autumn-dog.jpg',
      fallbackMediaUrl: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=1000&q=80',
      text: 'Первый осенний забег! 🍂 Нашли в парке самый большой пушистый след осени и пересчитали все палки.',
      likes: 42,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 часа назад
      comments: [
        {
          id: 'c1-1',
          author: 'Алина',
          text: 'Какой счастливый нос! 😍',
          createdAt: new Date(Date.now() - 105 * 60 * 1000).toISOString()
        }
      ]
    },
    {
      id: 'demo-post-2',
      type: 'video',
      mediaUrl: 'assets/archie-video.webm',
      fallbackMediaUrl: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/3/38/Dog_wagging_tail.webm/Dog_wagging_tail.webm.480p.vp9.webm',
      posterUrl: 'assets/sleepy-dog.jpg',
      text: 'Сонный субботний потягуш 💤 После длинной прогулки диван официально оккупирован.',
      likes: 38,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 часов назад
      comments: [
        {
          id: 'c2-1',
          author: 'Макс',
          text: 'Заслужил отдых на 100% 💤',
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        }
      ]
    }
  ];

  const DEFAULT_PROFILE = {
    name: 'Арчи',
    breed: 'Золотистый ретривер',
    age: '3 года',
    status: 'Любитель мячиков, долгих прогулок и обнимашек 🦴🌾',
    avatarUrl: 'assets/avatar.jpg'
  };

  // --- СОСТОЯНИЕ ПРИЛОЖЕНИЯ (STATE) ---
  const state = {
    posts: [],
    profile: { ...DEFAULT_PROFILE },
    likedPostIds: new Set(),
    activeFilter: 'all', // 'all' | 'photo' | 'video' | 'liked'
    searchQuery: '',
    // Временные данные для прикрепления в инлайн-креаторе и модалке
    inlineDraftMedia: null, // { type: 'photo'|'video', url: string, file: File|null }
    modalDraftMedia: null,
    postToDeleteId: null
  };

  // --- ССЫЛКИ НА КЛЮЧЕВЫЕ DOM ЭЛЕМЕНТЫ ---
  const DOM = {
    // Header
    header: document.querySelector('.site-header'),
    logoLink: document.getElementById('logoLink'),
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    searchContainer: document.getElementById('searchContainer'),
    mobileSearchToggle: document.getElementById('mobileSearchToggle'),
    navLinks: document.querySelectorAll('.nav-link'),
    openNewPostModalBtn: document.getElementById('openNewPostModalBtn'),

    // Hero Profile
    profileAvatarImg: document.getElementById('profileAvatarImg'),
    profileName: document.getElementById('profileName'),
    profileAge: document.getElementById('profileAge'),
    profileStatus: document.getElementById('profileStatus'),
    statPostsCount: document.getElementById('statPostsCount'),
    statLikesCount: document.getElementById('statLikesCount'),
    editProfileBtn: document.getElementById('editProfileBtn'),
    aboutProfileBtn: document.getElementById('aboutProfileBtn'),

    // Inline Creator
    quickAvatarMini: document.getElementById('quickAvatarMini'),
    inlinePostText: document.getElementById('inlinePostText'),
    inlineEmojiBar: document.getElementById('inlineEmojiBar'),
    inlineMediaPreview: document.getElementById('inlineMediaPreview'),
    inlinePreviewContent: document.getElementById('inlinePreviewContent'),
    inlineRemoveMediaBtn: document.getElementById('inlineRemoveMediaBtn'),
    inlineDropzone: document.getElementById('inlineDropzone'),
    inlineFileInput: document.getElementById('inlineFileInput'),
    inlineBrowseBtn: document.getElementById('inlineBrowseBtn'),
    inlineUrlToggleBtn: document.getElementById('inlineUrlToggleBtn'),
    inlineUrlRow: document.getElementById('inlineUrlRow'),
    inlineUrlInput: document.getElementById('inlineUrlInput'),
    inlineApplyUrlBtn: document.getElementById('inlineApplyUrlBtn'),
    inlineAttachPhotoBtn: document.getElementById('inlineAttachPhotoBtn'),
    inlineAttachVideoBtn: document.getElementById('inlineAttachVideoBtn'),
    inlineAttachTextOnlyBtn: document.getElementById('inlineAttachTextOnlyBtn'),
    inlineDndHint: document.getElementById('inlineDndHint'),
    inlinePublishBtn: document.getElementById('inlinePublishBtn'),

    // Feed & Filters
    filterTabs: document.querySelectorAll('.filter-tab'),
    countAll: document.getElementById('countAll'),
    countPhoto: document.getElementById('countPhoto'),
    countVideo: document.getElementById('countVideo'),
    countLiked: document.getElementById('countLiked'),
    searchFeedbackStrip: document.getElementById('searchFeedbackStrip'),
    searchFeedbackQuery: document.getElementById('searchFeedbackQuery'),
    resetSearchStripBtn: document.getElementById('resetSearchStripBtn'),
    feedContainer: document.getElementById('feedContainer'),
    feedEmptyState: document.getElementById('feedEmptyState'),
    emptyStateDesc: document.getElementById('emptyStateDesc'),
    emptyStateResetBtn: document.getElementById('emptyStateResetBtn'),

    // Modals
    newPostModal: document.getElementById('newPostModal'),
    newPostForm: document.getElementById('newPostForm'),
    modalPostText: document.getElementById('modalPostText'),
    modalFileInput: document.getElementById('modalFileInput'),
    modalBrowseBtn: document.getElementById('modalBrowseBtn'),
    modalDropzone: document.getElementById('modalDropzone'),
    modalUrlInput: document.getElementById('modalUrlInput'),
    modalApplyUrlBtn: document.getElementById('modalApplyUrlBtn'),
    modalMediaPreview: document.getElementById('modalMediaPreview'),
    modalPreviewRender: document.getElementById('modalPreviewRender'),
    modalRemoveMediaBtn: document.getElementById('modalRemoveMediaBtn'),
    modalFormError: document.getElementById('modalFormError'),

    editProfileModal: document.getElementById('editProfileModal'),
    editProfileForm: document.getElementById('editProfileForm'),
    editAvatarPreview: document.getElementById('editAvatarPreview'),
    editAvatarFileInput: document.getElementById('editAvatarFileInput'),
    editAvatarBrowseBtn: document.getElementById('editAvatarBrowseBtn'),
    editAvatarUrlInput: document.getElementById('editAvatarUrlInput'),
    editDogName: document.getElementById('editDogName'),
    editDogBreed: document.getElementById('editDogBreed'),
    editDogAge: document.getElementById('editDogAge'),
    editDogStatus: document.getElementById('editDogStatus'),

    aboutProfileModal: document.getElementById('aboutProfileModal'),
    deleteConfirmModal: document.getElementById('deleteConfirmModal'),
    confirmDeletePostBtn: document.getElementById('confirmDeletePostBtn'),

    // Lightbox & Toasts & FAB
    lightboxOverlay: document.getElementById('lightboxOverlay'),
    lightboxImg: document.getElementById('lightboxImg'),
    lightboxCaption: document.getElementById('lightboxCaption'),
    lightboxCloseBtn: document.getElementById('lightboxCloseBtn'),
    toastContainer: document.getElementById('toastContainer'),
    mobileFabBtn: document.getElementById('mobileFabBtn'),
    resetDemoDataBtn: document.getElementById('resetDemoDataBtn')
  };

  // ==========================================================================
  // 1. ИНИЦИАЛИЗАЦИЯ И ХРАНИЛИЩЕ LOCALSTORAGE
  // ==========================================================================

  function loadStateFromStorage() {
    try {
      // Загрузка постов
      const storedPosts = localStorage.getItem(STORAGE_KEYS.POSTS);
      if (storedPosts) {
        state.posts = JSON.parse(storedPosts);
      } else {
        // Если хранилище пустое — строго инициализируем 2 демо-постами
        state.posts = JSON.parse(JSON.stringify(DEFAULT_POSTS));
        savePostsToStorage();
      }

      // Загрузка профиля
      const storedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (storedProfile) {
        state.profile = Object.assign({}, DEFAULT_PROFILE, JSON.parse(storedProfile));
      } else {
        state.profile = { ...DEFAULT_PROFILE };
        saveProfileToStorage();
      }

      // Загрузка лайкнутых записей
      const storedLiked = localStorage.getItem(STORAGE_KEYS.LIKED_POSTS);
      if (storedLiked) {
        state.likedPostIds = new Set(JSON.parse(storedLiked));
      } else {
        state.likedPostIds = new Set();
      }
    } catch (e) {
      console.warn('Ошибка при чтении localStorage, используем данные по умолчанию:', e);
      state.posts = JSON.parse(JSON.stringify(DEFAULT_POSTS));
      state.profile = { ...DEFAULT_PROFILE };
      state.likedPostIds = new Set();
    }
  }

  function savePostsToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(state.posts));
    } catch (e) {
      console.error('Ошибка записи постов в localStorage:', e);
      showToast('⚠️ Не удалось сохранить данные: превышен лимит памяти браузера');
    }
  }

  function saveProfileToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(state.profile));
    } catch (e) {
      console.error('Ошибка записи профиля в localStorage:', e);
    }
  }

  function saveLikedToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.LIKED_POSTS, JSON.stringify(Array.from(state.likedPostIds)));
    } catch (e) {
      console.error('Ошибка записи лайков в localStorage:', e);
    }
  }

  // ==========================================================================
  // 2. ФОРМАТИРОВАНИЕ И ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
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

  function showToast(message, icon = '🐾') {
    const toast = document.createElement('div');
    toast.className = 'toast-item';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // ==========================================================================
  // 3. ОБНОВЛЕНИЕ UI ПРОФИЛЯ И СЧЕТЧИКОВ
  // ==========================================================================

  function renderProfile() {
    DOM.profileName.textContent = state.profile.name;
    DOM.profileAge.textContent = state.profile.age;
    DOM.profileStatus.textContent = state.profile.status;
    DOM.profileAvatarImg.src = state.profile.avatarUrl;
    DOM.quickAvatarMini.src = state.profile.avatarUrl;
    DOM.editAvatarPreview.src = state.profile.avatarUrl;

    updateCounters();
  }

  function updateCounters() {
    const totalPosts = state.posts.length;
    const totalLikes = state.posts.reduce((sum, p) => sum + (p.likes || 0), 0);

    // Счетчики в профиле
    DOM.statPostsCount.textContent = totalPosts;
    
    // Форматирование суммарных лапок (например, 80 или 1.2k)
    if (totalLikes >= 1000) {
      DOM.statLikesCount.textContent = (totalLikes / 1000).toFixed(1).replace('.0', '') + 'k';
    } else {
      DOM.statLikesCount.textContent = totalLikes;
    }

    // Счетчики в табах фильтров
    const photoCount = state.posts.filter(p => p.type === 'photo').length;
    const videoCount = state.posts.filter(p => p.type === 'video').length;
    const likedCount = state.posts.filter(p => state.likedPostIds.has(p.id)).length;

    DOM.countAll.textContent = totalPosts;
    DOM.countPhoto.textContent = photoCount;
    DOM.countVideo.textContent = videoCount;
    DOM.countLiked.textContent = likedCount;
  }

  // ==========================================================================
  // 4. ОТРИСОВКА ЛЕНТЫ ПУБЛИКАЦИЙ (FEED)
  // ==========================================================================

  function getFilteredPosts() {
    return state.posts.filter(post => {
      // 1. Фильтр по категории
      if (state.activeFilter === 'photo' && post.type !== 'photo') return false;
      if (state.activeFilter === 'video' && post.type !== 'video') return false;
      if (state.activeFilter === 'liked' && !state.likedPostIds.has(post.id)) return false;

      // 2. Поиск по тексту
      if (state.searchQuery.trim()) {
        const query = state.searchQuery.toLowerCase().trim();
        const textMatch = (post.text || '').toLowerCase().includes(query);
        const commentMatch = (post.comments || []).some(c => (c.text || '').toLowerCase().includes(query));
        if (!textMatch && !commentMatch) return false;
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

      if (state.searchQuery.trim()) {
        DOM.emptyStateDesc.textContent = `По запросу «${state.searchQuery}» ничего не найдено. Попробуйте поискать другие слова.`;
      } else if (state.activeFilter === 'liked') {
        DOM.emptyStateDesc.textContent = 'Вы еще не поставили ни одной лапки 🐾 Нажмите «Дай лапу!» под понравившимся постом.';
      } else if (state.activeFilter === 'photo') {
        DOM.emptyStateDesc.textContent = 'В ленте пока нет записей с фотографиями.';
      } else if (state.activeFilter === 'video') {
        DOM.emptyStateDesc.textContent = 'В ленте пока нет записей с видеороликами.';
      } else {
        DOM.emptyStateDesc.textContent = 'В дневнике пока нет записей. Создайте первую с помощью формы выше!';
      }
      return;
    }

    DOM.feedContainer.style.display = 'grid';
    DOM.feedEmptyState.style.display = 'none';

    // Создаем карточки постов
    filtered.forEach(post => {
      const card = createPostCardElement(post);
      DOM.feedContainer.appendChild(card);
    });
  }

  function createPostCardElement(post) {
    const card = document.createElement('article');
    card.className = 'post-card';
    card.dataset.postId = post.id;

    const isLiked = state.likedPostIds.has(post.id);
    const commentsCount = (post.comments || []).length;
    const typeLabel = post.type === 'photo' ? '📸 Фото' : post.type === 'video' ? '🎥 Видео' : '📝 Заметка';

    // 1. Шапка карточки
    let mediaHtml = '';
    if (post.type === 'photo' && post.mediaUrl) {
      mediaHtml = `
        <div class="post-media-wrap" data-lightbox-src="${escapeHtml(post.mediaUrl)}" data-lightbox-caption="${escapeHtml(post.text)}">
          <img 
            src="${escapeHtml(post.mediaUrl)}" 
            alt="Фотография Арчи" 
            class="post-photo-img" 
            loading="lazy"
            onerror="if(this.src!=='${post.fallbackMediaUrl || ''}') this.src='${post.fallbackMediaUrl || ''}';"
          >
          <div class="photo-zoom-hint">🔍 Увеличить</div>
        </div>
      `;
    } else if (post.type === 'video' && post.mediaUrl) {
      mediaHtml = `
        <div class="post-media-wrap custom-video-player paused" id="player-${post.id}">
          <video 
            class="custom-video-element" 
            src="${escapeHtml(post.mediaUrl)}" 
            poster="${escapeHtml(post.posterUrl || 'assets/sleepy-dog.jpg')}"
            preload="metadata" 
            loop 
            playsinline
          ></video>
          <!-- Большая кнопка воспроизведения в центре -->
          <button type="button" class="video-big-play-btn" title="Воспроизвести видео" aria-label="Воспроизвести">
            <span>▶</span>
          </button>
          <!-- Нижняя панель управления видео -->
          <div class="video-controls-overlay">
            <div class="video-progress-bar-container" title="Перемотка">
              <div class="video-progress-filled"></div>
            </div>
            <div class="video-controls-row">
              <div class="video-ctrl-left">
                <button type="button" class="video-ctrl-btn video-play-pause-btn" title="Пауза / Плей">▶</button>
                <span class="video-time-display">0:00 / 0:00</span>
              </div>
              <div class="video-ctrl-right">
                <button type="button" class="video-ctrl-btn video-mute-btn" title="Звук">🔊</button>
                <button type="button" class="video-ctrl-btn video-fullscreen-btn" title="На весь экран">⛶</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // Список существующих комментариев
    const commentsListHtml = (post.comments || []).map(c => `
      <div class="comment-item">
        <div class="comment-author-avatar">${escapeHtml(c.author ? c.author.charAt(0).toUpperCase() : '🐾')}</div>
        <div class="comment-bubble">
          <div class="comment-author-row">
            <span class="comment-author-name">${escapeHtml(c.author || 'Друг Арчи')}</span>
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
            <time class="post-date" datetime="${post.createdAt}">${formatDate(post.createdAt)}</time>
          </div>
        </div>
        <div class="post-header-actions">
          <span class="post-type-tag">${typeLabel}</span>
          <button type="button" class="post-delete-btn" title="Удалить запись" data-action="delete-post" aria-label="Удалить запись">🗑️</button>
        </div>
      </header>

      ${mediaHtml}

      <div class="post-body">
        <p class="post-story-text">${escapeHtml(post.text)}</p>
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

    // Привязываем обработчики для кастомного видеоплеера, если это видео
    if (post.type === 'video') {
      const playerWrap = card.querySelector('.custom-video-player');
      if (playerWrap) {
        initCustomVideoPlayer(playerWrap);
      }
    }

    return card;
  }

  // ==========================================================================
  // 5. КАСТОМНЫЙ HTML5 ВИДЕОПЛЕЕР
  // ==========================================================================

  function initCustomVideoPlayer(player) {
    const video = player.querySelector('.custom-video-element');
    const bigPlayBtn = player.querySelector('.video-big-play-btn');
    const playPauseBtn = player.querySelector('.video-play-pause-btn');
    const progressBar = player.querySelector('.video-progress-bar-container');
    const progressFill = player.querySelector('.video-progress-filled');
    const timeDisplay = player.querySelector('.video-time-display');
    const muteBtn = player.querySelector('.video-mute-btn');
    const fullscreenBtn = player.querySelector('.video-fullscreen-btn');

    function formatVideoTime(seconds) {
      if (isNaN(seconds)) return '0:00';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    function togglePlay() {
      if (video.paused || video.ended) {
        video.play().then(() => {
          player.classList.remove('paused');
          player.classList.add('playing');
          playPauseBtn.textContent = '⏸';
        }).catch(err => {
          console.warn('Автовоспроизведение заблокировано браузером:', err);
        });
      } else {
        video.pause();
        player.classList.remove('playing');
        player.classList.add('paused');
        playPauseBtn.textContent = '▶';
      }
    }

    // Слушатели клика по видео или большой кнопке
    bigPlayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePlay();
    });

    video.addEventListener('click', () => {
      togglePlay();
    });

    playPauseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePlay();
    });

    // Обновление таймкода и прогресса
    video.addEventListener('timeupdate', () => {
      if (!isNaN(video.duration) && video.duration > 0) {
        const percent = (video.currentTime / video.duration) * 100;
        progressFill.style.width = `${percent}%`;
        timeDisplay.textContent = `${formatVideoTime(video.currentTime)} / ${formatVideoTime(video.duration)}`;
      }
    });

    video.addEventListener('loadedmetadata', () => {
      timeDisplay.textContent = `0:00 / ${formatVideoTime(video.duration)}`;
    });

    // Перемотка кликом по прогрессбару
    progressBar.addEventListener('click', (e) => {
      e.stopPropagation();
      const rect = progressBar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      if (width > 0 && !isNaN(video.duration)) {
        const targetTime = (clickX / width) * video.duration;
        video.currentTime = targetTime;
      }
    });

    // Звук / Mute
    muteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      video.muted = !video.muted;
      muteBtn.textContent = video.muted ? '🔇' : '🔊';
    });

    // Полноэкранный режим
    fullscreenBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!document.fullscreenElement) {
        if (player.requestFullscreen) {
          player.requestFullscreen();
        } else if (video.webkitEnterFullscreen) {
          video.webkitEnterFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    });

    // Окончание видео (так как зациклено loop, на случай если paused)
    video.addEventListener('ended', () => {
      player.classList.remove('playing');
      player.classList.add('paused');
      playPauseBtn.textContent = '▶';
    });
  }

  // ==========================================================================
  // 6. МИКРОАНИМАЦИЯ ВСПЛЫВАЮЩИХ ЛАПОК И РЕАКЦИИ («ДАЙ ЛАПУ!»)
  // ==========================================================================

  function triggerPawBurst(buttonElement) {
    const pawIcons = ['🐾', '🐾', '🦴', '✨', '🐾'];
    const rect = buttonElement.getBoundingClientRect();

    pawIcons.forEach((icon, i) => {
      const paw = document.createElement('span');
      paw.className = 'floating-paw';
      paw.textContent = icon;

      // Случайное смещение по горизонтали
      const randomX = (Math.random() - 0.5) * 44;
      const randomY = -10 - Math.random() * 15;
      paw.style.left = `${(rect.width / 2) + randomX}px`;
      paw.style.top = `${randomY}px`;
      paw.style.animationDelay = `${i * 0.08}s`;

      buttonElement.appendChild(paw);

      setTimeout(() => paw.remove(), 1000);
    });
  }

  function handlePostLike(postId, buttonElement) {
    const post = state.posts.find(p => p.id === postId);
    if (!post) return;

    const isCurrentlyLiked = state.likedPostIds.has(postId);

    if (isCurrentlyLiked) {
      // Снимаем лайк
      state.likedPostIds.delete(postId);
      post.likes = Math.max(0, (post.likes || 1) - 1);
      buttonElement.classList.remove('liked');
      buttonElement.querySelector('.like-btn-text').textContent = 'Дай лапу!';
      showToast('Вы забрали лапку назад 🐾');
    } else {
      // Ставим лайк
      state.likedPostIds.add(postId);
      post.likes = (post.likes || 0) + 1;
      buttonElement.classList.add('liked');
      buttonElement.querySelector('.like-btn-text').textContent = 'Лапа дана!';
      triggerPawBurst(buttonElement);
      showToast('Арчи завилял хвостиком! Спасибо за лапку 🐶✨');
    }

    buttonElement.querySelector('.like-counter').textContent = `(${post.likes})`;

    savePostsToStorage();
    saveLikedToStorage();
    updateCounters();
  }

  // ==========================================================================
  // 7. КОММЕНТАРИИ: ДОБАВЛЕНИЕ И СВОРАЧИВАНИЕ
  // ==========================================================================

  function toggleCommentsDrawer(postId, card) {
    const drawer = card.querySelector(`#comments-${postId}`);
    if (!drawer) return;

    drawer.classList.toggle('open');
    if (drawer.classList.contains('open')) {
      const input = drawer.querySelector('.comment-input');
      if (input) setTimeout(() => input.focus(), 150);
    }
  }

  function handleAddComment(postId, formElement) {
    const input = formElement.querySelector('.comment-input');
    const commentText = input.value.trim();
    if (!commentText) return;

    const post = state.posts.find(p => p.id === postId);
    if (!post) return;

    if (!post.comments) post.comments = [];

    // Имя комментатора (берем сохраненное имя или "Гость")
    const authorName = localStorage.getItem('archie_commenter_name') || 'Гость блога';

    const newComment = {
      id: 'c_' + Date.now(),
      author: authorName,
      text: commentText,
      createdAt: new Date().toISOString()
    };

    post.comments.push(newComment);
    savePostsToStorage();

    // Обновляем список комментариев в DOM
    const drawer = formElement.closest('.comments-drawer');
    const list = drawer.querySelector('.comments-list');
    
    // Удаляем заглушку если была
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

    // Очищаем инпут и обновляем счетчик кнопки
    input.value = '';
    const toggleBtn = formElement.closest('.post-card').querySelector('.comments-btn-label');
    if (toggleBtn) {
      toggleBtn.textContent = `Комментировать (${post.comments.length})`;
    }

    showToast('Комментарий успешно добавлен! 💬');
  }

  // ==========================================================================
  // 8. УДАЛЕНИЕ ЗАПИСЕЙ С ПОДТВЕРЖДЕНИЕМ
  // ==========================================================================

  function promptDeletePost(postId) {
    state.postToDeleteId = postId;
    openModal(DOM.deleteConfirmModal);
  }

  DOM.confirmDeletePostBtn.addEventListener('click', () => {
    if (!state.postToDeleteId) return;

    const index = state.posts.findIndex(p => p.id === state.postToDeleteId);
    if (index !== -1) {
      state.posts.splice(index, 1);
      state.likedPostIds.delete(state.postToDeleteId);
      savePostsToStorage();
      saveLikedToStorage();
      renderFeed();
      showToast('Запись удалена из дневника', '🗑️');
    }

    state.postToDeleteId = null;
    closeModal(DOM.deleteConfirmModal);
  });

  // ==========================================================================
  // 9. СОЗДАНИЕ ПУБЛИКАЦИЙ: ОБРАБОТКА МЕДИА (DRAG & DROP, ФАЙЛЫ, URL)
  // ==========================================================================

  function readFileAsDataUrl(file, callback) {
    if (!file) return;

    // Валидация размера: до 50 МБ
    if (file.size > 50 * 1024 * 1024) {
      showToast('⚠️ Файл слишком большой. Выберите размер до 50 МБ.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov)$/i);
      callback({
        type: isVideo ? 'video' : 'photo',
        url: e.target.result,
        fileName: file.name
      });
    };
    reader.onerror = () => {
      showToast('⚠️ Ошибка при чтении файла');
    };
    reader.readAsDataURL(file);
  }

  // Настройка Drag-and-Drop для указанного контейнера
  function setupDropzone(dropzoneEl, fileInputEl, onMediaSelected) {
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzoneEl.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzoneEl.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzoneEl.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzoneEl.classList.remove('dragover');
      });
    });

    dropzoneEl.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files.length > 0) {
        readFileAsDataUrl(files[0], onMediaSelected);
      }
    });

    fileInputEl.addEventListener('change', () => {
      if (fileInputEl.files && fileInputEl.files.length > 0) {
        readFileAsDataUrl(fileInputEl.files[0], onMediaSelected);
      }
    });
  }

  // --- ИНЛАЙН КРЕАТОР НА СТРАНИЦЕ ---
  function updateInlinePreview() {
    if (state.inlineDraftMedia && state.inlineDraftMedia.url) {
      DOM.inlineMediaPreview.style.display = 'block';
      DOM.inlineDropzone.style.display = 'none';

      if (state.inlineDraftMedia.type === 'video') {
        DOM.inlinePreviewContent.innerHTML = `
          <video src="${escapeHtml(state.inlineDraftMedia.url)}" controls style="max-height:220px;width:100%;border-radius:12px;"></video>
        `;
      } else {
        DOM.inlinePreviewContent.innerHTML = `
          <img src="${escapeHtml(state.inlineDraftMedia.url)}" alt="Превью" style="max-height:220px;border-radius:12px;display:block;margin:0 auto;">
        `;
      }
    } else {
      DOM.inlineMediaPreview.style.display = 'none';
      DOM.inlinePreviewContent.innerHTML = '';
    }
  }

  setupDropzone(DOM.inlineDropzone, DOM.inlineFileInput, (media) => {
    state.inlineDraftMedia = media;
    updateInlinePreview();
    showToast('Медиа прикреплено к записи! 📸');
  });

  DOM.inlineBrowseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    DOM.inlineFileInput.click();
  });

  DOM.inlineDndHint.addEventListener('click', () => {
    DOM.inlineDropzone.style.display = DOM.inlineDropzone.style.display === 'none' ? 'block' : 'none';
  });

  DOM.inlineAttachPhotoBtn.addEventListener('click', () => {
    DOM.inlineFileInput.accept = 'image/*';
    DOM.inlineDropzone.style.display = 'block';
    DOM.inlineFileInput.click();
  });

  DOM.inlineAttachVideoBtn.addEventListener('click', () => {
    DOM.inlineFileInput.accept = 'video/*';
    DOM.inlineDropzone.style.display = 'block';
    DOM.inlineFileInput.click();
  });

  DOM.inlineAttachTextOnlyBtn.addEventListener('click', () => {
    state.inlineDraftMedia = null;
    DOM.inlineDropzone.style.display = 'none';
    DOM.inlineMediaPreview.style.display = 'none';
    showToast('Режим текстовой публикации ✏️');
  });

  DOM.inlineRemoveMediaBtn.addEventListener('click', () => {
    state.inlineDraftMedia = null;
    DOM.inlineFileInput.value = '';
    updateInlinePreview();
  });

  DOM.inlineUrlToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    DOM.inlineUrlRow.style.display = DOM.inlineUrlRow.style.display === 'none' ? 'flex' : 'none';
  });

  DOM.inlineApplyUrlBtn.addEventListener('click', () => {
    const url = DOM.inlineUrlInput.value.trim();
    if (!url) return;
    const isVideo = url.match(/\.(mp4|webm|mov|ogg)($|\?)/i);
    state.inlineDraftMedia = {
      type: isVideo ? 'video' : 'photo',
      url: url
    };
    updateInlinePreview();
    DOM.inlineUrlRow.style.display = 'none';
    DOM.inlineUrlInput.value = '';
    showToast('Медиа по ссылке загружено! ✨');
  });

  // Публикация из инлайн-креатора
  DOM.inlinePublishBtn.addEventListener('click', () => {
    const text = DOM.inlinePostText.value.trim();
    const media = state.inlineDraftMedia;

    // Валидация: нужен либо текст, либо медиа
    if (!text && !media) {
      showToast('⚠️ Напишите текст истории или прикрепите фото/видео');
      DOM.inlinePostText.focus();
      return;
    }

    const newPost = {
      id: 'post_' + Date.now(),
      type: media ? media.type : 'none',
      mediaUrl: media ? media.url : null,
      posterUrl: media && media.type === 'video' ? 'assets/sleepy-dog.jpg' : null,
      text: text,
      likes: 0,
      createdAt: new Date().toISOString(),
      comments: []
    };

    // Добавляем в начало ленты
    state.posts.unshift(newPost);
    savePostsToStorage();

    // Очищаем форму инлайн-креатора
    DOM.inlinePostText.value = '';
    state.inlineDraftMedia = null;
    DOM.inlineFileInput.value = '';
    DOM.inlineDropzone.style.display = 'none';
    updateInlinePreview();

    renderFeed();
    showToast('Новая история Арчи опубликована! 🐾🎉');

    // Плавная прокрутка к началу ленты
    DOM.feedContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // --- МОДАЛЬНОЕ ОКНО СОЗДАНИЯ ПОСТА ---
  function updateModalPreview() {
    if (state.modalDraftMedia && state.modalDraftMedia.url) {
      DOM.modalMediaPreview.style.display = 'block';
      DOM.modalDropzone.style.display = 'none';

      if (state.modalDraftMedia.type === 'video') {
        DOM.modalPreviewRender.innerHTML = `
          <video src="${escapeHtml(state.modalDraftMedia.url)}" controls style="max-height:220px;width:100%;border-radius:12px;"></video>
        `;
      } else {
        DOM.modalPreviewRender.innerHTML = `
          <img src="${escapeHtml(state.modalDraftMedia.url)}" alt="Превью" style="max-height:220px;border-radius:12px;display:block;margin:0 auto;">
        `;
      }
    } else {
      DOM.modalMediaPreview.style.display = 'none';
      DOM.modalPreviewRender.innerHTML = '';
      DOM.modalDropzone.style.display = 'block';
    }
  }

  setupDropzone(DOM.modalDropzone, DOM.modalFileInput, (media) => {
    state.modalDraftMedia = media;
    updateModalPreview();
  });

  DOM.modalBrowseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    DOM.modalFileInput.click();
  });

  DOM.modalRemoveMediaBtn.addEventListener('click', () => {
    state.modalDraftMedia = null;
    DOM.modalFileInput.value = '';
    updateModalPreview();
  });

  DOM.modalApplyUrlBtn.addEventListener('click', () => {
    const url = DOM.modalUrlInput.value.trim();
    if (!url) return;
    const isVideo = url.match(/\.(mp4|webm|mov|ogg)($|\?)/i);
    state.modalDraftMedia = {
      type: isVideo ? 'video' : 'photo',
      url: url
    };
    updateModalPreview();
    DOM.modalUrlInput.value = '';
    showToast('Ссылка на медиа добавлена! 🔗');
  });

  // Радио-переключатель типа медиа в модалке
  document.querySelectorAll('input[name="modalMediaType"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const type = e.target.value;
      const uploadSec = document.getElementById('modalMediaUploadSection');
      if (type === 'none') {
        uploadSec.style.display = 'none';
        state.modalDraftMedia = null;
        updateModalPreview();
      } else {
        uploadSec.style.display = 'block';
        DOM.modalFileInput.accept = type === 'video' ? 'video/*' : 'image/*';
      }
    });
  });

  // Отправка формы модалки нового поста
  DOM.newPostForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = DOM.modalPostText.value.trim();
    const media = state.modalDraftMedia;
    const selectedRadioType = document.querySelector('input[name="modalMediaType"]:checked').value;

    if (!text && !media) {
      DOM.modalFormError.style.display = 'block';
      return;
    }

    DOM.modalFormError.style.display = 'none';

    const newPost = {
      id: 'post_' + Date.now(),
      type: selectedRadioType === 'none' ? 'none' : (media ? media.type : selectedRadioType),
      mediaUrl: media ? media.url : null,
      posterUrl: media && media.type === 'video' ? 'assets/sleepy-dog.jpg' : null,
      text: text,
      likes: 0,
      createdAt: new Date().toISOString(),
      comments: []
    };

    state.posts.unshift(newPost);
    savePostsToStorage();

    // Сброс модалки
    DOM.newPostForm.reset();
    state.modalDraftMedia = null;
    updateModalPreview();
    closeModal(DOM.newPostModal);

    renderFeed();
    showToast('Запись добавлена в дневник! 🐾');
    DOM.feedContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // Вставка эмодзи в активное текстовое поле
  document.querySelectorAll('.emoji-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const emoji = btn.dataset.emoji;
      // Определяем контекст (модалка или инлайн)
      const targetTextarea = btn.closest('#newPostForm') ? DOM.modalPostText : DOM.inlinePostText;

      const start = targetTextarea.selectionStart;
      const end = targetTextarea.selectionEnd;
      const val = targetTextarea.value;
      targetTextarea.value = val.substring(0, start) + emoji + val.substring(end);
      targetTextarea.selectionStart = targetTextarea.selectionEnd = start + emoji.length;
      targetTextarea.focus();
    });
  });

  // ==========================================================================
  // 10. РЕДАКТИРОВАНИЕ ПРОФИЛЯ ПИТОМЦА
  // ==========================================================================

  DOM.editProfileBtn.addEventListener('click', () => {
    DOM.editDogName.value = state.profile.name;
    DOM.editDogBreed.value = state.profile.breed || 'Золотистый ретривер';
    DOM.editDogAge.value = state.profile.age;
    DOM.editDogStatus.value = state.profile.status;
    DOM.editAvatarPreview.src = state.profile.avatarUrl;
    DOM.editAvatarUrlInput.value = '';
    openModal(DOM.editProfileModal);
  });

  DOM.editAvatarBrowseBtn.addEventListener('click', () => {
    DOM.editAvatarFileInput.click();
  });

  DOM.editAvatarFileInput.addEventListener('change', () => {
    if (DOM.editAvatarFileInput.files && DOM.editAvatarFileInput.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        DOM.editAvatarPreview.src = e.target.result;
      };
      reader.readAsDataURL(DOM.editAvatarFileInput.files[0]);
    }
  });

  DOM.editAvatarUrlInput.addEventListener('input', () => {
    const url = DOM.editAvatarUrlInput.value.trim();
    if (url) {
      DOM.editAvatarPreview.src = url;
    }
  });

  DOM.editProfileForm.addEventListener('submit', (e) => {
    e.preventDefault();

    state.profile.name = DOM.editDogName.value.trim() || 'Арчи';
    state.profile.breed = DOM.editDogBreed.value.trim() || 'Золотистый ретривер';
    state.profile.age = DOM.editDogAge.value.trim() || '3 года';
    state.profile.status = DOM.editDogStatus.value.trim() || 'Любитель мячиков 🦴';
    state.profile.avatarUrl = DOM.editAvatarPreview.src;

    saveProfileToStorage();
    renderProfile();
    renderFeed(); // Обновит аватары в постах
    closeModal(DOM.editProfileModal);

    showToast('Профиль Арчи успешно обновлен! ✨');
  });

  // Модалка "О питомце"
  DOM.aboutProfileBtn.addEventListener('click', () => {
    openModal(DOM.aboutProfileModal);
  });

  // ==========================================================================
  // 11. ПОИСК В РЕАЛЬНОМ ВРЕМЕНИ И ФИЛЬТРЫ
  // ==========================================================================

  function handleSearch(query) {
    state.searchQuery = query;
    if (query.trim()) {
      DOM.clearSearchBtn.style.display = 'block';
      DOM.searchFeedbackStrip.style.display = 'flex';
      DOM.searchFeedbackQuery.textContent = `«${query.trim()}»`;
    } else {
      DOM.clearSearchBtn.style.display = 'none';
      DOM.searchFeedbackStrip.style.display = 'none';
    }
    renderFeed();
  }

  DOM.searchInput.addEventListener('input', (e) => {
    handleSearch(e.target.value);
  });

  DOM.clearSearchBtn.addEventListener('click', () => {
    DOM.searchInput.value = '';
    handleSearch('');
    DOM.searchInput.focus();
  });

  DOM.resetSearchStripBtn.addEventListener('click', () => {
    DOM.searchInput.value = '';
    handleSearch('');
  });

  DOM.emptyStateResetBtn.addEventListener('click', () => {
    DOM.searchInput.value = '';
    state.searchQuery = '';
    state.activeFilter = 'all';
    DOM.filterTabs.forEach(t => t.classList.toggle('active', t.dataset.filter === 'all'));
    DOM.searchFeedbackStrip.style.display = 'none';
    DOM.clearSearchBtn.style.display = 'none';
    renderFeed();
  });

  // Мобильный поиск: переключение строки поиска
  DOM.mobileSearchToggle.addEventListener('click', () => {
    DOM.searchContainer.classList.toggle('mobile-active');
    if (DOM.searchContainer.classList.contains('mobile-active')) {
      DOM.searchInput.focus();
    }
  });

  // Переключение вкладок фильтрации (Все, Фото, Видео, Любимые)
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

  // Верхняя навигация
  DOM.navLinks.forEach(link => {
    link.addEventListener('click', () => {
      DOM.navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      const action = link.dataset.action;
      if (action === 'home') {
        state.activeFilter = 'all';
        DOM.filterTabs.forEach(t => t.classList.toggle('active', t.dataset.filter === 'all'));
        renderFeed();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (action === 'gallery') {
        state.activeFilter = 'photo';
        DOM.filterTabs.forEach(t => t.classList.toggle('active', t.dataset.filter === 'photo'));
        renderFeed();
        DOM.feedContainer.scrollIntoView({ behavior: 'smooth' });
      } else if (action === 'about') {
        openModal(DOM.aboutProfileModal);
      }
    });
  });

  DOM.logoLink.addEventListener('click', (e) => {
    e.preventDefault();
    state.activeFilter = 'all';
    state.searchQuery = '';
    DOM.searchInput.value = '';
    DOM.searchFeedbackStrip.style.display = 'none';
    DOM.filterTabs.forEach(t => t.classList.toggle('active', t.dataset.filter === 'all'));
    renderFeed();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ==========================================================================
  // 12. ДЕЛЕГИРОВАНИЕ СОБЫТИЙ В ЛЕНТЕ (КЛИКИ ПО КАРТОЧКАМ, ЛАЙКИ, КОММЕНТЫ)
  // ==========================================================================

  DOM.feedContainer.addEventListener('click', (e) => {
    const card = e.target.closest('.post-card');
    if (!card) return;
    const postId = card.dataset.postId;

    // 1. Клик по кнопке "🐾 Дай лапу!"
    const likeBtn = e.target.closest('[data-action="like-post"]');
    if (likeBtn) {
      e.stopPropagation();
      handlePostLike(postId, likeBtn);
      return;
    }

    // 2. Клик по кнопке "💬 Комментировать"
    const commentsToggleBtn = e.target.closest('[data-action="toggle-comments"]');
    if (commentsToggleBtn) {
      e.stopPropagation();
      toggleCommentsDrawer(postId, card);
      return;
    }

    // 3. Клик по кнопке удаления записи
    const deleteBtn = e.target.closest('[data-action="delete-post"]');
    if (deleteBtn) {
      e.stopPropagation();
      promptDeletePost(postId);
      return;
    }

    // 4. Клик по фото для Lightbox
    const mediaWrap = e.target.closest('[data-lightbox-src]');
    if (mediaWrap) {
      const src = mediaWrap.dataset.lightboxSrc;
      const caption = mediaWrap.dataset.lightboxCaption || '';
      openLightbox(src, caption);
      return;
    }
  });

  // Отправка комментария через submit формы внутри карточки
  DOM.feedContainer.addEventListener('submit', (e) => {
    const commentForm = e.target.closest('.comment-form');
    if (commentForm) {
      e.preventDefault();
      const postId = commentForm.dataset.postId;
      handleAddComment(postId, commentForm);
    }
  });

  // ==========================================================================
  // 13. ПОЛНОЭКРАННЫЙ ПРОСМОТРЩИК ФОТО (LIGHTBOX)
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
    if (e.target === DOM.lightboxOverlay) {
      closeLightbox();
    }
  });

  // ==========================================================================
  // 14. УПРАВЛЕНИЕ МОДАЛЬНЫМИ ОКНАМИ (MODALS)
  // ==========================================================================

  function openModal(modalEl) {
    modalEl.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modalEl) {
    modalEl.style.display = 'none';
    document.body.style.overflow = '';
  }

  // Кнопка шапки "+ Добавить" и мобильный FAB
  DOM.openNewPostModalBtn.addEventListener('click', () => {
    DOM.modalFormError.style.display = 'none';
    openModal(DOM.newPostModal);
  });

  DOM.mobileFabBtn.addEventListener('click', () => {
    DOM.modalFormError.style.display = 'none';
    openModal(DOM.newPostModal);
  });

  // Закрытие модалок по кнопкам [data-close-modal]
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.dataset.closeModal;
      const modal = document.getElementById(modalId);
      if (modal) closeModal(modal);
    });
  });

  // Закрытие по клику на фон
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeModal(backdrop);
      }
    });
  });

  // Закрытие по клавише Escape для модалок и Lightbox
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (DOM.lightboxOverlay.style.display === 'flex') {
        closeLightbox();
        return;
      }
      document.querySelectorAll('.modal-backdrop').forEach(modal => {
        if (modal.style.display === 'flex') {
          closeModal(modal);
        }
      });
    }
  });

  // Тень шапки при скролле
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      DOM.header.classList.add('scrolled');
    } else {
      DOM.header.classList.remove('scrolled');
    }
  }, { passive: true });

  // Сброс демо-данных к начальным 2 постам
  DOM.resetDemoDataBtn.addEventListener('click', () => {
    if (confirm('Вернуть исходные 2 демо-поста дневника Арчи? Все изменения будут сброшены.')) {
      localStorage.removeItem(STORAGE_KEYS.POSTS);
      localStorage.removeItem(STORAGE_KEYS.LIKED_POSTS);
      localStorage.removeItem(STORAGE_KEYS.PROFILE);
      loadStateFromStorage();
      renderProfile();
      renderFeed();
      showToast('Демо-данные успешно восстановлены! 🔄');
    }
  });

  // ==========================================================================
  // 15. ЗАПУСК ПРИЛОЖЕНИЯ
  // ==========================================================================
  function initApp() {
    loadStateFromStorage();
    renderProfile();
    renderFeed();
  }

  // Запуск после загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
