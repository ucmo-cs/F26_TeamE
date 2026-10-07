import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { mockAdminLoansApi } from '../../api/mockAdminLoansApi.ts';
import type { BankAccount, BankAccountType, DayOfWeek, Loan, PaymentFrequency, PaymentSchedule } from '../../types/loan.ts';
import { Alert } from '../../components/ui/Alert.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Card } from '../../components/ui/Card.tsx';
import { CurrencyInput } from '../../components/ui/CurrencyInput.tsx';
import { FormField } from '../../components/ui/FormField.tsx';
import { PercentageInput } from '../../components/ui/PercentageInput.tsx';
import { Select } from '../../components/ui/Select.tsx';
import { CardSkeleton } from '../../components/ui/Skeleton.tsx';
import { TextInput } from '../../components/ui/TextInput.tsx';
import { PageHeader } from '../../components/layout/PageHeader.tsx';
import {
  formatCurrency,
  formatInterestRate,
  formatProminentDate,
  formatTableDate,
  maskAccountNumber,
  maskRoutingNumber,
} from '../../utils/formatting.ts';
import {
  calculateEstimatedPayoffDate,
  calculateMonthlyMinimum,
  calculateScheduledMinimum,
} from '../../utils/loanCalculations.ts';

const DAYS_OF_WEEK: { label: string; value: DayOfWeek }[] = [
  { label: 'Monday', value: 'MONDAY' },
  { label: 'Tuesday', value: 'TUESDAY' },
  { label: 'Wednesday', value: 'WEDNESDAY' },
  { label: 'Thursday', value: 'THURSDAY' },
  { label: 'Friday', value: 'FRIDAY' },
  { label: 'Saturday', value: 'SATURDAY' },
  { label: 'Sunday', value: 'SUNDAY' },
];

