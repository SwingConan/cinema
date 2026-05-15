import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#141414] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-[#1a1a1a] p-8 rounded-xl shadow-2xl border border-[#333]">
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
