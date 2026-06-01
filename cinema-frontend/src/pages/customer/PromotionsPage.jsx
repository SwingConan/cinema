import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import { Gift, Ticket, Calendar, Award, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";

export default function PromotionsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPromotionsData = async () => {
      try {
        const [promoRes, walletRes] = await Promise.all([
          api.get("/public/vouchers/promotions"),
          user ? api.get("/customer/vouchers/my-vouchers?include_all=true") : Promise.resolve({ data: [] }),
        ]);

        const promos = Array.isArray(promoRes.data) ? promoRes.data : (promoRes.data?.data ?? []);
        const wallet = Array.isArray(walletRes.data) ? walletRes.data : (walletRes.data?.data ?? []);

        // Đánh dấu các voucher đã có trong ví của user
        const claimedCodes = new Set(wallet.map(v => {
          // Lấy phần mã gốc trước hậu tố -UX
          const parts = v.code.split("-U");
          return parts[0];
        }));

        const enriched = promos.map(p => ({
          ...p,
          isClaimed: claimedCodes.has(p.code)
        }));

        setPromotions(enriched);
      } catch (error) {
        console.error("Error fetching promotions data", error);
        toast.error("Không thể tải danh sách khuyến mãi.");
      } finally {
        setLoading(false);
      }
    };

    fetchPromotionsData();
  }, [user]);

  const handleClaim = async (voucherId, idx) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để lưu voucher!");
      navigate("/login");
      return;
    }

    try {
      await api.post("/customer/vouchers/claim", { voucherId });
      toast.success("🎉 Đã thu thập voucher vào ví của bạn!");
      setPromotions(prev => prev.map((p, i) => i === idx ? { ...p, isClaimed: true } : p));
    } catch (e) {
      toast.error(e.response?.data?.message || "Không thể thu thập.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin mb-3" />
        <span className="ml-3 text-gray-400 font-bold">Đang tải khuyến mãi cực hot...</span>
      </div>
    );
  }

  return (
    <div className="bg-[#141414] min-h-screen pb-16">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-black py-16 border-b border-[#222]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#E50914_0%,transparent_60%)] opacity-10" />
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center relative z-10 space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-[#E50914]/10 text-[#E50914] border border-[#E50914]/20 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" /> Khuyến mãi độc quyền
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-wider">
            GÓC ƯU ĐÃI & KHUYẾN MÃI
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto text-sm sm:text-base font-light leading-relaxed">
            Thu thập các voucher giảm giá vé phim, bỏng ngô và nước uống cực lớn ngay dưới đây để áp dụng khi đặt vé trực tuyến.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        {promotions.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-[#333] rounded-2xl bg-[#1a1a1a]/40 max-w-lg mx-auto">
            <Gift className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg">Chưa có chương trình khuyến mãi nào</h3>
            <p className="text-gray-500 text-sm mt-1">Các chương trình ưu đãi mới nhất sẽ được cập nhật tại đây. Hãy quay lại sau nhé!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promotions.map((voucher, idx) => (
              <div
                key={voucher.id}
                className={`relative overflow-hidden rounded-2xl border transition-all duration-300 bg-[#1c1c1c] ${
                  voucher.isClaimed
                    ? "border-[#2a2a2a] opacity-85"
                    : "border-[#333] hover:border-[#E50914] hover:shadow-[0_0_20px_rgba(229,9,20,0.15)]"
                }`}
              >
                {/* Decorative cutouts to look like a ticket */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#141414] border-r border-[#333] z-10" />
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#141414] border-l border-[#333] z-10" />

                <div className="p-6 pb-20 space-y-4">
                  {/* Badge & Code */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-black text-[#E50914] tracking-widest uppercase">
                      {voucher.code}
                    </span>
                    <span className="text-[10px] font-black uppercase bg-[#2a2a2a] text-gray-400 px-2 py-0.5 rounded border border-[#333]">
                      {voucher.branchId ? "Chi nhánh" : "Toàn quốc"}
                    </span>
                  </div>

                  {/* Discount amount */}
                  <div>
                    <h3 className="text-2xl font-black text-white">
                      {voucher.discountType === "percentage"
                        ? `GIẢM ${voucher.discountValue}%`
                        : `GIẢM ${Number(voucher.discountValue).toLocaleString("vi-VN")}đ`}
                    </h3>
                    <p className="text-gray-400 text-sm font-bold mt-1 line-clamp-1">
                      {voucher.name}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {voucher.description || "Áp dụng cho tất cả suất chiếu và combo bắp nước trực tuyến tại rạp."}
                  </p>

                  {/* HSD & Min Order */}
                  <div className="pt-3 border-t border-[#2a2a2a] space-y-1.5 text-[11px] text-gray-500 font-bold">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-[#E50914]" /> Hạn sử dụng:</span>
                      <span className="text-gray-400">{new Date(voucher.validTo).toLocaleDateString("vi-VN")}</span>
                    </div>
                    {voucher.minOrder > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5 text-[#E50914]" /> Đơn tối thiểu:</span>
                        <span className="text-gray-400">{Number(voucher.minOrder).toLocaleString("vi-VN")}đ</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Claim Button */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#151515] border-t border-[#222]">
                  <button
                    onClick={() => handleClaim(voucher.id, idx)}
                    disabled={voucher.isClaimed}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                      voucher.isClaimed
                        ? "bg-[#222] text-gray-500 border border-[#2a2a2a] cursor-default"
                        : "bg-[#E50914] text-white hover:bg-red-700 cursor-pointer hover:scale-[1.01]"
                    }`}
                  >
                    {voucher.isClaimed ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Đã lưu vào ví</span>
                      </>
                    ) : (
                      <>
                        <Ticket className="w-4 h-4" />
                        <span>Lưu vào ví của tôi</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
