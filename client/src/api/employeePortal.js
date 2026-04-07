import axios from 'axios';

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/staff';

const getToken = () => localStorage.getItem('token');

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${getToken()}` },
});

export const staffLogin = (email, password) =>
  axios.post(`${BASE}/login`, { email, password });

export const getMyProfile = () =>
  axios.get(`${BASE}/me`, authHeaders());

export const getMyAttendance = (month) =>
  axios.get(`${BASE}/me/attendance?month=${month}`, authHeaders());

export const getMySlips = () =>
  axios.get(`${BASE}/me/slips`, authHeaders());

export const getMyLedger = () =>
  axios.get(`${BASE}/me/ledger`, authHeaders());

export const changeMyPassword = (currentPassword, newPassword) =>
  axios.put(`${BASE}/me/password`, { currentPassword, newPassword }, authHeaders());
