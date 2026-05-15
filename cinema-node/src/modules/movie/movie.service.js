// src/modules/movie/movie.service.js
// =============================================
// MOVIE SERVICE — Business Logic
// =============================================
import { MovieRepository } from './movie.repository.js';
import fs from 'fs';
import path from 'path';

const getAll = async (status, page = 1, perPage = 20) => {
  return MovieRepository.findAll(status, page, perPage);
};

const getById = async (id) => {
  const movie = await MovieRepository.findById(id);
  if (!movie) {
    const err = new Error('Không tìm thấy phim.');
    err.status = 404;
    throw err;
  }
  return movie;
};

const getByIdWithShowtimes = async (id) => {
  const movie = await MovieRepository.findByIdWithShowtimes(id);
  if (!movie) {
    const err = new Error('Không tìm thấy phim.');
    err.status = 404;
    throw err;
  }
  return movie;
};

const create = async (data, posterFile) => {
  const movieData = {
    ...data,
    releaseDate: data.releaseDate || data.release_date,
    trailerUrl: data.trailerUrl || data.trailer_url
  };
  if (posterFile) {
    movieData.poster = 'posters/' + posterFile.filename;
  }
  return MovieRepository.create(movieData);
};

const update = async (id, data, posterFile) => {
  const existing = await MovieRepository.findById(id);
  if (!existing) {
    const err = new Error('Không tìm thấy phim.');
    err.status = 404;
    throw err;
  }

  const updateData = {
    ...data,
    releaseDate: data.releaseDate || data.release_date,
    trailerUrl: data.trailerUrl || data.trailer_url
  };
  if (posterFile) {
    // Xóa poster cũ nếu có
    if (existing.poster) {
      const oldPath = path.join('public', 'uploads', existing.poster);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    updateData.poster = 'posters/' + posterFile.filename;
  }

  return MovieRepository.update(id, updateData);
};

const destroy = async (id) => {
  const existing = await MovieRepository.findById(id);
  if (!existing) {
    const err = new Error('Không tìm thấy phim.');
    err.status = 404;
    throw err;
  }

  // Bảo vệ: không cho xóa phim đã có doanh thu
  const hasBookings = await MovieRepository.hasActiveBookings(id);
  if (hasBookings) {
    const err = new Error('Không thể xóa! Phim này đã phát sinh doanh thu. Gợi ý: Hãy chỉnh sửa thông tin hoặc đổi trạng thái phim.');
    err.status = 422;
    throw err;
  }

  // Xóa poster khi xóa phim
  if (existing.poster) {
    const oldPath = path.join('public', existing.poster);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  await MovieRepository.destroy(id);
};

export const MovieService = {
  getAll,
  getById,
  getByIdWithShowtimes,
  create,
  update,
  destroy,
};
