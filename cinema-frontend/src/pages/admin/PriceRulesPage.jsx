import { useState, useEffect } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";
import {
  Plus, Trash2, Edit2, Save, X, Calendar, DollarSign,
  Sun, Moon, Sunset, Clock, Percent, ChevronDown, ChevronUp,
} from "lucide-react";

const ROOM_TYPES = [null, "2D", "3D", "IMAX", "4DX"];
const DAY_TYPES = [null, "weekday", "weekend", "holiday"];
const TIME_SLOTS = [null, "morning", "afternoon", "evening", "midnight"];
const SEAT_TYPES = [null, "regular", "vip", "couple"];
const MODIFIER_TYPES = ["percentage", "fixed"];

const LABELS = {
  roomType: { null: "Tất cả", "2D": "2D", "3D": "3D", IMAX: "IMAX", "4DX": "4DX" },
  dayType: { null: "Tất cả", weekday: "Ngày thường", weekend: "Cuối tuần", holiday: "Ngày lễ" },
  timeSlot: { null: "Tất cả", morning: "Sáng (< 12h)", afternoon: "Chiều (12-17h)", evening: "Tối (17-21h)", midnight: "Khuya (> 21h)" },
  seatType: { null: "Tất cả", regular: "Thường", vip: "VIP", couple: "Couple" },
  modifierType: { percentage: "%", fixed: "VNĐ" },
};

const TIME_ICONS = { morning: Sun, afternoon: Sunset, evening: Moon, midnight: Clock };

const emptyRule = {
  name: "", roomType: null, dayType: null, timeSlot: null, seatType: null,
  modifierType: "percentage", modifierValue: 0, priority: 0, isActive: true,
};

