// src/modules/voice-booking/voice-booking.service.js
// =============================================
// VOICE BOOKING — Gemini AI Intent Parser
// Nhận text/voice từ client → parse intent → trả kết quả
// =============================================
import { GoogleGenAI } from '@google/genai';
import pool from '../../config/database.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

let ai = null;
const getAI = () => {
  if (!ai && GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }
  return ai;
};

/**
 * Lấy context hiện tại (phim đang chiếu, phòng, suất) để inject vào prompt
 */
const getSystemContext = async () => {
  // Phim đang/sắp chiếu
  const [movies] = await pool.query(`
    SELECT m.id, m.title, m.genre, m.duration, m.rated
    FROM movies m
    WHERE m.release_date <= CURDATE()
      OR EXISTS (SELECT 1 FROM showtimes s WHERE s.movie_id = m.id AND s.start_time >= NOW())
    ORDER BY m.release_date DESC LIMIT 20
  `);

  // Suất chiếu tương lai
  const [showtimes] = await pool.query(`
    SELECT s.id, s.movie_id, s.room_id, s.start_time, s.price_regular,
           m.title AS movie_title, r.name AS room_name, r.type AS room_type,
           r.total_seats - (
             SELECT COUNT(*) FROM booking_seats bs
             JOIN bookings b ON bs.booking_id = b.id
             WHERE b.showtime_id = s.id AND b.status != 'cancelled'
           ) AS available_seats
    FROM showtimes s
    JOIN movies m ON s.movie_id = m.id
    JOIN rooms r ON s.room_id = r.id
    WHERE s.start_time >= NOW()
    ORDER BY s.start_time ASC LIMIT 50
  `);

  return { movies, showtimes };
};

/**
 * Format context thành text cho Gemini prompt
 */
const buildContextText = (ctx) => {
  const movieList = ctx.movies.map(m =>
    `- ID:${m.id} "${m.title}" (${m.genre || 'N/A'}, ${m.duration}p, ${m.rated || 'P'})`
  ).join('\n');

  const showtimeList = ctx.showtimes.map(s => {
    const dt = new Date(s.start_time);
    const dateStr = dt.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' });
    const timeStr = dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return `- ShowtimeID:${s.id} Phim:"${s.movie_title}" | ${dateStr} ${timeStr} | ${s.room_name}(${s.room_type}) | Giá:${s.price_regular?.toLocaleString()}đ | Còn ${s.available_seats} ghế`;
  }).join('\n');

  return `
=== DANH SÁCH PHIM ĐANG CHIẾU ===
${movieList || 'Không có phim nào đang chiếu'}

=== LỊCH CHIẾU SẮP TỚI ===
${showtimeList || 'Không có suất chiếu nào'}
`.trim();
};

/**
 * System prompt cho Gemini
 */
const SYSTEM_PROMPT = `Bạn là trợ lý đặt vé xem phim AI của rạp CinemaMS. Tên bạn là CineBot.

NHIỆM VỤ:
- Phân tích câu nói của khách hàng và trả về JSON chứa intent + entities.
- Trả lời bằng tiếng Việt, thân thiện, ngắn gọn.

CÁC INTENT HỢP LỆ:
1. "search_movie" — Khách muốn tìm/hỏi phim (theo tên, thể loại, v.v.)
2. "search_showtime" — Khách muốn xem lịch chiếu của 1 phim cụ thể
3. "select_showtime" — Khách chọn suất chiếu cụ thể (có showtimeId)
4. "select_seats" — Khách muốn chọn ghế (có số lượng hoặc vị trí)
5. "confirm_booking" — Khách xác nhận đặt vé
6. "greeting" — Chào hỏi
7. "help" — Hỏi hướng dẫn
8. "unknown" — Không hiểu

TRẢ VỀ JSON (LUÔN LUÔN):
{
  "intent": "<intent>",
  "entities": {
    "movieTitle": "<tên phim nếu có>",
    "movieId": <id phim nếu khớp>,
    "showtimeId": <id suất chiếu nếu có>,
    "seatCount": <số ghế>,
    "seatType": "<regular|vip|couple>",
    "date": "<ngày nếu có, format YYYY-MM-DD>",
    "time": "<giờ nếu có, format HH:mm>"
  },
  "response": "<câu trả lời cho khách>",
  "suggestions": ["<gợi ý 1>", "<gợi ý 2>"]
}

QUY TẮC:
- Nếu khách nói tên phim gần đúng, tìm phim gần nhất trong danh sách.
- Nếu khách nói "tối nay", "chiều nay", "ngày mai" → chuyển thành ngày/giờ cụ thể.
- Nếu có nhiều suất chiếu, liệt kê tối đa 5 suất.
- Luôn kèm suggestions để gợi ý bước tiếp theo.
`;

/**
 * Xử lý voice/text input từ client
 */
