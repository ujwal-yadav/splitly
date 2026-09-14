# Online account setup

Splitly requires email/password authentication. Groups, expenses, recorded payments, and preferences are saved to Supabase. Unsaved expense drafts remain private to the current account on the device that created them.

Guest buttons, guest-session restoration, device-only fallbacks, and local demo seeding have been removed. Old local records are not deleted or automatically uploaded; they are no longer used by the online app.

## Backend

The project configured in `.env` is `nqeezsamceosjergrfww.supabase.co`. The additive migration `20260912000000_shared_ledger.sql` was applied on 12 September 2026 after reviewing a dry run. Existing prototype tables were preserved.

Start the app with its configured backend:

```sh
npx expo start --web --port 8095
```

Do not use `EXPO_NO_DOTENV=1` for the online app unless supplying real credentials explicitly. The app needs the public project URL and public anonymous key in `.env`; administrator keys must never be put in the client environment.

Public signup requires email confirmation. The additional demo account was provisioned with a confirmed test identity, so it can log in with the credentials shared in the conversation. Its password is not stored in the repository.

The demo account has three cloud-backed groups: Weekend trip (₹2,400 owed to Rohan), Apartment 4B (₹1,200 owed by Priya), and Dinner club (₹800 owed to Aman).

## Automated verification

```sh
npm run typecheck
npm run lint
npm test
```

For disposable account tests, start a separate instance:

```sh
EXPO_NO_DOTENV=1 EXPO_OFFLINE=1 EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54399 EXPO_PUBLIC_SUPABASE_ANON_KEY=local-test-key npx expo start --web --port 8092
SPLITLY_ACCOUNT_TEST_URL=http://localhost:8092 npm run test:account
```

`npm run test:browser` also runs the current account suite. Historical device-only browser suites are no longer part of the active commands.

The account suite verifies signup, login, failed saves/retry, cloud-backed data operations in disposable PostgreSQL, password-reset requests, both logout buttons, and rejection of legacy guest access.

Live verification also passed against the configured Supabase project: the confirmed demo login was used in two independent Chromium browser contexts; both loaded ₹3,200 owed and ₹1,200 owing to the account, retained those balances after reload, logged out successfully, and were redirected to login when trying to reopen groups without a session. Real email delivery and native-device behavior were not exercised.

## Accounts and adding people by email

During **Create group**, the optional **Name or email** field accepts existing verified accounts. Email entries are linked when saving, so the group appears for those accounts. Named participants still join by invitation. Migration `20260912020000_create_group_with_emails.sql` creates the group and email memberships in one transaction; an invalid or unknown email rolls the entire operation back. Active apps refresh their shared ledger every 10 seconds and when returning to the foreground.

The online project has two login accounts: `rohan@splitly.app` (the renamed demo account) and `ujwal@splitly.app` (Ujwal Yadav). Ujwal’s previous group data was backed up outside the repository and cleared on request. The demo’s sample balances are retained. Neither account’s password was changed during this cleanup.

Group creators can open **People → Member email → Add by email** to add an existing, email-confirmed account. The user receives group access immediately; this does not send an email. Email matching ignores capitalization and surrounding spaces. Unknown/unverified accounts get an actionable error, repeated additions do not duplicate membership, and archived groups must be reopened first. Existing named participants can still be linked through their invitation code; adding by email creates a new participant and does not move past expense shares onto them.

Migration `20260912010000_add_group_member_by_email.sql` applies the membership, access grant, revision update and history entry atomically on the server. Only the group creator may perform the operation. Automated SQL tests cover permissions, validation, duplicate requests, revision conflicts, shared access and archived groups.

The former demo login was renamed to `rohan@splitly.app`. Its password and sample data were preserved, and login with the new email was verified. The project contains exactly these two accounts.
