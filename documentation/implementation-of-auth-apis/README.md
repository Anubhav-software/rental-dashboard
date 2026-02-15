# Implementation of Auth APIs (Frontend)

**Rental Dashboard** ko **Rental Backend** ke auth APIs se connect karna. Ye doc batata hai kitne phases mein kaam hoga, kaunse files/folders banenge, payload-response kya hoga, aur kab code apply hoga (tum approval doge).

---

## Backend APIs (jo already bane hain)

| Method | Endpoint | Auth? | Kya karta hai |
|--------|----------|-------|----------------|
| POST | `/api/auth/signup` | No | Signup: email, password, name, role, (companyId) |
| POST | `/api/auth/login` | No | Login step 1: email bhejo → OTP email par bhej diya jata hai |
| POST | `/api/auth/verify-otp` | No | Login step 2: email + OTP bhejo → **token + user** milta hai |
| GET | `/api/auth/me` | Yes (Bearer token) | Current user (token se) |
| POST | `/api/companies` | Yes (Bearer token) | Owner company create kare (companyId null wale) |

Backend base URL example: `http://localhost:7080` (rental_backend port).

---

## Phases — kitne phases, kya kya

| Phase | Naam | Kya karenge | Approval ke baad |
|-------|------|-------------|-------------------|
| **1** | Config + API client | API base URL (env), ek chhota JS module jo backend ko fetch se call kare, CORS note | Code apply |
| **2** | Signup page | Signup form se real API call (POST signup), success/error, redirect signin | Code apply |
| **3** | Sign In (request OTP) | Signin = sirf email, POST login → OTP bhejna, phir verify-otp page par redirect (email pass karna) | Code apply |
| **4** | Verify OTP page | Email + OTP → POST verify-otp → **token + user** save (localStorage), redirect (company setup ya dashboard) | Code apply |
| **5** | Company setup (Owner) | Agar OWNER + companyId null → **existing** `views/settings/company.ejs` (sidebar wala) use karenge. Empty form = create (POST /api/companies). Success ke baad **login page** par redirect (taaki user login karke aaye). | Code apply |
| **6** | Auth guard + logout | Protected routes par token check; logout = token clear; GET /me optional | Code apply |

**Total 6 phases.** Har phase ke baad tum approve karoge, phir usi phase ka code apply hoga.

---

## Phase 1 — Config + API client

**Kya karenge**

- Dashboard ke liye **API base URL** config (env ya config file). Example: `VITE_API_URL` ya `API_BASE_URL=http://localhost:7080`. EJS se server-side inject kar sakte ho ya public JS config.
- Ek **auth API client** (plain JS): functions jaise `signup(body)`, `login(email)`, `verifyOtp(email, otp)`, `getMe(token)`, `createCompany(token, body)`. Sab `fetch` se backend ko call karenge.
- **Backend (rental_backend)** par **CORS** enable karna hoga taaki browser se dashboard (e.g. localhost:8080) se 7080 par request ja sake. (Ye phase 1 doc mein likhenge; CORS code rental_backend mein apply karenge.)

**Files / folders**

| Item | Type | Path |
|------|------|------|
| Config | File | `rental_dashboard/public/js/config.js` ya `.env` + EJS inject |
| Auth API module | File | `rental_dashboard/public/js/api/authApi.js` |
| Backend CORS | Edit | `rental_backend/server.js` (CORS middleware add) |

**Payload / Response (reference — Phase 1 mein sirf client banega)**

- Signup: POST body `{ name, email, password, role?, companyId? }` → 201 `{ user }` / 400 or 409 `{ error }`
- Login: POST body `{ email }` → 200 `{ message }`
- Verify OTP: POST body `{ email, otp }` → 200 `{ token, user }` / 401 `{ error }`
- Get me: GET header `Authorization: Bearer <token>` → 200 `{ user }` / 401
- Create company: POST header `Authorization: Bearer <token>`, body `{ name, ... }` → 201 `{ company, user, token }`

**Done when:** Config + authApi.js ready, backend CORS on. Koi page abhi change nahi.

---

## Phase 2 — Signup page

**Kya karenge**

- Signup form ko **submit pe** real API se jodna: `POST /api/auth/signup` with body `{ name, email, password, role }` (companyId optional; STAFF ke liye baad mein add kar sakte ho).
- Success → message dikhao + redirect to **Sign In** page.
- Error (400/409) → response ka `error` message dikhao, form wahi rehne do.

