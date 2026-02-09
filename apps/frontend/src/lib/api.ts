import type {
  TaskListResponse,
  TaskResponse,
  MeetingListResponse,
  MeetingResponse,
  MeetingActionItemResponse,
  ContractListResponse,
  ContractResponse,
  ContractDashboardResponse,
  ContractHistoryResponse,
  AuditListResponse,
  AuditLogResponse,
  DashboardStatsResponse,
  WeeklyTaskStatsResponse,
  MonthlyContractStatsResponse,
  TasksByStatusResponse,
  TasksByPriorityResponse,
  FileResponse,
  ProductResponse,
  ProductOptionResponse,
  UserResponse,
  AiSettingsResponse,
} from '@msspbiz/shared';

const API_BASE =
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:4001`
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001');
const API_PREFIX = '/api/v1';

type QueryParams = Record<string, string | number | boolean>;

function toSearchParams(params: QueryParams): string {
  const entries = Object.entries(params).map(([k, v]) => [k, String(v)]);
  return new URLSearchParams(entries).toString();
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: Record<string, unknown>,
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

// ─── Auth ─────────────────────────────────────────────────

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; name: string; role: string };
}

export const authApi = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: { email: string; password: string; name: string; tenantName: string }) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getProfile: () =>
    request<UserResponse>('/auth/profile'),
};

// ─── Tasks ────────────────────────────────────────────────

export const tasksApi = {
  list: (params?: QueryParams) => {
    const query = params ? '?' + toSearchParams(params) : '';
    return request<TaskListResponse>(`/tasks${query}`);
  },
  get: (id: string) => request<TaskResponse>(`/tasks/${id}`),
  create: (data: Record<string, unknown>) =>
    request<TaskResponse>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    request<TaskResponse>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<{ message: string }>(`/tasks/${id}`, { method: 'DELETE' }),
  updateStatus: (id: string, status: string) =>
    request<TaskResponse>(`/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  assign: (id: string, assigneeId: string) =>
    request<TaskResponse>(`/tasks/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ assigneeId }),
    }),
  weekly: (year: number, week: number) =>
    request<TaskListResponse>(`/tasks/weekly?year=${year}&week=${week}`),
};

// ─── Meetings ─────────────────────────────────────────────

export const meetingsApi = {
  list: (params?: QueryParams) => {
    const query = params ? '?' + toSearchParams(params) : '';
    return request<MeetingListResponse>(`/meetings${query}`);
  },
  get: (id: string) => request<MeetingResponse>(`/meetings/${id}`),
  create: (data: Record<string, unknown>) =>
    request<MeetingResponse>('/meetings', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    request<MeetingResponse>(`/meetings/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<{ message: string }>(`/meetings/${id}`, { method: 'DELETE' }),
  publish: (id: string) =>
    request<MeetingResponse>(`/meetings/${id}/publish`, { method: 'PATCH' }),
  addAttendee: (id: string, data: { userId: string; attendanceType?: string }) =>
    request<MeetingResponse>(`/meetings/${id}/attendees`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  removeAttendee: (id: string, userId: string) =>
    request<MeetingResponse>(`/meetings/${id}/attendees/${userId}`, { method: 'DELETE' }),
  createActionItem: (id: string, data: { title: string; assigneeId?: string; dueDate?: string }) =>
    request<MeetingActionItemResponse>(`/meetings/${id}/action-items`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateActionItem: (id: string, itemId: string, data: Record<string, unknown>) =>
    request<MeetingActionItemResponse>(`/meetings/${id}/action-items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// ─── Contracts ────────────────────────────────────────────

export const contractsApi = {
  list: (params?: QueryParams) => {
    const query = params ? '?' + toSearchParams(params) : '';
    return request<ContractListResponse>(`/contracts${query}`);
  },
  get: (id: string) => request<ContractResponse>(`/contracts/${id}`),
  create: (data: Record<string, unknown>) =>
    request<ContractResponse>('/contracts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    request<ContractResponse>(`/contracts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<{ message: string }>(`/contracts/${id}`, { method: 'DELETE' }),
  updateStatus: (id: string, status: string) =>
    request<ContractResponse>(`/contracts/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  renew: (id: string) =>
    request<ContractResponse>(`/contracts/${id}/renew`, { method: 'POST' }),
  dashboard: () => request<ContractDashboardResponse>('/contracts/dashboard'),
  expiring: (days: number) => request<ContractResponse[]>(`/contracts/expiring?days=${days}`),
  history: (id: string) => request<ContractHistoryResponse[]>(`/contracts/${id}/history`),
};

// ─── Audit ────────────────────────────────────────────────

export const auditApi = {
  list: (params?: QueryParams) => {
    const query = params ? '?' + toSearchParams(params) : '';
    return request<AuditListResponse>(`/audit${query}`);
  },
  byEntity: (entityType: string, entityId: string) =>
    request<AuditLogResponse[]>(`/audit/entity/${entityType}/${entityId}`),
};

// ─── Stats ────────────────────────────────────────────────

export const statsApi = {
  dashboard: () => request<DashboardStatsResponse>('/stats/dashboard'),
  tasksWeekly: () => request<WeeklyTaskStatsResponse[]>('/stats/tasks/weekly'),
  contractsMonthly: () => request<MonthlyContractStatsResponse[]>('/stats/contracts/monthly'),
  tasksByStatus: () => request<TasksByStatusResponse[]>('/stats/tasks/by-status'),
  tasksByPriority: () => request<TasksByPriorityResponse[]>('/stats/tasks/by-priority'),
};

// ─── Files ────────────────────────────────────────────────

export const filesApi = {
  upload: async (
    file: File,
    entityType?: string,
    entityId?: string,
  ): Promise<FileResponse> => {
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
    return request<FileResponse[]>(`/files?${query}`);
  },

  getById: (id: string) => request<FileResponse>(`/files/${id}`),

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

  delete: (id: string) => request<{ message: string }>(`/files/${id}`, { method: 'DELETE' }),
};

// ─── Products ─────────────────────────────────────────────

export const productsApi = {
  list: () => request<ProductResponse[]>('/products'),
  get: (id: string) => request<ProductResponse>(`/products/${id}`),
  create: (data: { code: string; name: string; description?: string; vendor?: string }) =>
    request<ProductResponse>('/products', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    request<ProductResponse>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<{ message: string }>(`/products/${id}`, { method: 'DELETE' }),
  addOption: (productId: string, data: { code: string; name: string; description?: string; type?: string }) =>
    request<ProductOptionResponse>(`/products/${productId}/options`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateOption: (productId: string, optionId: string, data: Record<string, unknown>) =>
    request<ProductOptionResponse>(`/products/${productId}/options/${optionId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteOption: (productId: string, optionId: string) =>
    request<{ message: string }>(`/products/${productId}/options/${optionId}`, { method: 'DELETE' }),
  getDerivedProductTypes: () => request<string[]>('/products/derived-product-types'),
};

// ─── Tags ─────────────────────────────────────────────────

export interface TagResponse {
  id: string;
  name: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export const tagsApi = {
  list: () => request<TagResponse[]>('/tags'),
  create: (data: { name: string }) =>
    request<TagResponse>('/tags', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: { name: string }) =>
    request<TagResponse>(`/tags/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<{ message: string }>(`/tags/${id}`, { method: 'DELETE' }),
};

// ─── Users ────────────────────────────────────────────────

export const usersApi = {
  list: (params?: QueryParams) => {
    const query = params ? '?' + toSearchParams(params) : '';
    return request<{ items: UserResponse[]; total: number; page: number; limit: number; totalPages: number }>(`/users${query}`);
  },
  get: (id: string) => request<UserResponse>(`/users/${id}`),
  create: (data: { email: string; name: string; password: string; role?: string }) =>
    request<UserResponse>('/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    request<UserResponse>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<{ message: string }>(`/users/${id}`, { method: 'DELETE' }),
};

// ─── AI Settings ──────────────────────────────────────────

export const aiSettingsApi = {
  get: () => request<AiSettingsResponse>('/ai/settings'),
  update: (data: Record<string, unknown>) => request<AiSettingsResponse>('/ai/settings', { method: 'PATCH', body: JSON.stringify(data) }),
};

// ─── AI API (non-streaming) ──────────────────────────────

export const aiApi = {
  listModels: (data: { provider: string; apiKey?: string; ollamaBaseUrl?: string }) =>
    request<{ models: Array<{ id: string; name: string }> }>('/ai/models', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  generateTaskDesc: (data: { title: string; tags?: string[]; priority?: string }) =>
    request<{ text: string }>('/ai/generate-task-desc', { method: 'POST', body: JSON.stringify(data) }),

  generateMeetingTemplate: (data: { title: string; meetingType: string; attendeeNames?: string[] }) =>
    request<{ text: string }>('/ai/generate-meeting-template', { method: 'POST', body: JSON.stringify(data) }),

  summarizeMeeting: (data: { meetingId: string }) =>
    request<{ text: string }>('/ai/summarize-meeting', { method: 'POST', body: JSON.stringify(data) }),

  extractActions: (data: { meetingId: string }) =>
    request<{ actionItems: Array<{ title: string; assigneeName?: string; dueDescription?: string }> }>('/ai/extract-actions', { method: 'POST', body: JSON.stringify(data) }),

  extractWeeklyTasks: (data: { reportText: string; year: number; weekNumber: number }) =>
    request<{ tasks: Array<{ title: string; description: string; priority: string; tags: string[] }> }>('/ai/extract-weekly-tasks', { method: 'POST', body: JSON.stringify(data) }),
};

export { ApiError };
