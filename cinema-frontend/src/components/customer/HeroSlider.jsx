import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";
import { Link } from "react-router-dom";
import { Play, Ticket } from "lucide-react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

export default function HeroSlider({ movies }) {
  // Chỉ lấy tối đa 5 phim đang chiếu để làm banner
  const featuredMovies =
    movies?.filter((m) => m.status === "now_showing").slice(0, 7) || [];

  if (featuredMovies.length === 0) return null;

  return (
    <section className="relative group w-full bg-black overflow-hidden border-b border-[#333]">
      <Swiper
        spaceBetween={0}
        centeredSlides={true}
        effect={"fade"}
        fadeEffect={{ crossFade: true }}
        speed={1000}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        modules={[Autoplay, Pagination, EffectFade]}
        className="mySwiper h-[400px] md:h-[550px]"
      >
        {featuredMovies.map((movie) => (
          <SwiperSlide
            key={movie.id}
            className="relative overflow-hidden select-none"
          >
            {/* 1. Hình nền mờ ảo tạo chiều sâu */}
            <div
              className="absolute inset-0 scale-110 blur-2xl opacity-40 transform"
              style={{
                backgroundImage: `url(http://localhost:8000/uploads/${movie.poster})`,
                backgroundPosition: "center",
                backgroundSize: "cover",
              }}
            />

            {/* 2. Lớp phủ gradient tối */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/80 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-transparent to-transparent z-10" />

            {/* 3. Nội dung chính */}
            <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-full z-20 flex items-center">
              <div className="flex flex-col md:flex-row items-center gap-10 w-full">
                {/* Poster Phim */}
                <div className="w-40 md:w-64 flex-shrink-0 shadow-2xl border-4 border-[#333] rounded-xl overflow-hidden hidden md:block">
                  <img
                    src={`http://localhost:8000/uploads/${movie.poster}`}
                    alt={movie.title}
                    className="w-full h-auto object-cover"
                  />
                </div>

                {/* Thông tin phim */}
                <div className="text-white flex-1 space-y-4 md:space-y-6 text-center md:text-left mt-10 md:mt-0">
                  {movie.rated && (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black border tracking-wider inline-block ${
                        movie.rated === "P" || movie.rated === "K"
                          ? "bg-green-900/40 border-green-500 text-green-400"
                          : movie.rated === "T13"
                            ? "bg-yellow-900/40 border-yellow-500 text-yellow-400"
                            : "bg-red-900/40 border-red-500 text-red-400"
                      }`}
                    >
                      {movie.rated}
                    </span>
                  )}

                  <h1 className="text-3xl md:text-5xl lg:text-6xl font-black drop-shadow-lg tracking-wide uppercase leading-tight">
                    {movie.title}
                  </h1>

                  <p className="text-gray-300 leading-relaxed text-sm md:text-base font-light line-clamp-3 md:line-clamp-4 max-w-3xl whitespace-pre-line">
                    {movie.description ||
                      "Chưa có nội dung chi tiết cho bộ phim này."}
                  </p>

                  {/* Nút hành động */}
                  <div className="flex flex-wrap items-center gap-4 pt-2 justify-center md:justify-start">
                    <Link
                      to={`/movies/${movie.id}`}
                      className="inline-flex items-center px-8 py-3 bg-[#E50914] text-white font-black rounded-lg hover:bg-[#F40612] transition-all focus:outline-none shadow-[0_0_15px_rgba(229,9,20,0.5)] transform hover:scale-105"
                    >
                      <Ticket className="h-5 w-5 mr-2.5" /> ĐẶT VÉ NGAY
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <style jsx global>{`
        .mySwiper .swiper-pagination-bullet {
          background: #555;
          opacity: 1;
        }
        .mySwiper .swiper-pagination-bullet-active {
          background: #e50914;
          width: 20px;
          border-radius: 5px;
        }
      `}</style>
    </section>
  );
}
