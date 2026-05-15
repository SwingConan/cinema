// src/services/email.service.js
// =============================================
// EMAIL SERVICE — Gửi E-Ticket qua Nodemailer
// Dùng Gmail SMTP với App Password.
// QR Code được render từ UUID string (qr_code
// trong DB) thành ảnh PNG base64 nhúng vào mail.
// =============================================
import nodemailer from 'nodemailer';
import QRCode     from 'qrcode';

// ── Tạo transporter (tái sử dụng, không tạo lại mỗi lần gửi) ───────────
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST || 'smtp.gmail.com',
  port:   Number(process.env.SMTP_PORT) || 465,
  secure: true,           // true cho port 465, false cho 587 (TLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ── Kiểm tra kết nối SMTP khi module load ───────────────────────────────
transporter.verify().then(() => {
  console.log('[Email] ✅ SMTP kết nối thành công. Sẵn sàng gửi mail.');
}).catch((err) => {
  console.warn('[Email] ⚠️ SMTP chưa kết nối được (kiểm tra .env):', err.message);
});

/**
 * Gửi E-Ticket qua email sau khi thanh toán thành công.
 *
 * @param {string} toEmail     - Email người nhận
 * @param {string} qrCodeStr   - UUID string (qr_code từ DB) để sinh ảnh QR
 * @param {object} ticket      - Chi tiết vé
 * @param {string} ticket.movieTitle
 * @param {string} ticket.roomName
 * @param {string} ticket.roomType
 * @param {string} ticket.startTime    - ISO string hoặc Date
 * @param {string} ticket.seatNames    - VD: "A1, A2, B3"
 * @param {number} ticket.totalAmount
 * @param {number} ticket.bookingId
 */
export const sendTicketEmail = async (toEmail, qrCodeStr, ticket) => {
  const {
    movieTitle, roomName, roomType,
    startTime, seatNames, totalAmount, bookingId,
  } = ticket;

  // ── Render QR Code thành base64 PNG ─────────────────────────────────
  const qrBase64 = await QRCode.toDataURL(qrCodeStr, {
    errorCorrectionLevel: 'H',
    width: 300,
    margin: 2,
    color: { dark: '#111111', light: '#FFFFFF' },
  });
  // Tách phần base64 thuần ra khỏi data URI prefix
  const qrImageBase64 = qrBase64.replace(/^data:image\/png;base64,/, '');

  // ── Format thời gian hiển thị ────────────────────────────────────────
  const formattedTime = new Date(startTime).toLocaleString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const formattedAmount = Number(totalAmount).toLocaleString('vi-VN') + ' VNĐ';

  // ── HTML Email Template ───────────────────────────────────────────────
  const htmlBody = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vé Xem Phim #${bookingId}</title>
</head>
<body style="margin:0;padding:0;background:#111;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;overflow:hidden;border:1px solid #333;">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#E50914,#b81d24);padding:32px 40px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:28px;font-weight:900;letter-spacing:-0.5px;">🎬 CINEMA</h1>
              <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Vé Điện Tử Xem Phim</p>
            </td>
          </tr>

          <!-- BOOKING ID BADGE -->
          <tr>
            <td style="padding:24px 40px 0;text-align:center;">
              <span style="background:#222;border:1px solid #E50914;color:#E50914;padding:6px 20px;border-radius:999px;font-size:13px;font-weight:700;letter-spacing:1px;">
                ĐƠN VÉ #${bookingId}
              </span>
            </td>
          </tr>

          <!-- MOVIE INFO -->
          <tr>
            <td style="padding:28px 40px 0;">
              <h2 style="color:#fff;margin:0 0 20px;font-size:22px;font-weight:900;border-left:4px solid #E50914;padding-left:12px;">
                ${movieTitle}
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #2a2a2a;">
                    <span style="color:#666;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Suất chiếu</span><br>
                    <span style="color:#eee;font-size:15px;font-weight:600;margin-top:4px;display:block;">${formattedTime}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #2a2a2a;">
                    <span style="color:#666;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Phòng chiếu</span><br>
                    <span style="color:#eee;font-size:15px;font-weight:600;margin-top:4px;display:block;">${roomName} &mdash; ${roomType}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #2a2a2a;">
                    <span style="color:#666;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Ghế ngồi</span><br>
                    <span style="color:#E50914;font-size:18px;font-weight:900;margin-top:4px;display:block;letter-spacing:1px;">${seatNames}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;">
                    <span style="color:#666;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Tổng tiền</span><br>
                    <span style="color:#f5c842;font-size:18px;font-weight:900;margin-top:4px;display:block;">${formattedAmount}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- DASHED DIVIDER -->
          <tr>
            <td style="padding:24px 40px;">
              <div style="border-top:2px dashed #333;position:relative;">
                <div style="position:absolute;left:-50px;top:-12px;width:24px;height:24px;background:#111;border-radius:50%;border:1px solid #333;"></div>
                <div style="position:absolute;right:-50px;top:-12px;width:24px;height:24px;background:#111;border-radius:50%;border:1px solid #333;"></div>
              </div>
            </td>
          </tr>

          <!-- QR CODE SECTION -->
          <tr>
            <td style="padding:0 40px 32px;text-align:center;">
              <p style="color:#888;font-size:13px;margin:0 0 16px;">Xuất trình mã QR này tại cửa rạp</p>
              <img src="cid:qrcode_ticket" alt="QR Code" style="width:200px;height:200px;border:8px solid #fff;border-radius:8px;display:block;margin:0 auto;">
              <p style="color:#444;font-size:11px;margin:12px 0 0;font-family:monospace;word-break:break-all;">${qrCodeStr}</p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#0d0d0d;padding:20px 40px;text-align:center;border-top:1px solid #222;">
              <p style="color:#444;font-size:12px;margin:0;">Vui lòng đến trước giờ chiếu ít nhất 15 phút. Vé đã mua không hoàn tiền.</p>
              <p style="color:#333;font-size:11px;margin:8px 0 0;">&copy; ${new Date().getFullYear()} Cinema Management System</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  // ── Gửi email ──────────────────────────────────────────────────────────
  const info = await transporter.sendMail({
    from:    `"${process.env.SMTP_FROM_NAME || 'Cinema Ticket'}" <${process.env.SMTP_USER}>`,
    to:      toEmail,
    subject: `🎬 Vé xem phim "${movieTitle}" — Đơn #${bookingId}`,
    html:    htmlBody,
    attachments: [{
      filename:    'qrcode.png',
      content:     qrImageBase64,
      encoding:    'base64',
      cid:         'qrcode_ticket',  // Khớp với src="cid:qrcode_ticket" trong HTML
    }],
  });

  console.log(`[Email] ✅ E-Ticket #${bookingId} đã gửi tới ${toEmail} (messageId: ${info.messageId})`);
  return info;
};

