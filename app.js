const CATEGORY_IMAGE = './sinnon-category-map.png';
const GOOGLE_CLIENT_ID = '736171088462-1b3r0gar6sd7q9tsndc02vbrjq3m8nk7.apps.googleusercontent.com';
const STORAGE_KEYS = { config: 'jijifarm-gas-config', localProducts: 'jijifarm-local-products' };

const categories = [
  { slug: 'pesticides', name: '藥劑', tone: 'green', description: '依防治對象快速查找藥劑資料。', children: ['殺蟲劑', '殺菌劑', '殺蟎劑', '殺草劑'] },
  { slug: 'fertilizers', name: '肥料', tone: 'lime', description: '從速效、有機到微量元素，一次整理。', children: ['速效肥系列', '半有機系列', '蓋美水溶性肥系列', '新樂園', '寶島', '長壽有機肥', '營養液肥', '腐植酸', '培養土', '微量元素'] },
  { slug: 'liquid-fertilizers', name: '液肥', tone: 'purple', description: '液肥系列與植物萃取產品集中查找。', children: ['神真水系列', '善玉肥系列', '植物萃取系列'] },
  { slug: 'materials', name: '資材', tone: 'cyan', description: '田間使用的布、套袋、噴霧桶與種子。', children: ['PE布', '套袋系列', '鋰電噴霧桶', '種子'] }
];

const demoProducts = [
  { id: 'demo-001', name: '示範品｜蓋美即溶肥 1 號', categorySlug: 'fertilizers', subCategory: '蓋美水溶性肥系列', summary: '示範資料：用於展示肥料產品卡片與詳情欄位。', tags: ['水溶性', '示範資料'], crops: ['資料待補'], purpose: '資料待補', ingredients: '資料待補', specifications: '資料待補', usage: '資料待補', dilution: '資料待補', precautions: '請依產品標示與合法使用規範為準。', status: 'published', imageUrl: '' },
  { id: 'demo-002', name: '示範品｜神真水系列', categorySlug: 'liquid-fertilizers', subCategory: '神真水系列', summary: '示範資料：用於展示液肥系列的查找流程。', tags: ['液肥', '示範資料'], crops: ['資料待補'], purpose: '資料待補', ingredients: '資料待補', specifications: '資料待補', usage: '資料待補', dilution: '資料待補', precautions: '請依產品標示與合法使用規範為準。', status: 'published', imageUrl: '' },
  { id: 'demo-003', name: '示範品｜農用 PE 布', categorySlug: 'materials', subCategory: 'PE布', summary: '示範資料：用於展示資材產品與規格欄位。', tags: ['資材', '示範資料'], crops: ['資料待補'], purpose: '資料待補', ingredients: '不適用', specifications: '資料待補', usage: '資料待補', dilution: '不適用', precautions: '使用前請確認尺寸與作物需求。', status: 'published', imageUrl: '' },
  { id: 'demo-004', name: '示範品｜田間防護套袋', categorySlug: 'materials', subCategory: '套袋系列', summary: '示範資料：用於展示套袋系列的產品卡片。', tags: ['套袋', '示範資料'], crops: ['果樹'], purpose: '資料待補', ingredients: '不適用', specifications: '資料待補', usage: '資料待補', dilution: '不適用', precautions: '資料待補', status: 'published', imageUrl: '' },
  { id: 'demo-005', name: '示範品｜植物萃取系列', categorySlug: 'liquid-fertilizers', subCategory: '植物萃取系列', summary: '示範資料：用於展示植物萃取產品。', tags: ['植物萃取', '示範資料'], crops: ['資料待補'], purpose: '資料待補', ingredients: '資料待補', specifications: '資料待補', usage: '資料待補', dilution: '資料待補', precautions: '請依產品標示與合法使用規範為準。', status: 'published', imageUrl: '' }
];

