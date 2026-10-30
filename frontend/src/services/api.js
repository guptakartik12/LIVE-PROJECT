const API_BASE = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ? 'http://localhost:5001/api'
  : '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('parkease_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const handleResponse = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }
  return data;
};

export const api = {
  // Auth
  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },

  async register(userData) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return handleResponse(res);
  },

  async getProfile() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async updateProfile(profileData) {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData)
    });
    return handleResponse(res);
  },

  async upgradeMembership() {
    const res = await fetch(`${API_BASE}/auth/upgrade-membership`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Parking Floors & Slots
  async getFloors(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/parking/floors?${query}`);
    return handleResponse(res);
  },

  async getLocations() {
    const res = await fetch(`${API_BASE}/parking/locations`);
    return handleResponse(res);
  },

  async getFloorSlots(floorKey, params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/parking/floors/${floorKey}/slots?${query}`);
    return handleResponse(res);
  },

  // Bookings
  async createBooking(bookingData) {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(bookingData)
    });
    return handleResponse(res);
  },

  async getMyBookings() {
    const res = await fetch(`${API_BASE}/bookings/my`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async getBookingById(id) {
    const res = await fetch(`${API_BASE}/bookings/${id}`);
    return handleResponse(res);
  },

  async cancelBooking(id) {
    const res = await fetch(`${API_BASE}/bookings/${id}/cancel`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async extendBooking(id, extraHours) {
    const res = await fetch(`${API_BASE}/bookings/${id}/extend`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ extraHours })
    });
    return handleResponse(res);
  },

  // Gate Operations
  async verifyQR(qrData, bookingId) {
    const res = await fetch(`${API_BASE}/gate/verify-qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrData, bookingId })
    });
    return handleResponse(res);
  },

  async gateEntry(bookingId, gateName) {
    const res = await fetch(`${API_BASE}/gate/entry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, gateName })
    });
    return handleResponse(res);
  },

  async gateExit(bookingId, gateName) {
    const res = await fetch(`${API_BASE}/gate/exit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, gateName })
    });
    return handleResponse(res);
  },

  // Payment
  async createPaymentOrder(amount, receipt) {
    const res = await fetch(`${API_BASE}/payment/create-order`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ amount, receipt })
    });
    return handleResponse(res);
  },

  async verifyPaymentSignature(paymentDetails) {
    const res = await fetch(`${API_BASE}/payment/verify-signature`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(paymentDetails)
    });
    return handleResponse(res);
  },

  // Recommendations
  async getRecommendations(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/recommendations?${query}`);
    return handleResponse(res);
  },

  // Notifications
  async getNotifications() {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async markNotificationRead(id = 'all') {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Admin
  async getAdminStats() {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async getAdminCharts() {
    const res = await fetch(`${API_BASE}/admin/charts`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async toggleSlotMaintenance(slotId, isUnderMaintenance, maintenanceReason) {
    const res = await fetch(`${API_BASE}/admin/slots/${slotId}/maintenance`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ isUnderMaintenance, maintenanceReason })
    });
    return handleResponse(res);
  },

  async updateFloorPrice(floorKey, hourlyRate) {
    const res = await fetch(`${API_BASE}/admin/floors/${floorKey}/price`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ hourlyRate })
    });
    return handleResponse(res);
  },

  async getAdminBookings(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/admin/bookings?${query}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async getAdminUsers() {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async resetAllData() {
    const res = await fetch(`${API_BASE}/admin/reset-data`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  }
};
