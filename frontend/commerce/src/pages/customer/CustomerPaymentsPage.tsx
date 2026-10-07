import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth.ts';
import { mockCustomerApi } from '../../api/mockCustomerApi.ts';
import { mockPaymentApi } from '../../api/mockPaymentApi.ts';
import type { DayOfWeek, Loan, PaymentFrequency, PaymentSchedule } from '../../types/loan.ts';
import { Card } from '../../components/ui/Card.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { FormField } from '../../components/ui/FormField.tsx';
import { CurrencyInput } from '../../components/ui/CurrencyInput.tsx';
import { Select } from '../../components/ui/Select.tsx';
import { Alert } from '../../components/ui/Alert.tsx';
import { CardSkeleton } from '../../components/ui/Skeleton.tsx';
import { PageHeader } from '../../components/layout/PageHeader.tsx';
import {
  formatCurrency,
  formatMonthYear,
  formatProminentDate,
  cn,
} from '../../utils/formatting.ts';
import {
  calculateScheduledMinimum,
  calculateEstimatedPayoffDate,
} from '../../utils/loanCalculations.ts';
import { Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

const DAYS_OF_WEEK: { label: string; value: DayOfWeek }[] = [
  { label: 'Monday', value: 'MONDAY' },
  { label: 'Tuesday', value: 'TUESDAY' },
  { label: 'Wednesday', value: 'WEDNESDAY' },
  { label: 'Thursday', value: 'THURSDAY' },
  { label: 'Friday', value: 'FRIDAY' },
  { label: 'Saturday', value: 'SATURDAY' },
  { label: 'Sunday', value: 'SUNDAY' },
];

const DAYS_OF_MONTH = Array.from({ length: 28 }, (_, i) => i + 1);

function computeNextPaymentDate(
  frequency: PaymentFrequency,
  dayOfMonth?: number,
  dayOfWeek?: DayOfWeek,
  fromDate = new Date()
): string {
  const target = new Date(fromDate);
  if (frequency === 'MONTHLY') {
    const day = Math.min(28, Math.max(1, dayOfMonth || 15));
    if (target.getDate() >= day) {
      target.setMonth(target.getMonth() + 1);
    }
    target.setDate(day);
  } else {
    const weekdayMap: Record<DayOfWeek, number> = {
      SUNDAY: 0,
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6,
    };
    const targetDay = weekdayMap[dayOfWeek || 'FRIDAY'] ?? 5;
    let diff = targetDay - target.getDay();
    if (diff <= 0) diff += 7;
    target.setDate(target.getDate() + diff);
  }
  return target.toISOString().split('T')[0];
}

export const CustomerPaymentsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [loan, setLoan] = useState<Loan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [frequency, setFrequency] = useState<PaymentFrequency>('MONTHLY');
  const [dayOfMonth, setDayOfMonth] = useState<number>(15);
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('FRIDAY');
  const [paymentAmount, setPaymentAmount] = useState<string>('');

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
          if (data) {
            if (data.paymentSchedule) {
              setFrequency(data.paymentSchedule.frequency);
              setPaymentAmount(data.paymentSchedule.paymentAmount.toFixed(2));
              if (data.paymentSchedule.dayOfMonth) {
                setDayOfMonth(data.paymentSchedule.dayOfMonth);
              }
              if (data.paymentSchedule.dayOfWeek) {
                setDayOfWeek(data.paymentSchedule.dayOfWeek);
              }
            } else {
              // Default to monthly minimum
              const min = calculateScheduledMinimum(
                data.remainingBalance,
                data.annualInterestRate,
                'MONTHLY'
              );
              setFrequency('MONTHLY');
              setPaymentAmount(min.toFixed(2));
              setDayOfMonth(15);
              setDayOfWeek('FRIDAY');
            }
          }
          setIsLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setErrorMessage('Unable to load loan details.');
          setIsLoading(false);
        });
    }
  }, [currentUser]);

  // Derived Calculations
  const scheduledMinimum = loan
    ? calculateScheduledMinimum(loan.remainingBalance, loan.annualInterestRate, frequency)
    : 0;

  const currentScheduleMin =
    loan && loan.paymentSchedule
      ? calculateScheduledMinimum(
          loan.remainingBalance,
          loan.annualInterestRate,
          loan.paymentSchedule.frequency
        )
      : 0;

  const currentSchedulePayoff =
    loan && loan.paymentSchedule
      ? calculateEstimatedPayoffDate(
          loan.remainingBalance,
          loan.annualInterestRate,
          loan.paymentSchedule.paymentAmount,
          loan.paymentSchedule.frequency
        )
      : null;

  const paymentAmountNum = parseFloat(paymentAmount) || 0;
  const isAmountBelowMin = paymentAmount.trim() !== '' && paymentAmountNum < scheduledMinimum;
  const isAmountValid = paymentAmount.trim() !== '' && !isNaN(paymentAmountNum) && paymentAmountNum >= scheduledMinimum;

  const projectedPayoff =
    loan && isAmountValid
      ? calculateEstimatedPayoffDate(
          loan.remainingBalance,
          loan.annualInterestRate,
          paymentAmountNum,
          frequency
        )
      : null;

  const handleFrequencyChange = (newFreq: PaymentFrequency) => {
    setFrequency(newFreq);
    setSaveSuccess(null);
    if (loan) {
      const newMin = calculateScheduledMinimum(
        loan.remainingBalance,
        loan.annualInterestRate,
        newFreq
      );
      setPaymentAmount(newMin.toFixed(2));
    }
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loan) return;
    setErrorMessage(null);
    setSaveSuccess(null);

    // Validation per Spec
    if (!loan.bankAccount) {
      setErrorMessage('Add a bank account before scheduling automatic payments.');
      return;
    }

    if (!isAmountValid) {
      setErrorMessage(`Payment must be at least ${formatCurrency(scheduledMinimum)}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const nextDate = computeNextPaymentDate(
        frequency,
        frequency === 'MONTHLY' ? dayOfMonth : undefined,
        frequency !== 'MONTHLY' ? dayOfWeek : undefined
      );

      const newSchedule: PaymentSchedule = {
        frequency,
        paymentAmount: Math.round(paymentAmountNum * 100) / 100,
        dayOfMonth: frequency === 'MONTHLY' ? dayOfMonth : undefined,
        dayOfWeek: frequency !== 'MONTHLY' ? dayOfWeek : undefined,
        nextPaymentDate: nextDate,
      };

      const saved = await mockPaymentApi.savePaymentSchedule(loan.id, newSchedule);

      setLoan({
        ...loan,
        paymentSchedule: saved,
      });

      setSaveSuccess('Payment schedule saved.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to save payment schedule.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatScheduleDayText = (schedule: PaymentSchedule) => {
    if (schedule.frequency === 'MONTHLY') {
      const d = schedule.dayOfMonth || 15;
      const suffix =
        d === 1 || d === 21 ? 'st' : d === 2 || d === 22 ? 'nd' : d === 3 || d === 23 ? 'rd' : 'th';
      return `${d}${suffix} of each month`;
    }
    const day = schedule.dayOfWeek || 'FRIDAY';
    const dayName = day.charAt(0) + day.slice(1).toLowerCase();
    return schedule.frequency === 'BIWEEKLY' ? `Every other ${dayName}` : `Every ${dayName}`;
  };

  const formatFrequencyLabel = (freq: PaymentFrequency) => {
    switch (freq) {
      case 'MONTHLY':
        return 'Monthly';
      case 'BIWEEKLY':
        return 'Bi-weekly';
      case 'WEEKLY':
        return 'Weekly';
    }
  };

  return (
    <div>
      <PageHeader
        title="Automatic Payments"
        description="Choose how often you want to make automatic loan payments."
      />

      {/* Bank Account Requirement Warning */}
      {loan && !loan.bankAccount && (
        <Alert variant="warning" className="mb-6">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-[#A45B08] shrink-0 mt-0.5" />
              <div>
                <h5 className="font-semibold text-inherit text-sm">Bank account required</h5>
                <p className="text-xs text-inherit mt-0.5">
                  Add a bank account before scheduling automatic payments.
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/customer/profile')}
              className="shrink-0 text-xs"
            >
              Go to Profile
            </Button>
          </div>
        </Alert>
      )}

      {saveSuccess && (
        <Alert variant="success" className="mb-6">
          {saveSuccess}
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="error" className="mb-6">
          {errorMessage}
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-6">
          <CardSkeleton lines={3} />
          <CardSkeleton lines={4} />
          <CardSkeleton lines={2} />
        </div>
      ) : loan ? (
        <div className="space-y-6 max-w-4xl">
          {/* SECTION 1: Current Schedule (Only if existing) */}
          {loan.paymentSchedule && (
            <Card>
              <div className="flex items-center justify-between pb-3 border-b border-[#D7DEE7]/60 mb-5">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-[#172033]">Current Schedule</h3>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#197A55] bg-[#E9F6F0] px-2 py-0.5 rounded-[4px]">
                    <CheckCircle2 className="h-3 w-3" /> Active
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <span className="text-xs font-semibold text-[#5E6B7A] block mb-1">
                    Payment Amount
                  </span>
                  <span className="text-base font-semibold text-[#172033] tabular-nums" id="current-payment-amount">
                    {formatCurrency(loan.paymentSchedule.paymentAmount)}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-semibold text-[#5E6B7A] block mb-1">Frequency</span>
                  <span className="text-base font-medium text-[#172033]" id="current-frequency">
                    {formatFrequencyLabel(loan.paymentSchedule.frequency)}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-semibold text-[#5E6B7A] block mb-1">Schedule</span>
                  <span className="text-base font-medium text-[#172033]" id="current-schedule">
                    {formatScheduleDayText(loan.paymentSchedule)}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-semibold text-[#5E6B7A] block mb-1">
                    Minimum Required Payment
                  </span>
                  <span className="text-base font-semibold text-[#172033] tabular-nums">
                    {formatCurrency(currentScheduleMin)}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-semibold text-[#5E6B7A] block mb-1">
                    Next Payment Date
                  </span>
                  <span className="text-base font-medium text-[#172033]" id="current-next-date">
                    {loan.paymentSchedule.nextPaymentDate
                      ? formatProminentDate(loan.paymentSchedule.nextPaymentDate)
                      : 'N/A'}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-semibold text-[#5E6B7A] block mb-1">
                    Estimated Payoff Date
                  </span>
                  <span className="text-base font-semibold text-[#172033]" id="current-payoff-date">
                    {currentSchedulePayoff
                      ? formatMonthYear(currentSchedulePayoff.estimatedPayoffDate)
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* SECTION 2: Payment Schedule Form */}
          <Card>
            <div className="pb-3 border-b border-[#D7DEE7]/60 mb-5">
              <h3 className="text-base font-semibold text-[#172033]">
                {loan.paymentSchedule ? 'Edit Payment Schedule' : 'Schedule Automatic Payments'}
              </h3>
            </div>

            <form onSubmit={handleSaveSchedule} noValidate className="space-y-6">
              {/* Step 1: Frequency Selection (Cards per Style Spec Section 43) */}
              <div>
                <label className="text-xs font-semibold text-[#5E6B7A] block mb-2">
                  Step 1 — Payment Frequency
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {/* Monthly Option */}
                  <div
                    onClick={() => handleFrequencyChange('MONTHLY')}
                    id="freq-monthly"
                    className={cn(
                      'p-4 rounded-[6px] border cursor-pointer transition-colors',
                      frequency === 'MONTHLY'
                        ? 'border-[#12345B] bg-[#EAF1F8] ring-1 ring-[#12345B]'
                        : 'border-[#D7DEE7] bg-white hover:border-[#BBC6D3]'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm text-[#172033]">Monthly</span>
                      <input
                        type="radio"
                        name="frequency"
                        checked={frequency === 'MONTHLY'}
                        onChange={() => handleFrequencyChange('MONTHLY')}
                        className="text-[#12345B] focus:ring-[#12345B]"
                      />
                    </div>
                    <span className="text-xs text-[#5E6B7A]">12 payments per year</span>
                  </div>

                  {/* Bi-weekly Option */}
                  <div
                    onClick={() => handleFrequencyChange('BIWEEKLY')}
                    id="freq-biweekly"
                    className={cn(
                      'p-4 rounded-[6px] border cursor-pointer transition-colors',
                      frequency === 'BIWEEKLY'
                        ? 'border-[#12345B] bg-[#EAF1F8] ring-1 ring-[#12345B]'
                        : 'border-[#D7DEE7] bg-white hover:border-[#BBC6D3]'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm text-[#172033]">Bi-weekly</span>
                      <input
                        type="radio"
                        name="frequency"
                        checked={frequency === 'BIWEEKLY'}
                        onChange={() => handleFrequencyChange('BIWEEKLY')}
                        className="text-[#12345B] focus:ring-[#12345B]"
                      />
                    </div>
                    <span className="text-xs text-[#5E6B7A]">26 payments per year</span>
                  </div>

                  {/* Weekly Option */}
                  <div
                    onClick={() => handleFrequencyChange('WEEKLY')}
                    id="freq-weekly"
                    className={cn(
                      'p-4 rounded-[6px] border cursor-pointer transition-colors',
                      frequency === 'WEEKLY'
                        ? 'border-[#12345B] bg-[#EAF1F8] ring-1 ring-[#12345B]'
                        : 'border-[#D7DEE7] bg-white hover:border-[#BBC6D3]'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm text-[#172033]">Weekly</span>
                      <input
                        type="radio"
                        name="frequency"
                        checked={frequency === 'WEEKLY'}
                        onChange={() => handleFrequencyChange('WEEKLY')}
                        className="text-[#12345B] focus:ring-[#12345B]"
                      />
                    </div>
                    <span className="text-xs text-[#5E6B7A]">52 payments per year</span>
                  </div>
                </div>
              </div>

              {/* Step 2: Schedule Day Control (Conditional based on Frequency) */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-semibold text-[#5E6B7A] block mb-1">
                    Step 2 — Schedule Day
                  </label>
                  {frequency === 'MONTHLY' ? (
                    <FormField id="schedule-day-of-month" hint="Allowed days: 1–28 of each month">
                      <Select
                        id="schedule-day-of-month"
                        value={dayOfMonth}
                        onChange={(e) => {
                          setDayOfMonth(parseInt(e.target.value, 10));
                          setSaveSuccess(null);
                        }}
                      >
                        {DAYS_OF_MONTH.map((d) => (
                          <option key={d} value={d}>
                            {d}
                            {d === 1 || d === 21
                              ? 'st'
                              : d === 2 || d === 22
                              ? 'nd'
                              : d === 3 || d === 23
                              ? 'rd'
                              : 'th'}{' '}
                            of each month
                          </option>
                        ))}
                      </Select>
                    </FormField>
                  ) : (
                    <FormField id="schedule-day-of-week" hint="Day of week for automatic deduction">
                      <Select
                        id="schedule-day-of-week"
                        value={dayOfWeek}
                        onChange={(e) => {
                          setDayOfWeek(e.target.value as DayOfWeek);
                          setSaveSuccess(null);
                        }}
                      >
                        {DAYS_OF_WEEK.map((d) => (
                          <option key={d.value} value={d.value}>
                            {frequency === 'BIWEEKLY' ? `Every other ${d.label}` : `Every ${d.label}`}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                  )}
                </div>

                {/* Step 3 & 4: Minimum Payment & Payment Amount */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#5E6B7A] block" htmlFor="payment-amount">
                      Step 3 & 4 — Payment Amount
                    </label>
                    <span className="text-xs text-[#5E6B7A]" id="minimum-payment-display">
                      Minimum required payment:{' '}
                      <span className="font-semibold text-[#172033] tabular-nums">
                        {formatCurrency(scheduledMinimum)}
                      </span>
                    </span>
                  </div>

                  <FormField
                    id="payment-amount"
                    error={
                      isAmountBelowMin
                        ? `Payment must be at least ${formatCurrency(scheduledMinimum)}.`
                        : undefined
                    }
                  >
                    <CurrencyInput
                      id="payment-amount"
                      value={paymentAmount}
                      onChange={(e) => {
                        setPaymentAmount(e.target.value);
                        setSaveSuccess(null);
                      }}
                      placeholder={scheduledMinimum.toFixed(2)}
                      hasError={isAmountBelowMin}
                    />
                  </FormField>
                </div>
              </div>

              {/* SECTION 3: Estimated Payment Plan (Informational Box per Style Spec Section 44) */}
              <div className="p-4 bg-[#F8FAFC] border border-[#D7DEE7] rounded-[6px]">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-[#12345B]" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#5E6B7A]">
                    Estimated Payment Plan
                  </h4>
                </div>

                {isAmountValid && projectedPayoff ? (
                  <div className="grid grid-cols-3 gap-6 text-sm">
                    <div>
                      <span className="text-xs text-[#5E6B7A] block">Payment</span>
                      <span className="font-semibold text-[#172033] tabular-nums" id="plan-payment">
                        {formatCurrency(paymentAmountNum)}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs text-[#5E6B7A] block">Frequency</span>
                      <span className="font-medium text-[#172033]" id="plan-frequency">
                        {formatFrequencyLabel(frequency)}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs text-[#5E6B7A] block">Estimated Payoff</span>
                      <span className="font-semibold text-[#172033]" id="plan-payoff">
                        {formatMonthYear(projectedPayoff.estimatedPayoffDate)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#5E6B7A]">
                    Enter a payment amount equal to or greater than the minimum required (
                    {formatCurrency(scheduledMinimum)}) to see your estimated payoff plan.
                  </p>
                )}
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!loan.bankAccount || !isAmountValid || isSubmitting}
                  isLoading={isSubmitting}
                  loadingText="Saving Schedule..."
                >
                  Save Schedule
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : (
        <Card>
          <p className="text-sm text-[#5E6B7A]">No active loan record found for your account.</p>
        </Card>
      )}
    </div>
  );
};
export default CustomerPaymentsPage;
