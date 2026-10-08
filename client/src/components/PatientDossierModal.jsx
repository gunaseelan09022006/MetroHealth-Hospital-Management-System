import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, AlertTriangle, Calendar, FileText, CreditCard, Stethoscope, Clock, ShieldCheck, HeartPulse, Loader2 } from 'lucide-react';
import { api } from '../api';

export default function PatientDossierModal({ patientId, onClose, onOpenAppointmentModal, onOpenBillModal, onOpenPrescriptionModal }) {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, appointments, doctors, prescriptions, billing

  useEffect(() => {
    if (!patientId) return;
    async function loadDossier() {
      setLoading(true);
      try {
        const data = await api.patients.getById(patientId);
        setPatient(data);
      } catch (err) {
        console.error('Failed to load patient dossier:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDossier();
  }, [patientId]);

  if (!patientId) return null;

  const calculateAge = (dobString) => {
    if (!dobString) return '';
    const birthDate = new Date(dobString);
    const difference = Date.now() - birthDate.getTime();
    const ageDate = new Date(difference);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-5 flex items-start justify-between relative">
          {loading ? (
            <div className="flex items-center gap-3 py-4">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              <span>Loading patient medical record...</span>
            </div>
          ) : patient ? (
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-xl font-bold text-white shrink-0 shadow-inner">
                {patient.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl font-bold">{patient.name}</h2>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-slate-200 border border-white/10 font-mono">
                    {patient.patient_code}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                    {patient.blood_group}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${patient.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-500/20 text-slate-300'}`}>
                    {patient.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-300 mt-2 flex-wrap">
                  <span>{patient.gender}</span>
                  <span>&bull;</span>
                  <span>DOB: {patient.dob} ({calculateAge(patient.dob)} yrs old)</span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {patient.phone}</span>
                </div>
              </div>
            </div>
          ) : null}

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-200 bg-slate-50/70 overflow-x-auto text-sm font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 border-b-2 font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600 bg-white font-semibold shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" /> Personal & Medical Profile
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`py-3 px-4 border-b-2 font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'appointments'
                ? 'border-indigo-600 text-indigo-600 bg-white font-semibold shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" /> Appointments ({patient?.appointments?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('doctors')}
            className={`py-3 px-4 border-b-2 font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'doctors'
                ? 'border-indigo-600 text-indigo-600 bg-white font-semibold shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-4 h-4" /> Doctor Visits ({patient?.doctorVisits?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`py-3 px-4 border-b-2 font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'prescriptions'
                ? 'border-indigo-600 text-indigo-600 bg-white font-semibold shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" /> Prescriptions ({patient?.prescriptions?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`py-3 px-4 border-b-2 font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'billing'
                ? 'border-indigo-600 text-indigo-600 bg-white font-semibold shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4" /> Billing History ({patient?.bills?.length || 0})
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          {loading ? (
            <div className="py-20 flex justify-center items-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : !patient ? (
            <div className="text-center py-16 text-slate-500">Patient information unavailable.</div>
          ) : (
            <>
              {/* Tab 1: Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Critical Medical Alerts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
                      <div className="flex items-center gap-2 font-semibold text-rose-800 text-sm mb-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        Known Allergies
                      </div>
                      <p className="text-sm">
                        {patient.allergies || 'No known allergies reported.'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                      <div className="flex items-center gap-2 font-semibold text-amber-800 text-sm mb-1.5">
                        <HeartPulse className="w-4 h-4 text-amber-600 shrink-0" />
                        Medical History & Chronic Conditions
                      </div>
                      <p className="text-sm">
                        {patient.medical_history || 'No prior chronic conditions recorded.'}
                      </p>
                    </div>
                  </div>

                  {/* Personal & Contact Details */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                      Contact & Emergency Info
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-xs text-slate-400">Full Address</div>
                        <div className="font-medium text-slate-800 mt-0.5 flex items-start gap-1.5">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          {patient.address}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Email Address</div>
                        <div className="font-medium text-slate-800 mt-0.5 flex items-center gap-1.5">
                          <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                          {patient.email || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Primary Phone</div>
                        <div className="font-medium text-slate-800 mt-0.5 flex items-center gap-1.5">
                          <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                          {patient.phone}
                        </div>
                      </div>
                      <div className="sm:col-span-2 lg:col-span-3 pt-2 border-t border-slate-100">
                        <div className="text-xs text-slate-400">Emergency Contact</div>
                        <div className="font-semibold text-rose-700 mt-0.5 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-rose-500 shrink-0" />
                          {patient.emergency_contact}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Appointment History */}
              {activeTab === 'appointments' && (
                <div className="space-y-4">
                  {patient.appointments?.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
                      No appointments recorded for this patient.
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-4">APT Code</th>
                            <th className="py-3 px-4">Date & Time</th>
                            <th className="py-3 px-4">Attending Doctor</th>
                            <th className="py-3 px-4">Department</th>
                            <th className="py-3 px-4">Reason</th>
                            <th className="py-3 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {patient.appointments.map((a) => (
                            <tr key={a.id} className="hover:bg-slate-50/70">
                              <td className="py-3 px-4 font-mono font-medium text-slate-700">{a.appointment_code}</td>
                              <td className="py-3 px-4">
                                <div className="font-medium text-slate-800">{a.appointment_date}</div>
                                <div className="text-xs text-slate-400">{a.appointment_time}</div>
                              </td>
                              <td className="py-3 px-4 font-medium text-slate-800">{a.doctor_name}</td>
                              <td className="py-3 px-4 text-slate-600">{a.department}</td>
                              <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{a.reason}</td>
                              <td className="py-3 px-4">
                                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                                  a.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                                  a.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                                  a.status === 'Scheduled' ? 'bg-amber-100 text-amber-800' :
                                  'bg-rose-100 text-rose-800'
                                }`}>
                                  {a.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Doctor Visits */}
              {activeTab === 'doctors' && (
                <div className="space-y-4">
                  {patient.doctorVisits?.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
                      No doctor visits on record.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {patient.doctorVisits.map((doc) => (
                        <div key={doc.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                            <Stethoscope className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-800">{doc.name}</h4>
                            <p className="text-xs text-slate-500">{doc.specialization} &bull; {doc.department}</p>
                            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                              <span className="text-slate-500">Total Visits: <strong className="text-slate-800">{doc.total_visits}</strong></span>
                              <span className="text-slate-500">Last seen: <strong className="text-slate-800">{doc.last_visit_date}</strong></span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Prescriptions */}
              {activeTab === 'prescriptions' && (
                <div className="space-y-4">
                  {patient.prescriptions?.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
                      No prescriptions created for this patient yet.
                    </div>
                  ) : (
                    patient.prescriptions.map((rx) => (
                      <div key={rx.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                        <div className="flex items-start justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                                {rx.prescription_code}
                              </span>
                              <span className="text-sm font-semibold text-slate-800">
                                Diagnosis: {rx.diagnosis}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              Prescribed by {rx.doctor_name} ({rx.specialization}) on {rx.prescription_date}
                            </div>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                            rx.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {rx.status}
                          </span>
                        </div>

                        {/* Medicine items */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 text-slate-500 font-semibold">
                              <tr>
                                <th className="p-2">Medicine</th>
                                <th className="p-2">Dosage</th>
                                <th className="p-2">Frequency</th>
                                <th className="p-2">Duration</th>
                                <th className="p-2">Instructions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {rx.items?.map((item, idx) => (
                                <tr key={idx}>
                                  <td className="p-2 font-medium text-slate-900">{item.medicine_name}</td>
                                  <td className="p-2">{item.dosage}</td>
                                  <td className="p-2">{item.frequency}</td>
                                  <td className="p-2">{item.duration}</td>
                                  <td className="p-2 text-slate-500">{item.instructions}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {rx.notes && (
                          <div className="text-xs bg-slate-50 p-2.5 rounded-lg text-slate-600 border border-slate-100">
                            <strong>Clinical Advice:</strong> {rx.notes}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 5: Billing History */}
              {activeTab === 'billing' && (
                <div className="space-y-4">
                  {patient.bills?.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
                      No invoices recorded for this patient.
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-4">Invoice #</th>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Attending Doctor</th>
                            <th className="py-3 px-4 text-right">Total</th>
                            <th className="py-3 px-4 text-right">Paid</th>
                            <th className="py-3 px-4 text-right">Balance Due</th>
                            <th className="py-3 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {patient.bills.map((b) => (
                            <tr key={b.id} className="hover:bg-slate-50/70">
                              <td className="py-3 px-4 font-mono font-medium text-slate-700">{b.bill_code}</td>
                              <td className="py-3 px-4 text-slate-600">{b.bill_date}</td>
                              <td className="py-3 px-4 text-slate-800 font-medium">{b.doctor_name}</td>
                              <td className="py-3 px-4 text-right font-semibold text-slate-900">${Number(b.total_amount).toFixed(2)}</td>
                              <td className="py-3 px-4 text-right text-emerald-600 font-medium">${Number(b.paid_amount).toFixed(2)}</td>
                              <td className="py-3 px-4 text-right text-rose-600 font-bold">${Number(b.balance_due).toFixed(2)}</td>
                              <td className="py-3 px-4">
                                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                                  b.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                                  b.payment_status === 'Partially Paid' ? 'bg-amber-100 text-amber-800' :
                                  'bg-rose-100 text-rose-800'
                                }`}>
                                  {b.payment_status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {patient && (
              <>
                <button
                  onClick={() => {
                    onClose();
                    onOpenAppointmentModal(patient.id);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5" /> Book Appointment
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onOpenPrescriptionModal(patient.id);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" /> Add Prescription
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onOpenBillModal(patient.id);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <CreditCard className="w-3.5 h-3.5" /> Generate Bill
                </button>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
}

