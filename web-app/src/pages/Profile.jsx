import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import {
  EnvelopeIcon,
  ShieldCheckIcon,
  MapPinIcon,
  CalendarIcon,
  CameraIcon,
} from "@heroicons/react/24/outline";
import api from "../services/api";
import toast from "react-hot-toast";

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handlePictureClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB.");
      return;
    }

    const formData = new FormData();
    formData.append("profilePicture", file);

    setUploading(true);
    try {
      const response = await api.patch("/auth/profile/picture", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      updateUser({ profilePictureUrl: response.data.data.profilePictureUrl });
    } catch (err) {
      toast.error("Failed to upload profile picture. Please try again.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
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
  }

  const profileImage = user.profilePictureUrl ? user.profilePictureUrl : null;

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Navbar />
        <div className="p-8 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold gradient-text">
              Profile Settings
            </h1>
            <p className="text-navy-500 mt-1">
              Manage your account information
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-8"
          >
            <div className="flex items-center space-x-6 mb-8">
              <div
                className="relative group cursor-pointer"
                onClick={handlePictureClick}
              >
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-20 h-20 rounded-3xl object-cover shadow-xl border-2 border-white"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-400 to-navy-700 flex items-center justify-center shadow-xl">
                    <span className="text-4xl font-bold text-white">
                      {user.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 rounded-3xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <CameraIcon className="w-8 h-8 text-white" />
                </div>
                {uploading && (
                  <div className="absolute inset-0 rounded-3xl bg-black/60 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-navy-900">
                  {user.name}
                </h2>
                <p className="text-navy-500 capitalize">
                  {user.role?.replace("_", " ")}
                </p>
                <p className="text-xs text-primary-600 mt-1">
                  Click the avatar to change picture
                </p>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-input flex items-center space-x-3">
                <EnvelopeIcon className="w-5 h-5 text-navy-400" />
                <div>
                  <p className="text-xs text-navy-400">Email</p>
                  <p className="text-navy-800 font-medium">{user.email}</p>
                </div>
              </div>
              <div className="glass-input flex items-center space-x-3">
                <MapPinIcon className="w-5 h-5 text-navy-400" />
                <div>
                  <p className="text-xs text-navy-400">Barangay</p>
                  <p className="text-navy-800 font-medium">{user.barangay}</p>
                </div>
              </div>
              <div className="glass-input flex items-center space-x-3">
                <ShieldCheckIcon className="w-5 h-5 text-navy-400" />
                <div>
                  <p className="text-xs text-navy-400">Role</p>
                  <p className="text-navy-800 font-medium capitalize">
                    {user.role?.replace("_", " ")}
                  </p>
                </div>
              </div>
              <div className="glass-input flex items-center space-x-3">
                <CalendarIcon className="w-5 h-5 text-navy-400" />
                <div>
                  <p className="text-xs text-navy-400">Account created</p>
                  <p className="text-navy-800 font-medium">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-8"
          >
            <h3 className="text-xl font-semibold text-navy-900 mb-4">
              Change Password
            </h3>
            <p className="text-sm text-navy-500 mb-4">
              Password update will be available in a future update.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  className="w-full glass-input opacity-50 cursor-not-allowed"
                  disabled
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  className="w-full glass-input opacity-50 cursor-not-allowed"
                  disabled
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  className="w-full glass-input opacity-50 cursor-not-allowed"
                  disabled
                  placeholder="••••••••"
                />
              </div>
              <button
                disabled
                className="glass-button-primary py-2.5 px-6 rounded-2xl opacity-50 cursor-not-allowed"
              >
                Update Password
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
