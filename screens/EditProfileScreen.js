import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as ImagePicker from "expo-image-picker";
import { auth, storage, db } from "../firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function EditProfileScreen({ navigation }) {
  const uid = auth.currentUser?.uid;
  const [profile, setProfile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Load profile info
  useEffect(() => {
    if (!uid) return;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) setProfile(snap.data());
        else
          setProfile({
            email: auth.currentUser?.email,
            displayName: "",
            phone: "",
            bio: "",
            avatar: "",
            address: "",
            birthDate: "",
            gender: "",
          });
      } catch (e) {
        console.log("Load profile error", e);
      } finally {
        setLoadingProfile(false);
      }
    };
    load();
  }, [uid]);

  // Pick + upload avatar
  const pickImageAndUpload = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted)
      return Alert.alert("Quyền bị từ chối", "Cần quyền truy cập ảnh để cập nhật avatar.");

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: [ImagePicker.MediaType.IMAGE],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (res.canceled) return;
    const uri = res.assets[0].uri;

    try {
      setUploading(true);
      const response = await fetch(uri);
      const blob = await response.blob();

      const fileRef = ref(storage, `avatars/${uid}-${Date.now()}.jpg`);
      await uploadBytes(fileRef, blob);
      const downloadURL = await getDownloadURL(fileRef);

      await updateDoc(doc(db, "users", uid), { avatar: downloadURL });
      setProfile((p) => ({ ...(p || {}), avatar: downloadURL }));

      Alert.alert("✅ Thành công", "Ảnh đại diện đã được cập nhật.");
    } catch (error) {
      console.log("Upload error", error);
      Alert.alert("Lỗi", error.message || "Không thể tải ảnh lên.");
    } finally {
      setUploading(false);
    }
  };

  // Format birth date automatically
  const formatBirthDate = (text) => {
    // Remove all non-numeric characters
    const numbers = text.replace(/\D/g, '');
    
    // Limit to 8 digits (DDMMYYYY)
    const limitedNumbers = numbers.slice(0, 8);
    
    // Format based on length
    if (limitedNumbers.length <= 2) {
      return limitedNumbers;
    } else if (limitedNumbers.length <= 4) {
      return `${limitedNumbers.slice(0, 2)}/${limitedNumbers.slice(2)}`;
    } else {
      return `${limitedNumbers.slice(0, 2)}/${limitedNumbers.slice(2, 4)}/${limitedNumbers.slice(4)}`;
    }
  };

  // Validate birth date
  const validateBirthDate = (dateStr) => {
    if (!dateStr || dateStr.length < 10) return true; // Allow incomplete dates
    
    const parts = dateStr.split('/');
    if (parts.length !== 3) return false;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    
    // Basic validation
    if (day < 1 || day > 31) return false;
    if (month < 1 || month > 12) return false;
    if (year < 1900 || year > new Date().getFullYear()) return false;
    
    // Check if date is valid
    const date = new Date(year, month - 1, day);
    return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year;
  };

  // Save profile info
  const handleSave = async () => {
    if (!profile) return;
    
    // Validate birth date if provided
    if (profile.birthDate && !validateBirthDate(profile.birthDate)) {
      Alert.alert("Lỗi", "Ngày sinh không hợp lệ. Vui lòng kiểm tra lại.");
      return;
    }
    
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", uid), {
        displayName: profile.displayName || "",
        phone: profile.phone || "",
        bio: profile.bio || "",
        avatar: profile.avatar || "",
        address: profile.address || "",
        birthDate: profile.birthDate || "",
        gender: profile.gender || "",
      });
      Alert.alert("✅ Đã lưu", "Thông tin cá nhân đã được cập nhật!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      console.log("Save error", err);
      Alert.alert("Lỗi", "Không thể lưu thông tin.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingProfile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8E2DE2" />
        <Text style={{ marginTop: 10, color: "#666" }}>Đang tải thông tin...</Text>
      </View>
    );
  }

  return (
    <KeyboardAwareScrollView 
      style={styles.keyboardAvoidingView}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      extraScrollHeight={20}
    >
        <Text style={styles.title}>Chỉnh sửa thông tin</Text>

      {/* Avatar */}
      <View style={styles.avatarWrap}>
        {profile?.avatar ? (
          <Image source={{ uri: profile.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 36 }}>
              {profile?.email?.[0]?.toUpperCase() || "?"}
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.btnOutline, uploading && { opacity: 0.6 }]}
        onPress={pickImageAndUpload}
        disabled={uploading}
      >
        <Text style={styles.btnOutlineText}>
          {uploading ? "Đang tải ảnh..." : "Cập nhật ảnh đại diện"}
        </Text>
      </TouchableOpacity>

      {/* Form fields */}
      <View style={styles.formContainer}>
        <Text style={styles.label}>Email</Text>
        <View style={styles.readOnlyField}>
          <Text style={styles.readOnlyText}>{profile?.email || "Chưa có"}</Text>
        </View>

        <Text style={styles.label}>Họ tên</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập họ tên..."
          value={profile?.displayName || ""}
          onChangeText={(t) => setProfile({ ...profile, displayName: t })}
        />

        <Text style={styles.label}>Số điện thoại</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập số điện thoại..."
          keyboardType="phone-pad"
          value={profile?.phone || ""}
          onChangeText={(t) => setProfile({ ...profile, phone: t })}
        />

        <Text style={styles.label}>Giới thiệu</Text>
        <TextInput
          style={[styles.input, { height: 70 }]}
          multiline
          placeholder="Mô tả ngắn về bạn..."
          value={profile?.bio || ""}
          onChangeText={(t) => setProfile({ ...profile, bio: t })}
        />

        <Text style={styles.label}>Địa chỉ</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập địa chỉ..."
          value={profile?.address || ""}
          onChangeText={(t) => setProfile({ ...profile, address: t })}
        />

        <Text style={styles.label}>Ngày sinh</Text>
        <TextInput
          style={[
            styles.input,
            profile?.birthDate && !validateBirthDate(profile.birthDate) && styles.inputError
          ]}
          placeholder="DD/MM/YYYY"
          value={profile?.birthDate || ""}
          onChangeText={(text) => {
            console.log('Input text:', text);
            const formatted = formatBirthDate(text);
            console.log('Formatted text:', formatted);
            setProfile({ ...profile, birthDate: formatted });
          }}
          keyboardType="numeric"
          maxLength={10}
        />
        {profile?.birthDate && !validateBirthDate(profile.birthDate) && (
          <Text style={styles.errorText}>Ngày sinh không hợp lệ</Text>
        )}

        <Text style={styles.label}>Giới tính</Text>
        <View style={styles.genderContainer}>
          <TouchableOpacity
            style={[
              styles.genderButton,
              profile?.gender === "Nam" && styles.genderButtonSelected
            ]}
            onPress={() => setProfile({ ...profile, gender: "Nam" })}
          >
            <Text style={[
              styles.genderButtonText,
              profile?.gender === "Nam" && styles.genderButtonTextSelected
            ]}>
               Nam
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.genderButton,
              profile?.gender === "Nữ" && styles.genderButtonSelected
            ]}
            onPress={() => setProfile({ ...profile, gender: "Nữ" })}
          >
            <Text style={[
              styles.genderButtonText,
              profile?.gender === "Nữ" && styles.genderButtonTextSelected
            ]}>
               Nữ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.genderButton,
              profile?.gender === "Khác" && styles.genderButtonSelected
            ]}
            onPress={() => setProfile({ ...profile, gender: "Khác" })}
          >
            <Text style={[
              styles.genderButtonText,
              profile?.gender === "Khác" && styles.genderButtonTextSelected
            ]}>
              🏳️ Khác
            </Text>
          </TouchableOpacity>
        </View>

      </View>

      <TouchableOpacity
        style={[styles.btnPrimary, saving && { opacity: 0.7 }]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.btnText}>{saving ? "Đang lưu..." : " Lưu thay đổi"}</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.btnCancel} 
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.btnCancelText}>❌ Hủy</Text>
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: "#F7F7FB",
  },
  container: {
    padding: 24,
    alignItems: "center",
    backgroundColor: "#F7F7FB",
    paddingBottom: 20,
    flexGrow: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    color: "#2D1B69",
    marginTop: 30,
  },
  avatarWrap: {
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#8E2DE2",
    borderRadius: 90,
    padding: 4,
  },
  avatar: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#ddd",
  },
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#8E2DE2",
  },
  formContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    marginTop: 8,
  },
  label: { fontWeight: "600", color: "#333", marginTop: 6, marginBottom: 3 },
  input: {
    backgroundColor: "#F7F7FB",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 4,
    minHeight: 48,
  },
  btnPrimary: {
    backgroundColor: "#8E2DE2",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 16,
    alignItems: "center",
    width: "100%",
    minHeight: 50,
  },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  btnOutline: {
    borderWidth: 1.5,
    borderColor: "#8E2DE2",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    minHeight: 44,
  },
  btnOutlineText: { color: "#8E2DE2", fontWeight: "600" },
  btnCancel: {
    backgroundColor: "#FF4E4E",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 16,
    alignItems: "center",
    width: "100%",
    minHeight: 50,
  },
  btnCancelText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  genderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  genderButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 6,
    marginHorizontal: 3,
    alignItems: "center",
    minHeight: 48,
  },
  genderButtonSelected: {
    backgroundColor: "#8E2DE2",
    borderColor: "#8E2DE2",
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  genderButtonTextSelected: {
    color: "#fff",
  },
  readOnlyField: {
    backgroundColor: "#F0F0F0",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 4,
    minHeight: 48,
    justifyContent: "center",
  },
  readOnlyText: {
    color: "#666",
    fontSize: 16,
    fontStyle: "italic",
  },
  inputError: {
    borderColor: "#FF4E4E",
    borderWidth: 2,
  },
  errorText: {
    color: "#FF4E4E",
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
  },
});
