/**
 * 集集興農產品速查網｜Google Sheets + Apps Script 產品資料橋接
 *
 * 使用方式：
 * 1. 建立專用 Google 試算表，開啟「擴充功能 → Apps Script」。
 * 2. 將 CONFIG.SPREADSHEET_ID 填入試算表 ID。
 * 3. 執行 setup()，確認標題列與「設定」工作表建立。
 * 4. 部署為網頁應用程式：執行身分選「我」、誰可以存取選「任何人」。
 * 5. 前端設定使用正式 /exec URL。不要把試算表 ID 寫到公開前端。
 *
 * 初期提醒：任何取得 /exec URL 的人都可能讀寫資料，請把 URL 視為私密能力連結。
 */
const CONFIG = {
  SPREADSHEET_ID: '1T7ThkOGBhswta9o1VCOh57PkRA7Pnnzm3Lwz1T4cuJI',
  SHEET_NAME: '產品',
  IMAGE_FOLDER_NAME: '集集興農產品圖片',
  TIMEZONE: 'Asia/Taipei',
  GOOGLE_CLIENT_ID: '736171088462-1b3r0gar6sd7q9tsndc02vbrjq3m8nk7.apps.googleusercontent.com',
  ADMIN_EMAIL: 'notemaker@gmail.com'
};

const HEADERS = [
  'id', 'name', 'slug', 'categorySlug', 'categoryName', 'subCategory', 'summary',
  'imageUrl', 'tags', 'crops', 'purpose', 'ingredients', 'specifications', 'usage',
  'dilution', 'precautions', 'status', 'sortOrder', 'updatedAt', 'createdAt'
];
const ANNOUNCEMENT_SHEET_NAME = '公告';
const ANNOUNCEMENT_HEADERS = ['key', 'value', 'updatedAt'];
const ANNOUNCEMENT_DEFAULTS = {
  enabled: 'true',
  title: '優惠與營業資訊',
  body: '最新產品、優惠與活動資訊將優先公告於此，歡迎先查看分類或直接來電洽詢。',
  lineUrl: 'https://lin.ee/xkrkExA',
  lineAccount: '@sn2761777',
  qrImage: '/line-official-qr.png',
  imageUrl: ''
};

function setup() {
  validateConfig_();
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  const current = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), HEADERS.length)).getValues()[0];
  if (current.slice(0, HEADERS.length).join('|') !== HEADERS.join('|')) throw new Error('產品工作表第一列標題不符合規格，請先備份後再調整。');
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#e8f4e7');
  let announcementSheet = ss.getSheetByName(ANNOUNCEMENT_SHEET_NAME);
  if (!announcementSheet) announcementSheet = ss.insertSheet(ANNOUNCEMENT_SHEET_NAME);
  if (announcementSheet.getLastRow() === 0) {
    announcementSheet.getRange(1, 1, 1, ANNOUNCEMENT_HEADERS.length).setValues([ANNOUNCEMENT_HEADERS]);
    announcementSheet.getRange(2, 1, Object.keys(ANNOUNCEMENT_DEFAULTS).length, 3).setValues(Object.entries(ANNOUNCEMENT_DEFAULTS).map(([key, value]) => [key, value, new Date().toISOString()]));
  }
  announcementSheet.setFrozenRows(1);
  announcementSheet.getRange(1, 1, 1, ANNOUNCEMENT_HEADERS.length).setFontWeight('bold').setBackground('#e8f4e7');
  return `setup 完成：${CONFIG.SHEET_NAME} 工作表已就緒`;
}

