const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

function generateDoctorCode() {
  const lastDoc = db.prepare('SELECT id FROM doctors ORDER BY id DESC LIMIT 1').get();
  const nextNum = (lastDoc ? lastDoc.id : 0) + 1;
  return `DOC-${String(nextNum).padStart(3, '0')}`;
}

// GET /api/doctors - List doctors with filters
router.get('/', authenticateToken, (req, res) => {
  const { department, status, search } = req.query;

  let query = 'SELECT * FROM doctors WHERE 1=1';
  const params = [];

  if (department) {
    query += ' AND department = ?';
    params.push(department);
  }

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (search) {
    query += ' AND (name LIKE ? OR specialization LIKE ? OR department LIKE ? OR doctor_code LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  query += ' ORDER BY name ASC';

  const doctors = db.prepare(query).all(...params);
  res.json(doctors);
});

// GET /api/doctors/departments - List distinct departments
router.get('/departments', authenticateToken, (req, res) => {
  const departments = db.prepare('SELECT DISTINCT department FROM doctors ORDER BY department ASC').all();
  res.json(departments.map(d => d.department));
});

// GET /api/doctors/:id - Doctor details with schedules and leaves
router.get('/:id', authenticateToken, (req, res) => {
  const doctor = db.prepare('SELECT * FROM doctors WHERE id = ?').get(req.params.id);
  if (!doctor) {
    return res.status(404).json({ error: 'Doctor not found' });
  }

  const schedules = db.prepare(`
    SELECT * FROM doctor_schedules
    WHERE doctor_id = ?
    ORDER BY CASE day_of_week
      WHEN 'Monday' THEN 1
      WHEN 'Tuesday' THEN 2
      WHEN 'Wednesday' THEN 3
      WHEN 'Thursday' THEN 4
      WHEN 'Friday' THEN 5
      WHEN 'Saturday' THEN 6
      WHEN 'Sunday' THEN 7
    END
  `).all(req.params.id);

  const leaves = db.prepare(`
    SELECT * FROM doctor_leaves
    WHERE doctor_id = ?
    ORDER BY leave_date ASC
  `).all(req.params.id);

  const appointmentStats = db.prepare(`
    SELECT
      COUNT(*) AS total_appointments,
      SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed_appointments,
      SUM(CASE WHEN appointment_date = date('now') THEN 1 ELSE 0 END) AS today_appointments
    FROM appointments
    WHERE doctor_id = ?
  `).get(req.params.id);

  res.json({
    ...doctor,
    schedules,
    leaves,
    stats: appointmentStats,
  });
});

// POST /api/doctors - Create new doctor
router.post('/', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const {
    name,
    specialization,
    department,
    consultation_fee,
    phone,
    email,
    qualifications,
    room_number,
    status = 'active',
  } = req.body;

  if (!name || !specialization || !department || !consultation_fee || !phone || !email) {
    return res.status(400).json({ error: 'All primary doctor fields are required' });
  }

  const doctor_code = generateDoctorCode();

  try {
    const insert = db.prepare(`
      INSERT INTO doctors (
        doctor_code, name, specialization, department, consultation_fee,
        phone, email, qualifications, room_number, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      doctor_code,
      name.trim(),
      specialization.trim(),
      department.trim(),
      parseFloat(consultation_fee),
      phone.trim(),
      email.trim(),
      qualifications ? qualifications.trim() : null,
      room_number ? room_number.trim() : null,
      status
    );

    // Also populate default schedule for weekdays (Mon-Fri 09:00 - 17:00)
    const doctorId = result.lastInsertRowid;
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const insertSchedule = db.prepare(`
      INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, break_start, break_end, is_active)
      VALUES (?, ?, '09:00', '17:00', 30, '13:00', '14:00', 1)
    `);

    for (const day of days) {
      insertSchedule.run(doctorId, day);
    }

    const created = db.prepare('SELECT * FROM doctors WHERE id = ?').get(doctorId);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create doctor: ' + err.message });
  }
});

// PUT /api/doctors/:id - Update doctor
router.put('/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const {
    name,
    specialization,
    department,
    consultation_fee,
    phone,
    email,
    qualifications,
    room_number,
    status,
  } = req.body;

  const existing = db.prepare('SELECT * FROM doctors WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Doctor not found' });
  }

  try {
    db.prepare(`
      UPDATE doctors
      SET name = ?, specialization = ?, department = ?, consultation_fee = ?,
          phone = ?, email = ?, qualifications = ?, room_number = ?, status = ?
      WHERE id = ?
    `).run(
      name || existing.name,
      specialization || existing.specialization,
      department || existing.department,
      consultation_fee !== undefined ? parseFloat(consultation_fee) : existing.consultation_fee,
      phone || existing.phone,
      email || existing.email,
      qualifications !== undefined ? qualifications : existing.qualifications,
      room_number !== undefined ? room_number : existing.room_number,
      status || existing.status,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM doctors WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update doctor: ' + err.message });
  }
});

// DELETE /api/doctors/:id
router.delete('/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const existing = db.prepare('SELECT * FROM doctors WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Doctor not found' });
  }

  db.prepare("UPDATE doctors SET status = 'inactive' WHERE id = ?").run(req.params.id);
  res.json({ message: 'Doctor marked as inactive' });
});

module.exports = router;

