import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { colors, fonts, shadow } from "../theme";

const VerifyOTPScreen = ({ route, navigation }) => {
  const { email } = route.params || {};
  const { updateUser } = useAuth();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(600);
  const [loading, setLoading] = useState(false);
  const refs = useRef([]);

  useEffect(() => {
    if (timer <= 0) return undefined;
    const id = setInterval(() => setTimer((value) => value - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const formatTime = () => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const updateDigit = (value, index) => {
    if (value.length > 1) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) refs.current[index + 1]?.focus();
    if (index === 5 && value && next.every(Boolean)) verify(next.join(""));
  };

  const verify = async (code = otp.join("")) => {
    if (code.length !== 6) return Alert.alert("Incomplete OTP", "Please enter the 6-digit code.");
    setLoading(true);
    try {
      const res = await api.post("/auth/verify-otp", { email, otp: code });
      if (res.data.token) await SecureStore.setItemAsync("token", res.data.token);
      if (res.data.user) updateUser(res.data.user);
    } catch (err) {
      Alert.alert("Verification failed", err.response?.data?.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      await api.post("/auth/resend-otp", { email });
      setOtp(["", "", "", "", "", ""]);
      setTimer(600);
      refs.current[0]?.focus();
      Alert.alert("OTP resent", "A new verification code was sent to your email.");
    } catch (err) {
      Alert.alert("Could not resend", err.response?.data?.message || "Please try again.");
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={[colors.navyDark, colors.blue, colors.sky]} style={styles.background}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.card}>
          <View style={styles.brandRow}>
            <Image source={require("../assets/images/mitigateplus-logoonly.png")} style={styles.brandLogo} />
            <Text style={styles.brandName}>MitigatePlus</Text>
          </View>
          <Text style={styles.title}>Verify your email</Text>
          <Text style={styles.subtitle}>Enter the 6-digit code sent to {email || "your email"}.</Text>

        <View style={styles.otpRow}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (refs.current[index] = ref)}
              style={styles.otpBox}
              value={digit}
              keyboardType="number-pad"
              maxLength={1}
              onChangeText={(value) => updateDigit(value, index)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === "Backspace" && !digit && index > 0) refs.current[index - 1]?.focus();
              }}
            />
          ))}
        </View>

        <Text style={styles.timer}>Code expires in {formatTime()}</Text>
        <TouchableOpacity onPress={resend} disabled={timer > 540}>
          <Text style={[styles.resend, timer > 540 && styles.resendDisabled]}>
            Didn't receive an OTP? <Text style={styles.linkText}>Resend it</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.verifyButton, loading && styles.disabled]} onPress={() => verify()} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.verifyText}>Verify</Text>}
        </TouchableOpacity>
        </View>
      </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#061638" },
  background: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 42, paddingBottom: 30 },
  back: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.14)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  card: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, marginTop: 22, marginBottom: 40, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.95)", borderWidth: 1, borderColor: "rgba(255,255,255,0.72)", ...shadow.card },
  brandRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  brandLogo: { width: 54, height: 54, marginRight: 10 },
  brandName: { color: colors.navy, fontFamily: fonts.black, fontSize: 20 },
  title: { color: colors.navyDark, fontFamily: fonts.black, fontSize: 30, textAlign: "center", letterSpacing: 0 },
  subtitle: { color: "#334155", fontFamily: fonts.medium, fontSize: 13, textAlign: "center", lineHeight: 20, marginTop: 8, marginBottom: 32 },
  otpRow: { flexDirection: "row", justifyContent: "center", gap: 7, marginBottom: 16 },
  otpBox: { width: 44, height: 58, borderRadius: 15, backgroundColor: "#f8fbff", color: colors.navyDark, textAlign: "center", fontFamily: fonts.bold, fontSize: 21, borderWidth: 1, borderColor: "#d9e8ff" },
  timer: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12, marginBottom: 10 },
  resend: { color: colors.navy, fontFamily: fonts.medium, fontSize: 12, marginBottom: 20 },
  resendDisabled: { opacity: 0.5 },
  linkText: { color: colors.blue, fontFamily: fonts.bold },
  verifyButton: { height: 58, borderRadius: 18, backgroundColor: colors.blue, alignItems: "center", justifyContent: "center", width: "100%", ...shadow.button },
  verifyText: { color: "#fff", fontFamily: fonts.bold, fontSize: 15 },
  disabled: { opacity: 0.75 },
});

export default VerifyOTPScreen;