function doGet(e) {
  const action = String(e?.parameter?.action || 'list');
  const callback = safeCallback_(e?.parameter?.callback);
  let payload;
  try {
    if (action === 'status') payload = status_(String(e.parameter.requestId || ''));
    else if (action === 'announcement') payload = { ok: true, announcement: readAnnouncement_(), updatedAt: new Date().toISOString() };
    else if (action === 'verifyGoogle') payload = verifyGoogle_(String(e.parameter.credential || ''));
    else if (action === 'list') payload = { ok: true, records: readPublished_(), updatedAt: new Date().toISOString() };
    else if (action === 'all') payload = { ok: true, records: readAll_(), updatedAt: new Date().toISOString() };
    else payload = { ok: false, error: '不支援的讀取 action' };
  } catch (error) { payload = { ok: false, error: error.message }; }
  const json = JSON.stringify(payload);
  if (callback) return ContentService.createTextOutput(`${callback}(${json})`).setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let payload;
  try {
    const input = JSON.parse(e?.postData?.contents || '{}');
    payload = mutate_(input);
  } catch (error) { payload = { ok: false, error: error.message }; }
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function mutate_(input) {
  const requestId = String(input.requestId || '');
  if (!requestId) throw new Error('缺少 requestId');
  const user = assertAdmin_(String(input.credential || ''));
  const props = PropertiesService.getScriptProperties();
  const previous = props.getProperty(`request:${requestId}`);
  if (previous) return JSON.parse(previous);
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const again = props.getProperty(`request:${requestId}`);
    if (again) return JSON.parse(again);
    let result;
    if (input.action === 'add') result = addProduct_(input.record || {});
    else if (input.action === 'edit') result = editProduct_(input.record || {});
    else if (input.action === 'saveAnnouncement') result = saveAnnouncement_(input.record || {});
    else throw new Error('不支援的寫入 action');
    const receipt = { ok: true, done: true, requestId, result, user };
    props.setProperty(`request:${requestId}`, JSON.stringify(receipt));
    return receipt;
  } finally { lock.releaseLock(); }
}

function status_(requestId) {
  if (!requestId) return { ok: false, done: false, error: '缺少 requestId' };
  const saved = PropertiesService.getScriptProperties().getProperty(`request:${requestId}`);
  return saved ? JSON.parse(saved) : { ok: true, done: false, requestId };
}

function verifyGoogle_(credential) {
  if (!credential) throw new Error('缺少 Google 登入憑證');
  const response = UrlFetchApp.fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`, { muteHttpExceptions: true });
  const payload = JSON.parse(response.getContentText() || '{}');
  if (response.getResponseCode() !== 200 || payload.aud !== CONFIG.GOOGLE_CLIENT_ID) throw new Error('Google 登入憑證無效或 Client ID 不符');
  if (String(payload.email_verified).toLowerCase() !== 'true') throw new Error('Google 帳號尚未完成驗證');
  if (String(payload.email || '').toLowerCase() !== CONFIG.ADMIN_EMAIL.toLowerCase()) throw new Error('此 Google 帳號沒有公告管理權限');
  return { email: String(payload.email), name: String(payload.name || ''), picture: String(payload.picture || '') };
}

function assertAdmin_(credential) { return verifyGoogle_(credential); }

function readAll_() {
  const sheet = getSheet_();
  if (sheet.getLastRow() < 2) return [];
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.length).getValues();
  return values.map(rowToObject_);
}

function readPublished_() { return readAll_().filter(record => record.status === 'published'); }

function addProduct_(record) {
  const sheet = getSheet_();
  const now = new Date().toISOString();
  const id = Utilities.getUuid();
  const safe = sanitizeRecord_(record);
  const row = objectToRow_(Object.assign({}, safe, { id, createdAt: now, updatedAt: now }));
  sheet.appendRow(row);
  return { id, updatedAt: now };
}

function editProduct_(record) {
  if (!record.id) throw new Error('編輯產品需要 id');
  const sheet = getSheet_();
  if (sheet.getLastRow() < 2) throw new Error('產品工作表目前沒有可編輯的資料');
  const ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().flat().map(String);
  const index = ids.indexOf(String(record.id));
  if (index < 0) throw new Error('找不到要編輯的產品');
  const rowNumber = index + 2;
  const current = rowToObject_(sheet.getRange(rowNumber, 1, 1, HEADERS.length).getValues()[0]);
  const safe = sanitizeRecord_(Object.assign({}, current, record));
  safe.id = record.id;
  safe.createdAt = current.createdAt;
  safe.updatedAt = new Date().toISOString();
  sheet.getRange(rowNumber, 1, 1, HEADERS.length).setValues([objectToRow_(safe)]);
  return { id: record.id, updatedAt: safe.updatedAt };
}

function readAnnouncement_() {
  const sheet = getAnnouncementSheet_();
  if (sheet.getLastRow() < 2) return Object.assign({}, ANNOUNCEMENT_DEFAULTS, { enabled: true });
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
  const result = Object.assign({}, ANNOUNCEMENT_DEFAULTS);
  values.forEach(row => { if (row[0]) result[String(row[0])] = String(row[1] ?? ''); });
  result.enabled = String(result.enabled).toLowerCase() === 'true';
  return result;
}

function saveAnnouncement_(record) {
  const sheet = getAnnouncementSheet_();
  const safe = {};
  Object.keys(ANNOUNCEMENT_DEFAULTS).forEach(key => { safe[key] = key === 'enabled' ? Boolean(record[key]) : String(record[key] ?? ''); });
  safe.imageUrl = saveAnnouncementImage_(safe.imageUrl);
  const now = new Date().toISOString();
  const rows = Object.keys(ANNOUNCEMENT_DEFAULTS).map(key => [key, safe[key], now]);
  if (sheet.getLastRow() > 1) sheet.getRange(2, 1, sheet.getLastRow() - 1, ANNOUNCEMENT_HEADERS.length).clearContent();
  sheet.getRange(2, 1, rows.length, ANNOUNCEMENT_HEADERS.length).setValues(rows);
  return { updatedAt: now, announcement: safe };
}

function saveAnnouncementImage_(value) {
  const source = String(value || '');
  if (!source.startsWith('data:image/')) return source;
  const match = source.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error('公告圖片格式不支援，請使用 PNG、JPG 或 WebP。');
  const mime = match[1] === 'image/png' ? MimeType.PNG : match[1] === 'image/webp' ? 'image/webp' : MimeType.JPEG;
  const extension = match[1].split('/')[1].replace('jpeg', 'jpg');
  const blob = Utilities.newBlob(Utilities.base64Decode(match[2]), mime, `announcement-${Date.now()}.${extension}`);
  const file = getAnnouncementImageFolder_().createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return `https://lh3.googleusercontent.com/d/${file.getId()}=w1600`;
}

