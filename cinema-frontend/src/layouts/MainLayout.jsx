import { Outlet, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LogOut, User as UserIcon, ChevronDown, Ticket } from "lucide-react";
import Footer from "../components/Footer";

export default function MainLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-[#141414] text-[#e5e5e5] font-sans selection:bg-[#E50914] selection:text-white">
      <nav className="bg-black/80 backdrop-blur-md sticky top-0 z-50 border-b border-[#333]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <div className="flex-shrink-0 flex items-center">
                <Link
                  to="/"
                  className="text-3xl font-black tracking-widest text-[#E50914] uppercase drop-shadow-md"
                >
                  CinemaMS
                </Link>
              </div>

              {/* MENU CHÍNH */}
              <div className="hidden sm:flex sm:items-center sm:space-x-8">
                <Link
                  to="/"
                  className="text-gray-300 hover:text-white transition-colors duration-200 text-sm font-bold uppercase tracking-wider"
                >
                  Trang chủ
                </Link>

                {/* DROPDOWN PHIM */}
                <div className="relative group h-full flex items-center">
                  <button className="text-gray-300 group-hover:text-white transition-colors duration-200 text-sm font-bold uppercase tracking-wider flex items-center focus:outline-none">
                    Phim{" "}
                    <ChevronDown className="w-4 h-4 ml-1 transition-transform group-hover:rotate-180" />
                  </button>

                  {/* MENU CON (Ẩn mặc định, hiện khi hover) */}
                  <div className="absolute top-full left-0 mt-0 w-48 bg-[#1a1a1a] border border-[#333] rounded-b-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-left -translate-y-2 group-hover:translate-y-0 z-50 overflow-hidden">
                    <Link
                      to="/movies/list/now-showing"
                      className="block px-4 py-3 text-sm font-bold text-gray-300 hover:bg-[#333] hover:text-[#E50914] transition-colors border-b border-[#333]"
                    >
                      Phim Đang Chiếu
                    </Link>
                    <Link
                      to="/movies/list/coming-soon"
                      className="block px-4 py-3 text-sm font-bold text-gray-300 hover:bg-[#333] hover:text-[#E50914] transition-colors"
                    >
                      Phim Sắp Chiếu
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* ... PHẦN USER ĐĂNG NHẬP/ĐĂNG KÝ (GIỮ NGUYÊN NHƯ CŨ) ... */}
            <div className="flex items-center">
              {user ? (
                <div className="flex items-center space-x-4">
                  {/* 🎟️ Vé Của Tôi — Quick Access */}
                  <Link
                    to="/profile"
                    state={{ activeTab: "history" }}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border border-[#E50914]/50 text-[#E50914] hover:bg-[#E50914] hover:text-white transition-all duration-200 shadow-[0_0_10px_rgba(229,9,20,0.2)] hover:shadow-[0_0_16px_rgba(229,9,20,0.5)]"
                  >
                    <Ticket className="h-4 w-4" /> Vé Của Tôi
                  </Link>
                  <Link
                    to="/profile"
                    className="text-sm font-medium text-gray-300 hover:text-white hidden sm:flex items-center transition-colors"
                  >
                    <UserIcon className="h-5 w-5 mr-2" /> {user.name}
                  </Link>
                  {user.role === "admin" && (
                    <Link
                      to="/admin"
                      className="text-sm font-medium text-blue-400 hover:text-blue-300"
                    >
                      Admin Panel
                    </Link>
                  )}
                  {user.role === "staff" && (
                    <div className="flex items-center space-x-4">
                      <Link
                        to="/staff"
                        className="text-sm font-medium text-green-400 hover:text-green-300"
                      >
                        Soát Vé
                      </Link>
                      <Link
                        to="/staff/pos"
                        className="text-sm font-medium text-amber-400 hover:text-amber-300"
                      >
                        POS Bán Vé
                      </Link>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          "Bạn có chắc chắn muốn thoát khỏi phiên đăng nhập?",
                        )
                      ) {
                        logout();
                      }
                    }}
                    className="inline-flex items-center px-4 py-1.5 border border-[#333] text-xs font-bold rounded text-white bg-transparent hover:bg-[#222] transition-all focus:outline-none"
                  >
                    <LogOut className="h-4 w-4 mr-1.5" /> Thoát
                  </button>
                </div>
              ) : (
                <div className="space-x-4">
                  <Link
                    to="/login"
                    className="inline-flex items-center text-sm font-medium text-white hover:text-gray-300 transition-colors"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center px-5 py-2 text-sm font-bold rounded text-white bg-[#E50914] hover:bg-[#F40612] transition-colors shadow-lg"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow w-full">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
