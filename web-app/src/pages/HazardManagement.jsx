import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  CircleMarker,
  Polyline,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import { motion, AnimatePresence } from "framer-motion";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Sidebar from "../components/Sidebar";
import LocateMeButton from "../components/LocateMeButton";
import Navbar from "../components/Navbar";
import HazardIconBadge from "../components/HazardIconBadge";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { io } from "socket.io-client";
import {
  PlusIcon,
  MapPinIcon,
  XMarkIcon,
  LightBulbIcon,
  BuildingOffice2Icon,
  ExclamationTriangleIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

// ----- Leaflet icon fixes -----
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const evacuationBuildingSvg = `
  <svg viewBox="0 0 24 24" style="width:24px;height:24px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;">
    <path d="M4 21h16" />
    <path d="M6 21V7l6-4 6 4v14" />
    <path d="M9 21v-6h6v6" />
    <path d="M9 10h.01" />
    <path d="M12 10h.01" />
    <path d="M15 10h.01" />
    <path d="M9 13h.01" />
    <path d="M15 13h.01" />
  </svg>
`;

// Evacuation centre icon
const evacuationIcon = new L.DivIcon({
  className: "custom-marker",
  html: `<div style="background:linear-gradient(135deg,#10b981,#059669);width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(16,185,129,0.5);border:3px solid white;">${evacuationBuildingSvg}</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// ========== Flood style ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ thick water line (unchanged) ==========
const getFloodStyle = (severity) => {
  switch (severity) {
    case "high":
      return { color: "#0d47a1", weight: 6, opacity: 0.9 };
    case "moderate":
      return { color: "#1976d2", weight: 5, opacity: 0.8 };
    case "low":
      return { color: "#64b5f6", weight: 4, opacity: 0.7 };
    default:
      return { color: "#42a5f5", weight: 5, opacity: 0.7 };
  }
};

// ========== Style for lineÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Ëœbased hazard zones (Fault Line, etc.) ==========
const getLineStyle = (type, riskLevel) => {
  const base = {
    Flood: getFloodStyle(riskLevel),
    "Fault Line": { color: "#d32f2f", weight: 4, opacity: 0.9 }, // solid
    default: {
      color: getHazardStyle(type, riskLevel).color,
      weight: 3,
      opacity: 0.8,
    },
  };
  return base[type] || base.default;
};

// ========== NonÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Ëœflood hazard style ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ colour per type ==========
const getHazardStyle = (type, riskLevel) => {
  const typeColors = {
    Flood: "#1565c0",
    Fire: "#e65100",
    Landslide: "#795548",
    "Fault Line": "#9c27b0",
    Typhoon: "#00897b",
    "Drainage Issue": "#43a047",
    "Structural Damage": "#757575",
    default: "#1565c0",
  };
  const fill = typeColors[type] || typeColors.default;
  const opacity =
    riskLevel === "high" ? 0.35 : riskLevel === "moderate" ? 0.25 : 0.15;
  return { fillColor: fill, fillOpacity: opacity, color: fill, weight: 2 };
};

const hazardLogoConfig = {
  Flood: {
    gradient: "linear-gradient(145deg,#7dd3fc 0%,#1d72f3 48%,#0b2d70 100%)",
    paths:
      '<path d="M3 15.5c2 0 2-1.4 4-1.4s2 1.4 4 1.4 2-1.4 4-1.4 2 1.4 4 1.4 2-1.4 4-1.4"/><path d="M3 20c2 0 2-1.4 4-1.4s2 1.4 4 1.4 2-1.4 4-1.4 2 1.4 4 1.4 2-1.4 4-1.4"/><path d="M7.5 11.5a4.5 4.5 0 0 1 9 0"/>',
  },
  Fire: {
    gradient: "linear-gradient(145deg,#fde68a 0%,#f97316 48%,#b91c1c 100%)",
    paths:
      '<path d="M12 22c4 0 7-3 7-7 0-3-2-5.1-4.2-7.2.1 2.1-1 3.7-2.4 4.6C12.8 8.9 11.3 6.2 9 4c.3 4.1-4 5.8-4 11 0 4 3 7 7 7Z"/><path d="M12 22c1.8 0 3.1-1.3 3.1-3 0-1.4-.8-2.4-1.8-3.2 0 1-.7 1.8-1.6 2.3.1-1.5-.7-2.7-1.8-3.8.1 2.2-1.9 3.2-1.9 4.8 0 1.6 1.3 2.9 3 2.9Z"/>',
  },
  Landslide: {
    gradient: "linear-gradient(145deg,#fde6bd 0%,#b45309 48%,#44403c 100%)",
    paths:
      '<path d="M3 20h18"/><path d="m4.5 17 6.2-10.5 4.1 6.2 2.1-3.1L21 17"/><circle cx="8" cy="15.5" r="1"/><circle cx="12" cy="18" r="1"/><circle cx="16" cy="16" r="1"/>',
  },
  "Fault Line": {
    gradient: "linear-gradient(145deg,#c4b5fd 0%,#6366f1 48%,#312e81 100%)",
    paths: '<path d="M13 2 4 14h7l-1 8 10-13h-7V2Z"/>',
  },
  Typhoon: {
    gradient: "linear-gradient(145deg,#a5f3fc 0%,#14b8a6 48%,#047857 100%)",
    paths:
      '<path d="M4 12a8 8 0 0 1 13.7-5.7"/><path d="M20 12A8 8 0 0 1 6.3 17.7"/><path d="M8 12a4 4 0 0 1 6.8-2.8"/><path d="M16 12a4 4 0 0 1-6.8 2.8"/>',
  },
  "Drainage Issue": {
    gradient: "linear-gradient(145deg,#bbf7d0 0%,#22c55e 48%,#15803d 100%)",
    paths:
      '<path d="M4 7h16"/><path d="M6 7v11h12V7"/><path d="M9 11h6"/><path d="M9 15h6"/>',
  },
  "Structural Damage": {
    gradient: "linear-gradient(145deg,#e2e8f0 0%,#64748b 48%,#334155 100%)",
    paths:
      '<path d="M4 20h16"/><path d="M6 20V8l6-4 6 4v12"/><path d="m10 8 2 4-2 2 2 3"/><path d="M14 8h2"/>',
  },
  default: {
    gradient: "linear-gradient(145deg,#93c5fd 0%,#2563eb 55%,#0f172a 100%)",
    paths:
      '<path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>',
  },
};

const hazardSvg = (type) => {
  const webEmojiIcons = {
    Flood: "\u{1F30A}",
    Fire: "\u{1F525}",
    Landslide: "\u{26F0}\u{FE0F}",
    "Fault Line": "\u{26A1}",
    Typhoon: "\u{1F32A}\u{FE0F}",
    "Drainage Issue": "\u{1F6A7}",
    "Structural Damage": "\u{1F3DA}\u{FE0F}",
  };
  return `<span style="font-size:30px;line-height:1;text-shadow:-2px 0 var(--hazard-color),2px 0 var(--hazard-color),0 -2px var(--hazard-color),0 2px var(--hazard-color),0 3px 5px rgba(0,0,0,.35)">${webEmojiIcons[type] || "\u{26A0}\u{FE0F}"}</span>`;

  // eslint-disable-next-line no-unreachable
  const config = hazardLogoConfig[type] || hazardLogoConfig.default;
  return `<div style="width:42px;height:42px;border-radius:15px;border:3px solid #fff;background:${config.gradient};display:flex;align-items:center;justify-content:center;box-shadow:0 10px 22px rgba(13,43,107,.32);"><svg viewBox="0 0 24 24" style="width:25px;height:25px;fill:none;stroke:#fff;stroke-width:2.25;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 2px 3px rgba(0,0,0,.24));">${config.paths}</svg></div>`;

  // eslint-disable-next-line no-unreachable
  const icons = {
    Flood: "🌊",
    Fire: "🔥",
    Landslide: "⛰️",
    "Fault Line": "⚡",
    Typhoon: "🌪️",
    "Drainage Issue": "🚧",
    "Structural Damage": "🏚️",
  };
  return `<span style="font-size:30px;line-height:1;text-shadow:-2px 0 var(--hazard-color),2px 0 var(--hazard-color),0 -2px var(--hazard-color),0 2px var(--hazard-color),0 3px 5px rgba(0,0,0,.35)">${icons[type] || "⚠️"}</span>`;
};

// ========== Hazard icon with severity badge ==========
const getHazardIcon = (type, riskLevel) => {
  const baseColor =
    riskLevel === "high"
      ? "#d32f2f"
      : riskLevel === "moderate"
        ? "#f57c00"
        : "#2e7d32";
  return new L.DivIcon({
    className: "",
    html: `
      <div style="
        width: 42px; height: 42px;
        display: flex; align-items: center; justify-content: center;
        color:white; font: 900 13px system-ui;
        position: relative;
        --hazard-color:${baseColor};
      ">
        ${hazardSvg(type)}
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -21],
  });
};

