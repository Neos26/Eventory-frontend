import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import PaginatedList from '../components/PaginatedList';
import useDocumentTitle from '../hooks/useDocumentTitle';
import {
  fetchEventStatistics,
  fetchResourceUtilization,
  getErrorMessage,
} from '../api/analyticsApi';
import type { EventStatistics, UtilizationSummary } from '../api/analyticsApi';
import { fetchBookings } from '../api/bookingApi';
import type { BookingRecord } from '../api/bookingApi';
import { fetchReservations } from '../api/reservations';
import type { ReservationRecord } from '../api/reservations';
import { fetchEvents, refId, resolveName } from '../api/eventApi';
import type { EventRecord } from '../api/eventApi';
import { fetchResources } from '../api/resourceApi';
import type { ResourceRecord } from '../api/resourceApi';
import { fetchVenues } from '../api/venueApi';
import type { VenueRecord } from '../api/venueApi';

// Bar colors per status (matches the Badge tones used elsewhere).
const statusColors: Record<string, string> = {
  pending: 'bg-amber-500',
  approved: 'bg-brand-500',
  rejected: 'bg-red-400',
  completed: 'bg-slate-600',
  cancelled: 'bg-slate-400',
};

const capitalize = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);

// Short month label for YYYY-MM keys ("2026-10" -> "Oct 26").
const shortMonth = (month: string): string => {
  const [year, monthNumber] = month.split('-').map(Number);
  if (!year || !monthNumber) return month;
  return new Date(year, monthNumber - 1, 1).toLocaleDateString('en-US', {
    month: 'short',
    year: '2-digit',
  });
};

