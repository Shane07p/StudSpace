import type {
  UserProfileDto,
  SemesterDto,
  CourseDto,
  ResourceDto,
  AttendanceDto,
  TimetableSlotDto,
  DashboardResponse,
  HandleDto,
  AttendanceStatus,
  ResourceType,
} from './types';

const BASE = '/api';
const TOKEN_KEY = 'ss-token';
const USER_KEY = 'ss-user';

function getToken(): string | null { return localStorage.getItem(TOKEN_KEY); }
function setToken(t: string): void { localStorage.setItem(TOKEN_KEY, t); }
function clearToken(): void { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); }
function isAuthenticated(): boolean { return !!getToken(); }

function getCachedUser(): UserProfileDto | null {
  try { return JSON.parse(localStorage.getItem(USER_KEY) ?? 'null'); } catch { return null; }
}
function cacheUser(u: UserProfileDto): void { localStorage.setItem(USER_KEY, JSON.stringify(u)); }

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
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

  return json.data as T;
}

function redirectToDashboard(): void {
  window.location.href = 'dashboard.html';
}

function requireAuth(): boolean {
  if (!isAuthenticated()) {
    window.location.href = 'signin.html';
    return false;
  }
  return true;
}

interface AuthResponse {
  token: string;
  user: UserProfileDto;
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
    login: async function (username: string, password: string): Promise<AuthResponse> {
      const data = await request<AuthResponse>('POST', '/auth/login', { username, password });
      setToken(data.token);
      cacheUser(data.user);
      return data;
    },
    register: async function (fullName: string, username: string, email: string, password: string): Promise<AuthResponse> {
      const data = await request<AuthResponse>('POST', '/auth/register', { fullName, username, email, password });
      setToken(data.token);
      cacheUser(data.user);
      return data;
    },
  },

  user: {
    me: (): Promise<UserProfileDto> => request('GET', '/user/me'),
    update: (data: Partial<UserProfileDto>): Promise<UserProfileDto> => request('PUT', '/user/me', data),
    updateHandles: (handles: HandleDto[]): Promise<HandleDto[]> => request('PUT', '/user/me/handles', { handles }),
    updatePhoto: (photo: string | null): Promise<UserProfileDto> => request('POST', '/user/me/photo', { photo }),
    updateCover: (photo: string | null): Promise<UserProfileDto> => request('POST', '/user/me/cover', { photo }),
    changePassword: (currentPassword: string | null, newPassword: string): Promise<void> =>
      request('PUT', '/user/me/password', { currentPassword, newPassword }),
    deleteAccount: (): Promise<void> => request('DELETE', '/user/me'),
  },

  semesters: {
    list: (): Promise<SemesterDto[]> => request('GET', '/semesters'),
    create: (data: { label: string; shortName?: string }): Promise<SemesterDto> => request('POST', '/semesters', data),
    update: (id: string, data: Partial<SemesterDto>): Promise<SemesterDto> => request('PUT', '/semesters/' + id, data),
    delete: (id: string): Promise<void> => request('DELETE', '/semesters/' + id),
    setCurrent: (id: string): Promise<void> => request('POST', '/semesters/' + id + '/current'),
    enableShare: (id: string): Promise<SemesterDto> => request('POST', '/semesters/' + id + '/share'),
    disableShare: (id: string): Promise<void> => request('DELETE', '/semesters/' + id + '/share'),
  },

  courses: {
    list: (semId: string): Promise<CourseDto[]> => request('GET', '/semesters/' + semId + '/courses'),
    create: (semId: string, data: unknown): Promise<CourseDto> => request('POST', '/semesters/' + semId + '/courses', data),
    update: (id: string, data: unknown): Promise<CourseDto> => request('PUT', '/courses/' + id, data),
    delete: (id: string): Promise<void> => request('DELETE', '/courses/' + id),
  },

  resources: {
    list: (courseId: string): Promise<ResourceDto[]> => request('GET', '/courses/' + courseId + '/resources'),
    create: (courseId: string, data: { type: ResourceType; title: string; url?: string }): Promise<ResourceDto> =>
      request('POST', '/courses/' + courseId + '/resources', data),
    update: (id: string, data: unknown): Promise<ResourceDto> => request('PUT', '/resources/' + id, data),
    delete: (id: string): Promise<void> => request('DELETE', '/resources/' + id),
    listUncategorized: (semId: string): Promise<ResourceDto[]> => request('GET', '/semesters/' + semId + '/resources'),
    createUncategorized: (semId: string, data: { type: ResourceType; title: string; url?: string }): Promise<ResourceDto> =>
      request('POST', '/semesters/' + semId + '/resources', data),
  },

  slots: {
    list: (semId: string): Promise<TimetableSlotDto[]> => request('GET', '/semesters/' + semId + '/slots'),
    create: (semId: string, data: unknown): Promise<TimetableSlotDto> => request('POST', '/semesters/' + semId + '/slots', data),
    update: (id: string, data: unknown): Promise<TimetableSlotDto> => request('PUT', '/slots/' + id, data),
    delete: (id: string): Promise<void> => request('DELETE', '/slots/' + id),
  },

  attendance: {
    get: (courseId: string): Promise<AttendanceDto[]> => request('GET', '/courses/' + courseId + '/attendance'),
    upsert: (courseId: string, date: string, status: AttendanceStatus): Promise<AttendanceDto> =>
      request('POST', '/courses/' + courseId + '/attendance', { date, status }),
    delete: (id: string): Promise<void> => request('DELETE', '/attendance/' + id),
  },

  dashboard: {
    get: (): Promise<DashboardResponse> => request('GET', '/dashboard'),
  },

  share: {
    get: (token: string): Promise<unknown> => request('GET', '/share/' + token),
  },

  ai: {
    chat: (message: string, context: unknown): Promise<{ reply: string }> =>
      request('POST', '/ai/chat', { message, context }),
  },
};

export default API;
