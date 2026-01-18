import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { ThemeContext } from '../../context/ThemeContext';
import { partnerDeliveryTheme } from '../../theme/partnerDeliveryTheme';

const PartnerDeliveryTrackingScreen = ({ route, navigation }) => {
  const { order } = route.params;

  const { theme } = useContext(ThemeContext);
  const colors = partnerDeliveryTheme[theme];
  const isDark = theme === 'dark';

  /* ---------------- Dummy Live Location ---------------- */
  const [partnerLocation, setPartnerLocation] = useState({
    latitude: 22.719,
    longitude: 75.857,
  });

  const customerLocation = {
    latitude: Number(order.latitude) || 22.7196,
    longitude: Number(order.longitude) || 75.8577,
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setPartnerLocation(prev => ({
        latitude: prev.latitude + (Math.random() - 0.5) * 0.0007,
        longitude: prev.longitude + (Math.random() - 0.5) * 0.0007,
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.headerBg}
      />

      {/* HEADER */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.headerBg,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.backButton,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, { color: colors.text }]}>←</Text>
        </TouchableOpacity>

        <View
          style={[
            styles.titlePill,
            { backgroundColor: colors.pillBg, borderColor: colors.pillBorder },
          ]}
        >
          <Text style={[styles.titleText, { color: colors.primary }]}>
            Partner Delivery
          </Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* STATUS */}
        <View
          style={[
            styles.statusBanner,
            {
              backgroundColor: colors.statusBg,
              borderColor: colors.statusBorder,
            },
          ]}
        >
          <Text style={styles.statusIcon}>🚚</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.statusTitle, { color: colors.text }]}>
              Partner Assigned
            </Text>
            <Text style={[styles.statusSubtitle, { color: colors.subText }]}>
              Tracking delivery partner in real time
            </Text>
          </View>
        </View>

        {/* MAP */}
        <View style={styles.mapSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            🗺️ Live Delivery Route
          </Text>

          <View style={[styles.mapWrapper, { borderColor: colors.border }]}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={{
                latitude: customerLocation.latitude,
                longitude: customerLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={partnerLocation}
                pinColor={isDark ? 'orange' : '#EA580C'}
                title="Delivery Partner"
              />

              <Marker
                coordinate={customerLocation}
                pinColor={isDark ? 'red' : '#DC2626'}
                title="Customer"
                description={order.customerAddress}
              />
            </MapView>
          </View>

          {/* PARTNER CARD */}
          <View
            style={[
              styles.partnerCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.partnerTitle, { color: colors.primary }]}>
              Delivery Partner
            </Text>

            <Text style={[styles.partnerName, { color: colors.text }]}>
              Suresh Kumar (Dummy)
            </Text>
            <Text style={[styles.partnerPhone, { color: colors.subText }]}>
              📞 +91 98765 43210
            </Text>

            <Text style={[styles.etaText, { color: colors.eta }]}>
              ETA: 12–18 mins
            </Text>
          </View>
        </View>

        {/* ORDER SUMMARY */}
        <View
          style={[
            styles.orderCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            📦 Order Summary
          </Text>

          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.subText }]}>
              Order Number:
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {order.orderNumber}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.subText }]}>
              Payment:
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {order.paymentMode}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.subText }]}>
              Total Amount:
            </Text>
            <Text style={[styles.amount, { color: colors.primary }]}>
              ₹{order.totalAmount}
            </Text>
          </View>

          <View style={styles.rowAddress}>
            <Text style={[styles.label, { color: colors.subText }]}>
              Delivery Address:
            </Text>
            <Text style={[styles.address, { color: colors.text }]}>
              {order.customerAddress}
            </Text>
          </View>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default PartnerDeliveryTrackingScreen;

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 16 },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },

  backButtonText: {
    fontSize: 20,
    marginBottom: 4,
  },

  titlePill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },

  titleText: {
    fontSize: 16,
    fontWeight: '600',
  },

  statusBanner: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 18,
    borderWidth: 1,
  },

  statusIcon: { fontSize: 34, marginRight: 12 },

  statusTitle: { fontSize: 16, fontWeight: '700' },

  statusSubtitle: { fontSize: 13 },

  mapSection: { marginBottom: 20 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },

  mapWrapper: {
    height: 280,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },

  map: { flex: 1 },

  partnerCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },

  partnerTitle: {
    fontSize: 15,
    marginBottom: 6,
    fontWeight: '600',
  },

  partnerName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },

  partnerPhone: {
    marginBottom: 8,
  },

  etaText: {
    fontWeight: '700',
  },

  orderCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  rowAddress: { marginBottom: 10 },

  label: { fontSize: 14 },

  value: { fontSize: 14, fontWeight: '600' },

  amount: { fontSize: 18, fontWeight: '700' },

  address: { marginTop: 4, lineHeight: 18 },
});