export default function PriceRulesPage() {
  const [rules, setRules] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyRule });
  const [showForm, setShowForm] = useState(false);
  const [holidayForm, setHolidayForm] = useState({ date: "", name: "" });
  const [showHolidays, setShowHolidays] = useState(false);

  const fetchData = async () => {
    try {
      const [rulesRes, holidaysRes] = await Promise.all([
        api.get("/admin/price-rules"),
        api.get("/admin/holidays"),
      ]);
      setRules(rulesRes.data);
      setHolidays(holidaysRes.data);
    } catch (e) { toast.error("Lỗi tải dữ liệu"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Tên quy tắc là bắt buộc");
    try {
      if (editingId) {
        await api.put(`/admin/price-rules/${editingId}`, form);
        toast.success("Đã cập nhật quy tắc giá");
      } else {
        await api.post("/admin/price-rules", form);
        toast.success("Đã tạo quy tắc giá mới");
      }
      setShowForm(false); setEditingId(null); setForm({ ...emptyRule });
      fetchData();
    } catch (e) { toast.error(e.response?.data?.message || "Lỗi lưu quy tắc"); }
  };

  const handleEdit = (rule) => {
    setEditingId(rule.id);
    setForm({ ...rule });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Xóa quy tắc giá này?")) return;
    try {
      await api.delete(`/admin/price-rules/${id}`);
      toast.success("Đã xóa"); fetchData();
    } catch (e) { toast.error("Lỗi xóa"); }
  };

  const handleToggle = async (rule) => {
    try {
      await api.put(`/admin/price-rules/${rule.id}`, { ...rule, isActive: !rule.isActive });
      fetchData();
    } catch (e) { toast.error("Lỗi cập nhật"); }
  };

  const handleAddHoliday = async () => {
    if (!holidayForm.date || !holidayForm.name.trim()) return toast.error("Vui lòng nhập đầy đủ");
    try {
      await api.post("/admin/holidays", holidayForm);
      toast.success("Đã thêm ngày lễ"); setHolidayForm({ date: "", name: "" }); fetchData();
    } catch (e) { toast.error(e.response?.data?.message || "Lỗi thêm ngày lễ"); }
  };

  const handleDeleteHoliday = async (id) => {
    try {
      await api.delete(`/admin/holidays/${id}`);
      toast.success("Đã xóa ngày lễ"); fetchData();
    } catch (e) { toast.error("Lỗi xóa"); }
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Đang tải...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <DollarSign className="text-[#E50914]" /> Dynamic Pricing Engine
          </h1>
          <p className="text-gray-400 mt-1">Quản lý quy tắc giá linh hoạt theo ngày, khung giờ, loại phòng</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm({ ...emptyRule }); }}
          className="bg-[#E50914] text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-red-700 transition-all"
        >
          <Plus size={18} /> Thêm quy tắc
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="bg-[#1e1e1e] border border-[#333] rounded-2xl p-6 mb-6 animate-in">
          <h3 className="text-lg font-bold text-white mb-4">
            {editingId ? "Sửa quy tắc giá" : "Tạo quy tắc giá mới"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-3">
              <label className="text-sm text-gray-400 mb-1 block">Tên quy tắc *</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-3 py-2 text-white"
                placeholder="VD: Cuối tuần +20%"
              />
            </div>
            {/* Filters */}
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Loại phòng</label>
              <select value={form.roomType ?? ""} onChange={e => setForm({...form, roomType: e.target.value || null})}
                className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-3 py-2 text-white">
                {ROOM_TYPES.map(v => <option key={v ?? "all"} value={v ?? ""}>{LABELS.roomType[v]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Loại ngày</label>
              <select value={form.dayType ?? ""} onChange={e => setForm({...form, dayType: e.target.value || null})}
                className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-3 py-2 text-white">
                {DAY_TYPES.map(v => <option key={v ?? "all"} value={v ?? ""}>{LABELS.dayType[v]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Khung giờ</label>
              <select value={form.timeSlot ?? ""} onChange={e => setForm({...form, timeSlot: e.target.value || null})}
                className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-3 py-2 text-white">
                {TIME_SLOTS.map(v => <option key={v ?? "all"} value={v ?? ""}>{LABELS.timeSlot[v]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Loại ghế</label>
              <select value={form.seatType ?? ""} onChange={e => setForm({...form, seatType: e.target.value || null})}
                className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-3 py-2 text-white">
                {SEAT_TYPES.map(v => <option key={v ?? "all"} value={v ?? ""}>{LABELS.seatType[v]}</option>)}
              </select>
            </div>
            {/* Modifier */}
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Loại điều chỉnh</label>
              <select value={form.modifierType} onChange={e => setForm({...form, modifierType: e.target.value})}
                className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-3 py-2 text-white">
                <option value="percentage">Phần trăm (%)</option>
                <option value="fixed">Cố định (VNĐ)</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">
                Giá trị {form.modifierType === "percentage" ? "(VD: 20 = +20%, -15 = -15%)" : "(VD: 20000 = +20k)"}
              </label>
              <input type="number" value={form.modifierValue}
                onChange={e => setForm({...form, modifierValue: Number(e.target.value)})}
                className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Ưu tiên (cao = ưu tiên hơn)</label>
              <input type="number" value={form.priority} min={0} max={10}
                onChange={e => setForm({...form, priority: Number(e.target.value)})}
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

      {/* Rules Table */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-[#222]">
            <tr className="text-gray-400 text-left">
              <th className="px-4 py-3">Tên quy tắc</th>
              <th className="px-4 py-3">Điều kiện</th>
              <th className="px-4 py-3">Điều chỉnh</th>
              <th className="px-4 py-3">Ưu tiên</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rules.map(rule => (
              <tr key={rule.id} className="border-t border-[#333] hover:bg-[#222] transition-colors">
                <td className="px-4 py-3 text-white font-semibold">{rule.name}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {rule.roomType && <span className="px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded text-xs">{rule.roomType}</span>}
                    {rule.dayType && <span className="px-2 py-0.5 bg-purple-900/30 text-purple-400 rounded text-xs">{LABELS.dayType[rule.dayType]}</span>}
                    {rule.timeSlot && <span className="px-2 py-0.5 bg-amber-900/30 text-amber-400 rounded text-xs">{LABELS.timeSlot[rule.timeSlot]}</span>}
                    {rule.seatType && <span className="px-2 py-0.5 bg-green-900/30 text-green-400 rounded text-xs">{rule.seatType}</span>}
                    {!rule.roomType && !rule.dayType && !rule.timeSlot && !rule.seatType && (
                      <span className="text-gray-500 text-xs">Áp dụng tất cả</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`font-bold ${rule.modifierValue >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {rule.modifierValue >= 0 ? '+' : ''}{rule.modifierValue}
                    {rule.modifierType === 'percentage' ? '%' : 'đ'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400">{rule.priority}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleToggle(rule)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                      rule.isActive ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                    }`}>
                    {rule.isActive ? 'Hoạt động' : 'Tắt'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => handleEdit(rule)} className="p-1.5 rounded-lg hover:bg-[#333] text-gray-400 hover:text-white transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(rule.id)} className="p-1.5 rounded-lg hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rules.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Chưa có quy tắc giá nào</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Holidays Section */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden">
        <button onClick={() => setShowHolidays(!showHolidays)}
          className="w-full flex items-center justify-between px-6 py-4 text-white font-bold hover:bg-[#222] transition-colors">
          <span className="flex items-center gap-2"><Calendar className="text-[#E50914]" size={20} /> Quản lý ngày lễ ({holidays.length})</span>
          {showHolidays ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {showHolidays && (
          <div className="px-6 pb-6">
            <div className="flex gap-3 mb-4">
              <input type="date" value={holidayForm.date} onChange={e => setHolidayForm({...holidayForm, date: e.target.value})}
                className="bg-[#2a2a2a] border border-[#444] rounded-lg px-3 py-2 text-white" />
              <input value={holidayForm.name} onChange={e => setHolidayForm({...holidayForm, name: e.target.value})}
                placeholder="Tên ngày lễ" className="flex-1 bg-[#2a2a2a] border border-[#444] rounded-lg px-3 py-2 text-white" />
              <button onClick={handleAddHoliday} className="bg-[#E50914] text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700">
                <Plus size={18} />
              </button>
            </div>
            <div className="space-y-2">
              {holidays.map(h => (
                <div key={h.id} className="flex items-center justify-between bg-[#222] px-4 py-2 rounded-lg">
                  <div>
                    <span className="text-white font-semibold">{h.name}</span>
                    <span className="text-gray-400 ml-3 text-sm">{new Date(h.date).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <button onClick={() => handleDeleteHoliday(h.id)} className="text-gray-400 hover:text-red-400">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {holidays.length === 0 && <p className="text-gray-500 text-center py-3">Chưa có ngày lễ nào</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
