// src/components/booking/ConcessionStep.jsx
// =============================================
// COMPONENT: Chọn Bắp Nước (Bước giữa Ghế và Thanh Toán)
// Props:
//   selectedConcessions: Map<id, { item, quantity }>
//   onUpdateConcessions: (newMap) => void
//   onNext: () => void
//   onBack: () => void
// =============================================
import { useState, useEffect } from "react";
import { ShoppingCart, Plus, Minus, ChevronRight, ChevronLeft, Coffee, Loader2 } from "lucide-react";
import api from "../../utils/api";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

export default function ConcessionStep({ selectedConcessions, onUpdateConcessions, onNext, onBack }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchConcessions = async () => {
      try {
        const res = await api.get("/public/concessions");
        // API trả về array trực tiếp hoặc wrapped trong { value: [...] }
        const list = Array.isArray(res.data) ? res.data : (res.data.value ?? []);
        setItems(list);
      } catch {
        setError("Không thể tải danh sách bắp nước. Bạn vẫn có thể tiếp tục không chọn.");
      } finally {
        setLoading(false);
      }
    };
    fetchConcessions();
  }, []);

  const getQty = (id) => selectedConcessions.get(id)?.quantity ?? 0;

  const handleChange = (item, delta) => {
    const newMap = new Map(selectedConcessions);
    const current = newMap.get(item.id);
    const newQty = (current?.quantity ?? 0) + delta;

    if (newQty <= 0) {
      newMap.delete(item.id);
    } else {
      newMap.set(item.id, { item, quantity: newQty });
    }
    onUpdateConcessions(newMap);
  };

  // Tính subtotal bắp nước
  const concessionTotal = Array.from(selectedConcessions.values()).reduce(
    (sum, { item, quantity }) => sum + item.price * quantity,
    0
  );

  const selectedCount = Array.from(selectedConcessions.values()).reduce(
    (sum, { quantity }) => sum + quantity,
    0
  );

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-[#E50914]/20 border border-[#E50914]/40 p-2.5 rounded-xl">
          <Coffee className="w-6 h-6 text-[#E50914]" />
        </div>
        <div>
          <h3 className="text-xl font-black text-white">Bắp & Nước</h3>
          <p className="text-sm text-gray-500">Nâng cao trải nghiệm xem phim (tùy chọn)</p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12 text-gray-500 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Đang tải danh sách...</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-yellow-900/20 text-yellow-400 border border-yellow-900/50 rounded-lg px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Item Grid */}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {items.map((item) => {
            const qty = getQty(item.id);
            return (
              <div
                key={item.id}
                className={`bg-[#111] border rounded-xl p-4 transition-all duration-200 ${
                  qty > 0
                    ? "border-[#E50914]/60 shadow-[0_0_12px_rgba(229,9,20,0.15)]"
                    : "border-[#2a2a2a] hover:border-[#444]"
                }`}
              >
                {/* Ảnh / Icon placeholder */}
                <div className="w-full h-28 rounded-lg mb-3 overflow-hidden bg-[#1a1a1a] flex items-center justify-center">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div className="w-full h-full flex items-center justify-center" style={{ display: item.image ? "none" : "flex" }}>
                    <Coffee className="w-10 h-10 text-gray-600" />
                  </div>
                </div>

                <p className="font-bold text-white text-sm mb-0.5 leading-tight">{item.name}</p>
                {item.description && (
                  <p className="text-xs text-gray-500 mb-2 leading-snug line-clamp-2">{item.description}</p>
                )}
                <p className="text-[#E50914] font-black text-base mb-3">
                  {formatCurrency(item.price)}
                </p>

                {/* Qty Controller */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleChange(item, -1)}
                    disabled={qty === 0}
                    className="w-8 h-8 rounded-lg bg-[#222] border border-[#333] text-white flex items-center justify-center hover:bg-[#333] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className={`text-lg font-black w-8 text-center ${qty > 0 ? "text-[#E50914]" : "text-gray-500"}`}>
                    {qty}
                  </span>
                  <button
                    onClick={() => handleChange(item, 1)}
                    disabled={qty >= 10}
                    className="w-8 h-8 rounded-lg bg-[#E50914] text-white flex items-center justify-center hover:bg-[#F40612] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Subtotal Bar */}
      {concessionTotal > 0 && (
        <div className="bg-[#E50914]/10 border border-[#E50914]/30 rounded-xl px-4 py-3 flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <ShoppingCart className="w-4 h-4 text-[#E50914]" />
            <span>{selectedCount} món đã chọn</span>
          </div>
          <span className="text-[#E50914] font-black">{formatCurrency(concessionTotal)}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-xl border border-[#333] text-gray-400 font-bold hover:border-[#555] hover:text-white transition-all flex items-center justify-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Quay lại
        </button>
        <button
          onClick={onNext}
          className="flex-[2] py-3 rounded-xl bg-[#E50914] hover:bg-[#F40612] text-white font-black uppercase tracking-wider transition-all shadow-lg hover:shadow-[0_0_15px_rgba(229,9,20,0.5)] flex items-center justify-center gap-2"
        >
          {concessionTotal > 0 ? "Tiếp tục thanh toán" : "Bỏ qua & Thanh toán"}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
