# SVR Cashew Management - Feature Documentation

## Recent Feature Additions

### ✅ Comprehensive Export Functionality
Added Excel (CSV) and PDF export capabilities across all major pages in the application.

#### Pages with Export Functionality:

**Report Pages:**
- **Expense Reports** ([ExpenseReports.jsx](frontend/src/pages/ExpenseReports.jsx))
  - Excel/PDF export with payment mode breakdown
  - Includes transaction tracking details

- **Sales Reports** ([SalesReports.jsx](frontend/src/pages/SalesReports.jsx))
  - Customer-wise and grade-wise sales data
  - Payment collection breakdown by method

- **Standard Reports** ([StandardReports.jsx](frontend/src/pages/StandardReports.jsx))
  - Print functionality for all standard business reports
  - Context-aware print button

**List Pages:**
- **Raw Purchase List** ([RawPurchaseList.jsx](frontend/src/pages/RawPurchaseList.jsx))
  - Full purchase details with payment tracking

- **Job Work List** ([JobWorkList.jsx](frontend/src/pages/JobWorkList.jsx))
  - Comprehensive job work data with loss tracking

- **Sales Order List** ([SalesOrderList.jsx](frontend/src/pages/SalesOrderList.jsx))
  - Complete order details with payment status

- **Expense List** ([ExpenseList.jsx](frontend/src/pages/ExpenseList.jsx))
  - All expenses with transaction details

#### Export Features:
- **Excel Export (CSV format)**
  - Includes metadata header with date range and generation timestamp
  - Proper handling of commas and special characters
  - Timestamped filenames for easy organization

- **PDF Export**
  - Professional formatting with company header
  - Summary metrics cards for key KPIs
  - Detailed data tables
  - Print-optimized styling

### ✅ Custom Date Range Filter

#### DateRangePicker Component
Location: [frontend/src/components/DateRangePicker.jsx](frontend/src/components/DateRangePicker.jsx)

A reusable component that provides:
- **Preset Time Ranges:**
  - Today
  - This Week
  - This Month
  - All Time (optional)

- **Custom Date Selection:**
  - Visual modal with date pickers
  - Start and end date validation
  - Maximum date limit (today)
  - Smart date range display

#### Usage Example:
```jsx
import DateRangePicker from '../components/DateRangePicker';

const MyComponent = () => {
  const [timeRange, setTimeRange] = useState('MONTH');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  return (
    <DateRangePicker
      timeRange={timeRange}
      startDate={startDate}
      endDate={endDate}
      onTimeRangeChange={setTimeRange}
      onCustomDateChange={(start, end) => {
        setStartDate(start);
        setEndDate(end);
        setTimeRange('CUSTOM');
      }}
      showAllTime={true}
    />
  );
};
```

#### Integration Status:
- ✅ **Sales Reports** - Fully integrated with custom date range support
- 🔄 **Expense Reports** - Ready for integration
- 🔄 **Raw Purchase List** - Ready for integration
- 🔄 **Job Work List** - Ready for integration
- 🔄 **Sales Order List** - Ready for integration
- 🔄 **Expense List** - Ready for integration

### ✅ Export Utilities Enhancement

Location: [frontend/src/utils/exportUtils.js](frontend/src/utils/exportUtils.js)

Enhanced export utilities now support:
- Custom date ranges via `{ startDate, endDate }` parameter
- Preset time ranges via `{ timeRange }` parameter
- Automatic date range formatting in exports
- Comprehensive validation

#### Available Functions:
1. **exportToExcel(data, filename, filters)**
   - Exports data to CSV format
   - Includes metadata header
   - Handles special characters

2. **exportToPDF(title, data, summary, filters)**
   - Generates formatted PDF via print dialog
   - Includes summary metrics
   - Professional styling

3. **validateExportFilters(filters)**
   - Validates date range inputs
   - Returns boolean

4. **formatDataForExport(data, fields)**
   - Formats nested objects for export
   - Handles arrays

---

## UI/UX Enhancements

### Responsive Design
- Export buttons show only icons on mobile devices (`hidden sm:inline`)
- Button text appears on larger screens
- Proper wrapping with `flex-wrap` for small screens

### Visual Feedback
- Toast notifications for all export operations
- Disabled states when loading or no data available
- Loading indicators during export generation

### Color Coding
- **Green** - Excel export button
- **Red** - PDF export button
- Consistent across all pages

---

## Technical Implementation

### State Management
All pages with custom date range support maintain:
```javascript
const [timeRange, setTimeRange] = useState('MONTH');
const [startDate, setStartDate] = useState('');
const [endDate, setEndDate] = useState('');
```

### Data Fetching Pattern
```javascript
const filters = timeRange === 'CUSTOM'
  ? { startDate, endDate }
  : { timeRange };

const data = await service.getData(filters);
```

### Export Pattern
```javascript
const handleExport = () => {
  const filters = timeRange === 'CUSTOM'
    ? { startDate, endDate }
    : { timeRange };

  exportToExcel(data, 'Filename', filters);
};
```

---

## Payment Tracking Integration

All exports now include comprehensive payment tracking:
- **Payment Modes:** Cash, PhonePe, Bank Transfer
- **Transaction IDs** for digital payments
- **Bank Names** for bank transfers
- **Payment Status:** Paid, Partial, Pending/Credit
- **Outstanding Balances**

