import { useState, useEffect } from "react";
import api from "../../utils/api";
import {
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  DollarSign, Ticket, TrendingUp, TrendingDown, Radio,
  Users, AlertTriangle, Calendar, Filter, Download,
  Coffee, Film, Clock, Target,
} from "lucide-react";
import * as XLSX from "xlsx";

// ── Helpers ───────────────────────────────────────────────────────────────
const fmtVND = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);
const fmtShort = (n) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
};
const fmtPct = (n) => `${Number(n || 0).toFixed(1)}%`;

// ── Custom Tooltip ────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-3 shadow-2xl text-sm">
      <p className="text-gray-400 font-bold mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-black" style={{ color: p.color }}>
          {p.name}: {fmtVND(p.value)}
        </p>
      ))}
    </div>
  );
};

const HeatmapTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-3 shadow-2xl text-sm">
      <p className="text-gray-400 font-bold mb-1">{label}</p>
      <p className="text-yellow-400 font-black">{payload[0]?.value} vé</p>
    </div>
  );
};

// ── StatCard ──────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, accent, sub, subPositive }) {
  return (
    <div className="bg-[#1a1a1a] p-5 rounded-2xl border border-[#2a2a2a] hover:border-[#3a3a3a] transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon size={20} />
        </div>
        {sub && (
          <span className={`flex items-center gap-1 text-xs font-bold ${subPositive ? "text-green-400" : "text-red-400"}`}>
            {subPositive ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
            {sub}
          </span>
        )}
      </div>
      <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-xl font-black text-white leading-tight">{value}</h3>
    </div>
  );
}

