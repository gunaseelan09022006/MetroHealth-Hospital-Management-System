import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  PlusCircle,
  Filter,
  CheckCircle2,
  XCircle,
  Clock3,
  CalendarCheck,
  Search,
  RefreshCw,
  Loader2,
  Trash2,
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function AppointmentsPage({ onOpenAppointmentModal, onViewPatientDossier }) {
  const { user, addToast, hasPermission } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab filter: 'all', 'today', 'upcoming', 'completed', 'cancelled'
  const [activeTab, setActiveTab] = useState('all');

  // Filters
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [search, setSearch] = useState('');

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeTab === 'today') params.timeframe = 'today';
      if (activeTab === 'upcoming') params.timeframe = 'upcoming';
      if (activeTab === 'completed') params.status = 'Completed';
      if (activeTab === 'cancelled') params.status = 'Cancelled';

      if (selectedDoctor) params.doctor_id = selectedDoctor;
      if (selectedDate) params.date = selectedDate;
      if (search.trim()) params.search = search.trim();

      const data = await api.appointments.getAll(params);
      setAppointments(data);
    } catch (err) {
      console.error('Failed to load appointments:', err);
      addToast(err.message || 'Failed to load appointments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function loadDoctors() {
      try {
        const docList = await api.doctors.getAll();
        setDoctors(docList);
      } catch (e) {
        console.error(e);
      }
    }
    loadDoctors();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAppointments();
    }, 200);
    return () => clearTimeout(timer);
  }, [activeTab, selectedDoctor, selectedDate, search]);

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.appointments.updateStatus(id, status);
      addToast(`Appointment status updated to ${status}`, 'success');
      fetchAppointments();
    } catch (err) {
      addToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) return;
    try {
      await api.appointments.delete(id);
      addToast('Appointment deleted', 'info');
      fetchAppointments();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Clinical Appointments
          </h2>
          <p className="text-xs md:text-sm text-slate-500">
            Real-time outpatient consultation schedule, time slot reservation, and attendance tracking.
          </p>
        </div>

        {hasPermission('appointments', 'create') && (
          <button
            onClick={() => onOpenAppointmentModal()}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors"
          >
            <PlusCircle className="w-4 h-4" /> Book New Appointment
          </button>
        )}
      </div>

      {/* Status Segmented Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl overflow-x-auto text-xs font-semibold max-w-2xl">
        {[
          { id: 'all', label: 'All Appointments' },
          { id: 'today', label: "Today's Visits" },
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'completed', label: 'Completed' },
          { id: 'cancelled', label: 'Cancelled' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search patient, doctor, code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Doctor Filter */}
          <div>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Doctors</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.department})</option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Reset button */}
          <div>
            <button
              onClick={() => {
                setSelectedDoctor('');
                setSelectedDate('');
                setSearch('');
              }}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Clear Filters
            </button>
          </div>

        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex justify-center items-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : appointments.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              No appointments found matching this view.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">APT Code</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Attending Doctor</th>
                  <th className="py-3 px-4">Schedule Slot</th>
                  <th className="py-3 px-4">Clinical Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      {a.appointment_code}
                    </td>

                    <td className="py-3 px-4">
                      <div
                        onClick={() => onViewPatientDossier(a.patient_id)}
                        className="font-bold text-slate-900 hover:text-indigo-600 cursor-pointer"
                      >
                        {a.patient_name}
                      </div>
                      <div className="text-[11px] text-slate-400">{a.patient_code} &bull; {a.patient_phone}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{a.doctor_name}</div>
                      <div className="text-[11px] text-slate-500">{a.department} &bull; {a.specialization}</div>
                      {a.room_number && (
                        <div className="text-[10px] text-slate-400">Room: {a.room_number}</div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{a.appointment_date}</div>
                      <div className="text-[11px] text-blue-600 font-mono font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {a.appointment_time}
                      </div>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="text-slate-700 font-medium line-clamp-2">{a.reason}</div>
                      {a.notes && (
                        <div className="text-[10px] text-slate-400 italic mt-0.5">{a.notes}</div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        a.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                        a.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                        a.status === 'Scheduled' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {a.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Status switch buttons */}
                        {a.status === 'Scheduled' && (
                          <button
                            onClick={() => handleUpdateStatus(a.id, 'Confirmed')}
                            className="px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-[10px] transition-colors"
                          >
                            Confirm
                          </button>
                        )}

                        {a.status !== 'Completed' && a.status !== 'Cancelled' && (
                          <button
                            onClick={() => handleUpdateStatus(a.id, 'Completed')}
                            className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-[10px] transition-colors"
                          >
                            Complete
                          </button>
                        )}

                        {a.status !== 'Cancelled' && a.status !== 'Completed' && (
                          <button
                            onClick={() => handleUpdateStatus(a.id, 'Cancelled')}
                            className="px-2 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold text-[10px] transition-colors"
                          >
                            Cancel
                          </button>
                        )}

                        {/* Delete option for admin */}
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => handleDelete(a.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
                            title="Delete Appointment"
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

