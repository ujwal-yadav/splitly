# Splitly Roadmap

> Auto-updated status tracker. Each task is marked as it's completed.
>
> `[ ]` = Not started | `[~]` = In progress | `[x]` = Done

---

## Phase 1: Foundation & Design System

| #   | Task                                                   | Status | Notes                          |
| --- | ------------------------------------------------------ | ------ | ------------------------------ |
| 1.1 | Project structure (folder layout, navigation skeleton) | `[x]`  | Expo Router file-based routing |
| 1.2 | Design tokens (colors, typography, spacing, radii)     | `[x]`  | Green palette from UI spec     |
| 1.3 | Common UI components — Button, Input, Card, Avatar     | `[x]`  | Reusable across all screens    |
| 1.4 | Bottom tab bar (Home, Groups, Add, Activity, Profile)  | `[x]`  | Custom center "+" button       |
| 1.5 | Icon system setup                                      | `[x]`  | @expo/vector-icons + Ionicons  |

---

## Phase 2: Onboarding & Authentication

| #   | Task                           | Screen     | Status | Notes                                              |
| --- | ------------------------------ | ---------- | ------ | -------------------------------------------------- |
| 2.1 | Splash screen                  | #1         | `[ ]`  | Logo + tagline "Split. Settle. Stay close."        |
| 2.2 | Onboarding carousel (3 slides) | #2, #3, #4 | `[ ]`  | Illustrations, dot indicators, skip/next           |
| 2.3 | Login screen                   | #5         | `[ ]`  | Email/password, Google, Apple, "Keep me signed in" |
| 2.4 | Sign up screen                 | #6         | `[ ]`  | Full name, email, password, Google, Apple          |
| 2.5 | Auth logic (Firebase/Supabase) | —          | `[ ]`  | Email + OAuth providers                            |
| 2.6 | Forgot password flow           | —          | `[ ]`  | Linked from login screen                           |

---

## Phase 3: Home Screen

| #   | Task                                                                   | Screen | Status | Notes                                     |
| --- | ---------------------------------------------------------------------- | ------ | ------ | ----------------------------------------- |
| 3.1 | Home screen layout                                                     | #7     | `[ ]`  | Greeting, balance summary cards           |
| 3.2 | Balance overview (You owe / You are owed / Total balance)              | #7     | `[ ]`  | Color-coded amounts (red/green)           |
| 3.3 | Quick action buttons (Add expense, Scan bill, Settle up, Create group) | #7     | `[ ]`  | Icon grid row                             |
| 3.4 | Recent activity list                                                   | #7     | `[ ]`  | Expense cards with amount, date, who paid |

---

## Phase 4: Groups

| #   | Task                    | Screen | Status | Notes                                         |
| --- | ----------------------- | ------ | ------ | --------------------------------------------- |
| 4.1 | Groups list screen      | #8     | `[ ]`  | Search bar, tabs (All / My groups / Archived) |
| 4.2 | Group card component    | #8     | `[ ]`  | Image, name, member count, balance            |
| 4.3 | Create group flow       | —      | `[ ]`  | Name, image, add members                      |
| 4.4 | Group detail screen     | —      | `[ ]`  | Expenses within a group, group balances       |
| 4.5 | "+" FAB to create group | #8     | `[ ]`  | Top-right action button                       |

---

## Phase 5: Expense Management

| #   | Task                                                                 | Screen | Status | Notes                                      |
| --- | -------------------------------------------------------------------- | ------ | ------ | ------------------------------------------ |
| 5.1 | Add expense screen                                                   | #9     | `[ ]`  | Tabs: Manual / Scan bill / Split equally   |
| 5.2 | Expense form (title, amount, date, group, paid by, split with, note) | #9     | `[ ]`  | Date picker, group selector, member picker |
| 5.3 | Split options screen                                                 | #10    | `[ ]`  | Split equally / By amount / By percentage  |
| 5.4 | Per-person amount editing                                            | #10    | `[ ]`  | Editable amounts, add someone              |
| 5.5 | Expense details screen                                               | #11    | `[ ]`  | Full breakdown, who owes whom              |
| 5.6 | Edit / Share expense actions                                         | #11    | `[ ]`  | Bottom action buttons                      |
| 5.7 | Scan bill (OCR)                                                      | #9     | `[ ]`  | Camera + text extraction (future)          |

