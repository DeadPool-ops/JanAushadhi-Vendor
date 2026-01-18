// src/api/authApi.js
import apiClient from "./apiClient";

// export const baseImageUrl = "https://webdevelopercg.com/janaushadhi/myadmin/uploads/vendor/";
export const baseImageUrl = "https://www.onlineaushadhi.in/myadmin/uploads/vendor/";

export const getProfile = async ( vendorId ) => {
  const formData = new FormData();
  formData.append("M1_CODE", vendorId);

  return apiClient.post("/user_profile", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};

export const updateProfilePic = async ( vendorId, profilePhoto ) => {
  const formData = new FormData();
  formData.append("M1_CODE", vendorId);
  formData.append("M1_DC0", profilePhoto );

  return apiClient.post("/update_profile_pic", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};

export const updateProfile = async ( vendorId, ownerName, email, gender, dob, address, businessName, mobile1, mobile2, officeMail, pharmacyLicense, drugPermit, pharmacistsCertificate, GST, addressProof, shopImage  ) => {
  const formData = new FormData();
  formData.append("M1_CODE", vendorId);
  formData.append("M1_NAME", ownerName);
  formData.append("M1_IT", email);
  formData.append("M1_PM", gender);
  formData.append("M1_DT1", dob);
  formData.append("M1_ADD", address);
  formData.append("M1_BNAME", businessName);
  formData.append("M1_TEL1", mobile1);
  formData.append("M1_TEL2", mobile2);
  formData.append("M1_IT1", officeMail);
  formData.append("M1_DC1", pharmacyLicense);
  formData.append("M1_DC2", drugPermit);
  formData.append("M1_DC3", pharmacistsCertificate);
  formData.append("M1_DC4", GST);
  formData.append("M1_DC5", addressProof);
  formData.append("M1_DC6", shopImage);

  return apiClient.post("/update_profile", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};





