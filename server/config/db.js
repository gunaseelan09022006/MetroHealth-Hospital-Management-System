const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'hospital.db');
const db = new Database(dbPath);

// Enable foreign key constraints and WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'doctor', 'receptionist')),
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      doctor_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS doctors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doctor_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      specialization TEXT NOT NULL,
      department TEXT NOT NULL,
      consultation_fee REAL NOT NULL DEFAULT 50.00,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      qualifications TEXT,
      room_number TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'on_leave', 'inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS doctor_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doctor_id INTEGER NOT NULL,
      day_of_week TEXT NOT NULL CHECK(day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
      break_start TEXT,
      break_end TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
      UNIQUE(doctor_id, day_of_week)
    );

    CREATE TABLE IF NOT EXISTS doctor_leaves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doctor_id INTEGER NOT NULL,
      leave_date TEXT NOT NULL,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
      UNIQUE(doctor_id, leave_date)
    );

    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      dob TEXT NOT NULL,
      gender TEXT NOT NULL CHECK(gender IN ('Male', 'Female', 'Other')),
      blood_group TEXT NOT NULL CHECK(blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
      phone TEXT NOT NULL,
      email TEXT,
      address TEXT NOT NULL,
      emergency_contact TEXT NOT NULL,
      medical_history TEXT,
      allergies TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_code TEXT UNIQUE NOT NULL,
      patient_id INTEGER NOT NULL,
      doctor_id INTEGER NOT NULL,
      appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Scheduled' CHECK(status IN ('Scheduled', 'Confirmed', 'Completed', 'Cancelled')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS prescriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prescription_code TEXT UNIQUE NOT NULL,
      appointment_id INTEGER,
      patient_id INTEGER NOT NULL,
      doctor_id INTEGER NOT NULL,
      prescription_date TEXT NOT NULL,
      diagnosis TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active', 'Completed')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS prescription_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prescription_id INTEGER NOT NULL,
      medicine_name TEXT NOT NULL,
      dosage TEXT NOT NULL,
      frequency TEXT NOT NULL,
      duration TEXT NOT NULL,
      instructions TEXT,
      FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_code TEXT UNIQUE NOT NULL,
      patient_id INTEGER NOT NULL,
      doctor_id INTEGER NOT NULL,
      appointment_id INTEGER,
      consultation_fee REAL NOT NULL DEFAULT 0.00,
      medicine_charges REAL NOT NULL DEFAULT 0.00,
      other_charges REAL NOT NULL DEFAULT 0.00,
      subtotal REAL NOT NULL DEFAULT 0.00,
      tax_or_discount REAL NOT NULL DEFAULT 0.00,
      total_amount REAL NOT NULL DEFAULT 0.00,
      payment_status TEXT NOT NULL DEFAULT 'Pending' CHECK(payment_status IN ('Paid', 'Pending', 'Partially Paid')),
      payment_method TEXT NOT NULL DEFAULT 'Cash' CHECK(payment_method IN ('Cash', 'Card', 'UPI')),
      paid_amount REAL NOT NULL DEFAULT 0.00,
      balance_due REAL NOT NULL DEFAULT 0.00,
      bill_date TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes for performance and search
    CREATE INDEX IF NOT EXISTS idx_patients_code ON patients(patient_code);
    CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);
    CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
    CREATE INDEX IF NOT EXISTS idx_doctors_dept ON doctors(department);
    CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
    CREATE INDEX IF NOT EXISTS idx_appointments_doc_date ON appointments(doctor_id, appointment_date);
    CREATE INDEX IF NOT EXISTS idx_bills_patient ON bills(patient_id);
    CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
  `);
}

initSchema();

module.exports = db;

