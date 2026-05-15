// src/pages/staff/StaffDashboard.jsx
// =============================================
// STAFF DASHBOARD — Hệ Thống Soát Vé Dual-Mode
//   Mode A: Camera Scanner (webcam / camera điện thoại)
//   Mode B: Nhập tay / Súng quét USB (Input box)
// =============================================
import { useState, useRef, useCallback, lazy, Suspense } from "react";
import api from "../../utils/api";
import { useAuth } from "../../contexts/AuthContext";
import {
  QrCode, CheckCircle2, XCircle, Camera, Keyboard,
  User, Film, MapPin, Clock, CreditCard, Armchair,
} from "lucide-react";

// Lazy-load Scanner (có thể dùng WebRTC, không load ở tab Nhập Tay)
const Scanner = lazy(() => import("../../components/Scanner"));

// ── Âm thanh Bíp dùng Web Audio API (không cần file audio bên ngoài) ──
const playBeep = (success = true) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(success ? 880 : 220, ctx.currentTime); // La5 / La3
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch (_) {}
};

// ── Format helpers ──────────────────────────────────────────────────────
const fmtCurrency = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const fmtDatetime = (val) => {
  if (!val) return '—';
  const d = new Date(val.toString().replace('Z', ''));
  return isNaN(d) ? String(val) : d.toLocaleString('vi-VN');
};

