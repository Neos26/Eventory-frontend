import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { fetchResource, fetchResourceAvailability, resourceStatus } from '../api/resourceApi';
import type { ResourceAvailability, ResourceRecord } from '../api/resourceApi';
import { getErrorMessage, isNotFound } from '../api/eventApi';
import { resourceCategoryLabel } from '../schemas/resourceForm';

interface FieldProps {
  label: string;
  children: ReactNode;
}

function Field({ label, children }: FieldProps) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <div className="mt-1 text-sm font-medium text-slate-900">{children}</div>
    </div>
  );
}

interface StatProps {
  label: string;
  value: ReactNode;
  hint?: string;
}

function Stat({ label, value, hint }: StatProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export default function ResourceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [resource, setResource] = useState<ResourceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [availability, setAvailability] = useState<ResourceAvailability | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  useDocumentTitle(resource?.name ?? 'Resource');

  const loadResource = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    setNotFound(false);
    try {
      setResource(await fetchResource(id));
    } catch (requestError) {
      if (isNotFound(requestError)) {
        setNotFound(true);
      } else {
        setLoadError(getErrorMessage(requestError));
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadAvailability = useCallback(async () => {
    if (!id) return;
    setAvailabilityLoading(true);
    setAvailabilityError(null);
    try {
      setAvailability(await fetchResourceAvailability(id));
    } catch (requestError) {
      setAvailabilityError(getErrorMessage(requestError));
    } finally {
      setAvailabilityLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadResource();
    void loadAvailability();
  }, [loadResource, loadAvailability]);

  if (loading) {
    return <LoadingState message="Loading resource..." />;
  }

  if (notFound) {
    return (
      <>
        <PageHeader title="Resource" />
        <EmptyState
          title="Resource not found"
          description="This resource may have been deleted."
          action={<Button onClick={() => navigate('/management/resources')}>Back to resources</Button>}
        />
      </>
    );
  }

  if (loadError || !resource) {
    return (
      <>
        <PageHeader title="Resource" />
        <ErrorState
          message={loadError ?? 'Unable to load this resource.'}
          onRetry={() => void loadResource()}
        />
      </>
    );
  }

  const status = resourceStatus(resource, availability?.available);
  const unit = availability?.resource.unit ?? resource.unit ?? 'unit';
  const total = availability?.total ?? resource.quantityTotal;
  const reserved = availability?.reserved ?? null;
  const available = availability?.available ?? resource.quantityAvailable;
  const reservedShare =
    total > 0 && reserved !== null ? Math.min(100, Math.round((reserved / total) * 100)) : 0;

  return (
    <>
      <PageHeader
        title={resource.name}
        description={resource.description || 'Availability and stock details.'}
        actions={
          <Button variant="secondary" onClick={() => navigate('/management/resources')}>
            Back to resources
          </Button>
        }
      />

      <Card>
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <Badge tone={status.tone}>{status.label}</Badge>
          <span className="text-sm text-slate-500">
            {resourceCategoryLabel(resource.category)} · measured in {unit}
          </span>
        </div>

        {availabilityLoading ? (
          <div className="flex items-center gap-3 py-6 text-sm text-slate-500">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
            Checking live availability...
          </div>
        ) : (
          <>
            {availabilityError && (
              <div className="mb-5 flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Live availability could not be loaded — showing stored quantities instead.{' '}
                  <span className="font-medium">({availabilityError})</span>
                </span>
                <Button variant="secondary" size="sm" onClick={() => void loadAvailability()}>
                  Try again
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Stat label="Total quantity" value={total} hint={`in ${unit}`} />
              <Stat
                label="Reserved quantity"
                value={reserved !== null ? reserved : '—'}
                hint={
                  availability
                    ? `across ${availability.activeReservations} active reservation${
                        availability.activeReservations === 1 ? '' : 's'
                      }`
                    : 'unavailable'
                }
              />
              <Stat label="Available quantity" value={available} hint={`in ${unit}`} />
            </div>

            {reserved !== null && (
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                  <span>Stock usage</span>
                  <span>{`${reserved} of ${total} reserved`}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${
                      reservedShare >= 100 ? 'bg-red-500' : 'bg-brand-600'
                    }`}
                    style={{ width: `${reservedShare}%` }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <Card className="mt-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Field label="Category">{resourceCategoryLabel(resource.category)}</Field>
          <Field label="Unit">{unit}</Field>
          <Field label="Status">
            <Badge tone={status.tone}>{status.label}</Badge>
          </Field>
        </div>

        {resource.description && (
          <div className="mt-6 border-t border-slate-100 pt-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Description
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {resource.description}
            </p>
          </div>
        )}
      </Card>
    </>
  );
}
