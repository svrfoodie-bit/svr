import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle, LayoutDashboard, Package, Users, Briefcase, ClipboardList,
  Wallet, Factory, Archive, ShoppingCart, IndianRupee, AlertTriangle,
  BarChart3, Receipt, TrendingUp, DollarSign, FileText, ChevronDown,
  CalendarCheck, BookOpen, Package2, Sun, ScrollText, Printer,
  Building2, CreditCard, PiggyBank, Activity, MessageCircle, FileDown,
  Truck, Search,
} from 'lucide-react';
import { useCompanyStore } from '../context/companyStore';

const COLORS = {
  blue:    { bg: 'bg-blue-50',    border: 'border-blue-200',    icon: 'bg-blue-100 text-blue-600',    title: 'text-blue-900' },
  green:   { bg: 'bg-green-50',   border: 'border-green-200',   icon: 'bg-green-100 text-green-600',   title: 'text-green-900' },
  purple:  { bg: 'bg-purple-50',  border: 'border-purple-200',  icon: 'bg-purple-100 text-purple-600',  title: 'text-purple-900' },
  orange:  { bg: 'bg-orange-50',  border: 'border-orange-200',  icon: 'bg-orange-100 text-orange-600',  title: 'text-orange-900' },
  teal:    { bg: 'bg-teal-50',    border: 'border-teal-200',    icon: 'bg-teal-100 text-teal-600',    title: 'text-teal-900' },
  red:     { bg: 'bg-red-50',     border: 'border-red-200',     icon: 'bg-red-100 text-red-600',     title: 'text-red-900' },
  indigo:  { bg: 'bg-indigo-50',  border: 'border-indigo-200',  icon: 'bg-indigo-100 text-indigo-600',  title: 'text-indigo-900' },
  amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   icon: 'bg-amber-100 text-amber-600',   title: 'text-amber-900' },
  primary: { bg: 'bg-primary-50', border: 'border-primary-200', icon: 'bg-primary-100 text-primary-600', title: 'text-primary-900' },
  gray:    { bg: 'bg-gray-50',    border: 'border-gray-200',    icon: 'bg-gray-100 text-gray-600',    title: 'text-gray-900' },
};

