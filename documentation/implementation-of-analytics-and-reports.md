# Implementation of Analytics and Reports (Frontend)

This document describes how to implement **analytics and reports** in the rental dashboard using the **backend Phase 6 APIs** (`/api/analytics/*`). It covers: (1) removing unnecessary template content from the dashboard, (2) making KPIs and graphs use real data, (3) distinguishing the **main dashboard** (overall/default data) from the **Reports** page (user-set filters, default “all data”), and (4) a phased implementation plan.

**Backend reference:** Phase 6 is implemented. See `docs/backend/phase-6-calendar-analytics-reports.md`. All analytics calculation happens on the server; the frontend only calls APIs and displays results.

---

## 1. Current state (from code)

### 1.1 Dashboard page (`/owner/dashboard/index5`)

- **Route:** `routes/dashboard/dashboard.js` → `GET /index5`
- **Data source:** **Demo data** only. The route uses `demoRentals` and `demoExpenses` from rental/expense routers and computes `revenue`, `expenses`, `profit`, `activeRentals` in the **route** (server-side from static arrays). No call to backend `/api/analytics` or real rental/expense APIs.
- **View:** `views/dashboard/index5.ejs`
- **What is rental-relevant and should stay (and be wired to real data):**
  - **Top row:** Four KPI cards — Revenue (this month), Expenses (this month), Profit (this month), Active Rentals. Currently show values from demo stats.
  - **What’s due today** — uses `dueListToday` from vehicle router (can stay as is if already real).
  - **Recent Rentals** — table from `recentRentals` (demo). Should later use real rental list API.
- **What is unnecessary (template / not rental-specific) and should be removed or replaced:**
  - **Revenue Statistics** — hardcoded “Income $26,201”, “Expenses $18,120”, “Yearly” dropdown (no API), and chart `#upDownBarchart`. Either **remove** or **replace** with one dynamic chart from `GET /api/analytics/profit-by-month?year=` (see Phase 2).
  - **Statistic** — “Daily Conversions %60”, “Visits By Day 20k”, “Today Income $5.5k”, and charts `#semiCircleGauge`, `#areaChart`, `#dailyIconBarChart`. Not rental metrics → **remove**.
  - **Most Location** — world map and USA/Japan/France/Germany list. Not relevant → **remove**.
  - **My Portfolio** — “Total Gain $50,000”, “Total Investment $20,000”, donut chart. Not rental → **remove**.
  - **Latest Investments** — Gold, Dollars, Stock Market table. Not rental → **remove**.
  - **Notice board** — Lorem placeholder. Not rental → **remove**.
  - **Total Transactions** — “Total Gain $50,000”, `#transactionLineChart`, period dropdown. Not wired to real data → **remove** or replace with one analytics chart.
  - **Project Status** — Gold, Dollars, Stock Market progress table. Not rental → **remove**.

**Summary:** Dashboard should keep: **4 KPI cards**, **What’s due today**, **Recent Rentals**, and **at most one** dynamic chart (e.g. revenue/expense/profit by month). Remove all other template widgets.

### 1.2 Reports page (`/owner/reports/profit`)

- **Routes:** `routes/reports/reports.js` → `GET /reports/profit`, `/reports/revenue`, `/reports/expense`
- **Data source:** **Demo data** only. `revenueInRange(from, to)` and `expensesInRange(from, to)` compute from `demoRentals` and `demoExpenses`. Date range from query `from` / `to`; default = current month (first day to today).
- **Views:** `views/reports/profit-report.ejs`, `revenue-report.ejs`, `expense-report.ejs`
- **Profit report:** Shows period (from–to), three cards (Revenue, Expenses, Net Profit), and links “Revenue detail” / “Expense detail”. **No graph** yet; space is empty. User requirement: **by default show “all data”** (e.g. from start of year to today, or “all time”); user can then narrow with filters.

**Summary:** Reports should use **real analytics API** for the three metrics; default filter = “all data” (e.g. `date_from` = start of year or fixed early date, `date_to` = today); user can set custom date range; add at least one dynamic graph (e.g. profit by month for selected year).

---

## 2. Backend APIs to use (Phase 6 — already implemented)

Base path: `window.API_BASE_URL + '/api/analytics'`. All require **Bearer JWT** (same as other dashboard APIs).

