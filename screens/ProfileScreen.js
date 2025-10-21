import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";

export default function ProfileScreen({ navigation }) {
  const uid = auth.currentUser?.uid;
  const [profile, setProfile] = useState(null);
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
        style={styles.btnOutline} 
        onPress={() => navigation.navigate('EditProfile')}
      >
        <Text style={styles.btnOutlineText}> Chỉnh sửa thông tin</Text>
      </TouchableOpacity>

      {/* Profile Info Display */}
      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{profile?.email || "Chưa có"}</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Họ tên</Text>
          <Text style={styles.infoValue}>{profile?.displayName || "Chưa có"}</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Số điện thoại</Text>
          <Text style={styles.infoValue}>{profile?.phone || "Chưa có"}</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Giới thiệu</Text>
          <Text style={styles.infoValue}>{profile?.bio || "Chưa có"}</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Địa chỉ</Text>
          <Text style={styles.infoValue}>{profile?.address || "Chưa có"}</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Ngày sinh</Text>
          <Text style={styles.infoValue}>{profile?.birthDate || "Chưa có"}</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Giới tính</Text>
          <Text style={styles.infoValue}>{profile?.gender || "Chưa có"}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
        <Text style={styles.btnLogoutText}>🚪 Đăng xuất</Text>
      </TouchableOpacity>
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
  btnOutline: {
    borderWidth: 1.5,
    borderColor: "#8E2DE2",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 16,
    alignSelf: "center",
  },
  btnOutlineText: { 
    color: "#8E2DE2", 
    fontWeight: "600",
    fontSize: 14,
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
  infoContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoItem: {
    marginBottom: 12,
  },
  infoLabel: {
    fontWeight: "600",
    color: "#666",
    fontSize: 14,
    marginBottom: 4,
  },
  infoValue: {
    color: "#333",
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F7F7FB",
    borderRadius: 8,
  },
  btnLogout: {
    backgroundColor: "#FF4E4E",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
    alignItems: "center",
    width: "100%",
  },
  btnLogoutText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
