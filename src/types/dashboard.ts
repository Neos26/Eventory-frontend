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
