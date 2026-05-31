import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import ScreenShell from "../components/ScreenShell";
import HazardLogoBadge from "../components/HazardLogoBadge";
import api from "../services/api";
import { getMitigationTips } from "../utils/hazardTips";
import { colors, fonts, riskColor, shadow } from "../theme";

const ACTION_GAP = 11;
const HORIZONTAL_PADDING = 36;

const HomeScreen = ({ navigation }) => {
  const { user, logout, updateUser } = useAuth();
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState([]);
  const [hazards, setHazards] = useState([]);
  const [evacuation, setEvacuation] = useState([]);
  const [weather, setWeather] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [reportsRes, hazardsRes, evacuationRes, weatherRes, meRes] = await Promise.all([
        api.get("/reports/validated"),
        api.get("/hazards"),
        api.get("/evacuation"),
        api.get("/weather").catch(() => ({ data: { data: null } })),
        api.get("/auth/users/me").catch(() => ({ data: { data: null } })),
      ]);
      setReports(reportsRes.data.data || []);
      setHazards(hazardsRes.data.data || []);
      setEvacuation(evacuationRes.data.data || []);
      setWeather(weatherRes.data.data || null);
      if (meRes.data.data) updateUser(meRes.data.data);
    } catch (err) {
      console.log("Home fetch error", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const highCount =
    reports.filter((r) => r.severity === "high").length +
    hazards.filter((h) => h.riskLevel === "high").length;
  const status = highCount > 0 ? "danger" : reports.length + hazards.length > 0 ? "warning" : "normal";
  const actionCardWidth = useMemo(() => {
    return Math.floor((width - HORIZONTAL_PADDING - ACTION_GAP * 2) / 3);
  }, [width]);
  const statusCopy = {
    normal: ["Normal monitoring", "No high-risk validated hazards near Manila map layers."],
    warning: ["Stay alert", "Validated reports or mapped zones are active. Check the map before travelling."],
    danger: ["High-risk hazards active", "Review nearby hazards and prepare to evacuate if officials advise it."],
  };

  return (
    <ScreenShell padded={false}>
      <Header title="MitigatePlus" subtitle={`Hello, ${user?.name?.split(" ")[0] || "Resident"}`} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />}
      >
        <View style={[styles.banner, styles[`${status}Banner`]]}>
          <View>
            <Text style={styles.bannerTitle}>{statusCopy[status][0]}</Text>
            <Text style={styles.bannerText}>{statusCopy[status][1]}</Text>
          </View>
          <Ionicons
            name={status === "danger" ? "warning" : status === "warning" ? "alert-circle" : "shield-checkmark"}
            size={30}
            color={status === "danger" ? colors.red : status === "warning" ? colors.orange : colors.green}
          />
        </View>

        {user?.isBarangayOfficial && user?.role !== "barangay_official" ? (
          <View style={styles.pendingOfficialCard}>
            <Ionicons name="time-outline" size={22} color={colors.blue} />
            <View style={{ flex: 1 }}>
              <Text style={styles.pendingOfficialTitle}>Official access pending</Text>
              <Text style={styles.pendingOfficialText}>
                You can use resident features now. The Official page will appear after admin approval.
              </Text>
            </View>
          </View>
        ) : null}

        {user?.officialAccessRejectedReason ? (
          <View style={styles.declinedOfficialCard}>
            <Ionicons name="alert-circle-outline" size={22} color={colors.red} />
            <View style={{ flex: 1 }}>
              <Text style={styles.declinedOfficialTitle}>Official access declined</Text>
              <Text style={styles.declinedOfficialText}>
                {user.officialAccessRejectedReason}
              </Text>
            </View>
          </View>
        ) : null}

        {weather ? (
          <View style={styles.weatherCard}>
            <View style={styles.weatherTop}>
              <View>
                <Text style={styles.weatherKicker}>Weather now</Text>
                <Text style={styles.weatherTemp}>{weather.temperature}°C</Text>
              </View>
              <View style={styles.weatherIcon}>
                <Ionicons
                  name={
                    weather.condition === "heat"
                      ? "sunny"
                      : weather.condition?.includes("rain")
                        ? "rainy"
                        : weather.condition === "thunderstorm"
                          ? "thunderstorm"
                          : "partly-sunny"
                  }
                  size={30}
                  color={colors.blue}
                />
              </View>
            </View>
            <Text style={styles.weatherPrediction}>{weather.prediction}</Text>
            <View style={styles.weatherStats}>
              <Text style={styles.weatherStat}>Rain {weather.forecast?.rainProbability || 0}%</Text>
              <Text style={styles.weatherStat}>Wind {weather.windKph} kph</Text>
              <Text style={styles.weatherStat}>High {weather.forecast?.maxTemp}°C</Text>
            </View>
          </View>
        ) : null}

        <LinearGradient colors={[colors.navy, colors.blue, colors.aqua]} style={styles.welcomeCard}>
          <View style={styles.communityBadge}>
            <Ionicons name="people" size={15} color={colors.navy} />
            <Text style={styles.communityBadgeText}>Community ready</Text>
          </View>
          <Text style={styles.welcomeKicker}>City of Manila</Text>
          <Text style={styles.welcomeTitle}>Prepared neighborhoods, safer families.</Text>
          <Text style={styles.welcomeText}>
            Report early, check local risks, and help your barangay respond faster.
          </Text>
          <View style={styles.statRow}>
            <Metric label="Reports" value={reports.length} />
            <Metric label="Zones" value={hazards.length} />
            <Metric label="Evacuation" value={evacuation.length} />
          </View>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.grid}>
          {[
            { icon: "map", color: colors.blue, bg: "#e1f4ff", label: "Hazard Map", route: "Map" },
            { icon: "add-circle", color: colors.coral, bg: "#fff0e9", label: "Submit Report", route: "Report" },
            { icon: "analytics", color: colors.lavender, bg: "#f0edff", label: "Assessment", route: "Assessment" },
            { icon: "briefcase", color: colors.aqua, bg: "#e4fbf6", label: "Go Bag", route: "GoBag" },
            { icon: "chatbubble-ellipses", color: colors.green, bg: "#ecfdf5", label: "MitiGo AI", route: "Chatbot" },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.actionCard, { width: actionCardWidth }]}
              onPress={() => navigation.navigate(item.route)}
            >
              <View style={[styles.actionIcon, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon} size={24} color={item.color} />
              </View>
              <Text style={styles.actionLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Nearby Hazards</Text>
        {loading ? (
          <ActivityIndicator color={colors.blue} style={{ marginTop: 20 }} />
        ) : reports.slice(0, 4).length ? (
          reports.slice(0, 4).map((report) => (
            <View key={report._id} style={styles.reportCard}>
              <View style={styles.reportIcon}>
                <HazardLogoBadge type={report.type} size={42} />
              </View>
              <View style={styles.reportCopy}>
                <Text style={styles.reportTitle}>{report.type}</Text>
                <Text style={styles.reportMeta}>{report.barangay || "Manila"} - {report.severity}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: `${riskColor(report.severity)}18` }]}>
                <Text style={[styles.badgeText, { color: riskColor(report.severity) }]}>{report.severity}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="shield-checkmark-outline" size={26} color={colors.green} />
            <Text style={styles.emptyText}>No validated hazard reports are currently shown.</Text>
          </View>
        )}

        <View style={styles.tipCard}>
          <Ionicons name="bulb" size={22} color="#facc15" />
          <View style={{ flex: 1 }}>
            <Text style={styles.tipTitle}>Today's mitigation habit</Text>
            <Text style={styles.tipText}>
              {reports[0]
                ? getMitigationTips(reports[0].type, reports[0].severity)[0]
                : "Keep documents, medicine, flashlight, and power bank in one reachable pouch."}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={18} color={colors.red} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenShell>
  );
};

