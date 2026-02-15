# Company View/Edit Mode Feature

## Overview
The Company page (`/owner/settings/company`) now supports three distinct modes depending on the user's state:

1. **CREATE Mode**: When owner has NO company (after signup)
2. **VIEW Mode**: When owner HAS a company (read-only display)
3. **EDIT Mode**: When owner clicks "Edit" button in VIEW mode

---

## Frontend Flow

### Mode Detection
```javascript
// rental_dashboard/public/js/modules/company.js

var isCreateMode = authUser.company_id === null || authUser.company_id === undefined || authUser.company_id === "";
var isViewMode = !isCreateMode && authUser.role === "OWNER";
var isEditMode = false; // Set to true when user clicks Edit button
```

### CREATE Mode (No Company)
- **When**: Owner signs up and has no `company_id`
- **Behavior**: 
  - Form is enabled and empty
  - Submit button says "Save Company"
  - On submit → Create company → Redirect to login
- **API**: `POST /api/companies`

### VIEW Mode (Has Company)
- **When**: Owner logs in with existing `company_id`
- **Behavior**: 
  - Loads company data via `GET /api/companies/:id`
  - Displays company details in **beautiful card layout** (not form)
  - Shows header card with company name and gradient background
  - Shows categorized cards: Basic Info, Currency & Hours, Rental Config, Tax Config
  - Green "Edit" button to switch to EDIT mode
  - Click Edit → Switch to EDIT mode (shows form)
- **API**: `GET /api/companies/:id`
- **UI**: Card-based view similar to vehicle details page

### EDIT Mode (Editing Company)
- **When**: Owner clicks "Edit" button in VIEW mode
- **Behavior**:
  - Hides card view, shows editable **form**
  - All form fields are pre-filled with current company data
  - Shows "Cancel" button (gray) to go back to VIEW mode without saving
  - Shows "Save Company" button (blue) to submit changes
  - On submit → Update company → Reload page (back to VIEW mode)
  - On cancel → Return to VIEW mode without saving
- **API**: `PATCH /api/companies/:id`

---

## Backend APIs

### Get Company by ID
```
GET /api/companies/:id
```
**Response:**
```json
{
  "company": {
    "id": "cm6bxnwn70002tkxww7ovsxm2",
    "name": "My Rental Company",
    "phone": "+1234567890",
    "email": "contact@mycompany.com",
    "address": "123 Main St",
    "country": "USA",
    "currency_code": "USD",
    "currency_symbol": "$",
    // ... all other fields
  }
}
```

### Update Company
```
PATCH /api/companies/:id
Authorization: Bearer <JWT_TOKEN>
```
**Request Body:**
```json
{
  "name": "Updated Company Name",
  "phone": "+9876543210",
  "email": "newemail@company.com",
  // ... any fields to update
}
```

**Response:**
```json
{
  "company": {
    "id": "cm6bxnwn70002tkxww7ovsxm2",
    "name": "Updated Company Name",
    // ... updated fields
  }
}
```

**Authorization**: Requires `requireAuth` + `requireOwner` middleware

---

## Files Modified

### Backend
1. **`rental_backend/src/validations/company/company.validation.js`**
   - Added `updateCompanySchema` for validating PATCH requests

2. **`rental_backend/src/services/company/company.service.js`**
   - Added `getCompanyById()` - Fetch company by ID
   - Added `updateCompany()` - Update company details

3. **`rental_backend/src/controllers/company/company.controller.js`**
   - Added `getById` - HTTP handler for GET
   - Added `update` - HTTP handler for PATCH

4. **`rental_backend/src/routes/company/company.routes.js`**
   - Added `GET /companies/:id`
   - Added `PATCH /companies/:id` (requires auth + owner role)

### Frontend
1. **`rental_dashboard/public/js/api/authApi.js`**
   - Added `getCompany(companyId)` - Fetch company
   - Added `updateCompany(companyId, body)` - Update company

