import { Router } from 'express'
import db from '../db.js'
const router = Router()
router.get('/', (req, res) => {
  const { thang, nam, bacSiId } = req.query
  let query = `
    SELECT nn.*, bs.hoTen as tenBacSi
    FROM ngayNghi nn
    LEFT JOIN bacSi bs ON nn.bacSiId = bs.id
  `
  const params = []
  const conditions = []
  if (thang && nam) {
    const startStr = `${nam}-${String(thang).padStart(2, '0')}-01`
    const endStr = `${nam}-${String(thang).padStart(2, '0')}-31`
    conditions.push(`nn.ngay BETWEEN ? AND ?`)
    params.push(startStr, endStr)
  }
  if (bacSiId) {
    conditions.push(`(nn.bacSiId = ? OR nn.bacSiId IS NULL)`)
    params.push(bacSiId)
  }
  if (conditions.length) {
    query += ` WHERE ` + conditions.join(' AND ')
  }
  query += ` ORDER BY nn.ngay DESC`
  const rows = db.prepare(query).all(...params)
  res.json(rows)
})
router.post('/', (req, res) => {
  const { bacSiId, ngay, loaiNghi, ghiChu } = req.body
  if (!ngay || !loaiNghi) return res.status(400).json({ error: 'Thiếu Thông Tin Bắt Buộc' })
  if (loaiNghi === 'nghiLe') {
    const exist = db.prepare('SELECT id FROM ngayNghi WHERE ngay = ? AND loaiNghi = ?').get(ngay, 'nghiLe')
    if (exist) return res.status(400).json({ error: 'Ngày Nghỉ Lễ Này Đã Tồn Tại' })
  } else {
    if (!bacSiId) return res.status(400).json({ error: 'Thiếu Thông Tin Nhân Viên' })
    const exist = db.prepare('SELECT id FROM ngayNghi WHERE ngay = ? AND (bacSiId = ? OR loaiNghi = ?)').get(ngay, bacSiId, 'nghiLe')
    if (exist) return res.status(400).json({ error: 'Nhân Viên Này Đã Có Lịch Nghỉ Hoặc Nghỉ Lễ Trong Ngày Này' })
  }
  db.prepare(`
    INSERT INTO ngayNghi (bacSiId, ngay, loaiNghi, ghiChu)
    VALUES (?, ?, ?, ?)
  `).run(bacSiId || null, ngay, loaiNghi, ghiChu || '')
  res.status(201).json({ success: true })
})
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM ngayNghi WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})
export default router