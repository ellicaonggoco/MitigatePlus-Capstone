import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import api from "../services/api";
import {
  UsersIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

const SuperAdmin = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalReports: 0,
    totalAdmins: 0,
    activeBarangays: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [users, reports] = await Promise.all([
        api.get("/auth/users"),
        api.get("/reports"),
      ]);
      const u = users.data.data;
      setStats({
        totalUsers: u.length,
        totalReports: reports.data.data.length,
        totalAdmins: u.filter((x) => x.role === "admin").length,
        activeBarangays: [...new Set(u.map((x) => x.barangay))].length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
        <div className="p-8 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold gradient-text">
              Super Admin Dashboard
            </h1>
            <p className="text-navy-500 mt-1">
              Full system control and analytics
            </p>
          </motion.div>

          {/* Stat cards – unchanged */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                label: "Total Users",
                value: stats.totalUsers,
                icon: UsersIcon,
                color: "from-primary-400 to-primary-700",
              },
              {
                label: "Total Reports",
                value: stats.totalReports,
                icon: ChartBarIcon,
                color: "from-green-400 to-green-700",
              },
              {
                label: "Admins",
                value: stats.totalAdmins,
                icon: ShieldCheckIcon,
                color: "from-purple-400 to-purple-700",
              },
              {
                label: "Barangays",
                value: stats.activeBarangays,
                icon: Cog6ToothIcon,
                color: "from-orange-400 to-orange-700",
              },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-navy-500">{s.label}</p>
                      <p className="text-3xl font-bold text-navy-900">
                        {s.value}
                      </p>
                    </div>
                    <div
                      className={`p-3 rounded-2xl bg-gradient-to-br ${s.color}`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-navy-900 mb-4">
                System Health
              </h3>
              <div className="space-y-4">
                {[
                  {
                    label: "API Status",
                    value: "Operational",
                    color: "text-green-600",
                  },
                  {
                    label: "Database",
                    value: "Connected",
                    color: "text-green-600",
                  },
                  {
                    label: "Socket.io",
                    value: "Running",
                    color: "text-green-600",
                  },
                  {
                    label: "Email Service",
                    value: "Active",
                    color: "text-green-600",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/40"
                  >
                    <span className="text-navy-700">{item.label}</span>
                    <span className={`font-semibold ${item.color}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-navy-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                {[
                  "Create Admin Account",
                  "View System Logs",
                  "Manage Permissions",
                  "Download Full Report",
                ].map((a, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ x: 4 }}
                    className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-white/50 text-left"
                  >
                    <div className="p-2 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600">
                      <ShieldCheckIcon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-navy-700">
                      {a}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdmin;
