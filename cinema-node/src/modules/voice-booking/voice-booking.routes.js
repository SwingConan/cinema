// src/modules/voice-booking/voice-booking.routes.js
import { Router } from 'express';
import { VoiceBookingController } from './voice-booking.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

// Customer: gửi text/voice → nhận intent + response
router.post('/customer/voice-booking', authenticate, VoiceBookingController.processVoice);

// Public: xem context (movies, showtimes count)
router.get('/public/voice-booking/context', VoiceBookingController.getContext);

export default router;
