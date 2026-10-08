import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { homePath, useAuth } from './auth'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import AdminLoansPage from './pages/AdminLoansPage'
import AdminLoanDetailPage from './pages/AdminLoanDetailPage'
import AdminCreateLoanPage from './pages/AdminCreateLoanPage'
import CustomerLoanPage from './pages/CustomerLoanPage'
import CustomerSchedulePage from './pages/CustomerSchedulePage'
import './App.css'

function Protected({ role, children }: { role: 'ADMIN' | 'USER'; children: ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  const isAdmin = user.role === 'ADMIN'
  if (role === 'ADMIN' && !isAdmin) return <Navigate to={homePath(user.role)} replace />
  if (role === 'USER' && isAdmin) return <Navigate to={homePath(user.role)} replace />
  return children
}

export default function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/admin/loans" element={<Protected role="ADMIN"><AdminLoansPage /></Protected>} />
        <Route path="/admin/loans/new" element={<Protected role="ADMIN"><AdminCreateLoanPage /></Protected>} />
        <Route path="/admin/loans/:id" element={<Protected role="ADMIN"><AdminLoanDetailPage /></Protected>} />
        <Route path="/customer/loan" element={<Protected role="USER"><CustomerLoanPage /></Protected>} />
        <Route path="/customer/schedule" element={<Protected role="USER"><CustomerSchedulePage /></Protected>} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  )
}
