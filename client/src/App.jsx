import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import NotificationToast from './components/NotificationToast';
import GlobalSearchModal from './components/GlobalSearchModal';

// Modals
import PatientDossierModal from './components/PatientDossierModal';
import PatientFormModal from './components/PatientFormModal';
import AppointmentModal from './components/AppointmentModal';
import PrescriptionModal from './components/PrescriptionModal';
import PrescriptionPrintModal from './components/PrescriptionPrintModal';
import BillModal from './components/BillModal';
import BillPrintModal from './components/BillPrintModal';
import PaymentModal from './components/PaymentModal';
import ScheduleModal from './components/ScheduleModal';

// Pages
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import AppointmentsPage from './pages/AppointmentsPage';
import DoctorsPage from './pages/DoctorsPage';
import PrescriptionsPage from './pages/PrescriptionsPage';
import BillingPage from './pages/BillingPage';

function HospitalApp() {
  const { user, loading } = useAuth();

  // Navigation tab: 'dashboard' | 'patients' | 'appointments' | 'doctors' | 'schedules' | 'prescriptions' | 'billing'
  const [activeTab, setActiveTab] = useState('dashboard');

  // Modal states
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [patientFormOpen, setPatientFormOpen] = useState(false);
  const [selectedPatientForEdit, setSelectedPatientForEdit] = useState(null);
  const [patientDossierId, setPatientDossierId] = useState(null);

  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [appointmentPreselectedPatientId, setAppointmentPreselectedPatientId] = useState(null);

  const [scheduleModalDocId, setScheduleModalDocId] = useState(null);

  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [prescriptionPreselectedPatientId, setPrescriptionPreselectedPatientId] = useState(null);
  const [prescriptionPrintId, setPrescriptionPrintId] = useState(null);

  const [billModalOpen, setBillModalOpen] = useState(false);
  const [billPreselectedPatientId, setBillPreselectedPatientId] = useState(null);
  const [billPrintId, setBillPrintId] = useState(null);
  const [paymentBill, setPaymentBill] = useState(null);

  // Global Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 animate-pulse flex items-center justify-center font-black text-2xl mb-4">
          +
        </div>
        <div className="text-base font-bold tracking-tight">Initializing MetroHealth System...</div>
        <div className="text-xs text-slate-400 mt-1">Connecting to clinical database</div>
      </div>
    );
  }

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onOpenGlobalSearch={() => setGlobalSearchOpen(true)}
    >
      {/* Active Page View */}
      {activeTab === 'dashboard' && (
        <DashboardPage
          onOpenPatientForm={() => {
            setSelectedPatientForEdit(null);
            setPatientFormOpen(true);
          }}
          onOpenAppointmentModal={(patientId) => {
            setAppointmentPreselectedPatientId(patientId || null);
            setAppointmentModalOpen(true);
          }}
          onOpenScheduleModal={(doctorId) => {
            setScheduleModalDocId(doctorId || 1);
          }}
          onOpenPrescriptionModal={(patientId) => {
            setPrescriptionPreselectedPatientId(patientId || null);
            setPrescriptionModalOpen(true);
          }}
          onOpenBillModal={(patientId) => {
            setBillPreselectedPatientId(patientId || null);
            setBillModalOpen(true);
          }}
          onViewPatientDossier={(patientId) => setPatientDossierId(patientId)}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />
      )}

      {activeTab === 'patients' && (
        <PatientsPage
          onOpenPatientForm={() => {
            setSelectedPatientForEdit(null);
            setPatientFormOpen(true);
          }}
          onEditPatient={(patient) => {
            setSelectedPatientForEdit(patient);
            setPatientFormOpen(true);
          }}
          onViewPatientDossier={(patientId) => setPatientDossierId(patientId)}
        />
      )}

      {activeTab === 'appointments' && (
        <AppointmentsPage
          onOpenAppointmentModal={() => {
            setAppointmentPreselectedPatientId(null);
            setAppointmentModalOpen(true);
          }}
          onViewPatientDossier={(patientId) => setPatientDossierId(patientId)}
        />
      )}

      {(activeTab === 'doctors' || activeTab === 'schedules') && (
        <DoctorsPage
          onOpenScheduleModal={(doctorId) => setScheduleModalDocId(doctorId)}
          onBookAppointmentForDoctor={(doctorId) => {
            setAppointmentModalOpen(true);
          }}
        />
      )}

      {activeTab === 'prescriptions' && (
        <PrescriptionsPage
          onOpenPrescriptionModal={() => {
            setPrescriptionPreselectedPatientId(null);
            setPrescriptionModalOpen(true);
          }}
          onPrintPrescription={(rxId) => setPrescriptionPrintId(rxId)}
          onViewPatientDossier={(patientId) => setPatientDossierId(patientId)}
        />
      )}

      {activeTab === 'billing' && (
        <BillingPage
          onOpenBillModal={() => {
            setBillPreselectedPatientId(null);
            setBillModalOpen(true);
          }}
          onPrintBill={(billId) => setBillPrintId(billId)}
          onRecordPayment={(bill) => setPaymentBill(bill)}
          onViewPatientDossier={(patientId) => setPatientDossierId(patientId)}
        />
      )}

      {/* MODALS */}

      {/* Global Search */}
      <GlobalSearchModal
        isOpen={globalSearchOpen}
        onClose={() => setGlobalSearchOpen(false)}
        onSelectPatient={(id) => setPatientDossierId(id)}
        onSelectDoctor={(id) => setActiveTab('doctors')}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

      {/* Patient Medical Dossier */}
      <PatientDossierModal
        patientId={patientDossierId}
        onClose={() => setPatientDossierId(null)}
        onOpenAppointmentModal={(pid) => {
          setAppointmentPreselectedPatientId(pid);
          setAppointmentModalOpen(true);
        }}
        onOpenPrescriptionModal={(pid) => {
          setPrescriptionPreselectedPatientId(pid);
          setPrescriptionModalOpen(true);
        }}
        onOpenBillModal={(pid) => {
          setBillPreselectedPatientId(pid);
          setBillModalOpen(true);
        }}
      />

      {/* Patient Register / Edit Form */}
      <PatientFormModal
        isOpen={patientFormOpen}
        patient={selectedPatientForEdit}
        onClose={() => {
          setPatientFormOpen(false);
          setSelectedPatientForEdit(null);
        }}
        onSaved={() => {
          // If we are on patients or dashboard, the component re-fetches
        }}
      />

      {/* Book Appointment Modal */}
      <AppointmentModal
        isOpen={appointmentModalOpen}
        preselectedPatientId={appointmentPreselectedPatientId}
        onClose={() => {
          setAppointmentModalOpen(false);
          setAppointmentPreselectedPatientId(null);
        }}
        onBooked={() => {
          if (activeTab === 'appointments') {
            // will refresh
          }
        }}
      />

      {/* Doctor Schedule & Leave Modal */}
      <ScheduleModal
        doctorId={scheduleModalDocId}
        isOpen={!!scheduleModalDocId}
        onClose={() => setScheduleModalDocId(null)}
        onUpdated={() => {
          // updated
        }}
      />

      {/* Prescription Creation Modal */}
      <PrescriptionModal
        isOpen={prescriptionModalOpen}
        preselectedPatientId={prescriptionPreselectedPatientId}
        onClose={() => {
          setPrescriptionModalOpen(false);
          setPrescriptionPreselectedPatientId(null);
        }}
        onCreated={() => {
          // created
        }}
      />

      {/* Printable Prescription Modal */}
      <PrescriptionPrintModal
        prescriptionId={prescriptionPrintId}
        onClose={() => setPrescriptionPrintId(null)}
      />

      {/* Bill Creation Modal */}
      <BillModal
        isOpen={billModalOpen}
        preselectedPatientId={billPreselectedPatientId}
        onClose={() => {
          setBillModalOpen(false);
          setBillPreselectedPatientId(null);
        }}
        onCreated={() => {
          // created
        }}
      />

      {/* Printable Invoice Modal */}
      <BillPrintModal
        billId={billPrintId}
        onClose={() => setBillPrintId(null)}
      />

      {/* Record Payment Modal */}
      <PaymentModal
        bill={paymentBill}
        isOpen={!!paymentBill}
        onClose={() => setPaymentBill(null)}
        onPaid={() => {
          // paid
        }}
      />

      {/* Toast Notification Container */}
      <NotificationToast />
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HospitalApp />
    </AuthProvider>
  );
}
