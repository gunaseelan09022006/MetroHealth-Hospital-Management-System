import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Stethoscope, User, AlertCircle, CheckCircle2, Loader2, Info } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function AppointmentModal({ isOpen, onClose, preselectedPatientId = null, onBooked }) {
  const { addToast } = useAuth();

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [appointmentTime, setAppointmentTime] = useState('');
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState('Scheduled');
  const [notes, setNotes] = useState('');

  // Slots state
  const [slotData, setSlotData] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load patient list and doctor list
  useEffect(() => {
    if (!isOpen) return;

    async function initData() {
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

        if (doctorsRes.length > 0 && !doctorId) {
          setDoctorId(doctorsRes[0].id.toString());
        }
      } catch (err) {
        console.error('Failed to load doctors/patients for appointment:', err);
      }
    }

    initData();
  }, [isOpen, preselectedPatientId]);

  // Fetch slots whenever doctorId or appointmentDate changes
  useEffect(() => {
    if (!isOpen || !doctorId || !appointmentDate) return;

    let isMounted = true;
    async function fetchSlots() {
      setLoadingSlots(true);
      setAppointmentTime('');
      try {
        const res = await api.schedules.getAvailableSlots(doctorId, appointmentDate);
        if (isMounted) {
          setSlotData(res);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to fetch doctor slots:', err);
          setSlotData(null);
        }
      } finally {
        if (isMounted) {
          setLoadingSlots(false);
        }
      }
    }

    fetchSlots();
    return () => { isMounted = false; };
  }, [doctorId, appointmentDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!patientId || !doctorId || !appointmentDate || !appointmentTime || !reason.trim()) {
      addToast('Please fill in all required fields and select an available time slot', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.appointments.create({
        patient_id: parseInt(patientId),
        doctor_id: parseInt(doctorId),
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        reason: reason.trim(),
        status,
        notes: notes.trim(),
      });

      addToast('Appointment booked successfully!', 'success');
      onBooked();
      onClose();
    } catch (err) {
      addToast(err.message || 'Failed to book appointment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDoctorObj = doctors.find((d) => d.id === parseInt(doctorId));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Book Patient Appointment</h3>
              <p className="text-xs text-slate-500">Schedule a visit with real-time slot conflict prevention</p>
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
            
            {/* Patient Selector */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Select Patient <span className="text-rose-500">*</span>
              </label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.patient_code}) &bull; Blood: {p.blood_group} &bull; {p.phone}
                  </option>
                ))}
              </select>
            </div>

            {/* Doctor Selector */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-slate-400" /> Select Attending Doctor <span className="text-rose-500">*</span>
              </label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} &bull; {d.department} ({d.specialization}) &bull; Fee: ${d.consultation_fee}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Appointment Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={appointmentDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {/* Initial Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Booking Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Confirmed">Confirmed</option>
              </select>
            </div>

            {/* Doctor Available Slots Selection */}
            <div className="sm:col-span-2 pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Select Available Time Slot <span className="text-rose-500">*</span>
                </label>
                {appointmentTime && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    Selected: {appointmentTime}
                  </span>
                )}
              </div>

              {loadingSlots ? (
                <div className="py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex justify-center items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  Calculating doctor working hours and conflicts...
                </div>
              ) : slotData && !slotData.is_available ? (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Doctor Unavailable:</span> {slotData.message}
                  </div>
                </div>
              ) : slotData && slotData.slots?.length > 0 ? (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 pb-1 border-b border-slate-200/60">
                    <span>Day: <strong>{slotData.day_of_week}</strong></span>
                    <span>Working: {slotData.schedule?.start_time} - {slotData.schedule?.end_time}</span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1 max-h-48 overflow-y-auto">
                    {slotData.slots.map((slot) => {
                      const isSelected = appointmentTime === slot.time;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setAppointmentTime(slot.time)}
                          className={`py-2 px-1 text-center rounded-lg text-xs font-semibold transition-all border ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs scale-102'
                              : slot.available
                              ? 'bg-white hover:bg-blue-50 text-slate-800 border-slate-200 hover:border-blue-300'
                              : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                          }`}
                          title={!slot.available ? slot.status : 'Click to select this slot'}
                        >
                          <div>{slot.time}</div>
                          {!slot.available && (
                            <div className="text-[9px] font-normal tracking-tight truncate mt-0.5 text-slate-400">
                              {slot.status === 'Already Booked' ? 'Booked' : 'Break'}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Select a doctor and date to view available appointment slots.
                </div>
              )}
            </div>

            {/* Appointment Reason */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Appointment / Symptoms <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Follow-up consultation for elevated blood pressure, chest discomfort"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {/* Clinical Notes */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Administrative Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. VIP patient, requires wheelchair assistance"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

          </div>

          {/* Action Footer */}
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
              disabled={submitting || !appointmentTime}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying & Booking...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Confirm Booking
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

