const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, 'public');
const port = Number(process.env.PORT || 3000);
const authorizedEmail = 'notemaker@gmail.com';
const sessionCookieName = 'webdev_app_session';
const oauthStateCookieName = 'jijifarm_oauth_state';
const authSecret = process.env.MANUS_JWT_SECRET || crypto.randomBytes(32).toString('hex');
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url || '/', publicOrigin(req));
    if (requestUrl.pathname === '/healthz' && req.method === 'GET') return json(res, 200, { ok: true });
    if (requestUrl.pathname.startsWith('/auth/')) return handleAuth(req, res, requestUrl);
    return serveStatic(requestUrl.pathname, res);
  } catch (error) {
    console.error(error);
    return json(res, 500, { ok: false, error: '伺服器發生錯誤。' });
  }
});

async function handleAuth(req, res, requestUrl) {
  if (requestUrl.pathname === '/auth/me' && req.method === 'GET') {
    const user = readSession(req);
    return user ? json(res, 200, { authenticated: true, user }) : json(res, 401, { authenticated: false });
  }
  if (requestUrl.pathname === '/auth/login' && req.method === 'GET') return beginLogin(req, res);
  if (requestUrl.pathname === '/auth/callback' && req.method === 'GET') return finishLogin(req, res, requestUrl);
  if (requestUrl.pathname === '/auth/logout' && (req.method === 'GET' || req.method === 'POST')) return logout(req, res);
  return json(res, 404, { ok: false, error: '找不到登入路由。' });
}

function beginLogin(req, res) {
  const config = oauthConfig();
  if (!config) return json(res, 503, { ok: false, error: '登入服務尚未完成平台設定，請稍後再試。' });
  const nonce = crypto.randomBytes(24).toString('hex');
  const redirectUri = `${publicOrigin(req)}/auth/callback`;
  const state = nonce;
  const statePayload = Buffer.from(JSON.stringify({ nonce, redirectUri }), 'utf8').toString('base64url');
  const stateCookie = cookie(oauthStateCookieName, statePayload, req, { maxAge: 600 });
  const portal = new URL(`${config.portalUrl.replace(/\/$/, '')}/app-auth`);
  portal.searchParams.set('appId', config.projectId);
  portal.searchParams.set('redirectUri', redirectUri);
  portal.searchParams.set('state', Buffer.from(JSON.stringify({ redirectUri, nonce: state }), 'utf8').toString('base64'));
  portal.searchParams.set('responseType', 'code');
  res.writeHead(302, { Location: portal.toString(), 'Set-Cookie': stateCookie });
  res.end();
}

async function finishLogin(req, res, requestUrl) {
  const config = oauthConfig();
  const code = requestUrl.searchParams.get('code');
  const state = requestUrl.searchParams.get('state');
  const storedState = parseCookies(req)[oauthStateCookieName];
  if (!config || !code || !state || !storedState) return json(res, 400, { ok: false, error: '登入回呼資料不完整。' });
  let stateData; let callbackState;
  try {
    stateData = JSON.parse(Buffer.from(storedState, 'base64url').toString('utf8'));
    callbackState = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
  } catch { return json(res, 400, { ok: false, error: '登入狀態無效。' }); }
  if (!stateData.nonce || callbackState.nonce !== stateData.nonce || callbackState.redirectUri !== stateData.redirectUri) return json(res, 403, { ok: false, error: '登入狀態驗證失敗。' });
  try {
    const token = await exchangeToken(config, code, stateData.redirectUri);
    const identity = await getUserInfo(config, token.accessToken);
    const email = String(identity.email || '').trim().toLowerCase();
    const clearState = cookie(oauthStateCookieName, '', req, { maxAge: 0 });
    if (email !== authorizedEmail) {
      res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8', 'Set-Cookie': [clearState, clearSessionCookie(req)] });
      return res.end('<!doctype html><meta charset="utf-8"><title>無法登入</title><main style="font-family:sans-serif;padding:40px"><h1>此帳號沒有管理權限</h1><p>請使用指定的管理員 Google／Manus 帳號登入。</p><a href="/">回到首頁</a></main>');
    }
    const session = createSession({ email, name: identity.name || email, openId: identity.openId || '' });
    res.writeHead(302, { Location: '/', 'Set-Cookie': [clearState, cookie(sessionCookieName, session, req, { maxAge: 86400 })] });
    res.end();
  } catch (error) {
    console.error('OAuth callback failed:', error);
    return json(res, 502, { ok: false, error: '登入驗證失敗，請重新嘗試。' });
  }
}

