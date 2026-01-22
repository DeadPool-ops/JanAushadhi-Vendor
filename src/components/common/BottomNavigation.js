import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

const BottomNavigation = ({ activeTab, onTabChange }) => {
  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      <View style={styles.pillContainer}>
        {/* Dashboard */}
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'dashboard' && styles.tabButtonActive,
          ]}
          onPress={() => onTabChange('dashboard')}
        >
          <Feather
            name="home"
            size={24}
            color={activeTab === 'dashboard' ? '#2563EB' : '#E5E7EB'}
          />
        </TouchableOpacity>

        {/* Orders */}
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'orders' && styles.tabButtonActive,
          ]}
          onPress={() => onTabChange('orders')}
        >
          <Feather
            name="shopping-cart"
            size={24}
            color={activeTab === 'orders' ? '#2563EB' : '#E5E7EB'}
          />
        </TouchableOpacity>

        {/* StoreScreen */}
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'store' && styles.tabButtonActive,
          ]}
          onPress={() => onTabChange('store')}
        >
          <Feather
            name="package"
            size={24}
            color={activeTab === 'store' ? '#2563EB' : '#E5E7EB'}
          />
        </TouchableOpacity>

        {/* Profile */}
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'profile' && styles.tabButtonActive,
          ]}
          onPress={() => onTabChange('profile')}
        >
          <Feather
            name="user-check"
            size={24}
            color={activeTab === 'profile' ? '#2563EB' : '#E5E7EB'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingEnd: 20,
    paddingStart: 20,
  },

  pillContainer: {
    flexDirection: 'row',
    backgroundColor: '#2563EB',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,

    // Floating + shadow
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.20,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },

  tabButton: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Small white circle highlight behind active icon
  tabButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 18,
  },
});

export default BottomNavigation;
