import { useState, useEffect, useCallback } from "react";
import api from "../../utils/api";
import {
  FileText, Search, RefreshCw, Clock, User, Globe,
  Monitor, ChevronDown, ChevronUp, Filter, Shield,
  AlertTriangle, LogIn, CreditCard, Ticket, Gift, Key,
} from "lucide-react";

// ─────────── Helpers ────────────────────────────────────────────────
const actionMeta = {
  'auth.login':            { label: 'Đăng nhập',              icon: LogIn,          color: 'text-emerald-400', bg: 'bg-emerald-900/20' },
  'auth.login_failed':     { label: 'Đăng nhập thất bại',     icon: AlertTriangle,  color: 'text-red-400',     bg: 'bg-red-900/20' },
  'auth.register':         { label: 'Đăng ký tài khoản',      icon: User,           color: 'text-blue-400',    bg: 'bg-blue-900/20' },
  'booking.create':        { label: 'Đặt vé online',          icon: Ticket,         color: 'text-cyan-400',    bg: 'bg-cyan-900/20' },
  'booking.cancel':        { label: 'Hủy vé',                 icon: AlertTriangle,  color: 'text-orange-400',  bg: 'bg-orange-900/20' },
  'booking.pos_create':    { label: 'Bán vé POS',             icon: Ticket,         color: 'text-indigo-400',  bg: 'bg-indigo-900/20' },
  'booking.pos_confirm':   { label: 'Xác nhận POS',           icon: CreditCard,     color: 'text-emerald-400', bg: 'bg-emerald-900/20' },
  'booking.auto_cancelled':{ label: 'Tự động hủy (10 phút)',  icon: Clock,          color: 'text-yellow-400',  bg: 'bg-yellow-900/20' },
  'payment.confirmed':     { label: 'Thanh toán thành công',   icon: CreditCard,     color: 'text-emerald-400', bg: 'bg-emerald-900/20' },
  'payment.late':          { label: 'Thanh toán muộn',         icon: AlertTriangle,  color: 'text-orange-400',  bg: 'bg-orange-900/20' },
  'loyalty.redeem':        { label: 'Đổi điểm thưởng',        icon: Gift,           color: 'text-purple-400',  bg: 'bg-purple-900/20' },
  'passcode.setup':        { label: 'Thiết lập mã bảo mật',   icon: Key,            color: 'text-teal-400',    bg: 'bg-teal-900/20' },
  'passcode.change':       { label: 'Đổi mã bảo mật',        icon: Key,            color: 'text-teal-400',    bg: 'bg-teal-900/20' },
  'passcode.disable':      { label: 'Tắt mã bảo mật',        icon: Key,            color: 'text-gray-400',    bg: 'bg-gray-900/20' },
  'passcode.verify_failed':{ label: 'Nhập sai mã bảo mật',   icon: Shield,         color: 'text-red-400',     bg: 'bg-red-900/20' },
  'passcode.reset':        { label: 'Đặt lại mã bảo mật',    icon: Key,            color: 'text-yellow-400',  bg: 'bg-yellow-900/20' },
};

const getActionMeta = (action) => actionMeta[action] || {
  label: action, icon: FileText, color: 'text-gray-400', bg: 'bg-gray-900/20',
};

const fmtDateTime = (d) => {
  if (!d) return "—";
  const str = String(d).replace("Z", "").replace("T", " ");
  return new Date(str).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
};

const truncateUA = (ua, max = 60) => {
  if (!ua) return "—";
  return ua.length > max ? ua.substring(0, max) + "…" : ua;
};

