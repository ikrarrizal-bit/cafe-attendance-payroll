# Café Team — Vercel and VS Code edition

Next.js app with Supabase database, private selfie storage and email/password authentication. This is a separate app from the café reservation website. It does not depend on the earlier Sites/Cloudflare publication workflow.

## 1. Prepare your existing Supabase project

Open your Supabase project → SQL Editor → New query. Open `database/setup.sql` in VS Code, copy its complete contents into SQL Editor, and run once. It creates five new `cafe_` tables and the private `cafe-attendance-selfies` bucket. It does not alter reservation tables. If any of these names already exist, stop and inspect the existing setup rather than dropping tables or rerunning partially applied SQL.

The tables have row-level security enabled with browser access revoked. Server routes use the service-role key and enforce owner/employee permissions. Selfies are served through authenticated routes and are not public.

## 2. Configure local settings

Copy `.env.example` to `.env.local`. Fill in these four values from your Supabase project settings:

```text
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-legacy-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-legacy-service-role-key
CAFE_OWNER_EMAIL=your-owner-account-email
```

Use the legacy `anon` and `service_role` keys for this implementation. Enter actual values only into your local environment file or Vercel settings. Do not upload `.env.local` to GitHub or send the service-role key in chat. `CAFE_OWNER_EMAIL` determines which confirmed account can administer staff and payroll.

## 3. Create your owner account

In Supabase → Authentication → Users, create an email/password user for the owner. Use exactly the email configured above. The user must have a confirmed email. Use Supabase's administrator account-creation controls to create/confirm the known owner account. This app does not create accounts automatically or send invitations.

## 4. Run locally in VS Code

Install Node.js 24 LTS. Extract this ZIP and open the folder containing `package.json` in VS Code. Open Terminal → New Terminal and run:

```powershell
npm.cmd ci
npm.cmd run dev
```

Open `http://localhost:3000/login`, then sign in with your Supabase owner account. The same Supabase project is used locally and online, so both versions see the same records. Use test employees while setting up.

Checks:

```powershell
npm.cmd run check
npm.cmd run test:payroll
npm.cmd run build
```

If Windows reports an EPERM realpath error during build, the project includes a narrow compatibility helper:

```powershell
node --import ./scripts/windows-realpath.mjs node_modules/next/dist/bin/next build --webpack
```

## 5. Deploy as a new Vercel project

Put this app's source in a separate GitHub repository, excluding `.env.local`, `node_modules` and `.next`. In Vercel choose Add New → Project, import that repository, and select Next.js. Use the folder containing `package.json` as the root directory. Set Node.js to 24.x. Use the normal Next.js build settings.

Before deployment, add the same four environment variables in Vercel project settings for the deployment environments you plan to use. Deploy. Vercel will provide an HTTPS address. Do not import into or replace the existing reservation project. If you change environment variables after deployment, redeploy to apply them.

## 6. Add one employee for a phone test

Owners can now open Settings → Staff account administration, or `/admin/staff`, to create and link accounts directly. Add the employee profile in Team first. Choose Create a new account, enter the employee email and an initial password of at least 12 characters, and confirm that the email belongs to that employee. The new account is confirmed and linked automatically. If the email already has a Supabase account, choose Link an existing account; its password is not changed. Disable access and Unlink only change access to this attendance app, preserving records and the shared Supabase account. No database migration is required for this feature. Password reset remains managed through Supabase.

Create the employee's confirmed email/password account in Supabase Authentication. In the café app, Team → Add employee, set their name, rate, pay basis, cycle starting date and matching sign-in email. You do not need to expose the Supabase dashboard to employees.

On the phone, open your new HTTPS address followed by `/login`. Staff sign in and are taken to `/staff`. Choose a shift, tap Take your selfie, then Upload selfie & check in. The server saves the employee identity, date and check-in time automatically. Use Finish shift & check out at the end of work.

Use Share selfie to WhatsApp to select the café group in the phone share menu. On browsers without file sharing, the photo downloads for manual attachment. The app does not automatically send WhatsApp messages.

## Behaviour and limits

Owners can save an employee's bank name, account holder and numeric account number from Team → Edit employee or Payroll → Review. Account numbers are stored as text, preserving leading zeros, with owner-only editing and a copy button. Staff API responses do not include these bank settings. Review payments supports Bank transfer, Cash or Other and a transfer reference. Bank transfers require saved, unchanged recipient details; recorded payments snapshot the details reviewed at that time. Changing or removing the current account does not alter prior payment snapshots. The app records a payment already completed in the banking app; it does not initiate or automate bank transfers. No new database migration is required.

Open Paydays, days off & overtime from the owner sidebar or Settings (`/admin/work-rules`). Choose each employee's fixed payday, then choose exactly four dates off per calendar month. The first period begins on the agreed employment/payroll start date; later periods run between paydays. Dates 29–31 are clamped to the last day in shorter months. Previously paid periods stay unchanged.

New check-ins snapshot their scheduled shift times. Overtime begins after the saved shift end (including overnight shifts), is zero below one hour, rounds up once at least one hour is worked, and caps at four hours at Rp10,000/hour. Only approved overtime enters salary. Hourly ordinary pay excludes hours after scheduled shift end, avoiding double payment. Records from before this update retain their previous calculation until the owner records their original shift times. Overtime approval requires IDR payroll. Pending overtime must be approved or rejected before payment can be recorded.

Payroll Review and the work-rules page show a full date-by-date report for the actual period, including presence, absence, day off, future dates, working hours, overtime, selfies, and CSV export. Without a saved four-day schedule, missing records are marked Schedule not set rather than assumed absent. Today is marked Not checked in yet until attendance arrives. Working on a scheduled day off is labelled separately but uses the existing rate plus approved overtime; no extra day-off premium has been configured.

