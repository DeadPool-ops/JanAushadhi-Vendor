import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemeContext } from '../../context/ThemeContext';
import { completedOrderTheme } from '../../theme/completedOrderTheme';

const CompletedOrderDetailScreen = ({ route, navigation }) => {
  const { order } = route.params;

  console.log(order);
  const { theme } = useContext(ThemeContext);
  const colors = completedOrderTheme[theme];
  const isDark = theme === 'dark';

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
            {
              backgroundColor: colors.pillBg,
              borderColor: colors.pillBorder,
            },
          ]}
        >
          <Text style={[styles.titleText, { color: colors.primary }]}>
            Completed Order
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
          <Text style={styles.statusIcon}>✅</Text>
          <View>
            <Text style={[styles.statusTitle, { color: colors.text }]}>
              Order Delivered
            </Text>
            <Text style={[styles.statusSubtitle, { color: colors.subText }]}>
              Successfully delivered to customer
            </Text>
          </View>
        </View>

        {/* ORDER INFO */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Row label="Order Number" value={order.orderNumber} colors={colors} />
          <Divider colors={colors} />
          <Row label="Order Time" value={order.time} colors={colors} />
          <Divider colors={colors} />
          <Row label="Payment Mode" value={order.paymentMode} colors={colors} />
        </View>

        {/* CUSTOMER */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            👤 Customer Details
          </Text>

          <Text style={[styles.customerName, { color: colors.text }]}>
            {order.customerName}
          </Text>

          <View style={styles.addressRow}>
            <Text style={styles.addressIcon}>📍</Text>
            <Text style={[styles.addressText, { color: colors.subText }]}>
              {order.customerAddress}
            </Text>
          </View>
        </View>

        {/* ITEMS */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            🛒 Items
          </Text>

          {order.items?.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemName, { color: colors.text }]}>
                  {item.M1_NAME}
                </Text>
                <Text style={[styles.itemQty, { color: colors.subText }]}>
                  Qty: {item.F4_QTOT}
                </Text>
              </View>
              <Text style={[styles.itemPrice, { color: colors.primary }]}>
                ₹{item.F4_AMT1 * item.F4_QTOT}
              </Text>
            </View>
          ))}

          <Divider colors={colors} />

          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>
              Total Amount
            </Text>
            <Text style={[styles.totalAmount, { color: colors.success }]}>
              ₹{order.totalAmount}
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default CompletedOrderDetailScreen;

/* ---------- SMALL COMPONENTS ---------- */

const Row = ({ label, value, colors }) => (
  <View style={styles.row}>
    <Text style={[styles.label, { color: colors.subText }]}>{label}</Text>
    <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
  </View>
);

const Divider = ({ colors }) => (
  <View style={[styles.divider, { backgroundColor: colors.border }]} />
);

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
    marginBottom: 16,
    borderWidth: 1,
  },

  statusIcon: { fontSize: 32, marginRight: 12 },

  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
  },

  statusSubtitle: {
    fontSize: 13,
  },

  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },

  label: {
    fontSize: 14,
  },

  value: {
    fontSize: 14,
    fontWeight: '600',
  },

  divider: {
    height: 1,
  },

  customerName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },

  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  addressIcon: {
    marginRight: 8,
    marginTop: 2,
  },

  addressText: {
    flex: 1,
    lineHeight: 18,
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  itemName: {
    fontSize: 14,
    fontWeight: '600',
  },

  itemQty: {
    fontSize: 12,
  },

  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },

  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },

  totalAmount: {
    fontSize: 18,
    fontWeight: '800',
  },
});