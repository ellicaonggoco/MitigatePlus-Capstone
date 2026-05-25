import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import api from "../services/api";
import { colors, fonts, shadow } from "../theme";

const RegisterScreen = ({ navigation }) => {
  const { height } = useWindowDimensions();
  const compact = height < 740;
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
    barangay: "",
    isBarangayOfficial: false,
  });
  const [officialId, setOfficialId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const pickOfficialId = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]) setOfficialId(result.assets[0]);
  };

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.phone || !form.address || !form.password || !form.confirmPassword || !form.barangay) {
      Alert.alert("Missing details", "Please complete all required fields.");
      return;
    }
    if (form.password.length < 6) {
      Alert.alert("Weak password", "Use at least 6 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert("Passwords do not match", "Confirm your password before sending OTP.");
      return;
    }
    if (form.isBarangayOfficial && !officialId) {
      Alert.alert("Government ID required", "Upload your government ID for official approval.");
      return;
    }

    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key !== "confirmPassword") payload.append(key, String(value));
    });
    if (officialId) {
      payload.append("officialId", {
        uri: officialId.uri,
        name: officialId.fileName || "official-id.jpg",
        type: officialId.mimeType || "image/jpeg",
      });
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/register", payload);
      if (res.data?.data?.requiresOTP) {
        navigation.navigate("VerifyOTP", { email: form.email.trim() });
      } else {
        Alert.alert(
          "Submitted for approval",
          "Your barangay official account was submitted. You can sign in after an admin approves your ID.",
          [{ text: "OK", onPress: () => navigation.navigate("Login") }],
        );
      }
    } catch (err) {
      Alert.alert("Registration failed", err.response?.data?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <LinearGradient colors={[colors.navyDark, colors.blue, colors.sky]} style={styles.background}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, compact && styles.contentCompact]} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>

        <LinearGradient colors={["rgba(255,255,255,0.97)", "rgba(241,248,255,0.95)"]} style={styles.card}>
          <View style={styles.brandRow}>
            <Image source={require("../assets/images/mitigateplus-logoonly.png")} style={styles.brandLogo} />
            <View style={styles.brandText}>
              <Text style={styles.brandName}>MitigatePlus</Text>
              <Text style={styles.brandTag}>Create your safety account</Text>
            </View>
          </View>
          <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>Join MitigatePlus</Text>
          <Text style={styles.subtitle}>Residents report hazards. Officials verify them.</Text>
          <Input icon="person-outline" placeholder="Full Name" value={form.name} onChangeText={(v) => update("name", v)} />
          <Input icon="mail-outline" placeholder="Email Address" value={form.email} onChangeText={(v) => update("email", v)} keyboardType="email-address" autoCapitalize="none" />
          <Input icon="call-outline" placeholder="Mobile Number" value={form.phone} onChangeText={(v) => update("phone", v)} keyboardType="phone-pad" />
          <Input icon="location-outline" placeholder="Barangay" value={form.barangay} onChangeText={(v) => update("barangay", v)} />
          <Input icon="home-outline" placeholder="Complete Address" value={form.address} onChangeText={(v) => update("address", v)} />

          <PasswordInput
            placeholder="Password"
            value={form.password}
            onChangeText={(v) => update("password", v)}
            show={showPassword}
            onToggle={() => setShowPassword((value) => !value)}
          />
          <PasswordInput
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChangeText={(v) => update("confirmPassword", v)}
            show={showPassword}
            onToggle={() => setShowPassword((value) => !value)}
          />

          <TouchableOpacity
            activeOpacity={0.88}
            style={[styles.toggle, form.isBarangayOfficial && styles.toggleActive]}
            onPress={() => update("isBarangayOfficial", !form.isBarangayOfficial)}
          >
            <View>
              <Text style={styles.toggleTitle}>Are you a Barangay Official?</Text>
              <Text style={styles.toggleText}>Requires ID upload and admin approval.</Text>
            </View>
            <Ionicons
              name={form.isBarangayOfficial ? "toggle" : "toggle-outline"}
              size={34}
              color={form.isBarangayOfficial ? colors.blue : "#94a3b8"}
            />
          </TouchableOpacity>

          {form.isBarangayOfficial ? (
            <TouchableOpacity style={styles.upload} onPress={pickOfficialId}>
              <Ionicons name="cloud-upload-outline" size={22} color={colors.blue} />
              <Text style={styles.uploadText}>
                {officialId ? officialId.fileName || "Government ID selected" : "Upload Government ID"}
              </Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.88}
            style={[styles.primaryButton, loading && styles.disabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Send OTP</Text>}
          </TouchableOpacity>
        </LinearGradient>

          <TouchableOpacity style={styles.footerLink} onPress={() => navigation.navigate("Login")}>
          <Text style={styles.footerText}>
            Already have an account? <Text style={styles.footerStrong}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const Input = ({ icon, ...props }) => (
  <View style={styles.inputWrap}>
    <Ionicons name={icon} size={19} color={colors.blue} />
    <TextInput style={styles.input} placeholderTextColor="#8aa0be" {...props} />
  </View>
);

const PasswordInput = ({ show, onToggle, ...props }) => (
  <View style={styles.inputWrap}>
    <Ionicons name="lock-closed-outline" size={19} color={colors.blue} />
    <TextInput style={styles.input} placeholderTextColor="#8aa0be" secureTextEntry={!show} {...props} />
    <TouchableOpacity onPress={onToggle} hitSlop={8}>
      <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={20} color={colors.blue} />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#061638" },
  background: { flex: 1 },
  keyboard: { flex: 1 },
  content: { flexGrow: 1, paddingTop: 28, paddingBottom: 28, paddingHorizontal: 20, justifyContent: "center" },
  contentCompact: { paddingTop: 22, paddingBottom: 20 },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  card: { borderRadius: 28, padding: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.74)", ...shadow.card },
  brandRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  brandLogo: { width: 54, height: 54, marginRight: 10 },
  brandText: { alignItems: "flex-start" },
  brandName: { color: colors.navy, fontFamily: fonts.black, fontSize: 20 },
  brandTag: { color: colors.muted, fontFamily: fonts.semiBold, fontSize: 12, marginTop: -2 },
  title: { color: colors.navyDark, fontFamily: fonts.black, fontSize: 30, textAlign: "left", letterSpacing: 0 },
  subtitle: { color: "#334155", fontFamily: fonts.semiBold, fontSize: 13, textAlign: "left", marginTop: 0, marginBottom: 16 },
  inputWrap: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: "#f8fbff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#d9e8ff",
    shadowColor: "#1976d2",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.045,
    shadowRadius: 10,
    elevation: 2,
  },
  input: { flex: 1, fontFamily: fonts.semiBold, color: colors.navyDark, fontSize: 14, paddingHorizontal: 11, minWidth: 0 },
  toggle: {
    borderWidth: 1,
    borderColor: "#d9e8ff",
    backgroundColor: "#f8fbff",
    borderRadius: 17,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toggleActive: { borderColor: colors.blue, backgroundColor: "#eaf4ff" },
  toggleTitle: { color: colors.navy, fontFamily: fonts.bold, fontSize: 13 },
  toggleText: { color: colors.muted, fontFamily: fonts.medium, fontSize: 11, marginTop: 3 },
  upload: {
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#9bc7ff",
    backgroundColor: "#f8fbff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  uploadText: { color: colors.navy, fontFamily: fonts.semiBold, fontSize: 12 },
  primaryButton: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.button,
  },
  disabled: { opacity: 0.7 },
  primaryText: { color: "#fff", fontFamily: fonts.bold, fontSize: 15 },
  footerLink: { alignItems: "center", marginTop: 16 },
  footerText: { color: "#fff", fontFamily: fonts.medium, fontSize: 12 },
  footerStrong: { color: colors.lightBlue, fontFamily: fonts.bold },
});

export default RegisterScreen;
