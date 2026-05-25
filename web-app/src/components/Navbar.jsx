import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  BellIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { io } from "socket.io-client";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // ---------- Search state ----------
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);

  // ---------- Notification state ----------
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifyRef = useRef(null);
  const alertedEmergencyIds = useRef(new Set());

  // ---------- Profile dropdown ----------
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef(null);

  // ----- Fetch all data for searching (reports, hazard zones, evacuation centers) -----
  const searchAll = async (term) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const [reportsRes, hazardsRes, evacRes] = await Promise.all([
        api.get("/reports"),
        api.get("/hazards"),
        api.get("/evacuation"),
      ]);
      const reports = reportsRes.data.data || [];
      const hazards = hazardsRes.data.data || [];
      const evacs = evacRes.data.data || [];

      const results = [];

      reports.forEach((r) => {
        if (
          r.type.toLowerCase().includes(term.toLowerCase()) ||
          (r.description &&
            r.description.toLowerCase().includes(term.toLowerCase())) ||
          r.barangay.toLowerCase().includes(term.toLowerCase())
        ) {
          results.push({
            id: r._id,
            type: "Report",
            label: `${r.type}: ${r.description || r.barangay}`,
            coords: r.location,
            subtype: r.type,
            severity: r.severity,
          });
        }
      });

      hazards.forEach((z) => {
        if (
          z.name.toLowerCase().includes(term.toLowerCase()) ||
          (z.description &&
            z.description.toLowerCase().includes(term.toLowerCase()))
        ) {
          results.push({
            id: z._id,
            type: "Hazard Zone",
            label: z.name,
            coords: z.coordinates[0],
            subtype: z.type,
            severity: z.riskLevel,
          });
        }
      });

      evacs.forEach((c) => {
        if (
          c.name.toLowerCase().includes(term.toLowerCase()) ||
          (c.address && c.address.toLowerCase().includes(term.toLowerCase()))
        ) {
          results.push({
            id: c._id,
            type: "Evacuation Center",
            label: c.name,
            coords: c.location,
            subtype: "evacuation",
          });
        }
      });

      setSearchResults(results.slice(0, 10));
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  // Debounce search input
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      searchAll(searchTerm);
      if (searchTerm.length >= 2) setShowSearchResults(true);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  // ----- Socket listener for notifications -----
  useEffect(() => {
    const socket = io(
      process.env.REACT_APP_SOCKET_URL || "http://localhost:5000",
    );

    const addNotification = (action, details, meta = {}) => {
      setNotifications((prev) => [
        {
          id: Date.now(),
          action,
          details,
          time: new Date().toLocaleTimeString(),
          ...meta,
        },
        ...prev.slice(0, 19), // keep last 20
      ]);
    };

    const addEmergencyNotification = (report) => {
      const id = report.reportId || report._id;
      if (!id || alertedEmergencyIds.current.has(id)) return;
      alertedEmergencyIds.current.add(id);

      const coords = report.location?.lat && report.location?.lng
        ? ` (${Number(report.location.lat).toFixed(5)}, ${Number(report.location.lng).toFixed(5)})`
        : "";
      addNotification(
        "Emergency Ping",
        `${report.type} ping from ${report.reporter?.name || report.userId?.name || "resident"}${coords}`,
        {
          reportId: id,
          location: report.location,
          barangay: report.barangay,
          assignedOfficial: report.assignedOfficial || null,
          isEmergency: true,
        },
      );
    };

    const checkActiveEmergencyPings = async () => {
      try {
        const res = await api.get("/reports");
        const activePings = (res.data.data || []).filter(
          (report) =>
            report.isEmergency &&
            !["validated", "rejected"].includes(report.status),
        );
        activePings.forEach(addEmergencyNotification);
      } catch (err) {
        console.error("Emergency ping check failed:", err);
      }
    };

    socket.on("new_report", (data) => {
      if (data.isEmergency) {
        addEmergencyNotification(data);
        return;
      }
      addNotification("New Report", `${data.type} reported in ${data.barangay}`);
    });
    socket.on("urgent_report", (data) => {
      if (!data.isEmergency) return;
      addEmergencyNotification(data);
    });
    socket.on("report_validated", (data) => {
      addNotification("Report Validated", `${data.type} report was validated`);
    });
    socket.on("new_hazard_zone", (data) => {
      addNotification("New Hazard Zone", data.name || "A new zone was added");
    });
    socket.on("new_evacuation", (data) => {
      addNotification(
        "New Evacuation Center",
        data.name || "A new center was added",
      );
    });

    checkActiveEmergencyPings();
    const interval = setInterval(checkActiveEmergencyPings, 12000);

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  // ----- Close dropdowns on outside click -----
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
      if (notifyRef.current && !notifyRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ----- Navigate to map with selected item -----
  const goToItem = (item) => {
    if (item.coords) {
      // Store selected item in localStorage for HazardManagement to read
      localStorage.setItem("selectedMapItem", JSON.stringify(item));
      navigate("/hazards");
    }
    setShowSearchResults(false);
    setSearchTerm("");
  };

  const goToNotification = (notification) => {
    setShowNotifications(false);
    if (notification.action === "Emergency Ping" && notification.reportId) {
      localStorage.setItem("selectedEmergencyReport", JSON.stringify(notification));
      navigate(`/reports?focus=${notification.reportId}&emergency=1`);
    }
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  };

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-xl bg-white/30 border-b border-white/20">
      <div className="px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Greeting & Location */}
          <div>
            <motion.h2
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold gradient-text"
            >
              {getGreeting()}, {user?.name?.split(" ")[0]}
            </motion.h2>
            <div className="flex items-center mt-1 space-x-2">
              <MapPinIcon className="w-4 h-4 text-navy-400" />
              <span className="text-sm text-navy-500 capitalize">
                {user?.barangay || "Manila"}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700 capitalize">
                {user?.role?.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Right: Search + Notifications + Profile */}
          <div className="flex items-center space-x-4">
            {/* ----- SEARCH BAR (functional) ----- */}
            <div ref={searchRef} className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
              <input
                type="text"
                placeholder="Search hazards, reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowSearchResults(true);
                }}
                className="pl-10 pr-4 py-2.5 rounded-2xl glass-input text-sm w-64 focus:w-80 transition-all duration-300"
              />
              {/* Search Results Dropdown */}
              <AnimatePresence>
                {showSearchResults && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute top-full mt-2 right-0 w-80 glass-card p-2 max-h-64 overflow-y-auto z-50"
                  >
                    {searchResults.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => goToItem(item)}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/50 transition-colors flex items-center space-x-3"
                      >
                        <span>
                          {item.type === "Report"
                            ? "📋"
                            : item.type === "Hazard Zone"
                              ? "⚠️"
                              : "🏥"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-navy-700 truncate">
                            {item.label}
                          </p>
                          <p className="text-xs text-navy-400">
                            {item.type} {item.subtype && `· ${item.subtype}`}
                          </p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              {showSearchResults &&
                searchTerm.length >= 2 &&
                searchResults.length === 0 && (
                  <div className="absolute top-full mt-2 right-0 w-80 glass-card p-4 text-center text-sm text-navy-500 z-50">
                    No results found
                  </div>
                )}
            </div>

            {/* ----- NOTIFICATIONS (functional) ----- */}
            <div ref={notifyRef} className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 rounded-2xl glass-card"
              >
                <BellIcon className="w-5 h-5 text-navy-600" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                    {notifications.length > 9 ? "9+" : notifications.length}
                  </span>
                )}
              </motion.button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute top-full mt-2 right-0 w-72 glass-card p-2 max-h-80 overflow-y-auto z-50"
                  >
                    <p className="text-sm font-semibold text-navy-700 px-3 py-2 border-b border-white/20">
                      Notifications
                    </p>
                    {notifications.length === 0 ? (
                      <p className="text-xs text-navy-500 p-3 text-center">
                        No recent notifications
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/50 transition-colors cursor-pointer"
                          onClick={() => goToNotification(n)}
                        >
                          <p className="text-sm font-medium text-navy-700">
                            {n.action}
                          </p>
                          <p className="text-xs text-navy-500">{n.details}</p>
                          {n.assignedOfficial?.name && (
                            <p className="text-xs font-semibold text-blue-700">
                              Assigned: {n.assignedOfficial.name}
                            </p>
                          )}
                          <p className="text-xs text-navy-400 mt-1">{n.time}</p>
                        </button>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ----- PROFILE AVATAR (functional) ----- */}
            <div ref={profileRef} className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => setShowProfile(!showProfile)}
                className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-400 to-navy-700 flex items-center justify-center shadow-lg shadow-primary-500/20"
              >
                <span className="text-white font-bold text-sm">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </span>
              </motion.button>

              {/* Profile Dropdown */}
              <AnimatePresence>
                {showProfile && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute top-full mt-2 right-0 w-56 glass-card p-3 z-50"
                  >
                    <div className="flex items-center space-x-3 mb-3 pb-3 border-b border-white/20">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-400 to-navy-700 flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-sm">
                          {user?.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-navy-900 truncate">
                          {user?.name}
                        </p>
                        <p className="text-xs text-navy-500">{user?.email}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          setShowProfile(false);
                          navigate("/profile");
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-white/50 text-sm text-navy-700"
                      >
                        <UserCircleIcon className="w-5 h-5" />
                        <span>Profile</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowProfile(false);
                          logout();
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-red-50 text-sm text-red-600"
                      >
                        <ArrowRightOnRectangleIcon className="w-5 h-5" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