const storedConfig = loadJson(STORAGE_KEYS.config, { gasUrl: '' });
const defaultAnnouncement = { enabled: true, title: '優惠與營業資訊', body: '最新產品、優惠與活動資訊將優先公告於此，歡迎先查看分類或直接來電洽詢。', lineUrl: 'https://lin.ee/xkrkExA', lineAccount: '@sn2761777', qrImage: './line-official-qr.png', imageUrl: '' };
const storedAnnouncement = storedConfig.announcement || {};
const state = { products: [], query: '', sort: 'name', config: { gasUrl: '', ...storedConfig, announcement: { ...defaultAnnouncement, ...storedAnnouncement, lineUrl: storedAnnouncement.lineUrl || defaultAnnouncement.lineUrl, lineAccount: storedAnnouncement.lineAccount || defaultAnnouncement.lineAccount, qrImage: storedAnnouncement.qrImage || defaultAnnouncement.qrImage } }, auth: { authenticated: false, user: null }, connectionIssue: false, connectionVerified: false, editingId: '', mobileMenu: false };
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const slugify = (text = '') => encodeURIComponent(text.trim().toLowerCase().replace(/\s+/g, '-'));
const categoryOf = slug => categories.find(item => item.slug === slug);
const categoryName = slug => categoryOf(slug)?.name || '未分類';
const subSlug = name => slugify(name);
const safeUrl = value => { try { const url = new URL(String(value || '')); return ['http:', 'https:'].includes(url.protocol) ? url.toString() : ''; } catch { return ''; } };
const normalizeDriveImageUrl = value => { const source = String(value || ''); try { const url = new URL(source); if (!/(^|\.)drive\.google\.com$|(^|\.)driveusercontent\.google\.com$|(^|\.)googleusercontent\.com$/.test(url.hostname)) return source; const id = url.searchParams.get('id') || source.match(/\/d\/([A-Za-z0-9_-]+)/)?.[1]; return id ? `https://lh3.googleusercontent.com/d/${id}=w1600` : source; } catch { return source; } };
const safeImageSource = value => { const source = String(value || ''); return source.startsWith('data:image/') ? source : normalizeDriveImageUrl(safeUrl(source)); };
const assetUrl = value => { const source = String(value || ''); return /^https?:\/\//.test(source) || source.startsWith('data:') ? source : `./${source.replace(/^\/+/, '')}`; };
function loadJson(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function saveJson(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function currentMode() { return state.connectionVerified && !state.connectionIssue ? 'connected' : 'demo'; }
function connectionLabel() { return currentMode() === 'connected' ? '● 已連線' : '● 示範資料模式'; }
function allProducts() { return [...state.products].filter(product => product.status === 'published'); }
function productById(id) { return state.products.find(item => String(item.id) === String(id)); }
function publishedProductById(id) { const product = productById(id); return product?.status === 'published' ? product : null; }
function setTitle(title) { document.title = title ? `${title}｜集集興農產品速查網` : '集集興農產品速查網'; }
function showToast(message, type = '') { const region = $('#toast-region'); const toast = document.createElement('div'); toast.className = `toast ${type}`; toast.textContent = message; region.appendChild(toast); setTimeout(() => toast.remove(), 3600); }
function gasVerifyGoogle(credential) {
  return new Promise((resolve, reject) => {
    if (!state.config.gasUrl) return reject(new Error('請先在資料來源設定填入 GAS /exec 網址。'));
    const callback = `jijifarm_google_${Date.now()}`;
    const script = document.createElement('script');
    const timer = setTimeout(() => { cleanup(); reject(new Error('Google 登入驗證逾時。')); }, 10000);
    function cleanup() { clearTimeout(timer); delete window[callback]; script.remove(); }
    window[callback] = payload => { cleanup(); if (!payload?.ok) reject(new Error(payload?.error || 'Google 帳號驗證失敗。')); else resolve(payload.user); };
    script.src = `${state.config.gasUrl}${state.config.gasUrl.includes('?') ? '&' : '?'}action=verifyGoogle&credential=${encodeURIComponent(credential)}&callback=${callback}`;
    script.onerror = () => { cleanup(); reject(new Error('無法連線至 GAS，請確認正式 /exec 網址。')); };
    document.body.appendChild(script);
  });
}
function decodeGoogleCredential(credential) {
  try {
    const encoded = String(credential || '').split('.')[1];
    if (!encoded) throw new Error('Google 登入憑證格式不正確。');
    const payload = JSON.parse(decodeURIComponent(escape(atob(encoded.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - encoded.length % 4) % 4)))));
    if (payload.aud !== GOOGLE_CLIENT_ID) throw new Error('Google Client ID 不符。');
    if (String(payload.email_verified).toLowerCase() !== 'true') throw new Error('Google 帳號尚未完成驗證。');
    if (String(payload.email || '').toLowerCase() !== 'notemaker@gmail.com') throw new Error('此 Google 帳號沒有管理權限。');
    return { email: String(payload.email), name: String(payload.name || ''), picture: String(payload.picture || '') };
  } catch (error) { throw new Error(error.message || 'Google 登入憑證無法讀取。'); }
}
function initializeGoogleIdentity() {
  if (!window.google?.accounts?.id) return false;
  google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleGoogleCredential, auto_select: false });
  return true;
}
async function beginGoogleLogin() {
  if (!initializeGoogleIdentity()) return showToast('Google 登入元件尚未載入，請重新整理後再試。', 'error');
  google.accounts.id.prompt();
}
async function handleGoogleCredential(response) {
  try {
    const localUser = decodeGoogleCredential(response.credential);
    let user = localUser;
    if (state.config.gasUrl) {
      try { user = await gasVerifyGoogle(response.credential); state.connectionIssue = false; }
      catch (error) { state.connectionIssue = true; showToast(`Google 已登入，但 GAS 尚未連線：${error.message}`, 'error'); }
    }
    sessionStorage.setItem('jijifarm-google-id-token', response.credential);
    state.auth = { authenticated: true, user };
    render();
    if (!state.config.gasUrl) showToast(`已使用 ${user.email} 登入，請接著設定 GAS /exec。`);
  } catch (error) { sessionStorage.removeItem('jijifarm-google-id-token'); state.auth = { authenticated: false, user: null }; showToast(error.message, 'error'); }
}
async function loadAuth() {
  const credential = sessionStorage.getItem('jijifarm-google-id-token');
  if (!credential) { state.auth = { authenticated: false, user: null }; return; }
  try {
    let user = decodeGoogleCredential(credential);
    if (state.config.gasUrl) {
      try { user = await gasVerifyGoogle(credential); state.connectionIssue = false; }
      catch { state.connectionIssue = true; }
    }
    state.auth = { authenticated: true, user };
  } catch { sessionStorage.removeItem('jijifarm-google-id-token'); state.auth = { authenticated: false, user: null }; }
}
function logoutGoogle() { sessionStorage.removeItem('jijifarm-google-id-token'); state.auth = { authenticated: false, user: null }; render(); showToast('已登出 Google 管理帳號。'); }
function isAuthenticated() { return state.auth.authenticated === true; }
function renderLoginRequired() { setTitle('登入'); shell(`<div class="container page-shell auth-required"><div class="auth-card"><span class="pill">管理功能</span><h1>請先登入</h1><p>資料來源與管理後台僅開放 <strong>notemaker@gmail.com</strong>。請使用 Google 登入。</p><button class="btn btn-primary" id="google-login-required" type="button">使用 Google 登入</button><a class="btn btn-ghost" href="#/home">先瀏覽產品分類</a></div></div>`); $('#google-login-required')?.addEventListener('click', beginGoogleLogin); }
function missing(value, fallback = '資料待補') { return value ? escapeHtml(value) : `<span class="missing">${fallback}</span>`; }
function normalizeProduct(raw = {}) {
  const categorySlug = raw.categorySlug || raw.category_slug || raw.category || 'fertilizers';
  const cropValue = raw.crops || raw.crop || raw.applicableCrops || '';
  const tagsValue = raw.tags || raw.tag || '';
  return {
    id: raw.id || `gas-${crypto.randomUUID?.() || Date.now()}`,
    name: raw.name || raw.productName || '未命名產品',
    categorySlug,
    subCategory: raw.subCategory || raw.subcategory || raw.subCategoryName || '未分類',
    summary: raw.summary || raw.description || '',
    tags: Array.isArray(tagsValue) ? tagsValue : String(tagsValue).split(/[，,|]/).map(v => v.trim()).filter(Boolean),
    crops: Array.isArray(cropValue) ? cropValue : String(cropValue).split(/[，,|]/).map(v => v.trim()).filter(Boolean),
    purpose: raw.purpose || raw.target || '',
    ingredients: raw.ingredients || raw.ingredient || '',
    specifications: raw.specifications || raw.spec || '',
    usage: raw.usage || '',
    dilution: raw.dilution || '',
    precautions: raw.precautions || raw.notice || '',
    imageUrl: raw.imageUrl || raw.image || '',
    status: raw.status || 'published',
    updatedAt: raw.updatedAt || ''
  };
}

