import { useState, useEffect } from "react";
import api from "../../utils/api";
import MovieCard from "../../components/customer/MovieCard";
// IMPORT THUỐC MỚI VÀO ĐÂY
import HeroSlider from "../../components/customer/HeroSlider";
import { useBranch } from "../../contexts/BranchContext";
export default function HomePage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await api.get("/public/movies");
        setMovies(res.data?.data ?? res.data);
      } catch (error) {
        console.error("Error fetching movies", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-[60vh] text-[#E50914] font-bold animate-pulse">
        Đang tải phim bom tấn...
      </div>
    );

  const nowShowing = movies.filter((m) => m.status === "now_showing");
  const comingSoon = movies.filter((m) => m.status === "coming_soon");

  return (
    <div className="bg-[#141414] min-h-screen">
      {/* 1. HIỂN THỊ HERO SLIDER CỰC NGẦU NGAY TRÊN ĐẦU */}
      <HeroSlider movies={movies} />

      {/* 2. DƯỚI LÀ CÁC MỤC VUỐT (CAROUSEL) NHƯ CŨ */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12 space-y-16">
        {/* Phim Đang Chiếu */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black text-white uppercase tracking-wider border-l-4 border-[#E50914] pl-4">
              Phim Đang Chiếu
            </h2>
            <span className="text-gray-500 font-medium">
              ({nowShowing.length} phim)
            </span>
          </div>
          {/* ... Component Carousel của bạn giữ nguyên ... */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {nowShowing.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </section>

        {/* Phim Sắp Chiếu */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black text-white uppercase tracking-wider border-l-4 border-[#E50914] pl-4">
              Phim Sắp Chiếu
            </h2>
            <span className="text-gray-500 font-medium">
              ({comingSoon.length} phim)
            </span>
          </div>
          {/* ... Component Carousel của bạn giữ nguyên ... */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {comingSoon.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
