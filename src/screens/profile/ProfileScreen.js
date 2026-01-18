import React, { useCallback, useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  StatusBar,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { launchImageLibrary } from "react-native-image-picker";

import { AuthContext } from "../../context/AuthContext";
import {
  getProfile,
  updateProfilePic,
  baseImageUrl,
} from "../../api/profileApi";
import { ThemeContext } from '../../context/ThemeContext';
import { profileTheme } from '../../theme/profileTheme';

const ProfileScreen = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);

  const [profile, setProfile] = useState(null);

  const navigation = useNavigation();
  const { logout, user } = useContext(AuthContext);

  const VENDOR_ID = user?.M1_CODE || user?.vendorId || user?.id || null;

  const { theme, toggleTheme, colors } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  const themeColors = profileTheme[theme];

  // ------------------------------------------------------------------
  // ⬇️ FETCH PROFILE API
  // ------------------------------------------------------------------
  const fetchProfile = useCallback(
    async (vendorId = VENDOR_ID) => {
      if (!vendorId) return;

      try {
        setLoadingProfile(true);

        const resp = await getProfile(vendorId);
        const payload = resp?.data ?? resp;

        if (!payload || payload.response !== "success") {
          throw new Error(payload?.message || "Unable to fetch profile");
        }

        setProfile(payload.data);
      } catch (err) {
        console.warn("Profile fetch error: ", err);
        Alert.alert("Error", err?.message || "Failed to load profile");
      } finally {
        setLoadingProfile(false);
      }
    },
    [VENDOR_ID]
  );

  // useEffect(() => {
  //   fetchProfile();
  // }, [fetchProfile]);

  useFocusEffect(
    useCallback(() => {
      if (VENDOR_ID) {
        fetchProfile(VENDOR_ID);
      }
    }, [VENDOR_ID, fetchProfile])
  );

  // ------------------------------------------------------------------
  // ⬇️ UPLOAD PROFILE PICTURE API + IMAGE PICKER
  // ------------------------------------------------------------------
  const pickProfilePhoto = () => {
    launchImageLibrary(
      {
        mediaType: "photo",
        quality: 0.8,
      },
      async (response) => {
        if (response.didCancel) return;
        if (response.errorMessage) {
          Alert.alert("Error", response.errorMessage);
          return;
        }

        const asset = response.assets?.[0];
        if (!asset) return;

        const photo = {
          uri: asset.uri,
          type: asset.type,
          name: asset.fileName || `photo_${Date.now()}.jpg`,
        };

        await uploadProfilePic(photo);
      }
    );
  };

  // Upload API
  const uploadProfilePic = async (photo) => {
    try {
      setUploadingPic(true);

      const resp = await updateProfilePic(VENDOR_ID, photo);
      console.log(resp);
      const payload = resp?.data ?? resp;

      if (payload.response !== "success") {
        throw new Error(payload.message || "Failed to update photo");
      }

      Alert.alert("Success", "Profile photo updated");

      // Refresh profile to show new image
      fetchProfile();
    } catch (err) {
      Alert.alert("Error", err?.message || "Upload failed");
    } finally {
      setUploadingPic(false);
    }
  };

  // ------------------------------------------------------------------
  // Logout Handler
  // ------------------------------------------------------------------
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            setLoggingOut(true);
            await logout();
          } catch (err) {
            Alert.alert("Logout failed", err?.message);
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  // ------------------------------------------------------------------
  // PREP DATA
  // ------------------------------------------------------------------
  const vendorName =
    profile?.M1_NAME || user?.M1_NAME || user?.name || "Vendor Name";

  const vendorEmail =
    profile?.M1_IT || user?.M1_IT || user?.email || "vendor@email.com";

  const vendorPhone =
    profile?.M1_TEL || profile?.M1_TEL1 || user?.phone || "+91 XXXXX XXXXX";

  const profileImageUrl = profile?.M1_DC0
    ? `${baseImageUrl}${profile.M1_DC0}`
    : null;

  // ------------------------------------------------------------------
  // MENU ITEMS
  // ------------------------------------------------------------------
  const menuItems = [
    {
      id: 1,
      icon: '💳',
      title: 'Payout',
      subtitle: 'Check your Complete Payout Details.',
      action: () => navigation.navigate('Payout', { profile }),
      showArrow: true,
    },
    {
      id: 2,
      icon: '👤',
      title: 'Edit Profile',
      subtitle: 'Update your personal details',
      action: () => navigation.navigate('EditProfile', { profile }),
      showArrow: true,
    },
    {
      id: 3,
      icon: '🏪',
      title: 'Business Details',
      subtitle: profile?.M1_BNAME || 'Manage your business info',
      action: () => navigation.navigate('BusinessDetails', { profile }),
      showArrow: true,
    },
    {
      id: 4,
      icon: '🔔',
      title: 'Notifications',
      subtitle: 'Order & promotional alerts',
      isSwitch: true,
      value: notificationsEnabled,
      onValueChange: setNotificationsEnabled,
    },
    {
      id: 5,
      icon: isDark ? '🌙' : '☀️',
      title: isDark ? 'Dark Mode' : 'Light Mode',
      subtitle: 'Switch app appearance',
      isSwitch: true,
      value: !isDark,
      onValueChange: toggleTheme,
    },
    {
      id: 6,
      icon: '🔒',
      title: 'Privacy Policy',
      subtitle: 'How we protect your data',
      action: () => navigation.navigate('Privacy'),
      showArrow: true,
    },
  ];

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: themeColors.safeArea }]}
    >
      <StatusBar backgroundColor="#020617" barStyle="light-content" />

      <ScrollView
        style={[styles.container, { backgroundColor: themeColors.container }]}
      >
        {/* ------------------------------------------------------ */}
        {/* PROFILE HEADER */}
        {/* ------------------------------------------------------ */}
        <View
          style={[
            styles.profileHeader,
            {
              backgroundColor: themeColors.header,
              borderBottomColor: themeColors.cardBorder,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.profileImageContainer}
            activeOpacity={0.8}
            onPress={pickProfilePhoto}
          >
            <View style={styles.profileImage}>
              {loadingProfile || uploadingPic ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : profileImageUrl ? (
                <Image
                  source={{ uri: profileImageUrl }}
                  style={{ width: '100%', height: '100%', borderRadius: 50 }}
                />
              ) : (
                <Text style={styles.profileInitials}>
                  {vendorName.substring(0, 2).toUpperCase()}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.editPhotoButton}
              onPress={pickProfilePhoto}
            >
              <Text style={styles.editPhotoIcon}>📷</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          <Text style={[styles.vendorName, { color: themeColors.text }]}>
            {vendorName}
          </Text>
          <Text style={[styles.vendorEmail, { color: themeColors.subText }]}>
            {vendorEmail}
          </Text>
          <Text style={styles.vendorPhone}>{vendorPhone}</Text>
        </View>

        {/* ------------------------------------------------------ */}
        {/* MENU */}
        {/* ------------------------------------------------------ */}
        <View
          style={[
            styles.menuSection,
            {
              backgroundColor: themeColors.card,
              borderColor: themeColors.cardBorder,
            },
          ]}
        >
          {menuItems.map((item, index) => (
            <View key={item.id}>
              {item.isSwitch ? (
                <View style={styles.menuItem}>
                  <View
                    style={[
                      styles.menuIcon,
                      { backgroundColor: themeColors.iconBg },
                    ]}
                  >
                    <Text style={styles.menuIconText}>{item.icon}</Text>
                  </View>

                  <View style={styles.menuContent}>
                    <Text
                      style={[styles.menuTitle, { color: themeColors.text }]}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={[
                        styles.menuSubtitle,
                        { color: themeColors.subText },
                      ]}
                    >
                      {item.subtitle}
                    </Text>
                  </View>

                  <Switch
                    value={item.value}
                    onValueChange={item.onValueChange}
                    trackColor={{
                      false: theme === 'dark' ? '#374151' : '#CBD5E1',
                      true: '#60A5FA',
                    }}
                  />
                </View>
              ) : (
                <TouchableOpacity style={styles.menuItem} onPress={item.action}>
                  <View
                    style={[
                      styles.menuIcon,
                      { backgroundColor: themeColors.iconBg },
                    ]}
                  >
                    <Text style={styles.menuIconText}>{item.icon}</Text>
                  </View>

                  <View style={styles.menuContent}>
                    <Text
                      style={[styles.menuTitle, { color: themeColors.text }]}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={[
                        styles.menuSubtitle,
                        { color: themeColors.subText },
                      ]}
                    >
                      {item.subtitle}
                    </Text>
                  </View>

                  {item.showArrow && <Text style={styles.menuArrow}>›</Text>}
                </TouchableOpacity>
              )}

              {index < menuItems.length - 1 && (
                <View
                  style={[
                    styles.divider,
                    { backgroundColor: themeColors.divider },
                  ]}
                />
              )}
            </View>
          ))}
        </View>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>
            {loggingOut ? 'Logging out...' : 'Logout'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 1.0.0</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#020617" },
  container: { flex: 1, backgroundColor: "#020617" },

  /* PROFILE HEADER */
  profileHeader: {
    backgroundColor: "#0B1220",
    paddingVertical: 28,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#111827",
  },

  profileImageContainer: { position: "relative", marginBottom: 12 },

  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#1D4ED8",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  profileInitials: {
    fontSize: 34,
    fontWeight: "700",
    color: "#fff",
  },

  editPhotoButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#00000099",
    justifyContent: "center",
    alignItems: "center",
  },

  editPhotoIcon: { fontSize: 18, color: "#fff" },

  vendorName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginTop: 10,
  },

  vendorEmail: { fontSize: 13, color: "#9CA3AF", marginTop: 4 },
  vendorPhone: { fontSize: 13, color: "#9CA3AF", marginTop: 2 },

  /* MENU */
  menuSection: {
    backgroundColor: "#071025",
    marginTop: 20,
    marginHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#0F1724",
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
  },

  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#020617",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  menuIconText: { fontSize: 22, color: "#fff" },

  menuContent: { flex: 1 },

  menuTitle: { fontSize: 15, fontWeight: "700", color: "#fff" },

  menuSubtitle: { color: "#9CA3AF", fontSize: 12, marginTop: 2 },

  menuArrow: { fontSize: 28, color: "#6B7280" },

  divider: {
    height: 1,
    backgroundColor: "#0F1724",
    marginLeft: 80,
  },

  /* LOGOUT */
  logoutButton: {
    marginTop: 22,
    // marginBottom: 50,
    marginHorizontal: 14,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2F1B1B",
    justifyContent: "center",
    alignItems: "center",
  },

  logoutIcon: { fontSize: 20, marginBottom: 2 },

  logoutText: { color: "#FCA5A5", fontSize: 16, fontWeight: "700" },

  versionText: {
    textAlign: "center",
    color: "#6B7280",
    marginTop: 10,
    marginBottom: 50,
  },
});

export default ProfileScreen;
