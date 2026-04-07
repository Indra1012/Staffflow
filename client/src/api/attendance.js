import api from './axios';

export const getAttendance = (month) => api.get(`/attendance?month=${month}`);
export const markAttendance = (data) => api.post('/attendance', data);
export const bulkAttendance = (data) => api.post('/attendance/bulk', data);