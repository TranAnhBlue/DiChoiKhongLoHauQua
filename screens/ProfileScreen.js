import React, { useEffect, useState } from "react";
import PropTypes from 'prop-types';
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
import { createEvent } from '../services/events';

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

<<<<<<< HEAD
=======
  // handle route param 'edit' to enter edit mode from header button
  useEffect(() => {
    if (route?.params?.edit) {
      setEditing(true);
      // clear param so re-entering doesn't automatically set it again
      if (navigation && typeof navigation.setParams === 'function') navigation.setParams({ edit: false });
    }
  }, [route?.params]);

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
  setProfile((p) => (p ? { ...p, avatar: downloadURL } : { avatar: downloadURL }));

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
>>>>>>> a2b64d666da3b9fa928f7686b9f347ee667b9d47

  // Logout
  const seedDemoEvents = async () => {
    try {
      // Using the provided event data
      await createEvent({
        title: 'Hội chợ Ẩm thực Nhật Bản',
        description: 'Thưởng thức món ăn Nhật truyền thống, sushi và ramen tại Crescent Mall.',
        category: 'Ẩm thực',
        latitude: 10.7302,
        longitude: 106.7215,
        startAt: '2025-10-25T17:00:00',
        endAt: null,
        imageUrl: 'https://i.imgur.com/Nik6mU8.jpg',
        createdBy: 'demoUser',
      });

      await createEvent({
        title: 'Lễ hội Âm nhạc ngoài trời Chill Fest',
        description: 'Âm nhạc, đồ ăn và không khí sôi động tại Công viên Gia Định.',
        category: 'Âm nhạc',
        latitude: 10.8173,
        longitude: 106.677,
        startAt: '2025-10-27T18:30:00',
        endAt: null,
        imageUrl: 'https://i.imgur.com/4H9HY9s.jpg',
        createdBy: 'demoUser',
      });

      await createEvent({
        title: "Chiếu phim ngoài trời – 'Your Name'",
        description: 'Rạp chiếu ngoài trời tại Thảo Cầm Viên, mang theo ghế hoặc mền để ngồi xem.',
        category: 'Phim ảnh',
        latitude: 10.7883,
        longitude: 106.7058,
        startAt: '2025-10-20T19:00:00',
        endAt: null,
        imageUrl: 'https://i.imgur.com/IaYcGKu.jpg',
        createdBy: 'demoUser',
      });

      await createEvent({
        title: 'Workshop Làm nến thơm',
        description: 'Trải nghiệm tự tay làm nến thơm với hương tinh dầu tự nhiên.',
        category: 'Thủ công',
        latitude: 10.7629,
        longitude: 106.6822,
        startAt: '2025-10-22T14:00:00',
        endAt: null,
        imageUrl: 'https://i.imgur.com/ijTMoZJ.jpg',
        createdBy: 'demoUser',
      });

      await createEvent({
        title: 'Triển lãm Nghệ thuật Trẻ 2025',
        description: 'Không gian triển lãm tác phẩm hội họa và sắp đặt của các nghệ sĩ trẻ Việt Nam.',
        category: 'Nghệ thuật',
        latitude: 10.7781,
        longitude: 106.6956,
        startAt: '2025-10-24T09:00:00',
        endAt: null,
        imageUrl: 'https://i.imgur.com/XwoRfva.jpg',
        createdBy: 'demoUser',
      });

      Alert.alert('Đã tạo', '5 event demo đã được thêm vào Firestore.');
    } catch (err) {
      console.log('Seed error', err);
      Alert.alert('Lỗi', 'Không thể tạo event demo.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace("LoginScreen");
    } catch (e) {
      console.log('Logout error', e);
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

<<<<<<< HEAD
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Giới thiệu</Text>
          <Text style={styles.infoValue}>{profile?.bio || "Chưa có"}</Text>
        </View>
=======
        {editing ? (
          <>
            <TouchableOpacity
              style={[styles.btnPrimary, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.btnText}>{saving ? "Đang lưu..." : "💾 Lưu thay đổi"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btnOutline, { marginTop: 12 }]} onPress={seedDemoEvents}>
              <Text style={styles.btnOutlineText}>Tạo 5 event demo</Text>
            </TouchableOpacity>
          </>
        ) : null}
>>>>>>> a2b64d666da3b9fa928f7686b9f347ee667b9d47

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

ProfileScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
    replace: PropTypes.func,
    setParams: PropTypes.func,
  }).isRequired,
  route: PropTypes.object,
};

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