function getAnnouncementImageFolder_() {
  const folders = DriveApp.getFoldersByName(CONFIG.IMAGE_FOLDER_NAME);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(CONFIG.IMAGE_FOLDER_NAME);
}

function getSheet_() { validateConfig_(); const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(CONFIG.SHEET_NAME); if (!sheet) throw new Error('找不到產品工作表，請先執行 setup()'); return sheet; }
function getAnnouncementSheet_() { validateConfig_(); const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID); let sheet = ss.getSheetByName(ANNOUNCEMENT_SHEET_NAME); if (!sheet) { sheet = ss.insertSheet(ANNOUNCEMENT_SHEET_NAME); sheet.getRange(1, 1, 1, ANNOUNCEMENT_HEADERS.length).setValues([ANNOUNCEMENT_HEADERS]); } return sheet; }
function validateConfig_() { if (!CONFIG.SPREADSHEET_ID || CONFIG.SPREADSHEET_ID.indexOf('請填入') === 0) throw new Error('請先在私用 Apps Script 設定 CONFIG.SPREADSHEET_ID'); }
function safeCallback_(callback) { return callback && /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback) ? callback : ''; }
function rowToObject_(row) { const record = {}; HEADERS.forEach((key, i) => record[key] = row[i] ?? ''); record.tags = splitList_(record.tags); record.crops = splitList_(record.crops); return record; }
function objectToRow_(record) { return HEADERS.map(key => Array.isArray(record[key]) ? record[key].join('、') : safeCell_(record[key] ?? '')); }
function splitList_(value) { return String(value || '').split(/[，,|、]/).map(v => v.trim()).filter(Boolean); }
function safeCell_(value) { const text = String(value); return /^[=+\-@]/.test(text) ? `'${text}` : text; }
function sanitizeRecord_(record) { const safe = {}; HEADERS.forEach(key => { if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') safe[key] = Array.isArray(record[key]) ? record[key].join('、') : String(record[key] ?? ''); }); safe.status = ['draft', 'published', 'unpublished', 'archived'].indexOf(safe.status) >= 0 ? safe.status : 'draft'; return safe; }
