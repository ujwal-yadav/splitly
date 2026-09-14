Splitly product review — September 12, 2026

The next product iteration should make three jobs effortless: add a shared expense, understand who owes whom, and record a settlement. The strongest opportunity is to reduce decisions and make outcomes dependable.

This review covers all 23 user-facing screens, their navigation, and the current screen-to-service connections. It draws on the preceding browser review and a fresh source inspection. Recommendations are hypotheses to validate with target users; no usability interviews or production analytics were available. Application code was not changed for this review.

The working audience assumption is people sharing everyday expenses in small groups, such as friends, households, and trips. Validate the primary use case before adding specialist workflows. Estimates below are relative scope, not delivery commitments.

**Address these trust gaps first.**

- Add expense, Create group, and Save profile currently navigate back without calling their save services. Confirm split also returns without applying the selected split to the expense. A user can reasonably interpret these actions as successful saves. Keep users in the flow until a save succeeds, preserve drafts on failure, and show the saved result after success.
- Payment confirmation navigates to a success screen that displays a fixed ₹400 payment to Rohan. It does not establish that money moved or a settlement was recorded. Separate “Open payment app,” “Record a payment,” and provider-verified payment success. Include pending, failed, cancelled, and duplicate-submission handling.
- Social sign-in buttons and several edit, delete, invite, support, and payment controls have no working action. Implement them or remove them from the live experience until ready. Sample experiences should be clearly identified and separated from real account data.
- Profile fields, preferences, payment-method choices, and currency selection rely on local or fixed data in their screens. A setting must survive navigation and relaunch before presenting it as saved.
- Zero net balance does not mean everyone is settled. Someone can owe Rohan ₹100 while being owed ₹100 by Priya. The current settlement summary would label that net-zero state “You’re all settled up.” Base that message on the absence of outstanding debts.
- The roadmap marks all phases complete, including OCR and launch, although the screen code contains placeholders. Replace binary completion with UI ready, connected, verified, and released. A configured build or service function is not evidence of a completed user journey.

Evidence: [expense submission](../src/app/add-transaction.tsx), [group creation](../src/app/create-group.tsx), [split confirmation](../src/app/split-options.tsx), [payment confirmation](../src/app/payment-method.tsx), [payment success](../src/app/payment-success.tsx), [settlement overview](../src/app/settle-up.tsx), [current roadmap](ROADMAP.md).

**Make the default expense path small.**

An ordinary expense should require an amount, a description, and a group or people. Default the payer to the current user, the date to today, and the split to equal shares among the selected participants. When opened from a group, carry that group into the form. Display those defaults so users can verify them without opening another screen.

A proposed first view:

| Element          | Example                                |
| ---------------- | -------------------------------------- |
| Amount           | ₹600                                   |
| Description      | Dinner                                 |
| With             | Weekend crew                           |
| Editable summary | Paid by you · Split equally · 4 people |
| Optional details | Date, category, receipt, note          |
| Primary action   | Add expense                            |

Allow participants to be deselected quickly; never silently assume every member attended. Show the per-person result before submission. Put amount and percentage splitting behind “Change split,” and apply changes back into the expense draft. A bottom sheet is appropriate for short choices; a full screen remains appropriate for long participant lists or complex splits.

This follows progressive disclosure: present the frequent path first and reveal advanced options when requested. See [Nielsen Norman Group: Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/).

**Give each destination one purpose.**

Test a navigation model with Home, Groups, and Activity, plus account access through the avatar. Keep a clearly labeled Add expense action available throughout the main experience. It is an action rather than a destination; the current empty Add route already redirects to the expense form.

Home answers “What needs my attention?” Groups answers “Where are my shared expenses?” Activity answers “What changed?” Move Create group into Groups and Scan bill into the expense form. Keep contextual shortcuts when they save users a meaningful step; reducing duplicate entry points is not itself the goal.

Home should lead with “You owe ₹1,500” and “You’re owed ₹700.” Each opens the relevant people. Make the ₹800 net figure secondary or omit it: it is not the amount the user can necessarily pay to clear every debt. Show a few recent groups below, with one useful next action for a new user.

**Review of every screen.**

