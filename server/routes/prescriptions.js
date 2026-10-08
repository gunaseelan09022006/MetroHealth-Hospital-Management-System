const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

function generatePrescriptionCode() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const lastRow = db.prepare('SELECT id FROM prescriptions ORDER BY id DESC LIMIT 1').get();
  const nextNum = (lastRow ? lastRow.id : 0) + 1;
  return `RX-${dateStr}-${String(nextNum).padStart(4, '0')}`;
}

// GET /api/prescriptions - List prescriptions
router.get('/', authenticateToken, (req, res) => {
  const { patient_id, doctor_id, status, search } = req.query;

  let query = `
    SELECT p.*,
           pt.name AS patient_name, pt.patient_code, pt.dob AS patient_dob, pt.gender AS patient_gender,
           d.name AS doctor_name, d.doctor_code, d.specialization, d.department,
           (SELECT COUNT(*) FROM prescription_items WHERE prescription_id = p.id) AS item_count
    FROM prescriptions p
    JOIN patients pt ON p.patient_id = pt.id
    JOIN doctors d ON p.doctor_id = d.id
    WHERE 1=1
  `;
  const params = [];

  if (patient_id) {
    query += ' AND p.patient_id = ?';
    params.push(patient_id);
  }

  if (doctor_id) {
    query += ' AND p.doctor_id = ?';
    params.push(doctor_id);
  }

  if (status && status !== 'all') {
    query += ' AND p.status = ?';
    params.push(status);
  }

  if (search) {
    query += ' AND (pt.name LIKE ? OR pt.patient_code LIKE ? OR d.name LIKE ? OR p.diagnosis LIKE ? OR p.prescription_code LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s, s);
  }

  query += ' ORDER BY p.prescription_date DESC, p.id DESC';

  const prescriptions = db.prepare(query).all(...params);
  res.json(prescriptions);
});

// GET /api/prescriptions/:id - Single prescription with items & full patient/doctor data for printing
router.get('/:id', authenticateToken, (req, res) => {
  const prescription = db.prepare(`
    SELECT p.*,
           pt.name AS patient_name, pt.patient_code, pt.dob AS patient_dob, pt.gender AS patient_gender, pt.blood_group, pt.phone AS patient_phone, pt.allergies,
           d.name AS doctor_name, d.doctor_code, d.specialization, d.department, d.room_number, d.phone AS doctor_phone, d.qualifications
    FROM prescriptions p
    JOIN patients pt ON p.patient_id = pt.id
    JOIN doctors d ON p.doctor_id = d.id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!prescription) {
    return res.status(404).json({ error: 'Prescription not found' });
  }

  const items = db.prepare('SELECT * FROM prescription_items WHERE prescription_id = ? ORDER BY id ASC').all(req.params.id);

  res.json({
    ...prescription,
    items,
  });
});

// POST /api/prescriptions - Create prescription with multiple medicine items
router.post('/', authenticateToken, authorizeRoles('admin', 'doctor'), (req, res) => {
  const {
    patient_id,
    doctor_id,
    appointment_id,
    prescription_date = new Date().toISOString().split('T')[0],
    diagnosis,
    status = 'Active',
    notes,
    items = [], // Array of { medicine_name, dosage, frequency, duration, instructions }
  } = req.body;

  if (!patient_id || !doctor_id || !diagnosis) {
    return res.status(400).json({ error: 'Patient, Doctor, and Diagnosis are required' });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'At least one medicine item is required' });
  }

  // Doctor check: if user is doctor, ensure they can only prescribe under their doctor_id (or admin)
  let effectiveDoctorId = doctor_id;
  if (req.user.role === 'doctor' && req.user.doctor_id) {
    effectiveDoctorId = req.user.doctor_id;
  }

  const prescription_code = generatePrescriptionCode();

  const insertTx = db.transaction(() => {
    const rxInsert = db.prepare(`
      INSERT INTO prescriptions (
        prescription_code, appointment_id, patient_id, doctor_id, prescription_date, diagnosis, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const rxResult = rxInsert.run(
      prescription_code,
      appointment_id || null,
      patient_id,
      effectiveDoctorId,
      prescription_date,
      diagnosis.trim(),
      status,
      notes ? notes.trim() : null
    );

    const prescriptionId = rxResult.lastInsertRowid;

    const itemInsert = db.prepare(`
      INSERT INTO prescription_items (
        prescription_id, medicine_name, dosage, frequency, duration, instructions
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const item of items) {
      if (item.medicine_name && item.medicine_name.trim()) {
        itemInsert.run(
          prescriptionId,
          item.medicine_name.trim(),
          item.dosage || 'Standard dose',
          item.frequency || 'Once daily',
          item.duration || '5 days',
          item.instructions || 'As advised'
        );
      }
    }

    return prescriptionId;
  });

  try {
    const prescriptionId = insertTx();
    const created = db.prepare('SELECT * FROM prescriptions WHERE id = ?').get(prescriptionId);
    const createdItems = db.prepare('SELECT * FROM prescription_items WHERE prescription_id = ?').all(prescriptionId);

    res.status(201).json({
      ...created,
      items: createdItems,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create prescription: ' + err.message });
  }
});

// PUT /api/prescriptions/:id/status - Update prescription status
router.put('/:id/status', authenticateToken, authorizeRoles('admin', 'doctor'), (req, res) => {
  const { status } = req.body;
  if (!['Active', 'Completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  db.prepare('UPDATE prescriptions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);
  const updated = db.prepare('SELECT * FROM prescriptions WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/prescriptions/:id
router.delete('/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
  db.prepare('DELETE FROM prescriptions WHERE id = ?').run(req.params.id);
  res.json({ message: 'Prescription deleted successfully' });
});

module.exports = router;

