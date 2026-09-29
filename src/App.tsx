import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';

import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import EventCreate from './pages/EventCreate';
import EventDetail from './pages/EventDetail';
import EventEdit from './pages/EventEdit';
import EventRequirements from './pages/EventRequirements';
import EventReadiness from './pages/EventReadiness';
import Resources from './pages/Resources';
import Reservations from './pages/Reservations';
import Conflicts from './pages/Conflicts';
import Organizations from './pages/Organizations';
import Venues from './pages/Venues';
import Analytics from './pages/Analytics';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/create" element={<EventCreate />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/events/:id/edit" element={<EventEdit />} />
        <Route path="/events/:id/requirements" element={<EventRequirements />} />
        <Route path="/events/:id/readiness" element={<EventReadiness />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/reservations" element={<Reservations />} />
        <Route path="/conflicts" element={<Conflicts />} />
        <Route path="/organizations" element={<Organizations />} />
        <Route path="/venues" element={<Venues />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
