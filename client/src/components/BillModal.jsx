import React, { useState, useEffect } from 'react';
import { X, CreditCard, Calculator, CheckCircle2, User, Stethoscope, Loader2 } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function BillModal({ isOpen, onClose, preselectedPatientId = null, onCreated }) {
  const { addToast } = useAuth();

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [billDate, setBillDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Financial values
  const [consultationFee, setConsultationFee] = useState(50);
  const [medicineCharges, setMedicineCharges] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);
  const [taxOrDiscount, setTaxOrDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    async function loadData() {
      try {
        const [patientsRes, doctorsRes] = await Promise.all([
          api.patients.getAll({ status: 'active' }),
          api.doctors.getAll({ status: 'active' }),
        ]);

        setPatients(patientsRes);
        setDoctors(doctorsRes);

        if (preselectedPatientId) {
          setPatientId(preselectedPatientId.toString());
        } else if (patientsRes.length > 0) {
          setPatientId(patientsRes[0].id.toString());
        }

        if (doctorsRes.length > 0) {
          setDoctorId(doctorsRes[0].id.toString());
          setConsultationFee(doctorsRes[0].consultation_fee || 50);
        }
      } catch (err) {
        console.error('Failed to load data for billing:', err);
      }
    }

    loadData();
  }, [isOpen, preselectedPatientId]);

  // When doctor changes, auto-fill consultation fee
  const handleDoctorChange = (id) => {
    setDoctorId(id);
    const doc = doctors.find((d) => d.id === parseInt(id));
    if (doc) {
      setConsultationFee(doc.consultation_fee || 50);
    }
  };

  if (!isOpen) return null;

  // Automated Calculations
  const cFee = parseFloat(consultationFee) || 0;
  const mCharges = parseFloat(medicineCharges) || 0;
  const oCharges = parseFloat(otherCharges) || 0;
  const adj = parseFloat(taxOrDiscount) || 0;
  const pAmount = parseFloat(paidAmount) || 0;

  const subtotal = cFee + mCharges + oCharges;
  const totalAmount = Math.max(0, subtotal + adj);
  const balanceDue = Math.max(0, totalAmount - pAmount);

  let calculatedStatus = 'Pending';
  if (pAmount >= totalAmount && totalAmount > 0) {
    calculatedStatus = 'Paid';
  } else if (pAmount > 0 && pAmount < totalAmount) {
    calculatedStatus = 'Partially Paid';
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!patientId || !doctorId) {
      addToast('Patient and Doctor must be selected', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.billing.create({
        patient_id: parseInt(patientId),
        doctor_id: parseInt(doctorId),
        consultation_fee: cFee,
        medicine_charges: mCharges,
        other_charges: oCharges,
        tax_or_discount: adj,
        payment_method: paymentMethod,
        paid_amount: pAmount,
        bill_date: billDate,
        notes: notes.trim(),
      });

      addToast('Hospital invoice generated successfully!', 'success');
      onCreated();
      onClose();
    } catch (err) {
      addToast(err.message || 'Failed to generate bill', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Generate Hospital Bill & Invoice</h3>
              <p className="text-xs text-slate-500">Calculate medical fees, diagnostics, medications, and record payments</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Patient */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Patient <span className="text-rose-500">*</span>
              </label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.patient_code})
                  </option>
                ))}
              </select>
            </div>

            {/* Doctor */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-slate-400" /> Attending Physician <span className="text-rose-500">*</span>
              </label>
              <select
                value={doctorId}
                onChange={(e) => handleDoctorChange(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} &bull; {d.department} (${d.consultation_fee})
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Invoice Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card (Credit/Debit)</option>
                <option value="UPI">UPI / Digital Wallet</option>
              </select>
            </div>
          </div>

          {/* Charges Grid */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-emerald-600" /> Itemized Charges ($)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-600 font-medium">Doctor Consultation Fee ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium">Pharmacy / Medicine Charges ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={medicineCharges}
                  onChange={(e) => setMedicineCharges(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium">Other Lab / Diagnostics Charges ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={otherCharges}
                  onChange={(e) => setOtherCharges(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium">Discount (-) or Tax (+) Adjustment ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={taxOrDiscount}
                  onChange={(e) => setTaxOrDiscount(e.target.value)}
                  placeholder="-10.00 or 5.00"
                  className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                />
              </div>
            </div>

            {/* Live Calculation Preview Banner */}
            <div className="pt-3 border-t border-slate-200/80 bg-white p-3 rounded-lg border border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Subtotal:</span>
                <strong className="text-slate-800 text-sm">${subtotal.toFixed(2)}</strong>
              </div>
              <div className="border-x border-slate-100">
                <span className="text-slate-400 block text-[10px]">Net Grand Total:</span>
                <strong className="text-emerald-700 text-sm font-black">${totalAmount.toFixed(2)}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Computed Status:</span>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                  calculatedStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                  calculatedStatus === 'Partially Paid' ? 'bg-amber-100 text-amber-800' :
                  'bg-rose-100 text-rose-800'
                }`}>
                  {calculatedStatus}
                </span>
              </div>
            </div>

            {/* Payment Received Input */}
            <div className="pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Amount Paid Now ($):</label>
                <button
                  type="button"
                  onClick={() => setPaidAmount(totalAmount)}
                  className="text-[11px] text-emerald-600 hover:text-emerald-800 font-semibold underline"
                >
                  Pay Full (${totalAmount.toFixed(2)})
                </button>
              </div>
              <input
                type="number"
                min="0"
                max={totalAmount}
                step="0.01"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="w-full mt-1 px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 font-bold text-slate-800"
              />
              <div className="flex items-center justify-between text-xs mt-1 text-slate-500">
                <span>Remaining Balance Due:</span>
                <strong className={balanceDue > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
                  ${balanceDue.toFixed(2)}
                </strong>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Billing Remarks / Reference Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Cleared at front desk terminal #2"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
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
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Issue Invoice
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

