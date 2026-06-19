// src/services/email.service.js
// =============================================
// EMAIL SERVICE — Gửi E-Ticket qua Nodemailer
// Dùng Gmail SMTP với App Password.
// QR Code được render từ UUID string (qr_code
// trong DB) thành ảnh PNG base64 nhúng vào mail.
// =============================================
import nodemailer from 'nodemailer';
import QRCode     from 'qrcode';
import dns        from 'dns';

const smtpPort = Number(process.env.SMTP_PORT) || 587;
const isSecure = smtpPort === 465;

// ── Tạo transporter (tái sử dụng, chỉ tạo nếu không dùng API bên thứ ba) ───────────
let transporter = null;
if (!process.env.BREVO_API_KEY) {
  transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST || 'smtp.gmail.com',
    port:   smtpPort,
    secure: isSecure,           // true cho port 465, false cho 587 (TLS)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000, // 10s
    greetingTimeout:   10000, // 10s
    socketTimeout:     15000, // 15s
    // Bắt buộc dùng IPv4 vì Render không hỗ trợ định tuyến IPv6 (gây lỗi ENETUNREACH)
    lookup: (hostname, options, callback) => {
      dns.lookup(hostname, { family: 4 }, callback);
    },
  });

  transporter.verify().then(() => {
    console.log('[Email] ✅ SMTP kết nối thành công. Sẵn sàng gửi mail.');
  }).catch((err) => {
    console.warn('[Email] ⚠️ SMTP chưa kết nối được (kiểm tra .env hoặc dùng Brevo API):', err.message);
  });
} else {
  console.log('[Email] 🚀 Đang sử dụng Brevo HTTP API để gửi email (bypass chặn cổng của Render Free).');
}

/**
 * Hàm gửi mail chung (Tự động chọn Brevo API qua HTTPS hoặc Nodemailer SMTP)
 */
