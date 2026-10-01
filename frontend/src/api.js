const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') + '/api';

export const api = {
  // Get calculated bill for a month
  async getBill(month, year) {
    const res = await fetch(`${API_BASE}/bill/?month=${month}&year=${year}`);
    if (!res.ok) throw new Error('Failed to load monthly bill');
    return res.json();
  },

  // Get current or suggested prices
  async getPriceSettings(month, year) {
    const res = await fetch(`${API_BASE}/prices/current_or_suggested/?month=${month}&year=${year}`);
    if (!res.ok) throw new Error('Failed to load price settings');
    return res.json();
  },

  // Save/update prices for a month
  async savePrices(month, year, lunch_price, dinner_price) {
    const res = await fetch(`${API_BASE}/prices/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        month: parseInt(month, 10),
        year: parseInt(year, 10),
        lunch_price: parseFloat(lunch_price),
        dinner_price: parseFloat(dinner_price),
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save prices');
    }
    return res.json();
  },

  // Save attendance for a specific date
  async saveAttendance(dateStr, lunch_taken, dinner_taken, note = '') {
    const res = await fetch(`${API_BASE}/attendance/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: dateStr,
        lunch_taken,
        dinner_taken,
        note,
      }),
    });
    if (!res.ok) throw new Error('Failed to save attendance');
    return res.json();
  },

  // Fast toggle a single meal
  async toggleMeal(dateStr, meal, taken = null) {
    const res = await fetch(`${API_BASE}/attendance/toggle/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: dateStr,
        meal,
        taken,
      }),
    });
    if (!res.ok) throw new Error('Failed to toggle meal');
    return res.json();
  },

  // Toggle or update payment
  async updatePayment(month, year, is_paid = null, payment_method = 'UPI', payment_note = '') {
    const res = await fetch(`${API_BASE}/bill/toggle-payment/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        month: parseInt(month, 10),
        year: parseInt(year, 10),
        is_paid,
        payment_method,
        payment_note,
      }),
    });
    if (!res.ok) throw new Error('Failed to update payment');
    return res.json();
  },

  // Get past history
  async getHistory() {
    const res = await fetch(`${API_BASE}/history/`);
    if (!res.ok) throw new Error('Failed to load history');
    return res.json();
  },

  // Seed demo data
  async seedDemo(month, year) {
    const res = await fetch(`${API_BASE}/seed/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month, year }),
    });
    if (!res.ok) throw new Error('Failed to seed demo data');
    return res.json();
  },

  getExportCsvUrl(month, year) {
    return `${API_BASE}/export/csv/?month=${month}&year=${year}`;
  },
};
