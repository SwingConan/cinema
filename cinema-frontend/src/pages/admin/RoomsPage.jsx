import { useState, useEffect } from "react";
import api from "../../utils/api";
import RoomForm from "../../components/admin/RoomForm";
import SeatMap from "../../components/customer/SeatMap";
import { X } from "lucide-react";

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");

  const [viewingRoom, setViewingRoom] = useState(null);
  const [roomSeats, setRoomSeats] = useState([]);
  const [seatLoading, setSeatLoading] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/rooms");
      setRooms(res.data?.data ?? res.data);
    } catch (error) {
      console.error("Error fetching rooms", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomSeats = async (roomId) => {
    try {
      setSeatLoading(true);
      const res = await api.get(`/admin/seats?room_id=${roomId}`);
      setRoomSeats(res.data?.data ?? res.data);
    } catch (error) {
      console.error("Error fetching seats", error);
    } finally {
      setSeatLoading(false);
    }
  };

  const handleViewSeats = (room) => {
    setViewingRoom(room);
    fetchRoomSeats(room.id);
  };

  const handleToggleMaintenance = async (seat) => {
    try {
      await api.patch(`/admin/seats/${seat.id}/maintenance`);
      // Update local state to avoid refetching
      setRoomSeats(prev => prev.map(s => s.id === seat.id ? { ...s, status: s.status === 'available' ? 'maintenance' : 'available' } : s));
    } catch (error) {
      console.error("Error toggling maintenance", error);
      alert("Lỗi khi thay đổi trạng thái ghế.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa phòng này?")) return;

    try {
      await api.delete(`/admin/rooms/${id}`);
      fetchRooms();
    } catch (error) {
      console.error("Error deleting room", error);
      alert("Có lỗi xảy ra khi xóa phòng. Có thể phòng đang được sử dụng.");
    }
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingRoom(null);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    fetchRooms();
  };

  if (loading && rooms.length === 0)
    return (
      <div className="p-8 text-[#E50914] font-bold animate-pulse">
        Đang tải dữ liệu...
      </div>
    );

  return (
    <div className="p-6 md:p-8 border-l border-[#333] bg-[#141414] min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-white uppercase tracking-wider border-l-4 border-[#E50914] pl-3">
          Quản lý Phòng Chiếu
        </h1>
        {!showForm && (
          <button
            onClick={handleAdd}
            className="bg-[#E50914] hover:bg-[#F40612] text-white px-5 py-2.5 rounded-lg shadow-lg font-bold uppercase tracking-wider transition-all"
          >
            + Thêm Phòng Mới
          </button>
        )}
      </div>

      {!showForm && (
        <div className="bg-[#1a1a1a] p-6 rounded-xl shadow-2xl border border-[#333] mb-8 flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
              Tìm kiếm phòng
            </label>
            <input
              type="text"
              placeholder="Nhập tên phòng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full bg-[#222] text-white border border-[#444] rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] transition-colors"
            />
          </div>
          <div className="w-full md:w-1/3">
            <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
              Loại phòng
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="block w-full bg-[#222] text-white border border-[#444] rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] transition-colors"
            >
              <option value="ALL">Tất cả</option>
              <option value="2D">2D</option>
              <option value="3D">3D</option>
              <option value="IMAX">IMAX</option>
              <option value="4DX">4DX</option>
            </select>
          </div>
        </div>
      )}

      {showForm ? (
        <div className="bg-[#1a1a1a] rounded-xl shadow-2xl p-6 border border-[#333]">
          <h2 className="text-xl font-black text-white mb-6 border-b border-[#333] pb-4 uppercase tracking-wider">
            {editingRoom ? "Cập nhật phòng" : "Thêm phòng mới"}
          </h2>
          <RoomForm
            room={editingRoom}
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
                    Tên Phòng
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Loại Màn Hình
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Sức Chứa (Ghế)
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-[#1a1a1a] divide-y divide-[#333]">
                {rooms
                  .filter((room) => {
                    const matchSearch = room.name
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase());
                    const matchType =
                      filterType === "ALL" || room.type === filterType;
                    return matchSearch && matchType;
                  })
                  .map((room) => (
                    <tr
                      key={room.id}
                      className="hover:bg-[#222] transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-white">
                          {room.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border
                                                ${
                                                  room.type === "IMAX"
                                                    ? "bg-yellow-900/30 text-yellow-400 border-yellow-900/50"
                                                    : room.type === "4DX"
                                                      ? "bg-red-900/30 text-red-400 border-red-900/50"
                                                      : room.type === "3D"
                                                        ? "bg-purple-900/30 text-purple-400 border-purple-900/50"
                                                        : "bg-blue-900/30 text-blue-400 border-blue-900/50"
                                                }`}
                        >
                          {room.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-medium">
                        {room.totalSeats ?? room.total_seats}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold">
                        <button
                          onClick={() => handleViewSeats(room)}
                          className="text-emerald-500 hover:text-emerald-400 mr-5 transition-colors"
                        >
                          Sơ đồ ghế
                        </button>
                        <button
                          onClick={() => handleEdit(room)}
                          className="text-blue-500 hover:text-blue-400 mr-5 transition-colors"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(room.id)}
                          className="text-red-500 hover:text-red-400 transition-colors"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                {rooms.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-12 text-center text-gray-500 font-medium bg-[#111]"
                    >
                      Chưa có dữ liệu phòng chiếu. Hãy thêm phòng mới.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Sơ đồ ghế (Admin) */}
      {viewingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-[#333] bg-[#111]">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-wider">
                  Sơ đồ ghế: <span className="text-[#E50914]">{viewingRoom.name}</span>
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Click đúp (Double-click) vào ghế để bật/tắt trạng thái <span className="text-red-400 font-bold">BẢO TRÌ</span>.
                </p>
              </div>
              <button
                onClick={() => setViewingRoom(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-[#141414]">
              {seatLoading ? (
                <div className="flex items-center justify-center h-64 text-gray-500 font-bold animate-pulse">
                  Đang tải sơ đồ ghế...
                </div>
              ) : (
                <SeatMap
                  seats={roomSeats}
                  bookedIds={[]}
                  lockedIds={[]}
                  selectedSeats={[]}
                  onSeatSelect={() => {}} // No action on single click for admin
                  onSeatDoubleClick={handleToggleMaintenance}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
