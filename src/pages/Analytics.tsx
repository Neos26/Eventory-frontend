import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import useDocumentTitle from '../hooks/useDocumentTitle';
import {
  fetchEventStatistics,
  fetchResourceUtilization,
  getErrorMessage,
} from '../api/insights';
import type { EventStatistics, UtilizationSummary } from '../api/insights';

// Bar colors per status (matches the Badge tones used elsewhere).
const statusColors: Record<string, string> = {
  draft: 'bg-slate-400',
  planned: 'bg-indigo-500',
  ongoing: 'bg-emerald-500',
  completed: 'bg-slate-600',
  cancelled: 'bg-red-400',
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

export default function Analytics() {
  useDocumentTitle('Analytics');

  const [statistics, setStatistics] = useState<EventStatistics | null>(null);
  const [utilization, setUtilization] = useState<UtilizationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [stats, utilizationSummary] = await Promise.all([
        fetchEventStatistics(),
        fetchResourceUtilization(),
      ]);
      setStatistics(stats);
      setUtilization(utilizationSummary);
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

  const maxStatus = Math.max(...statistics.byStatus.map((item) => item.count), 1);
  const maxOrg = Math.max(...statistics.byOrganization.map((item) => item.count), 1);
  const maxMonth = Math.max(...statistics.monthly.map((item) => item.count), 1);

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Participation, utilization and readiness insights."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Events by status">
          {statistics.total === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">No events recorded yet.</p>
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

        <ChartCard title="Events by organization">
          {statistics.byOrganization.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">No organizations with events yet.</p>
          ) : (
            <div className="space-y-3">
              {statistics.byOrganization.map((item) => (
                <BarRow
                  key={item.organization}
                  label={item.organization}
                  value={item.count}
                  max={maxOrg}
                  color="bg-brand-500"
                />
              ))}
            </div>
          )}
        </ChartCard>

        <ChartCard title="Monthly events">
          {statistics.monthly.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">No events scheduled yet.</p>
          ) : (
            <div>
              <div className="flex h-40 items-end gap-2 border-b border-slate-200 pb-1">
                {statistics.monthly.map((item) => {
                  const height = maxMonth > 0 ? Math.max((item.count / maxMonth) * 100, 4) : 0;
                  return (
                    <div
                      key={item.month}
                      className="group flex flex-1 flex-col items-center justify-end gap-1"
                      title={`${shortMonth(item.month)}: ${item.count} event(s)`}
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
                {statistics.monthly.map((item) => (
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
            <p className="py-6 text-center text-sm text-slate-500">No resources tracked yet.</p>
          ) : (
            <div className="space-y-3">
              {utilization.resources.map((item) => (
                <BarRow
                  key={item._id}
                  label={item.name}
                  value={item.utilization}
                  max={100}
                  color={item.utilization >= 80 ? 'bg-amber-500' : 'bg-brand-500'}
                  suffix="%"
                />
              ))}
            </div>
          )}
        </ChartCard>
      </div>
    </>
  );
}
