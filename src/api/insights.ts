import api from './client';
import { getErrorMessage } from './eventApi';
import type { EventStatus } from './eventApi';

export type { EventStatus } from './eventApi';

const unwrap = <T>(response: { data: { data: T } }): T => response.data.data;

// ---------- Dashboard ----------

export interface DashboardStats {
  totalEvents: number;
  upcomingEvents: number;
  confirmedEvents: number;
  totalResources: number;
  activeReservations: number;
  conflicts: number;
}

export interface UpcomingEvent {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: EventStatus;
  venue: string | null;
}

export type ConflictType = 'venue' | 'schedule' | 'resource';

export interface RecentConflict {
  type: ConflictType;
  message: string;
  date: string;
  resource?: string;
  required?: number;
  available?: number;
  shortage?: number;
}

export interface ResourceAlert {
  _id: string;
  name: string;
  category?: string;
  total: number;
  available: number;
  level: 'critical' | 'low';
  message: string;
}

export interface DashboardSummary {
  stats: DashboardStats;
  upcoming: UpcomingEvent[];
  recentConflicts: RecentConflict[];
  resourceAlerts: ResourceAlert[];
}

export const fetchDashboardSummary = async (): Promise<DashboardSummary> =>
  unwrap(await api.get('/dashboard/summary'));

// ---------- Analytics ----------

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

// ---------- Per-event conflicts (for the Conflicts page) ----------

export interface ConflictingEvent {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: EventStatus;
}

export interface ResourceConflict {
  resource: string;
  resourceId: string;
  required: number;
  available: number;
  shortage: number;
}

export interface EventConflicts {
  event: { id: string; name: string; startDate: string; endDate: string };
  venueConflicts: ConflictingEvent[];
  scheduleConflicts: ConflictingEvent[];
  resourceConflicts: ResourceConflict[];
  hasConflicts: boolean;
}

export const fetchEventConflicts = async (eventId: string): Promise<EventConflicts> =>
  unwrap(await api.get(`/events/${eventId}/conflicts`));

export { getErrorMessage };
