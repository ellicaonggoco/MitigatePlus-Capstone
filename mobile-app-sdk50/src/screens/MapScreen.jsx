import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import { useFocusEffect } from "@react-navigation/native";
import Header from "../components/Header";
import api from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import { getMitigationTipSource, getMitigationTips } from "../utils/hazardTips";
import HazardLogoBadge from "../components/HazardLogoBadge";
import { colors, fonts, hazardEmojis, shadow } from "../theme";

const MANILA_CENTER = { lat: 14.5995, lng: 120.9842 };
const MANILA_BOUNDS = [
  [14.55, 120.94],
  [14.64, 121.03],
];

const WEST_FAULT = [
  [14.78, 121.065],
  [14.75, 121.055],
  [14.72, 121.045],
  [14.69, 121.035],
  [14.66, 121.02],
  [14.63, 121.01],
  [14.6, 120.998],
  [14.57, 120.987],
  [14.54, 120.976],
  [14.51, 120.965],
  [14.48, 120.954],
  [14.45, 120.943],
  [14.42, 120.932],
  [14.39, 120.921],
];

const EAST_FAULT = [
  [14.78, 121.12],
  [14.75, 121.11],
  [14.72, 121.1],
  [14.69, 121.09],
  [14.66, 121.08],
  [14.63, 121.07],
  [14.6, 121.06],
  [14.57, 121.05],
  [14.54, 121.04],
  [14.51, 121.03],
];

const riskColor = (level) => {
  if (level === "high") return "#d32f2f";
  if (level === "moderate") return "#f57c00";
  return "#2e7d32";
};

const typeColor = (type, severity) => {
  if (type === "Flood") return "#1565c0";
  if (type === "Fire") return "#e65100";
  if (type === "Fault Line") return "#d32f2f";
  if (type === "Typhoon") return "#00897b";
  return riskColor(severity);
};

const webHazardLogos = {
  Flood:
    '<path d="M3 15.5c2 0 2-1.4 4-1.4s2 1.4 4 1.4 2-1.4 4-1.4 2 1.4 4 1.4 2-1.4 4-1.4"/><path d="M3 20c2 0 2-1.4 4-1.4s2 1.4 4 1.4 2-1.4 4-1.4 2 1.4 4 1.4 2-1.4 4-1.4"/><path d="M7.5 11.5a4.5 4.5 0 0 1 9 0"/>',
  Fire:
    '<path d="M12 22c4 0 7-3 7-7 0-3-2-5.1-4.2-7.2.1 2.1-1 3.7-2.4 4.6C12.8 8.9 11.3 6.2 9 4c.3 4.1-4 5.8-4 11 0 4 3 7 7 7Z"/><path d="M12 22c1.8 0 3.1-1.3 3.1-3 0-1.4-.8-2.4-1.8-3.2 0 1-.7 1.8-1.6 2.3.1-1.5-.7-2.7-1.8-3.8.1 2.2-1.9 3.2-1.9 4.8 0 1.6 1.3 2.9 3 2.9Z"/>',
  Landslide:
    '<path d="M3 20h18"/><path d="m4.5 17 6.2-10.5 4.1 6.2 2.1-3.1L21 17"/><circle cx="8" cy="15.5" r="1"/><circle cx="12" cy="18" r="1"/><circle cx="16" cy="16" r="1"/>',
  "Fault Line": '<path d="M13 2 4 14h7l-1 8 10-13h-7V2Z"/>',
  Typhoon:
    '<path d="M4 12a8 8 0 0 1 13.7-5.7"/><path d="M20 12A8 8 0 0 1 6.3 17.7"/><path d="M8 12a4 4 0 0 1 6.8-2.8"/><path d="M16 12a4 4 0 0 1-6.8 2.8"/>',
  "Drainage Issue":
    '<path d="M4 7h16"/><path d="M6 7v11h12V7"/><path d="M9 11h6"/><path d="M9 15h6"/>',
  "Structural Damage":
    '<path d="M4 20h16"/><path d="M6 20V8l6-4 6 4v12"/><path d="m10 8 2 4-2 2 2 3"/><path d="M14 8h2"/>',
  Evacuation:
    '<path d="M4 21h16"/><path d="M6 21V7l6-4 6 4v14"/><path d="M9 21v-6h6v6"/><path d="M9 10h.01"/><path d="M12 10h.01"/><path d="M15 10h.01"/><path d="M9 13h.01"/><path d="M15 13h.01"/>',
};

