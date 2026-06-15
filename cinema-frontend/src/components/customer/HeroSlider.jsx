import { useState, useEffect, useMemo } from "react";
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
  const featuredMovies = useMemo(() => {
    return movies?.filter((m) => m.status === "now_showing").slice(0, 7) || [];
  }, [movies]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [playVideoId, setPlayVideoId] = useState(null);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    setPlayVideoId(null);
    setShowVideo(false);
    const activeMovie = featuredMovies[activeIndex];
    if (!activeMovie) return;

    const url = activeMovie.trailerUrl || activeMovie.trailer_url;
    if (!url) return;

    const timer = setTimeout(() => {
      const videoId = url.includes('youtu.be/')
        ? url.split('youtu.be/')[1]?.split('?')[0]
        : url.split('v=')[1]?.split('&')[0];
      
      if (videoId) {
        setPlayVideoId(videoId);
        // Trì hoãn hiển thị video để ẩn đi cái chớp logo/nút điều khiển ban đầu của YouTube
        const showTimer = setTimeout(() => {
          setShowVideo(true);
        }, 1200);
        return () => clearTimeout(showTimer);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [activeIndex, featuredMovies]);

  if (featuredMovies.length === 0) return null;

  return (
    <section className="relative group w-full bg-black overflow-hidden border-b border-[#333]">
      <Swiper
        spaceBetween={0}
        centeredSlides={true}
        effect={"fade"}
        fadeEffect={{ crossFade: true }}
        speed={1000}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
        modules={[Pagination, EffectFade]}
        className="mySwiper h-[520px] sm:h-[530px] md:h-[550px]"
      >
        {featuredMovies.map((movie, index) => {
          const isActive = index === activeIndex;
          const isPlayingVideo = isActive && playVideoId;
          return (
            <SwiperSlide
              key={movie.id}
              className="relative overflow-hidden select-none"
            >
              {/* 1. Hình nền mờ ảo tạo chiều sâu */}
              <div
                className="absolute inset-0 scale-110 blur-2xl opacity-40 transform"
                style={{
                  backgroundImage: `url(${import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000'}/uploads/${movie.poster})`,
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                }}
              />

              {/* 1.5. Video Trailer Nền (YouTube iframe) */}
              {isPlayingVideo && (
                <div
                  className={`absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none transition-opacity duration-1000 ${
                    showVideo ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <iframe
                    src={`https://www.youtube.com/embed/${playVideoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${playVideoId}&playsinline=1&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&enablejsapi=1`}
                    title={movie.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    className="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto aspect-video -translate-x-1/2 -translate-y-1/2 scale-[1.15] pointer-events-none"
                  ></iframe>
                  {/* Lớp lá chắn trong suốt ngăn chặn mọi tương tác chuột/chạm */}
                  <div className="absolute inset-0 z-10 bg-transparent pointer-events-none" />
                </div>
              )}

              {/* 2. Lớp phủ gradient tối - Giảm độ tối ở giữa để video sáng rõ hơn */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/30 to-transparent z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/30 to-transparent z-10" />

              {/* 3. Nội dung chính */}
              <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-full z-20 flex items-center">
                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 w-full">
                  {/* Poster Phim */}
                  <div className="w-28 sm:w-36 md:w-64 flex-shrink-0 shadow-2xl border-2 md:border-4 border-[#333] rounded-xl overflow-hidden block mx-auto md:mx-0">
                    <img
                      src={`${import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000'}/uploads/${movie.poster}`}
                      alt={movie.title}
                      className="w-full h-auto object-cover"
                    />
                  </div>

                  {/* Thông tin phim */}
                  <div className="text-white flex-1 space-y-3 md:space-y-6 text-center md:text-left mt-3 md:mt-0">
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

                    <h1 className="text-2xl md:text-4xl lg:text-5xl font-black drop-shadow-lg tracking-wide uppercase leading-tight line-clamp-2">
                      {movie.title}
                    </h1>

                    <p className="text-gray-300 leading-relaxed text-sm md:text-base font-light line-clamp-2 md:line-clamp-3 max-w-3xl whitespace-pre-line">
                      {movie.description ||
                        "Chưa có nội dung chi tiết cho bộ phim này."}
                    </p>

                    {/* Nút hành động */}
                    <div className="flex flex-wrap items-center gap-4 pt-1 justify-center md:justify-start">
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
          );
        })}
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
