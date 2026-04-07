import { useState } from 'react';
import {
  BarChart3, Users, Clock, ArrowLeftRight, Calendar,
  FileText, ChevronDown, ChevronRight, HelpCircle,
  AlertTriangle, CheckCircle2, Info, Lightbulb, Settings,
  BookOpen, PlayCircle, Star
} from 'lucide-react';

const SECTIONS = [
  {
    id: 'getting-started',
    icon: PlayCircle,
    title: 'Getting Started',
    color: 'text-black',
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    items: [
      {
        q: 'I just registered. What should I do first?',
        a: `Follow these steps in order to set up StaffFlow correctly:

Step 1 — Go to the "Directory" tab and click "Add Department" to create your departments (e.g. Sales, Operations, HR). Departments help you organise your staff into groups.

Step 2 — After creating departments, click on a department card and click "Add Staff". Add every employee with their name, job title, base monthly salary, and weekly off day.

Step 3 — Go to the "Attendance" tab, select the current month from the top dropdown, and start marking daily attendance by clicking the cells.

Step 4 — Once attendance is marked for the month, go to the "Payroll" tab and click "Process" next to each staff member to generate their salary slip.

That's the full cycle! Every month you just mark attendance and run payroll.`
      },
      {
        q: 'What does the month selector at the top do?',
        a: `The month dropdown (top-right of every page) controls which month's data you are viewing across the entire app — Attendance, Payroll, and Reports all update based on this selection.

For example, if you select "Feb 2025", you will see:
• Attendance for February 2025
• Payroll calculations for February 2025
• Salary slips processed in February 2025

The Dashboard always shows the last 6 months of expense trend regardless of this selector.

To go back and view or edit a previous month, simply change this dropdown.`
      },
      {
        q: 'Can I use StaffFlow on my phone?',
        a: `Yes! StaffFlow works on mobile. Tap the three-line menu icon (☰) in the top-right corner to open the full navigation menu on your phone. All features work the same on mobile — marking attendance, processing salary, viewing ledgers, and exporting reports.`
      },
      {
        q: 'Is my data saved automatically?',
        a: `Yes. Every action you take — marking attendance, adding staff, processing salary — is saved to the server immediately. There is no "Save All" button. Each individual change is sent to the database the moment you make it.

The only exception is when you are typing inside a modal (pop-up form). Data in a modal is only saved when you click the final confirm button (e.g. "Confirm Payout", "Create Profile", "Save Changes").`
      },
      {
        q: 'I refreshed the page and now I see a different tab. Why?',
        a: `StaffFlow remembers which tab you were on in the URL. Make sure you are using the correct link. When you navigate to a tab, the URL changes (e.g. ?tab=attendance). If you refresh, it will stay on the same tab.

If you are always landing on Dashboard after refresh, check that your browser is not stripping the URL parameters.`
      },
    ]
  },
  {
    id: 'dashboard',
    icon: BarChart3,
    title: 'Dashboard',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    items: [
      {
        q: 'What are the 4 boxes at the top of the Dashboard?',
        a: `These 4 boxes (called Stat Cards) give you a quick summary:

1. Active Team — Total number of currently active staff members. Archived/inactive staff are not counted.

2. Ledger Debt (−) — Total amount of money owed TO the company across all staff who have taken more advances than their salary. This is shown in red when any staff is "over-advanced".

3. Ledger Credit (+) — Total amount of money owed BY the company to staff (unprocessed salary balances).

4. Processed Slips — Number of salary slips that have been generated for the currently selected month.`
      },
      {
        q: 'What is the "Advance Warning" alert?',
        a: `This red alert box appears when one or more staff members have a negative ledger balance that exceeds their entire monthly salary.

Example: If Rahul earns ₹15,000 per month, but his advance balance is −₹20,000 (he owes the company ₹20,000), the warning triggers.

This is a signal that you should either stop giving that person further advances or recover the amount before processing their next salary.

Click the alert to see the full list of over-advanced staff.`
      },
      {
        q: 'What is the "Pending Payouts" alert?',
        a: `This orange alert appears when the previous month's attendance exists for staff members, but their salary has not been processed yet.

Example: It is currently March. If you marked attendance for February but didn't process February salary for some staff, this alert will show.

Click the alert and then click "Go to Payroll" to jump directly to the Payroll tab with last month selected so you can process the pending salaries.`
      },
      {
        q: 'What does the bar chart show?',
        a: `The "Expense Trend" chart shows total salary paid out each month for the past 6 months. Each bar represents one month. Hover over a bar to see the exact amount.

This helps you track whether your payroll costs are increasing, decreasing, or staying stable over time. Only salary payments processed through the Payroll tab are counted — advance payments are not included.`
      },
    ]
  },
  {
    id: 'staff',
    icon: Users,
    title: 'Staff & Departments',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    items: [
      {
        q: 'How do I add my first employee?',
        a: `Before adding staff, you need at least one department. Here's the full process:

1. Go to the "Directory" tab.
2. Click the "Add Department" button and create a department (e.g. type "Operations" and click Create).
3. Now click on that department card to open it.
4. Click the "Add Staff" button (top-right).
5. Fill in:
   • Full Name (required)
   • Job Title — e.g. "Sales Executive", "Driver", "Accountant"
   • Base Salary — the full monthly wage in ₹ (e.g. 15000)
   • Allowance — any fixed extra amount added every month (e.g. HRA ₹2000). Enter 0 if none.
   • Deduction — any fixed amount deducted every month (e.g. PF ₹1200). Enter 0 if none.
   • Weekly Off — choose Sat+Sun for 2 days off, or a specific day if they get only 1 day off
6. Click "Create Profile". The employee is now ready.`
      },
      {
        q: 'What is "Base Salary"? What is the difference between salary, allowance, and deduction?',
        a: `These 3 fields together make up what a staff member earns each month:

BASE SALARY — The main monthly wage. This is divided by the number of days in the month to get a "daily rate". Only the days actually worked (present, on leave, weekly off, holiday) are paid at this rate.

FIXED ALLOWANCE — An extra amount added to every salary payout regardless of attendance. Common examples: House Rent Allowance (HRA), Travel Allowance, Food Allowance.

FIXED DEDUCTION — An amount subtracted from every salary payout. Common examples: Provident Fund (PF), Employee State Insurance (ESI), or any recurring deduction.

Example: Base Salary = ₹15,000 | Allowance = ₹2,000 | Deduction = ₹1,000
→ Gross Payout (if all days present) = ₹15,000 + ₹2,000 − ₹1,000 = ₹16,000`
      },
      {
        q: 'What does "Weekly Off" mean and does it affect salary?',
        a: `Weekly Off is the day(s) when the employee does not work. You have two options:

"Sat + Sun (Weekend)" — The employee has Saturday and Sunday off every week (2 days).
Any single day (e.g. Sunday only, Monday, etc.) — The employee has exactly 1 fixed day off per week.

IMPORTANT: Weekly off days are NOT unpaid. They count as PAID days in the salary calculation. This matches standard labour laws — employees are entitled to paid weekly rest.

In the attendance grid, weekly off days appear with a light grey background and are automatically shown as "WE" if no other status is marked.`
      },
      {
        q: 'How do I edit a staff member\'s details?',
        a: `1. Go to Directory → click the department the staff member belongs to.
2. Find the employee in the table.
3. Click the "Edit" button on the right side of their row.
4. A form opens where you can change their name, job title, allowance, deduction, weekly off day, department, and salary.
5. If you change the salary here, set the "Salary Effective From" date so the system knows from which date the new salary applies. Old months still use the old salary.
6. Click "Save Changes".`
      },
      {
        q: 'How do I give a salary raise (revise salary)?',
        a: `Click "Revise" on the staff member's row. Enter the new monthly base salary amount and set the "Effective From" date.

StaffFlow keeps the full salary history. If you set an effective date of March 1st, then:
• Any month before March uses the old salary for calculations.
• March and later months use the new salary.

This means you can go back and recalculate old months accurately even after giving a raise.`
      },
      {
        q: 'How do I archive (remove) a staff member who has left?',
        a: `Click the archive icon (box icon) on the right side of the staff row. This deactivates the staff member — they will no longer appear in Attendance or Payroll.

Archived staff still appear in the Ledger tab until their balance is zero. If they have an outstanding advance (negative balance), they will appear under "Pending Settlements" reminding you to recover the amount.

To reverse the archive and make them active again, switch to the "Inactive" tab inside the department view and click the restore icon.

Archiving is preferred over deleting because it preserves all transaction history.`
      },
      {
        q: 'What is a Department? Do I need to create one?',
        a: `Yes, you must create at least one department before adding staff. A department is simply a group label for your employees.

If you have a small team and don't need groups, just create one department called "All Staff" or "Team" and add everyone there.

For larger teams, departments help you:
• Filter attendance by team (e.g. show only Sales team attendance)
• Filter payroll by team
• Export attendance reports for a specific team
• See how many staff are in each group at a glance

Each department can have a custom colour to make it easy to identify on screen.`
      },
    ]
  },
  {
    id: 'attendance',
    icon: Clock,
    title: 'Attendance',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    items: [
      {
        q: 'How do I mark attendance? Where do I click?',
        a: `Go to the Attendance tab. You will see a grid — rows are staff members, columns are dates of the selected month.

To mark a day for a staff member: simply click that cell. Each click cycles through the available statuses:
→ For a regular working day: (blank) → P → HD → A → OT → PL → SL → (blank again)
→ For a weekly off day: (blank) → OT → HD → A → PL → SL → (blank again)

The status is saved to the server instantly — no Save button needed. The cell updates in real time.

If you accidentally mark the wrong status, keep clicking until you reach the correct one, or click until it goes back to blank.`
      },
      {
        q: 'What do the attendance codes mean?',
        a: `Here is what each code means and how it affects salary:

P — Present: Employee worked a full day. Counts as 1 full paid day.

HD — Half Day: Employee worked only half the day (morning or afternoon). Counts as 0.5 paid days. Salary is halved for that day.

A — Absent: Employee did not come to work. Counts as 0 paid days. No salary for that day.

OT — Overtime: Employee worked extra hours on a working day. Counts as 1 paid day PLUS earns extra OT pay equal to one day's salary.

PL — Paid Leave: Employee took a planned leave that is paid. Counts as 1 full paid day. Use this for approved vacation days.

SL — Sick Leave: Employee was sick. Counts as 1 full paid day. Use this when the employee was unwell.

PH — Public Holiday: A national/government holiday. Counts as 1 full paid day for all staff.

WE — Weekend: The employee's weekly off day. Automatically shown. Counts as 1 full paid day.`
      },
      {
        q: 'What happens if I leave a cell blank?',
        a: `A blank cell means no attendance has been recorded for that day.

• If it is a weekly off day (grey background) — blank shows as "WE" in the grid and counts as a paid day. This is normal.

• If it is a regular working day — blank means that day is NOT counted as paid. The salary calculation will treat it as if the employee did not work.

BEST PRACTICE: Always fill in all working days before running payroll. Even if staff were present every day, you must mark them as "P" — the system does not assume presence.

TIP: Use the "Auto-Fill" feature to quickly mark all staff as Present for a full month, then adjust individual exceptions (absences, leaves, etc.).`
      },
      {
        q: 'How do I mark a Public Holiday for everyone at once?',
        a: `At the top of the attendance grid, you will see the dates as column headers. Each date header is clickable.

Click on any date number in the header row → All active staff will be marked as "PH" (Public Holiday) for that date simultaneously. The header turns yellow with "PH" label.

Click the same header again to remove the public holiday for all staff.

Note: If a specific staff member should not be on PH (e.g. they were absent), you can click that individual staff member's cell to override it even after marking the whole column as PH.`
      },
      {
        q: 'What is Auto-Fill and how do I use it?',
        a: `Auto-Fill lets you mark attendance for multiple staff members across multiple dates in one action.

How to use:
1. Click the "Auto-Fill" button (top-right of Attendance tab).
2. Choose "Employee" — either All Active Staff or a specific person.
3. Set Start Date and End Date.
4. Choose the status (Present, Absent, Paid Leave, etc.).
5. Click "Apply".

Example uses:
• Mark all staff Present for the entire month (then manually adjust absences)
• Mark a specific employee on Sick Leave for a week
• Mark all staff on Paid Leave during a company holiday period
• Mark a specific employee's attendance for multiple days at once`
      },
      {
        q: 'How do I import attendance from an Excel/CSV file?',
        a: `Step 1: Click the "Export Excel" button → in the modal, select "This Month" → click "Download Excel". This gives you a template with all your staff already listed.

Actually, for CSV import specifically:
Step 1: Inside the Attendance tab, click the "Auto-Fill" button dropdown or use the Import option. Download the attendance template CSV — it has Staff ID, Staff Name, and date columns pre-filled.

Step 2: Open the CSV in Excel or Google Sheets. Fill each cell with the attendance code:
• P for Present, A for Absent, HD for Half Day, OT for Overtime
• PL for Paid Leave, SL for Sick Leave, PH for Public Holiday, WE for Weekend

Step 3: Save the file as CSV and upload it. The system reads each cell and saves them individually.

Important: Do not change the Staff ID column or the date column headers — the system uses these to match records.`
      },
      {
        q: 'Can I see only one department\'s attendance?',
        a: `Yes. Use the "All Departments" dropdown at the top of the Attendance tab. Select a specific department to show only those staff members in the grid. This is useful when you have many employees and want to focus on one team.`
      },
      {
        q: 'Can I change a past month\'s attendance?',
        a: `Yes. Use the month selector (top-right of the page) to navigate to a previous month. The attendance grid will show that month's records. You can click any cell to change it, just like the current month. All changes are saved immediately.

This is useful for correcting mistakes or entering attendance you forgot to mark earlier.`
      },
    ]
  },
  {
    id: 'ledger',
    icon: ArrowLeftRight,
    title: 'Ledgers',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    items: [
      {
        q: 'What is the Ledger tab? Why do I need it?',
        a: `The Ledger is a financial account for each staff member. Think of it like a passbook — every money transaction for that employee is recorded here.

The "Balance" column shows the current financial position:
• Positive balance (+) means the company owes that person money (e.g. unpaid salary carried over from last month).
• Negative balance (−) means the person owes the company money (e.g. they took an advance of ₹5,000 but it hasn't been recovered yet).
• Zero balance means all accounts are settled.

The ledger is updated automatically every time you process salary, give an advance, or add an adjustment.`
      },
      {
        q: 'What is an Advance? How do I record one?',
        a: `An advance is money given to a staff member before their salary is due. For example, if an employee needs ₹3,000 urgently in the middle of the month, you give them an advance.

To record it:
1. Go to the Ledger tab.
2. Click the "Entry" button (top-right).
3. Select the staff member from the dropdown.
4. Click "Debit (−)" to select advance type.
5. Enter the amount (e.g. 3000).
6. Set the date of the advance.
7. Choose the payment mode (Cash, Bank, or UPI).
8. Add a note like "Emergency advance".
9. Click "Confirm Post".

The advance is now recorded. The staff member's balance will show −₹3,000. When you process their next salary, this amount is automatically deducted.`
      },
      {
        q: 'What is an Adjustment (Credit)? When do I use it?',
        a: `A Credit/Adjustment is used when you need to add money back to a staff member's balance without processing a full salary. Use it when:

• You over-deducted from a previous salary and need to refund the difference.
• You need to carry forward a bonus that will be paid next month.
• There was a manual cash payment outside the system that you need to record.
• The employee returned company property and you want to credit the deposit.

To record it:
1. Click "Entry" in the Ledger tab.
2. Select the staff member.
3. Click "Credit (+)".
4. Enter the amount and date.
5. Add a description note.
6. Click "Confirm Post".`
      },
      {
        q: 'How is the Balance calculated exactly?',
        a: `The balance is a running total calculated from ALL transactions for that staff member within the current financial year (April to March):

Starting Balance: ₹0

Every SALARY processed:
• Adds: Earned Salary + OT Pay + Allowance
• Subtracts: Deductions + Amount Actually Paid

Every ADVANCE given: Subtracts the advance amount.

Every ADJUSTMENT (credit): Adds the adjustment amount.

The "Closing Balance" from each salary slip automatically becomes the new balance. If you paid less than the full salary, the remainder stays as a positive balance — it will be included in next month's calculation.`
      },
      {
        q: 'What does "Pending Settlements" mean?',
        a: `This section in the Ledger tab shows staff members who have been ARCHIVED (deactivated) but still have an outstanding balance (positive or negative).

Positive balance → The company still owes them money. You should pay them the remaining amount.
Negative balance → They still owe the company money (unreturned advances). You should try to recover this.

Once a staff member's balance becomes exactly ₹0, they move to the "Archived (Settled)" section which can be collapsed for a clean view.`
      },
      {
        q: 'Can I export a staff member\'s full transaction history?',
        a: `Yes. Click on any staff member's row in the Ledger tab to open their individual ledger. Then use:

"Export CSV" — Downloads a spreadsheet with all transactions (date, type, description, debit, credit).
"Download PDF" — Generates a PDF of the full ledger statement, useful for sharing or printing.

The data shown covers the current Financial Year (April 1 to March 31).`
      },
    ]
  },
  {
    id: 'payroll',
    icon: Calendar,
    title: 'Payroll',
    color: 'text-pink-600',
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    items: [
      {
        q: 'How is monthly salary calculated automatically?',
        a: `StaffFlow calculates salary using this formula:

1. Daily Rate = Base Salary ÷ Total Days in the Month
   (Example: ₹30,000 ÷ 30 days = ₹1,000 per day)

2. Paid Days = Present Days + Weekly Off Days + Public Holidays + Paid Leaves + Sick Leaves + (Half Days × 0.5)

3. Earned Salary = Paid Days × Daily Rate

4. OT Pay = Number of OT Days × Daily Rate
   (Each overtime day earns an extra day's salary on top of normal pay)

5. Net Due = Earned Salary + OT Pay + Fixed Allowance − Fixed Deduction + Previous Balance

Example:
• Base ₹30,000, 30 days in month
• 22 Present + 4 Weekly Offs + 1 PH + 2 PL = 29 paid days
• Earned = 29 × ₹1,000 = ₹29,000
• Add Allowance ₹2,000, subtract Deduction ₹1,500
• Net Due = ₹29,500 + previous balance (if any)`
      },
      {
        q: 'How do I process (pay) a staff member\'s salary?',
        a: `1. Go to the Payroll tab and make sure the correct month is selected.
2. Find the staff member and click the "Process" button.
3. A modal (pop-up) opens showing all pre-calculated values.
4. Review the figures. You can manually change:
   • OT Pay — adjust the overtime amount if needed
   • Allowance — the monthly extra amount
   • Deduction — the monthly deduction amount
   • Remarks — add a note (e.g. "February salary")
   • Payment Mode — Bank, Cash, or UPI
   • Receipt — attach a photo of the payment receipt
5. The "Final Transfer Amount" field at the bottom shows the total amount to be paid. You can change this — for example, if you only paid ₹8,000 out of ₹10,000 due, type 8000 here. The remaining ₹2,000 will carry over as balance.
6. Click "Confirm Payout". The salary slip is created and saved.`
      },
      {
        q: 'What is "Previous Balance" and "Carryover" in the salary modal?',
        a: `PREVIOUS BALANCE — This is the staff member's ledger balance BEFORE this month's salary is processed. It is automatically included in the calculation.

• If balance = −₹3,000 (they took a ₹3,000 advance last month), it reduces the payout by ₹3,000 — the advance is automatically recovered.
• If balance = +₹2,000 (you owe them ₹2,000 from last month), it increases this month's payout by ₹2,000.

CARRYOVER — This appears below the Final Transfer Amount and shows: Net Due − Amount You're Paying = Carryover.

• If Net Due = ₹10,000 and you pay ₹10,000 → Carryover = ₹0 (fully settled).
• If Net Due = ₹10,000 and you pay ₹8,000 → Carryover = +₹2,000 (company still owes ₹2,000 — will be added next month).
• If Net Due = ₹10,000 and you pay ₹12,000 → Carryover = −₹2,000 (staff owes ₹2,000 — will be deducted next month).`
      },
      {
        q: 'I already processed salary for this month but need to make another payment. Is that possible?',
        a: `Yes. Click "Process" again for the same staff member. You will see an orange warning: "Base salary already recorded this month. Processing balances only." This is normal.

This second payout will only process the remaining balance — it won't recalculate the full salary again. It creates a separate Slip #2 for that month.

This is useful when you paid a partial salary first and now want to pay the remaining amount, or when a bonus or incentive payment needs to be processed separately.`
      },
      {
        q: 'How do I view, print, or share a salary slip?',
        a: `After processing salary, you will see "Slip #1" (and Slip #2, #3 if multiple) buttons appear below the Process button for each staff member.

Click any slip button → the slip opens as a modal.

From the slip you can:
• Download PDF — saves a PDF file of the salary slip to your device.
• Share — uses your device's native share function to send via WhatsApp, email, etc.
• Send (WhatsApp icon) — opens WhatsApp with a pre-written salary summary message.

The PDF includes all details: attendance summary, earned salary breakdown, OT, allowances, deductions, opening/closing balance, payment mode, and reference number.`
      },
      {
        q: 'The Earned Salary shows ₹0. What is wrong?',
        a: `There are a few reasons this can happen:

1. No attendance marked — The most common reason. If no attendance is recorded for the selected month, the system has nothing to calculate from. Go to the Attendance tab and mark the month's attendance first.

2. Wrong month selected — Check the month selector (top-right). Make sure you're looking at the correct month.

3. All days marked Absent — If every day is marked "A" (Absent), the earned salary will be ₹0 since no paid days exist.

4. Staff has ₹0 base salary — Check the staff member's profile. If Base Salary is 0, the calculation will always be ₹0. Edit the staff and update the salary.`
      },
      {
        q: 'Does StaffFlow calculate PF, ESI, or TDS?',
        a: `StaffFlow does not automatically calculate PF, ESI, or TDS percentages. However, you can manually handle them:

• Fixed monthly deductions (like PF): Set the fixed deduction amount in the staff profile. It will be automatically deducted every month.

• Variable deductions: When processing salary, you can manually enter the deduction amount in the "Deduction" field inside the salary modal.

• For statutory compliance reports, use the Excel export to get all salary data and then calculate statutory amounts separately.`
      },
    ]
  },
  {
    id: 'reports',
    icon: FileText,
    title: 'Reports & Export',
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    items: [
      {
        q: 'What can I see in the Reports tab?',
        a: `The Reports tab shows all salary slips that have been processed for the currently selected month. Each card shows:
• Employee name
• Date the salary was processed
• Net amount paid
• Overtime details (if any)
• Remarks/notes

Click the printer icon on any card to open the full salary slip with all details.`
      },
      {
        q: 'How do I export all data to Excel?',
        a: `Click the "Export Excel" button in the Reports tab. A pop-up opens with 3 options:

1. By Month — exports data for one specific month. Select the month from the dropdown.

2. Date Range — set a custom start and end date. Useful for quarterly or half-yearly reports.

3. Full Year — exports all data for the entire current Financial Year (April to March).

The Excel file contains 4 sheets:
• Sheet 1 (Staff List): All staff details — name, role, salary, allowances, deductions, status, balance.
• Sheet 2 (Attendance): A full attendance grid for the selected period.
• Sheet 3 (Salary Slips): All processed salary payments with full breakdown.
• Sheet 4 (Transactions): Every ledger entry — advances, adjustments, salary payments.`
      },
      {
        q: 'How do I export only attendance (without salary data)?',
        a: `Go to the Attendance tab → click the "Export Excel" button (top-right). This opens an attendance-specific export modal where you can:

• Filter by department
• Set a custom date range (From / To)
• Use quick presets: This Month, Last Month, or Full Year
• Preview how many staff will be included

The exported file contains one sheet with each staff member's daily attendance status and summary counts (Total Present, Total Absent, Total Half Days).`
      },
      {
        q: 'What is the Financial Year and why does it matter?',
        a: `The Financial Year (FY) in StaffFlow follows the Indian financial calendar: April 1st to March 31st.

For example: FY 2024-25 runs from April 1, 2024 to March 31, 2025.

It matters because:
• The Ledger tab shows transactions only from the current FY.
• The "Full Year" export covers the current FY range.
• The FY label appears in salary slips as a reference.

At the start of a new FY (April 1), ledger history moves to the previous year. Balances carry forward automatically.`
      },
      {
        q: 'Can I view reports from last year?',
        a: `You can view salary slips from previous months by changing the month selector. However, the date range goes back 24 months from today.

For older data, use the Date Range export option in the Excel export to specify any date range you need.

Note: The Ledger tab currently shows only the current Financial Year. For historical ledger data, export it to Excel before the year ends.`
      },
    ]
  },
  {
    id: 'settings',
    icon: Settings,
    title: 'Settings & Account',
    color: 'text-gray-700',
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    items: [
      {
        q: 'How do I change my company name or owner name?',
        a: `Go to the Settings tab → "Company Profile" section. You can update the Company Name and Owner Name fields. Click "Save Profile" to confirm.

Note: The email address cannot be changed after registration. If you need a different email, you would need to create a new account.`
      },
      {
        q: 'How do I change my password?',
        a: `Go to Settings tab → "Change Password" section.
1. Enter your Current Password.
2. Enter the New Password (minimum 6 characters).
3. Confirm the new password by typing it again.
4. Click "Change Password".

If you registered using Google login, you do not have a password set. The password change feature only works for email/password accounts.`
      },
      {
        q: 'How do I log out?',
        a: `On desktop: Click "Logout" in the top-right corner of the navigation bar.
On mobile: Open the sidebar menu (☰ icon, top-right) → scroll to the bottom → tap "Logout".

Logging out clears your session. You will need to log in again to access the app. All your data is safely stored on the server and will be there when you log back in.`
      },
      {
        q: 'I forgot my password. How do I reset it?',
        a: `Currently, StaffFlow does not have a self-service password reset link. If you forgot your password:

Option 1: Try logging in with Google (if you used the same email to register via Google previously).

Option 2: Contact your system administrator to reset the account.

To avoid this in future, use Google login — it never requires a password.`
      },
      {
        q: 'Is my data secure? Who can see it?',
        a: `Your data is private to your account. Each company's data is completely isolated — no other user can see your staff, attendance, or salary information.

All communication between the app and the server is done securely. Your password is stored as an encrypted hash (it is never stored as plain text).

Only people who know your login credentials can access your account data.`
      },
    ]
  },
];

function AccordionItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border border-gray-200 rounded-xl overflow-hidden transition-all ${open ? 'shadow-sm' : ''}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-gray-50 transition-colors gap-3"
      >
        <span className="text-sm font-semibold text-gray-900">{q}</span>
        {open
          ? <ChevronDown size={16} className="text-gray-500 shrink-0" />
          : <ChevronRight size={16} className="text-gray-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-100">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function HelpTab() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const section = SECTIONS.find(s => s.id === activeSection);

  return (
    <div className="space-y-5">
      {/* Contact / promo banner */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <p className="text-xs text-gray-600 leading-relaxed">
          Need a <span className="font-semibold text-black">personal website</span> or a custom app built for your business? I can help!
        </p>
        <a
          href="mailto:mahindra10122002@gmail.com"
          className="shrink-0 text-xs font-semibold text-black underline underline-offset-2 hover:text-gray-600 transition-colors"
        >
          mahindra10122002@gmail.com
        </a>
      </div>

      {/* Header banner */}
      <div className="bg-black rounded-2xl p-5 sm:p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
            <BookOpen size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight">Help & Guide</h3>
            <p className="text-white/60 text-xs mt-0.5">Step-by-step guide for every feature in StaffFlow</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { icon: Star,          text: 'New user? Start with "Getting Started" section below' },
            { icon: Lightbulb,     text: 'Always mark attendance BEFORE running payroll' },
            { icon: CheckCircle2,  text: 'Every change saves automatically — no Save All button' },
            { icon: Info,          text: 'Negative balance = advance taken, not yet recovered' },
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-2 bg-white/10 rounded-lg px-3 py-2.5">
              <tip.icon size={13} className="text-white/70 mt-0.5 shrink-0" />
              <span className="text-[11px] text-white/85 leading-snug">{tip.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Section selector — scrollable on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap border transition-colors shrink-0 ${
              activeSection === s.id
                ? `${s.bg} ${s.color} ${s.border}`
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <s.icon size={13} />
            {s.title}
          </button>
        ))}
      </div>

      {/* FAQ accordion for active section */}
      {section && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className={`px-5 py-4 border-b ${section.border} ${section.bg} flex items-center justify-between`}>
            <div className="flex items-center gap-2.5">
              <section.icon size={18} className={section.color} />
              <div>
                <h4 className={`font-bold text-sm ${section.color}`}>{section.title}</h4>
                <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-widest">{section.items.length} questions answered</p>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-2">
            {section.items.map((item, i) => (
              <AccordionItem key={i} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      )}

      {/* Bottom note */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start gap-3">
        <Info size={15} className="text-gray-400 mt-0.5 shrink-0" />
        <p className="text-xs text-gray-600 leading-relaxed">
          <span className="font-semibold text-gray-800">Still stuck?</span> All data is saved in real time. If anything looks wrong after a refresh, try logging out and logging back in. For any critical issue, contact your system administrator.
        </p>
      </div>
    </div>
  );
}
