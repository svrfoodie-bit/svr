import { useLocation, useNavigate, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ShoppingCart,
  Plus,
  IndianRupee,
  Menu,
  X,
  Package,
  Briefcase,
  Receipt,
  Users,
  TrendingUp,
  AlertTriangle,
  FileText,
  Settings,
  HelpCircle,
  Factory,
  Archive,
  ClipboardList,
  Wallet,
  BarChart3,
  MessageCircle,
  FileDown,
  Activity,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useModuleSettingsStore } from '../../context/moduleSettingsStore';

// The 4 permanent nav items (index 2 is replaced by the centre FAB)
const NAV_ITEMS = [
  { path: '/',               icon: LayoutDashboard, label: 'Home' },
  { path: '/sales-orders',   icon: ShoppingCart,    label: 'Sales' },
  null, // placeholder for centre FAB
  { path: '/sales-payments', icon: IndianRupee,     label: 'Receipts' },
  { path: '/outstanding-report', icon: AlertTriangle, label: 'Outstanding' },
];

// Quick-add options shown above the "+" button. modulePath is what gets checked
// against the Settings > Modules disabled list (the create form, not the list page).
const QUICK_ADD = [
  { label: 'New Sale',      path: '/sales-orders/new',   modulePath: '/sales-orders',   icon: ShoppingCart, color: 'bg-blue-500' },
  { label: 'Raw Purchase',  path: '/raw-purchases/new',  modulePath: '/raw-purchases',  icon: Package,      color: 'bg-emerald-500' },
  { label: 'New Expense',   path: '/expenses/new',       modulePath: '/expenses',       icon: Receipt,      color: 'bg-rose-500' },
  { label: 'Job Work',      path: '/job-work/new',       modulePath: '/job-work',       icon: Briefcase,    color: 'bg-violet-500' },
];

// Full menu sections shown in the bottom sheet
const MENU_SECTIONS = [
  {
    title: 'Operations',
    items: [
      { path: '/raw-purchases',        icon: Package,       label: 'Raw Purchase' },
      { path: '/workers',              icon: Users,         label: 'Workers' },
      { path: '/job-work',             icon: Briefcase,     label: 'Job Work' },
      { path: '/daily-work',           icon: ClipboardList, label: 'Daily Work' },
      { path: '/batches',              icon: Factory,       label: 'Production' },
      { path: '/finished-goods-stock', icon: Archive,       label: 'Finished Stock' },
    ],
  },
  {
    title: 'Finance',
    items: [
      { path: '/expenses',         icon: Receipt,    label: 'Expenses' },
      { path: '/profit-dashboard', icon: TrendingUp, label: 'Profit & Loss' },
      { path: '/owner-dashboard',  icon: BarChart3,  label: 'Owner View' },
      { path: '/worker-advances',  icon: Wallet,     label: 'Worker Advances' },
    ],
  },
  {
    title: 'Utilities',
    items: [
      { path: '/customers',        icon: Users,         label: 'Customers' },
      { path: '/supplier-summary', icon: Users,         label: 'Suppliers (RAW)' },
      { path: '/lead-manager',     icon: MessageCircle, label: 'Leads' },
      { path: '/export-management',icon: FileDown,      label: 'Export' },
      { path: '/audit-log',        icon: Activity,      label: 'Activity' },
      { path: '/standard-reports', icon: FileText,      label: 'Reports' },
    ],
  },
  {
    title: 'System',
    items: [
      { path: '/settings', icon: Settings,    label: 'Settings' },
      { path: '/help',     icon: HelpCircle,  label: 'Help' },
    ],
  },
];

