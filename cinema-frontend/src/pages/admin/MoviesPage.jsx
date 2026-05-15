import { useState, useEffect } from "react";
import api from "../../utils/api";
import MovieForm from "../../components/admin/MovieForm";

export default function MoviesPage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterDuration, setFilterDuration] = useState("ALL");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [viewingMovie, setViewingMovie] = useState(null);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/movies");
      setMovies(res.data?.data ?? res.data);
    } catch (error) {
      console.error("Error fetching movies", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa phim này?")) return;

    try {
      await api.delete(`/admin/movies/${id}`);
      fetchMovies(); // Reload list
    } catch (error) {
      console.error("Error deleting movie", error);
      alert("Có lỗi xảy ra khi xóa phim.");
    }
  };

  const handleEdit = (movie) => {
    setEditingMovie(movie);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingMovie(null);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    fetchMovies();
  };

  if (loading && movies.length === 0)
    return (
      <div className="p-8 text-[#E50914] font-bold animate-pulse">
        Đang tải dữ liệu...
      </div>
    );

  return (
    <div className="p-6 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-white uppercase tracking-wider border-l-4 border-[#E50914] pl-3">
          Quản lý Phim
        </h1>
        {!showForm && (
          <button
            onClick={handleAdd}
            className="bg-[#E50914] hover:bg-[#F40612] text-white px-5 py-2.5 rounded-lg shadow-lg font-bold uppercase tracking-wider transition-all"
          >
            + Thêm Phim Mới
          </button>
        )}
      </div>

      {!showForm && (
        <div className="bg-[#1a1a1a] p-6 rounded-xl shadow-2xl border border-[#333] mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-1">
            <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
              Tìm kiếm phim
            </label>
            <input
              type="text"
              placeholder="Nhập tên phim..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full bg-[#222] text-white border border-[#444] rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
              Trạng thái
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block w-full bg-[#222] text-white border border-[#444] rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] transition-colors"
            >
              <option value="ALL">Tất cả</option>
              <option value="now_showing">Đang chiếu</option>
              <option value="coming_soon">Sắp chiếu</option>
              <option value="stopped">Ngưng chiếu</option> {/* THÊM DÒNG NÀY */}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
              Thời lượng
            </label>
            <select
              value={filterDuration}
              onChange={(e) => setFilterDuration(e.target.value)}
              className="block w-full bg-[#222] text-white border border-[#444] rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] transition-colors"
            >
              <option value="ALL">Tất cả</option>
              <option value="SHORT">Dưới 90 phút</option>
              <option value="MEDIUM">90 - 120 phút</option>
              <option value="LONG">Trên 120 phút</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
              Chiếu từ ngày
            </label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="block w-full bg-[#222] text-white border border-[#444] rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] transition-colors [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
              Đến ngày
            </label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="block w-full bg-[#222] text-white border border-[#444] rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] transition-colors [color-scheme:dark]"
            />
          </div>
        </div>
      )}

      {showForm ? (
        <div className="bg-[#1a1a1a] rounded-xl shadow-2xl p-6 border border-[#333]">
          <h2 className="text-xl font-black text-white mb-6 border-b border-[#333] pb-4 uppercase tracking-wider">
            {editingMovie ? "Cập nhật phim" : "Thêm phim mới"}
          </h2>
          <MovieForm
            movie={editingMovie}
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
                    Tên phim
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Thời lượng
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Ngày chiếu
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-[#1a1a1a] divide-y divide-[#333]">
                {movies
                  .filter((m) => {
                    const matchSearch = m.title
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase());
                    const matchStatus =
                      filterStatus === "ALL" || m.status === filterStatus;

                    let matchDuration = true;
                    const mDuration = parseInt(m.duration);
                    if (filterDuration === "SHORT")
                      matchDuration = mDuration < 90;
                    if (filterDuration === "MEDIUM")
                      matchDuration = mDuration >= 90 && mDuration <= 120;
                    if (filterDuration === "LONG")
                      matchDuration = mDuration > 120;

                    let matchDate = true;
                    // Backend trả camelCase: releaseDate (ISO string)
                    const releaseVal = (m.releaseDate || m.release_date || '').toString().slice(0, 10);
                    if (filterDateFrom)
                      matchDate = matchDate && releaseVal >= filterDateFrom;
                    if (filterDateTo)
                      matchDate = matchDate && releaseVal <= filterDateTo;

                    return (
                      matchSearch && matchStatus && matchDuration && matchDate
                    );
                  })
                  .map((movie) => (
                    <tr
                      key={movie.id}
                      className="hover:bg-[#222] cursor-pointer transition-colors"
                      onClick={(e) => {
                        // Ignore if clicking on buttons
                        if (e.target.tagName !== "BUTTON") {
                          setViewingMovie(movie);
                        }
                      }}
                    >
                      {/* Cột 1: Tên phim (Có hình ảnh) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {movie.poster ? (
                            <img
                              className="h-14 w-10 rounded object-cover mr-4 bg-black border border-[#333]"
                              src={`http://localhost:8000/uploads/${movie.poster}`}
                              alt=""
                            />
                          ) : (
                            <div className="h-14 w-10 rounded bg-[#111] mr-4 flex items-center justify-center text-xs text-gray-500 border border-[#333]">
                              No Img
                            </div>
                          )}
                          <div className="text-sm font-bold text-white">
                            {movie.title}
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Trạng thái (Đã cập nhật màu đỏ cho Ngưng chiếu) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${
                            movie.status === "now_showing"
                              ? "bg-green-900/30 text-green-400 border-green-900/50"
                              : movie.status === "stopped"
                                ? "bg-red-900/30 text-red-400 border-red-900/50"
                                : "bg-yellow-900/30 text-yellow-400 border-yellow-900/50"
                          }`}
                        >
                          {movie.status === "now_showing"
                            ? "Đang chiếu"
                            : movie.status === "stopped"
                              ? "Ngưng chiếu"
                              : "Sắp chiếu"}
                        </span>
                      </td>

                      {/* Cột 3: Thời lượng */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-medium">
                        {movie.duration} phút
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-medium">
                        {/* releaseDate từ Node.js backend là ISO string, lấy 10 ký tự đầu */}
                        {(movie.releaseDate || movie.release_date || '').toString().slice(0, 10)}
                      </td>

                      {/* Cột 5: Thao tác */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold">
                        <button
                          onClick={() => handleEdit(movie)}
                          className="text-blue-500 hover:text-blue-400 mr-5 transition-colors"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(movie.id)}
                          className="text-red-500 hover:text-red-400 transition-colors"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                {movies.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-12 text-center text-gray-500 font-medium bg-[#111]"
                    >
                      Chưa có dữ liệu phim. Hãy thêm phim mới.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Movie Details Modal */}
      {viewingMovie && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-[#333]">
              <h3 className="text-2xl font-black text-white uppercase tracking-wider">
                {viewingMovie.title}
              </h3>
              <button
                onClick={() => setViewingMovie(null)}
                className="text-gray-500 hover:text-white font-bold text-3xl transition-colors"
              >
                &times;
              </button>
            </div>
            <div className="p-6 flex flex-col md:flex-row gap-8">
              <div className="md:w-1/3 flex-shrink-0">
                {viewingMovie.poster ? (
                  <img
                    src={`http://localhost:8000/uploads/${viewingMovie.poster}`}
                    alt={viewingMovie.title}
                    className="w-full rounded-lg shadow-xl border border-[#333]"
                  />
                ) : (
                  <div className="w-full aspect-[2/3] bg-[#111] border border-[#333] rounded-lg flex items-center justify-center text-gray-500 font-bold">
                    No Image
                  </div>
                )}
              </div>
              <div className="md:w-2/3 space-y-4 text-base">
                <p>
                  <span className="font-bold text-gray-400 uppercase text-xs tracking-wider block mb-1">
                    Trạng thái
                  </span>
                  {viewingMovie.status === "now_showing" ? (
                    <span className="text-green-400 font-bold">Đang chiếu</span>
                  ) : viewingMovie.status === "stopped" ? (
                    <span className="text-red-400 font-bold">Ngưng chiếu</span> // Thêm dòng này
                  ) : (
                    <span className="text-yellow-400 font-bold">Sắp chiếu</span>
                  )}
                </p>
                <p>
                  <span className="font-bold text-gray-400 uppercase text-xs tracking-wider block mb-1">
                    Thể loại
                  </span>
                  <span className="text-white font-medium">
                    {viewingMovie.genre || "Chưa cập nhật"}
                  </span>
                </p>
                <p>
                  <span className="font-bold text-gray-400 uppercase text-xs tracking-wider block mb-1">
                    Phân loại tuổi
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-sm font-bold border inline-block ${
                      viewingMovie.rated === "P" || viewingMovie.rated === "K"
                        ? "bg-green-900/30 border-green-500 text-green-400"
                        : viewingMovie.rated === "T13"
                          ? "bg-yellow-900/30 border-yellow-500 text-yellow-400"
                          : "bg-red-900/30 border-red-500 text-red-400"
                    }`}
                  >
                    {viewingMovie.rated || "P"}
                  </span>
                </p>
                <p>
                  <span className="font-bold text-gray-400 uppercase text-xs tracking-wider block mb-1">
                    Ngày khởi chiếu
                  </span>
                  <span className="text-white font-medium">
                    {(viewingMovie.releaseDate || viewingMovie.release_date || '').toString().slice(0, 10)}
                  </span>
                </p>
                <p>
                  <span className="font-bold text-gray-400 uppercase text-xs tracking-wider block mb-1">
                    Thời lượng
                  </span>
                  <span className="text-white font-medium">
                    {viewingMovie.duration} phút
                  </span>
                </p>
                <p>
                  <span className="font-bold text-gray-400 uppercase text-xs tracking-wider block mb-1">
                    Đạo diễn
                  </span>
                  <span className="text-white font-medium">
                    {viewingMovie.director || "Chưa cập nhật"}
                  </span>
                </p>
                <p>
                  <span className="font-bold text-gray-400 uppercase text-xs tracking-wider block mb-1">
                    Diễn viên
                  </span>
                  <span className="text-white font-medium">
                    {viewingMovie.cast || "Chưa cập nhật"}
                  </span>
                </p>
                <p>
                  <span className="font-bold text-gray-400 uppercase text-xs tracking-wider block mb-1">
                    Mô tả
                  </span>
                  <span className="text-gray-300 leading-relaxed block">
                    {viewingMovie.description || "Chưa cập nhật"}
                  </span>
                </p>
                {(viewingMovie.trailerUrl || viewingMovie.trailer_url) && (
                  <p className="pt-2">
                    <span className="font-bold text-gray-400 uppercase text-xs tracking-wider block mb-2">
                      Trailer
                    </span>
                    <a
                      href={viewingMovie.trailerUrl || viewingMovie.trailer_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-[#E50914] text-white font-bold rounded hover:bg-[#F40612] transition-colors shadow-lg text-sm"
                    >
                      Xem Trailer
                    </a>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
