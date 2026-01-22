import React, { useState, useRef, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  StatusBar,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import { orderDetailTheme } from '../../theme/orderDetailTheme';
import { acceptIncomingOrder } from '../../api/otherApi';

const { width } = Dimensions.get('window');

// Custom Alert Component
const CustomAlert = ({ visible, type, title, message, onClose, onConfirm }) => {
  const { theme } = useContext(ThemeContext);
  const colors = orderDetailTheme[theme];

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return '#10B981';
      case 'error':
        return '#EF4444';
      case 'warning':
        return '#F59E0B';
      default:
        return '#3B82F6';
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.alertContainer, { backgroundColor: colors.card }]}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: getIconColor() + '20' },
            ]}
          >
            <Text style={styles.alertIcon}>{getIcon()}</Text>
          </View>

          <Text style={[styles.alertTitle, { color: colors.text }]}>
            {title}
          </Text>

          <Text style={[styles.alertMessage, { color: colors.subText }]}>
            {message}
          </Text>

          <View style={styles.alertButtons}>
            {onConfirm ? (
              <>
                <TouchableOpacity
                  style={[
                    styles.alertButton,
                    styles.cancelButton,
                    { borderColor: colors.border },
                  ]}
                  onPress={onClose}
                >
                  <Text
                    style={[styles.cancelButtonText, { color: colors.text }]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.alertButton,
                    styles.confirmButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={onConfirm}
                >
                  <Text style={styles.confirmButtonText}>OK</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[
                  styles.alertButton,
                  styles.singleButton,
                  { backgroundColor: getIconColor() },
                ]}
                onPress={onClose}
              >
                <Text style={styles.confirmButtonText}>OK</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const OrderDetailScreen = ({ route, navigation }) => {
  const { order, activeTab } = route.params;

  const { theme } = useContext(ThemeContext);
  const colors = orderDetailTheme[theme];
  const isDark = theme === 'dark';

  const swipeProgress = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(false);
  const [selfDelivery, setSelfDelivery] = useState(false);
  const [dragIcon, setDragIcon] = useState('👉');

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null,
  });

  const { user } = useContext(AuthContext) || {};
  const vendorId = user?.M1_CODE ?? route.params?.vendorId ?? null;
  const selfDeliveryRef = useRef(false);

  const isIncoming = activeTab === 'incoming';
  const isOnDelivery = activeTab === 'onDelivery';
  const isCompleted = activeTab === 'completed';

  const isAccepted =
    order?.statusLabel === 'Accept' ||
    order?.statusLabel === 'Accepted' ||
    order?.statusLabel === 'Out For Delivery';

  const shouldHideSwipe =
    order?.deliveryStat === '1' || order?.deliveryStat === '2' || isCompleted;

  const rawOrderNumber = order?.orderNumber ?? order?.id ?? '';
  const orderIdentifier = rawOrderNumber.startsWith('#')
    ? rawOrderNumber.substring(1)
    : rawOrderNumber;

  const showAlert = (type, title, message, onConfirm = null) => {
    setAlertConfig({
      visible: true,
      type,
      title,
      message,
      onConfirm,
    });
  };

  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

  /* ---------------- SWIPE HANDLER ---------------- */
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 5,
      onPanResponderMove: (_, gs) => {
        if (loading) return;
        const progress = Math.max(-1, Math.min(1, gs.dx / (width * 0.7)));
        swipeProgress.setValue(progress);
        setDragIcon(progress > 0.5 ? '✓' : progress < -0.5 ? '✖' : '👉');
      },
      onPanResponderRelease: (_, gs) => {
        if (loading) return resetSwipe();

        if (gs.dx > width * 0.5) {
          Animated.spring(swipeProgress, {
            toValue: 1,
            useNativeDriver: false,
          }).start(() =>
            handlePerformOrderAction('Accept', selfDeliveryRef.current ? 1 : 2),
          );
        } else if (gs.dx < -width * 0.5) {
          Animated.spring(swipeProgress, {
            toValue: -1,
            useNativeDriver: false,
          }).start(() => handlePerformOrderAction('Reject', 0));
        } else {
          resetSwipe();
        }
      },
    }),
  ).current;

  const resetSwipe = () => {
    Animated.spring(swipeProgress, {
      toValue: 0,
      useNativeDriver: false,
    }).start(() => setDragIcon('👉'));
  };

  const handlePerformOrderAction = async (status, statValue) => {
    if (!vendorId) {
      showAlert('error', 'Error', 'Vendor ID is missing. Please try again.');
      resetSwipe();
      return;
    }

    try {
      setLoading(true);
      const res = await acceptIncomingOrder(
        vendorId,
        orderIdentifier,
        status,
        String(statValue),
      );

      if (res?.data?.response === 'success') {
        showAlert(
          'success',
          'Success',
          res.data.message || `Order ${status}ed successfully`,
          () => {
            hideAlert();
            navigation.navigate({
              name: 'Main',
              params: { refreshOrders: true },
              merge: true,
            });
          },
        );
      } else {
        // Handle specific error messages
        const errorMessage =
          res?.data?.message || 'Unable to process the order';
        showAlert('error', 'Action Failed', errorMessage);
        resetSwipe();
      }
    } catch (error) {
      // Network or other errors
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Network error. Please check your connection and try again.';
      showAlert('error', 'Connection Error', errorMessage);
      resetSwipe();
    } finally {
      setLoading(false);
    }
  };

  const backgroundColor = swipeProgress.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [colors.danger, colors.swipeIdle, colors.success],
  });

  const translateX = swipeProgress.interpolate({
    inputRange: [-1, 1],
    outputRange: [-width * 0.7, width * 0.7],
  });

  const customerLatitude = Number(order?.latitude) || 22.7196;
  const customerLongitude = Number(order?.longitude) || 75.8577;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={hideAlert}
        onConfirm={alertConfig.onConfirm}
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
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Main');
            }
          }}
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
            Order Details
          </Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* STATUS */}
        <View
          style={[
            styles.statusBanner,
            {
              backgroundColor: isIncoming
                ? colors.incomingBg
                : isOnDelivery
                ? colors.onDeliveryBg
                : colors.completedBg,
            },
          ]}
        >
          <Text style={styles.statusIcon}>
            {isIncoming && '📥'}
            {isOnDelivery && '🚚'}
            {isCompleted && '✅'}
          </Text>
          <View>
            <Text style={[styles.statusTitle, { color: colors.text }]}>
              {isIncoming && 'New Order Received'}
              {isOnDelivery && 'Out for Delivery'}
              {isCompleted && 'Order Completed'}
            </Text>
            <Text style={[styles.statusSubtitle, { color: colors.subText }]}>
              {isIncoming && 'Accept and choose delivery method'}
              {isOnDelivery && 'Track delivery progress'}
              {isCompleted && `Delivered at ${order.completedTime}`}
            </Text>
          </View>
        </View>

        {/* CUSTOMER */}
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            👤 Customer Details
          </Text>
          <Text style={[styles.customerName, { color: colors.text }]}>
            {order.customerName}
          </Text>
          <Text style={[styles.addressText, { color: colors.subText }]}>
            {order.customerAddress}
          </Text>
        </View>

        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            🛒 Items to Deliver
          </Text>

          {order.items?.length ? (
            order.items.map((item, index) => (
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
            ))
          ) : (
            <Text style={{ color: colors.subText, fontSize: 13 }}>
              No item details available
            </Text>
          )}
        </View>

        {/* MAP */}
        {(isIncoming || isOnDelivery) && (
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              🗺️ Customer Location
            </Text>
            <View style={[styles.mapContainer, { borderColor: colors.border }]}>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                  latitude: customerLatitude,
                  longitude: customerLongitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: customerLatitude,
                    longitude: customerLongitude,
                  }}
                />
              </MapView>
            </View>
          </View>
        )}

        <View style={{ height: 160 }} />
      </ScrollView>

      {/* SELF DELIVERY */}
      {isIncoming && !shouldHideSwipe && (
        <View
          style={[
            styles.selfDeliveryRow,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.checkbox,
              {
                backgroundColor: selfDelivery
                  ? colors.checkboxChecked
                  : colors.checkboxBg,
                borderColor: colors.border,
              },
            ]}
            onPress={() => {
              setSelfDelivery(v => !v);
              selfDeliveryRef.current = !selfDelivery;
            }}
          >
            {selfDelivery && <Text style={{ color: '#fff' }}>✓</Text>}
          </TouchableOpacity>
          <Text style={{ color: colors.text }}>I will do self delivery</Text>
        </View>
      )}

      {/* SWIPE */}
      {!shouldHideSwipe && isIncoming && (
        <View
          style={[
            styles.swipeContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Animated.View
            style={[styles.swipeBackground, { backgroundColor }]}
          />
          <Text style={[styles.rejectLabel, { color: colors.danger }]}>
            Reject
          </Text>
          <Text style={[styles.acceptLabel, { color: colors.success }]}>
            Accept
          </Text>

          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.swipeButton,
              { transform: [{ translateX }], backgroundColor: colors.card },
            ]}
          >
            <Text style={{ fontSize: 24 }}>{dragIcon}</Text>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default OrderDetailScreen;

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
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
  backButtonText: { fontSize: 20, fontWeight: '600', marginBottom: 6 },
  titlePill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  titleText: { fontSize: 16, fontWeight: '700' },
  content: { padding: 16 },

  statusBanner: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusIcon: { fontSize: 32, marginRight: 12 },
  statusTitle: { fontSize: 16, fontWeight: '700' },
  statusSubtitle: { fontSize: 13 },

  sectionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  customerName: { fontSize: 15, fontWeight: '600' },
  addressText: { fontSize: 13, marginTop: 4 },

  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  map: { flex: 1 },

  selfDeliveryRow: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  swipeContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 30,
  },
  swipeBackground: { ...StyleSheet.absoluteFillObject },
  swipeButton: {
    position: 'absolute',
    left: '50%',
    top: 4,
    marginLeft: -28,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
  rejectLabel: { position: 'absolute', left: 20, top: 22, fontWeight: '700' },
  acceptLabel: { position: 'absolute', right: 20, top: 22, fontWeight: '700' },
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
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Custom Alert Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertIcon: {
    fontSize: 32,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  alertButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  alertButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {
    elevation: 2,
  },
  singleButton: {
    elevation: 2,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
