import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Stethoscope,
  Clock,
  FileText,
  CreditCard,
  Search,
  Bell,
  Menu,
  X,
  ChevronDown,
  Shield,
  HeartPulse,
  LogOut,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout({
  children,
  activeTab,
  setActiveTab,
  onOpenGlobalSearch,
  onQuickAction,
}) {
  const { user, switchRole, logout, hasPermission } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'doctors', label: 'Doctors', icon: Stethoscope },
    { id: 'schedules', label: 'Doctor Schedules', icon: Clock },
    { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
    { id: 'billing', label: 'Billing & Invoices', icon: CreditCard },
  ];

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  const handleRoleSwitch = async (role) => {
    setRoleDropdownOpen(false);
    await switchRole(role);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row antialiased text-slate-800">
      
      {/* Mobile Top Header */}
      <header className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 border-b border-slate-800 no-print">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white shadow-xs">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold tracking-tight text-base">MetroHealth</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenGlobalSearch}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 md:static shrink-0 no-print ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 flex items-center gap-3 border-b border-slate-800/80">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center font-black text-white shadow-md shadow-indigo-600/30 shrink-0">
            <HeartPulse className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-white text-base tracking-tight leading-tight">MetroHealth</h1>
            <p className="text-[11px] text-indigo-400 font-medium">Hospital Management</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isAccessible = hasPermission(item.id, 'view');

            if (!isAccessible) return null;

            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Role Switcher Pill Bar */}
        <div className="p-3 bg-slate-950/60 border-t border-slate-800/80 text-xs">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 px-1 mb-2 flex items-center justify-between">
            <span>Demo Role Switcher</span>
            <Shield className="w-3 h-3 text-indigo-400" />
          </div>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => handleRoleSwitch('admin')}
              className={`py-1.5 px-1 text-center rounded-lg font-bold text-[11px] transition-colors ${
                user?.role === 'admin'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Admin: Full System Access"
            >
              Admin
            </button>
            <button
              onClick={() => handleRoleSwitch('doctor')}
              className={`py-1.5 px-1 text-center rounded-lg font-bold text-[11px] transition-colors ${
                user?.role === 'doctor'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Doctor: Patients, Appointments, Schedules, Prescriptions"
            >
              Doctor
            </button>
            <button
              onClick={() => handleRoleSwitch('receptionist')}
              className={`py-1.5 px-1 text-center rounded-lg font-bold text-[11px] transition-colors ${
                user?.role === 'receptionist'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Receptionist: Patients, Appointments, Billing"
            >
              Staff
            </button>
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
              user?.role === 'admin' ? 'bg-indigo-600' :
              user?.role === 'doctor' ? 'bg-emerald-600' :
              'bg-amber-600'
            }`}>
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-white truncate">{user?.name || 'Authorized Staff'}</div>
              <div className="text-[10px] text-slate-400 capitalize flex items-center gap-1">
                <span>{user?.role}</span>
                {user?.doctor?.specialization && <span>&bull; {user.doctor.specialization}</span>}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Desktop Navigation Header */}
        <header className="hidden md:flex bg-white border-b border-slate-200 px-6 py-3 items-center justify-between sticky top-0 z-30 shadow-2xs no-print">
          
          {/* Global Search Bar */}
          <div className="w-96">
            <button
              onClick={onOpenGlobalSearch}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-400 text-xs transition-colors group"
            >
              <span className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                <span className="text-slate-500 font-medium">Quick search patients, doctors, bills...</span>
              </span>
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 text-[10px] font-mono text-slate-500 shadow-2xs">
                Ctrl K
              </kbd>
            </button>
          </div>

          {/* Right Header Badges */}
          <div className="flex items-center gap-4">
            
            {/* Notifications Popover */}
            <div className="relative">
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                title="Hospital Alerts"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
              </button>

              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-scale-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                    <span className="text-xs font-bold text-slate-800">Hospital System Alerts</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold">Live System</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="font-semibold text-slate-800">4 Appointments Today</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">Cardiology and General Medicine active on OPD floor.</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900">
                      <div className="font-semibold text-amber-800">Doctor Leave Notice</div>
                      <div className="text-amber-700 text-[11px] mt-0.5">Dr. James Wilson registered upcoming medical conference leave.</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900">
                      <div className="font-semibold text-emerald-800">Billing Cleared</div>
                      <div className="text-emerald-700 text-[11px] mt-0.5">Invoice INV-2026-1001 settled in full via terminal.</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Active Role Indicator */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <span className="text-xs text-slate-400">Current Role:</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                user?.role === 'admin' ? 'bg-indigo-100 text-indigo-800' :
                user?.role === 'doctor' ? 'bg-emerald-100 text-emerald-800' :
                'bg-amber-100 text-amber-800'
              }`}>
                {user?.role}
              </span>
            </div>

            {/* User Avatar & Name */}
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                user?.role === 'admin' ? 'bg-indigo-600' :
                user?.role === 'doctor' ? 'bg-emerald-600' :
                'bg-amber-600'
              }`}>
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="text-xs">
                <div className="font-semibold text-slate-800">{user?.name}</div>
              </div>
            </div>

          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Backdrop for mobile sidebar */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-30 md:hidden"
        />
      )}
    </div>
  );
}

