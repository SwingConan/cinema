// src/modules/review/review.service.js
import { ReviewRepository } from './review.repository.js';

const getByMovie = async (movieId) => ReviewRepository.findByMovie(movieId);

const submitReview = async (userId, movieId, { rating, comment }) => {
  const hasWatched = await ReviewRepository.hasWatchedMovie(userId, movieId);
  if (!hasWatched) {
    const e = new Error('Bạn cần mua vé và xem phim này để có thể gửi đánh giá.');
    e.status = 403; throw e;
  }
  const review = await ReviewRepository.upsert(userId, movieId, { rating, comment });
  return { message: 'Cảm ơn bạn đã đánh giá phim!', review };
};

export const ReviewService = { getByMovie, submitReview };
