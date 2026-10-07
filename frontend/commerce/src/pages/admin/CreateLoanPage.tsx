import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { mockAdminLoansApi } from '../../api/mockAdminLoansApi.ts';
import { Alert } from '../../components/ui/Alert.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Card } from '../../components/ui/Card.tsx';
import { CurrencyInput } from '../../components/ui/CurrencyInput.tsx';
import { FormField } from '../../components/ui/FormField.tsx';
import { PercentageInput } from '../../components/ui/PercentageInput.tsx';
import { TextInput } from '../../components/ui/TextInput.tsx';
import { PageHeader } from '../../components/layout/PageHeader.tsx';

interface ValidationErrors {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  loanDate?: string;
  originalAmount?: string;
  annualInterestRate?: string;
}

export const CreateLoanPage: React.FC = () => {
  const navigate = useNavigate();

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Default loan date to today (YYYY-MM-DD)
  const todayIso = new Date().toISOString().split('T')[0];
  const [loanDate, setLoanDate] = useState(todayIso);
  const [originalAmount, setOriginalAmount] = useState('');
  const [annualInterestRate, setAnnualInterestRate] = useState('');

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Customer Name
    if (!customerName.trim()) {
      newErrors.customerName = 'Customer name is required.';
    }

    // Customer Email
    if (!customerEmail.trim()) {
      newErrors.customerEmail = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
      newErrors.customerEmail = 'Please enter a valid email address.';
    }

    // Customer Phone
    if (!customerPhone.trim()) {
      newErrors.customerPhone = 'Phone number is required.';
    }

    // Loan Date
    if (!loanDate.trim()) {
      newErrors.loanDate = 'Loan date is required.';
    }

    // Original Amount
    const amountNum = parseFloat(originalAmount);
    if (!originalAmount.trim()) {
      newErrors.originalAmount = 'Original loan amount is required.';
    } else if (isNaN(amountNum) || amountNum <= 0) {
      newErrors.originalAmount = 'Original amount must be greater than $0.00.';
    }

    // Annual Interest Rate
    const rateNum = parseFloat(annualInterestRate);
    if (!annualInterestRate.trim()) {
      newErrors.annualInterestRate = 'Annual interest rate is required.';
    } else if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
      newErrors.annualInterestRate = 'Interest rate must be between 0.00% and 100.00%.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const newLoan = await mockAdminLoansApi.createLoan({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim().toLowerCase(),
        customerPhone: customerPhone.trim(),
        loanDate,
        originalAmount: parseFloat(originalAmount),
        annualInterestRate: parseFloat(annualInterestRate),
      });

      // Navigate to the new loan detail page per Content Spec Section 17, Page A3
      navigate(`/admin/loans/${newLoan.id}`, {
        state: {
          creationSuccess: true,
          customerEmail: newLoan.customer.email,
          password: 'customer123',
        },
      });
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : 'Unable to create loan. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Create New Loan"
        description="Create a new loan and generate a customer prototype account."
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

      <div className="mb-4 text-xs text-[#5E6B7A]">
        <span className="text-[#B42318] font-semibold">*</span> Required fields
      </div>

      {generalError && (
        <Alert variant="error" className="mb-6">
          {generalError}
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* SECTION A — Customer Information */}
        <Card className="border-[#D7DEE7]">
          <div className="pb-3 border-b border-[#D7DEE7]/60 mb-5">
            <h3 className="text-base font-semibold text-[#172033]">Customer Information</h3>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <FormField
              label="Customer Name"
              id="new-customer-name"
              required
              error={errors.customerName}
            >
              <TextInput
                id="new-customer-name"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  if (errors.customerName) setErrors((prev) => ({ ...prev, customerName: undefined }));
                }}
                placeholder="Jane Smith"
                hasError={!!errors.customerName}
              />
            </FormField>

            <FormField
              label="Email Address"
              id="new-customer-email"
              required
              error={errors.customerEmail}
            >
              <TextInput
                id="new-customer-email"
                type="email"
                value={customerEmail}
                onChange={(e) => {
                  setCustomerEmail(e.target.value);
                  if (errors.customerEmail) setErrors((prev) => ({ ...prev, customerEmail: undefined }));
                }}
                placeholder="jane@example.com"
                hasError={!!errors.customerEmail}
              />
            </FormField>

            <FormField
              label="Phone Number"
              id="new-customer-phone"
              required
              error={errors.customerPhone}
            >
              <TextInput
                id="new-customer-phone"
                type="tel"
                value={customerPhone}
                onChange={(e) => {
                  setCustomerPhone(e.target.value);
                  if (errors.customerPhone) setErrors((prev) => ({ ...prev, customerPhone: undefined }));
                }}
                placeholder="(555) 555-1234"
                hasError={!!errors.customerPhone}
              />
            </FormField>
          </div>
        </Card>

        {/* SECTION B — Loan Information */}
        <Card className="border-[#D7DEE7]">
          <div className="pb-3 border-b border-[#D7DEE7]/60 mb-5">
            <h3 className="text-base font-semibold text-[#172033]">Loan Information</h3>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <FormField label="Loan Date" id="new-loan-date" required error={errors.loanDate}>
              <TextInput
                id="new-loan-date"
                type="date"
                value={loanDate}
                onChange={(e) => {
                  setLoanDate(e.target.value);
                  if (errors.loanDate) setErrors((prev) => ({ ...prev, loanDate: undefined }));
                }}
                hasError={!!errors.loanDate}
              />
            </FormField>

            <FormField
              label="Original Loan Amount"
              id="new-original-amount"
              required
              error={errors.originalAmount}
            >
              <CurrencyInput
                id="new-original-amount"
                value={originalAmount}
                onChange={(e) => {
                  setOriginalAmount(e.target.value);
                  if (errors.originalAmount) setErrors((prev) => ({ ...prev, originalAmount: undefined }));
                }}
                placeholder="25000.00"
                hasError={!!errors.originalAmount}
              />
            </FormField>

            <FormField
              label="Annual Interest Rate"
              id="new-interest-rate"
              required
              error={errors.annualInterestRate}
            >
              <PercentageInput
                id="new-interest-rate"
                value={annualInterestRate}
                onChange={(e) => {
                  setAnnualInterestRate(e.target.value);
                  if (errors.annualInterestRate) setErrors((prev) => ({ ...prev, annualInterestRate: undefined }));
                }}
                placeholder="6.25"
                hasError={!!errors.annualInterestRate}
              />
            </FormField>
          </div>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/admin/loans')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            loadingText="Creating Loan..."
          >
            Create Loan
          </Button>
        </div>
      </form>
    </div>
  );
};
