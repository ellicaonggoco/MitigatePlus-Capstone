import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import api from "../services/api";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  XMarkIcon,
  BuildingOffice2Icon,
  MapPinIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

const EvacuationCenters = () => {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({
    name: "",
    address: "",
    location: { lat: 14.5995, lng: 120.9842 },
    capacity: 100,
    contactPerson: "",
    contactNumber: "",
    facilities: [],
    isActive: true,
  });

  useEffect(() => {
    fetchCenters();
  }, []);
  const fetchCenters = async () => {
    try {
      const r = await api.get("/evacuation");
      setCenters(r.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post("/evacuation", form);
      setShowModal(false);
      fetchCenters();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this center?")) {
      try {
        await api.delete(`/evacuation/${id}`);
        fetchCenters();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filtered = centers.filter((c) =>
    searchTerm
      ? c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.address.toLowerCase().includes(searchTerm.toLowerCase())
      : true,
  );

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
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold gradient-text">
                Evacuation Centers
              </h1>
              <p className="text-navy-500 mt-1">
                Manage emergency evacuation centers
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowModal(true)}
              className="glass-button-primary px-6 py-3 rounded-2xl font-semibold flex items-center space-x-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Add Center</span>
            </motion.button>
          </motion.div>

          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
            <input
              type="text"
              placeholder="Search centers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 glass-input"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c, i) => (
              <motion.div
                key={c._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4 }}
                className="glass-card p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600">
                    <BuildingOffice2Icon className="w-6 h-6 text-white" />
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${c.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                  >
                    {c.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <h3 className="font-semibold text-navy-900 text-lg mb-2">
                  {c.name}
                </h3>
                <div className="space-y-2 mb-4 text-sm text-navy-600">
                  <div className="flex items-center space-x-2">
                    <MapPinIcon className="w-4 h-4" />
                    <span className="line-clamp-2">{c.address}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <UsersIcon className="w-4 h-4" />
                    <span>Capacity: {c.capacity}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(c._id)}
                  className="w-full bg-red-500 text-white py-2 rounded-xl text-sm font-semibold flex items-center justify-center space-x-1"
                >
                  <TrashIcon className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
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
                  Add Evacuation Center
                </h2>
                <button onClick={() => setShowModal(false)}>
                  <XMarkIcon className="w-6 h-6 text-navy-400" />
                </button>
              </div>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-navy-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full glass-input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-navy-700 mb-2">
                    Address *
                  </label>
                  <textarea
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                    className="w-full glass-input"
                    rows="2"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-navy-700 mb-2">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={form.location.lat}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          location: {
                            ...form.location,
                            lat: parseFloat(e.target.value),
                          },
                        })
                      }
                      className="w-full glass-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-navy-700 mb-2">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={form.location.lng}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          location: {
                            ...form.location,
                            lng: parseFloat(e.target.value),
                          },
                        })
                      }
                      className="w-full glass-input"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-navy-700 mb-2">
                    Capacity *
                  </label>
                  <input
                    type="number"
                    value={form.capacity}
                    onChange={(e) =>
                      setForm({ ...form, capacity: parseInt(e.target.value) })
                    }
                    className="w-full glass-input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-navy-700 mb-2">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={form.contactPerson}
                    onChange={(e) =>
                      setForm({ ...form, contactPerson: e.target.value })
                    }
                    className="w-full glass-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-navy-700 mb-2">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    value={form.contactNumber}
                    onChange={(e) =>
                      setForm({ ...form, contactNumber: e.target.value })
                    }
                    className="w-full glass-input"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  type="submit"
                  className="w-full glass-button-primary py-3 rounded-2xl font-semibold"
                >
                  Add Center
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EvacuationCenters;