| Endpoint | Query params | Use in frontend |
|----------|--------------|-----------------|
| `GET /analytics/summary` | `date_from`, `date_to` (optional; default current month) | Dashboard KPIs (revenue, expenses, netProfit, rentalCount, expenseCount); Reports page three cards. |
| `GET /analytics/profit-by-month` | `year` (required) | One chart: revenue/expenses/netProfit per month (e.g. bar or line). |
| `GET /analytics/revenue-by-month` | `year` | Optional: revenue-only chart. |
| `GET /analytics/expenses-by-month` | `year` | Optional: expenses-only chart. |
| `GET /analytics/top-customers` | `limit`, `date_from`, `date_to` | Optional: “Top customers” widget on dashboard or reports. |
| `GET /analytics/dashboard` | `year`, `date_from`, `date_to` (optional) | Single call that returns `{ summary, profitByMonth, topCustomers }` — use for Reports page to avoid multiple requests. |

**Response examples:**

- **summary:** `{ revenue, expenses, netProfit, rentalCount, expenseCount }`
- **profit-by-month:** `[{ month, year, revenue, expenses, netProfit }, ...]` (12 items)

---

## 3. Behaviour: Dashboard vs Reports

| Page | Data shown by default | User filter |
|------|------------------------|------------|
| **Dashboard** (`/owner/dashboard/index5`) | **Overall** for a fixed default period: e.g. **current month** (revenue, expenses, profit, active rentals). One chart can show e.g. **current year** profit-by-month. | No filter on dashboard; user goes to Reports for custom range. |
| **Reports** (`/owner/reports/profit`) | **All data** by default: e.g. `date_from` = start of current year (or company creation), `date_to` = today. So first load shows revenue/expenses/net profit for “whole period” (e.g. YTD). | User can set **date_from** and **date_to** (and optionally year for the chart) and click Apply to refresh. |

So: **Dashboard = overall snapshot (default period). Reports = default “all data”, with user-adjustable filters.**

---

## 4. Implementation phases

### Phase 1 — Analytics API client + Dashboard KPIs (real data)

**Goal:** Add analytics API client and make the main dashboard’s four KPI cards use real data (current month). Remove nothing yet so the page still works.

1. **Add `public/js/api/analyticsApi.js`**
   - Same pattern as `rentalApi.js` / `expenseApi.js`: `window.API_BASE_URL`, Bearer token from `localStorage.authToken`, `fetch` to `/api/analytics/...`.
   - Methods: `summary(params)` → `GET /analytics/summary?date_from=&date_to=`, `dashboard(params)` → `GET /analytics/dashboard?year=&date_from=&date_to=`, `profitByMonth(year)` → `GET /analytics/profit-by-month?year=`, optionally `topCustomers(params)`.

2. **Dashboard route: optionally call backend**
   - **Option A (recommended):** Keep dashboard as a **single full-page load** but have the **view** include a small script that, on DOM ready, calls `analyticsApi.summary({})` (no params = backend defaults to current month), then updates the four KPI cards (revenue, expenses, profit, active rentals) in the DOM. If the API fails (e.g. 401), show a message or keep server-rendered placeholders (e.g. 0).
   - **Option B:** In `routes/dashboard/dashboard.js`, for `GET /index5`, call the backend analytics API (via internal HTTP or service) with current month, pass `stats` from API response to the view. Requires backend URL and auth in server context (e.g. pass-through token or server-side token). More work; Option A is simpler and consistent with “frontend calls API”.

3. **Dashboard view (index5.ejs)**
   - Ensure the four stat cards have **data attributes or IDs** (e.g. `data-stat="revenue"`, `data-stat="expenses"`, etc.) so the script can update them.
   - Include script: load `config.js`, `analyticsApi.js`, then a small `dashboard-index5.js` (or inline) that: calls `analyticsApi.summary({})`, then sets revenue / expenses / profit / active rentals in the cards. Use `summary.rentalCount` for “Active Rentals” only if the backend exposes it; otherwise keep using existing source for active count (or add a separate small API if needed). Backend summary currently returns `rentalCount` = completed rentals in range; for “Active Rentals” we may need rental list with status=ACTIVE count — document that as follow-up if needed, or reuse existing logic for that single card.

4. **Deliverable:** Dashboard KPI cards show real numbers for **current month** (from `/api/analytics/summary`). No UI change other than values; no removals yet.

---

### Phase 2 — Remove unnecessary widgets + one dynamic chart on dashboard

**Goal:** Simplify the dashboard by removing non–rental template blocks and add **one** chart driven by the analytics API.

1. **Remove from `views/dashboard/index5.ejs`:**
   - “Revenue Statistics” **content** (Income/Expenses text and `#upDownBarchart`) — **replace** this block with a **single “Revenue & expenses this year”** (or “Profit by month”) chart that uses `GET /api/analytics/profit-by-month?year=2025` (year = current year). So keep one card/section with a dropdown “Year” and one chart (e.g. ApexCharts or Chart.js bar/line from `profitByMonth`).
   - Remove: **Statistic** (Daily Conversions, Visits By Day, Today Income + three charts).
   - Remove: **Most Location** (world map + country list).
   - Remove: **My Portfolio** (donut + Total Gain/Investment).
   - Remove: **Latest Investments** table.
   - Remove: **Notice board**.
   - Remove: **Total Transactions** (or merge into the one chart section if desired; otherwise remove).
   - Remove: **Project Status** table.

