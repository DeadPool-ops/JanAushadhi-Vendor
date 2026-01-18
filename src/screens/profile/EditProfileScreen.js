import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';

import { ThemeContext } from '../../context/ThemeContext';
import { editProfileTheme } from '../../theme/editProfileTheme';
import { updateProfile } from '../../api/profileApi';

const EditProfileScreen = ({ route, navigation }) => {
  const { profile } = route.params;
  const { theme } = useContext(ThemeContext);
  const colors = editProfileTheme[theme];
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(false);

  const [ownerName, setOwnerName] = useState(profile?.M1_NAME || '');
  const [email, setEmail] = useState(profile?.M1_IT || '');
  const [gender, setGender] = useState(profile?.M1_PM || '');
  const [dob, setDob] = useState(profile?.M1_DT1 || '');
  const [address, setAddress] = useState(profile?.M1_ADD || '');

  const [businessName, setBusinessName] = useState(profile?.M1_BNAME || '');
  const [mobile1, setMobile1] = useState(profile?.M1_TEL1 || '');
  const [mobile2, setMobile2] = useState(profile?.M1_TEL2 || '');
  const [officeMail, setOfficeMail] = useState(profile?.M1_IT1 || '');

  const [pharmacyLicense, setPharmacyLicense] = useState(null);
  const [drugPermit, setDrugPermit] = useState(null);
  const [pharmacistCertificate, setPharmacistCertificate] = useState(null);
  const [gst, setGST] = useState(null);
  const [addressProof, setAddressProof] = useState(null);
  const [shopImage, setShopImage] = useState(null);

  const pickFile = async setFile => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, res => {
      if (res.didCancel || res.errorMessage) return;
      const asset = res.assets?.[0];
      if (asset) {
        setFile({
          uri: asset.uri,
          type: asset.type,
          name: asset.fileName || `file_${Date.now()}.jpg`,
        });
      }
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const resp = await updateProfile(
        profile.M1_CODE,
        ownerName,
        email,
        gender,
        dob,
        address,
        businessName,
        mobile1,
        mobile2,
        officeMail,
        pharmacyLicense,
        drugPermit,
        pharmacistCertificate,
        gst,
        addressProof,
        shopImage,
      );

      const payload = resp?.data ?? resp;
      if (payload.response !== 'success') {
        throw new Error(payload.message || 'Update failed');
      }

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={[styles.header, { color: colors.text }]}>
          Edit Profile
        </Text>

        <Input
          label="Owner Name"
          value={ownerName}
          onChangeText={setOwnerName}
          colors={colors}
        />
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          colors={colors}
        />
        <Input
          label="Gender"
          value={gender}
          onChangeText={setGender}
          colors={colors}
        />
        <Input
          label="Date of Birth"
          value={dob}
          onChangeText={setDob}
          colors={colors}
        />
        <Input
          label="Address"
          value={address}
          onChangeText={setAddress}
          colors={colors}
        />

        <Input
          label="Business Name"
          value={businessName}
          onChangeText={setBusinessName}
          colors={colors}
        />
        <Input
          label="Mobile 1"
          value={mobile1}
          onChangeText={setMobile1}
          colors={colors}
        />
        <Input
          label="Mobile 2"
          value={mobile2}
          onChangeText={setMobile2}
          colors={colors}
        />
        <Input
          label="Office Mail"
          value={officeMail}
          onChangeText={setOfficeMail}
          colors={colors}
        />

        <UploadBox
          title="Pharmacy License"
          file={pharmacyLicense}
          onPress={() => pickFile(setPharmacyLicense)}
          colors={colors}
        />
        <UploadBox
          title="Drug Permit"
          file={drugPermit}
          onPress={() => pickFile(setDrugPermit)}
          colors={colors}
        />
        <UploadBox
          title="Pharmacist Certificate"
          file={pharmacistCertificate}
          onPress={() => pickFile(setPharmacistCertificate)}
          colors={colors}
        />
        <UploadBox
          title="GST"
          file={gst}
          onPress={() => pickFile(setGST)}
          colors={colors}
        />
        <UploadBox
          title="Address Proof"
          file={addressProof}
          onPress={() => pickFile(setAddressProof)}
          colors={colors}
        />
        <UploadBox
          title="Shop Image"
          file={shopImage}
          onPress={() => pickFile(setShopImage)}
          colors={colors}
        />

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditProfileScreen;

/* ---------------- COMPONENTS ---------------- */

const Input = ({ label, value, onChangeText, colors }) => (
  <View style={styles.inputWrapper}>
    <Text style={[styles.label, { color: colors.subText }]}>{label}</Text>
    <TextInput
      style={[
        styles.input,
        {
          backgroundColor: colors.inputBg,
          borderColor: colors.border,
          color: colors.inputText,
        },
      ]}
      value={value}
      onChangeText={onChangeText}
      placeholder={label}
      placeholderTextColor={colors.placeholder}
    />
  </View>
);

const UploadBox = ({ title, file, onPress, colors }) => (
  <View style={styles.uploadWrapper}>
    <Text style={[styles.label, { color: colors.subText }]}>{title}</Text>
    <TouchableOpacity
      style={[
        styles.uploadBox,
        { backgroundColor: colors.uploadBg, borderColor: colors.border },
      ]}
      onPress={onPress}
    >
      {file ? (
        <Image source={{ uri: file.uri }} style={styles.uploadImage} />
      ) : (
        <Text style={[styles.uploadText, { color: colors.mutedText }]}>
          Upload {title}
        </Text>
      )}
    </TouchableOpacity>
  </View>
);

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 16 },

  header: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },

  inputWrapper: { marginBottom: 14 },
  label: { fontSize: 14, marginBottom: 6 },

  input: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    fontSize: 14,
  },

  uploadWrapper: { marginBottom: 16 },
  uploadBox: {
    height: 140,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: { fontSize: 14 },
  uploadImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },

  saveButton: {
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
  },
});
