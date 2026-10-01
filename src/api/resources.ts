import api from './client';
import type { RefWithName } from './events';

// ---------- Types (mirror the backend Mongoose schemas) ----------

export type ResourceCategory =
  | 'furniture'
  | 'audio_visual'
  | 'decoration'
  | 'catering'
  | 'IT'
  | 'transport'
  | 'other';

export interface ResourceRecord {
  _id: string;
  organization?: string | RefWithName;
  name: string;
  category: ResourceCategory;
  description?: string;
  quantityTotal: number;
  quantityAvailable: number;
  unit?: string;
  costPerUnit?: number;
  isAvailable: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Response of GET /api/resources/:id/availability - computed from active
// reservations rather than the stored quantityAvailable field.
export interface ResourceAvailability {
  resource: { id: string; name: string; unit?: string };
  total: number;
  reserved: number;
  available: number;
  activeReservations: number;
}

export interface ResourcePayload {
  name: string;
  category: ResourceCategory;
  description?: string;
  quantityTotal: number;
  quantityAvailable?: number;
  unit?: string;
  isAvailable?: boolean;
}

// ---------- Helpers ----------

const unwrap = <T>(response: { data: { data: T } }): T => response.data.data;

// ---------- Status ----------

export type ResourceStatusKey = 'active' | 'low_stock' | 'out_of_stock' | 'inactive';

export interface ResourceStatus {
  key: ResourceStatusKey;
  label: string;
  tone: 'gray' | 'green' | 'amber' | 'red';
}

// Inactive resources win over stock levels; otherwise stock decides.
export function resourceStatus(
  resource: Pick<ResourceRecord, 'quantityTotal' | 'quantityAvailable' | 'isAvailable'>,
  availableOverride?: number,
): ResourceStatus {
  const available = availableOverride ?? resource.quantityAvailable;

  if (!resource.isAvailable) return { key: 'inactive', label: 'Inactive', tone: 'gray' };
  if (resource.quantityTotal <= 0 || available <= 0) {
    return { key: 'out_of_stock', label: 'Out of stock', tone: 'red' };
  }
  if (available < resource.quantityTotal * 0.25) {
    return { key: 'low_stock', label: 'Low stock', tone: 'amber' };
  }
  return { key: 'active', label: 'In stock', tone: 'green' };
}

// ---------- Resource CRUD ----------

export const fetchResources = async (): Promise<ResourceRecord[]> =>
  unwrap(await api.get('/resources'));

export const fetchResource = async (id: string): Promise<ResourceRecord> =>
  unwrap(await api.get(`/resources/${id}`));

export const fetchResourceAvailability = async (id: string): Promise<ResourceAvailability> =>
  unwrap(await api.get(`/resources/${id}/availability`));

export const createResource = async (payload: ResourcePayload): Promise<ResourceRecord> =>
  unwrap(await api.post('/resources', payload));

export const updateResource = async (id: string, payload: ResourcePayload): Promise<ResourceRecord> =>
  unwrap(await api.put(`/resources/${id}`, payload));

export const deleteResource = async (id: string): Promise<void> => {
  await api.delete(`/resources/${id}`);
};
