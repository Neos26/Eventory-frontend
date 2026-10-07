import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Info, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  createRequirement,
  deleteRequirement,
  fetchEvent,
  fetchEventReadiness,
  fetchRequirements,
  getErrorMessage,
  isNotFound,
  refId,
  updateRequirement,
} from '../../api/eventApi';
import { fetchResourceAvailability, fetchResources, resourceStatus } from '../../api/resourceApi';
import { RESOURCE_CATEGORIES, resourceCategoryLabel } from '../../schemas/resourceForm';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import BackButton from '../../components/BackButton';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import Input from '../../components/Input';
import LoadingState from '../../components/LoadingState';
import Modal from '../../components/Modal';
import PageHeader from '../../components/PageHeader';
import PaginatedList from '../../components/PaginatedList';
import SearchBar from '../../components/SearchBar';
import Select from '../../components/Select';
import { formatDate } from '../../utils/format';
import type { EventRecord, RequirementRecord } from '../../types/event';
import type { ResourceRecord } from '../../types/resource';

interface AvailabilityMap {
  [resourceId: string]: { available: number; total: number };
}

interface ShortageInfo {
  required: number;
  available: number;
  shortage: number;
}

const categoryFilterOptions = [
  { value: 'all', label: 'All categories' },
  ...RESOURCE_CATEGORIES.map((category) => ({
    value: category,
    label: resourceCategoryLabel(category),
  })),
];

// Same vocabulary the management Resources page uses.
const stockFilterOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'In stock' },
  { value: 'low_stock', label: 'Low stock' },
  { value: 'out_of_stock', label: 'Out of stock' },
  { value: 'inactive', label: 'Inactive' },
];

