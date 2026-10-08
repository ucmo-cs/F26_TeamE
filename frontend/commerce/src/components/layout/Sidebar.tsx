import { useLanguage } from "../../i18n/useLanguage.ts";
import React from 'react';
import { NavLink } from 'react-router-dom';
import { CreditCard, FilePlus2, User, CalendarDays, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/useAuth.ts';
import { resetPrototypeState } from '../../utils/prototypeStorage.ts';
import { cn } from '../../utils/formatting.ts';

export const Sidebar: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN';

  const adminNav = [
    { name: 'Loans', path: '/admin/loans', icon: CreditCard },
    { name: 'New Loan', path: '/admin/loans/new', icon: FilePlus2 },
  ];

  const customerNav = [
    { name: 'My Loan', path: '/customer/loan', icon: CreditCard },
    { name: 'Profile', path: '/customer/profile', icon: User },
    { name: 'Payments', path: '/customer/payments', icon: CalendarDays },
  ];

  const navItems = isAdmin ? adminNav : customerNav;

  const handleResetDemoData = () => {
    if (window.confirm(t('Reset prototype to original demo data and log out?'))) {
      resetPrototypeState();
      window.location.href = isAdmin ? '/admin/login' : '/customer/login';
    }
  };

  return (
    <aside className="w-[240px] shrink-0 bg-[#0D2742] text-white flex flex-col justify-between select-none min-h-[calc(100vh-64px)]">
      <nav className="p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin/loans'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3.5 h-11 rounded-[6px] text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-[#173B61] text-white font-semibold'
                    : 'text-[#D7DEE7] hover:bg-[#133355] hover:text-white'
                )
              }
            >
              <Icon className="h-4.5 w-4.5 shrink-0 opacity-80" />
              <span>{t(item.name)}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Development Prototype Reset Tool */}
      {import.meta.env.DEV && (
        <div className="p-3 border-t border-[#173B61]/60">
          <button
            type="button"
            onClick={handleResetDemoData}
            title={t("Restore prototype data to default seed state")}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs text-[#BBC6D3] hover:text-white bg-[#173B61]/40 hover:bg-[#173B61] rounded-[6px] transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 shrink-0" />
            <span>{t("Reset Demo Data")}</span>
          </button>
        </div>
      )}
    </aside>
  );
};