---

## ✅ Payment Management Module (Option D)

### Payments Management Page
Location: [frontend/src/pages/PaymentsManagement.jsx](frontend/src/pages/PaymentsManagement.jsx)

A comprehensive payment management system that consolidates all payment data from across the application into a single, powerful interface.

#### Key Features:

**1. Consolidated Payment View**
- Unified view of ALL payments from all modules:
  - Raw Purchase payments
  - Job Work payments
  - Sales Order payments
  - Expense payments
- Real-time data aggregation from multiple sources
- Chronological sorting (newest first)

**2. Advanced Filtering System**
- **Date Range Filtering** - Custom date ranges using DateRangePicker component
- **Module Filter** - Filter by Raw Purchase, Job Work, Sales, or Expenses
- **Payment Mode Filter** - Filter by Cash, PhonePe, or Bank Transfer
- **Payment Status Filter** - Filter by Paid, Partial, Pending, or Credit
- **Search Functionality** - Search by party name, reference number, transaction ID, or description

**3. Comprehensive Metrics Dashboard**
- **Total Collections** - Sum of all collected payments
- **Total Outstanding** - Sum of all pending amounts
- **Cash Collections** - Total cash payments
- **PhonePe Collections** - Total digital wallet payments
- **Bank Collections** - Total bank transfer payments
- **Total Transactions** - Count of all payment transactions

**4. Payment Mode Breakdown**
- Visual cards showing collections by payment method
- Individual tracking for Cash, PhonePe, and Bank transfers
- Real-time calculation based on active filters

**5. Detailed Payment Table**
Displays comprehensive information for each payment:
- Transaction date
- Module/source of payment
- Reference number (Purchase No, Job Work No, Order No, etc.)
- Party name (Farmer, Processor, Customer, Vendor)
- Description of transaction
- Payment mode with transaction ID and bank details
- Payment amount
- Payment status badge
- Outstanding amount (if applicable)

**6. Export Functionality**
- **Excel Export** - Export filtered payment data to CSV
- **PDF Export** - Generate professional PDF reports
- Includes all active filters in export metadata
- Summary metrics included in PDF exports

#### Data Transformation:

The page intelligently transforms data from different modules into a unified format:

```javascript
// Unified Payment Structure
{
  id: 'RP-{purchaseId}-{transactionId}',
  module: 'Raw Purchase',
  moduleType: 'RAW_PURCHASE',
  date: '2024-01-15',
  party: 'Farmer Name',
  amount: 50000,
  paymentMode: 'CASH',
  transactionId: 'TXN123',
  bankName: 'SBI',
  status: 'PAID',
  totalAmount: 100000,
  paidAmount: 50000,
  outstandingAmount: 50000,
  referenceNo: 'RP-001',
  description: 'Raw Cashew Purchase - 100 bags'
}
```

#### UI/UX Features:

- **Responsive Design** - Mobile-friendly with adaptive layouts
- **Animated Transitions** - Smooth Framer Motion animations
- **Color-Coded Status Badges** - Visual payment status indicators
- **Payment Mode Badges** - Distinct colors for each payment method
- **Real-time Filtering** - Instant updates when filters change
- **Loading States** - Spinner during data fetch
- **Empty States** - User-friendly message when no data found
- **Toast Notifications** - Success/error feedback for exports

#### Integration:

The page integrates with existing services:
- `rawPurchaseService.getAll(filters)` - Fetch raw purchase data
- `jobWorkService.getAll(filters)` - Fetch job work data
- `salesOrderService.getAll(filters)` - Fetch sales order data
- `expenseService.getAll(filters)` - Fetch expense data

All services support date range filtering via `{ startDate, endDate }` or `{ timeRange }` parameters.

#### Navigation:

Accessible via:
- URL: `/payments-management`
- Sidebar: "Payment Management > All Payments" menu item
- Located in the main navigation under Payment Management section

---

### Payment Reconciliation Page
Location: [frontend/src/pages/PaymentReconciliation.jsx](frontend/src/pages/PaymentReconciliation.jsx)

A powerful reconciliation tool that matches invoices with received payments to identify discrepancies and unmatched transactions.

#### Key Features:

**1. Invoice-Payment Matching**
- Automatic matching of invoices to payments
- Real-time reconciliation status tracking
- Identifies matched, unmatched, and partially matched invoices
- Tracks payment transactions per invoice

**2. Reconciliation Status Categories**
- **MATCHED** - Invoice fully paid (received amount >= invoice amount)
- **PARTIAL** - Invoice partially paid (some payment received)
- **UNMATCHED** - No payments received yet

**3. Discrepancy Detection**
- **UNDERPAID** - Payment received less than invoice amount
- **OVERPAID** - Payment received more than invoice amount
- **NONE** - Exact match between invoice and payment
- Calculates and displays discrepancy amounts

**4. Comprehensive Metrics**
- Total invoices count
- Matched invoices count
- Unmatched invoices count
- Partially matched invoices count
- Total invoice amount
- Total received amount
- Total discrepancy amount

**5. Advanced Filtering**
- Filter by module (Raw Purchase, Job Work, Sales)
- Filter by reconciliation status
- Search by party name or reference number
- Date range filtering

