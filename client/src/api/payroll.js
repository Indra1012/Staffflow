import api from './axios';

export const processPayroll = (data) => api.post('/payroll/process', data);
export const getSlips = (month) => api.get(`/payroll/slips?month=${month}`);