const sendMailHelper = async ({ toEmail, subject, htmlBody, attachments = [] }) => {
  if (process.env.BREVO_API_KEY) {
    const payload = {
      sender: {
        name: process.env.SMTP_FROM_NAME || 'Cinema Ticket',
        email: process.env.SMTP_USER || 'congvieccv567@gmail.com',
      },
      to: [{ email: toEmail }],
      subject: subject,
      htmlContent: htmlBody,
    };

    if (attachments.length > 0) {
      payload.attachment = attachments.map(att => ({
        name: att.filename,
        content: att.content, // base64 string
      }));
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Brevo API Error: ${response.status} - ${errorText}`);
    }

    const resData = await response.json();
    return { messageId: resData.messageId };
  } else {
    if (!transporter) {
      throw new Error('Transporter chưa được khởi tạo và BREVO_API_KEY không tồn tại.');
    }
    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'Cinema Ticket'}" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: subject,
      html: htmlBody,
    };

    if (attachments.length > 0) {
      mailOptions.attachments = attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        encoding: 'base64',
        cid: att.cid,
      }));
    }

    const info = await transporter.sendMail(mailOptions);
    return { messageId: info.messageId };
  }
};

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
<body style="margin:0;padding:0;background:#0d0d0d;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:40px 0;">
    <tr>
      <td align="center">
        <!-- Main ticket box -->
        <table width="520" cellpadding="0" cellspacing="0" style="background:#151515;border-radius:24px;overflow:hidden;border:1px solid #262626;box-shadow:0 20px 40px rgba(0,0,0,0.5);">
          
          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#E50914 0%,#8B0000 100%);padding:40px;text-align:center;">
              <div style="font-size:26px;font-weight:900;color:#ffffff;letter-spacing:1px;text-transform:uppercase;margin:0;">
                🎬 CINEMA TICKET
              </div>
              <div style="color:rgba(255,255,255,0.7);font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;margin-top:6px;">
                Vé Điện Tử / E-Ticket
              </div>
            </td>
          </tr>

          <!-- TICKET TOP BODY: INFO -->
          <tr>
            <td style="padding:40px 40px 10px;">
              <!-- Booking ID Badge -->
              <div style="text-align:center;margin-bottom:30px;">
                <span style="background:rgba(229,9,20,0.1);border:1px solid rgba(229,9,20,0.3);color:#E50914;padding:8px 24px;border-radius:100px;font-size:12px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase;display:inline-block;">
                  MÃ ĐƠN VÉ #${bookingId}
                </span>
              </div>

              <!-- Movie Title -->
              <h2 style="color:#ffffff;margin:0 0 25px 0;font-size:22px;font-weight:900;line-height:1.4;text-align:center;">
                ${movieTitle}
              </h2>

              <!-- Details Grid -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td width="50%" style="padding:15px 0;border-bottom:1px solid #222;vertical-align:top;">
                    <div style="color:#737373;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;">Lịch Chiếu</div>
                    <div style="color:#ffffff;font-size:14px;font-weight:700;line-height:1.4;">${formattedTime}</div>
                  </td>
                  <td width="50%" style="padding:15px 0 15px 20px;border-bottom:1px solid #222;vertical-align:top;">
                    <div style="color:#737373;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;">Phòng Chiếu</div>
                    <div style="color:#ffffff;font-size:14px;font-weight:700;line-height:1.4;">${roomName} <span style="color:#E50914;font-size:11px;padding:2px 6px;background:rgba(229,9,20,0.15);border-radius:4px;margin-left:4px;">${roomType}</span></div>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding:15px 0;vertical-align:top;">
                    <div style="color:#737373;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;">Ghế Đã Chọn</div>
                    <div style="color:#E50914;font-size:18px;font-weight:900;letter-spacing:1px;">${seatNames}</div>
                  </td>
                  <td width="50%" style="padding:15px 0 15px 20px;vertical-align:top;">
                    <div style="color:#737373;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;">Tổng Thanh Toán</div>
                    <div style="color:#f5c842;font-size:16px;font-weight:900;">${formattedAmount}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- TICKET DIVIDER WITH NOTCHES -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <!-- Left Notch -->
                  <td width="16" style="height:32px;background:#0d0d0d;border-radius:0 16px 16px 0;border:1px solid #262626;border-left:none;"></td>
                  <!-- Dashed line -->
                  <td style="border-bottom:2px dashed #262626;height:16px;line-height:16px;">&nbsp;</td>
                  <!-- Right Notch -->
                  <td width="16" style="height:32px;background:#0d0d0d;border-radius:16px 0 0 16px;border:1px solid #262626;border-right:none;"></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- TICKET BOTTOM BODY: QR CODE -->
          <tr>
            <td style="padding:30px 40px 40px;text-align:center;">
              <div style="color:#737373;font-size:12px;font-weight:bold;margin-bottom:20px;letter-spacing:1px;">
                VUI LÒNG QUÉT MÃ QR NÀY TẠI QUẦY ĐỂ NHẬN VÉ
              </div>
              
              <!-- QR Frame -->
              <div style="background:#ffffff;padding:16px;border-radius:16px;display:inline-block;box-shadow:0 10px 25px rgba(0,0,0,0.3);border:1px solid #e5e5e5;">
                <img src="cid:qrcode_ticket" alt="Mã QR Vé Xem Phim" style="width:200px;height:200px;display:block;margin:0;">
              </div>
              
              <!-- Unique QR code text -->
              <div style="color:#525252;font-family:'Courier New',Courier,monospace;font-size:11px;margin-top:16px;word-break:break-all;letter-spacing:0.5px;">
                ${qrCodeStr}
              </div>
            </td>
          </tr>

          <!-- FOOTER/NOTE -->
          <tr>
            <td style="background:#0c0c0c;padding:24px 40px;text-align:center;border-top:1px solid #222;">
              <div style="color:#525252;font-size:12px;line-height:1.6;font-weight:500;">
                Vui lòng đến rạp trước giờ chiếu ít nhất 15 phút để chuẩn bị.
                <br>
                Vé đã thanh toán không được hoàn trả hoặc đổi trả.
              </div>
              <div style="color:#404040;font-size:10px;margin-top:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">
                &copy; ${new Date().getFullYear()} Cinema Management System
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  // ── Gửi email ──────────────────────────────────────────────────────────
  const info = await sendMailHelper({
    toEmail,
    subject: `🎬 Vé xem phim "${movieTitle}" — Đơn #${bookingId}`,
    htmlBody: htmlBody,
    attachments: [{
      filename:    'qrcode.png',
      content:     qrImageBase64,
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

  const info = await sendMailHelper({
    toEmail,
    subject,
    htmlBody: htmlBody,
  });

  console.log(`[Email] ✅ OTP đã gửi tới ${toEmail} (messageId: ${info.messageId})`);
  return info;
};

