import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Mail, User, Phone, Lock, Eye, EyeOff, ArrowLeft, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

// Thời gian countdown giữa 2 lần gửi OTP (giây)
const OTP_COOLDOWN = 60;

export default function RegisterPage() {
  // ── Step 1: Thông tin cá nhân ────────────────────────────────────────
  const [step, setStep]           = useState(1);
  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");
  const [password, setPassword]   = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPass, setShowPass]   = useState(false);

  // ── Step 2: OTP ──────────────────────────────────────────────────────
  const [otp, setOtp]             = useState(["", "", "", "", "", ""]);
  const otpRefs                   = useRef([]);  // refs cho 6 ô input
  const [countdown, setCountdown] = useState(0); // countdown "Gửi lại"

  // ── Trạng thái chung ─────────────────────────────────────────────────
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  const { sendVerificationOTP, verifyAndRegister } = useAuth();
  const navigate = useNavigate();

  // ── Countdown timer ───────────────────────────────────────────────────
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // ── Bước 1: Gửi OTP ──────────────────────────────────────────────────
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== passwordConfirm) {
      return setError("Mật khẩu xác nhận không khớp.");
    }
    setLoading(true);
    try {
      await sendVerificationOTP({ name, email, phone, password });
      toast.success("Mã OTP đã được gửi đến email của bạn!");
      setStep(2);
      setCountdown(OTP_COOLDOWN);
      // Focus vào ô OTP đầu tiên
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.response?.data?.message || "Gửi mã thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // ── Gửi lại OTP ──────────────────────────────────────────────────────
  const handleResendOTP = async () => {
    if (countdown > 0) return;
    setError("");
    setLoading(true);
    try {
      await sendVerificationOTP({ name, email, phone, password });
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

  // ── Nhập OTP: tự động focus ô tiếp theo ─────────────────────────────
  const handleOtpChange = (index, value) => {
    // Chỉ cho phép số
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    // Auto-focus sang ô tiếp theo
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    // Cho phép paste
    if (e.key === "v" && (e.ctrlKey || e.metaKey)) return;
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = text[i] || "";
    }
    setOtp(newOtp);
    // Focus vào ô cuối cùng có giá trị
    const lastIdx = Math.min(text.length, 5);
    otpRefs.current[lastIdx]?.focus();
  };

  // ── Bước 2: Xác nhận OTP ─────────────────────────────────────────────
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length < 6) {
      return setError("Vui lòng nhập đủ 6 số OTP.");
    }
    setError("");
    setLoading(true);
    try {
      await verifyAndRegister({ email, otp: otpString });
      toast.success("Đăng ký thành công!");
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Mã OTP không hợp lệ. Vui lòng thử lại.");
      // Xóa OTP để nhập lại
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────
  // RENDER: STEP 1 — Form đăng ký
  // ─────────────────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#141414] py-12 px-4">
        <div className="max-w-md w-full space-y-8 bg-[#1a1a1a] p-8 rounded-xl shadow-2xl border border-[#333]">
          <div>
            <h2 className="mt-6 text-center text-3xl font-black text-white uppercase tracking-wider">
              Đăng ký tài khoản
            </h2>
            <p className="text-center text-gray-500 text-sm mt-2">
              Nhập thông tin để nhận mã xác thực qua email
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-900/20 border border-red-900/50 p-4">
              <p className="text-sm text-red-400 font-medium">{error}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSendOTP}>
            {/* Họ và tên */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type="text" required value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Họ và tên"
                className="pl-10 w-full bg-[#222] text-white border border-[#444] rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] text-sm transition-colors"
              />
            </div>

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email"
                className="pl-10 w-full bg-[#222] text-white border border-[#444] rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] text-sm transition-colors"
              />
            </div>

            {/* Số điện thoại */}
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type="text" value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Số điện thoại (tùy chọn)"
                className="pl-10 w-full bg-[#222] text-white border border-[#444] rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] text-sm transition-colors"
              />
            </div>

            {/* Mật khẩu */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type={showPass ? "text" : "password"} required minLength={8}
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Mật khẩu (tối thiểu 8 ký tự)"
                className="pl-10 pr-10 w-full bg-[#222] text-white border border-[#444] rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] text-sm transition-colors"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Xác nhận mật khẩu */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type={showPass ? "text" : "password"} required
                value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)}
                placeholder="Xác nhận mật khẩu"
                className="pl-10 w-full bg-[#222] text-white border border-[#444] rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] text-sm transition-colors"
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-md text-white bg-[#E50914] hover:bg-[#F40612] focus:outline-none uppercase tracking-wider transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Đang gửi mã..." : "Gửi mã xác thực"}
            </button>

            <div className="text-sm text-center">
              <span className="text-gray-500">Đã có tài khoản? </span>
              <Link to="/login" className="font-bold text-[#E50914] hover:text-[#F40612] transition-colors">
                Đăng nhập
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────
  // RENDER: STEP 2 — Nhập OTP
  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#141414] py-12 px-4">
      <div className="max-w-md w-full bg-[#1a1a1a] p-8 rounded-xl shadow-2xl border border-[#333] space-y-6">

        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-14 h-14 bg-green-900/20 border border-green-900/40 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider">Xác thực email</h2>
          <p className="text-gray-400 text-sm mt-2 leading-relaxed">
            Mã OTP gồm <strong className="text-white">6 chữ số</strong> đã được gửi đến
            <br />
            <strong className="text-[#E50914]">{email}</strong>
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-md bg-red-900/20 border border-red-900/50 p-3">
            <p className="text-sm text-red-400 font-medium text-center">{error}</p>
          </div>
        )}

        {/* Form OTP */}
        <form onSubmit={handleVerifyOTP} className="space-y-6">
          {/* 6 ô OTP */}
          <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => (otpRefs.current[index] = el)}
                type="text" inputMode="numeric" maxLength={1}
                value={digit}
                onChange={e => handleOtpChange(index, e.target.value)}
                onKeyDown={e => handleOtpKeyDown(index, e)}
                className={`w-12 h-14 text-center text-2xl font-black rounded-lg border-2 bg-[#222] text-white outline-none transition-all
                  ${digit ? 'border-[#E50914] text-[#E50914]' : 'border-[#444]'}
                  focus:border-[#E50914] focus:ring-2 focus:ring-[#E50914]/30`}
              />
            ))}
          </div>

          {/* Nút xác nhận */}
          <button
            type="submit" disabled={loading || otp.join("").length < 6}
            className="w-full py-3 px-4 text-sm font-bold rounded-md text-white bg-[#E50914] hover:bg-[#F40612] uppercase tracking-wider transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Đang xác thực..." : "Xác nhận & Tạo tài khoản"}
          </button>
        </form>

        {/* Gửi lại OTP */}
        <div className="text-center">
          {countdown > 0 ? (
            <p className="text-gray-500 text-sm">
              Gửi lại mã sau <strong className="text-white">{countdown}s</strong>
            </p>
          ) : (
            <button
              onClick={handleResendOTP} disabled={loading}
              className="text-sm text-[#E50914] hover:text-[#F40612] font-medium transition-colors disabled:opacity-50"
            >
              Gửi lại mã OTP
            </button>
          )}
        </div>

        {/* Quay lại */}
        <div className="text-center">
          <button
            onClick={() => { setStep(1); setError(""); setOtp(["", "", "", "", "", ""]); }}
            className="text-sm text-gray-500 hover:text-white transition-colors flex items-center justify-center gap-1 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" /> Thay đổi thông tin đăng ký
          </button>
        </div>

      </div>
    </div>
  );
}
