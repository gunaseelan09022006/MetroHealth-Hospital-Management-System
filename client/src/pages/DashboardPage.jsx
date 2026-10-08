import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Stethoscope,
  CreditCard,
  FileText,
  DollarSign,
  UserPlus,
  PlusCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Activity,
  Phone,
  Eye,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage({
  onOpenPatientForm,
  onOpenAppointmentModal,
  onOpenScheduleModal,
  onOpenPrescriptionModal,
  onOpenBillModal,
  onViewPatientDossier,
  onNavigateTab,
}) {
  const { user, hasPermission } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await api.dashboard.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await api.appointments.updateStatus(appointmentId, newStatus);
      fetchStats();
    } catch (err) {
      console.error('Failed to update appointment status:', err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Welcome & Quick Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Hospital Operations Dashboard
          </h2>
          <p className="text-xs md:text-sm text-slate-500">
            Real-time medical activity, clinical schedules, patient admissions, and financial overview.
          </p>
        </div>

        <button
          onClick={fetchStats}
          disabled={loading}
          className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Quick Action Buttons Row */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-indigo-500" /> Rapid Staff Actions
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {hasPermission('patients', 'create') && (
            <button
              onClick={onOpenPatientForm}
              className="p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 font-semibold text-xs flex items-center justify-center gap-2 transition-all hover:scale-101 shadow-2xs"
            >
              <UserPlus className="w-4 h-4" /> Add Patient
            </button>
          )}

          {hasPermission('appointments', 'create') && (
            <button
              onClick={() => onOpenAppointmentModal()}
              className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 font-semibold text-xs flex items-center justify-center gap-2 transition-all hover:scale-101 shadow-2xs"
            >
              <Calendar className="w-4 h-4" /> Book Appointment
            </button>
          )}

          {hasPermission('schedules', 'create') && (
            <button
              onClick={() => onOpenScheduleModal(1)}
              className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-100 font-semibold text-xs flex items-center justify-center gap-2 transition-all hover:scale-101 shadow-2xs"
            >
              <Clock className="w-4 h-4" /> Doctor Schedule
            </button>
          )}

          {hasPermission('prescriptions', 'create') && (
            <button
              onClick={() => onOpenPrescriptionModal()}
              className="p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-100 font-semibold text-xs flex items-center justify-center gap-2 transition-all hover:scale-101 shadow-2xs"
            >
              <FileText className="w-4 h-4" /> Create Prescription
            </button>
          )}

          {hasPermission('billing', 'create') && (
            <button
              onClick={() => onOpenBillModal()}
              className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 font-semibold text-xs flex items-center justify-center gap-2 transition-all hover:scale-101 shadow-2xs"
            >
              <CreditCard className="w-4 h-4" /> Create Bill
            </button>
          )}
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        
        {/* Total Patients */}
        <div
          onClick={() => onNavigateTab('patients')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-indigo-300 cursor-pointer transition-all hover:-translate-y-0.5 group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Patients</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {loading ? '-' : stats?.totalPatients || 0}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Active registered
          </div>
        </div>

        {/* Today's Appointments */}
        <div
          onClick={() => onNavigateTab('appointments')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-300 cursor-pointer transition-all hover:-translate-y-0.5 group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Today's Visits</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {loading ? '-' : stats?.todayAppointments || 0}
          </div>
          <div className="text-[11px] text-blue-600 font-medium mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Scheduled today
          </div>
        </div>

        {/* Available Doctors */}
        <div
          onClick={() => onNavigateTab('doctors')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-300 cursor-pointer transition-all hover:-translate-y-0.5 group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">On-Duty Doctors</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Stethoscope className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {loading ? '-' : stats?.availableDoctors || 0}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> No leaves today
          </div>
        </div>

        {/* Pending Bills */}
        <div
          onClick={() => onNavigateTab('billing')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-amber-300 cursor-pointer transition-all hover:-translate-y-0.5 group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Pending Bills</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {loading ? '-' : stats?.pendingBills?.count || 0}
          </div>
          <div className="text-[11px] text-rose-600 font-semibold mt-1">
            ${loading ? '0' : Number(stats?.pendingBills?.amount || 0).toFixed(0)} due
          </div>
        </div>

        {/* Active Prescriptions */}
        <div
          onClick={() => onNavigateTab('prescriptions')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-purple-300 cursor-pointer transition-all hover:-translate-y-0.5 group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Active Rx</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {loading ? '-' : stats?.activePrescriptions || 0}
          </div>
          <div className="text-[11px] text-purple-600 font-medium mt-1">
            Dispensed orders
          </div>
        </div>

        {/* Revenue Collected */}
        <div
          onClick={() => onNavigateTab('billing')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-teal-300 cursor-pointer transition-all hover:-translate-y-0.5 group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Revenue Collected</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            ${loading ? '-' : Number(stats?.totalRevenue || 0).toFixed(0)}
          </div>
          <div className="text-[11px] text-teal-600 font-medium mt-1">
            Cash / Card / UPI
          </div>
        </div>

      </div>

      {/* Visual Analytics / Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Appointments by Department */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-indigo-600" /> Department Workload Distribution
            </h3>
            <span className="text-xs text-slate-400">Total Clinical Visits</span>
          </div>

          <div className="space-y-3 pt-1">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading department statistics...</div>
            ) : (
              stats?.departmentBreakdown?.map((dept) => {
                const max = Math.max(...(stats.departmentBreakdown.map((d) => d.count) || [1]), 1);
                const pct = Math.round((dept.count / max) * 100);

                return (
                  <div key={dept.department} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">{dept.department}</span>
                      <span className="text-slate-500 font-mono">{dept.count} consultations</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(pct, 8)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Appointment Status Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" /> Visit Statuses
            </h3>
            <span className="text-xs text-slate-400">Current</span>
          </div>

          <div className="space-y-2.5 pt-1">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading visit statuses...</div>
            ) : (
              stats?.appointmentStatuses?.map((st) => (
                <div
                  key={st.status}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/70"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      st.status === 'Completed' ? 'bg-emerald-500' :
                      st.status === 'Confirmed' ? 'bg-blue-500' :
                      st.status === 'Scheduled' ? 'bg-amber-500' :
                      'bg-rose-500'
                    }`} />
                    <span className="text-xs font-semibold text-slate-700">{st.status}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                    {st.count}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Tables Row: Upcoming Appointments & Recent Patients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Upcoming Appointments Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" /> Upcoming & Today's Appointments
            </h3>
            <button
              onClick={() => onNavigateTab('appointments')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading appointments...</div>
            ) : stats?.upcomingAppointments?.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No upcoming appointments scheduled.</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Patient</th>
                    <th className="py-2.5 px-3">Doctor</th>
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats?.upcomingAppointments?.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{apt.patient_name}</div>
                        <div className="text-[10px] text-slate-400">{apt.patient_code}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-800">{apt.doctor_name}</div>
                        <div className="text-[10px] text-slate-400">{apt.specialization}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-800">{apt.appointment_date}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{apt.appointment_time}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          apt.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                          apt.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {apt.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {apt.status !== 'Completed' && (
                          <button
                            onClick={() => handleStatusChange(apt.id, 'Completed')}
                            className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold transition-colors"
                          >
                            Mark Done
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Patients Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" /> Recent Registered Patients
            </h3>
            <button
              onClick={() => onNavigateTab('patients')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading patients...</div>
            ) : stats?.recentPatients?.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No patients registered.</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Blood Group</th>
                    <th className="py-2.5 px-3">Contact</th>
                    <th className="py-2.5 px-3 text-right">Record</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats?.recentPatients?.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-500">{p.patient_code}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">{p.name}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200 text-[10px]">
                          {p.blood_group}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{p.phone}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => onViewPatientDossier(p.id)}
                          className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[10px] font-bold flex items-center gap-1 ml-auto transition-colors"
                        >
                          <Eye className="w-3 h-3" /> Dossier
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      {/* Recent Payments Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-teal-600" /> Recent Collected Payments & Transactions
          </h3>
          <button
            onClick={() => onNavigateTab('billing')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
          >
            All Billing <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-10 text-center text-xs text-slate-400">Loading payment feed...</div>
          ) : stats?.recentPayments?.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">No payment transactions found.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-4">Invoice #</th>
                  <th className="py-2.5 px-4">Patient Name</th>
                  <th className="py-2.5 px-4">Doctor</th>
                  <th className="py-2.5 px-4 text-right">Amount Paid</th>
                  <th className="py-2.5 px-4">Method</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats?.recentPayments?.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-800">{pay.bill_code}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-800">{pay.patient_name}</td>
                    <td className="py-2.5 px-4 text-slate-600">{pay.doctor_name}</td>
                    <td className="py-2.5 px-4 text-right font-black text-emerald-600">${Number(pay.paid_amount).toFixed(2)}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {pay.payment_method}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">{pay.bill_date}</td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold ${
                        pay.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {pay.payment_status}
                      </span>
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

