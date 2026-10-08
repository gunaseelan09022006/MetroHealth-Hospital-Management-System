const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

function generateAppointmentCode() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const lastRow = db.prepare('SELECT id FROM appointments ORDER BY id DESC LIMIT 1').get();
  const nextNum = (lastRow ? lastRow.id : 0) + 1;
  return `APT-${dateStr}-${String(nextNum).padStart(4, '0')}`;
}

// GET /api/appointments - List appointments with filters
router.get('/', authenticateToken, (req, res) => {
  const { date, status, doctor_id, patient_id, department, timeframe, search } = req.query;

  let query = `
    SELECT a.*,
           p.name AS patient_name, p.patient_code, p.phone AS patient_phone, p.gender AS patient_gender, p.dob AS patient_dob,
           d.name AS doctor_name, d.doctor_code, d.specialization, d.department, d.consultation_fee, d.room_number
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    JOIN doctors d ON a.doctor_id = d.id
    WHERE 1=1
  `;
  const params = [];

  const today = new Date().toISOString().split('T')[0];

  if (timeframe === 'today') {
    query += ' AND a.appointment_date = ?';
    params.push(today);
  } else if (timeframe === 'upcoming') {
    query += " AND a.appointment_date >= ? AND a.status IN ('Scheduled', 'Confirmed')";
    params.push(today);
  } else if (timeframe === 'past') {
    query += ' AND a.appointment_date < ?';
    params.push(today);
  }

  if (date) {
    query += ' AND a.appointment_date = ?';
    params.push(date);
  }

  if (status && status !== 'all') {
    query += ' AND a.status = ?';
    params.push(status);
  }

  if (doctor_id) {
    query += ' AND a.doctor_id = ?';
    params.push(doctor_id);
  }

  if (patient_id) {
    query += ' AND a.patient_id = ?';
    params.push(patient_id);
  }

  if (department) {
    query += ' AND d.department = ?';
    params.push(department);
  }

  if (search) {
    query += ' AND (p.name LIKE ? OR p.patient_code LIKE ? OR d.name LIKE ? OR a.appointment_code LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';

  const appointments = db.prepare(query).all(...params);
  res.json(appointments);
});

// GET /api/appointments/:id
router.get('/:id', authenticateToken, (req, res) => {
  const appointment = db.prepare(`
    SELECT a.*,
           p.name AS patient_name, p.patient_code, p.phone AS patient_phone, p.email AS patient_email, p.gender AS patient_gender, p.blood_group,
           d.name AS doctor_name, d.doctor_code, d.specialization, d.department, d.consultation_fee, d.room_number, d.phone AS doctor_phone
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    JOIN doctors d ON a.doctor_id = d.id
    WHERE a.id = ?
  `).get(req.params.id);

  if (!appointment) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  // Also fetch prescription and bill if any
  const prescription = db.prepare('SELECT id, prescription_code, diagnosis, status FROM prescriptions WHERE appointment_id = ?').get(req.params.id);
  const bill = db.prepare('SELECT id, bill_code, total_amount, payment_status FROM bills WHERE appointment_id = ?').get(req.params.id);

  res.json({
    ...appointment,
    prescription,
    bill,
  });
});

// POST /api/appointments - Book appointment with strict double-booking check
router.post('/', authenticateToken, (req, res) => {
  const {
    patient_id,
    doctor_id,
    appointment_date,
    appointment_time,
    reason,
    status = 'Scheduled',
    notes,
  } = req.body;

  if (!patient_id || !doctor_id || !appointment_date || !appointment_time || !reason) {
    return res.status(400).json({ error: 'Patient, Doctor, Date, Time, and Reason are required' });
  }

  // 1. Verify patient exists and is active
  const patient = db.prepare('SELECT id, name FROM patients WHERE id = ?').get(patient_id);
  if (!patient) {
    return res.status(400).json({ error: 'Selected patient does not exist' });
  }

  // 2. Verify doctor exists and is active
  const doctor = db.prepare('SELECT id, name, status FROM doctors WHERE id = ?').get(doctor_id);
  if (!doctor) {
    return res.status(400).json({ error: 'Selected doctor does not exist' });
  }
  if (doctor.status === 'inactive') {
    return res.status(400).json({ error: 'Doctor is currently inactive' });
  }

  // 3. Check if doctor is on leave on this date
  const leave = db.prepare('SELECT * FROM doctor_leaves WHERE doctor_id = ? AND leave_date = ?').get(doctor_id, appointment_date);
  if (leave) {
    return res.status(400).json({
      error: `Doctor ${doctor.name} is on leave on ${appointment_date} (${leave.reason || 'Leave recorded'}). Please select another date.`
    });
  }

  // 4. PREVENT DOUBLE BOOKING: Doctor cannot have two non-cancelled appointments at the exact same date and time
  const existingBooking = db.prepare(`
    SELECT a.id, a.appointment_code, p.name AS booked_patient
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    WHERE a.doctor_id = ? AND a.appointment_date = ? AND a.appointment_time = ? AND a.status != 'Cancelled'
  `).get(doctor_id, appointment_date, appointment_time);

  if (existingBooking) {
    return res.status(409).json({
      error: `Conflict: Dr. ${doctor.name} already has an appointment (${existingBooking.appointment_code}) booked at ${appointment_time} on ${appointment_date}. Please choose another time slot.`
    });
  }

  const appointment_code = generateAppointmentCode();

  try {
    const insert = db.prepare(`
      INSERT INTO appointments (
        appointment_code, patient_id, doctor_id, appointment_date, appointment_time, reason, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      appointment_code,
      patient_id,
      doctor_id,
      appointment_date,
      appointment_time,
      reason.trim(),
      status,
      notes ? notes.trim() : null
    );

    const created = db.prepare(`
      SELECT a.*,
             p.name AS patient_name, p.patient_code,
             d.name AS doctor_name, d.specialization, d.department, d.room_number
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Failed to book appointment: ' + err.message });
  }
});

// PUT /api/appointments/:id/status - Update appointment status
router.put('/:id/status', authenticateToken, (req, res) => {
  const { status } = req.body;
  if (!['Scheduled', 'Confirmed', 'Completed', 'Cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const existing = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  db.prepare('UPDATE appointments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);

  const updated = db.prepare(`
    SELECT a.*,
           p.name AS patient_name, p.patient_code,
           d.name AS doctor_name, d.specialization, d.department
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    JOIN doctors d ON a.doctor_id = d.id
    WHERE a.id = ?
  `).get(req.params.id);

  res.json(updated);
});

// PUT /api/appointments/:id - Reschedule or update appointment
router.put('/:id', authenticateToken, (req, res) => {
  const { appointment_date, appointment_time, reason, status, notes } = req.body;
  const existing = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  const newDate = appointment_date || existing.appointment_date;
  const newTime = appointment_time || existing.appointment_time;

  // If date or time changed, check double booking
  if ((newDate !== existing.appointment_date || newTime !== existing.appointment_time) && (status !== 'Cancelled')) {
    const conflict = db.prepare(`
      SELECT id, appointment_code FROM appointments
      WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status != 'Cancelled' AND id != ?
    `).get(existing.doctor_id, newDate, newTime, req.params.id);

    if (conflict) {
      return res.status(409).json({ error: `Double booking conflict: Doctor already has an appointment booked at ${newTime} on ${newDate}.` });
    }
  }

  try {
    db.prepare(`
      UPDATE appointments
      SET appointment_date = ?, appointment_time = ?, reason = COALESCE(?, reason),
          status = COALESCE(?, status), notes = COALESCE(?, notes), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      newDate,
      newTime,
      reason,
      status,
      notes,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update appointment: ' + err.message });
  }
});

// DELETE /api/appointments/:id
router.delete('/:id', authenticateToken, (req, res) => {
  const existing = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  db.prepare('DELETE FROM appointments WHERE id = ?').run(req.params.id);
  res.json({ message: 'Appointment deleted successfully' });
});

module.exports = router;

