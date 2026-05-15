// scripts/test-email-queue.js
import 'dotenv/config';
import { emailQueue } from '../src/workers/email.worker.js';

const runTest = async () => {
  console.log('📦 Đang đẩy 1 Job gửi mail giả lập vào Queue...');

  try {
    const job = await emailQueue.add('sendTicket', {
      email: 'process.env.SMTP_USER', // Gửi tới chính email của bạn để test
      qrCode: 'TEST-QR-UUID-12345',
      bookingId: 9999,
      ticketDetails: {
        movieTitle: 'Spider-Man: No Way Home (Test)',
        roomName: 'Cinema 1',
        roomType: 'IMAX 3D',
        startTime: new Date().toISOString(),
        seatNames: 'G4, G5',
        totalAmount: 250000,
      },
    });

    console.log(`✅ Đã đẩy Job thành công! (Job ID: ${job.id})`);
    console.log('⏳ Vui lòng chờ xem Terminal của Backend (chỗ đang chạy npm run dev) có hiện log Gửi mail thành công không.');
    console.log('Hoặc check hộp thư đến của bạn!');
    
    // Đợi một lát rồi thoát script
    setTimeout(() => process.exit(0), 3000);

  } catch (err) {
    console.error('❌ Lỗi khi đẩy Job vào Queue:', err.message);
    process.exit(1);
  }
};

runTest();