2. **`rental_dashboard/public/js/modules/company.js`**
   - Completely rewritten to support VIEW/EDIT/CREATE modes
   - `loadAndShowCompanyView()` - Load company data from API
   - `populateViewCards()` - Populate card elements with company data
   - `populateFormForEdit()` - Pre-fill form with company data for editing
   - `enableEditMode()` - Hide cards, show form, load data
   - `cancelEdit()` - Hide form, show cards, discard changes
   - Form submit handler with mode-based logic (create vs update)

3. **`rental_dashboard/views/settings/company.ejs`**
   - Added `#company-view-container` - Beautiful card layout for VIEW mode
   - Header card with gradient background (company name + ID)
   - Categorized cards: Basic Info, Currency & Hours, Rental Config, Tax Config
   - Edit button in VIEW mode
   - Form hidden by default in VIEW mode
   - Cancel button added to form (shown only in EDIT mode)

---

## User Experience

### First-time Owner (CREATE)
1. Sign up as OWNER
2. Redirected to `/owner/settings/company`
3. See empty form
4. Fill company details → Submit
5. Redirected to `/authentication/signin` to login again

### Existing Owner (VIEW → EDIT)
1. Login as OWNER with company
2. Navigate to `/owner/settings/company`
3. See company details displayed in **beautiful card layout** (VIEW mode)
   - Header card with company name and gradient background
   - Categorized information cards (Basic Info, Currency, Rental Config, Tax)
   - Green "Edit" button
4. Click "Edit" button
5. Card view hides, **form appears** with pre-filled data (EDIT mode)
   - All fields are editable
   - "Cancel" button to go back
   - "Save Company" button to submit
6. Make changes → Click "Save Company"
7. Success message → Page reloads back to VIEW mode (cards)

**OR**

6. Click "Cancel" → Return to VIEW mode (cards) without saving

---

## Console Logs

### VIEW Mode
```
[Company] Mode: VIEW
[Company] User has company_id: cm6bxnwn70002tkxww7ovsxm2
[Company] 📤 Loading company details for viewing
[Company] ✅ Company data loaded: { company: {...} }
[Company] ✅ VIEW mode activated - form fields disabled
```

### EDIT Mode
```
[Company] ✏️ Switching to EDIT mode
📤 Updating company: { name: "...", phone: "...", ... }
✅ Company updated successfully: { company: {...} }
```

---

## Testing Steps

### Test CREATE Mode
1. Create new OWNER account via signup
2. After signup, verify redirect to `/owner/settings/company`
3. Fill company form
4. Submit and verify redirect to signin
5. Login and verify company is created

### Test VIEW Mode
1. Login as OWNER with existing company
2. Navigate to `/owner/settings/company`
3. Verify company details are displayed in **card layout** (not form)
4. Verify header card shows company name with gradient background
5. Verify all company information is displayed in categorized cards
6. Verify green "Edit" button is visible
7. Verify form is **hidden** in VIEW mode

### Test EDIT Mode
1. In VIEW mode, click "Edit" button
2. Verify card view **hides** and form **shows**
3. Verify form fields are pre-filled with current company data
4. Verify "Cancel" button is visible
5. Modify some fields
6. Click "Save Company"
7. Verify success message
8. Verify page reloads to VIEW mode (cards) with updated data

### Test Cancel Functionality
1. In VIEW mode, click "Edit" button
2. Form appears with data
3. Modify some fields (don't save)
4. Click "Cancel" button
5. Verify form **hides** and card view **shows** again
6. Verify changes were NOT saved (original data still displayed)

---

## Security

- **GET /companies/:id**: Public (no auth required)
- **PATCH /companies/:id**: Requires authentication + OWNER role only
- Update API uses `requireAuth` and `requireOwner` middlewares

---

## Design

The VIEW mode card layout is inspired by the vehicle details page, featuring:
- **Gradient header card** with company icon and name (purple/violet gradient)
- **Icon-based information display** with proper spacing
- **Categorized sections** for better organization
- **Clean, modern card design** with subtle borders and shadows
- **Responsive layout** that works on all screen sizes

## Next Steps

Consider adding:
1. ✅ Cancel button in EDIT mode (COMPLETED)
2. Logo upload functionality
3. Validation feedback for required fields
4. Audit log for company changes
5. Export company details as PDF
6. Company settings history/changelog
