# Implementation of Rentals and Returns (Frontend)

**Rental Dashboard** ko **Rental Backend** ke Rentals aur Returns APIs se connect karna. Ye doc batata hai kitne sub-phases mein kaam hoga, kaunse pages/routes, payload–response kya hoga, **Toast** aur **SweetAlert2** kahan use karenge, aur structure **vehicles/customers jaisa hi** rahega taaki koi confusion na ho.

**Sub-phases 1–9 implemented:** API client, Rentals list/create/view/edit/cancel, Process return, Charges list + Add charge, UI polish (sidebar links, toasts, SweetAlert).

### Approval rule — zaroori

**Har sub-phase complete hone ke baad tumhara approval lena zaroori hai; approval ke baad hi agla sub-phase start hoga.**  
Ek sub-phase ka code apply → tum check karo → approve do → phir next sub-phase. Bina approval ke aage nahi jayenge.

---

## 1. Backend APIs (jo already bane hain)

Sab endpoints par **Bearer JWT** zaroori hai. Base path: `/api`. Backend: `docs/backend/phase-4-rentals-and-returns.md`.

### Rentals

| Method | Endpoint | Kya karta hai |
|--------|----------|----------------|
| POST | `/api/rentals` | Create rental (vehicle, customer, dates, amounts, terms); contract number auto; vehicle → RENTED |
| GET | `/api/rentals` | List (query: `status`, `vehicle_id`, `customer_id`, `start_date_from`, `start_date_to`, `page`, `limit`) |
| GET | `/api/rentals/:id` | Ek rental (optional `?include_charges=true`) |
| PATCH | `/api/rentals/:id` | **Edit rental** — sirf ACTIVE; dates, amounts, vehicle, customer, etc. COMPLETED par edit nahi |
| DELETE | `/api/rentals/:id` | Cancel/delete rental (ACTIVE ho to vehicle → AVAILABLE) |
| PATCH | `/api/rentals/:id/return` | Process return (actual date/time + charges); rental → COMPLETED; vehicle → AVAILABLE |

### Rental charges

| Method | Endpoint | Kya karta hai |
|--------|----------|----------------|
| GET | `/api/rentals/:id/charges` | Us rental ke saare charges (OTHER, description + amount) |
| POST | `/api/rentals/:id/charges` | ACTIVE rental par ek charge add (description + charge_amount) |

Backend base URL: same jo auth/vehicles/customers ke liye (e.g. `http://localhost:7080`).

---

## 2. Structure — Vehicles/Customers jaisa hi

Jis tarah **Vehicles** aur **Customers** ke liye routes, views, aur `public/js/pages` + API client use kiye, **Rentals & Returns** ke liye bhi same pattern follow karenge.

| Area | Vehicles/Customers | Rentals & Returns (yahan) |
|------|--------------------|----------------------------|
| **API client** | `public/js/api/vehicleApi.js`, `customerApi.js` | `public/js/api/rentalApi.js` |
| **Routes** | `routes/vehicle/vehicle.js`, `routes/customer/customer.js` | `routes/rental/rental.js`, `routes/return/return.js` (already exist; backend se connect karenge) |
| **Views** | `views/vehicle/*.ejs`, `views/customer/*.ejs` | `views/rental/*.ejs`, `views/return/*.ejs` (already hain; update/align karenge) |
| **Page scripts** | `public/js/pages/vehicle-list.js`, `customer-list.js`, etc. | `public/js/pages/rental-list.js`, `rental-add.js`, `rental-edit.js`, `rental-view.js`, `return-process.js` (jaise zarurat ho) |
| **Layout / notify** | Toastify + SweetAlert2 in `partials/scripts.ejs`, `notify.js` | Same — toasts success/error; SweetAlert confirm delete/cancel/return |

Isse **problems na aaye** kyunki pattern ek hi rahega: server route shell render kare, client-side `rentalApi` se data load/submit, aur `showToast` / `confirmUpdate` (ya confirm dialog) use karenge.

---

## 3. Flow (Rental → Return)

1. **Create rental**  
   Vehicle + Customer select (dropdown — `vehicleApi.list`, `customerApi.list`; vehicle status AVAILABLE wale dikhao), start/end date–time, charge method, total/advance/deposit, terms accepted → **POST /api/rentals** → success toast → redirect list ya view.

2. **List rentals**  
   **GET /api/rentals** — filters: status (ACTIVE/COMPLETED/CANCELLED), vehicle_id, customer_id, date range, pagination. Table/cards; row par View / Edit / Process return / Cancel.

3. **View rental**  
   **GET /api/rentals/:id** (optional `include_charges=true`) — contract-style view; charges list; “Process return” / “Edit” / “Cancel” buttons (status ke hisaab se).

4. **Edit rental**  
   Sirf **ACTIVE** rental. **PATCH /api/rentals/:id** — dates, amounts, vehicle, customer (partial update). Submit se pehle **SweetAlert confirm** (“Are you sure you want to update this rental?”). Success/error **toast**.

