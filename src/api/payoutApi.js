// src/api/payoutApi.js
import apiClient from './apiClient';

export const getAllTransaction = async vendorId => {
  const formData = new FormData();
  formData.append('M1_CODE', vendorId);

  return apiClient.post('/get_all_transaction', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getAllWithdrawalTransaction = async vendorId => {
  const formData = new FormData();
  formData.append('M1_CODE', vendorId);

  return apiClient.post('/get_all_withdrawal_transaction', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getAllPayoutTransaction = async vendorId => {
  const formData = new FormData();
  formData.append('M1_CODE', vendorId);

  return apiClient.post('/get_all_payout_transaction', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getAllCommissionTransaction = async vendorId => {
  const formData = new FormData();
  formData.append('M1_CODE', vendorId);

  return apiClient.post('/get_all_commission_transaction', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const sendWithdrawalRequest = async (vendorId, amount) => {
  const formData = new FormData();
  formData.append('M1_CODE', vendorId);
  formData.append('F5_AMT', amount);

  return apiClient.post('/send_withdrawal_request', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

