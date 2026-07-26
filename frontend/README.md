# SVR Cashew Management System - Frontend

React-based frontend application for SVR Food Production Cashew Processing Factory Management System.

## Tech Stack

- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router DOM v6
- **State Management:** Zustand
- **API Client:** Axios
- **Data Fetching:** React Query
- **Forms:** React Hook Form
- **Icons:** Lucide React
- **Charts:** Recharts
- **Notifications:** React Hot Toast

## Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── layouts/      # Layout components (MainLayout, AuthLayout)
│   │   ├── navigation/   # Navigation components (Sidebar, Header)
│   │   └── common/       # Common components (Button, Input, etc.)
│   ├── pages/            # Page components
│   │   ├── auth/         # Authentication pages
│   │   ├── masters/      # Master data pages
│   │   ├── operations/   # Operations pages
│   │   ├── financial/    # Financial pages
│   │   └── reports/      # Reports pages
│   ├── services/         # API service functions
│   ├── hooks/            # Custom React hooks
│   ├── context/          # State management (Zustand stores)
│   ├── utils/            # Utility functions
│   ├── assets/           # Static assets (images, fonts)
│   ├── styles/           # Global styles
│   ├── App.jsx           # Main App component
│   └── main.jsx          # Application entry point
├── public/               # Public assets
├── index.html            # HTML template
├── vite.config.js        # Vite configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── postcss.config.js     # PostCSS configuration
├── .env.example          # Environment variables template
└── package.json
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Update the `.env` file with your backend API URL:

```
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

### 3. Start Development Server

```bash
npm run dev
```

Application will start on `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Module Structure

### Master Data Pages
- Suppliers Management
- Workers Management
- Work Types Management
- Bonus Rates Management
- White Cashew Grades Management
- Customers & Locations Management

### Operations Pages
- Raw Cashew Purchase
- Outside Job Work Tracking
- Worker Daily Work Log
- White Cashew Production
- Rework & Grade Conversion
- Parcel/Dispatch Management

### Financial Pages
- Worker Advance & Settlement
- Customer Payments
- Factory Expenses
- Daily Cashflow Management

### Reports Pages
- Stock Reports (Raw & White)
- Worker Wage & Bonus Reports
- Parcel & Dispatch Reports
- Customer Outstanding Reports
- Daily Cashflow Reports
- Batch-wise Profit Reports

## Features

- **Authentication & Authorization** - Role-based access control (Owner, Supervisor, Accountant)
- **Responsive Design** - Works on desktop, tablet, and mobile devices
- **Real-time Notifications** - Toast notifications for user actions
- **Form Validation** - Client-side validation with React Hook Form
- **Data Caching** - Optimized API calls with React Query
- **Dark Mode Ready** - Infrastructure for dark mode (to be implemented)

## Development Guidelines

- Use functional components with hooks
- Follow React best practices
- Use Tailwind utility classes for styling
- Create reusable components
- Implement proper error handling
- Add loading states for async operations
- Use TypeScript (optional, but recommended for larger scale)

## License

Proprietary - SVR Food Production
