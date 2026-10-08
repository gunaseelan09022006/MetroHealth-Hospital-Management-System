const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('hms_token');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('hms_token', token);
  } else {
    localStorage.removeItem('hms_token');
  }
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  let data = null;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = (data && data.error) ? data.error : `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  auth: {
    login: (username, password) => request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
    me: () => request('/auth/me'),
    switchRole: (role) => request('/auth/switch-demo-role', {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),
    getUsers: () => request('/auth/users'),
  },

  // Dashboard
  dashboard: {
    getStats: () => request('/dashboard/stats'),
  },

  // Patients
  patients: {
    getAll: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/patients${q ? `?${q}` : ''}`);
    },
    getById: (id) => request(`/patients/${id}`),
    create: (patientData) => request('/patients', {
      method: 'POST',
      body: JSON.stringify(patientData),
    }),
    update: (id, patientData) => request(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patientData),
    }),
    delete: (id, permanent = false) => request(`/patients/${id}?permanent=${permanent}`, {
      method: 'DELETE',
    }),
  },

  // Doctors
  doctors: {
    getAll: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/doctors${q ? `?${q}` : ''}`);
    },
    getDepartments: () => request('/doctors/departments'),
    getById: (id) => request(`/doctors/${id}`),
    create: (data) => request('/doctors', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id, data) => request(`/doctors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id) => request(`/doctors/${id}`, {
      method: 'DELETE',
    }),
  },

  // Schedules
  schedules: {
    getAll: () => request('/schedules/all'),
    getDoctorSchedule: (doctorId) => request(`/schedules/doctor/${doctorId}`),
    getAvailableSlots: (doctorId, date) => request(`/schedules/doctor/${doctorId}/available-slots?date=${date}`),
    updateSchedule: (doctorId, schedules) => request(`/schedules/doctor/${doctorId}`, {
      method: 'POST',
      body: JSON.stringify({ schedules }),
    }),
    addLeave: (doctorId, leaveData) => request(`/schedules/doctor/${doctorId}/leaves`, {
      method: 'POST',
      body: JSON.stringify(leaveData),
    }),
    deleteLeave: (leaveId) => request(`/schedules/leaves/${leaveId}`, {
      method: 'DELETE',
    }),
  },

  // Appointments
  appointments: {
    getAll: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/appointments${q ? `?${q}` : ''}`);
    },
    getById: (id) => request(`/appointments/${id}`),
    create: (data) => request('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    updateStatus: (id, status) => request(`/appointments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
    update: (id, data) => request(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id) => request(`/appointments/${id}`, {
      method: 'DELETE',
    }),
  },

  // Prescriptions
  prescriptions: {
    getAll: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/prescriptions${q ? `?${q}` : ''}`);
    },
    getById: (id) => request(`/prescriptions/${id}`),
    create: (data) => request('/prescriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    updateStatus: (id, status) => request(`/prescriptions/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
    delete: (id) => request(`/prescriptions/${id}`, {
      method: 'DELETE',
    }),
  },

  // Billing
  billing: {
    getAll: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/billing${q ? `?${q}` : ''}`);
    },
    getById: (id) => request(`/billing/${id}`),
    create: (data) => request('/billing', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    recordPayment: (id, paymentData) => request(`/billing/${id}/payment`, {
      method: 'PUT',
      body: JSON.stringify(paymentData),
    }),
    delete: (id) => request(`/billing/${id}`, {
      method: 'DELETE',
    }),
  },

  // Search
  search: {
    query: (q) => request(`/search?q=${encodeURIComponent(q)}`),
  },
};

