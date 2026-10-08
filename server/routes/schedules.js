const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Helper to convert "HH:MM" to minutes from midnight
function timeToMinutes(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// Helper to format minutes to "HH:MM"
function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// GET /api/schedules/doctor/:doctorId - Get weekly schedules & leaves
router.get('/doctor/:doctorId', authenticateToken, (req, res) => {
  const doctor = db.prepare('SELECT id, name, specialization, department FROM doctors WHERE id = ?').get(req.params.doctorId);
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
  `).all(req.params.doctorId);

  const leaves = db.prepare(`
    SELECT * FROM doctor_leaves
    WHERE doctor_id = ?
    ORDER BY leave_date ASC
  `).all(req.params.doctorId);

  res.json({
    doctor,
    schedules,
    leaves,
  });
});

// GET /api/schedules/doctor/:doctorId/available-slots?date=YYYY-MM-DD
// Returns exact available slots taking into account working hours, breaks, leaves, and booked appointments
router.get('/doctor/:doctorId/available-slots', authenticateToken, (req, res) => {
  const { date } = req.query;
  const doctorId = req.params.doctorId;

  if (!date) {
    return res.status(400).json({ error: 'Date query parameter is required (YYYY-MM-DD)' });
  }

  const doctor = db.prepare('SELECT * FROM doctors WHERE id = ?').get(doctorId);
  if (!doctor) {
    return res.status(404).json({ error: 'Doctor not found' });
  }

  // 1. Check if doctor is on leave
  const leave = db.prepare('SELECT * FROM doctor_leaves WHERE doctor_id = ? AND leave_date = ?').get(doctorId, date);
  if (leave) {
    return res.json({
      doctor,
      date,
      day_of_week: null,
      is_available: false,
      message: `Doctor ${doctor.name} is on leave on ${date} (${leave.reason || 'Personal leave'}).`,
      slots: [],
    });
  }

  // 2. Determine day of the week
  // Use date parts to avoid timezone shift
  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = DAYS[dateObj.getDay()];

  // 3. Get doctor's schedule for that day
  const schedule = db.prepare(`
    SELECT * FROM doctor_schedules
    WHERE doctor_id = ? AND day_of_week = ? AND is_active = 1
  `).get(doctorId, dayOfWeek);

  if (!schedule) {
    return res.json({
      doctor,
      date,
      day_of_week: dayOfWeek,
      is_available: false,
      message: `Doctor ${doctor.name} does not have scheduled hours on ${dayOfWeek}s.`,
      slots: [],
    });
  }

  // 4. Get existing booked appointments on this date
  const existingAppointments = db.prepare(`
    SELECT appointment_time, status, reason
    FROM appointments
    WHERE doctor_id = ? AND appointment_date = ? AND status != 'Cancelled'
  `).all(doctorId, date);

  const bookedTimes = new Set(existingAppointments.map(a => a.appointment_time));

  // 5. Generate time slots
  const startMin = timeToMinutes(schedule.start_time);
  const endMin = timeToMinutes(schedule.end_time);
  const step = schedule.slot_duration_minutes || 30;

  const breakStartMin = schedule.break_start ? timeToMinutes(schedule.break_start) : null;
  const breakEndMin = schedule.break_end ? timeToMinutes(schedule.break_end) : null;

  const slots = [];
  for (let current = startMin; current < endMin; current += step) {
    const timeStr = minutesToTime(current);

    // Check if slot falls inside break time
    const isBreak = breakStartMin !== null && breakEndMin !== null && (current >= breakStartMin && current < breakEndMin);
    const isBooked = bookedTimes.has(timeStr);

    let status = 'Available';
    let available = true;

    if (isBreak) {
      status = 'Break Time';
      available = false;
    } else if (isBooked) {
      status = 'Already Booked';
      available = false;
    }

    slots.push({
      time: timeStr,
      available,
      status,
    });
  }

  res.json({
    doctor,
    date,
    day_of_week: dayOfWeek,
    is_available: true,
    schedule,
    slots,
  });
});

// POST /api/schedules/doctor/:doctorId - Save / Update weekly schedule
router.post('/doctor/:doctorId', authenticateToken, authorizeRoles('admin', 'doctor'), (req, res) => {
  const { schedules } = req.body; // array of { day_of_week, start_time, end_time, slot_duration_minutes, break_start, break_end, is_active }
  const doctorId = req.params.doctorId;

  if (!Array.isArray(schedules)) {
    return res.status(400).json({ error: 'Schedules must be an array' });
  }

  const upsert = db.prepare(`
    INSERT INTO doctor_schedules (
      doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, break_start, break_end, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(doctor_id, day_of_week) DO UPDATE SET
      start_time = excluded.start_time,
      end_time = excluded.end_time,
      slot_duration_minutes = excluded.slot_duration_minutes,
      break_start = excluded.break_start,
      break_end = excluded.break_end,
      is_active = excluded.is_active
  `);

  const runBatch = db.transaction((rows) => {
    for (const row of rows) {
      upsert.run(
        doctorId,
        row.day_of_week,
        row.start_time || '09:00',
        row.end_time || '17:00',
        row.slot_duration_minutes || 30,
        row.break_start || '13:00',
        row.break_end || '14:00',
        row.is_active !== undefined ? (row.is_active ? 1 : 0) : 1
      );
    }
  });

  try {
    runBatch(schedules);
    const updated = db.prepare('SELECT * FROM doctor_schedules WHERE doctor_id = ?').all(doctorId);
    res.json({ message: 'Schedules updated successfully', schedules: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update schedule: ' + err.message });
  }
});

// POST /api/schedules/doctor/:doctorId/leaves - Add leave
router.post('/doctor/:doctorId/leaves', authenticateToken, authorizeRoles('admin', 'doctor'), (req, res) => {
  const { leave_date, reason } = req.body;
  const doctorId = req.params.doctorId;

  if (!leave_date) {
    return res.status(400).json({ error: 'leave_date is required (YYYY-MM-DD)' });
  }

  try {
    const insert = db.prepare(`
      INSERT INTO doctor_leaves (doctor_id, leave_date, reason)
      VALUES (?, ?, ?)
      ON CONFLICT(doctor_id, leave_date) DO UPDATE SET reason = excluded.reason
    `);
    insert.run(doctorId, leave_date, reason || 'Scheduled leave');

    const leaves = db.prepare('SELECT * FROM doctor_leaves WHERE doctor_id = ? ORDER BY leave_date ASC').all(doctorId);
    res.status(201).json({ message: 'Leave recorded successfully', leaves });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add leave: ' + err.message });
  }
});

// DELETE /api/schedules/leaves/:leaveId - Remove leave
router.delete('/leaves/:leaveId', authenticateToken, authorizeRoles('admin', 'doctor'), (req, res) => {
  try {
    db.prepare('DELETE FROM doctor_leaves WHERE id = ?').run(req.params.leaveId);
    res.json({ message: 'Leave deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove leave: ' + err.message });
  }
});

// GET /api/schedules/all - Summary of all doctor schedules
router.get('/all', authenticateToken, (req, res) => {
  const doctors = db.prepare('SELECT id, doctor_code, name, specialization, department, room_number, status FROM doctors WHERE status = "active"').all();
  const schedules = db.prepare('SELECT * FROM doctor_schedules WHERE is_active = 1').all();
  const leaves = db.prepare("SELECT * FROM doctor_leaves WHERE leave_date >= date('now') ORDER BY leave_date ASC").all();

  const result = doctors.map(doc => {
    return {
      ...doc,
      schedules: schedules.filter(s => s.doctor_id === doc.id),
      leaves: leaves.filter(l => l.doctor_id === doc.id),
    };
  });

  res.json(result);
});

module.exports = router;

