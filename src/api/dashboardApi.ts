import api from './client';
import type { BookerDashboard, ManagementDashboard } from '../types/dashboard';

const unwrap = <T>(response: { data: { data: T } }): T => response.data.data;

export type * from '../types/dashboard';

// GET /api/dashboard/booker - role-protected booker overview.
export const fetchBookerDashboard = async (): Promise<BookerDashboard> =>
  unwrap(await api.get('/dashboard/booker'));

// GET /api/dashboard/management - role-protected management overview.
export const fetchManagementDashboard = async (): Promise<ManagementDashboard> =>
  unwrap(await api.get('/dashboard/management'));
