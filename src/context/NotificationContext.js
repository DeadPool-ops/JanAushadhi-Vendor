import React, { createContext, useState, useContext } from 'react';
import { Vibration } from 'react-native';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [orderData, setOrderData] = useState(null);

  const showOrderPopup = data => {
    setOrderData(data);
    setModalVisible(true);
    Vibration.vibrate([0, 500, 200, 500]); // Vibrate pattern
  };

  const hideOrderPopup = () => {
    setModalVisible(false);
    setOrderData(null);
  };

  return (
    <NotificationContext.Provider
      value={{
        modalVisible,
        orderData,
        showOrderPopup,
        hideOrderPopup,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
