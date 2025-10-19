// screens/HomeScreen.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";

export default function HomeScreen({ navigation }) {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Xin chào</Text>
      <Text style={styles.email}>{auth.currentUser?.email}</Text>

      <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate("Profile")}>
        <Text style={styles.btnText}>Trang cá nhân</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnOutline} onPress={handleLogout}>
        <Text style={styles.btnOutlineText}>Đăng xuất</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#F7F7FB" },
  title: { fontSize: 22, fontWeight: "700", color: "#222", marginBottom: 6 },
  email: { fontSize: 14, color: "#666", marginBottom: 24 },
  btnPrimary: { backgroundColor: "#8E2DE2", paddingVertical: 12, paddingHorizontal: 28, borderRadius: 10, marginBottom: 12 },
  btnText: { color: "#fff", fontWeight: "600" },
  btnOutline: { borderWidth: 1, borderColor: "#8E2DE2", paddingVertical: 12, paddingHorizontal: 28, borderRadius: 10 },
  btnOutlineText: { color: "#8E2DE2", fontWeight: "600" },
});
