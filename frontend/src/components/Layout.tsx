import React, { ReactNode } from 'react';
import Header from './ui/Header';
import Footer from './ui/Footer';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <main style={{ flex: 1, padding: '1rem' }}>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
