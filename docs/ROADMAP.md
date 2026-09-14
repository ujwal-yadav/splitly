# Splitly delivery status

Updated September 12, 2026. This supersedes the prototype’s “54 / 54 done” checklist. Screens, configured services, and store metadata are not proof that a feature is released.

Stages: **UI ready** → **Connected** → **Verified** → **Released**. “Verified” below names the environment; no feature is marked released without release evidence.

| Capability                                                  | UI    | Connection                                                          | Verification                                         | Release                                          |
| ----------------------------------------------------------- | ----- | ------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------ |
| Home, Groups, Activity, avatar access to Profile            | Ready | Shared ledger                                                       | Browser, light/dark, narrow phone                    | Not published                                    |
| One-page introduction, device-only start                    | Ready | Persistent startup choice                                           | Browser, relaunch                                    | Not published                                    |
| Account sign-in, signup confirmation, session restoration   | Ready | Supabase Auth                                                       | Mock Auth transport + real local PostgreSQL engine   | Live Auth settings and device validation pending |
| Password recovery                                           | Ready | Email request, recovery redirect, update password                   | Typechecked; real email and native deep link pending | Not published                                    |
| Create group, add names, rename, archive                    | Ready | Local storage / revisioned shared group RPC                         | Browser core flow; database invariants               | Cloud migration pending                          |
| Add/edit/delete/restore expense                             | Ready | Atomic ledger writes, integer minor units                           | Browser, failure retry, relaunch, unit and DB tests  | Cloud migration pending                          |
| Equal, exact-amount, percentage splits                      | Ready | Applied to expense draft                                            | Browser and rounding/property checks                 | Not published                                    |
| Expense draft recovery                                      | Ready | Device storage, unsaved-change prompt                               | Browser back and relaunch                            | Native gesture check pending                     |
| Pairwise balances by group and currency                     | Ready | Common calculation engine                                           | Unit tests, partial payments, zero-net debts         | Not published                                    |
| Manual payment records, partial payments, undo              | Ready | Same ledger and revision checks                                     | Browser and database tests                           | Cloud migration pending                          |
| Invitations with named preview                              | Ready | Expiring, single-use server tokens                                  | SQL access/claim tests                               | Live two-account device test pending             |
| Group activity and expense history                          | Ready | Ledger events; server revision history includes authenticated actor | Browser and database                                 | Cloud migration pending                          |
| Profile, default currency, Home privacy, payment preference | Ready | Device storage / account preferences                                | Browser persistence and privacy checks               | Cloud migration pending                          |
| Receipt and profile photo attachment                        | Ready | Small embedded images; system picker                                | Typechecked; physical camera/library check pending   | Not published                                    |
| Export records                                              | Ready | Native/web share action                                             | Manual browser/device share-sheet check pending      | Not published                                    |
| Help content                                                | Ready | Answers match available features                                    | Source review                                        | Owner must configure support/legal details       |
| Automated regression suites                                 | Ready | Node, PGlite, Playwright                                            | Local execution documented below                     | CI integration pending                           |

Deferred intentionally: automatic OCR, payment initiation/provider verification, social sign-in, push reminders, referrals, bulk settlement, automatic FX, and silent cross-group debt simplification. These are removed from active flows or described as unavailable; no simulated success is shown.

Before a public release:

1. Install the additive shared-ledger migration on the intended Supabase project and verify its RLS under real accounts. Keep a backup of existing data. The new UI uses `ledger_*` tables; legacy prototype records are not automatically imported.
2. Configure allowed email redirect URLs, confirm-email behavior, support contact, privacy policy and terms. Validate recovery on web and installed apps.
3. Run the physical-device checklist and a two-account invitation/receipt/expense/payment test against staging.
4. Run the moderated usability study in [USABILITY_STUDY.md](USABILITY_STUDY.md). Collect actual outcomes before claiming faster entry or better comprehension.
5. Publish only after those checks pass. Existing EAS/app-store configuration is preparation, not a submission or release.

See [implementation and verification](PRODUCT_IMPLEMENTATION.md) for setup, data decisions and the exact automated checks.
