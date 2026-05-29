import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../utils/api";
import MovieCard from "../../components/customer/MovieCard";

export default function MoviesListPage() {
  // Lấy tham số 'type' từ URL (ví dụ: 'now-showing' hoặc 'coming-soon')
  const { type } = useParams();

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Xác định status để gọi API và Tiêu đề trang
  const status = type === "coming-soon" ? "coming_soon" : "now_showing";
  const pageTitle =
    type === "coming-soon" ? "Phim Sắp Chiếu" : "Phim Đang Chiếu";

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      try {
        // Gọi API lấy phim theo status
        const res = await api.get("/public/movies", {
          params: {
            status,
          },
        });
        setMovies(res.data?.data ?? res.data);
      } catch (error) {
        console.error("Error fetching movies", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [status]); // Load lại khi status thay đổi

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh] text-[#E50914] font-bold animate-pulse">
        Đang tải danh sách phim...
      </div>
    );
  }

  return (
    <div className="bg-[#141414] min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tiêu đề trang */}
        <div className="flex items-center justify-between mb-8 border-b border-[#333] pb-4">
          <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-wider border-l-4 border-[#E50914] pl-4">
            {pageTitle}
          </h1>
          <span className="text-gray-500 font-medium">
            Hiển thị {movies.length} phim
          </span>
        </div>

        {/* Danh sách phim dạng Grid (Lưới) */}
        {movies.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-[#1a1a1a] rounded-2xl border border-dashed border-[#444]">
            <p className="text-gray-400 text-lg">
              Hiện chưa có phim nào trong danh mục này.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
