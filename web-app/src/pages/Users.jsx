import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ClockIcon,
  UserPlusIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  HomeIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin",
    barangay: "City of Manila",
    phone: "",
    address: "",
  });
  const currentUserId = user?.id || user?._id;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const [u, p] = await Promise.all([
        api.get("/auth/users"),
        api.get("/auth/officials/pending"),
      ]);
      setUsers(u.data.data);
      setPending(p.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatus = async (id, status) => {
    try {
      await api.patch(`/auth/users/${id}/status`, { status });
      toast.success(status === "suspended" ? "Account suspended" : "Account activated");
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update account");
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (!window.confirm(`Delete ${targetUser.name}'s account permanently?`)) return;
    try {
      await api.delete(`/auth/users/${targetUser._id}`);
      toast.success("Account deleted");
      fetchUsers();
      if (selectedUser?._id === targetUser._id) {
        setSelectedUser(null);
        setShowModal(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete account");
    }
  };

  const getUserLocationLabel = (target) =>
    [target.address, target.barangay].filter(Boolean).join(", ") ||
    target.barangay ||
    "City of Manila";

  const openUserLocation = (target) => {
    const coords = target.lastKnownLocation || target.location;
    const query =
      coords?.lat && coords?.lng
        ? `${coords.lat},${coords.lng}`
        : getUserLocationLabel(target);

    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handleApprove = async (id) => {
    try {
      await api.patch(`/auth/officials/${id}/approve`);
      toast.success("Barangay official approved");
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not approve official");
    }
  };

  const updateCreateForm = (field, value) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetCreateForm = () => {
    setCreateForm({
      name: "",
      email: "",
      password: "",
      role: "admin",
      barangay: "City of Manila",
      phone: "",
      address: "",
    });
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await api.post("/auth/users", createForm);
      toast.success("Account created");
      setShowCreateModal(false);
      resetCreateForm();
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create account");
    } finally {
      setCreateLoading(false);
    }
  };

  const filtered = users.filter((u) => {
    if (filterRole !== "all" && u.role !== filterRole) return false;
    if (
      searchTerm &&
      !u.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !u.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;
    return true;
  });

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
            className="flex items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-3xl font-bold gradient-text">
                User Management
              </h1>
              <p className="text-navy-500 mt-1">
                Manage users, approvals, and permissions
              </p>
            </div>
            {user?.role === "superadmin" && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="glass-button-primary px-5 py-3 rounded-2xl font-semibold flex items-center space-x-2"
              >
                <UserPlusIcon className="w-5 h-5" />
                <span>Create Account</span>
              </button>
            )}
          </motion.div>

          {pending.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 border-l-4 border-yellow-500"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-2xl bg-yellow-100">
                    <ClockIcon className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy-900">
                      Pending Approvals
                    </h3>
                    <p className="text-sm text-navy-600">
                      {pending.length} official(s) awaiting approval
                    </p>
                    <p className="text-xs text-navy-500 mt-1">
                      Contact the applicant by phone or email before approving official access.
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-5">
                {pending.map((o) => (
                  <div key={o._id} className="rounded-2xl bg-white/60 border border-white/70 p-4">
                    <div className="flex gap-4">
                      <a
                        href={o.officialIdUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl border border-white/80 bg-slate-100 shadow-sm"
                        title="Open uploaded official ID"
                      >
                        <img
                          src={o.officialIdUrl}
                          alt={`${o.name} official ID`}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                        <span className="absolute bottom-2 right-2 rounded-lg bg-white/90 p-1 text-primary-700 shadow-sm">
                          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                        </span>
                      </a>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-navy-900 truncate">{o.name}</p>
                            <p className="text-xs font-semibold text-yellow-700">Resident account, official access pending</p>
                          </div>
                          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-700">
                            Review ID
                          </span>
                        </div>
                        <div className="mt-3 space-y-1 text-sm text-navy-700">
                          <p className="flex items-center gap-2 break-all">
                            <EnvelopeIcon className="h-4 w-4 shrink-0 text-navy-400" />
                            {o.email}
                          </p>
                          <p className="flex items-center gap-2">
                            <PhoneIcon className="h-4 w-4 shrink-0 text-navy-400" />
                            {o.phone || "No phone provided"}
                          </p>
                          <p className="flex items-start gap-2">
                            <HomeIcon className="h-4 w-4 shrink-0 text-navy-400 mt-0.5" />
                            <span>{[o.address, o.barangay].filter(Boolean).join(", ") || "No address provided"}</span>
                          </p>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(o);
                              setShowModal(true);
                            }}
                            className="px-4 py-2 rounded-xl bg-white text-primary-700 text-sm font-semibold shadow-sm"
                          >
                            View details
                          </button>
                          <a
                            href={`mailto:${o.email}`}
                            className="px-4 py-2 rounded-xl bg-blue-50 text-primary-700 text-sm font-semibold"
                          >
                            Email
                          </a>
                          {o.phone ? (
                            <a
                              href={`tel:${o.phone}`}
                              className="px-4 py-2 rounded-xl bg-blue-50 text-primary-700 text-sm font-semibold"
                            >
                              Call
                            </a>
                          ) : null}
                          <button
                            onClick={() => handleApprove(o._id)}
                            className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-semibold"
                          >
                            Approve official
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 rounded-xl bg-yellow-50 px-3 py-2 text-xs font-medium text-yellow-800">
                      Note: Verify the uploaded ID and contact details before approving. After approval, this user will see the Official page in the mobile app.
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 glass-input"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="glass-input py-3"
            >
              <option value="all">All Roles</option>
              <option value="resident">Resident</option>
              <option value="barangay_official">Barangay Official</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
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
                      Barangay
                    </th>
                    <th className="text-left p-4 text-sm font-semibold text-navy-600">
                      Status
                    </th>
                    <th className="text-right p-4 text-sm font-semibold text-navy-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => (
                    <motion.tr
                      key={u._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-white/10 hover:bg-white/20"
                    >
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-400 to-navy-700 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {u.name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-navy-900">
                              {u.name}
                            </p>
                            <p className="text-xs text-navy-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 capitalize">
                          {u.role?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-4 text-navy-700">{u.barangay}</td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${u.status === "active" ? "bg-green-100 text-green-700" : u.status === "pending_approval" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}
                        >
                          {u.status?.replace("_", " ").toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openUserLocation(u)}
                            className="p-2 rounded-xl hover:bg-blue-50"
                            title="Locate user"
                          >
                            <MapPinIcon className="w-5 h-5 text-blue-600" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setShowModal(true);
                            }}
                            className="p-2 rounded-xl hover:bg-primary-50"
                          >
                            <EyeIcon className="w-5 h-5 text-primary-600" />
                          </button>
                          {(user?.role === "superadmin" ||
                            !["admin", "superadmin"].includes(u.role)) &&
                            u.status !== "active" && (
                            <button
                              onClick={() => handleStatus(u._id, "active")}
                              className="p-2 rounded-xl hover:bg-green-50"
                            >
                              <CheckCircleIcon className="w-5 h-5 text-green-600" />
                            </button>
                          )}
                          {(user?.role === "superadmin" ||
                            !["admin", "superadmin"].includes(u.role)) &&
                            u._id !== currentUserId &&
                            u.status !== "suspended" && (
                            <button
                              onClick={() => handleStatus(u._id, "suspended")}
                              className="p-2 rounded-xl hover:bg-red-50"
                            >
                              <XCircleIcon className="w-5 h-5 text-red-600" />
                            </button>
                          )}
                          {user?.role === "superadmin" && u._id !== currentUserId && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-2 rounded-xl hover:bg-red-50"
                              title="Delete account"
                            >
                              <TrashIcon className="w-5 h-5 text-red-700" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showCreateModal && user?.role === "superadmin" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card max-w-xl w-full p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-navy-900">
                    Create Dashboard Account
                  </h2>
                  <p className="text-sm text-navy-500 mt-1">
                    Super admins can create active admin or super admin accounts.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 rounded-xl hover:bg-white/50 text-navy-500"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-navy-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={createForm.name}
                      onChange={(e) => updateCreateForm("name", e.target.value)}
                      className="w-full glass-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-navy-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={createForm.email}
                      onChange={(e) => updateCreateForm("email", e.target.value)}
                      className="w-full glass-input"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-navy-700 mb-2">
                      Role
                    </label>
                    <select
                      value={createForm.role}
                      onChange={(e) => updateCreateForm("role", e.target.value)}
                      className="w-full glass-input"
                    >
                      <option value="admin">Admin</option>
                      <option value="superadmin">Super Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-navy-700 mb-2">
                      Temporary Password
                    </label>
                    <input
                      type="password"
                      value={createForm.password}
                      onChange={(e) => updateCreateForm("password", e.target.value)}
                      className="w-full glass-input"
                      minLength={6}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-navy-700 mb-2">
                      Barangay / Assignment
                    </label>
                    <input
                      type="text"
                      value={createForm.barangay}
                      onChange={(e) => updateCreateForm("barangay", e.target.value)}
                      className="w-full glass-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-navy-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={createForm.phone}
                      onChange={(e) => updateCreateForm("phone", e.target.value)}
                      className="w-full glass-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-navy-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={createForm.address}
                    onChange={(e) => updateCreateForm("address", e.target.value)}
                    className="w-full glass-input"
                  />
                </div>

                <div className="rounded-2xl bg-blue-50/80 border border-blue-100 p-4 text-sm text-navy-700">
                  Created accounts are immediately active and email verified. Share
                  the temporary password only through a trusted channel.
                </div>

                <button
                  type="submit"
                  disabled={createLoading}
                  className="w-full glass-button-primary py-3 rounded-2xl font-semibold disabled:opacity-70"
                >
                  {createLoading ? "Creating..." : "Create Account"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {showModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="text-center mb-6">
                {selectedUser.profilePictureUrl ? (
                  <img
                    src={selectedUser.profilePictureUrl}
                    alt={selectedUser.name}
                    className="w-20 h-20 mx-auto rounded-3xl object-cover shadow-xl mb-4 border-2 border-white"
                  />
                ) : (
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-primary-400 to-navy-700 flex items-center justify-center shadow-xl mb-4">
                    <span className="text-3xl font-bold text-white">
                      {selectedUser.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                )}
                <h2 className="text-2xl font-bold text-navy-900">
                  {selectedUser.name}
                </h2>
                <p className="text-navy-500">{selectedUser.email}</p>
              </div>
              <div className="space-y-4">
                <div className="glass-input flex justify-between">
                  <span className="text-navy-500">Role</span>
                  <span className="font-semibold text-navy-800 capitalize">
                    {selectedUser.role?.replace("_", " ")}
                  </span>
                </div>
                <div className="glass-input flex justify-between">
                  <span className="text-navy-500">Barangay</span>
                  <span className="font-semibold text-navy-800">
                    {selectedUser.barangay}
                  </span>
                </div>
                <div className="glass-input flex justify-between">
                  <span className="text-navy-500">Status</span>
                  <span className="font-semibold">
                    {selectedUser.status?.toUpperCase()}
                  </span>
                </div>
                <div className="glass-input flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2 text-navy-500">
                    <PhoneIcon className="w-4 h-4" />
                    Phone
                  </span>
                  <span className="font-semibold text-navy-800 text-right">
                    {selectedUser.phone || "Not provided"}
                  </span>
                </div>
                {selectedUser.officialIdUrl ? (
                  <div className="rounded-2xl bg-white/50 border border-white/70 p-3">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <span className="font-semibold text-navy-700">
                        Uploaded official ID
                      </span>
                      <a
                        href={selectedUser.officialIdUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-bold text-primary-700"
                      >
                        Open
                        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                      </a>
                    </div>
                    <img
                      src={selectedUser.officialIdUrl}
                      alt={`${selectedUser.name} official ID`}
                      className="max-h-64 w-full rounded-xl object-contain bg-slate-100"
                    />
                    {selectedUser.isBarangayOfficial && selectedUser.role !== "barangay_official" ? (
                      <p className="mt-3 rounded-xl bg-yellow-50 px-3 py-2 text-xs font-medium text-yellow-800">
                        Note: Contact this applicant before approval. Their mobile account remains resident-only until approved.
                      </p>
                    ) : null}
                  </div>
                ) : null}
                <div className="glass-input flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2 text-navy-500">
                    <EnvelopeIcon className="w-4 h-4" />
                    Email
                  </span>
                  <span className="font-semibold text-navy-800 text-right break-all">
                    {selectedUser.email}
                  </span>
                </div>
                <div className="glass-input flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2 text-navy-500">
                    <HomeIcon className="w-4 h-4" />
                    Address
                  </span>
                  <span className="font-semibold text-navy-800 text-right">
                    {selectedUser.address || "Not provided"}
                  </span>
                </div>
                <div className="glass-input flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2 text-navy-500">
                    <MapPinIcon className="w-4 h-4" />
                    Latest App Location
                  </span>
                  <span className="font-semibold text-navy-800 text-right">
                    {selectedUser.lastKnownLocation?.lat &&
                    selectedUser.lastKnownLocation?.lng
                      ? `${Number(selectedUser.lastKnownLocation.lat).toFixed(5)}, ${Number(selectedUser.lastKnownLocation.lng).toFixed(5)}`
                      : "Not shared yet"}
                  </span>
                </div>
                {selectedUser.lastKnownLocation?.updatedAt ? (
                  <p className="text-xs text-navy-500 text-right -mt-2">
                    Updated {new Date(selectedUser.lastKnownLocation.updatedAt).toLocaleString()}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => openUserLocation(selectedUser)}
                  className="w-full glass-button-primary py-3 rounded-2xl font-semibold flex items-center justify-center gap-2"
                >
                  <MapPinIcon className="w-5 h-5" />
                  <span>Open User Location</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Users;
