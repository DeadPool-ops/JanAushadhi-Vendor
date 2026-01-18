import React, { useState, useRef, useEffect, useContext } from 'react';
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
  AppState,
  Alert,
} from 'react-native';
import LottieView from 'lottie-react-native';

import { verifyOTP, sendOTP } from '../../api/authApi';
import { AuthContext } from '../../context/AuthContext';
import { registerFCMToken } from '../../utils/registerFCMToken';
import { ThemeContext } from '../../context/ThemeContext';
import { otpTheme } from '../../theme/otpTheme';

// Dynamic import for clipboard
let Clipboard = null;
try {
  Clipboard = require('@react-native-clipboard/clipboard').default;
} catch (e) {
  console.log(
    'Clipboard library not installed. Please run: npm install @react-native-clipboard/clipboard',
  );
}

const OTPVerifyScreen = ({ route, navigation }) => {
  const { theme } = useContext(ThemeContext);
  const colors = otpTheme[theme];
  const isDark = theme === 'dark';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const inputRefs = useRef([]);
  const lastClipboardContent = useRef('');

  const { code, mobileNumber = '**********' } = route.params;
  const { saveUser } = useContext(AuthContext);

  /* ---------------- Keyboard Listener ---------------- */
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
      checkClipboardForOtp();
    });
    const hide = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  /* ---------------- App Resume Listener ---------------- */
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') checkClipboardForOtp();
    });
    return () => sub?.remove?.();
  }, []);

  /* ---------------- Timer ---------------- */
  useEffect(() => {
    if (timer > 0) {
      const i = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(i);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  /* ---------------- Clipboard OTP Autofill ---------------- */
  const checkClipboardForOtp = async () => {
    if (!Clipboard) return; // Skip if library not installed

    try {
      const text = await Clipboard.getString();

      // Only process if it's different from last time
      if (text === lastClipboardContent.current) return;

      const match = text?.match(/(\d{6})/);
      if (match && match[1] && match[1] !== otp.join('')) {
        lastClipboardContent.current = text;
        autofillOtp(match[1]);
      }
    } catch (error) {
      console.log('Clipboard check error:', error);
    }
  };

  const autofillOtp = codeStr => {
    if (codeStr.length !== 6) return;
    const arr = codeStr.split('');
    setOtp(arr);

    setTimeout(() => {
      inputRefs.current[5]?.focus?.();
      Keyboard.dismiss();
      handleVerifyOTP(codeStr);
    }, 200);
  };

  const handlePasteFromClipboard = async () => {
    if (!Clipboard) {
      Alert.alert(
        'Feature Unavailable',
        'Clipboard feature requires installation. Please run:\n\nnpm install @react-native-clipboard/clipboard\n\nThen manually enter your OTP.',
      );
      return;
    }

    try {
      const text = await Clipboard.getString();

      if (!text) {
        Alert.alert('Clipboard Empty', 'No content found in clipboard');
        return;
      }

      const match = text.match(/(\d{6})/);

      if (match && match[1]) {
        lastClipboardContent.current = text;
        autofillOtp(match[1]);
      } else {
        Alert.alert('Invalid Format', 'No 6-digit OTP found in clipboard');
      }
    } catch (error) {
      console.log('Paste error:', error);
      Alert.alert('Error', 'Could not access clipboard');
    }
  };

  /* ---------------- OTP Logic ---------------- */
  const handleOtpChange = (val, index) => {
    const digit = val.replace(/[^0-9]/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus?.();
    }

    if (index === 5 && digit) {
      setTimeout(() => handleVerifyOTP(newOtp.join('')), 200);
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus?.();
    }
  };

  const handleVerifyOTP = async forceOtp => {
    const otpValue = forceOtp ?? otp.join('');
    if (otpValue.length !== 6) return;

    try {
      setLoading(true);
      const res = await verifyOTP(code, otpValue);
      if (res?.data?.response === 'success') {
        const userData = res.data.data;
        await saveUser(userData);
        if (userData?.M1_CODE) {
          setTimeout(() => registerFCMToken(userData.M1_CODE), 1500);
        }
      } else {
        Alert.alert('Invalid OTP', 'Please check your OTP and try again');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus?.();
      }
    } catch (error) {
      console.log('Verify error:', error);
      Alert.alert(
        'Network Error',
        'Please check your connection and try again',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    setCanResend(false);
    setTimer(30);
    setOtp(['', '', '', '', '', '']);

    try {
      await sendOTP(code);
      Alert.alert('OTP Sent', 'A new OTP has been sent to your mobile number');
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP. Please try again');
      setCanResend(true);
      setTimer(0);
    }
  };

  const isOtpComplete = otp.every(d => d !== '');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {!keyboardVisible && (
            <View style={styles.animationContainer}>
              <LottieView
                source={require('../../assets/animations/otp-animation.json')}
                autoPlay
                loop
                style={styles.animation}
              />
            </View>
          )}

          <View style={styles.headerSection}>
            <Text style={[styles.titleText, { color: colors.text }]}>
              Verify OTP
            </Text>
            <Text style={[styles.subtitleText, { color: colors.subText }]}>
              Enter the 6-digit code sent to
            </Text>
            <Text style={[styles.mobileText, { color: colors.accent }]}>
              +91 {mobileNumber}
            </Text>
          </View>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={r => (inputRefs.current[index] = r)}
                style={[
                  styles.otpInput,
                  {
                    backgroundColor: digit
                      ? colors.inputFilledBg
                      : colors.inputBg,
                    borderColor: digit ? colors.primary : colors.border,
                    color: colors.inputText,
                  },
                ]}
                maxLength={1}
                keyboardType="number-pad"
                value={digit}
                onChangeText={v => handleOtpChange(v, index)}
                onKeyPress={e => handleKeyPress(e, index)}
                textAlign="center"
                selectTextOnFocus
              />
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.pasteButton,
              {
                backgroundColor: colors.inputBg,
                borderColor: colors.border,
              },
            ]}
            onPress={handlePasteFromClipboard}
            activeOpacity={0.7}
          >
            <Text style={[styles.pasteButtonText, { color: colors.accent }]}>
              📋 Paste from Clipboard
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.verifyButton,
              {
                backgroundColor: isOtpComplete
                  ? colors.primary
                  : colors.disabled,
              },
            ]}
            onPress={() => handleVerifyOTP()}
            disabled={!isOtpComplete || loading}
            activeOpacity={0.8}
          >
            <Text style={styles.verifyButtonText}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </Text>
          </TouchableOpacity>

          <View style={styles.resendSection}>
            {!canResend ? (
              <Text style={[styles.timerText, { color: colors.subText }]}>
                Resend OTP in{' '}
                <Text style={{ color: colors.accent, fontWeight: '600' }}>
                  {timer}s
                </Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResendOTP} activeOpacity={0.7}>
                <Text style={[styles.resendText, { color: colors.accent }]}>
                  Resend OTP
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {!keyboardVisible && (
            <View style={styles.footer}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.changeNumberText, { color: colors.subText }]}
                >
                  Change Mobile Number
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default OTPVerifyScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingVertical: 40,
  },

  animationContainer: { alignItems: 'center', marginBottom: 12 },
  animation: { width: 200, height: 200 },

  headerSection: { marginBottom: 32, alignItems: 'center' },
  titleText: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  mobileText: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 6,
    letterSpacing: 0.5,
  },

  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  otpInput: {
    flex: 1,
    height: 58,
    borderWidth: 2,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '700',
  },

  pasteButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
  },
  pasteButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },

  verifyButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  resendSection: { alignItems: 'center', marginTop: 24 },
  timerText: { fontSize: 14 },
  resendText: { fontSize: 15, fontWeight: '700' },

  footer: { alignItems: 'center', paddingTop: 32 },
  changeNumberText: { fontSize: 15, fontWeight: '600' },
});
