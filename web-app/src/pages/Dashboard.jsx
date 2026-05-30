import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import HazardIconBadge from '../components/HazardIconBadge';
import api from '../services/api';
import { CheckCircleIcon, ClockIcon, UsersIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { io } from 'socket.io-client';

const Dashboard = () => {
  const [stats, setStats] = useState({ total: 0, validated: 0, pending: 0, rejected: 0, barangayValidated: 0, activeUsers: 0, hazardZones: 0 });
  const [recentReports, setRecentReports] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');
    socket.on('new_report', fetchData);
    socket.on('report_validated', fetchData);
    return () => socket.disconnect();
  }, []);

  const fetchData = async () => {
    try {
      const [reportsRes, usersRes] = await Promise.all([api.get('/reports'), api.get('/auth/users')]);
      const reports = reportsRes.data.data;
      const users = usersRes.data.data;
      setRecentReports(reports.slice(0, 5));
      setStats({
        total: reports.length,
        validated: reports.filter(r => r.status === 'validated').length,
        pending: reports.filter(r => r.status === 'pending').length,
        rejected: reports.filter(r => r.status === 'rejected').length,
        barangayValidated: reports.filter(r => r.status === 'barangay_validated').length,
        activeUsers: users.filter(u => u.status === 'active').length,
        hazardZones: 0
      });
      const types = ['Flood','Fire','Landslide','Typhoon','Structural Damage','Drainage Issue'];
      setChartData(types.map(t => ({ name: t, count: reports.filter(r => r.type === t).length })));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  if (loading) return <div className="flex"><Sidebar/><div className="app-main"><Navbar/><div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div></div></div>;

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -4 }} className="glass-card p-6 relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-5 rounded-full blur-2xl`}></div>
      <div className="relative z-10 flex items-start justify-between">
        <div><p className="text-sm font-medium text-navy-500">{title}</p><p className="text-3xl font-bold text-navy-900 mt-2">{value}</p></div>
        <div className={`p-3 rounded-2xl bg-gradient-to-br ${color}`}><Icon className="w-6 h-6 text-white"/></div>
      </div>
    </motion.div>
  );

  return (
    <div className="flex">
      <Sidebar />
      <div className="app-main">
        <Navbar />
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Reports" value={stats.total} icon={ChartBarIcon} color="from-primary-400 to-primary-700" />
            <StatCard title="Validated" value={stats.validated} icon={CheckCircleIcon} color="from-green-400 to-green-700" />
            <StatCard title="Pending" value={stats.pending + stats.barangayValidated} icon={ClockIcon} color="from-yellow-400 to-yellow-700" />
            <StatCard title="Active Users" value={stats.activeUsers} icon={UsersIcon} color="from-purple-400 to-purple-700" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6">
              <h3 className="text-lg font-semibold text-navy-900 mb-6">Reports by Hazard Type</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.95)', borderRadius: '12px', border: 'none', boxShadow: '0 8px 32px rgba(31,38,135,0.1)' }} />
                  <Bar dataKey="count" fill="url(#grad)" radius={[8, 8, 0, 0]} />
                  <defs><linearGradient id="grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1565c0"/><stop offset="100%" stopColor="#0d2b6b"/></linearGradient></defs>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6">
              <h3 className="text-lg font-semibold text-navy-900 mb-6">Report Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={[{name:'Validated',value:stats.validated},{name:'Pending',value:stats.pending},{name:'Bgy Validated',value:stats.barangayValidated},{name:'Rejected',value:stats.rejected}]} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    <Cell fill="#10b981"/><Cell fill="#f59e0b"/><Cell fill="#3b82f6"/><Cell fill="#ef4444"/>
                  </Pie>
                  <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.95)', borderRadius: '12px', border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
            <h3 className="text-lg font-semibold text-navy-900 mb-4">Recent Reports</h3>
            <div className="space-y-3">
              {recentReports.map((r, i) => (
                <motion.div key={r._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i*0.1 }} className="flex items-center justify-between p-4 rounded-xl bg-white/40">
                  <div className="flex items-center space-x-4"><HazardIconBadge type={r.type} size="sm" /><div><p className="font-semibold text-navy-800">{r.type}</p><p className="text-sm text-navy-500">{r.barangay}</p></div></div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${r.severity==='high'?'bg-red-100 text-red-700':r.severity==='moderate'?'bg-yellow-100 text-yellow-700':'bg-green-100 text-green-700'}`}>{r.severity?.toUpperCase()}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${r.status==='validated'?'bg-green-100 text-green-700':r.status==='pending'?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>{r.status?.replace('_',' ').toUpperCase()}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
