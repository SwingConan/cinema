import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../utils/api";
import { useAuth } from "../../contexts/AuthContext";
import {
  Clock,
  Calendar,
  Video,
  MonitorPlay,
  Ticket,
  Star,
  MessageSquare,
  Send,
  Edit3,
  MapPin,
  ChevronDown,
  ChevronUp,
  Search,
  Building2,
} from "lucide-react";

export default function MovieDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [expandedBranchIds, setExpandedBranchIds] = useState({});

  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [reviewStatus, setReviewStatus] = useState({
    loading: false,
    error: "",
    success: "",
  });

  const [filterRating, setFilterRating] = useState("ALL");

  // State mới để kiểm tra xem người dùng đang Viết mới hay Cập nhật
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const res = await api.get(`/public/movies/${id}`);
        setMovie(res.data);

        if (res.data.showtimes && res.data.showtimes.length > 0) {
          const firstShowtime = res.data.showtimes[0];
          const firstDate = new Date(
            String(firstShowtime.startTime ?? firstShowtime.start_time).replace("Z", ""),
          ).toLocaleDateString("en-CA");
          setSelectedDate(firstDate);
        }
      } catch (error) {
        console.error("Error fetching movie details", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchReviews = async () => {
      try {
        const res = await api.get(`/public/movies/${id}/reviews`);
        setReviews(res.data?.data ?? res.data);
      } catch (error) {
        console.error("Error fetching reviews", error);
      }
    };

    fetchMovie();
    fetchReviews();
  }, [id]);

  // LOGIC MỚI: Tự động điền lại form nếu người dùng đã từng đánh giá
  useEffect(() => {
    if (user && reviews.length > 0) {
      // Tìm xem trong mảng reviews có cái nào của user hiện tại không
      const myReview = reviews.find(
        (r) => r.userId === user.id || r.user_id === user.id || r.user?.id === user.id,
      );

      if (myReview) {
        setReviewForm({
          rating: myReview.rating,
          comment: myReview.comment || "",
        });
        setIsUpdating(true); // Chuyển sang chế độ Cập nhật
      } else {
        setReviewForm({ rating: 5, comment: "" });
        setIsUpdating(false); // Chế độ Viết mới
      }
    }
  }, [reviews, user]);

  const showtimesByDate = useMemo(() => {
    if (!movie || !movie.showtimes) return {};

    return movie.showtimes.reduce((acc, showtime) => {
      const rawTime = (showtime.startTime ?? showtime.start_time ?? '').replace('Z', '');
      const dateStr = new Date(rawTime).toLocaleDateString("en-CA");
      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(showtime);
      return acc;
    }, {});
  }, [movie]);

  const availableDates = Object.keys(showtimesByDate).sort();

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewStatus({ loading: true, error: "", success: "" });
    try {
      await api.post(`/customer/movies/${id}/reviews`, reviewForm);
      setReviewStatus({
        loading: false,
        error: "",
        success: isUpdating
          ? "Đã cập nhật đánh giá thành công!"
          : "Cảm ơn bạn đã gửi đánh giá!",
      });
      setReviewForm({ rating: 5, comment: "" });
      
      const res = await api.get(`/public/movies/${id}/reviews`);
      setReviews(res.data?.data ?? res.data);
    } catch (err) {
      setReviewStatus({
        loading: false,
        error: err.response?.data?.message || "Có lỗi xảy ra.",
        success: "",
      });
    }
  };


  const currentShowtimes = showtimesByDate[selectedDate] || [];

  const showtimesByBranch = useMemo(() => {
    const branchesMap = {};
    currentShowtimes.forEach((st) => {
      const branchObj = st.room?.branch;
      const branchId = branchObj?.id || 0;
      const branchName = branchObj?.name || "Chi nhánh khác";
      const branchCity = branchObj?.city || "Khác";
      const branchAddress = branchObj?.address || "";

      if (!branchesMap[branchId]) {
        branchesMap[branchId] = {
          id: branchId,
          name: branchName,
          city: branchCity,
          address: branchAddress,
          showtimes: [],
        };
      }
      branchesMap[branchId].showtimes.push(st);
    });
    return Object.values(branchesMap);
  }, [currentShowtimes]);

  const branchesByCity = useMemo(() => {
    const cityMap = {};
    showtimesByBranch.forEach((b) => {
      const city = b.city || "Khác";
      if (!cityMap[city]) cityMap[city] = [];
      cityMap[city].push(b);
    });
    return cityMap;
  }, [showtimesByBranch]);

  const availableCities = useMemo(() => {
    return Object.keys(branchesByCity).sort();
  }, [branchesByCity]);

  const cityOptions = useMemo(() => {
    return availableCities.map((city) => {
      const branches = branchesByCity[city] || [];
      const showtimeCount = branches.reduce((sum, branch) => sum + branch.showtimes.length, 0);
      return {
        city,
        branchCount: branches.length,
        showtimeCount,
      };
    });
  }, [availableCities, branchesByCity]);

  const filteredCityOptions = useMemo(() => {
    const keyword = citySearch.trim().toLowerCase();
    if (!keyword) return cityOptions;
    return cityOptions.filter((option) => option.city.toLowerCase().includes(keyword));
  }, [cityOptions, citySearch]);

  const selectedCityMeta = cityOptions.find((option) => option.city === selectedCity);

  useEffect(() => {
    if (availableCities.length > 0) {
      if (!selectedCity || !availableCities.includes(selectedCity)) {
        setSelectedCity(availableCities[0]);
      }
    } else {
      setSelectedCity("");
    }
  }, [availableCities, selectedCity]);

  useEffect(() => {
    setShowCityPicker(false);
    setCitySearch("");
  }, [selectedDate]);

  useEffect(() => {
    if (showtimesByBranch.length > 0) {
      const firstBranchId = showtimesByBranch[0].id;
      setExpandedBranchIds({
        [firstBranchId]: true,
      });
    }
  }, [selectedDate, showtimesByBranch]);

  const toggleBranch = (branchId) => {
    setExpandedBranchIds((prev) => ({
      ...prev,
      [branchId]: !prev[branchId],
    }));
  };

  const getGroupedShowtimes = (branchShowtimes) => {
    return branchShowtimes.reduce((acc, st) => {
      const roomType = st.room?.type || "2D";
      const format = st.format || "Phụ đề";
      const groupKey = `${roomType} - ${format}`;

      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(st);
      return acc;
    }, {});
  };

  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(
          1,
        )
      : 0;

  const filteredReviews = reviews.filter((review) => {
    if (filterRating === "ALL") return true;
    return review.rating === filterRating;
  });

  const renderTrailer = () => {
    if (!movie || (!movie.trailerUrl && !movie.trailer_url)) {
      return (
        <div className="aspect-w-16 aspect-h-9 rounded-lg bg-[#111] border border-[#333] flex items-center justify-center h-48">
          <span className="text-gray-500">Chưa có Trailer</span>
        </div>
      );
    }
    const url = movie.trailerUrl || movie.trailer_url;
    const videoId = url.includes('youtu.be/')
      ? url.split('youtu.be/')[1]?.split('?')[0]
      : url.split('v=')[1]?.split('&')[0];
    return (
      <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden shadow-sm bg-black border border-[#444]">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-48 sm:h-64 object-cover"
        ></iframe>
      </div>
    );
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-[60vh] text-[#E50914] font-bold">
        Đang tải thông tin phim...
      </div>
    );
  if (!movie)
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        Không tìm thấy phim.
      </div>
    );

  return (
    <div className="bg-[#141414] min-h-[calc(100vh-64px)] pb-12">
      {/* Banner Area */}
      <div
        className="w-full bg-black overflow-hidden relative border-b border-[#333]"
        style={{ height: "400px" }}
      >
        <div
          className="absolute inset-0 opacity-20 transform scale-105"
          style={{
            backgroundImage: `url(${import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000'}/uploads/${movie.poster})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
            filter: "blur(8px)",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 h-full flex items-end pb-8">
          <div className="flex flex-col md:flex-row gap-8 items-end w-full">
            {movie.poster && (
              <img
                src={`${import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000'}/uploads/${movie.poster}`}
                alt={movie.title}
                className="w-48 md:w-64 rounded-xl shadow-2xl border border-[#333] hidden sm:block"
              />
            )}
            <div className="text-white flex-1 mb-4 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-black mb-4 drop-shadow-md">
                {movie.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm md:text-base font-medium text-gray-300">
                <span className="flex items-center">
                  <Clock size={18} className="mr-1 text-[#E50914]" />{" "}
                  {movie.duration} phút
                </span>
                <span className="flex items-center">
                  <Calendar size={18} className="mr-1 text-[#E50914]" /> Khởi
                  chiếu: {movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString("vi-VN") : (movie.release_date || "Đang cập nhật")}
                </span>

                {movie.genre && (
                  <span className="border border-gray-600 bg-gray-800/50 px-2 py-0.5 rounded text-sm text-gray-300">
                    {movie.genre}
                  </span>
                )}
                {movie.rated && (
                  <span
                    className={`px-2 py-0.5 rounded text-sm font-bold border ${
                      movie.rated === "P" || movie.rated === "K"
                        ? "bg-green-900/30 border-green-500 text-green-400"
                        : movie.rated === "T13"
                          ? "bg-yellow-900/30 border-yellow-500 text-yellow-400"
                          : "bg-red-900/30 border-red-500 text-red-400"
                    }`}
                  >
                    {movie.rated}
                  </span>
                )}

                {totalReviews > 0 && (
                  <span className="flex items-center bg-yellow-900/20 border border-yellow-500/50 px-2 py-0.5 rounded text-sm font-bold text-yellow-400">
                    <Star className="w-4 h-4 mr-1 fill-current" /> {avgRating} /
                    5
                  </span>
                )}

                {movie.director && (
                  <span className="flex items-center">
                    <Video size={18} className="mr-1 text-[#E50914]" /> ĐD:{" "}
                    {movie.director}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-8 md:mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-white border-l-4 border-[#E50914] pl-2">
              Nội Dung Phim
            </h2>
            <p className="text-gray-400 leading-relaxed text-lg whitespace-pre-line font-light">
              {movie.description || "Chưa có nội dung chi tiết."}
            </p>
            {movie.cast && (
              <div className="mt-4 pt-4 border-t border-[#333]">
                <strong className="text-gray-200">Diễn viên:</strong>{" "}
                <span className="text-gray-400">{movie.cast}</span>
              </div>
            )}
          </section>

          {/* Mobile Trailer */}
          <div className="bg-[#222] p-5 rounded-xl border border-[#333] lg:hidden mb-10">
            <h3 className="text-xl font-bold mb-4 text-white border-l-4 border-[#E50914] pl-2">
              Trailer
            </h3>
            {renderTrailer()}
          </div>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-6 text-white border-l-4 border-[#E50914] pl-2">
              Lịch Chiếu
            </h2>

            {availableDates.length > 0 ? (
              <div>
                <div className="flex space-x-3 overflow-x-auto pb-4 mb-6 scrollbar-hide">
                  {availableDates.map((date) => {
                    const d = new Date(date);
                    const dayName = d.toLocaleDateString("vi-VN", {
                      weekday: "short",
                    });
                    const dayNum = d.getDate();
                    const monthNum = d.getMonth() + 1;

                    return (
                      <button
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        className={`flex-shrink-0 w-20 py-3 px-2 rounded-lg border flex flex-col items-center justify-center transition-all focus:outline-none ${
                          selectedDate === date
                            ? "bg-[#E50914] text-white border-[#E50914] shadow-lg transform -translate-y-1"
                            : "bg-[#222] text-gray-400 border-[#333] hover:border-gray-500 hover:text-white"
                        }`}
                      >
                        <span className="text-xs uppercase font-medium">
                          {dayName}
                        </span>
                        <span className="text-xl font-bold mt-1">
                          {dayNum}/{monthNum}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="bg-[#222] rounded-xl p-6 border border-[#333]">
                  <h3 className="text-lg font-semibold mb-4 text-white flex items-center">
                    <MonitorPlay className="mr-2 text-[#E50914]" />
                    Lịch chiếu phim
                  </h3>

                  <div className="space-y-6">
                    {/* Compact city selector for large multi-branch releases */}
                    {availableCities.length > 0 && (
                      <div className="relative mb-4 border-b border-[#333] pb-4">
                        <button
                          type="button"
                          onClick={() => setShowCityPicker((value) => !value)}
                          className="w-full md:w-auto min-w-full md:min-w-[360px] flex items-center justify-between gap-4 rounded-xl border border-[#3a3a3a] bg-[#171717] px-4 py-3 text-left hover:border-[#E50914]/70 transition-colors"
                        >
                          <span className="flex items-center gap-3 min-w-0">
                            <span className="w-9 h-9 rounded-lg bg-[#E50914]/10 border border-[#E50914]/30 flex items-center justify-center shrink-0">
                              <MapPin size={17} className="text-[#E50914]" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-[11px] uppercase tracking-wider font-black text-gray-500">
                                Khu vực đang chọn
                              </span>
                              <span className="block text-white font-black truncate">
                                {selectedCity || "Chọn tỉnh/thành"}
                              </span>
                            </span>
                          </span>
                          <span className="flex items-center gap-3 shrink-0">
                            {selectedCityMeta && (
                              <span className="hidden sm:block text-xs text-gray-400">
                                {selectedCityMeta.branchCount} rạp · {selectedCityMeta.showtimeCount} suất
                              </span>
                            )}
                            <ChevronDown
                              size={18}
                              className={`text-gray-500 transition-transform ${showCityPicker ? "rotate-180" : ""}`}
                            />
                          </span>
                        </button>

                        {showCityPicker && (
                          <div className="absolute left-0 right-0 md:right-auto md:w-[520px] top-full mt-2 z-30 rounded-xl border border-[#333] bg-[#151515] shadow-2xl overflow-hidden">
                            <div className="p-3 border-b border-[#2a2a2a]">
                              <div className="flex items-center gap-2 rounded-lg border border-[#333] bg-[#0f0f0f] px-3 py-2">
                                <Search size={15} className="text-gray-500 shrink-0" />
                                <input
                                  value={citySearch}
                                  onChange={(e) => setCitySearch(e.target.value)}
                                  placeholder="Tìm tỉnh/thành..."
                                  className="w-full bg-transparent text-sm text-white placeholder:text-gray-600 outline-none"
                                />
                              </div>
                            </div>

                            <div className="max-h-[320px] overflow-y-auto p-2">
                              {filteredCityOptions.length > 0 ? (
                                filteredCityOptions.map((option) => (
                                  <button
                                    key={option.city}
                                    type="button"
                                    onClick={() => {
                                      setSelectedCity(option.city);
                                      setShowCityPicker(false);
                                      setCitySearch("");
                                    }}
                                    className={`w-full flex items-center justify-between gap-3 rounded-lg px-3 py-3 text-left transition-colors ${
                                      selectedCity === option.city
                                        ? "bg-[#E50914] text-white"
                                        : "text-gray-300 hover:bg-[#222]"
                                    }`}
                                  >
                                    <span className="flex items-center gap-2 min-w-0">
                                      <MapPin size={15} className="shrink-0" />
                                      <span className="font-bold truncate">{option.city}</span>
                                    </span>
                                    <span className={`flex items-center gap-1 text-xs shrink-0 ${
                                      selectedCity === option.city ? "text-white/80" : "text-gray-500"
                                    }`}>
                                      <Building2 size={13} /> {option.branchCount} · {option.showtimeCount} suất
                                    </span>
                                  </button>
                                ))
                              ) : (
                                <div className="px-3 py-8 text-center text-sm text-gray-500">
                                  Không tìm thấy khu vực phù hợp.
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedCity && branchesByCity[selectedCity] ? (
                      <div className="space-y-4">
                        {branchesByCity[selectedCity].map((b) => {
                          const isExpanded = expandedBranchIds[b.id];
                          const grouped = getGroupedShowtimes(b.showtimes);
                          return (
                            <div key={b.id} className="bg-[#1a1a1a] rounded-xl border border-[#333] overflow-hidden transition-all duration-300">
                              {/* Branch Header */}
                              <button
                                type="button"
                                onClick={() => toggleBranch(b.id)}
                                className="w-full flex items-center justify-between p-4 hover:bg-[#222] transition-colors focus:outline-none text-left"
                              >
                                <div>
                                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                                    {b.name}
                                  </h4>
                                  {b.address && (
                                    <p className="text-xs text-gray-400 mt-1 font-light">{b.address}</p>
                                  )}
                                </div>
                                <span className="text-gray-400">
                                  {isExpanded ? (
                                    <span className="text-xs uppercase font-bold text-[#E50914] flex items-center gap-1">Thu gọn <ChevronUp size={13} /></span>
                                  ) : (
                                    <span className="text-xs uppercase font-bold text-gray-500 flex items-center gap-1">Mở rộng <ChevronDown size={13} /></span>
                                  )}
                                </span>
                              </button>

                              {/* Branch Content */}
                              {isExpanded && (
                                <div className="p-4 border-t border-[#333] bg-[#111] space-y-4">
                                  {Object.keys(grouped).map((groupKey) => (
                                    <div key={groupKey} className="border-b border-[#222] pb-4 last:border-b-0 last:pb-0">
                                      <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-l-2 border-[#E50914] pl-2">
                                        {groupKey}
                                      </h5>
                                      <div className="flex flex-wrap gap-3">
                                        {grouped[groupKey].map((st) => (
                                          <Link
                                            key={st.id}
                                            to={`/booking/${st.id}`}
                                            className="px-4 py-2.5 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-sm hover:border-[#E50914] hover:bg-black transition flex flex-col items-center justify-center min-w-[90px] group"
                                          >
                                            <span className="text-base font-bold text-white group-hover:text-[#E50914]">
                                              {new Date(
                                                (st.startTime ?? st.start_time ?? '').replace('Z', ''),
                                              ).toLocaleTimeString("vi-VN", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                              })}
                                            </span>
                                            <span className="text-[10px] text-gray-400 mt-0.5 font-medium">
                                              {st.room?.name}
                                            </span>
                                            <span
                                              className={`text-[9px] mt-0.5 font-bold tracking-wider ${
                                                (st.availableSeats ?? st.available_seats ?? 0) < 10
                                                  ? "text-red-500 animate-pulse"
                                                  : "text-green-500/80"
                                              }`}
                                            >
                                              {st.availableSeats ?? st.available_seats ?? 0}/{st.room?.totalSeats ?? st.room?.total_seats ?? 0} ghế
                                            </span>
                                          </Link>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-10 bg-[#1a1a1a] rounded-xl border border-dashed border-[#333] text-gray-500 font-medium">
                        Không có lịch chiếu cho khu vực này.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#222] text-gray-400 p-6 rounded-xl border border-[#333] text-center flex flex-col items-center">
                <Ticket className="w-12 h-12 mb-3 text-gray-600 opacity-50" />
                <p className="font-medium text-lg text-white">
                  Hiện chưa có lịch chiếu cho phim này.
                </p>
                <p className="text-gray-500 mt-1">Vui lòng quay lại sau!</p>
              </div>
            )}
          </section>

          {/* REVIEWS SECTION */}
          {/* REVIEWS SECTION */}
          <section>
            <h2 className="text-2xl font-bold mb-6 text-white border-l-4 border-[#E50914] pl-2 flex items-center">
              Khách Hàng Đánh Giá
            </h2>

            <div className="bg-[#222] rounded-xl border border-[#333] overflow-hidden">
              {/* KHU VỰC THỐNG KÊ & BỘ LỌC */}
              {totalReviews > 0 && (
                <div className="p-6 md:p-8 border-b border-[#333] bg-[#1a1a1a] flex flex-col md:flex-row items-center gap-8">
                  <div className="flex flex-col items-center justify-center min-w-[120px]">
                    <span className="text-5xl font-black text-white mb-2">
                      {avgRating}{" "}
                      <span className="text-2xl text-gray-500">/ 5</span>
                    </span>
                    <div className="flex text-[#E50914] mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${i < Math.round(avgRating) ? "fill-current" : "text-[#444]"}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-400 font-medium">
                      {totalReviews} đánh giá
                    </span>
                  </div>

                  <div className="flex-1 flex flex-wrap justify-center md:justify-start gap-3 w-full">
                    <button
                      onClick={() => setFilterRating("ALL")}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors border ${filterRating === "ALL" ? "bg-[#E50914] text-white border-[#E50914]" : "bg-[#111] text-gray-400 border-[#444] hover:border-[#E50914] hover:text-white"}`}
                    >
                      Tất cả
                    </button>
                    {[5, 4, 3, 2, 1].map((star) => (
                      <button
                        key={star}
                        onClick={() => setFilterRating(star)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center transition-colors border ${filterRating === star ? "bg-[#E50914] text-white border-[#E50914]" : "bg-[#111] text-gray-400 border-[#444] hover:border-[#E50914] hover:text-white"}`}
                      >
                        {star}{" "}
                        <Star
                          className={`w-3.5 h-3.5 ml-1.5 ${filterRating === star ? "fill-current" : ""}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Form Viết/Cập nhật Đánh giá */}
              <div className="p-6 border-b border-[#333] bg-[#1a1a1a]">
                {user ? (
                  <form onSubmit={handleSubmitReview}>
                    <h3 className="text-white font-bold mb-4 flex items-center">
                      {isUpdating ? (
                        <Edit3 className="w-5 h-5 mr-2 text-[#E50914]" />
                      ) : null}
                      {isUpdating
                        ? "Cập nhật đánh giá của bạn"
                        : "Chia sẻ cảm nhận của bạn"}
                    </h3>

                    {reviewStatus.error && (
                      <div className="mb-4 bg-red-900/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm font-medium">
                        {reviewStatus.error}
                      </div>
                    )}
                    {reviewStatus.success && (
                      <div className="mb-4 bg-green-900/20 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg text-sm font-medium">
                        {reviewStatus.success}
                      </div>
                    )}

                    <div className="flex space-x-2 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          onClick={() =>
                            setReviewForm({ ...reviewForm, rating: star })
                          }
                          className={`w-8 h-8 cursor-pointer transition-colors ${
                            reviewForm.rating >= star
                              ? "text-[#E50914] fill-current"
                              : "text-[#444] hover:text-[#E50914]/50"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="relative">
                      <textarea
                        rows="3"
                        value={reviewForm.comment}
                        onChange={(e) =>
                          setReviewForm({
                            ...reviewForm,
                            comment: e.target.value,
                          })
                        }
                        placeholder="Phim hay không? Kỹ xảo thế nào? Hãy cho mọi người biết nhé... (Không bắt buộc)"
                        className="w-full bg-[#111] text-white border border-[#333] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] transition-colors resize-none pb-14"
                      ></textarea>

                      <button
                        type="submit"
                        disabled={reviewStatus.loading}
                        className={`absolute bottom-3 right-3 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center text-sm font-bold shadow-md ${isUpdating ? "bg-[#b81d24] hover:bg-[#E50914]" : "bg-[#E50914] hover:bg-[#F40612]"}`}
                      >
                        {isUpdating ? "Cập nhật" : "Gửi"}{" "}
                        <Send className="w-4 h-4 ml-2" />
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-6">
                    <MessageSquare className="w-12 h-12 text-[#444] mx-auto mb-3" />
                    <p className="text-gray-400 mb-4">
                      Vui lòng đăng nhập và mua vé để tham gia đánh giá phim.
                    </p>
                    <Link
                      to="/login"
                      className="inline-block bg-[#E50914] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#F40612] transition-colors text-sm"
                    >
                      Đăng nhập ngay
                    </Link>
                  </div>
                )}
              </div>

              {/* Danh sách Đánh giá */}
              <div className="p-6 divide-y divide-[#333]">
                {filteredReviews.length > 0 ? (
                  filteredReviews.map((review) => (
                    <div
                      key={review.id}
                      className={`py-6 first:pt-0 last:pb-0 ${user && user.id === (review.userId ?? review.user_id) ? "bg-[#1a1a1a] -mx-6 px-6 border-l-2 border-[#E50914]" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black uppercase border ${user && user.id === (review.userId ?? review.user_id) ? "bg-[#E50914] border-[#E50914]" : "bg-[#111] border-[#444]"}`}
                          >
                            {review.user?.name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <h4 className="text-white font-bold text-sm">
                              {review.user?.name || "Thành viên"}
                              {user && user.id === (review.userId ?? review.user_id) && (
                                <span className="ml-2 text-[10px] bg-[#E50914]/10 text-[#E50914] px-2 py-0.5 rounded-full border border-[#E50914]/30">
                                  Đánh giá của bạn
                                </span>
                              )}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {review.createdAt || review.created_at
                                ? new Date(review.createdAt || review.created_at).toLocaleDateString("vi-VN")
                                : "Vừa xong"}
                            </span>
                          </div>
                        </div>
                        <div className="flex bg-[#111] px-2 py-1 rounded-full border border-[#333]">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${i < review.rating ? "text-[#E50914] fill-current" : "text-[#444]"}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed font-light">
                        {review.comment || (
                          <span className="italic text-gray-500">
                            Khách hàng chỉ đánh giá sao, không để lại bình luận.
                          </span>
                        )}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 italic">
                    {filterRating === "ALL"
                      ? "Chưa có đánh giá nào cho phim này. Bạn hãy là người đầu tiên nhé!"
                      : `Chưa có đánh giá ${filterRating} sao nào cho phim này.`}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Trailer Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-[#222] p-6 rounded-xl border border-[#333] hidden lg:block sticky top-24">
            <h3 className="text-xl font-bold mb-4 text-white border-l-4 border-[#E50914] pl-2">
              Trailer
            </h3>
            {renderTrailer()}
          </div>
        </div>
      </div>
    </div>
  );
}
