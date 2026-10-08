import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, FileText, CheckCircle2, User, Stethoscope, Loader2 } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function PrescriptionModal({ isOpen, onClose, preselectedPatientId = null, onCreated }) {
  const { user, addToast } = useAuth();

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [prescriptionDate, setPrescriptionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [diagnosis, setDiagnosis] = useState('');
  const [status, setStatus] = useState('Active');
  const [notes, setNotes] = useState('');

  // Medicines list
  const [items, setItems] = useState([
    { medicine_name: '', dosage: '500mg', frequency: 'Twice daily', duration: '5 days', instructions: 'Take after meals' }
  ]);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    async function loadData() {
      try {
        const [patientsRes, doctorsRes] = await Promise.all([
          api.patients.getAll({ status: 'active' }),
          api.doctors.getAll({ status: 'active' }),
        ]);

        setPatients(patientsRes);
        setDoctors(doctorsRes);

        if (preselectedPatientId) {
          setPatientId(preselectedPatientId.toString());
        } else if (patientsRes.length > 0) {
          setPatientId(patientsRes[0].id.toString());
        }

        // If user is a doctor, lock to their doctor_id
        if (user?.role === 'doctor' && user?.doctor_id) {
          setDoctorId(user.doctor_id.toString());
        } else if (doctorsRes.length > 0) {
          setDoctorId(doctorsRes[0].id.toString());
        }
      } catch (err) {
        console.error('Failed to load data for prescription:', err);
      }
    }

    loadData();
  }, [isOpen, preselectedPatientId, user]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([
      ...items,
      { medicine_name: '', dosage: '250mg', frequency: 'Once daily', duration: '7 days', instructions: 'Take with plenty of water' }
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!patientId || !doctorId || !diagnosis.trim()) {
      addToast('Patient, Doctor, and Diagnosis are required', 'error');
      return;
    }

    const validItems = items.filter((i) => i.medicine_name.trim().length > 0);
    if (validItems.length === 0) {
      addToast('Please specify at least one valid medication name', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.prescriptions.create({
        patient_id: parseInt(patientId),
        doctor_id: parseInt(doctorId),
        prescription_date: prescriptionDate,
        diagnosis: diagnosis.trim(),
        status,
        notes: notes.trim(),
        items: validItems,
      });

      addToast('Prescription issued successfully!', 'success');
      onCreated();
      onClose();
    } catch (err) {
      addToast(err.message || 'Failed to issue prescription', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Create Clinical Prescription (℞)</h3>
              <p className="text-xs text-slate-500">Prescribe medications, dosage schedules, and dietary instructions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Patient */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Patient <span className="text-rose-500">*</span>
              </label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.patient_code}) &bull; Blood: {p.blood_group}
                  </option>
                ))}
              </select>
            </div>

            {/* Doctor */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-slate-400" /> Prescribing Physician <span className="text-rose-500">*</span>
              </label>
              <select
                value={doctorId}
                disabled={user?.role === 'doctor' && !!user?.doctor_id}
                onChange={(e) => setDoctorId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 disabled:bg-slate-100"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} &bull; {d.department}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Prescription Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={prescriptionDate}
                onChange={(e) => setPrescriptionDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Prescription Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
              >
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* Diagnosis */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinical Diagnosis <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. Acute Pharyngitis with fever, Stage 1 Hypertension"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
            </div>
          </div>

          {/* Dynamic Medicines Table */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                Prescribed Medications ({items.length}) <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Medicine
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 relative group space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-4">
                      <label className="text-[10px] font-semibold text-slate-500">Medicine Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Amoxicillin"
                        value={item.medicine_name}
                        onChange={(e) => handleItemChange(idx, 'medicine_name', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-semibold text-slate-500">Dosage</label>
                      <input
                        type="text"
                        placeholder="e.g. 500mg"
                        value={item.dosage}
                        onChange={(e) => handleItemChange(idx, 'dosage', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="text-[10px] font-semibold text-slate-500">Frequency</label>
                      <input
                        type="text"
                        placeholder="e.g. Twice daily"
                        value={item.frequency}
                        onChange={(e) => handleItemChange(idx, 'frequency', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-semibold text-slate-500">Duration</label>
                      <input
                        type="text"
                        placeholder="e.g. 5 days"
                        value={item.duration}
                        onChange={(e) => handleItemChange(idx, 'duration', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                      />
                    </div>
                    <div className="sm:col-span-1 flex items-end justify-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={items.length <= 1}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Remove medicine"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500">Special Instructions / Meal timing</label>
                    <input
                      type="text"
                      placeholder="e.g. Take immediately after meals with warm water"
                      value={item.instructions}
                      onChange={(e) => handleItemChange(idx, 'instructions', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Advice & Instructions */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              General Doctor's Advice & Precautions
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Avoid dairy within 2 hours of antibiotic dose. Return if fever persists beyond 48 hours."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
          </div>

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Issuing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Issue Prescription
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