New recorded payments retain the detailed report and the regular/overtime pay breakdown in their existing snapshot field. Older payment snapshots remain preserved but do not contain the newer full reports. Paid attendance decisions and days off inside paid periods are locked. All new configuration uses the existing settings table; no new SQL migration is needed.

Owner Overview now shows payment reminders for each employee's unpaid 30-calendar-day cycle. Settings → Payment reminders selects a 3-day or 2-day lead time. The reminders continue through tomorrow, due today and overdue until payment is recorded. Amounts are labelled Calculated so far. Recording a payment advances that person's reminder to their next unpaid cycle. Disabled employees with unpaid attendance remain included; disabled employees with no attendance in the period are excluded. These are in-app reminders while the owner opens the dashboard, not push messages or background email/WhatsApp notifications. No database migration is needed.

Staff can change their own password from the phone check-in page → Change my password, or `/account/password`. They must enter the current password and confirm a new password of at least 12 characters. The server verifies the current password and uses only that user's authenticated account to make the update. Forgotten-password recovery remains an owner/Supabase task. Because Supabase identities are shared across the two café apps, changing a shared account's password also changes its reservation-app sign-in password.

- Each employee can have a fixed monthly payday, covering the previous payday through the day before the next. Existing 30-day cycles remain until a payday is configured.
- Daily pay is attended days × saved rate; hourly pay uses completed check-in/check-out hours × saved rate.
- Rates are captured when attendance is recorded. Later edits affect future records.
- Recording a completed payment advances one period and keeps history. It does not transfer money.
- Attendance uses Asia/Jakarta time, one check-in per employee per calendar day.
- Selfies are capped at 4 MB; the staff screen resizes them before upload.
- Sessions last up to one hour. Sign in again after expiry.
- Break deductions and fixed monthly-salary calculations are not configured. Approved overtime is calculated at Rp10,000 per hour, with at least one hour required, rounding up, capped at four hours.
- Cloudflare local data is not migrated into Supabase automatically.

## Verification status

TypeScript, payroll and mocked Supabase adapter/access checks passed. Production compilation and TypeScript completed in one build attempt, but final page generation was blocked by Windows sandbox EPERM file-creation errors; a complete production build is not yet verified. The development server reported Ready, but an HTTP readiness check timed out. Browser/camera, real Supabase connectivity and Vercel deployment remain unverified until your account settings are connected. No new site has been published.

References: https://vercel.com/docs/frameworks/full-stack/nextjs ; https://supabase.com/docs/guides/auth/passwords ; https://supabase.com/docs/guides/storage/buckets/creating-buckets


## Overtime assignments and phone notifications

Owners open **Assign overtime & view responses** on the dashboard. Select staff, inclusive dates, one to four planned hours per date, and the overtime job. Staff open **Overtime requests** to accept or reject each date before checking out. Requests refresh every 30 seconds on that page.

Acceptance alone does not authorize payment. Actual completed overtime uses the existing minimum-one-hour rounding rule, capped at the assigned hours and four-hour maximum. Final owner approval remains in **Paydays, days off & overtime**. Pending or rejected assignments add no overtime pay. Existing attendance without an assignment retains the previous manual approval process.

For phone notifications:
1. The setup script `node scripts/setup-push.mjs` generates a stable key pair in the ignored `.env.local` file. Do not regenerate keys after staff subscribe.
2. Copy `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` from `.env.local` into the Vercel project's Production environment variables. Keep the private key confidential. Redeploy after adding them.
3. Each staff member signs in on their own phone and taps **Enable overtime phone notifications**. iPhone requires iOS 16.4+ and opening the app added to the Home Screen.
4. Test an assignment to a consenting test staff member, close the app, and check that tapping the notification opens the assignment page. Sign in again if the session expired.

Push delivery is best effort; owner results report sent/failed attempts, not proof the phone displayed or read the alert. Saved requests remain inside the app when delivery fails or permissions are denied. No attendance or payroll data is cached by the service worker. No SQL migration is required.

## Paid staff breaks

Each open shift supports one paid break. Staff tap **Start break** on their own attendance page. A reminder is due after 60 minutes. The return is marked red only when more than 90 minutes have elapsed. **Resume shift** requires a fresh phone GPS position within 20 metres of the café and reported accuracy of 20 metres or better. The original 100-metre check-in radius is unchanged. Staff must resume before checking out. Breaks do not reduce salary or hourly working time. Break start/return and late status appear in the owner's attendance table and payroll report/CSV; new paid snapshots preserve them.

### Deploying reminders (Vercel Pro)

The included `vercel.json` runs `/api/cron/break-reminders` every minute. This requires Vercel Pro. Run `node scripts/setup-break-reminders.mjs` to generate `CRON_SECRET` privately in `.env.local`. Add that value to the project's **Production** environment variables in Vercel, alongside the existing three VAPID variables, then redeploy. Never expose or commit this secret. The endpoint rejects requests without its matching bearer token.

Staff must enable notifications on their own phone. Existing users should reopen the app so the service worker updates. A scheduled run sends reminders for active breaks due after 60 minutes; delivery may be delayed by scheduling, networking, or phone settings. A saved reminder lease prevents overlapping scheduled runs from duplicating a successfully sent alert. Failed/no-device sends retry up to five times. If at least one subscribed phone accepts the alert, the break is marked notified; other failed devices are not retried separately. The app's countdown and lateness calculation use server timestamps and do not depend on notification delivery. No continuous location tracking is performed: GPS is checked when the staff member taps Resume shift.

Test with a dedicated employee: start a break, confirm a second start is blocked, check that checkout is unavailable during the break, resume within the café area, and verify the paid hours remain unchanged. Use the local scripts for the 60/90-minute boundary checks without waiting. Production records and timers should not be edited for testing.
