import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import ScreenShell from "../components/ScreenShell";
import { colors, fonts, shadow } from "../theme";

const SettingsScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [toggles, setToggles] = useState({
    notifications: true,
    location: true,
    hazardAlerts: true,
    highRiskPing: true,
    weatherTips: true,
    emergencyConfirm: true,
  });

  const confirmLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  const setToggle = (key) => setToggles((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <ScreenShell padded={false}>
      <Header title="Settings" subtitle="Profile and preferences" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || "R"}</Text>
          </View>
          <Text style={styles.name}>{user?.name || "Resident"}</Text>
          <Text style={styles.email}>{user?.email || "resident@mitigateplus.app"}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.role}>{user?.role?.replace("_", " ") || "resident"}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <SettingToggle icon="notifications-outline" label="Notifications" value={toggles.notifications} onValueChange={() => setToggle("notifications")} />
          <SettingToggle icon="location-outline" label="Location access" value={toggles.location} onValueChange={() => setToggle("location")} />
          <SettingToggle icon="warning-outline" label="Hazard alerts" value={toggles.hazardAlerts} onValueChange={() => setToggle("hazardAlerts")} />
          <SettingToggle icon="radio-outline" label="High-risk proximity ping" value={toggles.highRiskPing} onValueChange={() => setToggle("highRiskPing")} />
          <SettingToggle icon="partly-sunny-outline" label="Weather-based safety tips" value={toggles.weatherTips} onValueChange={() => setToggle("weatherTips")} />
          <SettingToggle icon="shield-checkmark-outline" label="Emergency double confirmation" value={toggles.emergencyConfirm} onValueChange={() => setToggle("emergencyConfirm")} />
        </View>

        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>About MitigatePlus</Text>
          <Text style={styles.aboutText}>
            Disaster risk mitigation system for City of Manila residents, supporting hazard reports,
            assessments, preparedness, and map-based awareness.
          </Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Data sources</Text>
            <Text style={styles.infoValue}>PHIVOLCS - PAGASA - OSM</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.red} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenShell>
  );
};

const SettingToggle = ({ icon, label, value, onValueChange }) => (
  <View style={styles.settingRow}>
    <View style={styles.settingLeft}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={18} color={colors.blue} />
      </View>
      <Text style={styles.settingLabel}>{label}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: "#cbd5e1", true: "#90caf9" }}
      thumbColor={value ? colors.blue : "#f8fafc"}
    />
  </View>
);

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 112 },
  profileCard: { backgroundColor: colors.navy, borderRadius: 24, padding: 24, alignItems: "center", marginBottom: 14, ...shadow.card },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  avatarText: { color: colors.navy, fontSize: 30, fontFamily: fonts.extraBold },
  name: { color: "#fff", fontSize: 21, fontFamily: fonts.bold, textAlign: "center" },
  email: { color: "rgba(255,255,255,0.74)", fontSize: 13, fontFamily: fonts.medium, marginTop: 4 },
  roleBadge: { backgroundColor: "rgba(255,255,255,0.16)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginTop: 10 },
  role: { color: "#fff", textTransform: "capitalize", fontFamily: fonts.bold, fontSize: 11 },
  sectionCard: { backgroundColor: "#fff", borderRadius: 22, padding: 8, marginBottom: 14, ...shadow.card },
  settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, paddingHorizontal: 10 },
  settingLeft: { flexDirection: "row", alignItems: "center" },
  settingIcon: { width: 38, height: 38, borderRadius: 14, backgroundColor: "#e8f3ff", alignItems: "center", justifyContent: "center", marginRight: 10 },
  settingLabel: { color: colors.text, fontFamily: fonts.semiBold, fontSize: 14 },
  aboutCard: { backgroundColor: "#fff", borderRadius: 22, padding: 18, marginBottom: 14, ...shadow.card },
  aboutTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 17 },
  aboutText: { color: colors.muted, fontFamily: fonts.medium, fontSize: 13, lineHeight: 21, marginTop: 8, marginBottom: 12 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginTop: 8 },
  infoLabel: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12 },
  infoValue: { color: colors.text, fontFamily: fonts.bold, fontSize: 12, flex: 1, textAlign: "right" },
  logoutBtn: { flexDirection: "row", backgroundColor: "#fff", padding: 15, borderRadius: 18, alignItems: "center", justifyContent: "center", width: "100%", borderWidth: 1, borderColor: "#fecaca" },
  logoutText: { color: colors.red, fontFamily: fonts.bold, marginLeft: 8, fontSize: 15 },
});

export default SettingsScreen;
