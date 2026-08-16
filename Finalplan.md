# Kool Snack — Final Delivery Plan

This file REPLACES task2.md, ADMIN_TASK.md and AUDIT.md. Delete those three
so there is exactly one plan. Keep only:
- `CLAUDE.md` — project context + the database rule
- `DESIGN.md` — the visual system
- this file — what to do, in what order

## Absolute rules (never violated)

1. **Never touch the database.** No schema changes, no RLS policies, no
   enums, no migrations. If something is missing, STOP and report it —
   don't write SQL.

   **`user_role` is GERMAN**, verified live against `pg_enum` on 2026-08-16:

   ```
   inhaber, manager, mitarbeiter, kueche, kunde
   ```

   These are the stored values, not display text. Every RLS policy is
   written against them (`get_my_role() = ANY (ARRAY['inhaber'::user_role,
   'manager'::user_role, …])`), as are the three Edge Functions and
   `handle_new_user`. An earlier version of this rule claimed the enum was
   English (owner/manager/staff/kitchen/customer); that was wrong, and
   CLAUDE.md records that the same false claim previously broke every role
   check, guest checkout and staff account creation. **Do not "correct" the
   code to English.** If role access ever looks broken, re-read `pg_enum`
   before trusting any document — including this one.

2. **Never replace working systems.** The QR attendance system (rotating
   45s token + GPS geofence) stays as built — do not swap it for a
   name-selection tablet screen.
3. **No new features** beyond what's listed here. If an idea comes up,
   write it in a `V2.md` file and move on.
4. **One step at a time.** Finish a step, report, wait for review. Never
   start the next step unprompted.

## ⏱ Deadline: less than one week — priority order overrides everything

Do the steps in THIS order, not the numbered order below:

**STEP 1 (security) → STEP 5 (deploy) → STEP 3 (finish screens) →
STEP 4 (consistency) → STEP 6 (handover)**

Deploy EARLY, on day two — not at the end. Deployment always surfaces
problems (env vars, build failures, asset paths). Finding them with four
days left is manageable; finding them with four hours left is not.

### Cut for V2 — do NOT build these now

Write them in `V2.md` and move on: recipes → automatic stock consumption ·
loyalty program · SMS/WhatsApp notifications · customer accounts · opening
hours enforcement · real dish photos (the category-icon fallback ships as
is — it looks clean and consistent) · advanced reports and BI · waste and
consumption analytics · multi-location support.

The only STEP 2 item that stays is the **short daily order number** —
without it the kitchen screen cannot be used in a real service.

## Stack reality

No custom backend, no REST API. Frontend → Supabase directly (Postgres +
RLS + Auth + Storage + Realtime) + 3 Edge Functions (`create-staff-account`,
`generate-clock-token`, `redeem-clock-token`). Authorization = RLS policies.

---

# STEP 1 — Security & data integrity (blocking)

Nothing else matters until these are verified by actually testing, not by
reading code.

- **Price integrity**: order totals must be computed from `menu_items` /
  `menu_item_variants` prices in the database. If the browser can send its
  own `unit_price` or `total_amount` and have it accepted, that is a
  critical bug — fix it. Test by crafting a request with a fake price.
- **Route + data protection**: log in as `staff`, then manually type
  `/staff/admin` in the URL. You must not see owner-only data. Hiding the
  menu link is not protection — RLS must block the data itself.
- **Guest order access**: a guest tracking their order via `access_token`
  must not be able to read other people's orders.
- **Secrets**: no service-role key in frontend code, `.env` not committed,
  no internal errors or stack traces shown to users.

Report findings graded CRITICAL / HIGH before fixing.

# STEP 2 — Operational blockers

Two things that make the app unusable in a real service:

- **Short daily order number**: orders are identified by UUID. Kitchen staff
  cannot call out "order a3f8b2c1". Add a human-readable daily sequence
  (1, 2, 3… reset each day) displayed on the kitchen screen, the customer
  confirmation, and the admin order list. Report what DB support this needs
  — do not add it yourself.
- **Opening hours**: right now an order can be placed at 3am. Block ordering
  outside service hours with a clear message ("Wir haben gerade geschlossen").
  Report what DB support this needs.

# STEP 3 — Finish the screens

Build/finish only what's missing. Check first — several may already exist.

**Public** (no login, no "Anmelden" anywhere in this flow):
`/` home · `/menu` + `/menu/:category` · `/cart` · `/checkout` ·
order confirmation with live status via Realtime · `/reservieren`

**Staff**:
`/staff/login` · `/staff/pointage-display` (QR screen, tablet, no login) ·
`/staff/pointage` (personal phone) · `/kueche` (kitchen, realtime orders)

**Admin** (`/staff/admin`, owner/manager):
Dashboard (KPIs from `operations_summary_today`, `attendance_summary_today`,
`stock_summary`) · Bestellungen · Stock (from `stock_items_with_status`,
movements via `stock_movements` only — reasons: purchase / manual_in /
sale_consumption / waste / adjustment / return) · Pointage (from
`time_entries_with_hours`) · Team (via `create-staff-account`) ·
Reservierungen

All menu images are null — the category-icon fallback must work everywhere.
No static image imports of files that don't exist.

# STEP 4 — Consistency pass

Apply `DESIGN.md` to EVERY screen, including ones already built. Then:

- Responsive at 375 / 768 / 1280 / 1920px. Mobile-first but NOT mobile-only:
  no fixed narrow column on desktop. Admin is desktop-primary — tables and
  KPI cards use full width.
- Every screen has loading, empty, error and success states
- No console errors, no dead code, no duplicate fetch logic, no debug logs

# STEP 5 — Deploy

Non-negotiable before handing to a client — the tablet and staff phones
cannot reach `localhost`.

- Deploy frontend to Vercel (import the GitHub repo, add the environment
  variables below). **The variable names must match `src/lib/supabase.ts`
  exactly** — it throws at import time if either is missing, which shows up
  as a blank white page, not a build error:

  ```
  VITE_SUPABASE_URL
  VITE_SUPABASE_PUBLISHABLE_KEY
  ```

  (An earlier version of this step said `VITE_SUPABASE_ANON_KEY`. That name
  is not read anywhere in the code and would deploy a blank app.)
- Verify production build, then walk through every flow on the real URL
- Test on an actual phone and an actual tablet, on the restaurant's wifi

# STEP 6 — Handover

- Create the owner account and one account per real employee
- Print the QR for `/staff/pointage-display` setup; set up the tablet in
  kiosk mode
- Short written guide for the client (in German): how to add a dish, record
  stock, read the dashboard, add an employee
- Confirm with the client's Steuerberater whether TSE / Kassensicherungs-
  verordnung applies if this system handles actual payment — this can change
  legal requirements and must be checked before real-world cash use

---

# Definition of done

The app is finished when: a customer can order from their phone and track
it live · the kitchen sees and advances orders on a tablet · staff clock in
and out by QR · the manager can see today's numbers, manage stock, staff and
reservations from a laptop · everything runs on a public URL · Step 1 has no
CRITICAL or HIGH findings left.

Anything not on this list is V2. Write it in `V2.md` and move on.
