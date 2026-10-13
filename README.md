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

Staff can change their own password from the phone check-in page → Change my password, or `/account/password`. They must enter the current password and confirm a new password of at least 12 characters. The server verifies the current password and uses only that user's authenticated account to make the update. Forgotten-password recovery remains an owner/Supabase task. Because Supabase identities are shared across the two café apps, changing a shared account's password also changes its reservation-app sign-in password.

- Each employee has their own 30-calendar-day cycle.
- Daily pay is attended days × saved rate; hourly pay uses completed check-in/check-out hours × saved rate.
- Rates are captured when attendance is recorded. Later edits affect future records.
- Recording a completed payment advances one period and keeps history. It does not transfer money.
- Attendance uses Asia/Jakarta time, one check-in per employee per calendar day.
- Selfies are capped at 4 MB; the staff screen resizes them before upload.
- Sessions last up to one hour. Sign in again after expiry.
- Break deductions, overtime rules and fixed monthly-salary calculations have not been configured.
- Cloudflare local data is not migrated into Supabase automatically.

## Verification status

TypeScript, payroll and mocked Supabase adapter/access checks passed. Production compilation and TypeScript completed in one build attempt, but final page generation was blocked by Windows sandbox EPERM file-creation errors; a complete production build is not yet verified. The development server reported Ready, but an HTTP readiness check timed out. Browser/camera, real Supabase connectivity and Vercel deployment remain unverified until your account settings are connected. No new site has been published.

References: https://vercel.com/docs/frameworks/full-stack/nextjs ; https://supabase.com/docs/guides/auth/passwords ; https://supabase.com/docs/guides/storage/buckets/creating-buckets
