import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import { selfDeliveryTheme } from '../../theme/selfDeliveryTheme';
import { outForSelfDelivery, orderDelivered } from '../../api/otherApi';

const SelfDeliveryOrderScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);

  const colors = selfDeliveryTheme[theme];
  const isDark = theme === 'dark';

  const VENDOR_ID = user?.M1_CODE || user?.id || user?.vendorId;
  const order = route.params?.order;
  const onRefresh = route.params?.onRefresh;

  console.log('Self Delivery Order:', order);
  console.log('Order Status Label:', order?.statusLabel);
  console.log('Order Delivery Type:', order?.deliveryType);

  // Determine initial step based on order status
  const getInitialStep = () => {
    const status = order?.statusLabel || '';
    if (status.includes('Delivered') || status === 'Delivered') return 3;
    if (status.includes('Out For Delivery') || status === 'Out For Delivery')
      return 2;
    return 1; // Default to "Ready" state
  };

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(getInitialStep());

  const steps = [
    { id: 1, label: 'Ready', icon: '📦', status: 'Self Delivery' },
    {
      id: 2,
      label: 'Out for Delivery',
      icon: '🚚',
      status: 'Out For Delivery',
    },
    { id: 3, label: 'Delivered', icon: '✅', status: 'Delivered' },
  ];

  const openLocationInMaps = () => {
    if (!order.raw.F4_ADD5 || !order.raw.F4_ADD6) {
      Alert.alert('Location Not Found', 'GPS coordinates not available');
      return;
    }
    Linking.openURL(
      `https://www.google.com/maps?q=${order.raw.F4_ADD5},${order.raw.F4_ADD6}`,
    );
  };

  const handleOutForDelivery = async () => {
    Alert.alert(
      'Start Delivery?',
      'Are you ready to start the delivery journey?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: async () => {
            try {
              setLoading(true);
              const resp = await outForSelfDelivery(VENDOR_ID, order.id);
              const payload = resp?.data ?? resp;
              if (payload.response !== 'success') {
                throw new Error(payload.message);
              }
              setCurrentStep(2);

              // Call refresh callback
              if (onRefresh && typeof onRefresh === 'function') {
                onRefresh();
              }

              Alert.alert('Success! 🚚', 'Journey started. Drive safely!');
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not update status');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleMarkDelivered = async () => {
    Alert.alert(
      'Mark as Delivered?',
      'Confirm that the order has been delivered to the customer',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'default',
          onPress: async () => {
            try {
              setLoading(true);
              const resp = await orderDelivered(VENDOR_ID, order.id);
              const payload = resp?.data ?? resp;
              if (payload.response !== 'success') {
                throw new Error(payload.message);
              }
              setCurrentStep(3);

              // Call refresh callback
              if (onRefresh && typeof onRefresh === 'function') {
                onRefresh();
              }

              Alert.alert('Success! ✅', 'Order marked as delivered', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not mark delivered');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const getStepColor = stepId => {
    if (stepId < currentStep) return colors.success;
    if (stepId === currentStep) return colors.primary;
    return colors.mutedText;
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

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

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Self Delivery
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.subText }]}>
            {order.orderNumber}
          </Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* PROGRESS STEPS */}
        <View
          style={[
            styles.stepsCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.stepsTitle, { color: colors.text }]}>
            Delivery Progress
          </Text>

          <View style={styles.stepsContainer}>
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <View style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepCircle,
                      {
                        backgroundColor:
                          step.id <= currentStep
                            ? getStepColor(step.id)
                            : colors.background,
                        borderColor: getStepColor(step.id),
                      },
                    ]}
                  >
                    {step.id < currentStep ? (
                      <Text style={styles.stepCheckmark}>✓</Text>
                    ) : (
                      <Text style={styles.stepIcon}>{step.icon}</Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      {
                        color:
                          step.id <= currentStep
                            ? colors.text
                            : colors.mutedText,
                      },
                    ]}
                  >
                    {step.label}
                  </Text>
                </View>

                {index < steps.length - 1 && (
                  <View
                    style={[
                      styles.stepLine,
                      {
                        backgroundColor:
                          step.id < currentStep
                            ? colors.success
                            : colors.border,
                      },
                    ]}
                  />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* ORDER SUMMARY */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.summaryRow}>
            <View>
              <Text style={[styles.summaryLabel, { color: colors.subText }]}>
                Order Amount
              </Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>
                ₹{order.totalAmount?.toLocaleString()}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View>
              <Text style={[styles.summaryLabel, { color: colors.subText }]}>
                Items
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {order.itemCount || order.items?.length || 0}
              </Text>
            </View>
          </View>
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

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.subText }]}>
              Name
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {order.customerName}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.subText }]}>
              Address
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {order.customerAddress}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.mapButton, { backgroundColor: colors.primary }]}
            onPress={openLocationInMaps}
            activeOpacity={0.8}
          >
            <Text style={styles.mapButtonText}>📍 Open in Google Maps</Text>
          </TouchableOpacity>
        </View>

        {/* ITEMS */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            🛒 Order Items
          </Text>

          {order.items?.map((it, idx) => (
            <View key={it.F4_F1 || idx} style={styles.itemRow}>
              <View style={styles.itemDot} />
              <Text style={[styles.itemName, { color: colors.text }]}>
                {it.M1_NAME}
              </Text>
              <View
                style={[
                  styles.itemQtyBadge,
                  { backgroundColor: colors.background },
                ]}
              >
                <Text style={[styles.itemQty, { color: colors.text }]}>
                  ×{it.F4_QTOT}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* ACTIONS */}
        <View style={styles.actionsContainer}>
          {currentStep === 1 && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: colors.primary },
                loading && styles.actionButtonDisabled,
              ]}
              onPress={handleOutForDelivery}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.actionButtonIcon}>🚚</Text>
                  <Text style={styles.actionButtonText}>Start Delivery</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {currentStep === 2 && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: colors.success },
                loading && styles.actionButtonDisabled,
              ]}
              onPress={handleMarkDelivered}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.actionButtonIcon}>✅</Text>
                  <Text style={styles.actionButtonText}>Mark as Delivered</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {currentStep === 3 && (
            <View style={styles.completedState}>
              <Text style={styles.completedIcon}>🎉</Text>
              <Text style={[styles.completedTitle, { color: colors.success }]}>
                Delivery Completed!
              </Text>
              <Text
                style={[styles.completedSubtitle, { color: colors.subText }]}
              >
                Great job! The order has been successfully delivered.
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default SelfDeliveryOrderScreen;

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  backButtonText: { fontSize: 22, fontWeight: '600' },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },

  stepsCard: {
    marginTop: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
  },

  stepsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 20,
  },

  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  stepItem: {
    alignItems: 'center',
    flex: 1,
  },

  stepCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },

  stepIcon: {
    fontSize: 24,
  },

  stepCheckmark: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },

  stepLine: {
    height: 3,
    flex: 0.5,
    marginHorizontal: -10,
    marginBottom: 50,
  },

  card: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },

  summaryLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
    textAlign: 'center',
  },

  summaryValue: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },

  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    opacity: 0.5,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },

  detailRow: {
    marginBottom: 12,
  },

  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  detailValue: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },

  mapButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },

  mapButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },

  itemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
  },

  itemName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },

  itemQtyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },

  itemQty: {
    fontSize: 13,
    fontWeight: '700',
  },

  actionsContainer: {
    marginTop: 4,
    marginBottom: 20,
  },

  actionButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },

  actionButtonDisabled: {
    opacity: 0.6,
  },

  actionButtonIcon: {
    fontSize: 20,
  },

  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },

  completedState: {
    alignItems: 'center',
    padding: 32,
  },

  completedIcon: {
    fontSize: 64,
    marginBottom: 16,
  },

  completedTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },

  completedSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
