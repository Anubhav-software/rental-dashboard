# Password-Based Login Implementation

## Overview
Changed the signin flow from **OTP-based** to **Password-based** login with **Role selection**.

---

## Changes Made

### 1. Backend Changes

#### New Validation Schema
**File:** `rental_backend/src/validations/auth/auth.validation.js`

Added `passwordLoginSchema`:
```javascript
const passwordLoginSchema = Joi.object({
  email: Joi.string().email().required().trim().lowercase(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('OWNER', 'STAFF').required(),
});
```

#### New Service Function
**File:** `rental_backend/src/services/auth/auth.service.js`

Added `passwordLogin(email, password, role)`:
- Verifies email exists in database
- Compares password using bcrypt
- **Validates role matches** user's actual role
- Issues JWT token with user payload
- Returns token + user data

**Security Features:**
- Password verification using bcrypt
- Role validation (prevents OWNER trying to login as STAFF and vice versa)
- Generic error messages to prevent user enumeration
- Console logging for debugging

#### New Controller
**File:** `rental_backend/src/controllers/auth/auth.controller.js`

Added `passwordLogin` controller:
- Validates request body
- Calls service layer
- Returns 200 with token/user on success
- Returns 401 on auth failure

#### New Route
**File:** `rental_backend/src/routes/auth/auth.routes.js`

Added route:
```javascript
router.post('/login-password', authController.passwordLogin);
```

---

### 2. Frontend Changes

#### Updated API Client
**File:** `rental_dashboard/public/js/api/authApi.js`

Added new function:
```javascript
loginPassword: function (email, password, role) {
  return request('POST', '/auth/login-password', { 
    email: email, 
    password: password, 
    role: role 
  }, false);
}
```

#### Updated Signin Form
**File:** `rental_dashboard/views/authentication/signin.ejs`

**New Fields Added:**
1. **Password Field:**
   - Icon: Lock icon
   - Type: Password (with toggle visibility)
   - Eye icon to show/hide password

2. **Role Selection:**
   - Label: "Login As"
   - Options:
     - Owner
     - Staff

**UI Changes:**
- Removed "Enter your email. We'll send you a one-time code..." text
- Changed button text from "Send OTP" to "Sign In"
- Password field includes eye toggle for show/hide

#### Updated Signin Logic
**File:** `rental_dashboard/public/js/modules/auth-signin.js`

**Complete Rewrite:**
- Now collects: email, password, role
- Validates all three fields are filled
- Calls `loginPassword` API
- Saves token and user to localStorage
- Redirects based on role and company_id:
  - **OWNER without company:** → `/owner/settings/company`
  - **OWNER with company:** → `/owner/dashboard/index5`
  - **STAFF:** → `/staff/dashboard/index5`
- Added password toggle functionality
- Detailed console logging

---

## Console Logging

### Backend Terminal:
```
[auth] ✅ Password login successful
[auth] JWT Payload: {
  "userId": "...",
  "email": "owner@test.com",
  "role": "OWNER",
  "companyId": null
}
[auth] ✅ Password login successful, sending response with user: { ... }
```

**On Failed Login:**
```
[auth] ❌ Login failed: User not found
[auth] ❌ Login failed: Invalid password
[auth] ❌ Login failed: Role mismatch. Expected: OWNER Got: STAFF
[auth] ❌ Password login failed: Invalid email, password or role
```

### Frontend Console:
```
📤 Attempting login with: { email: "...", role: "OWNER" }
✅ Login successful!
📦 Response data: { token: "...", user: { ... } }
👤 User info: { id: "...", email: "...", role: "OWNER", company_id: null }
🔑 Token received: Yes
🔄 Redirecting based on role: OWNER | Company ID: null
➡️ Redirecting OWNER to company setup page
```

---

## API Endpoint

### POST `/api/auth/login-password`

**Request Body:**
```json
{
  "email": "owner@test.com",
  "password": "password123",
  "role": "OWNER"
}
```

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "cm7xf6q8q0000h1a5vkq1sjc6",
    "email": "owner@test.com",
    "name": "Owner Name",
    "role": "OWNER",
    "company_id": null
  }
}
```

**Error Response (401):**
```json
{
  "error": "Invalid email, password or role"
}
```

---

## Security Features

1. **Password Hashing:** bcrypt comparison (not plaintext)
2. **Role Validation:** Ensures user can only login with their assigned role
3. **Generic Error Messages:** Prevents user enumeration attacks
4. **JWT Authentication:** Secure token-based auth
5. **Input Validation:** Joi schema validation on backend

---

## Testing Checklist

### Test Password Login:
1. ✅ Sign up as OWNER (first user)
2. ✅ Go to signin page
3. ✅ Enter email, password, and select "Owner"
4. ✅ Click "Sign In"
5. ✅ Should redirect to company setup page (if no company)
6. ✅ Check browser console for detailed logs
7. ✅ Check backend terminal for JWT payload

### Test Role Validation:
1. ✅ Try to login as STAFF with OWNER credentials → Should fail
2. ✅ Try to login as OWNER with STAFF credentials → Should fail
3. ✅ Should see error: "Invalid email, password or role"

### Test Wrong Password:
1. ✅ Enter correct email and role but wrong password
2. ✅ Should see error: "Invalid email, password or role"
3. ✅ Backend should log: "Invalid password"

### Test UI Features:
1. ✅ Click eye icon to show/hide password
2. ✅ Verify all three fields are required
3. ✅ Submit with empty fields → Should show validation error
4. ✅ Success message appears before redirect

---

## Migration Note

**OTP-based login is still available:**
- Old route: `POST /api/auth/login` (sends OTP)
- Old route: `POST /api/auth/verify-otp` (verifies OTP)

These routes remain functional for backward compatibility or if you want to implement both login methods in the future.

---

## Files Modified Summary

### Backend (5 files):
1. `rental_backend/src/validations/auth/auth.validation.js` - Added passwordLoginSchema
2. `rental_backend/src/services/auth/auth.service.js` - Added passwordLogin function
3. `rental_backend/src/controllers/auth/auth.controller.js` - Added passwordLogin controller
4. `rental_backend/src/routes/auth/auth.routes.js` - Added /login-password route

### Frontend (3 files):
1. `rental_dashboard/views/authentication/signin.ejs` - Added password + role fields
2. `rental_dashboard/public/js/modules/auth-signin.js` - Complete rewrite for password login
3. `rental_dashboard/public/js/api/authApi.js` - Added loginPassword function

---

## Ready to Test! 🚀

The signin page now:
- ✅ Shows email field
- ✅ Shows password field (with eye toggle)
- ✅ Shows role dropdown (Owner/Staff)
- ✅ Validates all fields
- ✅ Logs in directly without OTP
- ✅ Full console logging
- ✅ Redirects based on role and company status
