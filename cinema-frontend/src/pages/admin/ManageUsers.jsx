import { useState, useEffect, useCallback } from "react";
import api from "../../utils/api";
import { useAuth } from "../../contexts/AuthContext";
import {
  Search, Shield, UserCheck, UserX, ChevronDown,
  Users, RefreshCw, Lock, Unlock,
} from "lucide-react";

// ─────────── Helpers ────────────────────────────────────────────────
const ROLES = ["", "admin", "staff", "customer"];

const roleMeta = {
  admin:    { label: "Admin",    bg: "bg-red-900/30",    text: "text-red-400",    border: "border-red-800/50"    },
  staff:    { label: "Staff",    bg: "bg-blue-900/30",   text: "text-blue-400",   border: "border-blue-800/50"   },
  customer: { label: "Customer", bg: "bg-gray-800/60",   text: "text-gray-400",   border: "border-gray-700/50"   },
};

const RoleBadge = ({ role }) => {
  const m = roleMeta[role] ?? roleMeta.customer;
  return (
    <span className={`px-2.5 py-1 text-xs font-black rounded-full border uppercase tracking-widest ${m.bg} ${m.text} ${m.border}`}>
      {m.label}
    </span>
  );
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

// ─────────── Main Component ─────────────────────────────────────────
export default function ManageUsers() {
  const { user: currentUser } = useAuth();

  const [users,    setUsers]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page,     setPage]     = useState(1);
  const [toast,    setToast]    = useState(null); // { type: 'success'|'error', msg }
  const [branches, setBranches] = useState([]);

  // Dropdown state: { userId, open }
  const [openDropdown, setOpenDropdown] = useState(null);

  const PER_PAGE = 20;

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/users", {
        params: { search, role: roleFilter, page, per_page: PER_PAGE },
      });
      setUsers(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      showToast("error", err.response?.data?.message || "Lỗi tải danh sách.");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    api.get("/admin/branches")
      .then((res) => setBranches(Array.isArray(res.data) ? res.data : (res.data?.data ?? [])))
      .catch((err) => console.error("Branch fetch error:", err));
  }, []);

  // Reset về trang 1 khi filter thay đổi
  useEffect(() => { setPage(1); }, [search, roleFilter]);

  const handleChangeRole = async (userId, role) => {
    setOpenDropdown(null);
    try {
      const current = users.find((u) => u.id === userId);
      const defaultBranch = current?.branchId || current?.branch_id || branches[0]?.id || null;
      const res = await api.put(`/admin/users/${userId}/role`, {
        role,
        ...(role === "staff" && defaultBranch ? { branch_id: defaultBranch } : {}),
      });
      setUsers(prev => prev.map(u => u.id === userId ? res.data.user : u));
      showToast("success", res.data.message);
    } catch (err) {
      showToast("error", err.response?.data?.message || "Lỗi cập nhật role.");
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      const res = await api.put(`/admin/users/${userId}/status`);
      setUsers(prev => prev.map(u => u.id === userId ? res.data.user : u));
      showToast("success", res.data.message);
    } catch (err) {
      showToast("error", err.response?.data?.message || "Lỗi thay đổi trạng thái.");
    }
  };

  const totalPages = Math.ceil(total / PER_PAGE);
  const isSelf = (uid) => uid === currentUser?.id;

  return (
    <div className="p-6 md:p-8 border-l border-[#333] bg-[#141414] min-h-screen relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl font-bold text-sm flex items-center gap-2 transition-all
          ${toast.type === "success" ? "bg-emerald-900 text-emerald-300 border border-emerald-700" : "bg-red-900 text-red-300 border border-red-700"}`}>
          {toast.type === "success" ? <UserCheck size={16}/> : <UserX size={16}/>}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-white uppercase tracking-wider border-l-4 border-[#E50914] pl-3">
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

      {/* Toolbar */}
      <div className="bg-[#1a1a1a] p-5 rounded-xl border border-[#333] mb-6 flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600"/>
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#111] border border-[#333] text-white rounded-xl text-sm outline-none focus:border-[#E50914] transition-colors placeholder:text-gray-700"
          />
        </div>
        {/* Role filter */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-[#111] border border-[#333] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#E50914] transition-colors min-w-[160px]"
        >
          <option value="">Tất cả vai trò</option>
          <option value="admin">Admin</option>
          <option value="staff">Staff</option>
          <option value="customer">Customer</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#1a1a1a] rounded-xl border border-[#333] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#2a2a2a]">
            <thead className="bg-[#111]">
              <tr>
                {["#", "Người dùng", "Email", "SĐT", "Vai trò", "Tình trạng", "Ngày tạo", "Hành động"].map(h => (
                  <th key={h} className="px-4 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">
                    {h}
                  </th>
                ))}
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
                    <p className="text-gray-600 font-medium">Không tìm thấy tài khoản nào.</p>
                  </td>
                </tr>
              ) : users.map((u, idx) => (
                <tr key={u.id}
                  className={`transition-colors hover:bg-[#222] ${!u.isActive ? "opacity-40" : ""}`}>

                  {/* # */}
                  <td className="px-4 py-3 text-gray-600 text-sm font-mono">
                    {(page - 1) * PER_PAGE + idx + 1}
                  </td>

                  {/* Người dùng */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar chữ cái */}
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

                  {/* Role */}
                  <td className="px-4 py-3">
                    <RoleBadge role={u.role}/>
                    {u.role === "staff" && (
                      <select
                        value={u.branchId || u.branch_id || ""}
                        onChange={async (e) => {
                          try {
                            const res = await api.put(`/admin/users/${u.id}/role`, { role: "staff", branch_id: e.target.value });
                            setUsers(prev => prev.map(item => item.id === u.id ? res.data.user : item));
                            showToast("success", "Đã cập nhật chi nhánh nhân viên.");
                          } catch (err) {
                            showToast("error", err.response?.data?.message || "Không thể cập nhật chi nhánh.");
                          }
                        }}
                        className="mt-2 block max-w-[180px] rounded-lg border border-[#333] bg-[#111] px-2 py-1 text-xs text-gray-300 outline-none"
                      >
                        <option value="">Chọn chi nhánh</option>
                        {branches.map((branch) => (
                          <option key={branch.id} value={branch.id}>{branch.name}</option>
                        ))}
                      </select>
                    )}
                  </td>

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
                    <div className="flex items-center gap-2">

                      {/* ── Đổi Role (Dropdown) ── */}
                      {!isSelf(u.id) && u.role !== "admin" && (
                        <div className="relative">
                          <button
                            onClick={() => setOpenDropdown(openDropdown === u.id ? null : u.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252525] border border-[#333] hover:border-blue-600 text-gray-300 hover:text-blue-400 text-xs font-bold transition-all"
                          >
                            <Shield size={12}/> Quyền <ChevronDown size={11}/>
                          </button>
                          {openDropdown === u.id && (
                            <div className="absolute right-0 top-full mt-1 z-30 bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl overflow-hidden w-36">
                              {["staff", "customer"].map(r => (
                                <button key={r}
                                  onClick={() => handleChangeRole(u.id, r)}
                                  className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-colors
                                    ${u.role === r ? "bg-[#2a2a2a] text-white" : "text-gray-400 hover:bg-[#2a2a2a] hover:text-white"}`}>
                                  <span className={`w-2 h-2 rounded-full ${r === "staff" ? "bg-blue-400" : "bg-gray-400"}`}/>
                                  {r === "staff" ? "Staff" : "Customer"}
                                  {u.role === r && <span className="ml-auto text-[#E50914]">✓</span>}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── Toggle Khóa / Mở khóa ── */}
                      {!isSelf(u.id) && u.role !== "admin" && (
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
                      )}

                      {/* Placeholder khi là admin hoặc bản thân */}
                      {(isSelf(u.id) || u.role === "admin") && (
                        <span className="text-[11px] text-gray-700 font-medium italic px-1">
                          Không thao tác
                        </span>
                      )}
                    </div>
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

      {/* Đóng dropdown khi click ra ngoài */}
      {openDropdown !== null && (
        <div className="fixed inset-0 z-20" onClick={() => setOpenDropdown(null)}/>
      )}
    </div>
  );
}
