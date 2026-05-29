import { useEffect, useState } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { Building2, Plus, Save, Trash2, X } from "lucide-react";

const emptyForm = { name: "", address: "", city: "", phone: "", email: "", status: "active" };

const STANDARD_34_PROVINCES = [
  "An Giang",
  "Bắc Ninh",
  "Cà Mau",
  "Cần Thơ",
  "Cao Bằng",
  "Đà Nẵng",
  "Đắk Lắk",
  "Điện Biên",
  "Đồng Nai",
  "Đồng Tháp",
  "Gia Lai",
  "Hà Nội",
  "Hà Tĩnh",
  "Hải Phòng",
  "Hồ Chí Minh",
  "Hưng Yên",
  "Khánh Hòa",
  "Lai Châu",
  "Lâm Đồng",
  "Lạng Sơn",
  "Lào Cai",
  "Nghệ An",
  "Ninh Bình",
  "Phú Thọ",
  "Quảng Ngãi",
  "Quảng Ninh",
  "Quảng Trị",
  "Sơn La",
  "Tây Ninh",
  "Thái Nguyên",
  "Thanh Hóa",
  "Huế",
  "Tuyên Quang",
  "Vĩnh Long"
].sort((a, b) => a.localeCompare(b, "vi"));

export default function BranchesPage() {
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchBranches = async () => {
    const res = await api.get("/admin/branches");
    setBranches(Array.isArray(res.data) ? res.data : (res.data?.data ?? []));
  };

  useEffect(() => { fetchBranches(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/admin/branches/${editingId}`, form);
        toast.success("Đã cập nhật chi nhánh");
      } else {
        await api.post("/admin/branches", form);
        toast.success("Đã tạo chi nhánh");
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      fetchBranches();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể lưu chi nhánh");
    }
  };

  const edit = (branch) => {
    setEditingId(branch.id);
    setForm({
      name: branch.name || "",
      address: branch.address || "",
      city: branch.city || "",
      phone: branch.phone || "",
      email: branch.email || "",
      status: branch.status || "active",
    });
    setShowForm(true);
  };

  const remove = async (id) => {
    if (!confirm("Xóa chi nhánh này?")) return;
    try {
      await api.delete(`/admin/branches/${id}`);
      toast.success("Đã xóa chi nhánh");
      fetchBranches();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể xóa chi nhánh");
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Building2 className="text-[#E50914]" /> Chi nhánh
          </h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý chuỗi rạp và trạng thái hoạt động.</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}
          className="inline-flex items-center gap-2 rounded-xl bg-[#E50914] px-4 py-2.5 text-sm font-black text-white"
        >
          <Plus className="w-4 h-4" /> Tạo chi nhánh
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-black">{editingId ? "Sửa chi nhánh" : "Tạo chi nhánh mới"}</h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              ["name", "Tên chi nhánh"],
              ["address", "Địa chỉ"],
              ["phone", "Số điện thoại"],
              ["email", "Email"],
            ].map(([key, label]) => (
              <label key={key} className={key === "address" ? "md:col-span-2" : ""}>
                <span className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">{label}</span>
                <input
                  value={form[key]}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                  required={["name", "address"].includes(key)}
                  className="w-full rounded-xl border border-[#333] bg-[#111] px-4 py-2.5 text-white outline-none focus:border-[#E50914]"
                />
              </label>
            ))}

            <label>
              <span className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Thành phố (Tỉnh) *</span>
              <select
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                required
                className="w-full rounded-xl border border-[#333] bg-[#111] px-4 py-2.5 text-white outline-none focus:border-[#E50914]"
              >
                <option value="" disabled>-- Chọn Thành phố (Tỉnh) --</option>
                {STANDARD_34_PROVINCES.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Trạng thái</span>
              <select
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                className="w-full rounded-xl border border-[#333] bg-[#111] px-4 py-2.5 text-white outline-none focus:border-[#E50914]"
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Tạm dừng</option>
              </select>
            </label>
          </div>
          <button className="inline-flex items-center gap-2 rounded-xl bg-[#E50914] px-4 py-2.5 text-sm font-black text-white">
            <Save className="w-4 h-4" /> Lưu
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {branches.map((branch) => (
          <div key={branch.id} className="rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-white font-black text-lg">{branch.name}</h3>
                <p className="text-gray-400 text-sm mt-1">{branch.address}</p>
                <p className="text-gray-500 text-sm">{branch.city}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase ${
                branch.status === "active" ? "bg-emerald-900/30 text-emerald-400" : "bg-gray-800 text-gray-400"
              }`}>
                {branch.status}
              </span>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => edit(branch)} className="rounded-lg border border-[#333] px-3 py-2 text-sm font-bold text-gray-300 hover:bg-[#222]">
                Sửa
              </button>
              <button onClick={() => remove(branch.id)} className="rounded-lg border border-red-900/50 px-3 py-2 text-sm font-bold text-red-400 hover:bg-red-950/30">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
