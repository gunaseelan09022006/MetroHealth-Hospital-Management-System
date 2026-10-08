import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Eye,
  Edit2,
  Trash2,
  RefreshCw,
  Phone,
  Mail,
  AlertTriangle,
  HeartPulse,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function PatientsPage({
  onOpenPatientForm,
  onEditPatient,
  onViewPatientDossier,
}) {
  const { user, addToast, hasPermission } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [gender, setGender] = useState('');
  const [status, setStatus] = useState('');

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const data = await api.patients.getAll({
        search: search.trim() || undefined,
        blood_group: bloodGroup || undefined,
        gender: gender || undefined,
        status: status || undefined,
      });
      setPatients(data);
    } catch (err) {
      console.error('Failed to load patients:', err);
      addToast(err.message || 'Failed to load patients', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, bloodGroup, gender, status]);

  const handleToggleStatus = async (patient) => {
    try {
      const res = await api.patients.delete(patient.id, false);
      addToast(res.message, 'info');
      fetchPatients();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return '';
    const diff = Date.now() - new Date(dob).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Patient Medical Records
          </h2>
          <p className="text-xs md:text-sm text-slate-500">
            Comprehensive directory of patient profiles, clinical history, and emergency details.
          </p>
        </div>

        {hasPermission('patients', 'create') && (
          <button
            onClick={() => onOpenPatientForm()}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors"
          >
            <UserPlus className="w-4 h-4" /> Register New Patient
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, patient code, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
            />
          </div>

          {/* Blood Group Filter */}
          <div>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">All Blood Groups</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          {/* Gender Filter */}
          <div>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            <button
              onClick={() => {
                setSearch('');
                setBloodGroup('');
                setGender('');
                setStatus('');
              }}
              title="Reset Filters"
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Patient Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex justify-center items-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : patients.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              No patient records match the applied criteria.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Patient ID</th>
                  <th className="py-3 px-4">Name & Contact</th>
                  <th className="py-3 px-4">Gender & Age</th>
                  <th className="py-3 px-4">Blood Group</th>
                  <th className="py-3 px-4">Emergency Contact</th>
                  <th className="py-3 px-4">Known Allergies</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {p.patient_code}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                      <div className="text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" /> {p.phone}
                      </div>
                      {p.email && (
                        <div className="text-slate-400 text-[11px] flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" /> {p.email}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div>{p.gender}</div>
                      <div className="text-slate-400 text-[11px]">
                        {p.dob} ({calculateAge(p.dob)} yrs)
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 font-black border border-rose-200 text-xs shadow-2xs">
                        {p.blood_group}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div className="font-medium text-slate-800">{p.emergency_contact}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">{p.address}</div>
                    </td>
                    <td className="py-3 px-4">
                      {p.allergies ? (
                        <div className="flex items-center gap-1 text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-100 max-w-xs truncate">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span className="truncate">{p.allergies}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">None reported</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        p.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Dossier */}
                        <button
                          onClick={() => onViewPatientDossier(p.id)}
                          className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors"
                          title="View Full Medical Record Dossier"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit */}
                        {hasPermission('patients', 'edit') && (
                          <button
                            onClick={() => onEditPatient(p)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            title="Edit Patient Info"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Toggle Status */}
                        {hasPermission('patients', 'delete') && (
                          <button
                            onClick={() => handleToggleStatus(p)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                            title={p.status === 'active' ? 'Deactivate Patient' : 'Reactivate Patient'}
                          >
                            {p.status === 'active' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
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

