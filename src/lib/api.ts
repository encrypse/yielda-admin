import axios from 'axios';
import { toast } from 'sonner';
import { getToken, clearToken, getPendingToken } from './auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = getToken() ?? getPendingToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthEndpoint = err.config?.url?.includes('/admin/auth/');
    if (err.response?.status === 401 && !isAuthEndpoint && typeof window !== 'undefined') {
      clearToken();
      window.location.href = '/login';
    }
    if (err.response?.status === 403) {
      toast.error('Permission denied', {
        description: 'You don\'t have permission to perform this action.',
        id: 'forbidden',
      });
    }
    return Promise.reject(err);
  },
);

// Admin auth
export const adminAuth = {
  login: (email: string, password: string) =>
    api.post('/admin/auth/login', { email, password }).then((r) => r.data.data),
  getTotpSetup: () =>
    api.get('/admin/auth/2fa/setup').then((r) => r.data.data),
  verifyTotpSetup: (code: string) =>
    api.post('/admin/auth/2fa/setup/verify', { code }).then((r) => r.data.data),
  verifyTotp: (code: string) =>
    api.post('/admin/auth/2fa/verify', { code }).then((r) => r.data.data),
  refresh: () =>
    api.post('/admin/auth/refresh').then((r) => r.data.data),
  logout: () =>
    api.post('/admin/auth/logout'),
  acceptInvite: (inviteToken: string, firstName: string, lastName: string, password: string) =>
    api.post('/admin/auth/accept-invite', { inviteToken, firstName, lastName, password }).then((r) => r.data.data),
  me: () =>
    api.get('/admin/auth/me').then((r) => r.data.data),
};

// Admin resources
export const adminUsers = {
  list: (params?: object) => api.get('/admin/users', { params }).then((r) => r.data.data),
  get: (id: string) => api.get(`/admin/users/${id}`).then((r) => r.data.data),
  updateStatus: (id: string, status: string, password: string, reason?: string) =>
    api.patch(`/admin/users/${id}/status`, { status, password, reason }).then((r) => r.data.data),
};

export const adminOrders = {
  list: (params?: object) => api.get('/admin/orders', { params }).then((r) => r.data.data),
  get: (id: string) => api.get(`/admin/orders/${id}`).then((r) => r.data.data),
};

export const adminSettlements = {
  list: (params?: object) => api.get('/admin/settlements', { params }).then((r) => r.data.data),
  get: (id: string) => api.get(`/admin/settlements/${id}`).then((r) => r.data.data),
};

export const adminTransactions = {
  list: (params?: object) => api.get('/admin/transactions', { params }).then((r) => r.data.data),
};

export const adminMetrics = {
  overview: () => api.get('/admin/metrics/overview').then((r) => r.data.data),
  registrations: (days?: number) =>
    api.get('/admin/metrics/registrations', { params: { days } }).then((r) => r.data.data),
  tradeVolume: (days?: number) =>
    api.get('/admin/metrics/trade-volume', { params: { days } }).then((r) => r.data.data),
};

export const adminWallet = {
  settlement: (params?: object) =>
    api.get('/admin/wallet/settlement', { params }).then((r) => r.data.data),
};

export const adminAdmins = {
  list: () => api.get('/admin/admins').then((r) => r.data.data),
  invite: (email: string, permissions: string[]) =>
    api.post('/admin/admins/invite', { email, permissions }).then((r) => r.data.data),
  update: (id: string, data: object) =>
    api.patch(`/admin/admins/${id}`, data).then((r) => r.data.data),
  permissions: () => api.get('/admin/admins/permissions').then((r) => r.data.data),
};

export const adminReports = {
  userStatement: (userId: string, params?: object) =>
    api.get(`/admin/reports/users/${userId}/statement`, { params, responseType: 'blob' }),
  trades: (params?: object) =>
    api.get('/admin/reports/trades', { params, responseType: 'blob' }),
};

export const adminSettings = {
  get: () => api.get('/admin/settings').then((r) => r.data.data),
  update: (settings: Record<string, string>) =>
    api.patch('/admin/settings', { settings }).then((r) => r.data.data),
};

export const adminMaintenance = {
  jobs: () => api.get('/admin/maintenance/jobs').then((r) => r.data.data),
  clearCache: () => api.post('/admin/maintenance/clear-cache').then((r) => r.data.data),
  runJob: (name: string) => api.post(`/admin/maintenance/run-job/${name}`).then((r) => r.data.data),
};

export const adminProfile = {
  update: (data: { firstName?: string; lastName?: string; currentPassword?: string; newPassword?: string }) =>
    api.patch('/admin/auth/profile', data).then((r) => r.data.data),
};

export const adminAuditLogs = {
  list: (params?: object) => api.get('/admin/audit-logs', { params }).then((r) => r.data.data),
};

export const adminUsersExtra = {
  edit: (id: string, data: { firstName?: string; lastName?: string; phoneNumber?: string }) =>
    api.patch(`/admin/users/${id}`, data).then((r) => r.data.data),
  delete: (id: string) => api.delete(`/admin/users/${id}`).then((r) => r.data),
};