| Screen              | Current friction or opportunity                                                                                     | Proposed simplification                                                                                                                                                                                           | Priority / relative scope |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| 1. Splash           | Fixed 2.5-second delay and unconditional routing to onboarding                                                      | Show only while restoring startup state. Route returning users to their last useful destination.                                                                                                                  | P1 / small–medium         |
| 2. Onboarding       | Three promotional steps before first value                                                                          | One optional introduction, followed by Create a group or Join a group. Remember completion. Explain advanced features in context.                                                                                 | P1 / medium               |
| 3. Login            | Email/password plus inactive social options and an unwired “Keep me signed in” choice                               | Offer only working methods; make session behavior dependable. Preserve invited-group context after login.                                                                                                         | P0 / medium               |
| 4. Sign-up          | Account setup precedes the shared-expense context; email-verification state is not handled as a distinct experience | Ask for the minimum identity information, explain which group the person is joining, and handle verification with a clear “Check your email” state.                                                               | P0–P1 / medium            |
| 5. Forgot password  | Sends a link, then immediately returns to the previous screen                                                       | Show the destination email, resend/change-email actions, and complete the recovery link through setting a new password.                                                                                           | P0 / medium               |
| 6. Home             | Four similarly weighted shortcuts, summary figures, and repeated group content compete                              | Lead with actionable debts, one Add expense action, and recent groups. Move secondary setup and scanning actions into context.                                                                                    | P1 / medium               |
| 7. Groups           | All/Active/Settled/Archived choices appear immediately, even for a small collection                                 | Default to current groups. Put archived groups under a secondary filter. Show group name, participant count, and the user's balance; omit transaction counts unless useful.                                       | P1 / small                |
| 8. Group detail     | Expenses, balances, and members compete; Add expense loses the current group context                                | Show the group balance and expenses first. Keep Add expense and Settle up contextual. Put member management behind the member count. Retain a clear route to detailed balances.                                   | P1 / medium               |
| 9. Create group     | Icon and type decisions precede adding people                                                                       | Require only a name. Choose an editable default icon; make type optional or remove it unless it changes behavior. Offer inviting people after creation and support named participants before registration.        | P1 / medium–large         |
| 10. Add expense     | Ten categories of fields/choices make a routine action long; save does not persist                                  | Use the compact default form above. Save reliably and return to the new expense. Keep entered values on failure or accidental navigation.                                                                         | P0–P1 / large             |
| 11. Split options   | Three methods and all member amounts are exposed; changes are not applied to the parent form                        | Default to equal shares. Show “₹150 each” and Change split. Keep a running remainder, precise rounding, and an applied result.                                                                                    | P0–P1 / medium            |
| 12. Expense detail  | Total, payer, and shares require interpretation; Edit/Delete are inactive                                           | Lead with “You owe Rohan ₹150 for dinner.” Keep the total and full breakdown below. Provide working edit, safe deletion, and an understandable change history.                                                    | P0–P1 / medium            |
| 13. Settle up       | Net amount can mislead; People/Groups adds a classification step; review sheet ends without settlement              | Default to people and show explicit payment direction. Use group filtering when needed. Replace generic actions with “Pay Priya ₹1,250” or “Record money received.” Show contributing groups before confirmation. | P0–P1 / large             |
| 14. Payment method  | Payment rails, manual recording, and reminders are mixed as peer options                                            | Separate money movement from recording an existing payment. Default to a preferred supported method. Allow amount changes for partial payments.                                                                   | P0 / large                |
| 15. Payment success | Fixed recipient/amount and success without verification; View details returns to the method screen                  | Display the actual saved settlement and its status. Say “Payment recorded” for manual records. Use one Done action returning to the original group/person; link to the actual record.                             | P0 / medium               |
| 16. Activity        | Non-actionable rows and filters require users to reconstruct what happened                                          | Make each event open the relevant expense or settlement. Use “Rohan added Dinner · Your share ₹150.” Offer useful defaults and preserve group context.                                                            | P1 / medium               |
| 17. Profile         | “Your space” is less predictable than Profile; Notifications and Settings overlap                                   | Use Profile or Account. Consolidate account details, preferences, payment details, and help. Move infrequent referral actions lower.                                                                              | P1 / small                |
| 18. Edit profile    | Four identity fields and account deletion compete; saving is local-only                                             | Focus on name and photo. Put email/security changes and deletion in account settings. Request phone/username only when a real feature needs them.                                                                 | P0–P1 / medium            |
| 19. Payment methods | Wallet management adds setup before it is needed; additions are inactive                                            | Configure a preferred method during the first relevant settlement. Keep this page for later management and explain what is stored.                                                                                | P0–P2 / medium–large      |
| 20. Currency        | Selection does not persist and its effect is unclear                                                                | Set a visible group default and permit expense-level choices only if supported. State whether changing a currency changes a default or converts amounts. Never imply conversion without it.                       | P0–P1 / medium            |
| 21. Settings        | Numerous local-only toggles and duplicate account routes                                                            | Group persistent preferences into Notifications, Privacy, and Account. Consolidate related notification controls and keep their effects understandable.                                                           | P0–P1 / medium            |
| 22. Help/support    | FAQ guidance describes unavailable flows; some contact choices do nothing                                           | Keep answers aligned with shipped functionality. Offer one dependable support route. Put short explanations beside confusing tasks before adding more help content.                                               | P0–P1 / small–medium      |
| 23. Scan bill       | Separate top-level workflow; extraction currently delays then opens an empty expense form                           | Move to Add receipt within Add expense. Until extraction exists, call it Attach receipt. Once implemented, prefill a draft and let users review uncertain fields.                                                 | P0–P2 / large for OCR     |

