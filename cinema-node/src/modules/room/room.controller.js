import { RoomService } from './room.service.js';
import { paginateAll } from '../../utils/pagination.js';

const index  = async (req, res) => { try { res.json(paginateAll(await RoomService.getAll())); } catch(e){ res.status(e.status||500).json({message:e.message}); }};
const show   = async (req, res) => { try { res.json(await RoomService.getById(req.params.id)); } catch(e){ res.status(e.status||500).json({message:e.message}); }};
const store  = async (req, res) => { try { res.status(201).json(await RoomService.create(req.body)); } catch(e){ res.status(e.status||500).json({message:e.message}); }};
const update = async (req, res) => { try { res.json(await RoomService.update(req.params.id, req.body)); } catch(e){ res.status(e.status||500).json({message:e.message}); }};
const destroy = async (req, res) => { try { await RoomService.destroy(req.params.id); res.status(204).send(); } catch(e){ res.status(e.status||500).json({message:e.message}); }};

export const RoomController = { index, show, store, update, destroy };
