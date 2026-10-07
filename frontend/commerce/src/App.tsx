import React from 'react';
import { AuthProvider } from './context/AuthContext.tsx';
import { AppRouter } from './router/AppRouter.tsx';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
};

export default App;
