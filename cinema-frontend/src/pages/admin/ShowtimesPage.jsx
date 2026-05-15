import { useState, useEffect } from "react";
import api from "../../utils/api";
import ShowtimeForm from "../../components/admin/ShowtimeForm";
import BulkGenerateModal from "../../components/admin/BulkGenerateModal";
import { Wand2 } from "lucide-react";

export default function ShowtimesPage() {
  const [showtimes, setShowtimes] = useState([]);
  const [movies, setMovies] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingShowtime, setEditingShowtime] = useState(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [filterMovie, setFilterMovie] = useState("");
  const [filterRoom, setFilterRoom] = useState("ALL");
  const [filterDate, setFilterDate] = useState("");
  const [viewingShowtime, setViewingShowtime] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [showtimesRes, moviesRes, roomsRes] = await Promise.all([
        api.get("/admin/showtimes"),
        api.get("/admin/movies"),
        api.get("/admin/rooms"),
      ]);
      setShowtimes(showtimesRes.data?.data ?? showtimesRes.data);
      setMovies(moviesRes.data?.data ?? moviesRes.data);
      setRooms(roomsRes.data?.data ?? roomsRes.data);
    } catch (error) {
      console.error("Error fetching showtimes initial data", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchShowtimes = async () => {
    try {
      const res = await api.get("/admin/showtimes");
      setShowtimes(res.data?.data ?? res.data);
    } catch (error) {
      console.error("Error fetching showtimes", error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa suất chiếu này?")) return;

    try {
      await api.delete(`/admin/showtimes/${id}`);
      fetchShowtimes();
    } catch (error) {
      console.error("Error deleting showtime", error);
      alert(
        "Có lỗi xảy ra khi xóa suất chiếu. Cần kiểm tra xem đã có người đặt vé chưa.",
      );
    }
  };

  const handleEdit = (showtime) => {
    setEditingShowtime(showtime);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingShowtime(null);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    fetchShowtimes();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  if (loading && showtimes.length === 0)
    return (
      <div className="p-8 text-[#E50914] font-bold animate-pulse">
        Đang tải dữ liệu...
      </div>
    );

  return (
    <div className="p-6 md:p-8 border-l border-[#333] bg-[#141414] min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-white uppercase tracking-wider border-l-4 border-[#E50914] pl-3">
          Quản lý Suất Chiếu
        </h1>
        {!showForm && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowBulkModal(true)}
              className="flex items-center gap-2 bg-purple-700 hover:bg-purple-600 text-white px-5 py-2.5 rounded-lg shadow-lg font-bold uppercase tracking-wider transition-all text-sm"
            >
              <Wand2 size={16}/> Tự động xếp lịch
            </button>
            <button
              onClick={handleAdd}
              className="bg-[#E50914] hover:bg-[#F40612] text-white px-5 py-2.5 rounded-lg shadow-lg font-bold uppercase tracking-wider transition-all"
            >
              + Thêm Suất Chiếu
            </button>
          </div>
        )}
      </div>

      {!showForm && (
        <div className="bg-[#1a1a1a] p-6 rounded-xl shadow-2xl border border-[#333] mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
              Tra cứu tên phim
            </label>
            <input
              type="text"
              placeholder="Nhập tên phim..."
              value={filterMovie}
              onChange={(e) => setFilterMovie(e.target.value)}
              className="block w-full bg-[#222] text-white border border-[#444] rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
              Phòng chiếu
            </label>
            <select
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              className="block w-full bg-[#222] text-white border border-[#444] rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] transition-colors"
            >
              <option value="ALL">Tất cả phòng</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
              Lọc theo ngày
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="block w-full bg-[#222] text-white border border-[#444] rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] transition-colors [color-scheme:dark]"
            />
          </div>
        </div>
      )}

      {showForm ? (
        <div className="bg-[#1a1a1a] rounded-xl shadow-2xl p-6 border border-[#333]">
          <h2 className="text-xl font-black text-white mb-6 border-b border-[#333] pb-4 uppercase tracking-wider">
            {editingShowtime ? "Cập nhật suất chiếu" : "Thêm suất chiếu mới"}
          </h2>
          <ShowtimeForm
            showtime={editingShowtime}
            movies={movies}
            rooms={rooms}
            onSuccess={handleFormSuccess}
            onCancel={() => setShowForm(false)}
          />
        </div>
      ) : (
        <div className="bg-[#1a1a1a] rounded-xl shadow-2xl overflow-hidden border border-[#333]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#333]">
              <thead className="bg-[#111]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Phim
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Phòng
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Thời gian
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Giá vé (Thường)
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Ghế đặt / Tổng
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-[#1a1a1a] divide-y divide-[#333]">
                {showtimes
                  .filter((s) => {
                    const matchMovie =
                      !filterMovie ||
                      (s.movie?.title || "")
                        .toLowerCase()
                        .includes(filterMovie.toLowerCase());
                    const matchRoom =
                      filterRoom === "ALL" ||
                      (s.roomId ?? s.room_id ?? '').toString() === filterRoom;
                    // Hỗ trợ cả camelCase (Node.js) và snake_case
                    const startTime = s.startTime ?? s.start_time ?? '';
                    const matchDate =
                      !filterDate || startTime.toString().startsWith(filterDate);
                    return matchMovie && matchRoom && matchDate;
                  })
                  .map((showtime) => (
                    <tr
                      key={showtime.id}
                      className="hover:bg-[#222] cursor-pointer transition-colors"
                      onClick={(e) => {
                        if (e.target.tagName !== "BUTTON")
                          setViewingShowtime(showtime);
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-white">
                          {showtime.movie?.title || `ID: ${showtime.movieId ?? showtime.movie_id}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-300">
                          {showtime.room?.name || `ID: ${showtime.roomId ?? showtime.room_id}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        <div className="font-bold text-white">
                          {new Date(
                            (showtime.startTime ?? showtime.start_time ?? '').toString().replace('Z', ''),
                          ).toLocaleString("vi-VN")}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Đến{" "}
                          {new Date(
                            (showtime.endTime ?? showtime.end_time ?? '').toString().replace('Z', ''),
                          ).toLocaleTimeString("vi-VN")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#E50914] font-black tracking-wide">
                        {formatCurrency(showtime.priceRegular ?? showtime.price_regular)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`text-sm font-bold ${
                          (showtime.bookedSeats ?? 0) >= (showtime.room?.totalSeats ?? 1)
                            ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {showtime.bookedSeats ?? 0}
                          <span className="text-gray-500 font-normal">/</span>
                          {showtime.room?.totalSeats ?? '?'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold">
                        <button
                          onClick={() => handleEdit(showtime)}
                          className="text-blue-500 hover:text-blue-400 mr-5 transition-colors"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(showtime.id)}
                          className="text-red-500 hover:text-red-400 transition-colors"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                {showtimes.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-12 text-center text-gray-500 font-medium bg-[#111]"
                    >
                      Chưa có suất chiếu nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Showtime Details Modal */}
      {viewingShowtime && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl max-w-lg w-full border border-[#333] shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-[#333]">
              <h3 className="text-xl font-black text-white uppercase tracking-wider">
                Chi tiết Suất chiếu
              </h3>
              <button
                onClick={() => setViewingShowtime(null)}
                className="text-gray-500 hover:text-white font-bold text-2xl transition-colors"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="flex justify-between border-b border-[#333] pb-2">
                <span className="font-bold text-gray-400 uppercase text-xs tracking-wider mt-1">
                  Phim:
                </span>{" "}
                <span className="text-white font-bold">
                  {viewingShowtime.movie?.title}
                </span>
              </p>
              <p className="flex justify-between border-b border-[#333] pb-2">
                <span className="font-bold text-gray-400 uppercase text-xs tracking-wider mt-1">
                  Thời lượng:
                </span>{" "}
                <span className="text-white font-medium">
                  {viewingShowtime.movie?.duration} phút
                </span>
              </p>
              <p className="flex justify-between border-b border-[#333] pb-2">
                <span className="font-bold text-gray-400 uppercase text-xs tracking-wider mt-1">
                  Phòng chiếu:
                </span>{" "}
                <span className="text-white font-medium">
                  {viewingShowtime.room?.name}{" "}
                  <span className="text-gray-500">
                    ({viewingShowtime.room?.type})
                  </span>
                </span>
              </p>
              <p className="flex justify-between border-b border-[#333] pb-2">
                <span className="font-bold text-gray-400 uppercase text-xs tracking-wider mt-1">
                  Bắt đầu:
                </span>{" "}
                <span className="text-green-400 font-bold">
                  {new Date((viewingShowtime.startTime ?? viewingShowtime.start_time ?? '').toString().replace('Z', '')).toLocaleString("vi-VN")}
                </span>
              </p>
              <p className="flex justify-between border-b border-[#333] pb-2">
                <span className="font-bold text-gray-400 uppercase text-xs tracking-wider mt-1">
                  Kết thúc:
                </span>{" "}
                <span className="text-red-400 font-bold">
                  {new Date((viewingShowtime.endTime ?? viewingShowtime.end_time ?? '').toString().replace('Z', '')).toLocaleString("vi-VN")}
                </span>
              </p>

              <h4 className="font-black text-white uppercase tracking-wider mt-6 mb-3">
                Bảng giá vé (tham khảo):
              </h4>
              <div className="grid grid-cols-3 gap-3 text-center bg-[#111] p-4 rounded-xl border border-[#333]">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Ghế Thường</p>
                  <p className="font-black text-blue-400 mt-2">
                    {formatCurrency(viewingShowtime.priceRegular ?? viewingShowtime.price_regular)}
                  </p>
                </div>
                <div className="border-l border-r border-[#333]">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Ghế VIP</p>
                  <p className="font-black text-yellow-500 mt-2">
                    {formatCurrency(viewingShowtime.priceVip ?? viewingShowtime.price_vip)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Ghế Đôi</p>
                  <p className="font-black text-pink-400 mt-2">
                    {formatCurrency(viewingShowtime.priceCouple ?? viewingShowtime.price_couple)}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-[#333] flex justify-end bg-[#111] rounded-b-2xl">
              <button
                onClick={() => setViewingShowtime(null)}
                className="bg-[#333] hover:bg-[#444] text-white px-6 py-2 rounded-lg font-bold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tự động xếp lịch */}
      {showBulkModal && (
        <BulkGenerateModal
          movies={movies}
          rooms={rooms}
          onClose={() => setShowBulkModal(false)}
          onSuccess={() => { setShowBulkModal(false); fetchShowtimes(); }}
        />
      )}
    </div>
  );
}
