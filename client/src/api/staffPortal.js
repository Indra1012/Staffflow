import api from './axios';

export const getMyProfile    = ()        => api.get('/staff-portal/me');
export const getMyAttendance = (month)   => api.get(`/staff-portal/attendance?month=${month}`);
export const getMyLedger     = ()        => api.get('/staff-portal/ledger');
export const getMyPayslips   = ()        => api.get('/staff-portal/payslips');
