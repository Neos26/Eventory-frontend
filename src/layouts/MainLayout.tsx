import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

// Main application shell: fixed sidebar on desktop, drawer on mobile.
export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>

        <footer className="mx-auto w-full max-w-7xl px-4 pb-6 text-xs text-slate-400 sm:px-6 lg:px-8">
          Eventory — Event Resource Management System
        </footer>
      </div>
    </div>
  );
}
