import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import HazardIconBadge from "../components/HazardIconBadge";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { io } from "socket.io-client";
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const Reports = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const focusedReportId = searchParams.get("focus");
  const focusedReportRef = useRef(null);

  useEffect(() => {
    fetchReports();

    const interval = setInterval(fetchReports, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const socket = io(process.env.REACT_APP_SOCKET_URL || "http://localhost:5000");

    socket.on("urgent_report", (data) => {
      if (data.isEmergency) {
        toast.error(
          `Emergency ping: ${data.type} in ${data.barangay || "Manila"}`,
          { duration: 8000 },
        );
      }
      fetchReports();
    });

    socket.on("new_report", fetchReports);

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (!focusedReportId || loading) return;
    const timeout = setTimeout(() => {
      focusedReportRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 120);
    return () => clearTimeout(timeout);
  }, [focusedReportId, loading, reports]);

  const fetchReports = async () => {
    try {
      const res = await api.get("/reports");
      setReports(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (reportId) => {
    try {
      await api.patch(`/reports/${reportId}/status`, {
        status:
          user.role === "admin" || user.role === "superadmin"
            ? "validated"
            : "barangay_validated",
      });
      fetchReports();
      toast.success(
        user.role === "admin" || user.role === "superadmin"
          ? "Report approved"
          : "Official validation recorded",
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Validation failed");
    }
  };

  const handleReject = async (reportId) => {
    try {
      await api.patch(`/reports/${reportId}/status`, { status: "rejected" });
      fetchReports();
      toast.success("Report rejected");
    } catch (err) {
      toast.error(err.response?.data?.message || "Rejection failed");
    }
  };

  const filtered = reports.filter((r) => {
    if (filterType !== "all" && r.type !== filterType) return false;
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (
      searchTerm &&
      !r.type.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !r.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;
    return true;
  });

  const emergencyReports = reports.filter(
    (r) => r.isEmergency && !["validated", "rejected"].includes(r.status),
  );

  const sortedFiltered = [...filtered].sort((a, b) => {
    if (a.isEmergency !== b.isEmergency) return a.isEmergency ? -1 : 1;
    return new Date(b.emergencyPingedAt || b.createdAt) - new Date(a.emergencyPingedAt || a.createdAt);
  });

  const formatCoords = (location) => {
    if (!location?.lat || !location?.lng) return "No coordinates";
    return `${Number(location.lat).toFixed(5)}, ${Number(location.lng).toFixed(5)}`;
  };

  const formatAssignedOfficial = (report) => {
    const official = report.assignedOfficial;
    if (!official?.name) return "No active barangay official assigned yet";
    const area = official.barangayAssigned || official.barangay || report.assignedArea || report.barangay;
    return `${official.name}${area ? ` (${area})` : ""}`;
  };

  const openMaps = (location) => {
    if (!location?.lat || !location?.lng) return;
    window.open(`https://www.google.com/maps?q=${location.lat},${location.lng}`, "_blank", "noopener,noreferrer");
  };

  if (loading)
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 ml-64">
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
      <div className="flex-1 ml-64">
        <Navbar />
        <div className="p-8 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold gradient-text">
              Reports Management
            </h1>
            <p className="text-navy-500 mt-1">
              Validate and manage hazard reports
            </p>
          </motion.div>

          {emergencyReports.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-red-200 bg-red-50/90 p-5 shadow-xl shadow-red-200/40"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-600 text-white animate-pulse">
                    <ExclamationTriangleIcon className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-red-800">
                      Emergency Ping Active
                    </h2>
                    <p className="text-sm font-semibold text-red-700">
                      A resident sent a high-priority ping. Confirm location and respond immediately.
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-red-600 px-4 py-2 text-sm font-black text-white">
                  {emergencyReports.length} active
                </span>
              </div>
              <div className="mt-4 grid gap-3">
                {emergencyReports.slice(0, 3).map((report) => (
                  <div
                    key={report._id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/85 p-4"
                  >
                    <div>
                      <p className="font-black text-navy-900">
                        {report.type} ping from {report.userId?.name || "resident"}
                      </p>
                      <p className="text-sm text-navy-600">
                        {report.barangay} • {formatCoords(report.location)} •{" "}
                        {new Date(report.emergencyPingedAt || report.createdAt).toLocaleString()}
                      </p>
                      <p className="text-sm font-bold text-blue-700">
                        Assigned: {formatAssignedOfficial(report)}
                      </p>
                    </div>
                    <button
                      onClick={() => openMaps(report.location)}
                      className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white"
                    >
                      <MapPinIcon className="h-4 w-4" />
                      Open location
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 glass-input"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="glass-input py-3"
            >
              <option value="all">All Types</option>
              {[
                "Flood",
                "Fire",
                "Landslide",
                "Typhoon",
                "Drainage Issue",
                "Structural Damage",
                "Fault Line",
              ].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="glass-input py-3"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="barangay_validated">Barangay Validated</option>
              <option value="validated">Validated</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Reports List */}
          <div className="space-y-3">
            {sortedFiltered.map((r, i) => {
              const isOfficialReport = r.reportedByRole === "barangay_official";
              const validationsCount = r.validatedBy?.length || 0;
              const needed = r.requiredValidations || 1;
              const urgent = r.isEmergency || r.severity === "high";
              const progressText = isOfficialReport
                ? `Validation progress: ${validationsCount}/${needed}`
                : `Official validation: ${validationsCount}/${needed}`;

              const canValidate =
                user.role === "barangay_official" &&
                r.status === "pending" &&
                r.reportedBy !== user._id &&
                !r.validatedBy?.some((validator) => {
                  const id = validator?._id || validator;
                  return id === user._id;
                });

              return (
                <motion.div
                  key={r._id}
                  ref={r._id === focusedReportId ? focusedReportRef : null}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`glass-card p-6 ${
                    r.isEmergency ? "border-2 border-red-300 shadow-red-200/60" : ""
                  } ${r._id === focusedReportId ? "ring-4 ring-red-300/70" : ""}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <HazardIconBadge type={r.type} size="md" />
                      <div>
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-navy-900">
                            {r.type}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              r.severity === "high"
                                ? "bg-red-100 text-red-700"
                                : r.severity === "moderate"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-green-100 text-green-700"
                            }`}
                          >
                            {r.severity?.toUpperCase()}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              r.status === "validated"
                                ? "bg-green-100 text-green-700"
                                : r.status === "pending" ||
                                    r.status === "barangay_official_1"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : r.status === "barangay_validated"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-red-100 text-red-700"
                            }`}
                          >
                            {r.status?.replace("_", " ").toUpperCase()}
                          </span>
                          {isOfficialReport && (
                            <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                              Official Report
                            </span>
                          )}
                          {urgent && (
                            <span className="px-3 py-1 rounded-full text-xs bg-red-600 text-white animate-pulse">
                              {r.isEmergency ? "EMERGENCY PING" : "URGENT"}
                            </span>
                          )}
                        </div>

                        <p className="text-navy-600 mt-2">{r.description}</p>

                        {r.isEmergency && (
                          <div className="mt-3 rounded-2xl border border-red-100 bg-red-50 p-3">
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                              <span className="font-black text-red-700">
                                Resident location:
                              </span>
                              <span className="font-semibold text-navy-800">
                                {formatCoords(r.location)}
                              </span>
                              <button
                                onClick={() => openMaps(r.location)}
                                className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 font-bold text-red-700 shadow-sm"
                              >
                                Open map
                                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                              </button>
                            </div>
                            <p className="mt-1 text-xs font-medium text-red-700">
                              Pinged at {new Date(r.emergencyPingedAt || r.createdAt).toLocaleString()}
                            </p>
                            <p className="mt-1 text-xs font-black text-blue-700">
                              Assigned official: {formatAssignedOfficial(r)}
                            </p>
                          </div>
                        )}

                        {r.status === "pending" &&
                          r.status !== "barangay_validated" &&
                          r.status !== "validated" &&
                          r.status !== "rejected" && (
                            <div className="mt-3">
                              <p className="text-xs text-navy-500 mb-1">
                                {progressText}
                              </p>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-primary-600 h-2 rounded-full transition-all"
                                  style={{
                                    width: `${(validationsCount / needed) * 100}%`,
                                  }}
                                ></div>
                              </div>
                              {r.validatedBy?.length > 0 && (
                                <p className="text-xs text-navy-500 mt-1">
                                  Validated by:{" "}
                                  {r.validatedBy.map((v) => v.name).join(", ")}
                                </p>
                              )}
                            </div>
                          )}

                        <div className="flex items-center space-x-4 mt-3 text-sm text-navy-500">
                          <span>Barangay: {r.barangay}</span>
                          <span>
                            Reporter: {r.userId?.name || "Anonymous"}
                            {r.reportedByRole === "barangay_official" &&
                              " (Official)"}
                          </span>
                          <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      {canValidate && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleValidate(r._id)}
                          className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-semibold flex items-center space-x-1"
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                          <span>Validate</span>
                        </motion.button>
                      )}
                      {user.role === "admin" || user.role === "superadmin" ? (
                        <>
                          {r.status !== "validated" && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleValidate(r._id)}
                              className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-semibold flex items-center space-x-1"
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                              <span>Approve</span>
                            </motion.button>
                          )}
                          {r.status !== "rejected" && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleReject(r._id)}
                              className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-semibold flex items-center space-x-1"
                            >
                              <XCircleIcon className="w-4 h-4" />
                              <span>Reject</span>
                            </motion.button>
                          )}
                        </>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
