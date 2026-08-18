# NEPTUNE Admin frontend — handover prompt

These are the pre-built features and current gaps. Do not break existing working features.

Already implemented and working (do not regress): Authentication, QR functionality (collector QR, rider QR scanning, QR verification) — do NOT touch Flutter/mobile or mobile APIs; Activate/Deactivate on Collectors/Riders/Vehicles; Rider→Vehicle assignment; Assignments delete; Reports page with 6 report types + Excel .xlsx download.

## Current state (what's already done in `src/pages/ReportsPage.tsx`)

- Six reports (Collection, Request, Collector, Rider, Vehicle, Assignment) built from real GET endpoints, client-side filtered over the real data. Loading, error, and empty states handled. Excel Download button exports exactly the filtered dataset (real `.xlsx` via the `xlsx` package).
- Because the backend has no report endpoint yet, filtering is currently client-side — this is temporary.

## To do / handover notes

### 1) Delete buttons for Collectors, Riders, Vehicles are intentionally NOT added yet

Reason: the backend lacked `DELETE /admin/collectors/:id`, `DELETE /admin/riders/:id`, `DELETE /admin/vehicles/:id`. Once the backend adds them, wire Delete buttons into each list page with:

- confirmation dialog ("Are you sure you want to permanently delete...")
- visually distinct destructive styling (do NOT make it look like Deactivate — keep both)
- only remove the row / show success AFTER the backend confirms
- handle 409 (show "cannot delete because related records must be preserved") via the existing `ApiError` mapping; also 400/401/403/404/500
- never fake deletion by just removing the row from React state

### 2) Reports: switch to the server-side endpoint when available

When the backend ships the server-side `/admin/reports` endpoint, switch `ReportsPage.tsx` to call it, passing the selected filters (from/to, collectorId, riderId, vehicleId, status) as query params instead of client-side filtering. Keep the current Excel download behavior and states intact — it should now export exactly what the backend returns.

### 3) Constraint reminders

- Use `VITE_API_BASE_URL`.
- Never connect to Supabase/Postgres directly.
- Never put `DATABASE_URL`, DB passwords, Supabase service key, or JWT secrets in frontend code.
- Do NOT modify QR/Flutter/mobile, Collector/Rider/collection workflows, authentication, the existing Rider→Vehicle assignment, or existing Deactivate/CRUD.

### 4) Dependency note

Additions to the `xlsx` package dependency are already in `package.json` (the Excel download works).
