import axios from 'axios';
import api from './client';

// ---------- Types (canonical definitions live in src/types) ----------

export type {
  EventStatus,
  RequirementPriority,
  RefWithName,
  EventRecord,
  RequirementRecord,
  EventPayload,
  RequirementPayload,
  ResourceIssue,
  ReadinessConflict,
  Readiness,
  ReadinessReport,
  ConflictType,
  Conflict,
  ConflictRecord,
  ConflictReport,
  ConflictsReport,
} from '../types/event';
export type { OrganizationRecord } from '../types/organization';
export type { VenueRecord } from '../types/venue';
export type { ResourceRecord } from '../types/resource';

import type { EventRecord, EventPayload } from '../types/event';
import type { OrganizationRecord } from '../types/organization';
import type { RequirementPayload, RequirementRecord, ReadinessReport, ConflictsReport } from '../types/event';

// Venue lookups live in the venue service; re-exported here because the
// event pages have always imported them from this module.
export { fetchVenues } from './venueApi';

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
  ref: string | { _id: string; name: string } | null | undefined,
  lookup: Map<string, string>,
  fallback = '—',
): string {
  if (!ref) return fallback;
  if (typeof ref !== 'string') return ref.name;
  return lookup.get(ref) ?? fallback;
}

export function refId(ref: string | { _id: string } | null | undefined): string {
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

// The backend applies only the fields present in the body, so partial
// updates (e.g. confirming an event) are allowed.
export const updateEvent = async (
  id: string,
  payload: Partial<EventPayload>,
): Promise<EventRecord> => unwrap(await api.put(`/events/${id}`, payload));

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

export const deleteRequirement = async (eventId: string, requirementId: string): Promise<void> => {
  await api.delete(`/events/${eventId}/requirements/${requirementId}`);
};

// ---------- Readiness & conflicts ----------

export const fetchEventReadiness = async (eventId: string): Promise<ReadinessReport> =>
  unwrap(await api.get(`/events/${eventId}/readiness`));

export const fetchEventConflicts = async (eventId: string): Promise<ConflictsReport> =>
  unwrap(await api.get(`/events/${eventId}/conflicts`));

// ---------- Lookups ----------

export const fetchOrganizations = async (): Promise<OrganizationRecord[]> =>
  unwrap(await api.get('/organizations'));
