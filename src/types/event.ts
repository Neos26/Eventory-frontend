// Event domain types. These mirror the backend Mongoose schemas and the
// response shapes of /api/events, /api/events/:id/conflicts and
// /api/events/:id/readiness.

export type EventStatus = 'draft' | 'planned' | 'ongoing' | 'completed' | 'cancelled';

export type RequirementPriority = 'low' | 'medium' | 'high';

// Any backend reference that is a plain id in lists and a populated object
// in detail responses.
export interface RefWithName {
  _id: string;
  name: string;
}

export interface EventRecord {
  _id: string;
  organization: string | RefWithName;
  venue?: string | RefWithName | null;
  name: string;
  description?: string;
  category: string;
  startDate: string;
  endDate: string;
  expectedAttendees: number;
  status: EventStatus;
  bookerId?: string | RefWithName | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface RequirementRecord {
  _id: string;
  event: string;
  resource: string | RefWithName;
  quantity: number;
  requiredDate: string;
  priority: RequirementPriority;
  status: string;
  notes?: string;
}

export interface EventPayload {
  organization: string;
  venue?: string | null;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: EventStatus;
}

export interface RequirementPayload {
  resource: string;
  quantity: number;
  priority?: RequirementPriority;
  requiredDate?: string;
}

// A requirement the backend could not cover from available stock.
export interface ResourceIssue {
  resource: string;
  resourceId: string;
  required: number;
  available: number;
  shortage: number;
}

// Grouped overlap reported by readiness (legacy shape).
export interface ReadinessConflict {
  type: 'venue' | 'schedule';
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: EventStatus;
}

// GET /api/events/:id/readiness
export interface Readiness {
  ready: boolean;
  venueAvailable: boolean;
  resourceIssues: ResourceIssue[];
  conflicts: ReadinessConflict[];
}

// Flat, spec-friendly conflict entry returned alongside the grouped arrays.
export type ConflictType =
  | 'VENUE_CONFLICT'
  | 'SCHEDULE_CONFLICT'
  | 'RESOURCE_SHORTAGE'
  | 'INVALID_SCHEDULE';

export interface Conflict {
  type: ConflictType;
  message?: string;
  venue?: string | null;
  event?: string;
  resource?: string;
  resourceId?: string;
  required?: number;
  available?: number;
  shortage?: number;
  startDate?: string;
  endDate?: string;
}

// A non-cancelled event involved in a grouped conflict.
export interface ConflictRecord {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: EventStatus;
}

// GET /api/events/:id/conflicts
export interface ConflictReport {
  event: { id: string; name: string; startDate: string; endDate: string };
  venueConflicts: ConflictRecord[];
  scheduleConflicts: ConflictRecord[];
  resourceConflicts: ResourceIssue[];
  conflicts: Conflict[];
  hasConflicts: boolean;
}

// Legacy aliases so existing pages keep compiling.
export type EventFormStatus = EventStatus;
export type ReadinessReport = Readiness;
export type ConflictsReport = ConflictReport;
