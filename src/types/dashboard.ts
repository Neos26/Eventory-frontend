// Booker dashboard types (GET /api/dashboard/booker).

import type { EventStatus } from './event';
import type { BookingStatus } from './booking';

export interface DashboardUpcomingEvent {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: EventStatus;
  venue: string | null;
}

export type ActivityType = 'booking' | 'event';

export interface DashboardActivity {
  type: ActivityType;
  id: string;
  label: string;
  status: EventStatus | BookingStatus;
  date: string;
}

export interface BookerDashboard {
  upcomingEvents: DashboardUpcomingEvent[];
  pendingBookings: number;
  approvedBookings: number;
  rejectedBookings: number;
  recentActivity: DashboardActivity[];
}

// GET /api/dashboard/management - system-wide counts, conflicts and
// resource utilization for the management overview.
export interface ManagementDashboardResource {
  _id: string;
  name: string;
  utilization: number; // percent 0-100
}

export interface ManagementDashboard {
  totalEvents: number;
  pendingRequests: number;
  approvedEvents: number;
  upcomingEvents: number;
  totalResources: number;
  totalVenues: number;
  activeConflicts: number;
  resourceUtilization: {
    average: number;
    resources: ManagementDashboardResource[];
  };
}
