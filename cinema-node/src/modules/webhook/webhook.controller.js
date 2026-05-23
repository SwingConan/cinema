// src/modules/webhook/webhook.controller.js
// =============================================
// WEBHOOK CONTROLLER
// Task 3: Thêm POST /api/webhooks/mock-bank (Dev Sandbox)
// =============================================
import { WebhookService } from './webhook.service.js';

/**
 * POST /api/webhooks/payment
 * IPN thật từ ngân hàng/cổng thanh toán.
 * Luôn trả 200 OK để ngân hàng không retry vô tận.
 */
const handlePaymentIPN = async (req, res) => {
  try {
    const { amount, description, transactionId, bankCode } = req.body;
    console.log('[Webhook] Nhận IPN từ ngân hàng:', { amount, description, transactionId, bankCode });

    const result = await WebhookService.handleBankIPN({ amount, description, transactionId, bankCode });

    return res.status(200).json({
      code:    result.success ? '00' : '99',
      message: result.message,
      data:    result.success ? { bookingId: result.bookingId } : null,
    });
  } catch (err) {
    console.error('[Webhook] Lỗi xử lý IPN:', err.message);
    return res.status(200).json({ code: '99', message: 'Lỗi hệ thống. Sẽ xử lý sau.' });
  }
};

/**
 * POST /api/webhooks/mock-bank
 * Task 3: DEV SANDBOX — Giả lập ngân hàng gửi IPN.
 * CHỈ khả dụng ở NODE_ENV=development.
 *
 * Body: { "booking_id": 42 }
 * → Tự động gọi WebhookService.handleBankIPN với số tiền khớp.
 * → Test toàn bộ luồng thanh toán thành công mà KHÔNG cần quét mã tốn tiền thật.
 */
const mockBankIPN = async (req, res) => {

  const { booking_id } = req.body;
  if (!booking_id) {
    return res.status(400).json({ message: 'Thiếu booking_id. Body: { "booking_id": 42 }' });
  }

  // Tìm số tiền thật của đơn từ DB để giả lập chính xác
  let amount = req.body.amount; // Cho phép override số tiền nếu muốn test Late Payment
  if (!amount) {
    // Lấy số tiền thật từ DB
    const pool = (await import('../../config/database.js')).default;
    const [[booking]] = await pool.query(
      'SELECT total_amount FROM bookings WHERE id = ? LIMIT 1',
      [booking_id]
    );
    if (!booking) {
      return res.status(404).json({ message: `Không tìm thấy booking #${booking_id}` });
    }
    amount = Number(booking.total_amount);
  }

  const mockPayload = {
    amount,
    description:   `CINEMA BOOKING ${booking_id}`,
    transactionId: `MOCK_${Date.now()}`,
    bankCode:      'MOCK_BANK',
  };

  console.log('[DevSandbox] 🏦 Giả lập ngân hàng gửi IPN:', mockPayload);

  try {
    const result = await WebhookService.handleBankIPN(mockPayload);
    return res.json({
      sandbox:  true,
      payload:  mockPayload,
      result,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/webhooks/payment/test (Legacy — giữ để tương thích cũ)
 */
const testWebhook = async (req, res) => {
  const { bookingId, amount } = req.query;
  if (!bookingId) {
    return res.status(400).json({ message: 'Thiếu bookingId. VD: ?bookingId=1&amount=120000' });
  }
  const mockPayload = {
    amount:        amount || 999999,
    description:   `CINEMA BOOKING ${bookingId}`,
    transactionId: `TEST_TXN_${Date.now()}`,
    bankCode:      'TEST',
  };
  try {
    const result = await WebhookService.handleBankIPN(mockPayload);
    return res.json({ message: 'Webhook test thành công.', result });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * POST /api/webhooks/sepay
 * Webhook thật từ SePay — tự động xác nhận thanh toán.
 *
 * SePay Payload:
 *   { id, gateway, transactionDate, accountNumber, subAccount,
 *     code, content, transferType, description, transferAmount,
 *     accumulated, referenceCode }
 *
 * Xác thực: Header Authorization = "Apikey <SEPAY_API_KEY>"
 * Response: HTTP 200 + { success: true }
 */
const handleSepayWebhook = async (req, res) => {
  try {
    // ── AUTH: Verify SePay API Key ──────────────────────────────────
    const SEPAY_API_KEY = process.env.SEPAY_API_KEY;
    if (SEPAY_API_KEY) {
      const authHeader = req.headers['authorization'] || '';
      // SePay gửi: "Apikey <key>"
      const providedKey = authHeader.replace(/^Apikey\s+/i, '').trim();
      if (providedKey !== SEPAY_API_KEY) {
        console.warn('[SePay] ❌ API Key không hợp lệ:', authHeader);
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
    }

    const {
      id: sepayTxnId,
      gateway,
      transferAmount,
      content,
      transferType,
      referenceCode,
      description: sepayDescription,
      transactionDate,
    } = req.body;

    console.log('[SePay] 📨 Nhận webhook:', {
      sepayTxnId, gateway, transferAmount, content,
      transferType, referenceCode, transactionDate,
    });

    // ── Chỉ xử lý giao dịch NHẬN tiền (in) ────────────────────────
    if (transferType === 'out') {
      console.log('[SePay] ⏭️ Bỏ qua giao dịch chuyển tiền đi (out)');
      return res.status(200).json({ success: true });
    }

    // ── Map SePay fields → Internal format ──────────────────────────
    // SePay gửi nội dung CK trong `content`
    // Hệ thống tạo QR với nội dung: "CINEMA BOOKING {bookingId}"
    const internalPayload = {
      amount:        Number(transferAmount) || 0,
      description:   content || sepayDescription || '',
      transactionId: referenceCode || `SEPAY_${sepayTxnId}`,
      bankCode:      gateway || 'SEPAY',
    };

    console.log('[SePay] 🔄 Map sang internal format:', internalPayload);

    const result = await WebhookService.handleBankIPN(internalPayload);

    console.log('[SePay] ✅ Kết quả xử lý:', result);

    // SePay yêu cầu trả HTTP 200 + { success: true } để acknowledge
    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('[SePay] ❌ Lỗi xử lý webhook:', err.message);
    // Vẫn trả 200 để SePay không retry vô tận
    return res.status(200).json({ success: true });
  }
};

export const WebhookController = { handlePaymentIPN, mockBankIPN, testWebhook, handleSepayWebhook };
