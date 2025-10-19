// screens/ForgotPasswordScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) return Alert.alert("Thông báo", "Vui lòng nhập email");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert("Đã gửi", "Hãy kiểm tra email để đặt lại mật khẩu");
      navigation.replace("Login");
    } catch (error) {
      Alert.alert("Lỗi", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#4A00E0", "#8E2DE2"]} style={styles.gradient}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Quên mật khẩu</Text>
          <Text style={styles.subtitle}>Nhập email để nhận hướng dẫn</Text>

          <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#aaa" autoCapitalize="none" value={email} onChangeText={setEmail} />

          <TouchableOpacity style={[styles.button, loading && { opacity: 0.6 }]} onPress={handleReset} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? "Đang gửi..." : "Gửi email khôi phục"}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.replace("Login")} style={{ marginTop: 12 }}>
            <Text style={styles.link}>Quay lại <Text style={styles.linkHighlight}>Đăng nhập</Text></Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, justifyContent: "center", padding: 20 },
  card: { backgroundColor: "rgba(255,255,255,0.95)", borderRadius: 16, padding: 20, shadowColor: "#000", shadowOpacity: 0.15, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 8 },
  title: { fontSize: 24, fontWeight: "700", color: "#222", textAlign: "center", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 18 },
  input: { borderWidth: 1, borderColor: "#eee", backgroundColor: "#fff", padding: 12, borderRadius: 10, marginBottom: 12, fontSize: 16, color: "#333" },
  button: { backgroundColor: "#8E2DE2", borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  link: { color: "#666", textAlign: "center", fontSize: 14 },
  linkHighlight: { color: "#8E2DE2", fontWeight: "700" },
});
