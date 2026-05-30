import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import api from "../services/api";
import {
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("all");

  useEffect(() => {
    fetchLogs();
  }, []);
  const fetchLogs = async () => {
    try {
      const r = await api.get("/logs");
      setLogs(r.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const params = {};
      if (filterAction !== "all") params.action = filterAction;
      const response = await api.get("/logs/download", {
        params,
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `mitigateplus-logs-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("PDF downloaded");
    } catch (err) {
      console.error(err);
      toast.error("Download failed");
    }
  };

  const filtered = logs.filter((l) => {
    if (filterAction !== "all" && l.action !== filterAction) return false;
    if (
      searchTerm &&
      !l.userName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !l.action?.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;
    return true;
  });

  const actions = [...new Set(logs.map((l) => l.action))];

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
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold gradient-text">
                Activity Logs
              </h1>
              <p className="text-navy-500 mt-1">Track all system activities</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownload}
              className="glass-button-primary px-6 py-3 rounded-2xl font-semibold flex items-center space-x-2"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              <span>Download PDF</span>
            </motion.button>
          </motion.div>

          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 glass-input"
              />
            </div>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="glass-input py-3"
            >
              <option value="all">All Actions</option>
              {actions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left p-4 text-sm font-semibold text-navy-600">
                      User
                    </th>
                    <th className="text-left p-4 text-sm font-semibold text-navy-600">
                      Role
                    </th>
                    <th className="text-left p-4 text-sm font-semibold text-navy-600">
                      Action
                    </th>
                    <th className="text-left p-4 text-sm font-semibold text-navy-600">
                      Details
                    </th>
                    <th className="text-left p-4 text-sm font-semibold text-navy-600">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l, i) => (
                    <motion.tr
                      key={l._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.01 }}
                      className="border-b border-white/10 hover:bg-white/20"
                    >
                      <td className="p-4">
                        <p className="font-semibold text-navy-900">
                          {l.userName || "N/A"}
                        </p>
                      </td>
                      <td className="p-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 capitalize">
                          {l.userRole?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/50 text-navy-700">
                          {l.action}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-navy-600">
                        {l.details || "N/A"}
                      </td>
                      <td className="p-4 text-sm text-navy-500">
                        {new Date(l.createdAt).toLocaleString()}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogs;
