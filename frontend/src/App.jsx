import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './context/authStore';
import { useThemeStore } from './context/themeStore';
import { useCompanyStore } from './context/companyStore';
import { useModuleSettingsStore } from './context/moduleSettingsStore';
import ErrorBoundary from './components/ErrorBoundary';

// Layouts
import MainLayout from './components/layouts/MainLayout';
import AuthLayout from './components/layouts/AuthLayout';

// Pages
import Login from './pages/auth/Login';
import NotFound from './pages/NotFound';

// Phase 2 - Raw Purchase Management
import RawPurchaseList from './pages/RawPurchaseList';
import RawPurchaseEntry from './pages/RawPurchaseEntry';
import SupplierSummary from './pages/SupplierSummary';

// Phase 3 - Processing & Workers
import WorkerList from './pages/WorkerList';
import WorkerEntry from './pages/WorkerEntry';
import JobWorkList from './pages/JobWorkList';
import JobWorkEntry from './pages/JobWorkEntry';
import DailyWorkList from './pages/DailyWorkList';
import DailyWorkEntry from './pages/DailyWorkEntry';
import WorkerAdvances from './pages/WorkerAdvances';

// Phase 4 - Finished Goods, Yield & Stock
import BatchList from './pages/BatchList';
import BatchEntry from './pages/BatchEntry';
import YieldEntry from './pages/YieldEntry';
import FinishedGoodsStock from './pages/FinishedGoodsStock';

// Phase 5 - Sales & Orders Management
import CustomerList from './pages/CustomerList';
import CustomerEntry from './pages/CustomerEntry';
import SalesOrderList from './pages/SalesOrderList';
import SalesOrderEntry from './pages/SalesOrderEntry';
import SalesPayments from './pages/SalesPayments';
import OutstandingReport from './pages/OutstandingReport';
import SalesReports from './pages/SalesReports';

// Phase 6 - Expenses & Overall Profit Management
import ExpenseList from './pages/ExpenseList';
import ExpenseEntry from './pages/ExpenseEntry';
import ExpenseReports from './pages/ExpenseReports';
import ProfitDashboard from './pages/ProfitDashboard';

// Phase 7 - Reports & Owner Summary Dashboard
import OwnerDashboard from './pages/OwnerDashboard';
import StandardReports from './pages/StandardReports';
import ExceptionReports from './pages/ExceptionReports';
import Help from './pages/Help';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

// Payment Management
import PaymentsManagement from './pages/PaymentsManagement';
import PaymentReconciliation from './pages/PaymentReconciliation';
import PaymentReminders from './pages/PaymentReminders';
import PaymentAnalytics from './pages/PaymentAnalytics';

// Data Backup & Import
import BackupManagement from './pages/BackupManagement';

// Enhanced Dashboard
import EnhancedDashboard from './pages/EnhancedDashboard';

// Export Management
import ExportManagement from './pages/ExportManagement';

// Lead Manager
import LeadManager from './pages/LeadManager';

// Audit Log
import AuditLog from './pages/AuditLog';

// Loans & Capital
import LoanDashboard from './pages/LoanDashboard';
import LoanList from './pages/LoanList';
import LoanEntry from './pages/LoanEntry';
import LoanRepayments from './pages/LoanRepayments';
import CapitalInvestments from './pages/CapitalInvestments';

// Phase 1 - Grade System, Attendance/Payroll, Ledgers
import GradeManagement from './pages/GradeManagement';
import AttendanceEntry from './pages/AttendanceEntry';
import PayrollDashboard from './pages/PayrollDashboard';
import WorkerPayrollDetail from './pages/WorkerPayrollDetail';
import CustomerLedger from './pages/CustomerLedger';
import SupplierLedger from './pages/SupplierLedger';

// Accounting
import BalanceSheet    from './pages/BalanceSheet';
import FixedAssets     from './pages/FixedAssets';
import DebtorsSummary  from './pages/DebtorsSummary';
import VendorsPayable  from './pages/VendorsPayable';

// Automation
import AutomationCenter from './pages/AutomationCenter';