const sections = [
  {
    id: 'overview',
    title: 'Application Overview',
    icon: HelpCircle,
    color: 'blue',
    group: 'Getting Started',
    steps: [
      { label: 'What is SVR Cashew Management System?', desc: 'A complete end-to-end business management software built for cashew processing factories. It covers every stage of your business — from buying raw cashews to selling finished products, managing workers, tracking expenses, generating GST reports, and planning seasons.' },
      { label: 'Who is it for?', desc: 'Factory owners, managers, accountants, and any staff involved in day-to-day cashew business operations.' },
      { label: 'How to navigate?', desc: 'Use the left sidebar to move between modules. The sidebar is grouped into sections: Operations, Sales, Finance, HR & Accounts, Compliance, and Utilities. Click a section header to expand its sub-menu items.' },
      { label: 'Sidebar collapse', desc: 'Click the arrow button at the top of the sidebar to collapse it into icon-only mode, giving you more screen space.' },
    ],
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
    color: 'primary',
    group: 'Getting Started',
    steps: [
      { label: 'What the Dashboard shows', desc: 'The Dashboard is the home screen. It shows your business health at a glance — total sales, purchases, profit/loss, stock levels, pending payments, and recent activity.' },
      { label: 'Quick action buttons', desc: 'Use the shortcut buttons on the dashboard to quickly jump to New Sale, New Purchase, Add Expense, or Record Payment without going through the sidebar.' },
      { label: 'Alerts & notifications', desc: 'The dashboard highlights important items that need attention — low stock warnings, overdue payments, and pending tasks.' },
      { label: 'Analytics cards', desc: 'Each card on the dashboard shows a key metric. Click on a card to go directly to the related module for more details.' },
    ],
  },
  {
    id: 'raw-purchase',
    title: 'Raw Purchase',
    icon: Package,
    color: 'purple',
    group: 'Operations',
    steps: [
      { label: 'What is Raw Purchase?', desc: 'Record all purchases of unprocessed raw cashews (RCN — Raw Cashew Nuts) bought from farmers or suppliers.' },
      { label: 'How to add a new purchase', desc: 'Go to Operations → Raw Purchase → click "New Purchase". Fill in the supplier name, date, quantity (kg), rate per kg, and payment mode. The total amount is auto-calculated.' },
      { label: 'Payment status tracking', desc: 'Enter how much you paid immediately. The remaining balance is automatically tracked as "pending" against that supplier.' },
      { label: 'Supplier (RAW) Summary', desc: 'Go to Utilities → Suppliers (RAW) to see a consolidated view of all raw purchases from each raw supplier, total amounts, and outstanding balances.' },
      { label: 'Edit or delete', desc: 'Click the edit (pencil) icon on any purchase to modify it. Use the delete (trash) icon to remove an entry.' },
    ],
  },
  {
    id: 'workers',
    title: 'Workers',
    icon: Users,
    color: 'green',
    group: 'Operations',
    steps: [
      { label: 'What is Workers module?', desc: 'Maintain a master list of all workers employed in your factory — full-time, part-time, or contract workers.' },
      { label: 'Adding a new worker', desc: 'Go to Operations → Workers → click "New Worker". Fill in the worker\'s name, phone number, area of work (e.g., Shelling, Peeling, Grading), daily wage rate, and joining date.' },
      { label: 'Worker status', desc: 'Each worker can be marked as Active or Inactive. Only Active workers appear in Attendance and Payroll.' },
      { label: 'Worker Advances', desc: 'Go to Finance → Worker Advances to record advance payments made to workers. These advances are deducted automatically when payroll is generated.' },
    ],
  },
  {
    id: 'job-work',
    title: 'Job Work',
    icon: Briefcase,
    color: 'orange',
    group: 'Operations',
    steps: [
      { label: 'What is Job Work?', desc: 'Job Work is when you give raw or semi-processed cashews to an external processing unit (sub-contractor) and pay them per kg for processing — shelling, peeling, grading, etc.' },
      { label: 'How to record Job Work', desc: 'Go to Operations → Job Work → New Job Work. Enter the worker/contractor name, quantity given (kg), rate per kg, and processing type.' },
      { label: 'Tracking returned goods', desc: 'After processing, record the quantity received back. The system tracks the difference (wastage) and calculates the amount payable.' },
      { label: 'Job Work list', desc: 'View all job work entries, filter by date or contractor, and see total amounts paid and pending.' },
    ],
  },
  {
    id: 'daily-work',
    title: 'Daily Work',
    icon: ClipboardList,
    color: 'teal',
    group: 'Operations',
    steps: [
      { label: 'What is Daily Work?', desc: 'Record the daily in-house processing work done by your own factory workers — how much cashew was processed, by whom, and how much they earned.' },
      { label: 'How to add a Daily Work entry', desc: 'Go to Operations → Daily Work → New Daily Work. Select the worker, enter quantity processed (kg), rate per kg, and date.' },
      { label: 'Difference from Job Work', desc: 'Job Work is for external contractors. Daily Work is for your own workers doing in-house piece-rate work.' },
      { label: 'Daily Work list', desc: 'View all entries, filter by date or worker, and see total amounts.' },
    ],
  },
  {
    id: 'processing',
    title: 'Production Batches',
    icon: Factory,
    color: 'indigo',
    group: 'Operations',
    steps: [
      { label: 'What is a Batch?', desc: 'A batch is a set of raw cashews you process together. It tracks the input (raw cashews) and output (finished cashew kernels by grade).' },
      { label: 'Creating a batch', desc: 'Go to Operations → Processing → New Batch. Enter the batch number, raw cashew quantity, processing start date, and assigned worker group.' },
      { label: 'Output Entry', desc: 'After production is complete, open the batch and click "Add Output". Record how many kg of each grade came out.' },
      { label: 'Yield percentage', desc: 'The system automatically calculates your yield percentage — e.g., if you input 100 kg raw and get 25 kg finished, yield = 25%. This helps identify processing efficiency.' },
      { label: 'Finished Stock update', desc: 'After yield entry, the finished goods stock is automatically updated for each grade.' },
    ],
  },
  {
    id: 'finished-stock',
    title: 'Finished Goods Stock',
    icon: Archive,
    color: 'gray',
    group: 'Operations',
    steps: [
      { label: 'What is Finished Stock?', desc: 'This page shows the current available stock of processed cashew kernels, grade-wise (Full Kaju, Split Kaju, Pieces, Chura, etc.).' },
      { label: 'How stock is updated', desc: 'Stock increases automatically when you record yield from a batch. Stock decreases automatically when a sales order is confirmed/delivered.' },
      { label: 'Stock by grade', desc: 'Each grade is shown separately with quantity in kg and estimated value at the current grade price.' },
      { label: 'Why track by grade?', desc: 'Different grades have very different prices. Full Kaju usually has the highest value, while Chura is the lowest. Tracking by grade ensures accurate valuation.' },
    ],
  },
  {
    id: 'customers',
    title: 'Customers',
    icon: Users,
    color: 'blue',
    group: 'Sales',
    steps: [
      { label: 'What is Customers module?', desc: 'Maintain a master list of all your buyers — wholesale dealers, retail shops, exporters, or direct customers.' },
      { label: 'Adding a customer', desc: 'Go to Sales → Customers → New Customer. Fill in name, phone, email, address, and customer type (Wholesale/Retail/Export).' },
      { label: 'Customer types', desc: 'Wholesale: bulk buyers. Retail: small quantity buyers. Export: customers who buy for export. The type helps you filter and report sales separately.' },
      { label: 'Editing customer details', desc: 'Click the edit icon on any customer to update their contact information. Customer history (all orders) is linked and preserved.' },
    ],
  },
  {
    id: 'sales-orders',
    title: 'Sales Orders',
    icon: ShoppingCart,
    color: 'green',
    group: 'Sales',
    steps: [
      { label: 'What is a Sales Order?', desc: 'A sales order records every sale you make — what grade you sold, to whom, how much quantity, at what rate, and the total amount.' },
      { label: 'Creating a sales order', desc: 'Go to Sales → Sales Orders → New Order. Select the customer, cashew grade, quantity (kg), rate per kg. Total is auto-calculated.' },
      { label: 'Order status', desc: 'Orders move through stages: Pending → Confirmed → Dispatched → Delivered. Update the status as the order progresses.' },
      { label: 'Print Invoice', desc: 'On any sales order, click the Printer icon to generate a professional GST Tax Invoice (with CGST + SGST breakdown, payment history, and terms). You can print it directly.' },
      { label: 'Outstanding Report', desc: 'Go to Sales → Outstanding to see all customers with unpaid or partially paid orders.' },
    ],
  },
  {
    id: 'sales-payments',
    title: 'Sales Payments',
    icon: IndianRupee,
    color: 'green',
    group: 'Sales',
    steps: [
      { label: 'What is Sales Payments?', desc: 'Record all payment collections against sales orders. A single order can have multiple partial payments.' },
      { label: 'Recording a payment', desc: 'Go to Sales → Payments. Select the customer, the sales order, enter amount received, payment mode (Cash/NEFT/UPI/Cheque), date, and reference number.' },
      { label: 'Payment modes', desc: 'Supported modes: Cash, NEFT, RTGS, UPI, Cheque. Always add the reference/UTR number for digital payments so you can reconcile later.' },
      { label: 'Outstanding tracking', desc: 'After recording a payment, the outstanding balance on the order reduces automatically. When fully paid, the order is marked as Paid.' },
    ],
  },
  {
    id: 'expenses',
    title: 'Expenses',
    icon: Receipt,
    color: 'red',
    group: 'Finance',
    steps: [
      { label: 'What are Expenses?', desc: 'Record all factory running costs — electricity, packaging material, transport, rent, repairs, miscellaneous, etc.' },
      { label: 'Adding an expense', desc: 'Go to Finance → Expenses → New Expense. Select the category, enter amount, date, and a short description/note.' },
      { label: 'Expense categories', desc: 'Predefined categories include: Electricity, Rent, Transport, Labour, Packaging, Maintenance, Raw Material (other), and Miscellaneous.' },
      { label: 'Expense Reports', desc: 'Go to Finance → Reports → Expenses to see a period-wise breakdown of all expense categories. Use this to identify where you are spending most.' },
    ],
  },
  {
    id: 'profit',
    title: 'Profit & Loss / Owner Dashboard',
    icon: TrendingUp,
    color: 'primary',
    group: 'Finance',
    steps: [
      { label: 'Profit & Loss Dashboard', desc: 'Go to Finance → Profit & Loss. This shows total revenue (sales), total cost (raw purchases + wages + expenses), and net profit for any selected period.' },
      { label: 'How profit is calculated', desc: 'Net Profit = Total Sales Revenue − Raw Purchase Cost − Worker Wages − Job Work Costs − Other Expenses.' },
      { label: 'Owner Dashboard', desc: 'Go to Finance → Owner Summary for a high-level view of the entire business — capital invested, profit earned, cash flow, and outstanding amounts (both payable and receivable).' },
      { label: 'Date range filter', desc: 'All financial reports support custom date ranges. Use the From/To date filter to see weekly, monthly, or yearly figures.' },
    ],
  },
  {
    id: 'worker-advances',
    title: 'Worker Advances',
    icon: Wallet,
    color: 'amber',
    group: 'Finance',
    steps: [
      { label: 'What are Worker Advances?', desc: 'When a worker asks for money in advance before their salary is due, record it here. Advances are automatically deducted when payroll is generated.' },
      { label: 'Recording an advance', desc: 'Go to Finance → Worker Advances. Select the worker, enter the advance amount and date. Add a note if needed.' },
      { label: 'Advance recovery', desc: 'When you generate payroll for that month, the system shows pending advances and deducts them from the salary. Mark as recovered once deducted.' },
      { label: 'Advance status', desc: 'Each advance shows its status: Pending (not yet deducted) or Recovered (already deducted from payroll).' },
    ],
  },
  {
    id: 'loans',
    title: 'Loans & Capital',
    icon: Building2,
    color: 'indigo',
    group: 'Finance',
    steps: [
      { label: 'Loans module', desc: 'Track all business loans — bank loans, NBFC loans, or private loans. Record lender name, principal amount, interest rate, and tenure.' },
      { label: 'Loan repayments', desc: 'Go to Finance → Loans & Capital → Repayments to record each EMI or lump-sum repayment made. Outstanding principal updates automatically.' },
      { label: 'Capital Investments', desc: 'Record owner capital injected into the business. Helps in calculating return on investment and net worth.' },
      { label: 'Loan Dashboard', desc: 'See all active loans, total outstanding, next EMI due date, and monthly interest burden at a glance.' },
    ],
  },
  {
    id: 'payments-mgmt',
    title: 'Payments Management',
    icon: CreditCard,
    color: 'teal',
    group: 'Finance',
    steps: [
      { label: 'All Payments view', desc: 'See every payment collected from customers in one place — filter by date, customer, or payment mode.' },
      { label: 'Reconciliation', desc: 'Go to Finance → Payments → Reconciliation to match bank statement entries with recorded payments. Identify any unmatched transactions.' },
      { label: 'Reminders', desc: 'Finance → Payments → Reminders shows customers with overdue outstanding amounts. Use this to follow up on collections.' },
      { label: 'Payment Analytics', desc: 'Charts and breakdowns of payment modes (cash vs digital), collection trends, and slow-paying customers.' },
    ],
  },
  {
    id: 'attendance',
    title: 'Attendance',
    icon: CalendarCheck,
    color: 'green',
    group: 'HR & Accounts',
    steps: [
      { label: 'What is Attendance?', desc: 'Mark daily attendance for all your factory workers — Present, Absent, or Half Day. This directly feeds into monthly payroll calculation.' },
      { label: 'How to mark attendance', desc: 'Go to HR & Accounts → Attendance. Select the date. You will see all active workers listed. Click the status button (P / A / H) for each worker.' },
      { label: 'Bulk save', desc: 'After marking all workers, click "Save Attendance" to save all records at once for that date.' },
      { label: 'Editing past attendance', desc: 'Open the Attendance page and select a past date to correct any incorrectly marked attendance.' },
      { label: 'Impact on payroll', desc: 'Payroll is auto-calculated based on attendance. More present days = higher salary for daily-wage workers.' },
    ],
  },
  {
    id: 'payroll',
    title: 'Payroll',
    icon: DollarSign,
    color: 'green',
    group: 'HR & Accounts',
    steps: [
      { label: 'What is Payroll?', desc: 'Calculate and manage monthly salary for all workers based on their attendance, daily wage rate, and any advances deducted.' },
      { label: 'Generating payroll', desc: 'Go to HR & Accounts → Payroll. Select the month and year. Click "Generate" next to each worker to calculate their salary for that month.' },
      { label: 'How salary is calculated', desc: 'Salary = (Days Present + Half Days × 0.5) × Daily Wage Rate − Pending Advances.' },
      { label: 'Marking as paid', desc: 'After you pay the worker, click "Mark Paid" to update the payroll status. This creates a payment record for your accounts.' },
      { label: 'Payroll history', desc: 'Past months\'s payroll is saved and accessible any time. You can review what was paid to any worker in any previous month.' },
    ],
  },
  {
    id: 'customer-ledger',
    title: 'Customer Ledger',
    icon: BookOpen,
    color: 'blue',
    group: 'HR & Accounts',
    steps: [
      { label: 'What is Customer Ledger?', desc: 'A complete account statement for each customer — every sales order (debit) and every payment received (credit), with running balance.' },
      { label: 'How to view a ledger', desc: 'Go to HR & Accounts → Ledgers → Customer Ledger. Select a customer from the left panel. Their full statement appears on the right.' },
      { label: 'Outstanding summary', desc: 'The left panel shows all customers with their current outstanding balance. Red indicates unpaid amount.' },
      { label: 'Date range filter', desc: 'Use the From/To date filter to narrow down the ledger to a specific period (e.g., this month or last quarter).' },
      { label: 'Running balance', desc: 'Each row shows the cumulative balance after that transaction, just like a bank passbook.' },
    ],
  },
  {
    id: 'supplier-ledger',
    title: 'Supplier (RAW) Ledger',
    icon: Truck,
    color: 'purple',
    group: 'HR & Accounts',
    steps: [
      { label: 'What is Supplier (RAW) Ledger?', desc: 'A complete account statement for each raw supplier — every raw purchase (debit) and every payment made (credit), with running balance.' },
      { label: 'How to view', desc: 'Go to HR & Accounts → Ledgers → Supplier (RAW) Ledger. Select a raw supplier from the left panel to see their full transaction history.' },
      { label: 'How it helps', desc: 'Quickly see how much you owe to each raw supplier, whether any payment was missed, and total business done with them.' },
    ],
  },
  {
    id: 'grade-management',
    title: 'Grade Management',
    icon: Package2,
    color: 'indigo',
    group: 'HR & Accounts',
    steps: [
      { label: 'What is Grade Management?', desc: 'Manage standard reference prices for each cashew grade (Full Kaju, Split Kaju, 4 Pieces, 8 Pieces, Chura). These prices are used for stock valuation and sales order reference.' },
      { label: 'Cashew grades explained', desc: 'Full Kaju is whole kaju, Split Kaju is half pieces, 4 Pieces and 8 Pieces are smaller broken grades, and Chura is small bits.' },
      { label: 'Editing prices', desc: 'Click "Edit Price" on any grade card to update the standard price, minimum price, and maximum price. Save to apply.' },
      { label: 'Stock by Grade tab', desc: 'Switch to the "Stock by Grade" tab to see current available stock and stock value for each grade.' },
      { label: 'Price Range', desc: 'Min/Max prices are useful as reference when creating sales orders — the system can warn if you sell below minimum price.' },
    ],
  },
  {
    id: 'gst-reports',
    title: 'GST Reports',
    icon: ScrollText,
    color: 'orange',
    group: 'Compliance',
    steps: [
      { label: 'What is GST Reports?', desc: 'Generate GST-compliant reports for filing your monthly returns. Cashew kernels fall under HSN code 0801 with 5% GST (CGST 2.5% + SGST 2.5%).' },
      { label: 'GSTR-3B Summary tab', desc: 'Shows net GST payable for the selected month: Output Tax (on sales) minus Input Tax Credit (on purchases). This is the amount you need to pay to the government.' },
      { label: 'Output Tax tab', desc: 'Lists all sales orders for the selected month with taxable value, CGST, and SGST columns — ready for GSTR-1 filing.' },
      { label: 'Input Tax Credit tab', desc: 'Lists all raw purchases for the selected month with ITC claimable — for purchases from GST-registered suppliers.' },
      { label: 'HSN Summary tab', desc: 'HSN-wise aggregated output tax summary as required for GSTR-1 HSN table.' },
      { label: 'Printing reports', desc: 'Click the "Print Report" button on any tab to print a formatted GST report for your records or CA.' },
    ],
  },
  {
    id: 'print-invoice',
    title: 'Print / Tax Invoice',
    icon: Printer,
    color: 'gray',
    group: 'Compliance',
    steps: [
      { label: 'How to print an invoice', desc: 'Go to Sales → Sales Orders. Find the order you want to invoice. Click the Printer icon on that row. A formatted Tax Invoice opens.' },
      { label: 'What is on the invoice', desc: 'The invoice shows: your business name and address, customer details, HSN code (0801), quantity, rate, taxable value, CGST 2.5%, SGST 2.5%, total invoice value, and payment history.' },
      { label: 'Invoice number', desc: 'Each invoice uses the Sales Order ID as the invoice number (e.g., INV-0001). This is consistent and traceable.' },
      { label: 'Printing', desc: 'Click "Print Invoice" on the invoice page to send it to your printer. The print layout is formatted for A4 paper.' },
      { label: 'Amount in words', desc: 'The invoice includes the total amount written in words, as required for formal invoices.' },
    ],
  },
  {
    id: 'season-planning',
    title: 'Season Planning',
    icon: Sun,
    color: 'amber',
    group: 'Compliance',
    steps: [
      { label: 'What is Season Planning?', desc: 'Cashew procurement happens in seasons (e.g., Kharif season, Main season). This module lets you plan targets and automatically tracks actual performance vs targets.' },
      { label: 'Creating a season plan', desc: 'Go to Compliance → Season Planning → New Season. Enter the season name, start date, end date, target procurement (kg), target revenue (₹), total budget, and expected number of workers.' },
      { label: 'Progress tracking', desc: 'Each season card shows progress bars for: Procurement achieved vs target, Revenue achieved vs target, Budget used vs total budget.' },
      { label: 'Actuals are auto-calculated', desc: 'The system automatically pulls actual procurement (from Raw Purchases), actual revenue (from Sales Orders), and actual expenses for the season\'s date range. You don\'t need to update them manually.' },
      { label: 'Profit / Loss per season', desc: 'Each season card shows the net profit or loss for that season based on actual revenue minus actual costs.' },
      { label: 'Season status', desc: 'Seasons have 4 statuses: Planned (upcoming), Active (in progress), Completed (finished), Cancelled.' },
    ],
  },
  {
    id: 'reports',
    title: 'Reports',
    icon: FileText,
    color: 'primary',
    group: 'Reports',
    steps: [
      { label: 'Standard Reports', desc: 'Pre-built reports: Purchase Summary, Sales Summary, Worker Payment Summary, Batch Yield Report, and Stock Report. Filter by date range and export.' },
      { label: 'Sales Reports', desc: 'Detailed sales analysis — customer-wise, grade-wise, month-wise. Identify best-selling grades and top customers.' },
      { label: 'Expense Reports', desc: 'Category-wise breakdown of all expenses. Compare months to see where costs are rising.' },
      { label: 'Exception Reports', desc: 'Flags anomalies — sales below minimum grade price, unusually low yield batches, large outstanding amounts, etc.' },
      { label: 'Analytics', desc: 'Trend charts and graphs for revenue, procurement, and profit over time. Useful for monthly reviews and planning.' },
    ],
  },
  {
    id: 'utilities',
    title: 'Utilities & Settings',
    icon: Activity,
    color: 'gray',
    group: 'Utilities',
    steps: [
      { label: 'Export Management', desc: 'Export any data (purchases, sales, payroll, etc.) to Excel or CSV for sharing with your accountant or CA.' },
      { label: 'Backup Management', desc: 'Download a full database backup of all your business data. Recommended: take a backup weekly and store it safely.' },
      { label: 'Lead Manager', desc: 'Track potential new customers. Add leads with contact info and follow-up notes. Convert them to customers when they place an order.' },
      { label: 'Audit Log / Activity Log', desc: 'View a full history of who made what changes in the system — useful for tracking errors and unauthorized changes.' },
      { label: 'Settings', desc: 'Configure your business name, address, GST number, and other profile details used on invoices and reports.' },
    ],
  },
];

