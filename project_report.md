# Project Report: StaffFlow (SalaryPro) - Comprehensive HR & Payroll Management System

## 1. Introduction and Problem Statement
Managing employee profiles, daily attendance, and complex payroll calculations manually using spreadsheets is a time-consuming and error-prone process for growing businesses. Discrepancies in attendance tracking (overtime, half-days, various leave types) directly impact payroll accuracy, leading to employee dissatisfaction and administrative overhead. 

**StaffFlow (also known as SalaryPro)** is a comprehensive, full-stack web application designed to solve these challenges. It provides an intuitive, automated platform that centralizes staff management, streamlines attendance tracking, and automates payroll calculations, thereby saving time, ensuring accuracy, and fostering transparency between employers and employees.

---

## 2. Project Objectives
*   **Centralized Employee Database:** Maintain complete staff profiles including salaries, roles, departments, and allowances/deductions.
*   **Accurate Attendance Tracking:** Enable granular daily attendance logging, supporting various statuses like Present, Absent, Half-Day, Overtime, Paid Leave, Sick Leave, and Public Holidays.
*   **Automated Payroll Processing:** Automatically calculate monthly salaries based on attendance records, fixed allowances, deductions, and previous balances/advances.
*   **Financial Tracking:** Keep an immutable ledger of transactions, advances, adjustments, and salary slip generation.
*   **Employee Self-Service (Staff Portal):** Empower employees to log in independently to view their own attendance records, transaction history, and download salary slips.

---

## 3. Technology Stack
The application is built using the **MERN** stack, adhering to modern web development standards for high performance and scalability.

### Frontend
*   **Library/Framework:** React 19, powered by Vite for rapid development and optimized builds.
*   **Routing:** React Router DOM (v7) for seamless single-page application (SPA) navigation.
*   **Styling:** Tailwind CSS (v4) for responsive, utility-first, and highly customizable UI design.
*   **Icons & Assets:** Lucide React for consistent, scalable iconography.
*   **Data Fetching:** Axios for handling asynchronous REST API requests to the backend.
*   **Export/Reporting:** `jspdf` and `html2canvas` for generating downloadable PDF salary slips, and `xlsx` for Excel data exports.
*   **Authentication:** `@react-oauth/google` for secure employer Google Sign-In.

### Backend
*   **Runtime:** Node.js.
*   **Framework:** Express.js for robust RESTful API creation.
*   **Database:** MongoDB, mapped via Mongoose ORM for structured data modeling.
*   **Security & Authentication:** 
    *   `bcryptjs` for secure password hashing.
    *   `jsonwebtoken` (JWT) for stateless session management and route protection.
    *   `google-auth-library` for backend OAuth verification.

---

## 4. System Architecture
The application follows a standard **Client-Server architecture**.
1.  **Presentation Layer (React Frontend):** Handles all user interfaces across two distinct portals (Admin/Employer Portal and Staff Portal). Validates inputs and renders dynamic data received from the APIs.
2.  **Application Logic Layer (Express API Server):** Processes business rules, manages authentication middleware (`auth.js`, `staffAuth.js`), calculates payroll analytics, and acts as the bridge to the database.
3.  **Data Access Layer (MongoDB):** Unstructured but well-defined document storage holding interconnected collections for Companies, Staff, Departments, Attendance, and Transactions.

*(Insert a system architecture diagram here if needed).*
> **[PLACEHOLDER: Insert System Architecture or Data Flow Diagram Here]**

---

## 5. Core Roles and Responsibilities

### 5.1 Company / Admin Role
The business owner or HR administrator has full control over the ecosystem.
*   Registers the company via Email/Password or Google OAuth.
*   Creates and manages custom organizational Departments.
*   Onboards Staff members, setting their base salaries, fixed allowances, and deductions.
*   Marks daily attendance for all employees.
*   Records financial advances given to employees and random numerical adjustments.
*   Generates monthly payroll, which auto-calculates final payable amounts and generates official transaction records and PDF salary slips.

