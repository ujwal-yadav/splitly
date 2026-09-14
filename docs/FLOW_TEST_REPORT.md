# Flow verification — 12 September 2026

> The app now requires online authentication. The device-mode checks below are historical and their scripts are retained in `tests/legacy-device-mode/`. The guest entry points and automatic local demo seeding have been removed. See `docs/ONLINE_SETUP.md` for current setup and verification.

Result: all executed checks passed. No application defects were found in this run.

## Isolated instances

- Device-only web instance: http://localhost:8091, with dotenv disabled.
- Account web instance: http://localhost:8092, with dummy Supabase credentials pointing to http://127.0.0.1:54399.
- Each browser suite creates a fresh browser profile. The lifecycle suite additionally opens a second independent browser context to verify device-record isolation.
- Account requests are intercepted by the test harness. Authentication is mocked; data operations execute the actual migration against disposable PGlite PostgreSQL with roles and row-level security. No hosted database or real account was modified.

## Results

| Check                          | Result           | Coverage                                                                                                                                                                                                                                      |
| ------------------------------ | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript and repository lint | Pass             | Application types and lint rules                                                                                                                                                                                                              |
| Node/database suite            | 9 tests passed   | Currency parsing, equal/percentage rounding, excluded payers, pairwise balances, partial settlements, undo/delete, separate currencies, real SQL migration, invitation claims/replays/expiry, access isolation, concurrent revision conflicts |
| Core browser suite             | Pass             | Group creation, expenses, custom splits, failed-storage rollback, duplicate taps, payment recording/undo, expense edit/delete/restore, draft save/resume/discard, profile name, currency/payment preferences, amount privacy                  |
| Route/layout sweep             | 48 checks passed | 24 routes at 320px width in light and dark modes; no horizontal overflow or browser runtime errors                                                                                                                                            |
| Account browser suite          | Pass             | Signup confirmation state, login, failed database save/retry, expense save/reload, password-reset request, settings and profile logout, account/device record separation                                                                      |
| Lifecycle browser suite        | Pass             | Empty group-name validation, duplicate people, adding people, rename, archive/reopen, archive blocked by unpaid balances, group/expense search, activity filters, logout/reload/re-entry, device data isolation across browser contexts       |
| Attachment browser suite       | Pass             | Receipt image upload, save/reload, removal, profile-photo upload/save/removal                                                                                                                                                                 |

The new attachment test initially matched both a hidden previous route and the current route. Its selector now targets the visible screen; the complete suite then passed. This was a test-harness correction, not an application change.

## Reproduce

Start each instance in its own terminal:

```sh
EXPO_NO_DOTENV=1 EXPO_OFFLINE=1 npx expo start --web --port 8091
```

```sh
EXPO_NO_DOTENV=1 EXPO_OFFLINE=1 EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54399 EXPO_PUBLIC_SUPABASE_ANON_KEY=local-test-key npx expo start --web --port 8092
```

Run with Playwright Chromium installed, or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to an installed compatible browser:

```sh
npm run typecheck
npm run lint
npm test
SPLITLY_TEST_URL=http://localhost:8091 npm run test:browser
SPLITLY_ACCOUNT_TEST_URL=http://localhost:8092 npm run test:account
SPLITLY_TEST_URL=http://localhost:8091 npm run test:lifecycle
SPLITLY_TEST_URL=http://localhost:8091 npm run test:attachments
```

## Limits

This verifies web flows in Chromium, not native iOS/Android behavior. Live Supabase connectivity, real authentication/email delivery, password-recovery email deep links, cross-device realtime updates, physical-camera permissions, and native share sheets remain unverified. Invitations are covered by the SQL tests, not a two-account browser invitation journey. Splitly records external payments; no bank transfer was initiated or tested. Receipt text extraction and push notifications are not implemented features.

## Populated demo instance

For a separate development instance with sample balances:

```sh
EXPO_NO_DOTENV=1 EXPO_OFFLINE=1 EXPO_PUBLIC_DEMO_DATA=1 npx expo start --web --port 8093
```

Open http://localhost:8093 and choose **Get started on this device**. New local storage receives three sample groups: Weekend trip (you owe Rohan ₹2,400), Apartment 4B (Priya owes you ₹1,200), and Dinner club (you owe Aman ₹800). Totals are ₹3,200 owed by you and ₹1,200 owed to you. These are saved expenses, so edits and payment records update balances normally. Seeding runs only in development with the flag enabled, only when no local ledger exists; existing records and account ledgers are preserved.
