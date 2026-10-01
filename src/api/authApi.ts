import api from './client';
import { clearToken, setToken } from './tokenStorage';
import type { AuthResponse, LoginPayload, RegisterPayload, User } from '../types/user';

const unwrap = <T>(response: { data: { data: T } }): T => response.data.data;

export type { User, UserRole, LoginPayload, RegisterPayload, AuthResponse } from '../types/user';

// POST /api/auth/login - stores the token and returns the user.
export const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  const data: AuthResponse = unwrap(await api.post('/auth/login', payload));
  setToken(data.token);
  return data;
};

// POST /api/auth/register - creates the account, stores the token and
// signs the new user in immediately (same payload shape as login).
export const register = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const data: AuthResponse = unwrap(await api.post('/auth/register', payload));
  setToken(data.token);
  return data;
};

// GET /api/auth/me - validates the stored token on app start.
export const fetchMe = async (): Promise<User> => unwrap(await api.get('/auth/me'));

// Clears the stored token. The backend tokens are stateless (expire in 7d).
export const logout = (): void => clearToken();
