import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/api";
import toast from "react-hot-toast";
import {
  KeyRound, Mail, CheckCircle2, ArrowLeft, Eye, EyeOff,
} from "lucide-react";

const OTP_COOLDOWN = 60; // giây

export default function ForgotPasswordPage() {
  // ── Step 1: nhập email ───────────────────────────────────────────────
  const [step, setStep]     = useState(1);
  const [email, setEmail]   = useState("");

  // ── Step 2: OTP 6 ô + mật khẩu mới ──────────────────────────────────
  const [otp, setOtp]               = useState(["", "", "", "", "", ""]);
  const otpRefs                     = useRef([]);
  const [countdown, setCountdown]   = useState(0);
  const [password, setPassword]     = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPass, setShowPass]     = useState(false);

  // ── Trạng thái chung ─────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState("");
  const navigate              = useNavigate();

  // ── Countdown timer ───────────────────────────────────────────────────
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // ── Bước 1: Gửi OTP ──────────────────────────────────────────────────
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/forgot-password", { email });
      toast.success("Mã OTP đã được gửi đến email của bạn!");
      setStep(2);
      setCountdown(OTP_COOLDOWN);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.errors?.email?.[0] ||
        "Có lỗi xảy ra. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Gửi lại OTP ──────────────────────────────────────────────────────
  const handleResendOTP = async () => {
    if (countdown > 0) return;
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/forgot-password", { email });
      toast.success("Đã gửi lại mã OTP!");
      setOtp(["", "", "", "", "", ""]);
      setCountdown(OTP_COOLDOWN);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.response?.data?.message || "Gửi lại mã thất bại.");
    } finally {
      setLoading(false);
    }
  };

  // ── Xử lý nhập OTP ───────────────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    const next = [...otp];
    for (let i = 0; i < 6; i++) next[i] = text[i] || "";
    setOtp(next);
    otpRefs.current[Math.min(text.length, 5)]?.focus();
  };

  // ── Bước 2: Đặt lại mật khẩu ─────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length < 6) {
      return setError("Vui lòng nhập đủ 6 số OTP.");
    }
    if (password !== passwordConfirm) {
      return setError("Mật khẩu xác nhận không khớp.");
    }
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/reset-password", {
        email,
        token: otpString,      // backend nhận field "token" (giữ nguyên tên)
        password,
        password_confirmation: passwordConfirm,
      });
      setSuccess(true);
      toast.success("Đặt lại mật khẩu thành công!");
    } catch (err) {
      const errs = err.response?.data?.errors;
      if (errs) {
        setError(Object.values(errs).flat().join(" "));
      } else {
        setError(err.response?.data?.message || "Mã OTP không hợp lệ.");
      }
      // Reset OTP để nhập lại
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────
  // Màn hình thành công
  // ─────────────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="relative min-h-screen flex items-center justify-center lg:justify-between lg:px-24 bg-gradient-to-br from-[#141414] via-[#1f1f1f] to-[#0a0a0a] px-4 overflow-hidden">
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
              Đăng ký tài khoản để đặt vé trực tuyến, mua bắp nước tiện lợi, tích lũy điểm thưởng thành viên và nhận hàng ngàn chương trình khuyến mãi đặc quyền.
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

        <div className="relative max-w-md w-full bg-black/40 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/10 z-10 hover:shadow-red-900/10 transition-all duration-300 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-900/30 border border-green-900/50 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider">
            Đặt lại mật khẩu thành công!
          </h2>
          <p className="text-gray-400 text-sm">
            Mật khẩu của bạn đã được cập nhật. Hãy đăng nhập lại.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center text-[#E50914] hover:text-[#F40612] font-bold mt-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────
  // RENDER STEP 1 — Nhập email
  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen flex items-center justify-center lg:justify-between lg:px-24 bg-gradient-to-br from-[#141414] via-[#1f1f1f] to-[#0a0a0a] py-12 px-4 overflow-hidden">
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
            Đăng ký tài khoản để đặt vé trực tuyến, mua bắp nước tiện lợi, tích lũy điểm thưởng thành viên và nhận hàng ngàn chương trình khuyến mãi đặc quyền.
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

      <div className="relative max-w-md w-full bg-black/40 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/10 z-10 hover:shadow-red-900/10 transition-all duration-300 space-y-6">

        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-14 h-14 bg-red-900/20 border border-red-900/30 rounded-full flex items-center justify-center mb-4">
            <KeyRound className="w-8 h-8 text-[#E50914]" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider">
            {step === 1 ? "Quên mật khẩu" : "Đặt lại mật khẩu"}
          </h2>
          <p className="text-gray-400 text-sm mt-2">
            {step === 1
              ? "Nhập email để nhận mã OTP xác nhận."
              : <>Nhập mã OTP gửi đến <strong className="text-[#E50914]">{email}</strong></>
            }
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-900/20 border border-red-900/50 px-4 py-3 text-sm text-red-400 font-medium">
            {error}
          </div>
        )}

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Email tài khoản</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-10 w-full bg-[#222] text-white border border-[#444] rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] outline-none transition text-sm"
                />
              </div>
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full bg-[#E50914] hover:bg-[#F40612] text-white font-bold py-3 px-4 rounded-lg shadow-lg transition disabled:opacity-50 uppercase tracking-wider mt-2"
            >
              {loading ? "Đang gửi..." : "Gửi mã OTP"}
            </button>
            <div className="text-center">
              <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center font-medium">
                <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại đăng nhập
              </Link>
            </div>
          </form>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-5">

            {/* 6 ô OTP */}
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-3 text-center">
                Mã OTP (6 chữ số)
              </label>
              <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => (otpRefs.current[index] = el)}
                    type="text" inputMode="numeric" maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(index, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(index, e)}
                    className={`w-11 h-13 text-center text-2xl font-black rounded-lg border-2 bg-[#222] text-white outline-none transition-all
                      ${digit ? 'border-[#E50914] text-[#E50914]' : 'border-[#444]'}
                      focus:border-[#E50914] focus:ring-2 focus:ring-[#E50914]/30`}
                  />
                ))}
              </div>
            </div>

            {/* Mật khẩu mới */}
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Mật khẩu mới</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  required minLength={6} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full bg-[#222] text-white border border-[#444] rounded-lg px-4 py-2.5 pr-10 focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] outline-none transition text-sm"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Xác nhận mật khẩu */}
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Xác nhận mật khẩu</label>
              <input
                type={showPass ? "text" : "password"}
                required value={passwordConfirm}
                onChange={e => setPasswordConfirm(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                className="w-full bg-[#222] text-white border border-[#444] rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] outline-none transition text-sm"
              />
            </div>

            <button
              type="submit" disabled={loading || otp.join("").length < 6}
              className="w-full bg-[#E50914] hover:bg-[#F40612] text-white font-bold py-3 px-4 rounded-lg shadow-lg transition disabled:opacity-50 uppercase tracking-wider"
            >
              {loading ? "Đang cập nhật..." : "Đặt lại mật khẩu"}
            </button>

            {/* Gửi lại OTP với countdown */}
            <div className="text-center">
              {countdown > 0 ? (
                <p className="text-gray-500 text-sm">
                  Gửi lại mã sau <strong className="text-white">{countdown}s</strong>
                </p>
              ) : (
                <button
                  type="button" onClick={handleResendOTP} disabled={loading}
                  className="text-sm text-[#E50914] hover:text-[#F40612] font-medium transition-colors disabled:opacity-50"
                >
                  Gửi lại mã OTP
                </button>
              )}
            </div>

            {/* Thử email khác */}
            <button
              type="button"
              onClick={() => { setStep(1); setError(""); setOtp(["", "", "", "", "", ""]); }}
              className="w-full text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Thử email khác
            </button>

          </form>
        )}
      </div>
    </div>
  );
}
