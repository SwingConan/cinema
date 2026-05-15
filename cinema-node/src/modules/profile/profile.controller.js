// src/modules/profile/profile.controller.js
import { ProfileService } from './profile.service.js';

const update = async (req, res) => {
  try {
    const result = await ProfileService.update(req.user.id, req.body);
    res.json(result);
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
};

export const ProfileController = { update };
