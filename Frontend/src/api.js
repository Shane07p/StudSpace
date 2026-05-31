// api.js — StudSpace centralized API client (ES module)

const BASE = '/api';
const TOKEN_KEY = 'ss-token';
const USER_KEY = 'ss-user';

function getToken() { return localStorage.getItem(TOKEN_KEY); }
function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
function clearToken() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); }
function isAuthenticated() { return !!getToken(); }

function getCachedUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
}
function cacheUser(u) { localStorage.setItem(USER_KEY, JSON.stringify(u)); }

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();

  if (res.status === 401) {
    if (token) {
      clearToken();
      window.location.href = 'signin.html';
    }
    throw new Error(json.message || 'Invalid username or password');
  }

  if (!json.success) {
    throw new Error(json.message || 'Request failed');
  }

  return json.data;
}

function redirectToDashboard() {
  window.location.href = 'dashboard.html';
}

function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = 'signin.html';
    return false;
  }
  return true;
}

const API = {
  getToken,
  setToken,
  clearToken,
  isAuthenticated,
  requireAuth,
  getCachedUser,
  cacheUser,
  redirectToDashboard,

  auth: {
    login: async function (username, password) {
      const data = await request('POST', '/auth/login', { username, password });
      setToken(data.token);
      cacheUser(data.user);
      return data;
    },
    register: async function (fullName, username, email, password) {
      const data = await request('POST', '/auth/register', { fullName, username, email, password });
      setToken(data.token);
      cacheUser(data.user);
      return data;
    },
  },

  user: {
    me: function () { return request('GET', '/user/me'); },
    update: function (data) { return request('PUT', '/user/me', data); },
    updateHandles: function (handles) { return request('PUT', '/user/me/handles', { handles }); },
    updatePhoto: function (photo) { return request('POST', '/user/me/photo', { photo }); },
    updateCover: function (photo) { return request('POST', '/user/me/cover', { photo }); },
    changePassword: function (currentPassword, newPassword) { return request('PUT', '/user/me/password', { currentPassword, newPassword }); },
    deleteAccount: function () { return request('DELETE', '/user/me'); },
  },

  semesters: {
    list: function () { return request('GET', '/semesters'); },
    create: function (data) { return request('POST', '/semesters', data); },
    update: function (id, data) { return request('PUT', '/semesters/' + id, data); },
    delete: function (id) { return request('DELETE', '/semesters/' + id); },
    setCurrent: function (id) { return request('POST', '/semesters/' + id + '/current'); },
    enableShare: function (id) { return request('POST', '/semesters/' + id + '/share'); },
    disableShare: function (id) { return request('DELETE', '/semesters/' + id + '/share'); },
  },

  courses: {
    list: function (semId) { return request('GET', '/semesters/' + semId + '/courses'); },
    create: function (semId, data) { return request('POST', '/semesters/' + semId + '/courses', data); },
    update: function (id, data) { return request('PUT', '/courses/' + id, data); },
    delete: function (id) { return request('DELETE', '/courses/' + id); },
  },

  resources: {
    list: function (courseId) { return request('GET', '/courses/' + courseId + '/resources'); },
    create: function (courseId, data) { return request('POST', '/courses/' + courseId + '/resources', data); },
    update: function (id, data) { return request('PUT', '/resources/' + id, data); },
    delete: function (id) { return request('DELETE', '/resources/' + id); },
    listUncategorized:   function (semId)       { return request('GET',  '/semesters/' + semId + '/resources'); },
    createUncategorized: function (semId, data) { return request('POST', '/semesters/' + semId + '/resources', data); },
  },

  slots: {
    list:   function (semId)       { return request('GET',    '/semesters/' + semId + '/slots'); },
    create: function (semId, data) { return request('POST',   '/semesters/' + semId + '/slots', data); },
    update: function (id, data)    { return request('PUT',    '/slots/' + id, data); },
    delete: function (id)          { return request('DELETE', '/slots/' + id); },
  },

  attendance: {
    get: function (courseId) { return request('GET', '/courses/' + courseId + '/attendance'); },
    upsert: function (courseId, date, status) {
      return request('POST', '/courses/' + courseId + '/attendance', { date, status });
    },
    delete: function (id) { return request('DELETE', '/attendance/' + id); },
  },

  dashboard: {
    get: function () { return request('GET', '/dashboard'); },
  },

  share: {
    get: function (token) { return request('GET', '/share/' + token); },
  },

  ai: {
    chat: function (message, context) { return request('POST', '/ai/chat', { message, context }); },
  },
};

export default API;
