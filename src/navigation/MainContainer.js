import React, { useState } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import OrdersScreen from '../screens/order/OrdersScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import BottomNavigation from '../components/common/BottomNavigation';
import StoreScreen from '../screens/products/StoreScreen';

const MainContainer = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const screens = [
    { id: 'dashboard', component: DashboardScreen },
    { id: 'orders', component: OrdersScreen },
    { id: 'store', component: StoreScreen },
    { id: 'profile', component: ProfileScreen },
  ];

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const renderActiveScreen = () => {
    const ScreenComponent = screens.find(screen => screen.id === activeTab)?.component;

    return <ScreenComponent />;
  };

  return (
    <SafeAreaView style={styles.container1}>
      <View style={styles.container}>
        <View style={styles.screensWrapper}>{renderActiveScreen()}</View>
        <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container1: {
    flex: 1,
    paddingTop: -100,
    paddingBottom: -20,
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  screensWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
});

export default MainContainer;