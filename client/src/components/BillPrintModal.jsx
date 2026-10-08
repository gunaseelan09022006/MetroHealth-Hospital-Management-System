import React, { useState, useEffect } from 'react';
import { X, Printer, HeartPulse, CreditCard, Loader2 } from 'lucide-react';
import { api } from '../api';

export default function BillPrintModal({ billId, onClose }) {
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!billId) return;
    async function loadBill() {
      setLoading(true);
      try {
        const res = await api.billing.getById(billId);
        setBill(res);
      } catch (err) {
        console.error('Failed to load bill invoice:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBill();
  }, [billId]);

  if (!billId) return null;

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
        
        {/* Top Control Bar */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold">Official Invoice & Receipt Preview ({bill?.bill_code || 'Loading...'})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={loading || !bill}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" /> Print Invoice
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Sheet */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-100 flex justify-center">
          {loading ? (
            <div className="py-20 flex justify-center items-center">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
          ) : !bill ? (
            <div className="text-center py-16 text-slate-500">Invoice details unavailable.</div>
          ) : (
            <div
              id="printable-area"
              className="w-full max-w-2xl bg-white p-8 rounded-xl shadow-lg border border-slate-300 flex flex-col justify-between text-slate-900 font-sans"
              style={{ minHeight: '800px' }}
            >
              <div>
                {/* Header Letterhead */}
                <div className="border-b-2 border-emerald-800 pb-4 mb-5 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-900 text-white flex items-center justify-center font-bold text-2xl shadow-sm">
                      <HeartPulse className="w-7 h-7" />
                    </div>
                    <div>
                      <h1 className="text-xl font-black tracking-tight text-emerald-950 uppercase">
                        MetroHealth Regional Medical Center
                      </h1>
                      <p className="text-xs text-slate-600 font-medium">Department of Billing & Healthcare Finance</p>
                      <p className="text-[11px] text-slate-500">
                        1200 Healthcare Blvd, Metro City &bull; Tax ID: 99-847291-MH &bull; Tel: +1 (555) 911-0000
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Medical Invoice</div>
                    <div className="font-mono text-sm font-black text-slate-900 mt-0.5">{bill.bill_code}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Date: {bill.bill_date}</div>
                  </div>
                </div>

                {/* Status Stamp & Summary Row */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 mb-5">
                  <div className="text-xs">
                    <span className="text-slate-500">Payment Channel:</span>
                    <strong className="text-slate-800 ml-1.5 font-bold">{bill.payment_method}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Payment Status:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase border ${
                      bill.payment_status === 'Paid'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : bill.payment_status === 'Partially Paid'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}>
                      {bill.payment_status}
                    </span>
                  </div>
                </div>

                {/* Patient & Doctor Two-Column Block */}
                <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
                  <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
                    <div className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-1.5">Billed Patient</div>
                    <div className="font-bold text-sm text-slate-900">{bill.patient_name}</div>
                    <div className="text-slate-600 font-mono mt-0.5">ID: {bill.patient_code}</div>
                    <div className="text-slate-600 mt-0.5">Age/Gender: {calculateAge(bill.patient_dob)} Yrs / {bill.patient_gender}</div>
                    <div className="text-slate-600 mt-0.5">Contact: {bill.patient_phone}</div>
                    <div className="text-slate-500 mt-1 line-clamp-2">{bill.patient_address}</div>
                  </div>

                  <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
                    <div className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-1.5">Attending Medical Officer</div>
                    <div className="font-bold text-sm text-slate-900">{bill.doctor_name}</div>
                    <div className="text-slate-600 mt-0.5">{bill.specialization}</div>
                    <div className="text-slate-600 mt-0.5">Department: {bill.department}</div>
                    {bill.appointment_code && (
                      <div className="text-slate-500 mt-1">Ref APT: {bill.appointment_code}</div>
                    )}
                  </div>
                </div>

                {/* Itemized Table */}
                <div className="mb-6">
                  <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Description of Medical Service / Supply</th>
                        <th className="py-2.5 px-3 text-right">Department</th>
                        <th className="py-2.5 px-3 text-right">Amount (USD)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-2.5 px-3 font-mono text-slate-400">1</td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">Physician Clinical Consultation Fee</td>
                        <td className="py-2.5 px-3 text-right text-slate-500">{bill.department}</td>
                        <td className="py-2.5 px-3 text-right font-semibold">${Number(bill.consultation_fee).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-mono text-slate-400">2</td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">Pharmacy & Dispensed Prescription Medicines</td>
                        <td className="py-2.5 px-3 text-right text-slate-500">Pharmacy</td>
                        <td className="py-2.5 px-3 text-right font-semibold">${Number(bill.medicine_charges).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-mono text-slate-400">3</td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">Laboratory, Radiology & Diagnostics Services</td>
                        <td className="py-2.5 px-3 text-right text-slate-500">Diagnostics</td>
                        <td className="py-2.5 px-3 text-right font-semibold">${Number(bill.other_charges).toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Calculation Totals */}
                <div className="flex justify-end">
                  <div className="w-72 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal Charges:</span>
                      <span className="font-semibold">${Number(bill.subtotal).toFixed(2)}</span>
                    </div>
                    {Number(bill.tax_or_discount) !== 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Discount / Adjustment:</span>
                        <span className="font-semibold text-rose-600">${Number(bill.tax_or_discount).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                      <span>Grand Total:</span>
                      <span className="font-black text-emerald-800">${Number(bill.total_amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Amount Received ({bill.payment_method}):</span>
                      <span className="font-semibold text-emerald-600">${Number(bill.paid_amount).toFixed(2)}</span>
                    </div>
                    <div className="pt-1 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                      <span>Outstanding Balance:</span>
                      <span className={bill.balance_due > 0 ? 'text-rose-600 font-black' : 'text-slate-700'}>
                        ${Number(bill.balance_due).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {bill.notes && (
                  <div className="mt-6 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                    <strong>Payment Remarks:</strong> {bill.notes}
                  </div>
                )}
              </div>

              {/* Signatures & Footer */}
              <div className="pt-10 mt-10 border-t border-slate-200">
                <div className="flex items-end justify-between">
                  <div className="text-[10px] text-slate-400 max-w-xs">
                    <p>Official Hospital Computerized Receipt.</p>
                    <p>Thank you for trusting MetroHealth Medical Center.</p>
                  </div>
                  <div className="text-center">
                    <div className="w-48 border-b-2 border-slate-800 mb-1"></div>
                    <div className="text-xs font-bold text-slate-900">Authorized Finance Officer</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Hospital Accounts Department</div>
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

