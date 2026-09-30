import axios from 'axios';
import api from './client';

// ---------- Types (mirror the backend Mongoose schemas) ----------

export type EventStatus = 'draft' | 'planned' | 'ongoing' | 'completed' | 'cancelled';

export type RequirementPriority = 'low' | 'medium' | 'high';

export interface RefWithName {
  _id: string;
  name: string;
}

export interface OrganizationRecord {
  _id: string;
  name: string;
  description?: string;
  email?: string;
  phone?: string;
}

export interface VenueRecord {
  _id: string;
  name: string;
  capacity?: number;
  isActive?: boolean;
}

export interface ResourceRecord {
  _id: string;
  name: string;
  category?: string;
  unit?: string;
  quantityTotal: number;
  quantityAvailable: number;
}

export interface EventRecord {
  _id: string;
  organization: string | RefWithName;
  venue?: string | RefWithName | null;
  name: string;
  description?: string;
  category: string;
  startDate: string;
  endDate: string;
  expectedAttendees: number;
  status: EventStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface RequirementRecord {
  _id: string;
  event: string;
  resource: string | RefWithName;
  quantity: number;
  requiredDate: string;
  priority: RequirementPriority;
  status: string;
  notes?: string;
}

export interface EventPayload {
  organization: string;
  venue?: string | null;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: EventStatus;
}

export interface RequirementPayload {
  resource: string;
  quantity: number;
  priority?: RequirementPriority;
  requiredDate?: string;
}

// ---------- Helpers ----------

// Every API response is { success, data, ... } - unwrap the data branch.
const unwrap = <T>(response: { data: { data: T } }): T => response.data.data;

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as { message?: string } | undefined;
    if (payload?.message) return payload.message;
    if (error.code === 'ECONNABORTED') return 'Request timed out. Please try again.';
    if (!error.response) return 'Cannot reach the server. Is the backend running?';
  }
  return 'Something went wrong. Please try again.';
}

export function isNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

// Refs are plain ids in list responses and populated objects in detail
// responses - this reads a display name from either shape.
export function resolveName(
  ref: string | RefWithName | null | undefined,
  lookup: Map<string, string>,
  fallback = '—',
): string {
  if (!ref) return fallback;
  if (typeof ref !== 'string') return ref.name;
  return lookup.get(ref) ?? fallback;
}

export function refId(ref: string | RefWithName | null | undefined): string {
  if (!ref) return '';
  return typeof ref === 'string' ? ref : ref._id;
}

// ---------- Events ----------

export const fetchEvents = async (): Promise<EventRecord[]> =>
  unwrap(await api.get('/events'));

export const fetchEvent = async (id: string): Promise<EventRecord> =>
  unwrap(await api.get(`/events/${id}`));

export const createEvent = async (payload: EventPayload): Promise<EventRecord> =>
  unwrap(await api.post('/events', payload));

export const updateEvent = async (id: string, payload: EventPayload): Promise<EventRecord> =>
  unwrap(await api.put(`/events/${id}`, payload));

export const deleteEvent = async (id: string): Promise<void> => {
  await api.delete(`/events/${id}`);
};

// ---------- Requirements ----------

export const fetchRequirements = async (eventId: string): Promise<RequirementRecord[]> =>
  unwrap(await api.get(`/events/${eventId}/requirements`));

export const createRequirement = async (
  eventId: string,
  payload: RequirementPayload,
): Promise<RequirementRecord> =>
  unwrap(await api.post(`/events/${eventId}/requirements`, payload));

export const updateRequirement = async (
  eventId: string,
  requirementId: string,
  payload: Partial<RequirementPayload>,
): Promise<RequirementRecord> =>
  unwrap(await api.put(`/events/${eventId}/requirements/${requirementId}`, payload));

export const deleteRequirement = async (
  eventId: string,
  requirementId: string,
): Promise<void> => {
  await api.delete(`/events/${eventId}/requirements/${requirementId}`);
};

// ---------- Lookups ----------

export const fetchOrganizations = async (): Promise<OrganizationRecord[]> =>
  unwrap(await api.get('/organizations'));

export const fetchVenues = async (): Promise<VenueRecord[]> =>
  unwrap(await api.get('/venues'));

export const fetchResources = async (): Promise<ResourceRecord[]> =>
  unwrap(await api.get('/resources'));
