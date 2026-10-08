import { useLanguage } from "../../i18n/useLanguage.ts";
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth.ts';
import { mockCustomerApi } from '../../api/mockCustomerApi.ts';
import type { Loan } from '../../types/loan.ts';
import { formatFrequencyLabel, formatScheduleDay } from '../../utils/paymentSchedule.ts';
import { Card } from '../../components/ui/Card.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { CardSkeleton } from '../../components/ui/Skeleton.tsx';
import { PageHeader } from '../../components/layout/PageHeader.tsx';
import {
  formatCurrency,
  formatInterestRate,
  formatTableDate,
  formatProminentDate,
} from '../../utils/formatting.ts';
import {
  calculateMonthlyMinimum,
  calculateEstimatedPayoffDate,
} from '../../utils/loanCalculations.ts';
import { Alert } from '../../components/ui/Alert.tsx';
import { ArrowRight, Calendar, CheckCircle2 } from 'lucide-react';

export const CustomerLoanPage: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      mockCustomerApi
        .getCustomerLoan({
          loanId: currentUser.loanId,
          customerId: currentUser.id,
          email: currentUser.usernameOrEmail,
        })
        .then((data) => {
          setLoan(data);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setErrorMessage('Unable to load loan information.');
          setIsLoading(false);
        });
    }
  }, [currentUser]);

  const monthlyMinimum = loan
    ? calculateMonthlyMinimum(loan.remainingBalance, loan.annualInterestRate)
    : 0;

  const payoffEstimate =
    loan && loan.paymentSchedule
      ? calculateEstimatedPayoffDate(
          loan.remainingBalance,
          loan.annualInterestRate,
          loan.paymentSchedule.paymentAmount,
          loan.paymentSchedule.frequency
        )
      : null;

  return (
    <div>
      <PageHeader
        title={t("My Loan")}
        description={t("View details and repayment status for your active loan.")}
      />

      {errorMessage && (
        <Alert variant="error" className="mb-6">
          {errorMessage}
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-6">
          <CardSkeleton lines={2} />
          <CardSkeleton lines={4} />
          <CardSkeleton lines={3} />
        </div>
      ) : loan ? (
        <div className="space-y-6">
          {/* SECTION 1: Remaining Balance — visually emphasized per style spec Section 40 */}
          <Card className="border-[#BBC6D3]">
            <div className="text-xs font-semibold text-[#5E6B7A] uppercase tracking-wider mb-1">
              {t("Remaining Balance")}
            </div>
            <div className="text-[32px] leading-[38px] font-semibold text-[#172033] tabular-nums">
              {formatCurrency(loan.remainingBalance)}
            </div>
            <div className="text-xs text-[#5E6B7A] mt-2 flex items-center gap-1.5">
              <span>{t("Minimum monthly payment:")}</span>
              <span className="font-semibold text-[#172033] tabular-nums">
                {formatCurrency(monthlyMinimum)}
              </span>
            </div>
          </Card>

          {/* SECTION 2: Loan Details per Content Spec Section 18 / Page C2 */}
          <Card>
            <div className="pb-3 border-b border-[#D7DEE7]/60 mb-5">
              <h3 className="text-base font-semibold text-[#172033]">{t("Loan Details")}</h3>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div>
                <span className="text-xs font-semibold text-[#5E6B7A] block mb-1">{t("Loan Date")}</span>
                <span className="text-base font-medium text-[#172033]">
                  {formatTableDate(loan.loanDate)}
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold text-[#5E6B7A] block mb-1">
                  {t("Original Loan Amount")}
                </span>
                <span className="text-base font-semibold text-[#172033] tabular-nums">
                  {formatCurrency(loan.originalAmount)}
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold text-[#5E6B7A] block mb-1">
                  {t("Annual Interest Rate")}
                </span>
                <span className="text-base font-semibold text-[#172033] tabular-nums">
                  {formatInterestRate(loan.annualInterestRate)}
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold text-[#5E6B7A] block mb-1">
                  {t("Minimum Monthly Payment")}
                </span>
                <span className="text-base font-semibold text-[#172033] tabular-nums">
                  {formatCurrency(monthlyMinimum)}
                </span>
              </div>

              {/* Payoff Date Display: conditional on whether automatic payment schedule exists */}
              <div className="col-span-2">
                <span className="text-xs font-semibold text-[#5E6B7A] block mb-1">
                  {t("Estimated Payoff Date")}
                </span>
                {loan.paymentSchedule ? (
                  <span className="text-base font-semibold text-[#172033]">
                    {payoffEstimate ? payoffEstimate.payoffDateFormatted : t("N/A")}
                  </span>
                ) : (
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-sm text-[#5E6B7A]">
                      {t("Set up automatic payments to calculate your payoff date.")}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate('/customer/payments')}
                      className="text-xs h-7 px-2.5 shrink-0 whitespace-nowrap"
                    >
                      {t("Set Up Payments")}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* SECTION 3: Automatic Payment Summary */}
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-[#D7DEE7]/60 mb-5">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-[#172033]">
                  {t("Automatic Payment Summary")}
                </h3>
                {loan.paymentSchedule && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#197A55] bg-[#E9F6F0] px-2 py-0.5 rounded-[4px]">
                    <CheckCircle2 className="h-3 w-3" /> {t("Active")}
                  </span>
                )}
              </div>
              {loan.paymentSchedule && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate('/customer/payments')}
                  className="text-xs"
                >
                  {t("Manage Payments")}
                </Button>
              )}
            </div>

            {loan.paymentSchedule ? (
              <div className="grid grid-cols-4 gap-6">
                <div>
                  <span className="text-xs font-semibold text-[#5E6B7A] block mb-1">
                    {t("Payment Amount")}
                  </span>
                  <span className="text-base font-semibold text-[#172033] tabular-nums">
                    {formatCurrency(loan.paymentSchedule.paymentAmount)}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-semibold text-[#5E6B7A] block mb-1">{t("Frequency")}</span>
                  <span className="text-base font-medium text-[#172033]">
                    {formatFrequencyLabel(loan.paymentSchedule.frequency)}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-semibold text-[#5E6B7A] block mb-1">{t("Schedule")}</span>
                  <span className="text-base font-medium text-[#172033]">
                    {formatScheduleDay(loan.paymentSchedule)}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-semibold text-[#5E6B7A] block mb-1">
                    {t("Next Payment Date")}
                  </span>
                  <span className="text-base font-medium text-[#172033]">
                    {loan.paymentSchedule.nextPaymentDate
                      ? formatProminentDate(loan.paymentSchedule.nextPaymentDate)
                      : t("N/A")}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-[#F8FAFC] border border-[#D7DEE7] rounded-[6px] flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-[#EAF1F8] rounded-[6px] text-[#12345B]">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#172033]">
                      {t("No automatic payments scheduled")}
                    </h4>
                    <p className="text-xs text-[#5E6B7A] mt-0.5">
                      {t("Set up automatic payments from your bank account to automate repayments and see your projected payoff date.")}
                    </p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/customer/payments')}
                  className="shrink-0 text-xs"
                >
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                    {t("Set Up Payments")}
                    <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                  </span>
                </Button>
              </div>
            )}
          </Card>
        </div>
      ) : (
        <Card>
          <p className="text-sm text-[#5E6B7A]">{t("No active loan record found for your account.")}</p>
        </Card>
      )}
    </div>
  );
};
export default CustomerLoanPage;
