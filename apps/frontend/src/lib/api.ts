const API_BASE =
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:4001`
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001');
const API_PREFIX = '/api/v1';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${API_PREFIX}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    // Try refresh
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${localStorage.getItem('accessToken')}`;
      const retryRes = await fetch(`${API_BASE}${API_PREFIX}${endpoint}`, {
        ...options,
        headers,
      });
      if (!retryRes.ok) {
        throw new ApiError(retryRes.status, 'Request failed after token refresh');
      }
      return retryRes.json();
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
    throw new ApiError(401, 'Unauthorized');
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new ApiError(res.status, errorData.message || 'Request failed', errorData);
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}${API_PREFIX}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    localStorage.setItem('accessToken', data.accessToken);
    return true;
  } catch {
    return false;
  }
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    request<{
      accessToken: string;
      refreshToken: string;
      user: { id: string; email: string; name: string; role: string };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: { email: string; password: string; name: string; tenantName: string }) =>
    request<{
      accessToken: string;
      refreshToken: string;
      user: { id: string; email: string; name: string; role: string };
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getProfile: () =>
    request<{
      id: string;
      email: string;
      name: string;
      role: string;
      tenantId: string;
      isActive: boolean;
      lastLoginAt: string | null;
      createdAt: string;
      updatedAt: string;
    }>('/auth/profile'),
};

// Tasks
export const tasksApi = {
  list: (params?: Record<string, any>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/tasks${query}`);
  },
  get: (id: string) => request<any>(`/tasks/${id}`),
  create: (data: any) =>
    request<any>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request<any>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<any>(`/tasks/${id}`, { method: 'DELETE' }),
  updateStatus: (id: string, status: string) =>
    request<any>(`/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  assign: (id: string, assigneeId: string) =>
    request<any>(`/tasks/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ assigneeId }),
    }),
  weekly: (year: number, week: number) =>
    request<any>(`/tasks/weekly?year=${year}&week=${week}`),
};

// Meetings
export const meetingsApi = {
  list: (params?: Record<string, any>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/meetings${query}`);
  },
  get: (id: string) => request<any>(`/meetings/${id}`),
  create: (data: any) =>
    request<any>('/meetings', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request<any>(`/meetings/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<any>(`/meetings/${id}`, { method: 'DELETE' }),
  publish: (id: string) =>
    request<any>(`/meetings/${id}/publish`, { method: 'PATCH' }),
  addAttendee: (id: string, data: any) =>
    request<any>(`/meetings/${id}/attendees`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  removeAttendee: (id: string, userId: string) =>
    request<any>(`/meetings/${id}/attendees/${userId}`, { method: 'DELETE' }),
  createActionItem: (id: string, data: any) =>
    request<any>(`/meetings/${id}/action-items`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateActionItem: (id: string, itemId: string, data: any) =>
    request<any>(`/meetings/${id}/action-items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// Contracts
export const contractsApi = {
  list: (params?: Record<string, any>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/contracts${query}`);
  },
  get: (id: string) => request<any>(`/contracts/${id}`),
  create: (data: any) =>
    request<any>('/contracts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request<any>(`/contracts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<any>(`/contracts/${id}`, { method: 'DELETE' }),
  updateStatus: (id: string, status: string) =>
    request<any>(`/contracts/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  renew: (id: string) =>
    request<any>(`/contracts/${id}/renew`, { method: 'POST' }),
  dashboard: () => request<any>('/contracts/dashboard'),
  expiring: (days: number) => request<any>(`/contracts/expiring?days=${days}`),
  history: (id: string) => request<any>(`/contracts/${id}/history`),
};

// Audit
export const auditApi = {
  list: (params?: Record<string, any>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/audit${query}`);
  },
  byEntity: (entityType: string, entityId: string) =>
    request<any>(`/audit/entity/${entityType}/${entityId}`),
};

// Stats
export const statsApi = {
  dashboard: () => request<any>('/stats/dashboard'),
  tasksWeekly: () => request<any>('/stats/tasks/weekly'),
  contractsMonthly: () => request<any>('/stats/contracts/monthly'),
  tasksByStatus: () => request<any>('/stats/tasks/by-status'),
  tasksByPriority: () => request<any>('/stats/tasks/by-priority'),
};

// Files
export const filesApi = {
  upload: async (
    file: File,
    entityType?: string,
    entityId?: string,
  ): Promise<any> => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('accessToken')
        : null;

    const formData = new FormData();
    formData.append('file', file);
    if (entityType) formData.append('entityType', entityType);
    if (entityId) formData.append('entityId', entityId);

    const res = await fetch(`${API_BASE}${API_PREFIX}/files/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new ApiError(
        res.status,
        errorData.message || 'Upload failed',
        errorData,
      );
    }

    return res.json();
  },

  list: (entityType: string, entityId: string) => {
    const query = new URLSearchParams({ entityType, entityId }).toString();
    return request<any>(`/files?${query}`);
  },

  getById: (id: string) => request<any>(`/files/${id}`),

  download: (id: string) => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('accessToken')
        : null;
    return fetch(`${API_BASE}${API_PREFIX}/files/${id}/download`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  delete: (id: string) => request<any>(`/files/${id}`, { method: 'DELETE' }),
};

// Products
export const productsApi = {
  list: () => request<any>('/products'),
  get: (id: string) => request<any>(`/products/${id}`),
  create: (data: any) =>
    request<any>('/products', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request<any>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<any>(`/products/${id}`, { method: 'DELETE' }),
  addOption: (productId: string, data: any) =>
    request<any>(`/products/${productId}/options`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateOption: (productId: string, optionId: string, data: any) =>
    request<any>(`/products/${productId}/options/${optionId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteOption: (productId: string, optionId: string) =>
    request<any>(`/products/${productId}/options/${optionId}`, { method: 'DELETE' }),
  getDerivedProductTypes: () => request<string[]>('/products/derived-product-types'),
};

// Users
export const usersApi = {
  list: (params?: Record<string, any>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/users${query}`);
  },
  get: (id: string) => request<any>(`/users/${id}`),
  create: (data: { email: string; name: string; password: string; role?: string }) =>
    request<any>('/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request<any>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<any>(`/users/${id}`, { method: 'DELETE' }),
};

// AI Settings API
export const aiSettingsApi = {
  get: () => request<any>('/ai/settings'),
  update: (data: any) => request<any>('/ai/settings', { method: 'PATCH', body: JSON.stringify(data) }),
};

// AI API (non-streaming)
export const aiApi = {
  generateTaskDesc: (data: { title: string; tags?: string[]; priority?: string }) =>
    request<{ text: string }>('/ai/generate-task-desc', { method: 'POST', body: JSON.stringify(data) }),

  generateMeetingTemplate: (data: { title: string; meetingType: string; attendeeNames?: string[] }) =>
    request<{ text: string }>('/ai/generate-meeting-template', { method: 'POST', body: JSON.stringify(data) }),

  summarizeMeeting: (data: { meetingId: string }) =>
    request<{ text: string }>('/ai/summarize-meeting', { method: 'POST', body: JSON.stringify(data) }),

  extractActions: (data: { meetingId: string }) =>
    request<{ actionItems: Array<{ title: string; assigneeName?: string; dueDescription?: string }> }>('/ai/extract-actions', { method: 'POST', body: JSON.stringify(data) }),
};

export { ApiError };