**6. Detailed Reconciliation View**
- Invoice date and reference number
- Party information
- Invoice amount vs received amount
- Discrepancy calculation with type
- Payment count per invoice
- Last payment date tracking

**7. Export Capabilities**
- Excel export with full reconciliation details
- PDF export with summary metrics
- Includes discrepancy analysis

#### Navigation:
- URL: `/payment-reconciliation`
- Sidebar: "Payment Management > Reconciliation" menu item

---

### Payment Reminders Page
Location: [frontend/src/pages/PaymentReminders.jsx](frontend/src/pages/PaymentReminders.jsx)

An intelligent reminder system for tracking and managing outstanding payment obligations with urgency-based prioritization.

#### Key Features:

**1. Urgency-Based Classification**
- **OVERDUE** - Payments pending for more than 30 days (Critical)
- **DUE_SOON** - Payments pending for 15-30 days (Warning)
- **UPCOMING** - Payments pending for less than 15 days (Recent)
- Automatic urgency calculation based on invoice age

**2. Outstanding Payment Tracking**
- Only displays invoices with outstanding balances
- Filters out fully paid invoices automatically
- Tracks days pending for each payment
- Monitors last payment date

**3. Comprehensive Metrics Dashboard**
- **Overdue Count** - Critical payments requiring immediate attention
- **Due Soon Count** - Payments approaching critical status
- **Upcoming Count** - Recent outstanding payments
- **Total Overdue Amount** - Sum of critical outstanding balances
- **Total Due Soon Amount** - Sum of warning-level balances
- **Total Outstanding** - Complete outstanding balance across all categories

**4. Contact Information Integration**
- Displays party contact numbers
- Quick access to contact details for follow-up
- Transaction description for context

**5. Multi-Channel Reminder Actions**
- **SMS Reminder** - Send text message reminders
- **Email Reminder** - Send email notifications
- **WhatsApp Reminder** - Send WhatsApp messages
- One-click reminder sending (integration ready)

**6. Smart Filtering System**
- Filter by urgency level (Overdue, Due Soon, Upcoming)
- Filter by module type
- Search by party name, reference number, or contact
- Date range filtering for invoice dates

**7. Visual Priority Indicators**
- Color-coded urgency badges (Red/Yellow/Blue)
- Days pending counter with calendar icon
- Outstanding amount highlighting
- Payment ratio display (paid vs total)

**8. Export Functionality**
- Excel export with urgency classification
- Complete outstanding payment reports
- Contact information included for follow-ups

#### Urgency Calculation Logic:
```javascript
// OVERDUE: More than 30 days old
if (daysPending > 30) return 'OVERDUE';

// DUE_SOON: 15-30 days old
if (daysPending > 15) return 'DUE_SOON';

// UPCOMING: Less than 15 days old
return 'UPCOMING';
```

#### Integration Points:
The reminder system integrates with:
- Raw Purchase outstanding balances
- Job Work outstanding payments
- Sales Order outstanding collections

Future integration planned for:
- SMS gateway for automated reminders
- Email service for notification delivery
- WhatsApp Business API for messaging

#### Navigation:
- URL: `/payment-reminders`
- Sidebar: "Payment Management > Reminders" menu item

---

### Payment Analytics Page
Location: [frontend/src/pages/PaymentAnalytics.jsx](frontend/src/pages/PaymentAnalytics.jsx)

A comprehensive analytics dashboard providing deep insights into payment patterns, cash flow, and financial trends.

#### Key Features:

**1. Cash Flow Analysis**
- **Total Inflow** - All collections from sales
- **Total Outflow** - All payments (purchases, job work, expenses)
- **Net Cash Flow** - Difference between inflow and outflow
- **Cash Flow Trend** - POSITIVE, NEGATIVE, or NEUTRAL indicator
- Visual trend indicators with color coding

**2. Payment Mode Analysis**
Breakdown by payment method (Cash, PhonePe, Bank):
- Inflow amount per payment mode
- Outflow amount per payment mode
- Net cash flow per payment mode
- Comparative analysis across modes

**3. Module-wise Financial Breakdown**
- **Sales Inflow** - Revenue from customer payments
- **Raw Purchase Outflow** - Payments to suppliers
- **Job Work Outflow** - Processor payments
- **Expense Outflow** - Operating expenses
- Percentage distribution of each module
- Visual representation with color-coded bars

**4. Collection Efficiency Metrics**
- **Total Invoiced** - Sum of all sales invoices
- **Total Collected** - Actual collections received
- **Collection Rate** - Percentage of invoices collected
- Visual progress bar with color coding

**5. Outstanding Analysis**
- **Total Outstanding** - All pending collections
- **Overdue Outstanding** - Critical payments (30+ days old)
- **Overdue Ratio** - Percentage of outstanding that is overdue

**6. Export Capabilities**
- Excel export of all analytics metrics
- Complete financial summary

#### Navigation:
- URL: `/payment-analytics`
- Sidebar: "Payment Management > Analytics" menu item

---

## Future Enhancements (Roadmap)

### Option B: Additional Features ✅ COMPLETED
- [x] **Email Export** - Send reports directly via email ✅ COMPLETED
- [x] **Scheduled Reports** - Automated daily/weekly/monthly reports ✅ COMPLETED
- [x] **Export Templates** - Customizable export column selection ✅ COMPLETED
- [x] **Export History** - Track when reports were exported ✅ COMPLETED

