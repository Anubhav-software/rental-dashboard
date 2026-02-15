# Implementation of Customer & Vehicles APIs (Frontend)

**Rental Dashboard** ko **Rental Backend** ke Vehicle aur Customer APIs se connect karna. Ye doc batata hai kitne sub-phases mein kaam hoga, kaunse fields dikhayenge, kaunsi files/routes, payload-response kya hoga, aur **code tabhi apply hoga jab tum approval doge**.

**Abhi sirf documentation hai — koi code apply nahi hoga. Doc padhke approve karo, phir phase-by-phase code karenge.**

---

## 1. Backend APIs (jo already bane hain)

Sab endpoints par **Bearer JWT** zaroori hai. User ke paas **companyId** hona chahiye (warna 403). Base path: `/api`.

### Vehicles

| Method | Endpoint | Kya karta hai |
|--------|----------|----------------|
| POST | `/api/vehicles` | Vehicle create (body + optional `image` file) |
| GET | `/api/vehicles` | List (query: `status`, `vehicle_type`, `page`, `limit`) |
| GET | `/api/vehicles/bulk-upload/template` | CSV template download |
| POST | `/api/vehicles/bulk-upload` | Bulk import (multipart `file`: CSV/Excel) |
| GET | `/api/vehicles/:id` | Ek vehicle |
| PATCH | `/api/vehicles/:id` | Update (body + optional `image`) |
| DELETE | `/api/vehicles/:id` | Delete |

### Customers

| Method | Endpoint | Kya karta hai |
|--------|----------|----------------|
| POST | `/api/customers` | Customer create |
| GET | `/api/customers` | List (query: `search`, `phone`, `email`, `name`, `page`, `limit`) |
| GET | `/api/customers/:id` | Ek customer |
| PATCH | `/api/customers/:id` | Update |
| DELETE | `/api/customers/:id` | Delete |

Backend base URL example: `http://localhost:7080` (jaisa auth ke liye use kiya).

---

## 2. Fields — kya dikhayenge (schema ke hisaab se)

### 2.1 Vehicle

**Backend schema mein mandatory (create ke liye):**

- `registration_number` (Bike/Car number jaisa)
- `vehicle_type` — MOTORBIKE | CAR
- `make`
- `model`
- `status` — AVAILABLE | RENTED | MAINTENANCE

**Optional (backend mein sab optional, UI mein dikha sakte ho):**

- year, color, seating_capacity, fuel_type  
- **CC (engine_capacity_cc)** — engine capacity in **cubic centimeters** (e.g. 150, 250, 1200). Backend field: `engineCapacityCc` / `engine_capacity_cc` / `cc`. Optional; list/detail/create/edit par dikha sakte ho.
- daily_rate, weekly_rate, monthly_rate, hourly_rate  
- owner_name, owner_contact  
- image (vehicle photo)  
- tax_expiry_date, next_battery_change_date, next_service_date, next_oil_change_date  
- Aur bhi fee fields (late return, fuel charge, helmet, key lost, puncture, pickup fee, oil change, battery rundown, accident recovery, geographic, early return) — sab optional.

**Client (Kingsley) preference — Operations Vehicle screen:**

- **Remove (delete nahi, sirf UI se hide):** Owner Number, Owner Contact, Hourly Rate, Geographical x3, Early Return x2, Helmet x2, Lost Key x2, Puncture x2, Pick Up Fee x2, Oil Change x2, Battery Rundown, Accident Recovery. Backend mein ye sab optional hain; UI mein in columns/fields ko hide karenge taaki screen simple rahe.
- **Add (already / easily):** Bike/Car Number = registration_number. **CC** = engine capacity (cubic cm) — backend mein `engine_capacity_cc` add ho chuka hai; list/form mein dikha sakte ho. Contract Number client ne baad mein hata diya (rental par rahega). Other Charges — rental/invoice level, Phase 4/5.
- **Column order:** Client ne attachment mein column order bheja hai — UI mein list/table ka order waise hi rakhenge (mandatory + jo optional dikhana hai).

---

### 2.2 Customer

**Backend schema mein mandatory (create ke liye):**

- name, phone, nationality  
- passport_number  
- hotel_name, booking_date, number_of_people, date_of_tour, room_no, confirmed_by  

**Optional:**

- email, address, customer_pincode, customer_state  
- id_proof_type, id_proof_number, license_number (Driving License)  
- tax_id_number, tax_id_type  
- is_business_customer, business_name, customer_company_address, customer_company_pincode, customer_company_state  

