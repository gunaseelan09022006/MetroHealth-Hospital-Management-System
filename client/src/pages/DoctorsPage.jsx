import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Clock,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Edit2,
  Eye,
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function DoctorsPage({ onOpenScheduleModal, onBookAppointmentForDoctor }) {
  const { user, addToast, hasPermission } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [department, setDepartment] = useState('');
  const [search, setSearch] = useState('');

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const data = await api.schedules.getAll();
      setDoctors(data);
    } catch (err) {
      console.error('Failed to load doctors schedule list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function loadDepts() {
      try {
        const depts = await api.doctors.getDepartments();
        setDepartments(depts);
      } catch (err) {
        console.error(err);
      }
    }
    loadDepts();
    fetchDoctors();
  }, []);

  const filteredDoctors = doctors.filter((doc) => {
    const matchesDept = !department || doc.department === department;
    const matchesSearch = !search ||
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(search.toLowerCase()) ||
      doc.doctor_code.toLowerCase().includes(search.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Medical Specialists & Schedules
          </h2>
          <p className="text-xs md:text-sm text-slate-500">
            Clinical rosters, weekly consultation shifts, break timings, and scheduled practitioner leaves.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search doctor by name, specialty, code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-500 flex items-center justify-end font-medium">
            Showing {filteredDoctors.length} medical officers
          </div>

        </div>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
          No medical specialists found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between hover:border-emerald-300 transition-all hover:shadow-xs"
            >
              <div className="p-5 space-y-4">
                
                {/* Top Doc Details */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg shrink-0">
                      <Stethoscope className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">{doc.name}</h3>
                      <div className="text-xs text-emerald-700 font-medium mt-0.5">{doc.specialization}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded text-[10px] text-slate-600">{doc.doctor_code}</span>
                        <span>&bull;</span>
                        <span>{doc.department}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                    doc.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {doc.status}
                  </span>
                </div>

                {/* Consultation Fee & Room */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Consultation Fee:</span>
                    <strong className="text-slate-800 text-sm font-black">${doc.consultation_fee}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Location / Room:</span>
                    <strong className="text-slate-800 text-xs font-semibold">{doc.room_number || 'OPD-Main'}</strong>
                  </div>
                </div>

                {/* Weekly Active Schedule Summary */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" /> Weekly Availability
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayShort, idx) => {
                      const fullDay = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][idx];
                      const activeSchedule = doc.schedules?.find((s) => s.day_of_week === fullDay);

                      return (
                        <div
                          key={dayShort}
                          title={activeSchedule ? `${fullDay}: ${activeSchedule.start_time} - ${activeSchedule.end_time} (Break: ${activeSchedule.break_start || 'None'})` : `${fullDay}: Off`}
                          className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
                            activeSchedule
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : 'bg-slate-50 border-slate-200 text-slate-300'
                          }`}
                        >
                          {dayShort}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Leaves Banner if any */}
                {doc.leaves && doc.leaves.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Upcoming Leave:</span> {doc.leaves[0].leave_date} ({doc.leaves[0].reason || 'Off-duty'})
                    </div>
                  </div>
                )}

              </div>

              {/* Action Buttons */}
              <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => onOpenScheduleModal(doc.id)}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Clock className="w-3.5 h-3.5 text-indigo-600" /> Hours & Leaves
                </button>

                <button
                  onClick={() => onBookAppointmentForDoctor(doc.id)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Calendar className="w-3.5 h-3.5" /> Book Patient
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}

