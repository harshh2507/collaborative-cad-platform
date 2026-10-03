import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  ApiError,
  User,
  Project,
  CreateProjectPayload,
  ProjectVersion,
  Annotation,
} from '../types';
 
// Set VITE_API_URL in a .env file, e.g. VITE_API_URL=http://localhost:5000/api
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
 
const TOKEN_KEY = 'cad_platform_token';
 
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
 
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}
 
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
 
/**
 * Generic request wrapper. Attaches the JWT if present, parses JSON,
 * and throws a normalized ApiError on failure so callers can catch
 * one consistent shape.
 */
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
 
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
 
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch (err) {
    const apiError: ApiError = {
      message: 'Network error — is the backend running?',
    };
    throw apiError;
  }
 
  // Handle empty responses (e.g. 204 No Content)
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
 
  if (!response.ok) {
    const apiError: ApiError = {
      message: data?.message || 'Something went wrong. Please try again.',
      statusCode: response.status,
    };
    throw apiError;
  }
 
  return data as T;
}
 
export const authApi = {
  login: (payload: LoginPayload) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
 
  register: (payload: RegisterPayload) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
 
  getCurrentUser: () => request<User>('/auth/me', { method: 'GET' }),
};
 
export const projectsApi = {
  list: () => request<Project[]>('/projects', { method: 'GET' }),
 
  get: (id: string) => request<Project>(`/projects/${id}`, { method: 'GET' }),
 
  create: (payload: CreateProjectPayload) =>
    request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
 
  listVersions: (projectId: string) =>
    request<ProjectVersion[]>(`/projects/${projectId}/versions`, {
      method: 'GET',
    }),
};
 
export const annotationsApi = {
  list: (projectId: string, versionId?: string) =>
    request<Annotation[]>(
      `/projects/${projectId}/annotations${
        versionId ? `?versionId=${versionId}` : ''
      }`,
      { method: 'GET' }
    ),
 
  updateStatus: (annotationId: string, status: Annotation['status']) =>
    request<Annotation>(`/annotations/${annotationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};
 
export default request;
 