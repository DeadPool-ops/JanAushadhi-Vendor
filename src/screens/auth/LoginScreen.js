import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  Keyboard,
} from 'react-native';
import LottieView from 'lottie-react-native';

import { ThemeContext } from '../../context/ThemeContext';
import { loginUser, sendOTP } from '../../api/authApi';

const LoginScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  const colors = {
    background: isDark ? '#0F172A' : '#F8FAFC',
    card: isDark ? '#071028' : '#FFFFFF',
    border: isDark ? '#1F2937' : '#E5E7EB',
    text: isDark ? '#E6F0FF' : '#0F172A',
    subText: isDark ? '#9CA3AF' : '#475569',
    label: isDark ? '#CBD5E1' : '#334155',
    inputText: isDark ? '#F8FAFC' : '#0F172A',
    placeholder: '#9CA3AF',
    primary: '#2563EB',
    disabled: isDark ? '#334155' : '#CBD5E1',
  };

  const [mobileNumber, setMobileNumber] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSendOTP = async () => {
    if (mobileNumber.length !== 10) return;

    try {
      setLoading(true);
      const res = await loginUser(mobileNumber);
      if (res?.data?.response === 'success') {
        const code = res.data.data.M1_CODE;
        await sendOTP(code);
        navigation.navigate('OTP', { code, mobileNumber });
      } else {
        alert('Invalid number');
      }
    } catch {
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  const onChangeMobile = text => {
    setMobileNumber(text.replace(/[^0-9]/g, ''));
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View style={styles.content}>
          {/* Animation */}
          <View style={styles.animationContainer}>
            <LottieView
              source={require('../../assets/animations/login-animation.json')}
              autoPlay
              loop
              style={styles.animation}
            />
          </View>

          {/* Header */}
          <View style={styles.headerSection}>
            <Text style={[styles.welcomeText, { color: colors.text }]}>
              Welcome Back
            </Text>
            <Text style={[styles.subtitleText, { color: colors.subText }]}>
              Enter your mobile number to continue
            </Text>
          </View>

          {/* Input */}
          <View style={styles.inputSection}>
            <Text style={[styles.label, { color: colors.label }]}>
              Mobile Number
            </Text>

            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.countryCode, { color: colors.primary }]}>
                +91
              </Text>

              <TextInput
                style={[styles.input, { color: colors.inputText }]}
                placeholder="Enter mobile number"
                placeholderTextColor={colors.placeholder}
                keyboardType="phone-pad"
                maxLength={10}
                value={mobileNumber}
                onChangeText={onChangeMobile}
                returnKeyType="done"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.otpButton,
                {
                  backgroundColor:
                    mobileNumber.length === 10
                      ? colors.primary
                      : colors.disabled,
                },
              ]}
              onPress={handleSendOTP}
              disabled={mobileNumber.length !== 10 || loading}
            >
              <Text style={styles.otpButtonText}>
                {loading ? 'Please wait...' : 'Send OTP'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          {!keyboardVisible && (
            <View style={styles.footer}>
              <Text style={[styles.vendorText, { color: colors.subText }]}>
                Want to sell with us?
              </Text>
              <TouchableOpacity>
                <Text style={[styles.vendorLink, { color: colors.primary }]}>
                  Become our Vendor
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 60,
  },

  animationContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  animation: {
    width: 220,
    height: 220,
  },

  headerSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 34,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },

  inputSection: {
    marginTop: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 56,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 12,
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },

  otpButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    elevation: 3,
  },
  otpButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  footer: {
    alignItems: 'center',
    paddingTop: 22,
  },
  vendorText: {
    fontSize: 14,
    marginBottom: 6,
  },
  vendorLink: {
    fontSize: 16,
    fontWeight: '600',
  },
});