P0 means needed before exposing the relevant flow to real users. P1 means the next simplification work. P2 means defer until the core experience is dependable. The Add navigation route is an action redirect, not an additional user-facing screen.

**Use language that tells users what will happen.**

| Current wording or pattern              | Proposed wording                                                         |
| --------------------------------------- | ------------------------------------------------------------------------ |
| Transactions in a list of expenses      | Expenses                                                                 |
| Your space                              | Profile                                                                  |
| Confirm split                           | Apply split                                                              |
| Settle / Review balances                | Pay Priya ₹1,250, or View balance details when review is the only action |
| Mark as paid                            | Record a payment                                                         |
| Payment successful after a manual entry | Payment recorded                                                         |
| Net zero presented as all settled       | You owe ₹100 · You’re owed ₹100, until all debts are cleared             |

The warm brand voice can stay in onboarding and empty states. I would shorten several decorative introductions from the recent redesign on repeat-use forms: users entering their tenth expense need the amount field more than another headline. Familiar wording, visible state, and recoverable actions are established usability principles; see [Nielsen Norman Group: Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/).

**Make the social experience easier as well.**

A group creator should be able to add names without making everyone register immediately. Share a group-specific invitation with a preview of the group and a clear join action. Distinguish invited people from joined members. Show everyone the same expense record, explain edits, and let someone flag an incorrect split. Reminders should be neutral, optional, and previewable. These are proposed capabilities, not existing behavior.

Do not introduce cross-group debt simplification silently. If someone is asked to pay a person who did not pay the original expense, show how the amount was derived and let the group opt into that behavior.

**Recommended delivery order.**

1. Complete a trustworthy core loop: create group → add expense → see updated balances → record settlement → see the correct remaining balance after relaunch. Verify failed saves, duplicate taps, partial payments, edits, deletion, and net-zero-but-outstanding balances.
2. Reduce the common expense flow to a few inputs, apply split changes correctly, and preserve group context and drafts.
3. Simplify the first-session and invitation experience. Lead with the next useful action for an empty account.
4. Streamline Home, navigation, group management, and terminology. Test these changes before removing destinations users already rely on.
5. Add OCR, more payment integrations, advanced splitting, referrals, and bulk settlement only after the basic loop succeeds consistently.

**Validate outcomes, not just screen completion.**

Run an initial moderated test with 5–8 people from the intended audience. Ask them to create a dinner group, exclude one person from a ₹600 expense, correct a payer, explain who owes whom, and record a partial payment. Include a case where the net is zero but two debts remain. Observe without explaining the interface. Follow with another round after improvements; these small samples are for finding friction, not estimating population-wide conversion.

Measure first saved shared expense, time and completion rate for adding an expense, incorrect payer/participant/split selections, invitation acceptance, ability to explain a balance correctly, settlement completion, and persistence after relaunch. A useful initial usability target to validate is a common expense in under 20 seconds for a returning user; that is a proposed target, not a measured result. Monitor corrections, disputes, and failed saves so faster entry does not conceal mistakes.

For the next release, the product promise should be modest and dependable: users can add an expense quickly, understand every balance, and confidently record what has been settled.