async function exchangeToken(config, code, redirectUri) {
  const response = await fetch(`${config.apiUrl.replace(/\/$/, '')}/webdev.v1.WebDevAuthPublicService/ExchangeToken`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId: config.projectId, grantType: 'authorization_code', code, redirectUri })
  });
  if (!response.ok) throw new Error(`Token exchange ${response.status}`);
  const payload = await response.json();
  if (!payload.accessToken) throw new Error('Missing access token');
  return payload;
}

async function getUserInfo(config, accessToken) {
  const response = await fetch(`${config.apiUrl.replace(/\/$/, '')}/webdev.v1.WebDevAuthPublicService/GetUserInfo`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken })
  });
  if (!response.ok) throw new Error(`Identity lookup ${response.status}`);
  return response.json();
}

function oauthConfig() {
  const projectId = process.env.MANUS_PROJECT_ID;
  const portalUrl = process.env.MANUS_OAUTH_PORTAL_URL;
  const apiUrl = process.env.MANUS_OAUTH_API_URL;
  return projectId && portalUrl && apiUrl ? { projectId, portalUrl, apiUrl } : null;
}

function createSession(user) {
  const payload = Buffer.from(JSON.stringify({ ...user, exp: Math.floor(Date.now() / 1000) + 86400 }), 'utf8').toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function readSession(req) {
  const raw = parseCookies(req)[sessionCookieName];
  if (!raw) return null;
  const [payload, signature] = raw.split('.');
  if (!payload || !signature || !safeCompare(signature, sign(payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (data.exp < Math.floor(Date.now() / 1000) || String(data.email).toLowerCase() !== authorizedEmail) return null;
    return { email: data.email, name: data.name || data.email, openId: data.openId || '' };
  } catch { return null; }
}

function sign(value) { return crypto.createHmac('sha256', authSecret).update(value).digest('base64url'); }
function safeCompare(left, right) { const a = Buffer.from(left); const b = Buffer.from(right); return a.length === b.length && crypto.timingSafeEqual(a, b); }
function logout(req, res) { res.writeHead(302, { Location: '/', 'Set-Cookie': clearSessionCookie(req) }); res.end(); }
function clearSessionCookie(req) { return cookie(sessionCookieName, '', req, { maxAge: 0 }); }
function cookie(name, value, req, options = {}) { const secure = publicOrigin(req).startsWith('https://'); return `${name}=${encodeURIComponent(value)}; Max-Age=${options.maxAge ?? 86400}; Path=/; HttpOnly; SameSite=${secure ? 'None' : 'Lax'}${secure ? '; Secure' : ''}`; }
function parseCookies(req) { return Object.fromEntries(String(req.headers.cookie || '').split(';').map(item => item.trim().split('=').map(decodeURIComponent)).filter(item => item[0])); }
function publicOrigin(req) { const proto = String(req.headers['x-forwarded-proto'] || (req.socket.encrypted ? 'https' : 'http')).split(',')[0].trim(); const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000').split(',')[0].trim(); return `${proto}://${host}`; }
function json(res, status, payload) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(payload)); }

function serveStatic(requestPath, res) {
  let decoded;
  try { decoded = decodeURIComponent(requestPath); } catch { return res.writeHead(400).end('Bad Request'); }
  const safePath = path.normalize(decoded).replace(/^([.][.][/\\])+/, '');
  const filePath = path.join(root, safePath === '/' ? 'index.html' : safePath);
  if (!filePath.startsWith(root)) return res.writeHead(403).end('Forbidden');
  fs.stat(filePath, (err, stat) => { if (!err && stat.isFile()) return serve(filePath, res); return serve(path.join(root, 'index.html'), res); });
}
function serve(filePath, res) { fs.readFile(filePath, (err, data) => { if (err) return res.writeHead(500).end('Internal Server Error'); res.writeHead(200, { 'Content-Type': mime[path.extname(filePath).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); res.end(data); }); }

server.listen(port, '0.0.0.0', () => console.log(`jijifarm server listening on 0.0.0.0:${port}`));