**Files**

| Item | Path |
|------|------|
| View | `rental_dashboard/views/authentication/signup.ejs` |
| Route | `rental_dashboard/routes/authentication/authentication.js` (signup GET/POST) |

**Payload (frontend → backend)**

```json
{
  "name": "User Full Name",
  "email": "user@example.com",
  "password": "min 6 chars",
  "role": "OWNER" | "STAFF",
  "companyId": null
}
```

(companyId sirf STAFF ke liye, invite flow mein; abhi optional.)

**Response (backend → frontend)**

- **201:** `{ "user": { "id", "email", "name", "role", "company_id", "created_at" } }`
- **400:** `{ "error": "Email, password and name are required" }` (ya validation message)
- **409:** `{ "error": "User with this email already exists" }`

**Done when:** Signup submit → API call → success par signin redirect, error par message.

---

## Phase 3 — Sign In (request OTP)

**Kya karenge**

- Sign In page = **sirf email** (backend OTP-based hai; password signin hata dena ya optional leave).
- Form submit → `POST /api/auth/login` with body `{ email }`.
- Success → user ko **Verify OTP** page par bhejo, aur **email** pass karo (query param ya sessionStorage: `verify-otp?email=...` ya sessionStorage.setItem('pendingLoginEmail', email)).
- Error → message dikhao.

**Files**

| Item | Path |
|------|------|
| View | `rental_dashboard/views/authentication/signin.ejs` |
| Route | `rental_dashboard/routes/authentication/authentication.js` (signin GET/POST) |

**Payload (frontend → backend)**

```json
{
  "email": "user@example.com"
}
```

**Response (backend → frontend)**

- **200:** `{ "message": "OTP sent to your email." }` (ya "If an account exists, an OTP has been sent...")
- **400:** `{ "error": "Email is required" }`

**Done when:** Signin submit → login API → success par verify-otp page open, email available wahan.

---

## Phase 4 — Verify OTP page

**Kya karenge**

- Verify OTP page par **email** (Phase 3 se) + **OTP** input. Submit → `POST /api/auth/verify-otp` with `{ email, otp }`.
- Success → response mein **token** aur **user** (id, email, name, role, company_id). Inhe **localStorage** (ya cookie) mein save karo: e.g. `authToken`, `authUser`.
- Redirect:
  - Agar **role === 'OWNER'** aur **company_id === null** → **Company setup** page.
  - Warna → **Dashboard** (owner/staff dashboard).

**Files**

| Item | Path |
|------|------|
| View | `rental_dashboard/views/authentication/verifyOtp.ejs` |
| Route | `rental_dashboard/routes/authentication/authentication.js` (verify-otp GET/POST) |

**Payload (frontend → backend)**

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response (backend → frontend)**

- **200:** `{ "token": "eyJ...", "user": { "id", "email", "name", "role", "company_id" } }`
- **401:** `{ "error": "Invalid or expired OTP" }`

**Done when:** Verify submit → API → token + user save → redirect company setup ya dashboard.

---

## Phase 5 — Company setup (Owner)

**Kya karenge**

- **Naya page nahi banayenge.** Tumhare paas already **`views/settings/company.ejs`** hai (sidebar wala). Usi ko use karenge.
- Jab **OWNER** aur **company_id null** ho (verify-otp ke baad) → user ko **`/settings/company`** par redirect karenge (sidebar wala layout). Wahan form **empty** hoga (create mode).
- Form submit → `POST /api/companies` with header `Authorization: Bearer <token>`, body company details.
- Success → response mein **company**, **user**, **token** aata hai. Company ban gayi. **Redirect: login (signin) page** — taaki user ab login karke apne company ke sath dashboard use kare. (Token yahan save karke dashboard pe bhejna optional; tumne bola success ke baad login par redirect.)
- Baad mein jab company already hogi to same page **edit** mode mein use ho sakta hai (Phase 3 backend update company).

**Files**

| Item | Path |
|------|------|
| View (existing) | `rental_dashboard/views/settings/company.ejs` — reuse; create mode = empty form, submit = POST /api/companies |
| Route (existing) | `rental_dashboard/routes/settings/settings.js` — GET/POST `/settings/company` ko real API se jodna (create when no company) |

**Payload (frontend → backend)**