const isActive = (pathname, itemPath) => {
  if (itemPath === '/') return pathname === '/';
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
};

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate  = useNavigate();
  const [fabOpen,  setFabOpen]  = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const disabledPaths = useModuleSettingsStore((state) => state.disabledPaths);

  const quickAdd = useMemo(
    () => QUICK_ADD.filter((a) => !disabledPaths.includes(a.modulePath)),
    [disabledPaths]
  );

  const menuSections = useMemo(() => {
    const disabled = new Set(disabledPaths);
    return MENU_SECTIONS
      .map((section) => ({ ...section, items: section.items.filter((item) => !disabled.has(item.path)) }))
      .filter((section) => section.items.length > 0);
  }, [disabledPaths]);

  const handleNav = (path) => {
    setFabOpen(false);
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* ── Backdrops ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {(fabOpen || menuOpen) && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => { setFabOpen(false); setMenuOpen(false); }}
          />
        )}
      </AnimatePresence>

      {/* ── Quick-add bubbles ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {fabOpen && (
          <motion.div
            key="quick-add"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 lg:hidden"
          >
            {quickAdd.map((a, i) => (
              <motion.button
                key={a.path}
                initial={{ opacity: 0, scale: 0.7, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.7, y: 10 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleNav(a.path)}
                className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg px-4 py-2.5 min-w-[160px]"
              >
                <div className={`w-8 h-8 ${a.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <a.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{a.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Full menu bottom sheet ─────────────────────────────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="menu-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl z-50 lg:hidden max-h-[80vh] flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800">
              <span className="text-base font-bold text-gray-900 dark:text-gray-100">Menu</span>
              <button
                onClick={() => setMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
              >
                <X size={16} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Scrollable sections */}
            <div className="overflow-y-auto flex-1 px-4 pb-6 pt-2">
              {menuSections.map((section) => (
                <div key={section.title} className="mb-4">
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-2 mb-1.5">
                    {section.title}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {section.items.map((item) => {
                      const active = isActive(location.pathname, item.path);
                      return (
                        <button
                          key={item.path}
                          onClick={() => handleNav(item.path)}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-colors ${
                            active
                              ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600'
                              : 'bg-gray-50 dark:bg-gray-800 text-gray-600 active:bg-gray-100 dark:active:bg-gray-700'
                          }`}
                        >
                          <item.icon size={20} className={active ? 'text-primary-600' : 'text-gray-500'} />
                          <span className={`text-[10px] font-semibold text-center leading-tight ${active ? 'text-primary-600' : 'text-gray-600'}`}>
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom bar ────────────────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
        {/* Glass bar */}
        <div
          className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/60 dark:border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-2"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="flex items-center justify-around h-16">
            {NAV_ITEMS.map((item, i) => {
              // Centre FAB slot
              if (item === null) {
                return (
                  <div key="fab" className="relative -top-4">
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      onClick={() => { setMenuOpen(false); setFabOpen(v => !v); }}
                      className={`w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center transition-all ${
                        fabOpen
                          ? 'bg-gray-800 shadow-gray-900/40'
                          : 'bg-gradient-to-br from-primary-500 to-primary-600 shadow-primary-500/40'
                      }`}
                    >
                      <motion.div animate={{ rotate: fabOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
                        <Plus className="w-6 h-6 text-white" />
                      </motion.div>
                    </motion.button>
                  </div>
                );
              }

              const active = isActive(location.pathname, item.path);

              return (
                <button
                  key={item.path}
                  onClick={() => { setFabOpen(false); setMenuOpen(false); navigate(item.path); }}
                  className="flex flex-col items-center gap-1 px-3 py-1 relative"
                >
                  <div className={`relative p-1.5 rounded-xl transition-colors ${active ? 'bg-primary-50' : ''}`}>
                    <item.icon
                      size={22}
                      className={`transition-colors ${active ? 'text-primary-600' : 'text-gray-400'}`}
                    />
                    {active && (
                      <motion.div
                        layoutId="nav-dot"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-600 rounded-full"
                      />
                    )}
                  </div>
                  <span className={`text-[10px] font-semibold transition-colors ${active ? 'text-primary-600' : 'text-gray-400'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}

            {/* Menu button (5th slot) */}
            <button
              onClick={() => { setFabOpen(false); setMenuOpen(v => !v); }}
              className="flex flex-col items-center gap-1 px-3 py-1"
            >
              <div className={`p-1.5 rounded-xl transition-colors ${menuOpen ? 'bg-primary-50' : ''}`}>
                <Menu size={22} className={menuOpen ? 'text-primary-600' : 'text-gray-400'} />
              </div>
              <span className={`text-[10px] font-semibold ${menuOpen ? 'text-primary-600' : 'text-gray-400'}`}>
                More
              </span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
