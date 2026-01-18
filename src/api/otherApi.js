// src/api/authApi.js
import apiClient from "./apiClient";

// export const baseImageUrl = "https://webdevelopercg.com/janaushadhi/myadmin/uploads/product/";
export const baseImageUrl = "https://www.onlineaushadhi.in/myadmin/uploads/product/";

//Get the Products for the list
export const getProductList = async () => {

  return apiClient.post("/product_list", {
    headers: { "Content-Type": "multipart/form-data" }
  });
};

export const getOrderList = async ( vendorId, orderType ) => {
  const formData = new FormData();
  formData.append("F4_PARTY1", vendorId);
  formData.append("F4_BT", orderType); //Placed,Accept,Delivery Partner Assigned,Out For Delivery,Delivered

  console.log('getOrerList FormData : ', formData);
  return apiClient.post("/order_list", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};

export const acceptIncomingOrder = async ( vendorId, orderId, status, selfDelivery ) => {
  const formData = new FormData();
  formData.append("M1_CODE", vendorId);
  formData.append("F4_NO", orderId);
  formData.append("F4_BT", status);
  formData.append("F4_STAT", selfDelivery);

  console.log(formData);
  return apiClient.post("/accept_order", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};

export const outForSelfDelivery = async ( vendorId, orderId ) => {
  const formData = new FormData();
  formData.append("M1_CODE", vendorId);
  formData.append("F4_NO", orderId);

  const response =  apiClient.post("/out_for_self_delivery", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });

  return response;
};

export const orderDelivered = async ( vendorId, orderId ) => {
  const formData = new FormData();
  formData.append("M1_CODE", vendorId);
  formData.append("F4_NO", orderId);

  return apiClient.post("/self_order_delivered", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};