const processInput = async (text, conversationHistory = []) => {
  const aiClient = getAI();
  if (!aiClient) {
    return createFallbackResponse(text);
  }

  try {
    // Lấy context rạp hiện tại
    const ctx = await getSystemContext();
    const contextText = buildContextText(ctx);

    // Build messages
    const messages = [
      ...conversationHistory.slice(-6).map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      })),
      {
        role: 'user',
        parts: [{ text: text }],
      },
    ];

    const config = {
      systemInstruction: SYSTEM_PROMPT + '\n\n' + contextText + `\n\nThời gian hiện tại: ${new Date().toLocaleString('vi-VN')}`,
      temperature: 0.3,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
    };

    // Model fallback chain: try multiple models based on active user quotas
    const models = ['gemini-3.1-flash-lite', 'gemini-1.5-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'];
    let lastError = null;

    for (const model of models) {
      try {
        const response = await aiClient.models.generateContent({
          model,
          contents: messages,
          config,
        });
        const raw = response.text;
        const parsed = JSON.parse(raw);

        // Enrich response nếu intent là search_showtime
        if (parsed.intent === 'search_showtime' && parsed.entities?.movieId) {
          parsed.data = ctx.showtimes
            .filter(s => s.movie_id === parsed.entities.movieId)
            .slice(0, 5)
            .map(s => ({
              showtimeId: s.id,
              movieTitle: s.movie_title,
              startTime: s.start_time,
              roomName: s.room_name,
              roomType: s.room_type,
              price: s.price_regular,
              availableSeats: s.available_seats,
            }));
        }

        // Enrich response nếu intent là search_movie
        if (parsed.intent === 'search_movie') {
          parsed.data = ctx.movies.slice(0, 5).map(m => ({
            movieId: m.id,
            title: m.title,
            genre: m.genre,
            duration: m.duration,
          }));
        }

        console.log(`[VoiceBooking] ✅ Gemini (${model}) → intent: ${parsed.intent}`);
        return parsed;
      } catch (modelErr) {
        lastError = modelErr;
        console.warn(`[VoiceBooking] ⚠️ Model ${model} failed: ${modelErr.message?.substring(0, 80)}`);
        continue; // Try next model
      }
    }

    // All models failed → fallback
    console.error('[VoiceBooking] All Gemini models failed, using fallback NLU');
    return createFallbackResponse(text);
  } catch (err) {
    console.error('[VoiceBooking] Gemini error:', err.message);
    return createFallbackResponse(text);
  }
};

/**
 * Fallback khi Gemini không khả dụng — keyword-based NLU
 */
const createFallbackResponse = async (text) => {
  const lower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // ── GREETING ─────────────────────────────────────────────
  const greetWords = ['xin chao', 'hello', 'hi ', 'hey', 'chao', 'alo'];
  if (greetWords.some(w => lower.includes(w)) || lower.length < 4) {
    return {
      intent: 'greeting',
      entities: {},
      response: '🎬 Xin chào! Tôi là CineBot, trợ lý đặt vé xem phim AI.\n\nBạn muốn xem phim gì hôm nay?',
      suggestions: ['Phim đang chiếu', 'Phim hành động', 'Lịch chiếu hôm nay'],
    };
  }

  // ── SEARCH MOVIE ─────────────────────────────────────────
  const movieKeywords = ['phim', 'dang chieu', 'sap chieu', 'hanh dong', 'kinh di', 'hoat hinh', 'tinh cam', 'xem gi'];
  if (movieKeywords.some(w => lower.includes(w))) {
    try {
      const ctx = await getSystemContext();
      const movies = ctx.movies.slice(0, 5);
      let response = `🎬 Hiện tại rạp có **${ctx.movies.length} phim**:`;
      const data = movies.map(m => ({
        movieId: m.id,
        title: m.title,
        genre: m.genre,
        duration: m.duration,
      }));
      return {
        intent: 'search_movie',
        entities: {},
        response,
        data,
        suggestions: movies.slice(0, 3).map(m => `Lịch chiếu ${m.title.substring(0, 20)}`),
      };
    } catch (e) {
      // ignore
    }
  }

  // ── SEARCH SHOWTIME ──────────────────────────────────────
  const scheduleKeywords = ['lich chieu', 'suat chieu', 'gio chieu', 'may gio', 'hom nay', 'ngay mai', 'toi nay'];
  if (scheduleKeywords.some(w => lower.includes(w))) {
    try {
      const ctx = await getSystemContext();
      const showtimes = ctx.showtimes.slice(0, 5);
      if (showtimes.length === 0) {
        return {
          intent: 'search_showtime',
          entities: {},
          response: '📅 Hiện tại không có suất chiếu nào sắp tới. Vui lòng quay lại sau!',
          suggestions: ['Phim đang chiếu'],
        };
      }
      const data = showtimes.map(s => ({
        showtimeId: s.id,
        movieTitle: s.movie_title,
        startTime: s.start_time,
        roomName: s.room_name,
        roomType: s.room_type,
        price: s.price_regular,
        availableSeats: s.available_seats,
      }));
      return {
        intent: 'search_showtime',
        entities: {},
        response: `📅 Có **${ctx.showtimes.length} suất chiếu** sắp tới:`,
        data,
        suggestions: ['Đặt vé suất gần nhất'],
      };
    } catch (e) {
      // ignore
    }
  }

  // ── HELP ─────────────────────────────────────────────────
  const helpKeywords = ['huong dan', 'giup', 'help', 'lam sao', 'cach'];
  if (helpKeywords.some(w => lower.includes(w))) {
    return {
      intent: 'help',
      entities: {},
      response: '🤖 Tôi có thể giúp bạn:\n\n1️⃣ Tìm phim đang chiếu\n2️⃣ Xem lịch chiếu\n3️⃣ Đặt vé nhanh\n\nHãy nói hoặc gõ yêu cầu, ví dụ: *"Cho tôi xem phim hành động"*',
      suggestions: ['Phim đang chiếu', 'Lịch chiếu hôm nay', 'Phim kinh dị'],
    };
  }

  // ── DEFAULT ──────────────────────────────────────────────
  return {
    intent: 'unknown',
    entities: {},
    response: '🤖 Tôi chưa hiểu yêu cầu. Bạn có thể thử nói:\n- *"Phim đang chiếu"*\n- *"Lịch chiếu hôm nay"*\n- *"Xin chào"*',
    suggestions: ['Phim đang chiếu', 'Lịch chiếu hôm nay', 'Hướng dẫn'],
  };
};

export const VoiceBookingService = {
  processInput,
  getSystemContext,
};
