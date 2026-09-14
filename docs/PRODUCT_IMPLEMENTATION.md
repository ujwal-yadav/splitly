# Product simplification implementation

The primary loop is now create group → add expense → see who owes whom → record a payment → see the updated balance after relaunch. All active application screens use the same ledger instead of separate sample arrays. This is an implementation update to [the product review](PRODUCT_REVIEW.md), not evidence of a public release or a completed user study.

## What changed

- Three destinations: Home, Groups, Activity. Add expense remains an action in the navigation bar; Profile is accessible through the avatar.
- One optional introduction. Returning device users and restored account sessions bypass it.
- Create a group with a name and optional people; everyone need not register. Default currency is explicit. Existing groups never change currency implicitly.
- The expense form starts with amount, description, group and a visible payer/participant/split summary. Date, note and receipt are optional. Contextual group selection, exclusions, exact amounts and percentages work.
- New and edited drafts survive explicit saves and relaunch. Back navigation offers to save or discard changes. Failed saves preserve the open form; duplicate taps cannot create multiple records.
- Expenses have working edits, reversible deletion, receipts and activity history. Group totals update immediately after a successful durable write.
- Settlement is explicitly a manual record. Partial payments, overpayment rejection, actual saved-record details and undo replace fixed “payment successful” screens. No money is moved by this implementation.
- Currency totals stay separate. Opposite debts to different people remain visible even with zero net. Only reciprocal balances between the same two people in one group are offset.
- Profile name/photo and useful preferences persist. Home privacy hides amounts in both totals and group rows. Unconnected social-login, reminder, referral, wallet, chat, legal and support actions are removed from active menus.
- Receipt attachment uses the system picker, stores a small embedded image and does not claim OCR. Account-group receipts follow group access; no public storage URLs are generated.
- Account invitations have a participant-specific preview, seven-day expiry, rotation on reissue, single-user acceptance and idempotent acceptance retries. Share sheets are opened only after a user chooses to share.

## Data and deployment

Device mode uses AsyncStorage under `splitly-ledger-v1:local`. A save commits the whole workspace before the UI reports success. Browser writes use Web Locks where supported and revision checks to detect changes from another window. Devices/browsers without Web Locks retain the revision check but do not guarantee simultaneous-tab serialization; use a single active window there.

Account mode uses Supabase Auth and the additive migration [20260912000000_shared_ledger.sql](../supabase/migrations/20260912000000_shared_ledger.sql). It has private group access rows, revisioned JSON documents, account preferences, invite tokens, and server-side snapshot history with authenticated actors. The save RPC validates membership, identity stability, integer amounts, split totals, currencies, overpayments, archival state and revision conflicts in one database transaction. Existing history and payment amounts cannot be overwritten; corrections use soft deletion or undo. All joined members can edit expenses and record group payments; this is a collaborative ledger, not provider-verified financial accounting.

Apply **only the new additive migration** to the intended existing project, using your normal Supabase migration workflow. The original prototype migration includes destructive reset statements and must not be rerun against an existing database. No database migration or hosted deployment was performed during this work: only public application credentials were available, and no database administration connector was configured.

The new `ledger_*` tables coexist with the earlier prototype tables. The active UI no longer reads those prototype tables. If real records were created through the legacy services, plan and verify an explicit import before switching those users; this implementation does not silently move or discard them. Likewise, signing in keeps device-only records separate from account groups. Export device records from Preferences before clearing app/browser storage.

Group documents are intended for small everyday groups: up to 100 people, a 10 MB document limit, and roughly 650 KB per image. For large histories, move expense/payment records and attachments to normalized tables/private object storage. Account views refresh on foreground/focus and through pull-to-refresh; they do not promise instantaneous realtime delivery. Offline account writes fail visibly and retain the form; there is no background sync queue.

Auth storage is persistent in browsers, SecureStore on native, and disabled during server rendering. Configure the Supabase email redirect allow-list for the deployed origin’s `/(auth)/update-password` path and the installed app’s `splitly` recovery URL. Recovery includes a new-password screen; real email delivery and installed-app links need staging validation.

## Automated checks

Use a supported Node LTS version (Node 24 recommended for this Expo SDK). No test sends messages, initiates payments, or modifies a hosted database.

```sh
npm run typecheck
npm run lint
npm test
```

`npm test` uses Node’s test runner. Money tests cover thousands of equal-split combinations, percentage rounding, invalid values, excluded payers, partial settlements, undo, deletion and separate currencies. PGlite executes the actual SQL migration with mocked `auth.uid()` and real roles/RLS: owner/member/outsider access, revisions, invalid splits, unauthorized membership injection, invitation claims/replays/expiry/reissue, private account preferences, immutable payments, overpayments and archive rules.

Browser tests require Playwright’s Chromium (`npx playwright install chromium`) or an installed compatible binary supplied through `PLAYWRIGHT_CHROMIUM_EXECUTABLE`.

Start a device-mode preview in one terminal:

```sh
EXPO_NO_DOTENV=1 EXPO_OFFLINE=1 npx expo start --web --port 8082
```

Then run:

```sh
npm run test:browser
```

This uses a fresh browser profile and covers the full ledger loop, reloads, custom splits, simulated storage failure, duplicate taps, payer corrections, deletion/restoration, draft recovery and persistent preferences. It also visits 24 routes at 320×740 in light/dark themes, checks runtime errors and horizontal overflow, and writes screenshots to `/tmp/splitly-browser`. Change `SPLITLY_TEST_URL` or `SPLITLY_TEST_OUTPUT` if needed.

For account client verification, start a **separate** preview using dummy credentials:

```sh
EXPO_NO_DOTENV=1 EXPO_OFFLINE=1 EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54399 EXPO_PUBLIC_SUPABASE_ANON_KEY=local-test-key npx expo start --web --port 8084
npm run test:account
```

Playwright intercepts every request to the dummy service. Auth responses are mocked; group writes and RLS run against a disposable PGlite database. It verifies signup-confirmation messaging, login, failed-write retry, group/expense persistence, session restoration, logout and guest/account isolation. This does not verify the live Supabase Auth service or email delivery.

## Verification result in this workspace

- TypeScript and ESLint passed without warnings.
- Nine Node test cases passed, including the real SQL migration and access-control assertions above.
- The device browser suite passed its full workflow plus 48 narrow-screen route/theme checks with no page errors or horizontal overflow. Edited-draft recovery and Home privacy were included in the final run.
- The isolated account browser suite passed. Authentication was mocked; ledger SQL was executed by PostgreSQL/PGlite.
- Expo’s production web export succeeded with dummy account configuration, including static rendering. The export was written under `/tmp`; it was not published.

## Remaining real-world validation

- Apply the migration in staging; run the loop using two actual accounts, including invitation expiry/reissue and concurrent edits.
- Validate native camera/photo permissions, attachment persistence, system share sheets, keyboard behavior and back gestures on iOS and Android.
- Exercise expired recovery links and session refresh using real email and installed builds.
- Supply the actual support channel and legally reviewed policies before public distribution.
- Conduct the usability study. Proposed speed targets and comprehension improvements have not been measured with users.

OCR, provider payments, social sign-in, notifications and store release remain explicitly deferred. Nothing in the automated checks establishes that the product is published or that a bank payment occurred.
