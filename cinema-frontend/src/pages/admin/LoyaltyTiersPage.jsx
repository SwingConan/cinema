import { useState, useEffect } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";
import {
  Crown, Star, Gem, Shield, Save, Edit3,
  TrendingUp, Percent, Coins, X, Loader2,
  DollarSign, ArrowUpRight,
} from "lucide-react";

const TIER_META = {
  bronze:   { label: "Bronze",   icon: Shield, gradient: "from-amber-700 to-amber-900",   text: "text-amber-400",   border: "border-amber-700/50",   bg: "bg-amber-900/10" },
  silver:   { label: "Silver",   icon: Star,   gradient: "from-slate-400 to-slate-600",   text: "text-slate-300",   border: "border-slate-400/50",   bg: "bg-slate-800/10" },
  gold:     { label: "Gold",     icon: Crown,  gradient: "from-yellow-500 to-yellow-700", text: "text-yellow-400",  border: "border-yellow-500/50", bg: "bg-yellow-900/10" },
  platinum: { label: "Platinum", icon: Gem,    gradient: "from-purple-500 to-indigo-700", text: "text-purple-300",  border: "border-purple-500/50", bg: "bg-purple-900/10" },
};

const fmtCurrency = (n) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

export default function LoyaltyTiersPage() {
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // tier name being edited
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchTiers = async () => {
    try {
      const res = await api.get("/admin/loyalty/tiers");
      setTiers(res.data);
    } catch (err) {
      toast.error("Lỗi tải cấu hình hạng thành viên");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTiers(); }, []);

  const startEdit = (t) => {
    setEditing(t.tier);
    setForm({
      minSpent: t.minSpent || t.min_spent || 0,
      earnRate: t.earnRate || t.earn_rate || 5,
      discountRate: t.discountRate || t.discount_rate || 0,
    });
  };

  const cancelEdit = () => { setEditing(null); setForm({}); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/admin/loyalty/tiers/${editing}`, {
        minSpent: parseInt(form.minSpent) || 0,
        earnRate: parseFloat(form.earnRate) || 5,
        discountRate: parseFloat(form.discountRate) || 0,
      });
      setTiers(res.data);
      toast.success(`Cập nhật hạng ${TIER_META[editing]?.label} thành công!`);
      setEditing(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi cập nhật");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#E50914]" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#E50914] to-[#b81d24] rounded-xl flex items-center justify-center">
            <Crown className="w-5 h-5 text-white" />
          </div>
          Quản lý Hạng thành viên
        </h1>
        <p className="text-gray-500 text-sm mt-2">
          Cấu hình điều kiện, tỷ lệ tích điểm và ưu đãi cho từng hạng Loyalty
        </p>
      </div>

      {/* Tier Roadmap */}
      <div className="flex items-center gap-2 mb-6 px-2">
        {["bronze", "silver", "gold", "platinum"].map((tierName, i) => {
          const meta = TIER_META[tierName];
          const TierIcon = meta.icon;
          const tierData = tiers.find(t => (t.tier || t.name) === tierName);
          return (
            <div key={tierName} className="flex items-center flex-1">
              <div className={`flex-1 text-center py-2 px-3 rounded-lg border ${meta.border} ${meta.bg}`}>
                <TierIcon className={`w-4 h-4 ${meta.text} mx-auto mb-1`} />
                <p className={`text-xs font-black ${meta.text}`}>{meta.label}</p>
                <p className="text-[10px] text-gray-500">
                  {tierData && (tierData.minSpent || tierData.min_spent) > 0
                    ? fmtCurrency(tierData.minSpent || tierData.min_spent)
                    : "Mặc định"}
                </p>
              </div>
              {i < 3 && <ArrowUpRight className="w-4 h-4 text-gray-600 mx-1 flex-shrink-0" />}
            </div>
          );
        })}
      </div>

      {/* Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tiers.map(t => {
          const tierName = t.tier || t.name;
          const meta = TIER_META[tierName] || TIER_META.bronze;
          const TierIcon = meta.icon;
          const isEditing = editing === tierName;
          const minSpent = t.minSpent ?? t.min_spent ?? 0;
          const earnRate = t.earnRate ?? t.earn_rate ?? 5;
          const discountRate = t.discountRate ?? t.discount_rate ?? 0;

          return (
            <div key={tierName}
                 className={`relative overflow-hidden rounded-2xl border transition-all ${
                   isEditing ? `${meta.border} ring-2 ring-white/10` : `border-[#2a2a2a] hover:${meta.border}`
                 }`}
                 style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #111 100%)" }}>
              {/* Gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${meta.gradient} opacity-5`} />

              <div className="relative p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center shadow-lg`}>
                      <TierIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className={`text-lg font-black ${meta.text}`}>{meta.label}</h3>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{tierName}</p>
                    </div>
                  </div>
                  {!isEditing ? (
                    <button onClick={() => startEdit({ tier: tierName, minSpent, earnRate, discountRate })}
                            className="p-2 rounded-lg bg-[#222] border border-[#333] hover:bg-[#333] transition-colors">
                      <Edit3 className="w-4 h-4 text-gray-400" />
                    </button>
                  ) : (
                    <button onClick={cancelEdit}
                            className="p-2 rounded-lg bg-red-900/30 border border-red-800/50 hover:bg-red-900/50 transition-colors">
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  )}
                </div>

                {/* Fields */}
                <div className="space-y-3">
                  {/* Min Spent */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-bold flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" /> Chi tiêu tối thiểu
                    </span>
                    {isEditing ? (
                      <input type="number" value={form.minSpent}
                             onChange={e => setForm({...form, minSpent: e.target.value})}
                             className="w-36 bg-[#111] border border-[#333] rounded-lg px-3 py-1.5 text-white text-sm text-right font-bold focus:border-[#E50914] outline-none" />
                    ) : (
                      <span className="text-sm text-white font-bold">
                        {minSpent > 0 ? fmtCurrency(minSpent) : "— (Mặc định)"}
                      </span>
                    )}
                  </div>

                  {/* Earn Rate */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-bold flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5" /> Tỷ lệ tích điểm
                    </span>
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input type="number" value={form.earnRate} step="0.5"
                               onChange={e => setForm({...form, earnRate: e.target.value})}
                               className="w-20 bg-[#111] border border-[#333] rounded-lg px-3 py-1.5 text-white text-sm text-right font-bold focus:border-[#E50914] outline-none" />
                        <span className="text-gray-500 text-sm">%</span>
                      </div>
                    ) : (
                      <span className={`text-sm font-black ${meta.text}`}>{earnRate}%</span>
                    )}
                  </div>

                  {/* Discount Rate */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-bold flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5" /> Giảm giá hạng
                    </span>
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input type="number" value={form.discountRate} step="0.5"
                               onChange={e => setForm({...form, discountRate: e.target.value})}
                               className="w-20 bg-[#111] border border-[#333] rounded-lg px-3 py-1.5 text-white text-sm text-right font-bold focus:border-[#E50914] outline-none" />
                        <span className="text-gray-500 text-sm">%</span>
                      </div>
                    ) : (
                      <span className="text-sm text-white font-bold">
                        {discountRate > 0 ? `${discountRate}%` : "— (Không)"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Save button when editing */}
                {isEditing && (
                  <button onClick={handleSave} disabled={saving}
                          className="w-full mt-4 py-2.5 rounded-xl bg-[#E50914] text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info box */}
      <div className="mt-6 bg-[#111] border border-[#2a2a2a] rounded-xl p-4">
        <p className="text-xs text-gray-500 leading-relaxed">
          <TrendingUp className="w-3 h-3 inline mr-1" />
          <strong className="text-gray-400">Cách hoạt động:</strong> Khi khách hàng thanh toán, hệ thống tự động cộng điểm theo <strong className="text-white">Tỷ lệ tích điểm</strong> của hạng hiện tại.
          Khi tổng chi tiêu đạt ngưỡng <strong className="text-white">Chi tiêu tối thiểu</strong>, hệ thống tự động nâng hạng.
          <strong className="text-white"> Giảm giá hạng</strong> được áp dụng tự động vào giá vé khi đặt.
        </p>
      </div>
    </div>
  );
}