const safeJson = (value) => JSON.stringify(value).replace(/</g, "\\u003c");

const buildMapHtml = ({ hazards, reports, evacuation }) => {
  const tips = [
    "Flood",
    "Fire",
    "Landslide",
    "Fault Line",
    "Typhoon",
    "Drainage Issue",
    "Structural Damage",
  ].reduce((acc, type) => {
    ["low", "moderate", "high"].forEach((severity) => {
      acc[`${type}::${severity}`] = getMitigationTips(type, severity);
    });
    return acc;
  }, {});

  const payload = {
    center: MANILA_CENTER,
    bounds: MANILA_BOUNDS,
    hazards,
    reports,
    evacuation,
    tips,
    webHazardLogos,
    hazardEmojis,
    faults: [
      {
        title: "West Valley Fault",
        type: "Fault Line",
        severity: "high",
        points: WEST_FAULT,
      },
      {
        title: "East Valley Fault",
        type: "Fault Line",
        severity: "high",
        points: EAST_FAULT,
      },
    ],
  };

  return `<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; background: #e8edf3; }
    .leaflet-control-attribution { display: none; }
    .hazard-marker-wrap {
      width: 76px; height: 58px; display: flex; flex-direction: column;
      align-items: center; justify-content: flex-start; pointer-events: auto;
    }
    .hazard-marker {
      width: 42px; height: 42px;
      display: flex; align-items: center; justify-content: center;
      position: relative;
    }
    .hazard-emoji {
      width: 42px; height: 42px; display: flex; align-items: center; justify-content: center;
      font-size: 31px; line-height: 1; filter: drop-shadow(0 8px 12px rgba(13,43,107,.22));
      text-shadow: -2px 0 var(--hazard-color), 2px 0 var(--hazard-color), 0 -2px var(--hazard-color), 0 2px var(--hazard-color), 0 3px 5px rgba(0,0,0,.35);
    }
    .hazard-label {
      max-width: 76px; margin-top: -2px; padding: 2px 7px; border-radius: 999px;
      background: rgba(255,255,255,.96); color: #10233f; border: 1px solid rgba(13,43,107,.12);
      font: 800 9px system-ui; line-height: 1.15; text-align: center; white-space: nowrap;
      box-shadow: 0 5px 12px rgba(13,43,107,.16);
    }
    .popup { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; min-width: 220px; max-width: 260px; }
    .popup-title { font-weight: 900; color: #071a42; margin-bottom: 5px; font-size: 20px; line-height: 1.05; letter-spacing: -0.01em; }
    .popup-text { font-size: 12px; color: #475569; line-height: 1.4; margin: 8px 0; }
    .popup-tip-title { margin: 10px 0 5px; color: #10233f; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: .04em; }
    .popup-tips { margin: 0; padding-left: 16px; color: #334155; font-size: 12px; line-height: 1.35; }
    .popup-tips li { margin-bottom: 4px; }
    .pill { display:inline-block; padding: 4px 8px; border-radius: 999px; color: white; font-size: 10px; font-weight: 800; text-transform: uppercase; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const data = ${safeJson(payload)};
    const map = L.map('map', { zoomControl: false, preferCanvas: true, maxBounds: data.bounds, maxBoundsViscosity: 1.0, minZoom: 12 }).setView([data.center.lat, data.center.lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    const layers = { Zones: L.layerGroup().addTo(map), Reports: L.layerGroup().addTo(map), Faults: L.layerGroup().addTo(map), Evacuation: L.layerGroup().addTo(map) };
    const colors = ${safeJson({ high: "#d32f2f", moderate: "#f57c00", low: "#2e7d32", info: "#1565c0" })};
    const typeColors = ${safeJson({ Flood: "#1565c0", Fire: "#e65100", "Fault Line": "#d32f2f", Typhoon: "#00897b", Landslide: "#795548", "Drainage Issue": "#43a047", "Structural Damage": "#64748b" })};
    const markerLabels = ${safeJson({ Flood: "Flood", Fire: "Fire", "Fault Line": "Fault", Typhoon: "Typhoon", Landslide: "Landslide", "Drainage Issue": "Drainage", "Structural Damage": "Building", Evacuation: "Evacuation" })};
    const markerGradients = ${safeJson({
      Flood: "linear-gradient(145deg,#7dd3fc 0%,#1d72f3 48%,#0b2d70 100%)",
      Fire: "linear-gradient(145deg,#fde68a 0%,#f97316 48%,#b91c1c 100%)",
      "Fault Line": "linear-gradient(145deg,#c4b5fd 0%,#6366f1 48%,#312e81 100%)",
      Typhoon: "linear-gradient(145deg,#a5f3fc 0%,#14b8a6 48%,#047857 100%)",
      Landslide: "linear-gradient(145deg,#fde6bd 0%,#b45309 48%,#44403c 100%)",
      "Drainage Issue": "linear-gradient(145deg,#bbf7d0 0%,#22c55e 48%,#15803d 100%)",
      "Structural Damage": "linear-gradient(145deg,#e2e8f0 0%,#64748b 48%,#334155 100%)",
      Evacuation: "linear-gradient(145deg,#a7f3d0 0%,#10b981 48%,#047857 100%)",
    })};
    const iconSvg = (type) => {
      if (type === 'Evacuation') {
        return '<div style="width:42px;height:42px;border-radius:15px;border:3px solid #fff;background:' + markerGradients.Evacuation + ';display:flex;align-items:center;justify-content:center;box-shadow:0 10px 22px rgba(13,43,107,.32);"><svg viewBox="0 0 24 24" style="width:25px;height:25px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;">' + data.webHazardLogos.Evacuation + '</svg></div>';
      }
      return '<div class="hazard-emoji">' + (data.hazardEmojis[type] || '⚠️') + '</div>';
    };
    const post = (item) => window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(item));
    const popup = (item) => {
      const tips = (item.tips || []).slice(0, 3).map(t => '<li>' + t + '</li>').join('');
      return '<div class="popup"><div class="popup-title">' + (item.title || item.type) + '</div><span class="pill" style="background:' + (colors[item.severity] || '#1565c0') + '">' + (item.severity || 'info') + '</span><div class="popup-text">' + (item.description || item.barangay || 'Tap for safety tips.') + '</div>' + (tips ? '<div class="popup-tip-title">Mitigation tips</div><ul class="popup-tips">' + tips + '</ul>' : '') + '</div>';
    };
    const markerIcon = (item) => {
      const outline = typeColors[item.type] || colors[item.severity] || '#1565c0';
      const label = markerLabels[item.type] || item.type || 'Hazard';
      return L.divIcon({
        className: '',
        html: '<div class="hazard-marker-wrap"><div class="hazard-marker" style="--hazard-color:' + outline + '">' + iconSvg(item.type) + '</div><div class="hazard-label">' + label + '</div></div>',
        iconSize: [76,58],
        iconAnchor: [38,44],
        popupAnchor: [0,-44]
      });
    };

    data.hazards.forEach((z) => {
      const points = (z.coordinates || []).filter(c => Number.isFinite(c.lat) && Number.isFinite(c.lng)).map(c => [c.lat, c.lng]);
      if (!points.length) return;
      const item = { title: z.name || z.type, type: z.type, severity: z.riskLevel, description: z.description || 'Admin hazard zone.', tips: data.tips[z.type + '::' + z.riskLevel] || data.tips[z.type + '::moderate'] || [] };
      if (points.length >= 2) {
        L.polyline(points, { color: typeColors[z.type] || colors[z.riskLevel], weight: z.riskLevel === 'high' ? 6 : 4, opacity: .9 }).addTo(layers.Zones).on('click', () => post(item)).bindPopup(popup(item));
        L.marker(points[0], { icon: markerIcon(item) }).addTo(layers.Zones).on('click', () => post(item)).bindPopup(popup(item));
      } else {
        L.circle(points[0], { radius: z.radius || 120, color: colors[z.riskLevel], fillColor: typeColors[z.type] || colors[z.riskLevel], fillOpacity: .25, weight: 2 }).addTo(layers.Zones).on('click', () => post(item)).bindPopup(popup(item));
        L.marker(points[0], { icon: markerIcon(item) }).addTo(layers.Zones).on('click', () => post(item)).bindPopup(popup(item));
      }
    });

    data.reports.forEach((r) => {
      const item = { title: r.type + ' Report', type: r.type, severity: r.severity, description: r.description || '', barangay: r.barangay || '', tips: data.tips[r.type + '::' + r.severity] || data.tips[r.type + '::moderate'] || [] };
      if (r.startLocation && r.endLocation && Number.isFinite(r.startLocation.lat) && Number.isFinite(r.endLocation.lat)) {
        const route = (r.routeCoordinates || []).filter(c => Number.isFinite(c.lat) && Number.isFinite(c.lng)).map(c => [c.lat, c.lng]);
        const line = route.length >= 2 ? route : [[r.startLocation.lat, r.startLocation.lng], [r.endLocation.lat, r.endLocation.lng]];
        L.polyline(line, { color: typeColors[r.type] || colors[r.severity], weight: r.severity === 'high' ? 6 : 4, opacity: .9 }).addTo(layers.Reports).on('click', () => post(item)).bindPopup(popup(item));
        L.marker(line[0], { icon: markerIcon(item) }).addTo(layers.Reports).on('click', () => post(item)).bindPopup(popup(item));
      } else if (r.location && Number.isFinite(r.location.lat) && Number.isFinite(r.location.lng)) {
        const pos = [r.location.lat, r.location.lng];
        if (r.type === 'Flood') L.circle(pos, { radius: r.severity === 'high' ? 350 : r.severity === 'moderate' ? 180 : 80, color: '#1565c0', fillColor: '#1976d2', fillOpacity: .28 }).addTo(layers.Reports).on('click', () => post(item)).bindPopup(popup(item));
        L.marker(pos, { icon: markerIcon(item) }).addTo(layers.Reports).on('click', () => post(item)).bindPopup(popup(item));
      }
    });

    data.faults.forEach((f) => {
      const item = { title: f.title, type: f.type, severity: f.severity, description: 'Known seismic fault line. Prepare for earthquake response.' };
      L.polyline(f.points, { color: '#fff', weight: 8, opacity: .75 }).addTo(layers.Faults);
      L.polyline(f.points, { color: '#d32f2f', weight: 4, opacity: .95 }).addTo(layers.Faults).on('click', () => post(item)).bindPopup(popup(item));
    });

    data.evacuation.forEach((c) => {
      if (!c.location || !Number.isFinite(c.location.lat)) return;
      const item = { title: c.name, type: 'Evacuation', severity: 'info', description: 'Capacity: ' + (c.capacity || 'N/A') };
      L.marker([c.location.lat, c.location.lng], { icon: markerIcon(item) }).addTo(layers.Evacuation).on('click', () => post(item)).bindPopup(popup(item));
    });

    window.setFilter = (filter) => {
      Object.keys(layers).forEach(k => {
        if (filter === 'All' || filter === k) {
          if (!map.hasLayer(layers[k])) map.addLayer(layers[k]);
        } else if (map.hasLayer(layers[k])) map.removeLayer(layers[k]);
      });
    };
    window.resetMap = () => map.setView([data.center.lat, data.center.lng], 13, { animate: true });
    window.locateUser = () => map.locate({ setView: true, maxZoom: 16 });
    map.on('locationfound', (e) => L.circleMarker(e.latlng, { radius: 8, color: '#0d2b6b', fillColor: '#2bb7ff', fillOpacity: .9 }).addTo(map).bindPopup('You are here').openPopup());
    map.on('locationerror', () => post({ title: 'Location unavailable', type: 'Location', severity: 'info', description: 'Allow location permission or inspect hazards manually.' }));
  </script>
</body>
</html>`;
};

