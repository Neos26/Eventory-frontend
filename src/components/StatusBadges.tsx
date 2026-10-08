import { Ban, CheckCircle2, CircleDot, Info, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { BookingStatus } from '../types/booking';
import type { EventStatus } from '../types/event';

// Status is never communicated by color alone: every badge carries an icon
// and its label as text.

interface StatusSpec {
  label: string;
  className: string;
  icon: LucideIcon;
}

// Event status mirrors the booking vocabulary (lowercase), so each tone
// matches its booking counterpart.
const eventStatuses: Record<EventStatus, StatusSpec> = {
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-800', icon: CircleDot },
  approved: { label: 'Approved', className: 'bg-brand-100 text-brand-800', icon: CheckCircle2 },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700', icon: XCircle },
  cancelled: { label: 'Cancelled', className: 'bg-slate-100 text-slate-600', icon: Ban },
  completed: { label: 'Completed', className: 'bg-lime-100 text-lime-800', icon: CheckCircle2 },
};

const bookingStatuses: Record<BookingStatus, StatusSpec> = {
  Pending: { label: 'Pending', className: 'bg-amber-100 text-amber-800', icon: CircleDot },
  Approved: { label: 'Approved', className: 'bg-brand-100 text-brand-800', icon: CheckCircle2 },
  Rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700', icon: XCircle },
  Cancelled: { label: 'Cancelled', className: 'bg-slate-100 text-slate-600', icon: Ban },
  Completed: { label: 'Completed', className: 'bg-lime-100 text-lime-800', icon: CheckCircle2 },
};

// Unknown statuses (e.g. a new backend value) are shown verbatim instead of
// being mislabeled as an existing one.
function unknownSpec(status: string): StatusSpec {
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
  return { label, className: 'bg-slate-100 text-slate-700', icon: Info };
}

function StatusChip({ spec }: { spec: StatusSpec }) {
  const Icon = spec.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${spec.className}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {spec.label}
    </span>
  );
}

// Both badges accept plain strings so populated API fields and dashboard
// unions flow through without unsafe casts; unknown values fall back safely.
export function EventStatusBadge({ status }: { status: string }) {
  return (
    <StatusChip
      spec={eventStatuses[status as EventStatus] ?? unknownSpec(status)}
    />
  );
}

export function BookingStatusBadge({ status }: { status: string }) {
  return (
    <StatusChip
      spec={bookingStatuses[status as BookingStatus] ?? unknownSpec(status)}
    />
  );
}
