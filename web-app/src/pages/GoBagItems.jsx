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
} from "@heroicons/react/24/outline";

const GoBagItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [form, setForm] = useState({
    name: "",
    category: "Food & Water",
    description: "",
    whyImportant: "",
    forRiskLevel: ["low", "moderate", "high"],
  });

  const cats = [
    "Food & Water",
    "First Aid",
    "Tools",
    "Documents",
    "Clothing",
    "Hygiene",
    "Communication",
    "Other",
  ];

  useEffect(() => {
    fetchItems();
  }, []);
  const fetchItems = async () => {
    try {
      const r = await api.get("/gobag");
      setItems(r.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post("/gobag", form);
      setShowModal(false);
      fetchItems();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this item?")) {
      try {
        await api.delete(`/gobag/${id}`);
        fetchItems();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filtered = items.filter((i) => {
    if (filterCategory !== "all" && i.category !== filterCategory) return false;
    if (searchTerm && !i.name.toLowerCase().includes(searchTerm.toLowerCase()))
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
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold gradient-text">Go Bag Items</h1>
              <p className="text-navy-500 mt-1">
                Manage emergency preparedness items
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowModal(true)}
              className="glass-button-primary px-6 py-3 rounded-2xl font-semibold flex items-center space-x-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Add Item</span>
            </motion.button>
          </motion.div>

          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 glass-input"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="glass-input py-3"
            >
              <option value="all">All Categories</option>
              {cats.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item, i) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4 }}
                className="glass-card p-6 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-navy-900">{item.name}</h3>
                    <p className="text-xs text-navy-400 mt-1">
                      {item.category}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    {item.forRiskLevel.map((r) => (
                      <span
                        key={r}
                        className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${r === "high" ? "bg-red-100 text-red-700" : r === "moderate" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-navy-600 mb-3 line-clamp-2">
                  {item.description}
                </p>
                <button
                  onClick={() => handleDelete(item._id)}
                  className="p-2 rounded-xl hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <TrashIcon className="w-4 h-4 text-red-500" />
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
              className="glass-card max-w-md w-full p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-navy-900">Add Item</h2>
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
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className="w-full glass-input"
                  >
                    {cats.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-navy-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    className="w-full glass-input"
                    rows="2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-navy-700 mb-2">
                    Why Important
                  </label>
                  <textarea
                    value={form.whyImportant}
                    onChange={(e) =>
                      setForm({ ...form, whyImportant: e.target.value })
                    }
                    className="w-full glass-input"
                    rows="2"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  type="submit"
                  className="w-full glass-button-primary py-3 rounded-2xl font-semibold"
                >
                  Add Item
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GoBagItems;