async function loadProducts() {
  const local = loadJson(STORAGE_KEYS.localProducts, []);
  state.connectionVerified = false;
  updateChrome();
  if (!state.config.gasUrl) {
    state.connectionIssue = false;
    state.connectionVerified = false;
    state.products = [...demoProducts, ...local];
    return;
  }
  try {
    const records = await gasRead('all');
    state.connectionIssue = false;
    state.connectionVerified = true;
    state.products = records.map(normalizeProduct);
  } catch (error) {
    state.connectionIssue = true;
    state.connectionVerified = false;
    state.products = [...demoProducts, ...local];
    showToast(`GAS 讀取失敗，已暫時回到示範資料：${error.message}`, 'error');
  }
  if (state.config.gasUrl) {
    try { await loadRemoteAnnouncement(); } catch (error) { state.connectionIssue = true; state.connectionVerified = false; showToast(`公告尚未同步：${error.message}`, 'error'); }
  }
  updateChrome();
}
function gasRead(action) {
  return new Promise((resolve, reject) => {
    const callback = `jijifarm_cb_${Date.now()}`;
    const script = document.createElement('script');
    const timer = setTimeout(() => { cleanup(); reject(new Error('連線逾時，請確認 /exec 網址與部署權限。')); }, 9000);
    function cleanup() { clearTimeout(timer); delete window[callback]; script.remove(); }
    window[callback] = payload => { cleanup(); if (!payload?.ok) reject(new Error(payload?.error || 'GAS 回傳格式錯誤。')); else resolve(payload.records || []); };
    script.src = `${state.config.gasUrl}${state.config.gasUrl.includes('?') ? '&' : '?'}action=${encodeURIComponent(action)}&callback=${callback}`;
    script.onerror = () => { cleanup(); reject(new Error('無法載入 GAS，請檢查網址是否為正式 /exec。')); };
    document.body.appendChild(script);
  });
}
function gasReadAnnouncement() {
  return new Promise((resolve, reject) => {
    const callback = `jijifarm_announcement_${Date.now()}`;
    const script = document.createElement('script');
    const timer = setTimeout(() => { cleanup(); reject(new Error('公告同步逾時，請確認 GAS 已更新並重新部署。')); }, 9000);
    function cleanup() { clearTimeout(timer); delete window[callback]; script.remove(); }
    window[callback] = payload => { cleanup(); if (!payload?.ok) reject(new Error(payload?.error || 'GAS 公告回傳格式錯誤。')); else resolve(payload.announcement || {}); };
    script.src = `${state.config.gasUrl}${state.config.gasUrl.includes('?') ? '&' : '?'}action=announcement&callback=${callback}`;
    script.onerror = () => { cleanup(); reject(new Error('無法讀取 GAS 公告，請確認 GAS 已重新部署。')); };
    document.body.appendChild(script);
  });
}
async function loadRemoteAnnouncement() {
  const remote = await gasReadAnnouncement();
  state.config.announcement = { ...defaultAnnouncement, ...state.config.announcement, ...remote, enabled: remote.enabled !== false };
  saveJson(STORAGE_KEYS.config, state.config);
}
function gasMutation(payload) {
  return new Promise((resolve, reject) => {
    if (!state.config.gasUrl) return reject(new Error('尚未設定 GAS /exec 網址。'));
    const requestId = crypto.randomUUID?.() || `req-${Date.now()}`;
    const credential = sessionStorage.getItem('jijifarm-google-id-token');
    if (!credential) return reject(new Error('請先使用 Google 登入。'));
    const body = JSON.stringify({ ...payload, requestId, credential });
    fetch(state.config.gasUrl, { method: 'POST', mode: 'no-cors', body }).catch(() => {});
    let attempts = 0;
    const poll = async () => {
      attempts += 1;
      try {
        const result = await gasStatus(requestId);
        if (result.done) return result.ok ? resolve(result) : reject(new Error(result.error || 'GAS 寫入失敗。'));
      } catch (error) { if (attempts > 8) return reject(error); }
      if (attempts > 12) return reject(new Error('寫入結果尚未確認，請重新整理試算表後再檢查，避免重複新增。'));
      setTimeout(poll, 900);
    };
    setTimeout(poll, 1100);
  });
}
function gasStatus(requestId) {
  return new Promise((resolve, reject) => {
    const callback = `jijifarm_status_${Date.now()}`;
    const script = document.createElement('script'); const timer = setTimeout(() => { cleanup(); reject(new Error('狀態確認逾時。')); }, 7000);
    function cleanup() { clearTimeout(timer); delete window[callback]; script.remove(); }
    window[callback] = payload => { cleanup(); resolve(payload || { done: false }); };
    script.src = `${state.config.gasUrl}${state.config.gasUrl.includes('?') ? '&' : '?'}action=status&requestId=${encodeURIComponent(requestId)}&callback=${callback}`;
    script.onerror = () => { cleanup(); reject(new Error('無法確認 GAS 寫入狀態。')); }; document.body.appendChild(script);
  });
}

