// src/modules/checkin/checkin.service.js
import { CheckinRepository } from './checkin.repository.js';

const verify = async (qrCode) => {
  const booking = await CheckinRepository.findByQrCode(qrCode);

  if (!booking) {
    const e = new Error('Mã QR không hợp lệ hoặc vé không tồn tại.'); e.status = 404; throw e;
  }
  if (booking.status === 'used') {
    const e = new Error('Vé này đã được sử dụng.'); e.status = 400;
    e.booking = booking; throw e;
  }
  if (booking.status !== 'paid') {
    const e = new Error('Vé này chưa được thanh toán thành công.'); e.status = 400;
    e.booking = booking; throw e;
  }

  await CheckinRepository.markAsUsed(booking.id);
  booking.status = 'used';

  return { message: 'Xác thực vé thành công.', booking };
};

export const CheckinService = { verify };
