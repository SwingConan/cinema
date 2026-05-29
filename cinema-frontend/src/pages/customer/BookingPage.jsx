import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../utils/api";
import socket, { joinShowtime, leaveShowtime } from "../../utils/socket";
import { useAuth } from "../../contexts/AuthContext";
import SeatMap from "../../components/customer/SeatMap";
import ConcessionStep from "../../components/booking/ConcessionStep";
import PasscodeModal from "../../components/customer/PasscodeModal";
import { Clock, Navigation, CheckCircle2, Ticket, QrCode, X, Loader2, Coffee, Tag } from "lucide-react";

export default function BookingPage() {
  const { showtimeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [pendingBookingId, setPendingBookingId] = useState(null);
  const [showPasscode, setShowPasscode] = useState(false);
  const [securityToken, setSecurityToken] = useState(null);
  const [myVouchers, setMyVouchers] = useState([]);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherValidation, setVoucherValidation] = useState(null);
  const [voucherError, setVoucherError] = useState("");
  const [voucherLoading, setVoucherLoading] = useState(false);

  // ── STEP & CONCESSIONS STATE ──────────────────────────────────
  // step 1: Chọn ghế | step 2: Chọn bắp nước | step 3: QR thanh toán
  const [step, setStep] = useState(1);
  // Map<concessionId, { item, quantity }>
  const [selectedConcessions, setSelectedConcessions] = useState(new Map());
  const branchId = data?.showtime?.branchId || data?.showtime?.branch_id || data?.showtime?.room?.branchId || data?.showtime?.room?.branch?.id || null;

  // ── STATE CHO VIETQR PAYMENT MODAL ───────────────────────────
  // Khi null: ẩn modal. Khi có data: hiển thị QR + chờ payment:success
  const [qrModal, setQrModal] = useState(null);
  // { bookingId, vietQrUrl, totalAmount, seats })

  useEffect(() => {
    fetchShowtimeData();

    // ── SOCKET.IO: Tham gia room của showtime này ────────────────
    joinShowtime(showtimeId);

    // ── SOCKET.IO: Tham gia phòng cá nhân nhận payment:success ───
    // Server sẽ emit với: io.to(`user:${userId}`).emit('payment:success', {...})
    if (user?.id) {
      socket.emit('join_user', { userId: user.id });
    }

    // ── SOCKET.IO: Lắng nghe seat_status_changed ──────────────────
    const handleSeatStatusChanged = (e) => {
      console.log('[Socket.io] seat_status_changed:', e);

      setData((prev) => {
        if (!prev) return prev;
        const newBooked = [...(prev.booked_seat_ids || [])];
        const newLocked = [...(prev.locked_seat_ids || [])];
        const bIdx = newBooked.indexOf(e.seatId);
        if (bIdx > -1) newBooked.splice(bIdx, 1);
        const lIdx = newLocked.indexOf(e.seatId);
        if (lIdx > -1) newLocked.splice(lIdx, 1);
        if (e.status === 'booked') newBooked.push(e.seatId);
        if (e.status === 'locked') newLocked.push(e.seatId);
        return {
          ...prev,
          booked_seat_ids: [...new Set(newBooked)],
          locked_seat_ids: [...new Set(newLocked)],
        };
      });
      const currentUserId = user ? user.id : null;
      if (e.status !== 'available' && e.userId !== currentUserId) {
        setSelectedSeats((prev) => prev.filter((s) => s.id !== e.seatId));
      }
    };

    // ── SOCKET.IO: Lắng nghe payment:success ──────────────────────
    // Server emit sau khi Webhook IPN xác nhận thanh toán thành công
    const handlePaymentSuccess = (payload) => {
      console.log('[Socket.io] payment:success:', payload);
      // Đóng modal QR và chuyển sang trang lịch sử vé
      setQrModal(null);
      navigate('/profile', {
        state: { activeTab: 'history' },
        replace: true, // Xoá lịch sử navigate (tránh back về trang booking)
      });
    };

    socket.on('seat_status_changed', handleSeatStatusChanged);
    socket.on('payment:success', handlePaymentSuccess);

    // ── CLEANUP ───────────────────────────────────────────────
    return () => {
      socket.off('seat_status_changed', handleSeatStatusChanged);
      socket.off('payment:success', handlePaymentSuccess);
      leaveShowtime(showtimeId);
      if (user?.id) socket.emit('leave_user', { userId: user.id });
    };
  }, [showtimeId, user]);

  // ── SESSION STORAGE: Lưu ghế đã chọn để khôi phục khi F5 ──────────
  useEffect(() => {
    if (selectedSeats.length > 0) {
      sessionStorage.setItem(
        `booking_seats_${showtimeId}`,
        JSON.stringify(selectedSeats)
      );
    } else {
      sessionStorage.removeItem(`booking_seats_${showtimeId}`);
    }
  }, [selectedSeats, showtimeId]);

  // ── SESSION STORAGE: Khôi phục ghế khi component mount (sau F5) ────
  useEffect(() => {
    if (!data) return; // Đợi showtime data load xong
    const saved = sessionStorage.getItem(`booking_seats_${showtimeId}`);
    if (saved && selectedSeats.length === 0) {
      try {
        const restored = JSON.parse(saved);
        // Lọc bỏ những ghế đã bị booked bởi người khác (trong lúc F5)
        const unavailable = new Set([
          ...(data.booked_seat_ids || []),
        ]);
        const valid = restored.filter(s => !unavailable.has(s.id));
        if (valid.length > 0) {
          setSelectedSeats(valid);
          console.log(`[SessionStorage] Khôi phục ${valid.length} ghế đã chọn.`);
        }
      } catch { /* ignore parse errors */ }
    }
  }, [data]);

  // ── CLEANUP: Hủy booking pending nếu khách rời trang ở Step 3 ──────
  useEffect(() => {
    if (!pendingBookingId) return;
    const handleBeforeUnload = () => {
      // Dùng sendBeacon để gửi cancel request trước khi tab đóng
      const token = localStorage.getItem('token');
      navigator.sendBeacon(
        `/api/customer/bookings/${pendingBookingId}/cancel`,
        new Blob([JSON.stringify({ _method: 'PUT' })], { type: 'application/json' })
      );
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [pendingBookingId]);

  const fetchShowtimeData = useCallback(async () => {
    try {
      const res = await api.get(`/public/showtimes/${showtimeId}`);
      const raw = res.data;

      // Backend trả về object PHẲNG (không wrap trong {showtime: ...}):
      // { id, movieId, roomId, movie: {...}, room: {seats:[...]},
      //   bookedSeatIds: [...], lockedSeatIds: [...] }
      const showtimeObj = raw.showtime ?? raw; // hỗ trợ cả 2 format
      const normalized = {
        showtime:        showtimeObj,
        booked_seat_ids: raw.bookedSeatIds  ?? raw.booked_seat_ids  ?? [],
        locked_seat_ids: raw.lockedSeatIds  ?? raw.locked_seat_ids  ?? [],
      };

      // Đảm bảo seats có room_id (snake_case) để SeatMap dùng
      if (normalized.showtime?.room?.seats) {
        normalized.showtime.room.seats = normalized.showtime.room.seats.map(s => ({
          ...s,
          room_id: s.room_id ?? s.roomId,
        }));
      }

      setData(normalized);
      setLoading(false);

      // Bỏ chọn các ghế đã hết hiệu lực khi refresh
      setSelectedSeats((prev) => {
        const unavailable = [
          ...normalized.booked_seat_ids,
          ...normalized.locked_seat_ids,
        ];
        return prev.filter((s) => !unavailable.includes(s.id));
      });
    } catch (error) {
      console.error('Error fetching showtime', error);
      setError('Không thể lấy dữ liệu suất chiếu. Vui lòng thử lại sau.');
      setLoading(false);
    }
  }, [showtimeId]);

  const handleSeatSelect = async (seat) => {
    const exists = selectedSeats.find((s) => s.id === seat.id);

    if (exists) {
      // Unlock seat on server
      try {
        setSelectedSeats((prev) => prev.filter((s) => s.id !== seat.id));
        await api.delete("/customer/seats/unlock", {
          data: { showtime_id: showtimeId, seat_id: seat.id },
        });
      } catch (err) {
        console.error("Unlock error", err);
      }
    } else {
      if (selectedSeats.length >= 8) {
        alert("Bạn chỉ có thể đặt tối đa 8 ghế trong một giao dịch.");
        return;
      }

      // Proactive locking on server
      try {
        await api.post("/customer/seats/lock", {
          showtime_id: showtimeId,
          seat_id: seat.id,
        });
        setSelectedSeats((prev) => [...prev, seat]);
      } catch (err) {
        alert(err.response?.data?.message || "Không thể giữ ghế này.");
        fetchShowtimeData(); // refresh
      }
    }
  };

  const handleClearSelection = async () => {
    if (selectedSeats.length === 0) return;

    try {
      await Promise.all(
        selectedSeats.map((seat) =>
          api.delete("/customer/seats/unlock", {
            data: { showtime_id: showtimeId, seat_id: seat.id },
          }),
        ),
      );
    } catch (error) {
      console.error("Unlock error", error);
    } finally {
      setSelectedSeats([]);
    }
  };

  const calculateSeatTotal = () => {
    if (!data || !data.showtime) return 0;
    return selectedSeats.reduce((total, seat) => {
      const st = data.showtime;
      switch (seat.type) {
        case 'vip':    return total + parseInt(st.priceVip    ?? st.price_vip    ?? 0);
        case 'couple': return total + parseInt(st.priceCouple ?? st.price_couple ?? 0);
        default:       return total + parseInt(st.priceRegular ?? st.price_regular ?? 0);
      }
    }, 0);
  };

  const calculateConcessionTotal = () =>
    Array.from(selectedConcessions.values()).reduce(
      (sum, { item, quantity }) => sum + item.price * quantity, 0
    );

  const calculateTotal = () => calculateSeatTotal() + calculateConcessionTotal();
  const calculatePayableTotal = () => Math.max(0, calculateTotal() - (voucherValidation?.discountAmount || 0));

  useEffect(() => {
    if (step !== 3 || !user) return;
    api.get("/customer/vouchers/my-vouchers")
      .then((res) => setMyVouchers(Array.isArray(res.data) ? res.data : (res.data?.data ?? [])))
      .catch((err) => console.error("Voucher fetch error:", err));
  }, [step, user]);

  useEffect(() => {
    setVoucherValidation(null);
    setVoucherError("");
  }, [selectedSeats, selectedConcessions]);

  const handleApplyVoucher = async (code = voucherCode) => {
    const normalizedCode = String(code || "").trim().toUpperCase();
    if (!normalizedCode) {
      setVoucherError("Vui lòng nhập mã voucher.");
      return;
    }
    setVoucherLoading(true);
    setVoucherError("");
    try {
      const res = await api.post("/customer/vouchers/validate", {
        code: normalizedCode,
        orderAmount: calculateTotal(),
        branchId,
      });
      setVoucherCode(normalizedCode);
      setVoucherValidation(res.data);
    } catch (err) {
      setVoucherValidation(null);
      setVoucherError(err.response?.data?.message || "Không thể áp dụng voucher.");
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleCheckout = async (overrideToken) => {
    if (!user) {
      alert("Vui lòng đăng nhập để tiếp tục đặt vé.");
      navigate("/login");
      return;
    }
    if (selectedSeats.length === 0) return;

    setIsSubmitting(true);
    setError("");

    // Resolve token: prefer overrideToken (string only), then state
    const token = (typeof overrideToken === 'string') ? overrideToken : (typeof securityToken === 'string' ? securityToken : null);
    const headers = token ? { 'X-Security-Token': token } : {};

    try {
      // Build concessions payload từ Map
      const concessionsPayload = Array.from(selectedConcessions.values()).map(
        ({ item, quantity }) => ({ id: item.id, quantity })
      );

      const res = await api.post("/customer/bookings", {
        showtime_id:  showtimeId,
        seat_ids:     selectedSeats.map((s) => s.id),
        concessions:  concessionsPayload,
        voucher_code: voucherValidation?.voucher?.code || null,
      }, { headers });

      const { id: bookingId, vietQrUrl, totalAmount } = res.data;

      if (vietQrUrl) {
        setPendingBookingId(bookingId);
        setQrModal({
          bookingId,
          vietQrUrl,
          totalAmount: totalAmount ?? calculateTotal(),
          seats: selectedSeats,
          concessions: Array.from(selectedConcessions.values()),
        });
        setSelectedSeats([]);
        setSelectedConcessions(new Map());
        setVoucherCode("");
        setVoucherValidation(null);
        setStep(1);
        sessionStorage.removeItem(`booking_seats_${showtimeId}`);
      } else {
        navigate('/profile', { state: { activeTab: 'history' } });
      }
    } catch (err) {
      console.error("Checkout error:", err);
      if (err.response?.status === 428 && err.response?.data?.requirePasscode) {
        setShowPasscode(true);
        setIsSubmitting(false);
        return;
      }
      setError(err.response?.data?.message || "Có lỗi xảy ra khi xử lý thanh toán.");
      fetchShowtimeData();
      setSelectedSeats([]);
      setStep(1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  if (loading && !data)
    return (
      <div className="flex justify-center items-center h-[80vh]">
        Đang tải sơ đồ phòng chiếu...
      </div>
    );
  if (error && !data)
    return (
      <div className="p-8 text-center text-red-500 font-bold">{error}</div>
    );

  const { showtime, booked_seat_ids, locked_seat_ids } = data;
  // Guard: nếu showtime chưa load xong hoặc thiếu movie/room
  if (!showtime || !showtime.movie || !showtime.room) {
    return <div className="flex justify-center items-center h-[80vh] text-gray-400">Đang tải dữ liệu suất chiếu...</div>;
  }
  const { movie, room } = showtime;
  const st = showtime;

  return (
    <div className="bg-[#141414] min-h-[calc(100vh-64px)] pb-20">

      {/* ===== VIETQR PAYMENT MODAL ===== */}
      {qrModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
             onClick={(e) => { if (e.target === e.currentTarget) setQrModal(null); }}>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#E50914] to-[#b81d24] p-5 flex items-center justify-between">
              <div className="flex items-center">
                <QrCode className="w-6 h-6 text-white mr-2" />
                <h2 className="text-white font-black text-lg uppercase tracking-wider">Thanh Toán VietQR</h2>
              </div>
              <button onClick={() => setQrModal(null)}
                      className="text-red-200 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 text-center">
              {/* QR Image */}
              <div className="bg-white p-3 rounded-xl inline-block shadow-lg mb-4 border-4 border-[#E50914]/30">
                <img
                  src={qrModal.vietQrUrl}
                  alt="VietQR Payment"
                  className="w-56 h-56 object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=CINEMA+BOOKING+${qrModal.bookingId}`;
                  }}
                />
              </div>

              {/* Amount */}
              <div className="mb-4">
                <p className="text-gray-400 text-sm font-medium mb-1">Số tiền cần chuyển</p>
                <p className="text-3xl font-black text-[#E50914]">
                  {formatCurrency(qrModal.totalAmount)}
                </p>
              </div>

              {/* Transfer info */}
              <div className="bg-[#111] border border-[#333] rounded-xl p-4 text-left mb-5 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Nội dung CK:</span>
                  <span className="text-white font-black tracking-wider">CINEMA BOOKING {qrModal.bookingId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Mã đơn:</span>
                  <span className="font-mono text-[#E50914] font-bold">#{qrModal.bookingId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Ghế:</span>
                  <span className="text-white font-bold">
                    {qrModal.seats.map(s => `${s.row}${s.column}`).join(', ')}
                  </span>
                </div>
              </div>

              {/* Waiting indicator */}
              <div className="flex items-center justify-center gap-2 text-yellow-400 text-sm font-medium bg-yellow-900/20 border border-yellow-900/50 rounded-lg px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Chờ xác nhận thanh toán tự động...</span>
              </div>

              <p className="text-gray-600 text-xs mt-4">
                Trang sẽ tự động chuyển sau khi ngân hàng xác nhận.
                <br/>
                Ghế giữ trong <span className="text-yellow-400 font-bold">5 phút</span>.
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Header / Info Strip */}
      <div className="bg-black text-white shadow-lg border-b border-[#333]">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-black truncate pr-4 text-white drop-shadow-md">
              {movie.title}
            </h1>
            <div className="flex items-center text-gray-400 mt-2 space-x-4 text-sm font-medium">
              <span className="flex items-center">
                <Navigation size={14} className="mr-1 text-[#E50914]" />{" "}
                {room.name}
              </span>
              <span className="flex items-center">
                <Clock size={14} className="mr-1 text-[#E50914]" />{" "}
                {new Date((showtime.startTime ?? showtime.start_time ?? '').toString().replace('Z', '')).toLocaleString("vi-VN")}
              </span>
              <span className="text-red-400 border border-red-900/50 bg-red-900/10 px-2 py-0.5 rounded text-xs">
                {room.type}
              </span>
            </div>

            {/* Render dynamic pricing applied rules badges */}
            {showtime.appliedRules && showtime.appliedRules.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {showtime.appliedRules.map((rule, idx) => {
                  const isDiscount = rule.value < 0;
                  const icon = isDiscount ? "☀️" : "⭐";
                  const colorClass = isDiscount
                    ? "bg-green-950/60 text-green-400 border-green-800/40"
                    : "bg-yellow-950/60 text-yellow-400 border-yellow-800/40";
                  return (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${colorClass}`}
                    >
                      <span>{icon}</span>
                      <span>{rule.name}</span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── STEP INDICATOR ────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex items-center gap-2 mb-6">
          {[{n:1,label:'Chọn ghế'},{n:2,label:'Bắp & Nước'},{n:3,label:'Thanh toán'}].map(({n,label},i) => (
            <>
              <div key={n} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-all ${
                step === n ? 'bg-[#E50914] text-white' : step > n ? 'bg-green-900/40 text-green-400 border border-green-900/50' : 'text-gray-600'
              }`}>
                <span>{step > n ? '✓' : n}</span><span className="hidden sm:inline">{label}</span>
              </div>
              {i < 2 && <div className="flex-1 h-px bg-[#333]" />}
            </>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
        {/* Seat Map Area — ẩn khi bước 2 */}
        <div className={`lg:col-span-2 bg-[#1a1a1a] rounded-xl shadow-2xl border border-[#333] overflow-hidden relative ${step === 2 ? 'hidden lg:block opacity-40 pointer-events-none' : ''}`}>
          {isSubmitting && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="bg-[#222] text-white border border-[#444] px-6 py-4 rounded-full flex items-center shadow-2xl font-bold text-lg">
                <Loader2 className="animate-spin mr-3 h-6 w-6 text-[#E50914]" />Đang xử lý...
              </div>
            </div>
          )}
          <div className="p-4 bg-[#111] border-b border-[#333] flex items-center justify-between text-sm">
            <span className="text-gray-400 font-bold uppercase tracking-wider">Bản đồ ghế</span>
            <span className="text-[#E50914] font-black">{room.seats.length} ghế</span>
          </div>
          <div className="p-6">
            {error && <div className="mb-6 bg-red-900/20 text-red-400 p-4 rounded-lg border border-red-900/50 font-medium">{error}</div>}
            <SeatMap seats={room.seats} bookedIds={booked_seat_ids} lockedIds={locked_seat_ids} selectedSeats={selectedSeats} onSeatSelect={handleSeatSelect} />
          </div>
        </div>

        {/* ConcessionStep — hiện ở mobile thay thế SeatMap, desktop luôn hiện bên phải */}
        {step === 2 && (
          <div className="lg:col-span-2 bg-[#1a1a1a] rounded-xl shadow-2xl border border-[#333] p-6 lg:hidden">
            <ConcessionStep
              selectedConcessions={selectedConcessions}
              onUpdateConcessions={setSelectedConcessions}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
              branchId={branchId}
            />
          </div>
        )}

        {/* Booking Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-[#1a1a1a] rounded-xl shadow-2xl border border-[#333] overflow-hidden sticky top-24">
            <div className="bg-[#E50914] p-5 text-white text-center border-b border-red-700">
              <Ticket className="w-10 h-10 mx-auto mb-1.5 opacity-90" />
              <h2 className="text-xl font-black uppercase tracking-widest">Thông tin vé</h2>
            </div>

            {/* Desktop: ConcessionStep trong sidebar khi step 2 */}
            {step === 2 ? (
              <div className="p-5 hidden lg:block">
                <ConcessionStep
                  selectedConcessions={selectedConcessions}
                  onUpdateConcessions={setSelectedConcessions}
                  onNext={() => setStep(3)}
                  onBack={() => setStep(1)}
                  branchId={branchId}
                />
              </div>
            ) : (
              <div className="p-6">
                <div className="mb-6 space-y-4">
                  <div className="border-b border-dashed border-[#444] pb-4">
                    <p className="text-sm text-gray-500 mb-1 font-medium">Rạp / Phòng</p>
                    <p className="font-bold text-white text-lg">CinemaMS / {room.name}</p>
                  </div>
                  <div className="border-b border-dashed border-[#444] pb-4">
                    <p className="text-sm text-gray-500 mb-1 font-medium">Suất chiếu</p>
                    <p className="font-bold text-white text-lg">
                      {new Date((st.startTime ?? st.start_time ?? '').toString().replace('Z', '')).toLocaleString("vi-VN")}{" "}
                      <span className="text-red-400 text-sm">({room.type})</span>
                    </p>
                  </div>
                  <div className="border-b border-dashed border-[#444] pb-4">
                    <p className="text-sm text-gray-500 mb-3 flex justify-between items-end">
                      <span className="font-medium">Ghế đã chọn ({selectedSeats.length})</span>
                      {selectedSeats.length > 0 && (
                        <button onClick={handleClearSelection} className="text-xs text-red-500 hover:text-red-400 underline font-bold">Xóa chọn</button>
                      )}
                    </p>
                    {selectedSeats.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedSeats.map((s) => (
                          <span key={s.id} className="bg-[#E50914]/20 text-red-100 border border-[#E50914]/50 px-3 py-1.5 rounded text-sm font-black">
                            {s.row}{s.column}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic text-sm bg-[#111] p-3 rounded border border-[#222]">Vui lòng chọn ghế trên sơ đồ...</p>
                    )}
                  </div>

                  {/* Pricing breakdown */}
                  {selectedSeats.length > 0 && (
                    <div className="bg-[#111] p-4 rounded-lg text-sm border border-[#222] space-y-1.5">
                      {["regular", "vip", "couple"].map((type) => {
                        const typeSeats = selectedSeats.filter((s) => s.type === type);
                        if (typeSeats.length === 0) return null;
                        const price = type === "vip" ? (st.priceVip ?? st.price_vip ?? 0)
                          : type === "couple" ? (st.priceCouple ?? st.price_couple ?? 0)
                          : (st.priceRegular ?? st.price_regular ?? 0);
                        const label = type === "vip" ? "Ghế VIP" : type === "couple" ? "Ghế Đôi" : "Ghế Thường";
                        return (
                          <div key={type} className="flex justify-between text-gray-400 font-medium">
                            <span>{typeSeats.length} x {label}</span>
                            <span className="text-gray-200">{formatCurrency(price * typeSeats.length)}</span>
                          </div>
                        );
                      })}
                      {/* Concession subtotal nếu đã chọn */}
                      {calculateConcessionTotal() > 0 && (
                        <div className="flex justify-between text-gray-400 font-medium border-t border-[#2a2a2a] pt-1.5 mt-1">
                          <span className="flex items-center gap-1"><Coffee className="w-3 h-3" />Bắp & Nước</span>
                          <span className="text-gray-200">{formatCurrency(calculateConcessionTotal())}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {step === 3 && (
                  <div className="mb-5 rounded-xl border border-[#333] bg-[#111] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <Tag className="w-4 h-4 text-[#E50914]" /> Voucher
                      </p>
                      {voucherValidation && (
                        <button
                          onClick={() => { setVoucherValidation(null); setVoucherCode(""); setVoucherError(""); }}
                          className="text-xs font-bold text-gray-500 hover:text-red-400"
                        >
                          Bỏ áp dụng
                        </button>
                      )}
                    </div>

                    {myVouchers.length > 0 && (
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                        {myVouchers.map((voucher) => (
                          <button
                            key={voucher.id}
                            onClick={() => handleApplyVoucher(voucher.code)}
                            disabled={voucherLoading}
                            className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${
                              voucherValidation?.voucher?.id === voucher.id
                                ? "border-emerald-500 bg-emerald-950/20"
                                : "border-[#2a2a2a] bg-black/30 hover:border-[#E50914]"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-mono text-sm font-black text-white">{voucher.code}</span>
                              <span className="text-xs font-black text-emerald-400">
                                -{formatCurrency(voucher.discountValue)}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 truncate">{voucher.name}</p>
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                        placeholder="Nhập mã voucher"
                        className="min-w-0 flex-1 rounded-lg border border-[#333] bg-black px-3 py-2 text-sm font-bold text-white outline-none focus:border-[#E50914]"
                      />
                      <button
                        onClick={() => handleApplyVoucher()}
                        disabled={voucherLoading}
                        className="rounded-lg bg-[#E50914] px-3 py-2 text-xs font-black uppercase text-white disabled:opacity-50"
                      >
                        {voucherLoading ? "..." : "Áp dụng"}
                      </button>
                    </div>

                    {voucherError && <p className="text-xs font-medium text-red-400">{voucherError}</p>}
                    {voucherValidation && (
                      <p className="text-xs font-bold text-emerald-400">
                        Đã giảm {formatCurrency(voucherValidation.discountAmount)}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center mb-5 py-4 border-t-2 border-dashed border-[#444]">
                  <span className="text-gray-400 font-bold uppercase tracking-wider text-sm">Tổng cộng</span>
                  <span className="text-3xl font-black text-[#E50914]">{formatCurrency(calculatePayableTotal())}</span>
                </div>

                {/* CTA Button — thay đổi theo step */}
                {step === 1 && (
                  <button
                    onClick={() => setStep(2)}
                    disabled={selectedSeats.length === 0}
                    className={`w-full py-4 rounded-lg flex items-center justify-center font-black text-lg transition-all shadow-lg text-white uppercase tracking-wider
                      ${selectedSeats.length === 0 ? "opacity-50 cursor-not-allowed bg-[#333] text-gray-500" : "bg-[#E50914] hover:bg-[#F40612] hover:shadow-[0_0_15px_rgba(229,9,20,0.6)] active:scale-95"}`}
                  >
                    <Coffee size={22} className="mr-2" />
                    Chọn Bắp & Nước
                  </button>
                )}

                {step === 3 && (
                  <button
                    onClick={() => handleCheckout()}
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-lg flex items-center justify-center font-black text-lg bg-[#E50914] hover:bg-[#F40612] text-white uppercase tracking-wider transition-all shadow-lg hover:shadow-[0_0_15px_rgba(229,9,20,0.6)] active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? <><Loader2 className="animate-spin mr-2 w-5 h-5" />Đang xử lý...</> : <><CheckCircle2 size={22} className="mr-2" strokeWidth={3} />Thanh Toán Ngay</>}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── PASSCODE MODAL ──────────────────────────────────────── */}
      <PasscodeModal
        isOpen={showPasscode}
        onClose={() => setShowPasscode(false)}
        onSuccess={(token) => {
          setSecurityToken(token);
          setShowPasscode(false);
          setTimeout(() => handleCheckout(token), 100);
        }}
      />
    </div>
  );
}
