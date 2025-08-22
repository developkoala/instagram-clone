import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import MobileBottomNav from './MobileBottomNav';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-muksta-cream">
      <Header />
      <main className="pt-14 sm:pt-16 pb-16 md:pb-0">
        <Outlet />
      </main>
      <MobileBottomNav />
    </div>
  );
};

export default Layout;