import { useState, useEffect } from "react";
import api from "../../utils/api";

export default function RoomForm({ room, onSuccess, onCancel }) {
  const isEditing = !!room;

  const [formData, setFormData] = useState({
    name: "",
    type: "2D",
  });
  const [matrix, setMatrix] = useState({ rows: 10, cols: 10 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (room) {
      setFormData({
        name: room.name || "",
        type: room.type || "2D",
      });
    }
  }, [room]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isEditing) {
        await api.put(`/admin/rooms/${room.id}`, formData);
        if (
          matrix.rows > 0 &&
          matrix.cols > 0 &&
          window.confirm(
            "Bạn có muốn tạo lại ma trận ghế (Các ghế cũ sẽ bị xóa)?",
          )
        ) {
          await api.post("/admin/seats/generate", {
            room_id: room.id,
            rows: matrix.rows,
            columns: matrix.cols,
          });
        }
      } else {
        const res = await api.post("/admin/rooms", formData);
        if (matrix.rows > 0 && matrix.cols > 0) {
          await api.post("/admin/seats/generate", {
            room_id: res.data.id,
            rows: matrix.rows,
            columns: matrix.cols,
          });
        }
      }
      onSuccess();
    } catch (err) {
      console.error("Error saving room:", err);
      setError(
        err.response?.data?.message || "Có lỗi xảy ra khi lưu phòng chiếu.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-900/20 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-sm font-medium text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
            Tên Phòng *
          </label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full bg-[#222] text-white border border-[#444] rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] transition-colors"
            placeholder="VD: Phòng 1"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
            Loại Màn Hình *
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="mt-1 block w-full bg-[#222] text-white border border-[#444] rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] transition-colors"
          >
            <option value="2D">2D</option>
            <option value="3D">3D</option>
            <option value="IMAX">IMAX</option>
            <option value="4DX">4DX</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
            Ma Trận Ghế (Số Hàng) {isEditing && "*"}
          </label>
          <input
            type="number"
            min="1"
            max="26"
            value={matrix.rows}
            onChange={(e) =>
              setMatrix({ ...matrix, rows: Number(e.target.value) })
            }
            className="mt-1 block w-full bg-[#222] text-white border border-[#444] rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] transition-colors"
            placeholder="Giới hạn A-Z (1-26)"
          />
          {isEditing && (
            <p className="text-xs text-red-400 mt-2 font-medium bg-red-900/20 px-2 py-1 rounded inline-block border border-red-900/50">
              Chỉ điền nếu muốn tạo lại toàn bộ ghế từ đầu
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
            Ma Trận Ghế (Số Cột)
          </label>
          <input
            type="number"
            min="1"
            value={matrix.cols}
            onChange={(e) =>
              setMatrix({ ...matrix, cols: Number(e.target.value) })
            }
            className="mt-1 block w-full bg-[#222] text-white border border-[#444] rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] transition-colors"
            placeholder="VD: 10, 15, 20"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-6 border-t border-[#333]">
        <button
          type="button"
          onClick={onCancel}
          className="bg-[#333] py-2.5 px-6 border border-[#444] rounded-lg shadow-sm text-sm font-bold text-white hover:bg-[#444] focus:outline-none transition-colors"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center flex-shrink-0 bg-[#E50914] py-2.5 px-6 border border-transparent rounded-lg shadow-lg text-sm font-bold text-white hover:bg-[#F40612] focus:outline-none transition-colors uppercase tracking-wider disabled:opacity-50"
        >
          {loading ? "Đang lưu..." : isEditing ? "Cập nhật" : "Thêm mới"}
        </button>
      </div>
    </form>
  );
}
