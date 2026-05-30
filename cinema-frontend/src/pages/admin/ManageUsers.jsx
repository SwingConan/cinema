import { useState, useEffect, useCallback } from "react";
import api from "../../utils/api";
import { useAuth } from "../../contexts/AuthContext";
import {
  Search, Shield, UserCheck, UserX, ChevronDown,
  Users, RefreshCw, Lock, Unlock, Plus, X,
  Mail, User, Phone, Eye, EyeOff, Building2,
  UserPlus, KeyRound,
} from "lucide-react";

// ─────────── Helpers ────────────────────────────────────────────────
const roleMeta = {
  admin:    { label: "Admin",    bg: "bg-red-900/30",    text: "text-red-400",    border: "border-red-800/50"    },
  staff:    { label: "Nhân viên", bg: "bg-blue-900/30",  text: "text-blue-400",   border: "border-blue-800/50"   },
  customer: { label: "Khách hàng", bg: "bg-gray-800/60", text: "text-gray-400",   border: "border-gray-700/50"   },
};

const RoleBadge = ({ role }) => {
  const m = roleMeta[role] ?? roleMeta.customer;
  return (
    <span className={`px-2.5 py-1 text-[10px] font-black rounded-full border uppercase tracking-widest ${m.bg} ${m.text} ${m.border}`}>
      {m.label}
    </span>
  );
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

// ─────────── Create Staff Modal ──────────────────────────────────────
function CreateStaffModal({ branches, onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", branchId: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || form.name.trim().length < 2) return setError("Họ tên phải có ít nhất 2 ký tự.");
    if (!form.email.trim()) return setError("Vui lòng nhập email.");
    if (!form.password || form.password.length < 8) return setError("Mật khẩu phải có ít nhất 8 ký tự.");
    if (!form.branchId) return setError("Vui lòng chọn chi nhánh.");

    setLoading(true);
    try {
      const res = await api.post("/admin/users/create-staff", {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        password: form.password,
        branch_id: form.branchId,
      });
      onCreated(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Tạo tài khoản thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl shadow-2xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
          <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#E50914]" />
            Thêm nhân viên mới
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#333] text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-900/20 border border-red-800/50 text-red-400 text-sm font-medium px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Họ và tên */}
          <div>
            <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1.5 block">Họ và tên *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 w-4 h-4" />
              <input type="text" value={form.name} onChange={e => handleChange("name", e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full pl-10 pr-4 py-2.5 bg-[#111] border border-[#333] text-white rounded-xl text-sm outline-none focus:border-[#E50914] transition-colors placeholder:text-gray-700" />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1.5 block">Email *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 w-4 h-4" />
              <input type="email" value={form.email} onChange={e => handleChange("email", e.target.value)}
                placeholder="nhanvien@cinema.com"
                className="w-full pl-10 pr-4 py-2.5 bg-[#111] border border-[#333] text-white rounded-xl text-sm outline-none focus:border-[#E50914] transition-colors placeholder:text-gray-700" />
            </div>
          </div>

          {/* Số điện thoại */}
          <div>
            <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1.5 block">Số điện thoại</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 w-4 h-4" />
              <input type="text" value={form.phone} onChange={e => handleChange("phone", e.target.value)}
                placeholder="0901234567 (tùy chọn)"
                className="w-full pl-10 pr-4 py-2.5 bg-[#111] border border-[#333] text-white rounded-xl text-sm outline-none focus:border-[#E50914] transition-colors placeholder:text-gray-700" />
            </div>
          </div>

          {/* Mật khẩu */}
          <div>
            <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1.5 block">Mật khẩu tạm *</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 w-4 h-4" />
              <input type={showPass ? "text" : "password"} value={form.password}
                onChange={e => handleChange("password", e.target.value)}
                placeholder="Tối thiểu 8 ký tự"
                className="w-full pl-10 pr-10 py-2.5 bg-[#111] border border-[#333] text-white rounded-xl text-sm outline-none focus:border-[#E50914] transition-colors placeholder:text-gray-700" />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-gray-700 text-[10px] mt-1.5 italic">⚠ Hãy giao mật khẩu tạm cho nhân viên và yêu cầu đổi lại sau.</p>
          </div>

          {/* Chi nhánh */}
          <div>
            <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1.5 block">Chi nhánh *</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 w-4 h-4" />
              <select value={form.branchId} onChange={e => handleChange("branchId", e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#111] border border-[#333] text-white rounded-xl text-sm outline-none focus:border-[#E50914] transition-colors appearance-none">
                <option value="">Chọn chi nhánh</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 w-4 h-4 pointer-events-none" />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#333] text-gray-400 hover:text-white hover:border-[#555] text-sm font-bold transition-colors">
              Hủy
            </button>
            <button type="submit" disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#F40612] text-white text-sm font-black uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-2">
              {loading ? (
                <><RefreshCw size={14} className="animate-spin" /> Đang tạo...</>
              ) : (
                <><UserPlus size={14} /> Tạo tài khoản</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ─────────── Main Component ─────────────────────────────────────────
export default function ManageUsers() {
  const { user: currentUser } = useAuth();

  const [users,    setUsers]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [page,     setPage]     = useState(1);
  const [toast,    setToast]    = useState(null);
  const [branches, setBranches] = useState([]);

  // Tab: "staff" or "customer"
  const [activeTab, setActiveTab] = useState("staff");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);

  const PER_PAGE = 20;

  const showToastMsg = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/users", {
        params: { search, role: activeTab, branch_id: branchFilter, page, per_page: PER_PAGE },
      });
      setUsers(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      showToastMsg("error", err.response?.data?.message || "Lỗi tải danh sách.");
    } finally {
      setLoading(false);
    }
  }, [search, activeTab, branchFilter, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    api.get("/admin/branches")
      .then((res) => setBranches(Array.isArray(res.data) ? res.data : (res.data?.data ?? [])))
      .catch((err) => console.error("Branch fetch error:", err));
  }, []);

  // Reset about page 1 when filters change
  useEffect(() => { setPage(1); }, [search, activeTab, branchFilter]);



  const handleChangeBranch = async (userId, newBranchId) => {
    try {
      const res = await api.put(`/admin/users/${userId}/role`, { role: "staff", branch_id: newBranchId });
      setUsers(prev => prev.map(u => u.id === userId ? res.data.user : u));
      showToastMsg("success", "Đã cập nhật chi nhánh.");
    } catch (err) {
      showToastMsg("error", err.response?.data?.message || "Không thể cập nhật chi nhánh.");
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      const res = await api.put(`/admin/users/${userId}/status`);
      setUsers(prev => prev.map(u => u.id === userId ? res.data.user : u));
      showToastMsg("success", res.data.message);
    } catch (err) {
      showToastMsg("error", err.response?.data?.message || "Lỗi thay đổi trạng thái.");
    }
  };

  const handleStaffCreated = (data) => {
    showToastMsg("success", data.message);
    setShowCreateModal(false);
    fetchUsers();
  };



  const totalPages = Math.ceil(total / PER_PAGE);
  const isSelf = (uid) => uid === currentUser?.id;

  return (
    <div className="p-6 md:p-8 border-l border-[#333] bg-[#141414] min-h-screen relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[60] px-5 py-3 rounded-xl shadow-2xl font-bold text-sm flex items-center gap-2 transition-all
          ${toast.type === "success" ? "bg-emerald-900 text-emerald-300 border border-emerald-700" : "bg-red-900 text-red-300 border border-red-700"}`}>
          {toast.type === "success" ? <UserCheck size={16}/> : <UserX size={16}/>}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black text-white uppercase tracking-wider border-l-4 border-[#E50914] pl-3">
          Quản lý Tài Khoản
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-sm font-medium">
            Tổng <span className="text-white font-bold">{total}</span> tài khoản
          </span>
          <button onClick={fetchUsers}
            className="p-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-gray-400 hover:text-white hover:border-[#555] transition-all">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""}/>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 bg-[#1a1a1a] p-1 rounded-xl border border-[#2a2a2a] w-fit">
        <button onClick={() => setActiveTab("staff")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === "staff"
              ? "bg-blue-600 text-white shadow-lg"
              : "text-gray-400 hover:text-white hover:bg-[#222]"
          }`}>
          <Shield size={14} />
          Nhân viên
        </button>
        <button onClick={() => setActiveTab("customer")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === "customer"
              ? "bg-gray-600 text-white shadow-lg"
              : "text-gray-400 hover:text-white hover:bg-[#222]"
          }`}>
          <Users size={14} />
          Khách hàng
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#333] mb-5 flex flex-col sm:flex-row gap-3 items-center">
        {/* Add staff button (only on staff tab) */}
        {activeTab === "staff" && (
          <button onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#E50914] hover:bg-[#F40612] text-white text-sm font-black rounded-xl transition-colors uppercase tracking-wider shrink-0">
            <Plus size={16} />
            Thêm nhân viên
          </button>
        )}

        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600"/>
          <input
            type="text"
            placeholder={activeTab === "staff" ? "Tìm nhân viên theo tên, email..." : "Tìm khách hàng theo tên, email..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#111] border border-[#333] text-white rounded-xl text-sm outline-none focus:border-[#E50914] transition-colors placeholder:text-gray-700"
          />
        </div>

        {/* Branch filter (staff tab only) */}
        {activeTab === "staff" && (
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="bg-[#111] border border-[#333] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#E50914] transition-colors min-w-[180px]"
          >
            <option value="">Tất cả chi nhánh</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="bg-[#1a1a1a] rounded-xl border border-[#333] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#2a2a2a]">
            <thead className="bg-[#111]">
              <tr>
                {activeTab === "staff" ? (
                  <>
                    {["#", "Nhân viên", "Email", "SĐT", "Chi nhánh", "Trạng thái", "Ngày tạo", "Hành động"].map(h => (
                      <th key={h} className="px-4 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </>
                ) : (
                  <>
                    {["#", "Khách hàng", "Email", "SĐT", "Trạng thái", "Ngày tạo", "Hành động"].map(h => (
                      <th key={h} className="px-4 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-gray-600 font-bold animate-pulse">
                    Đang tải...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <Users size={40} className="mx-auto text-gray-700 mb-3"/>
                    <p className="text-gray-600 font-medium">
                      {activeTab === "staff" ? "Chưa có nhân viên nào." : "Không tìm thấy khách hàng."}
                    </p>
                    {activeTab === "staff" && (
                      <button onClick={() => setShowCreateModal(true)}
                        className="mt-3 text-[#E50914] text-sm font-bold hover:underline">
                        + Thêm nhân viên đầu tiên
                      </button>
                    )}
                  </td>
                </tr>
              ) : users.map((u, idx) => (
                <tr key={u.id}
                  className={`transition-colors hover:bg-[#222] ${!u.isActive ? "opacity-40" : ""}`}>

                  {/* # */}
                  <td className="px-4 py-3 text-gray-600 text-sm font-mono">
                    {(page - 1) * PER_PAGE + idx + 1}
                  </td>

                  {/* Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0
                        ${u.role === "admin" ? "bg-red-900/40 text-red-400" : u.role === "staff" ? "bg-blue-900/40 text-blue-400" : "bg-gray-800 text-gray-400"}`}>
                        {u.name?.charAt(0)?.toUpperCase() ?? "?"}
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm leading-tight">{u.name}</p>
                        {isSelf(u.id) && (
                          <span className="text-[10px] text-[#E50914] font-black">(Bạn)</span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3 text-gray-400 text-sm font-mono">{u.email}</td>

                  {/* SĐT */}
                  <td className="px-4 py-3 text-gray-500 text-sm">{u.phone || "—"}</td>

                  {/* Chi nhánh (staff tab only) */}
                  {activeTab === "staff" && (
                    <td className="px-4 py-3">
                      <select
                        value={u.branchId || u.branch_id || ""}
                        onChange={(e) => handleChangeBranch(u.id, e.target.value)}
                        className="max-w-[180px] rounded-lg border border-[#333] bg-[#111] px-2 py-1.5 text-xs text-gray-300 outline-none focus:border-blue-500 transition-colors"
                      >
                        <option value="">Chọn chi nhánh</option>
                        {branches.map((branch) => (
                          <option key={branch.id} value={branch.id}>{branch.name}</option>
                        ))}
                      </select>
                    </td>
                  )}

                  {/* Trạng thái */}
                  <td className="px-4 py-3">
                    {u.isActive ? (
                      <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"/>
                        Hoạt động
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-gray-600 text-xs font-bold">
                        <Lock size={11}/>
                        Bị khóa
                      </span>
                    )}
                  </td>

                  {/* Ngày tạo */}
                  <td className="px-4 py-3 text-gray-600 text-sm whitespace-nowrap">{fmtDate(u.createdAt)}</td>

                  {/* Hành động */}
                  <td className="px-4 py-3">
                    {isSelf(u.id) || u.role === "admin" ? (
                      <span className="text-[11px] text-gray-700 font-medium italic px-1">
                        Không thao tác
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        {/* Lock/Unlock */}
                        <button
                          onClick={() => handleToggleStatus(u.id)}
                          title={u.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                          className={`p-1.5 rounded-lg border transition-all
                            ${u.isActive
                              ? "border-[#333] bg-[#252525] text-gray-500 hover:border-red-700 hover:text-red-400 hover:bg-red-900/20"
                              : "border-emerald-800/50 bg-emerald-900/20 text-emerald-400 hover:bg-emerald-900/40"
                            }`}>
                          {u.isActive ? <Lock size={14}/> : <Unlock size={14}/>}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#2a2a2a] bg-[#111]">
            <p className="text-xs text-gray-600">
              Hiển thị <span className="text-white font-bold">{(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)}</span> / {total}
            </p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#333] text-gray-400 hover:text-white disabled:opacity-30 text-xs font-bold transition-colors">
                ← Trước
              </button>
              <span className="px-3 py-1.5 text-xs text-gray-400 font-mono">
                {page} / {totalPages}
              </span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#333] text-gray-400 hover:text-white disabled:opacity-30 text-xs font-bold transition-colors">
                Tiếp →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showCreateModal && (
        <CreateStaffModal
          branches={branches}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleStaffCreated}
        />
      )}


    </div>
  );
}
