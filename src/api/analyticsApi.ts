import api from './client';
import { getErrorMessage } from './eventApi';
import type { EventStatus } from './eventApi';

const unwrap = <T>(response: { data: { data: T } }): T => response.data.data;

// ---------- GET /api/events/statistics ----------

export interface StatusCount {
  status: EventStatus;
  count: number;
}

export interface OrganizationCount {
  organization: string;
  count: number;
}

export interface MonthCount {
  month: string; // YYYY-MM
  count: number;
}

export interface EventStatistics {
  total: number;
  byStatus: StatusCount[];
  byOrganization: OrganizationCount[];
  monthly: MonthCount[];
}

// ---------- GET /api/resources/utilization ----------

export interface ResourceUtilization {
  _id: string;
  name: string;
  category?: string;
  unit?: string;
  total: number;
  reserved: number;
  available: number;
  utilization: number; // percent 0-100
}

export interface UtilizationSummary {
  resources: ResourceUtilization[];
  averageUtilization: number;
}

export const fetchEventStatistics = async (): Promise<EventStatistics> =>
  unwrap(await api.get('/events/statistics'));

export const fetchResourceUtilization = async (): Promise<UtilizationSummary> =>
  unwrap(await api.get('/resources/utilization'));

export { getErrorMessage };
