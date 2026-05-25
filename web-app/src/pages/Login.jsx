import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import {
  ShieldCheckIcon,
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password);
    if (result.success) {
      if (result.user.role === "barangay_official") {
        toast.error(
          "Please use the MitigatePlus mobile app for barangay officials.",
        );
        logout();
      } else if (result.user.role === "superadmin") {
        navigate("/users");
      } else {
        navigate("/dashboard");
      }
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const logoUrl = `${process.env.PUBLIC_URL}/1.png`;
  const cityHallUrl = `${process.env.PUBLIC_URL}/manilacityhall.jpg`;

  return (
    <div className="min-h-screen flex bg-[#071a42]">
      <div className="hidden lg:flex lg:w-[54%] relative overflow-hidden">
        <img
          src={cityHallUrl}
          alt="Manila City Hall"
          className="absolute inset-0 h-full w-full object-cover scale-[1.02] blur-sm opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#061638]/94 via-[#0b2d70]/82 to-[#051126]/72" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_12%,rgba(45,183,255,0.22),transparent_32%),radial-gradient(circle_at_70%_78%,rgba(255,107,95,0.16),transparent_30%)]" />
        <div className="absolute inset-y-0 right-0 w-44 bg-gradient-to-l from-[#071a42]/70 to-transparent" />

        <div className="relative z-10 flex flex-col px-14 py-10 w-full">
          <div className="w-full max-w-xl text-left">
            <img
              src={logoUrl}
              alt="MitigatePlus logo"
              className="h-72 xl:h-80 2xl:h-96 w-auto object-contain -ml-5"
              style={{
                filter:
                  "drop-shadow(0 0 2px #ffffff) drop-shadow(0 0 5px #ffffff) drop-shadow(0 16px 28px rgba(0,0,0,0.45))",
              }}
            />
            <p className="-mt-14 ml-2 text-[15px] font-black uppercase tracking-[0.36em] text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)]">
              City of Manila
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mt-16 max-w-xl space-y-6"
          >
            <p className="text-white text-sm font-black uppercase tracking-[0.28em] drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)]">
              Disaster Risk Mitigation System
            </p>
            <h2 className="text-6xl font-black text-white leading-[1.02] tracking-tight drop-shadow-[0_12px_28px_rgba(0,0,0,0.48)]">
              Protecting Manila, one barangay at a time.
            </h2>
            <p className="text-lg font-bold text-white leading-8 max-w-lg drop-shadow-[0_5px_16px_rgba(0,0,0,0.78)] [text-shadow:_0_2px_8px_rgb(0_0_0_/_70%)]">
              Monitor hazards, validate community reports, and coordinate
              response with a platform built for Manila residents and LGU teams.
            </p>
          </motion.div>

          <div className="mt-auto flex items-center gap-3 text-white text-sm font-semibold drop-shadow">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/12 ring-1 ring-white/20 shadow-lg shadow-black/20">
              <ShieldCheckIcon className="h-5 w-5 text-cyan-100" />
            </span>
            <span>Real-time awareness for safer communities</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-[radial-gradient(circle_at_20%_0%,#ffffff_0,#eff8ff_36%,#dceeff_100%)] relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(255,255,255,0.8),rgba(255,255,255,0.15))]" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="bg-white/92 backdrop-blur-2xl border border-white shadow-[0_30px_80px_-32px_rgba(7,26,66,0.62)] rounded-[1.75rem] p-7 sm:p-9 space-y-6">
            <div className="text-center">
              <h2 className="text-4xl font-black text-[#08245c] tracking-tight">
                Welcome Back
              </h2>
              <p className="mt-3 text-base font-medium text-slate-600">
                Sign in to your MitigatePlus dashboard
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm shadow-sm"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-black text-[#123a86] mb-2">
                  Email
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4b74bd]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 text-base rounded-2xl border border-blue-100 bg-white shadow-inner shadow-blue-100/60 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-400/20 outline-none transition-all placeholder:text-slate-400 text-[#0b2454] font-semibold"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-[#123a86] mb-2">
                  Password
                </label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4b74bd]" />
                  <input
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-14 py-3.5 text-base rounded-2xl border border-blue-100 bg-white shadow-inner shadow-blue-100/60 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-400/20 outline-none transition-all placeholder:text-slate-400 text-[#0b2454] font-semibold"
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6f8bb9] hover:text-blue-700 transition-colors"
                    aria-label={show ? "Hide password" : "Show password"}
                  >
                    {show ? (
                      <EyeSlashIcon className="w-6 h-6" />
                    ) : (
                      <EyeIcon className="w-6 h-6" />
                    )}
                  </button>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#123a86] via-[#2167dd] to-[#11b8d7] text-white py-3.5 rounded-2xl font-black text-lg flex items-center justify-center space-x-2 shadow-xl shadow-blue-500/30 hover:shadow-blue-500/40 transition-all disabled:opacity-70"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRightIcon className="w-6 h-6" />
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
