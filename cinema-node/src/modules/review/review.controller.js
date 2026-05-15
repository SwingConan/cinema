import { ReviewService } from './review.service.js';
import { paginateAll } from '../../utils/pagination.js';

const index = async (req, res) => {
  try { res.json(paginateAll(await ReviewService.getByMovie(req.params.movieId))); }
  catch (e) { res.status(e.status || 500).json({ message: e.message }); }
};

const store = async (req, res) => {
  try {
    const result = await ReviewService.submitReview(req.user.id, req.params.movieId, req.body);
    res.status(200).json(result);
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
};

export const ReviewController = { index, store };
