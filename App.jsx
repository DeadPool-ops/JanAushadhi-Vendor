import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import NotificationService from './src/utils/NotificationService';

export default function App() {

  useEffect(() => {
    const initializeNotifications = async () => {
      // Request permission
      const hasPermission = await NotificationService.requestUserPermission();

      if (hasPermission) {
        // Get FCM token
        const token = await NotificationService.getFCMToken();

        console.log('FCM TOKEN:', token);

        // Setup listeners
        NotificationService.setupNotificationListeners();

        // Send token to your backend server
        // sendTokenToServer(token);
      }
    };

    initializeNotifications();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <SafeAreaProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}