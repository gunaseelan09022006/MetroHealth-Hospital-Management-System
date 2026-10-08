const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/dashboard/stats
router.get('/stats', authenticateToken, (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  // 1. Total Patients
  const totalPatients = db.prepare("SELECT COUNT(*) AS count FROM patients WHERE status = 'active'").get().count;

  // 2. Today's Appointments
  const todayAppointments = db.prepare("SELECT COUNT(*) AS count FROM appointments WHERE appointment_date = ? AND status != 'Cancelled'").get(today).count;

  // 3. Available Doctors (active and not on leave today)
  const availableDoctors = db.prepare(`
    SELECT COUNT(*) AS count FROM doctors d
    WHERE d.status = 'active'
    AND d.id NOT IN (
      SELECT doctor_id FROM doctor_leaves WHERE leave_date = ?
    )
  `).get(today).count;

  // 4. Pending Bills
  const pendingBillsRow = db.prepare(`
    SELECT COUNT(*) AS count, COALESCE(SUM(balance_due), 0) AS total_pending_amount
    FROM bills
    WHERE payment_status IN ('Pending', 'Partially Paid')
  `).get();

  // 5. Active Prescriptions
  const activePrescriptions = db.prepare("SELECT COUNT(*) AS count FROM prescriptions WHERE status = 'Active'").get().count;

  // 6. Total Revenue Collected
  const totalRevenue = db.prepare("SELECT COALESCE(SUM(paid_amount), 0) AS total FROM bills").get().total;

  // 7. Recent Patients (last 5)
  const recentPatients = db.prepare(`
    SELECT id, patient_code, name, dob, gender, blood_group, phone, created_at
    FROM patients
    ORDER BY id DESC
    LIMIT 5
  `).all();

  // 8. Upcoming Appointments (from today onwards, scheduled or confirmed)
  const upcomingAppointments = db.prepare(`
    SELECT a.id, a.appointment_code, a.appointment_date, a.appointment_time, a.reason, a.status,
           p.id AS patient_id, p.name AS patient_name, p.patient_code, p.phone AS patient_phone,
           d.id AS doctor_id, d.name AS doctor_name, d.specialization, d.department, d.room_number
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    JOIN doctors d ON a.doctor_id = d.id
    WHERE a.appointment_date >= ? AND a.status IN ('Scheduled', 'Confirmed')
    ORDER BY a.appointment_date ASC, a.appointment_time ASC
    LIMIT 6
  `).all(today);

  // 9. Recent Payments (last 5 bills with payment)
  const recentPayments = db.prepare(`
    SELECT b.id, b.bill_code, b.total_amount, b.paid_amount, b.payment_status, b.payment_method, b.bill_date,
           p.id AS patient_id, p.name AS patient_name, p.patient_code,
           d.name AS doctor_name
    FROM bills b
    JOIN patients p ON b.patient_id = p.id
    JOIN doctors d ON b.doctor_id = d.id
    WHERE b.paid_amount > 0
    ORDER BY b.id DESC
    LIMIT 5
  `).all();

  // 10. Department distribution (appointments count per department)
  const departmentBreakdown = db.prepare(`
    SELECT d.department, COUNT(a.id) AS count
    FROM doctors d
    LEFT JOIN appointments a ON d.id = a.doctor_id
    GROUP BY d.department
    ORDER BY count DESC
  `).all();

  // 11. Appointment status breakdown
  const appointmentStatuses = db.prepare(`
    SELECT status, COUNT(*) AS count
    FROM appointments
    GROUP BY status
  `).all();

  res.json({
    totalPatients,
    todayAppointments,
    availableDoctors,
    pendingBills: {
      count: pendingBillsRow.count,
      amount: pendingBillsRow.total_pending_amount,
    },
    activePrescriptions,
    totalRevenue,
    recentPatients,
    upcomingAppointments,
    recentPayments,
    departmentBreakdown,
    appointmentStatuses,
    serverDate: today,
  });
});

module.exports = router;