// Phase 3 - Compliance & Growth
import GSTReports from './pages/GSTReports';
import PrintInvoice from './pages/PrintInvoice';
import SeasonPlanning from './pages/SeasonPlanning';
import SeasonEntry from './pages/SeasonEntry';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  const { initTheme } = useThemeStore();
  const { isAuthenticated } = useAuthStore();
  const { loadCompanyInfo } = useCompanyStore();
  const { loadModuleSettings } = useModuleSettingsStore();

  useEffect(() => { initTheme(); }, [initTheme]);
  useEffect(() => {
    if (isAuthenticated) {
      loadCompanyInfo().catch(() => {});
      loadModuleSettings().catch(() => {});
    }
  }, [isAuthenticated, loadCompanyInfo, loadModuleSettings]);

  return (
    <ErrorBoundary>
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<EnhancedDashboard />} />

        {/* Phase 2 - Raw Purchase Management */}
        <Route path="raw-purchases" element={<RawPurchaseList />} />
        <Route path="raw-purchases/new" element={<RawPurchaseEntry />} />
        <Route path="raw-purchases/edit/:id" element={<RawPurchaseEntry />} />
        <Route path="supplier-summary" element={<SupplierSummary />} />

        {/* Phase 3 - Processing & Workers */}
        <Route path="workers" element={<WorkerList />} />
        <Route path="workers/new" element={<WorkerEntry />} />
        <Route path="workers/edit/:id" element={<WorkerEntry />} />
        <Route path="job-work" element={<JobWorkList />} />
        <Route path="job-work/new" element={<JobWorkEntry />} />
        <Route path="job-work/edit/:id" element={<JobWorkEntry />} />
        <Route path="daily-work" element={<DailyWorkList />} />
        <Route path="daily-work/new" element={<DailyWorkEntry />} />
        <Route path="daily-work/edit/:id" element={<DailyWorkEntry />} />
        <Route path="worker-advances" element={<WorkerAdvances />} />

        {/* Phase 4 - Finished Goods, Yield & Stock */}
        <Route path="batches" element={<BatchList />} />
        <Route path="batches/new" element={<BatchEntry />} />
        <Route path="batches/edit/:id" element={<BatchEntry />} />
        <Route path="batches/yield/:id" element={<YieldEntry />} />
        <Route path="finished-goods-stock" element={<FinishedGoodsStock />} />

        {/* Phase 5 - Sales & Orders Management */}
        <Route path="customers" element={<CustomerList />} />
        <Route path="customers/new" element={<CustomerEntry />} />
        <Route path="customers/edit/:id" element={<CustomerEntry />} />
        <Route path="sales-orders" element={<SalesOrderList />} />
        <Route path="sales-orders/new" element={<SalesOrderEntry />} />
        <Route path="sales-payments" element={<SalesPayments />} />
        <Route path="outstanding-report" element={<OutstandingReport />} />
        <Route path="sales-reports" element={<SalesReports />} />

        {/* Phase 6 - Expenses & Overall Profit Management */}
        <Route path="expenses" element={<ExpenseList />} />
        <Route path="expenses/new" element={<ExpenseEntry />} />
        <Route path="expenses/edit/:id" element={<ExpenseEntry />} />
        <Route path="expense-reports" element={<ExpenseReports />} />
        <Route path="profit-dashboard" element={<ProfitDashboard />} />

        {/* Phase 7 - Reports & Owner Summary Dashboard */}
        <Route path="owner-dashboard" element={<OwnerDashboard />} />
        <Route path="standard-reports" element={<StandardReports />} />
        <Route path="exception-reports" element={<ExceptionReports />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="help" element={<Help />} />
        <Route path="settings" element={<Settings />} />

        {/* Payment Management */}
        <Route path="payments-management" element={<PaymentsManagement />} />
        <Route path="payment-reconciliation" element={<PaymentReconciliation />} />
        <Route path="payment-reminders" element={<PaymentReminders />} />
        <Route path="payment-analytics" element={<PaymentAnalytics />} />

        {/* Data Backup & Import */}
        <Route path="backup-management" element={<BackupManagement />} />

        {/* Export Management */}
        <Route path="export-management" element={<ExportManagement />} />

        {/* Lead Manager */}
        <Route path="lead-manager" element={<LeadManager />} />

        {/* Audit Log */}
        <Route path="audit-log" element={<AuditLog />} />

        {/* Automation Center */}
        <Route path="automation" element={<AutomationCenter />} />

        {/* Loans & Capital */}
        <Route path="loan-dashboard" element={<LoanDashboard />} />
        <Route path="loans" element={<LoanList />} />
        <Route path="loans/new" element={<LoanEntry />} />
        <Route path="loans/edit/:id" element={<LoanEntry />} />
        <Route path="loan-repayments" element={<LoanRepayments />} />
        <Route path="capital-investments" element={<CapitalInvestments />} />
        <Route path="capital-investments/new" element={<CapitalInvestments />} />

        {/* Accounting */}
        <Route path="balance-sheet"   element={<BalanceSheet />} />
        <Route path="fixed-assets"    element={<FixedAssets />} />
        <Route path="debtors-summary" element={<DebtorsSummary />} />
        <Route path="vendors-payable" element={<VendorsPayable />} />

        {/* Phase 1 - Grade System */}
        <Route path="grade-management" element={<GradeManagement />} />

        {/* Phase 1 - Attendance & Payroll */}
        <Route path="attendance" element={<AttendanceEntry />} />
        <Route path="payroll" element={<PayrollDashboard />} />
        <Route path="payroll/worker/:workerId" element={<WorkerPayrollDetail />} />

        {/* Phase 1 - Customer & Supplier Ledgers */}
        <Route path="customer-ledger" element={<CustomerLedger />} />
        <Route path="supplier-ledger" element={<SupplierLedger />} />

        {/* Phase 3 - Compliance & Growth */}
        <Route path="gst-reports" element={<GSTReports />} />
        <Route path="invoice/:id" element={<PrintInvoice />} />
        <Route path="season-planning" element={<SeasonPlanning />} />
        <Route path="seasons/new" element={<SeasonEntry />} />
        <Route path="seasons/edit/:id" element={<SeasonEntry />} />

      </Route>

      {/* 404 Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    </ErrorBoundary>
  );
}

export default App;
