import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout.tsx';
import { AdminLoanDetailsPage } from '../pages/admin/AdminLoanDetailsPage.tsx';
import { AdminLoansPage } from '../pages/admin/AdminLoansPage.tsx';
import { AdminLoginPage } from '../pages/admin/AdminLoginPage.tsx';
import { CreateLoanPage } from '../pages/admin/CreateLoanPage.tsx';
import { CustomerLoanPage } from '../pages/customer/CustomerLoanPage.tsx';
import { CustomerLoginPage } from '../pages/customer/CustomerLoginPage.tsx';
import { CustomerPaymentsPage } from '../pages/customer/CustomerPaymentsPage.tsx';
import { CustomerProfilePage } from '../pages/customer/CustomerProfilePage.tsx';
import {
  AdminRootRedirect,
  CustomerRootRedirect,
  GuestOnly,
  RequireAuth,
} from './RouteGuards.tsx';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default roots */}
        <Route path="/" element={<Navigate to="/customer/login" replace />} />
        <Route path="/admin" element={<AdminRootRedirect />} />
        <Route path="/customer" element={<CustomerRootRedirect />} />

        {/* Public Login Routes */}
        <Route
          path="/admin/login"
          element={
            <GuestOnly>
              <AdminLoginPage />
            </GuestOnly>
          }
        />
        <Route
          path="/customer/login"
          element={
            <GuestOnly>
              <CustomerLoginPage />
            </GuestOnly>
          }
        />

        {/* Admin Authenticated Routes */}
        <Route
          path="/admin"
          element={
            <RequireAuth role="ADMIN">
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path="loans" element={<AdminLoansPage />} />
          <Route path="loans/new" element={<CreateLoanPage />} />
          <Route path="loans/:loanId" element={<AdminLoanDetailsPage />} />
        </Route>

        {/* Customer Authenticated Routes */}
        <Route
          path="/customer"
          element={
            <RequireAuth role="CUSTOMER">
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path="loan" element={<CustomerLoanPage />} />
          <Route path="profile" element={<CustomerProfilePage />} />
          <Route path="payments" element={<CustomerPaymentsPage />} />
        </Route>

        {/* Wildcard Fallback */}
        <Route path="*" element={<Navigate to="/customer/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
