# RanchoLabs Instructor Attendance System

A production-oriented internal attendance platform for Rancho Labs instructors.

## Included
- Next.js 14 App Router + TypeScript + Tailwind CSS
- Supabase Authentication, PostgreSQL, private Storage and RLS
- Instructor login/dashboard/history
- Live browser-camera selfie capture; no normal gallery upload flow
- Server-generated attendance timestamp and India (`Asia/Kolkata`) calendar-date handling
- One attendance record per instructor per calendar day
- Manager/admin operational dashboard and attendance records
- Admin instructor directory
- Date-range PDF attendance reports
- Protected archive-first 60-day retention endpoint
- Vercel-compatible deployment structure

## Setup

### 1. Install
```bash
npm install
npm run dev
```

### 2. Environment
Copy `.env.example` to `.env.local` and set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `CRON_SECRET`

Never prefix secret values with `NEXT_PUBLIC_`.

### 3. Supabase database
Run `supabase/migrations/001_initial.sql` in the Supabase SQL editor. It creates the `profiles`, `attendance`, and `attendance_archives` tables, indexes, role helper, RLS policies, and the private `attendance-selfies` bucket.

### 4. Users
Create users in Supabase Authentication, then create matching `public.profiles` rows with role `instructor`, `manager`, or `admin`. For production admin provisioning, use a trusted server-side action with the service-role key. Never expose that key in browser code.

### 5. Camera
Camera access requires browser permission and HTTPS in production. The check-in page uses `navigator.mediaDevices.getUserMedia`, requests the front camera by default, captures a fresh JPEG, and sends it to `/api/attendance/check-in`.

## Security model
Frontend route hiding is not the authorization boundary. Database RLS protects profiles, attendance, and storage objects. Instructors can access only their own attendance; managers can read operational records; admins have elevated management access.

## Official timestamp
The browser submits the image only. The backend handles the upload and inserts the attendance row with the database `now()` default. `attendance_date` is generated from `check_in_at` using `Asia/Kolkata`. The unique `(user_id, attendance_date)` constraint blocks duplicate daily check-ins.

## 60-day retention
`POST /api/maintenance/archive-old-attendance` requires `Authorization: Bearer $CRON_SECRET`.

The intended sequence is archive first, verify successful archive metadata, then delete selfie objects and old attendance rows. Schedule this endpoint using Vercel Cron or another compatible scheduler.

**Production hardening before enabling cleanup:** create a separate private `attendance-archives` Storage bucket and store archive files there rather than beside selfie objects. The current endpoint is intentionally documented as a foundation so retention can be tested safely before the scheduled job is enabled.

## PDF reports
Managers/admins can select a date range and generate a clean PDF with instructor, date, check-in time, status, and summary information. Standard reports omit full-resolution selfies to keep files small.

## Vercel deployment
1. Import this GitHub repository into Vercel.
2. Add the four environment variables.
3. Deploy.
4. Add the production Vercel URL to Supabase Auth redirect settings.
5. Configure a scheduled POST to `/api/maintenance/archive-old-attendance` with the `CRON_SECRET` header after archive-bucket hardening.

## Project structure
```text
app/
  api/attendance/check-in/
  api/maintenance/archive-old-attendance/
  admin/
    attendance/
    instructors/
    reports/
    settings/
  check-in/
  dashboard/
  history/
  login/
components/AppShell.tsx
lib/supabase/client.ts
lib/supabase/server.ts
supabase/migrations/001_initial.sql
types/database.ts
```

## Production checklist
- [ ] Run the Supabase migration
- [ ] Create Auth users + profile records
- [ ] Add production environment variables to Vercel
- [ ] Confirm private Storage policies
- [ ] Configure Auth redirect URLs
- [ ] Create separate private archive bucket before retention cleanup
- [ ] Configure scheduled retention job
- [ ] Run `npm run build` locally/CI before release
