import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

import {
  getAllTransaction,
  getAllCommissionTransaction,
  getAllPayoutTransaction,
  getAllWithdrawalTransaction,
  sendWithdrawalRequest,
} from '../../api/payoutApi';

import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import { ordersTheme } from '../../theme/ordersTheme';

const tabs = ['all', 'commission', 'payout', 'withdrawal'];

const PayoutScreen = () => {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const colors = ordersTheme[theme];

  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);

  const [summary, setSummary] = useState({
    total_commission: 0,
    total_payout: 0,
    total_balance: 0,
  });

  const [transactions, setTransactions] = useState([]);

  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let res;

      if (activeTab === 'all') {
        res = await getAllTransaction(user.M1_CODE);
        setSummary(res.data.data);
        setTransactions(res.data.data.transactions || []);
      } else if (activeTab === 'commission') {
        res = await getAllCommissionTransaction(user.M1_CODE);
        setTransactions(res.data.data || []);
      } else if (activeTab === 'payout') {
        res = await getAllPayoutTransaction(user.M1_CODE);
        setTransactions(res.data.data || []);
      } else {
        res = await getAllWithdrawalTransaction(user.M1_CODE);
        setTransactions(res.data.data || []);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to load payout data');
    }
    setLoading(false);
  };

  const submitWithdraw = async () => {
    if (!withdrawAmount || Number(withdrawAmount) <= 0) {
      Alert.alert('Invalid Amount');
      return;
    }

    if (Number(withdrawAmount) > Number(summary.total_balance)) {
      Alert.alert('Insufficient Balance');
      return;
    }

    try {
      await sendWithdrawalRequest(user.M1_CODE, withdrawAmount);
      Alert.alert('Success', 'Withdrawal request sent');
      setShowWithdraw(false);
      setWithdrawAmount('');
      fetchData();
    } catch {
      Alert.alert('Error', 'Withdrawal request failed');
    }
  };

  const renderItem = ({ item }) => (
    <View style={[styles.row, { backgroundColor: colors.card }]}>
      <View style={styles.rowLeft}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor:
                activeTab === 'payout' || item.F5_TYPE === 'Payouts'
                  ? '#FEE2E2'
                  : '#D1FAE5',
            },
          ]}
        >
          <Icon
            name={
              activeTab === 'payout' || item.F5_TYPE === 'Payouts'
                ? 'arrow-down'
                : 'arrow-up'
            }
            size={18}
            color={
              activeTab === 'payout' || item.F5_TYPE === 'Payouts'
                ? '#EF4444'
                : '#10B981'
            }
          />
        </View>
        <View>
          <Text style={[styles.ref, { color: colors.text }]}>{item.F5_NO}</Text>
          <Text style={[styles.date, { color: colors.muted }]}>
            {item.F5_DATE}
          </Text>
        </View>
      </View>

      <Text
        style={[
          styles.amount,
          {
            color:
              activeTab === 'payout' || item.F5_TYPE === 'Payouts'
                ? '#EF4444'
                : '#10B981',
          },
        ]}
      >
        {activeTab === 'payout' || item.F5_TYPE === 'Payouts' ? '-' : '+'} ₹
        {item.F5_AMT}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
        >
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Payouts
        </Text>

        <TouchableOpacity onPress={fetchData} style={styles.headerBtn}>
          <Icon name="refresh" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        {/* SUMMARY CARDS */}
        <View style={styles.summary}>
          <View
            style={[
              styles.box,
              styles.shadowBox,
              { backgroundColor: colors.card },
            ]}
          >
            <View style={[styles.boxIcon, { backgroundColor: '#DBEAFE' }]}>
              <Icon name="wallet-outline" size={20} color="#2563EB" />
            </View>
            <Text style={[styles.label, { color: colors.muted }]}>
              Commission
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              ₹{summary.total_commission}
            </Text>
          </View>

          <View
            style={[
              styles.box,
              styles.shadowBox,
              { backgroundColor: colors.card },
            ]}
          >
            <View style={[styles.boxIcon, { backgroundColor: '#FEE2E2' }]}>
              <Icon name="trending-down-outline" size={20} color="#EF4444" />
            </View>
            <Text style={[styles.label, { color: colors.muted }]}>Payout</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              ₹{summary.total_payout}
            </Text>
          </View>

          <View
            style={[
              styles.box,
              styles.shadowBox,
              { backgroundColor: colors.card },
            ]}
          >
            <View style={[styles.boxIcon, { backgroundColor: '#D1FAE5' }]}>
              <Icon name="cash-outline" size={20} color="#10B981" />
            </View>
            <Text style={[styles.label, { color: colors.muted }]}>Balance</Text>
            <Text
              style={[
                styles.value,
                { color: summary.total_balance < 0 ? '#EF4444' : '#10B981' },
              ]}
            >
              ₹{summary.total_balance}
            </Text>
          </View>
        </View>

        {/* WITHDRAW BUTTON */}
        <TouchableOpacity
          disabled={summary.total_balance <= 0}
          onPress={() => setShowWithdraw(true)}
          style={[
            styles.withdrawBtn,
            styles.shadowBox,
            {
              backgroundColor:
                summary.total_balance <= 0 ? '#E5E7EB' : '#2563EB',
            },
          ]}
        >
          <Icon
            name="card-outline"
            size={20}
            color={summary.total_balance <= 0 ? '#9CA3AF' : '#fff'}
            style={{ marginRight: 8 }}
          />
          <Text
            style={[
              styles.withdrawText,
              { color: summary.total_balance <= 0 ? '#9CA3AF' : '#fff' },
            ]}
          >
            Withdraw Funds
          </Text>
        </TouchableOpacity>

        {/* TABS */}
        <View style={[styles.tabs, { backgroundColor: colors.card }]}>
          {tabs.map(t => (
            <TouchableOpacity
              key={t}
              onPress={() => setActiveTab(t)}
              style={[
                styles.tab,
                activeTab === t && {
                  backgroundColor: '#2563EB',
                  borderRadius: 8,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === t ? '#fff' : colors.muted },
                ]}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* LIST */}
        <FlatList
          data={transactions}
          keyExtractor={(item, i) => i.toString()}
          renderItem={renderItem}
          refreshing={loading}
          onRefresh={fetchData}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyContainer}>
                <Icon name="document-text-outline" size={64} color="#E5E7EB" />
                <Text style={[styles.emptyText, { color: colors.muted }]}>
                  No transactions found
                </Text>
              </View>
            )
          }
        />

        {/* WITHDRAW MODAL */}
        <Modal visible={showWithdraw} transparent animationType="fade">
          <View style={styles.modalWrap}>
            <View style={[styles.modal, { backgroundColor: colors.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Withdraw Amount
                </Text>
                <TouchableOpacity onPress={() => setShowWithdraw(false)}>
                  <Icon name="close-circle" size={28} color={colors.muted} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.balanceLabel, { color: colors.muted }]}>
                Available Balance
              </Text>
              <Text style={[styles.balanceAmount, { color: '#10B981' }]}>
                ₹{summary.total_balance}
              </Text>

              <View style={styles.inputContainer}>
                <Text style={[styles.rupeeSymbol, { color: colors.text }]}>
                  ₹
                </Text>
                <TextInput
                  placeholder="Enter amount"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                  value={withdrawAmount}
                  onChangeText={setWithdrawAmount}
                  style={[styles.input, { color: colors.text }]}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => setShowWithdraw(false)}
                  style={[styles.modalBtn, styles.cancelBtn]}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={submitWithdraw}
                  style={[styles.modalBtn, styles.submitBtn]}
                >
                  <Text style={styles.submitText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default PayoutScreen;

const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  container: {
    flex: 1,
    padding: 16,
  },

  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  box: {
    flex: 1,
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  shadowBox: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  boxIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
  },

  withdrawBtn: {
    flexDirection: 'row',
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawText: {
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },

  tabs: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  tabText: {
    fontWeight: '600',
    fontSize: 13,
  },

  listContent: {
    paddingBottom: 30,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ref: {
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
  },
  amount: {
    fontWeight: '700',
    fontSize: 16,
  },

  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 15,
  },

  modalWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modal: {
    width: '85%',
    padding: 24,
    borderRadius: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  balanceLabel: {
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#2563EB',
    marginBottom: 24,
  },
  rupeeSymbol: {
    fontSize: 20,
    fontWeight: '600',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 18,
    paddingVertical: 12,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F3F4F6',
  },
  cancelText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 15,
  },
  submitBtn: {
    backgroundColor: '#2563EB',
  },
  submitText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
