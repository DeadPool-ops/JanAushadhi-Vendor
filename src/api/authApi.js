// src/api/authApi.js
import apiClient from "./apiClient";

// Login with mobile number
export const loginUser = async (mobile) => {
  const formData = new FormData();
  formData.append("M1_TEL", mobile);

  return apiClient.post("/user_login", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};

// Send OTP
export const sendOTP = async (code) => {
  const formData = new FormData();
  formData.append("M1_CODE", code);

  return apiClient.post("/send_otp", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};

// Verify OTP
export const verifyOTP = async (code, otp) => {
  const formData = new FormData();
  formData.append("M1_CODE", code);
  formData.append("M1_OPP", otp);

  console.log(formData);
  return apiClient.post("/verify_otp", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};
