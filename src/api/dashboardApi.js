// src/api/authApi.js
import apiClient from './apiClient';

export const getDashboardData = async vendorId => {
  const formData = new FormData();
  formData.append('M1_CODE', vendorId);

  return apiClient.post('/dashboard_data', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
