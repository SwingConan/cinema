// src/modules/staff/staff.routes.js
// =============================================
// STAFF ROUTES — Endpoint riêng cho Staff
// =============================================
import { Router } from 'express';
import { StaffController } from './staff.controller.js';

const router = Router();

// GET /api/staff/dashboard — Thống kê ca làm việc
router.get('/dashboard', StaffController.dashboard);

export default router;
