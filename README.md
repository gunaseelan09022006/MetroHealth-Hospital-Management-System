# MetroHealth - Hospital Management System (HMS)

A modern, full-stack Hospital Management System designed for hospital administrators, doctors, and front-desk receptionists to manage patient records, appointments, doctor schedules, billing, and prescriptions from one centralized dashboard.

---

## 🌟 Key Features & Modules

### 1. Operations Dashboard
- **Real-time KPI Metrics**: Total Patients, Today's Appointments, Available Doctors (on-duty), Pending Bills & amounts, Active Prescriptions, and Total Revenue Collected.
- **Rapid Quick Actions**: One-click modal launchers for *Add Patient*, *Book Appointment*, *Doctor Schedule*, *Create Prescription*, and *Create Bill*.
- **Live Visual Analytics**: Department workload distribution meters and appointment status breakdown rings.
- **Activity Feeds**: Upcoming appointments, recently registered patients, and recently cleared payments.

### 2. Patient Records Management
- **Full Clinical Registration**: Name, DOB, Gender, Blood Group, Phone, Email, Address, Emergency Contact, Medical History, and Known Drug/Food Allergies.
- **Automated Patient Code Generation**: Unique identifier format (e.g., `PAT-1001`).
- **Comprehensive Patient Dossier**:
  - Personal Information & Allergy Alert Badges
  - Complete Appointment History
  - Attending Physician visits summary
  - Clinical Prescriptions & Dispensation history
  - Itemized Billing ledger & Payment statuses
- **Filtering & Search**: Instant filter by Blood Group, Gender, Status (active/inactive), and free-text search.

### 3. Appointment Management & Conflict Engine
- **Intelligent Slot Calculation**: Real-time consultation slot generator based on doctor working hours, lunch/break times, and existing bookings.
- **Double-Booking Protection**: Strict conflict verification prevents overlapping appointments for the same doctor and time.
- **Doctor Leave Awareness**: Blocks booking if the selected physician is scheduled on official leave.
- **Lifecycle Statuses**: `Scheduled`, `Confirmed`, `Completed`, and `Cancelled` with quick action buttons.

### 4. Doctor Schedules & Leave Rostering
- **Directory**: Specialist profiles across Cardiology, Neurology, Pediatrics, Orthopedics, General Medicine, and Dermatology.
- **Weekly Schedule Customizer**: Configure working hours, lunch breaks, and slot durations (15m, 20m, 30m, 45m, 60m) for Monday through Sunday.
- **Leave Management**: Register and track upcoming doctor leaves and conference absences.

### 5. Multi-Item Prescriptions & Formal Rx Pad
- **Doctor-Authorized Prescriptions**: Create multi-drug prescriptions with diagnoses, dietary precautions, and lifestyle advice.
- **Multiple Medication Items**: Medicine name, dosage, frequency, duration, and special intake instructions.
- **Printable Medical Rx Pad**: Professional hospital prescription letterhead with clinic details, ℞ symbol, itemized medicines, and doctor's signature line (supports standard `window.print()`).

### 6. Billing, Invoices & Payment Ledger
- **Itemized Charges**: Consultation fee (auto-filled from attending doctor), pharmacy charges, and diagnostic/lab fees.
- **Automated Financial Computations**:
  $$\text{Subtotal} = \text{Consultation Fee} + \text{Medicine Charges} + \text{Other Charges}$$
  $$\text{Net Total} = \text{Subtotal} \pm \text{Adjustments}$$
  $$\text{Balance Due} = \text{Net Total} - \text{Paid Amount}$$
- **Multi-Channel Payments**: Supports Cash, Card, and UPI / Digital payments with `Paid`, `Partially Paid`, and `Pending` statuses.
- **Printable Formal Tax Invoice**: High-resolution hospital billing invoice with itemized charges, payment method stamp, and cashier sign-off.

### 7. Universal Global Search
- Access via `Ctrl + K` or the top navigation bar.
- Unified instantaneous search across Patients, Doctors, Appointments, Prescriptions, and Invoices.

### 8. Role-Based Access Control (RBAC)
- **Hospital Administrator (`admin`)**: Complete unrestricted access across all clinical and administrative records.
- **Medical Specialist / Doctor (`doctor`)**: Access to Patients, Appointments, Schedules, Prescriptions, and Dossiers.
- **Front-Desk Receptionist (`receptionist`)**: Access to Patients, Appointments, Schedules, and Billing. Cannot create medical prescriptions (guarded by 403 Forbidden).
- **One-Click Demo Switcher**: Switch between Admin, Doctor, and Receptionist directly from the sidebar.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite 8, Tailwind CSS v4, Lucide React icons.
- **Backend**: Node.js, Express.js, CORS, JSON Web Tokens (JWT), Bcrypt.js password hashing.
- **Database**: SQLite with `better-sqlite3` (WAL mode enabled, relational foreign key constraints).
- **Concurrency**: `concurrently` for running backend and frontend with a single command.

---

## 🚀 How to Run the System

### 1. Initial Setup & Database Seed
```bash
# Seed the database with realistic hospital data
npm run seed
```

### 2. Start Both Backend & Frontend Concurrently
```bash
npm run dev
```

- **Frontend Dev URL**: `http://localhost:5173`
- **Backend API & Production Bundle URL**: `http://localhost:5000`
- **API Health Check**: `http://localhost:5000/api/health`

---

## 🔑 Demo Login Credentials

| Role | Username | Password | Default User |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Hospital Administrator |
| **Doctor** | `dr_sarah` | `doctor123` | Dr. Sarah Jenkins (Cardiology) |
| **Receptionist** | `receptionist` | `reception123` | Mark Stevens (Front Desk) |

*You can also switch active roles instantly with one click using the Demo Role Switcher at the bottom of the sidebar.*

