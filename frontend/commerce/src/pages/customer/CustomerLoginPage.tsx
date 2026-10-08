import { useLanguage } from "../../i18n/useLanguage.ts";
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth.ts';
import { Alert } from '../../components/ui/Alert.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Card } from '../../components/ui/Card.tsx';
import { FormField } from '../../components/ui/FormField.tsx';
import { TextInput } from '../../components/ui/TextInput.tsx';
import { DEMO_CUSTOMER_CREDENTIALS } from '../../data/mockData.ts';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher.tsx';

export const CustomerLoginPage: React.FC = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { loginCustomer } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/customer/loan';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email address and password.');
      return;
    }

    setIsLoading(true);
    try {
      await loginCustomer({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F5F7FA] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[420px] -mt-12">
        <div className="flex justify-end mb-4"><LanguageSwitcher /></div>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-[#172033] tracking-tight">
            FivePoint Bank
          </h1>
          <p className="text-sm text-[#5E6B7A] mt-1">{t("Customer Account Portal")}</p>
        </div>

        <Card className="p-8 shadow-[0_1px_2px_rgba(16,24,40,0.04)] border-[#D7DEE7]">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="error" className="mb-2">
                {error}
              </Alert>
            )}

            <FormField label={t("Email Address")} id="customer-email" required>
              <TextInput
                id="customer-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                autoComplete="email"
                required
              />
            </FormField>

            <FormField label={t("Password")} id="customer-password" required>
              <TextInput
                id="customer-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("Enter password")}
                autoComplete="current-password"
                required
              />
            </FormField>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={isLoading}
              loadingText={t("Logging in...")}
            >
              {t("Log In")}
            </Button>
          </form>

          {/* Demo credentials box adhering to spec Section 34 */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              setEmail(DEMO_CUSTOMER_CREDENTIALS.email);
              setPassword(DEMO_CUSTOMER_CREDENTIALS.password);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setEmail(DEMO_CUSTOMER_CREDENTIALS.email);
                setPassword(DEMO_CUSTOMER_CREDENTIALS.password);
                setError(null);
              }
            }}
            title={t("Click to fill demo credentials")}
            className="mt-6 p-3.5 bg-[#EAF1F8] border border-[#BBC6D3]/50 rounded-[6px] text-xs text-[#172033] cursor-pointer hover:bg-[#dfeaf4] transition-colors focus:outline-none focus:ring-2 focus:ring-[#12345B]"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-[#12345B]">{t("Demo credentials")}</span>
              <span className="text-[10px] text-[#5E6B7A] font-normal underline hover:text-[#12345B]">{t("Auto-fill")}</span>
            </div>
            <div className="text-[#5E6B7A] font-mono leading-relaxed">
              {t("Email:")} <span className="text-[#172033] font-medium">{DEMO_CUSTOMER_CREDENTIALS.email}</span>
              <br />
              {t("Password:")} <span className="text-[#172033] font-medium">{DEMO_CUSTOMER_CREDENTIALS.password}</span>
            </div>
          </div>
        </Card>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => navigate('/admin/login')}
            className="text-xs text-[#5E6B7A] hover:text-[#12345B] cursor-pointer"
          >
            {t("Go to Admin Login →")}
          </button>
        </div>
      </div>
    </div>
  );
};
