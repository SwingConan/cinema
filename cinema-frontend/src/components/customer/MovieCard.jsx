import { Link } from "react-router-dom";

export default function MovieCard({ movie }) {
  return (
    <div className="bg-[#222] border border-[#333] rounded-lg shadow-lg overflow-hidden flex flex-col transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-[#444] group">
      <Link to={`/movies/${movie.id}`}>
        {movie.poster ? (
          <img
            src={`http://localhost:8000/uploads/${movie.poster}`}
            alt={movie.title}
            className="w-full h-80 object-cover bg-black opacity-90 group-hover:opacity-100 transition-opacity"
          />
        ) : (
          <div className="w-full h-80 bg-[#111] flex items-center justify-center text-gray-600">
            Chưa có ảnh
          </div>
        )}
      </Link>
      <div className="p-4 flex-grow flex flex-col">
        <div className="mb-2">
          <span
            className={`text-xs font-bold px-2 py-1 rounded inline-block mb-3 ${movie.status === "now_showing" ? "bg-[#E50914] text-white" : "bg-gray-700 text-gray-200"}`}
          >
            {movie.status === "now_showing" ? "Đang chiếu" : "Sắp chiếu"}
          </span>
          <Link to={`/movies/${movie.id}`}>
            <h3 className="text-lg font-bold text-white line-clamp-2 min-h-[3.5rem] hover:text-[#E50914] transition-colors">
              {movie.title}
            </h3>
          </Link>
        </div>

        <div className="text-sm text-gray-400 mb-4 flex-grow space-y-1">
          <p>
            <strong className="text-gray-300">Khởi chiếu:</strong>{" "}
            {movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString("vi-VN") : (movie.release_date || "Đang cập nhật")}
          </p>
          <p>
            <strong className="text-gray-300">Thời lượng:</strong>{" "}
            {movie.duration} phút
          </p>
          {movie.director && (
            <p className="line-clamp-1">
              <strong className="text-gray-300">Đạo diễn:</strong>{" "}
              {movie.director}
            </p>
          )}
        </div>

        <div className="mt-auto">
          {movie.status === "now_showing" ? (
            <Link
              to={`/movies/${movie.id}`}
              className="block w-full text-center bg-[#E50914] text-white py-2 rounded font-bold hover:bg-[#F40612] transition duration-150 ease-in-out shadow-sm"
            >
              Mua Vé
            </Link>
          ) : (
            <Link
              to={`/movies/${movie.id}`}
              className="block w-full text-center bg-[#333] text-gray-300 py-2 rounded font-medium hover:bg-[#444] transition duration-150 ease-in-out shadow-sm"
            >
              Xem Chi Tiết
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
