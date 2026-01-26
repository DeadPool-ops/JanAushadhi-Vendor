import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';

class NotificationService {
  async requestUserPermission() {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      return enabled;
    } else {
      // Android 13+ requires runtime permission
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    }
  }

  async getFCMToken() {
    try {
      const token = await messaging().getToken();
      console.log('FCM Token:', token);
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  setupNotificationListeners() {
    // Foreground messages
    messaging().onMessage(async remoteMessage => {
      console.log('Foreground notification:', remoteMessage);
      // Handle notification when app is in foreground
      // You can show a custom alert or notification here
    });

    // Background/Quit state messages
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Background notification:', remoteMessage);
    });

    // Notification opened app from background state
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification opened app from background:', remoteMessage);
      // Navigate to specific screen if needed
    });

    // Notification opened app from quit state
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log(
            'Notification opened app from quit state:',
            remoteMessage,
          );
          // Navigate to specific screen if needed
        }
      });

    // Token refresh listener
    messaging().onTokenRefresh(token => {
      console.log('FCM Token refreshed:', token);
      // Send updated token to your server
    });
  }
}

export default new NotificationService();
