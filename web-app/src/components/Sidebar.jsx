import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  HomeIcon,
  MapIcon,
  UsersIcon,
  ShoppingBagIcon,
  BuildingOffice2Icon,
  DocumentTextIcon,
  InformationCircleIcon,
  ArrowLeftOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const logoUrl = `${process.env.PUBLIC_URL}/mitigateplusonly.png`;

  const allMenuItems = [
    {
      path: "/dashboard",
      icon: HomeIcon,
      label: "Dashboard",
      roles: ["admin", "superadmin"],
    },
    {
      path: "/hazards",
      icon: MapIcon,
      label: "Hazard Map",
      roles: ["admin"],
    },
    {
      path: "/reports",
      icon: DocumentTextIcon,
      label: "Reports",
      roles: ["admin"],
    },
    {
      path: "/users",
      icon: UsersIcon,
      label: "Users",
      roles: ["admin", "superadmin"],
    },
    {
      path: "/gobag",
      icon: ShoppingBagIcon,
      label: "Go Bag Items",
      roles: ["admin"],
    },
    {
      path: "/evacuation",
      icon: BuildingOffice2Icon,
      label: "Evacuation",
      roles: ["admin"],
    },
    {
      path: "/logs",
      icon: DocumentTextIcon,
      label: "Activity Logs",
      roles: ["admin", "superadmin"],
    },
  ];

  const filtered = allMenuItems.filter((item) =>
    item.roles.includes(user?.role),
  );

  return (
    <motion.div
      initial={{ x: -280 }}
      animate={{ x: 0, width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3 }}
      className="fixed left-0 top-0 h-full glass-dark flex flex-col border-r border-white/30 shadow-[18px_0_60px_-40px_rgba(13,43,107,0.55)]"
      style={{
        width: collapsed ? 80 : 280,
        zIndex: 9999,
        pointerEvents: "auto",
      }}
    >
      {/* Logo Section */}
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center justify-between">
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center space-x-3"
              >
                {/* Actual logo image – adjust w-10 h-10 as needed */}
                <img
                  src={logoUrl}
                  alt="MitigatePlus Logo"
                  className="w-14 h-14 object-contain rounded-xl"
                />
                <div>
                  <h1 className="font-bold text-lg gradient-text">
                    MitigatePlus
                  </h1>
                  <p className="text-xs text-navy-400">Manila DRRM</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-xl hover:bg-white/10"
          >
            {collapsed ? (
              <ChevronRightIcon className="w-5 h-5 text-navy-600" />
            ) : (
              <ChevronLeftIcon className="w-5 h-5 text-navy-600" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
        {filtered.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group relative flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-300 ${
                isActive
                  ? "bg-white/55 text-primary-700 shadow-[0_14px_34px_-22px_rgba(21,101,192,0.8)] ring-1 ring-white/70"
                  : "text-navy-600 hover:bg-white/30 hover:text-primary-700 hover:translate-x-1"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="sidebar-active-pill"
                  className="absolute inset-y-2 left-2 w-1 rounded-full bg-primary-600 shadow-[0_0_18px_rgba(21,101,192,0.55)]"
                  transition={{ type: "spring", stiffness: 360, damping: 32 }}
                />
              )}
              <span className={`grid h-9 w-9 place-items-center rounded-2xl transition-all duration-300 ${isActive ? "bg-primary-600 text-white shadow-lg shadow-primary-500/25" : "bg-white/0 group-hover:bg-white/55"}`}>
                <Icon className="w-5 h-5 flex-shrink-0" />
              </span>
              {!collapsed && (
                <span className="font-medium text-sm">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="p-4 border-t border-white/20">
        {!collapsed && (
          <div className="mb-3 px-3 py-2 rounded-xl bg-white/10">
            <p className="text-sm font-medium text-navy-800 truncate">
              {user?.name}
            </p>
            <p className="text-xs text-navy-500 capitalize">
              {user?.role?.replace("_", " ")}
            </p>
          </div>
        )}
        <Link
          to="/about"
          className="flex items-center space-x-3 px-4 py-3 rounded-2xl text-navy-600 hover:bg-white/10 mb-1"
        >
          <InformationCircleIcon className="w-6 h-6" />
          {!collapsed && <span className="font-medium text-sm">About</span>}
        </Link>
        <button
          onClick={logout}
          className="flex items-center space-x-3 px-4 py-3 rounded-2xl text-red-600 hover:bg-red-50 w-full"
        >
          <ArrowLeftOnRectangleIcon className="w-6 h-6" />
          {!collapsed && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>
    </motion.div>
  );
};

export default Sidebar;
