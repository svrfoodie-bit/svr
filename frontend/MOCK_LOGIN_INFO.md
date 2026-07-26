# 🔑 Mock Login - Quick Reference

## Test Credentials (Frontend Only)

The frontend is currently running with **MOCK AUTHENTICATION** for testing.

### Available Logins:

| Role | Username | Password | Access Level |
|------|----------|----------|--------------|
| **Owner** | `owner` | `owner123` | Full Access |
| **Supervisor** | `supervisor` | `supervisor123` | Operations |
| **Accountant** | `accountant` | `accountant123` | Financial |

---

## How to Login:

1. Go to: http://localhost:3000
2. Enter any username/password from the table above
3. Click "Login"
4. You'll be redirected to the dashboard

---

## Important Notes:

- ⚠️ This is **MOCK authentication** - no real backend validation
- ⚠️ Data is stored in browser localStorage only
- ⚠️ Perfect for testing UI/UX before backend is ready
- ✅ See `MOCK_CREDENTIALS.md` in root for more details

---

## When Backend is Ready:

Follow instructions in `MOCK_CREDENTIALS.md` to switch to real authentication.
