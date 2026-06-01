import { useState, useEffect } from "react";
import api from "../../utils/api";
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  DollarSign, Ticket, TrendingUp, TrendingDown,
  AlertTriangle, Download, Coffee, Film,
  Clock, Target, Building2, CreditCard, Crown,
  Award, Star, Zap, BarChart2, XCircle, Armchair,
  Activity, Users, ShoppingBag, Eye,
} from "lucide-react";
import * as XLSX from "xlsx";

// ── Helpers ───────────────────────────────────────────────────────────────
const fmtVND = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);
const fmtShort = (n) => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n ?? 0);
};
const fmtPct = (n) => `${Number(n || 0).toFixed(1)}%`;
const timeAgo = (val) => {
  if (!val) return '—';
  const d = new Date(val.toString().replace('Z', ''));
  if (isNaN(d)) return String(val);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
};

// ── Palette & Constants ──────────────────────────────────────────────────
const TIER_COLORS = {
  bronze:   { bg: "bg-orange-900/20", border: "border-orange-700/40", text: "text-orange-400", fill: "#f97316" },
  silver:   { bg: "bg-gray-700/20",   border: "border-gray-500/40",   text: "text-gray-300",   fill: "#9ca3af" },
  gold:     { bg: "bg-yellow-900/20", border: "border-yellow-600/40", text: "text-yellow-400", fill: "#eab308" },
  platinum: { bg: "bg-purple-900/20", border: "border-purple-600/40", text: "text-purple-400", fill: "#a855f7" },
};
const TIER_LABELS = { bronze: "Đồng", silver: "Bạc", gold: "Vàng", platinum: "Kim cương" };
const TIER_ICONS = { bronze: Award, silver: Star, gold: Crown, platinum: Zap };
const PAYMENT_COLORS = ["#E50914", "#3b82f6", "#10b981", "#f59e0b", "#a855f7", "#ec4899"];
const PAYMENT_LABELS = {
  cash: "Tiền mặt (POS)", vnpay: "VNPay", momo: "MoMo",
  zalopay: "ZaloPay", credit_card: "Thẻ tín dụng", bank_transfer: "Chuyển khoản",
};

const HEATMAP_EMOJI = {
  'Buổi sáng (8h–12h)': '🌅',
  'Buổi trưa (12h–16h)': '☀️',
  'Buổi chiều (16h–19h)': '🌆',
  'Giờ vàng (19h–22h)': '🌃',
  'Suất khuya (22h+)': '🌙',
};
const HEATMAP_GRADIENTS = [
  'from-blue-500/80 to-blue-600/80',
  'from-emerald-500/80 to-emerald-600/80',
  'from-amber-500/80 to-amber-600/80',
  'from-red-500/80 to-red-600/80',
  'from-purple-500/80 to-purple-600/80',
];

// ── Period Presets ────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split("T")[0];
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().split("T")[0];
const monthStart = () => { const d = new Date(); d.setDate(1); return d.toISOString().split("T")[0]; };

const PRESETS = [
  { label: "Hôm nay", getRange: () => [today(), today()] },
  { label: "7 ngày", getRange: () => [daysAgo(6), today()] },
  { label: "30 ngày", getRange: () => [daysAgo(29), today()] },
  { label: "Tháng này", getRange: () => [monthStart(), today()] },
];

// ── Custom Tooltips ──────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-3 shadow-2xl text-sm">
      <p className="text-gray-400 font-bold mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-black" style={{ color: p.color || p.stroke }}>
          {p.name}: {fmtVND(p.value)}
        </p>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-3 shadow-2xl text-sm">
      <p className="text-gray-400 font-bold mb-1">{d.name}</p>
      <p className="font-black" style={{ color: d.payload?.fill }}>{fmtVND(d.value)}</p>
      {d.payload?.orderCount != null && <p className="text-gray-500 text-xs">{d.payload.orderCount} đơn hàng</p>}
    </div>
  );
};

// ── Skeleton Shimmer ─────────────────────────────────────────────────────
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-gradient-to-r from-[#1a1a1a] via-[#252525] to-[#1a1a1a] bg-[length:200%_100%] rounded-xl ${className}`}
    style={{ animation: 'shimmer 1.5s ease-in-out infinite' }} />
);