// ----- Helpers -----
const isValidCoord = (lat, lng) =>
  typeof lat === "number" &&
  typeof lng === "number" &&
  !isNaN(lat) &&
  !isNaN(lng);

// ==================== MODAL: Mitigation Tips (unchanged) ====================
const MitigationTipsModal = ({ isOpen, onClose, type, severity }) => {
  const tips = {
    Flood: {
      high: [
        "Move to higher ground immediately",
        "Turn off the main electrical switch if safe",
        "Move valuables to upper floors",
        "Do not wade through floodwaters",
        "Monitor PAGASA updates",
        "Follow evacuation routes",
        "Contact MDRRMO: (02) 8527-0000",
      ],
      moderate: [
        "Prepare a go bag with essentials",
        "Elevate furniture from the floor",
        "Clear drainage systems",
        "Install flood barriers or sandbags",
        "Download the PAGASA weather app",
        "Know the nearest evacuation center",
      ],
      low: [
        "Keep emergency numbers handy",
        "Maintain clean drainage",
        "Store documents in waterproof containers",
      ],
    },
    Fire: {
      high: [
        "Evacuate the building immediately",
        "Call BFP: 117",
        "Do not use elevators",
      ],
      moderate: [
        "Install smoke detectors",
        "Have the electrical system inspected",
      ],
      low: [
        "Never leave candles unattended",
        "Avoid overloading outlets",
      ],
    },
    Landslide: {
      high: ["Evacuate to a safe area immediately", "Contact local DRRMO"],
      moderate: [
        "Inspect property for ground cracks",
        "Plant deep-rooted vegetation",
      ],
      low: [
        "Maintain vegetation on slopes",
        "Keep drainage systems clear",
      ],
    },
  };
  const hazardTips = tips[type]?.[severity] || [];
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-card max-w-lg w-full p-8 max-h-[80vh] overflow-y-auto"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg">
                <LightBulbIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-navy-900">
                  Mitigation Tips
                </h2>
                <p className="text-navy-500 text-sm">
                  {type} / {severity?.toUpperCase()} Risk
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-red-50"
            >
              <XMarkIcon className="w-6 h-6 text-navy-400" />
            </button>
          </div>
          <div className="space-y-3">
            {hazardTips.map((tip, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start space-x-3 p-3 rounded-xl bg-gradient-to-r from-white/50 to-blue-50/30"
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <p className="text-navy-700 text-sm">{tip}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ==================== MODAL: Add Hazard Zone (with Locate Me) ====================
const AddHazardModal = ({
  isOpen,
  onClose,
  onSubmit,
  mapCenter,
  onFloodPickMode,
  onSinglePointPick,
  waypoints,
  onClearWaypoints,
  onLocateMe,
}) => {
  const [form, setForm] = useState({
    name: "",
    type: "Flood",
    riskLevel: "moderate",
    radius: 100,
    description: "",
  });
  const [routing, setRouting] = useState(false);
  const [useExactWaypoints, setUseExactWaypoints] = useState(true);

  const isLineType = form.type === "Flood" || form.type === "Fault Line";

  useEffect(() => {
    if (!isOpen) return;
    if (!isLineType) setUseExactWaypoints(false);
  }, [isOpen, isLineType]);

  const handlePickOnMap = () => {
    if (isLineType) {
      if (typeof onFloodPickMode === "function") onFloodPickMode();
    } else {
      if (typeof onSinglePointPick === "function") onSinglePointPick();
    }
  };

  const handleClearPoints = () => {
    if (typeof onClearWaypoints === "function") onClearWaypoints();
  };

  const handleLocationFound = (coords) => {
    if (typeof onLocateMe === "function") {
      onLocateMe(coords);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let payload = {
      name: form.name,
      type: form.type,
      riskLevel: form.riskLevel,
      description: form.description,
      coordinates: [],
    };

    if (isLineType && waypoints && waypoints.length >= 2) {
      if (useExactWaypoints) {
        payload.coordinates = waypoints;
        payload.radius = 10;
      } else {
        if (form.type === "Flood") {
          setRouting(true);
          try {
            const res = await api.post("/routing/directions", { waypoints });
            payload.coordinates = res.data.coordinates;
            payload.radius = 10;
          } catch (err) {
            toast.error(
              "Could not fetch street route. Using straight lines instead.",
            );
            payload.coordinates = waypoints;
            payload.radius = 10;
          } finally {
            setRouting(false);
          }
        } else {
          payload.coordinates = waypoints;
          payload.radius = 10;
        }
      }
    } else if (isLineType) {
      payload.coordinates = [{ lat: mapCenter.lat, lng: mapCenter.lng }];
      payload.radius = 10;
    } else {
      payload.coordinates = [{ lat: mapCenter.lat, lng: mapCenter.lng }];
      payload.radius = form.radius;
    }

    onSubmit(payload);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-card max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-navy-900">
              Add Hazard Zone
            </h2>
            <button onClick={onClose}>
              <XMarkIcon className="w-6 h-6 text-navy-400" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-navy-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                className="w-full glass-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy-700 mb-2">
                Type
              </label>
              <select
                className="w-full glass-input"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {[
                  "Flood",
                  "Fire",
                  "Landslide",
                  "Fault Line",
                  "Typhoon",
                  "Drainage Issue",
                  "Structural Damage",
                ].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy-700 mb-2">
                Risk Level
              </label>
              <div className="flex space-x-2">
                {["low", "moderate", "high"].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setForm({ ...form, riskLevel: lvl })}
                    className={`flex-1 py-2 rounded-xl capitalize font-medium text-sm ${form.riskLevel === lvl ? (lvl === "high" ? "bg-red-500 text-white shadow-lg" : lvl === "moderate" ? "bg-orange-500 text-white shadow-lg" : "bg-green-500 text-white shadow-lg") : "bg-white/50 text-navy-600 hover:bg-white/80"}`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {isLineType ? (
              <div className="space-y-2">
                <p className="text-sm text-navy-600">
                  Click "Pick on Map" to place waypoints along the {form.type}{" "}
                  path. At least 2 points required.
                </p>
                {waypoints && waypoints.length > 0 && (
                  <div className="max-h-32 overflow-y-auto bg-white/20 rounded-xl p-3 text-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-navy-700">
                        Waypoints ({waypoints.length})
                      </span>
                      <button
                        type="button"
                        onClick={handleClearPoints}
                        className="text-red-500 text-xs underline"
                      >
                        Clear all
                      </button>
                    </div>
                    {waypoints.map((wp, idx) => (
                      <div key={idx} className="text-navy-600">
                        {idx + 1}. {wp.lat.toFixed(5)}, {wp.lng.toFixed(5)}
                      </div>
                    ))}
                  </div>
                )}
                {form.type === "Flood" && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="exactWaypoints"
                      checked={useExactWaypoints}
                      onChange={(e) => setUseExactWaypoints(e.target.checked)}
                      className="rounded"
                    />
                    <label
                      htmlFor="exactWaypoints"
                      className="text-sm text-navy-700"
                    >
                      Use exact waypoints (straight lines)
                    </label>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-navy-600">
                  Center point: {mapCenter.lat.toFixed(5)},{" "}
                  {mapCenter.lng.toFixed(5)}
                </p>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Radius: {form.radius}m
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="3000"
                    value={form.radius}
                    onChange={(e) =>
                      setForm({ ...form, radius: parseInt(e.target.value) })
                    }
                    className="w-full accent-primary-600"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handlePickOnMap}
                className="flex-1 py-2 rounded-xl bg-primary-100 text-primary-700 font-medium hover:bg-primary-200"
              >Pick on Map</button>
              <LocateMeButton onLocationFound={handleLocationFound} />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Description
              </label>
              <textarea
                className="w-full glass-input"
                rows="3"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <button
              type="submit"
              disabled={
                routing || (isLineType && (!waypoints || waypoints.length < 2))
              }
              className="w-full glass-button-primary py-3 rounded-2xl font-semibold"
            >
              {routing ? "Fetching route..." : "Add Hazard Zone"}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ==================== MODAL: Add Evacuation Center (with Locate Me) ====================
const AddEvacuationModal = ({
  isOpen,
  onClose,
  onSubmit,
  mapClickPos,
  onPickMode,
  onLocateMe,
}) => {
  const [form, setForm] = useState({
    name: "",
    address: "",
    lat: "14.5995",
    lng: "120.9842",
    capacity: 100,
    contactPerson: "",
    contactNumber: "",
  });
  useEffect(() => {
    if (mapClickPos)
      setForm((prev) => ({
        ...prev,
        lat: mapClickPos.lat.toFixed(5),
        lng: mapClickPos.lng.toFixed(5),
      }));
  }, [mapClickPos]);
  const handlePickOnMap = () => {
    if (typeof onPickMode === "function") onPickMode();
  };

  const handleLocationFound = (coords) => {
    setForm((prev) => ({
      ...prev,
      lat: coords.lat.toFixed(5),
      lng: coords.lng.toFixed(5),
    }));
    if (typeof onLocateMe === "function") {
      onLocateMe(coords);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      name: form.name,
      address: form.address,
      location: { lat: parseFloat(form.lat), lng: parseFloat(form.lng) },
      capacity: parseInt(form.capacity),
      contactPerson: form.contactPerson,
      contactNumber: form.contactNumber,
      facilities: [],
      isActive: true,
    });
    onClose();
  };
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-card max-w-lg w-full p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-navy-900">
              Add Evacuation Center
            </h2>
            <button onClick={onClose}>
              <XMarkIcon className="w-6 h-6 text-navy-400" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Name *</label>
              <input
                type="text"
                className="w-full glass-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">
                Address *
              </label>
              <input
                type="text"
                className="w-full glass-input"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Latitude
                </label>
                <input
                  type="text"
                  className="w-full glass-input"
                  value={form.lat}
                  onChange={(e) => setForm({ ...form, lat: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Longitude
                </label>
                <input
                  type="text"
                  className="w-full glass-input"
                  value={form.lng}
                  onChange={(e) => setForm({ ...form, lng: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handlePickOnMap}
                className="flex-1 py-2 rounded-xl bg-primary-100 text-primary-700 font-medium hover:bg-primary-200"
              >Pick on Map</button>
              <LocateMeButton onLocationFound={handleLocationFound} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">
                Capacity
              </label>
              <input
                type="number"
                className="w-full glass-input"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">
                Contact Person
              </label>
              <input
                type="text"
                className="w-full glass-input"
                value={form.contactPerson}
                onChange={(e) =>
                  setForm({ ...form, contactPerson: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">
                Contact Number
              </label>
              <input
                type="text"
                className="w-full glass-input"
                value={form.contactNumber}
                onChange={(e) =>
                  setForm({ ...form, contactNumber: e.target.value })
                }
              />
            </div>
            <button
              type="submit"
              className="w-full glass-button-primary py-3 rounded-2xl font-semibold"
            >
              Add Evacuation Center
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ==================== MAIN COMPONENT ====================
const HazardManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("map");
  const [hazardZones, setHazardZones] = useState([]);
  const [reports, setReports] = useState([]);
  const [evacuationCenters, setEvacuationCenters] = useState([]);
  const [showAddHazard, setShowAddHazard] = useState(false);
  const [showAddEvac, setShowAddEvac] = useState(false);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [tipsType, setTipsType] = useState("Flood");
  const [tipsSeverity, setTipsSeverity] = useState("low");
  const [mapCenter, setMapCenter] = useState({ lat: 14.5995, lng: 120.9842 });
  const [clickedLatLng, setClickedLatLng] = useState(null);
  const [loading, setLoading] = useState(true);

  // MultiÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Ëœpoint pick mode
  const [pickMode, setPickMode] = useState(false);
  const [pickPoints, setPickPoints] = useState([]);
  const [evacPickMode, setEvacPickMode] = useState(false);
  const [hazardCenterPickMode, setHazardCenterPickMode] = useState(false);

  const mapRef = useRef();

  // ---------- VALLEY FAULT SYSTEM (PHIVOLCS data, smooth curving path) ----------
  const westValleyFault = [
    [14.726, 121.096],
    [14.718, 121.094],
    [14.71, 121.091],
    [14.702, 121.089],
    [14.694, 121.086],
    [14.686, 121.083],
    [14.678, 121.081],
    [14.67, 121.078],
    [14.662, 121.075],
    [14.654, 121.073],
    [14.646, 121.07],
    [14.638, 121.067],
    [14.63, 121.064],
    [14.622, 121.06],
    [14.614, 121.057],
    [14.606, 121.053],
    [14.598, 121.049],
    [14.59, 121.045],
    [14.582, 121.041],
    [14.574, 121.037],
    [14.566, 121.033],
    [14.558, 121.029],
    [14.55, 121.025],
    [14.542, 121.021],
    [14.534, 121.017],
    [14.526, 121.013],
    [14.518, 121.008],
    [14.51, 121.004],
    [14.502, 121.0],
    [14.494, 120.996],
    [14.486, 120.992],
    [14.478, 120.988],
    [14.47, 120.984],
    [14.462, 120.98],
    [14.454, 120.976],
    [14.446, 120.972],
    [14.438, 120.968],
    [14.43, 120.963],
    [14.422, 120.959],
    [14.414, 120.954],
    [14.406, 120.95],
    [14.398, 120.945],
    [14.39, 120.941],
    [14.382, 120.936],
    [14.374, 120.932],
    [14.366, 120.927],
    [14.358, 120.923],
    [14.35, 120.918],
    [14.342, 120.914],
    [14.334, 120.909],
    [14.326, 120.904],
    [14.318, 120.899],
    [14.31, 120.894],
    [14.302, 120.889],
    [14.294, 120.885],
    [14.286, 120.88],
    [14.278, 120.875],
    [14.27, 120.87],
    [14.262, 120.864],
    [14.254, 120.858],
    [14.246, 120.852],
    [14.238, 120.846],
    [14.23, 120.84],
    [14.222, 120.834],
    [14.214, 120.828],
    [14.206, 120.822],
    [14.198, 120.816],
    [14.19, 120.81],
    [14.182, 120.804],
    [14.174, 120.798],
    [14.166, 120.792],
    [14.158, 120.785],
  ];
  const eastValleyFault = [
    [14.78, 121.12],
    [14.77, 121.118],
    [14.76, 121.115],
    [14.75, 121.112],
    [14.74, 121.11],
    [14.73, 121.107],
    [14.72, 121.104],
    [14.71, 121.101],
    [14.7, 121.098],
    [14.69, 121.095],
    [14.68, 121.092],
    [14.67, 121.089],
    [14.66, 121.086],
    [14.65, 121.083],
    [14.64, 121.08],
    [14.63, 121.077],
    [14.62, 121.074],
    [14.61, 121.071],
    [14.6, 121.068],
    [14.59, 121.065],
    [14.58, 121.062],
    [14.57, 121.059],
    [14.56, 121.056],
    [14.55, 121.053],
    [14.54, 121.05],
    [14.53, 121.047],
    [14.52, 121.044],
    [14.51, 121.041],
  ];

  const fetchData = useCallback(async () => {
    try {
      const reportsUrl =
        user?.role === "resident" ? "/reports/validated" : "/reports";
      const [h, r, e] = await Promise.all([
        api.get("/hazards"),
        api.get(reportsUrl),
        api.get("/evacuation"),
      ]);
      setHazardZones(Array.isArray(h.data.data) ? h.data.data : []);
      setReports(Array.isArray(r.data.data) ? r.data.data : []);
      setEvacuationCenters(Array.isArray(e.data.data) ? e.data.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    fetchData();
    const socket = io(
      process.env.REACT_APP_SOCKET_URL || "http://localhost:5000",
    );
    socket.on("new_report", fetchData);
    socket.on("report_validated", fetchData);
    socket.on("report_deleted", fetchData);
    socket.on("new_hazard_zone", fetchData);
    socket.on("hazard_zone_deleted", fetchData);
    socket.on("new_evacuation", fetchData);
    socket.on("evacuation_deleted", fetchData);
    return () => socket.disconnect();
  }, [fetchData]);

  // Zoom to item selected from search (Navbar)
  useEffect(() => {
    const selected = localStorage.getItem("selectedMapItem");
    if (selected) {
      try {
        const item = JSON.parse(selected);
        if (item.coords && mapRef.current) {
          mapRef.current.flyTo([item.coords.lat, item.coords.lng], 16);
        }
      } catch (e) {}
      localStorage.removeItem("selectedMapItem");
    }
  }, []);

  // Handler for Locate Me ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ update mapCenter and fly to
  const handleLocateMe = (coords) => {
    setMapCenter(coords);
    if (mapRef.current) {
      mapRef.current.flyTo([coords.lat, coords.lng], 16);
    }
  };

  const handleAddHazard = async (data) => {
    try {
      await api.post("/hazards", data);
      fetchData();
    } catch (err) {
      toast.error("Failed to add hazard zone. Is the backend running?");
      console.error(err);
    }
  };
  const handleAddEvacuation = async (data) => {
    try {
      await api.post("/evacuation", data);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };
  const handleDeleteHazard = async (id) => {
    if (window.confirm("Are you sure you want to delete this hazard zone?")) {
      try {
        await api.delete(`/hazards/${id}`);
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };
  const handleDeleteEvacuation = async (id) => {
    if (
      window.confirm("Are you sure you want to delete this evacuation center?")
    ) {
      try {
        await api.delete(`/evacuation/${id}`);
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };
  const handleDeleteReport = async (id) => {
    if (window.confirm("Are you sure you want to delete this report?")) {
      try {
        await api.delete(`/reports/${id}`);
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const safeReports = reports.filter((r) =>
    isValidCoord(r.location?.lat, r.location?.lng),
  );
  const safeMapReports = safeReports.filter((r) => r.status === "validated");
  const activeListReports = safeReports.filter(
    (r) => !["validated", "rejected", "on_hold"].includes(r.status),
  );
  const safeHazardZones = hazardZones.filter(
    (z) =>
      z.coordinates?.length > 0 &&
      isValidCoord(z.coordinates[0]?.lat, z.coordinates[0]?.lng),
  );
  const safeEvacCenters = evacuationCenters.filter((c) =>
    isValidCoord(c.location?.lat, c.location?.lng),
  );

  const openTips = (type, severity) => {
    setTipsType(type);
    setTipsSeverity(severity);
    setShowTipsModal(true);
  };
  const clearWaypoints = () => setPickPoints([]);

  // Map click handler ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ for multiÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Ëœpoint pick mode
  const MapClickHandler = () => {
    const map = useMapEvents({
      click(e) {
        setMapCenter({ lat: e.latlng.lat, lng: e.latlng.lng });
        setClickedLatLng(e.latlng);

        if (pickMode) {
          setPickPoints((prev) => [
            ...prev,
            { lat: e.latlng.lat, lng: e.latlng.lng },
          ]);
        }

        if (evacPickMode) {
          setEvacPickMode(false);
          setShowAddEvac(true);
        }

        if (hazardCenterPickMode) {
          setHazardCenterPickMode(false);
          setShowAddHazard(true);
        }

        if (!pickMode && !evacPickMode && !hazardCenterPickMode) {
          map.setView([14.5995, 120.9842], 13, { animate: true });
        }
      },
    });
    return null;
  };

  if (loading)
    return (
      <div className="flex">
        <Sidebar />
        <div className="app-main">
          <Navbar />
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );

  return (
    <div className="flex">
      <Sidebar />
      <div className="app-main">
        <Navbar />
        <div className="p-8 space-y-6">
          {pickMode && (
            <div className="glass-card p-4 bg-blue-50 text-blue-800 font-medium flex items-center justify-between">
              <span>Click on the map to add waypoints ({pickPoints.length}{" "}
                points).
                {pickPoints.length >= 2 && " Click 'Finish' when done."}
              </span>
              {pickPoints.length >= 2 && (
                <button
                  onClick={() => {
                    setPickMode(false);
                    setShowAddHazard(true);
                  }}
                  className="ml-4 px-4 py-2 bg-primary-600 text-white rounded-xl font-semibold"
                >Finish</button>
              )}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold gradient-text">
                Hazard Management
              </h1>
            </div>
            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddEvac(true)}
                className="glass-button-primary px-4 py-2 rounded-2xl font-semibold flex items-center space-x-2"
              >
                <BuildingOffice2Icon className="w-5 h-5" />
                <span>Add Evacuation</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddHazard(true)}
                className="glass-button-primary px-4 py-2 rounded-2xl font-semibold flex items-center space-x-2"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Add Hazard</span>
              </motion.button>
            </div>
          </motion.div>

          <div className="flex space-x-1 p-1 bg-white/30 backdrop-blur-xl rounded-2xl w-fit">
            {[
              { id: "map", icon: MapPinIcon, label: "Live Map" },
              {
                id: "reports",
                icon: ExclamationTriangleIcon,
                label: "Reports",
              },
              { id: "zones", icon: MapPinIcon, label: "Hazard Zones" },
              {
                id: "evacuation",
                icon: BuildingOffice2Icon,
                label: "Evacuation",
              },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === "map" && mapRef.current?.setView) {
                      mapRef.current.setView([14.5995, 120.9842], 13);
                    }
                  }}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${activeTab === tab.id ? "bg-white shadow-lg text-primary-700" : "text-navy-500 hover:text-navy-700"}`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {activeTab === "map" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-2 h-[700px] relative overflow-hidden"
            >
              <MapContainer
                ref={mapRef}
                center={[14.5995, 120.9842]}
                zoom={13}
                minZoom={13}
                maxBounds={[
                  [14.55, 120.94],
                  [14.64, 121.03],
                ]}
                maxBoundsViscosity={1.0}
                style={{ height: "100%", width: "100%", borderRadius: "18px" }}
                className="custom-popup"
                whenReady={(mapInstance) => {
                  mapRef.current = mapInstance;
                }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap"
                />
                <MapClickHandler />

                {pickPoints.map((p, i) => (
                  <CircleMarker
                    key={i}
                    center={[p.lat, p.lng]}
                    radius={6}
                    pathOptions={{
                      fillColor: "#0d47a1",
                      fillOpacity: 0.9,
                      color: "#ffffff",
                      weight: 2,
                    }}
                  />
                ))}

                {/* Flood Reports ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ line or circle */}
                {safeMapReports.map((r) => {
                    const center = [r.location.lat, r.location.lng];
                    const icon = getHazardIcon(r.type, r.severity);
                    const hasValidLine =
                      isValidCoord(
                        r.startLocation?.lat,
                        r.startLocation?.lng,
                      ) && isValidCoord(r.endLocation?.lat, r.endLocation?.lng);
                    const routePositions = (r.routeCoordinates || [])
                      .filter((point) => isValidCoord(point?.lat, point?.lng))
                      .map((point) => [point.lat, point.lng]);
                    const isLineReport = hasValidLine && (r.type === "Flood" || r.type === "Fault Line");
                    const linePositions =
                      routePositions.length >= 2
                        ? routePositions
                        : [
                            [r.startLocation?.lat, r.startLocation?.lng],
                            [r.endLocation?.lat, r.endLocation?.lng],
                          ];
                    const style =
                      r.type === "Flood"
                        ? getFloodStyle(r.severity)
                        : getHazardStyle(r.type, r.severity);
                    return (
                      <React.Fragment key={r._id}>
                        {isLineReport ? (
                          <Polyline
                            positions={linePositions}
                            pathOptions={style}
                          />
                        ) : (
                          <Circle
                            center={center}
                            radius={
                              r.type === "Flood"
                                ? r.severity === "high"
                                  ? 50
                                  : r.severity === "moderate"
                                    ? 35
                                    : 20
                                : r.severity === "high"
                                  ? 120
                                  : r.severity === "moderate"
                                    ? 80
                                    : 45
                            }
                            pathOptions={{
                              color: style.color,
                              weight: 2,
                              fillColor: style.fillColor || style.color,
                              fillOpacity: style.fillOpacity || 0.2,
                            }}
                          />
                        )}
                        <Marker
                          position={
                            isLineReport
                              ? [r.startLocation.lat, r.startLocation.lng]
                              : center
                          }
                          icon={icon}
                        >
                          <Popup>
                            <div className="p-3 max-w-[260px]">
                              <div className="text-xl font-black text-navy-900 leading-tight">
                                {r.type} Report
                              </div>
                              <p className="text-sm text-navy-600 mt-2 leading-5">
                                {r.description}
                              </p>
                              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                                <span
                                  className={`px-3 py-1 rounded-full font-black ${r.severity === "high" ? "bg-red-100 text-red-700" : r.severity === "moderate" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}
                                >
                                  {r.severity.toUpperCase()} RISK
                                </span>
                                <span className="text-navy-500">
                                  {r.barangay}
                                </span>
                              </div>
                              <button
                                onClick={() => openTips(r.type, r.severity)}
                                className="mt-3 w-full rounded-xl bg-primary-50 px-3 py-2 text-sm font-bold text-primary-700 hover:bg-primary-100"
                              >
                                View mitigation tips
                              </button>
                              <button
                                onClick={() => handleDeleteReport(r._id)}
                                className="mt-2 flex items-center space-x-1 text-red-600 hover:text-red-800 text-sm"
                              >
                                <TrashIcon className="w-4 h-4" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </Popup>
                        </Marker>
                      </React.Fragment>
                    );
                  })}

                {/* Hazard Zones ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ line rendering for multiÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Ëœpoint types */}
                {safeHazardZones.map((z) => {
                  const center = [z.coordinates[0].lat, z.coordinates[0].lng];
                  const icon = getHazardIcon(z.type, z.riskLevel);
                  const isMultiPoint = z.coordinates.length >= 2;

                  if (isMultiPoint) {
                    const lineStyle =
                      z.type === "Flood"
                        ? getFloodStyle(z.riskLevel)
                        : getLineStyle(z.type, z.riskLevel);
                    const positions = z.coordinates.map((c) => [c.lat, c.lng]);
                    const markerPos = [
                      z.coordinates[0].lat,
                      z.coordinates[0].lng,
                    ];
                    return (
                      <React.Fragment key={z._id}>
                        <Polyline
                          positions={positions}
                          pathOptions={lineStyle}
                        />
                        <Marker position={markerPos} icon={icon}>
                          <Popup>
                            <div className="p-3 max-w-[260px]">
                              <div className="text-xl font-black text-navy-900 leading-tight">
                                {z.name}
                              </div>
                              <p className="text-sm text-navy-600 mt-2 leading-5">
                                {z.description}
                              </p>
                              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                                <span
                                  className={`px-3 py-1 rounded-full font-black ${z.riskLevel === "high" ? "bg-red-100 text-red-700" : z.riskLevel === "moderate" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}
                                >
                                  {z.riskLevel.toUpperCase()} RISK
                                </span>
                                <span className="text-navy-500">
                                  {z.type}
                                </span>
                              </div>
                              <button
                                onClick={() => openTips(z.type, z.riskLevel)}
                                className="mt-3 w-full rounded-xl bg-primary-50 px-3 py-2 text-sm font-bold text-primary-700 hover:bg-primary-100"
                              >
                                View mitigation tips
                              </button>
                              <button
                                onClick={() => handleDeleteHazard(z._id)}
                                className="mt-2 flex items-center space-x-1 text-red-600 hover:text-red-800 text-sm"
                              >
                                <TrashIcon className="w-4 h-4" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </Popup>
                        </Marker>
                      </React.Fragment>
                    );
                  }

                  // Single point ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ circle
                  const style = getHazardStyle(z.type, z.riskLevel);
                  return (
                    <React.Fragment key={z._id}>
                      <Circle
                        center={center}
                        radius={z.radius || 100}
                        pathOptions={style}
                      />
                      <Marker position={center} icon={icon}>
                        <Popup>
                          <div className="p-3 max-w-[260px]">
                            <div className="text-xl font-black text-navy-900 leading-tight">
                              {z.name}
                            </div>
                            <p className="text-sm text-navy-600 mt-2 leading-5">
                              {z.description}
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                              <span
                                className={`px-3 py-1 rounded-full font-black ${z.riskLevel === "high" ? "bg-red-100 text-red-700" : z.riskLevel === "moderate" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}
                              >
                                {z.riskLevel.toUpperCase()} RISK
                              </span>
                              <span className="text-navy-500">
                                {z.type}
                              </span>
                            </div>
                            <button
                              onClick={() => openTips(z.type, z.riskLevel)}
                              className="mt-3 w-full rounded-xl bg-primary-50 px-3 py-2 text-sm font-bold text-primary-700 hover:bg-primary-100"
                            >
                              View mitigation tips
                            </button>
                            <button
                              onClick={() => handleDeleteHazard(z._id)}
                              className="mt-2 flex items-center space-x-1 text-red-600 hover:text-red-800 text-sm"
                            >
                              <TrashIcon className="w-4 h-4" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    </React.Fragment>
                  );
                })}

                {/* ---------- VALLEY FAULT LINES (premium doubleÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Ëœline, solid red, smooth curving) ---------- */}
                <Polyline
                  positions={westValleyFault}
                  pathOptions={{ color: "#ffffff", weight: 8, opacity: 0.8 }}
                />
                <Polyline
                  positions={westValleyFault}
                  pathOptions={{ color: "#d32f2f", weight: 5, opacity: 0.9 }}
                />
                <Polyline
                  positions={eastValleyFault}
                  pathOptions={{ color: "#ffffff", weight: 8, opacity: 0.8 }}
                />
                <Polyline
                  positions={eastValleyFault}
                  pathOptions={{ color: "#d32f2f", weight: 5, opacity: 0.9 }}
                />

                {safeEvacCenters.map((c) => (
                  <Marker
                    key={c._id}
                    position={[c.location.lat, c.location.lng]}
                    icon={evacuationIcon}
                  >
                    <Popup>
                      <div className="p-2 max-w-[200px]">
                        <div className="font-bold text-navy-900">Evacuation Center: {c.name}</div>
                        <p className="text-sm text-navy-600">{c.address}</p>
                        <div className="mt-2 text-xs">
                          <p>
                            <strong>Capacity:</strong> {c.capacity} persons
                          </p>
                          <p>
                            <strong>Contact:</strong> {c.contactPerson || "N/A"}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteEvacuation(c._id)}
                          className="mt-2 flex items-center space-x-1 text-red-600 hover:text-red-800 text-sm"
                        >
                          <TrashIcon className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>

              <div className="absolute left-4 bottom-4 glass-card px-4 py-3 z-[1000] max-w-[calc(100%-2rem)]">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-navy-700">
                  <span className="font-semibold text-navy-900">Map key</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-600"></span>High</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500"></span>Moderate</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-700"></span>Low</span>
                  <span className="flex items-center gap-1"><span className="w-5 h-0.5 bg-red-600"></span>Fault</span>
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-4 rounded bg-emerald-500 flex items-center justify-center text-white">
                      <BuildingOffice2Icon className="w-3 h-3" />
                    </span>
                    Evacuation
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Reports Tab (unchanged) */}
          {activeTab === "reports" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {activeListReports.map((r, i) => (
                <motion.div
                  key={r._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <HazardIconBadge type={r.type} size="md" />
                      <div>
                        <h3 className="font-semibold text-navy-900">
                          {r.type}
                        </h3>
                        <p className="text-sm text-navy-600">{r.description}</p>
                        <div className="flex items-center space-x-2 mt-2 text-xs">
                          <span
                            className={`px-2 py-1 rounded-full ${r.severity === "high" ? "bg-red-100 text-red-700" : r.severity === "moderate" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}
                          >
                            {r.severity}
                          </span>
                          <span>{r.barangay}</span>
                          <span>
                            {new Date(r.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteReport(r._id)}
                      className="p-2 rounded-xl hover:bg-red-50"
                    >
                      <TrashIcon className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Hazard Zones Tab (unchanged) */}
          {activeTab === "zones" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {safeHazardZones.map((z, i) => (
                <motion.div
                  key={z._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-navy-900">{z.name}</h3>
                      <p className="text-sm text-navy-500">{z.type}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${z.riskLevel === "high" ? "bg-red-100 text-red-700" : z.riskLevel === "moderate" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}
                    >
                      {z.riskLevel.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-navy-600 mb-4">{z.description}</p>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => openTips(z.type, z.riskLevel)}
                      className="text-primary-600 font-medium mr-3"
                    >Tips</button>
                    <button
                      onClick={() => handleDeleteHazard(z._id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Evacuation Tab (unchanged) */}
          {activeTab === "evacuation" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {safeEvacCenters.map((c, i) => (
                <motion.div
                  key={c._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-6"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600">
                      <BuildingOffice2Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-navy-900">{c.name}</h3>
                      <p className="text-sm text-navy-500">{c.address}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-navy-500">Capacity:</span>
                      <span className="font-semibold text-navy-800">
                        {c.capacity} persons
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteEvacuation(c._id)}
                    className="mt-3 text-red-500 hover:text-red-700"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      <AddHazardModal
        isOpen={showAddHazard}
        onClose={() => {
          setShowAddHazard(false);
          setPickMode(false);
          setPickPoints([]);
          setHazardCenterPickMode(false);
        }}
        onSubmit={handleAddHazard}
        mapCenter={mapCenter}
        onFloodPickMode={() => {
          setPickMode(true);
          setPickPoints([]);
          setShowAddHazard(false);
        }}
        onSinglePointPick={() => {
          setHazardCenterPickMode(true);
          setShowAddHazard(false);
        }}
        waypoints={pickPoints}
        onClearWaypoints={clearWaypoints}
        onLocateMe={handleLocateMe}
      />
      <AddEvacuationModal
        isOpen={showAddEvac}
        onClose={() => {
          setShowAddEvac(false);
          setEvacPickMode(false);
        }}
        onSubmit={handleAddEvacuation}
        mapClickPos={clickedLatLng}
        onPickMode={() => {
          setEvacPickMode(true);
          setShowAddEvac(false);
        }}
        onLocateMe={handleLocateMe}
      />
      <MitigationTipsModal
        isOpen={showTipsModal}
        onClose={() => setShowTipsModal(false)}
        type={tipsType}
        severity={tipsSeverity}
      />
    </div>
  );
};

export default HazardManagement;