export default function BookerEventRequirements() {
  useDocumentTitle('Resource Requirements');
  const { id } = useParams<{ id: string }>();

  const [event, setEvent] = useState<EventRecord | null>(null);
  const [requirements, setRequirements] = useState<RequirementRecord[]>([]);
  const [resources, setResources] = useState<ResourceRecord[]>([]);
  const [availability, setAvailability] = useState<AvailabilityMap>({});
  const [shortages, setShortages] = useState<Record<string, ShortageInfo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newResourceId, setNewResourceId] = useState('');
  const [newQuantity, setNewQuantity] = useState('1');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [pickerQuery, setPickerQuery] = useState('');
  const [pickerCategory, setPickerCategory] = useState('all');
  const [pickerStock, setPickerStock] = useState('all');

  const [editing, setEditing] = useState<RequirementRecord | null>(null);
  const [editQuantity, setEditQuantity] = useState('1');
  const [deleting, setDeleting] = useState<RequirementRecord | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [eventRecord, requirementList, resourceList, readiness] = await Promise.all([
        fetchEvent(id),
        fetchRequirements(id),
        fetchResources(),
        fetchEventReadiness(id),
      ]);
      setEvent(eventRecord);
      setRequirements(requirementList);
      setResources(resourceList);

      // Availability for every required resource.
      const ids = Array.from(new Set(requirementList.map((r) => refId(r.resource))));
      const entries = await Promise.all(
        ids.map(async (resourceId) => {
          try {
            const data = await fetchResourceAvailability(resourceId);
            return [resourceId, { available: data.available, total: data.total }] as const;
          } catch {
            return null;
          }
        }),
      );
      const availabilityMap: AvailabilityMap = {};
      for (const entry of entries) {
        if (entry) availabilityMap[entry[0]] = entry[1];
      }
      setAvailability(availabilityMap);

      // Shortages come from the backend readiness check (authoritative).
      const shortageMap: Record<string, ShortageInfo> = {};
      for (const issue of readiness.resourceIssues) {
        shortageMap[issue.resourceId] = {
          required: issue.required,
          available: issue.available,
          shortage: issue.shortage,
        };
      }
      setShortages(shortageMap);
    } catch (err) {
      setError(isNotFound(err) ? 'Event not found.' : getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const resourceName = useCallback(
    (resourceRef: string | { _id: string; name: string }) => {
      if (typeof resourceRef !== 'string') return resourceRef.name;
      return resources.find((resource) => resource._id === resourceRef)?.name ?? 'Unknown resource';
    },
    [resources],
  );

  // Resources that are not required yet.
  const availableResources = useMemo(() => {
    const used = new Set(requirements.map((requirement) => refId(requirement.resource)));
    return resources.filter((resource) => !used.has(resource._id));
  }, [resources, requirements]);

  // Picker list narrowed by search + category + stock filters.
  const pickableResources = useMemo(() => {
    const search = pickerQuery.trim().toLowerCase();
    return availableResources.filter((resource) => {
      if (pickerCategory !== 'all' && resource.category !== pickerCategory) return false;
      if (pickerStock !== 'all' && resourceStatus(resource).key !== pickerStock) return false;
      if (!search) return true;
      return [resource.name, resourceCategoryLabel(resource.category), resource.unit ?? '']
        .join(' ')
        .toLowerCase()
        .includes(search);
    });
  }, [availableResources, pickerQuery, pickerCategory, pickerStock]);

  // Keep the dropdown selection valid when filters hide the chosen resource.
  useEffect(() => {
    if (newResourceId && !pickableResources.some((resource) => resource._id === newResourceId)) {
      setNewResourceId('');
    }
  }, [pickableResources, newResourceId]);

  const clearPickerFilters = () => {
    setPickerQuery('');
    setPickerCategory('all');
    setPickerStock('all');
  };

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id || !newResourceId) return;
    const quantity = Number(newQuantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      setActionError('Quantity must be a whole number of at least 1.');
      return;
    }
    setSaving(true);
    setActionError(null);
    try {
      await createRequirement(id, { resource: newResourceId, quantity });
      setNewResourceId('');
      setNewQuantity('1');
      await load();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleEditSave = async () => {
    if (!id || !editing) return;
    const quantity = Number(editQuantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      setActionError('Quantity must be a whole number of at least 1.');
      return;
    }
    setSaving(true);
    setActionError(null);
    try {
      await updateRequirement(id, editing._id, { quantity });
      setEditing(null);
      await load();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !deleting) return;
    setSaving(true);
    setActionError(null);
    try {
      await deleteRequirement(id, deleting._id);
      setDeleting(null);
      await load();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="Loading requirements..." />;
  if (error || !event) {
    return (
      <>
        <BackButton to="/booker/events" label="Back to events" />
        <ErrorState message={error ?? 'Event not found.'} onRetry={load} />
      </>
    );
  }

  return (
    <>
      <BackButton to="/booker/events" label="Back to events" />
      <PageHeader
        title="Resource Requirements"
        description={`${event.name} · ${formatDate(event.startDate)}`}
        actions={
          <Link
            to={`/booker/events/${event._id}`}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
          >
            Review &amp; Book
          </Link>
        }
      />

      {actionError && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {actionError}
        </div>
      )}

      {/* Requirements list */}
      <Card>
        <h2 className="mb-4 font-semibold text-slate-900">Requested resources</h2>

        {requirements.length === 0 ? (
          <EmptyState
            title="No resources requested"
            description="Add projectors, chairs, tables or sound systems below."
          />
        ) : (
          <PaginatedList
            as="ul"
            items={requirements}
            itemKey={(requirement) => requirement._id}
            pageSize={10}
            className="space-y-3"
            renderItem={(requirement) => {
              const resourceId = refId(requirement.resource);
              const issue = shortages[resourceId];
              const knownAvailability = availability[resourceId];
              const required = requirement.quantity;
              const available = issue
                ? issue.available
                : Math.max(knownAvailability?.available ?? required, required);
              const shortage = issue ? issue.shortage : 0;

              return (
                <li
                  key={requirement._id}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">
                        {resourceName(requirement.resource)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                          Required: {required}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 font-medium ${
                            shortage > 0 ? 'bg-amber-100 text-amber-800' : 'bg-brand-100 text-brand-800'
                          }`}
                        >
                          Available: {available}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 font-medium ${
                            shortage > 0 ? 'bg-red-100 text-red-700' : 'bg-lime-100 text-lime-800'
                          }`}
                        >
                          {shortage > 0 ? `Shortage: ${shortage}` : 'No shortage'}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(requirement);
                          setEditQuantity(String(requirement.quantity));
                          setActionError(null);
                        }}
                        aria-label={`Edit ${resourceName(requirement.resource)}`}
                        className="cursor-pointer rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleting(requirement);
                          setActionError(null);
                        }}
                        aria-label={`Remove ${resourceName(requirement.resource)}`}
                        className="cursor-pointer rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  {shortage > 0 && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>
                        Not enough stock: {resourceName(requirement.resource)} needs {required},{' '}
                        {available} {available === 1 ? 'is' : 'are'} available. Free up stock or
                        lower the quantity before submitting the booking.
                      </span>
                    </div>
                  )}

                  {shortage === 0 && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-brand-700">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Covered by current stock.
                    </div>
                  )}
                </li>
              );
            }}
          />
        )}
      </Card>

      {/* Add resource */}
      <Card className="mt-6">
        <h2 className="mb-4 font-semibold text-slate-900">Add a resource</h2>

        <div className="mb-4 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          <span>
            Requesting a resource here does <span className="font-semibold">not</span> reserve or
            hold it — stock stays available to everyone while your booking is pending. Quantities
            are only reserved for you once management <span className="font-semibold">approves</span>{' '}
            the booking.
          </span>
        </div>

        {resources.length === 0 ? (
          <p className="text-sm text-slate-500">
            No resources are registered yet. Ask management to add inventory first.
          </p>
        ) : availableResources.length === 0 ? (
          <p className="text-sm text-slate-500">Every resource is already requested.</p>
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <SearchBar
                value={pickerQuery}
                onChange={setPickerQuery}
                placeholder="Search resources..."
              />
              <div className="w-full sm:w-48">
                <Select
                  aria-label="Filter by category"
                  value={pickerCategory}
                  onChange={(changeEvent) => setPickerCategory(changeEvent.target.value)}
                  options={categoryFilterOptions}
                />
              </div>
              <div className="w-full sm:w-48">
                <Select
                  aria-label="Filter by stock status"
                  value={pickerStock}
                  onChange={(changeEvent) => setPickerStock(changeEvent.target.value)}
                  options={stockFilterOptions}
                />
              </div>
              <span className="text-sm text-slate-500">
                {pickableResources.length} of {availableResources.length} resource
                {availableResources.length === 1 ? '' : 's'}
              </span>
            </div>

            {pickableResources.length === 0 ? (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-slate-500">
                  No resources match your search or filters.
                </p>
                <Button variant="secondary" size="sm" onClick={clearPickerFilters}>
                  Clear filters
                </Button>
              </div>
            ) : (
              <>
                <p className="mb-1 block text-sm font-medium text-slate-700">Resource</p>
                <PaginatedList
                  items={pickableResources}
                  itemKey={(resource) => resource._id}
                  pageSize={12}
                  className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
                  renderItem={(resource) => {
                    const status = resourceStatus(resource);
                    const selected = resource._id === newResourceId;
                    return (
                      <button
                        type="button"
                        onClick={() => setNewResourceId(resource._id)}
                        aria-pressed={selected}
                        className={`cursor-pointer rounded-xl border p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                          selected
                            ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-600'
                            : 'border-slate-200 bg-white hover:border-brand-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 break-words font-medium text-slate-900">
                            {resource.name}
                          </p>
                          {selected && (
                            <CheckCircle2
                              className="h-5 w-5 shrink-0 text-brand-600"
                              aria-hidden="true"
                            />
                          )}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {resourceCategoryLabel(resource.category)} · {resource.quantityTotal} in
                          stock
                        </p>
                        <span className="mt-2 inline-block">
                          <Badge tone={status.tone}>{status.label}</Badge>
                        </span>
                      </button>
                    );
                  }}
                />

                <form
                  onSubmit={handleAdd}
                  noValidate
                  className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end"
                >
                  <div className="w-full sm:w-32">
                    <Input
                      label="Quantity"
                      required
                      type="number"
                      min={1}
                      step={1}
                      value={newQuantity}
                      onChange={(changeEvent) => setNewQuantity(changeEvent.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={saving || !newResourceId}>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    {saving ? 'Adding...' : 'Add'}
                  </Button>
                </form>
              </>
            )}
          </>
        )}
      </Card>

      {/* Edit quantity */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={
          editing ? `Update quantity - ${resourceName(editing.resource)}` : 'Update quantity'
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleEditSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </>
        }
      >
        <Input
          label="Quantity"
          required
          type="number"
          min={1}
          step={1}
          value={editQuantity}
          onChange={(changeEvent) => setEditQuantity(changeEvent.target.value)}
        />
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Remove requirement?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)} disabled={saving}>
              Keep it
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={saving}>
              {saving ? 'Removing...' : 'Remove'}
            </Button>
          </>
        }
      >
        <p>
          {deleting
            ? `${resourceName(deleting.resource)} will be removed from this event.`
            : ''}
        </p>
      </Modal>
    </>
  );
}