### Option C: Enhanced Dashboard ✅ COMPLETED
- [x] **Main Dashboard** - Key metrics from all modules ✅ COMPLETED
- [x] **Visual Charts** - Using Recharts library ✅ COMPLETED
- [x] **Quick Actions** - Common task shortcuts ✅ COMPLETED

### Option D: Payment Management ✅ FULLY COMPLETED
- [x] **Payments Page** - Consolidated view of all payments ✅ COMPLETED
- [x] **Payment Reconciliation** - Match payments to invoices ✅ COMPLETED
- [x] **Payment Reminders** - Automated reminders for outstanding balances ✅ COMPLETED
- [x] **Payment Analytics** - Advanced insights and trends ✅ COMPLETED

### Option E: User Management
- [ ] **User Roles** - Admin, Manager, Viewer
- [ ] **Permission System** - Role-based access control
- [ ] **Audit Logs** - Track all system changes

### Option F: Data Backup & Import ✅ COMPLETED
- [x] **Backup Management Dashboard** - Complete backup interface ✅ COMPLETED
- [x] **Manual Backup Creation** - On-demand backup generation ✅ COMPLETED
- [x] **Automatic Backup System** - Scheduled backups with retention ✅ COMPLETED
- [x] **Backup Download** - Download backups for offline storage ✅ COMPLETED
- [x] **Data Restore** - Restore from backup with confirmation ✅ COMPLETED
- [x] **Import Data** - Upload and import backup files ✅ COMPLETED
- [x] **Backup History** - Complete backup tracking and management ✅ COMPLETED

---

## ✅ Export Management Module (Option B)

### Export Management Page
Location: [frontend/src/pages/ExportManagement.jsx](frontend/src/pages/ExportManagement.jsx)

A comprehensive export management system with email delivery, scheduled reports, customizable templates, and complete export history tracking.

#### Key Features:

**1. Email Export**
Send reports directly to email addresses with customizable options:

**Features:**
- **Module Selection** - Choose from Sales, Payments, Raw Purchase, Job Work, Expenses, Customers
- **Format Options** - Excel (CSV) or PDF document
- **Multiple Recipients** - Comma-separated email list support
- **Custom Subject** - Personalized email subject lines
- **Message Body** - Optional custom message in email
- **Include Charts** - Option to include visualizations in PDF exports
- **Real-time Sending** - Instant report generation and delivery
- **Success Notifications** - Toast confirmations on successful send
- **Form Validation** - Required field checking

**UI Components:**
- Blue gradient header with Mail icon
- Two-column form layout (responsive)
- Dropdown selectors for module and format
- Text inputs for recipients and subject
- Textarea for message body
- Checkbox for chart inclusion
- Send and Reset action buttons
- Loading state during email send

**2. Scheduled Reports**
Automated report generation and delivery system:

**Features:**
- **Create Schedules** - Define recurring report deliveries
- **Schedule Management** - Edit, pause/activate, delete schedules
- **Frequency Options** - Daily, Weekly, Monthly intervals
- **Time Configuration** - Set specific delivery time (24-hour format)
- **Module Selection** - Any report module
- **Format Choice** - Excel or PDF
- **Email Recipients** - Multiple recipient support
- **Status Tracking** - Active or Paused states
- **Last Run Display** - When schedule last executed
- **Next Run Calculation** - Automatic next run time display

**Schedule Table Columns:**
- Report Name - Custom schedule identifier
- Module - Data source module
- Frequency - Recurrence pattern with time
- Next Run - Calculated next execution
- Status - Active/Paused with icon badges
- Actions - Pause/Activate, Edit, Delete buttons

**Status Indicators:**
- Green badge with CheckCircle - ACTIVE schedules
- Gray badge with XCircle - PAUSED schedules

**3. Export Templates**
Customizable export column and filter configurations:

**Features:**
- **Template Creation** - Save custom export configurations
- **Column Selection** - Choose which fields to export
- **Filter Presets** - Save commonly used filters
- **Default Template** - Mark one template as default
- **Template Management** - Delete templates
- **Module Association** - Templates linked to specific modules
- **Creation Date Tracking** - When template was created

**Template Card Display:**
- Template name and module
- Column count and preview (first 3 columns shown)
- Default badge for default template
- Creation date
- Set Default and Delete actions

**Template Grid:**
- Responsive 1-3 column layout
- Hover shadow effects
- Color-coded badges
- Quick action buttons

**4. Export History**
Complete audit trail of all export activities:

**Features:**
- **Activity Tracking** - Record all export operations
- **Type Classification** - EMAIL, SCHEDULED, MANUAL
- **Filter by Type** - Dropdown filter for history view
- **Success/Failure Status** - Track export outcomes
- **Record Count** - Number of rows exported
- **File Size** - Export file size in KB
- **Timestamp** - When export was executed
- **Executed By** - User or System attribution
- **Error Logging** - Failure reasons stored
- **Download Option** - Re-download previous exports
- **View Details** - Inspect export parameters

**History Table Columns:**
- Timestamp - Date/time and executor
- Type - Email/Scheduled/Manual badge
- Module - Data source
- Format - Excel or PDF
- Recipients - Email addresses (for email exports)
- Records - Row count and file size
- Status - Success/Failed with icons
- Actions - Download and View buttons

