import { useState, useEffect } from "react";
import api from "../../utils/api";

export default function ShowtimeForm({
  showtime,
  movies,
  rooms,
  branches = [],
  onSuccess,
  onCancel,
}) {
  const isEditing = !!showtime;

  const formatDateTimeForInput = (dateString) => {
    if (!dateString) return "";
    // Cắt bỏ phần milliseconds và chữ Z (nếu có), đổi khoảng trắng thành chữ 'T'
    // VD: "2026-03-22 10:00:00" -> "2026-03-22T10:00"
    return dateString
      .split(".")[0]
      .replace("Z", "")
      .replace(" ", "T")
      .slice(0, 16);
  };

  const [formData, setFormData] = useState({
    movie_id: "",
    room_id: "",
    start_time: "",
    format: "Phụ đề", // Thêm format ở đây
    price_regular: "",
    price_vip: "",
    price_couple: "",
  });
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredRooms = rooms.filter((r) => {
    if (!selectedBranchId) return true;
    return String(r.branchId ?? r.branch_id ?? "") === String(selectedBranchId);
  });

  useEffect(() => {
    if (showtime) {
      const currentRoomId = showtime.roomId ?? showtime.room_id ?? "";
      const currentRoom = rooms.find((r) => String(r.id) === String(currentRoomId));
      if (currentRoom) {
        setSelectedBranchId(currentRoom.branchId ?? currentRoom.branch_id ?? "");
      }
      setFormData({
        // Hỗ trợ cả camelCase (Node.js) và snake_case khi cần populate form
        movie_id:     showtime.movieId     ?? showtime.movie_id    ?? '',
        room_id:      currentRoomId,
        start_time:   formatDateTimeForInput(showtime.startTime ?? showtime.start_time) || '',
        format:       showtime.format      || 'Phụ đề',
        price_regular: showtime.priceRegular ?? showtime.price_regular ?? '',
        price_vip:     showtime.priceVip     ?? showtime.price_vip     ?? '',
        price_couple:  showtime.priceCouple  ?? showtime.price_couple  ?? '',
      });
    } else {
      // Set defaults if creating new
      if (branches.length > 0) {
        const defaultBranchId = branches[0].id;
        setSelectedBranchId(defaultBranchId);
        
        const branchRooms = rooms.filter(
          (r) => String(r.branchId ?? r.branch_id ?? "") === String(defaultBranchId)
        );
        
        setFormData((prev) => ({
          ...prev,
          movie_id: movies.length > 0 ? movies[0].id : "",
          room_id: branchRooms.length > 0 ? branchRooms[0].id : "",
          price_regular: 60000,
          price_vip: 80000,
          price_couple: 150000,
        }));
      } else if (rooms.length > 0) {
        setFormData((prev) => ({
          ...prev,
          movie_id: movies.length > 0 ? movies[0].id : "",
          room_id: rooms[0].id,
          price_regular: 60000,
          price_vip: 80000,
          price_couple: 150000,
        }));
      }
    }
  }, [showtime, movies, rooms, branches]);

  const handleBranchChange = (e) => {
    const branchId = e.target.value;
    setSelectedBranchId(branchId);
    
    const branchRooms = rooms.filter(
      (r) => String(r.branchId ?? r.branch_id ?? "") === String(branchId)
    );
    setFormData((prev) => ({
      ...prev,
      room_id: branchRooms.length > 0 ? branchRooms[0].id : "",
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!formData.start_time) {
        setError("Vui lòng chọn thời gian bắt đầu.");
        setLoading(false);
        return;
      }
      // Đảm bảo định dạng YYYY-MM-DD HH:mm:ss cho MySQL
      const rawTime = formData.start_time.replace("T", " ");
      const formattedData = {
        ...formData,
        start_time: rawTime.length === 16 ? rawTime + ":00" : rawTime,
      };

      if (isEditing) {
        await api.put(`/admin/showtimes/${showtime.id}`, formattedData);
      } else {
        await api.post("/admin/showtimes", formattedData);
      }
      onSuccess();
    } catch (err) {
      console.error("Error saving showtime:", err);
      setError(
        err.response?.data?.message ||
          "Có lỗi xảy ra khi lưu. Có thể suất chiếu bị trùng lặp thời gian.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (movies.length === 0 || rooms.length === 0) {
    return (
      <div className="p-4 bg-yellow-900/20 text-yellow-400 border border-yellow-900/50 rounded-lg font-medium">
        Vui lòng tạo ít nhất 1 Phim và 1 Phòng chiếu trước khi thêm Suất chiếu.
      </div>
    );
  }

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
            Chọn Phim *
          </label>
          <select
            name="movie_id"
            required
            value={formData.movie_id}
            onChange={handleChange}
            className="mt-1 block w-full bg-[#222] text-white border border-[#444] rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] transition-colors"
          >
            <option value="" disabled>
              -- Chọn phim --
            </option>
            {movies.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
            Chọn Chi nhánh *
          </label>
          <select
            name="branch_id"
            required
            value={selectedBranchId}
            onChange={handleBranchChange}
            className="mt-1 block w-full bg-[#222] text-white border border-[#444] rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] transition-colors"
          >
            <option value="" disabled>
              -- Chọn chi nhánh --
            </option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
            Chọn Phòng *
          </label>
          <select
            name="room_id"
            required
            value={formData.room_id}
            onChange={handleChange}
            className="mt-1 block w-full bg-[#222] text-white border border-[#444] rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] transition-colors"
          >
            <option value="" disabled>
              -- Chọn phòng --
            </option>
            {filteredRooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} (Sức chứa: {r.totalSeats ?? r.total_seats} ghế)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
            Định dạng (Ngôn ngữ) *
          </label>
          <select
            name="format"
            required
            value={formData.format}
            onChange={handleChange}
            className="mt-1 block w-full bg-[#222] text-white border border-[#444] rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] transition-colors"
          >
            <option value="Phụ đề">Phụ đề</option>
            <option value="Lồng tiếng">Lồng tiếng</option>
            <option value="Thuyết minh">Thuyết minh</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
            Thời gian Bắt đầu *
          </label>
          <input
            type="datetime-local"
            name="start_time"
            required
            value={formData.start_time}
            onChange={handleChange}
            className="mt-1 block w-full bg-[#222] text-white border border-[#444] rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] transition-colors [color-scheme:dark]"
          />
          <p className="mt-2 text-xs font-medium text-gray-500 italic bg-[#111] p-2 rounded border border-[#333]">
            Giờ làm sạch phòng (+15p) và Giờ kết thúc sẽ được hệ thống tự tính
            dựa vào thời lượng phim.
          </p>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
            Giá vé Thường (VNĐ) *
          </label>
          <input
            type="number"
            name="price_regular"
            required
            min="0"
            step="1000"
            value={formData.price_regular}
            onChange={handleChange}
            className="mt-1 block w-full bg-[#222] text-white border border-[#444] rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
            Giá ghế VIP (VNĐ) *
          </label>
          <input
            type="number"
            name="price_vip"
            required
            min="0"
            step="1000"
            value={formData.price_vip}
            onChange={handleChange}
            className="mt-1 block w-full bg-[#222] text-white border border-[#444] rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
            Giá ghế Đôi (Couple) (VNĐ) *
          </label>
          <input
            type="number"
            name="price_couple"
            required
            min="0"
            step="1000"
            value={formData.price_couple}
            onChange={handleChange}
            className="mt-1 block w-full bg-[#222] text-white border border-[#444] rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] transition-colors"
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
