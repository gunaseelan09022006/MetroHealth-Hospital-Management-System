import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Printer,
  PlusCircle,
  Search,
  Filter,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  Stethoscope,
  Loader2,
  Trash2,
  ArrowUpRight,
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function BillingPage({
  onOpenBillModal,
  onPrintBill,
  onRecordPayment,
  onViewPatientDossier,
}) {
  const { user, addToast, hasPermission } = useAuth();
  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [status, setStatus] = useState('');
  const [method, setMethod] = useState('');
  const [date, setDate] = useState('');
  const [search, setSearch] = useState('');

  const fetchBills = async () => {
    setLoading(true);
    try {
      const res = await api.billing.getAll({
        payment_status: status || undefined,
        payment_method: method || undefined,
        date: date || undefined,
        search: search.trim() || undefined,
      });
      setBills(res.bills || []);
      setSummary(res.summary || null);
    } catch (err) {
      console.error('Failed to load billing invoices:', err);
      addToast(err.message || 'Failed to load billing records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBills();
    }, 200);
    return () => clearTimeout(timer);
  }, [status, method, date, search]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await api.billing.delete(id);
      addToast('Bill invoice removed', 'info');
      fetchBills();
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
            Hospital Billing & Invoices
          </h2>
          <p className="text-xs md:text-sm text-slate-500">
            Financial ledger, outpatient itemized billing, receipt issuance, and revenue reconciliation.
          </p>
        </div>

        {hasPermission('billing', 'create') && (
          <button
            onClick={() => onOpenBillModal()}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors"
          >
            <PlusCircle className="w-4 h-4" /> Create New Bill
          </button>
        )}
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 mb-1">Total Billed</div>
          <div className="text-2xl font-black text-slate-900">
            ${loading ? '-' : Number(summary?.total_billed || 0).toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across {summary?.total_invoices || 0} issued invoices
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 mb-1">Total Collected</div>
          <div className="text-2xl font-black text-emerald-600">
            ${loading ? '-' : Number(summary?.total_collected || 0).toFixed(2)}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Received in account
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 mb-1">Outstanding Balance Due</div>
          <div className="text-2xl font-black text-rose-600">
            ${loading ? '-' : Number(summary?.total_pending || 0).toFixed(2)}
          </div>
          <div className="text-[11px] text-rose-500 font-medium mt-1">
            Unpaid or partially settled
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 mb-1">Settlement Rate</div>
          <div className="text-2xl font-black text-indigo-600">
            {summary && summary.total_billed > 0
              ? `${Math.round((summary.total_collected / summary.total_billed) * 100)}%`
              : '100%'}
          </div>
          <div className="text-[11px] text-indigo-500 font-medium mt-1">
            Cash, Card & UPI transactions
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search invoice #, patient, doctor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">All Payment Statuses</option>
              <option value="Paid">Paid in Full</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Pending">Pending Payment</option>
            </select>
          </div>

          <div>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">All Payment Methods</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="UPI">UPI / Digital</option>
            </select>
          </div>

          <div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>

        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex justify-center items-center">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
          ) : bills.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              No bills found matching your search.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Doctor</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Consultation</th>
                  <th className="py-3 px-4 text-right">Medicines</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {b.bill_code}
                    </td>

                    <td className="py-3 px-4">
                      <div
                        onClick={() => onViewPatientDossier(b.patient_id)}
                        className="font-bold text-slate-900 hover:text-indigo-600 cursor-pointer"
                      >
                        {b.patient_name}
                      </div>
                      <div className="text-[11px] text-slate-400">{b.patient_code}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{b.doctor_name}</div>
                      <div className="text-[11px] text-slate-500">{b.department}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      {b.bill_date}
                    </td>

                    <td className="py-3 px-4 text-right text-slate-700">
                      ${Number(b.consultation_fee).toFixed(2)}
                    </td>

                    <td className="py-3 px-4 text-right text-slate-700">
                      ${Number(b.medicine_charges).toFixed(2)}
                    </td>

                    <td className="py-3 px-4 text-right font-black text-slate-900">
                      ${Number(b.total_amount).toFixed(2)}
                    </td>

                    <td className="py-3 px-4 text-right font-bold">
                      <span className={b.balance_due > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                        ${Number(b.balance_due).toFixed(2)}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                        {b.payment_method}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        b.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                        b.payment_status === 'Partially Paid' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {b.payment_status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Print official receipt */}
                        <button
                          onClick={() => onPrintBill(b.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                          title="Print Formal Invoice"
                        >
                          <Printer className="w-3.5 h-3.5" /> Print
                        </button>

                        {/* Record Payment if balance due */}
                        {b.balance_due > 0 && hasPermission('billing', 'edit') && (
                          <button
                            onClick={() => onRecordPayment(b)}
                            className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                            title="Collect Payment"
                          >
                            <DollarSign className="w-3 h-3" /> Pay
                          </button>
                        )}

                        {user?.role === 'admin' && (
                          <button
                            onClick={() => handleDelete(b.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
                            title="Delete Bill"
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