**Status Badges:**
- Green with CheckCircle - SUCCESS exports
- Red with AlertCircle - FAILED exports with error message

**Type Color Coding:**
- Blue - EMAIL exports
- Purple - SCHEDULED exports
- Gray - MANUAL exports

#### Navigation:

Accessible via:
- URL: `/export-management`
- Sidebar: "Export Management" menu item (with "New" badge)
- FileDown icon in navigation

#### Tab-Based Interface:

**Four Main Tabs:**
1. **Email Export** - Direct email sending
2. **Scheduled Reports** - Automation setup
3. **Export Templates** - Configuration management
4. **Export History** - Activity tracking

**Tab Features:**
- Gradient active state (primary to secondary)
- Icon + label display
- Responsive overflow handling
- Smooth transitions

#### Data State Management:

**Email Form State:**
```javascript
{
  module: 'SALES',
  format: 'EXCEL',
  recipients: '',
  subject: '',
  message: '',
  includeCharts: false
}
```

**Schedule State:**
```javascript
{
  id, name, module, frequency, time,
  format, recipients, status,
  lastRun, nextRun
}
```

**Template State:**
```javascript
{
  id, name, module, columns,
  filters, isDefault, createdAt
}
```

**History State:**
```javascript
{
  id, type, module, format, recipients,
  status, recordCount, fileSize,
  timestamp, executedBy, error
}
```

#### Business Logic:

**Email Export Flow:**
1. Validate required fields (recipients, subject)
2. Show sending state with spinner
3. Simulate API call (2 second delay)
4. Add to export history
5. Show success toast
6. Reset form

**Schedule Management:**
- Create new schedules with modal form
- Edit existing schedules
- Toggle Active/Paused status
- Delete with confirmation
- Calculate next run based on frequency

**Template Management:**
- Create templates with column picker
- Set one default template per module
- Delete templates (with confirmation)
- Store filters and column config

**History Tracking:**
- Auto-record all export operations
- Track success/failure status
- Log error messages for failures
- Filter by export type
- Download previous exports

#### UI/UX Features:

**Design Elements:**
- Tab-based navigation for organization
- Color-coded type badges
- Status indicators with icons
- Gradient action buttons
- Hover effects on cards/rows
- Loading states during operations
- Toast notifications for feedback
- Responsive grid layouts
- Shadow elevations on cards

**Color Scheme:**
- Blue - Email export
- Purple - Scheduled reports
- Green - Templates and success
- Orange - History
- Red - Failures and delete actions
- Gray - Neutral states

**Icons Used:**
- Mail - Email export
- Calendar - Scheduled reports
- FileText - Templates
- Database - History
- Plus - Create new
- Edit2 - Edit
- Trash2 - Delete
- Send - Send email
- Download - Download export
- Eye - View details
- CheckCircle - Success
- XCircle - Paused/Failed
- AlertCircle - Errors
- Clock - Time/frequency
- Table - Template columns

#### Mock Data:

The page includes realistic mock data for demonstration:
- 3 sample scheduled reports (Daily, Weekly, Monthly)
- 3 sample export templates
- 4 sample history records (mix of success/failure)

**Production Implementation:**
- Connect to backend export API
- Integrate email service (SendGrid, AWS SES, etc.)
- Implement cron job for scheduled reports
- Store templates in database
- Persist history in database

#### Integration Points:

**Required Backend APIs:**
```javascript
POST /api/exports/email          // Send email export
GET  /api/exports/schedules      // List schedules
POST /api/exports/schedules      // Create schedule
PUT  /api/exports/schedules/:id  // Update schedule
DELETE /api/exports/schedules/:id // Delete schedule
GET  /api/exports/templates      // List templates
POST /api/exports/templates      // Create template
DELETE /api/exports/templates/:id // Delete template
GET  /api/exports/history        // Export history
GET  /api/exports/download/:id   // Download previous export
```

**Email Service Integration:**
- SMTP configuration for email delivery
- Email templating system
- Attachment handling for reports
- Delivery status tracking
- Bounce/error handling

**Scheduler Integration:**
- Cron job service for schedule execution
- Queue system for reliable delivery
- Retry logic for failures
- Execution logging

#### Future Enhancements:

**Advanced Email Features:**
- Email templates with custom branding
- CC and BCC recipient support
- Inline chart embedding
- HTML email formatting
- Attachment size limits

**Enhanced Scheduling:**
- Multiple time slots per schedule
- Conditional triggers (e.g., only if data changed)
- Holiday skip logic
- Timezone support
- Schedule groups

**Template Improvements:**
- Drag-and-drop column ordering
- Advanced filter builder UI
- Template sharing between users
- Import/export template configs
- Template versioning

**History Enhancements:**
- Advanced search and filtering
- Bulk download of exports
- Retention policy configuration
- Archive old exports
- Export comparison tool

**Additional Features:**
- Slack/Teams integration
- FTP/SFTP delivery
- Cloud storage upload (S3, Drive)
- Report distribution lists
- Export API for programmatic access

#### Backend API Integration - ✅ COMPLETED

