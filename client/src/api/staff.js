import api from './axios';

export const getStaff = () => api.get('/staff');
export const addStaff = (data) => api.post('/staff', data);
export const updateStaff = (id, data) => api.put(`/staff/${id}`, data);
export const deleteStaff = (id) => api.delete(`/staff/${id}`);
export const setStaffCredentials = (id, data) => api.put(`/staff/${id}/credentials`, data);