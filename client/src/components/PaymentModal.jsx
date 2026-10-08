import React, { useState } from 'react';
import { X, CreditCard, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function PaymentModal({ bill, isOpen, onClose, onPaid }) {
  const { addToast } = useAuth();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !bill) return null;

  const handlePayFull = () => {
    setAmount(bill.balance_due.toString());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payNum = parseFloat(amount);
    if (!payNum || payNum <= 0) {
      addToast('Please enter a valid payment amount', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.billing.recordPayment(bill.id, {
        amount: payNum,
        payment_method: paymentMethod,
      });

      addToast(`Payment of $${payNum.toFixed(2)} recorded successfully!`, 'success');
      onPaid();
      onClose();
    } catch (err) {
      addToast(err.message || 'Payment recording failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-scale-in">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-base">Record Payment</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice:</span>
              <strong className="text-slate-800 font-mono">{bill.bill_code}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Patient:</span>
              <strong className="text-slate-800">{bill.patient_name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Invoiced:</span>
              <strong className="text-slate-800">${Number(bill.total_amount).toFixed(2)}</strong>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200 text-sm">
              <span className="text-rose-700 font-semibold">Balance Due:</span>
              <strong className="text-rose-700 font-black">${Number(bill.balance_due).toFixed(2)}</strong>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Payment Amount ($)</label>
              <button
                type="button"
                onClick={handlePayFull}
                className="text-[11px] text-emerald-600 font-bold hover:underline"
              >
                Full Balance (${Number(bill.balance_due).toFixed(2)})
              </button>
            </div>
            <input
              type="number"
              min="0.01"
              max={bill.balance_due}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
            >
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="UPI">UPI / Digital Wallet</option>
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !amount}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Recording...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Confirm Payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