2. **Chart implementation:**
   - In the remaining “Revenue & expenses” (or “Profit by month”) section, add a container (e.g. `#profitByMonthChart`).
   - On load (and when user changes year): call `analyticsApi.profitByMonth(currentYear)`, then render a bar or line chart (e.g. 12 months, X = month, Y = revenue / expenses / netProfit). Use existing chart lib if the project already has one (e.g. `homeFiveChart.js` uses ApexCharts); else add a small ApexCharts or Chart.js snippet.

3. **Script load order:** Ensure `analyticsApi.js` and the new dashboard chart script load after the chart library.

4. **Deliverable:** Dashboard has only: 4 KPI cards (real), What’s due today, Recent Rentals, and **one** dynamic “Profit by month” (or revenue/expenses) chart for the selected year. All unrelated widgets removed.

**Phase 2 implemented:** Revenue Statistics replaced with “Profit by month” card (year dropdown + `#profitByMonthChart`). Removed: Statistic, Most Location, My Portfolio, Latest Investments, Notice board, Total Transactions, Project Status. New script: `public/js/pages/dashboard-profit-chart.js` (ApexCharts bar, `analyticsApi.profitByMonth(year)`). Page scripts: `analyticsApi.js`, `dashboard-index5.js`, `dashboard-profit-chart.js` (no longer `homeFiveChart.js`).

---

### Phase 3 — Reports page: real API + default “all data” + filters + graph

**Goal:** Profit (and optionally revenue/expense) reports use backend analytics; default period = “all data”; user can set date range; one graph on the report.

1. **Default “all data”:**
   - In the Reports route or in the frontend, define default range: e.g. `date_from` = start of current year (e.g. `YYYY-01-01`), `date_to` = today. So when user opens `/owner/reports/profit` with no query, the page shows **all data** for the year to date (or full year). Alternatively “all time”: `date_from` = e.g. `2000-01-01`, `date_to` = today (as in Phase 6 doc).

2. **Reports route (backend of dashboard):**
   - **Option A:** Keep server-side render but have the **route** call the **rental_backend** analytics API (with server-side auth or proxy) with `date_from`, `date_to` from query (or default above), then pass `revenue`, `expenses`, `profit` (and optionally `profitByMonth`) to the view. Requires one server-to-server request from dashboard to backend.
   - **Option B (recommended):** Reports page becomes **client-driven**: the view loads with empty or placeholder values; a script on the page reads `from`/`to` from query or from two date inputs, then calls `GET /api/analytics/summary?date_from=&date_to=` (and optionally `GET /api/analytics/profit-by-month?year=` for the chart). Apply button sets query params and re-fetches. Default: on first load with no query, use `date_from` = start of year, `date_to` = today and fetch once.

3. **Profit report view (profit-report.ejs):**
   - Keep the date form (from / to) and Apply button. On load: if no `from`/`to` in URL, set default (e.g. start of year, today) and optionally update the input values and URL (or just fetch with default params).
   - Script: call `analyticsApi.summary({ date_from, date_to })` (and optionally `analyticsApi.profitByMonth(year)` for the chart). Fill the three cards (Revenue, Expenses, Net Profit). Add one chart container below the cards; render profit-by-month (or revenue/expenses) for the chosen year from `profitByMonth` API.
   - “Revenue detail” / “Expense detail” can remain links to `/reports/revenue` and `/reports/expense` with same `from`/`to` query (Phase 4 can wire those to real data).

4. **Deliverable:** Reports profit page shows real revenue/expenses/net profit; default = all data (e.g. YTD); user can set from/to and Apply; one dynamic graph (e.g. profit by month for selected year).

**Phase 3 implemented:** Profit report is client-driven. Route uses `parseProfitDateRange()`: default `from` = start of current year, `to` = today; passes `revenue: 0, expenses: 0, profit: 0` and a `script` that loads `analyticsApi.js` and `profit-report.js`. View: date inputs with ids, three cards with ids (`#profit-report-revenue`, `#profit-report-expenses`, `#profit-report-profit`), profit card class toggled by sign, period text, Revenue/Expense detail links (href set by script from `data-base-path`), and a “Profit by month” section with year select and `#profit-report-chart`. `profit-report.js` on load fetches `analyticsApi.summary({ date_from, date_to })` and `analyticsApi.profitByMonth(year)`, updates cards and ApexCharts bar chart; Apply submits form and reloads with new from/to, then script runs again.

---

