// src/modules/security/security.controller.js
import { SecurityService } from './security.service.js';
import { AuditService } from '../audit/audit.service.js';

const getStatus = async (req, res) => {
  try {
    const result = await SecurityService.getStatus(req.user.id);
    res.json(result);
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
};

const setup = async (req, res) => {
  try {
    const result = await SecurityService.setupPasscode(
      req.user.id, req.body.password, req.body.passcode
    );
    AuditService.logAction(req, 'passcode.setup', { entityType: 'user', entityId: req.user.id });
    res.status(201).json(result);
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
};

const verify = async (req, res) => {
  try {
    const result = await SecurityService.verifyPasscode(req.user.id, req.body.passcode);
    res.json(result);
  } catch (e) {
    AuditService.logAction(req, 'passcode.verify_failed', { entityType: 'user', entityId: req.user.id, details: { reason: e.message } });
    res.status(e.status || 500).json({
      message: e.message,
      attemptsRemaining: e.attemptsRemaining,
      lockedUntil: e.lockedUntil,
    });
  }
};

const change = async (req, res) => {
  try {
    const result = await SecurityService.changePasscode(
      req.user.id, req.body.oldPasscode, req.body.newPasscode
    );
    AuditService.logAction(req, 'passcode.change', { entityType: 'user', entityId: req.user.id });
    res.json(result);
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
};

const requestReset = async (req, res) => {
  try {
    const result = await SecurityService.requestResetOtp(req.user.id);
    res.json(result);
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
};

const confirmReset = async (req, res) => {
  try {
    const result = await SecurityService.confirmResetPasscode(
      req.user.id, req.body.otp, req.body.newPasscode
    );
    AuditService.logAction(req, 'passcode.reset', { entityType: 'user', entityId: req.user.id });
    res.json(result);
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
};

const disable = async (req, res) => {
  try {
    const result = await SecurityService.disablePasscode(req.user.id, req.body.password);
    AuditService.logAction(req, 'passcode.disable', { entityType: 'user', entityId: req.user.id });
    res.json(result);
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
};

export const SecurityController = {
  getStatus, setup, verify, change, requestReset, confirmReset, disable,
};
