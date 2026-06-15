import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../utils/api";
import {
  User, Key, Save, Ticket, Calendar, MapPin,
  CheckCircle2, XCircle, Clock, QrCode as QrCodeIcon, Film,
  Armchair, History, AlertCircle, Hourglass, Crown,
  Copy, Tag,
} from "lucide-react";
import QRCodeLib from "react-qr-code";
import MembershipCard from "../../components/customer/MembershipCard";
import toast from "react-hot-toast";

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

const fmtAbsoluteDatetime = (val) => {
  if (!val) return "—";
  const d = new Date(val);
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

  const [timeLeft, setTimeLeft] = useState(10);

  useEffect(() => {
    if (!isPending) return;
    const updateTime = () => {
      const created = new Date(booking.createdAt ?? booking.created_at).getTime();
      const passed = (Date.now() - created) / 60000;
      setTimeLeft(Math.max(0, Math.ceil(10 - passed)));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, [isPending, booking.createdAt, booking.created_at]);

  const isExpired   = isPending && timeLeft <= 0;
  const minutesLeft = isPending ? timeLeft : 0;

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
            {fmtAbsoluteDatetime(booking.createdAt ?? booking.created_at)}
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
              src={`${import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000'}/uploads/${booking.showtime.movie.poster}`}
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
function EmptySlot({ icon, msg, sub }) {
  const IconComponent = icon;
  return (
    <div className="py-14 text-center flex flex-col items-center gap-3 border border-dashed border-[#333] rounded-2xl bg-[#111]/50">
      {IconComponent && <IconComponent className="w-12 h-12 text-gray-700" />}
      <p className="text-white font-bold">{msg}</p>
      <p className="text-gray-500 text-sm">{sub}</p>
    </div>
  );
}

function VoucherList({ vouchers, loading, onCopy }) {
  if (loading) {
    return <div className="rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-5 text-gray-500">Đang tải voucher...</div>;
  }

  if (!vouchers.length) {
    return <EmptySlot icon={Tag} msg="Chưa có voucher cá nhân" sub="Voucher đổi điểm sẽ xuất hiện tại đây." />;
  }

  return (
    <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#2a2a2a] flex items-center justify-between">
        <h3 className="text-white font-black uppercase tracking-wider flex items-center gap-2">
          <Tag className="w-5 h-5 text-[#E50914]" /> Voucher của tôi
        </h3>
        <span className="text-xs text-gray-500 font-bold">{vouchers.length} mã khả dụng</span>
      </div>
      <div className="divide-y divide-[#2a2a2a]">
        {vouchers.map((voucher) => (
          <div key={voucher.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-black text-white tracking-wider">{voucher.code}</span>
                <button onClick={() => onCopy(voucher.code)} className="p-1.5 rounded-lg bg-[#222] text-gray-400 hover:text-white hover:bg-[#333]" title="Copy">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-gray-400 mt-1">{voucher.name}</p>
              <p className="text-xs text-gray-500 mt-1">Hạn dùng: {fmtDatetime(voucher.validTo)}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-emerald-400 font-black text-lg">
                {voucher.discountType === "percentage"
                  ? `-${voucher.discountValue}%`
                  : `-${fmtCurrency(voucher.discountValue)}`}
              </p>
              <span className={`inline-flex mt-1 rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ${
                voucher.status === "used"
                  ? "border-blue-800/60 bg-blue-900/30 text-blue-400"
                  : voucher.status === "expired" || voucher.status === "inactive"
                    ? "border-gray-700 bg-gray-800/50 text-gray-500"
                    : "border-emerald-800/60 bg-emerald-900/30 text-emerald-400"
              }`}>
                {voucher.status === "used" ? "Đã dùng" : voucher.status === "expired" ? "Hết hạn" : voucher.status === "inactive" ? "Tạm dừng" : "Chưa dùng"}
              </span>
            </div>
          </div>
        ))}
      </div>
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

  // Passcode Security State
  const [passcodeStatus, setPasscodeStatus] = useState({ passcodeEnabled: false, isLocked: false, lockedUntil: null });
  const [loadingPasscodeStatus, setLoadingPasscodeStatus] = useState(false);
  const [myVouchers, setMyVouchers] = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);

  // Form states
  const [setupForm, setSetupForm] = useState({ password: "", passcode: "", confirmPasscode: "" });
  const [setupLoading, setSetupLoading] = useState(false);

  const [changeForm, setChangeForm] = useState({ oldPasscode: "", newPasscode: "", confirmNewPasscode: "" });
  const [changeLoading, setChangeLoading] = useState(false);

  const [disableForm, setDisableForm] = useState({ password: "" });
  const [disableLoading, setDisableLoading] = useState(false);

  const [resetStep, setResetStep] = useState(1); // 1: request, 2: verify
  const [resetForm, setResetForm] = useState({ otp: "", newPasscode: "", confirmNewPasscode: "" });
  const [resetLoading, setResetLoading] = useState(false);

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

  const fetchPasscodeStatus = useCallback(async () => {
    setLoadingPasscodeStatus(true);
    try {
      const res = await api.get("/customer/security/passcode/status");
      setPasscodeStatus(res.data);
    } catch (e) {
      console.error("Lỗi lấy trạng thái passcode:", e);
    } finally {
      setLoadingPasscodeStatus(false);
    }
  }, []);

  const fetchMyVouchers = useCallback(async () => {
    setLoadingVouchers(true);
    try {
      const res = await api.get("/customer/vouchers/my-vouchers", { params: { include_all: 1 } });
      setMyVouchers(Array.isArray(res.data) ? res.data : (res.data?.data ?? []));
    } catch (e) {
      console.error("Lỗi lấy voucher:", e);
    } finally {
      setLoadingVouchers(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "history") fetchBookings();
    if (activeTab === "security") fetchPasscodeStatus();
    if (activeTab === "vouchers") fetchMyVouchers();
  }, [activeTab, fetchPasscodeStatus, fetchMyVouchers]);

  const copyVoucherCode = async (code) => {
    await navigator.clipboard.writeText(code);
    toast.success(`Đã copy mã ${code}`);
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

  // ── Security form handlers ──────────────────────────────────
  const handleSetupPasscode = async (e) => {
    e.preventDefault();
    if (setupForm.passcode !== setupForm.confirmPasscode) {
      toast.error("Mã bảo mật nhập lại không khớp!");
      return;
    }
    if (!/^\d{6}$/.test(setupForm.passcode)) {
      toast.error("Mã bảo mật phải là 6 chữ số!");
      return;
    }
    setSetupLoading(true);
    try {
      await api.post("/customer/security/passcode/setup", {
        password: setupForm.password,
        passcode: setupForm.passcode
      });
      toast.success("Thiết lập mã bảo mật thành công!");
      setSetupForm({ password: "", passcode: "", confirmPasscode: "" });
      fetchPasscodeStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || "Có lỗi xảy ra.");
    } finally {
      setSetupLoading(false);
    }
  };

  const handleChangePasscode = async (e) => {
    e.preventDefault();
    if (changeForm.newPasscode !== changeForm.confirmNewPasscode) {
      toast.error("Mã bảo mật mới nhập lại không khớp!");
      return;
    }
    if (!/^\d{6}$/.test(changeForm.newPasscode)) {
      toast.error("Mã bảo mật phải là 6 chữ số!");
      return;
    }
    setChangeLoading(true);
    try {
      await api.post("/customer/security/passcode/change", {
        oldPasscode: changeForm.oldPasscode,
        newPasscode: changeForm.newPasscode
      });
      toast.success("Đổi mã bảo mật thành công!");
      setChangeForm({ oldPasscode: "", newPasscode: "", confirmNewPasscode: "" });
      fetchPasscodeStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || "Có lỗi xảy ra.");
    } finally {
      setChangeLoading(false);
    }
  };

  const handleDisablePasscode = async (e) => {
    e.preventDefault();
    if (!confirm("Bạn có chắc chắn muốn tắt mã bảo mật? Giao dịch của bạn sẽ kém an toàn hơn.")) return;
    setDisableLoading(true);
    try {
      await api.post("/customer/security/passcode/disable", {
        password: disableForm.password
      });
      toast.success("Đã tắt mã bảo mật!");
      setDisableForm({ password: "" });
      fetchPasscodeStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || "Có lỗi xảy ra.");
    } finally {
      setDisableLoading(false);
    }
  };

  const handleRequestResetOtp = async () => {
    setResetLoading(true);
    try {
      await api.post("/customer/security/passcode/reset-request");
      toast.success("📧 Mã OTP đã gửi đến email của bạn!");
      setResetStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi gửi OTP.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    if (resetForm.newPasscode !== resetForm.confirmNewPasscode) {
      toast.error("Mã bảo mật nhập lại không khớp!");
      return;
    }
    if (!/^\d{6}$/.test(resetForm.newPasscode)) {
      toast.error("Mã bảo mật phải là 6 chữ số!");
      return;
    }
    setResetLoading(true);
    try {
      await api.post("/customer/security/passcode/reset-confirm", {
        otp: resetForm.otp,
        newPasscode: resetForm.newPasscode
      });
      toast.success("Đặt lại mã bảo mật thành công!");
      setResetForm({ otp: "", newPasscode: "", confirmNewPasscode: "" });
      setResetStep(1);
      fetchPasscodeStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || "Có lỗi xảy ra.");
    } finally {
      setResetLoading(false);
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
                <button
                  onClick={() => setActiveTab("membership")}
                  className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeTab === "membership" ? "bg-[#E50914] text-white" : "text-gray-400 hover:bg-[#222] hover:text-white"}`}
                >
                  <Crown className="w-4 h-4 mr-2.5 flex-shrink-0" /> Thành viên
                </button>
                <button
                  onClick={() => setActiveTab("vouchers")}
                  className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeTab === "vouchers" ? "bg-[#E50914] text-white" : "text-gray-400 hover:bg-[#222] hover:text-white"}`}
                >
                  <Tag className="w-4 h-4 mr-2.5 flex-shrink-0" /> Voucher của tôi
                </button>
                <button
                  onClick={() => setActiveTab("security")}
                  className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeTab === "security" ? "bg-[#E50914] text-white" : "text-gray-400 hover:bg-[#222] hover:text-white"}`}
                >
                  <Key className="w-4 h-4 mr-2.5 flex-shrink-0" /> Bảo mật thanh toán
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

            {/* ── MEMBERSHIP TAB ─────────────────────────────────── */}
            {activeTab === "membership" && (
              <div className="space-y-5">
                <h2 className="text-xl font-black text-white flex items-center uppercase tracking-wider">
                  <Crown className="mr-2 text-yellow-500" /> Thành Viên & Tích Điểm
                </h2>
                <MembershipCard onRedeemed={fetchMyVouchers} />
              </div>
            )}

            {activeTab === "vouchers" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-white flex items-center uppercase tracking-wider">
                    <Tag className="mr-2 text-[#E50914]" /> Voucher Của Tôi
                  </h2>
                  <button onClick={fetchMyVouchers}
                    className="text-xs text-gray-500 hover:text-white font-bold transition-colors uppercase tracking-wider">
                    ↻ Làm mới
                  </button>
                </div>
                <VoucherList vouchers={myVouchers} loading={loadingVouchers} onCopy={copyVoucherCode} />
              </div>
            )}

            {/* ── SECURITY TAB ─────────────────────────────────────── */}
            {activeTab === "security" && (
              <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-6 md:p-8 space-y-6">
                <h2 className="text-xl font-black text-white flex items-center uppercase tracking-wider">
                  <Key className="mr-2 text-[#E50914]" /> Bảo Mật Thanh Toán
                </h2>
                
                {loadingPasscodeStatus ? (
                  <div className="py-8 text-center">
                    <div className="w-8 h-8 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Đang tải trạng thái bảo mật...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Status Overview Card */}
                    <div className="bg-[#111] p-5 rounded-2xl border border-[#2a2a2a] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-2.5 h-2.5 rounded-full ${passcodeStatus.passcodeEnabled ? "bg-emerald-500" : "bg-red-500"}`} />
                          <h4 className="text-white font-bold text-base">
                            {passcodeStatus.passcodeEnabled ? "Mã bảo mật đang BẬT" : "Mã bảo mật đang TẮT"}
                          </h4>
                        </div>
                        <p className="text-gray-400 text-xs sm:max-w-md">
                          Mã bảo mật 6 chữ số bảo vệ các giao dịch quan trọng như đặt vé, đổi điểm thưởng, hoàn tiền.
                        </p>
                      </div>
                      
                      {passcodeStatus.isLocked && (
                        <div className="bg-red-900/20 text-red-400 border border-red-900/50 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start sm:self-center">
                          <AlertCircle className="w-4 h-4" />
                          <span>Tài khoản bị khóa đến {new Date(passcodeStatus.lockedUntil).toLocaleTimeString()}</span>
                        </div>
                      )}
                    </div>

                    {/* SETUP FLOW */}
                    {!passcodeStatus.passcodeEnabled && (
                      <form onSubmit={handleSetupPasscode} className="space-y-4 max-w-md bg-black/20 p-5 rounded-2xl border border-[#222]">
                        <h3 className="text-white font-bold text-sm uppercase tracking-wider border-b border-[#222] pb-2 text-[#E50914]">Kích hoạt mã bảo mật</h3>
                        
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Mật khẩu tài khoản</label>
                          <input type="password" required value={setupForm.password}
                            onChange={(e) => setSetupForm({...setupForm, password: e.target.value})}
                            placeholder="Nhập mật khẩu hiện tại của bạn"
                            className="w-full bg-[#111] text-white border border-[#333] rounded-lg px-4 py-2.5 focus:border-[#E50914] outline-none text-sm" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Mã bảo mật (6 số)</label>
                            <input type="password" required maxLength={6} pattern="\d{6}" value={setupForm.passcode}
                              onChange={(e) => setSetupForm({...setupForm, passcode: e.target.value.replace(/\D/g, "")})}
                              placeholder="123456"
                              className="w-full bg-[#111] text-white border border-[#333] rounded-lg px-4 py-2.5 focus:border-[#E50914] outline-none text-center font-mono text-lg tracking-widest" />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Nhập lại mã</label>
                            <input type="password" required maxLength={6} pattern="\d{6}" value={setupForm.confirmPasscode}
                              onChange={(e) => setSetupForm({...setupForm, confirmPasscode: e.target.value.replace(/\D/g, "")})}
                              placeholder="123456"
                              className="w-full bg-[#111] text-white border border-[#333] rounded-lg px-4 py-2.5 focus:border-[#E50914] outline-none text-center font-mono text-lg tracking-widest" />
                          </div>
                        </div>

                        <button type="submit" disabled={setupLoading}
                          className="w-full flex items-center justify-center bg-[#E50914] hover:bg-[#c40812] text-white font-bold py-2.5 rounded-xl transition-all disabled:opacity-50 uppercase tracking-wider text-sm">
                          {setupLoading ? "Đang xử lý..." : "Bật Mã Bảo Mật"}
                        </button>
                      </form>
                    )}

                    {/* CHANGE & DISABLE FLOW */}
                    {passcodeStatus.passcodeEnabled && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Change Passcode */}
                        <form onSubmit={handleChangePasscode} className="space-y-4 bg-black/20 p-5 rounded-2xl border border-[#222]">
                          <h3 className="text-white font-bold text-sm uppercase tracking-wider border-b border-[#222] pb-2 text-[#E50914]">Đổi mã bảo mật</h3>
                          
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Mã bảo mật cũ (6 số)</label>
                            <input type="password" required maxLength={6} pattern="\d{6}" value={changeForm.oldPasscode}
                              onChange={(e) => setChangeForm({...changeForm, oldPasscode: e.target.value.replace(/\D/g, "")})}
                              placeholder="******"
                              className="w-full bg-[#111] text-white border border-[#333] rounded-lg px-4 py-2.5 focus:border-[#E50914] outline-none text-center font-mono text-lg tracking-widest" />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Mã mới (6 số)</label>
                              <input type="password" required maxLength={6} pattern="\d{6}" value={changeForm.newPasscode}
                                onChange={(e) => setChangeForm({...changeForm, newPasscode: e.target.value.replace(/\D/g, "")})}
                                placeholder="******"
                                className="w-full bg-[#111] text-white border border-[#333] rounded-lg px-4 py-2.5 focus:border-[#E50914] outline-none text-center font-mono text-lg tracking-widest" />
                            </div>
                            
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Nhập lại mã mới</label>
                              <input type="password" required maxLength={6} pattern="\d{6}" value={changeForm.confirmNewPasscode}
                                onChange={(e) => setChangeForm({...changeForm, confirmNewPasscode: e.target.value.replace(/\D/g, "")})}
                                placeholder="******"
                                className="w-full bg-[#111] text-white border border-[#333] rounded-lg px-4 py-2.5 focus:border-[#E50914] outline-none text-center font-mono text-lg tracking-widest" />
                            </div>
                          </div>

                          <button type="submit" disabled={changeLoading}
                            className="w-full flex items-center justify-center bg-[#E50914] hover:bg-[#c40812] text-white font-bold py-2.5 rounded-xl transition-all disabled:opacity-50 uppercase tracking-wider text-sm">
                            {changeLoading ? "Đang xử lý..." : "Cập Nhật Mã"}
                          </button>
                        </form>

                        {/* Disable Passcode */}
                        <div className="space-y-4 bg-black/20 p-5 rounded-2xl border border-[#222] flex flex-col justify-between">
                          <div>
                            <h3 className="text-white font-bold text-sm uppercase tracking-wider border-b border-[#222] pb-2 text-[#E50914] mb-4">Tắt mã bảo mật</h3>
                            <p className="text-gray-400 text-xs mb-4">
                              Nếu không muốn xác thực passcode khi mua vé nữa, bạn có thể tắt tính năng này bằng cách xác thực lại mật khẩu tài khoản.
                            </p>
                            
                            <form onSubmit={handleDisablePasscode} className="space-y-4">
                              <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Mật khẩu tài khoản</label>
                                <input type="password" required value={disableForm.password}
                                  onChange={(e) => setDisableForm({...disableForm, password: e.target.value})}
                                  placeholder="Nhập mật khẩu để tắt"
                                  className="w-full bg-[#111] text-white border border-[#333] rounded-lg px-4 py-2.5 focus:border-[#E50914] outline-none text-sm" />
                              </div>
                              <button type="submit" disabled={disableLoading}
                                className="w-full flex items-center justify-center bg-[#222] border border-[#333] hover:bg-[#333] text-red-500 font-bold py-2.5 rounded-xl transition-all disabled:opacity-50 uppercase tracking-wider text-sm">
                                {disableLoading ? "Đang xử lý..." : "Tắt mã bảo mật"}
                              </button>
                            </form>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* RESET VIA OTP SECTION */}
                    {passcodeStatus.passcodeEnabled && (
                      <div className="bg-black/20 p-5 rounded-2xl border border-[#222] max-w-md">
                        <h3 className="text-white font-bold text-sm uppercase tracking-wider border-b border-[#222] pb-2 text-[#E50914] mb-4">
                          Quên mã bảo mật?
                        </h3>
                        
                        {resetStep === 1 ? (
                          <div className="space-y-3">
                            <p className="text-gray-400 text-xs">
                              Hệ thống sẽ gửi một mã OTP gồm 6 chữ số đến email đăng ký của bạn để xác thực đặt lại mã bảo mật.
                            </p>
                            <button onClick={handleRequestResetOtp} disabled={resetLoading}
                              className="w-full bg-blue-950/40 hover:bg-blue-900/40 text-blue-400 border border-blue-900/50 font-bold py-2.5 rounded-xl transition-all disabled:opacity-50 uppercase tracking-wider text-xs">
                              {resetLoading ? "Đang gửi OTP..." : "Gửi mã OTP về Email"}
                            </button>
                          </div>
                        ) : (
                          <form onSubmit={handleConfirmReset} className="space-y-4">
                            <p className="text-green-400 text-xs bg-green-950/20 border border-green-900/50 p-2.5 rounded-lg">
                              Mã OTP đã được gửi! Vui lòng kiểm tra hộp thư email của bạn.
                            </p>
                            
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Mã OTP (6 chữ số)</label>
                              <input type="text" required maxLength={6} pattern="\d{6}" value={resetForm.otp}
                                onChange={(e) => setResetForm({...resetForm, otp: e.target.value.replace(/\D/g, "")})}
                                placeholder="123456"
                                className="w-full bg-[#111] text-white border border-[#333] rounded-lg px-4 py-2.5 focus:border-[#E50914] outline-none text-center font-mono text-lg tracking-widest" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Mã mới (6 số)</label>
                                <input type="password" required maxLength={6} pattern="\d{6}" value={resetForm.newPasscode}
                                  onChange={(e) => setResetForm({...resetForm, newPasscode: e.target.value.replace(/\D/g, "")})}
                                  placeholder="******"
                                  className="w-full bg-[#111] text-white border border-[#333] rounded-lg px-4 py-2.5 focus:border-[#E50914] outline-none text-center font-mono text-lg tracking-widest" />
                              </div>
                              
                              <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Nhập lại mã mới</label>
                                <input type="password" required maxLength={6} pattern="\d{6}" value={resetForm.confirmNewPasscode}
                                  onChange={(e) => setResetForm({...resetForm, confirmNewPasscode: e.target.value.replace(/\D/g, "")})}
                                  placeholder="******"
                                  className="w-full bg-[#111] text-white border border-[#333] rounded-lg px-4 py-2.5 focus:border-[#E50914] outline-none text-center font-mono text-lg tracking-widest" />
                              </div>
                            </div>

                            <div className="flex gap-3">
                              <button type="button" onClick={() => setResetStep(1)}
                                className="flex-1 bg-[#333] hover:bg-[#444] text-white font-bold py-2.5 rounded-xl transition-all uppercase tracking-wider text-xs">
                                Hủy
                              </button>
                              <button type="submit" disabled={resetLoading}
                                className="flex-[2] bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl transition-all disabled:opacity-50 uppercase tracking-wider text-xs">
                                {resetLoading ? "Đang xác thực..." : "Xác nhận & Đặt mã"}
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}
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
