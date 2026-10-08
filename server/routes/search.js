const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/search?q=query
router.get('/', authenticateToken, (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    return res.json({
      patients: [],
      doctors: [],
      appointments: [],
      prescriptions: [],
      bills: [],
    });
  }

  const s = `%${q.trim()}%`;

  const patients = db.prepare(`
    SELECT id, patient_code, name, phone, gender, blood_group
    FROM patients
    WHERE name LIKE ? OR patient_code LIKE ? OR phone LIKE ?
    LIMIT 5
  `).all(s, s, s);

  const doctors = db.prepare(`
    SELECT id, doctor_code, name, specialization, department, room_number
    FROM doctors
    WHERE name LIKE ? OR doctor_code LIKE ? OR specialization LIKE ? OR department LIKE ?
    LIMIT 5
  `).all(s, s, s, s);

  const appointments = db.prepare(`
    SELECT a.id, a.appointment_code, a.appointment_date, a.appointment_time, a.status,
           p.name AS patient_name, d.name AS doctor_name
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    JOIN doctors d ON a.doctor_id = d.id
    WHERE a.appointment_code LIKE ? OR p.name LIKE ? OR d.name LIKE ?
    LIMIT 5
  `).all(s, s, s);

  const prescriptions = db.prepare(`
    SELECT pr.id, pr.prescription_code, pr.prescription_date, pr.diagnosis, pr.status,
           p.name AS patient_name, d.name AS doctor_name
    FROM prescriptions pr
    JOIN patients p ON pr.patient_id = p.id
    JOIN doctors d ON pr.doctor_id = d.id
    WHERE pr.prescription_code LIKE ? OR pr.diagnosis LIKE ? OR p.name LIKE ?
    LIMIT 5
  `).all(s, s, s);

  const bills = db.prepare(`
    SELECT b.id, b.bill_code, b.total_amount, b.payment_status, b.bill_date,
           p.name AS patient_name
    FROM bills b
    JOIN patients p ON b.patient_id = p.id
    WHERE b.bill_code LIKE ? OR p.name LIKE ?
    LIMIT 5
  `).all(s, s);

  res.json({
    patients,
    doctors,
    appointments,
    prescriptions,
    bills,
  });
});

module.exports = router;

