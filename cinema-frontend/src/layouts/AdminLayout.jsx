import { Outlet, NavLink } from "react-router-dom";
import {
  Film,
  MonitorPlay,
  Users,
  Settings,
  Grid,
  Ticket,
  BarChart3,
  ShoppingBag,
} from "lucide-react";

export default function AdminLayout() {
  const navItems = [
    { path: "/admin", end: true, name: "Tổng quan", icon: BarChart3 },
    { path: "/admin/movies", name: "Phim", icon: Film },
    { path: "/admin/rooms", name: "Phòng chiếu", icon: MonitorPlay },
    { path: "/admin/showtimes", name: "Suất chiếu", icon: Ticket },
    { path: "/admin/concessions", name: "F&B (Bắp nước)", icon: ShoppingBag },
    { path: "/admin/users", name: "Tài khoản", icon: Users },
  ];

  return (
    <div className="flex bg-[#141414] min-h-[calc(100vh-64px)] text-gray-200 selection:bg-[#E50914] selection:text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1a1a1a] text-white shadow-2xl border-r border-[#333] flex-shrink-0 z-10">
        <div className="p-5 border-b border-[#333]">
          <h2 className="text-xl font-black uppercase tracking-widest flex items-center text-[#E50914]">
            <Grid className="mr-3" /> Admin Panel
          </h2>
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
                    ? "bg-[#E50914] text-white shadow-lg shadow-red-900/20"
                    : "text-gray-400 hover:bg-[#222] hover:text-white"
                }`
              }
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#141414] p-2">
        <Outlet />
      </main>
    </div>
  );
}
