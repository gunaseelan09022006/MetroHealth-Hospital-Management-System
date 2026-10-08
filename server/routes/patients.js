const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Helper to generate next Patient Code
function generatePatientCode() {
  const lastPatient = db.prepare('SELECT id FROM patients ORDER BY id DESC LIMIT 1').get();
  const nextNumber = (lastPatient ? lastPatient.id : 0) + 1;
  return `PAT-${String(nextNumber).padStart(4, '0')}`;
}

// GET /api/patients
// Supports search query, blood_group, gender, and status filters
router.get('/', authenticateToken, (req, res) => {
  const { search, blood_group, gender, status } = req.query;

  let query = 'SELECT * FROM patients WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (name LIKE ? OR patient_code LIKE ? OR phone LIKE ? OR email LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  if (blood_group) {
    query += ' AND blood_group = ?';
    params.push(blood_group);
  }

  if (gender) {
    query += ' AND gender = ?';
    params.push(gender);
  }

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY id DESC';

  const patients = db.prepare(query).all(...params);
  res.json(patients);
});

// GET /api/patients/:id - Full Dossier
router.get('/:id', authenticateToken, (req, res) => {
  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  // Appointment history
  const appointments = db.prepare(`
    SELECT a.*, d.name AS doctor_name, d.specialization, d.department, d.room_number
    FROM appointments a
    JOIN doctors d ON a.doctor_id = d.id
    WHERE a.patient_id = ?
    ORDER BY a.appointment_date DESC, a.appointment_time DESC
  `).all(req.params.id);

  // Distinct doctor visits
  const doctorVisits = db.prepare(`
    SELECT DISTINCT d.id, d.name, d.specialization, d.department,
           MAX(a.appointment_date) AS last_visit_date,
           COUNT(a.id) AS total_visits
    FROM appointments a
    JOIN doctors d ON a.doctor_id = d.id
    WHERE a.patient_id = ?
    GROUP BY d.id
    ORDER BY last_visit_date DESC
  `).all(req.params.id);

  // Prescriptions with medicine items
  const prescriptions = db.prepare(`
    SELECT p.*, d.name AS doctor_name, d.specialization
    FROM prescriptions p
    JOIN doctors d ON p.doctor_id = d.id
    WHERE p.patient_id = ?
    ORDER BY p.prescription_date DESC
  `).all(req.params.id);

  const prescriptionsWithItems = prescriptions.map((rx) => {
    const items = db.prepare('SELECT * FROM prescription_items WHERE prescription_id = ?').all(rx.id);
    return { ...rx, items };
  });

  // Billing history
  const bills = db.prepare(`
    SELECT b.*, d.name AS doctor_name
    FROM bills b
    JOIN doctors d ON b.doctor_id = d.id
    WHERE b.patient_id = ?
    ORDER BY b.bill_date DESC, b.id DESC
  `).all(req.params.id);

  res.json({
    ...patient,
    appointments,
    doctorVisits,
    prescriptions: prescriptionsWithItems,
    bills,
  });
});

// POST /api/patients - Create new patient
router.post('/', authenticateToken, (req, res) => {
  const {
    name,
    dob,
    gender,
    blood_group,
    phone,
    email,
    address,
    emergency_contact,
    medical_history,
    allergies,
  } = req.body;

  // Validation
  if (!name || !dob || !gender || !blood_group || !phone || !address || !emergency_contact) {
    return res.status(400).json({ error: 'Please provide all required fields' });
  }

  const patient_code = generatePatientCode();

  try {
    const insert = db.prepare(`
      INSERT INTO patients (
        patient_code, name, dob, gender, blood_group, phone, email,
        address, emergency_contact, medical_history, allergies, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `);

    const result = insert.run(
      patient_code,
      name.trim(),
      dob,
      gender,
      blood_group,
      phone.trim(),
      email ? email.trim() : null,
      address.trim(),
      emergency_contact.trim(),
      medical_history ? medical_history.trim() : null,
      allergies ? allergies.trim() : null
    );

    const created = db.prepare('SELECT * FROM patients WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create patient record: ' + err.message });
  }
});

// PUT /api/patients/:id - Edit patient
router.put('/:id', authenticateToken, (req, res) => {
  const {
    name,
    dob,
    gender,
    blood_group,
    phone,
    email,
    address,
    emergency_contact,
    medical_history,
    allergies,
    status,
  } = req.body;

  const existing = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  try {
    db.prepare(`
      UPDATE patients
      SET name = ?, dob = ?, gender = ?, blood_group = ?, phone = ?, email = ?,
          address = ?, emergency_contact = ?, medical_history = ?, allergies = ?,
          status = COALESCE(?, status), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name || existing.name,
      dob || existing.dob,
      gender || existing.gender,
      blood_group || existing.blood_group,
      phone || existing.phone,
      email !== undefined ? email : existing.email,
      address || existing.address,
      emergency_contact || existing.emergency_contact,
      medical_history !== undefined ? medical_history : existing.medical_history,
      allergies !== undefined ? allergies : existing.allergies,
      status || existing.status,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update patient: ' + err.message });
  }
});

// DELETE /api/patients/:id - Soft deactivate or hard delete
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'receptionist'), (req, res) => {
  const existing = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  const { permanent } = req.query;

  if (permanent === 'true') {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can permanently delete patient records' });
    }
    db.prepare('DELETE FROM patients WHERE id = ?').run(req.params.id);
    return res.json({ message: 'Patient permanently deleted' });
  }

  // Otherwise toggle or set inactive
  const newStatus = existing.status === 'active' ? 'inactive' : 'active';
  db.prepare("UPDATE patients SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(newStatus, req.params.id);
  res.json({ message: `Patient marked as ${newStatus}`, status: newStatus });
});

module.exports = router;

