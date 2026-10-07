import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth.ts';
import type { UserRole } from '../types/auth.ts';

interface RequireAuthProps {
  role: UserRole;
  children: React.ReactNode;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ role, children }) => {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F5F7FA]">
        <div className="text-sm text-[#5E6B7A] font-medium animate-pulse">
          Loading authentication...
        </div>
      </div>
    );
  }

  // Not logged in
  if (!currentUser) {
    const redirectPath = role === 'ADMIN' ? '/admin/login' : '/customer/login';
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // Logged in with different role
  if (currentUser.role !== role) {
    const fallbackPath = currentUser.role === 'ADMIN' ? '/admin/loans' : '/customer/loan';
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

interface GuestOnlyProps {
  children: React.ReactNode;
}

export const GuestOnly: React.FC<GuestOnlyProps> = ({ children }) => {
  const { currentUser } = useAuth();

  if (currentUser) {
    if (currentUser.role === 'ADMIN') {
      return <Navigate to="/admin/loans" replace />;
    } else {
      return <Navigate to="/customer/loan" replace />;
    }
  }

  return <>{children}</>;
};

export const AdminRootRedirect: React.FC = () => {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) return null;

  if (currentUser?.role === 'ADMIN') {
    return <Navigate to="/admin/loans" replace />;
  }
  if (currentUser?.role === 'CUSTOMER') {
    return <Navigate to="/customer/loan" replace />;
  }
  return <Navigate to="/admin/login" replace />;
};

export const CustomerRootRedirect: React.FC = () => {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) return null;

  if (currentUser?.role === 'CUSTOMER') {
    return <Navigate to="/customer/loan" replace />;
  }
  if (currentUser?.role === 'ADMIN') {
    return <Navigate to="/admin/loans" replace />;
  }
  return <Navigate to="/customer/login" replace />;
};