### Phase 4 — Revenue and Expense report pages (real data)

**Goal:** Revenue report and Expense report pages use real data for the selected period.

1. **Revenue report** (`/reports/revenue`):
   - Use `GET /api/analytics/summary?date_from=&date_to=` for the total; for “list of rentals” you can keep using `GET /api/rentals` with `start_date_from` / `start_date_to` (and optionally filter by status COMPLETED) to show the table. Or backend may expose a small “rentals in range” list; otherwise use existing rental list API with date filters.
   - Default `from`/`to` same as profit report (e.g. start of year to today). Apply button updates query and re-fetches.

2. **Expense report** (`/reports/expense`):
   - Use `GET /api/analytics/summary` for the total expense; for the list use `GET /api/expenses` with `expense_date_from` and `expense_date_to` (and optionally status APPROVED). Same default range and Apply behaviour.

3. **Deliverable:** Revenue and Expense report pages show real totals and real list data for the chosen (or default) period.

**Phase 4 implemented:** Revenue and Expense reports are client-driven with same default range as profit (start of year to today). Route: `parseProfitDateRange()` for both; no demo data; script loads `analyticsApi.js` + `rentalApi.js` + `revenue-report.js` (revenue) or `analyticsApi.js` + `expenseApi.js` + `expense-report.js` (expense). Views: `data-base-path`, date inputs with ids, period + total with ids, tbody with id for script to fill. **Revenue:** `revenue-report.js` calls `analyticsApi.summary({ date_from, date_to })` for total revenue and `rentalApi.list({ start_date_from, start_date_to, status: 'COMPLETED', limit: 500 })` to render the rentals table. **Expense:** `expense-report.js` calls `analyticsApi.summary` for total expenses and `expenseApi.list({ expense_date_from, expense_date_to, status: 'APPROVED', limit: 500 })` to render the expenses table. Unused demo helpers and `parseDateRange` removed from reports route.

---

### Phase 5 (optional) — Top customers and polish

- Add “Top customers” widget (dashboard or reports) using `GET /api/analytics/top-customers?limit=10&date_from=&date_to=` (same default range as reports).
- Ensure error handling and loading states on all analytics calls (e.g. “Failed to load” or spinner).
- Ensure “Active Rentals” on dashboard uses a correct source (rental list with status=ACTIVE count or a small backend endpoint if needed).

---

**Phase 5 implemented:** (1) Active Rentals: dashboard element `id="dashboard-kpi-active-rentals"`; script uses `rentalApi.list({ status: 'ACTIVE', limit: 1, page: 1 })` for count (or "—" on error); layout loads `rentalApi.js`. (2) Top customers: new card with `#dashboard-top-customers`; `dashboard-top-customers.js` fetches `analyticsApi.topCustomers` for current month, shows list or "No completed rentals this month" / "Failed to load." (3) Loading/error: KPIs and Active Rentals show "—" on error; dashboard and profit-report charts show "Loading…" then "Failed to load chart." on error; profit report cards "—" on summary error; revenue/expense reports total "—" and table "Failed to load." on list error.

---

## 5. File checklist

| Item | File / location |
|------|------------------|
| Analytics API client | `public/js/api/analyticsApi.js` (new) |
| Dashboard KPI script | `public/js/pages/dashboard-index5.js` (new) or inline in index5.ejs |
| Dashboard view | `views/dashboard/index5.ejs` (trim widgets, add IDs/data attrs, one chart container) |
| Dashboard route | `routes/dashboard/dashboard.js` (optional: keep passing minimal defaults; real data from API in browser) |
| Reports profit view | `views/reports/profit-report.ejs` (default dates, script to call summary + profitByMonth, chart container) |
| Reports revenue/expense | `views/reports/revenue-report.ejs`, `expense-report.ejs` (wire to summary + rental/expense list APIs) |
| Chart library | Reuse existing (e.g. ApexCharts in `homeFiveChart.js`) or add Chart.js / ApexCharts for profit-by-month |

---

## 6. Summary

- **Dashboard:** Always shows **overall** snapshot — default period = current month for KPIs; one chart = profit (or revenue/expenses) by month for current year. Remove all non–rental template widgets; keep 4 KPIs, What’s due today, Recent Rentals, and one dynamic chart.
- **Reports:** Default = **all data** (e.g. start of year to today). User sets **filters** (date from/to, optionally year for chart) and clicks Apply; page shows real revenue, expenses, net profit and one graph (e.g. profit by month). Revenue/Expense detail pages use same filters and real APIs.
- **Backend:** All calculation stays in Phase 6 APIs; frontend only calls them and displays results. No heavy calculation in the browser.

After approval, implementation can proceed phase by phase (Phase 1 → 2 → 3 → 4 → 5 optional).
