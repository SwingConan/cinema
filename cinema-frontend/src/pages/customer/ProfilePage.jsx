import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../utils/api";
import {
  User, Key, Save, Ticket, Calendar, MapPin,
  CheckCircle2, XCircle, Clock, QrCode as QrCodeIcon, Film,
  Armchair, History, AlertCircle, Hourglass,
} from "lucide-react";
import QRCodeLib from "react-qr-code";

// Xử lý tương thích Vite CJS module exports
const QRCode = QRCodeLib.default || QRCodeLib.QRCode || QRCodeLib;

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null, errorInfo: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { this.setState({ errorInfo }); console.error(error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', background: '#330000', color: 'white', minHeight: '100vh' }}>
          <h2>Something went wrong in ProfilePage.</h2>
          <pre style={{ color: '#ffaaaa' }}>{this.state.error && this.state.error.toString()}</pre>
          <pre style={{ color: '#ffaaaa', fontSize: '12px' }}>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtCurrency = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

const fmtDatetime = (val) => {
  if (!val) return "—";
  const d = new Date(String(val).replace(" ", "T").replace("Z", ""));
  return isNaN(d) ? String(val) : d.toLocaleString("vi-VN");
};

// ── StatusBadge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    paid:      { cls: "bg-emerald-900/40 text-emerald-400 border-emerald-800/60", icon: <CheckCircle2 className="w-3 h-3 mr-1" />, label: "Đã thanh toán" },
    used:      { cls: "bg-blue-900/40 text-blue-400 border-blue-800/60",          icon: <CheckCircle2 className="w-3 h-3 mr-1" />, label: "Đã xem phim" },
    pending:   { cls: "bg-yellow-900/40 text-yellow-400 border-yellow-800/60",    icon: <Hourglass className="w-3 h-3 mr-1" />,     label: "Chờ thanh toán" },
    cancelled: { cls: "bg-red-900/40 text-red-400 border-red-800/60",             icon: <XCircle className="w-3 h-3 mr-1" />,       label: "Đã hủy" },
  };
  const s = map[status] ?? { cls: "bg-gray-900/40 text-gray-400 border-gray-700", icon: null, label: status };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black border uppercase tracking-wider ${s.cls}`}>
      {s.icon}{s.label}
    </span>
  );
}

// ── TicketCard ────────────────────────────────────────────────────────────────
function TicketCard({ booking, onResumePayment, onCancelBooking, loadingQR, onZoomQR }) {
  const qrCode = booking.qrCode || booking.qr_code;
  const startTime = booking.showtime?.startTime ?? booking.showtime?.start_time;
  const seatNames = booking.seatNames;
  const isPaid    = booking.status === "paid";
  const isPending = booking.status === "pending";

  // Countdown logic for pending
  const minutesPassed = isPending
    ? (Date.now() - new Date(booking.createdAt ?? booking.created_at).getTime()) / 60000
    : 0;
  const isExpired   = isPending && minutesPassed >= 10;
  const minutesLeft = isPending ? Math.max(0, Math.ceil(10 - minutesPassed)) : 0;

  // Gradient per status
  const borderGlow = isPaid
    ? "border-emerald-800/60 shadow-[0_0_18px_rgba(16,185,129,0.12)]"
    : isPending
    ? "border-yellow-800/60 shadow-[0_0_18px_rgba(234,179,8,0.10)]"
    : "border-[#2a2a2a]";

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all hover:scale-[1.005] ${borderGlow}`}
         style={{ background: "linear-gradient(135deg,#1c1c1c 0%,#161616 100%)" }}>

      {/* ── Top strip: order meta ─────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 bg-black/40 border-b border-white/5">
        <span className="font-mono font-black text-[#E50914] text-sm tracking-widest">
          #{String(booking.id).padStart(4, "0")}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-xs">
            {fmtDatetime(booking.createdAt ?? booking.created_at)}
          </span>
          <StatusBadge status={booking.status} />
        </div>
      </div>

      {/* ── Main body: ticket stub layout ─────────────────────── */}
      <div className="flex min-h-[140px]">

        {/* LEFT — movie poster */}
        <div className="w-24 flex-shrink-0 relative overflow-hidden bg-black">
          {booking.showtime?.movie?.poster ? (
            <img
              src={`http://localhost:8000/uploads/${booking.showtime.movie.poster}`}
              alt="poster"
              className="absolute inset-0 w-full h-full object-cover opacity-90"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Film className="w-8 h-8 text-gray-700" />
            </div>
          )}
          {/* Scrim gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#1c1c1c]/80" />
        </div>

        {/* CENTER — info (flex-1) */}
        <div className="flex-1 p-4 space-y-2 min-w-0">
          <h3 className="text-white font-black text-base leading-tight truncate">
            {booking.showtime?.movie?.title ?? "—"}
          </h3>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#E50914] flex-shrink-0" />
              {booking.showtime?.room?.name} · {booking.showtime?.room?.type}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#E50914] flex-shrink-0" />
              {fmtDatetime(startTime)}
            </span>
            {seatNames && (
              <span className="flex items-center gap-1">
                <Armchair className="w-3 h-3 text-[#E50914] flex-shrink-0" />
                <span className="text-white font-bold">{seatNames}</span>
              </span>
            )}
          </div>

          <p className="text-white font-black text-sm pt-1">
            {fmtCurrency(booking.totalAmount ?? booking.total_amount)}
          </p>
        </div>

        {/* DIVIDER — dashed + notch circles (ticket perforation) */}
        <div className="relative flex flex-col items-center justify-center w-6 flex-shrink-0">
          {/* Top notch */}
          <div className="absolute -top-3 w-6 h-6 rounded-full bg-[#141414] border border-[#2a2a2a] z-10" />
          {/* Dashed line */}
          <div className="flex-1 border-l-2 border-dashed border-white/10 h-full" />
          {/* Bottom notch */}
          <div className="absolute -bottom-3 w-6 h-6 rounded-full bg-[#141414] border border-[#2a2a2a] z-10" />
        </div>

        {/* RIGHT — QR / Action panel */}
        <div className="flex-shrink-0 w-32 flex flex-col items-center justify-center p-3 gap-2">

          {/* PAID → show QR stub */}
          {isPaid && qrCode && (
            <>
              <div 
                className="bg-white p-1.5 rounded-lg flex flex-col items-center gap-1 w-full max-w-[80px] cursor-pointer hover:scale-105 transition-transform"
                onClick={() => onZoomQR(qrCode)}
              >
                <QRCode
                  value={qrCode}
                  size={64}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  viewBox={`0 0 64 64`}
                />
                <span className="font-mono text-black font-black text-[9px] tracking-widest break-all text-center leading-none mt-1">
                  {qrCode.split("-")[0].toUpperCase()}
                </span>
              </div>
              <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest text-center leading-tight mt-1">
                Đưa mã này<br/>để nhận vé
              </p>
            </>
          )}

          {/* PENDING → countdown + pay/cancel buttons */}
          {isPending && (
            <>
              {isExpired ? (
                <>
                  <XCircle className="w-6 h-6 text-red-500" />
                  <p className="text-[10px] text-red-500 font-bold text-center uppercase">Hết hạn</p>
                  <button
                    onClick={() => onCancelBooking(booking.id)}
                    className="w-full px-2 py-1.5 bg-red-900/40 hover:bg-red-900/60 text-red-300 text-[10px] font-bold rounded-lg uppercase tracking-wide transition-colors border border-red-900/50"
                  >
                    Hủy đơn
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onResumePayment(booking.id)}
                    disabled={loadingQR}
                    className="w-full px-2 py-2 bg-[#E50914] hover:bg-[#c40812] disabled:opacity-40 text-white text-[11px] font-black rounded-lg uppercase tracking-wide transition-colors"
                  >
                    {loadingQR ? "..." : "Thanh toán\ntiếp"}
                  </button>
                  <div className="flex items-center gap-1 text-yellow-400 text-[10px] font-bold">
                    <Clock className="w-3 h-3" />
                    Còn {minutesLeft} phút
                  </div>
                  <button
                    onClick={() => onCancelBooking(booking.id)}
                    className="w-full px-2 py-1 text-gray-500 hover:text-red-400 text-[9px] font-bold uppercase tracking-wide transition-colors"
                  >
                    Hủy đơn
                  </button>
                </>
              )}
            </>
          )}

          {/* USED / CANCELLED → nothing extra */}
          {(booking.status === "used") && (
            <div className="text-blue-400 text-[10px] text-center font-bold uppercase leading-tight">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-1" />
              Đã xem phim
            </div>
          )}
          {(booking.status === "cancelled") && (
            <div className="text-red-500 text-[10px] text-center font-bold uppercase leading-tight">
              <XCircle className="w-6 h-6 mx-auto mb-1" />
              Đã hủy
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── EmptySlot ─────────────────────────────────────────────────────────────────
function EmptySlot({ icon: Icon, msg, sub }) {
  return (
    <div className="py-14 text-center flex flex-col items-center gap-3 border border-dashed border-[#333] rounded-2xl bg-[#111]/50">
      <Icon className="w-12 h-12 text-gray-700" />
      <p className="text-white font-bold">{msg}</p>
      <p className="text-gray-500 text-sm">{sub}</p>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
function ProfilePageContent() {
  const location = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || "info");

  // Form
  const [formData, setFormData] = useState({ name: "", phone: "" });
  const [updating, setUpdating] = useState(false);
  const [message,  setMessage]  = useState({ type: "", text: "" });

  // Booking
  const [bookings,        setBookings]        = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [historyTab,      setHistoryTab]      = useState("upcoming"); // upcoming | pending | past

  // VietQR modal
  const [vietQRModal, setVietQRModal] = useState(null);
  const [loadingQR,   setLoadingQR]   = useState(false);
  
  // Zoomed Ticket QR
  const [zoomedQR, setZoomedQR] = useState(null);

  useEffect(() => {
    if (user) setFormData({ name: user.name || "", phone: user.phone || "" });
  }, [user]);

  useEffect(() => {
    if (activeTab === "history") fetchBookings();
  }, [activeTab]);

  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const res = await api.get("/customer/bookings");
      setBookings(res.data?.data ?? res.data);
    } catch (e) {
      console.error("Lỗi lấy lịch sử:", e);
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setMessage({ type: "error", text: "Họ và tên không được để trống!" });
      setFormData((p) => ({ ...p, name: "" }));
      return;
    }
    setUpdating(true);
    setMessage({ type: "", text: "" });
    try {
      await api.put("/customer/profile", { name: formData.name, phone: formData.phone });
      setMessage({ type: "success", text: "Cập nhật thông tin thành công!" });
      window.dispatchEvent(new Event("auth:refresh"));
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Có lỗi xảy ra." });
    } finally {
      setUpdating(false);
    }
  };

  const handleResumePayment = async (bookingId) => {
    setLoadingQR(true);
    try {
      const res = await api.get(`/customer/bookings/${bookingId}/vietqr`);
      setVietQRModal(res.data);
    } catch (err) {
      alert(err.response?.data?.message || "Không thể tải mã QR. Vé có thể đã hết hạn.");
      fetchBookings();
    } finally {
      setLoadingQR(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm("Bạn có chắc muốn hủy đơn này? Ghế sẽ được nhả cho người khác.")) return;
    try {
      await api.put(`/customer/bookings/${bookingId}/cancel`);
      fetchBookings(); // Làm mới danh sách
    } catch (err) {
      alert(err.response?.data?.message || "Không thể hủy đơn. Vui lòng thử lại.");
    }
  };

  // ── Booking buckets ────────────────────────────────────────────────────────
  const upcomingBookings = bookings.filter((b) => b.status === "paid");
  const pendingBookings  = bookings.filter((b) => b.status === "pending");
  const pastBookings     = bookings.filter((b) => b.status === "used" || b.status === "cancelled");

  const historySubTabs = [
    { key: "upcoming", label: "🎟️ Vé Sắp Xem",       count: upcomingBookings.length },
    { key: "pending",  label: "⏳ Chờ Thanh Toán",    count: pendingBookings.length },
    { key: "past",     label: "🕰️ Lịch Sử Cũ",        count: pastBookings.length },
  ];

  const currentBucket = {
    upcoming: upcomingBookings,
    pending:  pendingBookings,
    past:     pastBookings,
  }[historyTab];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
    <div className="bg-[#141414] min-h-[calc(100vh-64px)] py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8">

          {/* Sidebar */}
          <div className="w-full md:w-56 flex-shrink-0">
            <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] overflow-hidden sticky top-20">
              {/* Avatar */}
              <div className="p-5 bg-black/60 text-white text-center border-b border-[#2a2a2a]">
                <div className="w-16 h-16 bg-gradient-to-br from-[#E50914] to-[#8B0000] rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-2 shadow-lg shadow-red-900/30">
                  {(user?.name || "U").charAt(0).toUpperCase()}
                </div>
                <h3 className="font-bold text-sm truncate">{user?.name}</h3>
                <p className="text-gray-500 text-xs truncate">{user?.email}</p>
              </div>
              {/* Nav */}
              <div className="p-2 space-y-1">
                <button
                  onClick={() => setActiveTab("info")}
                  className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeTab === "info" ? "bg-[#E50914] text-white" : "text-gray-400 hover:bg-[#222] hover:text-white"}`}
                >
                  <User className="w-4 h-4 mr-2.5 flex-shrink-0" /> Thông tin
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeTab === "history" ? "bg-[#E50914] text-white" : "text-gray-400 hover:bg-[#222] hover:text-white"}`}
                >
                  <Ticket className="w-4 h-4 mr-2.5 flex-shrink-0" /> Ví Vé Của Tôi
                  {pendingBookings.length > 0 && (
                    <span className="ml-auto bg-yellow-500 text-black text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                      {pendingBookings.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">

            {/* ── INFO TAB ─────────────────────────────────────────── */}
            {activeTab === "info" && (
              <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-6 md:p-8">
                <h2 className="text-xl font-black text-white mb-6 flex items-center uppercase tracking-wider">
                  <User className="mr-2 text-[#E50914]" /> Cài Đặt Tài Khoản
                </h2>
                {message.text && (
                  <div className={`p-4 rounded-xl mb-5 flex items-center font-medium border text-sm
                    ${message.type === "success"
                      ? "bg-green-900/20 text-green-400 border-green-900/50"
                      : "bg-red-900/20 text-red-400 border-red-900/50"}`}
                  >
                    {message.type === "success"
                      ? <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0" />
                      : <XCircle className="w-4 h-4 mr-2 flex-shrink-0" />}
                    {message.text}
                  </div>
                )}
                <form onSubmit={handleUpdateInfo} className="space-y-5 max-w-lg">
                  {[
                    { label: "Email (tài khoản đăng nhập)", value: user?.email || "", disabled: true, type: "text" },
                  ].map(({ label, value, disabled, type }) => (
                    <div key={label}>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">{label}</label>
                      <input type={type} disabled={disabled} value={value}
                        className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2.5 text-gray-500 cursor-not-allowed text-sm" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Họ và Tên</label>
                    <input type="text" value={formData.name} required
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-[#222] text-white border border-[#444] rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] outline-none transition text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Số Điện Thoại</label>
                    <input type="tel" value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-[#222] text-white border border-[#444] rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] outline-none transition text-sm" />
                  </div>
                  <button type="submit" disabled={updating}
                    className="flex items-center justify-center bg-[#E50914] hover:bg-[#c40812] text-white font-bold py-2.5 px-6 rounded-xl transition-colors disabled:opacity-50 uppercase tracking-wider text-sm">
                    {updating ? "Đang lưu..." : <><Save className="w-4 h-4 mr-2" />Lưu Thay Đổi</>}
                  </button>
                </form>
              </div>
            )}

            {/* ── HISTORY TAB ──────────────────────────────────────── */}
            {activeTab === "history" && (
              <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-white flex items-center uppercase tracking-wider">
                    <Ticket className="mr-2 text-[#E50914]" /> Ví Vé Của Tôi
                  </h2>
                  <button onClick={fetchBookings}
                    className="text-xs text-gray-500 hover:text-white font-bold transition-colors uppercase tracking-wider">
                    ↻ Làm mới
                  </button>
                </div>

                {/* Sub-tabs */}
                <div className="flex bg-[#1a1a1a] rounded-xl p-1 border border-[#2a2a2a] gap-1">
                  {historySubTabs.map(({ key, label, count }) => (
                    <button
                      key={key}
                      onClick={() => setHistoryTab(key)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-black transition-all uppercase tracking-wide
                        ${historyTab === key
                          ? "bg-[#E50914] text-white shadow-lg shadow-red-900/30"
                          : "text-gray-500 hover:text-white"}`}
                    >
                      {label}
                      {count > 0 && (
                        <span className={`rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-black
                          ${historyTab === key ? "bg-white/20 text-white" : "bg-[#2a2a2a] text-gray-400"}`}>
                          {count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Booking list */}
                {loadingBookings ? (
                  <div className="py-12 text-center">
                    <div className="w-8 h-8 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Đang tải vé...</p>
                  </div>
                ) : currentBucket.length === 0 ? (
                  (() => {
                    const empties = {
                      upcoming: { icon: Ticket,       msg: "Chưa có vé nào sắp xem",      sub: "Hãy đặt vé và thanh toán để vé hiện ở đây" },
                      pending:  { icon: Hourglass,    msg: "Không có vé chờ thanh toán",   sub: "Tất cả vé đã được xử lý" },
                      past:     { icon: History,      msg: "Chưa có lịch sử xem phim",     sub: "Sau khi xem phim, vé sẽ xuất hiện ở đây" },
                    };
                    const e = empties[historyTab];
                    return <EmptySlot icon={e.icon} msg={e.msg} sub={e.sub} />;
                  })()
                ) : (
                  <div className="space-y-4">
                    {currentBucket.map((booking) => (
                      <TicketCard
                        key={booking.id}
                        booking={booking}
                        onResumePayment={handleResumePayment}
                        onCancelBooking={handleCancelBooking}
                        loadingQR={loadingQR}
                        onZoomQR={setZoomedQR}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* VietQR Modal — GIỮ NGUYÊN 100% */}
    {vietQRModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
           onClick={() => setVietQRModal(null)}>
        <div className="bg-[#1a1a1a] rounded-2xl p-6 shadow-2xl border border-[#333] w-[340px] max-w-[95vw] text-center"
             onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-center mb-3">
            <QrCodeIcon className="w-5 h-5 text-[#E50914] mr-2" />
            <h2 className="text-white font-black text-lg uppercase tracking-wider">Quét để thanh toán</h2>
          </div>
          <p className="text-gray-400 text-sm mb-1">
            Đơn hàng <span className="text-[#E50914] font-bold">#{vietQRModal.bookingId}</span>
          </p>
          <p className="text-white font-black text-xl mb-4">
            {fmtCurrency(vietQRModal.totalAmount)}
          </p>
          <div className="bg-white p-3 rounded-xl inline-block shadow-lg mb-4">
            <img src={vietQRModal.vietQrUrl} alt="VietQR" className="w-56 h-56 object-contain" />
          </div>
          <div className="flex items-center justify-center text-yellow-400 text-sm font-bold mb-4">
            <Clock className="w-4 h-4 mr-1.5" />
            Còn khoảng {vietQRModal.minutesLeft} phút để thanh toán
          </div>
          <p className="text-gray-500 text-xs mb-4">
            Dùng app ngân hàng quét mã QR trên.<br />
            Giữ nguyên nội dung chuyển khoản{" "}
            <span className="text-white font-bold">CINEMA BOOKING {vietQRModal.bookingId}</span>.
          </p>
          <button
            onClick={() => { setVietQRModal(null); fetchBookings(); }}
            className="w-full py-2 rounded-lg bg-[#333] text-gray-300 text-sm font-bold hover:bg-[#444] transition-colors"
          >
            Đóng &amp; Làm mới
          </button>
        </div>
      </div>
    )}

    {/* Zoomed Ticket QR Modal */}
    {zoomedQR && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
           onClick={() => setZoomedQR(null)}>
        <div className="bg-white p-6 rounded-3xl shadow-[0_0_50px_rgba(255,255,255,0.2)] flex flex-col items-center max-w-[90vw]"
             onClick={(e) => e.stopPropagation()}>
          <QRCode
            value={zoomedQR}
            size={256}
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            viewBox={`0 0 256 256`}
          />
          <p className="mt-6 text-black font-black text-xl tracking-widest font-mono">
            {zoomedQR.split("-")[0].toUpperCase()}
          </p>
          <p className="mt-2 text-gray-500 text-sm font-bold uppercase tracking-wider text-center">
            Đưa mã này cho nhân viên
          </p>
          <button
            onClick={() => setZoomedQR(null)}
            className="mt-6 w-full py-3 rounded-xl bg-gray-200 text-black font-black hover:bg-gray-300 transition-colors uppercase tracking-wider"
          >
            Đóng
          </button>
        </div>
      </div>
    )}
    </>
  );
}

export default function ProfilePage() {
  return (
    <ErrorBoundary>
      <ProfilePageContent />
    </ErrorBoundary>
  );
}