5. **Cancel rental**  
   ACTIVE rental par “Cancel” → **SweetAlert confirm** → **DELETE /api/rentals/:id** (ya PATCH with status CANCELLED). Success toast → list par redirect.

6. **Process return**  
   Active rentals list (ya view se) → “Process return” → form: actual return date, actual return time, optional charges (description + amount, multiple rows). Submit → **PATCH /api/rentals/:id/return** → success toast → view/list. COMPLETED par “Edit” disable.

7. **Rental charges**  
   View page par charges list (GET /api/rentals/:id/charges). ACTIVE rental par “Add charge” → modal/section: description + charge_amount → **POST /api/rentals/:id/charges** → toast, list refresh.

---

## 4. Toast + SweetAlert — kahan use karenge

- **Toast (Toastify, `showToast(msg, type)`)**  
  - Create rental success / error  
  - Edit rental success / error  
  - Process return success / error  
  - Add charge success / error  
  - Cancel/delete success / error  
  - List load error  

- **SweetAlert2 (e.g. `confirmUpdate` / custom `Swal.fire`)**  
  - **Edit rental:** “Are you sure you want to update this rental?” → Yes → PATCH.  
  - **Cancel rental:** “Are you sure you want to cancel this rental? Vehicle will be marked available.” → Yes → DELETE (or PATCH status CANCELLED).  
  - **Process return:** “Confirm return? This will complete the rental and free the vehicle.” → Yes → PATCH return.

Agar **confirmDelete** jaisa alag helper chahiye (sirf cancel/delete ke liye), to `notify.js` mein add kar sakte ho; wording doc ke hisaab se rakhna.

---

## 5. Sub-phases — kitne phases, kya kya

**Har sub-phase complete hone ke baad tumhara approval lena hoga; approval milne ke baad hi next sub-phase start hoga.** Pehle sub-phase ka code apply → tum verify → approve → phir next.

| # | Sub-phase | Kya karenge |
|---|-----------|-------------|
| **1** | **API client (Rentals)** | `rentalApi.js`: base URL + token (vehicle/customer API jaisa). Functions: `listRentals(params)`, `getRentalById(id, includeCharges)`, `createRental(body)`, `updateRental(id, body)`, `deleteRental(id)`, `processReturn(id, body)`, `listCharges(id)`, `addCharge(id, body)`. Sab `fetch` + Bearer token. |
| **2** | **Rentals: List page** | List page: GET /api/rentals, filters (status, vehicle_id, customer_id, start_date_from, start_date_to), pagination. Table columns: contract_number, vehicle, customer, start–end, status, total, actions (View/Edit/Return/Cancel). Load error → toast. Route + view (e.g. list-rentals.ejs) + page script (rental-list.js). |
| **3** | **Rentals: Create form** | Create rental form: vehicle dropdown (AVAILABLE only — vehicleApi), customer dropdown (customerApi), start/end date–time, charge method, total_amount, advance_paid, deposit, terms_accepted. Submit → POST /api/rentals → success toast + redirect; error → toast. |
| **4** | **Rentals: View page** | View rental: GET /api/rentals/:id (optional include_charges). Contract-style layout; charges list; buttons: Process return (if ACTIVE), Edit (if ACTIVE), Cancel (if ACTIVE). |
| **5** | **Rentals: Edit page** | Edit rental (sirf ACTIVE): form pre-fill from GET /api/rentals/:id. Submit se pehle SweetAlert confirm → PATCH /api/rentals/:id → success/error toast. COMPLETED par edit link/button hide ya disable. |
| **6** | **Rentals: Cancel** | List/View par “Cancel” → SweetAlert confirm → DELETE /api/rentals/:id (ya PATCH status CANCELLED) → success toast + redirect to list. |
| **7** | **Returns: Process return** | Return list/entry: active rentals (filter status=ACTIVE ya “Process return” se). Process return form: actual_return_date, actual_return_time, charges[] (description + charge_amount). Submit → PATCH /api/rentals/:id/return → success toast + redirect. SweetAlert: “Confirm return?” |
| **8** | **Rental charges: List + Add** | View rental page par charges list (GET /api/rentals/:id/charges). ACTIVE rental par “Add charge” — modal/section: description + charge_amount → POST /api/rentals/:id/charges → toast, charges list refresh. |
| **9** | **UI polish: Toasts + SweetAlert** | Saari screens par success/error toasts consistent; delete/cancel/return par SweetAlert confirm. Sidebar/nav mein Rentals & Returns links sahi; structure vehicles/customers jaisa finalise. |

**Total: 9 sub-phases.**

### Rental vs Returns — kab test karein

- **Sub-phases 1–6 = Rentals:** API client, List, Create, View, Edit, Cancel. **Jab ye 6 complete ho jayein, pehle rentals poora test kar lo (list, create, view, edit, cancel).**
- **Sub-phase 7 = Returns:** Process return flow. **Rentals test ke baad hi returns (process return) par jayenge.**
- **Sub-phases 8–9:** Charges (list + add) + UI polish.

