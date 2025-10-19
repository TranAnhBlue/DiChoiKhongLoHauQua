// screens/RegisterScreen.js
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
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) return Alert.alert("Thông báo", "Vui lòng nhập đầy đủ thông tin");
    if (password !== confirmPassword) return Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp");
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      // Tạo document user trong Firestore
      await setDoc(doc(db, "users", result.user.uid), {
        email,
        name: "",
        avatar: null,
        createdAt: new Date().toISOString(),
      });
      Alert.alert("Thành công", "Đăng ký thành công! Vui lòng đăng nhập.");
      navigation.replace("Login");
    } catch (error) {
      Alert.alert("Đăng ký thất bại", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#4A00E0", "#8E2DE2"]} style={styles.gradient}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Tạo tài khoản</Text>
          <Text style={styles.subtitle}>Nhập email và mật khẩu</Text>

          <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#aaa" autoCapitalize="none" value={email} onChangeText={setEmail} />
          <TextInput style={styles.input} placeholder="Mật khẩu" placeholderTextColor="#aaa" secureTextEntry value={password} onChangeText={setPassword} />
          <TextInput style={styles.input} placeholder="Xác nhận mật khẩu" placeholderTextColor="#aaa" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />

          <TouchableOpacity style={[styles.button, loading && { opacity: 0.6 }]} onPress={handleRegister} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? "Đang tạo..." : "Đăng ký"}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.replace("Login")} style={{ marginTop: 12 }}>
            <Text style={styles.link}>Đã có tài khoản? <Text style={styles.linkHighlight}>Đăng nhập</Text></Text>
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
