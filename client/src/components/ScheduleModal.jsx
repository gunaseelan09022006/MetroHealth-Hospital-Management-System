import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Save, Plus, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ScheduleModal({ doctorId, isOpen, onClose, onUpdated }) {
  const { addToast } = useAuth();
  const [activeTab, setActiveTab] = useState('weekly'); // 'weekly' or 'leave'
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Weekly Schedule rows
  const [scheduleRows, setScheduleRows] = useState(
    DAYS.map((day) => ({
      day_of_week: day,
      start_time: '09:00',
      end_time: '17:00',
      slot_duration_minutes: 30,
      break_start: '13:00',
      break_end: '14:00',
      is_active: day !== 'Sunday',
    }))
  );

  // Leave Form
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [existingLeaves, setExistingLeaves] = useState([]);

  useEffect(() => {
    if (!isOpen || !doctorId) return;

    async function loadSchedule() {
      setLoading(true);
      try {
        const res = await api.schedules.getDoctorSchedule(doctorId);
        setDoctor(res.doctor);
        setExistingLeaves(res.leaves || []);

        if (res.schedules && res.schedules.length > 0) {
          const map = {};
          res.schedules.forEach((s) => {
            map[s.day_of_week] = s;
          });

          setScheduleRows(
            DAYS.map((day) => {
              const existing = map[day];
              if (existing) {
                return {
                  day_of_week: day,
                  start_time: existing.start_time || '09:00',
                  end_time: existing.end_time || '17:00',
                  slot_duration_minutes: existing.slot_duration_minutes || 30,
                  break_start: existing.break_start || '13:00',
                  break_end: existing.break_end || '14:00',
                  is_active: existing.is_active === 1,
                };
              }
              return {
                day_of_week: day,
                start_time: '09:00',
                end_time: '17:00',
                slot_duration_minutes: 30,
                break_start: '13:00',
                break_end: '14:00',
                is_active: false,
              };
            })
          );
        }
      } catch (err) {
        console.error('Failed to load doctor schedule:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSchedule();
  }, [isOpen, doctorId]);

  if (!isOpen || !doctorId) return null;

  const handleDayChange = (index, field, value) => {
    const updated = [...scheduleRows];
    updated[index][field] = value;
    setScheduleRows(updated);
  };

  const handleSaveWeekly = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.schedules.updateSchedule(doctorId, scheduleRows);
      addToast('Weekly doctor schedule saved successfully!', 'success');
      onUpdated();
      onClose();
    } catch (err) {
      addToast(err.message || 'Failed to update schedule', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddLeave = async (e) => {
    e.preventDefault();
    if (!leaveDate) {
      addToast('Please select a leave date', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.schedules.addLeave(doctorId, {
        leave_date: leaveDate,
        reason: leaveReason || 'Doctor unavailable',
      });
      setExistingLeaves(res.leaves);
      setLeaveDate('');
      setLeaveReason('');
      addToast('Doctor leave date recorded successfully!', 'success');
      onUpdated();
    } catch (err) {
      addToast(err.message || 'Failed to record leave', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLeave = async (leaveId) => {
    try {
      await api.schedules.deleteLeave(leaveId);
      setExistingLeaves(existingLeaves.filter((l) => l.id !== leaveId));
      addToast('Leave date removed', 'info');
      onUpdated();
    } catch (err) {
      addToast(err.message || 'Failed to delete leave', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                Manage Schedule: {doctor?.name || 'Doctor'}
              </h3>
              <p className="text-xs text-slate-500">
                {doctor?.department} &bull; {doctor?.specialization}
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

        {/* Tab Selectors */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('weekly')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'weekly' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Weekly Working Hours
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('leave')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'leave' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" /> Leaves & Unavailable Dates ({existingLeaves.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-20 flex justify-center items-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : activeTab === 'weekly' ? (
            <form onSubmit={handleSaveWeekly} className="space-y-4">
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-900 leading-relaxed">
                Configure clinic hours, slot duration, and lunch/break time for each day of the week. Slots will be dynamically computed during patient booking.
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                {scheduleRows.map((row, index) => (
                  <div
                    key={row.day_of_week}
                    className={`p-3 text-xs flex flex-wrap items-center gap-3 transition-colors ${
                      row.is_active ? 'bg-white' : 'bg-slate-50/70 opacity-60'
                    }`}
                  >
                    {/* Day Toggle */}
                    <div className="w-32 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={row.is_active}
                        id={`day-${row.day_of_week}`}
                        onChange={(e) => handleDayChange(index, 'is_active', e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor={`day-${row.day_of_week}`} className="font-bold text-slate-800 cursor-pointer">
                        {row.day_of_week}
                      </label>
                    </div>

                    {/* Start - End */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-medium">Hours:</span>
                      <input
                        type="time"
                        value={row.start_time}
                        disabled={!row.is_active}
                        onChange={(e) => handleDayChange(index, 'start_time', e.target.value)}
                        className="px-2 py-1 rounded border border-slate-300 text-xs bg-white disabled:bg-slate-100"
                      />
                      <span className="text-slate-400">to</span>
                      <input
                        type="time"
                        value={row.end_time}
                        disabled={!row.is_active}
                        onChange={(e) => handleDayChange(index, 'end_time', e.target.value)}
                        className="px-2 py-1 rounded border border-slate-300 text-xs bg-white disabled:bg-slate-100"
                      />
                    </div>

                    {/* Break Start - End */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-medium">Break:</span>
                      <input
                        type="time"
                        value={row.break_start || ''}
                        disabled={!row.is_active}
                        onChange={(e) => handleDayChange(index, 'break_start', e.target.value)}
                        className="px-2 py-1 rounded border border-slate-300 text-xs bg-white disabled:bg-slate-100"
                      />
                      <span className="text-slate-400">to</span>
                      <input
                        type="time"
                        value={row.break_end || ''}
                        disabled={!row.is_active}
                        onChange={(e) => handleDayChange(index, 'break_end', e.target.value)}
                        className="px-2 py-1 rounded border border-slate-300 text-xs bg-white disabled:bg-slate-100"
                      />
                    </div>

                    {/* Slot Duration */}
                    <div className="flex items-center gap-1.5 ml-auto">
                      <span className="text-slate-400">Slot:</span>
                      <select
                        value={row.slot_duration_minutes}
                        disabled={!row.is_active}
                        onChange={(e) => handleDayChange(index, 'slot_duration_minutes', parseInt(e.target.value))}
                        className="px-2 py-1 rounded border border-slate-300 text-xs bg-white disabled:bg-slate-100"
                      >
                        <option value={15}>15 min</option>
                        <option value={20}>20 min</option>
                        <option value={30}>30 min</option>
                        <option value={45}>45 min</option>
                        <option value={60}>60 min</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Schedule
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Add Leave Form */}
              <form onSubmit={handleAddLeave} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-indigo-600" /> Register Doctor Absence / Leave
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Leave Date</label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={leaveDate}
                      onChange={(e) => setLeaveDate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Reason / Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Medical Conference, Personal Vacation"
                      value={leaveReason}
                      onChange={(e) => setLeaveReason(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={submitting || !leaveDate}
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Leave Record
                  </button>
                </div>
              </form>

              {/* Existing Leaves List */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Recorded Leaves ({existingLeaves.length})
                </h4>
                {existingLeaves.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                    No leaves registered for this doctor.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                    {existingLeaves.map((l) => (
                      <div key={l.id} className="p-3 text-xs flex items-center justify-between hover:bg-slate-50/70">
                        <div>
                          <strong className="text-slate-800 text-sm font-semibold">{l.leave_date}</strong>
                          <div className="text-slate-500 text-xs mt-0.5">{l.reason || 'Leave recorded'}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteLeave(l.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Remove leave"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

