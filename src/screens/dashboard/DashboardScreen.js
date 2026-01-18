import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemeContext } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { dashboardTheme } from '../../theme/dashboardTheme';
import { getDashboardData } from '../../api/dashboardApi';

const DashboardScreen = () => {
  const { theme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const colors = dashboardTheme[theme];
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);

  const VENDOR_ID = user?.M1_CODE || user?.id || user?.vendorId;

  // Fetch dashboard data
  const fetchDashboard = useCallback(async () => {
    try {
      const response = await getDashboardData(VENDOR_ID);
      const payload = response?.data ?? response;

      if (payload?.response === 'success' && payload?.data?.[0]) {
        setDashboardData(payload.data[0]);
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [VENDOR_ID]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  // Calculate stats from API data
  const stats = dashboardData
    ? [
        {
          label: "Today's Commission",
          value: `₹${Number(
            dashboardData.todays_commision || 0,
          ).toLocaleString()}`,
          count: dashboardData.total_today_order,
          subLabel: `${dashboardData.total_today_order} orders today`,
          icon: '💰',
          accent: '#2563EB',
          bgColor: isDark ? 'rgba(37, 99, 235, 0.15)' : '#EFF6FF',
        },
        {
          label: 'Total Orders',
          value: String(
            (dashboardData.total_today_order || 0) +
              (dashboardData.total_pending_order || 0) +
              (dashboardData.total_processing_order || 0) +
              (dashboardData.total_delivered_order || 0) +
              (dashboardData.total_cancel_order || 0),
          ),
          subLabel: 'All time orders',
          icon: '📦',
          accent: '#7C3AED',
          bgColor: isDark ? 'rgba(124, 58, 237, 0.15)' : '#F5F3FF',
        },
        {
          label: 'Pending Orders',
          value: String(dashboardData.total_pending_order || 0),
          subLabel: 'Awaiting action',
          icon: '⏳',
          accent: '#F97316',
          bgColor: isDark ? 'rgba(249, 115, 22, 0.15)' : '#FFF7ED',
        },
        {
          label: 'Delivered',
          value: String(dashboardData.total_delivered_order || 0),
          subLabel: 'Successfully completed',
          icon: '✅',
          accent: '#16A34A',
          bgColor: isDark ? 'rgba(22, 163, 74, 0.15)' : '#F0FDF4',
        },
      ]
    : [];

  const quickStats = dashboardData
    ? [
        {
          icon: '🚀',
          label: 'Processing',
          value: String(dashboardData.total_processing_order || 0),
          color: '#3B82F6',
        },
        {
          icon: '📋',
          label: "Today's Orders",
          value: String(dashboardData.total_today_order || 0),
          color: '#8B5CF6',
        },
        {
          icon: '❌',
          label: 'Cancelled',
          value: String(dashboardData.total_cancel_order || 0),
          color: '#EF4444',
        },
        {
          icon: '⏰',
          label: 'Pending',
          value: String(dashboardData.total_pending_order || 0),
          color: '#F59E0B',
        },
      ]
    : [];

  // Placeholder chart data
  const monthlyRevenue = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [20000, 35000, 28000, 45000, 52000, 48000],
        strokeWidth: 3,
      },
    ],
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={colors.statusBar}
          translucent={false}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary || '#2563EB'} />
          <Text style={[styles.loadingText, { color: colors.subText }]}>
            Loading dashboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.statusBar}
        translucent={false}
      />

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary || '#2563EB'}
          />
        }
      >
        {/* HEADER */}
        <View
          style={[
            styles.headerCard,
            { backgroundColor: colors.headerGradient },
          ]}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={[styles.greeting, { color: colors.headerText }]}>
                Hello, Vendor 👋
              </Text>
              <Text
                style={[styles.subGreeting, { color: colors.headerSubText }]}
              >
                Here's how your store is doing today
              </Text>
            </View>
            <TouchableOpacity
              onPress={onRefresh}
              style={[
                styles.refreshButton,
                {
                  backgroundColor: isDark
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(0,0,0,0.05)',
                },
              ]}
            >
              <Text style={{ fontSize: 20, color: colors.headerText }}>⟳</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* STATS */}
        <View style={styles.statsGrid}>
          {stats.map((stat, i) => (
            <View
              key={i}
              style={[
                styles.statCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.statIconWrapper,
                  { backgroundColor: stat.bgColor },
                ]}
              >
                <Text style={styles.statIcon}>{stat.icon}</Text>
              </View>
              <Text style={[styles.statLabel, { color: colors.subText }]}>
                {stat.label}
              </Text>
              <Text style={[styles.statValue, { color: stat.accent }]}>
                {stat.value}
              </Text>
              <Text style={[styles.statSubLabel, { color: colors.subText }]}>
                {stat.subLabel}
              </Text>
            </View>
          ))}
        </View>

        {/* CHART */}
        <View
          style={[
            styles.chartCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>
              Revenue Overview
            </Text>
            <View
              style={[
                styles.chartBadge,
                { backgroundColor: colors.primary + '20' },
              ]}
            >
              <Text
                style={[
                  styles.chartBadgeText,
                  { color: colors.primary || '#2563EB' },
                ]}
              >
                Historical data needed
              </Text>
            </View>
          </View>
          <LineChart
            data={monthlyRevenue}
            width={Dimensions.get('window').width - 60}
            height={220}
            bezier
            chartConfig={{
              backgroundGradientFrom: colors.card,
              backgroundGradientTo: colors.card,
              color: (o = 1) => `rgba(37, 99, 235, ${o})`,
              labelColor: (o = 1) =>
                isDark ? `rgba(148,163,184,${o})` : `rgba(71,85,105,${o})`,
              propsForDots: {
                r: '5',
                strokeWidth: '2',
                stroke: '#2563EB',
                fill: colors.card,
              },
              propsForBackgroundLines: {
                stroke: colors.border,
              },
            }}
            style={{ borderRadius: 16 }}
          />
        </View>

        {/* QUICK STATS */}
        <View style={styles.quickStatsGrid}>
          {quickStats.map((q, i) => (
            <View
              key={i}
              style={[
                styles.quickStatCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.quickIconWrapper,
                  {
                    backgroundColor: q.color + '15',
                    borderColor: q.color + '55',
                  },
                ]}
              >
                <Text style={styles.quickStatEmoji}>{q.icon}</Text>
              </View>

              <Text style={[styles.quickStatValue, { color: colors.text }]}>
                {q.value}
              </Text>
              <Text style={[styles.quickStatLabel, { color: colors.subText }]}>
                {q.label}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },

  headerCard: {
    margin: 16,
    padding: 20,
    borderRadius: 22,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
  },
  subGreeting: {
    fontSize: 13,
    marginTop: 4,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    width: (Dimensions.get('window').width - 44) / 2,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  statIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    fontSize: 24,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  statSubLabel: {
    fontSize: 11,
  },

  chartCard: {
    margin: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  chartBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  chartBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },

  quickStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 60,
  },
  quickStatCard: {
    width: (Dimensions.get('window').width - 44) / 2,
    paddingVertical: 18,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
  },
  quickIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickStatEmoji: {
    fontSize: 26,
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  quickStatLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
});
