import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth.ts';
import { Button } from '../ui/Button.tsx';

export const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const role = currentUser?.role;
    await logout();
    if (role === 'ADMIN') {
      navigate('/admin/login');
    } else {
      navigate('/customer/login');
    }
  };

  const roleLabel = currentUser?.role === 'ADMIN' ? 'Administrator' : 'Customer Account';

  return (
    <header className="h-16 w-full bg-white border-b border-[#D7DEE7] px-6 flex items-center justify-between z-10 shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-base font-semibold text-[#172033] tracking-tight">
          Loan Repayment Tracker
        </span>
      </div>

      {currentUser && (
        <div className="flex items-center gap-5">
          <div className="text-right leading-tight">
            <div className="text-sm font-semibold text-[#172033]">{currentUser.name}</div>
            <div className="text-xs text-[#5E6B7A] font-normal">{roleLabel}</div>
          </div>
          <div className="h-6 w-px bg-[#D7DEE7]" />
          <Button
            variant="tertiary"
            size="sm"
            onClick={handleLogout}
            className="text-xs text-[#5E6B7A] hover:text-[#12345B] px-2 h-8"
          >
            Log Out
          </Button>
        </div>
      )}
    </header>
  );
};
