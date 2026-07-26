import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../navigation/Sidebar';
import Header from '../navigation/Header';
import Breadcrumbs from '../navigation/Breadcrumbs';
import MobileBottomNav from '../navigation/MobileBottomNav';
import OnboardingChecklist from '../ui/OnboardingChecklist';
import { FloatingActionButton } from '../ui';
import { motion, AnimatePresence } from 'framer-motion';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Auto-close sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Backdrop for mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <Breadcrumbs />

        {/* Page Content — extra bottom padding on mobile for bottom nav */}
        <main className="flex-1 overflow-y-auto scrollbar-hide pb-16 lg:pb-0 bg-gray-50">
          <Outlet />
        </main>

        {/* Floating Action Button (desktop only) */}
        <div className="hidden lg:block">
          <FloatingActionButton />
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav />

      {/* Onboarding checklist widget */}
      <OnboardingChecklist />
    </div>
  );
};

export default MainLayout;