**Database Models:**
1. [ExportTemplate.model.js](backend/src/models/ExportTemplate.model.js) - Template CRUD with JSON column handling
2. [ExportHistory.model.js](backend/src/models/ExportHistory.model.js) - Activity tracking with statistics
3. [ExportSchedule.model.js](backend/src/models/ExportSchedule.model.js) - Schedule management with auto next-run calculation

**Services:**
1. [email.service.js](backend/src/services/email.service.js) - Nodemailer SMTP integration
2. [export.service.js](backend/src/services/export.service.js) - ExcelJS & PDFKit file generation
3. [scheduler.service.js](backend/src/services/scheduler.service.js) - Node-cron automated execution

**API Layer:**
1. [export.controller.js](backend/src/controllers/export.controller.js) - All endpoint logic
2. [export.routes.js](backend/src/routes/export.routes.js) - 13 RESTful endpoints

**Frontend Service:**
1. [exportService.js](frontend/src/services/exportService.js) - API integration layer

**Documentation:**
- [BACKEND_API_INTEGRATION_GUIDE.md](BACKEND_API_INTEGRATION_GUIDE.md) - Complete API reference
- [BACKEND_SETUP_GUIDE.md](BACKEND_SETUP_GUIDE.md) - Step-by-step setup instructions

**API Endpoints:** (Base: `/api/v1/exports`)
- `POST /email` - Send email export
- `GET/POST/PUT/DELETE /templates` - Template management
- `PUT /templates/:id/default` - Set default template
- `GET/POST/PUT/DELETE /schedules` - Schedule management
- `PUT /schedules/:id/toggle` - Toggle schedule status
- `GET /history` - Export history with filtering
- `GET /download/:id` - Download export file
- `GET /statistics` - Export statistics

**Key Technologies:**
- Nodemailer for SMTP email sending
- ExcelJS for Excel file generation
- PDFKit for PDF document creation
- Node-cron for automated scheduling
- MySQL JSON columns for flexible storage

---

## ✅ Enhanced Dashboard Module (Option C)

### Enhanced Dashboard Page
Location: [frontend/src/pages/EnhancedDashboard.jsx](frontend/src/pages/EnhancedDashboard.jsx)

A comprehensive, data-driven dashboard that consolidates key metrics from all modules with visual analytics and quick actions for improved business oversight.

#### Key Features:

**1. Real-Time Metrics Dashboard**
Six comprehensive metric cards displaying:
- **Total Revenue** - Sum of all sales with growth indicator
- **Net Profit** - Calculated profit with margin percentage
- **Total Expenses** - Combined expenses across all modules
- **Outstanding Payments** - Pending collections tracking
- **Total Orders** - Sales order count with customer metrics
- **Pending Job Work** - Active job work tracking

Each card features:
- Gradient background with custom colors
- Icon representation
- Trend indicators (up/down/neutral)
- Growth percentage or contextual information
- Animated entrance with Framer Motion

**2. Visual Analytics Charts**

**Revenue vs Expenses Line Chart:**
- Monthly comparison of revenue and expenses
- Dual-line visualization with distinct colors
- Interactive tooltips with formatted currency
- CartesianGrid for better readability
- Responsive design adapting to screen size

**Payment Mode Distribution Pie Chart:**
- Breakdown of collections by payment method (Cash, PhonePe, Bank)
- Percentage-based labels
- Color-coded segments for easy identification
- Interactive tooltips showing actual amounts
- Real-time data from sales transactions

**Module-wise Expenses Bar Chart:**
- Horizontal bar chart showing expense distribution
- Three categories: Raw Purchase, Job Work, Operating Expenses
- Rounded bar corners for modern aesthetics
- Color-coded bars with gradient fills
- Formatted currency tooltips

**3. Quick Actions Panel**
Six convenient shortcuts for common tasks:
- **New Sale** - Direct link to create sales order
- **Raw Purchase** - Quick access to purchase entry
- **Add Expense** - Fast expense recording
- **Job Work** - Job work entry shortcut
- **Payments** - Navigate to payment management
- **Reports** - Access standard reports

Features:
- Grid layout responsive to screen size
- Gradient backgrounds matching action type
- Hover effects with smooth transitions
- Icon-based visual identification
- One-click navigation to target pages

**4. Recent Activity Sections**

**Recent Sales Feed:**
- Latest 5 sales orders displayed
- Shows order number, customer name, amount, and date
- Click to navigate to order details
- Color-coded transaction type icons
- "View All" link for complete history

**Alerts & Notifications Panel:**
- **Outstanding Payments Alert** - Red badge for overdue collections
- **Pending Job Work Alert** - Yellow badge for in-progress jobs
- **Positive Cash Flow** - Green badge for profitable status
- Actionable alerts with navigation buttons
- Dynamic content based on current data

**5. Time Range Filtering**
- Four time range options: DAY, WEEK, MONTH, YEAR
- Instant data refresh on selection
- Applies to all metrics and charts
- Visual indication of active range
- Smooth transition animations

**6. Data Integration**
Real-time data fetched from:
- **Raw Purchase Service** - Purchase transactions and costs
- **Job Work Service** - Processing costs and status
- **Sales Order Service** - Revenue and collections
- **Expense Service** - Operating expenses

All services called in parallel using `Promise.all()` for optimal performance.

**7. Computed Metrics**

