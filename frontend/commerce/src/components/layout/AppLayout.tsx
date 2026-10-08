import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header.tsx';
import { Sidebar } from './Sidebar.tsx';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex flex-col bg-[#F5F7FA]">
      <Header />
      <div className="flex flex-1 w-full overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8 bg-[#F5F7FA]">
          <div className="max-w-[1280px] w-full text-left">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
