// src/navigation/AppNavigator.js
import React, { useContext } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthContext } from "../context/AuthContext";

import AuthNavigator from './AuthNavigator';
import MainContainer from './MainContainer';
import OrderDetailScreen from '../screens/products/OrderDetailScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import SelfDeliveryOrderScreen from '../screens/order/SelfDeliveryOrderScreen';
import PartnerDeliveryTrackingScreen from '../screens/order/PartnerDeliveryTrackingScreen';
import CompletedOrderDetailScreen from '../screens/order/CompletedOrderDetailScreen';
import PayoutScreen from '../screens/payout/PayoutScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) return null; // splash or loader

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="Main" component={MainContainer} />
          <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="SelfDeliveryOrder" component={SelfDeliveryOrderScreen} />
          <Stack.Screen name="PartnerDeliveryTracking" component={PartnerDeliveryTrackingScreen} options={{ headerShown: false }} />
          <Stack.Screen name="CompletedOrderDetail" component={CompletedOrderDetailScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Payout" component={PayoutScreen} options={{ headerShown: false }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Auth" component={AuthNavigator} />
        </>
      )}
    </Stack.Navigator>
  );
}