**Client (Kingsley) preference — Operations Customer screen:**

- **Yahan sirf customer ki necessary info** — jo backend Customer API se aati hai (name, phone, nationality, passport, hotel, booking/tour, room_no, confirmed_by, Driving License, ID/Passport section). **Contract Number, Deposit, Amount Paid, Amount Owed** — ye sab **Rentals UI** par dikhayenge, Customer screen par nahi. Rental details (contract number, deposit, amounts) Rentals phase mein aayenge.
- **Add / show (customer fields only):**
  - **Driving License** — separate section; backend: `license_number`.
  - **ID Number** — separate section: Passport + Passport Number; backend: `id_proof_type` (e.g. Passport) + `id_proof_number`, aur `passport_number`.

- **Remove (delete nahi, sirf UI se hide):**  
  Full Address, Pin/Zip Code, State/Province, Aadhaar, GST, Voter ID, **Business Customer (pura section)**. Backend mein sab optional hain; Operations Customer screen par ye fields/sections hide rahenge.

---

## 3. Sub-phases — kitne phases, kya kya

Har phase ke baad tum approve karoge, phir usi phase ka code apply hoga. **Code abhi apply nahi hoga.**

| # | Sub-phase | Kya karenge |
|---|-----------|-------------|
| **1** | API client (Vehicles + Customers) | Config (base URL), `vehicleApi.js` aur `customerApi.js` (ya ek file) — sab endpoints ke liye `fetch` with Bearer token. |
| **2** | Vehicles: List page | Operations / Vehicle list: GET /api/vehicles, filters (status, vehicle_type), pagination. Table/cards; columns schema + client preference ke hisaab se (hide jo “remove” list mein). |
| **3** | Vehicles: Create form | Vehicle add form: mandatory fields (registration_number, vehicle_type, make, model, status) + optional jo dikhana hai. Submit → POST /api/vehicles. Success/error message. |
| **4** | Vehicles: View / Edit / Delete | Vehicle detail page; edit form (PATCH /api/vehicles/:id); delete (DELETE). |
| **5** | Vehicles: Image upload | Create/Edit form par image field (multipart); POST/PATCH with `image` file. Image preview; backend se image URL = `/uploads/Vehicle-images/<filename>`. |
| **6** | Vehicles: Bulk upload | Template download link (GET /api/vehicles/bulk-upload/template). File upload (CSV/Excel) → POST /api/vehicles/bulk-upload. Response: created count + failed rows (dikhana). |
| **7** | Customers: List page | Operations / Customer list: GET /api/customers, search (search, phone, email, name), pagination. Table/cards; columns schema + client preference (hide Address, Pincode, State, Business section, etc.). |
| **8** | Customers: Create form | Customer add form: mandatory fields (name, phone, nationality, passport, hotel_name, booking_date, number_of_people, date_of_tour, room_no, confirmed_by) + optional jo dikhana hai (e.g. Driving License, ID/Passport). Submit → POST /api/customers. |
| **9** | Customers: View / Edit / Delete | Customer detail page; edit form (PATCH /api/customers/:id); delete (DELETE). **Sirf customer info** — Contract Number, Deposit, Rental amounts yahan nahi; wo **Rentals UI** par dikhayenge. |
| **10** | UI: Client preferences (summary) | Vehicle aur Customer list/detail/create/edit screens par Kingsley ke “add/remove” list ke hisaab se finalise: kaunse columns/fields visible, kaunse hidden. Doc already upar likha hai; is phase mein sirf ensure karenge ki UI usi ke mutabiq hai. |

**Total: 10 sub-phases.**  
Contract Number, Deposit, Amount Paid/Owed — ye sab **Rentals UI** par dikhayenge (Phase 4 Rentals); Customer screen par sirf customer record ki info.

---

## 4. Phase 1 — API client (Vehicles + Customers)

**Kya karenge**

- Dashboard ke liye **API base URL** already auth ke liye hai; same use karenge (ya config mein ensure vehicles/customers bhi usi base se call hon).
- **Vehicle API client:** functions jaise `listVehicles(params)`, `getVehicle(id)`, `createVehicle(body, imageFile?)`, `updateVehicle(id, body, imageFile?)`, `deleteVehicle(id)`, `downloadBulkTemplate()`, `bulkUploadVehicles(file)`. Sab `fetch` + `Authorization: Bearer <token>`.
- **Customer API client:** `listCustomers(params)`, `getCustomer(id)`, `createCustomer(body)`, `updateCustomer(id, body)`, `deleteCustomer(id)`.
- Token localStorage se (auth wala) use hoga.

