import { useLanguage } from "../../i18n/useLanguage.ts";
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/useAuth.ts';
import { mockCustomerApi } from '../../api/mockCustomerApi.ts';
import type { BankAccount, BankAccountType, CustomerProfile, Loan } from '../../types/loan.ts';
import { Card } from '../../components/ui/Card.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { FormField } from '../../components/ui/FormField.tsx';
import { TextInput } from '../../components/ui/TextInput.tsx';
import { Select } from '../../components/ui/Select.tsx';
import { Alert } from '../../components/ui/Alert.tsx';
import { CardSkeleton } from '../../components/ui/Skeleton.tsx';
import { PageHeader } from '../../components/layout/PageHeader.tsx';
import { maskAccountNumber, maskRoutingNumber } from '../../utils/formatting.ts';

export const CustomerProfilePage: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser, refreshSession } = useAuth();

  const [loan, setLoan] = useState<Loan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Section A: Personal Information State
  const [personalName, setPersonalName] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [personalPhone, setPersonalPhone] = useState('');
  const [initialPersonal, setInitialPersonal] = useState<CustomerProfile>({
    id: '',
    name: '',
    email: '',
    phone: '',
  });
  const [personalError, setPersonalError] = useState<string | null>(null);
  const [personalSuccess, setPersonalSuccess] = useState<string | null>(null);
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);

  // Section B: Bank Account State
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountType, setAccountType] = useState<BankAccountType>('CHECKING');
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankError, setBankError] = useState<string | null>(null);
  const [bankSuccess, setBankSuccess] = useState<string | null>(null);
  const [isSavingBank, setIsSavingBank] = useState(false);

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
          if (data?.customer) {
            setPersonalName(data.customer.name);
            setPersonalEmail(data.customer.email);
            setPersonalPhone(data.customer.phone);
            setInitialPersonal({ ...data.customer });
          }
          setIsLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setIsLoading(false);
        });
    }
  }, [currentUser]);

  // Section A: Form change detection
  const isPersonalDirty =
    personalName.trim() !== initialPersonal.name.trim() ||
    personalEmail.trim() !== initialPersonal.email.trim() ||
    personalPhone.trim() !== initialPersonal.phone.trim();

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setPersonalError(null);
    setPersonalSuccess(null);

    if (!personalName.trim()) {
      setPersonalError('Customer name is required.');
      return;
    }
    if (!personalEmail.trim()) {
      setPersonalError('Email address is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(personalEmail.trim())) {
      setPersonalError('Please enter a valid email address.');
      return;
    }
    if (!personalPhone.trim()) {
      setPersonalError('Phone number is required.');
      return;
    }

    setIsSavingPersonal(true);
    try {
      const updated = await mockCustomerApi.updateCustomerProfile(
        initialPersonal.id || currentUser?.id || 'cust-101',
        {
          name: personalName.trim(),
          email: personalEmail.trim(),
          phone: personalPhone.trim(),
        },
        initialPersonal.email
      );

      setInitialPersonal({ ...updated });
      setPersonalName(updated.name);
      setPersonalEmail(updated.email);
      setPersonalPhone(updated.phone);
      setPersonalSuccess('Personal information saved.');
      // Refresh session in context so header reflects new customer name / email immediately
      refreshSession();
    } catch (err) {
      setPersonalError(err instanceof Error ? err.message : 'Unable to save personal information.');
    } finally {
      setIsSavingPersonal(false);
    }
  };

  // Section B: Bank Account Actions
  const handleStartBankEdit = () => {
    // Replacement form starts with routing/account fields empty per spec Section 18 / Page C3
    setBankName(loan?.bankAccount?.bankName || '');
    setAccountType(loan?.bankAccount?.accountType || 'CHECKING');
    setRoutingNumber('');
    setAccountNumber('');
    setBankError(null);
    setBankSuccess(null);
    setIsEditingBank(true);
  };

  const handleCancelBankEdit = () => {
    // Clear raw form values from active component state
    setBankName('');
    setRoutingNumber('');
    setAccountNumber('');
    setBankError(null);
    setIsEditingBank(false);
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setBankError(null);
    setBankSuccess(null);

    if (!bankName.trim()) {
      setBankError('Bank name is required.');
      return;
    }

    const cleanRouting = routingNumber.trim();
    if (!cleanRouting) {
      setBankError('Routing number is required.');
      return;
    }
    if (!/^\d{9}$/.test(cleanRouting)) {
      setBankError('Routing number must be exactly 9 digits.');
      return;
    }

    const cleanAccount = accountNumber.trim();
    if (!cleanAccount) {
      setBankError('Account number is required.');
      return;
    }
    if (!/^\d{4,17}$/.test(cleanAccount)) {
      setBankError('Please enter a valid account number (at least 4 digits).');
      return;
    }

    setIsSavingBank(true);
    try {
      const newAccount: BankAccount = {
        bankName: bankName.trim(),
        accountType,
        routingNumber: cleanRouting,
        accountNumber: cleanAccount,
      };

      await mockCustomerApi.updateCustomerBankAccount(
        {
          customerId: currentUser?.id,
          loanId: currentUser?.loanId,
          email: currentUser?.usernameOrEmail,
        },
        newAccount
      );

      // Prototype only — do not store raw bank data in browser storage in production.
      if (loan) {
        setLoan({
          ...loan,
          bankAccount: newAccount,
        });
      }

      // After save: clear raw form values from active component state
      setBankName('');
      setRoutingNumber('');
      setAccountNumber('');
      setIsEditingBank(false);
      setBankSuccess('Bank account information saved.');
    } catch (err) {
      setBankError(err instanceof Error ? err.message : 'Unable to save bank account information.');
    } finally {
      setIsSavingBank(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={t("Profile")}
        description={t("Manage your contact information and automatic payment account.")}
      />

      {isLoading ? (
        <div className="space-y-6">
          <CardSkeleton lines={3} />
          <CardSkeleton lines={3} />
        </div>
      ) : (
        <div className="space-y-6 max-w-4xl">
          {/* SECTION A — Personal Information */}
          <Card>
            <div className="pb-3 border-b border-[#D7DEE7]/60 mb-5">
              <h3 className="text-base font-semibold text-[#172033]">{t("Personal Information")}</h3>
            </div>

            {personalSuccess && (
              <Alert variant="success" className="mb-5">
                {personalSuccess}
              </Alert>
            )}

            {personalError && (
              <Alert variant="error" className="mb-5">
                {personalError}
              </Alert>
            )}

            <form onSubmit={handleSavePersonal} noValidate className="space-y-5">
              <div className="grid grid-cols-3 gap-6">
                <FormField label={t("Name")} id="personal-name" required>
                  <TextInput
                    id="personal-name"
                    value={personalName}
                    onChange={(e) => {
                      setPersonalName(e.target.value);
                      setPersonalSuccess(null);
                    }}
                    placeholder={t("Full Name")}
                    required
                  />
                </FormField>

                <FormField
                  label={t("Email Address")}
                  id="personal-email"
                  required
                  hint={t("Used for prototype login with password customer123")}
                >
                  <TextInput
                    id="personal-email"
                    type="email"
                    value={personalEmail}
                    onChange={(e) => {
                      setPersonalEmail(e.target.value);
                      setPersonalSuccess(null);
                    }}
                    placeholder="email@example.com"
                    required
                  />
                </FormField>

                <FormField label={t("Phone Number")} id="personal-phone" required>
                  <TextInput
                    id="personal-phone"
                    type="tel"
                    value={personalPhone}
                    onChange={(e) => {
                      setPersonalPhone(e.target.value);
                      setPersonalSuccess(null);
                    }}
                    placeholder="(555) 555-1234"
                    required
                  />
                </FormField>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!isPersonalDirty || isSavingPersonal}
                  isLoading={isSavingPersonal}
                  loadingText={t("Saving Personal Information...")}
                >
                  {t("Save Personal Information")}
                </Button>
              </div>
            </form>
          </Card>

          {/* SECTION B — Bank Account */}
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-[#D7DEE7]/60 mb-5">
              <h3 className="text-base font-semibold text-[#172033]">{t("Automatic Payment Account")}</h3>
              {!isEditingBank && loan?.bankAccount && (
                <Button variant="secondary" size="sm" onClick={handleStartBankEdit}>
                  {t("Change Bank Account")}
                </Button>
              )}
            </div>

            {bankSuccess && (
              <Alert variant="success" className="mb-5">
                {bankSuccess}
              </Alert>
            )}

            {bankError && (
              <Alert variant="error" className="mb-5">
                {bankError}
              </Alert>
            )}

            {isEditingBank ? (
              <form onSubmit={handleSaveBank} noValidate className="space-y-5">
                <div className="grid grid-cols-2 gap-6">
                  <FormField label={t("Bank Name")} id="bank-name" required>
                    <TextInput
                      id="bank-name"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder={t("e.g. Example National Bank")}
                      required
                    />
                  </FormField>

                  <FormField label={t("Account Type")} id="bank-account-type" required>
                    <Select
                      id="bank-account-type"
                      value={accountType}
                      onChange={(e) => setAccountType(e.target.value as BankAccountType)}
                    >
                      <option value="CHECKING">{t("Checking")}</option>
                      <option value="SAVINGS">{t("Savings")}</option>
                    </Select>
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    label={t("Routing Number")}
                    id="bank-routing-number"
                    required
                    hint={t("9 digits (accepts leading zeroes)")}
                  >
                    <TextInput
                      id="bank-routing-number"
                      inputMode="numeric"
                      value={routingNumber}
                      onChange={(e) => setRoutingNumber(e.target.value)}
                      placeholder="000012345"
                      maxLength={9}
                      required
                    />
                  </FormField>

                  <FormField
                    label={t("Account Number")}
                    id="bank-account-number"
                    required
                    hint={t("Preserves leading zeroes")}
                  >
                    <TextInput
                      id="bank-account-number"
                      inputMode="numeric"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="000987654321"
                      required
                    />
                  </FormField>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCancelBankEdit}
                    disabled={isSavingBank}
                  >
                    {t("Cancel")}
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSavingBank}
                    loadingText={t("Saving Bank Account...")}
                  >
                    {t("Save Bank Account")}
                  </Button>
                </div>
              </form>
            ) : loan?.bankAccount ? (
              // Display existing bank account masked per spec Section 18 / Page C3
              <div className="grid grid-cols-4 gap-6">
                <div>
                  <span className="text-xs font-semibold text-[#5E6B7A] block mb-1">{t("Bank Name")}</span>
                  <span className="text-sm font-medium text-[#172033]" id="view-bank-name">
                    {loan.bankAccount.bankName}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-semibold text-[#5E6B7A] block mb-1">
                    {t("Account Type")}
                  </span>
                  <span className="text-sm font-medium text-[#172033]" id="view-account-type">
                    {loan.bankAccount.accountType === 'CHECKING' ? t("Checking") : t("Savings")}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-semibold text-[#5E6B7A] block mb-1">
                    {t("Routing Number")}
                  </span>
                  <span className="text-sm font-mono text-[#172033]" id="view-routing-number">
                    {maskRoutingNumber(loan.bankAccount.routingNumber)}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-semibold text-[#5E6B7A] block mb-1">
                    {t("Account Number")}
                  </span>
                  <span className="text-sm font-mono text-[#172033]" id="view-account-number">
                    {maskAccountNumber(loan.bankAccount.accountNumber)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-[#F8FAFC] border border-[#D7DEE7] rounded-[6px]">
                <div>
                  <p className="text-sm text-[#5E6B7A]">{t("No bank account has been added.")}</p>
                  <p className="text-xs text-[#7B8794] mt-0.5">
                    {t("Add a bank account to enable automatic payments.")}
                  </p>
                </div>
                <Button variant="primary" size="sm" onClick={handleStartBankEdit}>
                  {t("Add Bank Account")}
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
export default CustomerProfilePage;
