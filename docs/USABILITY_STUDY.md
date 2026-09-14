# Splitly usability validation kit

Purpose: validate whether the shorter flows improve expense entry and balance understanding. These are tasks and measurement instructions, not fabricated findings. No participants were contacted during implementation.

Recruit 5–8 people who share meals, trips or household costs. Include occasional expense-app users and people who currently use chat/spreadsheets. Use fictitious names and amounts, never real account credentials or bank payments. Obtain permission before recording a session. Test on participants’ usual phone platform where possible.

Run each session for about 25 minutes. Ask the person to think aloud. Read the task, then observe without telling them where to tap. Record any assistance separately. A small formative sample identifies usability problems; it does not estimate population-wide conversion.

| Task               | Scenario                                         | Observe                                                                                           |
| ------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| First value        | Create “Dinner crew” with Rohan and Priya        | Can they start without reading instructions or registering everyone?                              |
| Common expense     | You paid ₹600 for dinner. Priya did not attend.  | Time from choosing Add expense to a saved record; participant errors; ability to state each share |
| Payer correction   | Rohan actually paid for that dinner. Correct it. | Can they find the expense and explain the changed debt direction?                                 |
| Draft recovery     | Start a second expense, go back, then resume it  | Whether the save-draft prompt is understood; whether they trust the resumed fields                |
| Unequal split      | Split ₹500 as ₹200 for you and ₹300 for Rohan    | Discoverability of Change split; whether they notice an invalid total                             |
| Zero net           | You owe Rohan ₹100; Priya owes you ₹100          | Ask “Are you settled up? Who needs to pay whom?” before offering any explanation                  |
| Partial settlement | You already paid Rohan ₹40 outside Splitly       | Whether they understand recording vs sending money and the ₹60 remainder                          |
| Mistake recovery   | That recorded payment was entered by mistake     | Can they undo the record without assuming it refunds money?                                       |
| Invitation         | Preview an invitation addressed to Priya         | Understanding of participant identity, shared data and accepting the correct invitation           |

For each task capture: completed independently / completed with help / failed, elapsed time, wrong taps, corrections, participant/payer/split mistakes, and a one-sentence comprehension answer. Afterward ask which screen felt hardest and what they expected to happen there. Avoid asking whether they “like” the redesign as the main measure.

Initial hypotheses to validate:

- Returning users can save an ordinary expense in under 20 seconds.
- Users can correctly explain debt direction and separate balances with different people.
- Users understand that “Payment recorded” neither moves money nor verifies receipt.
- People can recover drafts and mistakes without assistance.

Record results in a table with participant pseudonym, platform, task, outcome, time, errors, help needed and observed issue. Prioritize issues by severity and frequency. Fix the highest-impact problems, then run another small round. Do not treat automated Playwright timings as human usability evidence.

Production measurement plan (not yet a deployed analytics pipeline): first saved shared expense, expense-start→saved completion/time, failure/retry rate, correction rate, invitation acceptance, payment-record completion and undo rate. Use confirmed saves as outcomes; exclude sample/device QA data and duplicate attempts. Avoid collecting names, receipt contents, notes, emails or monetary values for behavioral analytics. Choose the analytics destination and consent requirements before wiring external telemetry.
