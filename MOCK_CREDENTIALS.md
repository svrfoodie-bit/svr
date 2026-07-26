# Mock Login Credentials

## ⚠️ TEMPORARY MOCK AUTHENTICATION

The frontend currently uses **mock authentication** for testing purposes. This allows you to test the UI without setting up the backend database.

---

## 🔑 Available Mock Users

### Owner Account
- **Username:** `owner`
- **Password:** `owner123`
- **Role:** Owner
- **Access:** Full system access

### Supervisor Account
- **Username:** `supervisor`
- **Password:** `supervisor123`
- **Role:** Supervisor
- **Access:** Daily operations and production

### Accountant Account
- **Username:** `accountant`
- **Password:** `accountant123`
- **Role:** Accountant
- **Access:** Financial operations

---

## 📝 How It Works

The mock authentication is implemented in:
- **File:** `frontend/src/pages/auth/Login.jsx`
- **Lines:** 29-53

The login page checks credentials against a hardcoded object and creates a mock JWT token and user session.

---

## 🔄 Switching to Real Backend Authentication

Once you've set up the backend, you need to:

### 1. Remove Mock Code

In `frontend/src/pages/auth/Login.jsx`, **delete lines 29-53** (the mock authentication block).

### 2. Uncomment Real API Call

**Uncomment lines 55-61** in the same file:

```javascript
const response = await authService.login(formData);
if (response.success) {
  login(response.data.user, response.data.token);
  toast.success('Login successful!');
  navigate('/');
}
```

### 3. Remove Credential Hint

**Delete lines 74-82** in `Login.jsx` (the blue info box showing demo credentials).

### 4. Setup Backend

Make sure you've:
- Created the database
- Run migrations
- Seeded user data
- Started the backend server

---

## 🚀 Testing the Mock Login

1. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

2. Open http://localhost:3000

3. Use any of the credentials above

4. You should be redirected to the dashboard

---

## 🔒 Security Note

**IMPORTANT:** Mock authentication is for development/testing only. It:
- ❌ Does NOT validate against a real database
- ❌ Does NOT create real JWT tokens
- ❌ Does NOT provide any security
- ❌ Should NEVER be used in production

Always use real backend authentication before deploying!

---

## ✅ Next Steps

1. Test the frontend with mock credentials
2. Build out UI components
3. Setup backend database when ready
4. Implement real authentication
5. Remove mock code

---

_Last Updated: 2024-12-19_