export const AdminLoanDetailsPage: React.FC = () => {
  const { loanId } = useParams<{ loanId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const creationState = location.state as {
    creationSuccess?: boolean;
    customerEmail?: string;
    password?: string;
  } | undefined;

  const [loan, setLoan] = useState<Loan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit form state
  const [editOriginalAmount, setEditOriginalAmount] = useState<string>('');
  const [editInterestRate, setEditInterestRate] = useState<string>('');
  const [editLoanDate, setEditLoanDate] = useState<string>('');

  const [editCustomerName, setEditCustomerName] = useState<string>('');
  const [editCustomerEmail, setEditCustomerEmail] = useState<string>('');
  const [editCustomerPhone, setEditCustomerPhone] = useState<string>('');

  const [editBankName, setEditBankName] = useState<string>('');
  const [editAccountType, setEditAccountType] = useState<BankAccountType>('CHECKING');
  const [editRoutingNumber, setEditRoutingNumber] = useState<string>('');
  const [editAccountNumber, setEditAccountNumber] = useState<string>('');

  const [hasSchedule, setHasSchedule] = useState<boolean>(false);
  const [editFrequency, setEditFrequency] = useState<PaymentFrequency>('MONTHLY');
  const [editPaymentAmount, setEditPaymentAmount] = useState<string>('');
  const [editDayOfMonth, setEditDayOfMonth] = useState<string>('15');
  const [editDayOfWeek, setEditDayOfWeek] = useState<DayOfWeek>('FRIDAY');

  const populateForm = (data: Loan) => {
    setEditOriginalAmount(data.originalAmount.toString());
    setEditInterestRate(data.annualInterestRate.toString());
    setEditLoanDate(data.loanDate);

    setEditCustomerName(data.customer.name);
    setEditCustomerEmail(data.customer.email);
    setEditCustomerPhone(data.customer.phone);

    if (data.bankAccount) {
      setEditBankName(data.bankAccount.bankName);
      setEditAccountType(data.bankAccount.accountType);
      // Secret numbers are not pre-filled with raw/masked strings
      setEditRoutingNumber('');
      setEditAccountNumber('');
    } else {
      setEditBankName('');
      setEditAccountType('CHECKING');
      setEditRoutingNumber('');
      setEditAccountNumber('');
    }

    if (data.paymentSchedule) {
      setHasSchedule(true);
      setEditFrequency(data.paymentSchedule.frequency);
      setEditPaymentAmount(data.paymentSchedule.paymentAmount.toString());
      setEditDayOfMonth(data.paymentSchedule.dayOfMonth?.toString() || '15');
      setEditDayOfWeek(data.paymentSchedule.dayOfWeek || 'FRIDAY');
    } else {
      setHasSchedule(false);
      setEditFrequency('MONTHLY');
      setEditPaymentAmount('');
      setEditDayOfMonth('15');
      setEditDayOfWeek('FRIDAY');
    }
  };

  useEffect(() => {
    if (loanId) {
      mockAdminLoansApi
        .getLoanById(loanId)
        .then((data) => {
          setLoan(data);
          if (data) {
            populateForm(data);
          }
          setIsLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setIsLoading(false);
        });
    }
  }, [loanId]);

  // Dynamic calculations based on current view/edit values
  const activeRate = isEditing
    ? parseFloat(editInterestRate) || 0
    : loan?.annualInterestRate || 0;

  const activeRemainingBalance = loan?.remainingBalance || 0;

  const currentMonthlyMinimum = useMemo(() => {
    return calculateMonthlyMinimum(activeRemainingBalance, activeRate);
  }, [activeRemainingBalance, activeRate]);

  const activeScheduleFrequency = isEditing
    ? editFrequency
    : loan?.paymentSchedule?.frequency || 'MONTHLY';

  const currentScheduledMinimum = useMemo(() => {
    return calculateScheduledMinimum(activeRemainingBalance, activeRate, activeScheduleFrequency);
  }, [activeRemainingBalance, activeRate, activeScheduleFrequency]);

  const activePaymentAmount = isEditing
    ? parseFloat(editPaymentAmount) || 0
    : loan?.paymentSchedule?.paymentAmount || 0;

  const payoffEstimate = useMemo(() => {
    if ((isEditing && !hasSchedule) || (!isEditing && !loan?.paymentSchedule)) {
      return null;
    }
    if (activePaymentAmount <= 0) return null;
    return calculateEstimatedPayoffDate(
      activeRemainingBalance,
      activeRate,
      activePaymentAmount,
      activeScheduleFrequency
    );
  }, [isEditing, hasSchedule, loan?.paymentSchedule, activePaymentAmount, activeRemainingBalance, activeRate, activeScheduleFrequency]);

  const handleStartEdit = () => {
    if (loan) {
      populateForm(loan);
      setFormError(null);
      setSaveSuccess(false);
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    if (loan) {
      populateForm(loan);
    }
    setFormError(null);
    setIsEditing(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loan) return;

    setFormError(null);
    setSaveSuccess(false);

    // Validate Section A
    const originalAmountNum = parseFloat(editOriginalAmount);
    if (isNaN(originalAmountNum) || originalAmountNum <= 0) {
      setFormError('Please enter a valid original amount greater than zero.');
      return;
    }

    const interestRateNum = parseFloat(editInterestRate);
    if (isNaN(interestRateNum) || interestRateNum < 0) {
      setFormError('Please enter a valid non-negative interest rate.');
      return;
    }

    if (!editLoanDate.trim()) {
      setFormError('Please select a valid loan date.');
      return;
    }

    // Validate Section B
    if (!editCustomerName.trim()) {
      setFormError('Customer name is required.');
      return;
    }
    if (!editCustomerEmail.trim()) {
      setFormError('Customer email address is required.');
      return;
    }
    if (!editCustomerPhone.trim()) {
      setFormError('Customer phone number is required.');
      return;
    }

    // Validate Section C (Bank Account)
    let updatedBankAccount: BankAccount | undefined = loan.bankAccount;
    if (editBankName.trim()) {
      const routingNum = editRoutingNumber.trim() || loan.bankAccount?.routingNumber || '000012345';
      const accountNum = editAccountNumber.trim() || loan.bankAccount?.accountNumber || '000987654321';

      updatedBankAccount = {
        bankName: editBankName.trim(),
        accountType: editAccountType,
        routingNumber: routingNum,
        accountNumber: accountNum,
      };
    }

    // Validate Section D (Payment Schedule)
    let updatedSchedule: PaymentSchedule | undefined = undefined;
    if (hasSchedule) {
      const paymentNum = parseFloat(editPaymentAmount);
      if (isNaN(paymentNum) || paymentNum <= 0) {
        setFormError('Please enter a valid payment amount.');
        return;
      }

      if (paymentNum < currentScheduledMinimum) {
        setFormError(`Payment must be at least ${formatCurrency(currentScheduledMinimum)}.`);
        return;
      }

      updatedSchedule = {
        frequency: editFrequency,
        paymentAmount: Math.round(paymentNum * 100) / 100,
        dayOfMonth: editFrequency === 'MONTHLY' ? parseInt(editDayOfMonth, 10) || 15 : undefined,
        dayOfWeek: editFrequency !== 'MONTHLY' ? editDayOfWeek : undefined,
        nextPaymentDate: loan.paymentSchedule?.nextPaymentDate || '2026-10-16',
      };
    }

    setIsSaving(true);
    try {
      const updated = await mockAdminLoansApi.updateLoan(loan.id, {
        originalAmount: originalAmountNum,
        annualInterestRate: interestRateNum,
        loanDate: editLoanDate,
        customer: {
          id: loan.customer.id,
          name: editCustomerName.trim(),
          email: editCustomerEmail.trim(),
          phone: editCustomerPhone.trim(),
        },
        bankAccount: updatedBankAccount,
        paymentSchedule: updatedSchedule,
      });

      setLoan(updated);
      populateForm(updated);
      setIsEditing(false);
      setSaveSuccess(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save loan changes.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="h-6 w-32 bg-[#E2E8F0] animate-pulse rounded mb-4" />
        <div className="h-9 w-64 bg-[#E2E8F0] animate-pulse rounded mb-6" />
        <div className="space-y-6">
          <CardSkeleton lines={4} />
          <CardSkeleton lines={3} />
          <CardSkeleton lines={3} />
        </div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div>
        <PageHeader
          title="Loan Details"
          backAction={
            <button
              type="button"
              onClick={() => navigate('/admin/loans')}
              className="flex items-center text-xs font-medium text-[#5E6B7A] hover:text-[#12345B] cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4 mr-0.5" />
              Back to Loans
            </button>
          }
        />
        <Card>
          <p className="text-sm text-[#B42318]">Loan not found.</p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`${loan.customer.name}`}
        description="Loan Details"
        backAction={
          <button
            type="button"
            onClick={() => navigate('/admin/loans')}
            className="flex items-center text-xs font-medium text-[#5E6B7A] hover:text-[#12345B] cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4 mr-0.5" />
            Back to Loans
          </button>
        }
        action={
          isEditing ? (
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={handleCancelEdit} disabled={isSaving}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                isLoading={isSaving}
                loadingText="Saving Changes..."
              >
                Save Changes
              </Button>
            </div>
          ) : (
            <Button variant="primary" onClick={handleStartEdit}>
              Edit
            </Button>
          )
        }
      />

      {/* Notifications */}
      {creationState?.creationSuccess && (
        <Alert variant="success" className="mb-6">
          <div className="space-y-1">
            <h5 className="font-semibold text-inherit text-sm">Loan created successfully.</h5>
            <div className="text-xs text-inherit font-mono pt-1">
              Prototype customer login: <span className="font-semibold">{creationState.customerEmail}</span>
              <br />
              Password: <span className="font-semibold">customer123</span>
            </div>
            <p className="text-xs text-inherit/80 pt-1 italic">
              No email was sent because this is a frontend prototype.
            </p>
          </div>
        </Alert>
      )}

      {saveSuccess && (
        <Alert variant="success" className="mb-6">
          Changes saved successfully.
        </Alert>
      )}

      {formError && (
        <Alert variant="error" className="mb-6">
          {formError}
        </Alert>
      )}

      {/* Main stacked sections */}
      <div className="space-y-6">
        {/* SECTION A: Loan Summary */}
        <Card className="border-[#D7DEE7]">
          <div className="flex items-center justify-between pb-3 border-b border-[#D7DEE7]/60 mb-5">
            <h3 className="text-base font-semibold text-[#172033]">Loan Summary</h3>
            {isEditing && (
              <span className="text-xs text-[#5E6B7A] italic">Edit mode active</span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Original Amount */}
            <div>
              <span className="text-xs font-semibold text-[#5E6B7A] block mb-1">Original Amount</span>
              {isEditing ? (
                <FormField id="edit-original-amount">
                  <CurrencyInput
                    id="edit-original-amount"
                    value={editOriginalAmount}
                    onChange={(e) => setEditOriginalAmount(e.target.value)}
                    placeholder="25000.00"
                  />
                </FormField>
              ) : (
                <span className="text-base font-semibold text-[#172033] tabular-nums">
                  {formatCurrency(loan.originalAmount)}
                </span>
              )}
            </div>

            {/* Remaining Balance (READ-ONLY) */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-[#5E6B7A]">Remaining Balance</span>
                <span className="text-[10px] text-[#7B8794] uppercase tracking-wider bg-[#F5F7FA] px-1.5 py-0.5 rounded border border-[#D7DEE7]">
                  Read-only
                </span>
              </div>
              <span className="text-xl font-semibold text-[#172033] tabular-nums">
                {formatCurrency(loan.remainingBalance)}
              </span>
            </div>

            {/* Interest Rate */}
            <div>
              <span className="text-xs font-semibold text-[#5E6B7A] block mb-1">Interest Rate</span>
              {isEditing ? (
                <FormField id="edit-interest-rate">
                  <PercentageInput
                    id="edit-interest-rate"
                    value={editInterestRate}
                    onChange={(e) => setEditInterestRate(e.target.value)}
                    placeholder="6.25"
                  />
                </FormField>
              ) : (
                <span className="text-base font-semibold text-[#172033] tabular-nums">
                  {formatInterestRate(loan.annualInterestRate)}
                </span>
              )}
            </div>

            {/* Loan Date */}
            <div>
              <span className="text-xs font-semibold text-[#5E6B7A] block mb-1">Loan Date</span>
              {isEditing ? (
                <FormField id="edit-loan-date">
                  <TextInput
                    id="edit-loan-date"
                    type="date"
                    value={editLoanDate}
                    onChange={(e) => setEditLoanDate(e.target.value)}
                  />
                </FormField>
              ) : (
                <span className="text-sm font-medium text-[#172033]">
                  {formatTableDate(loan.loanDate)}
                </span>
              )}
            </div>

            {/* Minimum Monthly Payment (Calculated / Read-only) */}
            <div>
              <span className="text-xs font-semibold text-[#5E6B7A] block mb-1">
                Minimum Monthly Payment
              </span>
              <span className="text-base font-semibold text-[#172033] tabular-nums">
                {formatCurrency(currentMonthlyMinimum)}
              </span>
            </div>

            {/* Estimated Payoff Date (Calculated / Read-only) */}
            <div>
              <span className="text-xs font-semibold text-[#5E6B7A] block mb-1">
                Estimated Payoff Date
              </span>
              <span className="text-sm font-medium text-[#172033]">
                {payoffEstimate
                  ? payoffEstimate.payoffDateFormatted
                  : loan.paymentSchedule
                  ? 'Calculating...'
                  : 'No schedule configured'}
              </span>
            </div>
          </div>
        </Card>

        {/* SECTION B: Customer Information */}
        <Card className="border-[#D7DEE7]">
          <div className="pb-3 border-b border-[#D7DEE7]/60 mb-5">
            <h3 className="text-base font-semibold text-[#172033]">Customer Information</h3>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Customer Name */}
            <div>
              <span className="text-xs font-semibold text-[#5E6B7A] block mb-1">Customer Name</span>
              {isEditing ? (
                <FormField id="edit-customer-name">
                  <TextInput
                    id="edit-customer-name"
                    value={editCustomerName}
                    onChange={(e) => setEditCustomerName(e.target.value)}
                    placeholder="Full Name"
                  />
                </FormField>
              ) : (
                <span className="text-sm font-medium text-[#172033]">{loan.customer.name}</span>
              )}
            </div>

            {/* Email Address */}
            <div>
              <span className="text-xs font-semibold text-[#5E6B7A] block mb-1">Email Address</span>
              {isEditing ? (
                <FormField id="edit-customer-email">
                  <TextInput
                    id="edit-customer-email"
                    type="email"
                    value={editCustomerEmail}
                    onChange={(e) => setEditCustomerEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                </FormField>
              ) : (
                <span className="text-sm font-medium text-[#172033]">{loan.customer.email}</span>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <span className="text-xs font-semibold text-[#5E6B7A] block mb-1">Phone Number</span>
              {isEditing ? (
                <FormField id="edit-customer-phone">
                  <TextInput
                    id="edit-customer-phone"
                    type="tel"
                    value={editCustomerPhone}
                    onChange={(e) => setEditCustomerPhone(e.target.value)}
                    placeholder="(555) 555-1234"
                  />
                </FormField>
              ) : (
                <span className="text-sm font-medium text-[#172033]">{loan.customer.phone}</span>
              )}
            </div>
          </div>
        </Card>

        {/* SECTION C: Automatic Payment Account */}
        <Card className="border-[#D7DEE7]">
          <div className="pb-3 border-b border-[#D7DEE7]/60 mb-5">
            <h3 className="text-base font-semibold text-[#172033]">Automatic Payment Account</h3>
          </div>

          {!isEditing && !loan.bankAccount ? (
            <p className="text-sm text-[#5E6B7A]">No bank account has been configured.</p>
          ) : isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <FormField label="Bank Name" id="edit-bank-name">
                  <TextInput
                    id="edit-bank-name"
                    value={editBankName}
                    onChange={(e) => setEditBankName(e.target.value)}
                    placeholder="e.g. Commerce Bank"
                  />
                </FormField>

                <FormField label="Account Type" id="edit-account-type">
                  <Select
                    id="edit-account-type"
                    value={editAccountType}
                    onChange={(e) => setEditAccountType(e.target.value as BankAccountType)}
                  >
                    <option value="CHECKING">Checking</option>
                    <option value="SAVINGS">Savings</option>
                  </Select>
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <FormField
                  label="Routing Number"
                  id="edit-routing-number"
                  hint={loan.bankAccount ? `Current: ${maskRoutingNumber(loan.bankAccount.routingNumber)}` : '9-digit routing number'}
                >
                  <TextInput
                    id="edit-routing-number"
                    inputMode="numeric"
                    value={editRoutingNumber}
                    onChange={(e) => setEditRoutingNumber(e.target.value)}
                    placeholder="Enter new routing number (or keep current)"
                  />
                </FormField>

                <FormField
                  label="Account Number"
                  id="edit-account-number"
                  hint={loan.bankAccount ? `Current: ${maskAccountNumber(loan.bankAccount.accountNumber)}` : 'Account number'}
                >
                  <TextInput
                    id="edit-account-number"
                    inputMode="numeric"
                    value={editAccountNumber}
                    onChange={(e) => setEditAccountNumber(e.target.value)}
                    placeholder="Enter new account number (or keep current)"
                  />
                </FormField>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-6">
              <div>
                <span className="text-xs font-semibold text-[#5E6B7A] block mb-1">Bank Name</span>
                <span className="text-sm font-medium text-[#172033]">
                  {loan.bankAccount?.bankName}
                </span>
              </div>
              <div>
                <span className="text-xs font-semibold text-[#5E6B7A] block mb-1">Account Type</span>
                <span className="text-sm font-medium text-[#172033]">
                  {loan.bankAccount?.accountType === 'CHECKING' ? 'Checking' : 'Savings'}
                </span>
              </div>
              <div>
                <span className="text-xs font-semibold text-[#5E6B7A] block mb-1">Routing Number</span>
                <span className="text-sm font-mono text-[#172033]">
                  {loan.bankAccount && maskRoutingNumber(loan.bankAccount.routingNumber)}
                </span>
              </div>
              <div>
                <span className="text-xs font-semibold text-[#5E6B7A] block mb-1">Account Number</span>
                <span className="text-sm font-mono text-[#172033]">
                  {loan.bankAccount && maskAccountNumber(loan.bankAccount.accountNumber)}
                </span>
              </div>
            </div>
          )}
        </Card>

        {/* SECTION D: Automatic Payment Schedule */}
        <Card className="border-[#D7DEE7]">
          <div className="flex items-center justify-between pb-3 border-b border-[#D7DEE7]/60 mb-5">
            <h3 className="text-base font-semibold text-[#172033]">Automatic Payment Schedule</h3>
            {isEditing && (
              <label className="flex items-center gap-2 text-xs font-medium text-[#172033] cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasSchedule}
                  onChange={(e) => setHasSchedule(e.target.checked)}
                  className="rounded border-[#BBC6D3] text-[#12345B] focus:ring-[#12345B]"
                />
                <span>Configure Automatic Payments</span>
              </label>
            )}
          </div>

          {!isEditing && !loan.paymentSchedule ? (
            <p className="text-sm text-[#5E6B7A]">No automatic payment schedule has been configured.</p>
          ) : isEditing && !hasSchedule ? (
            <p className="text-sm text-[#5E6B7A]">
              Automatic payments disabled for this loan. Check the box above to configure a schedule.
            </p>
          ) : isEditing ? (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-6">
                <FormField label="Frequency" id="edit-frequency">
                  <Select
                    id="edit-frequency"
                    value={editFrequency}
                    onChange={(e) => {
                      const newFreq = e.target.value as PaymentFrequency;
                      setEditFrequency(newFreq);
                      const newMin = calculateScheduledMinimum(activeRemainingBalance, activeRate, newFreq);
                      setEditPaymentAmount(newMin.toFixed(2));
                    }}
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="BIWEEKLY">Bi-weekly</option>
                    <option value="WEEKLY">Weekly</option>
                  </Select>
                </FormField>

                <FormField
                  label="Payment Amount"
                  id="edit-payment-amount"
                  hint={`Minimum required: ${formatCurrency(currentScheduledMinimum)}`}
                >
                  <CurrencyInput
                    id="edit-payment-amount"
                    value={editPaymentAmount}
                    onChange={(e) => setEditPaymentAmount(e.target.value)}
                    placeholder="250.00"
                  />
                </FormField>

                {editFrequency === 'MONTHLY' ? (
                  <FormField label="Day of Month" id="edit-day-of-month" hint="Day of month (1–28)">
                    <Select
                      id="edit-day-of-month"
                      value={editDayOfMonth}
                      onChange={(e) => setEditDayOfMonth(e.target.value)}
                    >
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                        <option key={day} value={day}>
                          {day}
                          {day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of month
                        </option>
                      ))}
                    </Select>
                  </FormField>
                ) : (
                    <FormField label="Day of Week" id="edit-day-of-week">
                    <Select
                      id="edit-day-of-week"
                      value={editDayOfWeek}
                      onChange={(e) => setEditDayOfWeek(e.target.value as DayOfWeek)}
                    >
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d.value} value={d.value}>
                          {editFrequency === 'BIWEEKLY' ? `Every other ${d.label}` : `Every ${d.label}`}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                )}
              </div>

              {/* Dynamic schedule info cards */}
              <div className="p-4 bg-[#F8FAFC] border border-[#D7DEE7] rounded-[6px] grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#5E6B7A] block">Minimum Required Payment:</span>
                  <span className="text-sm font-semibold text-[#172033] tabular-nums">
                    {formatCurrency(currentScheduledMinimum)}
                  </span>
                </div>
                <div>
                  <span className="text-[#5E6B7A] block">Projected Payoff Date:</span>
                  <span className="text-sm font-semibold text-[#172033]">
                    {payoffEstimate ? payoffEstimate.payoffDateFormatted : 'Payment amount too low'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-6">
              <div>
                <span className="text-xs font-semibold text-[#5E6B7A] block mb-1">Frequency</span>
                <span className="text-sm font-medium text-[#172033]">
                  {loan.paymentSchedule?.frequency === 'MONTHLY'
                    ? 'Monthly'
                    : loan.paymentSchedule?.frequency === 'BIWEEKLY'
                    ? 'Bi-weekly'
                    : 'Weekly'}
                </span>
              </div>
              <div>
                <span className="text-xs font-semibold text-[#5E6B7A] block mb-1">Payment Amount</span>
                <span className="text-sm font-semibold text-[#172033] tabular-nums">
                  {formatCurrency(loan.paymentSchedule?.paymentAmount || 0)}
                </span>
              </div>
              <div>
                <span className="text-xs font-semibold text-[#5E6B7A] block mb-1">Schedule Day</span>
                <span className="text-sm font-medium text-[#172033]">
                  {loan.paymentSchedule?.frequency === 'MONTHLY'
                    ? `${loan.paymentSchedule?.dayOfMonth || 15}th of the month`
                    : loan.paymentSchedule?.frequency === 'BIWEEKLY'
                    ? `Every other ${
                        DAYS_OF_WEEK.find((d) => d.value === loan.paymentSchedule?.dayOfWeek)?.label ||
                        'Friday'
                      }`
                    : `Every ${
                        DAYS_OF_WEEK.find((d) => d.value === loan.paymentSchedule?.dayOfWeek)?.label ||
                        'Friday'
                      }`}
                </span>
              </div>
              <div>
                <span className="text-xs font-semibold text-[#5E6B7A] block mb-1">
                  Minimum Required Payment
                </span>
                <span className="text-sm font-semibold text-[#172033] tabular-nums">
                  {formatCurrency(currentScheduledMinimum)}
                </span>
              </div>
              <div>
                <span className="text-xs font-semibold text-[#5E6B7A] block mb-1">Next Payment Date</span>
                <span className="text-sm font-medium text-[#172033]">
                  {loan.paymentSchedule?.nextPaymentDate
                    ? formatProminentDate(loan.paymentSchedule.nextPaymentDate)
                    : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-xs font-semibold text-[#5E6B7A] block mb-1">
                  Estimated Payoff Date
                </span>
                <span className="text-sm font-semibold text-[#172033]">
                  {payoffEstimate ? payoffEstimate.payoffDateFormatted : 'N/A'}
                </span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