const GROUPS = ['Getting Started', 'Operations', 'Sales', 'Finance', 'HR & Accounts', 'Compliance', 'Reports', 'Utilities'];

const Help = () => {
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState('All');
  const companyName = useCompanyStore((state) => state.companyInfo.companyName);
  const systemName = `${companyName} Management System`;
  const withCompanyName = (text) => text.replaceAll('SVR Cashew Management System', systemName);

  const toggle = (id) => setExpanded(p => p === id ? null : id);

  const filtered = sections.filter(s => {
    const matchGroup = activeGroup === 'All' || s.group === activeGroup;
    const q = search.toLowerCase();
    const matchSearch = !q || s.title.toLowerCase().includes(q) ||
      s.steps.some(st => st.label.toLowerCase().includes(q) || st.desc.toLowerCase().includes(q));
    return matchGroup && matchSearch;
  });

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Help & User Guide</h1>
        <p className="text-sm text-gray-600 mt-1">Complete guide to all modules and features of {systemName}</p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search features, modules, or topics..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
        />
      </div>

      {/* Group filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['All', ...GROUPS].map(g => (
          <button key={g} onClick={() => setActiveGroup(g)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${activeGroup === g ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {g}
          </button>
        ))}
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <HelpCircle size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No results found for "{search}"</p>
            <p className="text-sm mt-1">Try a different keyword</p>
          </div>
        )}
        {filtered.map((s, idx) => {
          const c = COLORS[s.color] || COLORS.blue;
          const isOpen = expanded === s.id;
          return (
            <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className={`border rounded-2xl overflow-hidden ${c.border}`}>
              {/* Header */}
              <button
                onClick={() => toggle(s.id)}
                className={`w-full flex items-center justify-between p-4 text-left transition-colors ${isOpen ? c.bg : 'bg-white hover:bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${c.icon}`}>
                    <s.icon size={18} />
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${isOpen ? c.title : 'text-gray-900'}`}>{s.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.group} • {s.steps.length} topics</p>
                  </div>
                </div>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={16} className="text-gray-400" />
                </motion.div>
              </button>

              {/* Content */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden">
                    <div className={`px-5 pb-5 pt-2 ${c.bg} border-t ${c.border}`}>
                      <div className="space-y-3">
                        {s.steps.map((step, i) => (
                          <div key={i} className="flex gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold ${c.icon}`}>
                              {i + 1}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{withCompanyName(step.label)}</p>
                              <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{withCompanyName(step.desc)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Reference */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="mt-8 bg-primary-50 border border-primary-200 rounded-2xl p-5">
        <h3 className="font-bold text-primary-900 mb-3 flex items-center gap-2">
          <HelpCircle size={18} className="text-primary-600" /> Quick Reference — Common Tasks
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-primary-800">
          {[
            ['Record a raw cashew purchase', 'Operations → Raw Purchase → New Purchase'],
            ['Create a sales order', 'Sales → Sales Orders → New Order'],
            ['Print a customer invoice', 'Sales → Sales Orders → click Printer icon on order'],
            ['Mark daily attendance', 'HR & Accounts → Attendance → select date → mark P/A/H'],
            ['Generate monthly payroll', 'HR & Accounts → Payroll → select month → Generate'],
            ['View customer outstanding', 'HR & Accounts → Ledgers → Customer Ledger'],
            ['Check GST for the month', 'Compliance → GST Reports → select month'],
            ['Plan a new cashew season', 'Compliance → Season Planning → New Season'],
            ['View stock by grade', 'HR & Accounts → Grade Prices → Stock by Grade tab'],
            ['Enter batch yield', 'Operations → Processing → open batch → Enter Yield'],
          ].map(([task, path]) => (
            <div key={task} className="flex gap-2">
              <span className="text-primary-400 flex-shrink-0">→</span>
              <span><span className="font-medium">{task}:</span> <span className="text-primary-600">{path}</span></span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Contact */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="mt-4 bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center">
        <p className="text-sm font-semibold text-gray-700">Need more help?</p>
        <p className="text-sm text-gray-500 mt-1">Contact your system administrator or technical support for assistance with account access and permissions.</p>
      </motion.div>
    </div>
  );
};

export default Help;
