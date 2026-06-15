import { useState, useEffect, useCallback } from "react";
import api from "../../utils/api";
import {
  Plus, Search, Pencil, Trash2, X, Loader2,
  Coffee, CheckCircle2, XCircle, ImageOff, ShoppingBag,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────
const fmtVND = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  image: "",
  isActive: true,
};

// ── Sub-components ─────────────────────────────────────────────────────────

function StatusBadge({ active }) {
  return active ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      <CheckCircle2 size={11} /> Hoạt động
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-500/10 text-gray-500 border border-gray-600/20">
      <XCircle size={11} /> Ẩn
    </span>
  );
}

function ConfirmDialog({ item, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1e1e1e] border border-[#333] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-900/30 flex items-center justify-center shrink-0">
            <Trash2 size={18} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-white font-black">Xác nhận xóa</h3>
            <p className="text-gray-500 text-sm">Thao tác này không thể hoàn tác</p>
          </div>
        </div>
        <p className="text-gray-300 text-sm mb-6">
          Bạn có chắc muốn xóa món{" "}
          <span className="font-black text-white">"{item?.name}"</span> không?
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-[#333] text-gray-400 hover:text-white hover:border-[#444] font-bold text-sm transition-colors">
            Hủy
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

function ConcessionModal({ item, onClose, onSaved }) {
  const isEdit = Boolean(item?.id);
  const [form, setForm] = useState(isEdit ? {
    name:        item.name        ?? "",
    description: item.description ?? "",
    price:       item.price       ?? "",
    image:       (item.image && item.image !== "[object Object]") ? item.image : "",
    isActive:    item.isActive    ?? true,
  } : { ...EMPTY_FORM });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(form.image ? (form.image.startsWith('http') ? form.image : `${import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000'}/uploads/${form.image}`) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Tên món không được để trống."); return; }
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0) {
      setError("Giá tiền không hợp lệ."); return;
    }
    setSaving(true); setError("");
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("price", Number(form.price));
      formData.append("isActive", form.isActive);
      if (imageFile) {
        formData.append("image", imageFile);
      } else {
        formData.append("image", form.image || "");
      }

      if (isEdit) {
        await api.put(`/admin/concessions/${item.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } else {
        await api.post("/admin/concessions", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra. Thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#E50914]/10 flex items-center justify-center">
              <Coffee size={18} className="text-[#E50914]" />
            </div>
            <h2 className="text-white font-black text-lg">
              {isEdit ? "Chỉnh sửa món" : "Thêm món mới"}
            </h2>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-[#2a2a2a] flex items-center justify-center text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-900/20 border border-red-700/40 text-red-400 px-4 py-2.5 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Preview image */}
          {previewUrl && (
            <div className="flex justify-center">
              <img src={previewUrl} alt="preview"
                onError={e => { e.target.style.display = "none"; }}
                className="h-28 w-28 object-cover rounded-2xl border border-[#333]" />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tên món */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Tên món <span className="text-[#E50914]">*</span>
              </label>
              <input
                type="text" value={form.name} maxLength={120}
                onChange={e => set("name", e.target.value)}
                placeholder="VD: Bắp rang bơ vừa"
                className="w-full bg-[#111] border border-[#333] focus:border-[#E50914] text-white rounded-xl px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-gray-700"
              />
            </div>

            {/* Giá */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Giá (VNĐ) <span className="text-[#E50914]">*</span>
              </label>
              <input
                type="number" value={form.price} min={0} step={1000}
                onChange={e => set("price", e.target.value)}
                placeholder="55000"
                className="w-full bg-[#111] border border-[#333] focus:border-[#E50914] text-white rounded-xl px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-gray-700"
              />
              {form.price && !isNaN(Number(form.price)) && (
                <p className="text-xs text-gray-600 mt-1">{fmtVND(form.price)}</p>
              )}
            </div>

            {/* Trạng thái */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Trạng thái
              </label>
              <div className="flex items-center gap-3 h-[42px]">
                <button type="button"
                  onClick={() => set("isActive", !form.isActive)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${form.isActive ? "bg-emerald-500" : "bg-gray-700"}`}>
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.isActive ? "left-7" : "left-1"}`} />
                </button>
                <span className={`text-sm font-bold ${form.isActive ? "text-emerald-400" : "text-gray-500"}`}>
                  {form.isActive ? "Hiển thị" : "Ẩn"}
                </span>
              </div>
            </div>

            {/* Tải ảnh lên */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Hình ảnh món ăn / thức uống
              </label>
              <div className="relative group/upload border-2 border-dashed border-[#333] hover:border-[#E50914]/50 rounded-xl p-4 transition-colors flex flex-col items-center justify-center bg-[#111] cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <Plus size={20} className="text-gray-500 group-hover/upload:text-[#E50914] transition-colors mb-1" />
                <span className="text-xs text-gray-400 font-bold group-hover/upload:text-white transition-colors">
                  {imageFile ? imageFile.name : (form.image ? "Thay đổi ảnh..." : "Chọn ảnh từ máy tính...")}
                </span>
                <span className="text-[10px] text-gray-600 mt-1">Định dạng JPG, PNG, WEBP tối đa 5MB</span>
              </div>
            </div>

            {/* Mô tả */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Mô tả
              </label>
              <textarea
                value={form.description} rows={3} maxLength={300}
                onChange={e => set("description", e.target.value)}
                placeholder="Mô tả ngắn về món ăn/thức uống..."
                className="w-full bg-[#111] border border-[#333] focus:border-[#E50914] text-white rounded-xl px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-gray-700 resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#333] text-gray-400 hover:text-white hover:border-[#444] font-bold text-sm transition-colors">
              Hủy
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#c40812] disabled:opacity-50 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              {isEdit ? "Lưu thay đổi" : "Thêm món"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function ManageConcessions() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [modal, setModal]       = useState(null);   // null | "add" | item{}
  const [delTarget, setDelTarget] = useState(null); // item{} to delete
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [savingInventoryId, setSavingInventoryId] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [error, setError]       = useState("");

  const fetchBranches = useCallback(async () => {
    try {
      const res = await api.get("/admin/branches");
      const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      setBranches(list);
      setSelectedBranchId((current) => current || (list[0]?.id ? String(list[0].id) : ""));
    } catch {
      setError("Không thể tải danh sách chi nhánh.");
    }
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/concessions", {
        params: selectedBranchId ? { branch_id: selectedBranchId } : {},
      });
      setItems(res.data);
    } catch {
      setError("Không thể tải danh sách. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId]);

  useEffect(() => { fetchBranches(); }, [fetchBranches]);
  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/admin/concessions/${delTarget.id}`);
      setDelTarget(null);
      fetchItems();
    } catch (err) {
      setError(err.response?.data?.message || "Xóa thất bại.");
      setDelTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (item) => {
    setTogglingId(item.id);
    try {
      await api.put(`/admin/concessions/${item.id}`, {
        name:        item.name,
        description: item.description,
        price:       item.price,
        image:       item.image,
        isActive:    !item.isActive,   // ← đúng field camelCase
      });
      fetchItems();
    } catch {
      setError("Cập nhật trạng thái thất bại.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleInventoryChange = (id, patch) => {
    setItems((current) => current.map((item) => (
      item.id === id ? { ...item, ...patch } : item
    )));
  };

  const handleSaveInventory = async (item) => {
    if (!selectedBranchId) return;
    setSavingInventoryId(item.id);
    try {
      const res = await api.put(`/admin/concessions/${item.id}/branches/${selectedBranchId}/inventory`, {
        stockQuantity: Number(item.stockQuantity || 0),
        status: item.inventoryStatus || "available",
      });
      setItems((current) => current.map((row) => row.id === item.id ? { ...row, ...res.data } : row));
    } catch (err) {
      setError(err.response?.data?.message || "Cập nhật tồn kho thất bại.");
    } finally {
      setSavingInventoryId(null);
    }
  };

  const filtered = items.filter(it =>
    it.name?.toLowerCase().includes(search.toLowerCase()) ||
    it.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2a2a2a] pb-5">
        <div>
          <h1 className="text-3xl font-black text-white border-l-4 border-[#E50914] pl-3 uppercase tracking-wider flex items-center gap-2">
            <ShoppingBag className="text-[#E50914]" size={26} />
            Quản lý F&amp;B
          </h1>
          <p className="text-gray-500 text-sm pl-4 mt-0.5">
            {items.length} món · {items.filter(i => i.isActive).length} đang hiển thị
          </p>
        </div>
        <button onClick={() => setModal("add")}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#E50914] hover:bg-[#c40812] text-white font-bold rounded-xl shadow-lg shadow-red-900/20 transition-colors">
          <Plus size={18} /> Thêm món mới
        </button>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-700/40 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError("")}><X size={14} /></button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 max-w-sm">
        <Search size={16} className="text-gray-600 shrink-0" />
        <input
          type="text" value={search} placeholder="Tìm kiếm món ăn/thức uống..."
          onChange={e => setSearch(e.target.value)}
          className="bg-transparent text-sm text-white placeholder:text-gray-700 outline-none flex-1"
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-gray-600 hover:text-white transition-colors">
            <X size={14} />
          </button>
        )}
      </div>

      <div className="max-w-sm">
        <select
          value={selectedBranchId}
          onChange={(e) => setSelectedBranchId(e.target.value)}
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#E50914]"
        >
          <option value="">Tất cả chi nhánh</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>{branch.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#E50914] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Coffee size={40} className="text-gray-700 mb-3" />
            <p className="text-gray-500 font-bold">
              {search ? "Không tìm thấy món nào khớp." : "Chưa có món nào. Thêm ngay!"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a2a] text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-5 py-4 font-bold text-left">Hình / Tên món</th>
                  <th className="px-5 py-4 font-bold text-left hidden md:table-cell">Mô tả</th>
                  <th className="px-5 py-4 font-bold text-right">Giá</th>
                  <th className="px-5 py-4 font-bold text-center">Tồn kho</th>
                  <th className="px-5 py-4 font-bold text-center">Kho chi nhánh</th>
                  <th className="px-5 py-4 font-bold text-center">Trạng thái</th>
                  <th className="px-5 py-4 font-bold text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f1f1f]">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-[#111] transition-colors group">
                    {/* Hình + Tên */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#222] border border-[#2a2a2a] shrink-0 flex items-center justify-center">
                          {item.image ? (
                            <img src={item.image.startsWith('http') ? item.image : `${import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000'}/uploads/${item.image}`} alt={item.name}
                              onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                              className="w-full h-full object-cover" />
                          ) : null}
                          <ImageOff size={18} className="text-gray-700" style={{ display: item.image ? "none" : "block" }} />
                        </div>
                        <div>
                          <p className="text-white font-bold leading-tight">{item.name}</p>
                          <p className="text-gray-600 text-xs mt-0.5">#{item.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Mô tả */}
                    <td className="px-5 py-4 hidden md:table-cell">
                      <p className="text-gray-500 text-sm max-w-[220px] truncate">
                        {item.description || <span className="italic text-gray-700">Không có mô tả</span>}
                      </p>
                    </td>

                    {/* Giá */}
                    <td className="px-5 py-4 text-right">
                      <span className="text-yellow-400 font-black">{fmtVND(item.price)}</span>
                    </td>

                    {/* Trạng thái — click để toggle */}
                    <td className="px-5 py-4 text-center">
                      {selectedBranchId ? (
                        <input
                          type="number"
                          min={0}
                          value={item.stockQuantity ?? 0}
                          onChange={(e) => handleInventoryChange(item.id, { stockQuantity: Number(e.target.value) })}
                          className="w-24 rounded-lg border border-[#333] bg-[#111] px-3 py-2 text-center text-white outline-none focus:border-[#E50914]"
                        />
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-center">
                      {selectedBranchId ? (
                        <div className="flex items-center justify-center gap-2">
                          <select
                            value={item.inventoryStatus || "available"}
                            onChange={(e) => handleInventoryChange(item.id, { inventoryStatus: e.target.value })}
                            className="rounded-lg border border-[#333] bg-[#111] px-3 py-2 text-white outline-none focus:border-[#E50914]"
                          >
                            <option value="available">Sẵn sàng</option>
                            <option value="unavailable">Ngừng phục vụ</option>
                          </select>
                          <button
                            onClick={() => handleSaveInventory(item)}
                            disabled={savingInventoryId === item.id}
                            className="rounded-lg bg-[#333] px-3 py-2 text-xs font-bold text-gray-200 hover:bg-[#444] disabled:opacity-50"
                          >
                            {savingInventoryId === item.id ? <Loader2 size={14} className="animate-spin" /> : "Lưu"}
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-600">Chọn chi nhánh</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <button onClick={() => handleToggleActive(item)}
                        disabled={togglingId === item.id}
                        title="Click để thay đổi trạng thái"
                        className="transition-transform hover:scale-105 active:scale-95 disabled:opacity-50">
                        {togglingId === item.id
                          ? <Loader2 size={16} className="animate-spin text-gray-400 mx-auto" />
                          : <StatusBadge active={item.isActive} />}
                      </button>
                    </td>

                    {/* Thao tác */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setModal(item)}
                          title="Chỉnh sửa"
                          className="w-8 h-8 rounded-lg bg-blue-900/20 hover:bg-blue-900/40 text-blue-400 flex items-center justify-center transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDelTarget(item)}
                          title="Xóa"
                          className="w-8 h-8 rounded-lg bg-red-900/20 hover:bg-red-900/40 text-red-400 flex items-center justify-center transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer count */}
      {!loading && filtered.length > 0 && (
        <p className="text-gray-600 text-xs text-right">
          Hiển thị {filtered.length} / {items.length} món
        </p>
      )}

      {/* Modals */}
      {modal && (
        <ConcessionModal
          item={modal === "add" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchItems(); }}
        />
      )}
      {delTarget && (
        <ConfirmDialog
          item={delTarget}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </div>
  );
}
