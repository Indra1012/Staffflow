import api from './axios';

export const getTransactions = (params) => api.get('/transactions', { params });
export const addTransaction = (data) => api.post('/transactions', data);