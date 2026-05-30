import { Router } from 'express'
import db from '../db.js'
const router = Router()
router.get('/', (req, res) => {
  const { search } = req.query
  let rows
  if (search) {
    rows = db.prepare(`SELECT * FROM benhNhan WHERE hoTen LIKE ? OR soDienThoai LIKE ? ORDER BY hoTen`).all(`%${search}%`, `%${search}%`)
  } else {
    rows = db.prepare('SELECT * FROM benhNhan ORDER BY hoTen').all()
  }
  res.json(rows)
})
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM benhNhan WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Không Tìm Thấy Bệnh Nhân' })
  res.json(row)
})
router.post('/', (req, res) => {
  const { hoTen, ngaySinh, gioiTinh, soDienThoai, diaChi, tienSuBenh, diUng } = req.body
  if (!hoTen) return res.status(400).json({ error: 'Tên Bệnh Nhân Là Bắt Buộc' })
  if (soDienThoai) {
    const exist = db.prepare('SELECT id FROM benhNhan WHERE soDienThoai = ? AND hoTen = ?').get(soDienThoai, hoTen)
    if (exist) return res.status(400).json({ error: 'Bệnh Nhân Này Đã Tồn Tại' })
  }
  const result = db.prepare(`
    INSERT INTO benhNhan (hoTen, ngaySinh, gioiTinh, soDienThoai, diaChi, tienSuBenh, diUng)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(hoTen, ngaySinh, gioiTinh, soDienThoai, diaChi, tienSuBenh, diUng)
  res.status(201).json({ id: result.lastInsertRowid, hoTen })
})
router.put('/:id', (req, res) => {
  const fields = []
  const params = []
  const allowed = ['hoTen', 'ngaySinh', 'gioiTinh', 'soDienThoai', 'diaChi', 'tienSuBenh', 'diUng']
  allowed.forEach(key => {
    if (req.body[key] !== undefined) {
      fields.push(`${key} = ?`)
      params.push(req.body[key])
    }
  })
  if (fields.length === 0) return res.json({ success: true })
  
  const existing = db.prepare('SELECT hoTen, soDienThoai FROM benhNhan WHERE id = ?').get(req.params.id)
  if (existing) {
    const newHoTen = req.body.hoTen || existing.hoTen
    const newSdt = req.body.soDienThoai || existing.soDienThoai
    if (newSdt) {
      const dup = db.prepare('SELECT id FROM benhNhan WHERE soDienThoai = ? AND hoTen = ? AND id != ?').get(newSdt, newHoTen, req.params.id)
      if (dup) return res.status(400).json({ error: 'Bệnh Nhân Này Đã Tồn Tại' })
    }
  }
  params.push(req.params.id)
  db.prepare(`UPDATE benhNhan SET ${fields.join(', ')} WHERE id = ?`).run(...params)
  res.json({ success: true })
})
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM benhNhan WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})
export default router