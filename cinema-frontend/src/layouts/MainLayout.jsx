import { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LogOut, User as UserIcon, ChevronDown, Ticket, MapPin, Monitor, Menu, X } from "lucide-react";
import Footer from "../components/Footer";
import NotificationBell from "../components/customer/NotificationBell";
import VoiceBookingAssistant from "../components/customer/VoiceBookingAssistant";
import { useBranch } from "../contexts/BranchContext";

export default function MainLayout() {
  const { user, logout } = useAuth();
  const { branches, selectedBranchId, changeBranch, loadingBranches } = useBranch();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#141414] text-[#e5e5e5] font-sans selection:bg-[#E50914] selection:text-white">
      <nav className="bg-black/65 backdrop-blur-xl sticky top-0 z-50 border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <div className="flex-shrink-0 flex items-center">
                <Link
                  to="/"
                  className="text-3xl font-black tracking-widest text-[#E50914] uppercase drop-shadow-md hover:drop-shadow-[0_0_8px_rgba(229,9,20,0.6)] transition-all duration-300"
                >
                  CinemaMS
                </Link>
              </div>


              {/* MENU CHÍNH (DESKTOP) */}
              <div className="hidden sm:flex sm:items-center sm:space-x-8">
                <Link
                  to="/"
                  className="relative group text-gray-300 hover:text-white transition-all duration-300 text-sm font-bold uppercase tracking-wider py-1"
                >
                  Trang chủ
                  <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#E50914] transition-all duration-300 group-hover:w-full shadow-[0_0_8px_#e50914]" />
                </Link>

                <Link
                  to="/promotions"
                  className="relative group text-gray-300 hover:text-white transition-all duration-300 text-sm font-bold uppercase tracking-wider py-1"
                >
                  Khuyến mãi
                  <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#E50914] transition-all duration-300 group-hover:w-full shadow-[0_0_8px_#e50914]" />
                </Link>

                {/* DROPDOWN PHIM */}
                <div className="relative group h-full flex items-center">
                  <button className="relative py-1 text-gray-300 group-hover:text-white transition-all duration-300 text-sm font-bold uppercase tracking-wider flex items-center focus:outline-none cursor-pointer">
                    Phim{" "}
                    <ChevronDown className="w-4 h-4 ml-1 transition-transform group-hover:rotate-180" />
                    <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#E50914] transition-all duration-300 group-hover:w-full shadow-[0_0_8px_#e50914]" />
                  </button>

                  {/* MENU CON (Ẩn mặc định, hiện khi hover) */}
                  <div className="absolute top-full left-0 mt-0 w-48 bg-black/95 backdrop-blur-xl border border-white/10 border-t-0 rounded-b-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-left -translate-y-2 group-hover:translate-y-0 z-50 overflow-hidden">
                    <Link
                      to="/movies/list/now-showing"
                      className="block px-4 py-3 text-sm font-bold text-gray-300 hover:bg-[#E50914]/15 hover:text-white transition-all duration-250 border-b border-white/5 pl-4 hover:pl-6"
                    >
                      Phim Đang Chiếu
                    </Link>
                    <Link
                      to="/movies/list/coming-soon"
                      className="block px-4 py-3 text-sm font-bold text-gray-300 hover:bg-[#E50914]/15 hover:text-white transition-all duration-250 pl-4 hover:pl-6"
                    >
                      Phim Sắp Chiếu
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* PHẦN USER / CONTROLS */}
            <div className="flex items-center gap-3">
              {/* DESKTOP USER CONTROLS */}
              <div className="hidden sm:flex sm:items-center sm:gap-4">
                {user ? (
                  <>
                    {/* 🎟️ Vé Của Tôi — Quick Access */}
                    <Link
                      to="/profile"
                      state={{ activeTab: "history" }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border border-[#E50914]/50 text-[#E50914] hover:bg-[#E50914] hover:text-white transition-all duration-300 shadow-[0_0_10px_rgba(229,9,20,0.2)] hover:shadow-[0_0_16px_rgba(229,9,20,0.5)] transform hover:scale-[1.03]"
                    >
                      <Ticket className="h-4 w-4" /> Vé Của Tôi
                    </Link>
                    <NotificationBell />
                    <Link
                      to="/profile"
                      className="text-sm font-bold text-gray-300 hover:text-white flex items-center transition-colors duration-250"
                    >
                      <UserIcon className="h-5 w-5 mr-2" /> {user.name}
                    </Link>
                    {user.role === "admin" && (
                      <Link
                        to="/admin"
                        className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Admin Panel
                      </Link>
                    )}
                    {user.role === "staff" && (
                      <Link
                        to="/staff"
                        className="text-sm font-bold text-green-400 hover:text-green-300 flex items-center gap-1.5 transition-colors"
                      >
                        <Monitor className="w-4 h-4" /> Staff Panel
                      </Link>
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
                      className="inline-flex items-center px-4 py-1.5 border border-white/10 hover:border-red-500/30 text-xs font-bold rounded-lg text-white bg-transparent hover:bg-red-500/10 hover:text-red-400 transition-all duration-250 focus:outline-none cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 mr-1.5" /> Thoát
                    </button>
                  </>
                ) : (
                  <div className="space-x-4 flex items-center">
                    <Link
                      to="/login"
                      className="relative group inline-flex items-center text-sm font-bold text-gray-300 hover:text-white transition-all duration-300 py-1"
                    >
                      Đăng nhập
                      <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#E50914] transition-all duration-300 group-hover:w-full shadow-[0_0_8px_#e50914]" />
                    </Link>
                    <Link
                      to="/register"
                      className="inline-flex items-center px-5 py-2 text-sm font-black rounded-lg text-white bg-gradient-to-r from-[#E50914] to-[#B20710] hover:from-[#F40612] hover:to-[#E50914] transition-all duration-300 shadow-[0_0_15px_rgba(229,9,20,0.4)] hover:shadow-[0_0_22px_rgba(229,9,20,0.7)] transform hover:-translate-y-0.5 uppercase tracking-wider"
                    >
                      Đăng ký
                    </Link>
                  </div>
                )}
              </div>

              {/* MOBILE CONTROLS */}
              {user && (
                <div className="block sm:hidden">
                  <NotificationBell />
                </div>
              )}

              {/* Hamburger Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#222] focus:outline-none sm:hidden cursor-pointer"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6 text-white" />
                ) : (
                  <Menu className="h-6 w-6 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE MENU PANEL */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-[#141414] border-t border-[#333] animate-in slide-in-from-top duration-200">
            <div className="px-4 pt-2 pb-6 space-y-3">
              {/* Navigation Links */}
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-bold text-gray-300 hover:bg-[#222] hover:text-white transition-colors"
              >
                Trang chủ
              </Link>
              <Link
                to="/promotions"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-bold text-gray-300 hover:bg-[#222] hover:text-white transition-colors"
              >
                Khuyến mãi
              </Link>
              <Link
                to="/movies/list/now-showing"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-bold text-gray-300 hover:bg-[#222] hover:text-[#E50914] transition-colors"
              >
                Phim Đang Chiếu
              </Link>
              <Link
                to="/movies/list/coming-soon"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-bold text-gray-300 hover:bg-[#222] hover:text-[#E50914] transition-colors"
              >
                Phim Sắp Chiếu
              </Link>

              <div className="border-t border-[#222] my-2 pt-2"></div>

              {user ? (
                <div className="space-y-3">
                  {/* User Profile info */}
                  <div className="px-3 py-1 text-sm text-gray-400 flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-gray-500" />
                    <span>Tài khoản: <strong className="text-white">{user.name}</strong></span>
                  </div>

                  <Link
                    to="/profile"
                    state={{ activeTab: "history" }}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-black uppercase tracking-wider border border-[#E50914]/40 text-[#E50914] hover:bg-[#E50914] hover:text-white transition-all shadow-[0_0_10px_rgba(229,9,20,0.1)]"
                  >
                    <Ticket className="h-4 w-4" /> Vé Của Tôi
                  </Link>

                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-base font-bold text-gray-300 hover:bg-[#222] hover:text-white transition-colors"
                  >
                    Thông tin cá nhân & Bảo mật
                  </Link>

                  {user.role === "admin" && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-lg text-base font-bold text-blue-400 hover:bg-blue-900/20 transition-colors"
                    >
                      Admin Panel
                    </Link>
                  )}

                  {user.role === "staff" && (
                    <Link
                      to="/staff"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-base font-bold text-green-400 hover:bg-green-900/20 transition-colors"
                    >
                      <Monitor className="w-4 h-4" /> Staff Panel
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (
                        window.confirm(
                          "Bạn có chắc chắn muốn thoát khỏi phiên đăng nhập?",
                        )
                      ) {
                        logout();
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-[#333] text-sm font-bold rounded-lg text-white bg-transparent hover:bg-[#E50914]/20 hover:border-[#E50914]/40 transition-all cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" /> Đăng xuất
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center px-4 py-2.5 border border-[#333] text-sm font-bold rounded-lg text-white bg-transparent hover:bg-[#222] transition-colors"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center px-4 py-2.5 text-sm font-bold rounded-lg text-white bg-[#E50914] hover:bg-[#F40612] transition-colors shadow-lg"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      <main className="flex-grow w-full">
        <Outlet />
      </main>

      <Footer />
      <VoiceBookingAssistant />
    </div>
  );
}
