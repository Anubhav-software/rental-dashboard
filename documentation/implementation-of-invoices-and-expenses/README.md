# Implementation of Invoices and Expenses (Frontend)

**Rental Dashboard** ko **Rental Backend** ke Invoices aur Expenses APIs se connect karna. Ye doc batata hai kitne sub-phases mein kaam hoga, kaunse pages/routes, payload–response kya hoga, **Toast** aur **SweetAlert2** kahan use karenge, aur structure **rentals/vehicles/customers jaisa hi** rahega.

**Order:** Pehle **saari Invoice part** implement karenge (sub-phases 1–7); jab invoice part complete ho jaye, uske baad **Expense part** (sub-phases 8–13). Invoice poora karo → approve → phir Expense start.

### Approval rule — zaroori

**Har sub-phase complete hone ke baad tumhara approval lena zaroori hai; approval ke baad hi agla sub-phase start hoga.**  
Ek sub-phase ka code apply → tum check karo → approve do → phir next sub-phase. Bina approval ke aage nahi jayenge.

---

## 1. Backend APIs (jo already bane hain)

Sab endpoints par **Bearer JWT** zaroori hai. Base path: `/api`. Backend: `docs/backend/phase-5-invoices-and-expenses.md`.

### Invoices

| Method | Endpoint | Kya karta hai |
|--------|----------|----------------|
| POST | `/api/invoices` | Create: **from rental** (body: `rental_id` [, invoice_type, due_date ]) **ya manual** (body: `customer_id`, `line_items` [, invoice_type, due_date, notes ]) |
| GET | `/api/invoices` | List (query: status, customer_id, rental_id, issue_date_from, issue_date_to, page, limit) |
| GET | `/api/invoices/:id` | Ek invoice (full snapshot + line_items) |
| PATCH | `/api/invoices/:id` | Update (status, due_date, notes) |
| POST | `/api/invoices/:id/send-pdf` | Invoice PDF generate karke customer email par bhejo |

### Expenses

| Method | Endpoint | Kya karta hai |
|--------|----------|----------------|
| POST | `/api/expenses` | Create (amount, category, description, expense_date [, receipt_path ]); amount ≤ threshold → auto APPROVED, warna PENDING |
| GET | `/api/expenses` | List (query: status, category, expense_date_from, expense_date_to, page, limit) |
| GET | `/api/expenses/:id` | Ek expense |
| PATCH | `/api/expenses/:id/approve` | Approve (Owner only); PENDING → APPROVED |
| PATCH | `/api/expenses/:id/reject` | Reject (Owner only); body: { rejection_reason }; PENDING → REJECTED |

Backend base URL: same jo auth/rentals/vehicles ke liye (e.g. `http://localhost:7080`).

---

## 2. Structure — Rentals/Vehicles jaisa hi

Jis tarah **Rentals** aur **Vehicles/Customers** ke liye API client, routes, views, aur `public/js/pages` use kiye, **Invoices** aur **Expenses** ke liye bhi same pattern follow karenge.

