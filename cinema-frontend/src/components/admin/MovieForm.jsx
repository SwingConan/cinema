import { useState, useEffect } from "react";
import api from "../../utils/api";

export default function MovieForm({ movie, onSuccess, onCancel }) {
  const isEditing = !!movie;

  // Sửa biến formData ban đầu thành:
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    director: "",
    cast: "",
    duration: "",
    release_date: "",
    status: "now_showing",
    trailer_url: "",
    genre: "",
    rated: "P", // Thêm 2 trường này
  });
  const [posterFile, setPosterFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (movie) {
      setFormData({
        title:        movie.title        || "",
        description:  movie.description  || "",
        director:     movie.director     || "",
        cast:         movie.cast         || "",
        duration:     movie.duration     || "",
        // Backend (Node.js) trả camelCase: releaseDate, trailerUrl
        release_date: (movie.releaseDate || movie.release_date || "").toString().split("T")[0],
        status:       movie.status       || "now_showing",
        trailer_url:  movie.trailerUrl   || movie.trailer_url  || "",
        genre:        movie.genre        || "",
        rated:        movie.rated        || "P",
      });
    }
  }, [movie]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setPosterFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const submitData = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null && formData[key] !== "") {
        submitData.append(key, formData[key]);
      }
    });

    if (posterFile) {
      submitData.append("poster", posterFile);
    }

    try {
      if (isEditing) {
        // Node.js hỗ trợ PUT thực sự với multipart/form-data
        // (Không cần _method hack của Laravel nữa)
        await api.put(`/admin/movies/${movie.id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/admin/movies', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      onSuccess();
    } catch (err) {
      console.error("Error saving movie:", err);
      setError(err.response?.data?.message || "Có lỗi xảy ra khi lưu phim.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-900/20 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-sm font-medium text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
            Tên phim *
          </label>
          <input
            type="text"
            name="title"
            required
            value={formData.title}
            onChange={handleChange}
            className="mt-1 block w-full bg-[#222] text-white border border-[#444] rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] transition-colors sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
            Trạng thái *
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full bg-[#222] text-white border border-[#444] rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] transition-colors sm:text-sm"
          >
            <option value="now_showing">Đang chiếu</option>
            <option value="coming_soon">Sắp chiếu</option>
            {/* THÊM DÒNG NÀY VÀO: */}
            <option value="stopped">Ngưng chiếu</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
            Đạo diễn
          </label>
          <input
            type="text"
            name="director"
            value={formData.director}
            onChange={handleChange}
            className="mt-1 block w-full bg-[#222] text-white border border-[#444] rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] transition-colors sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
            Thể loại
          </label>
          <input
            type="text"
            name="genre"
            value={formData.genre}
            onChange={handleChange}
            className="mt-1 block w-full bg-[#222] text-white border border-[#444] rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] transition-colors sm:text-sm"
            placeholder="VD: Hành động, Viễn tưởng..."
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
            Phân loại tuổi (Rated) *
          </label>
          <select
            name="rated"
            value={formData.rated}
            onChange={handleChange}
            className="mt-1 block w-full bg-[#222] text-white border border-[#444] rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] transition-colors sm:text-sm"
          >
            <option value="P">P - Phổ biến (Mọi lứa tuổi)</option>
            <option value="K">
              K - Khán giả dưới 13 tuổi (Xem cùng cha mẹ)
            </option>
            <option value="T13">T13 - Khán giả từ 13 tuổi trở lên</option>
            <option value="T16">T16 - Khán giả từ 16 tuổi trở lên</option>
            <option value="T18">T18 - Khán giả từ 18 tuổi trở lên</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
            Ngày khởi chiếu *
          </label>
          <input
            type="date"
            name="release_date"
            min="1900-01-01"
            required
            value={formData.release_date}
            onChange={handleChange}
            className="mt-1 block w-full bg-[#222] text-white border border-[#444] rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] transition-colors [color-scheme:dark] sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
            Thời lượng (phút) *
          </label>
          <input
            type="number"
            name="duration"
            required
            min="1"
            value={formData.duration}
            onChange={handleChange}
            className="mt-1 block w-full bg-[#222] text-white border border-[#444] rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] transition-colors sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
            Link Trailer (YouTube)
          </label>
          <input
            type="url"
            name="trailer_url"
            value={formData.trailer_url}
            onChange={handleChange}
            className="mt-1 block w-full bg-[#222] text-white border border-[#444] rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] transition-colors sm:text-sm"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
            Diễn viên
          </label>
          <input
            type="text"
            name="cast"
            value={formData.cast}
            onChange={handleChange}
            className="mt-1 block w-full bg-[#222] text-white border border-[#444] rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] transition-colors sm:text-sm"
            placeholder="VD: Robert Downey Jr., Chris Evans,..."
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
            Mô tả
          </label>
          <textarea
            name="description"
            rows="3"
            value={formData.description}
            onChange={handleChange}
            className="mt-1 block w-full bg-[#222] text-white border border-[#444] rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] transition-colors sm:text-sm"
          ></textarea>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
            Poster Phim
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-bold file:bg-[#333] file:text-white hover:file:bg-[#444] transition-colors cursor-pointer"
          />
          {isEditing && movie.poster && !posterFile && (
            <p className="mt-2 text-sm text-gray-500 italic">
              Giữ nguyên poster cũ nếu không chọn file mới.
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-6 border-t border-[#333]">
        <button
          type="button"
          onClick={onCancel}
          className="bg-[#333] py-2.5 px-6 border border-[#444] rounded-lg shadow-sm text-sm font-bold text-white hover:bg-[#444] focus:outline-none transition-colors"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center flex-shrink-0 bg-[#E50914] py-2.5 px-6 border border-transparent rounded-lg shadow-lg text-sm font-bold text-white hover:bg-[#F40612] focus:outline-none transition-colors uppercase tracking-wider disabled:opacity-50"
        >
          {loading ? "Đang lưu..." : isEditing ? "Cập nhật" : "Thêm mới"}
        </button>
      </div>
    </form>
  );
}