const Metric = ({ label, value }) => (
  <View style={styles.metric}>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  content: { paddingHorizontal: 18, paddingBottom: 112 },
  banner: { borderRadius: 20, padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, marginTop: 4 },
  normalBanner: { backgroundColor: "#ecfdf5", borderColor: "#bbf7d0" },
  warningBanner: { backgroundColor: "#fff7ed", borderColor: "#fed7aa" },
  dangerBanner: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  bannerTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 15 },
  bannerText: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12, lineHeight: 18, maxWidth: 260, marginTop: 2 },
  pendingOfficialCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#eef7ff", borderRadius: 18, padding: 14, borderWidth: 1, borderColor: colors.border, marginTop: 10 },
  pendingOfficialTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 14 },
  pendingOfficialText: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12, lineHeight: 18, marginTop: 2 },
  declinedOfficialCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#fff5f5", borderRadius: 18, padding: 14, borderWidth: 1, borderColor: "#fecaca", marginTop: 10 },
  declinedOfficialTitle: { color: colors.red, fontFamily: fonts.bold, fontSize: 14 },
  declinedOfficialText: { color: colors.text, fontFamily: fonts.medium, fontSize: 12, lineHeight: 18, marginTop: 2 },
  welcomeCard: { borderRadius: 28, padding: 20, marginTop: 12, overflow: "hidden", ...shadow.card },
  communityBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
  },
  communityBadgeText: { color: colors.navy, fontFamily: fonts.bold, fontSize: 11 },
  welcomeKicker: { color: "rgba(255,255,255,0.78)", fontFamily: fonts.bold, fontSize: 12, textTransform: "uppercase" },
  welcomeTitle: { color: "#ffffff", fontFamily: fonts.extraBold, fontSize: 25, lineHeight: 33, marginTop: 4 },
  welcomeText: { color: "rgba(255,255,255,0.86)", fontFamily: fonts.medium, fontSize: 13, lineHeight: 20, marginTop: 8 },
  statRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  metric: { flex: 1, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 18, padding: 12, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  metricValue: { color: "#ffffff", fontFamily: fonts.extraBold, fontSize: 20 },
  metricLabel: { color: "rgba(255,255,255,0.78)", fontFamily: fonts.medium, fontSize: 10 },
  weatherCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 12, marginTop: 10, borderWidth: 1, borderColor: colors.border, ...shadow.soft },
  weatherTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  weatherKicker: { color: colors.muted, fontFamily: fonts.bold, fontSize: 12, textTransform: "uppercase" },
  weatherTemp: { color: colors.text, fontFamily: fonts.extraBold, fontSize: 25, marginTop: 1 },
  weatherIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: "#e1f4ff", alignItems: "center", justifyContent: "center" },
  weatherPrediction: { color: colors.text, fontFamily: fonts.semiBold, fontSize: 12, marginTop: 6 },
  weatherStats: { flexDirection: "row", gap: 6, marginTop: 8 },
  weatherStat: { flex: 1, textAlign: "center", color: colors.blue, fontFamily: fonts.bold, fontSize: 10, backgroundColor: "#e8f3ff", borderRadius: 999, paddingVertical: 6 },
  weatherTip: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12, lineHeight: 18, marginTop: 10 },
  sectionTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 18, marginTop: 22, marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: ACTION_GAP },
  actionCard: { minHeight: 108, backgroundColor: colors.surface, borderRadius: 22, padding: 12, justifyContent: "space-between", ...shadow.soft },
  actionIcon: { width: 44, height: 44, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  actionLabel: { color: colors.text, fontFamily: fonts.semiBold, fontSize: 12 },
  reportCard: { backgroundColor: colors.surface, borderRadius: 22, padding: 14, flexDirection: "row", alignItems: "center", marginBottom: 10, ...shadow.soft },
  reportIcon: { width: 46, height: 46, alignItems: "center", justifyContent: "center", marginRight: 12 },
  reportEmoji: { fontSize: 29, lineHeight: 34, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 3 },
  reportCopy: { flex: 1 },
  reportTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 14 },
  reportMeta: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12, textTransform: "capitalize" },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontFamily: fonts.bold, fontSize: 10, textTransform: "uppercase" },
  emptyCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", gap: 10 },
  emptyText: { flex: 1, color: colors.muted, fontFamily: fonts.medium, fontSize: 13 },
  tipCard: { backgroundColor: colors.navy, borderRadius: 24, padding: 16, flexDirection: "row", gap: 12, marginTop: 10, alignItems: "flex-start" },
  tipTitle: { color: "#fff", fontFamily: fonts.bold, fontSize: 14 },
  tipText: { color: "rgba(255,255,255,0.82)", fontFamily: fonts.medium, fontSize: 12, lineHeight: 18, marginTop: 2 },
  logoutBtn: { borderRadius: 16, padding: 14, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", marginTop: 16 },
  logoutText: { color: colors.red, fontFamily: fonts.bold, fontSize: 14 },
});

export default HomeScreen;