// ─────────── Main Component ─────────────────────────────────────────
export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actions, setActions] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  // Filters
  const [filterAction, setFilterAction] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const PER_PAGE = 30;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PER_PAGE };
      if (filterAction) params.action = filterAction;
      if (filterDate) params.start_date = filterDate;
      if (filterDate) params.end_date = filterDate;
      const res = await api.get("/admin/audit/logs", { params });
      setLogs(res.data.data);
      setTotal(res.data.pagination.total);
    } catch (err) {
      console.error("Fetch audit logs failed:", err);
    } finally {
      setLoading(false);
    }
  }, [page, filterAction, filterDate]);

  const fetchActions = async () => {
    try {
      const res = await api.get("/admin/audit/actions");
      setActions(res.data);
    } catch {}
  };

  useEffect(() => { fetchActions(); }, []);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { setPage(1); }, [filterAction, filterDate]);

  const totalPages = Math.ceil(total / PER_PAGE);

  // Filter logs by search (client-side for user name/email)
  const displayLogs = filterSearch
    ? logs.filter(l =>
        (l.userName || "").toLowerCase().includes(filterSearch.toLowerCase()) ||
        (l.userEmail || "").toLowerCase().includes(filterSearch.toLowerCase()) ||
        (l.ipAddress || "").includes(filterSearch)
      )
    : logs;

  return (
    <div className="p-6 md:p-8 border-l border-[#333] bg-[#141414] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-3xl font-black text-white uppercase tracking-wider border-l-4 border-[#E50914] pl-3">
          Nhật ký hệ thống
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-sm font-medium">
            Tổng <span className="text-white font-bold">{total.toLocaleString()}</span> bản ghi
          </span>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg border transition-all ${showFilters ? 'bg-[#E50914]/20 border-[#E50914] text-[#E50914]' : 'bg-[#1a1a1a] border-[#333] text-gray-400 hover:text-white hover:border-[#555]'}`}>
            <Filter size={16}/>
          </button>
          <button onClick={fetchLogs}
            className="p-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-gray-400 hover:text-white hover:border-[#555] transition-all">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""}/>
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-[#1a1a1a] p-5 rounded-xl border border-[#333] mb-6 flex flex-col sm:flex-row gap-4 animate-in">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600"/>
            <input
              type="text"
              placeholder="Tìm theo tên, email, IP..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#111] border border-[#333] text-white rounded-xl text-sm outline-none focus:border-[#E50914] transition-colors placeholder:text-gray-700"
            />
          </div>
          {/* Action filter */}
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-[#111] border border-[#333] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#E50914] transition-colors min-w-[200px]"
          >
            <option value="">Tất cả hành động</option>
            {actions.map(a => (
              <option key={a} value={a}>{getActionMeta(a).label}</option>
            ))}
          </select>
          {/* Date filter */}
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="bg-[#111] border border-[#333] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#E50914] transition-colors"
          />
        </div>
      )}

      {/* Table */}
      <div className="bg-[#1a1a1a] rounded-xl border border-[#333] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#2a2a2a]">
            <thead className="bg-[#111]">
              <tr>
                {["Thời gian", "Hành động", "Người dùng", "IP", ""].map(h => (
                  <th key={h} className="px-4 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-gray-600 font-bold animate-pulse">
                    Đang tải nhật ký...
                  </td>
                </tr>
              ) : displayLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <FileText size={40} className="mx-auto text-gray-700 mb-3"/>
                    <p className="text-gray-600 font-medium">Chưa có bản ghi nào.</p>
                  </td>
                </tr>
              ) : displayLogs.map((log) => {
                const meta = getActionMeta(log.action);
                const Icon = meta.icon;
                const isExpanded = expandedId === log.id;

                return (
                  <tr key={log.id} className="group">
                    <td colSpan={5} className="p-0">
                      {/* Main row */}
                      <div
                        className="flex items-center cursor-pointer hover:bg-[#222] transition-colors px-4 py-3"
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      >
                        {/* Thời gian */}
                        <div className="flex items-center gap-2 min-w-[180px]">
                          <Clock size={13} className="text-gray-600 shrink-0"/>
                          <span className="text-gray-400 text-xs font-mono">{fmtDateTime(log.createdAt)}</span>
                        </div>

                        {/* Hành động */}
                        <div className="flex items-center gap-2 min-w-[220px]">
                          <span className={`p-1.5 rounded-lg ${meta.bg}`}>
                            <Icon size={14} className={meta.color}/>
                          </span>
                          <span className={`text-sm font-bold ${meta.color}`}>{meta.label}</span>
                        </div>

                        {/* Người dùng */}
                        <div className="flex items-center gap-2 min-w-[200px]">
                          <div className="w-7 h-7 rounded-full bg-[#252525] flex items-center justify-center text-[10px] font-black text-gray-400 shrink-0">
                            {log.userName?.charAt(0)?.toUpperCase() ?? "?"}
                          </div>
                          <div>
                            <p className="text-white text-xs font-bold leading-tight">{log.userName || "Hệ thống"}</p>
                            <p className="text-gray-600 text-[10px]">{log.userEmail || ""}</p>
                          </div>
                        </div>

                        {/* IP */}
                        <div className="flex items-center gap-1.5 min-w-[140px]">
                          <Globe size={12} className="text-gray-600"/>
                          <span className="text-gray-500 text-xs font-mono">{log.ipAddress || "—"}</span>
                        </div>

                        {/* Expand */}
                        <div className="ml-auto">
                          {isExpanded
                            ? <ChevronUp size={16} className="text-gray-500"/>
                            : <ChevronDown size={16} className="text-gray-600"/>
                          }
                        </div>
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="px-6 pb-4 pt-1 bg-[#161616] border-t border-[#222] animate-in">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                            {/* Entity */}
                            {log.entityType && (
                              <div>
                                <span className="text-gray-600 font-bold uppercase tracking-wider">Đối tượng</span>
                                <p className="text-gray-300 mt-1 font-mono">
                                  {log.entityType} #{log.entityId}
                                </p>
                              </div>
                            )}
                            {/* User Agent */}
                            <div className="md:col-span-2">
                              <span className="text-gray-600 font-bold uppercase tracking-wider flex items-center gap-1">
                                <Monitor size={11}/> Thiết bị
                              </span>
                              <p className="text-gray-500 mt-1 break-all">{truncateUA(log.userAgent, 150)}</p>
                            </div>
                            {/* Details JSON */}
                            {log.details && (
                              <div className="md:col-span-3">
                                <span className="text-gray-600 font-bold uppercase tracking-wider">Chi tiết</span>
                                <pre className="text-gray-400 mt-1 bg-[#111] p-3 rounded-lg overflow-x-auto font-mono text-[11px]">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#2a2a2a] bg-[#111]">
            <p className="text-xs text-gray-600">
              Trang <span className="text-white font-bold">{page}</span> / {totalPages}
              <span className="ml-2">(Tổng {total.toLocaleString()} bản ghi)</span>
            </p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#333] text-gray-400 hover:text-white disabled:opacity-30 text-xs font-bold transition-colors">
                ← Trước
              </button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#333] text-gray-400 hover:text-white disabled:opacity-30 text-xs font-bold transition-colors">
                Tiếp →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
