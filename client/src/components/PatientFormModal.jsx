import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function PatientFormModal({ isOpen, onClose, patient = null, onSaved }) {
  const { addToast } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    gender: 'Male',
    blood_group: 'O+',
    phone: '',
    email: '',
    address: '',
    emergency_contact: '',
    medical_history: '',
    allergies: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name || '',
        dob: patient.dob || '',
        gender: patient.gender || 'Male',
        blood_group: patient.blood_group || 'O+',
        phone: patient.phone || '',
        email: patient.email || '',
        address: patient.address || '',
        emergency_contact: patient.emergency_contact || '',
        medical_history: patient.medical_history || '',
        allergies: patient.allergies || '',
      });
    } else {
      setFormData({
        name: '',
        dob: '',
        gender: 'Male',
        blood_group: 'O+',
        phone: '',
        email: '',
        address: '',
        emergency_contact: '',
        medical_history: '',
        allergies: '',
      });
    }
    setErrors({});
  }, [patient, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.dob) newErrors.dob = 'Date of birth is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.blood_group) newErrors.blood_group = 'Blood group is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.emergency_contact.trim()) newErrors.emergency_contact = 'Emergency contact is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (patient) {
        await api.patients.update(patient.id, formData);
        addToast('Patient records updated successfully', 'success');
      } else {
        await api.patients.create(formData);
        addToast('New patient registered successfully', 'success');
      }
      onSaved();
      onClose();
    } catch (err) {
      addToast(err.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                {patient ? 'Edit Patient Information' : 'Register New Patient'}
              </h3>
              <p className="text-xs text-slate-500">
                {patient ? `Updating record for ${patient.patient_code}` : 'Enter patient clinical and contact details'}
              </p>
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
            
            {/* Full Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Johnathan Doe"
                className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                  errors.name ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30' : 'border-slate-300 focus:ring-indigo-200 focus:border-indigo-500'
                }`}
              />
              {errors.name && <p className="text-xs text-rose-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.name}</p>}
            </div>

            {/* DOB */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date of Birth <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                  errors.dob ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-300 focus:ring-indigo-200'
                }`}
              />
              {errors.dob && <p className="text-xs text-rose-500 mt-1">{errors.dob}</p>}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gender <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Blood Group <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.blood_group}
                onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                  errors.phone ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-300 focus:ring-indigo-200'
                }`}
              />
              {errors.phone && <p className="text-xs text-rose-500 mt-1">{errors.phone}</p>}
            </div>

            {/* Email */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="patient@example.com"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Residential Address <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street address, city, state, zip code"
                className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                  errors.address ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-300 focus:ring-indigo-200'
                }`}
              />
              {errors.address && <p className="text-xs text-rose-500 mt-1">{errors.address}</p>}
            </div>

            {/* Emergency Contact */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Emergency Contact (Name & Phone) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.emergency_contact}
                onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                placeholder="e.g. Mary Doe (Spouse) - +1 (555) 123-4567"
                className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                  errors.emergency_contact ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-300 focus:ring-indigo-200'
                }`}
              />
              {errors.emergency_contact && <p className="text-xs text-rose-500 mt-1">{errors.emergency_contact}</p>}
            </div>

            {/* Known Allergies */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-rose-700 mb-1 flex items-center gap-1">
                Known Drug/Food Allergies
              </label>
              <input
                type="text"
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                placeholder="e.g. Penicillin, Peanuts, Sulfa drugs (or 'None reported')"
                className="w-full px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50/20 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </div>

            {/* Medical History */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Past Medical History & Chronic Conditions
              </label>
              <textarea
                rows={2}
                value={formData.medical_history}
                onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                placeholder="e.g. Hypertension, Diabetes Type 2, Previous Surgeries..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

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
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> {patient ? 'Save Changes' : 'Register Patient'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