### 5.2 Staff / Employee Role
Employees are granted restricted portal access.
*   Logs in via email and a system-assigned password.
*   Views their daily and monthly attendance history.
*   Tracks their personal transaction ledger (advances vs. salary payouts).
*   Downloads official, generated PDF Salary Slips for previously paid months.

> **[PLACEHOLDER: Insert Image - Admin Dashboard Overview vs Staff Portal Overview]**

---

## 6. Database Schema Design (MongoDB)
The application utilizes a fully relational document model to link data efficiently.

1.  **Company Collection:**
    *   Stores `companyName`, `ownerName`, `email`, secured `password`, and a `googleAuth` flag.
2.  **Department Collection:**
    *   Linked to a specific `Company`. Stores department name, description, and visual UI color.
3.  **Staff Collection:**
    *   Linked to a `Company` and optionally a `Department`.
    *   Stores profile data: Name, Role, Base Salary, Fixed Allowances/Deductions, Weekly Off days.
    *   Maintains a `balance` tracking their current debit/credit standing with the company.
    *   Stores Staff Portal login credentials.
4.  **Attendance Collection:**
    *   Linked to a `Company`, a specific `Staff` member, and a `date`.
    *   Tracks `status` (P, A, HD, OT, PL, SL, PH, WE).
5.  **Transaction Collection:**
    *   Linked to `Company` and `Staff`.
    *   Records financial movements categorized by `type` (salary, advance, adjustment).
    *   For `salary` types, it holds a comprehensive breakdown resembling a payslip: `earnedSalary`, overtime, bonuses, days present/absent, leave counts, opening/closing balances.

> **[PLACEHOLDER: Insert ER Diagram (Entity-Relationship) of the Database Schema Here]**

---

## 7. Key Features & Workflows

### 7.1 Dashboard & Analytics
Provides the Admin with high-level summaries. Includes total active staff, total departments, and a quick glance at today's attendance metrics.
> **[PLACEHOLDER: Insert Image - Admin Dashboard View]**

### 7.2 Staff Management Workflow
A robust interface to add new employees. Admins can configure their financial profile immediately upon creation, assigning a base salary and noting any fixed weekly off days to ensure accurate future attendance calculations.
> **[PLACEHOLDER: Insert Image - Staff Directory and Add New Staff Form]**

### 7.3 Multi-Status Attendance System
Unlike simple check-in systems, StaffFlow supports complex HR scenarios. An admin can mark an employee as:
*   **Present (P):** Full day pay.
*   **Overtime (OT):** Triggers overtime calculations.
*   **Half-Day (HD):** Halves the daily wage.
*   **Absences (A) & Leaves (PL/SL):** Distinguishes between paid and unpaid absences.
> **[PLACEHOLDER: Insert Image - Attendance Marking Screen]**

### 7.4 Transactions & Advances Ledger
Admins can record mid-month cash advances given to workers. This reflects instantly on the employee's running `balance` and is automatically deducted when the final end-of-month salary is generated.
> **[PLACEHOLDER: Insert Image - Staff Transaction Ledger/History]**

### 7.5 Automated Payroll Generation
The core feature of StaffFlow. The system prompts the admin to select a month. It then scans all attendance records for that month, calculates the total payable days (factoring in Half-Days and Paid Leaves), adds Overtime and fixed allowances, and subtracts mid-month advances to arrive at a final settlement figure. Once confirmed, a "Salary" Transaction is logged.
> **[PLACEHOLDER: Insert Image - Payroll Generation Engine / Summary Table]**

### 7.6 PDF Salary Slip Export
Using `html2canvas` and `jsPDF`, the React frontend translates DOM elements into high-quality, printable PDF documents. Employees can download these slips directly from their portal to use as official proof of income.
> **[PLACEHOLDER: Insert Image - PDF Salary Slip Preview]**

---

## 8. Conclusion
StaffFlow successfully bridges the gap between raw attendance data and actionable payroll processing. Utilizing a modern, responsive React 19 frontend and a secure Node/Express backend, it abstracts the complexities of hr management into a clean, user-friendly interface. With granular attendance statuses and an automated ledger system, it prevents human error, minimizes administrative workloads, and empowers employees with self-service transparency.
