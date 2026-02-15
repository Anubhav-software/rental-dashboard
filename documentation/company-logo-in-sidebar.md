# Company Logo in Sidebar - Automatic Loading

## Overview
Company logo now displays automatically in the **sidebar** on all dashboard pages for both OWNER and STAFF users.

---

## Implementation

### New Script: `companyLogo.js`
**Location**: `rental_dashboard/public/js/api/companyLogo.js`

**What it does**:
1. ✅ Runs automatically on every page load
2. ✅ Checks if user has a company ID
3. ✅ Fetches company data from backend
4. ✅ If logo exists → Updates sidebar logo images
5. ✅ If no logo → Uses default logo

---

## Sidebar Logo Elements

The sidebar has 3 logo images that get updated:

### 1. Light Logo (`.light-logo`)
- Shown in light mode
- Updated to company logo
- Max size: 168x40 pixels

### 2. Dark Logo (`.dark-logo`)
- Shown in dark mode  
- Updated to company logo
- Max size: 168x40 pixels

### 3. Logo Icon (`.logo-icon`)
- Shown when sidebar is collapsed
- Updated to company logo
- Max size: 40x40 pixels

---

## Code Flow

```javascript
// On page load:
1. Get auth user → Check company_id
2. If no company_id → Use default logo, exit
3. If has company_id → Fetch company data
4. If company.logo exists → Build URL
5. Update all 3 sidebar logo images with company logo
```

---

## Logo URL Construction

```javascript
var logoUrl = backendURL + "/uploads/Company-logos/" + company.logo;
// Example: http://localhost:5555/uploads/Company-logos/my-logo-123456.png
```

---

## Updated Files

### 1. New File: `public/js/api/companyLogo.js`
- Fetches company data
- Updates sidebar logos
- Runs automatically

### 2. Modified: `views/layout/layout.ejs`
- Added `<script src="/js/api/companyLogo.js"></script>`
- Loads after `authApi.js` (dependency)

---

## User Experience

### Before:
- Sidebar shows default static logo
- Same for all companies

### After:
- ✅ Sidebar shows **company's actual logo**
- ✅ Loads automatically on every page
- ✅ Works for OWNER and STAFF
- ✅ Fallback to default if no logo

---

## Console Logs

### With Company Logo:
```
[CompanyLogo] Loading company logo for: cm6bxnwn70002tkxww7ovsxm2
[CompanyLogo] ✅ Logo updated in sidebar: http://localhost:5555/uploads/Company-logos/logo-123.png
```

### Without Company Logo:
```
[CompanyLogo] Loading company logo for: cm6bxnwn70002tkxww7ovsxm2
[CompanyLogo] Company has no logo, using default
```

### No Company (Not logged in):
```
[CompanyLogo] No company ID found, using default logo
```

---

## Benefits

✅ **Automatic**: No manual setup needed
✅ **Consistent**: Same logo everywhere in dashboard
✅ **Responsive**: Updates immediately after logo upload
✅ **Scalable**: Works for all users (OWNER & STAFF)
✅ **Fallback**: Gracefully uses default if no logo

---

## Perfect Size

The sidebar logo area is designed for **168 x 40 pixels**, which matches your logo upload recommendation perfectly! 🎯

---

## Testing

1. ✅ Upload company logo (Settings → Company)
2. ✅ Go to any dashboard page
3. ✅ Check sidebar → Your logo appears!
4. ✅ Toggle dark/light mode → Logo shows correctly
5. ✅ Collapse sidebar → Logo icon shows

---

## Where Logo Appears

Now company logo appears in **2 places**:

1. ✅ **Company Details Page** (VIEW mode header)
2. ✅ **Sidebar** (all dashboard pages)

Coming soon:
- Dashboard navbar
- PDF invoices
- Email templates

---

## Result

Your company logo now appears in the **sidebar on every page** automatically! 🎉

Just upload your **168x40 pixel** logo once, and it displays everywhere.
