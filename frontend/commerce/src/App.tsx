import React, { useEffect } from 'react';
import { useLanguage } from './i18n/useLanguage.ts';
import { AuthProvider } from './context/AuthContext.tsx';
import { AppRouter } from './router/AppRouter.tsx';

export const App: React.FC = () => {
  const { language, t } = useLanguage();
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = t('Loan Repayment Tracker — FivePoint Bank');
  }, [language, t]);
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
};

export default App;
