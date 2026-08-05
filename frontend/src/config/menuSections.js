import {
  LayoutDashboard,
  Package,
  Briefcase,
  DollarSign,
  FileText,
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

// badge: 'daily' | 'often' | undefined
// The first section (no title) is always visible and not user-toggleable.
export const menuSections = [
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
