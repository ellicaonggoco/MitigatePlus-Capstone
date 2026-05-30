import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import api from "../services/api";
import ScreenShell from "../components/ScreenShell";
import HazardLogoBadge from "../components/HazardLogoBadge";
import { colors, fonts, hazardEmojis, hazardTypes, shadow } from "../theme";

const MANILA = { latitude: 14.5995, longitude: 120.9842 };
const MANILA_BOUNDS = {
  minLat: 14.55,
  maxLat: 14.64,
  minLng: 120.94,
  maxLng: 121.03,
};
const REPORT_HAZARD_TYPES = hazardTypes.filter((type) => type !== "Typhoon");

const isInsideManila = ({ latitude, longitude }) =>
  latitude >= MANILA_BOUNDS.minLat &&
  latitude <= MANILA_BOUNDS.maxLat &&
  longitude >= MANILA_BOUNDS.minLng &&
  longitude <= MANILA_BOUNDS.maxLng;

const safeJson = (value) => JSON.stringify(value).replace(/</g, "\\u003c");

const buildPickerHtml = ({ hazardType, location, startLocation, endLocation, floodPoints, pickMode, mapView }) => {
  const payload = {
    hazardType,
    pickMode,
    center: { lat: MANILA.latitude, lng: MANILA.longitude },
    mapView: mapView ? { lat: mapView.latitude, lng: mapView.longitude, zoom: mapView.zoom } : null,
    bounds: [
      [MANILA_BOUNDS.minLat, MANILA_BOUNDS.minLng],
      [MANILA_BOUNDS.maxLat, MANILA_BOUNDS.maxLng],
    ],
    location: { lat: location.latitude, lng: location.longitude },
    startLocation: startLocation ? { lat: startLocation.latitude, lng: startLocation.longitude } : null,
    endLocation: endLocation ? { lat: endLocation.latitude, lng: endLocation.longitude } : null,
    floodPoints: floodPoints.map((point) => ({ lat: point.latitude, lng: point.longitude })),
  };

  return `<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; background: #e8edf3; }
    .leaflet-control-attribution { display: none; }
    .pin {
      width: 38px; height: 38px; border-radius: 16px; border: 3px solid #fff;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 8px 22px rgba(13,43,107,.28); position: relative;
    }
    .pin svg { position: relative; z-index: 2; }
    .pin::after {
      content: ""; position: absolute; inset: 4px; border-radius: 12px;
      background: linear-gradient(135deg, rgba(255,255,255,.32), rgba(255,255,255,0));
    }
    .location-pin { width: 42px; height: 52px; filter: drop-shadow(0 8px 12px rgba(185,28,28,.35)); }
    .route-point {
      width: 18px; height: 18px; border-radius: 999px; background: #1565c0;
      border: 4px solid #fff; box-shadow: 0 5px 14px rgba(21,101,192,.32);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const data = ${safeJson(payload)};
    const post = (payload) => window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(payload));
    const initialView = data.mapView || data.center;
    const initialZoom = data.mapView && data.mapView.zoom ? data.mapView.zoom : 13;
    const map = L.map('map', { zoomControl: false, maxBounds: data.bounds, maxBoundsViscosity: 1.0, minZoom: 12 }).setView([initialView.lat, initialView.lng], initialZoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    const iconSvg = '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 14h7l-1 8 10-13h-7l0-7Z"/></svg>';
    const makeIcon = (color) => L.divIcon({ className: '', html: '<div class="pin" style="background:' + color + '">' + iconSvg + '</div>', iconSize: [38,38], iconAnchor: [19,19] });
    const locationIcon = L.divIcon({
      className: '',
      html: '<div class="location-pin"><svg viewBox="0 0 64 80" width="42" height="52" aria-hidden="true"><path fill="#ef1f2d" d="M32 3C18 3 6.5 14.3 6.5 28.2c0 19.2 25.5 48.8 25.5 48.8s25.5-29.6 25.5-48.8C57.5 14.3 46 3 32 3Z"/><path fill="#ff5b60" opacity=".55" d="M14.6 28.5C14.6 17.7 22.9 9 34 9c7.7 0 14.3 4.1 17.6 10.2C47.5 13.6 41 10.4 33.7 10.4c-10.5 0-18.5 8.2-18.5 18.4 0 5.5 2.1 12.1 5 18.5-3.3-6.5-5.6-13.3-5.6-18.8Z"/><circle fill="#fff" cx="32" cy="28" r="10.5"/></svg></div>',
      iconSize: [42,52],
      iconAnchor: [21,50],
      popupAnchor: [0,-46]
    });
    const startIcon = makeIcon('#0d2b6b');
    const endIcon = makeIcon('#e53935');
    const routePointIcon = L.divIcon({
      className: '',
      html: '<div class="route-point"></div>',
      iconSize: [18,18],
      iconAnchor: [9,9]
    });

    L.marker([data.location.lat, data.location.lng], { icon: locationIcon }).addTo(map).bindPopup('Hazard location');
    if (data.hazardType === 'Flood' && data.floodPoints.length) {
      data.floodPoints.forEach((point) => L.marker([point.lat, point.lng], { icon: routePointIcon }).addTo(map).bindPopup('Flood street point'));
      if (data.floodPoints.length >= 2) {
        L.polyline(data.floodPoints.map((point) => [point.lat, point.lng]), {
          color: '#1565c0',
          weight: 6,
          opacity: .92
        }).addTo(map);
      }
    } else {
      if (data.startLocation) L.marker([data.startLocation.lat, data.startLocation.lng], { icon: startIcon }).addTo(map).bindPopup('Start point');
      if (data.endLocation) L.marker([data.endLocation.lat, data.endLocation.lng], { icon: endIcon }).addTo(map).bindPopup('End point');
    }
    if (data.hazardType !== 'Flood' && data.startLocation && data.endLocation) {
      L.polyline([[data.startLocation.lat, data.startLocation.lng], [data.endLocation.lat, data.endLocation.lng]], {
        color: '#d32f2f',
        weight: 5,
        opacity: .92
      }).addTo(map);
    }

    map.on('click', (event) => {
      const center = map.getCenter();
      post({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
        mode: data.pickMode,
        view: { lat: center.lat, lng: center.lng, zoom: map.getZoom() }
      });
    });
  </script>
</body>
</html>`;
};

