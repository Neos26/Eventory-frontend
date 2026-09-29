// Mock data used by the Day 1 page layouts. No backend calls yet.

export interface DashboardStat {
  label: string;
  value: number;
  hint: string;
  tone?: 'red';
}

export interface EventSummary {
  id: string;
  name: string;
  date: string;
  venue: string;
  status: 'draft' | 'planned' | 'ongoing' | 'completed';
}

export interface Resource {
  id: string;
  name: string;
  category: string;
  total: number;
  available: number;
}

export interface Organization {
  id: string;
  name: string;
  description: string;
  email: string;
  phone: string;
}

export interface Venue {
  id: string;
  name: string;
  location: string;
  capacity: number;
  status: 'active' | 'maintenance' | 'inactive';
}

export const dashboardStats: DashboardStat[] = [
  { label: 'Total Events', value: 24, hint: 'All time' },
  { label: 'Upcoming Events', value: 6, hint: 'Next 30 days' },
  { label: 'Total Resources', value: 148, hint: 'Across 5 categories' },
  { label: 'Active Reservations', value: 19, hint: 'This week' },
  { label: 'Conflicts', value: 3, hint: 'Needs attention', tone: 'red' },
];

export const upcomingEvents: EventSummary[] = [
  {
    id: 'evt-1',
    name: "Students' Night",
    date: '2026-10-12',
    venue: 'Grand Hall',
    status: 'planned',
  },
  {
    id: 'evt-2',
    name: 'Faculty Symposium',
    date: '2026-10-18',
    venue: 'Conference Room A',
    status: 'planned',
  },
  {
    id: 'evt-3',
    name: 'Music Fest',
    date: '2026-10-25',
    venue: 'Open Grounds',
    status: 'draft',
  },
  {
    id: 'evt-4',
    name: 'Alumni Homecoming',
    date: '2026-11-02',
    venue: 'Grand Hall',
    status: 'draft',
  },
];

export const resources: Resource[] = [
  { id: 'res-1', name: 'Folding Chair', category: 'Furniture', total: 250, available: 180 },
  { id: 'res-2', name: 'Round Table', category: 'Furniture', total: 60, available: 42 },
  { id: 'res-3', name: 'LED Projector', category: 'Audio Visual', total: 12, available: 5 },
  { id: 'res-4', name: 'Wireless Microphone', category: 'Audio Visual', total: 20, available: 0 },
  { id: 'res-5', name: 'PA Speaker Set', category: 'Audio Visual', total: 8, available: 6 },
  { id: 'res-6', name: 'Banner Stand', category: 'Decoration', total: 30, available: 24 },
  { id: 'res-7', name: 'Catering Tray', category: 'Catering', total: 45, available: 30 },
  { id: 'res-8', name: 'Laptop Unit', category: 'IT', total: 15, available: 9 },
];

export const organizations: Organization[] = [
  {
    id: 'org-1',
    name: 'Student Affairs Office',
    description: 'Organizes campus-wide student events and activities.',
    email: 'sao@example.edu',
    phone: '+63 917 123 4567',
  },
  {
    id: 'org-2',
    name: 'Engineering Society',
    description: 'Student organization for engineering workshops and seminars.',
    email: 'engsoc@example.edu',
    phone: '+63 918 234 5678',
  },
  {
    id: 'org-3',
    name: 'Events Plus Co.',
    description: 'External events services partner for large productions.',
    email: 'hello@eventsplus.example',
    phone: '+63 919 345 6789',
  },
  {
    id: 'org-4',
    name: 'Cultural Affairs Club',
    description: 'Plans cultural shows, festivals and exhibitions.',
    email: 'cultural@example.edu',
    phone: '+63 920 456 7890',
  },
];

export const venues: Venue[] = [
  { id: 'ven-1', name: 'Grand Hall', location: 'Bldg. 1, Main Campus', capacity: 800, status: 'active' },
  { id: 'ven-2', name: 'Conference Room A', location: 'Bldg. 3, 2nd Floor', capacity: 120, status: 'active' },
  { id: 'ven-3', name: 'Open Grounds', location: 'East Field', capacity: 2000, status: 'active' },
  { id: 'ven-4', name: 'Audio Visual Room', location: 'Bldg. 2, 4th Floor', capacity: 60, status: 'maintenance' },
  { id: 'ven-5', name: 'Function Hall', location: 'Student Center', capacity: 300, status: 'inactive' },
];

export const resourceCategories = [
  'Furniture',
  'Audio Visual',
  'Decoration',
  'Catering',
  'IT',
];
