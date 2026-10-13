/**
 * ============================================================================
 * ДНЕВНИК АРЧИ 🐾 — SPA С ОБЛАЧНОЙ СИНХРОНИЗАЦИЕЙ (FIREBASE REALTIME DB)
 * ============================================================================
 * - База данных: https://blog-site-50c99-default-rtdb.firebaseio.com/
 * - Мгновенная синхронизация между смартфоном, ПК и любыми устройствами
 * - Автоматический перенос локальных постов, созданных на телефоне, в облако
 * - Оптимизация изображений через Canvas (сжатие до 1200px для быстрой загрузки)
 * - Мультизагрузка фото/видео и Инстаграм-карусель
 * - Автоматическое обновление данных при переключении вкладок
 * ============================================================================
 */

(function () {
  'use strict';

  // --- НАСТРОЙКИ ОБЛАЧНОЙ БАЗЫ ДАННЫХ (FIREBASE) ---
  const FIREBASE_BASE_URL = 'https://blog-site-50c99-default-rtdb.firebaseio.com';

  const STORAGE_KEYS = {
    POSTS_CACHE: 'archie_blog_posts_cache_v2',
    PROFILE_CACHE: 'archie_blog_profile_cache_v2',
    LIKED_POSTS: 'archie_blog_liked_ids_v2'
  };

  // Демо-данные по умолчанию
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
      createdAt: '2026-10-13T18:00:00.000Z',
      comments: [
        {
          id: 'c1-1',
          author: 'Алина',
          text: 'Какой счастливый нос! 😍',
          createdAt: '2026-10-13T18:30:00.000Z'
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
      createdAt: '2026-10-13T15:00:00.000Z',
      comments: [
        {
          id: 'c2-1',
          author: 'Макс',
          text: 'Заслужил отдых на 100% 💤',
          createdAt: '2026-10-13T16:00:00.000Z'
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

  // --- СОСТОЯНИЕ (STATE) ---
  const state = {
    posts: [],
    profile: { ...DEFAULT_PROFILE },
    likedPostIds: new Set(),
    activeFilter: 'all', // 'all' | 'photo' | 'video' | 'liked'
    attachedMediaList: [],
    postToDeleteId: null,
    isSyncing: false,
    lastSyncHash: ''
  };

  // --- DOM ЭЛЕМЕНТЫ ---
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
    feedContainer: document.getElementById('feedContainer'),
    feedEmptyState: document.getElementById('feedEmptyState'),
    emptyStateDesc: document.getElementById('emptyStateDesc'),
    emptyStateResetBtn: document.getElementById('emptyStateResetBtn'),

    // Modals
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
  // 1. ОБЛАЧНАЯ СИНХРОНИЗАЦИЯ (FIREBASE REST API)
  // ==========================================================================

  function normalizePostMedia(post) {
    if (!post || typeof post !== 'object') return null;

    if (!Array.isArray(post.media)) {
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

    // Нормализуем каждый медиафайл внутри поста
    post.media = post.media.filter(Boolean).map(m => {
      if (typeof m === 'string') {
        const isVid = m.startsWith('data:video') || /\.(mp4|webm|mov)$/i.test(m);
        return { type: isVid ? 'video' : 'photo', url: m };
      }
      let mType = m.type || '';
      if (mType.startsWith('video') || /\.(mp4|webm|mov)$/i.test(m.url || '')) {
        mType = 'video';
      } else {
        mType = 'photo';
      }
      return {
        type: mType,
        url: m.url || '',
        fallbackUrl: m.fallbackUrl || '',
        posterUrl: m.posterUrl || '',
        name: m.name || ''
      };
    });

    if (!Array.isArray(post.comments)) {
      post.comments = [];
    }
    if (typeof post.likes !== 'number') {
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

  // Загрузка постов из Firebase с таймаутом и сортировкой
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
      // Сортировка: новые посты всегда сверху!
      normalized.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return normalized;
    } catch (err) {
      console.warn('Ошибка связи с Firebase:', err);
      return null;
    }
  }

  // Сохранение постов в Firebase с защитой от квоты localStorage на мобильных
  async function saveCloudPosts(posts) {
    try {
      // Сохраняем локально в кэш (перехватываем возможное QuotaExceededError на мобильном Safari)
      try {
        localStorage.setItem(STORAGE_KEYS.POSTS_CACHE, JSON.stringify(posts));
      } catch (e) {
        console.warn('Кэш localStorage переполнен, сохраняем напрямую в облако:', e);
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

  // Сохранение профиля в Firebase
  async function saveCloudProfile(profile) {
    try {
      try {
        localStorage.setItem(STORAGE_KEYS.PROFILE_CACHE, JSON.stringify(profile));
      } catch (e) {}

      await fetch(`${FIREBASE_BASE_URL}/profile.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
    } catch (err) {
      console.error('Ошибка сохранения профиля в Firebase:', err);
    }
  }

  // Интеллектуальное слияние: если на телефоне был локальный пост, автоматически отправляем его в облако!
  async function syncDataWithCloud(isInitial = false) {
    if (state.isSyncing) return;
    state.isSyncing = true;

    try {
      const cloudPosts = await fetchCloudPosts();
      const cloudProfile = await fetchCloudProfile();

      // Проверяем локальные посты из всех предыдущих версий ключей (чтобы не потерять пост со смартфона!)
      let localPosts = [];
      const cached = localStorage.getItem(STORAGE_KEYS.POSTS_CACHE) || 
                     localStorage.getItem('archie_blog_posts_v2') || 
                     localStorage.getItem('archie_blog_posts_v1');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            localPosts = parsed.filter(Boolean).map(normalizePostMedia).filter(Boolean);
          }
        } catch (e) {}
      }

      let mergedPosts = cloudPosts;

      // Если в облаке еще ничего нет — сохраняем локальные или демо
      if (!mergedPosts || mergedPosts.length === 0) {
        mergedPosts = localPosts.length > 0 ? localPosts : JSON.parse(JSON.stringify(DEFAULT_POSTS)).map(normalizePostMedia);
        mergedPosts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        await saveCloudPosts(mergedPosts);
      } else if (localPosts.length > 0) {
        // Проверяем: есть ли в памяти телефона пост, которого еще нет в облаке?
        const cloudIds = new Set(mergedPosts.map(p => p.id));
        const unsyncedLocalPosts = localPosts.filter(p => !cloudIds.has(p.id));

        if (unsyncedLocalPosts.length > 0) {
          // Добавляем локальные посты в облако!
          mergedPosts = [...unsyncedLocalPosts, ...mergedPosts];
          mergedPosts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          await saveCloudPosts(mergedPosts);
        }
      }

      if (cloudProfile) {
        state.profile = cloudProfile;
      }

      // Всегда сортируем: новые посты сверху
      mergedPosts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      // Проверяем, изменились ли данные
      const currentHash = JSON.stringify(mergedPosts.map(p => ({ id: p.id, likes: p.likes, c: (p.comments || []).length })));
      if (currentHash !== state.lastSyncHash || isInitial) {
        state.posts = mergedPosts;
        state.lastSyncHash = currentHash;
        renderProfile();
        renderFeed();
      }
    } catch (err) {
      console.warn('Синхронизация временно недоступна, работаем с кэшем:', err);
    } finally {
      state.isSyncing = false;
    }
  }

  // ==========================================================================
  // 2. ОПТИМИЗАЦИЯ ИЗОБРАЖЕНИЙ (CANVAS COMPRESSOR ДЛЯ СМАРТФОНОВ)
  // ==========================================================================

  function optimizeImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.82) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Сжатый компактный JPEG (100–250 КБ вместо 10 МБ с камеры смартфона)
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Ошибка загрузки фото'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Ошибка чтения файла'));
      reader.readAsDataURL(file);
    });
  }

  // ==========================================================================
  // 3. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ И ОТОБРАЖЕНИЕ
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

  function showToast() {
    // Всплывающие уведомления полностью отключены по запросу пользователя
  }

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

    if (DOM.statPostsCount) DOM.statPostsCount.textContent = totalPosts;
    if (DOM.statLikesCount) {
      if (totalLikes >= 1000) {
        DOM.statLikesCount.textContent = (totalLikes / 1000).toFixed(1).replace('.0', '') + 'k';
      } else {
        DOM.statLikesCount.textContent = totalLikes;
      }
    }

    const photoCount = state.posts.filter(p => (p.media || []).some(m => m.type === 'photo')).length;
    const videoCount = state.posts.filter(p => (p.media || []).some(m => m.type === 'video')).length;

    if (DOM.countAll) DOM.countAll.textContent = totalPosts;
    if (DOM.countPhoto) DOM.countPhoto.textContent = photoCount;
    if (DOM.countVideo) DOM.countVideo.textContent = videoCount;
  }

  // ==========================================================================
  // 4. МУЛЬТИЗАГРУЗКА МЕДИАФАЙЛОВ В КРЕАТОРЕ
  // ==========================================================================

  DOM.btnAttachMedia.addEventListener('click', () => {
    DOM.mediaFilesInput.click();
  });

  DOM.mediaFilesInput.addEventListener('change', async () => {
    const files = Array.from(DOM.mediaFilesInput.files || []);
    if (!files.length) return;

    for (const file of files) {
      const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov)$/i);

      if (isVideo) {
        if (file.size > 20 * 1024 * 1024) {
          showToast(`⚠️ Видео ${file.name} больше 20 МБ`, '🎥');
          continue;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          state.attachedMediaList.push({
            type: 'video',
            url: e.target.result,
            name: file.name
          });
          renderAttachedMediaTray();
        };
        reader.readAsDataURL(file);
      } else {
        // Фото сжимаем через Canvas для молниеносной синхронизации по сети
        try {
          const optimizedDataUrl = await optimizeImage(file);
          state.attachedMediaList.push({
            type: 'photo',
            url: optimizedDataUrl,
            name: file.name
          });
          renderAttachedMediaTray();
        } catch (err) {
          showToast(`⚠️ Не удалось обработать ${file.name}`);
        }
      }
    }

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

      thumbWrap.querySelector('.thumb-remove-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        state.attachedMediaList.splice(index, 1);
        renderAttachedMediaTray();
      });

      DOM.mediaPreviewsList.appendChild(thumbWrap);
    });
  }

  // Публикация нового поста с мгновенной отправкой в Firebase
  DOM.inlinePublishBtn.addEventListener('click', async () => {
    const text = DOM.inlinePostText.value.trim();
    const media = state.attachedMediaList;

    if (!text && media.length === 0) {
      showToast('⚠️ Напишите текст или добавьте фото/видео через «+»');
      DOM.inlinePostText.focus();
      return;
    }

    DOM.inlinePublishBtn.disabled = true;
    DOM.inlinePublishBtn.textContent = 'Сохранение...';

    try {
      const newPost = {
        id: 'post_' + Date.now(),
        media: [...media],
        text: text,
        likes: 0,
        createdAt: new Date().toISOString(),
        comments: []
      };

      state.posts.unshift(newPost);

      // Сброс полей креатора
      DOM.inlinePostText.value = '';
      state.attachedMediaList = [];
      renderAttachedMediaTray();
      renderFeed();

      // Сохраняем в Firebase
      const success = await saveCloudPosts(state.posts);

      if (success) {
        showToast('История опубликована и доступна на всех устройствах! ☁️🐾🎉');
      } else {
        showToast('История сохранена в кэш. Проверьте интернет-соединение.');
      }

      DOM.feedContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      console.error('Ошибка при публикации:', err);
      showToast('⚠️ Произошла ошибка при публикации');
    } finally {
      DOM.inlinePublishBtn.disabled = false;
      DOM.inlinePublishBtn.textContent = 'Опубликовать';
    }
  });

  if (DOM.openNewPostFocusBtn) {
    DOM.openNewPostFocusBtn.addEventListener('click', () => {
      DOM.inlinePostText.focus();
      DOM.inlinePostText.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  // ==========================================================================
  // 5. ОТРИСОВКА ЛЕНТЫ ПУБЛИКАЦИЙ
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

    let typeLabel = '📝 Заметка';
    const hasPhotos = mediaList.some(m => m && m.type === 'photo');
    const hasVideos = mediaList.some(m => m && m.type === 'video');
    if (hasPhotos && hasVideos) {
      typeLabel = `📸🎥 Альбом (${mediaList.length})`;
    } else if (hasVideos) {
      typeLabel = mediaList.length > 1 ? `🎥 Видео (${mediaList.length})` : '🎥 Видео';
    } else if (hasPhotos) {
      typeLabel = mediaList.length > 1 ? `📸 Фото (${mediaList.length})` : '📸 Фото';
    }

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
            <time class="post-date" datetime="${post.createdAt || ''}">${formatDate(post.createdAt)}</time>
          </div>
        </div>
        <div class="post-header-actions">
          <span class="post-type-tag">${typeLabel}</span>
          <button type="button" class="post-delete-btn" title="Удалить запись" data-action="delete-post" aria-label="Удалить запись">🗑️</button>
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
    } else if (mediaList.length === 1 && mediaList[0] && mediaList[0].type === 'video') {
      try {
        const playerWrap = card.querySelector('.custom-video-player');
        if (playerWrap) initCustomVideoPlayer(playerWrap);
      } catch (playerErr) {
        console.warn('Ошибка инициализации видеоплеера:', playerErr);
      }
    }

    return card;
  }

  // ==========================================================================
  // 6. ИНСТАГРАМ-КАРУСЕЛЬ МЕДИА В ПОСТАХ
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
    if (!track || !slides || slides.length === 0) return;

    const prevBtn = container.querySelector('.carousel-prev-btn');
    const nextBtn = container.querySelector('.carousel-next-btn');
    const counterBadge = container.querySelector('.carousel-counter-badge');
    const dots = container.querySelectorAll('.carousel-dot');
    const total = slides.length;

    let currentIndex = 0;

    slides.forEach(slide => {
      try {
        const player = slide.querySelector('.custom-video-player');
        if (player) initCustomVideoPlayer(player);
      } catch (e) {}
    });

    function pauseAllVideos() {
      slides.forEach(slide => {
        try {
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
        } catch (e) {}
      });
    }

    function updateCarousel() {
      pauseAllVideos();
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
    if (!player) return;
    const video = player.querySelector('.custom-video-element');
    if (!video) return;
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
  // 8. РЕАКЦИИ И КОММЕНТАРИИ
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
    localStorage.setItem(STORAGE_KEYS.LIKED_POSTS, JSON.stringify(Array.from(state.likedPostIds)));
    updateCounters();

    // Синхронизируем обновленные лайки с Firebase
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
    const authorName = localStorage.getItem('archie_commenter_name') || 'Друг Арчи';

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

    showToast('Комментарий добавлен! 💬');

    // Сохраняем в Firebase
    await saveCloudPosts(state.posts);
  }

  // ==========================================================================
  // 9. УДАЛЕНИЕ ЗАПИСЕЙ
  // ==========================================================================

  function promptDeletePost(postId) {
    state.postToDeleteId = postId;
    openModal(DOM.deleteConfirmModal);
  }

  DOM.confirmDeletePostBtn.addEventListener('click', async () => {
    if (!state.postToDeleteId) return;

    const index = state.posts.findIndex(p => p.id === state.postToDeleteId);
    if (index !== -1) {
      state.posts.splice(index, 1);
      state.likedPostIds.delete(state.postToDeleteId);
      localStorage.setItem(STORAGE_KEYS.LIKED_POSTS, JSON.stringify(Array.from(state.likedPostIds)));
      renderFeed();
      showToast('Запись удалена на всех устройствах', '🗑️');
      await saveCloudPosts(state.posts);
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

  DOM.editAvatarFileInput.addEventListener('change', async () => {
    if (DOM.editAvatarFileInput.files && DOM.editAvatarFileInput.files[0]) {
      try {
        const compressedAvatar = await optimizeImage(DOM.editAvatarFileInput.files[0], 500, 500, 0.85);
        DOM.editAvatarPreview.src = compressedAvatar;
      } catch (e) {
        showToast('⚠️ Ошибка обработки фото аватара');
      }
    }
  });

  DOM.editAvatarUrlInput.addEventListener('input', () => {
    const url = DOM.editAvatarUrlInput.value.trim();
    if (url) DOM.editAvatarPreview.src = url;
  });

  DOM.editProfileForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    state.profile.name = DOM.editDogName.value.trim() || 'Арчи';
    state.profile.breed = DOM.editDogBreed.value.trim() || 'Золотистый ретривер';
    state.profile.age = DOM.editDogAge.value.trim() || '3 года';
    state.profile.status = DOM.editDogStatus.value.trim() || 'Любитель мячиков 🦴';
    state.profile.avatarUrl = DOM.editAvatarPreview.src;

    renderProfile();
    renderFeed();
    closeModal(DOM.editProfileModal);
    showToast('Профиль обновлен в облаке! ✨');

    await saveCloudProfile(state.profile);
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

    const deleteBtn = e.target.closest('[data-action="delete-post"]');
    if (deleteBtn) {
      e.stopPropagation();
      promptDeletePost(postId);
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
  // 13. ПОЛНОЭКРАННЫЙ LIGHTBOX & МОДАЛКИ
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

  // Сброс к демо-данным в облаке
  DOM.resetDemoDataBtn.addEventListener('click', async () => {
    if (confirm('Сбросить блог Арчи к исходным 2 демо-постам в облаке? Все добавленные посты будут удалены.')) {
      state.posts = JSON.parse(JSON.stringify(DEFAULT_POSTS));
      state.profile = { ...DEFAULT_PROFILE };
      state.likedPostIds.clear();
      localStorage.removeItem(STORAGE_KEYS.LIKED_POSTS);

      renderProfile();
      renderFeed();
      showToast('Демо-данные восстановлены в облаке! 🔄');

      await saveCloudPosts(state.posts);
      await saveCloudProfile(state.profile);
    }
  });

  // ==========================================================================
  // 14. ЗАПУСК И ФОНОВОЕ АВТООБНОВЛЕНИЕ
  // ==========================================================================

  async function initApp() {
    // 1. Быстро загружаем кэш для мгновенной отрисовки без задержек
    const cachedLiked = localStorage.getItem(STORAGE_KEYS.LIKED_POSTS);
    if (cachedLiked) {
      try { state.likedPostIds = new Set(JSON.parse(cachedLiked)); } catch (e) {}
    }

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

    // 2. Синхронизируем с Firebase в реальном времени
    await syncDataWithCloud(true);

    // 3. Фоновое обновление: каждые 8 секунд опрашиваем облако для мгновенного появления новых постов
    setInterval(() => {
      syncDataWithCloud(false);
    }, 8000);

    // 4. При возвращении на вкладку браузера сразу проверяем обновления
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
