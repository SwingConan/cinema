import { useState, useEffect } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";
import PasscodeModal from "./PasscodeModal";
import {
  Crown, Star, Gem, Shield, TrendingUp, Gift,
  ChevronDown, ChevronUp, Coins, ArrowRight,
  Ticket, X, Loader2,
} from "lucide-react";

const TIER_CONFIG = {
  bronze:   { label: "Bronze",   color: "from-amber-800 to-amber-950",     icon: Shield,  border: "border-amber-700/50",   text: "text-amber-400",   bg: "bg-amber-900/20" },
  silver:   { label: "Silver",   color: "from-slate-400 to-slate-600",     icon: Star,    border: "border-slate-400/50",   text: "text-slate-300",   bg: "bg-slate-700/20" },
  gold:     { label: "Gold",     color: "from-yellow-500 to-yellow-700",   icon: Crown,   border: "border-yellow-500/50",  text: "text-yellow-400",  bg: "bg-yellow-900/20" },
  platinum: { label: "Platinum", color: "from-purple-400 to-indigo-700",   icon: Gem,     border: "border-purple-400/50",  text: "text-purple-300",  bg: "bg-purple-900/20" },
};

const fmtNumber = (n) => new Intl.NumberFormat("vi-VN").format(n);
const fmtCurrency = (n) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

const REWARDS = [
  { id: "opt1", points: 100, label: "Giảm 5%", desc: "Tối đa 15.000đ, đơn từ 0đ" },
  { id: "opt2", points: 200, label: "Giảm 10%", desc: "Tối đa 30.000đ, đơn từ 0đ" },
  { id: "opt3", points: 500, label: "Giảm 25%", desc: "Tối đa 75.000đ, đơn từ 100k" },
  { id: "opt4", points: 1000, label: "Giảm 50%", desc: "Tối đa 150.000đ, đơn từ 150k" },
  { id: "opt5", points: 300, label: "Voucher 30k", desc: "Giảm 30.000đ cho đơn từ 100k" },
  { id: "opt6", points: 500, label: "Voucher 60k", desc: "Giảm 60.000đ cho đơn từ 150k" },
  { id: "opt7", points: 1000, label: "Voucher 130k", desc: "Giảm 130.000đ cho đơn từ 250k" },
];