// Last six month keys, oldest first: ["2026-05", ..., "2026-10"].
function lastSixMonths(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

interface BarRowProps {
  label: string;
  value: number;
  max: number;
  color: string;
  suffix?: string;
}

function BarRow({ label, value, max, color, suffix = '' }: BarRowProps) {
  const width = max > 0 ? Math.max(value > 0 ? 4 : 0, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 truncate text-sm text-slate-600" title={label}>
        {label}
      </span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
      <span className="w-16 shrink-0 text-right text-sm font-medium text-slate-800">
        {value}
        {suffix}
      </span>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">{title}</h2>
      {children}
    </Card>
  );
}

function EmptyChart({ message }: { message: string }) {
  return <p className="py-6 text-center text-sm text-slate-500">{message}</p>;
}

export default function Analytics() {
  useDocumentTitle('Analytics');

  const [statistics, setStatistics] = useState<EventStatistics | null>(null);
  const [utilization, setUtilization] = useState<UtilizationSummary | null>(null);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [resources, setResources] = useState<ResourceRecord[]>([]);
  const [venues, setVenues] = useState<VenueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Statistics + utilization are required; the rest degrade gracefully.
      const [stats, utilizationSummary, bookingList, reservationList, eventList, resourceList, venueList] =
        await Promise.all([
          fetchEventStatistics(),
          fetchResourceUtilization(),
          fetchBookings().catch(() => [] as BookingRecord[]),
          fetchReservations().catch(() => [] as ReservationRecord[]),
          fetchEvents().catch(() => [] as EventRecord[]),
          fetchResources().catch(() => [] as ResourceRecord[]),
          fetchVenues().catch(() => [] as VenueRecord[]),
        ]);
      setStatistics(stats);
      setUtilization(utilizationSummary);
      setBookings(bookingList);
      setReservations(reservationList);
      setEvents(eventList);
      setResources(resourceList);
      setVenues(venueList);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <LoadingState message="Loading analytics..." />;
  }

  if (error || !statistics || !utilization) {
    return <ErrorState message={error ?? 'Unable to load analytics.'} onRetry={() => void load()} />;
  }

  // 1. Events by status.
  const maxStatus = Math.max(...statistics.byStatus.map((item) => item.count), 1);

  // 2. Monthly booking activity — bookings created per month, last 6 months.
  const bookingMonths = lastSixMonths();
  const bookingCounts = Object.fromEntries(bookingMonths.map((month) => [month, 0])) as Record<
    string,
    number
  >;
  for (const booking of bookings) {
    const key = booking.createdAt?.slice(0, 7);
    if (key && key in bookingCounts) bookingCounts[key] += 1;
  }
  const bookingActivity = bookingMonths.map((month) => ({ month, count: bookingCounts[month] }));
  const maxBookingMonth = Math.max(...bookingActivity.map((item) => item.count), 1);

  // 3. Resource utilization (from the utilization endpoint).

  // 4. Most requested resources — summed quantities from active reservations.
  const resourceNames = new Map(resources.map((resource) => [resource._id, resource.name]));
  const requestedTotals = new Map<string, number>();
  for (const reservation of reservations) {
    if (reservation.status === 'cancelled') continue;
    const name = resolveName(reservation.resource, resourceNames, 'Unknown resource');
    requestedTotals.set(name, (requestedTotals.get(name) ?? 0) + reservation.quantity);
  }
  const mostRequested = [...requestedTotals.entries()]
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8);
  const maxRequested = Math.max(...mostRequested.map((item) => item.quantity), 1);

  // 5. Venue usage — events per venue (excluding cancelled).
  const venueNames = new Map(venues.map((venue) => [venue._id, venue.name]));
  const venueUsageTotals = new Map<string, number>();
  for (const event of events) {
    if (event.status === 'cancelled') continue;
    const venueId = refId(event.venue);
    const name = venueId ? (venueNames.get(venueId) ?? 'Unknown venue') : 'Unassigned';
    venueUsageTotals.set(name, (venueUsageTotals.get(name) ?? 0) + 1);
  }
  const venueUsage = [...venueUsageTotals.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  const maxVenueUsage = Math.max(...venueUsage.map((item) => item.count), 1);

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Events, bookings, resources and venue insights."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Events by status">
          {statistics.total === 0 ? (
            <EmptyChart message="No events recorded yet." />
          ) : (
            <div className="space-y-3">
              {statistics.byStatus.map((item) => (
                <BarRow
                  key={item.status}
                  label={capitalize(item.status)}
                  value={item.count}
                  max={maxStatus}
                  color={statusColors[item.status] ?? 'bg-brand-500'}
                />
              ))}
            </div>
          )}
        </ChartCard>

        <ChartCard title="Monthly booking activity">
          {bookings.length === 0 ? (
            <EmptyChart message="No bookings yet." />
          ) : (
            <div>
              <div className="flex h-40 items-end gap-2 border-b border-slate-200 pb-1">
                {bookingActivity.map((item) => {
                  const height =
                    maxBookingMonth > 0 ? Math.max((item.count / maxBookingMonth) * 100, 4) : 0;
                  return (
                    <div
                      key={item.month}
                      className="group flex flex-1 flex-col items-center justify-end gap-1"
                      title={`${shortMonth(item.month)}: ${item.count} booking(s)`}
                    >
                      <span className="text-xs font-medium text-slate-500 opacity-0 transition-opacity group-hover:opacity-100">
                        {item.count}
                      </span>
                      <div
                        className="w-full max-w-10 rounded-t bg-brand-500 transition-colors group-hover:bg-brand-600"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex gap-2">
                {bookingActivity.map((item) => (
                  <span key={item.month} className="flex-1 text-center text-xs text-slate-400">
                    {shortMonth(item.month)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Resource utilization">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">Reserved share of total stock</p>
            <p className="text-lg font-bold text-slate-900">{utilization.averageUtilization}% avg</p>
          </div>
          {utilization.resources.length === 0 ? (
            <EmptyChart message="No resources tracked yet." />
          ) : (
            <PaginatedList
              items={utilization.resources}
              itemKey={(item) => item._id}
              pageSize={10}
              className="space-y-3"
              renderItem={(item) => (
                <BarRow
                  label={item.name}
                  value={item.utilization}
                  max={100}
                  color={item.utilization >= 80 ? 'bg-amber-500' : 'bg-brand-500'}
                  suffix="%"
                />
              )}
            />
          )}
        </ChartCard>

        <ChartCard title="Most requested resources">
          {mostRequested.length === 0 ? (
            <EmptyChart message="No reservations recorded yet." />
          ) : (
            <div className="space-y-3">
              {mostRequested.map((item) => (
                <BarRow
                  key={item.name}
                  label={item.name}
                  value={item.quantity}
                  max={maxRequested}
                  color="bg-indigo-500"
                />
              ))}
            </div>
          )}
        </ChartCard>

        <div className="lg:col-span-2">
          <ChartCard title="Venue usage">
            {venueUsage.length === 0 ? (
              <EmptyChart message="No events scheduled yet." />
            ) : (
              <div className="space-y-3">
                {venueUsage.map((item) => (
                  <BarRow
                    key={item.name}
                    label={item.name}
                    value={item.count}
                    max={maxVenueUsage}
                    color="bg-brand-600"
                  />
                ))}
              </div>
            )}
          </ChartCard>
        </div>
      </div>
    </>
  );
}