**Financial Calculations:**
- Total Revenue = Sum of all sales order amounts
- Total Collected = Sum of received payments
- Total Outstanding = Revenue - Collected
- Raw Purchase Expenses = Sum of purchase amounts
- Job Work Expenses = Sum of job work costs
- Operating Expenses = Sum of expense entries
- Total Expenses = Raw + Job Work + Operating
- Net Profit = Total Collected - Total Expenses
- Profit Margin = (Net Profit / Total Revenue) × 100%

**Operational Metrics:**
- Total Orders = Count of sales orders
- Active Customers = Unique customer count
- Pending Job Work = Jobs with PENDING or IN_PROGRESS status

**8. Responsive Design**
- Mobile-first approach with adaptive layouts
- Grid system adjusting from 1 to 6 columns based on screen size
- Charts automatically resize to container width
- Touch-friendly quick action buttons
- Collapsible navigation for small screens

**9. Performance Optimizations**
- Parallel API calls for faster data loading
- Client-side data processing
- Efficient state management
- Minimal re-renders with React hooks
- Lazy loading for chart libraries

**10. UI/UX Features**
- **Loading States** - Spinner with refresh icon during data fetch
- **Smooth Animations** - Framer Motion for all elements
- **Color Coding** - Consistent color scheme across metrics
  - Green - Revenue, positive metrics
  - Blue - Profit, analytics
  - Orange/Red - Expenses, alerts
  - Yellow - Warnings, pending items
  - Purple - Job work, operations
- **Shadow Effects** - Elevated card design with hover states
- **Gradient Backgrounds** - Modern visual appeal
- **Icon System** - Lucide React icons throughout
- **Toast Notifications** - Error handling feedback

#### Navigation:

Accessible via:
- URL: `/enhanced-dashboard`
- Sidebar: "Enhanced Dashboard" menu item (with "New" badge)
- Located near the top of sidebar for quick access

#### Chart Library:

**Recharts Integration:**
- Installed version: 2.15.4
- Components used:
  - LineChart - For revenue vs expenses trend
  - BarChart - For expense distribution
  - PieChart - For payment mode breakdown
  - Tooltip - Interactive data display
  - Legend - Chart key identification
  - CartesianGrid - Grid background
  - ResponsiveContainer - Automatic sizing

#### Future Enhancements:

**Advanced Analytics:**
- Year-over-year comparison charts
- Seasonal trend analysis
- Predictive analytics with ML
- Custom date range selection

**Additional Visualizations:**
- Area charts for cumulative metrics
- Heatmaps for activity patterns
- Gauge charts for KPI tracking
- Funnel charts for sales pipeline

**Real-Time Updates:**
- WebSocket integration for live data
- Auto-refresh at configurable intervals
- Push notifications for critical alerts
- Real-time activity feed

**Customization:**
- User-configurable widgets
- Drag-and-drop dashboard layout
- Saved dashboard presets
- Export dashboard as PDF/Image

**Drill-Down Capabilities:**
- Click chart elements to view details
- Filter data by clicking metrics
- Breadcrumb navigation for context
- Modal popups for quick insights

---

## ✅ Backup Management Module (Option F)

### Backup Management Page
Location: [frontend/src/pages/BackupManagement.jsx](frontend/src/pages/BackupManagement.jsx)

A comprehensive backup and restore system for data safety, disaster recovery, and data portability.

#### Key Features:

**1. Backup Dashboard**
- Real-time backup statistics
- Total backups count
- Total storage used
- Last backup date
- Auto-backup status indicator

**2. Manual Backup Creation**
- One-click backup generation
- Complete database export
- All modules included (Raw Purchase, Job Work, Sales, Expenses)
- Progress indicator during backup
- Success/error notifications

**3. Automatic Backup System**
- **Enable/Disable** auto-backup toggle
- **Frequency Options**: Daily, Weekly, Monthly
- **Scheduled Time**: Set specific backup time (e.g., 02:00 AM)
- **Retention Policy**: Configure days to keep backups (1-365 days)
- Automatic cleanup of old backups

**4. Backup History Table**
Displays all backups with detailed information:
- File name with timestamp
- Creation date and time
- Backup type (MANUAL or AUTO)
- File size
- Record count
- Status (COMPLETED, IN_PROGRESS, FAILED)
- Module coverage

**5. Backup Actions**
- **Download** - Save backup file locally
- **Restore** - Restore data from backup with confirmation
- **Delete** - Remove backup from system

**6. Import Functionality**
- Upload backup files (.json format)
- File validation before import
- Preview import details
- Confirmation dialog

**7. Safety Features**
- Confirmation dialogs for destructive actions
- Restore warning with timestamp
- Cannot undo warning
- Loading overlay during restore
- Auto-refresh after restore

**8. Storage Management**
- File size tracking
- Total storage calculation
- Retention-based cleanup
- Backup type badges (AUTO/MANUAL)

#### Backup File Structure:

```javascript
{
  id: 'backup_001',
  fileName: 'svr_cashew_backup_2024_12_21_14_30.json',
  createdAt: '2024-12-21T14:30:00',
  size: 2458624, // bytes
  type: 'MANUAL', // or 'AUTO'
  status: 'COMPLETED',
  modules: ['Raw Purchase', 'Job Work', 'Sales', 'Expenses'],
  recordCount: 1524,
  data: {
    // Complete database export
  }
}
```

