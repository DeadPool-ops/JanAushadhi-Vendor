import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import {
  NotificationProvider,
  useNotification,
} from './src/context/NotificationContext';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import NotificationService from './src/utils/NotificationService';
import OrderNotificationModal from './src/components/OrderNotificationModal';
import { useNavigation } from '@react-navigation/native';

function AppContent() {
  const { modalVisible, orderData, hideOrderPopup, showOrderPopup } =
    useNotification();

  async function createNotificationChannel() {
    await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    });
  }

  useEffect(() => {
    const initializeNotifications = async () => {
      const hasPermission = await NotificationService.requestUserPermission();

      if (hasPermission) {
        const token = await NotificationService.getFCMToken();
        console.log('FCM TOKEN:', token);

        // Pass showOrderPopup to notification service
        NotificationService.setupNotificationListeners(showOrderPopup);
      }
    };

    initializeNotifications();
    createNotificationChannel();
  }, []);

  const handleViewOrder = () => {
    hideOrderPopup();
    // Navigate to order details
    // navigation.navigate('OrderDetails', { orderId: orderData?.orderId });
  };

  return (
    <>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>

      <OrderNotificationModal
        visible={modalVisible}
        onClose={hideOrderPopup}
        onAccept={handleViewOrder}
        orderData={orderData}
      />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <SafeAreaProvider>
            <AppContent />
          </SafeAreaProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
