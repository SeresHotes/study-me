// StudyMe auth backend (Cloudflare Worker).
//
// Google OAuth authorization-code flow с refresh-токеном: пользователь входит
// редко (полный редирект на Google), а приложение получает короткоживущий
// access_token по sid. client_secret живёт только здесь.
//
// Эндпоинты:
//   GET  /auth/login?return=<appUrl>  → редирект на Google consent
//   GET  /auth/callback?code&state    → обмен кода на токены, редирект на return?sid=
//   GET  /auth/token?sid=<sid>        → { access_token, expires_in } (обновляет по refresh)
//   POST /auth/logout?sid=<sid>       → удалить сессию (+ревок refresh)
//
// Хранилище: KV SESSIONS. Ключи: state:<id> (TTL) и sess:<sid> (refresh_token).
// Секреты: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET.
// Vars: SCOPE, ALLOWED_ORIGINS (список через запятую).

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
const STATE_TTL = 600; // сек на завершение входа

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });

function allowedOrigins(env) {
  return (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function isAllowedReturn(returnUrl, env) {
  try {
    return allowedOrigins(env).includes(new URL(returnUrl).origin);
  } catch {
    return false;
  }
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allow = allowedOrigins(env).includes(origin) ? origin : '';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

const randomId = () =>
  [...crypto.getRandomValues(new Uint8Array(24))].map((b) => b.toString(16).padStart(2, '0')).join('');

function redirectUri(request) {
  return `${new URL(request.url).origin}/auth/callback`;
}

async function exchangeCode(env, code, redirect) {
  const body = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirect,
  });
  const resp = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  return resp.json();
}

async function refreshAccessToken(env, refreshToken) {
  const body = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
  const resp = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  return { ok: resp.ok, data: await resp.json() };
}

// --- Handlers ---------------------------------------------------------------

async function handleLogin(request, env) {
  const url = new URL(request.url);
  const ret = url.searchParams.get('return') || '';
  if (!isAllowedReturn(ret, env)) return new Response('return not allowed', { status: 400 });

  const state = randomId();
  await env.SESSIONS.put(`state:${state}`, ret, { expirationTtl: STATE_TTL });

  const authUrl = new URL(AUTH_URL);
  authUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', redirectUri(request));
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', env.SCOPE || 'https://www.googleapis.com/auth/drive.file');
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('include_granted_scopes', 'true');
  authUrl.searchParams.set('state', state);
  return Response.redirect(authUrl.toString(), 302);
}

async function handleCallback(request, env) {
  const url = new URL(request.url);
  const state = url.searchParams.get('state') || '';
  const code = url.searchParams.get('code') || '';
  const err = url.searchParams.get('error') || '';

  const ret = state ? await env.SESSIONS.get(`state:${state}`) : null;
  if (!ret) return new Response('invalid state', { status: 400 });
  await env.SESSIONS.delete(`state:${state}`);

  const back = new URL(ret);
  if (err || !code) {
    back.searchParams.set('auth', 'error');
    return Response.redirect(back.toString(), 302);
  }

  const tokens = await exchangeCode(env, code, redirectUri(request));
  if (!tokens.refresh_token) {
    back.searchParams.set('auth', 'error');
    return Response.redirect(back.toString(), 302);
  }

  const sid = randomId();
  await env.SESSIONS.put(`sess:${sid}`, JSON.stringify({ refresh_token: tokens.refresh_token }));
  back.searchParams.set('sid', sid);
  return Response.redirect(back.toString(), 302);
}

async function handleToken(request, env) {
  const cors = corsHeaders(request, env);
  const sid = new URL(request.url).searchParams.get('sid') || '';
  const raw = sid ? await env.SESSIONS.get(`sess:${sid}`) : null;
  if (!raw) return json({ error: 'no_session' }, 401, cors);

  const { refresh_token } = JSON.parse(raw);
  const { ok, data } = await refreshAccessToken(env, refresh_token);
  if (!ok) {
    // invalid_grant → refresh отозван/протух, сбрасываем сессию.
    if (data.error === 'invalid_grant') await env.SESSIONS.delete(`sess:${sid}`);
    return json({ error: data.error || 'refresh_failed' }, 401, cors);
  }
  return json({ access_token: data.access_token, expires_in: data.expires_in }, 200, cors);
}

async function handleLogout(request, env) {
  const cors = corsHeaders(request, env);
  const sid = new URL(request.url).searchParams.get('sid') || '';
  const raw = sid ? await env.SESSIONS.get(`sess:${sid}`) : null;
  if (raw) {
    const { refresh_token } = JSON.parse(raw);
    // best-effort revoke
    fetch(`${REVOKE_URL}?token=${encodeURIComponent(refresh_token)}`, { method: 'POST' }).catch(() => {});
    await env.SESSIONS.delete(`sess:${sid}`);
  }
  return json({ ok: true }, 200, cors);
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    try {
      if (pathname === '/auth/login' && request.method === 'GET') return handleLogin(request, env);
      if (pathname === '/auth/callback' && request.method === 'GET') return handleCallback(request, env);
      if (pathname === '/auth/token' && request.method === 'GET') return handleToken(request, env);
      if (pathname === '/auth/logout' && request.method === 'POST') return handleLogout(request, env);
      if (pathname === '/' || pathname === '/health') return json({ ok: true, service: 'studyme-auth' });
    } catch (e) {
      return json({ error: 'internal', message: String(e) }, 500);
    }
    return new Response('Not found', { status: 404 });
  },
};
