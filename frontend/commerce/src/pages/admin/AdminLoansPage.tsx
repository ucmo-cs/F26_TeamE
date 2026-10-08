import { useLanguage } from "../../i18n/useLanguage.ts";
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, Plus, Search } from 'lucide-react';
import { mockAdminLoansApi } from '../../api/mockAdminLoansApi.ts';
import type { LoanSummary } from '../../types/loan.ts';
import { Button } from '../../components/ui/Button.tsx';
import { Card } from '../../components/ui/Card.tsx';
import { EmptyState } from '../../components/ui/EmptyState.tsx';
import { TableSkeleton } from '../../components/ui/Skeleton.tsx';
import { TextInput } from '../../components/ui/TextInput.tsx';
import { PageHeader } from '../../components/layout/PageHeader.tsx';
import { formatCurrency, formatInterestRate, formatTableDate } from '../../utils/formatting.ts';

type SortField = 'customer' | 'loanDate' | 'remainingBalance' | 'originalAmount' | 'annualInterestRate';
type SortDirection = 'asc' | 'desc';

export const AdminLoansPage: React.FC = () => {
  const { t } = useLanguage();
  const [loans, setLoans] = useState<LoanSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('loanDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    mockAdminLoansApi
      .getActiveLoans()
      .then((data) => {
        if (isMounted) {
          setLoans(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load active loans:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      // Sensible defaults: dates and financial amounts default to desc, names to asc
      setSortDirection(field === 'customer' ? 'asc' : 'desc');
    }
  };

  const processedLoans = useMemo(() => {
    const filtered = loans.filter((loan) =>
      loan.customerName.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );

    return [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'customer':
          comparison = a.customerName.localeCompare(b.customerName);
          break;
        case 'loanDate':
          comparison = new Date(a.loanDate).getTime() - new Date(b.loanDate).getTime();
          break;
        case 'remainingBalance':
          comparison = a.remainingBalance - b.remainingBalance;
          break;
        case 'originalAmount':
          comparison = a.originalAmount - b.originalAmount;
          break;
        case 'annualInterestRate':
          comparison = a.annualInterestRate - b.annualInterestRate;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [loans, searchTerm, sortField, sortDirection]);

  const renderSortIndicator = (field: SortField) => {
    if (sortField === field) {
      return sortDirection === 'asc' ? (
        <ArrowUp className="h-3.5 w-3.5 text-[#12345B] inline-block shrink-0" />
      ) : (
        <ArrowDown className="h-3.5 w-3.5 text-[#12345B] inline-block shrink-0" />
      );
    }
    return (
      <ArrowUpDown className="h-3.5 w-3.5 text-[#BBC6D3] opacity-40 group-hover:opacity-100 inline-block shrink-0 transition-opacity" />
    );
  };

  return (
    <div>
      <PageHeader
        title={t("Active Loans")}
        description={t("Manage loans that have not been fully repaid.")}
        action={
          <Button
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => navigate('/admin/loans/new')}
          >
            {t("New Loan")}
          </Button>
        }
      />

      {/* Search Input: 320px width per spec Section 32 */}
      <div className="mb-4 w-[320px]">
        <TextInput
          placeholder={t("Search by customer name")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          prefixElement={<Search className="h-4 w-4 text-[#7B8794]" />}
          aria-label={t("Search by customer name")}
        />
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : processedLoans.length === 0 ? (
        <EmptyState
          message={t("No active loans were found.")}
          action={
            <Button
              variant="secondary"
              onClick={() => {
                if (searchTerm) {
                  setSearchTerm('');
                } else {
                  navigate('/admin/loans/new');
                }
              }}
            >
              {searchTerm ? t("Clear Search") : t("Create New Loan")}
            </Button>
          }
        />
      ) : (
        <Card className="p-0 overflow-hidden shadow-[0_1px_2px_rgba(16,24,40,0.04)] border-[#D7DEE7]">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-[#F8FAFC] border-b border-[#BBC6D3] text-xs font-semibold text-[#5E6B7A]">
              <tr>
                <th
                  onClick={() => handleSort('customer')}
                  className="py-3 px-4 font-semibold cursor-pointer select-none group hover:text-[#172033]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t("Customer")}</span>
                    {renderSortIndicator('customer')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('loanDate')}
                  className="py-3 px-4 font-semibold cursor-pointer select-none group hover:text-[#172033]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t("Loan Date")}</span>
                    {renderSortIndicator('loanDate')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('remainingBalance')}
                  className="py-3 px-4 text-right font-semibold cursor-pointer select-none group hover:text-[#172033]"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>{t("Amount Owed")}</span>
                    {renderSortIndicator('remainingBalance')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('originalAmount')}
                  className="py-3 px-4 text-right font-semibold cursor-pointer select-none group hover:text-[#172033]"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>{t("Original Amount")}</span>
                    {renderSortIndicator('originalAmount')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('annualInterestRate')}
                  className="py-3 px-4 text-right font-semibold cursor-pointer select-none group hover:text-[#172033]"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>{t("Interest Rate")}</span>
                    {renderSortIndicator('annualInterestRate')}
                  </div>
                </th>
                <th className="py-3 px-4 text-right font-semibold">{t("Action")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D7DEE7]">
              {processedLoans.map((loan) => (
                <tr
                  key={loan.id}
                  data-loan-id={loan.id}
                  onClick={() => navigate(`/admin/loans/${loan.id}`)}
                  className="hover:bg-[#EAF1F8]/50 cursor-pointer h-12 transition-colors duration-100"
                >
                  <td className="py-3 px-4 font-medium text-[#172033]">{loan.customerName}</td>
                  <td className="py-3 px-4 text-[#5E6B7A]">{formatTableDate(loan.loanDate)}</td>
                  <td className="py-3 px-4 text-right font-medium text-[#172033] tabular-nums">
                    {formatCurrency(loan.remainingBalance)}
                  </td>
                  <td className="py-3 px-4 text-right text-[#5E6B7A] tabular-nums">
                    {formatCurrency(loan.originalAmount)}
                  </td>
                  <td className="py-3 px-4 text-right text-[#5E6B7A] tabular-nums">
                    {formatInterestRate(loan.annualInterestRate)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="tertiary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/loans/${loan.id}`);
                      }}
                      className="text-[#12345B] hover:text-[#0D2948] font-medium px-2.5 h-8"
                    >
                      {t("View")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};
