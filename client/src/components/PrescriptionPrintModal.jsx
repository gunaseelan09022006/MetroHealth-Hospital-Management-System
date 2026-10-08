import React, { useState, useEffect } from 'react';
import { X, Printer, HeartPulse, Stethoscope, AlertTriangle, Loader2 } from 'lucide-react';
import { api } from '../api';

export default function PrescriptionPrintModal({ prescriptionId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!prescriptionId) return;
    async function loadRx() {
      setLoading(true);
      try {
        const res = await api.prescriptions.getById(prescriptionId);
        setData(res);
      } catch (err) {
        console.error('Failed to load prescription for printing:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRx();
  }, [prescriptionId]);

  if (!prescriptionId) return null;

  const handlePrint = () => {
    window.print();
  };

  const calculateAge = (dob) => {
    if (!dob) return '';
    const diff = Date.now() - new Date(dob).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-in">
        
        {/* Top Control Bar (Hidden when printed) */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-semibold">Prescription Print Preview ({data?.prescription_code || 'Loading...'})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={loading || !data}
              className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" /> Print Prescription
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Rx Sheet Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-100 flex justify-center">
          {loading ? (
            <div className="py-20 flex justify-center items-center">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
          ) : !data ? (
            <div className="text-center py-16 text-slate-500">Prescription details unavailable.</div>
          ) : (
            <div
              id="printable-area"
              className="w-full max-w-2xl bg-white p-8 rounded-xl shadow-lg border border-slate-300 flex flex-col justify-between text-slate-900 font-sans"
              style={{ minHeight: '800px' }}
            >
              {/* Rx Header */}
              <div>
                <div className="border-b-2 border-purple-800 pb-4 mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-900 text-white flex items-center justify-center font-bold text-2xl shadow-sm">
                      <HeartPulse className="w-7 h-7" />
                    </div>
                    <div>
                      <h1 className="text-xl font-black tracking-tight text-purple-950 uppercase">
                        MetroHealth Regional Medical Center
                      </h1>
                      <p className="text-xs text-slate-600 font-medium">
                        Center for Advanced Clinical Healthcare & Surgery
                      </p>
                      <p className="text-[11px] text-slate-500">
                        1200 Healthcare Blvd, Metro City &bull; Tel: +1 (555) 911-0000 &bull; Emergency: 24/7
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-purple-50 text-purple-900 border border-purple-200">
                      {data.prescription_code}
                    </span>
                    <div className="text-xs text-slate-500 mt-1 font-medium">Date: {data.prescription_date}</div>
                  </div>
                </div>

                {/* Doctor Banner */}
                <div className="flex items-start justify-between bg-purple-50/50 p-3 rounded-lg border border-purple-100 mb-4 text-xs">
                  <div>
                    <div className="font-bold text-sm text-purple-950">{data.doctor_name}</div>
                    <div className="text-slate-700">{data.qualifications || 'Consultant Physician'}</div>
                    <div className="text-slate-600 font-medium">{data.specialization} &bull; Dept. of {data.department}</div>
                  </div>
                  <div className="text-right text-slate-600">
                    <div>Room: <strong className="text-slate-800">{data.room_number || 'OPD-1'}</strong></div>
                    <div>Contact: {data.doctor_phone}</div>
                  </div>
                </div>

                {/* Patient Information Strip */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mb-5 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="text-slate-500 block">Patient Name:</span>
                    <strong className="text-slate-900 text-sm">{data.patient_name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Patient ID:</span>
                    <strong className="font-mono text-slate-900">{data.patient_code}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Age / Gender:</span>
                    <strong className="text-slate-900">{calculateAge(data.patient_dob)} Yrs / {data.patient_gender}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Blood Group:</span>
                    <strong className="text-rose-700">{data.blood_group}</strong>
                  </div>
                  {data.allergies && (
                    <div className="col-span-2 sm:col-span-4 pt-1.5 border-t border-slate-200 flex items-center gap-1.5 text-rose-700 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Allergies Alert: {data.allergies}
                    </div>
                  )}
                </div>

                {/* Clinical Diagnosis */}
                <div className="mb-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Diagnosis:</div>
                  <div className="p-2.5 bg-slate-50 rounded-md border-l-4 border-purple-700 text-slate-800 text-sm font-semibold">
                    {data.diagnosis}
                  </div>
                </div>

                {/* ℞ Symbol & Medicines Table */}
                <div className="mt-4">
                  <div className="text-2xl font-serif font-black text-purple-900 mb-2 select-none">
                    ℞
                  </div>
                  <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Medication</th>
                        <th className="py-2.5 px-3">Dosage</th>
                        <th className="py-2.5 px-3">Frequency</th>
                        <th className="py-2.5 px-3">Duration</th>
                        <th className="py-2.5 px-3">Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.items?.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 text-slate-400 font-mono">{index + 1}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">{item.medicine_name}</td>
                          <td className="py-2 px-3 text-slate-800 font-medium">{item.dosage}</td>
                          <td className="py-2 px-3 text-slate-700">{item.frequency}</td>
                          <td className="py-2 px-3 text-slate-700">{item.duration}</td>
                          <td className="py-2 px-3 text-slate-600 italic">{item.instructions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Clinical Notes & Precautions */}
                {data.notes && (
                  <div className="mt-5 p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-xs text-amber-950">
                    <div className="font-bold text-amber-900 mb-0.5">Special Dietary & Lifestyle Instructions:</div>
                    <p className="leading-relaxed">{data.notes}</p>
                  </div>
                )}
              </div>

              {/* Bottom Signatures & Seal */}
              <div className="pt-10 mt-10 border-t border-slate-200">
                <div className="flex items-end justify-between">
                  <div className="text-[10px] text-slate-400 max-w-xs">
                    <p>Computer-generated official medical prescription.</p>
                    <p>Dispensation valid up to 30 days from date of issue.</p>
                  </div>
                  <div className="text-center">
                    <div className="w-48 border-b-2 border-slate-800 mb-1"></div>
                    <div className="text-xs font-bold text-slate-900">{data.doctor_name}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Authorized Medical Practitioner</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

