import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Building2, CheckCircle2, MapPin, RefreshCw, Users, XCircle } from 'lucide-react';
import { fetchVenueAvailability, fetchVenues } from '../api/venueApi';
import { getErrorMessage } from '../api/eventApi';
import ErrorState from './ErrorState';
import LoadingState from './LoadingState';
import type { VenueAvailability, VenueRecord } from '../types/venue';

function formatAddress(venue: VenueRecord): string {
  const address = venue.address;
  if (!address) return 'Location not specified';
  const line = [address.street, address.city, address.state].filter(Boolean).join(', ');
  return line || 'Location not specified';
}

interface VenueSelectProps {
  value: string;
  onChange: (venueId: string) => void;
  /** Event date (YYYY-MM-DD) used to check availability. */
  date?: string;
  error?: string;
}

// Grid of selectable venue cards with live availability for the chosen date.
export default function VenueSelect({ value, onChange, date, error }: VenueSelectProps) {
  const [venues, setVenues] = useState<VenueRecord[]>([]);
  const [availability, setAvailability] = useState<Record<string, VenueAvailability>>({});
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setVenues(await fetchVenues());
    } catch (err) {
      setLoadError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Availability follows the selected date.
  useEffect(() => {
    if (venues.length === 0 || !date) {
      setAvailability({});
      return;
    }
    let cancelled = false;
    setChecking(true);
    Promise.all(
      venues.map(async (venue) => {
        try {
          return [venue._id, await fetchVenueAvailability(venue._id, { date })] as const;
        } catch {
          return null;
        }
      }),
    ).then((entries) => {
      if (cancelled) return;
      const map: Record<string, VenueAvailability> = {};
      for (const entry of entries) {
        if (entry) map[entry[0]] = entry[1];
      }
      setAvailability(map);
      setChecking(false);
    });
    return () => {
      cancelled = true;
    };
  }, [venues, date]);

  if (loading) return <LoadingState message="Loading venues..." />;
  if (loadError) return <ErrorState message={loadError} onRetry={load} />;
  if (venues.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
        No venues are registered yet. Ask management to add one.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-700">
          Venue <span className="text-red-500">*</span>
        </p>
        {checking && (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <RefreshCw className="h-3 w-3 animate-spin" aria-hidden="true" />
            Checking availability...
          </span>
        )}
      </div>

      <div
        role="radiogroup"
        aria-label="Select a venue"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        {venues.map((venue) => {
          const status = availability[venue._id];
          const selected = value === venue._id;
          const inactive = venue.isActive === false;
          const disabled = inactive;

          return (
            <button
              key={venue._id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(venue._id)}
              className={`cursor-pointer rounded-xl border p-4 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                selected
                  ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-600'
                  : 'border-slate-200 bg-white hover:border-brand-300 hover:bg-slate-50'
              } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-semibold text-slate-900">
                    <Building2 className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                    <span className="truncate">{venue.name}</span>
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{formatAddress(venue)}</span>
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <Users className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    Capacity {venue.capacity ?? 0}
                  </p>
                </div>

                {selected && (
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  </span>
                )}
              </div>

              <div className="mt-3">
                {inactive ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    <XCircle className="h-3 w-3" aria-hidden="true" />
                    Unavailable
                  </span>
                ) : status ? (
                  status.available ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-800">
                      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                      Available{date ? ` on ${date}` : ''}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                      <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                      Busy{status.conflicts.length > 0
                        ? ` · ${status.conflicts.length} conflict${status.conflicts.length === 1 ? '' : 's'}`
                        : ''}
                    </span>
                  )
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                    {date ? 'Checking...' : 'Pick a date to check availability'}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
