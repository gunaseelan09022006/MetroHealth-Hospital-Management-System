const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const validPassword = bcrypt.compareSync(password, user.password_hash);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  let doctorInfo = null;
  if (user.doctor_id) {
    doctorInfo = db.prepare('SELECT * FROM doctors WHERE id = ?').get(user.doctor_id);
  }

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone,
      doctor_id: user.doctor_id,
      doctor: doctorInfo,
    },
  });
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  let doctorInfo = null;
  if (req.user.doctor_id) {
    doctorInfo = db.prepare('SELECT * FROM doctors WHERE id = ?').get(req.user.doctor_id);
  }

  res.json({
    user: {
      ...req.user,
      doctor: doctorInfo,
    },
  });
});

// Quick demo role switch (enables testing Admin, Doctor, Receptionist in UI)
router.post('/switch-demo-role', (req, res) => {
  const { role } = req.body;
  if (!['admin', 'doctor', 'receptionist'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const user = db.prepare('SELECT * FROM users WHERE role = ? LIMIT 1').get(role);
  if (!user) {
    return res.status(404).json({ error: `Demo user for role ${role} not found` });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  let doctorInfo = null;
  if (user.doctor_id) {
    doctorInfo = db.prepare('SELECT * FROM doctors WHERE id = ?').get(user.doctor_id);
  }

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone,
      doctor_id: user.doctor_id,
      doctor: doctorInfo,
    },
  });
});

// GET /api/auth/users
router.get('/users', authenticateToken, (req, res) => {
  const users = db.prepare('SELECT id, username, role, name, email, phone, doctor_id, created_at FROM users').all();
  res.json(users);
});

module.exports = router;

