import { Router } from 'express'
import db from '../db.js'
const router = Router()
router.get('/', (req, res) => {
  const { bacSiId } = req.query
  const query = `SELECT clv.*, bs.hoTen as tenBacSi FROM caLamViecMau clv JOIN bacSi bs ON clv.bacSiId = bs.id${bacSiId ? ' WHERE clv.bacSiId = ?' : ''} ORDER BY clv.bacSiId, clv.thuTrongTuan`
  res.json(bacSiId ? db.prepare(query).all(bacSiId) : db.prepare(query).all())
})
router.post('/', (req, res) => {
  const { bacSiId, thuTrongTuan, gioBatDau, gioKetThuc } = req.body
  if (!bacSiId || thuTrongTuan === undefined || !gioBatDau || !gioKetThuc) return res.status(400).json({ error: 'Thiếu Thông Tin Bắt Buộc' })
  const existing = db.prepare('SELECT id FROM caLamViecMau WHERE bacSiId=? AND thuTrongTuan=?').get(bacSiId, thuTrongTuan)
  if (existing) {
    db.prepare('UPDATE caLamViecMau SET gioBatDau=?, gioKetThuc=? WHERE id=?').run(gioBatDau, gioKetThuc, existing.id)
    return res.json({ id: existing.id })
  }
  const result = db.prepare('INSERT INTO caLamViecMau (bacSiId, thuTrongTuan, gioBatDau, gioKetThuc) VALUES (?, ?, ?, ?)').run(bacSiId, thuTrongTuan, gioBatDau, gioKetThuc)
  res.status(201).json({ id: result.lastInsertRowid })
})
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM caLamViecMau WHERE id=?').run(req.params.id)
  res.json({ success: true })
})
export default router