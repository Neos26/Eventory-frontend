import api from './client';
import type { VenueAvailability, VenueRecord } from '../types/venue';

const unwrap = <T>(response: { data: { data: T } }): T => response.data.data;

export type { VenueRecord, VenueAvailability } from '../types/venue';

// GET /api/venues
export const fetchVenues = async (): Promise<VenueRecord[]> => unwrap(await api.get('/venues'));

// GET /api/venues/:id/availability?date=YYYY-MM-DD (or ?start=&end=)
// Lets the booker pick a venue that is actually free on the event date.
export const fetchVenueAvailability = async (
  id: string,
  query: { date?: string; start?: string; end?: string },
): Promise<VenueAvailability> => {
  const params = new URLSearchParams();
  if (query.date) params.set('date', query.date);
  if (query.start) params.set('start', query.start);
  if (query.end) params.set('end', query.end);
  const suffix = params.toString() ? `?${params.toString()}` : '';
  return unwrap(await api.get(`/venues/${id}/availability${suffix}`));
};
