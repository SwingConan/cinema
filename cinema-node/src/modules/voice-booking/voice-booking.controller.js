// src/modules/voice-booking/voice-booking.controller.js
import { VoiceBookingService } from './voice-booking.service.js';

const processVoice = async (req, res) => {
  try {
    const { text, history } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập hoặc nói yêu cầu của bạn.' });
    }

    const result = await VoiceBookingService.processInput(text.trim(), history || []);
    res.json(result);
  } catch (err) {
    console.error('[VoiceBooking] Controller error:', err);
    res.status(500).json({ message: 'Lỗi xử lý yêu cầu voice booking.' });
  }
};

const getContext = async (req, res) => {
  try {
    const ctx = await VoiceBookingService.getSystemContext();
    res.json({
      moviesCount: ctx.movies.length,
      showtimesCount: ctx.showtimes.length,
      movies: ctx.movies.slice(0, 10),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const VoiceBookingController = { processVoice, getContext };