export default function MembershipCard({ onRedeemed }) {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);

  // ── Redeem State ─────────────────────────────────────────
  const [showRedeem, setShowRedeem] = useState(false);
  const [selectedReward, setSelectedReward] = useState("opt1");
  const [redeeming, setRedeeming] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);
  const [securityToken, setSecurityToken] = useState(null);

  const refreshData = () => {
    api.get("/customer/loyalty")
      .then(res => setData(res.data))
      .catch(err => console.error("Loyalty fetch error:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refreshData(); }, []);

  const fetchHistory = async () => {
    if (history) { setShowHistory(!showHistory); return; }
    try {
      const res = await api.get("/customer/loyalty/history?limit=10");
      setHistory(res.data);
      setShowHistory(true);
    } catch (err) {
      console.error("History fetch error:", err);
    }
  };

  // ── Redeem Handler ───────────────────────────────────────
  const handleRedeem = async (overrideToken) => {
    const reward = REWARDS.find((item) => item.id === selectedReward);
    if (!reward) return toast.error("Vui lòng chọn gói đổi thưởng");
    if (reward.points > data.loyaltyPoints) return toast.error("Không đủ điểm");

    setRedeeming(true);
    const token = (typeof overrideToken === 'string') ? overrideToken : (typeof securityToken === 'string' ? securityToken : null);
    const headers = token ? { 'X-Security-Token': token } : {};
    try {
      const res = await api.post("/customer/loyalty/redeem", { rewardOptionId: selectedReward }, { headers });
      const codeText = res.data?.voucherCode ? ` Mã voucher: ${res.data.voucherCode}` : "";
      toast.success(`Đổi thành công ${fmtNumber(reward.points)} điểm lấy ${reward.label}.${codeText}`);
      setShowRedeem(false);
      setSelectedReward("opt1");
      setSecurityToken(null);
      setHistory(null); // Reset history cache
      refreshData();
      onRedeemed?.(res.data);
    } catch (err) {
      if (err.response?.status === 428 && err.response?.data?.requirePasscode) {
        setShowPasscode(true);
        setRedeeming(false);
        return;
      }
      toast.error(err.response?.data?.message || "Đổi điểm thất bại");
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-6 animate-pulse">
        <div className="h-6 bg-[#333] rounded w-1/3 mb-4" />
        <div className="h-32 bg-[#333] rounded" />
      </div>
    );
  }

  if (!data) return null;

  const tier = TIER_CONFIG[data.memberTier] || TIER_CONFIG.bronze;
  const TierIcon = tier.icon;
  const selectedRewardConfig = REWARDS.find((item) => item.id === selectedReward) || REWARDS[0];

  return (
    <div className="space-y-4">
      {/* ── Main Membership Card ──────────────────────────────── */}
      <div className={`relative overflow-hidden rounded-2xl border ${tier.border}`}
           style={{ background: "linear-gradient(135deg, #1c1c1c 0%, #0a0a0a 100%)" }}>
        {/* Gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${tier.color} opacity-10`} />

        <div className="relative p-6">
          {/* Top row: Tier badge + Points */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center shadow-lg`}>
                <TierIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Hạng thành viên</p>
                <h3 className={`text-xl font-black ${tier.text} uppercase tracking-wider`}>
                  {tier.label}
                </h3>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Điểm tích lũy</p>
              <p className={`text-2xl font-black ${tier.text}`}>{fmtNumber(data.loyaltyPoints)}</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className={`${tier.bg} rounded-xl p-3 text-center border ${tier.border}`}>
              <p className="text-xs text-gray-500 font-bold">Tổng chi tiêu</p>
              <p className="text-white font-black text-sm mt-1">{fmtCurrency(data.totalSpent)}</p>
            </div>
            <div className={`${tier.bg} rounded-xl p-3 text-center border ${tier.border}`}>
              <p className="text-xs text-gray-500 font-bold">Tích điểm</p>
              <p className={`font-black text-sm mt-1 ${tier.text}`}>{data.earnRate}%</p>
            </div>
            <div className={`${tier.bg} rounded-xl p-3 text-center border ${tier.border}`}>
              <p className="text-xs text-gray-500 font-bold">Ưu đãi hạng</p>
              <p className={`font-black text-sm mt-1 ${tier.text}`}>
                {data.discountRate > 0 ? `-${data.discountRate}%` : "—"}
              </p>
            </div>
          </div>

          {/* Progress to next tier */}
          {data.nextTier && (
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-bold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Tiến trình lên hạng
                </span>
                <span className={`font-black ${tier.text}`}>
                  {TIER_CONFIG[data.nextTier.tier]?.label || data.nextTier.tier}
                </span>
              </div>
              <div className="h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                <div
                  className={`h-full bg-gradient-to-r ${tier.color} rounded-full transition-all duration-1000`}
                  style={{ width: `${data.nextTier.progress}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-500">
                Còn <span className="text-white font-bold">{fmtCurrency(data.nextTier.remaining)}</span> nữa để lên hạng
              </p>
            </div>
          )}
          {!data.nextTier && (
            <div className="flex items-center gap-2 text-purple-300 text-sm font-bold mb-4">
              <Gem className="w-4 h-4" /> Bạn đang ở hạng cao nhất!
            </div>
          )}

          {/* ── REDEEM BUTTON ────────────────────────────────────── */}
          {data.loyaltyPoints >= 100 && (
            <button
              onClick={() => setShowRedeem(true)}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r ${tier.color} text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg`}
            >
              <Gift className="w-4 h-4" />
              Đổi điểm thưởng ({fmtNumber(data.loyaltyPoints)} điểm)
            </button>
          )}
        </div>
      </div>

      {/* ── REDEEM MODAL ─────────────────────────────────────── */}
      {showRedeem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
             onClick={() => setShowRedeem(false)}>
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-[400px] max-w-[92vw] shadow-2xl"
               onClick={e => e.stopPropagation()}
               style={{ animation: "slideUp 0.2s ease-out" }}>
            {/* Modal Header */}
            <div className={`bg-gradient-to-r ${tier.color} px-5 py-4 rounded-t-2xl flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-white" />
                <h3 className="text-white font-black">Đổi điểm thưởng</h3>
              </div>
              <button onClick={() => setShowRedeem(false)} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Current balance */}
              <div className="flex items-center justify-between bg-[#111] rounded-xl p-4 border border-[#2a2a2a]">
                <div>
                  <p className="text-xs text-gray-500 font-bold">Số dư hiện tại</p>
                  <p className={`text-xl font-black ${tier.text}`}>{fmtNumber(data.loyaltyPoints)} điểm</p>
                </div>
                <Coins className="w-8 h-8 text-yellow-500/30" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1">
                {REWARDS.map((item) => {
                  const isAffordable = data.loyaltyPoints >= item.points;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={!isAffordable || redeeming}
                      onClick={() => setSelectedReward(item.id)}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        selectedReward === item.id
                          ? "border-[#E50914] bg-[#E50914]/10"
                          : isAffordable
                            ? "border-[#333] hover:border-gray-500"
                            : "border-[#222] opacity-40 cursor-not-allowed"
                      }`}
                    >
                      <span className="text-white font-bold text-sm">{item.label}</span>
                      <span className="text-gray-400 text-xs mt-1">{item.desc}</span>
                      <span className="text-yellow-400 text-xs font-bold mt-2">{item.points} điểm</span>
                    </button>
                  );
                })}
              </div>

              <div className="bg-[#111] rounded-xl p-4 border border-[#2a2a2a] flex items-center justify-between text-xs">
                <span className="text-gray-500">Điểm còn lại</span>
                <span className="text-white font-bold">
                  {fmtNumber(Math.max(0, data.loyaltyPoints - selectedRewardConfig.points))}
                </span>
              </div>

              {/* Confirm button */}
              <button
                onClick={() => handleRedeem()}
                disabled={redeeming || selectedRewardConfig.points > data.loyaltyPoints}
                className="w-full py-3 rounded-xl bg-[#E50914] text-white font-black text-sm hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {redeeming ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</>
                ) : (
                  <><Ticket className="w-4 h-4" /> Xác nhận đổi {fmtNumber(selectedRewardConfig.points)} điểm</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Point History Toggle ───────────────────────────────── */}
      <button
        onClick={fetchHistory}
        className="w-full flex items-center justify-between px-5 py-3 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] hover:border-[#444] transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-gray-400">
          <Coins className="w-4 h-4 text-yellow-500" /> Lịch sử điểm
        </span>
        {showHistory ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>

      {showHistory && history && (
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-hidden">
          {history.data.length === 0 ? (
            <p className="p-6 text-center text-gray-500 text-sm">Chưa có lịch sử điểm</p>
          ) : (
            <div className="divide-y divide-[#2a2a2a]">
              {history.data.map(pt => (
                <div key={pt.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm text-white font-medium">{pt.description}</p>
                    <p className="text-[11px] text-gray-500">
                      {new Date(pt.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-sm ${pt.points > 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {pt.points > 0 ? "+" : ""}{fmtNumber(pt.points)}
                    </p>
                    <p className="text-[10px] text-gray-500">Số dư: {fmtNumber(pt.balanceAfter)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── All Tiers Overview ────────────────────────────────── */}
      <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4">
        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Gift className="w-3 h-3" /> Bảng quyền lợi thành viên
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(data.allTiers || []).map(t => {
            const tc = TIER_CONFIG[t.tier] || TIER_CONFIG.bronze;
            const isActive = t.tier === data.memberTier;
            return (
              <div key={t.tier}
                   className={`rounded-lg p-3 text-center border transition-all
                     ${isActive
                       ? `${tc.bg} ${tc.border} ring-1 ring-white/10`
                       : "border-[#2a2a2a] opacity-50"}`}>
                <p className={`text-xs font-black uppercase tracking-wider ${isActive ? tc.text : "text-gray-500"}`}>
                  {tc.label}
                </p>
                <p className="text-[10px] text-gray-500 mt-1">
                  {t.minSpent > 0 ? `Từ ${fmtCurrency(t.minSpent)}` : "Mặc định"}
                </p>
                <div className="flex items-center justify-center gap-1 mt-1.5">
                  <span className={`text-xs font-bold ${isActive ? "text-white" : "text-gray-500"}`}>
                    {t.earnRate}%
                  </span>
                  <ArrowRight className="w-2.5 h-2.5 text-gray-600" />
                  <span className={`text-xs font-bold ${isActive ? tc.text : "text-gray-500"}`}>
                    {t.discountRate > 0 ? `-${t.discountRate}%` : "0%"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Passcode Modal for redeem protection */}
      <PasscodeModal
        isOpen={showPasscode}
        onClose={() => setShowPasscode(false)}
        onSuccess={(token) => {
          setSecurityToken(token);
          setShowPasscode(false);
          setTimeout(() => handleRedeem(token), 100);
        }}
      />
    </div>
  );
}
