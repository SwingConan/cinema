import { useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const status = searchParams.get("status");
  const bookingId = searchParams.get("booking");

  useEffect(() => {
    if (!status) {
      navigate("/");
    }
  }, [status, navigate]);

  const isSuccess = status === "success";

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#141414] flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden border border-[#333] p-8 text-center space-y-6 transform transition-all">
        {isSuccess ? (
          <>
            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-900/30 mb-4 border border-green-900/50">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <h2 className="text-3xl font-black text-white uppercase tracking-wider">
              Thanh Toán Thành Công!
            </h2>
            <p className="text-gray-400 text-lg">
              Cảm ơn bạn đã lựa chọn sử dụng dịch vụ của CinemaMS.
              <br />
              Mã Đơn Hàng (Booking ID):{" "}
              <strong className="text-white">#{bookingId}</strong>
            </p>

            <div className="bg-green-900/20 text-green-400 p-4 rounded-lg text-sm mb-6 border border-green-900/50">
              Vui lòng xuất trình mã đơn hàng này hoặc QR Code ở rạp để lấy vé
              cứng. Bạn có thể xem lại thông tin vé trong mục "Lịch Sử Đặt Vé".
            </div>

            <div className="flex flex-col space-y-3 pt-6 border-t border-[#333]">
              {/* In a fuller app, this would route to /profile/bookings */}
              <Link
                to="/profile"
                state={{ activeTab: "history" }} // <-- THÊM DÒNG NÀY ĐỂ TRUYỀN TÍN HIỆU
                className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent shadow-lg text-sm font-bold rounded-xl text-white bg-[#E50914] hover:bg-[#F40612] transition-colors"
              >
                Xem lịch sử đặt vé <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                to="/"
                className="w-full inline-flex justify-center px-4 py-3 border border-[#444] shadow-sm text-sm font-bold rounded-xl text-gray-300 bg-[#222] hover:bg-[#333] focus:outline-none transition-colors"
              >
                Về trang chủ
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-900/30 mb-4 border border-red-900/50">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
            <h2 className="text-3xl font-black text-white uppercase tracking-wider">
              Thanh Toán Thất Bại
            </h2>
            <p className="text-gray-400 text-lg">
              Rất tiếc, giao dịch của bạn đã bị từ chối hoặc có lỗi xảy ra.
              <br />
              Mã Đơn Hàng: <strong className="text-white">#{bookingId}</strong>
            </p>

            <div className="bg-red-900/20 text-red-400 p-4 rounded-lg text-sm mb-6 border border-red-900/50">
              Ghế ngồi mà bạn chọn đã được hệ thống tự động giải phóng. Vui lòng
              kiểm tra lại thẻ/tài khoản và thử lại.
            </div>

            <div className="flex flex-col space-y-3 pt-6 border-t border-[#333]">
              <Link
                to="/"
                className="w-full inline-flex justify-center px-4 py-3 border border-transparent shadow-lg text-sm font-bold rounded-xl text-white bg-[#E50914] hover:bg-[#F40612] transition-colors uppercase tracking-wider"
              >
                Thử đặt lại vé khác
              </Link>
              <Link
                to="/"
                className="w-full inline-flex justify-center px-4 py-3 border border-[#444] shadow-sm text-sm font-bold rounded-xl text-gray-300 bg-[#222] hover:bg-[#333] transition-colors"
              >
                Về trang chủ
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
