// screens/LoginScreen.js
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
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert("Thông báo", "Vui lòng nhập đầy đủ thông tin");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged ở navigator sẽ điều hướng tự động
    } catch (error) {
      Alert.alert("Đăng nhập thất bại", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#4A00E0", "#8E2DE2"]} style={styles.gradient}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Chào mừng 👋</Text>
          <Text style={styles.subtitle}>Đăng nhập để tiếp tục</Text>

          <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#aaa" autoCapitalize="none" value={email} onChangeText={setEmail} />
          <TextInput style={styles.input} placeholder="Mật khẩu" placeholderTextColor="#aaa" secureTextEntry value={password} onChangeText={setPassword} />

          <TouchableOpacity style={[styles.button, loading && { opacity: 0.6 }]} onPress={handleLogin} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? "Đang đăng nhập..." : "Đăng nhập"}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")} style={{ marginTop: 12 }}>
            <Text style={styles.link}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Register")} style={{ marginTop: 12 }}>
            <Text style={styles.link}>
              Chưa có tài khoản? <Text style={styles.linkHighlight}>Đăng ký</Text>
            </Text>
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
  title: { fontSize: 26, fontWeight: "700", color: "#222", textAlign: "center", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 20 },
  input: { borderWidth: 1, borderColor: "#eee", backgroundColor: "#fff", padding: 12, borderRadius: 10, marginBottom: 12, fontSize: 16, color: "#333" },
  button: { backgroundColor: "#8E2DE2", borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  link: { color: "#666", textAlign: "center", fontSize: 14 },
  linkHighlight: { color: "#8E2DE2", fontWeight: "700" },
});
