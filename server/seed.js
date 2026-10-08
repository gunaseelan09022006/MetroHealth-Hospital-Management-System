const bcrypt = require('bcryptjs');
const db = require('./config/db');

function getOffsetDate(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

function seedDatabase() {
  console.log('--- Starting Database Seeding ---');

  // Clear existing data safely
  db.exec(`
    DELETE FROM activity_logs;
    DELETE FROM prescription_items;
    DELETE FROM prescriptions;
    DELETE FROM bills;
    DELETE FROM appointments;
    DELETE FROM doctor_leaves;
    DELETE FROM doctor_schedules;
    DELETE FROM patients;
    DELETE FROM users;
    DELETE FROM doctors;
  `);

  console.log('Cleared existing tables.');

  // 1. Seed Doctors
  const doctorsData = [
    {
      doctor_code: 'DOC-101',
      name: 'Dr. Sarah Jenkins',
      specialization: 'Cardiologist',
      department: 'Cardiology',
      consultation_fee: 120.00,
      phone: '+1 (555) 234-5678',
      email: 'sjenkins@metrohealth.org',
      qualifications: 'MD, FACC, Harvard Medical School',
      room_number: 'Suite 302',
      status: 'active',
    },
    {
      doctor_code: 'DOC-102',
      name: 'Dr. Michael Chang',
      specialization: 'Neurologist',
      department: 'Neurology',
      consultation_fee: 140.00,
      phone: '+1 (555) 345-6789',
      email: 'mchang@metrohealth.org',
      qualifications: 'MD, PhD, Johns Hopkins Medicine',
      room_number: 'Suite 405',
      status: 'active',
    },
    {
      doctor_code: 'DOC-103',
      name: 'Dr. Emily Rodriguez',
      specialization: 'Pediatrician',
      department: 'Pediatrics',
      consultation_fee: 90.00,
      phone: '+1 (555) 456-7890',
      email: 'erodriguez@metrohealth.org',
      qualifications: 'MD, FAAP, Stanford University',
      room_number: 'Suite 108',
      status: 'active',
    },
    {
      doctor_code: 'DOC-104',
      name: 'Dr. James Wilson',
      specialization: 'Orthopedic Surgeon',
      department: 'Orthopedics',
      consultation_fee: 130.00,
      phone: '+1 (555) 567-8901',
      email: 'jwilson@metrohealth.org',
      qualifications: 'MS (Ortho), Mayo Clinic Fellow',
      room_number: 'Suite 210',
      status: 'active',
    },
    {
      doctor_code: 'DOC-105',
      name: 'Dr. Priya Sharma',
      specialization: 'General Physician',
      department: 'General Medicine',
      consultation_fee: 75.00,
      phone: '+1 (555) 678-9012',
      email: 'psharma@metrohealth.org',
      qualifications: 'MBBS, MD (Internal Medicine)',
      room_number: 'Suite 101',
      status: 'active',
    },
    {
      doctor_code: 'DOC-106',
      name: 'Dr. Robert Taylor',
      specialization: 'Dermatologist',
      department: 'Dermatology',
      consultation_fee: 95.00,
      phone: '+1 (555) 789-0123',
      email: 'rtaylor@metrohealth.org',
      qualifications: 'MD, American Academy of Dermatology',
      room_number: 'Suite 315',
      status: 'active',
    },
  ];

  const insertDoctor = db.prepare(`
    INSERT INTO doctors (doctor_code, name, specialization, department, consultation_fee, phone, email, qualifications, room_number, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const doctorIds = {};
  for (const doc of doctorsData) {
    const res = insertDoctor.run(
      doc.doctor_code,
      doc.name,
      doc.specialization,
      doc.department,
      doc.consultation_fee,
      doc.phone,
      doc.email,
      doc.qualifications,
      doc.room_number,
      doc.status
    );
    doctorIds[doc.doctor_code] = res.lastInsertRowid;
  }
  console.log('Seeded doctors successfully.');

  // 2. Seed Users (Admin, Doctor, Receptionist)
  const passwordHashAdmin = bcrypt.hashSync('admin123', 10);
  const passwordHashDoctor = bcrypt.hashSync('doctor123', 10);
  const passwordHashReception = bcrypt.hashSync('reception123', 10);

  const insertUser = db.prepare(`
    INSERT INTO users (username, password_hash, role, name, email, phone, doctor_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run('admin', passwordHashAdmin, 'admin', 'Hospital Administrator', 'admin@metrohealth.org', '+1 (555) 100-0001', null);
  insertUser.run('dr_sarah', passwordHashDoctor, 'doctor', 'Dr. Sarah Jenkins', 'sjenkins@metrohealth.org', '+1 (555) 234-5678', doctorIds['DOC-101']);
  insertUser.run('receptionist', passwordHashReception, 'receptionist', 'Mark Stevens', 'reception@metrohealth.org', '+1 (555) 100-0002', null);
  console.log('Seeded users (admin, dr_sarah, receptionist).');

  // 3. Seed Schedules for all doctors
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const insertSchedule = db.prepare(`
    INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, break_start, break_end, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `);

  for (const docId of Object.values(doctorIds)) {
    for (const day of daysOfWeek) {
      insertSchedule.run(docId, day, '09:00', '17:00', 30, '13:00', '14:00');
    }
    // Saturday morning shift for General Medicine & Pediatrics
    if (docId === doctorIds['DOC-103'] || docId === doctorIds['DOC-105']) {
      insertSchedule.run(docId, 'Saturday', '09:00', '13:00', 30, null, null);
    }
  }

  // Doctor Leave example (DOC-104 on leave next week)
  db.prepare(`
    INSERT INTO doctor_leaves (doctor_id, leave_date, reason)
    VALUES (?, ?, ?)
  `).run(doctorIds['DOC-104'], getOffsetDate(5), 'National Orthopedic Conference');

  console.log('Seeded doctor schedules & leaves.');

  // 4. Seed Patients
  const patientsData = [
    {
      patient_code: 'PAT-1001',
      name: 'Eleanor Vance',
      dob: '1984-06-15',
      gender: 'Female',
      blood_group: 'A+',
      phone: '+1 (555) 301-8912',
      email: 'eleanor.vance@gmail.com',
      address: '742 Evergreen Terrace, Springfield',
      emergency_contact: 'Peter Vance (Spouse) - +1 (555) 301-8913',
      medical_history: 'Mild hypertension diagnosed in 2021. Managed with lifestyle and ACE inhibitors.',
      allergies: 'Penicillin, Shellfish',
    },
    {
      patient_code: 'PAT-1002',
      name: 'Robert Downey',
      dob: '1975-03-22',
      gender: 'Male',
      blood_group: 'O+',
      phone: '+1 (555) 412-9844',
      email: 'rdowney.actor@mail.com',
      address: '10880 Wilshire Blvd, Los Angeles, CA',
      emergency_contact: 'Susan Downey - +1 (555) 412-9845',
      medical_history: 'Prior right knee arthroscopy in 2018.',
      allergies: 'None reported',
    },
    {
      patient_code: 'PAT-1003',
      name: 'Sophia Loren',
      dob: '1962-09-20',
      gender: 'Female',
      blood_group: 'B+',
      phone: '+1 (555) 523-7711',
      email: 'sloren@italia.net',
      address: '45 Villa Way, Beverly Hills, CA',
      emergency_contact: 'Carlo Ponti - +1 (555) 523-7712',
      medical_history: 'Type 2 Diabetes Mellitus, Osteoarthritis.',
      allergies: 'Sulfa antibiotics',
    },
    {
      patient_code: 'PAT-1004',
      name: 'Marcus Aurelius',
      dob: '1990-04-26',
      gender: 'Male',
      blood_group: 'AB+',
      phone: '+1 (555) 634-1122',
      email: 'marcus.philosopher@stoic.org',
      address: '12 Palatine Hill Rd, Rome District',
      emergency_contact: 'Faustina - +1 (555) 634-1123',
      medical_history: 'Occasional migraine headaches, allergic rhinitis.',
      allergies: 'Dust mites, Aspirin',
    },
    {
      patient_code: 'PAT-1005',
      name: 'Maya Angelou',
      dob: '1995-11-04',
      gender: 'Female',
      blood_group: 'O-',
      phone: '+1 (555) 745-3344',
      email: 'maya.writes@poetry.io',
      address: '88 Caged Bird Ave, St. Louis, MO',
      emergency_contact: 'Guy Johnson - +1 (555) 745-3345',
      medical_history: 'Asthma in childhood, no recent flareups.',
      allergies: 'None reported',
    },
    {
      patient_code: 'PAT-1006',
      name: 'David Kim',
      dob: '2001-08-14',
      gender: 'Male',
      blood_group: 'A-',
      phone: '+1 (555) 856-5566',
      email: 'dkim.tech@stanford.edu',
      address: '220 Palo Alto Dr, San Jose, CA',
      emergency_contact: 'Hannah Kim (Mother) - +1 (555) 856-5567',
      medical_history: 'Sports injury: fractured clavicle 2022 (healed).',
      allergies: 'Ibuprofen',
    },
    {
      patient_code: 'PAT-1007',
      name: 'Isabella Garcia',
      dob: '2018-05-10',
      gender: 'Female',
      blood_group: 'B-',
      phone: '+1 (555) 967-7788',
      email: 'garcia.family@homemail.com',
      address: '14 Sunburst Lane, Miami, FL',
      emergency_contact: 'Mateo Garcia (Father) - +1 (555) 967-7789',
      medical_history: 'Standard pediatric immunizations up to date.',
      allergies: 'Peanuts',
    },
    {
      patient_code: 'PAT-1008',
      name: 'Thomas Shelby',
      dob: '1979-12-08',
      gender: 'Male',
      blood_group: 'AB-',
      phone: '+1 (555) 178-9900',
      email: 'tshelby@peakyholdings.co.uk',
      address: '6 Garrison Lane, Small Heath, Birmingham',
      emergency_contact: 'Ada Thorne (Sister) - +1 (555) 178-9901',
      medical_history: 'Chronic bronchitis, mild stress tachycardia.',
      allergies: 'Codeine',
    },
  ];

  const insertPatient = db.prepare(`
    INSERT INTO patients (patient_code, name, dob, gender, blood_group, phone, email, address, emergency_contact, medical_history, allergies, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `);

  const patientIds = {};
  for (const p of patientsData) {
    const res = insertPatient.run(
      p.patient_code,
      p.name,
      p.dob,
      p.gender,
      p.blood_group,
      p.phone,
      p.email,
      p.address,
      p.emergency_contact,
      p.medical_history,
      p.allergies
    );
    patientIds[p.patient_code] = res.lastInsertRowid;
  }
  console.log('Seeded patients successfully.');

  // 5. Seed Appointments
  const todayStr = getOffsetDate(0);
  const tomorrowStr = getOffsetDate(1);
  const next2DaysStr = getOffsetDate(2);
  const past3DaysStr = getOffsetDate(-3);
  const past10DaysStr = getOffsetDate(-10);

  const appointmentsData = [
    // Today's appointments
    {
      code: 'APT-2026-1001',
      patient_id: patientIds['PAT-1001'],
      doctor_id: doctorIds['DOC-101'],
      date: todayStr,
      time: '09:30',
      reason: 'Routine quarterly cardiac checkup and BP review',
      status: 'Confirmed',
      notes: 'Patient noted slight evening ankle swelling.',
    },
    {
      code: 'APT-2026-1002',
      patient_id: patientIds['PAT-1002'],
      doctor_id: doctorIds['DOC-104'],
      date: todayStr,
      time: '11:00',
      reason: 'Follow-up for right knee stiffness after workout',
      status: 'Scheduled',
      notes: 'Bring previous MRI scans if available.',
    },
    {
      code: 'APT-2026-1003',
      patient_id: patientIds['PAT-1007'],
      doctor_id: doctorIds['DOC-103'],
      date: todayStr,
      time: '14:30',
      reason: 'Childhood seasonal fever and rash examination',
      status: 'Scheduled',
      notes: 'Parent reports temperature reached 100.4 F yesterday.',
    },
    {
      code: 'APT-2026-1004',
      patient_id: patientIds['PAT-1005'],
      doctor_id: doctorIds['DOC-105'],
      date: todayStr,
      time: '10:00',
      reason: 'General wellness check and routine blood work',
      status: 'Completed',
      notes: 'Routine complete metabolic panel ordered.',
    },
    // Upcoming appointments
    {
      code: 'APT-2026-1005',
      patient_id: patientIds['PAT-1003'],
      doctor_id: doctorIds['DOC-102'],
      date: tomorrowStr,
      time: '10:30',
      reason: 'Neurological evaluation for numbness in fingers',
      status: 'Confirmed',
      notes: 'Review nerve conduction study.',
    },
    {
      code: 'APT-2026-1006',
      patient_id: patientIds['PAT-1006'],
      doctor_id: doctorIds['DOC-106'],
      date: next2DaysStr,
      time: '15:00',
      reason: 'Persistent skin eczema flareup on forearms',
      status: 'Scheduled',
      notes: 'Previous topical hydrocortisone provided minimal relief.',
    },
    // Past appointments
    {
      code: 'APT-2026-0980',
      patient_id: patientIds['PAT-1004'],
      doctor_id: doctorIds['DOC-105'],
      date: past3DaysStr,
      time: '11:30',
      reason: 'Acute sinus headache and congestion',
      status: 'Completed',
      notes: 'Diagnosed with bacterial sinusitis. Antibiotic prescribed.',
    },
    {
      code: 'APT-2026-0975',
      patient_id: patientIds['PAT-1008'],
      doctor_id: doctorIds['DOC-101'],
      date: past10DaysStr,
      time: '14:00',
      reason: 'Palpitations after excessive espresso consumption',
      status: 'Completed',
      notes: 'ECG normal sinus rhythm. Advised caffeine reduction.',
    },
    {
      code: 'APT-2026-0970',
      patient_id: patientIds['PAT-1001'],
      doctor_id: doctorIds['DOC-105'],
      date: past10DaysStr,
      time: '09:00',
      reason: 'Rescheduled appointment',
      status: 'Cancelled',
      notes: 'Patient cancelled due to travel schedule.',
    },
  ];

  const insertApt = db.prepare(`
    INSERT INTO appointments (appointment_code, patient_id, doctor_id, appointment_date, appointment_time, reason, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const aptIds = {};
  for (const a of appointmentsData) {
    const res = insertApt.run(a.code, a.patient_id, a.doctor_id, a.date, a.time, a.reason, a.status, a.notes);
    aptIds[a.code] = res.lastInsertRowid;
  }
  console.log('Seeded appointments.');

  // 6. Seed Prescriptions with multiple medicine items
  const insertPrescription = db.prepare(`
    INSERT INTO prescriptions (prescription_code, appointment_id, patient_id, doctor_id, prescription_date, diagnosis, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertRxItem = db.prepare(`
    INSERT INTO prescription_items (prescription_id, medicine_name, dosage, frequency, duration, instructions)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Rx 1: Eleanor Vance - Cardiology
  const rx1 = insertPrescription.run(
    'RX-2026-1001',
    aptIds['APT-2026-1001'],
    patientIds['PAT-1001'],
    doctorIds['DOC-101'],
    todayStr,
    'Essential Primary Hypertension (Stage 1)',
    'Active',
    'Follow up in 4 weeks. Maintain low-sodium diet and monitor BP daily.'
  );
  insertRxItem.run(rx1.lastInsertRowid, 'Amlodipine Besylate', '5 mg', 'Once daily (morning)', '30 days', 'Take with or without food in the morning');
  insertRxItem.run(rx1.lastInsertRowid, 'Hydrochlorothiazide', '12.5 mg', 'Once daily (morning)', '30 days', 'Drink plenty of water throughout the day');
  insertRxItem.run(rx1.lastInsertRowid, 'Omega-3 Fish Oil', '1000 mg', 'Twice daily', '60 days', 'Take with substantial meals');

  // Rx 2: Marcus Aurelius - Acute Sinusitis
  const rx2 = insertPrescription.run(
    'RX-2026-0980',
    aptIds['APT-2026-0980'],
    patientIds['PAT-1004'],
    doctorIds['DOC-105'],
    past3DaysStr,
    'Acute Maxillary Sinusitis with congestion',
    'Active',
    'Avoid cold drinks, use warm saline steam inhalation twice daily.'
  );
  insertRxItem.run(rx2.lastInsertRowid, 'Azithromycin (Z-Pak)', '500 mg Day 1, then 250 mg', 'Once daily', '5 days', 'Take on empty stomach 1 hour before meal');
  insertRxItem.run(rx2.lastInsertRowid, 'Fluticasone Propionate Nasal Spray', '50 mcg/spray', '2 sprays per nostril once daily', '14 days', 'Blow nose gently before administering');
  insertRxItem.run(rx2.lastInsertRowid, 'Acetaminophen', '500 mg', 'Every 6 hours as needed', '5 days', 'Do not exceed 3000 mg per 24 hours');

  // Rx 3: Sophia Loren - Diabetes & Osteoarthritis
  const rx3 = insertPrescription.run(
    'RX-2026-0960',
    null,
    patientIds['PAT-1003'],
    doctorIds['DOC-105'],
    past10DaysStr,
    'Type 2 Diabetes Mellitus & Knee Osteoarthritis',
    'Active',
    'Quarterly HbA1c check scheduled. Gentle joint mobility exercises.'
  );
  insertRxItem.run(rx3.lastInsertRowid, 'Metformin Extended Release', '500 mg', 'Twice daily with meals', '90 days', 'Take with dinner and breakfast');
  insertRxItem.run(rx3.lastInsertRowid, 'Glucosamine Chondroitin Complex', '1500 mg', 'Once daily', '90 days', 'Take with water');
  insertRxItem.run(rx3.lastInsertRowid, 'Vitamin D3 (Cholecalciferol)', '60,000 IU', 'Once weekly', '8 weeks', 'Take with milk or fatty meal');

  console.log('Seeded prescriptions and medicine items.');

  // 7. Seed Bills & Invoices
  const insertBill = db.prepare(`
    INSERT INTO bills (
      bill_code, patient_id, doctor_id, appointment_id,
      consultation_fee, medicine_charges, other_charges, subtotal,
      tax_or_discount, total_amount, payment_status, payment_method,
      paid_amount, balance_due, bill_date, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Bill 1: Paid by Eleanor Vance
  insertBill.run(
    'INV-2026-1001',
    patientIds['PAT-1001'],
    doctorIds['DOC-101'],
    aptIds['APT-2026-1001'],
    120.00,
    45.00,
    15.00, // ECG recording
    180.00,
    0.00,
    180.00,
    'Paid',
    'Card',
    180.00,
    0.00,
    todayStr,
    'Settled via Visa credit card terminal at checkout.'
  );

  // Bill 2: Partially Paid by Marcus Aurelius
  insertBill.run(
    'INV-2026-1002',
    patientIds['PAT-1004'],
    doctorIds['DOC-105'],
    aptIds['APT-2026-0980'],
    75.00,
    38.00,
    20.00, // Rapid sinus swab test
    133.00,
    0.00,
    133.00,
    'Partially Paid',
    'UPI',
    100.00,
    33.00,
    past3DaysStr,
    'Advance payment of $100 received via UPI. $33 balance pending.'
  );

  // Bill 3: Pending Bill for Robert Downey
  insertBill.run(
    'INV-2026-1003',
    patientIds['PAT-1002'],
    doctorIds['DOC-104'],
    aptIds['APT-2026-1002'],
    130.00,
    0.00,
    50.00, // Knee mobility evaluation kit
    180.00,
    -10.00, // Clinic discount
    170.00,
    'Pending',
    'Cash',
    0.00,
    170.00,
    todayStr,
    'Invoice generated upon registration; payment pending consultation.'
  );

  // Bill 4: Paid by Maya Angelou
  insertBill.run(
    'INV-2026-1004',
    patientIds['PAT-1005'],
    doctorIds['DOC-105'],
    aptIds['APT-2026-1004'],
    75.00,
    15.00,
    40.00, // Complete Metabolic Panel lab draw
    130.00,
    0.00,
    130.00,
    'Paid',
    'UPI',
    130.00,
    0.00,
    todayStr,
    'Paid in full via Google Pay / UPI.'
  );

  // Bill 5: Paid by Thomas Shelby
  insertBill.run(
    'INV-2026-0975',
    patientIds['PAT-1008'],
    doctorIds['DOC-101'],
    aptIds['APT-2026-0975'],
    120.00,
    25.00,
    60.00, // 12-lead ECG analysis
    205.00,
    0.00,
    205.00,
    'Paid',
    'Cash',
    205.00,
    0.00,
    past10DaysStr,
    'Payment received in cash at front desk.'
  );

  console.log('Seeded billing invoices and payments.');
  console.log('--- Database Seeding Completed Successfully! ---');
}

seedDatabase();