/**
 * Gửi email chứa OTP (dùng cho đăng ký và quên mật khẩu).
 *
 * @param {object} params
 * @param {string} params.toEmail   - Địa chỉ email nhận
 * @param {string} params.name      - Tên người dùng
 * @param {string} params.otp       - Mã OTP 6 số
 * @param {string} params.subject   - Tiêu đề email
 * @param {string} params.heading   - Tiêu đề trong body email
 * @param {string} params.bodyText  - Đoạn mô tả ngữ cảnh (có thể chứa HTML)
 */
export const sendOTPEmail = async ({ toEmail, name, otp, subject, heading, bodyText }) => {
  const htmlBody = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#111;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;overflow:hidden;border:1px solid #333;">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#E50914,#b81d24);padding:28px 40px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:26px;font-weight:900;letter-spacing:-0.5px;">🎬 CINEMA</h1>
              <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px;">${heading}</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:32px 40px;text-align:center;">
              <p style="color:#bbb;font-size:15px;margin:0 0 8px;">Xin chào, <strong style="color:#fff;">${name || toEmail}</strong>!</p>
              <p style="color:#888;font-size:14px;line-height:1.6;margin:0 0 28px;">${bodyText}</p>

              <!-- OTP BOX -->
              <div style="background:#111;border:2px dashed #E50914;border-radius:12px;padding:20px 32px;display:inline-block;margin-bottom:24px;">
                <p style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Mã xác nhận của bạn</p>
                <span style="color:#E50914;font-size:40px;font-weight:900;letter-spacing:10px;font-family:'Courier New',monospace;">${otp}</span>
              </div>

              <p style="color:#555;font-size:12px;margin:0;">Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.</p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#0d0d0d;padding:16px 40px;text-align:center;border-top:1px solid #222;">
              <p style="color:#444;font-size:11px;margin:0;">© ${new Date().getFullYear()} Cinema Management System — Không trả lời email này.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const info = await transporter.sendMail({
    from:    `"${process.env.SMTP_FROM_NAME || 'Cinema'}" <${process.env.SMTP_USER}>`,
    to:      toEmail,
    subject,
    html:    htmlBody,
  });

  console.log(`[Email] ✅ OTP đã gửi tới ${toEmail} (messageId: ${info.messageId})`);
  return info;
};

