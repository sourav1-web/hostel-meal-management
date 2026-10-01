# Hostel Meal Attendance & Billing System

A simple system to mark daily meal attendance (Lunch and Dinner) and automatically calculate the monthly bill based on how many meals were actually taken. Meal prices are set by the user and can be changed for every month.

---

## 1. Project Overview

| Item | Details |
|------|---------|
| **Problem** | The hostel serves food twice a day (Lunch & Dinner). I don't eat every meal, so I should only pay for the meals I actually take. |
| **Solution** | A simple app where I mark Yes/No for each meal daily. At month end, the total bill is calculated automatically. |
| **Users** | Student / hostel resident (single user to start; multi-user can be added later) |
| **Key Idea** | Bill = (Lunches taken x Lunch price) + (Dinners taken x Dinner price) |

---

## 2. Requirements

### 2.1 Functional Requirements
1. Mark attendance for **Lunch** and **Dinner** separately for each day.
2. Each meal can be marked as **Taken** or **Not Taken** (default: Not Taken, or configurable).
3. Set the **price of Lunch** and **price of Dinner**.
4. Prices are **editable per month** (e.g., January lunch = Rs 50, February lunch = Rs 55).
5. Show the **monthly summary**: total lunches, total dinners, price per meal, and total amount to pay.
6. View **past months' records** and bills.
7. Edit attendance of previous days (in case of a mistake).

### 2.2 Non-Functional Requirements
- Simple and fast to use (marking attendance should take under 5 seconds).
- Works on mobile (most used from phone).
- Data should not be lost (saved in a database or local storage).
- Old months' bills must **not change** when new month's price is updated.

---

## 3. Core Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | Daily Attendance | Checkbox/toggle for Lunch and Dinner per date |
| 2 | Price Settings | Set Lunch & Dinner price for a selected month |
| 3 | Monthly Calendar View | See all days with Lunch/Dinner status at a glance |
| 4 | Auto Bill Calculation | Total amount based on meals taken x price |
| 5 | Month History | Browse previous months and their bills |
| 6 | Edit Records | Fix wrong attendance entries |
| 7 | (Optional) Payment Tracking | Mark a month's bill as Paid / Unpaid |
| 8 | (Optional) Export | Download monthly report as PDF / CSV |

---

## 4. Overall Project Flow

```
        +-------------------+
        |   Open the App    |
        +---------+---------+
                  |
                  v
   +--------------+---------------+
   | Is price set for this month?  |
   +------+----------------+-------+
        No|                |Yes
          v                |
 +--------+---------+      |
 | Set Lunch &      |      |
 | Dinner price     |      |
 +--------+---------+      |
          |                |
          +-------+--------+
                  v
        +---------+----------+
        |   Dashboard / Home  |
        +---------+----------+
                  |
     +------------+-------------+
     v            v             v
+----+-----+ +----+------+ +----+--------+
| Mark     | | View      | | View Past   |
| Today's  | | Monthly   | | Months /    |
| Meals    | | Summary   | | Edit Price  |
+----+-----+ +----+------+ +-------------+
     |            |
     v            v
 Save to DB   Calculate Bill
```

---

## 5. Daily User Flow

1. User opens the app.
2. Today's date is shown with two toggles: **Lunch** and **Dinner**.
3. User turns ON the meals they took (or will take).
4. App saves the entry for that date.
5. Running total for the month updates instantly.

---

## 6. Monthly Flow

1. **Start of month:** Set (or confirm) Lunch price and Dinner price for the new month.
   - If not set, the app can pre-fill with last month's price, which the user can edit.
2. **During the month:** Mark attendance daily.
3. **End of month:** App shows the final summary:
   - Total lunches taken
   - Total dinners taken
   - Lunch price and Dinner price used
   - **Total amount to pay**
4. User marks the bill as **Paid** (optional) and the month is archived.

---

## 7. Billing Logic

```
Lunch Amount  = Lunch Count  x Lunch Price (of that month)
Dinner Amount = Dinner Count x Dinner Price (of that month)

Total Bill    = Lunch Amount + Dinner Amount
```

### Example

| Item | Count | Price per Meal | Amount |
|------|-------|----------------|--------|
| Lunch | 20 | Rs 50 | Rs 1,000 |
| Dinner | 25 | Rs 60 | Rs 1,500 |
| **Total** | | | **Rs 2,500** |

