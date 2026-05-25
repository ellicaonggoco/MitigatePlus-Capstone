import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import Header from "../components/Header";
import ScreenShell from "../components/ScreenShell";
import HazardLogoBadge from "../components/HazardLogoBadge";
import api from "../services/api";
import { colors, fonts, shadow } from "../theme";

const OfficialReviewScreen = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nearbyPinged, setNearbyPinged] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  const fetchReports = useCallback(async () => {
    try {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const { coords } = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setCurrentLocation({
            lat: coords.latitude,
            lng: coords.longitude,
          });
          await api.patch("/auth/location", {
            lat: coords.latitude,
            lng: coords.longitude,
            accuracy: coords.accuracy,
          });
        }
      } catch {
        // Barangay matching still works when live location is unavailable.
      }

      const res = await api.get("/reports?status=pending");
      setReports(res.data.data || []);
    } catch (err) {
      Alert.alert("Reports unavailable", err.response?.data?.message || "Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    const pingNearbyReport = async () => {
      if (nearbyPinged || !reports.length) return;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setNearbyPinged(true);
          return;
        }
        const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const nearby = reports.find((report) => {
          if (!report.location?.lat || !report.location?.lng) return false;
          return distanceInMeters(coords.latitude, coords.longitude, report.location.lat, report.location.lng) <= 800;
        });
        if (nearby) {
          setNearbyPinged(true);
          Alert.alert("Nearby report needs verification", `${nearby.type} was reported near your current location. Please verify it as soon as possible.`);
        }
      } catch {
        // Officials can still review manually when location is unavailable.
      }
    };

    pingNearbyReport();
  }, [nearbyPinged, reports]);

  const reviewReport = async (report, status) => {
    const isReject = status === "rejected";
    if (isReject) {
      Alert.alert(
        "Reject urgent report?",
        "Only reject if the report is clearly false, duplicate, or not an active hazard.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Reject", style: "destructive", onPress: () => submitReview(report._id, status) },
        ],
      );
      return;
    }
    submitReview(report._id, status);
  };

  const submitReview = async (id, status) => {
    try {
      await api.patch(`/reports/${id}/status`, { status, note: status === "rejected" ? "Rejected by barangay official" : "Validated by barangay official" });
      fetchReports();
    } catch (err) {
      Alert.alert("Review failed", err.response?.data?.message || "Please try again.");
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const formatCoords = (location) => {
    if (!location?.lat || !location?.lng) return "No coordinates shared";
    return `${Number(location.lat).toFixed(5)}, ${Number(location.lng).toFixed(5)}`;
  };

  const formatActualLocation = (location) => {
    const coords = formatCoords(location);
    return location?.address ? `${location.address}\n${coords}` : coords;
  };

  const getReporter = (report) => report.reportedBy || report.userId || {};

  const openLocation = (location) => {
    if (!location?.lat || !location?.lng) return;
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`,
    );
  };

  const openDirections = (location) => {
    if (!location?.lat || !location?.lng) return;
    const destination = `${location.lat},${location.lng}`;
    const origin =
      currentLocation?.lat && currentLocation?.lng
        ? `&origin=${currentLocation.lat},${currentLocation.lng}`
        : "";

    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1${origin}&destination=${destination}&travelmode=driving`,
    );
  };

  return (
    <ScreenShell padded={false}>
      <Header title="Official Review" subtitle="3 validations before admin approval" />
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.blue} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>{reports.length}</Text>
            <Text style={styles.summaryText}>pending report(s) near you or in your barangay need review.</Text>
          </View>

          {reports.map((report) => {
            const validations = report.validatedBy?.length || 0;
            const required = report.requiredValidations || 3;
            const urgent = report.isEmergency || report.severity === "high";
            const reporter = getReporter(report);
            return (
              <View key={report._id} style={[styles.card, urgent && styles.urgentCard]}>
                <View style={styles.cardTop}>
                  <View style={styles.iconWrap}>
                    <HazardLogoBadge type={report.type} size={42} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                      <Text style={styles.type}>{report.type}</Text>
                      {urgent ? <Text style={styles.urgentBadge}>HURRY</Text> : null}
                    </View>
                    <Text style={styles.meta}>{report.barangay} - {report.severity?.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.description}>{report.description}</Text>
                <View style={styles.infoPanel}>
                  <InfoRow
                    icon="person-circle-outline"
                    label="Reporter"
                    value={reporter.name || "Resident"}
                  />
                  <InfoRow
                    icon="call-outline"
                    label="Contact"
                    value={reporter.phone || reporter.email || "Not provided"}
                  />
                  <InfoRow
                    icon="location-outline"
                    label="Actual location"
                    value={formatActualLocation(report.location)}
                    onPress={() => openLocation(report.location)}
                  />
                  <InfoRow
                    icon="home-outline"
                    label="Barangay"
                    value={report.barangay || reporter.barangay || "Not provided"}
                  />
                  <InfoRow
                    icon="time-outline"
                    label="Submitted"
                    value={
                      report.createdAt
                        ? new Date(report.createdAt).toLocaleString()
                        : "Not available"
                    }
                  />
                </View>
                <View style={styles.locationActions}>
                  <TouchableOpacity
                    style={styles.mapBtn}
                    onPress={() => openLocation(report.location)}
                  >
                    <Ionicons name="map-outline" size={16} color={colors.blue} />
                    <Text style={styles.mapBtnText}>View exact pin</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.routeBtn}
                    onPress={() => openDirections(report.location)}
                  >
                    <Ionicons name="navigate" size={16} color="#fff" />
                    <Text style={styles.routeBtnText}>Get directions</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${Math.min((validations / required) * 100, 100)}%` }]} />
                </View>
                <Text style={styles.progressText}>Official validation {validations}/{required}</Text>
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.approveBtn} onPress={() => reviewReport(report, "barangay_validated")}>
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    <Text style={styles.actionText}>Approve</Text>
                  </TouchableOpacity>
                  {urgent ? (
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => reviewReport(report, "rejected")}>
                      <Ionicons name="close-circle" size={18} color="#fff" />
                      <Text style={styles.actionText}>Deny</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          })}

          {!reports.length ? (
            <View style={styles.empty}>
              <Ionicons name="checkmark-done-circle-outline" size={34} color={colors.green} />
              <Text style={styles.emptyText}>No pending reports for review.</Text>
            </View>
          ) : null}
        </ScrollView>
      )}
    </ScreenShell>
  );
};

const InfoRow = ({ icon, label, value, onPress }) => {
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper style={styles.infoRow} onPress={onPress}>
      <Ionicons name={icon} size={15} color={colors.blue} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, onPress && styles.infoLink]} numberOfLines={2}>
        {value}
      </Text>
    </Wrapper>
  );
};

const distanceInMeters = (lat1, lng1, lat2, lng2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 16, paddingBottom: 112 },
  summary: { backgroundColor: colors.navy, borderRadius: 24, padding: 18, marginBottom: 14, ...shadow.card },
  summaryTitle: { color: "#fff", fontFamily: fonts.extraBold, fontSize: 34 },
  summaryText: { color: "rgba(255,255,255,0.78)", fontFamily: fonts.medium, fontSize: 13 },
  card: { backgroundColor: "#fff", borderRadius: 22, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border, ...shadow.card },
  urgentCard: { borderColor: "#fecaca", backgroundColor: "#fffafa" },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: { width: 46, height: 46, alignItems: "center", justifyContent: "center" },
  hazardEmoji: { fontSize: 29, lineHeight: 34, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 3 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  type: { color: colors.text, fontFamily: fonts.bold, fontSize: 16, flex: 1 },
  urgentBadge: { color: "#fff", backgroundColor: colors.red, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, fontFamily: fonts.bold, fontSize: 10 },
  meta: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12, marginTop: 2 },
  description: { color: colors.text, fontFamily: fonts.medium, fontSize: 13, lineHeight: 20, marginTop: 12 },
  infoPanel: { backgroundColor: "#f8fbff", borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 11, marginTop: 12, gap: 8 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 7 },
  infoLabel: { width: 70, color: colors.muted, fontFamily: fonts.bold, fontSize: 11 },
  infoValue: { flex: 1, color: colors.text, fontFamily: fonts.medium, fontSize: 11, lineHeight: 16, textAlign: "right" },
  infoLink: { color: colors.blue, fontFamily: fonts.bold },
  locationActions: { flexDirection: "row", gap: 8, marginTop: 10 },
  mapBtn: { flex: 1, minHeight: 40, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
  routeBtn: { flex: 1, minHeight: 40, borderRadius: 14, backgroundColor: colors.blue, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6, ...shadow.soft },
  mapBtnText: { color: colors.blue, fontFamily: fonts.bold, fontSize: 11 },
  routeBtnText: { color: "#fff", fontFamily: fonts.bold, fontSize: 11 },
  progressTrack: { height: 9, borderRadius: 999, backgroundColor: "#e5e7eb", overflow: "hidden", marginTop: 12 },
  progressFill: { height: "100%", backgroundColor: colors.blue, borderRadius: 999 },
  progressText: { color: colors.muted, fontFamily: fonts.bold, fontSize: 11, marginTop: 7 },
  actions: { flexDirection: "row", gap: 9, marginTop: 14 },
  approveBtn: { flex: 1, backgroundColor: colors.green, borderRadius: 15, padding: 13, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
  rejectBtn: { flex: 1, backgroundColor: colors.red, borderRadius: 15, padding: 13, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
  actionText: { color: "#fff", fontFamily: fonts.bold, fontSize: 13 },
  empty: { backgroundColor: "#fff", borderRadius: 22, padding: 20, alignItems: "center", ...shadow.card },
  emptyText: { color: colors.muted, fontFamily: fonts.medium, fontSize: 13, marginTop: 8 },
});

export default OfficialReviewScreen;
