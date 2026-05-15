// src/modules/profile/profile.service.js
import { ProfileRepository } from './profile.repository.js';

const update = async (userId, data) => {
  const user = await ProfileRepository.update(userId, data);
  return { message: 'Cập nhật thành công', user };
};

export const ProfileService = { update };