const SkeletonDashboard = () => (
  <div className="p-6 md:p-8 space-y-6 min-h-screen">
    <div className="flex justify-between items-center border-b border-[#2a2a2a] pb-5">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-10 w-96" />
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-32" />)}
    </div>
    <div className="grid grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Skeleton className="lg:col-span-2 h-80" />
      <Skeleton className="h-80" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64" />)}
    </div>
    <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
  </div>
);

// ── KPI Card ──────────────────────────────────────────────────────────────
function KPICard({ label, value, change, icon: Icon, accent, delay = 0 }) {
  const isPositive = change >= 0;
  return (
    <div className="bg-[#1a1a1a] p-5 rounded-2xl border border-[#2a2a2a] hover:border-[#3a3a3a] transition-all duration-300 hover:shadow-lg hover:shadow-black/20 hover:scale-[1.02]"
      style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon size={18} />
        </div>
        {change != null && (
          <div className={`flex items-center gap-1 text-xs font-black px-2 py-1 rounded-lg ${
            isPositive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
          }`}>
            {isPositive ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
            {isPositive ? "+" : ""}{change}%
          </div>
        )}
      </div>
      <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest mb-1">{label}</p>
      <p className="text-white font-black text-xl leading-tight">{value}</p>
      {change != null && (
        <p className="text-gray-600 text-[10px] mt-1">so với kỳ trước</p>
      )}
    </div>
  );
}

// ── Mini KPI Card (secondary row) ─────────────────────────────────────────
function MiniKPI({ label, value, icon: Icon, accent, suffix = "" }) {
  return (
    <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-[#2a2a2a] hover:border-[#3a3a3a] transition-all duration-300 flex items-center gap-4 hover:shadow-lg hover:shadow-black/20">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">{label}</p>
        <p className="text-white font-black text-lg leading-tight">{value}{suffix && <span className="text-gray-500 text-xs ml-1">{suffix}</span>}</p>
      </div>
    </div>
  );
}

// ── Bento Card wrapper ───────────────────────────────────────────────────
function BentoCard({ title, icon: Icon, iconColor = "text-[#E50914]", badge, children, className = "" }) {
  return (
    <div className={`bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] hover:border-[#333] transition-all duration-300 overflow-hidden ${className}`}>
      <div className="px-5 py-4 border-b border-[#2a2a2a] flex items-center justify-between">
        <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Icon className={`w-4 h-4 ${iconColor}`} />
          {title}
        </h3>
        {badge != null && badge > 0 && (
          <span className="bg-yellow-500/20 text-yellow-400 text-[10px] font-black px-2 py-0.5 rounded-full">{badge}</span>
        )}
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePreset, setActivePreset] = useState(1); // "7 ngày" by default
  const [customDateOpen, setCustomDateOpen] = useState(false);
  const [alertsModalOpen, setAlertsModalOpen] = useState(false);

  const initialRange = PRESETS[1].getRange();
  const [startDate, setStartDate] = useState(initialRange[0]);
  const [endDate, setEndDate] = useState(initialRange[1]);

  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");

  useEffect(() => {
    api.get("/admin/branches").then(res => setBranches(res.data?.data ?? res.data)).catch(() => {});
  }, []);

  const fetchStats = async () => {
    setLoading(true); setError("");
    try {
      let url = `/admin/dashboard/stats?start_date=${startDate}&end_date=${endDate}`;
      if (selectedBranchId) url += `&branch_id=${selectedBranchId}`;
      const res = await api.get(url);
      setStats(res.data);
    } catch { setError("Không thể tải dữ liệu."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStats(); }, [startDate, endDate, selectedBranchId]);

  const selectPreset = (i) => {
    setActivePreset(i);
    setCustomDateOpen(false);
    const [s, e] = PRESETS[i].getRange();
    setStartDate(s); setEndDate(e);
  };

  // ── Export ──────────────────────────────────────────────────────────────
  const handleExport = () => {
    if (!stats) { alert("Không có dữ liệu!"); return; }
    const kpi = stats.kpi || {};
    const data = [
      { "Chỉ số": "Doanh thu", "Giá trị": kpi.totalRevenue, "Kỳ trước": kpi.prevTotalRevenue, "Thay đổi": `${kpi.revenueChange}%` },
      { "Chỉ số": "Đơn hàng", "Giá trị": kpi.totalOrders, "Kỳ trước": kpi.prevTotalOrders, "Thay đổi": `${kpi.ordersChange}%` },
      { "Chỉ số": "Vé bán", "Giá trị": kpi.totalTickets, "Kỳ trước": kpi.prevTotalTickets, "Thay đổi": `${kpi.ticketsChange}%` },
      { "Chỉ số": "Doanh thu F&B", "Giá trị": kpi.concessionRevenue, "Kỳ trước": kpi.prevConcessionRevenue, "Thay đổi": `${kpi.concessionChange}%` },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "KPI");
    if (stats.stacked_chart?.length) {
      const ws2 = XLSX.utils.json_to_sheet(stats.stacked_chart);
      XLSX.utils.book_append_sheet(wb, ws2, "Doanh_thu_ngay");
    }
    XLSX.writeFile(wb, `Dashboard_${startDate}_${endDate}.xlsx`);
  };

  // ── Derived ─────────────────────────────────────────────────────────────
  const kpi = stats?.kpi || {};
  const live = stats?.live || {};
  const isAllBranch = !selectedBranchId;
  const selectedBranchName = selectedBranchId
    ? branches.find(b => String(b.id) === String(selectedBranchId))?.name || ""
    : "";

  // Branch bar data
  const branchBarData = (stats?.branch_comparison || []).filter(b => b.totalRevenue > 0 || b.totalTickets > 0);

  // Payment donut
  const paymentPieData = (stats?.payment_methods || []).map((p, i) => ({
    name: PAYMENT_LABELS[p.method] || p.method,
    value: p.revenue,
    orderCount: p.orderCount,
    fill: PAYMENT_COLORS[i % PAYMENT_COLORS.length],
  }));

  // Tier data
  const tierData = stats?.member_tiers || [];
  const totalMembers = tierData.reduce((s, t) => s + t.count, 0);
  const tierPieData = tierData.map(t => ({
    name: TIER_LABELS[t.tier] || t.tier,
    value: t.count,
    fill: TIER_COLORS[t.tier]?.fill || "#666",
    tier: t.tier,
  }));

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading && !stats) return <SkeletonDashboard />;

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen relative">
      {loading && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl">
          <span className="text-[#E50914] font-bold animate-pulse bg-[#111] px-6 py-3 rounded-xl border border-[#333]">Đang cập nhật...</span>
        </div>
      )}

      {/* ══════════ HEADER ══════════ */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#2a2a2a] pb-5">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-black text-white border-l-4 border-[#E50914] pl-3 uppercase tracking-wider truncate" title={isAllBranch ? "Tổng quan hệ thống" : `Chi nhánh: ${selectedBranchName}`}>
            {isAllBranch ? "Tổng quan hệ thống" : `Chi nhánh: ${selectedBranchName}`}
          </h1>
          <p className="text-gray-500 text-xs pl-4 mt-0.5 truncate" title={isAllBranch ? "Phân tích toàn bộ chuỗi rạp phim" : `Dữ liệu chi tiết — ${selectedBranchName}`}>
            {isAllBranch ? "Phân tích toàn bộ chuỗi rạp phim" : `Dữ liệu chi tiết — ${selectedBranchName}`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap lg:justify-end xl:flex-nowrap">
          {/* Live Pulse */}
          {(live.showtimes > 0 || live.audience > 0) && (
            <div className="flex items-center gap-2 bg-[#1a1a1a] border border-emerald-800/40 rounded-xl px-3 py-2 mr-1">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-emerald-400 text-xs font-bold">
                {live.showtimes} suất đang chiếu
              </span>
              {live.audience > 0 && (
                <span className="text-emerald-300/60 text-xs">· {live.audience} khán giả</span>
              )}
            </div>
          )}

          {/* Preset buttons */}
          <div className="flex bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-1 gap-0.5">
            {PRESETS.map((p, i) => (
              <button key={i} onClick={() => selectPreset(i)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                  activePreset === i && !customDateOpen
                    ? "bg-[#E50914] text-white shadow-lg"
                    : "text-gray-400 hover:text-white hover:bg-[#222]"
                }`}>
                {p.label}
              </button>
            ))}
            <button onClick={() => { setCustomDateOpen(!customDateOpen); setActivePreset(-1); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                customDateOpen ? "bg-[#E50914] text-white" : "text-gray-400 hover:text-white hover:bg-[#222]"
              }`}>
              Tùy chọn
            </button>
          </div>

          {/* Custom date picker */}
          {customDateOpen && (
            <div className="flex items-center gap-1.5 bg-[#1a1a1a] px-2 py-1 rounded-xl border border-[#2a2a2a]">
              <input type="date" value={startDate} max={endDate}
                onChange={e => setStartDate(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none [&::-webkit-calendar-picker-indicator]:invert w-[100px]"/>
              <span className="text-gray-600 text-xs">→</span>
              <input type="date" value={endDate} min={startDate}
                onChange={e => setEndDate(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none [&::-webkit-calendar-picker-indicator]:invert w-[100px]"/>
            </div>
          )}

          {/* Branch filter */}
          <select value={selectedBranchId} onChange={e => setSelectedBranchId(e.target.value)}
            className="bg-[#1a1a1a] text-xs text-white border border-[#2a2a2a] rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#E50914] font-bold w-40 md:w-48 max-w-full">
            <option value="">Tất cả chi nhánh</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>

          {/* Export */}
          <button onClick={handleExport}
            className="flex items-center gap-1 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors">
            <Download className="w-3.5 h-3.5"/>Excel
          </button>
        </div>
      </div>

      {error && <div className="bg-red-900/20 border border-red-700/40 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {/* ══════════ SECTION 1: KPI STRIP (5 primary) ══════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard label="Doanh thu" value={fmtVND(kpi.totalRevenue)} change={kpi.revenueChange}
          icon={DollarSign} accent="bg-green-500/10 text-green-400" delay={0}/>
        <KPICard label="Đơn hàng" value={kpi.totalOrders ?? 0} change={kpi.ordersChange}
          icon={Ticket} accent="bg-blue-500/10 text-blue-400" delay={50}/>
        <KPICard label="Vé bán" value={`${kpi.totalTickets ?? 0} vé`} change={kpi.ticketsChange}
          icon={TrendingUp} accent="bg-yellow-500/10 text-yellow-400" delay={100}/>
        <KPICard label="Doanh thu F&B" value={fmtVND(kpi.concessionRevenue)} change={kpi.concessionChange}
          icon={Coffee} accent="bg-orange-500/10 text-orange-400" delay={150}/>
        {/* Occupancy — progress bar */}
        <div className="bg-[#1a1a1a] p-5 rounded-2xl border border-[#2a2a2a] hover:border-[#3a3a3a] transition-all duration-300 hover:shadow-lg hover:shadow-black/20">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/10 text-purple-400">
              <Target size={18}/>
            </div>
          </div>
          <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest mb-1">Lấp đầy hôm nay</p>
          <p className="text-white font-black text-xl mb-2">{fmtPct(kpi.occupancyRate)}</p>
          <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(kpi.occupancyRate || 0, 100)}%`,
                background: (kpi.occupancyRate || 0) >= 70 ? "#10b981" : (kpi.occupancyRate || 0) >= 40 ? "#f59e0b" : "#E50914"
              }}/>
          </div>
          <p className="text-gray-600 text-[10px] mt-1">{kpi.soldSeatsToday}/{kpi.totalSeatsToday} ghế</p>
        </div>
      </div>

      {/* ══════════ SECTION 1.5: Secondary KPI Row (3 new metrics) ══════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MiniKPI label="Giá vé trung bình" value={fmtVND(stats?.avg_ticket_price || 0)}
          icon={BarChart2} accent="bg-cyan-500/10 text-cyan-400" />
        <MiniKPI label="Doanh thu / ghế" value={fmtVND(stats?.revenue_per_seat || 0)}
          icon={Armchair} accent="bg-emerald-500/10 text-emerald-400" />
        <MiniKPI label="Tỷ lệ hủy đơn" value={fmtPct(stats?.cancel_rate || 0)}
          icon={XCircle}
          accent={`${(stats?.cancel_rate || 0) > 10 ? 'bg-red-500/10 text-red-400' : 'bg-gray-500/10 text-gray-400'}`}
          suffix={`${stats?.cancel_stats?.cancelled || 0}/${stats?.cancel_stats?.total || 0} đơn`} />
      </div>

      {/* ══════════ SECTION 2+3: Revenue Chart + Branch Performance ══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Revenue Trend — Area Chart */}
        <div className="lg:col-span-2 bg-[#1a1a1a] p-6 rounded-2xl border border-[#2a2a2a]">
          <h3 className="text-sm font-black text-white mb-5 uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#E50914]"/>
            Xu hướng doanh thu
            <span className="text-[10px] text-gray-600 font-normal normal-case ml-1">(Vé + F&B theo ngày)</span>
          </h3>
          <div className="h-72">
            {stats?.stacked_chart?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.stacked_chart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradTicket" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E50914" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#E50914" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gradFB" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false}/>
                  <XAxis dataKey="date" stroke="#444" tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false}/>
                  <YAxis stroke="#444" tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmtShort}/>
                  <Tooltip content={<ChartTooltip/>}/>
                  <Legend iconType="circle" iconSize={8}
                    formatter={(v) => <span className="text-gray-400 text-xs font-bold">{v}</span>}/>
                  <Area type="monotone" dataKey="ticket_revenue" name="Vé" stroke="#E50914" strokeWidth={2}
                    fill="url(#gradTicket)" stackId="1"/>
                  <Area type="monotone" dataKey="concession_revenue" name="Bắp & Nước" stroke="#f59e0b" strokeWidth={2}
                    fill="url(#gradFB)" stackId="1"/>
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-600 italic text-sm">Chưa có dữ liệu doanh thu.</div>
            )}
          </div>
        </div>

        {/* Branch Performance — Horizontal Bar */}
        <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#2a2a2a]">
          <h3 className="text-sm font-black text-white mb-5 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#E50914]"/>
            {isAllBranch ? "Hiệu suất chi nhánh" : "Thông tin chi nhánh"}
          </h3>
          {isAllBranch && branchBarData.length > 0 ? (
            <div className="space-y-4">
              {branchBarData.map((b, i) => {
                const maxRev = branchBarData[0]?.totalRevenue || 1;
                const pct = (b.totalRevenue / maxRev) * 100;
                const medals = ["🥇", "🥈", "🥉"];
                return (
                  <div key={b.id}>
                    <div className="flex items-baseline justify-between mb-1.5">
                      <span className="text-white text-sm font-bold flex items-center gap-1.5">
                        {medals[i] ? <span className="text-base">{medals[i]}</span> : <span className="text-gray-600 text-xs w-5">{i+1}.</span>}
                        {b.name}
                      </span>
                      <span className="text-green-400 text-xs font-black">{fmtVND(b.totalRevenue)}</span>
                    </div>
                    <div className="h-2.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-[#E50914] to-[#ff4444]"
                        style={{ width: `${pct}%` }}/>
                    </div>
                    <div className="flex gap-3 mt-1">
                      <span className="text-gray-600 text-[10px]">{b.totalTickets} vé</span>
                      <span className="text-gray-600 text-[10px]">{b.totalOrders} đơn</span>
                      <span className="text-gray-600 text-[10px]">Lấp đầy {fmtPct(b.occupancyRate)}</span>
                    </div>
                  </div>
                );
              })}
              {(stats?.branch_comparison || []).length > branchBarData.length && (
                <p className="text-gray-700 text-xs italic text-center pt-1">
                  + {(stats?.branch_comparison || []).length - branchBarData.length} chi nhánh chưa có dữ liệu
                </p>
              )}
            </div>
          ) : isAllBranch ? (
            <div className="flex items-center justify-center h-40 text-gray-600 italic text-sm">Chưa có dữ liệu chi nhánh.</div>
          ) : (
            <div className="space-y-3">
              <div className="bg-[#111] rounded-xl p-4 border border-[#222]">
                <p className="text-gray-500 text-xs uppercase font-bold mb-1">Lấp đầy hôm nay</p>
                <p className="text-white font-black text-2xl">{fmtPct(kpi.occupancyRate)}</p>
              </div>
              <div className="bg-[#111] rounded-xl p-4 border border-[#222]">
                <p className="text-gray-500 text-xs uppercase font-bold mb-1">Ghế bán hôm nay</p>
                <p className="text-white font-black text-2xl">{kpi.soldSeatsToday} <span className="text-gray-600 text-sm">/ {kpi.totalSeatsToday}</span></p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════ SECTION 4: BENTO GRID ANALYTICS ══════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* ── Card: Top Phim ── */}
        <BentoCard title="Phim hàng đầu" icon={Film}>
          {stats?.top_movies?.length > 0 ? (
            <div className="space-y-3">
              {stats.top_movies.map((m, i) => {
                const medals = ["🥇", "🥈", "🥉"];
                const medalBg = ["bg-yellow-500/10", "bg-gray-500/10", "bg-orange-500/10"];
                return (
                  <div key={m.id} className={`flex items-center gap-3 p-2.5 rounded-xl ${medalBg[i] || 'bg-[#111]'} border border-[#222] hover:border-[#333] transition-colors`}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#111] border border-[#333] shrink-0 text-sm font-black">
                      {medals[i] || <span className="text-gray-500">{i+1}</span>}
                    </div>
                    {m.poster && (
                      <img src={`/${m.poster}`} alt="" className="w-8 h-11 rounded object-cover shrink-0 border border-[#333]"
                        onError={e => { e.target.style.display = 'none'; }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-xs truncate">{m.title}</p>
                      <p className="text-gray-500 text-[10px]">{m.totalTickets} vé · {m.totalOrders} đơn</p>
                    </div>
                    <p className="text-green-400 font-black text-xs shrink-0">{fmtShort(m.totalRevenue)}</p>
                  </div>
                );
              })}
            </div>
          ) : <div className="py-6 text-center text-gray-600 italic text-sm">Chưa có dữ liệu phim.</div>}
        </BentoCard>

        {/* ── Card: Khung giờ vàng ── */}
        <BentoCard title="Khung giờ vàng" icon={Clock}>
          {stats?.heatmap?.length > 0 ? (
            <div className="space-y-3">
              {stats.heatmap.map((h, i) => {
                const max = Math.max(...stats.heatmap.map(x => x.tickets_sold), 1);
                const pct = (h.tickets_sold / max) * 100;
                const emoji = HEATMAP_EMOJI[h.time_slot] || '🕐';
                return (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-white text-xs font-bold flex items-center gap-1.5">
                        <span className="text-base">{emoji}</span>
                        {h.time_slot.replace(/\(.*\)/, '').trim()}
                      </span>
                      <div className="text-right">
                        <span className="text-white font-black text-xs">{h.tickets_sold} vé</span>
                        <span className="text-gray-600 text-[10px] ml-1.5">{fmtShort(h.revenue)}</span>
                      </div>
                    </div>
                    <div className="h-2.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${HEATMAP_GRADIENTS[i] || 'from-gray-500 to-gray-600'}`}
                        style={{ width: `${pct}%` }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <div className="py-6 text-center text-gray-600 italic text-sm">Chưa có dữ liệu khung giờ.</div>}
        </BentoCard>

        {/* ── Card: Kênh thanh toán ── */}
        <BentoCard title="Kênh thanh toán" icon={CreditCard}>
          {paymentPieData.length > 0 ? (
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentPieData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={3} dataKey="value" stroke="none">
                      {paymentPieData.map((e, idx) => <Cell key={idx} fill={e.fill}/>)}
                    </Pie>
                    <Tooltip content={<PieTooltip/>}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {paymentPieData.map((p, i) => {
                  const totalRev = paymentPieData.reduce((s, x) => s + x.value, 0);
                  const pct = totalRev > 0 ? (p.value / totalRev) * 100 : 0;
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.fill }}/>
                      <span className="text-gray-300 text-[11px] font-bold flex-1 truncate">{p.name}</span>
                      <span className="text-white text-[11px] font-black">{fmtPct(pct)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : <div className="py-6 text-center text-gray-600 italic text-sm">Chưa có dữ liệu thanh toán.</div>}
        </BentoCard>

        {/* ── Card: Top F&B ── */}
        <BentoCard title="F&B bán chạy" icon={ShoppingBag} iconColor="text-orange-400">
          {stats?.top_concessions?.length > 0 ? (
            <div className="space-y-2.5">
              {stats.top_concessions.map((c, i) => {
                const max = stats.top_concessions[0]?.totalQty || 1;
                const pct = (c.totalQty / max) * 100;
                return (
                  <div key={c.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-xs font-bold flex items-center gap-1.5">
                        <span className="text-base">{['🍿', '🥤', '🌽', '🧃', '🎁'][i] || '📦'}</span>
                        <span className="truncate max-w-[120px]">{c.name}</span>
                      </span>
                      <div className="text-right">
                        <span className="text-amber-400 font-black text-xs">{c.totalQty}</span>
                        <span className="text-gray-600 text-[10px] ml-1.5">{fmtShort(c.totalRevenue)}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-amber-500 to-orange-500"
                        style={{ width: `${pct}%` }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <div className="py-6 text-center text-gray-600 italic text-sm">Chưa có dữ liệu F&B.</div>}
        </BentoCard>

        {/* ── Card: Thành viên ── */}
        <BentoCard title="Thành viên" icon={Crown} iconColor="text-yellow-400">
          {tierData.length > 0 ? (
            <div className="flex items-center gap-4">
              <div className="w-28 h-28 shrink-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={tierPieData} cx="50%" cy="50%" innerRadius={28} outerRadius={48} paddingAngle={3} dataKey="value" stroke="none">
                      {tierPieData.map((e, idx) => <Cell key={idx} fill={e.fill}/>)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-white font-black text-sm">{totalMembers}</p>
                    <p className="text-gray-500 text-[8px] font-bold uppercase">TV</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 space-y-1.5">
                {tierData.map(t => {
                  const TierIcon = TIER_ICONS[t.tier] || Award;
                  const colors = TIER_COLORS[t.tier] || TIER_COLORS.bronze;
                  const pct = totalMembers > 0 ? (t.count / totalMembers) * 100 : 0;
                  return (
                    <div key={t.tier} className={`rounded-lg p-2 border ${colors.border} ${colors.bg}`}>
                      <div className="flex items-center gap-1.5">
                        <TierIcon size={12} className={colors.text}/>
                        <span className={`text-[10px] font-black uppercase ${colors.text}`}>{TIER_LABELS[t.tier]}</span>
                        <span className="ml-auto text-white font-black text-xs">{t.count}</span>
                        <span className="text-gray-500 text-[9px]">({fmtPct(pct)})</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : <div className="py-6 text-center text-gray-600 italic text-sm">Chưa có dữ liệu thành viên.</div>}
        </BentoCard>

        {/* ── Card: Cảnh báo vận hành ── */}
        <BentoCard title="Cảnh báo vận hành" icon={AlertTriangle} iconColor="text-yellow-400" badge={stats?.low_occupancy_alerts?.length || 0}>
          {stats?.low_occupancy_alerts?.length > 0 ? (
            <div className="space-y-2">
              {stats.low_occupancy_alerts.slice(0, 4).map(s => {
                const pct = Number(s.occupancyRate);
                const urgency = pct < 5 ? "border-red-700/60 bg-red-900/10" : "border-yellow-800/40 bg-yellow-900/5";
                const badgeColor = pct < 5 ? "text-red-400" : "text-yellow-400";
                return (
                  <div key={s.showtimeId} className={`rounded-xl p-2.5 border ${urgency} flex items-center gap-2.5`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-xs truncate">{s.movieTitle}</p>
                      <p className="text-gray-500 text-[10px]">
                        {s.roomName} · {new Date((s.startTime ?? '').toString().replace('Z', '')).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-black text-sm ${badgeColor}`}>{fmtPct(pct)}</p>
                      <p className="text-gray-600 text-[9px]">{s.soldSeats}/{s.totalSeats}</p>
                    </div>
                  </div>
                );
              })}
              {stats.low_occupancy_alerts.length > 4 && (
                <button
                  onClick={() => setAlertsModalOpen(true)}
                  className="w-full text-center text-[10px] text-[#E50914] hover:text-red-400 font-bold transition-colors pt-1 cursor-pointer">
                  + {stats.low_occupancy_alerts.length - 4} cảnh báo khác
                </button>
              )}
            </div>
          ) : (
            <div className="py-6 text-center">
              <Target className="w-8 h-8 text-green-600 mx-auto mb-2"/>
              <p className="text-green-400 font-bold text-xs">Không có cảnh báo!</p>
              <p className="text-gray-600 text-[10px] mt-0.5">Tất cả suất chiếu đều có tỷ lệ lấp đầy tốt</p>
            </div>
          )}
        </BentoCard>
      </div>

      {/* ══════════ SECTION 5: RECENT BOOKINGS TABLE ══════════ */}
      <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2a2a2a] flex items-center justify-between">
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#E50914]" />
            Giao dịch gần nhất
          </h3>
          <span className="text-gray-600 text-[10px] font-bold uppercase">Top 10</span>
        </div>

        {stats?.recent_bookings?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a2a] text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="text-left px-5 py-3">#</th>
                  <th className="text-left px-3 py-3">Phim</th>
                  <th className="text-left px-3 py-3">Khách hàng</th>
                  <th className="text-center px-3 py-3">Vé</th>
                  <th className="text-right px-3 py-3">Tổng tiền</th>
                  <th className="text-center px-3 py-3">Thanh toán</th>
                  <th className="text-center px-3 py-3">Trạng thái</th>
                  <th className="text-right px-5 py-3">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {stats.recent_bookings.map(b => (
                  <tr key={b.id} className="hover:bg-[#222] transition-colors">
                    <td className="px-5 py-3 text-gray-500 text-xs font-mono">#{b.id}</td>
                    <td className="px-3 py-3">
                      <p className="text-white font-bold text-xs truncate max-w-[180px]">{b.movieTitle || '—'}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-gray-400 text-xs truncate max-w-[140px]">{b.userName || b.userEmail || 'N/A'}</p>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-white font-black text-xs">{b.totalTickets}</span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="text-green-400 font-black text-xs">{fmtVND(b.totalAmount)}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-sm">
                        {b.paymentMethod === 'cash' || b.paymentMethod === '' ? '💵' : '💳'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        b.status === 'paid' ? 'bg-green-900/30 text-green-400' :
                        b.status === 'used' ? 'bg-blue-900/30 text-blue-400' :
                        b.status === 'pending' ? 'bg-amber-900/30 text-amber-400' :
                        'bg-red-900/30 text-red-400'
                      }`}>
                        {b.status === 'paid' ? 'Đã TT' : b.status === 'used' ? 'Đã dùng' : b.status === 'pending' ? 'Chờ TT' : 'Hủy'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-gray-500 text-[11px]">{timeAgo(b.createdAt)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-600">
            <Ticket className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm italic">Chưa có giao dịch trong khoảng thời gian này.</p>
          </div>
        )}
      </div>

      {/* ══════════ MODAL: ALL OPERATIONAL WARNINGS ══════════ */}
      {alertsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setAlertsModalOpen(false)} />
          
          {/* Modal Content */}
          <div className="relative bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-[#2a2a2a] flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                Cảnh báo vận hành ({stats?.low_occupancy_alerts?.length || 0})
              </h3>
              <button 
                onClick={() => setAlertsModalOpen(false)}
                className="text-gray-500 hover:text-white transition-colors text-lg font-bold p-1">
                ✕
              </button>
            </div>
            
            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3">
              {stats?.low_occupancy_alerts?.map(s => {
                const pct = Number(s.occupancyRate);
                const urgency = pct < 5 ? "border-red-700/60 bg-red-900/10" : "border-yellow-800/40 bg-yellow-900/5";
                const badgeColor = pct < 5 ? "text-red-400" : "text-yellow-400";
                return (
                  <div key={s.showtimeId} className={`rounded-xl p-3 border ${urgency} flex items-center gap-3`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-xs truncate">{s.movieTitle}</p>
                      <p className="text-gray-500 text-[10px] mt-0.5">
                        {s.roomName} · {new Date((s.startTime ?? '').toString().replace('Z', '')).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-black text-sm ${badgeColor}`}>{fmtPct(pct)}</p>
                      <p className="text-gray-600 text-[9px] mt-0.5">{s.soldSeats}/{s.totalSeats} ghế</p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="px-5 py-3 border-t border-[#2a2a2a] bg-[#111] flex justify-end">
              <button 
                onClick={() => setAlertsModalOpen(false)}
                className="px-4 py-2 bg-[#222] hover:bg-[#333] text-white text-xs font-bold rounded-xl transition-colors">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
