import api from './client';
import type { CreateOrganizationPayload, OrganizationRecord, UpdateOrganizationPayload } from '../types/organization';

// Every API response is { success, data, ... } - unwrap the data branch.
const unwrap = <T>(response: { data: { data: T } }): T => response.data.data;

export const createOrganization = async (payload: CreateOrganizationPayload): Promise<OrganizationRecord> =>
  unwrap(await api.post('/organizations', payload));

export const updateOrganization = async (
  id: string,
  payload: UpdateOrganizationPayload,
): Promise<OrganizationRecord> => unwrap(await api.put(`/organizations/${id}`, payload));
