import { useState } from "react";
import api from "../../utils/api";
import { Wand2, X, Loader2, CheckCircle2, AlertTriangle, Info } from "lucide-react";

const FORMATS = ["Phòng thường", "2D", "3D", "IMAX", "4DX"];

const inputCls = "w-full bg-[#111] border border-[#333] focus:border-[#E50914] text-white rounded-xl px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-gray-700";
const labelCls = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5";

const fmtVND = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);

export default function BulkGenerateModal({ movies, rooms, onClose, onSuccess }) {
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    movieId:      "",
    roomId:       "",
    startDate:    today,
    endDate:      today,
    openTime:     "09:00",
    closeTime:    "23:30",
    priceRegular: "75000",
    priceVip:     "100000",
    priceCouple:  "150000",
    format:       "Phòng thường",
    skipConflicts: true,
  });

  const [loading, setLoading]   = useState(false);
  const [result,  setResult]    = useState(null);  // { inserted, skipped, conflicts, message }
  const [error,   setError]     = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Tính preview số suất / ngày
  const previewSlots = () => {
    const movie = movies.find(m => String(m.id) === String(form.movieId));
    if (!movie || !form.openTime || !form.closeTime) return null;
    const duration = Number(movie.duration);
    if (!duration) return null;
    const openMin  = form.openTime.split(":").reduce((h, m, i) => i === 0 ? h + Number(m) * 60 : h + Number(m), 0);
    const closeMin = form.closeTime.split(":").reduce((h, m, i) => i === 0 ? h + Number(m) * 60 : h + Number(m), 0);
    let slots = 0, cur = openMin;
    while (cur + duration <= closeMin) { slots++; cur += duration + 15; }
    const days = form.startDate && form.endDate
      ? Math.max(0, Math.floor((new Date(form.endDate) - new Date(form.startDate)) / 86400000) + 1)
      : 1;
    return { slots, days, total: slots * days };
  };
  const preview = previewSlots();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await api.post("/admin/showtimes/bulk-generate", {
        ...form,
        movieId:      Number(form.movieId),
        roomId:       Number(form.roomId),
        priceRegular: Number(form.priceRegular),
        priceVip:     Number(form.priceVip),
        priceCouple:  Number(form.priceCouple),
        skipConflicts: form.skipConflicts,
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra. Thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    if (result?.inserted > 0) onSuccess();
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl w-full max-w-2xl shadow-2xl max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a] sticky top-0 bg-[#1e1e1e] z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Wand2 size={18} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-white font-black text-lg">Tự động xếp lịch</h2>
              <p className="text-gray-600 text-xs">Sinh hàng loạt suất chiếu theo khung giờ</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-[#2a2a2a] flex items-center justify-center text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Result State */}
        {result ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-900/20 border border-emerald-700/40">
              <CheckCircle2 size={24} className="text-emerald-400 shrink-0" />
              <div>
                <p className="text-emerald-400 font-black">{result.message}</p>
                <p className="text-gray-500 text-sm mt-0.5">
                  Đã tạo <span className="text-white font-bold">{result.inserted}</span> suất ·
                  Bỏ qua <span className="text-yellow-400 font-bold">{result.skipped}</span> suất trùng
                </p>
              </div>
            </div>

            {result.conflicts?.length > 0 && (
              <div className="bg-yellow-900/10 border border-yellow-800/30 rounded-xl p-4">
                <p className="text-yellow-400 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertTriangle size={12}/> Các khung giờ bị bỏ qua do trùng lịch
                </p>
                <ul className="space-y-1 max-h-40 overflow-y-auto">
                  {result.conflicts.map((c, i) => (
                    <li key={i} className="text-gray-500 text-xs font-mono">{c}</li>
                  ))}
                </ul>
              </div>
            )}

            <button onClick={handleDone}
              className="w-full py-3 rounded-xl bg-[#E50914] hover:bg-[#c40812] text-white font-black transition-colors">
              {result.inserted > 0 ? "Xem lịch chiếu vừa tạo" : "Đóng"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="bg-red-900/20 border border-red-700/40 text-red-400 px-4 py-3 rounded-xl text-sm flex gap-2">
                <AlertTriangle size={15} className="shrink-0 mt-0.5"/>{error}
              </div>
            )}

            {/* Phim + Phòng */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Phim <span className="text-[#E50914]">*</span></label>
                <select value={form.movieId} onChange={e => set("movieId", e.target.value)} required className={inputCls}>
                  <option value="">-- Chọn phim --</option>
                  {movies.map(m => (
                    <option key={m.id} value={m.id}>{m.title} ({m.duration}p)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Phòng chiếu <span className="text-[#E50914]">*</span></label>
                <select value={form.roomId} onChange={e => set("roomId", e.target.value)} required className={inputCls}>
                  <option value="">-- Chọn phòng --</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.type})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Khoảng ngày */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Từ ngày <span className="text-[#E50914]">*</span></label>
                <input type="date" value={form.startDate} min={today}
                  onChange={e => set("startDate", e.target.value)} required
                  className={inputCls + " [&::-webkit-calendar-picker-indicator]:invert"}/>
              </div>
              <div>
                <label className={labelCls}>Đến ngày <span className="text-[#E50914]">*</span></label>
                <input type="date" value={form.endDate} min={form.startDate}
                  onChange={e => set("endDate", e.target.value)} required
                  className={inputCls + " [&::-webkit-calendar-picker-indicator]:invert"}/>
              </div>
            </div>

            {/* Khung giờ mở/đóng cửa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Giờ mở cửa <span className="text-[#E50914]">*</span></label>
                <input type="time" value={form.openTime}
                  onChange={e => set("openTime", e.target.value)} required className={inputCls}/>
              </div>
              <div>
                <label className={labelCls}>Giờ đóng cửa <span className="text-[#E50914]">*</span></label>
                <input type="time" value={form.closeTime}
                  onChange={e => set("closeTime", e.target.value)} required className={inputCls}/>
              </div>
            </div>

            {/* Preview thông minh */}
            {preview && (
              <div className="flex items-start gap-2 bg-blue-900/10 border border-blue-800/30 rounded-xl px-4 py-3">
                <Info size={14} className="text-blue-400 mt-0.5 shrink-0"/>
                <p className="text-blue-300 text-sm">
                  Dự kiến sinh <span className="font-black text-white">{preview.slots} suất/ngày</span> ×{" "}
                  <span className="font-black text-white">{preview.days} ngày</span> ={" "}
                  <span className="font-black text-[#E50914]">~{preview.total} suất chiếu</span>
                  <span className="text-gray-500"> (chưa trừ trùng lịch)</span>
                </p>
              </div>
            )}

            {/* Giá vé */}
            <div>
              <p className={labelCls}>Giá vé <span className="text-[#E50914]">*</span></p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: "priceRegular", label: "Thường" },
                  { key: "priceVip",     label: "VIP" },
                  { key: "priceCouple",  label: "Couple" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="text-xs text-gray-600 font-bold mb-1 block">{label}</label>
                    <input type="number" value={form[key]} min={0} step={1000}
                      onChange={e => set(key, e.target.value)} required className={inputCls}
                      placeholder="VD: 75000"/>
                    {form[key] && <p className="text-[10px] text-gray-700 mt-0.5">{fmtVND(form[key])}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Format + skipConflicts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Định dạng chiếu</label>
                <select value={form.format} onChange={e => set("format", e.target.value)} className={inputCls}>
                  {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={form.skipConflicts}
                      onChange={e => set("skipConflicts", e.target.checked)}/>
                    <div className={`w-11 h-6 rounded-full transition-colors ${form.skipConflicts ? "bg-emerald-500" : "bg-gray-700"}`}/>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.skipConflicts ? "left-6" : "left-1"}`}/>
                  </div>
                  <span className="text-sm text-gray-400 font-bold">Bỏ qua suất trùng lịch</span>
                </label>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-[#333] text-gray-400 hover:text-white hover:border-[#444] font-bold text-sm transition-colors">
                Hủy
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-black text-sm transition-colors flex items-center justify-center gap-2">
                {loading
                  ? <><Loader2 size={16} className="animate-spin"/> Đang sinh lịch...</>
                  : <><Wand2 size={16}/> Sinh lịch tự động</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
