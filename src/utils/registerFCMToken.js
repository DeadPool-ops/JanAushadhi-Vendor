import messaging from '@react-native-firebase/messaging';
import apiClient from '../api/apiClient';

export const registerFCMToken = async (userId) => {
  try {
    if (!userId) return;

    // Request permission (Android 13+ safe)
    await messaging().requestPermission();

    const token = await messaging().getToken();
    if (!token) return;

    console.log('FCM TOKEN:', token);

    const formData = new FormData();
    formData.append('M1_CODE', userId);
    formData.append('M1_PACC', token);

    apiClient.post('/update_vendor_fcm_token', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

  } catch (error) {
    console.log('FCM registration error:', error);
  }
};