```json
{
  "name": "My Rental Company",
  "country": "India",
  "currencyCode": "INR",
  "currencySymbol": "₹"
}
```

(Backend accepts more fields; name required.)

**Response (backend → frontend)**

- **201:** `{ "company": { "id", "name", ... }, "user": { "id", "email", "name", "role", "company_id" }, "token": "eyJ..." }`
- **400/403:** `{ "error": "..." }`

**Done when:** Owner without company → redirect to existing **settings/company** page (sidebar) → empty form → POST /api/companies → success ke baad **login page** par redirect (user login karke aayega).

---

## Phase 6 — Auth guard + logout

**Kya karenge**

- **Protected routes** (dashboard, etc.): agar **token** nahi (localStorage) to redirect **Sign In**.
- **Logout:** token + user clear (localStorage), redirect Sign In.
- Optional: kisi protected load par **GET /api/auth/me** call karke user refresh (token valid hai ya nahi).

**Files**

| Item | Path |
|------|------|
| Middleware / helper | `rental_dashboard/public/js/api/authGuard.js` ya routes mein check |
| Routes | `rental_dashboard/routes/routes.js` (protected routes par token check) |
| Logout | `rental_dashboard/routes/authentication/authentication.js` (logout clear token + redirect) |

**Done when:** Bina token dashboard nahi khule; logout se token clear + signin.

---

## Summary table — payload / response sab ek jagah

| API | Request | Success response | Error response |
|-----|---------|-------------------|----------------|
| POST /api/auth/signup | `{ name, email, password, role?, companyId? }` | 201 `{ user }` | 400/409 `{ error }` |
| POST /api/auth/login | `{ email }` | 200 `{ message }` | 400 `{ error }` |
| POST /api/auth/verify-otp | `{ email, otp }` | 200 `{ token, user }` | 401 `{ error }` |
| GET /api/auth/me | Header `Authorization: Bearer <token>` | 200 `{ user }` | 401 |
| POST /api/companies | Header `Authorization: Bearer <token>`, body `{ name, ... }` | 201 `{ company, user, token }` | 400/403 `{ error }` |

---

## Frontend env / config

Dashboard ko backend URL chahiye. Options:

1. **`.env`** (dashboard): `API_BASE_URL=http://localhost:7080` — server (Node) read kare, EJS mein inject: `window.API_BASE_URL = '<%= process.env.API_BASE_URL %>'`.
2. Ya **public/js/config.js**: `const API_BASE_URL = 'http://localhost:7080';` (default dev).

Tumhari **rental_backend** `.env.example` mein real credentials mat commit karna; sirf placeholder. Dashboard ke liye alag se `API_BASE_URL` use karenge (doc mein hai).

---

## Approval flow

1. Tum is doc ko padho.
2. Jab **Phase 1** ke liye approval do → hum Phase 1 ka code apply karenge (config, authApi.js, backend CORS).
3. Phir **Phase 2** approval → signup integration.
4. Isi tarah **Phase 3, 4, 5, 6** — ek ek phase approval, phir code.

**Kab code apply karna hai:** Jab tum bolo "Phase X approve" / "Phase X ka code apply karo".

---

## Folder structure (implementation ke baad)

```
rental_dashboard/
├── documentation/
│   └── implementation-of-auth-apis/
│       └── README.md          (ye doc)
├── public/
│   └── js/
│       ├── config.js          (Phase 1 — API base URL)
│       └── api/
│           ├── authApi.js     (Phase 1 — fetch wrappers)
│           └── authGuard.js   (Phase 6 — optional)
├── views/
│   ├── authentication/
│   │   ├── signup.ejs         (Phase 2 — edit)
│   │   ├── signin.ejs         (Phase 3 — edit)
│   │   └── verifyOtp.ejs      (Phase 4 — edit)
│   └── settings/
│       └── company.ejs        (Phase 5 — existing; reuse, no new page)
└── routes/
    ├── authentication/
    │   └── authentication.js  (Phase 2–4, 6 — edit)
    └── settings/
        └── settings.js        (Phase 5 — edit; /settings/company ko real API se jodna)
```

Backend: `rental_backend/server.js` — Phase 1 mein CORS add.

**Note:** Company setup ke liye **naya page nahi** — existing **settings/company.ejs** (sidebar wala) hi use hoga; create mode = empty form + POST /api/companies.

---

**End of doc.** Ab tum phase-by-phase approval do, hum code apply karenge.
