import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../utils/api";
import {
  Bell, Check, CheckCheck, CreditCard, Ticket,
  Megaphone, Settings, Crown, X,
} from "lucide-react";
import { io as socketIo } from "socket.io-client";

const TYPE_ICONS = {
  payment:   { icon: CreditCard, color: "text-emerald-400", bg: "bg-emerald-900/30" },
  booking:   { icon: Ticket,     color: "text-blue-400",    bg: "bg-blue-900/30" },
  promotion: { icon: Megaphone,  color: "text-pink-400",    bg: "bg-pink-900/30" },
  loyalty:   { icon: Crown,      color: "text-yellow-400",  bg: "bg-yellow-900/30" },
  system:    { icon: Settings,   color: "text-gray-400",    bg: "bg-gray-800/30" },
};

const timeAgo = (dateStr) => {
  const d = new Date(String(dateStr).replace("Z", ""));
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60)    return "Vừa xong";
  if (diff < 3600)  return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
};

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch unread count on mount
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get("/customer/notifications/unread-count");
      setUnreadCount(res.data.count);
    } catch (err) {
      console.error("Notification count error:", err);
    }
  }, [user]);

  // Fetch notification list
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get("/customer/notifications?limit=15");
      setNotifications(res.data.data || []);
    } catch (err) {
      console.error("Notification list error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Socket.io realtime listener
  useEffect(() => {
    if (!user) return;

    fetchUnreadCount();

    const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:8000";
    const socket = socketIo(BACKEND_URL, { transports: ["websocket"] });

    socket.on("connect", () => {
      socket.emit("join_user", { userId: user.id });
    });

    socket.on("notification:new", (notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 15));
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      socket.emit("leave_user", { userId: user.id });
      socket.disconnect();
    };
  }, [user, fetchUnreadCount]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Toggle dropdown
  const handleToggle = () => {
    if (!isOpen) fetchNotifications();
    setIsOpen(!isOpen);
  };

  // Mark one as read
  const handleRead = async (notif) => {
    if (!notif.isRead) {
      try {
        await api.put(`/customer/notifications/${notif.id}/read`);
        setNotifications(prev =>
          prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error("Mark read error:", err);
      }
    }
    // Navigate based on data.action
    if (notif.data?.action === "view_ticket") {
      navigate("/profile", { state: { activeTab: "history" } });
      setIsOpen(false);
    }
  };

  // Mark all as read
  const handleReadAll = async () => {
    try {
      await api.put("/customer/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Mark all read error:", err);
    }
  };

  if (!user || user.role === "admin") return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#2a2a2a] transition-colors"
        aria-label="Thông báo"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#E50914] text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="fixed sm:absolute inset-x-0 sm:inset-x-auto sm:right-0 top-[60px] sm:top-full sm:mt-2 w-full sm:w-[380px] max-h-[80vh] sm:max-h-[480px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-none sm:rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50"
             style={{ animation: "fadeIn 0.15s ease-out" }}>
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a] bg-black/40">
            <h3 className="text-white font-black text-sm uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#E50914]" /> Thông báo
              {unreadCount > 0 && (
                <span className="bg-[#E50914] text-white text-[10px] font-black rounded-full px-1.5 py-0.5">
                  {unreadCount}
                </span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleReadAll}
                  className="text-[11px] text-gray-500 hover:text-[#E50914] font-bold transition-colors flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Đọc tất cả
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[400px] divide-y divide-[#2a2a2a]/50">
            {loading ? (
              <div className="py-10 text-center">
                <div className="w-6 h-6 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-gray-500 text-xs">Đang tải...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                <p className="text-gray-500 text-sm font-medium">Chưa có thông báo</p>
              </div>
            ) : (
              notifications.map(notif => {
                const typeConfig = TYPE_ICONS[notif.type] || TYPE_ICONS.system;
                const Icon = typeConfig.icon;
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleRead(notif)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#222]
                      ${!notif.isRead ? "bg-[#1f1f1f]" : ""}`}
                  >
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-9 h-9 rounded-lg ${typeConfig.bg} flex items-center justify-center mt-0.5`}>
                      <Icon className={`w-4 h-4 ${typeConfig.color}`} />
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold leading-tight ${!notif.isRead ? "text-white" : "text-gray-400"}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-gray-600 mt-1">{timeAgo(notif.createdAt)}</p>
                    </div>
                    {/* Unread dot */}
                    {!notif.isRead && (
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-[#E50914] mt-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