**Files / folders**

| Item | Path (suggested) |
|------|-------------------|
| Vehicle API module | `rental_dashboard/public/js/api/vehicleApi.js` (ya existing api folder) |
| Customer API module | `rental_dashboard/public/js/api/customerApi.js` |

**Response (reference)**

- List vehicles: 200 `{ vehicles: [], pagination: { total, page, limit, totalPages } }`
- List customers: 200 `{ customers: [], pagination: { ... } }`
- Get one: 200 `{ vehicle }` / `{ customer }`
- Create: 201 `{ vehicle }` / `{ customer }`
- Update: 200 `{ vehicle }` / `{ customer }`
- Delete: 200 `{ success: true }`
- 400 validation error, 401 unauthorized, 403 no company, 404 not found, 409 duplicate (registration_number / phone)

**Done when:** Vehicle + Customer API client ready; koi page abhi change nahi.

---

## 5. Phase 2 — Vehicles: List page

**Kya karenge**

- Operations / Vehicles list page (existing route/view ho to use, nahi to naya).
- Page load par `GET /api/vehicles` with token. Query params: optional `status`, `vehicle_type`, `page`, `limit`.
- Result table/cards: columns — registration_number (Bike/Car Number), vehicle_type, make, model, status, (optional: year, color, daily_rate, image thumbnail). Client ke “remove” list ke columns hide (Owner, Hourly Rate, Geographic, etc.).
- Filters: status dropdown, vehicle_type dropdown, pagination (page, limit).
- “Add Vehicle” button → create form (Phase 3). Row par View/Edit/Delete → Phase 4.

**Files**

| Item | Path |
|------|------|
| View | e.g. `rental_dashboard/views/vehicle/list.ejs` (ya existing vehicle view) |
| Route | `rental_dashboard/routes/vehicle/vehicle.js` — list page render + API se data (server-side ya client-side fetch) |

**Done when:** Vehicles list dikhe, filters + pagination kaam kare.

---

## 6. Phase 3 — Vehicles: Create form

**Kya karenge**

- Vehicle create form: **mandatory** — registration_number, vehicle_type, make, model, status. **Optional (jo dikhana hai)** — year, color, seating_capacity, fuel_type, daily_rate, weekly_rate, monthly_rate, owner_name, owner_contact, image, tax_expiry_date, next_* dates. Client “remove” wale fields form par na dikhayen (ya collapse/advanced mein).
- Submit → POST /api/vehicles. Body: snake_case ya camelCase (backend dono leta hai). Agar image choose ki to multipart form with field `image`.
- Success → message + redirect to list ya detail. Error → message dikhao.

**Files**

| Item | Path |
|------|------|
| View (form) | e.g. `rental_dashboard/views/vehicle/create.ejs` ya list page par modal/form |
| Route | POST handler; API call vehicleApi.createVehicle(body, file) |

**Done when:** Naya vehicle create ho jaye API se, success/error dikhe.

---

## 7. Phase 4 — Vehicles: View / Edit / Delete

**Kya karenge**

- **View:** Vehicle detail page — GET /api/vehicles/:id. Saari allowed fields dikhao (client preference ke hisaab se hide jo “remove” list mein).
- **Edit:** Same fields create jaisa; form pre-fill, submit → PATCH /api/vehicles/:id. Image optional replace.
- **Delete:** Delete button → confirm → DELETE /api/vehicles/:id → success par list par redirect.

**Files**

| Item | Path |
|------|------|
| View | e.g. `rental_dashboard/views/vehicle/detail.ejs`, `vehicle/edit.ejs` |
| Routes | GET /vehicle/:id, GET /vehicle/:id/edit, PATCH, DELETE |

**Done when:** View, Edit, Delete sab kaam kare.

---

## 8. Phase 5 — Vehicles: Image upload

**Kya karenge**

- Create/Edit form par **image** input (file). Select karke submit → backend ko multipart mein `image` field bhejna.
- Backend response mein vehicle.image = filename. Image URL = `{baseUrl}/uploads/Vehicle-images/{filename}` (ya relative). Detail/list par image thumbnail/photo dikhana.

**Done when:** Vehicle create/edit par image upload ho; list/detail par photo dikhe.

---

## 9. Phase 6 — Vehicles: Bulk upload

**Kya karenge**