---

## 6. Files / folders (target)

| Item | Path |
|------|------|
| Rental API client | `rental_dashboard/public/js/api/rentalApi.js` |
| Rental list page script | `rental_dashboard/public/js/pages/rental-list.js` |
| Rental create page script | `rental_dashboard/public/js/pages/rental-add.js` |
| Rental view page script | `rental_dashboard/public/js/pages/rental-view.js` |
| Rental edit page script | `rental_dashboard/public/js/pages/rental-edit.js` |
| Process return page script | `rental_dashboard/public/js/pages/return-process.js` |
| Rental routes | `rental_dashboard/routes/rental/rental.js` (backend API se connect) |
| Return routes | `rental_dashboard/routes/return/return.js` (backend API se connect) |
| Views | `views/rental/list-rentals.ejs`, `create-rental.ejs`, `view-rental.ejs`, `edit-rental.ejs`; `views/return/list-active.ejs`, `process-return.ejs` |
| Notify (already) | `public/js/notify.js` (showToast, confirmUpdate); layout `partials/scripts.ejs` (Toastify, SweetAlert2) |

Create/Edit rental forms mein vehicle aur customer dropdowns ke liye existing **vehicleApi** aur **customerApi** use karenge; structure vehicles/customers jaisa hi rahega.

---

## 7. Payload / response (reference)

### Create rental (POST /api/rentals)

- **Body:** `vehicle_id`, `customer_id`, `start_date`, `start_time`, `end_date`, `end_time`, `expected_return_date`, `expected_return_time` (optional; backend end se set kar sakta hai), `selected_charge_method` (DAILY | WEEKLY | MONTHLY | HOURLY), `total_amount`, `advance_paid`, `deposit`, `terms_accepted: true`, optional `helmets_quantity`, `customer_signature`, `staff_signature`.
- **Response:** 201 `{ rental }`. Error: 400 (validation/availability), 401, 403.

### Edit rental (PATCH /api/rentals/:id)

- **Body (sab optional):** `vehicle_id`, `customer_id`, `start_date`, `start_time`, `end_date`, `end_time`, `expected_return_date`, `expected_return_time`, `selected_charge_method`, `total_amount`, `advance_paid`, `deposit`, `helmets_quantity`, `customer_signature`, `staff_signature`, `status` (sirf ACTIVE ya CANCELLED). Sirf ACTIVE rental editable; COMPLETED par 400.
- **Response:** 200 `{ rental }`. Error: 400, 404.

### Process return (PATCH /api/rentals/:id/return)

- **Body:** `actual_return_date`, `actual_return_time`, optional `charges: [{ description, charge_amount }]`.
- **Response:** 200 `{ rental, charges }`. Error: 400, 404.

### Add charge (POST /api/rentals/:id/charges)

- **Body:** `description`, `charge_amount`.
- **Response:** 201 `{ charge }`. Error: 400, 404 (sirf ACTIVE rental par add).

---

## 8. Summary table

| # | Sub-phase | Deliverable |
|---|-----------|-------------|
| 1 | API client | rentalApi.js (list, get, create, update, delete, processReturn, listCharges, addCharge) |
| 2 | Rentals list | List page, filters, pagination, toasts on error |
| 3 | Create rental | Form, vehicle/customer dropdowns, POST, toasts |
| 4 | View rental | GET by id, charges optional, action buttons |
| 5 | Edit rental | Edit form (ACTIVE only), SweetAlert confirm, PATCH, toasts |
| 6 | Cancel rental | SweetAlert confirm, DELETE (or PATCH CANCELLED), toast + redirect |
| 7 | Process return | Form actual date/time + charges, SweetAlert confirm, PATCH return, toasts |
| 8 | Charges list + add | View par charges; Add charge (ACTIVE) modal, POST charges, toasts |
| 9 | UI polish | Consistent toasts + SweetAlert; nav/sidebar; structure = vehicles/customers |

---

## 9. Reference

- **Backend Phase 4:** `docs/backend/phase-4-rentals-and-returns.md` (API summary, edit rule: sirf ACTIVE)
- **Vehicles/Customers frontend doc:** `rental_dashboard/documentation/implementation-of-customer-and-vehicles/README.md` (structure, API client pattern)
- **Auth pattern:** `rental_dashboard/documentation/implementation-of-auth-apis/README.md`
- **Notify:** `rental_dashboard/public/js/notify.js` (showToast, confirmUpdate); layout scripts: Toastify + SweetAlert2

---

**Approval:** Pehle is doc ko padhkar approve karo. Uske baad ek-ek sub-phase ka code apply karenge — **har sub-phase complete hone ke baad tumhara approval lena zaroori hai, approval ke bina agla sub-phase start nahi hoga.** Structure vehicles/customers jaisa rakhne se **problems na aaye**; SweetAlert aur toasts sab jagah consistently lagaenge.