// ── ResultCard ──────────────────────────────────────────────────────────
function ResultCard({ result }) {
  const ok = result.status === 'success';
  return (
    <div className={`rounded-2xl border-2 shadow-2xl overflow-hidden animate-fade-in
      ${ok ? 'bg-green-950/40 border-green-500/60' : 'bg-red-950/40 border-red-500/60'}`}
    >
      {/* Header */}
      <div className={`flex items-center gap-4 p-5 border-b
        ${ok ? 'border-green-800/50 bg-green-900/30' : 'border-red-800/50 bg-red-900/30'}`}
      >
        {ok
          ? <CheckCircle2 className="w-12 h-12 text-green-400 flex-shrink-0" />
          : <XCircle className="w-12 h-12 text-red-400 flex-shrink-0" />
        }
        <div>
          <p className={`text-xs uppercase font-black tracking-widest mb-0.5
            ${ok ? 'text-green-400' : 'text-red-400'}`}>
            {ok ? '✅ VÉ HỢP LỆ — CHO PHÉP VÀO' : '❌ VÉ KHÔNG HỢP LỆ'}
          </p>
          <h2 className="text-white font-black text-xl leading-tight">
            {result.message}
          </h2>
        </div>
      </div>

      {/* Booking Details */}
      {ok && result.booking && (() => {
        const b = result.booking;
        const seats = Array.isArray(b.seats)
          ? b.seats.map(s => `${s.row}${s.column}`).join(', ')
          : '—';
        return (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-500 text-xs uppercase font-bold">Khách hàng</p>
                <p className="text-white font-bold">{b.user?.name}</p>
                <p className="text-gray-400 text-xs">{b.user?.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Film className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-500 text-xs uppercase font-bold">Phim</p>
                <p className="text-white font-bold">{b.showtime?.movie?.title}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-500 text-xs uppercase font-bold">Phòng chiếu</p>
                <p className="text-white font-bold">{b.showtime?.room?.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-500 text-xs uppercase font-bold">Suất chiếu</p>
                <p className="text-white font-bold">{fmtDatetime(b.showtime?.startTime)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Armchair className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-500 text-xs uppercase font-bold">Ghế ngồi</p>
                <p className="text-white font-bold font-mono text-base">{seats}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CreditCard className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-500 text-xs uppercase font-bold">Tổng tiền</p>
                <p className="text-white font-bold">{fmtCurrency(b.totalAmount)}</p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── Main Dashboard ──────────────────────────────────────────────────────
export default function StaffDashboard() {
  const { user } = useAuth();
  const [mode, setMode] = useState('manual'); // 'camera' | 'manual'
  const [qrInput, setQrInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);

  // ── Gọi API verify ─────────────────────────────────────────────────
  const verify = useCallback(async (code) => {
    if (!code?.trim() || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post('/staff/checkin/verify', { qr_code: code.trim() });
      playBeep(true);
      setResult({
        status: 'success',
        message: res.data.message || 'Xác thực vé thành công!',
        booking: res.data.booking,
      });
    } catch (err) {
      playBeep(false);
      setResult({
        status: 'error',
        message: err.response?.data?.message || 'Vé không hợp lệ hoặc đã được sử dụng.',
      });
    } finally {
      setLoading(false);
      setQrInput('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [loading]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    verify(qrInput);
  };

  const handleScanSuccess = useCallback((text) => {
    verify(text);
  }, [verify]);

  const switchMode = (m) => {
    setMode(m);
    setResult(null);
  };

  return (
    <div className="bg-[#0d0d0d] min-h-[calc(100vh-64px)]">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* ── HEADER ─────────────────────────────────────────────── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#E50914]/10 border-2 border-[#E50914]/40 mb-4">
            <QrCode className="w-10 h-10 text-[#E50914]" />
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-widest">
            Soát Vé
          </h1>
          <p className="text-gray-500 mt-1 font-medium">
            Nhân viên: <span className="text-gray-300 font-bold">{user?.name}</span>
          </p>
        </div>

        {/* ── MODE SWITCHER ──────────────────────────────────────── */}
        <div className="flex bg-[#1a1a1a] rounded-xl p-1 border border-[#2a2a2a] mb-6 gap-1">
          <button
            onClick={() => switchMode('camera')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all
              ${mode === 'camera'
                ? 'bg-[#E50914] text-white shadow-lg shadow-red-900/30'
                : 'text-gray-400 hover:text-white'}`}
          >
            <Camera className="w-4 h-4" />
            Camera
          </button>
          <button
            onClick={() => switchMode('manual')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all
              ${mode === 'manual'
                ? 'bg-[#E50914] text-white shadow-lg shadow-red-900/30'
                : 'text-gray-400 hover:text-white'}`}
          >
            <Keyboard className="w-4 h-4" />
            Nhập tay / USB
          </button>
        </div>

        {/* ── CAMERA MODE ───────────────────────────────────────── */}
        {mode === 'camera' && (
          <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] overflow-hidden mb-6">
            <div className="p-4 border-b border-[#2a2a2a] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white text-sm font-bold uppercase tracking-wider">Camera đang hoạt động</span>
              {loading && (
                <span className="ml-auto text-yellow-400 text-xs font-bold animate-pulse">Đang xác thực...</span>
              )}
            </div>

            {/* Camera feed */}
            <div className="relative">
              <Suspense fallback={
                <div className="flex items-center justify-center h-72 text-gray-500">
                  <Camera className="w-8 h-8 mr-2 animate-pulse" />
                  <span>Đang khởi tạo Camera...</span>
                </div>
              }>
                <Scanner
                  onScanSuccess={handleScanSuccess}
                  onScanError={() => {}}
                />
              </Suspense>

              {/* Targeting overlay corners — Chỉ decoration, không block events */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative w-56 h-56">
                  {/* 4 góc khung nhắm */}
                  <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#E50914] rounded-tl-sm" />
                  <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#E50914] rounded-tr-sm" />
                  <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#E50914] rounded-bl-sm" />
                  <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#E50914] rounded-br-sm" />
                  {/* Đường quét laser animation */}
                  <span className="absolute left-1 right-1 h-0.5 bg-[#E50914]/70 animate-laser-scan" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── MANUAL / USB MODE ─────────────────────────────────── */}
        {mode === 'manual' && (
          <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] overflow-hidden mb-6">
            <div className="p-4 border-b border-[#2a2a2a]">
              <p className="text-gray-400 text-sm font-medium">
                Nhập mã vé thủ công hoặc dùng <span className="text-white font-bold">Súng quét USB</span> bấm vào ô bên dưới rồi quét.
              </p>
            </div>
            <form onSubmit={handleManualSubmit} className="p-4">
              <div className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  placeholder="Quét hoặc nhập mã vé..."
                  className="flex-1 bg-[#111] text-white border border-[#333] rounded-xl px-5 py-4 text-base font-mono uppercase tracking-widest focus:outline-none focus:border-[#E50914] placeholder-gray-700 transition-colors"
                  autoFocus
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !qrInput.trim()}
                  className="px-6 py-4 bg-[#E50914] hover:bg-[#c40812] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors uppercase tracking-wide text-sm"
                >
                  {loading ? '...' : 'Kiểm tra'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── RESULT ────────────────────────────────────────────── */}
        {loading && (
          <div className="text-center py-6">
            <div className="w-10 h-10 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 font-medium">Đang xác thực vé...</p>
          </div>
        )}

        {!loading && result && <ResultCard result={result} />}

        {/* ── TIPS ──────────────────────────────────────────────── */}
        {!result && !loading && (
          <div className="mt-6 text-center">
            <p className="text-gray-700 text-xs uppercase tracking-wider font-bold">
              {mode === 'camera'
                ? 'Đưa mã QR trên vé hoặc điện thoại vào khung đỏ'
                : 'Bấm vào ô trên, sau đó quét súng hoặc nhập mã rồi Enter'}
            </p>
          </div>
        )}
      </div>

      {/* ── CSS animation cho laser scan ───────────────────────── */}
      <style>{`
        @keyframes laser-scan {
          0%   { top: 8px;  opacity: 1; }
          45%  { top: calc(100% - 10px); opacity: 1; }
          50%  { opacity: 0; }
          55%  { top: 8px; opacity: 0; }
          60%  { opacity: 1; }
          100% { top: 8px; opacity: 1; }
        }
        .animate-laser-scan {
          animation: laser-scan 2.4s ease-in-out infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
