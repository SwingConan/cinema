import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../utils/api";
import MovieCard from "../../components/customer/MovieCard";
import HeroSlider from "../../components/customer/HeroSlider";
import { Sparkles, ArrowRight } from "lucide-react";

export default function HomePage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const movieRes = await api.get("/public/movies");
        setMovies(movieRes.data?.data ?? movieRes.data);
      } catch (error) {
        console.error("Error fetching home data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
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

        {/* Sleek Promotion Banner Callout */}
        <section className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-r from-black via-[#1a0a0b] to-[#250d0e] p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-red-500/20 transition-all duration-500 shadow-2xl">

          {/* Animated Ambient Light Globs */}
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none transition-all duration-500 group-hover:bg-amber-500/15" />
          <div className="absolute -top-16 -right-16 w-80 h-80 bg-[#E50914]/15 rounded-full blur-3xl pointer-events-none transition-all duration-500 group-hover:bg-[#E50914]/25" />

          {/* Tech Grid Pattern (subtle backdrop lines) */}
          <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          {/* Left Text Block */}
          <div className="space-y-4 z-10 max-w-lg md:max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#E50914]/15 text-[#ff4b55] border border-[#E50914]/30 shadow-sm shadow-red-900/10">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Góc Khuyến Mãi
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide leading-tight group-hover:text-red-500 transition-colors duration-300">
              Đừng bỏ lỡ ưu đãi đặc quyền!
            </h3>
            <p className="text-gray-400 text-xs sm:text-sm font-light leading-relaxed">
              Nhận ngay các mã giảm giá lên tới <strong className="text-red-400 font-bold">50%</strong> vé phim và combo bắp nước để áp dụng trực tiếp tại quầy thanh toán trực tuyến. Hàng tuần đều có voucher mới giới hạn!
            </p>
          </div>

          {/* Center Graphic & Right Button Container */}
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 z-10 shrink-0 w-full md:w-auto justify-end">

            {/* 3D Floating Ticket Visual */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center animate-float">
              {/* Outer glow ring */}
              <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl scale-95 group-hover:bg-red-500/30 transition-all duration-500" />
              <img
                src="/promo-ticket.png"
                alt="Cinema Promo Ticket"
                className="w-full h-full object-contain filter drop-shadow-[0_10px_20px_rgba(229,9,20,0.5)] transform -rotate-12 group-hover:rotate-0 transition-transform duration-500"
              />
            </div>

            {/* CTA Button */}
            <Link
              to="/promotions"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-[#E50914] hover:bg-red-700 text-white font-black px-7 py-4 text-sm uppercase tracking-wider transition-all duration-300 hover:scale-[1.03] shadow-[0_10px_20px_rgba(229,9,20,0.3)] hover:shadow-[0_15px_30px_rgba(229,9,20,0.5)] border border-red-500/30"
            >
              <span>Nhận Voucher Ngay</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform duration-300" />
            </Link>

          </div>
        </section>

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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
            {comingSoon.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
