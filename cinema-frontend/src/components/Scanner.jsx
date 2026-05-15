// src/components/Scanner.jsx
// =============================================
// Camera QR Scanner Component
// Sử dụng Html5QrcodeScanner của html5-qrcode.
// - Quét được bằng Camera thiết bị (webcam / camera điện thoại)
// - Chống spam: sau khi bắt được mã, tạm dừng 2.5 giây rồi mới quét tiếp
// - Cleanup camera khi unmount để tắt đèn xanh webcam
// =============================================
import { useEffect, useRef, useCallback } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';

const SCANNER_ID = 'html5qr-scanner-region';

export default function Scanner({ onScanSuccess, onScanError }) {
  const scannerRef = useRef(null);
  const cooldownRef = useRef(false);

  const handleSuccess = useCallback((decodedText) => {
    if (cooldownRef.current) return; // Chống spam khi quét liên tục
    cooldownRef.current = true;

    onScanSuccess(decodedText);

    // Sau 2.5 giây mới cho phép quét lại
    setTimeout(() => {
      cooldownRef.current = false;
    }, 2500);
  }, [onScanSuccess]);

  useEffect(() => {
    // Delay nhỏ để DOM render xong element #SCANNER_ID
    const timer = setTimeout(() => {
      if (scannerRef.current) return; // Đã khởi tạo rồi, bỏ qua

      const scanner = new Html5QrcodeScanner(
        SCANNER_ID,
        {
          fps: 12,                // 12 frame/giây — đủ nhanh, không ngốn CPU
          qrbox: { width: 250, height: 250 }, // Khung nhắm mục tiêu
          rememberLastUsedCamera: true,
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          showTorchButtonIfSupported: true,   // Đèn flash (mobile)
          videoConstraints: { facingMode: 'environment' }, // Ưu tiên camera sau (mobile)
        },
        /* verbose= */ false
      );

      scanner.render(
        handleSuccess,
        (errorMessage) => {
          // Bỏ qua lỗi "no QR" thông thường, chỉ report lỗi thật
          if (!errorMessage?.includes('No QR code found')) {
            onScanError?.(errorMessage);
          }
        }
      );

      scannerRef.current = scanner;
    }, 100);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [handleSuccess, onScanError]);

  return (
    <div className="relative">
      {/* Khu vực Camera render vào đây */}
      <div id={SCANNER_ID} className="w-full" />

      {/* Overlay hướng dẫn — đặt phía trên camera feed */}
      <div className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none">
        <p className="bg-black/60 text-white text-xs font-bold px-3 py-1 rounded-b-lg tracking-wider uppercase">
          📷 Đưa mã QR vào khung hình
        </p>
      </div>
    </div>
  );
}