const MapScreen = () => {
  const [hazards, setHazards] = useState([]);
  const [evacuation, setEvacuation] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHazard, setSelectedHazard] = useState(null);
  const [tipsModalVisible, setTipsModalVisible] = useState(false);
  const [legendVisible, setLegendVisible] = useState(false);
  const [filter, setFilter] = useState("All");
  const [nearbyChecked, setNearbyChecked] = useState(false);
  const webRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, []),
  );

  const fetchData = async () => {
    try {
      const [hRes, eRes, rRes] = await Promise.all([
        api.get("/hazards"),
        api.get("/evacuation"),
        api.get("/reports/validated"),
      ]);
      setHazards(hRes.data.data || []);
      setEvacuation(eRes.data.data || []);
      setReports(rRes.data.data || []);
    } catch (err) {
      Alert.alert(
        "Map data unavailable",
        "Could not load hazard layers right now.",
      );
    } finally {
      setLoading(false);
    }
  };

  const html = useMemo(
    () => buildMapHtml({ hazards, reports, evacuation }),
    [hazards, reports, evacuation],
  );

  useEffect(() => {
    const notifyNearbyHazard = async () => {
      if (nearbyChecked || (!hazards.length && !reports.length)) return;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setNearbyChecked(true);
          return;
        }
        const { coords } = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const nearby = findNearbyHazard(
          coords.latitude,
          coords.longitude,
          hazards,
          reports,
        );
        setNearbyChecked(true);
        if (nearby) {
          const [tip] = getMitigationTips(nearby.type, nearby.severity);
          Alert.alert(
            "Nearby hazard alert",
            `${nearby.title || nearby.type} is near you. ${tip || "Stay alert and follow official advisories."}`,
          );
        }
      } catch {
        setNearbyChecked(true);
      }
    };

    notifyNearbyHazard();
  }, [hazards, nearbyChecked, reports]);

  const applyFilter = (nextFilter) => {
    setFilter(nextFilter);
    webRef.current?.injectJavaScript(
      `window.setFilter('${nextFilter}'); window.resetMap && window.resetMap(); true;`,
    );
  };

  const locateMe = () => {
    webRef.current?.injectJavaScript("window.locateUser(); true;");
  };

  const handleMessage = (event) => {
    try {
      const item = JSON.parse(event.nativeEvent.data);
      setSelectedHazard(item);
      setTipsModalVisible(true);
    } catch {
      // Ignore malformed map messages.
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Hazard Map" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.blue} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Hazard Map" />
      <View style={styles.mapWrap}>
        <WebView
          ref={webRef}
          originWhitelist={["*"]}
          source={{ html, baseUrl: "https://localhost" }}
          style={styles.webMap}
          javaScriptEnabled
          domStorageEnabled
          mixedContentMode="always"
          onMessage={handleMessage}
          onLoadEnd={() => applyFilter(filter)}
        />
      </View>

      <View style={styles.filterBar}>
        {["All", "Zones", "Reports", "Faults", "Evacuation"].map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.filterChip,
              filter === item && styles.filterChipActive,
            ]}
            onPress={() => applyFilter(item)}
          >
            <Text
              style={[
                styles.filterText,
                filter === item && styles.filterTextActive,
              ]}
              numberOfLines={1}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.locateBtn} onPress={locateMe}>
        <Ionicons name="locate" size={21} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.legendBtn}
        onPress={() => setLegendVisible(true)}
      >
        <Ionicons name="information-circle" size={23} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={tipsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTipsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hazard Details</Text>
              <TouchableOpacity onPress={() => setTipsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#8E9BB5" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 310 }}>
              {selectedHazard ? (
                <>
                  <Text style={styles.modalHazard}>
                    {selectedHazard.title || selectedHazard.type}
                  </Text>
                  {selectedHazard.description ? (
                    <Text style={styles.modalDescription}>
                      {selectedHazard.description}
                    </Text>
                  ) : null}
                  {selectedHazard.type !== "Evacuation" &&
                  selectedHazard.type !== "Location" ? (
                    <>
                      <View style={styles.riskRow}>
                        <Text style={styles.modalType}>{selectedHazard.type}</Text>
                        <View
                          style={[
                            styles.riskPill,
                            { backgroundColor: `${typeColor(selectedHazard.type, selectedHazard.severity)}18` },
                          ]}
                        >
                          <Text
                            style={[
                              styles.riskPillText,
                              { color: typeColor(selectedHazard.type, selectedHazard.severity) },
                            ]}
                          >
                            {selectedHazard.severity?.toUpperCase()} RISK
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.tipsHeading}>Mitigation Tips</Text>
                      {getMitigationTips(
                        selectedHazard.type,
                        selectedHazard.severity,
                      ).map((tip, i) => (
                        <View key={`${tip}-${i}`} style={styles.tipItem}>
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color={colors.blue}
                          />
                          <Text style={styles.tipText}>{tip}</Text>
                        </View>
                      ))}
                      <Text style={styles.tipSource}>
                        {getMitigationTipSource(selectedHazard.type)}
                      </Text>
                    </>
                  ) : null}
                </>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={legendVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLegendVisible(false)}
      >
        <View style={styles.legendOverlay}>
          <View style={styles.legendSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Map Symbols</Text>
              <TouchableOpacity onPress={() => setLegendVisible(false)}>
                <Ionicons name="close" size={24} color="#8E9BB5" />
              </TouchableOpacity>
            </View>
            <View style={styles.legendGrid}>
              <LegendIcon
                type="Flood"
                label="Flood"
              />
              <LegendIcon
                type="Fire"
                label="Fire"
              />
              <LegendIcon
                type="Landslide"
                label="Landslide"
              />
              <LegendIcon
                type="Fault Line"
                label="Fault Line"
              />
              <LegendIcon
                type="Drainage Issue"
                label="Drainage"
              />
              <LegendIcon
                type="Structural Damage"
                label="Structural Damage"
              />
              <LegendIcon
                type="Evacuation"
                label="Evacuation"
              />
            </View>
            <View style={styles.severityNote}>
              <Text style={styles.severityNoteText}>
                Red means high risk, orange means moderate risk, and green means
                low risk. Tap any marker for details and safety tips.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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

const findNearbyHazard = (latitude, longitude, hazards, reports) => {
  const reportPoints = reports
    .filter((report) => report.location?.lat && report.location?.lng)
    .map((report) => ({
      title: `${report.type} report`,
      type: report.type,
      severity: report.severity,
      lat: report.location.lat,
      lng: report.location.lng,
      radius: report.severity === "high" ? 800 : 500,
    }));

  const hazardPoints = hazards.flatMap((hazard) =>
    (hazard.coordinates || [])
      .filter(
        (point) => Number.isFinite(point.lat) && Number.isFinite(point.lng),
      )
      .map((point) => ({
        title: hazard.name,
        type: hazard.type,
        severity: hazard.riskLevel,
        lat: point.lat,
        lng: point.lng,
        radius: hazard.radius || (hazard.riskLevel === "high" ? 900 : 600),
      })),
  );

  return [...reportPoints, ...hazardPoints].find(
    (item) =>
      distanceInMeters(latitude, longitude, item.lat, item.lng) <= item.radius,
  );
};

const LegendIcon = ({ type, label }) => {
  return (
    <View style={styles.legendItem}>
      <HazardLogoBadge type={type} size={38} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  mapWrap: { flex: 1, overflow: "hidden", backgroundColor: "#e8edf3" },
  webMap: { flex: 1, backgroundColor: "#e8edf3" },
  filterBar: {
    position: "absolute",
    top: 122,
    left: 10,
    right: 10,
    flexDirection: "row",
    gap: 6,
  },
  filterChip: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.94)",
    paddingVertical: 9,
    borderRadius: 999,
    alignItems: "center",
    ...shadow.soft,
  },
  filterChipActive: { backgroundColor: colors.navy },
  filterText: { color: colors.navy, fontFamily: fonts.semiBold, fontSize: 10 },
  filterTextActive: { color: "#fff" },
  locateBtn: {
    position: "absolute",
    left: 14,
    bottom: 100,
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.button,
  },
  legendBtn: {
    position: "absolute",
    right: 12,
    bottom: 100,
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.button,
  },
  legendOverlay: {
    flex: 1,
    backgroundColor: "rgba(7,26,66,0.38)",
    justifyContent: "flex-end",
  },
  legendSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
  },
  legendGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  legendItem: {
    width: "30.5%",
    minHeight: 78,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#f8fbff",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  legendIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    marginBottom: 6,
  },
  legendEmoji: {
    fontSize: 25,
    lineHeight: 29,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  legendText: {
    color: colors.text,
    fontSize: 10,
    fontFamily: fonts.bold,
    textAlign: "center",
  },
  severityNote: {
    marginTop: 14,
    borderRadius: 16,
    padding: 12,
    backgroundColor: "#eef7ff",
    borderWidth: 1,
    borderColor: colors.border,
  },
  severityNoteText: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: "58%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.text },
  modalHazard: {
    fontSize: 28,
    color: colors.navyDark,
    marginBottom: 8,
    fontFamily: fonts.black,
    lineHeight: 32,
  },
  modalDescription: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 19,
    marginBottom: 8,
    fontFamily: fonts.medium,
  },
  riskRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  modalType: { fontSize: 13, color: colors.navy, fontFamily: fonts.bold },
  riskPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  riskPillText: { fontSize: 11, fontFamily: fonts.black },
  tipsHeading: { color: colors.navyDark, fontFamily: fonts.black, fontSize: 15, marginBottom: 10 },
  tipItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  tipText: {
    fontSize: 13,
    color: colors.text,
    marginLeft: 8,
    flex: 1,
    lineHeight: 19,
    fontFamily: fonts.medium,
  },
  tipSource: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
});

export default MapScreen;
