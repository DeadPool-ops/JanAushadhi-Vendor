// src/api/apiClient.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: "https://www.onlineaushadhi.in/myadmin/VendorApis",
  // baseURL: "https://webdevelopercg.com/janaushadhi/myadmin/VendorApis",
  timeout: 10000,
});

export default apiClient;
