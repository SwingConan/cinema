import { Link } from "react-router-dom";
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Film,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-[#141414] to-black border-t border-white/5 pt-16 pb-8 mt-auto relative z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Cột 1: Thông tin thương hiệu */}
          <div className="space-y-4">
            <Link
              to="/"
              className="text-3xl font-black tracking-widest text-[#E50914] uppercase drop-shadow-md flex items-center hover:drop-shadow-[0_0_8px_rgba(229,9,20,0.6)] transition-all duration-300"
            >
              <Film className="mr-2" size={28} /> CinemaMS
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Hệ thống đặt vé xem phim trực tuyến thời gian thực. Mang đến trải
              nghiệm điện ảnh đỉnh cao với chất lượng dịch vụ hoàn hảo nhất dành
              cho bạn.
            </p>
            <div className="flex space-x-4 pt-2">
              <a
                href="https://www.facebook.com/SwingConan?locale=vi_VN"
                target="_blank"
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-[#E50914] hover:border-transparent hover:shadow-[0_0_15px_rgba(229,9,20,0.5)] flex items-center justify-center transition-all duration-300 transform hover:-translate-y-1"
              >
                <Facebook size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-[#E50914] hover:border-transparent hover:shadow-[0_0_15px_rgba(229,9,20,0.5)] flex items-center justify-center transition-all duration-300 transform hover:-translate-y-1"
              >
                <Instagram size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-[#E50914] hover:border-transparent hover:shadow-[0_0_15px_rgba(229,9,20,0.5)] flex items-center justify-center transition-all duration-300 transform hover:-translate-y-1"
              >
                <Twitter size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-[#E50914] hover:border-transparent hover:shadow-[0_0_15px_rgba(229,9,20,0.5)] flex items-center justify-center transition-all duration-300 transform hover:-translate-y-1"
              >
                <Youtube size={18} />
              </a>
            </div>
          </div>

          {/* Cột 2: Phim hay */}
          <div>
            <h3 className="text-white font-bold text-lg mb-5 border-l-4 border-[#E50914] pl-3 uppercase tracking-wider drop-shadow-[0_0_5px_rgba(229,9,20,0.3)]">
              Phim Hay
            </h3>
            <ul className="space-y-3 text-sm text-gray-400 font-medium">
              <li>
                <Link
                  to="/movies/list/now-showing"
                  className="inline-block hover:text-white hover:translate-x-1.5 transition-all duration-200"
                >
                  Phim Đang Chiếu
                </Link>
              </li>
              <li>
                <Link
                  to="/movies/list/coming-soon"
                  className="inline-block hover:text-white hover:translate-x-1.5 transition-all duration-200"
                >
                  Phim Sắp Chiếu
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: Hỗ trợ */}
          <div>
            <h3 className="text-white font-bold text-lg mb-5 border-l-4 border-[#E50914] pl-3 uppercase tracking-wider drop-shadow-[0_0_5px_rgba(229,9,20,0.3)]">
              Hỗ Trợ
            </h3>
            <ul className="space-y-3 text-sm text-gray-400 font-medium">
              <li>
                <Link to="/" className="inline-block hover:text-white hover:translate-x-1.5 transition-all duration-200">
                  Câu hỏi thường gặp (FAQ)
                </Link>
              </li>
              <li>
                <Link to="/" className="inline-block hover:text-white hover:translate-x-1.5 transition-all duration-200">
                  Điều khoản dịch vụ
                </Link>
              </li>
              <li>
                <Link to="/" className="inline-block hover:text-white hover:translate-x-1.5 transition-all duration-200">
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link to="/" className="inline-block hover:text-white hover:translate-x-1.5 transition-all duration-200">
                  Hướng dẫn đặt vé
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 4: Liên hệ */}
          <div>
            <h3 className="text-white font-bold text-lg mb-5 border-l-4 border-[#E50914] pl-3 uppercase tracking-wider drop-shadow-[0_0_5px_rgba(229,9,20,0.3)]">
              Liên Hệ
            </h3>
            <ul className="space-y-3 text-sm text-gray-400 font-medium">
              <li className="flex items-start hover:text-white hover:translate-x-1 transition-all duration-200">
                <MapPin
                  size={18}
                  className="mr-2 text-[#E50914] flex-shrink-0 mt-0.5"
                />
                <span>12 Nguyễn Văn Bảo, Phường 4, Gò Vấp, TP.HCM</span>
              </li>
              <li className="flex items-center hover:text-white hover:translate-x-1 transition-all duration-200">
                <Phone
                  size={18}
                  className="mr-2 text-[#E50914] flex-shrink-0"
                />
                <span>032 911 0917</span>
              </li>
              <li className="flex items-center hover:text-white hover:translate-x-1 transition-all duration-200">
                <Mail size={18} className="mr-2 text-[#E50914] flex-shrink-0" />
                <span>loivale.ag@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 font-medium">
          <p>
            &copy; {new Date().getFullYear()} CinemaMS. Tất cả các quyền được
            bảo lưu.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <span>Đồ án chuyên ngành Hệ thống thông tin</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