// ── OccupancyRing ─────────────────────────────────────────────────────────
function OccupancyRing({ rate }) {
  const pct = Math.min(Number(rate || 0), 100);
  const r = 36, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 70 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#E50914";
  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="100" className="-rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#2a2a2a" strokeWidth="9"/>
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="9"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }}/>
      </svg>
      <span className="font-black text-white text-2xl -mt-14" style={{ color }}>{pct.toFixed(1)}%</span>
      <span className="text-gray-500 text-xs font-bold mt-8">Lấp đầy hôm nay</span>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const today        = new Date().toISOString().split("T")[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(sevenDaysAgo);
  const [endDate,   setEndDate]   = useState(today);

  const fetchStats = async () => {
    setLoading(true); setError("");
    try {
      const res = await api.get(`/admin/dashboard/stats?start_date=${startDate}&end_date=${endDate}`);
      setStats(res.data);
    } catch (err) {
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const handleExport = () => {
    if (!stats?.recent_bookings?.length) { alert("Không có dữ liệu!"); return; }
    const data = stats.recent_bookings.map((b, i) => ({
      STT: i + 1, "Mã GD": `HD-${b.id}`,
      "Khách hàng": b.user?.name || "POS",
      "Phim": b.showtime?.movie?.title || "—",
      "Số vé": b.total_tickets,
      "Tổng tiền": parseInt(b.total_price),
      "Kênh": b.paymentMethod === "cash" ? "POS" : "Online",
      "Ngày": new Date(String(b.created_at).replace("Z", "")).toLocaleString("vi-VN"),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Doanh_Thu");
    XLSX.writeFile(wb, `BaoCao_${startDate}_den_${endDate}.xlsx`);
  };

  const ov    = stats?.overview   || {};
  const live  = stats?.live       || {};
  const growth = ov.growthPercent;

  if (loading && !stats) return (
    <div className="flex justify-center items-center h-[70vh]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-gray-500 font-bold">Đang phân tích dữ liệu...</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen relative">
      {loading && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl">
          <span className="text-[#E50914] font-bold animate-pulse bg-[#111] px-6 py-3 rounded-xl border border-[#333]">Đang cập nhật...</span>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2a2a2a] pb-5">
        <div>
          <h1 className="text-3xl font-black text-white border-l-4 border-[#E50914] pl-3 uppercase tracking-wider">
            Cinema Dashboard
          </h1>
          <p className="text-gray-500 text-sm pl-4 mt-0.5">Phân tích nghiệp vụ rạp phim — Real-time</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 bg-[#1a1a1a] p-2 rounded-xl border border-[#2a2a2a]">
          <Calendar className="w-4 h-4 text-gray-500 ml-1"/>
          <input type="date" value={startDate} max={endDate}
            onChange={e => setStartDate(e.target.value)}
            className="bg-transparent text-sm text-white focus:outline-none [&::-webkit-calendar-picker-indicator]:invert"/>
          <span className="text-gray-600">→</span>
          <input type="date" value={endDate} min={startDate}
            onChange={e => setEndDate(e.target.value)}
            className="bg-transparent text-sm text-white focus:outline-none [&::-webkit-calendar-picker-indicator]:invert"/>
          <button onClick={fetchStats}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#E50914] hover:bg-[#c40812] text-white text-sm font-bold rounded-lg transition-colors">
            <Filter className="w-3.5 h-3.5"/>Lọc
          </button>
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg transition-colors">
            <Download className="w-3.5 h-3.5"/>Excel
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-700/40 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {/* ── ZONE 1: Live Operations Banner ───────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-[#E50914]/30 bg-gradient-to-r from-[#E50914]/10 via-[#1a1a1a] to-[#1a1a1a] p-5">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#E50914] rounded-l-2xl"/>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pl-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Radio className="w-7 h-7 text-[#E50914]"/>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#E50914] rounded-full animate-ping"/>
            </div>
            <div>
              <p className="text-xs font-bold text-[#E50914] uppercase tracking-widest">Live Operations</p>
              <h2 className="text-white font-black text-lg leading-tight">
                {live.showtimes > 0
                  ? `🎬 ${live.showtimes} suất đang chiếu — ${live.audience} khách tại rạp`
                  : "⏸️ Hiện không có suất chiếu nào đang diễn ra"}
              </h2>
            </div>
          </div>
          <div className="flex gap-6 pl-10 sm:pl-0">
            <div className="text-center">
              <p className="text-2xl font-black text-white">{live.showtimes ?? 0}</p>
              <p className="text-xs text-gray-500 font-bold uppercase">Suất live</p>
            </div>
            <div className="w-px bg-[#2a2a2a]"/>
            <div className="text-center">
              <p className="text-2xl font-black text-[#E50914]">{live.audience ?? 0}</p>
              <p className="text-xs text-gray-500 font-bold uppercase">Khán giả</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── ZONE 2: Key Metrics ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Doanh thu tháng này"
          value={fmtVND(ov.currentMonthRevenue)}
          icon={TrendingUp}
          accent="bg-green-500/10 text-green-400"
          sub={growth != null ? `${growth >= 0 ? "+" : ""}${growth}% tháng trước` : null}
          subPositive={growth >= 0}
        />
        <StatCard
          label="Doanh thu Bắp Nước (tháng)"
          value={fmtVND(ov.concessionRevenue)}
          icon={Coffee}
          accent="bg-orange-500/10 text-orange-400"
          sub={ov.ticketRevenue > 0
            ? `${fmtPct(ov.concessionRevenue * 100 / (ov.ticketRevenue + ov.concessionRevenue))} tổng revenue`
            : null}
          subPositive={true}
        />
        <StatCard
          label="Vé bán (khoảng lọc)"
          value={`${ov.totalTickets ?? 0} vé`}
          icon={Ticket}
          accent="bg-yellow-500/10 text-yellow-400"
          sub={ov.totalOrders ? `${ov.totalOrders} đơn hàng` : null}
          subPositive={true}
        />

        {/* Occupancy Card riêng với Ring */}
        <div className="bg-[#1a1a1a] p-5 rounded-2xl border border-[#2a2a2a] hover:border-[#3a3a3a] transition-all flex items-center justify-around gap-4">
          <OccupancyRing rate={ov.occupancyRate}/>
          <div className="text-right">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Ghế bán hôm nay</p>
            <p className="text-white font-black text-xl">{ov.soldSeatsToday ?? 0}</p>
            <p className="text-gray-600 text-xs mt-0.5">/ {ov.totalSeatsToday ?? 0} ghế</p>
          </div>
        </div>
      </div>

      {/* ── ZONE 3: Biểu đồ phân tích ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Stacked Bar Chart: Vé + Bắp nước 7 ngày */}
        <div className="lg:col-span-2 bg-[#1a1a1a] p-6 rounded-2xl border border-[#2a2a2a]">
          <h3 className="text-sm font-black text-white mb-5 uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#E50914]"/>
            Doanh Thu: Vé vs Bắp Nước ({startDate} → {endDate})
          </h3>
          <div className="h-72">
            {stats?.stacked_chart?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.stacked_chart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false}/>
                  <XAxis dataKey="date" stroke="#444" tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false}/>
                  <YAxis stroke="#444" tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmtShort}/>
                  <Tooltip content={<ChartTooltip/>}/>
                  <Legend iconType="circle" iconSize={8}
                    formatter={(v) => <span className="text-gray-400 text-xs font-bold">{v}</span>}/>
                  <Bar dataKey="ticket_revenue"     name="Vé" fill="#E50914"  radius={[4,4,0,0]} stackId="a"/>
                  <Bar dataKey="concession_revenue" name="Bắp & Nước" fill="#f59e0b" radius={[4,4,0,0]} stackId="a"/>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-600 italic text-sm">Chưa có dữ liệu.</div>
            )}
          </div>
        </div>

        {/* Heatmap khung giờ */}
        <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#2a2a2a]">
          <h3 className="text-sm font-black text-white mb-5 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#E50914]"/>
            Khung Giờ Vàng
          </h3>
          {stats?.heatmap?.length > 0 ? (
            <>
              <div className="h-48 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={stats.heatmap}>
                    <PolarGrid stroke="#2a2a2a"/>
                    <PolarAngleAxis dataKey="time_slot" tick={{ fill: "#666", fontSize: 10 }}/>
                    <Radar name="Vé bán" dataKey="tickets_sold" fill="#E50914" fillOpacity={0.3} stroke="#E50914" strokeWidth={2}/>
                    <Tooltip content={<HeatmapTooltip/>}/>
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {stats.heatmap.map((h, i) => {
                  const max = Math.max(...stats.heatmap.map(x => x.tickets_sold));
                  const pct = max > 0 ? (h.tickets_sold / max) * 100 : 0;
                  const colors = ["#E50914", "#f59e0b", "#3b82f6"];
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-gray-400">{h.time_slot}</span>
                        <span className="text-white">{h.tickets_sold} vé</span>
                      </div>
                      <div className="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: colors[i] || "#666" }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-600 italic text-sm">Chưa có dữ liệu.</div>
          )}
        </div>
      </div>

      {/* ── ZONE 4: Top Phim + Cảnh báo suất trống ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top 5 phim */}
        <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#2a2a2a]">
          <h3 className="text-sm font-black text-white mb-5 uppercase tracking-wider flex items-center gap-2">
            <Film className="w-4 h-4 text-[#E50914]"/>
            BXH Phim Doanh Thu Cao
          </h3>
          <div className="space-y-3">
            {stats?.top_movies?.length > 0 ? stats.top_movies.map((m, i) => {
              const medals = ["bg-yellow-500 text-black","bg-gray-300 text-black","bg-orange-400 text-black","bg-[#222] text-gray-400","bg-[#222] text-gray-400"];
              const maxRev = Number(stats.top_movies[0]?.totalRevenue || 1);
              const barPct = (Number(m.totalRevenue) / maxRev) * 100;
              return (
                <div key={m.id} className="relative bg-[#111] rounded-xl p-3 border border-[#222] hover:border-[#333] transition-colors overflow-hidden">
                  <div className="absolute bottom-0 left-0 h-0.5 bg-[#E50914]/30 transition-all duration-700" style={{ width: `${barPct}%` }}/>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 ${medals[i]}`}>{i+1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm truncate">{m.title}</p>
                      <p className="text-gray-500 text-xs">{m.totalTickets} vé · {m.totalOrders} đơn</p>
                    </div>
                    <p className="text-green-400 font-black text-sm shrink-0">{fmtVND(m.totalRevenue)}</p>
                  </div>
                </div>
              );
            }) : (
              <div className="py-10 text-center text-gray-600 italic text-sm">Chưa có dữ liệu phim.</div>
            )}
          </div>
        </div>

        {/* Cảnh báo suất chiếu ế */}
        <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-yellow-900/40">
          <h3 className="text-sm font-black text-white mb-5 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400"/>
            Cảnh Báo Suất Chiếu Trống
            <span className="ml-auto text-[10px] text-yellow-600 font-bold bg-yellow-900/20 border border-yellow-900/40 px-2 py-0.5 rounded-full">{"<"} 15% lấp đầy · 7 ngày tới</span>
          </h3>
          <div className="space-y-2">
            {stats?.low_occupancy_alerts?.length > 0 ? stats.low_occupancy_alerts.map((s) => {
              const pct = Number(s.occupancyRate);
              const urgency = pct < 5 ? "border-red-700/60 bg-red-900/10" : "border-yellow-800/40 bg-yellow-900/5";
              const badgeColor = pct < 5 ? "text-red-400" : "text-yellow-400";
              return (
                <div key={s.showtimeId} className={`rounded-xl p-3 border ${urgency} flex items-center gap-3`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{s.movieTitle}</p>
                    <p className="text-gray-500 text-xs">
                      {s.roomName} · {new Date((s.startTime ?? '').toString().replace('Z', '')).toLocaleString("vi-VN", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-black text-base ${badgeColor}`}>{fmtPct(pct)}</p>
                    <p className="text-gray-600 text-[10px]">{s.soldSeats}/{s.totalSeats} ghế</p>
                  </div>
                </div>
              );
            }) : (
              <div className="py-10 text-center">
                <Target className="w-10 h-10 text-green-600 mx-auto mb-2"/>
                <p className="text-green-400 font-bold text-sm">Tất cả suất chiếu đều ổn!</p>
                <p className="text-gray-600 text-xs mt-1">Không có suất nào bán dưới 15%</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── ZONE 5: Giao dịch gần nhất ──────────────────────────────────── */}
      <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#2a2a2a]">
        <h3 className="text-sm font-black text-white mb-5 uppercase tracking-wider flex items-center gap-2">
          <Users className="w-4 h-4 text-[#E50914]"/>
          Giao Dịch Gần Nhất
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#2a2a2a] text-gray-500 text-xs uppercase tracking-wider">
                <th className="pb-3 font-bold">Khách hàng</th>
                <th className="pb-3 font-bold">Phim</th>
                <th className="pb-3 font-bold text-center">Vé</th>
                <th className="pb-3 font-bold">Tổng tiền</th>
                <th className="pb-3 font-bold">Kênh</th>
                <th className="pb-3 font-bold">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f1f]">
              {stats?.recent_bookings?.length > 0 ? stats.recent_bookings.map(b => (
                <tr key={b.id} className="hover:bg-[#111] transition-colors">
                  <td className="py-3.5 font-bold text-white">{b.user?.name || "POS"}</td>
                  <td className="py-3.5 text-gray-400 max-w-[150px] truncate">{b.showtime?.movie?.title || "—"}</td>
                  <td className="py-3.5 text-yellow-400 font-bold text-center">{b.total_tickets}</td>
                  <td className="py-3.5 text-green-400 font-black">{fmtVND(b.total_price)}</td>
                  <td className="py-3.5">
                    {b.paymentMethod === "cash"
                      ? <span className="bg-blue-900/40 text-blue-300 border border-blue-900/50 px-2 py-0.5 rounded text-xs font-bold">POS</span>
                      : <span className="bg-[#E50914]/10 text-red-300 border border-[#E50914]/30 px-2 py-0.5 rounded text-xs font-bold">Online</span>}
                  </td>
                  <td className="py-3.5 text-gray-600 text-xs">{new Date(String(b.created_at).replace("Z", "")).toLocaleString("vi-VN")}</td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="py-8 text-center text-gray-600 italic">Chưa có giao dịch nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