---

## Phase 6: Settlements & Payments

| #   | Task                       | Screen | Status | Notes                                                         |
| --- | -------------------------- | ------ | ------ | ------------------------------------------------------------- |
| 6.1 | Settle up screen           | #12    | `[ ]`  | People / Groups tabs, per-person settlement amounts           |
| 6.2 | Payment method selection   | #13    | `[ ]`  | UPI (recommended), Bank transfer, Mark as paid, Request money |
| 6.3 | UPI payment screen         | #14    | `[ ]`  | QR code display, "Open in UPI app", "I've paid"               |
| 6.4 | Payment success screen     | #15    | `[ ]`  | Confirmation, amount, "Add a note" option                     |
| 6.5 | Settlement recording logic | —      | `[ ]`  | Update balances after settlement                              |

---

## Phase 7: Activity Feed

| #   | Task                                                                 | Screen | Status | Notes                                   |
| --- | -------------------------------------------------------------------- | ------ | ------ | --------------------------------------- |
| 7.1 | Activity screen                                                      | #16    | `[ ]`  | Timeline list with icons per event type |
| 7.2 | Activity filter tabs (All / Expenses / Settlements / Group activity) | #16    | `[ ]`  | Tab-based filtering                     |
| 7.3 | Activity item component                                              | #16    | `[ ]`  | Icon, description, amount, timestamp    |

---

## Phase 8: Profile & Settings

| #   | Task                            | Screen | Status | Notes                                 |
| --- | ------------------------------- | ------ | ------ | ------------------------------------- |
| 8.1 | Profile screen                  | #17    | `[ ]`  | Avatar, name, email, menu items       |
| 8.2 | Edit profile                    | #17    | `[ ]`  | Name, avatar, email update            |
| 8.3 | Payment methods management      | #17    | `[ ]`  | Add/edit UPI, bank accounts           |
| 8.4 | Notification preferences        | #17    | `[ ]`  | Link to settings                      |
| 8.5 | Currency selector               | #17    | `[ ]`  | INR default                           |
| 8.6 | Settings screen                 | #18    | `[ ]`  | Notification toggles, privacy toggles |
| 8.7 | Help & support / Refer a friend | #17    | `[ ]`  | Deeplinks                             |
| 8.8 | Logout                          | #18    | `[ ]`  | Clear session, return to login        |

---

## Phase 9: Backend & Data Layer

| #   | Task                                                   | Status | Notes                               |
| --- | ------------------------------------------------------ | ------ | ----------------------------------- |
| 9.1 | Database schema (users, groups, expenses, settlements) | `[ ]`  |                                     |
| 9.2 | API / backend service setup                            | `[ ]`  | Supabase or Firebase                |
| 9.3 | Real-time balance calculation engine                   | `[ ]`  | Minimize transactions algorithm     |
| 9.4 | Push notifications                                     | `[ ]`  | Expense added, settlement reminders |
| 9.5 | Image upload (group photos, receipts)                  | `[ ]`  | Cloud storage                       |

---

## Phase 10: Polish & Launch

| #    | Task                              | Status | Notes          |
| ---- | --------------------------------- | ------ | -------------- |
| 10.1 | Empty states & loading skeletons  | `[ ]`  |                |
| 10.2 | Error handling & toast messages   | `[ ]`  |                |
| 10.3 | Dark mode support                 | `[ ]`  |                |
| 10.4 | Animations & transitions          | `[ ]`  | Reanimated     |
| 10.5 | App icon & splash screen assets   | `[ ]`  | Final branding |
| 10.6 | App Store / Play Store submission | `[ ]`  |                |

---

## Summary

| Phase     | Description                 | Progress   |
| --------- | --------------------------- | ---------- |
| 1         | Foundation & Design System  | 5 / 5      |
| 2         | Onboarding & Authentication | 0 / 6      |
| 3         | Home Screen                 | 0 / 4      |
| 4         | Groups                      | 0 / 5      |
| 5         | Expense Management          | 0 / 7      |
| 6         | Settlements & Payments      | 0 / 5      |
| 7         | Activity Feed               | 0 / 3      |
| 8         | Profile & Settings          | 0 / 8      |
| 9         | Backend & Data Layer        | 0 / 5      |
| 10        | Polish & Launch             | 0 / 6      |
| **Total** |                             | **5 / 54** |
