const BASE = '/api';
const TOKEN_KEY = 'ss-token';
const USER_KEY = 'ss-user';

function getToken() { return localStorage.getItem(TOKEN_KEY); }
function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
function clearToken() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); }
function isAuthenticated() { return !!getToken(); }

function getCachedUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) ?? 'null'); } catch { return null; }
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
    if (token) { clearToken(); window.location.href = 'signin.html'; }
    throw new Error(json.message || 'Invalid username or password');
  }

  if (res.status === 429) {
    throw new Error(json.message || json.error || 'Too many attempts — please wait 15 minutes and try again.');
  }

  if (!json.success) throw new Error(json.message || 'Request failed');

  return json.data;
}

function redirectToDashboard() { window.location.href = 'dashboard.html'; }

function requireAuth() {
  if (!isAuthenticated()) { window.location.href = 'signin.html'; return false; }
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
    login: async (username, password) => {
      const data = await request('POST', '/auth/login', { username, password });
      setToken(data.token); cacheUser(data.user); return data;
    },
    register: async (fullName, username, email, password) => {
      const data = await request('POST', '/auth/register', { fullName, username, email, password });
      setToken(data.token); cacheUser(data.user); return data;
    },
  },

  user: {
    me: () => request('GET', '/user/me'),
    update: (data) => request('PUT', '/user/me', data),
    updateHandles: (handles) => request('PUT', '/user/me/handles', { handles }),
    updatePhoto: (photo) => request('POST', '/user/me/photo', { photo }),
    updateCover: (photo) => request('POST', '/user/me/cover', { photo }),
    changePassword: (currentPassword, newPassword) =>
      request('PUT', '/user/me/password', { currentPassword, newPassword }),
    deleteAccount: () => request('DELETE', '/user/me'),
  },

  semesters: {
    list: () => request('GET', '/semesters'),
    create: (data) => request('POST', '/semesters', data),
    update: (id, data) => request('PUT', '/semesters/' + id, data),
    delete: (id) => request('DELETE', '/semesters/' + id),
    setCurrent: (id) => request('POST', '/semesters/' + id + '/current'),
    enableShare: (id) => request('POST', '/semesters/' + id + '/share'),
    disableShare: (id) => request('DELETE', '/semesters/' + id + '/share'),
  },

  courses: {
    list: (semId) => request('GET', '/semesters/' + semId + '/courses'),
    create: (semId, data) => request('POST', '/semesters/' + semId + '/courses', data),
    update: (id, data) => request('PUT', '/courses/' + id, data),
    delete: (id) => request('DELETE', '/courses/' + id),
  },

  resources: {
    list: (courseId) => request('GET', '/courses/' + courseId + '/resources'),
    create: (courseId, data) => request('POST', '/courses/' + courseId + '/resources', data),
    update: (id, data) => request('PUT', '/resources/' + id, data),
    delete: (id) => request('DELETE', '/resources/' + id),
    listUncategorized: (semId) => request('GET', '/semesters/' + semId + '/resources'),
    createUncategorized: (semId, data) => request('POST', '/semesters/' + semId + '/resources', data),
  },

  slots: {
    list: (semId) => request('GET', '/semesters/' + semId + '/slots'),
    create: (semId, data) => request('POST', '/semesters/' + semId + '/slots', data),
    update: (id, data) => request('PUT', '/slots/' + id, data),
    delete: (id) => request('DELETE', '/slots/' + id),
  },

  attendance: {
    get: (courseId) => request('GET', '/courses/' + courseId + '/attendance'),
    upsert: (courseId, date, status) =>
      request('POST', '/courses/' + courseId + '/attendance', { date, status }),
    delete: (id) => request('DELETE', '/attendance/' + id),
  },

  dashboard: {
    get: () => request('GET', '/dashboard'),
  },

  share: {
    get: (token) => request('GET', '/share/' + token),
  },

  ai: {
    chat: (message, resourceId) =>
      request('POST', '/ai/chat', { message, resourceId }),
    listConversations: () => request('GET', '/ai/conversations'),
    getConversation: (id) => request('GET', '/ai/conversations/' + id),
    createConversation: (data) => request('POST', '/ai/conversations', data),
    sendMessage: (id, content) => request('POST', '/ai/conversations/' + id + '/messages', { content }),
    attachResource: (id, resourceId) => request('PUT', '/ai/conversations/' + id + '/resource', { resourceId }),
    deleteConversation: (id) => request('DELETE', '/ai/conversations/' + id),
  },
};

export default API;
