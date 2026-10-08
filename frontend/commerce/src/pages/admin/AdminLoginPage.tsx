import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth.ts';
import { Alert } from '../../components/ui/Alert.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Card } from '../../components/ui/Card.tsx';
import { FormField } from '../../components/ui/FormField.tsx';
import { TextInput } from '../../components/ui/TextInput.tsx';
import { DEMO_ADMIN_CREDENTIALS } from '../../data/mockData.ts';

export const AdminLoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { loginAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin/loans';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setIsLoading(true);
    try {
      await loginAdmin({ username, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid username or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F5F7FA] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[420px] -mt-12">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-[#172033] tracking-tight">
            FivePoint Bank
          </h1>
          <p className="text-sm text-[#5E6B7A] mt-1">Administrator Portal</p>
        </div>

        <Card className="p-8 shadow-[0_1px_2px_rgba(16,24,40,0.04)] border-[#D7DEE7]">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="error" className="mb-2">
                {error}
              </Alert>
            )}

            <FormField label="Username" id="admin-username" required>
              <TextInput
                id="admin-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                autoComplete="username"
                required
              />
            </FormField>

            <FormField label="Password" id="admin-password" required>
              <TextInput
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                required
              />
            </FormField>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={isLoading}
              loadingText="Logging in..."
            >
              Log In
            </Button>
          </form>

          {/* Demo credentials box adhering to spec Section 34 */}
          <div
            onClick={() => {
              setUsername(DEMO_ADMIN_CREDENTIALS.username);
              setPassword(DEMO_ADMIN_CREDENTIALS.password);
              setError(null);
            }}
            title="Click to fill demo credentials"
            className="mt-6 p-3.5 bg-[#EAF1F8] border border-[#BBC6D3]/50 rounded-[6px] text-xs text-[#172033] cursor-pointer hover:bg-[#dfeaf4] transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-[#12345B]">Demo credentials</span>
              <span className="text-[10px] text-[#5E6B7A] font-normal underline">Auto-fill</span>
            </div>
            <div className="text-[#5E6B7A] font-mono leading-relaxed">
              Username: <span className="text-[#172033] font-medium">{DEMO_ADMIN_CREDENTIALS.username}</span>
              <br />
              Password: <span className="text-[#172033] font-medium">{DEMO_ADMIN_CREDENTIALS.password}</span>
            </div>
          </div>
        </Card>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => navigate('/customer/login')}
            className="text-xs text-[#5E6B7A] hover:text-[#12345B] cursor-pointer"
          >
            Go to Customer Login →
          </button>
        </div>
      </div>
    </div>
  );
};
