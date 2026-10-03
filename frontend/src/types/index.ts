// ---------- User & Auth ----------
 
export interface User {
  id: string;
  name: string;
  email: string;
  role?: 'admin' | 'member';
  avatarUrl?: string;
  createdAt?: string;
}
 
export interface AuthResponse {
  token: string;
  user: User;
}
 
export interface LoginPayload {
  email: string;
  password: string;
}
 
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}
 
export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}
 
// ---------- API ----------
 
export interface ApiError {
  message: string;
  statusCode?: number;
}
 
// ---------- Domain ----------
 
export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  thumbnailUrl?: string;
  memberCount?: number;
  versionCount?: number;
  createdAt: string;
  updatedAt?: string;
}
 
export interface CreateProjectPayload {
  name: string;
  description?: string;
}
 
export interface ProjectVersion {
  id: string;
  projectId: string;
  versionNumber: number;
  fileName: string;
  fileUrl?: string;
  createdBy: string;
  createdAt: string;
}
 
export type AnnotationStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'FIXED'
  | 'VERIFIED'
  | 'CLOSED';
 
export interface Annotation {
  id: string;
  projectId: string;
  versionId: string;
  entityId?: string;
  position: { x: number; y: number; z: number };
  comment: string;
  status: AnnotationStatus;
  authorName: string;
  createdAt: string;
}
 