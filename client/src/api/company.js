import api from './axios';

export const getCompany = () => api.get('/company');
export const updateCompany = (data) => api.put('/company', data);