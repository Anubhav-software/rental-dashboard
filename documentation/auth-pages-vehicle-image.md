# Authentication Pages - Vehicle Image Update

## Overview
Updated all authentication pages to display your custom **vehicle.png** image instead of the default placeholder.

---

## Changes Made

### Pages Updated:
1. ✅ **Signup Page** (`views/authentication/signup.ejs`)s
2. ✅ **Signin Page** (`views/authentication/signin.ejs`)
3. ✅ **Verify OTP Page** (`views/authentication/verifyOtp.ejs`)

### Image Changed:
- **Before**: `/images/auth/auth-img.png` (default placeholder)
- **After**: `/images/vehicle.png` (your custom car rental image)

---

## Image Details

### File Location:
`rental_dashboard/public/images/vehicle.png`

### Usage:
```html
<img src="/images/vehicle.png" alt="Car Rental" style="max-width: 100%; height: auto;">
```

### Responsive:
- ✅ `max-width: 100%` - Scales down on small screens
- ✅ `height: auto` - Maintains aspect ratio
- ✅ Works on all device sizes

---

## Where It Appears

The vehicle image now displays on the **left side** of all authentication pages:

### 1. Signup Page
- Left: Vehicle image
- Right: Signup form

### 2. Signin Page  
- Left: Vehicle image
- Right: Login form

### 3. Verify OTP Page
- Left: Vehicle image
- Right: OTP verification form

---

## Result

Your **car rental vehicle image** now appears consistently across all authentication pages, giving users a branded experience from the moment they sign up or sign in! 🚗

---

## Testing

1. ✅ Go to `/authentication/signup`
2. ✅ Go to `/authentication/signin`
3. ✅ Go to `/authentication/verify-otp`
4. ✅ Verify vehicle image displays on left side
5. ✅ Test on mobile - image scales properly

---

## Benefits

✅ **Branded**: Shows your car rental business
✅ **Consistent**: Same image across all auth pages
✅ **Professional**: Custom image instead of generic placeholder
✅ **Responsive**: Works on all screen sizes

🎉 **All authentication pages now feature your vehicle image!**
