import React from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { motion } from "framer-motion";
import {
  ShieldCheckIcon,
  MapPinIcon,
  UsersIcon,
  LightBulbIcon,
} from "@heroicons/react/24/outline";

const About = () => (
  <div className="flex">
    <Sidebar />
    <div className="app-main pointer-events-none">
      <Navbar />
      <div className="p-8 space-y-8 pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold gradient-text">
            About MitigatePlus
          </h1>
          <p className="text-navy-500 mt-2 text-lg">
            Disaster Risk Mitigation System for the City of Manila
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              icon: ShieldCheckIcon,
              title: "Our Mission",
              desc: "To empower Manila residents and local government units with real-time disaster risk information and mitigation tools, reducing community vulnerability to natural hazards.",
            },
            {
              icon: MapPinIcon,
              title: "Hazard Mapping",
              desc: "Interactive maps showing flood zones, fault lines, evacuation centers, and hazard areas using data from PHIVOLCS, PAGASA, and local government.",
            },
            {
              icon: UsersIcon,
              title: "Community Driven",
              desc: "Residents can report hazards, complete risk assessments, and receive personalized mitigation tips. Barangay officials validate and manage reports.",
            },
            {
              icon: LightBulbIcon,
              title: "AI-Powered",
              desc: "Our MitiGo chatbot provides instant disaster preparedness advice using Google Gemini AI, available 24/7 for residents.",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6"
            >
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary-400 to-navy-700 w-fit shadow-lg mb-4">
                <item.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-navy-900 mb-2">
                {item.title}
              </h3>
              <p className="text-navy-600">{item.desc}</p>
            </motion.div>
          ))}
        </div>
        <div className="glass-card p-8 text-center">
          <p className="text-navy-600">
            Version 1.0.0 | Built for Manila MDRRMO | Data Sources: PHIVOLCS,
            PAGASA, OpenStreetMap
          </p>
        </div>
      </div>
    </div>
  </div>
);
export default About;
