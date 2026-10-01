// User / auth domain types (POST /api/auth/login|register, GET /api/auth/me).

export type UserRole = 'booker' | 'management';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string | null;
  createdAt?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  organizationId?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
