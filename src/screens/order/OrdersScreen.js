import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { getOrderList } from '../../api/otherApi';
import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import { ordersTheme } from '../../theme/ordersTheme';

const OrdersScreen = ({ route, navigation: navProp }) => {
  const navigation = useNavigation() || navProp;
  const { user } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const colors = ordersTheme[theme];
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState('incoming');
  const [onDeliverySubTab, setOnDeliverySubTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [ordersByTab, setOrdersByTab] = useState({
    incoming: [],
    onDeliverySelf: [],
    onDeliveryPartner: [],
    outForDelivery: [],
    completed: [],
  });

  const [todayStats, setTodayStats] = useState({
    completedToday: 0,
    rejectedToday: 0,
  });

  const VENDOR_ID = user?.M1_CODE || user?.id || user?.vendorId;

  /* ---------------- HELPERS ---------------- */

  const transformApiOrderToUI = apiOrder => {
    const addressParts = [
      apiOrder.F4_ADD1,
      apiOrder.F4_ADD2,
      apiOrder.F4_ADD3,
      apiOrder.F4_ADD4,
      apiOrder.F4_ADD7,
    ].filter(Boolean);

    // Determine delivery status from F4_STAT
    const statCode = String(apiOrder.F4_STAT);
    let deliveryType = 'unknown';
    if (statCode === '1') deliveryType = 'self';
    else if (statCode === '2') deliveryType = 'partner';

    return {
      id: apiOrder.F4_NO,
      orderNumber: `#${apiOrder.F4_NO}`,
      customerName: apiOrder.M1_NAME || 'Customer',
      customerAddress: addressParts.join(', '),
      items: apiOrder.items || [],
      itemCount: (apiOrder.items || []).length,
      totalAmount: Number(apiOrder.F4_GTOT || 0),
      time: apiOrder.F4_DATE || '',
      deliveryStat: apiOrder.F4_STAT,
      deliveryType: deliveryType,
      statusLabel: apiOrder.F4_BT || '',
      raw: apiOrder,
    };
  };

  const fetchOrdersByType = useCallback(
    async orderType => {
      try {
        const resp = await getOrderList(VENDOR_ID, orderType);
        const payload = resp?.data ?? resp;
        if (payload?.response !== 'success') return [];
        return (payload.data || []).map(transformApiOrderToUI);
      } catch (e) {
        Alert.alert('Error', 'Failed to load orders');
        return [];
      }
    },
    [VENDOR_ID],
  );

  const fetchAllOrders = useCallback(async () => {
    try {
      setLoading(true);
      const [placed, accepted, outForD, delivered] = await Promise.all([
        fetchOrdersByType('Placed'),
        fetchOrdersByType('Accept'),
        fetchOrdersByType('Out For Delivery'),
        fetchOrdersByType('Delivered'),
      ]);

      // Filter out cancelled orders (F4_STAT = '0')
      const filterCancelled = orders =>
        orders.filter(o => o.deliveryStat !== '0');

      const outForDeliveryClean = filterCancelled(outForD);

      const validDelivery = o =>
        o.deliveryStat === '1' || o.deliveryStat === '2';

      const selfDelivery = orders => orders.filter(o => o.deliveryStat === '1');

      const partnerDelivery = orders =>
        orders.filter(o => o.deliveryStat === '2');

      setOrdersByTab({
        incoming: placed,

        // Accept + Out For Delivery (delivery flow)
        onDeliverySelf: [...selfDelivery(accepted), ...selfDelivery(outForD)],

        onDeliveryPartner: [
          ...partnerDelivery(accepted),
          ...partnerDelivery(outForD),
        ],

        outForDelivery: outForD.filter(validDelivery),

        completed: delivered,
      });

      setTodayStats({
        completedToday: delivered.length,
        rejectedToday: 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchOrdersByType]);

  useEffect(() => {
    fetchAllOrders();
  }, [fetchAllOrders]);

  // Refresh orders when screen comes into focus
  useEffect(() => {
    if (!navigation?.addListener) return;

    const unsubscribe = navigation.addListener('focus', () => {
      fetchAllOrders();
    });

    return unsubscribe;
  }, [navigation, fetchAllOrders]);

  const activeOrders =
    activeTab === 'incoming'
      ? ordersByTab.incoming
      : activeTab === 'completed'
      ? ordersByTab.completed
      : onDeliverySubTab === 'all'
      ? ordersByTab.outForDelivery
      : onDeliverySubTab === 'self'
      ? ordersByTab.onDeliverySelf
      : onDeliverySubTab === 'partner'
      ? ordersByTab.onDeliveryPartner
      : ordersByTab.outForDelivery;

  const getStatusBadge = order => {
    if (!order.statusLabel) return null;

    const statusConfig = {
      'Out For Delivery': { color: '#F59E0B', bg: '#FEF3C7', icon: '🚚' },
      'Self Delivery': { color: '#3B82F6', bg: '#DBEAFE', icon: '🏍️' },
      'Delivery Partner': { color: '#8B5CF6', bg: '#EDE9FE', icon: '🚴' },
      'Reached Pickup': { color: '#EC4899', bg: '#FCE7F3', icon: '📍' },
      'Picked Up': { color: '#10B981', bg: '#D1FAE5', icon: '📦' },
      'Reached Drop': { color: '#059669', bg: '#A7F3D0', icon: '🎯' },
    };

    const config = statusConfig[order.statusLabel] || {
      color: '#64748B',
      bg: '#F1F5F9',
      icon: '📋',
    };

    return { ...config, label: order.statusLabel };
  };

  /* ---------------- UI ---------------- */

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <StatusBar translucent={true} />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {/*<TouchableOpacity*/}
          {/*  style={[*/}
          {/*    styles.backButton,*/}
          {/*    { backgroundColor: colors.card, borderColor: colors.border },*/}
          {/*  ]}*/}
          {/*  onPress={() => navigation.goBack()}*/}
          {/*>*/}
          {/*  <Text style={[styles.backButtonText, { color: colors.text }]}>*/}
          {/*    ←*/}
          {/*  </Text>*/}
          {/*</TouchableOpacity>*/}

          <View style={styles.backButton}></View>

          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Orders
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.subText }]}>
              Manage your orders
            </Text>
          </View>

          <TouchableOpacity
            onPress={fetchAllOrders}
            style={[
              styles.refreshButton,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text
              style={{ fontSize: 26, color: colors.primary, marginBottom: 4 }}
            >
              ⟳
            </Text>
          </TouchableOpacity>
        </View>

        {/* STATS CARDS */}
        <View style={styles.statsContainer}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.statIcon,
                {
                  backgroundColor: isDark
                    ? 'rgba(74, 222, 128, 0.15)'
                    : '#DCFCE7',
                },
              ]}
            >
              <Text style={{ fontSize: 20 }}>✓</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {todayStats.completedToday}
              </Text>
              <Text style={[styles.statLabel, { color: colors.subText }]}>
                Completed
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.statIcon,
                {
                  backgroundColor: isDark
                    ? 'rgba(252, 165, 165, 0.15)'
                    : '#FEE2E2',
                },
              ]}
            >
              <Text style={{ fontSize: 20 }}>✕</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statValue, { color: colors.danger }]}>
                {todayStats.rejectedToday}
              </Text>
              <Text style={[styles.statLabel, { color: colors.subText }]}>
                Rejected
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* TABS */}
      <View style={styles.tabsWrapper}>
        <View
          style={[
            styles.tabsContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {['incoming', 'onDelivery', 'completed'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && [
                  styles.tabActive,
                  { backgroundColor: colors.primary },
                ],
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === tab ? '#FFFFFF' : colors.subText,
                  },
                ]}
              >
                {tab === 'incoming'
                  ? 'Incoming'
                  : tab === 'onDelivery'
                  ? 'On Delivery'
                  : 'Completed'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ON DELIVERY SUB TABS */}
      {activeTab === 'onDelivery' && (
        <View style={styles.subTabsWrapper}>
          <View
            style={[
              styles.subTabsContainer,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {['self', 'partner'].map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.subTab,
                  onDeliverySubTab === type && [
                    styles.subTabActive,
                    { backgroundColor: colors.primary },
                  ],
                ]}
                onPress={() => setOnDeliverySubTab(type)}
              >
                <Text
                  style={[
                    styles.subTabText,
                    {
                      color:
                        onDeliverySubTab === type ? '#FFFFFF' : colors.subText,
                    },
                  ]}
                >
                  {type === 'self' ? 'Self Delivery' : 'Partner Delivery'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* LIST */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loaderText, { color: colors.subText }]}>
            Loading orders...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.ordersList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchAllOrders}
              tintColor={colors.primary}
            />
          }
        >
          {activeOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>📦</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No orders yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.subText }]}>
                Orders will appear here when customers place them
              </Text>
            </View>
          ) : (
            activeOrders.map((order, index) => {
              const badge = getStatusBadge(order);

              return (
                <TouchableOpacity
                  key={order.id}
                  style={[
                    styles.orderCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => {
                    if (activeTab === 'completed') {
                      navigation.navigate('CompletedOrderDetail', { order });
                    } else if (
                      activeTab === 'onDelivery' &&
                      onDeliverySubTab === 'self'
                    ) {
                      navigation.navigate('SelfDeliveryOrder', {
                        order,
                        activeTab,
                        onRefresh: fetchAllOrders,
                      });
                    } else {
                      navigation.navigate('OrderDetail', {
                        order,
                        activeTab,
                        onRefresh: fetchAllOrders,
                      });
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.orderHeader}>
                    <View
                      style={[
                        styles.orderBadge,
                        {
                          backgroundColor: isDark
                            ? 'rgba(96, 165, 250, 0.15)'
                            : '#EFF6FF',
                        },
                      ]}
                    >
                      <Text
                        style={[styles.orderNumber, { color: colors.primary }]}
                      >
                        {order.orderNumber}
                      </Text>
                    </View>
                    {badge && (
                      <View
                        style={{
                          backgroundColor: badge.bg,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 6,
                          marginTop: 8,
                          alignSelf: 'flex-start',
                        }}
                      >
                        <Text
                          style={{
                            color: badge.color,
                            fontSize: 11,
                            fontWeight: '700',
                          }}
                        >
                          {badge.icon} {badge.label}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View
                    style={[
                      styles.amountBadge,
                      {
                        backgroundColor: isDark
                          ? 'rgba(34, 197, 94, 0.15)'
                          : '#F0FDF4',
                      },
                    ]}
                  >
                    <Text style={[styles.amount, { color: colors.success }]}>
                      ₹{order.totalAmount.toLocaleString()}
                    </Text>
                  </View>

                  <Text style={[styles.customerName, { color: colors.text }]}>
                    {order.customerName}
                  </Text>

                  {!!order.customerAddress && (
                    <View style={styles.addressRow}>
                      <Text
                        style={[styles.addressIcon, { color: colors.subText }]}
                      >
                        📍
                      </Text>
                      <Text
                        style={[styles.addressText, { color: colors.subText }]}
                        numberOfLines={2}
                      >
                        {order.customerAddress}
                      </Text>
                    </View>
                  )}

                  <View style={styles.orderFooter}>
                    <View style={styles.metaItem}>
                      <Text
                        style={[styles.metaIcon, { color: colors.subText }]}
                      >
                        🧾
                      </Text>
                      <Text
                        style={[styles.metaText, { color: colors.subText }]}
                      >
                        {order.itemCount || 0} items
                      </Text>
                    </View>

                    {!!order.time && (
                      <View style={styles.metaItem}>
                        <Text
                          style={[styles.metaIcon, { color: colors.subText }]}
                        >
                          ⏰
                        </Text>
                        <Text
                          style={[styles.metaText, { color: colors.subText }]}
                        >
                          {order.time}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View
                    style={[
                      styles.cardShine,
                      { opacity: isDark ? 0.03 : 0.05 },
                    ]}
                  />
                </TouchableOpacity>
              );
            })
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default OrdersScreen;

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  safeArea: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  backButton: {
    width: 44,
    height: 44,
    // borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    // borderWidth: 1,
  },

  backButtonText: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 4,
  },

  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },

  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },

  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },

  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },

  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  statContent: {
    flex: 1,
  },

  statValue: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  statLabel: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },

  tabsWrapper: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },

  tabsContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
  },

  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },

  tabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },

  subTabsWrapper: {
    paddingHorizontal: 20,
    marginRight: 50,
    marginLeft: 50,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    alignItems: 'center',
  },

  subTabsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },

  subTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },

  subTabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  subTabText: {
    fontSize: 12,
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },

  ordersList: {
    paddingHorizontal: 20,
  },

  orderCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
  },

  cardShine: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 100,
    height: 100,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 100,
  },

  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  orderBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },

  orderNumber: {
    fontSize: 14,
    fontWeight: '700',
  },

  amountBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    position: 'absolute',
    top: 60,
    right: 20,
  },

  amount: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  customerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },

  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  addressIcon: {
    fontSize: 14,
    marginRight: 6,
    marginTop: 1,
  },

  addressText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },

  orderFooter: {
    flexDirection: 'row',
    gap: 16,
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  metaIcon: {
    fontSize: 14,
    marginRight: 4,
  },

  metaText: {
    fontSize: 13,
    fontWeight: '500',
  },

  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loaderText: {
    marginTop: 16,
    fontSize: 14,
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },

  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
