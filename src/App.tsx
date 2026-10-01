import { Routes, Route, Navigate } from 'react-router-dom';
import ManagementLayout from './layouts/ManagementLayout';
import BookerLayout from './layouts/BookerLayout';
import RequireAuth from './components/RequireAuth';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import EventCreate from './pages/EventCreate';
import EventDetail from './pages/EventDetail';
import EventEdit from './pages/EventEdit';
import EventRequirements from './pages/EventRequirements';
import EventReadiness from './pages/EventReadiness';
import EventConflicts from './pages/EventConflicts';
import Resources from './pages/Resources';
import ResourceDetail from './pages/ResourceDetail';
import Reservations from './pages/Reservations';
import Conflicts from './pages/Conflicts';
import Organizations from './pages/Organizations';
import Venues from './pages/Venues';
import Analytics from './pages/Analytics';
import Bookings from './pages/Bookings';
import BookingReview from './pages/BookingReview';
import NotFound from './pages/NotFound';

import BookerDashboard from './pages/booker/BookerDashboard';
import BookerEvents from './pages/booker/BookerEvents';
import BookerEventCreate from './pages/booker/BookerEventCreate';
import BookerEventDetail from './pages/booker/BookerEventDetail';
import BookerEventEdit from './pages/booker/BookerEventEdit';
import BookerEventRequirements from './pages/booker/BookerEventRequirements';
import BookerBookings from './pages/booker/BookerBookings';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Booker area - booker role only */}
      <Route
        element={
          <RequireAuth role="booker">
            <BookerLayout />
          </RequireAuth>
        }
      >
        <Route path="/booker/dashboard" element={<BookerDashboard />} />
        <Route path="/booker/events" element={<BookerEvents />} />
        <Route path="/booker/events/create" element={<BookerEventCreate />} />
        <Route path="/booker/events/:id" element={<BookerEventDetail />} />
        <Route path="/booker/events/:id/edit" element={<BookerEventEdit />} />
        <Route path="/booker/events/:id/requirements" element={<BookerEventRequirements />} />
        <Route path="/booker/bookings" element={<BookerBookings />} />
      </Route>

      {/* Legacy short paths → management area */}
      <Route path="/dashboard" element={<Navigate to="/management/dashboard" replace />} />
      <Route path="/events" element={<Navigate to="/management/events" replace />} />
      <Route path="/resources" element={<Navigate to="/management/resources" replace />} />
      <Route path="/reservations" element={<Navigate to="/management/reservations" replace />} />
      <Route path="/conflicts" element={<Navigate to="/management/conflicts" replace />} />
      <Route path="/organizations" element={<Navigate to="/management/organizations" replace />} />
      <Route path="/venues" element={<Navigate to="/management/venues" replace />} />
      <Route path="/analytics" element={<Navigate to="/management/analytics" replace />} />

      {/* Management area - management role only (bookers are bounced out) */}
      <Route
        element={
          <RequireAuth role="management">
            <ManagementLayout />
          </RequireAuth>
        }
      >
        <Route path="/management/dashboard" element={<Dashboard />} />
        <Route path="/management/bookings" element={<Bookings />} />
        <Route path="/management/bookings/:id" element={<BookingReview />} />
        <Route path="/management/events" element={<Events />} />
        <Route path="/management/events/create" element={<EventCreate />} />
        <Route path="/management/events/:id" element={<EventDetail />} />
        <Route path="/management/events/:id/edit" element={<EventEdit />} />
        <Route path="/management/events/:id/requirements" element={<EventRequirements />} />
        <Route path="/management/events/:id/readiness" element={<EventReadiness />} />
        <Route path="/management/events/:id/conflicts" element={<EventConflicts />} />
        <Route path="/management/resources" element={<Resources />} />
        <Route path="/management/resources/:id" element={<ResourceDetail />} />
        <Route path="/management/reservations" element={<Reservations />} />
        <Route path="/management/conflicts" element={<Conflicts />} />
        <Route path="/management/organizations" element={<Organizations />} />
        <Route path="/management/venues" element={<Venues />} />
        <Route path="/management/analytics" element={<Analytics />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