- “Download template” link → GET /api/vehicles/bulk-upload/template (file download ya open in new tab). Template CSV format mein aata hai.
- “Bulk upload” form: file input (CSV/Excel). Submit → POST /api/vehicles/bulk-upload, multipart field `file`. Response: `{ created, failed: [{ row, errors }] }`. Success count + failed rows (row number + error message) dikhana.

**Files**

| Item | Path |
|------|------|
| UI | List page par “Bulk upload” button + modal ya separate page (template link + file upload + result) |

**Done when:** Template download ho, file upload karke created/failed result dikhe.

---

## 10. Phase 7 — Customers: List page

**Kya karenge**

- Operations / Customers list page. GET /api/customers with token. Query: `search` (ya phone, email, name), `page`, `limit`.
- Table/cards: name, phone, nationality, passport_number, hotel_name, room_no, etc. Client “remove” list ke hisaab se Full Address, Pincode, State, Business section hide.
- Search box + pagination.

**Files**

| Item | Path |
|------|------|
| View | e.g. `rental_dashboard/views/customer/list.ejs` |
| Route | `rental_dashboard/routes/customer/customer.js` |

**Done when:** Customers list dikhe, search + pagination kaam kare.

---

## 11. Phase 8 — Customers: Create form

**Kya karenge**

- Customer create form: **mandatory** — name, phone, nationality, passport_number, hotel_name, booking_date, number_of_people, date_of_tour, room_no, confirmed_by. **Optional** — email, Driving License (license_number), ID (id_proof_type + id_proof_number), Passport section (passport_number already hai). Client “remove” wale (Address, Pincode, State, Aadhaar, GST, Voter ID, Business section) form par hide.
- Submit → POST /api/customers. Success/error.

**Done when:** Naya customer create ho jaye API se.

---

## 12. Phase 9 — Customers: View / Edit / Delete

**Kya karenge**

- **View:** Customer detail — GET /api/customers/:id. Fields client preference ke hisaab se. **Sirf customer info** — Contract Number, Deposit, Rental amounts yahan nahi; wo Rentals UI par dikhayenge.
- **Edit:** Pre-fill form, PATCH /api/customers/:id.
- **Delete:** Confirm → DELETE /api/customers/:id → list par redirect.

**Done when:** Customer view, edit, delete kaam kare.

---

## 13. Phase 10 — UI: Client preferences (summary)

**Kya karenge**

- Ensure Vehicle list/detail/create/edit par: Bike/Car Number (registration_number), make, model, status, vehicle_type, + jo optional dikhana hai — dikhe; Owner Number, Owner Contact, Hourly Rate, Geographic, Early Return, Helmet, Key, Puncture, Pickup, Oil, Battery, Accident — ye sections/columns **hide**.
- Ensure Customer list/detail/create/edit par: sirf customer fields — Driving License, ID/Passport section dikhe; Full Address, Pin/Zip, State, Aadhaar, GST, Voter ID, Business Customer section **hide**.
- Contract Number, Deposit, Amount Paid/Owed — Customer screen par mat dikhana; ye Rentals UI par dikhayenge.

**Done when:** UI client (Kingsley) ke add/remove list ke mutabiq ho.

---

## 14. Summary table

| # | Sub-phase | Deliverable |
|---|-----------|-------------|
| 1 | API client (Vehicles + Customers) | vehicleApi.js, customerApi.js (fetch + token) |
| 2 | Vehicles: List | List page, filters, pagination, columns per schema + client |
| 3 | Vehicles: Create | Create form, POST /api/vehicles |
| 4 | Vehicles: View/Edit/Delete | Detail, edit form, PATCH, DELETE |
| 5 | Vehicles: Image upload | Image on create/edit, display on list/detail |
| 6 | Vehicles: Bulk upload | Template download, file upload, result (created/failed) |
| 7 | Customers: List | List page, search, pagination |
| 8 | Customers: Create | Create form, POST /api/customers |
| 9 | Customers: View/Edit/Delete | Detail, edit, PATCH, DELETE |
| 10 | UI: Client preferences | Vehicle/Customer screens par show/hide finalise |

---

## 15. Reference

- **Backend Phase 3:** `docs/backend/phase-3-vehicles-and-customers.md` (API summary, schema)
- **Workflow / schema:** `docs/Normal Docs/workflow.md` (§2 Vehicle, §3 Customer)
- **Auth implementation (pattern):** `rental_dashboard/documentation/implementation-of-auth-apis/README.md`

---

**Approval:** Pehle tum is doc ko padhkar approve karo. Uske baad ek-ek sub-phase approve karke code apply karenge. **Abhi koi code apply nahi hoga.**
