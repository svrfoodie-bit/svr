# Quick Start Guide - SVR Cashew Management System

This guide will help you get the project up and running in minutes.

## Prerequisites Checklist

Before you begin, ensure you have the following installed:

- [ ] Node.js (v18 or higher) - [Download](https://nodejs.org/)
- [ ] MySQL (v8.0 or higher) - [Download](https://dev.mysql.com/downloads/)
- [ ] Git - [Download](https://git-scm.com/)
- [ ] A code editor (VS Code recommended) - [Download](https://code.visualstudio.com/)

## Step-by-Step Setup

### 1. Navigate to Project Directory

```bash
cd svr-cashew-management
```

### 2. Backend Setup

#### A. Install Dependencies

```bash
cd backend
npm install
```

#### B. Create Environment File

```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

#### C. Configure Environment Variables

Edit the `.env` file with your MySQL credentials:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=svr_cashew_db

# JWT Configuration
JWT_SECRET=your_secure_random_string_here
JWT_EXPIRE=7d

# Other Configuration
ALLOWED_ORIGINS=http://localhost:3000
LOG_LEVEL=info
```

**Important:**
- Replace `your_mysql_password_here` with your actual MySQL root password
- Replace `your_secure_random_string_here` with a random secure string (e.g., use an online generator)

#### D. Create Database

Open MySQL command line or MySQL Workbench and run:

```sql
CREATE DATABASE svr_cashew_db;
```

#### E. Run Database Migrations

```bash
npm run migrate
```

#### F. Seed Initial Data (Optional)

```bash
npm run seed
```

#### G. Start Backend Server

```bash
npm run dev
```

You should see:
```
✅ Database connected successfully
🚀 Server running on port 5000
📊 Environment: development
🔗 API Base URL: http://localhost:5000/api/v1
```

Keep this terminal open!

### 3. Frontend Setup

Open a **new terminal window** and navigate to the frontend directory:

#### A. Install Dependencies

```bash
cd frontend
npm install
```

#### B. Create Environment File

```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

The default `.env` content is already configured for local development:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_APP_NAME=SVR Cashew Management
VITE_APP_VERSION=1.0.0
```

#### C. Start Frontend Development Server

```bash
npm run dev
```

You should see:
```
VITE v5.x.x ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

### 4. Access the Application

Open your browser and navigate to:

```
http://localhost:3000
```

## Default Login Credentials

After seeding the database, you can login with:

### Owner Account
- **Username:** `owner`
- **Password:** `owner123`
- **Access:** Full system access

### Supervisor Account
- **Username:** `supervisor`
- **Password:** `supervisor123`
- **Access:** Daily operations and production

### Accountant Account
- **Username:** `accountant`
- **Password:** `accountant123`
- **Access:** Financial operations

## Verify Installation

### Test Backend API

Open a browser or use curl:

```bash
# Health check
curl http://localhost:5000/health
```

Expected response:
```json
{
  "success": true,
  "message": "SVR Cashew Management System - Backend is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Test Frontend

1. Navigate to `http://localhost:3000`
2. You should see the login page
3. Try logging in with one of the default accounts

## Common Issues & Solutions

### Issue 1: Port Already in Use

**Backend (Port 5000):**
```bash
# Windows - Find and kill process
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

**Frontend (Port 3000):**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Issue 2: Database Connection Failed

1. Verify MySQL is running:
   ```bash
   # Windows
   net start MySQL80

   # Linux
   sudo systemctl status mysql
   ```

2. Check credentials in `.env` file
3. Ensure database `svr_cashew_db` exists
4. Test MySQL connection manually

### Issue 3: Module Not Found

```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue 4: Permission Denied (Linux/Mac)

```bash
sudo chmod -R 755 .
```

## Development Workflow

### 1. Start Both Servers

Always run both backend and frontend in separate terminals:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 2. Making Changes

- **Backend changes:** Server auto-restarts (nodemon)
- **Frontend changes:** Page auto-refreshes (Vite HMR)

### 3. Viewing Logs

Backend logs are stored in:
```
backend/logs/combined.log  # All logs
backend/logs/error.log     # Error logs only
```

## Next Steps

Now that your project is running:

1. **Explore the Dashboard** - Login and navigate through the UI
2. **Review the Code** - Familiarize yourself with the structure
3. **Start Development** - Begin implementing features from the FRD
4. **Read Documentation:**
   - [Backend README](backend/README.md)
   - [Frontend README](frontend/README.md)
   - [Project Structure](PROJECT_STRUCTURE.md)

## Useful Commands

### Backend
```bash
npm run dev      # Start development server
npm start        # Start production server
npm run migrate  # Run database migrations
npm run seed     # Seed database
npm test         # Run tests
```

### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run linter
```

## Getting Help

If you encounter issues not covered here:

1. Check the error message carefully
2. Review the relevant README files
3. Check browser console (F12) for frontend errors
4. Check terminal output for backend errors
5. Review log files in `backend/logs/`

## Production Deployment

This guide is for development only. For production deployment:

1. Build frontend: `npm run build`
2. Configure production environment variables
3. Set up reverse proxy (Nginx/Apache)
4. Use PM2 or similar for backend process management
5. Enable SSL/HTTPS
6. Configure database for production
7. Set up proper logging and monitoring

---

**Happy Coding! 🚀**
