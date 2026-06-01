import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(email, password);
      toast.success("Đăng nhập thành công!");
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "staff") navigate("/staff");
      else navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Đăng nhập thất bại.");
    }
  };

  const isAllBranch = true; // placeholder or direct definition if needed, wait, isAllBranch is not defined in this file? Ah, wait, in LoginPage there is no isAllBranch! We will not use isAllBranch here.

  return (
    <div className="relative min-h-screen flex items-center justify-center lg:justify-between lg:px-24 bg-gradient-to-br from-[#141414] via-[#1f1f1f] to-[#0a0a0a] py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-80 pointer-events-none"
        src="/login-bg.mp4"
      />
      {/* Premium horizontal gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-black/80 z-0" />

      {/* Floating Home Button */}
      <Link
        to="/"
        className="absolute top-6 left-6 lg:left-12 flex items-center gap-2 px-4 py-2 bg-black/40 hover:bg-[#E50914] text-white text-xs font-bold rounded-full border border-white/10 hover:border-transparent transition-all duration-300 backdrop-blur-md z-20 shadow-lg cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Quay lại Trang chủ
      </Link>

      {/* Left side welcome branding (Desktop only) */}
      <div className="hidden lg:flex flex-col justify-center flex-1 max-w-xl z-10 space-y-6 text-left select-none pr-8">
        <h1 className="text-red-600 text-6xl font-black tracking-widest drop-shadow-[0_0_20px_rgba(229,9,20,0.5)]">
          CINEMAMS
        </h1>
        <div className="space-y-3">
          <h2 className="text-white text-2xl font-bold uppercase tracking-wider">
            Trải nghiệm điện ảnh đỉnh cao
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed max-w-md">
            Đăng nhập tài khoản để đặt vé trực tuyến, mua bắp nước tiện lợi, tích lũy điểm thưởng thành viên và nhận hàng ngàn chương trình khuyến mãi đặc quyền.
          </p>
        </div>
        <div className="flex items-center gap-6 text-gray-400 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600" /> Đặt vé trực tuyến
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600" /> Tích điểm thành viên
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600" /> Thanh toán tự động
          </div>
        </div>
      </div>

      <div className="relative max-w-md w-full space-y-8 bg-black/40 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/10 z-10 hover:shadow-red-900/10 transition-all duration-300">
        <div>
          <h2 className="mt-6 text-center text-3xl font-black text-white uppercase tracking-wider">
            Đăng nhập
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-900/20 border border-red-900/50 p-4">
              <div className="text-sm text-red-400 font-medium">{error}</div>
            </div>
          )}
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-[#444] bg-[#222] text-white placeholder-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] sm:text-sm transition-colors"
                placeholder="Email address"
              />
            </div>
            <div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-[#444] bg-[#222] text-white placeholder-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] sm:text-sm transition-colors"
                placeholder="Password"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-md text-white bg-[#E50914] hover:bg-[#F40612] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E50914] uppercase tracking-wider transition-colors shadow-lg"
            >
              Đăng nhập
            </button>
          </div>
          <div className="text-sm text-center">
            <span className="text-gray-500">Chưa có tài khoản? </span>
            <Link
              to="/register"
              className="font-bold text-[#E50914] hover:text-[#F40612] transition-colors"
            >
              Đăng ký ngay
            </Link>
          </div>
          <div className="text-sm text-center">
            <Link
              to="/forgot-password"
              className="font-medium text-gray-400 hover:text-white transition-colors"
            >
              Quên mật khẩu?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