If next month the Lunch price becomes Rs 55, only that month's bill uses Rs 55. Previous months stay unchanged.

---

## 8. Data Model (Database Design)

### Table: `monthly_prices`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER (PK) | Unique ID |
| month | INTEGER | 1-12 |
| year | INTEGER | e.g., 2026 |
| lunch_price | DECIMAL | Price of one lunch for this month |
| dinner_price | DECIMAL | Price of one dinner for this month |

> Unique constraint on (`month`, `year`).

### Table: `attendance`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER (PK) | Unique ID |
| date | DATE | Attendance date (unique) |
| lunch_taken | BOOLEAN | true if lunch was taken |
| dinner_taken | BOOLEAN | true if dinner was taken |

### Table: `bills` (optional)
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER (PK) | Unique ID |
| month | INTEGER | 1-12 |
| year | INTEGER | Year |
| total_lunch | INTEGER | Lunches taken |
| total_dinner | INTEGER | Dinners taken |
| total_amount | DECIMAL | Final bill |
| is_paid | BOOLEAN | Payment status |

### Relationship
`attendance.date` -> belongs to month/year -> uses the matching row in `monthly_prices`.

---

## 9. Screens / UI Plan

1. **Home / Today**
   - Date, Lunch toggle, Dinner toggle
   - This month's running total

2. **Monthly Calendar**
   - Grid of all days; each day shows L / D icons (taken or not)
   - Tap a day to edit

3. **Price Settings**
   - Select month and year
   - Input fields for Lunch price and Dinner price
   - Save button

4. **Monthly Summary / Bill**
   - Lunch count, Dinner count, prices, total amount
   - Paid / Unpaid status

5. **History**
   - List of past months with totals

---

## 10. Suggested Tech Stack (choose what you are comfortable with)

| Option | Frontend | Backend | Database |
|--------|----------|---------|----------|
| **Simple (beginner)** | HTML + CSS + JavaScript | None | LocalStorage |
| **Web app** | React | Node.js + Express | SQLite / MongoDB |
| **Python option** | Streamlit or Flask templates | Python (Flask) | SQLite |
| **Mobile app** | Flutter / React Native | Firebase | Firestore |

> Recommended to start: **HTML + JS + LocalStorage** or **Python + Flask + SQLite**.

---

## 11. API Endpoints (if using a backend)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/attendance` | Add/update attendance for a date |
| GET | `/attendance?month=10&year=2026` | Get all attendance for a month |
| POST | `/prices` | Set prices for a month |
| GET | `/prices?month=10&year=2026` | Get prices of a month |
| PUT | `/prices/:id` | Edit prices of a month |
| GET | `/bill?month=10&year=2026` | Get calculated bill for a month |

---

## 12. Edge Cases to Handle

- **Price not set for a month:** prompt the user to set it, or copy last month's price.
- **Price changed mid-month:** by design, one price per month applies to the whole month.
- **Marking a future date:** allow or block (decide based on need).
- **Editing old attendance:** allowed, and the bill recalculates.
- **Duplicate entry for the same date:** update the existing record instead of creating a new one.
- **Month with 28/29/30/31 days:** handled by using real calendar dates.

---

## 13. Development Plan (Step by Step)

| Phase | Task | Outcome |
|-------|------|---------|
| 1 | Finalize requirements and design | This document |
| 2 | Set up project and database | Tables ready |
| 3 | Build price settings (per month) | Prices can be saved and edited |
| 4 | Build daily attendance screen | Lunch/Dinner toggles saved |
| 5 | Build monthly summary and bill calculation | Correct totals shown |
| 6 | Build calendar and history view | Past data viewable |
| 7 | Testing with sample data | Bugs fixed |
| 8 | (Optional) Paid/Unpaid, export, reminders | Extra features |

---

## 14. Future Improvements

- Daily reminder notification to mark attendance.
- Multiple users (admin = hostel mess owner, users = students).
- Different prices for special meals (e.g., Sunday special).
- Monthly PDF/Excel export.
- Charts showing meals taken per month.
- Login and cloud backup.

---

## 15. Quick Summary

> Mark **Lunch** and **Dinner** daily -> Set **price per month** -> App counts meals taken -> **Pay only for what you eat.**
