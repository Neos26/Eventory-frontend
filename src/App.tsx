import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
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

      {/* Management area - management role only (bookers are bounced out) */}
      <Route path="/management/dashboard" element={<Navigate to="/dashboard" replace />} />
      <Route
        element={
          <RequireAuth role="management">
            <MainLayout />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/create" element={<EventCreate />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/events/:id/edit" element={<EventEdit />} />
        <Route path="/events/:id/requirements" element={<EventRequirements />} />
        <Route path="/events/:id/readiness" element={<EventReadiness />} />
        <Route path="/events/:id/conflicts" element={<EventConflicts />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/resources/:id" element={<ResourceDetail />} />
        <Route path="/reservations" element={<Reservations />} />
        <Route path="/conflicts" element={<Conflicts />} />
        <Route path="/organizations" element={<Organizations />} />
        <Route path="/venues" element={<Venues />} />
        <Route path="/analytics" element={<Analytics />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
