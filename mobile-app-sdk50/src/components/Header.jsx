import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, shadow } from "../theme";
import api from "../services/api";

const Header = ({ title, subtitle, onBack, rightIcon = "notifications-outline", onRightPress }) => {
  const navigation = useNavigation();
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationData, setNotificationData] = useState({
    reports: [],
    hazards: [],
    urgentReports: [],
    urgentZones: [],
    error: "",
  });

  const showNotifications = async () => {
    if (onRightPress) {
      onRightPress();
      return;
    }
    setNotificationVisible(true);
    setNotificationLoading(true);
    try {
      const [reportsRes, hazardsRes] = await Promise.all([
        api.get("/reports/validated"),
        api.get("/hazards"),
      ]);
      const reports = reportsRes.data.data || [];
      const hazards = hazardsRes.data.data || [];
      const urgentReports = reports.filter((item) => item.severity === "high" || item.isEmergency);
      const urgentZones = hazards.filter((item) => item.riskLevel === "high");
      setNotificationData({ reports, hazards, urgentReports, urgentZones, error: "" });
    } catch {
      setNotificationData((prev) => ({ ...prev, error: "Could not refresh alerts right now." }));
    } finally {
      setNotificationLoading(false);
    }
  };

  return (
    <>
      <View style={styles.container}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.navy} />
          </TouchableOpacity>
        ) : (
          <View style={styles.leftSpacer} />
        )}
        <View style={styles.copy}>
          <Image
            source={require("../assets/images/mitigateplus-logoonly.png")}
            resizeMode="contain"
            style={styles.logo}
          />
          <View style={styles.titleWrap}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
          </View>
        </View>
        <View style={styles.actions}>
          {!onBack ? (
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate("Chatbot")}>
              <Ionicons name="chatbubble-ellipses-outline" size={21} color={colors.navy} />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={styles.iconButton} onPress={showNotifications}>
            <Ionicons name={rightIcon} size={21} color={colors.navy} />
            {notificationData.urgentReports.length + notificationData.urgentZones.length > 0 ? <View style={styles.dotBadge} /> : null}
          </TouchableOpacity>
          {!onBack ? (
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate("Settings")}>
              <Ionicons name="settings-outline" size={21} color={colors.navy} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      <Modal visible={notificationVisible} transparent animationType="fade" onRequestClose={() => setNotificationVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.notificationCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>MitigatePlus</Text>
                <Text style={styles.modalTitle}>Notifications</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setNotificationVisible(false)}>
                <Ionicons name="close" size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>
            {notificationLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={colors.blue} />
                <Text style={styles.loadingText}>Checking Manila alerts...</Text>
              </View>
            ) : (
              <>
                <View style={styles.alertSummary}>
                  <View style={styles.alertIcon}>
                    <Ionicons name="notifications" size={24} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.alertCount}>{notificationData.urgentReports.length + notificationData.urgentZones.length} urgent alert(s)</Text>
                    <Text style={styles.alertText}>Validated resident reports and admin hazard zones for Manila.</Text>
                  </View>
                </View>
                {notificationData.error ? <Text style={styles.errorText}>{notificationData.error}</Text> : null}
                <View style={styles.statRow}>
                  <NotificationStat label="Reports" value={notificationData.reports.length} />
                  <NotificationStat label="Hazard zones" value={notificationData.hazards.length} />
                  <NotificationStat label="High risk" value={notificationData.urgentReports.length + notificationData.urgentZones.length} danger />
                </View>
                <TouchableOpacity
                  style={styles.openMapBtn}
                  onPress={() => {
                    setNotificationVisible(false);
                    navigation.navigate("Map");
                  }}
                >
                  <Text style={styles.openMapText}>Open Hazard Map</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const NotificationStat = ({ label, value, danger }) => (
  <View style={[styles.statCard, danger && styles.statCardDanger]}>
    <Text style={[styles.statValue, danger && styles.statValueDanger]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 40,
    backgroundColor: "transparent",
  },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  leftSpacer: { width: 8 },
  copy: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginHorizontal: 8,
  },
  logo: { width: 42, height: 42, marginRight: 9 },
  titleWrap: { flex: 1, minWidth: 0 },
  title: { fontSize: 18, fontFamily: fonts.extraBold, color: colors.text },
  subtitle: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.muted,
    marginTop: -1,
  },
  iconButton: {
    position: "relative",
    width: 36,
    height: 36,
    borderRadius: 13,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft,
  },
  actions: { flexDirection: "row", alignItems: "center", gap: 7 },
  dotBadge: { position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.red, borderWidth: 1, borderColor: "#fff" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(7,26,66,0.42)", justifyContent: "flex-start", padding: 16, paddingTop: 70 },
  notificationCard: { backgroundColor: "#fff", borderRadius: 24, padding: 18, ...shadow.card },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  modalEyebrow: { color: colors.blue, fontFamily: fonts.bold, fontSize: 11, textTransform: "uppercase" },
  modalTitle: { color: colors.text, fontFamily: fonts.black, fontSize: 22 },
  closeBtn: { width: 36, height: 36, borderRadius: 14, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },
  loadingBox: { alignItems: "center", paddingVertical: 24 },
  loadingText: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12, marginTop: 8 },
  alertSummary: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 18, backgroundColor: "#f4fbff", borderWidth: 1, borderColor: colors.border },
  alertIcon: { width: 48, height: 48, borderRadius: 18, backgroundColor: colors.blue, alignItems: "center", justifyContent: "center", marginRight: 12 },
  alertCount: { color: colors.text, fontFamily: fonts.bold, fontSize: 16 },
  alertText: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12, lineHeight: 17, marginTop: 2 },
  errorText: { color: colors.red, fontFamily: fonts.medium, fontSize: 12, marginTop: 10 },
  statRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  statCard: { flex: 1, borderRadius: 16, backgroundColor: "#f8fbff", padding: 10, borderWidth: 1, borderColor: colors.border },
  statCardDanger: { backgroundColor: "#fff5f5", borderColor: "#fecaca" },
  statValue: { color: colors.navy, fontFamily: fonts.black, fontSize: 20 },
  statValueDanger: { color: colors.red },
  statLabel: { color: colors.muted, fontFamily: fonts.medium, fontSize: 10, marginTop: 1 },
  openMapBtn: { height: 48, borderRadius: 16, backgroundColor: colors.navy, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14 },
  openMapText: { color: "#fff", fontFamily: fonts.bold, fontSize: 14 },
});

export default Header;
