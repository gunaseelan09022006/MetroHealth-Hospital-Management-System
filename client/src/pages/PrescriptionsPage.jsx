import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  User,
  Stethoscope,
  Loader2,
  Trash2,
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function PrescriptionsPage({
  onOpenPrescriptionModal,
  onPrintPrescription,
  onViewPatientDossier,
}) {
  const { user, addToast, hasPermission } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const data = await api.prescriptions.getAll({
        status: status || undefined,
        search: search.trim() || undefined,
      });
      setPrescriptions(data);
    } catch (err) {
      console.error('Failed to load prescriptions:', err);
      addToast(err.message || 'Failed to load prescriptions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPrescriptions();
    }, 200);
    return () => clearTimeout(timer);
  }, [status, search]);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.prescriptions.updateStatus(id, newStatus);
      addToast(`Prescription status updated to ${newStatus}`, 'success');
      fetchPrescriptions();
    } catch (err) {
      addToast(err.message || 'Failed to update prescription status', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this prescription?')) return;
    try {
      await api.prescriptions.delete(id);
      addToast('Prescription record deleted', 'info');
      fetchPrescriptions();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Medical Prescriptions (℞)
          </h2>
          <p className="text-xs md:text-sm text-slate-500">
            Dispensation records, multi-drug formulations, dosages, and printable clinical prescriptions.
          </p>
        </div>

        {hasPermission('prescriptions', 'create') && (
          <button
            onClick={() => onOpenPrescriptionModal()}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors"
          >
            <PlusCircle className="w-4 h-4" /> Issue New Prescription
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by diagnosis, medication, patient, or doctor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100"
            />
          </div>

          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active Regimens</option>
              <option value="Completed">Completed Courses</option>
            </select>
          </div>

        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex justify-center items-center">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              No prescriptions found matching your query.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Rx Number</th>
                  <th className="py-3 px-4">Patient Details</th>
                  <th className="py-3 px-4">Prescribing Doctor</th>
                  <th className="py-3 px-4">Diagnosis</th>
                  <th className="py-3 px-4">Medications</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prescriptions.map((rx) => (
                  <tr key={rx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-purple-900">
                      {rx.prescription_code}
                    </td>

                    <td className="py-3 px-4">
                      <div
                        onClick={() => onViewPatientDossier(rx.patient_id)}
                        className="font-bold text-slate-900 hover:text-indigo-600 cursor-pointer"
                      >
                        {rx.patient_name}
                      </div>
                      <div className="text-[11px] text-slate-400">{rx.patient_code} &bull; {rx.patient_gender}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{rx.doctor_name}</div>
                      <div className="text-[11px] text-slate-500">{rx.specialization} &bull; {rx.department}</div>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-medium text-slate-800 line-clamp-2">{rx.diagnosis}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold border border-purple-200 text-[11px]">
                        {rx.item_count} {rx.item_count === 1 ? 'medicine' : 'medicines'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {rx.prescription_date}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        rx.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {rx.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Print Prescription */}
                        <button
                          onClick={() => onPrintPrescription(rx.id)}
                          className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                          title="Print Official Prescription"
                        >
                          <Printer className="w-3.5 h-3.5" /> Print
                        </button>

                        {/* Toggle Status */}
                        {hasPermission('prescriptions', 'edit') && (
                          <button
                            onClick={() => handleUpdateStatus(rx.id, rx.status === 'Active' ? 'Completed' : 'Active')}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold transition-colors"
                          >
                            Mark {rx.status === 'Active' ? 'Completed' : 'Active'}
                          </button>
                        )}

                        {user?.role === 'admin' && (
                          <button
                            onClick={() => handleDelete(rx.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Prescription"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}

