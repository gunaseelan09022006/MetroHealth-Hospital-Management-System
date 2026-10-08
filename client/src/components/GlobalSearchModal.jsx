import React, { useState, useEffect, useRef } from 'react';
import { Search, X, User, Stethoscope, Calendar, FileText, CreditCard, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../api';

export default function GlobalSearchModal({ isOpen, onClose, onSelectPatient, onSelectDoctor, onNavigateTab }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.search.query(query.trim());
        setResults(res);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults = results
    ? (results.patients?.length || 0) +
      (results.doctors?.length || 0) +
      (results.appointments?.length || 0) +
      (results.prescriptions?.length || 0) +
      (results.bills?.length || 0)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/40 backdrop-blur-sm no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-scale-in">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patients, doctors, appointments, prescriptions, bills... (Esc to close)"
            className="flex-1 bg-transparent border-none text-slate-800 placeholder-slate-400 focus:outline-none text-sm md:text-base font-medium"
          />
          {loading && <Loader2 className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-[65vh] overflow-y-auto p-4 space-y-4">
          {!query.trim() && (
            <div className="py-10 text-center text-slate-400 text-sm">
              <Search className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
              Type at least 2 characters to search across all hospital records.
            </div>
          )}

          {query.trim().length >= 2 && !loading && totalResults === 0 && (
            <div className="py-10 text-center text-slate-500 text-sm">
              No matching hospital records found for "<span className="font-semibold">{query}</span>"
            </div>
          )}

          {results && (
            <>
              {/* Patients */}
              {results.patients?.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-500" /> Patients ({results.patients.length})
                  </div>
                  <div className="space-y-1">
                    {results.patients.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          onClose();
                          onSelectPatient(p.id);
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50/70 border border-transparent hover:border-indigo-100 cursor-pointer transition-all group"
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 flex items-center gap-2">
                            {p.name}
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-normal">
                              {p.patient_code}
                            </span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 font-semibold">
                              {p.blood_group}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">{p.phone}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Doctors */}
              {results.doctors?.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-emerald-500" /> Doctors ({results.doctors.length})
                  </div>
                  <div className="space-y-1">
                    {results.doctors.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => {
                          onClose();
                          onNavigateTab('doctors');
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-50/70 border border-transparent hover:border-emerald-100 cursor-pointer transition-all group"
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-800 group-hover:text-emerald-700 flex items-center gap-2">
                            {d.name}
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-normal">
                              {d.doctor_code}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {d.specialization} &bull; {d.department} {d.room_number ? `(${d.room_number})` : ''}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Appointments */}
              {results.appointments?.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" /> Appointments ({results.appointments.length})
                  </div>
                  <div className="space-y-1">
                    {results.appointments.map((a) => (
                      <div
                        key={a.id}
                        onClick={() => {
                          onClose();
                          onNavigateTab('appointments');
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50/70 border border-transparent hover:border-blue-100 cursor-pointer transition-all group"
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 flex items-center gap-2">
                            {a.appointment_code}
                            <span className="text-xs font-normal text-slate-500">&bull; {a.patient_name}</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Dr. {a.doctor_name} &bull; {a.appointment_date} at {a.appointment_time} &bull; <span className="font-medium text-slate-700">{a.status}</span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prescriptions */}
              {results.prescriptions?.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-purple-500" /> Prescriptions ({results.prescriptions.length})
                  </div>
                  <div className="space-y-1">
                    {results.prescriptions.map((pr) => (
                      <div
                        key={pr.id}
                        onClick={() => {
                          onClose();
                          onNavigateTab('prescriptions');
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-purple-50/70 border border-transparent hover:border-purple-100 cursor-pointer transition-all group"
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-800 group-hover:text-purple-700 flex items-center gap-2">
                            {pr.prescription_code}
                            <span className="text-xs font-normal text-slate-500">&bull; {pr.patient_name}</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Diagnosis: <span className="text-slate-800">{pr.diagnosis}</span> &bull; {pr.doctor_name}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bills */}
              {results.bills?.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-teal-500" /> Bills & Invoices ({results.bills.length})
                  </div>
                  <div className="space-y-1">
                    {results.bills.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => {
                          onClose();
                          onNavigateTab('billing');
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-teal-50/70 border border-transparent hover:border-teal-100 cursor-pointer transition-all group"
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-800 group-hover:text-teal-700 flex items-center gap-2">
                            {b.bill_code}
                            <span className="text-xs font-normal text-slate-500">&bull; {b.patient_name}</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Total: ${Number(b.total_amount).toFixed(2)} &bull; Status: <span className="font-semibold">{b.payment_status}</span> &bull; {b.bill_date}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <div>Press ESC to close</div>
          <div>MetroHealth Central Database</div>
        </div>
      </div>
    </div>
  );
}