#### Auto-Backup Settings:

**Configurable Options:**
- **Auto Backup**: Enable/Disable toggle
- **Frequency**: DAILY, WEEKLY, MONTHLY
- **Backup Time**: Time of day to run backup (24-hour format)
- **Retention Days**: Number of days to keep backups (1-365)

**Settings Persistence:**
- Saved to localStorage
- Applied on page reload
- Save button for confirmation

#### UI/UX Features:

- **4 Statistics Cards** with gradient backgrounds
  - Total Backups (Blue)
  - Total Size (Green)
  - Last Backup Date (Purple)
  - Auto-Backup Status (Green/Gray)

- **Action Buttons**
  - Create Backup Now (Blue gradient)
  - Import Backup (Green gradient)
  - Refresh List (Gray)

- **Settings Panel**
  - Grid layout for settings
  - Color-coded enable/disable button
  - Disabled state for dependent fields
  - Save confirmation

- **Backup History Table**
  - Sortable columns
  - Color-coded type badges
  - Status indicators with icons
  - Hover effects on action buttons
  - Animated row transitions

- **Restore Confirmation**
  - Multi-line warning message
  - Timestamp display
  - Cannot undo notice
  - Yes/No confirmation

- **Restoring Overlay**
  - Full-screen backdrop
  - Centered modal
  - Spinning icon
  - Warning message
  - Prevents interaction during restore

#### Status Indicators:

**Backup Status:**
- ✅ **COMPLETED** - Green badge with CheckCircle icon
- 🔄 **IN_PROGRESS** - Blue badge with RefreshCw icon
- ❌ **FAILED** - Red badge with AlertCircle icon

**Backup Type:**
- 🤖 **AUTO** - Purple badge for scheduled backups
- 👤 **MANUAL** - Blue badge for user-triggered backups

#### Navigation:
- URL: `/backup-management`
- Sidebar: "Backup & Import" menu item (Archive icon)

#### Integration Points:

**Backend API Endpoints (To be implemented):**
```javascript
POST /api/backup/create        // Create new backup
GET  /api/backup/list          // List all backups
GET  /api/backup/download/:id  // Download specific backup
POST /api/backup/restore/:id   // Restore from backup
DELETE /api/backup/:id         // Delete backup
POST /api/backup/import        // Import backup file
GET  /api/backup/settings      // Get auto-backup settings
POST /api/backup/settings      // Update auto-backup settings
```

#### Future Enhancements:

- **Cloud Storage Integration**
  - AWS S3 backup storage
  - Google Drive integration
  - Dropbox sync

- **Backup Encryption**
  - AES-256 encryption
  - Password-protected backups
  - Encrypted storage

- **Selective Backup**
  - Choose specific modules to backup
  - Date range filtering
  - Custom field selection

- **Backup Verification**
  - Integrity checks
  - Data validation
  - Restore testing

- **Email Notifications**
  - Backup completion emails
  - Failure alerts
  - Storage warnings

- **Backup Compression**
  - ZIP file format
  - Reduced storage usage
  - Faster downloads

---

## Developer Notes

### File Structure
```
frontend/src/
├── components/
│   └── DateRangePicker.jsx       # Reusable date range component
├── pages/
│   ├── ExpenseReports.jsx         # ✅ Export + Custom dates
│   ├── SalesReports.jsx           # ✅ Export + Custom dates
│   ├── StandardReports.jsx        # ✅ Print functionality
│   ├── RawPurchaseList.jsx        # ✅ Export functionality
│   ├── JobWorkList.jsx            # ✅ Export functionality
│   ├── SalesOrderList.jsx         # ✅ Export functionality
│   └── ExpenseList.jsx            # ✅ Export functionality
└── utils/
    └── exportUtils.js             # ✅ Enhanced export utilities
```

### Dependencies
- **Framer Motion** - For DateRangePicker modal animations
- **Lucide React** - Icons (FileDown, Printer, Calendar, X)
- **React Hot Toast** - User feedback notifications

### Best Practices
1. Always validate date ranges before API calls
2. Show loading states during data fetch
3. Disable export buttons when no data
4. Provide clear user feedback
5. Use consistent UI patterns across pages

---

## Support & Maintenance

### Common Issues

**Q: Export button is disabled**
- Ensure data is loaded (check loading state)
- Verify there is data to export
- Check date range is valid

**Q: Custom date range not working**
- Ensure backend API supports `startDate` and `endDate` parameters
- Check date format is YYYY-MM-DD
- Verify date range validation

**Q: PDF not printing**
- Check popup blocker settings
- Ensure browser allows window.open
- Try different browser

---

## Changelog

### Version 1.2.0 (Current)
- ✅ Added DateRangePicker component
- ✅ Integrated custom date ranges in Sales Reports
- ✅ Enhanced export utilities for custom dates
- ✅ Updated all export functions

### Version 1.1.0
- ✅ Added Excel/PDF export to all report pages
- ✅ Added Excel/PDF export to all list pages
- ✅ Implemented payment tracking in reports

### Version 1.0.0
- Initial release with basic CRUD operations

---

**Last Updated:** December 21, 2025
**Maintained By:** SVR Food Production Development Team
