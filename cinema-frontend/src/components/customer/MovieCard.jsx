import { Link } from "react-router-dom";
import { Calendar, Clock, User, Ticket, Eye } from "lucide-react";

export default function MovieCard({ movie }) {
  const isNowShowing = movie.status === "now_showing";

  return (
    <Link 
      to={`/movies/${movie.id}`}
      className="relative w-full aspect-[2/3.2] rounded-2xl overflow-hidden border border-white/5 shadow-lg bg-black flex flex-col transition-all duration-500 hover:scale-[1.04] hover:shadow-[0_20px_40px_rgba(0,0,0,0.8)] hover:border-[#E50914]/40 group"
    >
      {/* Poster Image */}
      {movie.poster ? (
        <img
          src={`${import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000'}/uploads/${movie.poster}`}
          alt={movie.title}
          className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:blur-[2px] opacity-100 group-hover:opacity-45"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center text-gray-600 bg-[#111]">
          Chưa có ảnh
        </div>
      )}

      {/* Status Badge */}
      <div className="absolute top-3 left-3 z-20">
        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-md border ${
          isNowShowing 
            ? "bg-[#E50914] text-white border-red-500/30" 
            : "bg-[#2a2a2a] text-gray-300 border-gray-600/30"
        }`}>
          {isNowShowing ? "Đang chiếu" : "Sắp chiếu"}
        </span>
      </div>

      {/* Overlay Content Panel (Always overlays on top of the poster) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent group-hover:from-black group-hover:via-black/85 group-hover:backdrop-blur-[2px] transition-all duration-300 flex flex-col justify-end p-5 z-10">
        
        {/* Title */}
        <h3 className="text-sm sm:text-base font-black text-white leading-snug line-clamp-2 drop-shadow-md group-hover:text-[#E50914] transition-colors duration-300">
          {movie.title}
        </h3>

        {/* Details & Button (Reveals on hover) */}
        <div className="max-h-0 opacity-0 overflow-hidden group-hover:max-h-[200px] group-hover:opacity-100 transition-all duration-500 ease-in-out flex flex-col gap-3 group-hover:mt-3">
          {/* Divider line */}
          <div className="border-t border-white/10"></div>

          {/* Metadata Grid */}
          <div className="text-[11px] text-gray-300 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Calendar size={12} className="text-[#E50914] shrink-0" />
              <span>
                {movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString("vi-VN") : (movie.release_date || "Đang cập nhật")}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={12} className="text-[#E50914] shrink-0" />
              <span>{movie.duration} phút</span>
            </div>
            {movie.director && (
              <div className="flex items-center gap-1.5">
                <User size={12} className="text-[#E50914] shrink-0" />
                <span className="line-clamp-1">{movie.director}</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="pt-1">
            {isNowShowing ? (
              <div className="w-full flex items-center justify-center gap-1.5 bg-[#E50914] text-white py-2 rounded-xl font-black text-[11px] uppercase tracking-wider hover:bg-red-700 transition-colors shadow-lg shadow-red-900/25">
                <Ticket size={13} strokeWidth={2.5} />
                Đặt Vé Ngay
              </div>
            ) : (
              <div className="w-full flex items-center justify-center gap-1.5 bg-[#2a2a2a] text-gray-300 py-2 rounded-xl font-bold text-[11px] uppercase tracking-wider hover:bg-[#333] hover:text-white transition-colors border border-white/5">
                <Eye size={13} />
                Chi Tiết
              </div>
            )}
          </div>
        </div>

      </div>
    </Link>
  );
}
