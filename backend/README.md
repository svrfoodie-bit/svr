# SVR Cashew Management System - Backend

Backend API for SVR Food Production Cashew Processing Factory Management System.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MySQL
- **Authentication:** JWT
- **Logging:** Winston
- **Validation:** express-validator

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files (database, logger, etc.)
│   ├── controllers/      # Request handlers
│   ├── models/           # Database models
│   ├── routes/           # API route definitions
│   ├── middleware/       # Custom middleware (auth, error handling, audit)
│   ├── services/         # Business logic layer
│   ├── validators/       # Input validation schemas
│   ├── utils/            # Utility functions
│   ├── database/
│   │   ├── migrations/   # Database migration scripts
│   │   └── seeders/      # Seed data scripts
│   └── server.js         # Application entry point
├── logs/                 # Application logs
├── .env.example          # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update with your configuration:

```bash
cp .env.example .env
```

Edit `.env` file:
- Set database credentials
- Set JWT secret
- Configure other environment variables

### 3. Create Database

Create MySQL database:

```sql
CREATE DATABASE svr_cashew_db;
```

### 4. Run Migrations

```bash
npm run migrate
```

### 5. Seed Initial Data (Optional)

```bash
npm run seed
```

### 6. Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:5000`

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests with coverage
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database with initial data

## API Documentation

Base URL: `http://localhost:5000/api/v1`

### Health Check
- `GET /health` - Check if server is running

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user

### Modules (To be implemented)
- Suppliers
- Workers
- Work Types
- Bonus Rates
- White Cashew Grades
- Customers
- Raw Cashew Purchases
- Outside Job Work
- Worker Daily Work
- Worker Advances
- Production Batches
- Rework/Conversions
- Parcels/Dispatch
- Payments
- Daily Cashflow
- Expenses
- Reports

## License

Proprietary - SVR Food Production
