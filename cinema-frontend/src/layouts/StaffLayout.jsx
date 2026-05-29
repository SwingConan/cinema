// src/layouts/StaffLayout.jsx
// =============================================
// STAFF LAYOUT — Sidebar + Outlet cho nhân viên
// =============================================
import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect } from "react";
import api from "../utils/api";
import {
  BarChart3,
  Monitor,
  QrCode,
  Grid,
  MapPin,
} from "lucide-react";

export default function StaffLayout() {
  const { user } = useAuth();
  const [branchInfo, setBranchInfo] = useState(null);

  useEffect(() => {
    if (user?.branch_id) {
      api.get('/public/branches').then(res => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? res.data?.value ?? []);
        const myBranch = list.find(b => b.id === user.branch_id);
        if (myBranch) setBranchInfo(myBranch);
      }).catch(() => {});
    }
  }, [user]);

  const navItems = [
    { path: "/staff", end: true, name: "Tổng quan", icon: BarChart3 },
    { path: "/staff/pos", name: "Bán vé (POS)", icon: Monitor },
    { path: "/staff/checkin", name: "Soát vé", icon: QrCode },
  ];

  return (
    <div className="flex bg-[#141414] min-h-[calc(100vh-64px)] text-gray-200 selection:bg-[#E50914] selection:text-white">
      {/* Sidebar */}
      <aside className="w-56 bg-[#1a1a1a] text-white shadow-2xl border-r border-[#333] flex-shrink-0 z-10">
        <div className="p-5 border-b border-[#333]">
          <h2 className="text-lg font-black uppercase tracking-widest flex items-center text-[#E50914]">
            <Grid className="mr-2 w-5 h-5" /> Staff Panel
          </h2>
          {branchInfo && (
            <div className="mt-2 flex items-start gap-1.5 text-xs text-gray-400">
              <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-500" />
              <div>
                <p className="font-bold text-gray-300">{branchInfo.name}</p>
                <p className="text-gray-500">{branchInfo.city}</p>
              </div>
            </div>
          )}
        </div>
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-bold ${
                  isActive
                    ? "bg-[#E50914] text-white shadow-lg shadow-red-900/30"
                    : "text-gray-400 hover:bg-[#222] hover:text-white"
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
