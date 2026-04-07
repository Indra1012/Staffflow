# SalaryPro (StaffFlow) Frontend

SalaryPro (also known as StaffFlow) is an end-to-end Employee, Attendance, and Payroll Management platform designed to streamline human resources and payroll operations. 

This repository contains the **Frontend Website**, built as a responsive Single Page Application (SPA) using React.

## 🚀 Key Features

* **Multi-Portal Access System:**
  * **Admin Dashboard:** Control panel to manage global staff directories, configure company profiles, manage departments, and oversee payroll ledgers across the entire organization.
  * **Staff/Manager Portal:** Role-specific views allowing managers to mark attendance, review staff under their departments, and manage departmental payrolls.
  * **Employee Portal:** Self-service portal where employees can view their payslips, review attendance records, and manage personal data.
* **Bulk Attendance Management:** Support for uploading `.csv` files for mass-attendance marking, as well as an interactive GUI calendar tracker.
* **Advanced Payroll & Ledgers:** Automatically calculates exact net pay based on base salary, fixed allowances/deductions, overtime calculations, plus handling carry-over debits (advances) and credits.
* **High-Fidelity PDF Exports & Sharing:** Uses advanced layout sanitization so that settlement statements and payslips can be cleanly downloaded as custom PDF files.
* **Direct WhatsApp Integration:** Instantly share monthly payslips with employees directly through WhatsApp with dynamically formatted messaging.
* **Robust Export System:** Offers full-year or date-range `.xlsx` Excel spreadsheet downloads rounding up the staff list, transactions, and ledgers in multi-sheet formats.

## 🛠️ Technology Stack

* **Core:** [React 19](https://react.dev/) inside [Vite](https://vitejs.dev/) for blazing-fast HMR and building.
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) for a highly modern, sleek, and fully responsive user interface utilizing oklch colors and dynamic utilities.
* **Authentication:** Seamless user login via JWT-based email/password, as well as Google OAuth 2.0 integration via `@react-oauth/google`.
* **Data Visualization:** Recharts and custom CSS-driven bar graphs for expense tracking.
* **Exporting Ecosystem:**
  * `jspdf` & `html2canvas` / `dom-to-image-more` for PDF generation.
  * `xlsx` for complex Excel spreadsheet generation.

## 📂 Folder Structure

- `src/api` - Axios interceptors and functions facilitating all backend HTTP requests.
- `src/components` - UI building blocks (Sidebars, Modals, Stat Cards).
- `src/context` - React Context providers managing global Authentication state.
- `src/pages` - The root views corresponding to routes (Login, Dashboard, StaffPortal, EmployeePortal).
- `vercel.json` - Configuration defining client-side routing rewrites for Vercel deployment.

## ⚙️ Local Development Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Environment Configuration:**
   Create a `.env` file in the root of the client folder with the necessary backend URI:
   ```env
   VITE_API_URL=http://localhost:5000
   ```
3. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The app will typically be available on `http://localhost:5173`.

## 📦 Building for Production

To create an optimized production build of the frontend, run:

```bash
npm run build
```

This will output the static assets into the `dist` directory, which can be easily hosted on Vercel, Netlify, or an Nginx server.
