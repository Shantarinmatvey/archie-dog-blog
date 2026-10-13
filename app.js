/**
 * ============================================================================
 * ДНЕВНИК АРЧИ 🐾 — ПОЛНОФУНКЦИОНАЛЬНЫЙ SPA СКРИПТ (v2 Лаконичный дизайн)
 * ============================================================================
 * - Чистый интерфейс: только текстовое поле + плюсик для прикрепления медиафайлов
 * - Мультизагрузка: поддержка нескольких фото и видео в одной публикации
 * - Инстаграм-карусель: перелистывание стрелками, свайпом, точками и счетчиком 1/N
 * - Автопауза видео при переключении слайдов карусели
 * - Кастомный видеоплеер с полосой прогресса
 * - Полноэкранный Lightbox для фото
 * - Хранение в localStorage с восстановлением демо-данных
 * ============================================================================
 */

(function () {
  'use strict';

  // --- КЛЮЧИ ХРАНИЛИЩА LOCALSTORAGE ---
  const STORAGE_KEYS = {
    POSTS: 'archie_blog_posts_v2',
    PROFILE: 'archie_blog_profile_v2',
    LIKED_POSTS: 'archie_blog_liked_ids_v2'
  };

  // --- ДЕМО-ДАННЫЕ ПО УМОЛЧАНИЮ (СТРОГО 2 ЗАПИСИ) ---
  const DEFAULT_POSTS = [
    {
      id: 'demo-post-1',
      media: [
        {
          type: 'photo',
          url: 'assets/autumn-dog.jpg',
          fallbackUrl: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=1000&q=80'
        }
      ],
      text: 'Первый осенний забег! 🍂 Нашли в парке самый большой пушистый след осени и пересчитали все палки.',
      likes: 42,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
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
      media: [
        {
          type: 'video',
          url: 'assets/archie-video.webm',
          fallbackUrl: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/3/38/Dog_wagging_tail.webm/Dog_wagging_tail.webm.480p.vp9.webm',
          posterUrl: 'assets/sleepy-dog.jpg'
        }
      ],
      text: 'Сонный субботний потягуш 💤 После длинной прогулки диван официально оккупирован.',
      likes: 38,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
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
    // Список прикрепленных к новому посту медиафайлов: Array<{ type: 'photo'|'video', url: string, name?: string }>
    attachedMediaList: [],
    postToDeleteId: null
  };

  // --- DOM ССЫЛКИ ---
  const DOM = {
    header: document.querySelector('.site-header'),
    logoLink: document.getElementById('logoLink'),
    navLinks: document.querySelectorAll('.nav-link'),
    openNewPostFocusBtn: document.getElementById('openNewPostFocusBtn'),

    // Hero Profile
    profileAvatarImg: document.getElementById('profileAvatarImg'),
    profileName: document.getElementById('profileName'),
    profileAge: document.getElementById('profileAge'),
    profileStatus: document.getElementById('profileStatus'),
    statPostsCount: document.getElementById('statPostsCount'),
    statLikesCount: document.getElementById('statLikesCount'),
    editProfileBtn: document.getElementById('editProfileBtn'),

    // Creator
    quickAvatarMini: document.getElementById('quickAvatarMini'),
    inlinePostText: document.getElementById('inlinePostText'),
    mediaFilesInput: document.getElementById('mediaFilesInput'),
    btnAttachMedia: document.getElementById('btnAttachMedia'),
    attachedMediaTray: document.getElementById('attachedMediaTray'),
    mediaPreviewsList: document.getElementById('mediaPreviewsList'),
    attachedCountBadge: document.getElementById('attachedCountBadge'),
    inlinePublishBtn: document.getElementById('inlinePublishBtn'),

    // Feed & Filters
    filterTabs: document.querySelectorAll('.filter-tab'),
    countAll: document.getElementById('countAll'),
    countPhoto: document.getElementById('countPhoto'),
    countVideo: document.getElementById('countVideo'),
    countLiked: document.getElementById('countLiked'),
    feedContainer: document.getElementById('feedContainer'),
    feedEmptyState: document.getElementById('feedEmptyState'),
    emptyStateDesc: document.getElementById('emptyStateDesc'),
    emptyStateResetBtn: document.getElementById('emptyStateResetBtn'),

    // Edit Profile Modal
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

    // Delete Modal & Lightbox & Toast
    deleteConfirmModal: document.getElementById('deleteConfirmModal'),
    confirmDeletePostBtn: document.getElementById('confirmDeletePostBtn'),
    lightboxOverlay: document.getElementById('lightboxOverlay'),
    lightboxImg: document.getElementById('lightboxImg'),
    lightboxCaption: document.getElementById('lightboxCaption'),
    lightboxCloseBtn: document.getElementById('lightboxCloseBtn'),
    toastContainer: document.getElementById('toastContainer'),
    resetDemoDataBtn: document.getElementById('resetDemoDataBtn')
  };

  // ==========================================================================
  // 1. ИНИЦИАЛИЗАЦИЯ И ХРАНИЛИЩЕ LOCALSTORAGE
  // ==========================================================================

  function normalizePostMedia(post) {
    // Поддержка обратной совместимости: если в посте старый формат mediaUrl
    if (!post.media || !Array.isArray(post.media)) {
      if (post.mediaUrl) {
        post.media = [
          {
            type: post.type || 'photo',
            url: post.mediaUrl,
            fallbackUrl: post.fallbackMediaUrl,
            posterUrl: post.posterUrl
          }
        ];
      } else {
        post.media = [];
      }
    }
    return post;
  }

  function loadStateFromStorage() {
    try {
      const storedPosts = localStorage.getItem(STORAGE_KEYS.POSTS);
      if (storedPosts) {
        const parsed = JSON.parse(storedPosts);
        state.posts = parsed.map(normalizePostMedia);
      } else {
        state.posts = JSON.parse(JSON.stringify(DEFAULT_POSTS));
        savePostsToStorage();
      }

      const storedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (storedProfile) {
        state.profile = Object.assign({}, DEFAULT_PROFILE, JSON.parse(storedProfile));
      } else {
        state.profile = { ...DEFAULT_PROFILE };
        saveProfileToStorage();
      }

      const storedLiked = localStorage.getItem(STORAGE_KEYS.LIKED_POSTS);
      if (storedLiked) {
        state.likedPostIds = new Set(JSON.parse(storedLiked));
      } else {
        state.likedPostIds = new Set();
      }
    } catch (e) {
      console.warn('Ошибка чтения localStorage:', e);
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
      showToast('⚠️ Память браузера переполнена. Попробуйте прикрепить меньше медиа.');
    }
  }

  function saveProfileToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(state.profile));
    } catch (e) {
      console.error('Ошибка записи профиля:', e);
    }
  }

  function saveLikedToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.LIKED_POSTS, JSON.stringify(Array.from(state.likedPostIds)));
    } catch (e) {
      console.error('Ошибка записи лайков:', e);
    }
  }

  // ==========================================================================
  // 2. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
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

    DOM.statPostsCount.textContent = totalPosts;
    if (totalLikes >= 1000) {
      DOM.statLikesCount.textContent = (totalLikes / 1000).toFixed(1).replace('.0', '') + 'k';
    } else {
      DOM.statLikesCount.textContent = totalLikes;
    }

    // Количество по фильтрам
    const photoCount = state.posts.filter(p => (p.media || []).some(m => m.type === 'photo')).length;
    const videoCount = state.posts.filter(p => (p.media || []).some(m => m.type === 'video')).length;
    const likedCount = state.posts.filter(p => state.likedPostIds.has(p.id)).length;

    DOM.countAll.textContent = totalPosts;
    DOM.countPhoto.textContent = photoCount;
    DOM.countVideo.textContent = videoCount;
    DOM.countLiked.textContent = likedCount;
  }

  // ==========================================================================
  // 4. МУЛЬТИЗАГРУЗКА МЕДИАФАЙЛОВ В КРЕАТОРЕ (ТОЛЬКО ТЕКСТ + ПЛЮСИК)
  // ==========================================================================

  // Клик по кнопке с плюсиком открывает диалог выбора файлов
  DOM.btnAttachMedia.addEventListener('click', () => {
    DOM.mediaFilesInput.click();
  });

  DOM.mediaFilesInput.addEventListener('change', () => {
    const files = Array.from(DOM.mediaFilesInput.files || []);
    if (!files.length) return;

    let loadedCount = 0;
    files.forEach(file => {
      if (file.size > 50 * 1024 * 1024) {
        showToast(`⚠️ Файл ${file.name} превышает 50 МБ`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov)$/i);
        state.attachedMediaList.push({
          type: isVideo ? 'video' : 'photo',
          url: e.target.result,
          name: file.name
        });
        loadedCount++;
        renderAttachedMediaTray();
      };
      reader.readAsDataURL(file);
    });

    // Сбрасываем инпут чтобы можно было добавить те же файлы снова
    DOM.mediaFilesInput.value = '';
  });

  function renderAttachedMediaTray() {
    const count = state.attachedMediaList.length;

    if (count === 0) {
      DOM.attachedMediaTray.style.display = 'none';
      DOM.attachedCountBadge.style.display = 'none';
      DOM.mediaPreviewsList.innerHTML = '';
      return;
    }

    DOM.attachedMediaTray.style.display = 'block';
    DOM.attachedCountBadge.style.display = 'inline-block';
    DOM.attachedCountBadge.textContent = `${count} ${count === 1 ? 'файл' : count < 5 ? 'файла' : 'файлов'}`;

    DOM.mediaPreviewsList.innerHTML = '';

    state.attachedMediaList.forEach((item, index) => {
      const thumbWrap = document.createElement('div');
      thumbWrap.className = 'media-preview-thumb-wrap';

      if (item.type === 'video') {
        thumbWrap.innerHTML = `
          <video src="${escapeHtml(item.url)}" class="media-preview-thumb-video" preload="metadata"></video>
          <span class="thumb-video-badge">🎥 Видео</span>
          <button type="button" class="thumb-remove-btn" data-remove-index="${index}" title="Удалить">✕</button>
        `;
      } else {
        thumbWrap.innerHTML = `
          <img src="${escapeHtml(item.url)}" alt="Превью" class="media-preview-thumb-img">
          <button type="button" class="thumb-remove-btn" data-remove-index="${index}" title="Удалить">✕</button>
        `;
      }

      // Кнопка удаления отдельного файла
      thumbWrap.querySelector('.thumb-remove-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        state.attachedMediaList.splice(index, 1);
        renderAttachedMediaTray();
      });

      DOM.mediaPreviewsList.appendChild(thumbWrap);
    });
  }

  // Публикация записи
  DOM.inlinePublishBtn.addEventListener('click', () => {
    const text = DOM.inlinePostText.value.trim();
    const media = state.attachedMediaList;

    if (!text && media.length === 0) {
      showToast('⚠️ Напишите текст истории или добавьте фото/видео через «+»');
      DOM.inlinePostText.focus();
      return;
    }

    const newPost = {
      id: 'post_' + Date.now(),
      media: [...media],
      text: text,
      likes: 0,
      createdAt: new Date().toISOString(),
      comments: []
    };

    state.posts.unshift(newPost);
    savePostsToStorage();

    // Сброс полей
    DOM.inlinePostText.value = '';
    state.attachedMediaList = [];
    renderAttachedMediaTray();

    renderFeed();
    showToast('История опубликована в дневнике Арчи! 🐾🎉');

    DOM.feedContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // Кнопка шапки "+ Написать" на десктопе фокусирует поле ввода
  if (DOM.openNewPostFocusBtn) {
    DOM.openNewPostFocusBtn.addEventListener('click', () => {
      DOM.inlinePostText.focus();
      DOM.inlinePostText.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  // ==========================================================================
  // 5. ОТРИСОВКА ЛЕНТЫ ПУБЛИКАЦИЙ (FEED)
  // ==========================================================================

  function getFilteredPosts() {
    return state.posts.filter(post => {
      const media = post.media || [];
      if (state.activeFilter === 'photo') {
        return media.some(m => m.type === 'photo');
      }
      if (state.activeFilter === 'video') {
        return media.some(m => m.type === 'video');
      }
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
        DOM.emptyStateDesc.textContent = 'Вы еще не поставили ни одной лапки 🐾 Нажмите «Дай лапу!» под записью.';
      } else if (state.activeFilter === 'photo') {
        DOM.emptyStateDesc.textContent = 'В ленте пока нет записей с фотографиями.';
      } else if (state.activeFilter === 'video') {
        DOM.emptyStateDesc.textContent = 'В ленте пока нет записей с видеороликами.';
      } else {
        DOM.emptyStateDesc.textContent = 'В дневнике пока нет записей. Напишите первую историю выше!';
      }
      return;
    }

    DOM.feedContainer.style.display = 'grid';
    DOM.feedEmptyState.style.display = 'none';

    filtered.forEach(post => {
      const card = createPostCardElement(post);
      DOM.feedContainer.appendChild(card);
    });
  }

  // Создание элемента карточки
  function createPostCardElement(post) {
    const card = document.createElement('article');
    card.className = 'post-card';
    card.dataset.postId = post.id;

    const isLiked = state.likedPostIds.has(post.id);
    const commentsCount = (post.comments || []).length;
    const mediaList = post.media || [];

    // Определяем ярлык типа
    let typeLabel = '📝 Заметка';
    const hasPhotos = mediaList.some(m => m.type === 'photo');
    const hasVideos = mediaList.some(m => m.type === 'video');
    if (hasPhotos && hasVideos) {
      typeLabel = `📸🎥 Альбом (${mediaList.length})`;
    } else if (hasVideos) {
      typeLabel = mediaList.length > 1 ? `🎥 Видео (${mediaList.length})` : '🎥 Видео';
    } else if (hasPhotos) {
      typeLabel = mediaList.length > 1 ? `📸 Фото (${mediaList.length})` : '📸 Фото';
    }

    // Генерация медиа-блока: если > 1 элемента — Инстаграм-карусель!
    let mediaHtml = '';
    if (mediaList.length > 1) {
      mediaHtml = createCarouselHtml(post.id, mediaList, post.text);
    } else if (mediaList.length === 1) {
      mediaHtml = createSingleMediaHtml(post.id, mediaList[0], post.text);
    }

    // Комментарии
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

    // Инициализация карусели или одиночного видео
    if (mediaList.length > 1) {
      initPostCarousel(card.querySelector('.post-carousel-container'));
    } else if (mediaList.length === 1 && mediaList[0].type === 'video') {
      const playerWrap = card.querySelector('.custom-video-player');
      if (playerWrap) initCustomVideoPlayer(playerWrap);
    }

    return card;
  }

  // ==========================================================================
  // 6. ИНСТАГРАМ-КАРУСЕЛЬ (ПЕРЕЛИСТЫВАНИЕ МЕДИАФАЙЛОВ)
  // ==========================================================================

  function createCarouselHtml(postId, mediaList, caption) {
    const total = mediaList.length;

    const slidesHtml = mediaList.map((m, index) => {
      if (m.type === 'video') {
        return `
          <div class="carousel-slide" data-slide-index="${index}">
            <div class="custom-video-player paused" id="player-${postId}-${index}">
              <video 
                class="custom-video-element" 
                src="${escapeHtml(m.url)}" 
                poster="${escapeHtml(m.posterUrl || 'assets/sleepy-dog.jpg')}"
                preload="metadata" 
                loop 
                playsinline
              ></video>
              <button type="button" class="video-big-play-btn" title="Воспроизвести">
                <span>▶</span>
              </button>
              <div class="video-controls-overlay">
                <div class="video-progress-bar-container">
                  <div class="video-progress-filled"></div>
                </div>
                <div class="video-controls-row">
                  <div class="video-ctrl-left">
                    <button type="button" class="video-ctrl-btn video-play-pause-btn">▶</button>
                    <span class="video-time-display">0:00 / 0:00</span>
                  </div>
                  <div class="video-ctrl-right">
                    <button type="button" class="video-ctrl-btn video-mute-btn">🔊</button>
                    <button type="button" class="video-ctrl-btn video-fullscreen-btn">⛶</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      } else {
        return `
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
        `;
      }
    }).join('');

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
    const prevBtn = container.querySelector('.carousel-prev-btn');
    const nextBtn = container.querySelector('.carousel-next-btn');
    const counterBadge = container.querySelector('.carousel-counter-badge');
    const dots = container.querySelectorAll('.carousel-dot');
    const total = slides.length;

    let currentIndex = 0;

    // Инициализация видеоплееров внутри слайдов
    slides.forEach(slide => {
      const player = slide.querySelector('.custom-video-player');
      if (player) initCustomVideoPlayer(player);
    });

    function pauseAllVideos() {
      slides.forEach(slide => {
        const video = slide.querySelector('.custom-video-element');
        const player = slide.querySelector('.custom-video-player');
        if (video && !video.paused) {
          video.pause();
          if (player) {
            player.classList.remove('playing');
            player.classList.add('paused');
            const playBtn = player.querySelector('.video-play-pause-btn');
            if (playBtn) playBtn.textContent = '▶';
          }
        }
      });
    }

    function updateCarousel() {
      pauseAllVideos();
      track.style.transform = `translateX(-${currentIndex * 100}%)`;

      // Счетчик 1 / N
      if (counterBadge) {
        counterBadge.textContent = `${currentIndex + 1} / ${total}`;
      }

      // Стрелки навигации
      if (prevBtn) prevBtn.style.display = currentIndex === 0 ? 'none' : 'flex';
      if (nextBtn) nextBtn.style.display = currentIndex === total - 1 ? 'none' : 'flex';

      // Точки
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

    // Поддержка сенсорных свайпов (Mobile Touch Swipe)
    let touchStartX = 0;
    let touchEndX = 0;

    container.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });

    function handleSwipe() {
      const diff = touchEndX - touchStartX;
      if (Math.abs(diff) > 40) {
        if (diff < 0 && currentIndex < total - 1) {
          // Свайп влево -> следующий
          currentIndex++;
          updateCarousel();
        } else if (diff > 0 && currentIndex > 0) {
          // Свайп вправо -> предыдущий
          currentIndex--;
          updateCarousel();
        }
      }
    }
  }

  // Одиночное медиа (1 фото или 1 видео)
  function createSingleMediaHtml(postId, media, caption) {
    if (media.type === 'video') {
      return `
        <div class="post-media-wrap custom-video-player paused" id="player-${postId}">
          <video 
            class="custom-video-element" 
            src="${escapeHtml(media.url)}" 
            poster="${escapeHtml(media.posterUrl || 'assets/sleepy-dog.jpg')}"
            preload="metadata" 
            loop 
            playsinline
          ></video>
          <button type="button" class="video-big-play-btn" title="Воспроизвести">
            <span>▶</span>
          </button>
          <div class="video-controls-overlay">
            <div class="video-progress-bar-container">
              <div class="video-progress-filled"></div>
            </div>
            <div class="video-controls-row">
              <div class="video-ctrl-left">
                <button type="button" class="video-ctrl-btn video-play-pause-btn">▶</button>
                <span class="video-time-display">0:00 / 0:00</span>
              </div>
              <div class="video-ctrl-right">
                <button type="button" class="video-ctrl-btn video-mute-btn">🔊</button>
                <button type="button" class="video-ctrl-btn video-fullscreen-btn">⛶</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="post-media-wrap" data-lightbox-src="${escapeHtml(media.url)}" data-lightbox-caption="${escapeHtml(caption)}">
        <img 
          src="${escapeHtml(media.url)}" 
          alt="Фотография Арчи" 
          class="post-photo-img" 
          loading="lazy"
          onerror="if(this.src!=='${media.fallbackUrl || ''}') this.src='${media.fallbackUrl || ''}';"
        >
      </div>
    `;
  }

  // ==========================================================================
  // 7. КАСТОМНЫЙ ВИДЕОПЛЕЕР
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
          if (playPauseBtn) playPauseBtn.textContent = '⏸';
        }).catch(err => {
          console.warn('Воспроизведение заблокировано браузером:', err);
        });
      } else {
        video.pause();
        player.classList.remove('playing');
        player.classList.add('paused');
        if (playPauseBtn) playPauseBtn.textContent = '▶';
      }
    }

    if (bigPlayBtn) {
      bigPlayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePlay();
      });
    }

    video.addEventListener('click', () => {
      togglePlay();
    });

    if (playPauseBtn) {
      playPauseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePlay();
      });
    }

    video.addEventListener('timeupdate', () => {
      if (!isNaN(video.duration) && video.duration > 0) {
        const percent = (video.currentTime / video.duration) * 100;
        if (progressFill) progressFill.style.width = `${percent}%`;
        if (timeDisplay) timeDisplay.textContent = `${formatVideoTime(video.currentTime)} / ${formatVideoTime(video.duration)}`;
      }
    });

    video.addEventListener('loadedmetadata', () => {
      if (timeDisplay) timeDisplay.textContent = `0:00 / ${formatVideoTime(video.duration)}`;
    });

    if (progressBar) {
      progressBar.addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        if (width > 0 && !isNaN(video.duration)) {
          video.currentTime = (clickX / width) * video.duration;
        }
      });
    }

    if (muteBtn) {
      muteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        video.muted = !video.muted;
        muteBtn.textContent = video.muted ? '🔇' : '🔊';
      });
    }

    if (fullscreenBtn) {
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
    }

    video.addEventListener('ended', () => {
      player.classList.remove('playing');
      player.classList.add('paused');
      if (playPauseBtn) playPauseBtn.textContent = '▶';
    });
  }

  // ==========================================================================
  // 8. РЕАКЦИИ («ДАЙ ЛАПУ!») И КОММЕНТАРИИ
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

  function handlePostLike(postId, buttonElement) {
    const post = state.posts.find(p => p.id === postId);
    if (!post) return;

    const isCurrentlyLiked = state.likedPostIds.has(postId);

    if (isCurrentlyLiked) {
      state.likedPostIds.delete(postId);
      post.likes = Math.max(0, (post.likes || 1) - 1);
      buttonElement.classList.remove('liked');
      buttonElement.querySelector('.like-btn-text').textContent = 'Дай лапу!';
      showToast('Вы забрали лапку назад 🐾');
    } else {
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
    const authorName = localStorage.getItem('archie_commenter_name') || 'Гость блога';

    const newComment = {
      id: 'c_' + Date.now(),
      author: authorName,
      text: commentText,
      createdAt: new Date().toISOString()
    };

    post.comments.push(newComment);
    savePostsToStorage();

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

    showToast('Комментарий добавлен! 💬');
  }

  // ==========================================================================
  // 9. УДАЛЕНИЕ ЗАПИСЕЙ
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
      showToast('Запись удалена', '🗑️');
    }

    state.postToDeleteId = null;
    closeModal(DOM.deleteConfirmModal);
  });

  // ==========================================================================
  // 10. РЕДАКТИРОВАНИЕ ПРОФИЛЯ
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
    if (url) DOM.editAvatarPreview.src = url;
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
    renderFeed();
    closeModal(DOM.editProfileModal);
    showToast('Профиль обновлен! ✨');
  });

  // ==========================================================================
  // 11. ФИЛЬТРАЦИЯ И НАВИГАЦИЯ
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
  // 12. ДЕЛЕГИРОВАНИЕ СОБЫТИЙ В ЛЕНТЕ
  // ==========================================================================

  DOM.feedContainer.addEventListener('click', (e) => {
    const card = e.target.closest('.post-card');
    if (!card) return;
    const postId = card.dataset.postId;

    // Лайк
    const likeBtn = e.target.closest('[data-action="like-post"]');
    if (likeBtn) {
      e.stopPropagation();
      handlePostLike(postId, likeBtn);
      return;
    }

    // Комментарии
    const commentsToggleBtn = e.target.closest('[data-action="toggle-comments"]');
    if (commentsToggleBtn) {
      e.stopPropagation();
      toggleCommentsDrawer(postId, card);
      return;
    }

    // Удаление
    const deleteBtn = e.target.closest('[data-action="delete-post"]');
    if (deleteBtn) {
      e.stopPropagation();
      promptDeletePost(postId);
      return;
    }

    // Клик по фото для Lightbox (как в карусели, так и в одиночном фото)
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
  // 13. ПОЛНОЭКРАННЫЙ LIGHTBOX
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

  // ==========================================================================
  // 14. МОДАЛКИ
  // ==========================================================================

  function openModal(modalEl) {
    modalEl.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modalEl) {
    modalEl.style.display = 'none';
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.dataset.closeModal;
      const modal = document.getElementById(modalId);
      if (modal) closeModal(modal);
    });
  });

  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal(backdrop);
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (DOM.lightboxOverlay.style.display === 'flex') {
        closeLightbox();
        return;
      }
      document.querySelectorAll('.modal-backdrop').forEach(modal => {
        if (modal.style.display === 'flex') closeModal(modal);
      });
    }
  });

  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      DOM.header.classList.add('scrolled');
    } else {
      DOM.header.classList.remove('scrolled');
    }
  }, { passive: true });

  // Сброс демо-данных
  DOM.resetDemoDataBtn.addEventListener('click', () => {
    if (confirm('Вернуть исходные 2 демо-поста дневника Арчи? Все изменения будут сброшены.')) {
      localStorage.removeItem(STORAGE_KEYS.POSTS);
      localStorage.removeItem(STORAGE_KEYS.LIKED_POSTS);
      localStorage.removeItem(STORAGE_KEYS.PROFILE);
      loadStateFromStorage();
      renderProfile();
      renderFeed();
      showToast('Демо-данные восстановлены! 🔄');
    }
  });

  // ==========================================================================
  // 15. ЗАПУСК
  // ==========================================================================
  function initApp() {
    loadStateFromStorage();
    renderProfile();
    renderFeed();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
