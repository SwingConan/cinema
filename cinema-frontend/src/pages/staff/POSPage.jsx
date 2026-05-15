// src/pages/staff/POSPage.jsx
// =============================================
// TRANG POS — Bán vé tại quầy cho Staff
// =============================================
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import socket, { joinShowtime, leaveShowtime } from "../../utils/socket";
import SeatMap from "../../components/customer/SeatMap";
import ConcessionStep from "../../components/booking/ConcessionStep";
import { QRCodeSVG } from "qrcode.react";
import {
  Monitor, Calendar, ChevronRight, CheckCircle2, ShoppingCart,
  Ticket, Coffee, X, Loader2, Mail, RotateCcw, ArrowLeft, Film, Clock,
  Printer, CreditCard, Banknote
} from "lucide-react";

const formatCurrency = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);

// ── Toast đơn giản (không cần thư viện) ────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`fixed top-5 right-5 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border text-white font-bold text-sm animate-in slide-in-from-right-4 duration-300 ${
      type === "success" ? "bg-green-900 border-green-700" : "bg-red-900 border-red-700"
    }`}>
      {type === "success" ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <X className="w-5 h-5 text-red-400" />}
      {msg}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
    </div>
  );
}

export default function POSPage() {
  const navigate = useNavigate();

  // ── Bước chọn suất chiếu ─────────────────────────────────────────────────
  const [showtimes, setShowtimes] = useState([]);
  const [showtimeId, setShowtimeId] = useState(null);
  const [showtimeData, setShowtimeData] = useState(null);
  const [loadingShowtimes, setLoadingShowtimes] = useState(true);
  const [loadingSeatMap, setLoadingSeatMap] = useState(false);

  // ── Step 1 navigation state ───────────────────────────────────────────────
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const today = new Date().toLocaleDateString('sv-SE'); // 'YYYY-MM-DD'
  const [selectedDate, setSelectedDate] = useState(today);

  // ── Derived data (useMemo) ────────────────────────────────────────────────
  const uniqueMovies = useMemo(() => {
    const map = new Map();
    showtimes.forEach(st => {
      const id = st.movieId ?? st.movie_id;
      if (!map.has(id)) map.set(id, st.movie);
    });
    return Array.from(map.entries()).map(([id, movie]) => ({ id, ...movie }));
  }, [showtimes]);

  const availableDates = useMemo(() => {
    if (!selectedMovieId) return [];
    const dates = new Set(
      showtimes
        .filter(st => (st.movieId ?? st.movie_id) === selectedMovieId)
        .map(st => {
          const raw = (st.startTime ?? st.start_time ?? '').toString().replace('Z', '');
          return raw.slice(0, 10);
        })
    );
    return Array.from(dates).sort();
  }, [showtimes, selectedMovieId]);

  const filteredShowtimes = useMemo(() => {
    if (!selectedMovieId) return [];
    return showtimes.filter(st => {
      const mid = st.movieId ?? st.movie_id;
      const raw = (st.startTime ?? st.start_time ?? '').toString().replace('Z', '');
      const dateStr = raw.slice(0, 10);
      return mid === selectedMovieId && dateStr === selectedDate;
    });
  }, [showtimes, selectedMovieId, selectedDate]);

  // Group filteredShowtimes by room
  const showtimesByRoom = useMemo(() => {
    const map = new Map();
    filteredShowtimes.forEach(st => {
      const roomName = st.room?.name ?? 'Phòng không xác định';
      if (!map.has(roomName)) map.set(roomName, []);
      map.get(roomName).push(st);
    });
    return map;
  }, [filteredShowtimes]);

  // ── Ghế + Bắp nước + Email ────────────────────────────────────────────────
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedConcessions, setSelectedConcessions] = useState(new Map());
  const [customerEmail, setCustomerEmail] = useState("");
  const [showConcessions, setShowConcessions] = useState(false);

  // ── Trạng thái Checkout ──────────────────────────────────────────────────
  const [posStep, setPosStep] = useState('selecting'); // 'selecting' | 'confirming' | 'paying' | 'receipt'
  const [paymentMethod, setPaymentMethod] = useState(''); // 'cash' | 'card'
  const [lastBookingResult, setLastBookingResult] = useState(null);
  const [pendingBookingId, setPendingBookingId] = useState(null);
  const [vietQrUrl, setVietQrUrl] = useState('');

  // ── Trạng thái chung ─────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  // ── 1. Load danh sách suất chiếu hôm nay ─────────────────────────────────
  useEffect(() => {
    const fetchShowtimes = async () => {
      try {
        const res = await api.get("/staff/showtimes");
        const list = Array.isArray(res.data) ? res.data : (res.data.data ?? res.data.value ?? []);
        setShowtimes(list);
      } catch (err) {
        console.error("API Fetch Error:", err);
        const errMsg = err.response?.data?.message || err.message || "Lỗi không xác định";
        showToast(`Lỗi: ${errMsg}`, "error");
      } finally {
        setLoadingShowtimes(false);
      }
    };
    fetchShowtimes();
  }, []);

  // ── 2. Load sơ đồ ghế khi chọn suất chiếu ───────────────────────────────
  const fetchSeatMap = useCallback(async (sid) => {
    setLoadingSeatMap(true);
    setSelectedSeats([]);
    setSelectedConcessions(new Map());
    setShowConcessions(false);
    try {
      const res = await api.get(`/public/showtimes/${sid}`);
      const raw = res.data;
      const st = raw.showtime ?? raw;
      const normalized = {
        showtime: st,
        booked_seat_ids: raw.bookedSeatIds ?? raw.booked_seat_ids ?? [],
        locked_seat_ids: raw.lockedSeatIds ?? raw.locked_seat_ids ?? [],
      };
      if (normalized.showtime?.room?.seats) {
        normalized.showtime.room.seats = normalized.showtime.room.seats.map(s => ({
          ...s, room_id: s.room_id ?? s.roomId,
        }));
      }
      setShowtimeData(normalized);
    } catch {
      showToast("Không thể tải sơ đồ ghế.", "error");
      setShowtimeData(null);
    } finally {
      setLoadingSeatMap(false);
    }
  }, []);

  useEffect(() => {
    if (!showtimeId) return;
    fetchSeatMap(showtimeId);
    joinShowtime(showtimeId);
    // Real-time: cập nhật ghế live
    const handler = (e) => {
      setShowtimeData(prev => {
        if (!prev) return prev;
        const newBooked = [...(prev.booked_seat_ids || [])];
        const newLocked = [...(prev.locked_seat_ids || [])];
        const bi = newBooked.indexOf(e.seatId); if (bi > -1) newBooked.splice(bi, 1);
        const li = newLocked.indexOf(e.seatId); if (li > -1) newLocked.splice(li, 1);
        if (e.status === "booked") newBooked.push(e.seatId);
        if (e.status === "locked") newLocked.push(e.seatId);
        return { ...prev, booked_seat_ids: [...new Set(newBooked)], locked_seat_ids: [...new Set(newLocked)] };
      });
      setSelectedSeats(prev => prev.filter(s => s.id !== e.seatId || e.status === "available"));
    };
    socket.on("seat_status_changed", handler);
    return () => {
      socket.off("seat_status_changed", handler);
      leaveShowtime(showtimeId);
    };
  }, [showtimeId, fetchSeatMap]);

  // ── 3. Chọn / bỏ ghế (POS: không cần lock API) ──────────────────────────
  const handleSeatSelect = (seat) => {
    setSelectedSeats(prev => {
      const exists = prev.find(s => s.id === seat.id);
      if (exists) return prev.filter(s => s.id !== seat.id);
      if (prev.length >= 8) { showToast("Tối đa 8 ghế mỗi giao dịch.", "error"); return prev; }
      return [...prev, seat];
    });
  };

  // ── 4. Tính tiền ──────────────────────────────────────────────────────────
  const calcSeatTotal = () => {
    if (!showtimeData?.showtime) return 0;
    const st = showtimeData.showtime;
    return selectedSeats.reduce((sum, s) => {
      const p = s.type === "vip" ? (st.priceVip ?? st.price_vip ?? 0)
        : s.type === "couple" ? (st.priceCouple ?? st.price_couple ?? 0)
        : (st.priceRegular ?? st.price_regular ?? 0);
      return sum + parseInt(p);
    }, 0);
  };
  const calcConcessionTotal = () =>
    Array.from(selectedConcessions.values()).reduce((s, { item, quantity }) => s + item.price * quantity, 0);
  const grandTotal = calcSeatTotal() + calcConcessionTotal();

  // ── 5. Thanh toán (GỌI API) ───────────────────────────────────────────────
  const handlePOSCheckout = async () => {
    if (selectedSeats.length === 0) { showToast("Vui lòng chọn ít nhất 1 ghế.", "error"); return; }
    if (!paymentMethod) { showToast("Vui lòng chọn phương thức thanh toán.", "error"); return; }
    
    setIsSubmitting(true);
    try {
      const concessionsPayload = Array.from(selectedConcessions.values()).map(({ item, quantity }) => ({
        id: item.id, quantity,
      }));
      const res = await api.post("/staff/pos/bookings", {
        showtime_id:    parseInt(showtimeId),
        seat_ids:       selectedSeats.map(s => s.id),
        concessions:    concessionsPayload,
        customer_email: customerEmail.trim() || null,
        payment_method: paymentMethod,
      });

      if (paymentMethod === 'cash') {
        // Tiền mặt → paid ngay → hiện biên lai
        showToast(`✅ Bán vé thành công! Tổng: ${formatCurrency(grandTotal)}`, "success");
        setLastBookingResult(res.data);
        setPosStep('receipt');
      } else {
        // Chuyển khoản → pending → hiện QR chờ xác nhận
        setPendingBookingId(res.data.id);
        setVietQrUrl(res.data.vietQrUrl);
        setLastBookingResult(res.data); // Save to use totalAmount in paying UI
        setPosStep('paying');
      }
      fetchSeatMap(showtimeId);
    } catch (err) {
      showToast(err.response?.data?.message || "Có lỗi xảy ra khi thanh toán.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── 5b. Staff xác nhận đã nhận tiền (chuyển khoản) ────────────────────────
  const handleConfirmPayment = async () => {
    if (!pendingBookingId) return;
    setIsSubmitting(true);
    try {
      const res = await api.post(`/staff/pos/bookings/${pendingBookingId}/confirm`, {
        customer_email: customerEmail.trim() || null,
      });
      showToast("✅ Xác nhận thanh toán thành công!", "success");
      setLastBookingResult(res.data);
      setPosStep('receipt');
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi xác nhận thanh toán.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── 5c. Staff hủy đơn POS pending ─────────────────────────────────────────
  const handleCancelPOS = async () => {
    if (!pendingBookingId) return;
    setIsSubmitting(true);
    try {
      await api.put(`/staff/pos/bookings/${pendingBookingId}/cancel`);
      showToast("🚫 Đã hủy giao dịch.", "success");
      setPendingBookingId(null);
      setVietQrUrl('');
      setPosStep('selecting');
      setPaymentMethod('');
      fetchSeatMap(showtimeId);
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi hủy giao dịch.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAll = () => {
    setShowtimeId(null);
    setShowtimeData(null);
    setSelectedSeats([]);
    setSelectedConcessions(new Map());
    setCustomerEmail("");
    setShowConcessions(false);
    setSelectedMovieId(null);
    setSelectedDate(today);
    setPosStep('selecting');
    setPaymentMethod('');
    setLastBookingResult(null);
    setPendingBookingId(null);
    setVietQrUrl('');
  };

  const nextCustomer = () => {
    // Chỉ reset giỏ hàng, giữ nguyên suất chiếu đang chọn
    setSelectedSeats([]);
    setSelectedConcessions(new Map());
    setCustomerEmail("");
    setShowConcessions(false);
    setPosStep('selecting');
    setPaymentMethod('');
    setLastBookingResult(null);
    setPendingBookingId(null);
    setVietQrUrl('');
  };

  // Helper: format 'YYYY-MM-DD' → 'DD/MM'
  const fmtDate = (dateStr) => {
    const [y, m, d] = dateStr.split('-');
    const dt = new Date(+y, +m - 1, +d);
    const todayDt = new Date(); todayDt.setHours(0,0,0,0);
    const tomorrowDt = new Date(todayDt); tomorrowDt.setDate(tomorrowDt.getDate() + 1);
    if (dt.toDateString() === todayDt.toDateString()) return 'Hôm nay';
    if (dt.toDateString() === tomorrowDt.toDateString()) return 'Ngày mai';
    return dt.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
  };

  // Helper: extract HH:MM from showtime
  const fmtTime = (st) => {
    const raw = (st.startTime ?? st.start_time ?? '').toString().replace('Z', '');
    return raw.slice(11, 16);
  };

  // API base for poster images
  const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="bg-[#0d0d0d] min-h-screen text-white">
      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="bg-black border-b border-[#222] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-[#E50914] p-2 rounded-lg">
            <Monitor className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white">Bán vé tại quầy</h1>
            <p className="text-xs text-gray-500">Point of Sale — Staff Interface</p>
          </div>
        </div>
        {showtimeId && (
          <button onClick={resetAll} className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors border border-[#333] px-3 py-1.5 rounded-lg hover:border-[#555]">
            <RotateCcw className="w-4 h-4" />Đổi suất chiếu
          </button>
        )}
      </div>

      {/* ── BƯỚC 1: Chọn suất chiếu (3-step: Phim → Ngày → Giờ) ─────────── */}
      {!showtimeId && (
        <div className="min-h-[calc(100vh-64px)] p-6">
          {loadingShowtimes ? (
            <div className="flex items-center justify-center py-32 text-gray-500 gap-3">
              <Loader2 className="w-6 h-6 animate-spin" /><span className="text-sm">Đang tải dữ liệu...</span>
            </div>
          ) : !selectedMovieId ? (
            /* ── PHẦN A: Chọn Phim ── */
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-2 mb-6">
                <Film className="w-5 h-5 text-[#E50914]" />
                <h2 className="text-lg font-bold text-white">Chọn Phim</h2>
                <span className="text-xs text-gray-500 ml-2">({uniqueMovies.length} phim đang chiếu)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {uniqueMovies.map(movie => (
                  <button
                    key={movie.id}
                    onClick={() => {
                      setSelectedMovieId(movie.id);
                      // auto-select today if available, else first available date
                      const dates = showtimes
                        .filter(st => (st.movieId ?? st.movie_id) === movie.id)
                        .map(st => (st.startTime ?? st.start_time ?? '').toString().replace('Z','').slice(0,10));
                      const uniqueDates = [...new Set(dates)].sort();
                      setSelectedDate(uniqueDates.includes(today) ? today : (uniqueDates[0] ?? today));
                    }}
                    className="group flex flex-col bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#E50914]/60 rounded-xl overflow-hidden transition-all hover:shadow-[0_0_20px_rgba(229,9,20,0.2)] hover:-translate-y-0.5 text-left"
                  >
                    <div className="aspect-[2/3] bg-[#111] overflow-hidden relative">
                      {movie.poster ? (
                        <img
                          src={`${API_BASE}/uploads/${movie.poster}`}
                          alt={movie.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={e => { e.target.style.display='none'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film className="w-10 h-10 text-gray-700" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      {movie.rated && (
                        <span className="absolute top-2 right-2 bg-[#E50914] text-white text-[10px] font-black px-1.5 py-0.5 rounded">{movie.rated}</span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="text-white text-xs font-bold line-clamp-2 group-hover:text-[#E50914] transition-colors leading-tight">{movie.title}</p>
                      <p className="text-gray-600 text-[10px] mt-1">{movie.duration ? `${movie.duration} phút` : ''}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ── PHẦN B: Chọn Ngày & Giờ chiếu ── */
            <div className="max-w-4xl mx-auto">
              {/* Back button */}
              <button
                onClick={() => setSelectedMovieId(null)}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                Chọn phim khác
              </button>

              {/* Movie info banner */}
              {(() => {
                const movieInfo = uniqueMovies.find(m => m.id === selectedMovieId);
                return movieInfo ? (
                  <div className="flex items-center gap-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 mb-6">
                    {movieInfo.poster && (
                      <img src={`${API_BASE}/uploads/${movieInfo.poster}`} alt={movieInfo.title}
                        className="w-12 h-16 object-cover rounded-lg flex-shrink-0"
                        onError={e => { e.target.style.display='none'; }}
                      />
                    )}
                    <div>
                      <p className="font-black text-white text-base">{movieInfo.title}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{movieInfo.duration ? `${movieInfo.duration} phút` : ''}{movieInfo.rated ? ` · ${movieInfo.rated}` : ''}</p>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Date tabs */}
              <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
                <Calendar className="w-4 h-4 text-[#E50914] flex-shrink-0 mr-1" />
                {availableDates.map(date => (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      selectedDate === date
                        ? 'bg-[#E50914] text-white shadow-lg shadow-red-900/40'
                        : 'bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a] hover:border-[#E50914]/40 hover:text-white'
                    }`}
                  >
                    {fmtDate(date)}
                    <span className="block text-[10px] font-normal opacity-70">{date.slice(5).replace('-','/')}</span>
                  </button>
                ))}
              </div>

              {/* Showtimes grouped by room */}
              {showtimesByRoom.size === 0 ? (
                <div className="text-center py-16 text-gray-600">
                  <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Không có suất chiếu nào trong ngày này.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {Array.from(showtimesByRoom.entries()).map(([roomName, sts]) => (
                    <div key={roomName} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#E50914] inline-block" />
                        {roomName}
                        {sts[0]?.format && <span className="text-gray-600 font-normal normal-case tracking-normal">· {sts[0].format}</span>}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {sts.map(st => {
                          const timeStr = fmtTime(st);
                          const totalSeats = st.room?.totalSeats ?? 0;
                          const booked = st.bookedSeats ?? 0;
                          const available = totalSeats - booked;
                          const pct = totalSeats > 0 ? (booked / totalSeats) : 0;
                          const colorClass = pct >= 0.9 ? 'border-red-800/60 text-red-400' :
                            pct >= 0.6 ? 'border-amber-800/60 text-amber-400' :
                            'border-[#333] text-gray-200 hover:border-[#E50914]/70 hover:text-white';
                          return (
                            <button
                              key={st.id}
                              onClick={() => setShowtimeId(st.id)}
                              disabled={available <= 0}
                              className={`relative group flex flex-col items-center justify-center bg-[#111] border rounded-xl px-5 py-3 transition-all hover:bg-[#1f1f1f] disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_12px_rgba(229,9,20,0.15)] ${colorClass}`}
                            >
                              <span className="text-lg font-black leading-tight">{timeStr}</span>
                              <span className="text-[10px] mt-0.5 opacity-60">
                                {available <= 0 ? 'Hết ghế' : `${available} ghế trống`}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── BƯỚC 2: Sơ đồ ghế + Giỏ hàng ──────────────────────────────── */}
      {showtimeId && (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)]">
          {/* Cột trái: SeatMap */}
          <div className="flex-1 overflow-auto bg-[#111] border-r border-[#222]">
            {loadingSeatMap ? (
              <div className="flex items-center justify-center h-full text-gray-500 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />Đang tải sơ đồ ghế...
              </div>
            ) : showtimeData ? (
              <div className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <Ticket className="w-5 h-5 text-[#E50914]" />
                  <div>
                    <p className="font-black text-white">{showtimeData.showtime?.movie?.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date((showtimeData.showtime?.startTime ?? showtimeData.showtime?.start_time ?? '').toString().replace('Z', '')).toLocaleString("vi-VN")}
                      {" · "}{showtimeData.showtime?.room?.name}
                    </p>
                  </div>
                </div>
                <SeatMap
                  seats={showtimeData.showtime?.room?.seats ?? []}
                  bookedIds={showtimeData.booked_seat_ids}
                  lockedIds={showtimeData.locked_seat_ids}
                  selectedSeats={selectedSeats}
                  onSeatSelect={handleSeatSelect}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-600">Không tải được sơ đồ ghế.</div>
            )}
          </div>

          {/* Cột phải: Giỏ hàng POS */}
          <div className="w-full lg:w-[360px] flex flex-col bg-[#141414] border-t lg:border-t-0 border-[#222] overflow-auto">
            <div className="bg-[#E50914] p-4 text-white text-center">
              <ShoppingCart className="w-6 h-6 mx-auto mb-1" />
              <p className="font-black uppercase tracking-widest text-sm">Giỏ hàng</p>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-4">
              {/* Ghế đã chọn */}
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Ticket className="w-3.5 h-3.5" />Ghế ({selectedSeats.length})
                </p>
                {selectedSeats.length > 0 ? (
                  <>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedSeats.map(s => (
                        <button key={s.id} onClick={() => handleSeatSelect(s)}
                          className="bg-[#E50914]/20 border border-[#E50914]/50 text-red-200 px-2.5 py-1 rounded text-sm font-black hover:bg-red-900/40 transition-all flex items-center gap-1">
                          {s.row}{s.column}<X className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                    <p className="text-right text-sm font-bold text-white">{formatCurrency(calcSeatTotal())}</p>
                  </>
                ) : (
                  <p className="text-gray-600 text-sm italic">Chưa chọn ghế nào...</p>
                )}
              </div>

              {/* Bắp nước */}
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Coffee className="w-3.5 h-3.5" />Bắp & Nước
                  </p>
                  <button onClick={() => setShowConcessions(v => !v)}
                    className="text-xs text-[#E50914] hover:text-red-400 font-bold transition-colors">
                    {showConcessions ? "Thu gọn" : "+ Thêm"}
                  </button>
                </div>

                {showConcessions && (
                  <div className="mb-3">
                    <ConcessionStep
                      selectedConcessions={selectedConcessions}
                      onUpdateConcessions={setSelectedConcessions}
                      onNext={() => setShowConcessions(false)}
                      onBack={() => setShowConcessions(false)}
                    />
                  </div>
                )}

                {!showConcessions && selectedConcessions.size > 0 && (
                  <div className="space-y-1.5">
                    {Array.from(selectedConcessions.values()).map(({ item, quantity }) => (
                      <div key={item.id} className="flex justify-between text-sm text-gray-400">
                        <span>{item.name} × {quantity}</span>
                        <span className="text-gray-200">{formatCurrency(item.price * quantity)}</span>
                      </div>
                    ))}
                    <div className="text-right text-sm font-bold text-white pt-1 border-t border-[#2a2a2a]">
                      {formatCurrency(calcConcessionTotal())}
                    </div>
                  </div>
                )}

                {!showConcessions && selectedConcessions.size === 0 && (
                  <p className="text-gray-600 text-sm italic">Chưa thêm bắp nước...</p>
                )}
              </div>

              {/* Email khách (tùy chọn) */}
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />Email khách hàng (tùy chọn)
                </p>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  placeholder="customer@email.com"
                  className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#E50914]/50 transition-colors"
                />
                {customerEmail && (
                  <p className="text-xs text-green-400 mt-1.5">✓ E-Ticket sẽ được gửi tự động qua email</p>
                )}
              </div>
            </div>

            {/* Grand Total + CTA */}
            <div className="p-4 border-t border-[#222] bg-[#0d0d0d]">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400 font-bold uppercase text-sm">Tổng cộng</span>
                <span className="text-2xl font-black text-[#E50914]">{formatCurrency(grandTotal)}</span>
              </div>
              <button
                onClick={() => setPosStep('confirming')}
                disabled={selectedSeats.length === 0}
                className={`w-full py-4 rounded-xl font-black text-lg uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  selectedSeats.length === 0
                    ? "bg-[#222] text-gray-600 cursor-not-allowed"
                    : "bg-[#E50914] hover:bg-[#F40612] text-white shadow-lg hover:shadow-[0_0_20px_rgba(229,9,20,0.5)] active:scale-95"
                }`}
              >
                <ChevronRight className="w-5 h-5" strokeWidth={3} />Tiếp tục thanh toán
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BƯỚC 3: Xác nhận & Thanh toán (Modal) ───────────────────────── */}
      {posStep === 'confirming' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#333] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-[#222]">
              <h2 className="text-xl font-black text-white">Xác nhận đơn hàng</h2>
              <button onClick={() => setPosStep('selecting')} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Tóm tắt */}
              <div className="bg-[#1a1a1a] rounded-xl p-4 mb-6 border border-[#2a2a2a]">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-1">Phim</p>
                    <p className="font-bold text-white text-lg">{showtimeData?.showtime?.movie?.title}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {new Date((showtimeData?.showtime?.startTime ?? '').replace('Z','')).toLocaleString("vi-VN")}
                      {" · "}{showtimeData?.showtime?.room?.name}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#2a2a2a]">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Ghế ({selectedSeats.length})</p>
                    <p className="font-bold text-white">{selectedSeats.map(s => s.row + s.column).join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Bắp nước</p>
                    {selectedConcessions.size > 0 ? (
                      <p className="font-bold text-white text-sm">
                        {Array.from(selectedConcessions.values()).map(c => `${c.quantity}x ${c.item.name}`).join(', ')}
                      </p>
                    ) : (
                      <p className="font-bold text-gray-600">Không có</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Chọn phương thức thanh toán */}
              <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Phương thức thanh toán</h3>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'cash' 
                      ? 'border-[#E50914] bg-[#E50914]/10 text-[#E50914]' 
                      : 'border-[#333] bg-[#1a1a1a] text-gray-300 hover:border-[#555]'
                  }`}
                >
                  <Banknote className="w-6 h-6" />
                  <span className="font-bold">Tiền mặt</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'card' 
                      ? 'border-[#E50914] bg-[#E50914]/10 text-[#E50914]' 
                      : 'border-[#333] bg-[#1a1a1a] text-gray-300 hover:border-[#555]'
                  }`}
                >
                  <CreditCard className="w-6 h-6" />
                  <span className="font-bold">Thẻ / Chuyển khoản</span>
                </button>
              </div>

              {/* Submit */}
              <button
                onClick={handlePOSCheckout}
                disabled={!paymentMethod || isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-[#E50914] hover:bg-[#F40612] disabled:opacity-50 text-white font-black uppercase tracking-wider py-4 rounded-xl text-lg transition-all"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-6 h-6 animate-spin" /> Đang xử lý...</>
                ) : (
                  <>Xác nhận thanh toán {formatCurrency(grandTotal)}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BƯỚC 3B: Chờ thanh toán chuyển khoản (VietQR) ─────────────── */}
      {posStep === 'paying' && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#333] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-[#222] text-center">
              <h2 className="text-xl font-black text-white">Chờ khách thanh toán</h2>
              <p className="text-sm text-gray-400 mt-1">Chuyển khoản / Quét mã QR</p>
            </div>

            <div className="p-6 flex flex-col items-center">
              {/* VietQR */}
              <div className="bg-white p-4 rounded-xl mb-4">
                {vietQrUrl ? (
                  <img src={vietQrUrl} alt="VietQR" className="w-64 h-64 object-contain" />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                )}
              </div>

              <p className="text-2xl font-black text-[#E50914] mb-2">{formatCurrency(lastBookingResult?.totalAmount ?? lastBookingResult?.total_amount ?? grandTotal)}</p>
              <p className="text-sm text-gray-400 mb-1">Mã đơn: <span className="text-white font-bold">#{pendingBookingId}</span></p>

              {/* Loading animation */}
              <div className="flex items-center gap-2 text-amber-400 mt-4 mb-6">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-bold animate-pulse">Đang chờ khách thanh toán...</span>
              </div>

              {/* Actions */}
              <div className="w-full flex flex-col gap-3">
                <button
                  onClick={handleConfirmPayment}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-black uppercase tracking-wider py-4 rounded-xl text-lg transition-all"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý...</>
                  ) : (
                    <><CheckCircle2 className="w-5 h-5" /> Xác nhận đã nhận tiền</>
                  )}
                </button>
                <button
                  onClick={handleCancelPOS}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-[#333] hover:bg-[#444] disabled:opacity-50 text-gray-300 font-bold py-3 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" /> Hủy giao dịch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── BƯỚC 4: Hóa đơn (Biên lai) ────────────────────────────────────── */}
      {posStep === 'receipt' && lastBookingResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md animate-in slide-in-from-bottom-10 duration-300">
            {/* Receipt Paper */}
            <div className="bg-white text-black p-6 rounded-t-xl" id="pos-receipt">
              <div className="text-center mb-6 border-b-2 border-black/10 pb-4 border-dashed">
                <h2 className="text-2xl font-black mb-1">CINEMA TICKET</h2>
                <p className="text-sm text-gray-600">Mã đơn: #{lastBookingResult.id}</p>
                <p className="text-sm text-gray-600">{new Date().toLocaleString('vi-VN')}</p>
              </div>

              <div className="mb-4">
                <p className="font-black text-xl leading-tight mb-2">
                  {lastBookingResult.showtime?.movie?.title ?? showtimeData?.showtime?.movie?.title}
                </p>
                <p className="text-sm">Suất: <strong>
                  {new Date(
                    (lastBookingResult.showtime?.startTime ?? showtimeData?.showtime?.startTime ?? '').replace('Z','')
                  ).toLocaleString("vi-VN")}
                </strong></p>
                <p className="text-sm">Phòng: <strong>
                  {lastBookingResult.showtime?.room?.name ?? showtimeData?.showtime?.room?.name}
                </strong></p>
                {/* Ghế từ lastBookingResult.seats, KHÔNG dùng selectedSeats (đã bị clear sau fetchSeatMap) */}
                <p className="text-sm mt-2">Ghế: <strong className="text-lg">
                  {lastBookingResult.seats?.length > 0
                    ? lastBookingResult.seats.map(s => `${s.row}${s.column}`).join(', ')
                    : 'N/A'}
                </strong></p>
              </div>

              {/* Bắp nước từ lastBookingResult.concessions */}
              {lastBookingResult.concessions?.length > 0 && (
                <div className="mb-4 py-2 border-y border-black/10">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Bắp nước</p>
                  {lastBookingResult.concessions.map(c => (
                    <div key={c.concessionId ?? c.id} className="flex justify-between text-sm">
                      <span>{c.quantity}x {c.name ?? c.concessionName}</span>
                      <span>{formatCurrency((c.price ?? 0) * c.quantity)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tổng tiền từ lastBookingResult (KHÔNG dùng grandTotal đã về 0) */}
              <div className="flex justify-between items-end mt-4 mb-6">
                <div>
                  <p className="text-xs text-gray-500 uppercase">
                    Thanh toán ({lastBookingResult.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'})
                  </p>
                  <p className="text-xl font-black">
                    {formatCurrency(lastBookingResult.totalAmount ?? lastBookingResult.total_amount ?? 0)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="bg-black text-white px-2 py-1 text-xs font-bold uppercase rounded">Đã thanh toán</span>
                </div>
              </div>

              {/* QR Code vào rạp */}
              <div className="flex flex-col items-center justify-center pt-6 border-t-2 border-black/10 border-dashed">
                <div className="bg-white p-2 border-4 border-black rounded-lg">
                  <QRCodeSVG value={lastBookingResult.qrCode || `POS-${lastBookingResult.id}`} size={140} />
                </div>
                <p className="text-[10px] text-gray-500 mt-2 tracking-widest uppercase">Quét mã để vào rạp</p>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-[#1a1a1a] p-4 rounded-b-xl border border-t-0 border-[#333] flex gap-3">
              <button
                onClick={() => {
                  const content = document.getElementById('pos-receipt').innerHTML;
                  const printWin = window.open('', '_blank');
                  // Kiểm tra popup blocker
                  if (!printWin) {
                    showToast("Trình duyệt chặn popup. Vui lòng cho phép popup!", "error");
                    return;
                  }
                  printWin.document.write(
                    '<html><head><title>Hoa Don #' + lastBookingResult.id + '</title>' +
                    '<style>' +
                    'body{font-family:sans-serif;padding:20px;width:300px;margin:0 auto;}' +
                    '*{margin:0;padding:0;box-sizing:border-box;}' +
                    'h2{font-size:20px;font-weight:900;}' +
                    '.font-black{font-weight:900;}' +
                    '.text-center{text-align:center;}' +
                    '.mb-6{margin-bottom:24px;}' +
                    '.mb-4{margin-bottom:16px;}' +
                    '.mt-4{margin-top:16px;}' +
                    '.flex{display:flex;}' +
                    '.justify-between{justify-content:space-between;}' +
                    '.border-dashed{border-bottom:2px dashed #ccc;padding-bottom:10px;margin-bottom:10px;}' +
                    '.text-sm{font-size:13px;}' +
                    '.text-xl{font-size:18px;}' +
                    '.text-2xl{font-size:22px;}' +
                    'img,svg{display:block;margin:0 auto;}' +
                    '@media print{body{width:100%;padding:0;}}' +
                    '</style></head><body>' + content +
                    '<script>setTimeout(function(){window.print();window.close();},300);<\/script>' +
                    '</body></html>'
                  );
                  printWin.document.close();
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-[#333] hover:bg-[#444] text-white py-3 rounded-lg font-bold transition-colors"
              >
                <Printer className="w-5 h-5" /> In hóa đơn
              </button>
              <button
                onClick={nextCustomer}
                className="flex-1 flex items-center justify-center gap-2 bg-[#E50914] hover:bg-[#F40612] text-white py-3 rounded-lg font-bold transition-colors shadow-lg"
              >
                Bán vé tiếp <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}