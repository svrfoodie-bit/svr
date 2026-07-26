import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Briefcase,
  DollarSign,
  FileText,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Users,
  BarChart3,
  Wallet,
  Factory,
  Archive,
  ShoppingCart,
  IndianRupee,
  AlertTriangle,
  Receipt,
  CreditCard,
  Link as LinkIcon,
  Bell,
  FileDown,
  MessageCircle,
  ClipboardList,
  Activity,
  Building2,
  PiggyBank,
  Package2,
  CalendarCheck,
  BookOpen,
  Truck,
  Sun,
  ScrollText,
  Scale,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../../assets/images/svr logo.jpg';
import { SYSTEM_SUBTITLE, useCompanyStore } from '../../context/companyStore';

// badge: 'daily' | 'often' | undefined
const menuSections = [
  // ── Always visible ────────────────────────────────────────────────────────
  {
    items: [
      { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },

  // ── DAILY — used every working day ───────────────────────────────────────
  {
    title: 'Daily',
    items: [
      { path: '/daily-work',      icon: ClipboardList, label: 'Daily Work',        badge: 'daily' },
      { path: '/attendance',      icon: CalendarCheck, label: 'Attendance',        badge: 'daily' },
      { path: '/raw-purchases',   icon: Package,       label: 'Raw Purchase',      badge: 'daily' },
      { path: '/expenses',        icon: Receipt,       label: 'Expenses',          badge: 'daily' },
      { path: '/sales-orders',    icon: ShoppingCart,  label: 'Sales',             badge: 'daily' },
      { path: '/sales-payments',  icon: IndianRupee,   label: 'Sales Receipts',    badge: 'daily' },
    ],
  },

  // ── OPERATIONS — a few times a week ──────────────────────────────────────
  {
    title: 'Operations',
    items: [
      { path: '/job-work',              icon: Briefcase, label: 'Job Work',         badge: 'often' },
      { path: '/batches',               icon: Factory,   label: 'Production',       badge: 'often' },
      { path: '/finished-goods-stock',  icon: Archive,   label: 'Finished Stock',   badge: 'often' },
      { path: '/workers',               icon: Users,     label: 'Workers'           },
      { path: '/worker-advances',       icon: Wallet,    label: 'Worker Advances'   },
      { path: '/supplier-summary',      icon: Truck,     label: 'Suppliers (RAW)'   },
      { path: '/grade-management',      icon: Package2,  label: 'Cashew Grades'     },
    ],
  },

  // ── SALES & TRACKING ─────────────────────────────────────────────────────
  {
    title: 'Sales',
    items: [
      { path: '/customers',          icon: Users,         label: 'Customers'             },
      { path: '/outstanding-report', icon: AlertTriangle, label: 'Outstanding',         badge: 'often' },
      { path: '/profit-dashboard',   icon: TrendingUp,    label: 'Profit & Loss',        badge: 'often' },
    ],
  },

  // ── ACCOUNTS — monthly review ─────────────────────────────────────────────
  {
    title: 'Accounts',
    items: [
      { path: '/balance-sheet',   icon: Scale,      label: 'Balance Sheet'   },
      { path: '/debtors-summary', icon: Users,      label: 'Customer Dues'  },
      { path: '/vendors-payable', icon: Truck,      label: 'Supplier (RAW) Dues' },
      {
        label: 'Ledgers',
        icon: BookOpen,
        submenu: [
          { path: '/customer-ledger', label: 'Customer Ledger', icon: Users  },
          { path: '/supplier-ledger', label: 'Supplier (RAW) Ledger', icon: Truck  },
        ],
      },
      { path: '/payroll', icon: Wallet, label: 'Payroll' },
    ],
  },

  // ── MANAGEMENT — owner / periodic use ────────────────────────────────────
  {
    title: 'Management',
    items: [
      { path: '/owner-dashboard', icon: DollarSign, label: 'Owner View'    },
      { path: '/fixed-assets',    icon: Factory,    label: 'Fixed Assets'  },
      {
        label: 'Loans & Capital',
        icon: Building2,
        submenu: [
          { path: '/loan-dashboard',      label: 'Overview',      icon: TrendingUp  },
          { path: '/loans',               label: 'Loans',         icon: Building2   },
          { path: '/loan-repayments',     label: 'Repayments',    icon: IndianRupee },
          { path: '/capital-investments', label: 'Investments',   icon: PiggyBank   },
        ],
      },
      {
        label: 'Reports',
        icon: FileText,
        submenu: [
          { path: '/standard-reports',  label: 'Standard',   icon: FileText      },
          { path: '/exception-reports', label: 'Exceptions', icon: AlertTriangle },
          { path: '/sales-reports',     label: 'Sales',      icon: BarChart3     },
          { path: '/expense-reports',   label: 'Expenses',   icon: Receipt       },
        ],
      },
      { path: '/gst-reports', icon: ScrollText, label: 'GST' },
    ],
  },

  // ── SYSTEM — admin / rarely used ─────────────────────────────────────────
  {
    title: 'System',
    items: [
      { path: '/lead-manager',    icon: MessageCircle, label: 'Leads'   },
      { path: '/season-planning', icon: Sun,           label: 'Seasons' },
      {
        label: 'Payments',
        icon: CreditCard,
        submenu: [
          { path: '/payments-management',    label: 'All Payments',     icon: CreditCard },
          { path: '/payment-reconciliation', label: 'Reconciliation',   icon: LinkIcon   },
          { path: '/payment-reminders',      label: 'Reminders',        icon: Bell       },
          { path: '/payment-analytics',      label: 'Insights',         icon: BarChart3  },
        ],
      },
      { path: '/automation',        icon: Zap,      label: 'Automation'    },
      { path: '/export-management', icon: FileDown, label: 'Export'        },
      { path: '/backup-management', icon: Archive,  label: 'Backups'       },
      { path: '/audit-log',         icon: Activity, label: 'Activity'      },
    ],
  },
];

const isPathActive = (pathname, itemPath) => {
  if (itemPath === '/') return pathname === '/';
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
};

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const companyName = useCompanyStore((state) => state.companyInfo.companyName);
  const [expandedMenus, setExpandedMenus] = useState({});
  const [isCollapsed, setIsCollapsed] = useState(false);

  const allItems = useMemo(() => menuSections.flatMap((s) => s.items), []);

  // Auto-expand submenu of active route
  useEffect(() => {
    const active = {};
    allItems.forEach((item) => {
      if (item.submenu?.some((sub) => isPathActive(location.pathname, sub.path))) {
        active[item.label] = true;
      }
    });
    setExpandedMenus((prev) => ({ ...prev, ...active }));
  }, [location.pathname, allItems]);

  const handleNavClick = () => {
    if (window.innerWidth < 1024) setIsOpen(false);
  };

  const toggleMenu = (label) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setExpandedMenus((prev) => ({ ...prev, [label]: true }));
      return;
    }
    setExpandedMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? (isCollapsed ? 68 : 260) : 0, opacity: isOpen ? 1 : 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="bg-gray-900 text-white overflow-hidden shadow-2xl relative border-r border-gray-800 flex-shrink-0"
    >
      <div className="h-full flex flex-col">

        {/* Logo + Collapse Toggle */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-gray-800">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <img src={logo} alt="SVR" className="w-8 h-8 rounded-lg ring-1 ring-primary-500/40 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-white leading-tight truncate">{companyName}</p>
                <p className="text-[10px] text-gray-500 truncate">{SYSTEM_SUBTITLE}</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <img src={logo} alt="SVR" className="w-8 h-8 rounded-lg ring-1 ring-primary-500/40 mx-auto" />
          )}
          <button
            onClick={() => { setIsCollapsed(p => !p); if (!isCollapsed) setExpandedMenus({}); }}
            className="hidden lg:flex items-center justify-center w-6 h-6 rounded-md hover:bg-gray-700 text-gray-400 hover:text-white transition-colors flex-shrink-0"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>


        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 scrollbar-sidebar">
          {menuSections.map((section, si) => (
            <div key={si}>
              {/* Section divider */}
              {section.title && !isCollapsed && (
                <p className="px-2 pt-3 pb-1 text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                  {section.title}
                </p>
              )}
              {section.title && isCollapsed && si > 0 && (
                <div className="my-2 border-t border-gray-800" />
              )}

              {section.items.map((item) => {
                const submenuActive = item.submenu?.some((sub) => isPathActive(location.pathname, sub.path));

                // Submenu item
                if (item.submenu) {
                  return (
                    <div key={item.label}>
                      <button
                        onClick={() => toggleMenu(item.label)}
                        title={isCollapsed ? item.label : ''}
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-2.5 px-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                          submenuActive
                            ? 'bg-gray-800 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <item.icon size={16} className="flex-shrink-0" />
                          {!isCollapsed && <span>{item.label}</span>}
                        </div>
                        {!isCollapsed && (
                          <motion.div animate={{ rotate: expandedMenus[item.label] ? 180 : 0 }} transition={{ duration: 0.2 }}>
                            <ChevronDown size={13} className="text-gray-600" />
                          </motion.div>
                        )}
                      </button>

                      <AnimatePresence>
                        {expandedMenus[item.label] && !isCollapsed && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden ml-4 pl-3 border-l border-gray-800 mt-0.5 mb-1 space-y-0.5"
                          >
                            {item.submenu.map((sub) => (
                              <NavLink
                                key={sub.path}
                                to={sub.path}
                                onClick={handleNavClick}
                                className={({ isActive }) =>
                                  `flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                    isActive
                                      ? 'bg-primary-600 text-white'
                                      : 'text-gray-500 hover:text-white hover:bg-gray-800'
                                  }`
                                }
                              >
                                <sub.icon size={13} className="flex-shrink-0" />
                                <span>{sub.label}</span>
                              </NavLink>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }

                // Direct link
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={handleNavClick}
                    title={isCollapsed ? item.label : ''}
                    className={({ isActive }) =>
                      `flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'} px-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary-600 text-white shadow-md shadow-primary-900/40'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                      }`
                    }
                  >
                    <item.icon size={16} className="flex-shrink-0" />
                    {!isCollapsed && <span>{item.label}</span>}
                    {!isCollapsed && item.badge && (
                      <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                        item.badge === 'daily'
                          ? 'bg-green-500 text-white'
                          : 'bg-amber-400 text-amber-900'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>


      </div>
    </motion.aside>
  );
};

export default Sidebar;