function updateChrome() { $('#footer-mode').textContent = connectionLabel(); const headerStatus = $('#header-connection-status'); if (headerStatus) { headerStatus.textContent = connectionLabel(); headerStatus.hidden = currentMode() !== 'connected'; } const sourceLink = $('#data-source-link'); if (sourceLink) sourceLink.hidden = currentMode() === 'connected'; $$('[data-auth-only]').forEach(link => { link.hidden = link.dataset.authOnly === 'admin' && !isAuthenticated(); }); const authAction = $('#auth-action'); if (authAction) { authAction.textContent = isAuthenticated() ? '登出' : 'Google 登入'; authAction.onclick = isAuthenticated() ? logoutGoogle : beginGoogleLogin; authAction.classList.toggle('is-logged-in', isAuthenticated()); authAction.title = isAuthenticated() ? `${state.auth.user?.email || ''}｜登出` : '使用 Google 登入'; } $('.topnav')?.classList.toggle('open', state.mobileMenu); $('#mobile-menu')?.setAttribute('aria-expanded', String(state.mobileMenu)); }
function render() { updateChrome(); const path = location.hash ? location.hash.replace(/^#/, '') : (location.pathname === '/' ? '/home' : location.pathname); const [route, ...rest] = path.split('/').filter(Boolean); if (route === 'category') return renderCategory(rest[0], rest[1]); if (route === 'products') return renderProduct(rest[0]); if (route === 'settings') return renderSettings(); if (route === 'admin') return isAuthenticated() ? renderAdmin() : renderLoginRequired(); return renderHome(); }
function shell(content) { $('#app').innerHTML = content; $('#app').focus({ preventScroll: true }); updateChrome(); }
function renderHome() {
  setTitle('');
  const announcement = state.config.announcement; const lineUrl = safeUrl(announcement.lineUrl); const announcementImage = safeImageSource(announcement.imageUrl);
  shell(`<div class="container">
    ${announcement.enabled ? `<aside class="announcement" aria-label="最新公告"><span class="announcement-badge">最新公告</span>${announcementImage ? `<button class="announcement-image-trigger" type="button" data-announcement-image="${escapeHtml(announcementImage)}" data-announcement-title="${escapeHtml(announcement.title)}" aria-label="放大查看公告圖片"><img class="announcement-image" src="${escapeHtml(announcementImage)}" alt="活動圖片，點擊放大" /></button>` : ''}<div class="announcement-copy"><strong>${escapeHtml(announcement.title)}</strong><p>${escapeHtml(announcement.body)}</p><small>LINE 官方帳號：${escapeHtml(announcement.lineAccount)}</small></div><div class="announcement-line-area"><img src="${escapeHtml(assetUrl(announcement.qrImage))}" alt="LINE 官方帳號 QR Code" /><a class="btn announcement-line ${lineUrl ? '' : 'is-disabled'}" href="${lineUrl ? escapeHtml(lineUrl) : '#/settings'}" ${lineUrl ? 'target="_blank" rel="noopener"' : ''}>加入 LINE 官方帳號</a></div></aside>` : ''}
    <section class="hero">
      <div>
        <h1>農業<em>產品查找</em></h1>
        <p class="hero-lead">把農業產品依照用途與分類整理好，讓你在田邊、店裡或手機上，都能快速找到需要的資料。</p>
        <div class="hero-actions"><form class="home-search-form" id="home-search"><div class="search-filter-row"><label><span>大分類</span><select name="homeCategory" id="home-category-select"><option value="all">全部大分類</option>${categories.map(cat => `<option value="${cat.slug}">${cat.name}</option>`).join('')}</select></label><label><span>子分類</span><select name="homeSubCategory" id="home-subcategory-select"><option value="">全部子分類</option></select></label></div><div class="home-search-action"><button type="submit">開始查找</button></div></form></div>
      </div>
      <div class="map-card"><img src="${CATEGORY_IMAGE}" alt="興農產品四大分類圖" /></div>
    </section>
    <div class="section-heading"><div class="section-title-row"><div><p class="section-eyebrow">產品分類</p><h2>從四大分類開始</h2></div></div><p>依照興農分類圖整理，點選一區後可以再往下選子分類。</p></div>
    <section class="category-grid">${categories.map((cat, index) => categoryTile(cat, index)).join('')}</section>
    <div class="section-heading"><div><p class="section-eyebrow">產品資料</p><h2>${currentMode() === 'connected' ? '最新上架產品' : '目前示範資料'}</h2></div><a class="btn btn-secondary" href="#/category/fertilizers">查看全部產品 →</a></div>
    ${allProducts().length ? `<section class="product-grid">${allProducts().slice(0, 4).map(productCard).join('')}</section>` : emptyState('目前還沒有已上架產品', '管理員可在後台新增產品，或先回到四大分類瀏覽。')}
  </div>`);
  const homeCategory = $('#home-category-select'); const homeSubCategory = $('#home-subcategory-select');
  const populateHomeSubcategories = categorySlug => { const cat = categoryOf(categorySlug); homeSubCategory.innerHTML = `<option value="">全部子分類</option>${cat ? cat.children.map(child => `<option value="${escapeHtml(child)}">${escapeHtml(child)}</option>`).join('') : ''}`; homeSubCategory.disabled = !cat; };
  homeCategory?.addEventListener('change', event => populateHomeSubcategories(event.target.value));
  populateHomeSubcategories(homeCategory?.value || 'all');
  $('#home-search')?.addEventListener('submit', event => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget).entries()); state.query = ''; const category = data.homeCategory || 'all'; const sub = data.homeSubCategory || ''; location.hash = sub && category !== 'all' ? `#/category/${category}/${encodeURIComponent(sub)}` : `#/category/${category}`; });
 
}
function categoryTile(cat) { return `<a class="category-tile ${cat.tone}" href="#/category/${cat.slug}"><div class="tile-top"><span class="tile-arrow">↗</span></div><h3>${cat.name}</h3><p>${cat.description}</p><div class="chip-row">${cat.children.slice(0, 3).map(item => `<span class="chip">${item}</span>`).join('')}<span class="chip">＋${cat.children.length - 3} 項</span></div></a>`; }
function renderCategory(categorySlug, childSlug) {
  const cat = categorySlug === 'all' ? null : categoryOf(categorySlug); if (categorySlug !== 'all' && !cat) return renderNotFound();
  const subName = childSlug ? decodeURIComponent(childSlug) : '';
  const visibleCategories = cat ? [cat] : categories;
  const baseProducts = cat ? allProducts().filter(p => p.categorySlug === cat.slug) : allProducts();
  const filtered = filterProducts(baseProducts, subName);
  setTitle(cat ? `${cat.name}${subName ? `｜${subName}` : ''}` : '搜尋產品');
  shell(`<div class="container page-shell"><div class="breadcrumb"><a href="#/home">首頁</a><span>／</span>${cat ? `<a href="#/category/${cat.slug}">${cat.name}</a>` : '<span>產品搜尋</span>'}${subName ? `<span>／</span><strong>${escapeHtml(subName)}</strong>` : ''}</div>
    <div class="page-intro"><div><span class="pill ${currentMode()}">${connectionLabel()}</span><h1>${cat ? cat.name : '搜尋產品'}</h1></div><p>${cat ? cat.description : '可依產品名稱、關鍵標籤或適用作物查找目前已上架的資料。'}</p></div>
    ${cat ? `<div class="subcategory-grid">${subName ? `<a class="subcategory-link active ${cat.tone}" href="#/category/${cat.slug}/${subSlug(subName)}"><span>${subName}</span><span>✓</span></a><a class="subcategory-link" href="#/category/${cat.slug}"><span>查看全部子分類</span><span>↩</span></a>` : cat.children.map(child => `<a class="subcategory-link" href="#/category/${cat.slug}/${subSlug(child)}"><span>${child}</span><span>→</span></a>`).join('')}</div>` : ''}
    <div class="toolbar"><span class="result-count">找到 ${filtered.length} 項產品</span></div>
    ${filtered.length ? `<section class="product-grid">${filtered.sort(sorter).map(productCard).join('')}</section>` : emptyState(cat ? `目前「${subName || cat.name}」還沒有已上架產品` : '找不到符合條件的產品', '可以清除關鍵字，或先回到四大分類繼續瀏覽。')}
  </div>`);
 
}
function filterProducts(products, subName = '') { const query = state.query.toLowerCase(); return products.filter(product => { const inSub = !subName || product.subCategory === subName; const haystack = [product.name, product.subCategory, product.summary, ...(product.tags || []), ...(product.crops || [])].join(' ').toLowerCase(); return inSub && (!query || haystack.includes(query)); }); }
function sorter(a, b) { if (state.sort === 'category') return `${a.categorySlug}${a.name}`.localeCompare(`${b.categorySlug}${b.name}`, 'zh-Hant'); return a.name.localeCompare(b.name, 'zh-Hant'); }
function productCard(product) { const cat = categoryOf(product.categorySlug); return `<article class="product-card"><div class="product-visual">${product.imageUrl ? `<img src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(product.name)}產品圖" loading="lazy" />` : '<div class="product-placeholder">產品圖<br/>資料待補</div>'}<span class="product-badge pill ${currentMode()}">${cat?.name || '產品'}</span></div><div class="product-body"><span class="product-category">${escapeHtml(product.subCategory)}</span><h3>${escapeHtml(product.name)}</h3><p class="product-summary">${missing(product.summary)}</p>${product.crops?.length ? `<p class="product-crops">適用：${product.crops.map(escapeHtml).join('、')}</p>` : ''}<div class="chip-row">${(product.tags || []).slice(0, 3).map(tag => `<span class="chip">#${escapeHtml(tag)}</span>`).join('')}</div><div class="card-actions"><a class="btn btn-primary" href="#/products/${encodeURIComponent(product.id)}">查看詳情</a></div></div></article>`; }
function emptyState(title, message) { return `<div class="empty-state"><div class="empty-icon">⌕</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(message)}</p><a class="btn btn-secondary" href="#/home">回到四大分類</a></div>`; }
function renderProduct(id) { const product = publishedProductById(decodeURIComponent(id)); if (!product) return renderNotFound(); const cat = categoryOf(product.categorySlug); setTitle(product.name); shell(`<div class="container page-shell"><div class="breadcrumb"><a href="#/home">首頁</a><span>／</span><a href="#/category/${product.categorySlug}">${cat?.name || '產品'}</a><span>／</span><strong>${escapeHtml(product.name)}</strong></div><div class="detail-layout"><div class="detail-image">${product.imageUrl ? `<img src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(product.name)}產品圖" />` : '<div class="product-placeholder">產品圖<br/>資料待補</div>'}</div><article class="detail-content"><span class="pill ${currentMode()}">${connectionLabel()}</span><h1>${escapeHtml(product.name)}</h1><div class="chip-row">${(product.tags || []).map(tag => `<span class="chip">#${escapeHtml(tag)}</span>`).join('')}</div><p class="lead">${missing(product.summary)}</p><div class="detail-section"><h2>用途／防治對象</h2><p>${missing(product.purpose)}</p></div><div class="detail-section"><h2>成分與規格</h2><table class="detail-table"><tbody><tr><th>主要成分</th><td>${missing(product.ingredients)}</td></tr><tr><th>產品規格</th><td>${missing(product.specifications)}</td></tr><tr><th>適用作物</th><td>${product.crops?.length ? product.crops.map(escapeHtml).join('、') : '<span class="missing">資料待補</span>'}</td></tr></tbody></table></div><div class="detail-section"><h2>使用方式／稀釋倍數</h2><p>${missing(product.usage)}<br /><br />稀釋倍數：${missing(product.dilution)}</p></div><div class="detail-section"><h2>注意事項</h2><p>${missing(product.precautions || '請依產品標示與合法使用規範為準。')}</p></div><div class="sticky-cta"><a class="btn btn-secondary" href="#/category/${product.categorySlug}">回到分類</a></div></article></div></div>`); }
function renderNotFound() { shell(`<div class="container page-shell">${emptyState('找不到這個頁面', '請從首頁重新選擇分類，或確認連結是否正確。')}</div>`); }
function renderSettings() {
  setTitle('資料來源設定');
  const announcementUnlocked = isAuthenticated();
  const announcementPanel = announcementUnlocked
    ? `<form id="announcement-settings-form"><div class="field checkbox-field"><label><input type="checkbox" name="enabled" ${state.config.announcement.enabled ? 'checked' : ''} /> 顯示首頁最新公告</label></div><div class="field"><label for="announcement-title">公告標題</label><input id="announcement-title" name="title" value="${escapeHtml(state.config.announcement.title)}" placeholder="例如：本月優惠活動" /></div><div class="field"><label for="announcement-body">公告內容</label><textarea id="announcement-body" name="body" placeholder="輸入公告或優惠說明">${escapeHtml(state.config.announcement.body)}</textarea></div><div class="field"><label for="line-url">LINE 官方帳號網址</label><input id="line-url" name="lineUrl" type="url" value="${escapeHtml(state.config.announcement.lineUrl)}" placeholder="https://line.me/R/ti/p/@你的帳號" /><small>目前官方帳號：${escapeHtml(state.config.announcement.lineAccount)}。填寫後首頁公告旁會顯示「加入 LINE 官方帳號」按鈕。</small><div class="line-settings-preview"><img src="${escapeHtml(assetUrl(state.config.announcement.qrImage))}" alt="LINE 官方帳號 QR Code" /><span>掃描 QR Code 或點擊首頁按鈕即可加入。</span></div></div><div class="field"><label for="announcement-image-file">公告活動圖片</label><input id="announcement-image-file" type="file" accept="image/png,image/jpeg,image/webp" /><label for="announcement-image-url">或貼上圖片網址</label><input id="announcement-image-url" name="imageUrl" type="text" value="${escapeHtml(state.config.announcement.imageUrl || '')}" placeholder="https://example.com/activity.jpg" /><small>可上傳圖片（目前保存於此瀏覽器）或貼上 HTTPS 圖片網址；建議圖片小於 2 MB。</small><div id="announcement-image-preview" class="announcement-image-preview">${safeImageSource(state.config.announcement.imageUrl) ? `<img src="${escapeHtml(safeImageSource(state.config.announcement.imageUrl))}" alt="目前活動圖片預覽" />` : '<span>尚未設定活動圖片</span>'}</div></div><div class="form-actions"><button class="btn btn-primary" type="submit">儲存公告設定</button></div></form>`
    : '';
  shell(`<div class="container page-shell"><div class="breadcrumb"><a href="#/home">首頁</a><span>／</span><strong>資料來源設定</strong></div><div class="page-intro"><div><span class="pill ${currentMode()}">${connectionLabel()}</span><h1>資料來源</h1></div><p>第一階段先用示範資料操作介面；填入 Google Apps Script Web App 的正式 <code>/exec</code> 網址後，前台才會讀取已上架產品。</p></div><div class="settings-grid"><section class="panel"><h2>連接 Google 試算表＋GAS</h2><p>請貼上已部署的 GAS Web App 網址，格式應以 <code>/exec</code> 結尾。網址不要公開分享，它等同資料存取能力。</p><form id="gas-settings-form"><div class="field"><label for="gas-url">GAS Web App /exec 網址</label><input id="gas-url" name="gasUrl" type="url" placeholder="https://script.google.com/macros/s/.../exec" value="${escapeHtml(state.config.gasUrl)}" /><small>部署設定：執行身分選「我」、誰可以存取選「任何人」，使用正式 /exec。</small></div><div class="form-actions"><button class="btn btn-primary" type="submit">儲存並測試連線</button><button class="btn btn-ghost" id="use-demo" type="button">切回示範模式</button></div></form><hr class="panel-divider" /><h2>首頁公告與 LINE</h2><p>先設定 GAS /exec 網址；公告內容修改與產品管理仍須使用 Google 登入。</p>${isAuthenticated() ? announcementPanel : '<div class="notice"><div>!</div><div><strong>公告管理需要 Google 登入</strong>請先完成 GAS 設定，再使用 Google 登入。只有 notemaker@gmail.com 可以修改公告。</div></div>'}</section><aside class="panel mode-card"><h2>目前狀態</h2><div class="mode-display"><span class="mode-dot ${currentMode() === 'connected' ? 'connected' : ''}"></span><div><strong>${connectionLabel()}</strong><div class="muted">${currentMode() === 'connected' ? '產品列表由 GAS 讀取' : '使用內建範例，適合先檢查介面'}</div></div></div><div class="notice"><div>!</div><div><strong>資料安全提醒</strong>初期 GAS 方案沒有細緻登入權限，取得 /exec 的人可能讀取或寫入資料；請將網址視為私密能力連結。</div></div><div class="code-note">產品欄位：id、name、categorySlug、subCategory、summary、imageUrl、tags、crops、purpose、ingredients、specifications、usage、dilution、precautions、status</div></aside></div></div>`);
  $('#gas-settings-form')?.addEventListener('submit', async event => { event.preventDefault(); const gasUrl = new FormData(event.currentTarget).get('gasUrl')?.trim().replace(/\/$/, '') || ''; if (!gasUrl.endsWith('/exec')) return showToast('請貼上以 /exec 結尾的正式 GAS 網址。', 'error'); state.config.gasUrl = gasUrl; saveJson(STORAGE_KEYS.config, state.config); await loadProducts(); render(); showToast(currentMode() === 'connected' ? 'GAS 連線成功，已讀取產品資料。' : '已儲存設定。'); });
  $('#use-demo')?.addEventListener('click', () => { state.config.gasUrl = ''; saveJson(STORAGE_KEYS.config, state.config); loadProducts().then(render); });
  $('#announcement-image-file')?.addEventListener('change', event => { const file = event.currentTarget.files?.[0]; if (!file) return; if (file.size > 2 * 1024 * 1024) { event.currentTarget.value = ''; return showToast('活動圖片請小於 2 MB。', 'error'); } const reader = new FileReader(); reader.onload = () => { const urlInput = $('#announcement-image-url'); if (urlInput) urlInput.value = reader.result; const preview = $('#announcement-image-preview'); if (preview) preview.innerHTML = `<img src="${escapeHtml(reader.result)}" alt="活動圖片預覽" />`; }; reader.readAsDataURL(file); });
  $('#announcement-settings-form')?.addEventListener('submit', async event => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget).entries()); const announcement = { ...state.config.announcement, enabled: data.enabled === 'on', title: data.title?.trim() || defaultAnnouncement.title, body: data.body?.trim() || defaultAnnouncement.body, lineUrl: safeUrl(data.lineUrl?.trim()) || defaultAnnouncement.lineUrl, imageUrl: safeImageSource(data.imageUrl?.trim()) }; if (currentMode() === 'connected') { try { const receipt = await gasMutation({ action: 'saveAnnouncement', record: announcement }); state.config.announcement = receipt?.result?.announcement || announcement; saveJson(STORAGE_KEYS.config, state.config); render(); showToast('首頁公告已同步到 Google 試算表與圖片儲存空間。'); } catch (error) { showToast(`公告同步失敗：${error.message}`, 'error'); } } else { state.config.announcement = announcement; saveJson(STORAGE_KEYS.config, state.config); render(); showToast('首頁公告已儲存於此瀏覽器；連接 GAS 後才會跨裝置同步。'); } });
}
function renderAdmin() { setTitle('產品管理'); const editing = state.editingId ? productById(state.editingId) : null; const published = allProducts().length; const draft = state.products.filter(p => p.status === 'draft').length; shell(`<div class="container page-shell"><div class="breadcrumb"><a href="#/home">首頁</a><span>／</span><strong>管理後台</strong></div><div class="page-intro"><div><span class="pill ${currentMode()}">${connectionLabel()}</span><h1>產品管理</h1></div><p>目前以 Google 試算表＋Apps Script 作為初期後台。未連接時，新增資料只保存在此瀏覽器，方便先驗證流程。</p></div><div class="admin-stat-grid"><div class="admin-stat"><span>前台已上架</span><strong>${published}</strong></div><div class="admin-stat"><span>草稿／待整理</span><strong>${draft}</strong></div><div class="admin-stat"><span>資料模式</span><strong>${currentMode() === 'connected' ? 'GAS' : '示範'}</strong></div></div><div class="admin-grid"><section class="panel"><h2>${editing ? '編輯產品' : '新增產品'}</h2><p>先填入已確認的產品資料；沒有資料的欄位可留白，前台會顯示「資料待補」。</p>${adminForm()}</section><section class="panel"><h2>目前產品</h2><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>產品</th><th>分類</th><th>狀態</th><th>操作</th></tr></thead><tbody>${state.products.map(p => `<tr><td>${escapeHtml(p.name)}</td><td>${escapeHtml(p.subCategory)}</td><td><span class="status ${escapeHtml(p.status)}">${statusLabel(p.status)}</span></td><td><button class="btn btn-ghost edit-product" data-id="${escapeHtml(p.id)}" type="button">編輯</button> <button class="btn btn-ghost toggle-status" data-id="${escapeHtml(p.id)}" type="button">${p.status === 'published' ? '下架' : '上架'}</button></td></tr>`).join('')}</tbody></table></div></section></div></div>`); $('#admin-product-form')?.addEventListener('submit', handleAdminSubmit); $$('.edit-product').forEach(btn => btn.addEventListener('click', () => { state.editingId = btn.dataset.id; renderAdmin(); })); $$('.toggle-status').forEach(btn => btn.addEventListener('click', () => toggleProductStatus(btn.dataset.id))); if (editing) { fillAdminForm(editing); $('#admin-product-form button[type="submit"]').textContent = '儲存修改'; } else { populateSubcategories($('#product-category')?.value || categories[0].slug); } }
function adminForm() { return `<form id="admin-product-form"><div class="field-grid"><div class="field full"><label for="product-name">產品名稱 *</label><input id="product-name" name="name" required placeholder="例如：蓋美即溶肥 1 號" /></div><div class="field"><label for="product-category">大分類 *</label><select id="product-category" name="categorySlug" required>${categories.map(cat => `<option value="${cat.slug}">${cat.name}</option>`).join('')}</select></div><div class="field"><label for="product-subcategory">子分類 *</label><select id="product-subcategory" name="subCategory" required></select></div><div class="field full"><label for="product-summary">簡短介紹</label><textarea id="product-summary" name="summary" placeholder="簡短說明產品用途"></textarea></div><div class="field"><label for="product-tags">關鍵標籤</label><input name="tags" placeholder="水溶性、有機（用逗號分隔）" /></div><div class="field"><label for="product-crops">適用作物</label><input name="crops" placeholder="水稻、果樹（用逗號分隔）" /></div><div class="field"><label for="product-ingredients">主要成分</label><textarea name="ingredients"></textarea></div><div class="field"><label for="product-specifications">規格／包裝</label><textarea name="specifications"></textarea></div><div class="field"><label for="product-purpose">用途／防治對象</label><textarea name="purpose"></textarea></div><div class="field"><label for="product-usage">使用方式</label><textarea name="usage"></textarea></div><div class="field"><label for="product-dilution">稀釋倍數</label><input name="dilution" placeholder="依產品標示填寫" /></div><div class="field"><label for="product-image">產品圖片</label><input id="product-image" name="image" type="file" accept="image/png,image/jpeg,image/webp" /><small>目前先提供圖片選取與預覽欄位；連接 GAS 後可再啟用 Drive 圖片上傳。</small></div><div class="field full"><label for="product-precautions">注意事項</label><textarea name="precautions" placeholder="請依產品標示與合法使用規範為準"></textarea></div><div class="field"><label for="product-status">初始狀態</label><select name="status"><option value="draft">草稿</option><option value="published">直接上架</option></select></div></div><div class="form-actions"><button class="btn btn-primary" type="submit">新增產品</button><button class="btn btn-ghost" type="reset">清除欄位</button></div></form>`; }
function populateSubcategories(categorySlug, selected = '') { const select = $('#product-subcategory'); const cat = categoryOf(categorySlug); if (!select || !cat) return; select.innerHTML = cat.children.map(child => `<option value="${escapeHtml(child)}" ${child === selected ? 'selected' : ''}>${escapeHtml(child)}</option>`).join(''); }
function fillAdminForm(product) { const form = $('#admin-product-form'); if (!form) return; populateSubcategories(product.categorySlug, product.subCategory); ['name','summary','tags','crops','ingredients','specifications','purpose','usage','dilution','precautions','status'].forEach(key => { if (form.elements[key]) form.elements[key].value = Array.isArray(product[key]) ? product[key].join('、') : (product[key] || ''); }); if (form.elements.categorySlug) form.elements.categorySlug.value = product.categorySlug; }
async function handleAdminSubmit(event) { event.preventDefault(); const form = event.currentTarget; const data = Object.fromEntries(new FormData(form).entries()); const file = form.querySelector('[name="image"]').files?.[0]; const product = normalizeProduct({ id: state.editingId || `local-${Date.now()}`, name: data.name, categorySlug: data.categorySlug, subCategory: data.subCategory, summary: data.summary, tags: data.tags, crops: data.crops, ingredients: data.ingredients, specifications: data.specifications, purpose: data.purpose, usage: data.usage, dilution: data.dilution, precautions: data.precautions, status: data.status, imageUrl: '' }); if (file && currentMode() === 'demo') product.imageUrl = await readFilePreview(file); if (file && currentMode() === 'connected') showToast('圖片已選取；GAS 模式先保存文字資料，Drive 圖片上傳會在下一階段接上。'); if (currentMode() === 'connected') { try { await gasMutation({ action: state.editingId ? 'edit' : 'add', record: product }); state.editingId = ''; showToast('產品資料已送出至 GAS，正在重新讀取列表。'); await loadProducts(); renderAdmin(); } catch (error) { showToast(error.message, 'error'); } } else { const local = loadJson(STORAGE_KEYS.localProducts, []); if (state.editingId) { state.products = state.products.map(item => item.id === product.id ? product : item); if (!String(product.id).startsWith('demo-')) saveJson(STORAGE_KEYS.localProducts, local.map(item => item.id === product.id ? product : item)); } else { local.push(product); saveJson(STORAGE_KEYS.localProducts, local); state.products.push(product); } const wasEditing = Boolean(state.editingId); state.editingId = ''; showToast(wasEditing ? '產品資料已更新。' : '產品已加入本機示範資料；連接 GAS 後可改為正式寫入。'); renderAdmin(); } }
function readFilePreview(file) { return new Promise(resolve => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => resolve(''); reader.readAsDataURL(file); }); }
async function toggleProductStatus(id) { const product = productById(id); if (!product) return; const next = product.status === 'published' ? 'unpublished' : 'published'; if (currentMode() === 'connected') { try { await gasMutation({ action: 'edit', record: { ...product, status: next } }); await loadProducts(); renderAdmin(); showToast(`產品已${next === 'published' ? '上架' : '下架'}。`); } catch (error) { showToast(error.message, 'error'); } } else { product.status = next; const local = loadJson(STORAGE_KEYS.localProducts, []).map(item => item.id === id ? { ...item, status: next } : item); saveJson(STORAGE_KEYS.localProducts, local); renderAdmin(); } }
function statusLabel(status) { return ({ published: '已上架', draft: '草稿', unpublished: '已下架', archived: '已封存' })[status] || status; }

