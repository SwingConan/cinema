import { useState, useEffect } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";
import {
  Plus, Trash2, Edit2, Save, X, Tag, Copy, CheckCircle, XCircle,
  Percent, DollarSign, Calendar, Users,
} from "lucide-react";

const emptyVoucher = {
  code: "", name: "", description: "", discountType: "percentage",
  discountValue: 0, maxDiscount: null, minOrder: 0, usageLimit: null,
  perUserLimit: 1, validFrom: "", validTo: "", applicableDays: null, isActive: true,
};

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyVoucher });
  const [showForm, setShowForm] = useState(false);

  const fetchData = async () => {
    try {
      const res = await api.get("/admin/vouchers");
      setVouchers(res.data);
    } catch (e) { toast.error("Lỗi tải dữ liệu"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim()) return toast.error("Mã và tên voucher là bắt buộc");
    if (!form.validFrom || !form.validTo) return toast.error("Thời gian hiệu lực là bắt buộc");
    try {
      if (editingId) {
        await api.put(`/admin/vouchers/${editingId}`, form);
        toast.success("Đã cập nhật voucher");
      } else {
        await api.post("/admin/vouchers", form);
        toast.success("Đã tạo voucher mới");
      }
      setShowForm(false); setEditingId(null); setForm({ ...emptyVoucher });
      fetchData();
    } catch (e) { toast.error(e.response?.data?.message || "Lỗi lưu voucher"); }
  };

  const handleEdit = (v) => {
    setEditingId(v.id);
    setForm({
      ...v,
      validFrom: v.validFrom ? new Date(v.validFrom).toISOString().slice(0, 16) : "",
      validTo: v.validTo ? new Date(v.validTo).toISOString().slice(0, 16) : "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Xóa voucher này?")) return;
    try {
      await api.delete(`/admin/vouchers/${id}`);
      toast.success("Đã xóa"); fetchData();
    } catch (e) { toast.error("Lỗi xóa"); }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Đã copy: ${code}`);
  };

  const formatMoney = (v) => Number(v).toLocaleString("vi-VN") + "đ";

  if (loading) return <div className="text-center py-20 text-gray-400">Đang tải...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Tag className="text-[#E50914]" /> Voucher & Promotion
          </h1>
          <p className="text-gray-400 mt-1">Quản lý mã giảm giá cho khách hàng</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm({ ...emptyVoucher }); }}
          className="bg-[#E50914] text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-red-700 transition-all"
        >
          <Plus size={18} /> Tạo voucher
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-[#1e1e1e] border border-[#333] rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-bold text-white mb-4">
            {editingId ? "Sửa voucher" : "Tạo voucher mới"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Mã voucher *</label>
              <input value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})}
                className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-3 py-2 text-white font-mono"
                placeholder="VD: SUMMER30K" maxLength={20}
              />
            </div>
            <div className="lg:col-span-2">
              <label className="text-sm text-gray-400 mb-1 block">Tên *</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-3 py-2 text-white"
                placeholder="VD: Ưu đãi mùa hè"
              />
            </div>
            <div className="lg:col-span-3">
              <label className="text-sm text-gray-400 mb-1 block">Mô tả</label>
              <input value={form.description || ""} onChange={e => setForm({...form, description: e.target.value})}
                className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-3 py-2 text-white"
                placeholder="Mô tả ngắn cho voucher"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Loại giảm giá</label>
              <select value={form.discountType} onChange={e => setForm({...form, discountType: e.target.value})}
                className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-3 py-2 text-white">
                <option value="percentage">Phần trăm (%)</option>
                <option value="fixed">Cố định (VNĐ)</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">
                Giá trị giảm {form.discountType === "percentage" ? "(%)" : "(VNĐ)"}
              </label>
              <input type="number" value={form.discountValue}
                onChange={e => setForm({...form, discountValue: Number(e.target.value)})}
                className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Giảm tối đa (VNĐ)</label>
              <input type="number" value={form.maxDiscount || ""}
                onChange={e => setForm({...form, maxDiscount: e.target.value ? Number(e.target.value) : null})}
                className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-3 py-2 text-white"
                placeholder="Để trống = không giới hạn"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Đơn tối thiểu (VNĐ)</label>
              <input type="number" value={form.minOrder}
                onChange={e => setForm({...form, minOrder: Number(e.target.value)})}
                className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Tổng lượt dùng</label>
              <input type="number" value={form.usageLimit || ""}
                onChange={e => setForm({...form, usageLimit: e.target.value ? Number(e.target.value) : null})}
                className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-3 py-2 text-white"
                placeholder="Để trống = không giới hạn"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Giới hạn/người</label>
              <input type="number" value={form.perUserLimit} min={1}
                onChange={e => setForm({...form, perUserLimit: Number(e.target.value)})}
                className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Bắt đầu *</label>
              <input type="datetime-local" value={form.validFrom}
                onChange={e => setForm({...form, validFrom: e.target.value})}
                className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Kết thúc *</label>
              <input type="datetime-local" value={form.validTo}
                onChange={e => setForm({...form, validTo: e.target.value})}
                className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={handleSave}
              className="bg-[#E50914] text-white px-5 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-red-700">
              <Save size={16} /> {editingId ? "Cập nhật" : "Tạo mới"}
            </button>
            <button onClick={() => { setShowForm(false); setEditingId(null); }}
              className="bg-[#333] text-gray-300 px-5 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-[#444]">
              <X size={16} /> Hủy
            </button>
          </div>
        </div>
      )}

      {/* Voucher Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vouchers.map(v => {
          const isExpired = new Date(v.validTo) < new Date();
          const isUpcoming = new Date(v.validFrom) > new Date();
          return (
            <div key={v.id}
              className={`bg-[#1a1a1a] border rounded-2xl p-5 relative overflow-hidden transition-all hover:border-[#E50914]/50 ${
                !v.isActive || isExpired ? 'border-[#333] opacity-60' : 'border-[#444]'
              }`}>
              {/* Dashed divider for ticket feel */}
              <div className="absolute left-0 right-0 top-[88px] border-t border-dashed border-[#333]"></div>
              
              {/* Top: Code + Discount */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-lg font-black text-[#E50914] tracking-wider">{v.code}</span>
                    <button onClick={() => copyCode(v.code)} className="text-gray-400 hover:text-white">
                      <Copy size={14} />
                    </button>
                  </div>
                  <p className="text-white font-semibold">{v.name}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-white">
                    {v.discountType === "percentage" ? `${v.discountValue}%` : formatMoney(v.discountValue)}
                  </span>
                  {v.maxDiscount && v.discountType === "percentage" && (
                    <p className="text-xs text-gray-400">Tối đa {formatMoney(v.maxDiscount)}</p>
                  )}
                </div>
              </div>
              
              {/* Bottom: Details */}
              <div className="pt-4 space-y-2 text-sm text-gray-400">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1"><Calendar size={14} /> Hiệu lực</span>
                  <span>
                    {new Date(v.validFrom).toLocaleDateString('vi-VN')} — {new Date(v.validTo).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1"><Users size={14} /> Đã dùng</span>
                  <span>{v.usedCount ?? 0}{v.usageLimit ? ` / ${v.usageLimit}` : ''} lượt</span>
                </div>
                {v.minOrder > 0 && (
                  <div className="flex items-center justify-between">
                    <span>Đơn tối thiểu</span>
                    <span>{formatMoney(v.minOrder)}</span>
                  </div>
                )}
                {/* Status badges */}
                <div className="flex items-center gap-2 pt-2">
                  {v.isActive && !isExpired && !isUpcoming && (
                    <span className="px-2 py-0.5 bg-green-900/30 text-green-400 rounded-full text-xs font-bold flex items-center gap-1">
                      <CheckCircle size={12} /> Đang hoạt động
                    </span>
                  )}
                  {isExpired && (
                    <span className="px-2 py-0.5 bg-red-900/30 text-red-400 rounded-full text-xs font-bold flex items-center gap-1">
                      <XCircle size={12} /> Hết hạn
                    </span>
                  )}
                  {isUpcoming && (
                    <span className="px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded-full text-xs font-bold">
                      Sắp diễn ra
                    </span>
                  )}
                  {!v.isActive && (
                    <span className="px-2 py-0.5 bg-gray-900/30 text-gray-400 rounded-full text-xs font-bold">Đã tắt</span>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="absolute top-4 right-4 flex gap-1">
                <button onClick={() => handleEdit(v)} className="p-1.5 rounded-lg hover:bg-[#333] text-gray-400 hover:text-white">
                  <Edit2 size={15} />
                </button>
                <button onClick={() => handleDelete(v.id)} className="p-1.5 rounded-lg hover:bg-red-900/30 text-gray-400 hover:text-red-400">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {vouchers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Tag size={48} className="mx-auto mb-3 opacity-30" />
          <p>Chưa có voucher nào. Tạo voucher đầu tiên!</p>
        </div>
      )}
    </div>
  );
}
