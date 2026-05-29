// src/pages/staff/StaffOverview.jsx
// =============================================
// STAFF OVERVIEW — Dashboard tổng quan ca làm việc
// =============================================
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../utils/api";
import {
  Ticket, DollarSign, Users, Clock, Monitor, QrCode,
  TrendingUp, Loader2, MapPin, Film,
} from "lucide-react";

const formatCurrency = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);

const fmtTime = (val) => {
  if (!val) return '—';
  const d = new Date(val.toString().replace('Z', ''));
  return isNaN(d) ? String(val) : d.toLocaleString('vi-VN');
};

export default function StaffOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/staff/dashboard');
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Không thể tải dữ liệu dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-gray-500 gap-3">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Đang tải dữ liệu...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="bg-red-900/20 border border-red-900/50 text-red-400 rounded-xl px-6 py-4 text-sm">
          {error}
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Vé đã bán hôm nay",
      value: data?.today?.ticketsSold ?? 0,
      icon: Ticket,
      color: "text-blue-400",
      bg: "bg-blue-900/20 border-blue-900/40",
    },
    {
      label: "Đơn hàng POS",
      value: data?.today?.totalBookings ?? 0,
      icon: Users,
      color: "text-purple-400",
      bg: "bg-purple-900/20 border-purple-900/40",
    },
    {
      label: "Doanh thu hôm nay",
      value: formatCurrency(data?.today?.totalRevenue ?? 0),
      icon: DollarSign,
      color: "text-green-400",
      bg: "bg-green-900/20 border-green-900/40",
      isText: true,
    },
    {
      label: "Suất chiếu còn lại",
      value: data?.upcomingShowtimes ?? 0,
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-900/20 border-amber-900/40",
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white mb-1">Tổng quan ca làm việc</h1>
        <p className="text-sm text-gray-500">
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Branch Info Card */}
      {data?.branch && (
        <div className="bg-gradient-to-r from-[#E50914]/10 to-[#E50914]/5 border border-[#E50914]/20 rounded-2xl p-5 mb-6 flex items-center gap-4">
          <div className="bg-[#E50914]/20 p-3 rounded-xl">
            <MapPin className="w-6 h-6 text-[#E50914]" />
          </div>
          <div>
            <p className="text-white font-black text-lg">{data.branch.name}</p>
            <p className="text-gray-400 text-sm">{data.branch.city} · {data.branch.address}</p>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className={`border rounded-2xl p-5 transition-all hover:scale-[1.02] ${stat.bg}`}>
            <div className="flex items-center justify-between mb-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <TrendingUp className="w-4 h-4 text-gray-600" />
            </div>
            <p className={`text-2xl font-black ${stat.isText ? 'text-lg' : ''} text-white`}>
              {stat.value}
            </p>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link
          to="/staff/pos"
          className="flex items-center gap-4 bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#E50914]/50 rounded-2xl p-5 transition-all group hover:shadow-[0_0_20px_rgba(229,9,20,0.1)]"
        >
          <div className="bg-[#E50914]/20 p-3 rounded-xl group-hover:bg-[#E50914]/30 transition-colors">
            <Monitor className="w-6 h-6 text-[#E50914]" />
          </div>
          <div>
            <p className="text-white font-black text-base">Bán vé mới</p>
            <p className="text-gray-500 text-xs">Mở giao diện POS bán vé</p>
          </div>
        </Link>
        <Link
          to="/staff/checkin"
          className="flex items-center gap-4 bg-[#1a1a1a] border border-[#2a2a2a] hover:border-green-500/50 rounded-2xl p-5 transition-all group hover:shadow-[0_0_20px_rgba(34,197,94,0.1)]"
        >
          <div className="bg-green-900/20 p-3 rounded-xl group-hover:bg-green-900/30 transition-colors">
            <QrCode className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <p className="text-white font-black text-base">Soát vé</p>
            <p className="text-gray-500 text-xs">Quét QR / Nhập mã vé</p>
          </div>
        </Link>
      </div>

      {/* Recent Bookings */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-[#2a2a2a] flex items-center justify-between">
          <h2 className="text-white font-black flex items-center gap-2">
            <Ticket className="w-5 h-5 text-[#E50914]" />
            Giao dịch gần nhất
          </h2>
          <span className="text-xs text-gray-500 font-bold uppercase">Hôm nay</span>
        </div>

        {data?.recentBookings?.length > 0 ? (
          <div className="divide-y divide-[#2a2a2a]">
            {data.recentBookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between px-5 py-4 hover:bg-[#222] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="bg-[#111] border border-[#333] w-10 h-10 rounded-xl flex items-center justify-center">
                    <Film className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{b.movieTitle}</p>
                    <p className="text-gray-500 text-xs">
                      #{b.id} · {b.roomName} · {fmtTime(b.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-black text-sm">{formatCurrency(b.totalAmount)}</p>
                  <p className="text-xs">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      b.status === 'paid' ? 'bg-green-900/30 text-green-400' :
                      b.status === 'used' ? 'bg-blue-900/30 text-blue-400' :
                      b.status === 'pending' ? 'bg-amber-900/30 text-amber-400' :
                      'bg-red-900/30 text-red-400'
                    }`}>
                      {b.status === 'paid' ? 'Đã TT' : b.status === 'used' ? 'Đã dùng' : b.status === 'pending' ? 'Chờ TT' : b.status}
                    </span>
                    {b.paymentMethod && (
                      <span className="text-gray-600 ml-1.5">
                        {b.paymentMethod === 'cash' ? '💵' : '💳'}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-600">
            <Ticket className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Chưa có giao dịch nào hôm nay.</p>
          </div>
        )}
      </div>
    </div>
  );
}
