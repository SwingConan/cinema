// src/modules/payment/payment.controller.js
import { PaymentService } from './payment.service.js';

const createPaymentUrl = async (req, res) => {
  try {
    const result = await PaymentService.createPaymentUrl(req.body.booking_id, req.user.id);
    res.json(result);
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
};

// GET handler — VNPay gọi URL này sau khi xử lý thanh toán
const handleVnpayReturn = async (req, res) => {
  try {
    const result = await PaymentService.handleVnpayReturn({
      vnpResponseCode: req.query.vnp_ResponseCode,
      vnpTxnRef:       req.query.vnp_TxnRef,
      vnpTransactionNo: req.query.vnp_TransactionNo,
    });
    // Redirect về Frontend
    return res.redirect(result.redirectUrl);
  } catch (e) {
    return res.status(e.status || 500).json({ message: e.message });
  }
};

export const PaymentController = { createPaymentUrl, handleVnpayReturn };