function closeAnnouncementLightbox() { const lightbox = $('#announcement-lightbox'); if (!lightbox || lightbox.hidden) return; lightbox.hidden = true; document.body.classList.remove('lightbox-open'); $('#announcement-lightbox-image').removeAttribute('src'); }
function openAnnouncementLightbox(image, title) { const lightbox = $('#announcement-lightbox'); const imageNode = $('#announcement-lightbox-image'); const titleNode = $('#announcement-lightbox-title'); if (!lightbox || !imageNode || !safeImageSource(image)) return; imageNode.src = safeImageSource(image); imageNode.alt = `${title || '活動圖片'}，放大檢視`; titleNode.textContent = title || '活動圖片'; lightbox.hidden = false; document.body.classList.add('lightbox-open'); $('#announcement-lightbox-close')?.focus(); }
document.addEventListener('click', event => { const menu = event.target.closest('#mobile-menu'); if (menu) { state.mobileMenu = !state.mobileMenu; updateChrome(); } if (event.target.closest('.topnav a')) { state.mobileMenu = false; updateChrome(); } const imageTrigger = event.target.closest('.announcement-image-trigger'); if (imageTrigger) openAnnouncementLightbox(imageTrigger.dataset.announcementImage, imageTrigger.dataset.announcementTitle); if (event.target.closest('#announcement-lightbox-close, [data-close-announcement-lightbox]')) closeAnnouncementLightbox(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeAnnouncementLightbox(); });
window.addEventListener('hashchange', () => { closeAnnouncementLightbox(); loadProducts().then(render); });
window.addEventListener('DOMContentLoaded', async () => { initializeGoogleIdentity(); await loadAuth(); await loadProducts(); render(); document.addEventListener('change', event => { if (event.target.id === 'product-category') populateSubcategories(event.target.value); }); setTimeout(() => { if ($('#product-category')) populateSubcategories($('#product-category').value); }, 0); });
