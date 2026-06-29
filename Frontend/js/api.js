// api.js — Thin API client for signin.html and share.html (window.API global)

(function () {
  const BASE = '/api';
  const TOKEN_KEY = 'ss-token';
  const USER_KEY = 'ss-user';

  function getToken() { return localStorage.getItem(TOKEN_KEY); }
  function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
  function clearToken() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); }
  function isAuthenticated() { return !!getToken(); }
  function cacheUser(u) { localStorage.setItem(USER_KEY, JSON.stringify(u)); }

  function resolveSignIn() {
    return window.location.href.includes('/js/') ? '../signin.html' : 'signin.html';
  }

  function redirectToDashboard() {
    window.location.href = window.location.href.includes('/js/') ? '../dashboard.html' : 'dashboard.html';
  }

  function requireAuth() {
    if (!isAuthenticated()) { window.location.href = resolveSignIn(); return false; }
    return true;
  }

  async function request(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(BASE + path, {
      method, headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const json = await res.json();
    if (res.status === 401) {
      if (token) { clearToken(); window.location.href = resolveSignIn(); }
      throw new Error(json.message || 'Incorrect email or password');
    }
    if (res.status === 429) {
      throw new Error(json.message || json.error || 'Too many attempts — please wait 15 minutes and try again.');
    }
    if (!json.success) throw new Error(json.message || 'Request failed');
    return json.data;
  }

  window.API = {
    getToken, setToken, clearToken, isAuthenticated, requireAuth, redirectToDashboard,

    auth: {
      login: async function (username, password) {
        const data = await request('POST', '/auth/login', { username, password });
        setToken(data.token); cacheUser(data.user); return data;
      },
      register: async function (fullName, username, email, password) {
        const data = await request('POST', '/auth/register', { fullName, username, email, password });
        setToken(data.token); cacheUser(data.user); return data;
      },
    },

    share: {
      get: function (token) { return request('GET', '/share/' + token); },
    },
  };
})();
