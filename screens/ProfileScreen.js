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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { auth, storage, db } from "../firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";

export default function ProfileScreen({ navigation }) {
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

  // Save profile info
  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", uid), {
        displayName: profile.displayName || "",
        phone: profile.phone || "",
        bio: profile.bio || "",
        avatar: profile.avatar || "",
      });
      Alert.alert("✅ Đã lưu", "Thông tin cá nhân đã được cập nhật!");
    } catch (err) {
      console.log("Save error", err);
      Alert.alert("Lỗi", "Không thể lưu thông tin.");
    } finally {
      setSaving(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace("Login");
    } catch (e) {
      Alert.alert("Lỗi", "Không thể đăng xuất.");
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Thông tin cá nhân</Text>

      {/* Avatar */}
      <View style={styles.avatarWrap}>
        {profile?.avatar ? (
          <Image source={{ uri: profile.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 32 }}>
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
      <View style={styles.form}>
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
          style={[styles.input, { height: 80 }]}
          multiline
          placeholder="Mô tả ngắn về bạn..."
          value={profile?.bio || ""}
          onChangeText={(t) => setProfile({ ...profile, bio: t })}
        />

        <TouchableOpacity
          style={[styles.btnPrimary, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.btnText}>{saving ? "Đang lưu..." : "💾 Lưu thay đổi"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
          <Text style={styles.btnLogoutText}>🚪 Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: {
    padding: 24,
    alignItems: "center",
    backgroundColor: "#F7F7FB",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
    color: "#2D1B69",
  },
  avatarWrap: {
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#8E2DE2",
    borderRadius: 80,
    padding: 4,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#ddd",
  },
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#8E2DE2",
  },
  form: {
    width: "100%",
    marginTop: 16,
  },
  label: { fontWeight: "600", color: "#333", marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
  },
  btnPrimary: {
    backgroundColor: "#8E2DE2",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  btnOutline: {
    borderWidth: 1.5,
    borderColor: "#8E2DE2",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  btnOutlineText: { color: "#8E2DE2", fontWeight: "600" },
  btnLogout: {
    backgroundColor: "#FF4E4E",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
    alignItems: "center",
  },
  btnLogoutText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