const ReportScreen = () => {
  const webRef = useRef(null);
  const [hazardType, setHazardType] = useState("Flood");
  const [severity, setSeverity] = useState("moderate");
  const [location, setLocation] = useState(MANILA);
  const [startLocation, setStartLocation] = useState(null);
  const [endLocation, setEndLocation] = useState(null);
  const [floodPoints, setFloodPoints] = useState([]);
  const [mapView, setMapView] = useState({ latitude: MANILA.latitude, longitude: MANILA.longitude, zoom: 13 });
  const [pickMode, setPickMode] = useState("location");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [pendingEmergency, setPendingEmergency] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);
  const isLineHazard = hazardType === "Flood" || hazardType === "Fault Line";
  const mapHtml = useMemo(
    () => buildPickerHtml({ hazardType, location, startLocation, endLocation, floodPoints, pickMode, mapView }),
    [endLocation, floodPoints, hazardType, location, mapView, pickMode, startLocation],
  );

  const hasRequiredReportDetails = useMemo(() => {
    if (!description.trim()) return false;
    if (hazardType === "Flood" && floodPoints.length < 2) return false;
    if (hazardType === "Fault Line" && (!startLocation || !endLocation)) return false;
    return true;
  }, [description, endLocation, floodPoints.length, hazardType, startLocation]);

  const canSubmit = isEmergency || hasRequiredReportDetails;

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]) setImage(result.assets[0]);
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets?.[0]) setImage(result.assets[0]);
  };

  const setCoordinateForMode = (coordinate, mode = pickMode) => {
    if (!isInsideManila(coordinate)) {
      Alert.alert("Manila only", "MitigatePlus reports are limited to the City of Manila map area.");
      return;
    }
    if (mode === "floodPoint") {
      setFloodPoints((prev) => {
        const next = [...prev, coordinate];
        setStartLocation(next[0]);
        setEndLocation(next[next.length - 1]);
        setLocation(next[0]);
        return next;
      });
    } else if (mode === "start") setStartLocation(coordinate);
    else if (mode === "end") setEndLocation(coordinate);
    else setLocation(coordinate);
  };

  const undoFloodPoint = () => {
    setFloodPoints((prev) => {
      const next = prev.slice(0, -1);
      setStartLocation(next[0] || null);
      setEndLocation(next[next.length - 1] || null);
      setLocation(next[0] || MANILA);
      return next;
    });
  };

  const clearFloodPoints = () => {
    setFloodPoints([]);
    setStartLocation(null);
    setEndLocation(null);
    setLocation(MANILA);
  };

  const locateMe = async () => {
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert("Location is off", "Turn on device location services, or tap the map to add the hazard location manually.");
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Location permission needed", "Please allow location access, or tap the map to add the hazard location manually.");
        return;
      }

      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCoordinateForMode({ latitude: coords.latitude, longitude: coords.longitude }, "location");
    } catch (error) {
      Alert.alert("Locate me", "Could not read your current location. Tap the map to add the hazard location manually.");
    }
  };

  const submitReport = async (emergencyAcknowledged = false, forceEmergency = false) => {
    const emergencyReport = forceEmergency || isEmergency;
    if (!emergencyReport && !hasRequiredReportDetails) {
      Alert.alert("Missing details", hazardType === "Flood" ? "Add a description and at least 2 flood street points." : isLineHazard ? "Add a description and select start/end points." : "Add a description and location.");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      const reportLocation = hazardType === "Flood" && floodPoints[0] ? floodPoints[0] : location;
      const emergencyDescription = `Emergency ping submitted by resident for active ${hazardType} danger.`;
      formData.append("type", hazardType);
      formData.append("emoji", hazardEmojis[hazardType] || "\u{26A0}\u{FE0F}");
      formData.append("severity", emergencyReport ? "high" : severity);
      formData.append("description", description.trim() || emergencyDescription);
      formData.append("location", JSON.stringify({ lat: reportLocation.latitude, lng: reportLocation.longitude }));
      formData.append("barangay", "Manila");
      formData.append("isEmergency", emergencyReport ? "true" : "false");
      formData.append("emergencyAcknowledged", emergencyAcknowledged ? "true" : "false");
      if (hazardType === "Flood" && floodPoints.length >= 2) {
        const routeWaypoints = floodPoints.map((point) => ({ lat: point.latitude, lng: point.longitude }));
        formData.append("startLocation", JSON.stringify(routeWaypoints[0]));
        formData.append("endLocation", JSON.stringify(routeWaypoints[routeWaypoints.length - 1]));
        formData.append("routeWaypoints", JSON.stringify(routeWaypoints));
      } else if (isLineHazard && startLocation && endLocation) {
        formData.append("startLocation", JSON.stringify({ lat: startLocation.latitude, lng: startLocation.longitude }));
        formData.append("endLocation", JSON.stringify({ lat: endLocation.latitude, lng: endLocation.longitude }));
      }
      if (image?.uri) {
        const filename = image.fileName || image.uri.split("/").pop();
        formData.append("image", {
          uri: image.uri,
          name: filename,
          type: image.mimeType || "image/jpeg",
        });
      }

      await api.post("/reports", formData);
      Alert.alert("Report submitted", emergencyReport ? "Emergency report was pinged to officials and admin." : "Your report is pending official validation.");
      setDescription("");
      setImage(null);
      setSeverity("moderate");
      setIsEmergency(false);
      setPendingEmergency(false);
      setStartLocation(null);
      setEndLocation(null);
      setFloodPoints([]);
      setPickMode("location");
    } catch (err) {
      Alert.alert("Submission failed", err.response?.data?.message || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmSubmit = () => {
    if (!isEmergency) {
      submitReport(false);
      return;
    }
    Alert.alert(
      "Confirm emergency report",
      `You are about to send a HIGH PRIORITY ${hazardType} ping. Only use this for real active danger. False reports can be traced and may lead to penalties.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "I confirm this is real", style: "destructive", onPress: () => submitReport(true) },
      ],
    );
  };

  const confirmEmergencyPing = () => {
    Alert.alert(
      "Emergency ping precaution",
      "Send this only for real, active danger. Officials will receive a high-priority alert with your location, and false reports may lead to penalties.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send emergency ping",
          style: "destructive",
          onPress: () => {
            setIsEmergency(true);
            setSeverity("high");
            setPendingEmergency(false);
            submitReport(true, true);
          },
        },
      ],
    );
  };

  const handleMapPress = (event) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      if (payload.view) {
        setMapView({ latitude: payload.view.lat, longitude: payload.view.lng, zoom: payload.view.zoom });
      }
      setCoordinateForMode({ latitude: payload.lat, longitude: payload.lng }, payload.mode);
    } catch {
      Alert.alert("Map selection failed", "Please tap the map again.");
    }
  };

  return (
    <ScreenShell padded={false}>
      <Header title="Submit Report" subtitle="Hazard location and details" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.emergencyCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.emergencyTitle}>Emergency ping: {hazardType}</Text>
            <Text style={styles.emergencyText}>
              {pendingEmergency
                ? "Tap Confirm Ping to arm a high-priority hazard report."
                : "Use for active danger that needs immediate admin and official attention."}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.emergencySwitch, isEmergency && styles.emergencySwitchActive]}
            onPress={() => {
              if (isEmergency) {
                setIsEmergency(false);
                setPendingEmergency(false);
                setSeverity("moderate");
              } else {
                setPendingEmergency(true);
              }
            }}
          >
            <Ionicons name={isEmergency ? "radio" : "radio-outline"} size={20} color={isEmergency ? "#fff" : colors.red} />
          </TouchableOpacity>
        </View>
        {pendingEmergency && !isEmergency ? (
          <View style={styles.confirmPingCard}>
            <Ionicons name="warning" size={20} color={colors.red} />
            <Text style={styles.confirmPingText}>Confirm this is an active {hazardType} emergency.</Text>
            <TouchableOpacity
              style={styles.confirmPingBtn}
              onPress={confirmEmergencyPing}
            >
              <Text style={styles.confirmPingBtnText}>Confirm Ping</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Hazard type</Text>
        <View style={styles.typeGrid}>
          {REPORT_HAZARD_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.typeCard, hazardType === type && styles.selectedCard]}
              onPress={() => {
                setHazardType(type);
                setStartLocation(null);
                setEndLocation(null);
                setFloodPoints([]);
                setPickMode("location");
              }}
            >
              <View style={styles.typeIconWrap}>
                <HazardLogoBadge type={type} size={42} />
              </View>
              <Text style={styles.typeText}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Severity</Text>
        <View style={styles.severityRow}>
          {["low", "moderate", "high"].map((level) => (
            <TouchableOpacity
              key={level}
              style={[styles.severityBtn, severity === level && styles[`${level}Severity`]]}
              onPress={() => {
                setSeverity(level);
                if (level !== "high") setIsEmergency(false);
              }}
            >
              <Text style={styles.severityText}>{level.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Location</Text>
        <TouchableOpacity style={styles.expandMapBtn} onPress={() => setMapExpanded(true)}>
          <Ionicons name="expand" size={18} color="#fff" />
          <Text style={styles.expandMapText}>Open full map picker</Text>
        </TouchableOpacity>
        <View style={styles.locationActions}>
          <TouchableOpacity style={styles.locationBtn} onPress={locateMe}>
            <Ionicons name="locate" size={18} color={colors.blue} />
            <Text style={styles.locationBtnText}>Locate me</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.locationBtn, pickMode === "location" && styles.locationBtnActive]} onPress={() => setPickMode("location")}>
            <Ionicons name="pin" size={18} color={colors.blue} />
            <Text style={styles.locationBtnText}>Add location</Text>
          </TouchableOpacity>
        </View>
        {hazardType === "Flood" ? (
          <>
            <View style={styles.locationActions}>
              <TouchableOpacity style={[styles.locationBtn, pickMode === "floodPoint" && styles.locationBtnActive]} onPress={() => setPickMode("floodPoint")}>
                <Ionicons name="add-circle" size={18} color={colors.blue} />
                <Text style={styles.locationBtnText}>Add flood point</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.locationBtn, !floodPoints.length && styles.disabled]}
                onPress={undoFloodPoint}
                disabled={!floodPoints.length}
              >
                <Ionicons name="arrow-undo" size={18} color={colors.blue} />
                <Text style={styles.locationBtnText}>Undo point</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.clearPointsBtn} onPress={clearFloodPoints}>
              <Text style={styles.clearPointsText}>Clear flood street points</Text>
            </TouchableOpacity>
          </>
        ) : isLineHazard ? (
          <View style={styles.locationActions}>
            <TouchableOpacity style={[styles.locationBtn, pickMode === "start" && styles.locationBtnActive]} onPress={() => setPickMode("start")}>
              <Text style={styles.locationBtnText}>Set start</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.locationBtn, pickMode === "end" && styles.locationBtnActive]} onPress={() => setPickMode("end")}>
              <Text style={styles.locationBtnText}>Set end</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.map}>
          <WebView
            ref={webRef}
            originWhitelist={["*"]}
            source={{ html: mapHtml, baseUrl: "https://localhost" }}
            style={styles.webMap}
            javaScriptEnabled
            domStorageEnabled
            mixedContentMode="always"
            onMessage={handleMapPress}
          />
        </View>
        <Modal visible={mapExpanded} animationType="slide" onRequestClose={() => setMapExpanded(false)}>
          <View style={styles.fullMapRoot}>
            <View style={styles.fullMapHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fullMapTitle}>Pick {hazardType} location</Text>
                <Text style={styles.fullMapSubtitle}>
                  {hazardType === "Flood"
                    ? "Add at least 2 street points in order."
                    : isLineHazard
                      ? "Set start and end points on the map."
                      : "Tap the exact hazard location."}
                </Text>
              </View>
              <TouchableOpacity style={styles.fullMapClose} onPress={() => setMapExpanded(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.fullMapActions}>
              <TouchableOpacity style={[styles.fullMapChip, pickMode === "location" && styles.fullMapChipActive]} onPress={() => setPickMode("location")}>
                <Ionicons name="pin" size={16} color={pickMode === "location" ? "#fff" : colors.blue} />
                <Text style={[styles.fullMapChipText, pickMode === "location" && styles.fullMapChipTextActive]}>Location</Text>
              </TouchableOpacity>
              {hazardType === "Flood" ? (
                <>
                  <TouchableOpacity style={[styles.fullMapChip, pickMode === "floodPoint" && styles.fullMapChipActive]} onPress={() => setPickMode("floodPoint")}>
                    <Ionicons name="add-circle" size={16} color={pickMode === "floodPoint" ? "#fff" : colors.blue} />
                    <Text style={[styles.fullMapChipText, pickMode === "floodPoint" && styles.fullMapChipTextActive]}>Flood point</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.fullMapChip, !floodPoints.length && styles.disabled]}
                    onPress={undoFloodPoint}
                    disabled={!floodPoints.length}
                  >
                    <Ionicons name="arrow-undo" size={16} color={colors.blue} />
                    <Text style={styles.fullMapChipText}>Undo point</Text>
                  </TouchableOpacity>
                </>
              ) : isLineHazard ? (
                <>
                  <TouchableOpacity style={[styles.fullMapChip, pickMode === "start" && styles.fullMapChipActive]} onPress={() => setPickMode("start")}>
                    <Text style={[styles.fullMapChipText, pickMode === "start" && styles.fullMapChipTextActive]}>Start</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.fullMapChip, pickMode === "end" && styles.fullMapChipActive]} onPress={() => setPickMode("end")}>
                    <Text style={[styles.fullMapChipText, pickMode === "end" && styles.fullMapChipTextActive]}>End</Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
            <WebView
              originWhitelist={["*"]}
              source={{ html: mapHtml, baseUrl: "https://localhost" }}
              style={styles.fullWebMap}
              javaScriptEnabled
              domStorageEnabled
              mixedContentMode="always"
              onMessage={handleMapPress}
            />
            <View style={styles.fullMapFooter}>
              <Text style={styles.fullMapFooterText}>
                Selected: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                {hazardType === "Flood" ? ` - points ${floodPoints.length}` : ""}
              </Text>
              <TouchableOpacity style={styles.fullMapDone} onPress={() => setMapExpanded(false)}>
                <Text style={styles.fullMapDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <View style={styles.locationSummary}>
          <Text style={styles.locationSummaryText}>
            Selected: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
          </Text>
          {hazardType === "Flood" ? (
            <Text style={styles.locationSummaryText}>Flood street points: {floodPoints.length}</Text>
          ) : null}
          {isLineHazard && startLocation ? (
            <Text style={styles.locationSummaryText}>Start: {startLocation.latitude.toFixed(5)}, {startLocation.longitude.toFixed(5)}</Text>
          ) : null}
          {isLineHazard && endLocation ? (
            <Text style={styles.locationSummaryText}>End: {endLocation.latitude.toFixed(5)}, {endLocation.longitude.toFixed(5)}</Text>
          ) : null}
        </View>
        <Text style={styles.mapHint}>
          {hazardType === "Flood" ? "Tap Add flood point, then tap each flooded street in order. Add at least 2 points." : isLineHazard ? "Tap Set start and Set end, then tap the map for each point." : "Tap the map if the hazard is away from your current location."}
        </Text>

        <Text style={styles.sectionTitle}>Description</Text>
        <TextInput
          style={styles.textArea}
          multiline
          placeholder="Describe what is happening, visible signs, affected street, and urgency."
          placeholderTextColor="#8E9BB5"
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.sectionTitle}>Evidence</Text>
        <View style={styles.photoRow}>
          <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
            <Ionicons name="image" size={22} color={colors.blue} />
            <Text style={styles.photoText}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
            <Ionicons name="camera" size={22} color={colors.blue} />
            <Text style={styles.photoText}>Camera</Text>
          </TouchableOpacity>
        </View>
        {image?.uri ? <Text style={styles.imageName}>{image.fileName || image.uri.split("/").pop()}</Text> : null}

        <TouchableOpacity style={[styles.submitBtn, (!canSubmit || submitting) && styles.disabled]} onPress={confirmSubmit} disabled={!canSubmit || submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{isEmergency ? "Ping Emergency Report" : "Submit Report"}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16, paddingBottom: 112 },
  emergencyCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 22, padding: 16, borderWidth: 1, borderColor: "#fecaca", marginBottom: 16, ...shadow.card },
  emergencyTitle: { color: colors.red, fontFamily: fonts.bold, fontSize: 16 },
  emergencyText: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12, lineHeight: 18, marginTop: 2 },
  emergencySwitch: { width: 46, height: 46, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "#fff5f5", borderWidth: 1, borderColor: "#fecaca" },
  emergencySwitchActive: { backgroundColor: colors.red, borderColor: colors.red },
  confirmPingCard: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "#fff5f5", borderRadius: 18, padding: 12, borderWidth: 1, borderColor: "#fecaca", marginBottom: 8 },
  confirmPingText: { flex: 1, color: colors.text, fontFamily: fonts.semiBold, fontSize: 12, lineHeight: 17 },
  confirmPingBtn: { backgroundColor: colors.red, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 },
  confirmPingBtnText: { color: "#fff", fontFamily: fonts.bold, fontSize: 11 },
  sectionTitle: { fontSize: 17, fontFamily: fonts.bold, color: colors.text, marginTop: 16, marginBottom: 10 },
  expandMapBtn: { minHeight: 46, borderRadius: 16, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginBottom: 10, ...shadow.button },
  expandMapText: { color: "#fff", fontFamily: fonts.bold, fontSize: 13 },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  typeCard: { width: "31.5%", minHeight: 104, backgroundColor: colors.surface, borderRadius: 20, padding: 10, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, ...shadow.soft },
  selectedCard: { borderColor: colors.blue, backgroundColor: "#f4fbff" },
  typeIconWrap: { width: 42, height: 42, alignItems: "center", justifyContent: "center", marginBottom: 7 },
  typeEmoji: { fontSize: 28, lineHeight: 33, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 3 },
  typeText: { color: colors.text, fontSize: 11, fontFamily: fonts.semiBold, textAlign: "center" },
  severityRow: { flexDirection: "row", gap: 8 },
  severityBtn: { flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 13, alignItems: "center", borderWidth: 1, borderColor: colors.border },
  lowSeverity: { borderColor: colors.green, backgroundColor: colors.mint },
  moderateSeverity: { borderColor: colors.orange, backgroundColor: "#fff7ed" },
  highSeverity: { borderColor: colors.red, backgroundColor: "#fef2f2" },
  severityText: { color: colors.text, fontFamily: fonts.bold, fontSize: 12 },
  locationActions: { flexDirection: "row", gap: 8, marginBottom: 9 },
  locationBtn: { flex: 1, minHeight: 42, borderRadius: 15, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
  locationBtnActive: { backgroundColor: "#e1f4ff", borderColor: colors.blue },
  locationBtnText: { color: colors.blue, fontFamily: fonts.bold, fontSize: 12 },
  clearPointsBtn: { minHeight: 40, borderRadius: 14, backgroundColor: "#eef7ff", borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginBottom: 9 },
  clearPointsText: { color: colors.blue, fontFamily: fonts.bold, fontSize: 12 },
  map: { width: "100%", height: 250, borderRadius: 18, overflow: "hidden", backgroundColor: "#e8edf3", borderWidth: 1, borderColor: colors.border },
  webMap: { flex: 1, backgroundColor: "#e8edf3" },
  fullMapRoot: { flex: 1, backgroundColor: "#e8edf3" },
  fullMapHeader: { paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: "#fff", flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, borderColor: colors.border },
  fullMapTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 18 },
  fullMapSubtitle: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12, lineHeight: 17, marginTop: 2 },
  fullMapClose: { width: 42, height: 42, borderRadius: 16, backgroundColor: "#eef7ff", alignItems: "center", justifyContent: "center" },
  fullMapActions: { flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderColor: colors.border },
  fullMapChip: { minHeight: 38, borderRadius: 999, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#eef7ff", borderWidth: 1, borderColor: colors.border },
  fullMapChipActive: { backgroundColor: colors.blue, borderColor: colors.blue },
  fullMapChipText: { color: colors.blue, fontFamily: fonts.bold, fontSize: 12 },
  fullMapChipTextActive: { color: "#fff" },
  fullWebMap: { flex: 1, backgroundColor: "#e8edf3" },
  fullMapFooter: { padding: 12, backgroundColor: "#fff", borderTopWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 10 },
  fullMapFooterText: { flex: 1, color: colors.muted, fontFamily: fonts.medium, fontSize: 11 },
  fullMapDone: { borderRadius: 14, backgroundColor: colors.navy, paddingHorizontal: 18, paddingVertical: 11 },
  fullMapDoneText: { color: "#fff", fontFamily: fonts.bold, fontSize: 13 },
  locationSummary: { backgroundColor: "#fff", borderRadius: 16, padding: 12, marginTop: 8, borderWidth: 1, borderColor: colors.border },
  locationSummaryText: { color: colors.muted, fontFamily: fonts.medium, fontSize: 11, lineHeight: 17 },
  mapHint: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12, lineHeight: 18, marginTop: 8 },
  textArea: { backgroundColor: colors.surface, borderRadius: 20, padding: 15, color: colors.text, fontSize: 14, minHeight: 118, width: "100%", borderWidth: 1, borderColor: colors.border, fontFamily: fonts.medium },
  photoRow: { flexDirection: "row", gap: 10 },
  photoBtn: { flex: 1, backgroundColor: "#fff", borderRadius: 18, padding: 15, alignItems: "center", borderWidth: 1, borderColor: colors.border, ...shadow.soft },
  photoText: { color: colors.blue, marginTop: 4, fontFamily: fonts.semiBold },
  imageName: { color: colors.muted, fontSize: 12, marginTop: 8, fontFamily: fonts.medium },
  submitBtn: { backgroundColor: colors.navy, borderRadius: 18, padding: 16, width: "100%", alignItems: "center", marginTop: 22, ...shadow.button },
  disabled: { opacity: 0.55 },
  submitBtnText: { color: "#fff", fontFamily: fonts.bold, fontSize: 16 },
});

export default ReportScreen;
