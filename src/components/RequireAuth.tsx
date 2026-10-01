import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { homeForRole, useAuth } from '../context/AuthContext';
import LoadingState from './LoadingState';

interface RequireAuthProps {
  children: ReactNode;
  /** When set, only this role may enter; others bounce to their home. */
  role?: 'booker' | 'management';
}

// Frontend route guard. The backend remains the real security layer.
export default function RequireAuth({ children, role }: RequireAuthProps) {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center">
        <LoadingState message="Checking your session..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role && user.role !== role) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }

  return <>{children}</>;
}