| Area | Rentals/Vehicles | Invoices (yahan) | Expenses (yahan) |
|------|------------------|------------------|------------------|
| **API client** | rentalApi.js, vehicleApi.js | invoiceApi.js | expenseApi.js |
| **Routes** | routes/rental/, routes/return/ | routes/invoice/ | routes/expense/ |
| **Views** | views/rental/*.ejs, views/return/*.ejs | views/invoice/*.ejs | views/expense/*.ejs |
| **Page scripts** | rental-list.js, rental-view.js, etc. | invoice-list.js, invoice-view.js, etc. | expense-list.js, expense-view.js, etc. |
| **Notify** | Toastify + SweetAlert2 | Same — toasts success/error; SweetAlert confirm send-pdf / reject |

---

## 3. Folder structure (target)

### Invoices

| Item | Path |
|------|------|
| Invoice API client | `rental_dashboard/public/js/api/invoiceApi.js` |
| Invoice list page script | `rental_dashboard/public/js/pages/invoice-list.js` |
| Invoice view page script | `rental_dashboard/public/js/pages/invoice-view.js` |
| Invoice create (manual) page script | `rental_dashboard/public/js/pages/invoice-add.js` |
| Invoice edit/update page script | `rental_dashboard/public/js/pages/invoice-edit.js` |
| Invoice routes | `rental_dashboard/routes/invoice/invoice.js` (backend API se connect) |
| Views | `views/invoice/list.ejs`, `view.ejs` (ya preview.ejs), `add.ejs` (manual), `edit.ejs` |

**Note:** Rental view page se "Generate invoice" button → backend `POST /api/invoices` with `rental_id` (create from rental). Manual invoice ke liye alag form (customer + line_items).

### Expenses

| Item | Path |
|------|------|
| Expense API client | `rental_dashboard/public/js/api/expenseApi.js` |
| Expense list page script | `rental_dashboard/public/js/pages/expense-list.js` |
| Expense add page script | `rental_dashboard/public/js/pages/expense-add.js` |
| Expense view page script | `rental_dashboard/public/js/pages/expense-view.js` |
| Expense routes | `rental_dashboard/routes/expense/expense.js` (backend API se connect) |
| Views | `views/expense/list-expenses.ejs`, `add-expense.ejs`, `view-expense.ejs` |

**Note:** Approve/Reject — Owner only; list/view par PENDING expenses par Approve / Reject buttons (backend 403 if not Owner).

---

## 4. Sub-phases — Part A: Invoices (pehle ye sab)

**Pehle saari invoice implementation; jab Part A complete ho, phir Part B (Expenses) start karenge.**

| # | Sub-phase | Kya karenge |
|---|-----------|-------------|
| **I.1** | **API client (Invoices)** | `invoiceApi.js`: base URL + Bearer token (rentalApi jaisa). Functions: `listInvoices(params)`, `getInvoiceById(id)`, `createFromRental(body)`, `createManual(body)`, `updateInvoice(id, body)`, `sendPdf(id)`. Sab `fetch` + token. |
| **I.2** | **Invoices: List page** | List page: GET /api/invoices, filters (status, customer_id, rental_id, issue_date_from, issue_date_to), pagination. Table: invoice_number, customer_name, status, total_amount, issue_date, actions (View, Edit, Send PDF). Load error → toast. Route + view (list.ejs) + invoice-list.js. |
| **I.3** | **Invoices: View page** | View invoice: GET /api/invoices/:id. Snapshot + line_items dikhao; company/customer/vehicle doc number, totals. Buttons: Edit, Send PDF. |
| **I.4** | **Create from rental** | Rental view page par "Generate invoice" button (sirf COMPLETED rentals). Click → confirm → POST /api/invoices { rental_id } → success toast (invoice number) + redirect to invoice view ya list. Error (e.g. already has invoice) → toast. |
| **I.5** | **Invoices: Manual create** | Manual invoice form: customer dropdown (customerApi.list), invoice_type (B2C/B2B), line_items (description, quantity, unit_price, amount — multiple rows), due_date, notes. Submit → POST /api/invoices (bina rental_id) → success toast + redirect. |
| **I.6** | **Invoices: Update (PATCH)** | Invoice view/edit page: status (DRAFT/ISSUED/SENT/PAID/CANCELLED), due_date, notes. Submit → PATCH /api/invoices/:id → success/error toast. SweetAlert confirm optional. |
| **I.7** | **Invoices: Send PDF** | View/list par "Send PDF" button → SweetAlert confirm ("Send invoice PDF to customer email?") → POST /api/invoices/:id/send-pdf → success toast ("PDF sent to customer"); error (e.g. no email) → toast. |

**Part A total: 7 sub-phases (I.1 – I.7).**  
Part A complete hone ke baad **invoices poora test karo** (list, create from rental, manual create, view, update, send PDF). Approval ke baad Part B start.

---

## 5. Sub-phases — Part B: Expenses (uske baad)

**Part A (Invoices) complete + approval ke baad hi Part B start hoga.**

| # | Sub-phase | Kya karenge |
|---|-----------|-------------|
| **E.1** | **API client (Expenses)** | `expenseApi.js`: base URL + Bearer token. Functions: `listExpenses(params)`, `getExpenseById(id)`, `createExpense(body)`, `approveExpense(id)`, `rejectExpense(id, body)`. Sab `fetch` + token. |
| **E.2** | **Expenses: List page** | List page: GET /api/expenses, filters (status, category, expense_date_from, expense_date_to), pagination. Table: amount, category, description, expense_date, status, actions (View, Approve, Reject — status ke hisaab se). Load error → toast. Route + view (list-expenses.ejs) + expense-list.js. |
| **E.3** | **Expenses: Create form** | Add expense form: amount, category (FUEL, MAINTENANCE, INSURANCE, REPAIR, OFFICE, OTHER), description, expense_date, optional receipt_path (ya file upload later). Submit → POST /api/expenses → success toast + redirect; auto-approve message agar amount ≤ threshold. |
| **E.4** | **Expenses: View page** | View expense: GET /api/expenses/:id. Full detail; PENDING par Approve / Reject buttons (Owner only — backend 403 for Staff). |
| **E.5** | **Expenses: Approve (Owner)** | List/View par "Approve" (sirf PENDING, sirf Owner). SweetAlert confirm → PATCH /api/expenses/:id/approve → success toast. 403 → "Owner access required" toast. |
| **E.6** | **Expenses: Reject (Owner)** | List/View par "Reject" (sirf PENDING, sirf Owner). Modal/section: rejection_reason (optional). SweetAlert confirm → PATCH /api/expenses/:id/reject { rejection_reason } → success toast. 403 → toast. |

**Part B total: 6 sub-phases (E.1 – E.6).**

---

## 6. Toast + SweetAlert — kahan use karenge

- **Toast (Toastify, `showToast(msg, type)`)**  
  - Invoice: list load error; create (from rental / manual) success/error; update success/error; send PDF success/error.  
  - Expense: list load error; create success/error; approve success/error; reject success/error; 403 Owner required.

- **SweetAlert2**  
  - **Send PDF:** "Send invoice PDF to customer email?" → Yes → POST send-pdf.  
  - **Approve expense:** "Approve this expense?" → Yes → PATCH approve.  
  - **Reject expense:** "Reject this expense?" (optional reason) → Yes → PATCH reject.

---

## 7. Payload / response (reference)

### Invoices

- **Create from rental (POST /api/invoices)**  
  Body: `{ rental_id [, invoice_type, due_date ] }`.  
  Response: 201 `{ invoice: { id, invoiceNumber, status, totalAmount, ... } }`.

- **Create manual (POST /api/invoices)**  
  Body: `{ customer_id, line_items: [{ description, quantity?, unit_price?, amount }] [, invoice_type, due_date, notes ] }`.  
  Response: 201 `{ invoice }`.

- **List (GET /api/invoices)**  
  Query: status, customer_id, rental_id, issue_date_from, issue_date_to, page, limit.  
  Response: 200 `{ invoices, total, page, limit }`.

- **Get (GET /api/invoices/:id)**  
  Response: 200 `{ invoice }` (snapshot + lineItems, customerName, vehicleDocumentNumber, etc.).

- **Update (PATCH /api/invoices/:id)**  
  Body: `{ status?, due_date?, notes? }`.  
  Response: 200 `{ invoice }`.

- **Send PDF (POST /api/invoices/:id/send-pdf)**  
  Response: 200 `{ sent: true, message: "..." }`. Error: 400 (no customer email), 404, 500.

### Expenses

- **Create (POST /api/expenses)**  
  Body: `{ amount, category, description, expense_date [, receipt_path, currency_code, currency_symbol ] }`.  
  Response: 201 `{ expense }` (status APPROVED ya PENDING).

- **List (GET /api/expenses)**  
  Query: status, category, expense_date_from, expense_date_to, page, limit.  
  Response: 200 `{ expenses, total, page, limit }`.

- **Get (GET /api/expenses/:id)**  
  Response: 200 `{ expense }`.

- **Approve (PATCH /api/expenses/:id/approve)** — Owner only.  
  Response: 200 `{ expense }`. 403 if not Owner.

- **Reject (PATCH /api/expenses/:id/reject)** — Owner only.  
  Body: `{ rejection_reason? }`.  
  Response: 200 `{ expense }`. 403 if not Owner.

---

## 8. Summary table

| Part | # | Sub-phase | Deliverable |
|------|---|-----------|-------------|
| **A** | I.1 | API client (Invoices) | invoiceApi.js (list, get, createFromRental, createManual, update, sendPdf) |
| A | I.2 | Invoices list | List page, filters, pagination, toasts |
| A | I.3 | Invoice view | View page, snapshot + line items, Edit / Send PDF |
| A | I.4 | Create from rental | "Generate invoice" on rental view (COMPLETED), POST with rental_id |
| A | I.5 | Manual invoice | Form customer + line_items, POST without rental_id |
| A | I.6 | Invoice update | PATCH status, due_date, notes |
| A | I.7 | Send PDF | Button + confirm → POST send-pdf, toasts |
| **B** | E.1 | API client (Expenses) | expenseApi.js (list, get, create, approve, reject) |
| B | E.2 | Expenses list | List page, filters, pagination, toasts |
| B | E.3 | Expense create | Form amount, category, description, date; POST |
| B | E.4 | Expense view | View page; Approve/Reject (Owner) |
| B | E.5 | Approve (Owner) | Confirm → PATCH approve, 403 handled |
| B | E.6 | Reject (Owner) | Reason + confirm → PATCH reject, 403 handled |

**Total: 13 sub-phases (7 Invoice + 6 Expense).**  
**Order:** I.1 → I.2 → … → I.7 (full invoice flow) → **approval** → E.1 → E.2 → … → E.6.

---

## 9. Reference

- **Backend Phase 5:** `docs/backend/phase-5-invoices-and-expenses.md` (API summary, document number, PDF+email, expense approval)
- **Rentals frontend doc:** `rental_dashboard/documentation/implementation-of-rentals-and-returns/README.md` (structure, API client, toasts)
- **Vehicles/Customers doc:** `rental_dashboard/documentation/implementation-of-customer-and-vehicles/README.md`
- **Notify:** `rental_dashboard/public/js/notify.js` (showToast, confirmUpdate); layout scripts: Toastify + SweetAlert2

---

**Approval:** Pehle is doc ko padhkar approve karo. Uske baad **Part A (Invoices)** se start karenge — ek-ek sub-phase (I.1, I.2, … I.7) ka code apply, har sub-phase ke baad tumhara approval. **Part A complete + approval ke baad** **Part B (Expenses)** start hoga (E.1 – E.6). Structure rentals/vehicles jaisa rakhne se problems na aaye; SweetAlert aur toasts sab jagah consistently lagaenge.
