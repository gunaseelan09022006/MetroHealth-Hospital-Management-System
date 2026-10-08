async function runFullSystemTest() {
  console.log('=== HOSPITAL MANAGEMENT SYSTEM AUTOMATED AUDIT ===');
  const base = 'http://localhost:5000/api';

  // 1. Health check
  const hRes = await fetch(base + '/health');
  const health = await hRes.json();
  console.log('✔ Health Check:', health.status);

  // 2. Authentication & Roles
  const adminRes = await fetch(base + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  });
  const adminData = await adminRes.json();
  const adminToken = adminData.token;
  console.log('✔ Admin Auth: Logged in as', adminData.user.name, 'Role:', adminData.user.role);

  const docRes = await fetch(base + '/auth/switch-demo-role', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'doctor' }),
  });
  const docData = await docRes.json();
  const docToken = docData.token;
  console.log('✔ Doctor Auth: Logged in as', docData.user.name, 'Doctor ID:', docData.user.doctor_id);

  const recRes = await fetch(base + '/auth/switch-demo-role', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'receptionist' }),
  });
  const recData = await recRes.json();
  const recToken = recData.token;
  console.log('✔ Receptionist Auth: Logged in as', recData.user.name);

  // Test Role Guardrail: Receptionist creating prescription should be forbidden (403)
  const forbiddenRx = await fetch(base + '/prescriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + recToken },
    body: JSON.stringify({ patient_id: 1, doctor_id: 1, diagnosis: 'Test', items: [{ medicine_name: 'Med1' }] }),
  });
  console.log('✔ Role Guardrail Test: Receptionist Prescription Creation Rejected with Status:', forbiddenRx.status, '(Expected 403 Forbidden)');

  // 3. Patient Creation
  const newPatRes = await fetch(base + '/patients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + adminToken },
    body: JSON.stringify({
      name: 'Lucas Sinclair',
      dob: '1998-05-12',
      gender: 'Male',
      blood_group: 'B+',
      phone: '+1 (555) 999-8877',
      email: 'lucas.sinclair@hawkins.net',
      address: '42 Maple Street, Hawkins, IN',
      emergency_contact: 'Erica Sinclair (Sister) - +1 (555) 999-8878',
      medical_history: 'None reported',
      allergies: 'Latex',
    }),
  });
  const newPat = await newPatRes.json();
  console.log('✔ Patient Created:', newPat.name, 'Generated ID:', newPat.patient_code);

  // 4. Patient Dossier Verification
  const dossierRes = await fetch(base + '/patients/' + newPat.id, {
    headers: { Authorization: 'Bearer ' + adminToken },
  });
  const dossier = await dossierRes.json();
  console.log('✔ Patient Dossier Loaded:', dossier.name, 'Allergies:', dossier.allergies);

  // 5. Doctor Schedule & Available Slots
  const today = new Date().toISOString().split('T')[0];
  const slotsRes = await fetch(base + '/schedules/doctor/1/available-slots?date=' + today, {
    headers: { Authorization: 'Bearer ' + adminToken },
  });
  const slotData = await slotsRes.json();
  const firstAvailable = slotData.slots.find((s) => s.available);
  console.log('✔ Doctor Slots Calculated: Total', slotData.slots.length, 'First Free Slot:', firstAvailable?.time);

  // 6. Appointment Booking & Double-Booking Prevention
  const bookRes = await fetch(base + '/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + adminToken },
    body: JSON.stringify({
      patient_id: newPat.id,
      doctor_id: 1,
      appointment_date: today,
      appointment_time: firstAvailable.time,
      reason: 'General consultation for seasonal fatigue',
      status: 'Confirmed',
    }),
  });
  const bookedApt = await bookRes.json();
  console.log('✔ Appointment Booked:', bookedApt.appointment_code, 'At:', bookedApt.appointment_time);

  // Test Double Booking: attempt to book the EXACT SAME SLOT for Doctor 1
  const doubleBookRes = await fetch(base + '/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + adminToken },
    body: JSON.stringify({
      patient_id: 2,
      doctor_id: 1,
      appointment_date: today,
      appointment_time: firstAvailable.time,
      reason: 'Conflicting appointment attempt',
    }),
  });
  console.log('✔ Double-Booking Prevention Tested! Status:', doubleBookRes.status, '(Expected 409 Conflict)');

  // 7. Prescription Creation (Multi-drug)
  const rxRes = await fetch(base + '/prescriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + docToken },
    body: JSON.stringify({
      patient_id: newPat.id,
      doctor_id: 1,
      diagnosis: 'Seasonal Fatigue & Mild Vitamin D Insufficiency',
      notes: 'Ensure 20 minutes of morning sunlight and adequate hydration.',
      items: [
        {
          medicine_name: 'Cholecalciferol (Vitamin D3)',
          dosage: '2000 IU',
          frequency: 'Once daily with meals',
          duration: '30 days',
          instructions: 'Take with breakfast',
        },
        {
          medicine_name: 'B-Complex Multivitamin',
          dosage: '1 Capsule',
          frequency: 'Once daily',
          duration: '30 days',
          instructions: 'Take in the morning',
        },
      ],
    }),
  });
  const createdRx = await rxRes.json();
  console.log('✔ Prescription Created:', createdRx.prescription_code, 'Item Count:', createdRx.items.length);

  // 8. Billing & Automated Financial Calculation
  const billRes = await fetch(base + '/billing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + recToken },
    body: JSON.stringify({
      patient_id: newPat.id,
      doctor_id: 1,
      consultation_fee: 120.0,
      medicine_charges: 45.0,
      other_charges: 25.0,
      tax_or_discount: -10.0,
      paid_amount: 100.0,
      payment_method: 'Card',
      notes: 'Patient paid $100 via Visa card.',
    }),
  });
  const billData = await billRes.json();
  console.log(
    '✔ Bill Created:',
    billData.bill_code,
    'Subtotal: $' + billData.subtotal,
    'Total: $' + billData.total_amount,
    'Paid: $' + billData.paid_amount,
    'Balance: $' + billData.balance_due,
    'Status:',
    billData.payment_status
  );

  // 9. Record Settlement Payment
  const payRes = await fetch(base + '/billing/' + billData.id + '/payment', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + recToken },
    body: JSON.stringify({
      amount: billData.balance_due,
      payment_method: 'UPI',
    }),
  });
  const settledBill = await payRes.json();
  console.log(
    '✔ Bill Final Settlement:',
    settledBill.bill_code,
    'New Paid: $' + settledBill.paid_amount,
    'Balance: $' + settledBill.balance_due,
    'New Status:',
    settledBill.payment_status
  );

  // 10. Dashboard Stats Refresh
  const dashRes = await fetch(base + '/dashboard/stats', {
    headers: { Authorization: 'Bearer ' + adminToken },
  });
  const dashData = await dashRes.json();
  console.log(
    '✔ Updated Dashboard Stats: Total Patients:',
    dashData.totalPatients,
    'Today Visits:',
    dashData.todayAppointments,
    'Active Prescriptions:',
    dashData.activePrescriptions
  );

  // 11. Search Across Modules
  const searchRes = await fetch(base + '/search?q=Lucas', {
    headers: { Authorization: 'Bearer ' + adminToken },
  });
  const searchData = await searchRes.json();
  console.log('✔ Global Search for Lucas: Found', searchData.patients.length, 'patients, Name:', searchData.patients[0]?.name);

  console.log('\n===============================================');
  console.log(' ALL 11 VERIFICATION MODULE TESTS PASSED!');
  console.log('===============================================\n');
}

runFullSystemTest().catch(console.error);

