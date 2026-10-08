const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

function generateBillCode() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const lastRow = db.prepare('SELECT id FROM bills ORDER BY id DESC LIMIT 1').get();
  const nextNum = (lastRow ? lastRow.id : 0) + 1;
  return `INV-${dateStr}-${String(nextNum).padStart(4, '0')}`;
}

// GET /api/billing - List bills
router.get('/', authenticateToken, (req, res) => {
  const { patient_id, doctor_id, payment_status, payment_method, date, search } = req.query;

  let query = `
    SELECT b.*,
           p.name AS patient_name, p.patient_code, p.phone AS patient_phone,
           d.name AS doctor_name, d.doctor_code, d.specialization, d.department
    FROM bills b
    JOIN patients p ON b.patient_id = p.id
    JOIN doctors d ON b.doctor_id = d.id
    WHERE 1=1
  `;
  const params = [];

  if (patient_id) {
    query += ' AND b.patient_id = ?';
    params.push(patient_id);
  }

  if (doctor_id) {
    query += ' AND b.doctor_id = ?';
    params.push(doctor_id);
  }

  if (payment_status && payment_status !== 'all') {
    query += ' AND b.payment_status = ?';
    params.push(payment_status);
  }

  if (payment_method && payment_method !== 'all') {
    query += ' AND b.payment_method = ?';
    params.push(payment_method);
  }

  if (date) {
    query += ' AND b.bill_date = ?';
    params.push(date);
  }

  if (search) {
    query += ' AND (b.bill_code LIKE ? OR p.name LIKE ? OR p.patient_code LIKE ? OR d.name LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  query += ' ORDER BY b.bill_date DESC, b.id DESC';

  const bills = db.prepare(query).all(...params);

  // Calculate summary aggregates
  const summary = db.prepare(`
    SELECT
      COUNT(*) AS total_invoices,
      COALESCE(SUM(total_amount), 0) AS total_billed,
      COALESCE(SUM(paid_amount), 0) AS total_collected,
      COALESCE(SUM(balance_due), 0) AS total_pending
    FROM bills
  `).get();

  res.json({ bills, summary });
});

// GET /api/billing/:id - Full invoice details for printable view
router.get('/:id', authenticateToken, (req, res) => {
  const bill = db.prepare(`
    SELECT b.*,
           p.name AS patient_name, p.patient_code, p.dob AS patient_dob, p.gender AS patient_gender,
           p.phone AS patient_phone, p.email AS patient_email, p.address AS patient_address,
           d.name AS doctor_name, d.doctor_code, d.specialization, d.department, d.room_number,
           a.appointment_code, a.appointment_date, a.reason AS appointment_reason
    FROM bills b
    JOIN patients p ON b.patient_id = p.id
    JOIN doctors d ON b.doctor_id = d.id
    LEFT JOIN appointments a ON b.appointment_id = a.id
    WHERE b.id = ?
  `).get(req.params.id);

  if (!bill) {
    return res.status(404).json({ error: 'Bill invoice not found' });
  }

  res.json(bill);
});

// POST /api/billing - Create new bill with automated calculations
router.post('/', authenticateToken, authorizeRoles('admin', 'receptionist'), (req, res) => {
  const {
    patient_id,
    doctor_id,
    appointment_id,
    consultation_fee = 0,
    medicine_charges = 0,
    other_charges = 0,
    tax_or_discount = 0,
    payment_method = 'Cash',
    paid_amount = 0,
    bill_date = new Date().toISOString().split('T')[0],
    notes,
  } = req.body;

  if (!patient_id || !doctor_id) {
    return res.status(400).json({ error: 'Patient and Doctor are required' });
  }

  const cFee = parseFloat(consultation_fee) || 0;
  const mCharges = parseFloat(medicine_charges) || 0;
  const oCharges = parseFloat(other_charges) || 0;
  const tAdjustment = parseFloat(tax_or_discount) || 0;
  const pAmount = parseFloat(paid_amount) || 0;

  // Automated financial calculation
  const subtotal = cFee + mCharges + oCharges;
  const total_amount = Math.max(0, subtotal + tAdjustment);
  const balance_due = Math.max(0, total_amount - pAmount);

  let payment_status = 'Pending';
  if (pAmount >= total_amount && total_amount > 0) {
    payment_status = 'Paid';
  } else if (pAmount > 0 && pAmount < total_amount) {
    payment_status = 'Partially Paid';
  }

  const bill_code = generateBillCode();

  try {
    const insert = db.prepare(`
      INSERT INTO bills (
        bill_code, patient_id, doctor_id, appointment_id,
        consultation_fee, medicine_charges, other_charges, subtotal,
        tax_or_discount, total_amount, payment_status, payment_method,
        paid_amount, balance_due, bill_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      bill_code,
      patient_id,
      doctor_id,
      appointment_id || null,
      cFee,
      mCharges,
      oCharges,
      subtotal,
      tAdjustment,
      total_amount,
      payment_status,
      payment_method,
      pAmount,
      balance_due,
      bill_date,
      notes ? notes.trim() : null
    );

    const created = db.prepare(`
      SELECT b.*,
             p.name AS patient_name, p.patient_code,
             d.name AS doctor_name, d.specialization
      FROM bills b
      JOIN patients p ON b.patient_id = p.id
      JOIN doctors d ON b.doctor_id = d.id
      WHERE b.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create bill: ' + err.message });
  }
});

// PUT /api/billing/:id/payment - Record payment
router.put('/:id/payment', authenticateToken, authorizeRoles('admin', 'receptionist'), (req, res) => {
  const { amount, payment_method } = req.body;
  const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(req.params.id);

  if (!bill) {
    return res.status(404).json({ error: 'Bill invoice not found' });
  }

  const paymentAdd = parseFloat(amount) || 0;
  if (paymentAdd <= 0) {
    return res.status(400).json({ error: 'Payment amount must be greater than 0' });
  }

  const newPaidAmount = Math.min(bill.total_amount, bill.paid_amount + paymentAdd);
  const newBalanceDue = Math.max(0, bill.total_amount - newPaidAmount);

  let newStatus = 'Partially Paid';
  if (newBalanceDue === 0) {
    newStatus = 'Paid';
  }

  try {
    db.prepare(`
      UPDATE bills
      SET paid_amount = ?, balance_due = ?, payment_status = ?,
          payment_method = COALESCE(?, payment_method), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      newPaidAmount,
      newBalanceDue,
      newStatus,
      payment_method || bill.payment_method,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM bills WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to record payment: ' + err.message });
  }
});

// DELETE /api/billing/:id
router.delete('/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
  db.prepare('DELETE FROM bills WHERE id = ?').run(req.params.id);
  res.json({ message: 'Bill invoice deleted successfully' });
});

module.exports = router;

