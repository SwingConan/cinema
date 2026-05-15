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
    <footer className="bg-black border-t border-[#333] pt-16 pb-8 mt-auto relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Cột 1: Thông tin thương hiệu */}
          <div className="space-y-4">
            <Link
              to="/"
              className="text-3xl font-black tracking-widest text-[#E50914] uppercase drop-shadow-md flex items-center"
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
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Facebook size={20} />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Instagram size={20} />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Twitter size={20} />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-[#E50914] transition-colors"
              >
                <Youtube size={20} />
              </a>
            </div>
          </div>

          {/* Cột 2: Phim hay */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4 border-l-4 border-[#E50914] pl-3 uppercase tracking-wider">
              Phim Hay
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link
                  to="/movies/list/now-showing"
                  className="hover:text-white transition-colors"
                >
                  Phim Đang Chiếu
                </Link>
              </li>
              <li>
                <Link
                  to="/movies/list/coming-soon"
                  className="hover:text-white transition-colors"
                >
                  Phim Sắp Chiếu
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: Hỗ trợ */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4 border-l-4 border-[#E50914] pl-3 uppercase tracking-wider">
              Hỗ Trợ
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Câu hỏi thường gặp (FAQ)
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Điều khoản dịch vụ
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Hướng dẫn đặt vé
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 4: Liên hệ */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4 border-l-4 border-[#E50914] pl-3 uppercase tracking-wider">
              Liên Hệ
            </h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start">
                <MapPin
                  size={18}
                  className="mr-2 text-[#E50914] flex-shrink-0 mt-0.5"
                />
                <span>12 Nguyễn Văn Bảo, Phường 4, Gò Vấp, TP.HCM</span>
              </li>
              <li className="flex items-center">
                <Phone
                  size={18}
                  className="mr-2 text-[#E50914] flex-shrink-0"
                />
                <span>032 911 0917</span>
              </li>
              <li className="flex items-center">
                <Mail size={18} className="mr-2 text-[#E50914] flex-shrink-0" />
                <span>loivale.ag@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#333] pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 font-medium">
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
