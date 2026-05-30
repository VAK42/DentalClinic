import { Router } from 'express'
import db from '../db.js'
const router = Router()
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM bacSi ORDER BY hoTen').all()
  res.json(rows)
})
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM bacSi WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Không Tìm Thấy Nhân Viên' })
  res.json(row)
})
router.post('/', (req, res) => {
  const { hoTen, chuyenKhoa, soDienThoai, email, luongCo, tyLeHoaHong, ngayBatDau, loaiNhanVien, bangCap } = req.body
  if (!hoTen) return res.status(400).json({ error: 'Tên Nhân Viên Là Bắt Buộc' })
  if (soDienThoai) {
    const exist = db.prepare('SELECT id FROM bacSi WHERE soDienThoai = ? AND trangThai != "ngungHoatDong"').get(soDienThoai)
    if (exist) return res.status(400).json({ error: 'Số Điện Thoại Này Đã Tồn Tại' })
  }
  const result = db.prepare(`
    INSERT INTO bacSi (hoTen, chuyenKhoa, soDienThoai, email, luongCo, tyLeHoaHong, ngayBatDau, loaiNhanVien, bangCap)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(hoTen, chuyenKhoa, soDienThoai, email, luongCo || 0, tyLeHoaHong || 0, ngayBatDau, loaiNhanVien || 'bacSi', bangCap || 'cuNhan')
  res.status(201).json({ id: result.lastInsertRowid, hoTen })
})
router.put('/:id', (req, res) => {
  const fields = []
  const params = []
  const allowed = ['hoTen', 'chuyenKhoa', 'soDienThoai', 'email', 'luongCo', 'tyLeHoaHong', 'ngayBatDau', 'trangThai', 'loaiNhanVien', 'bangCap']
  allowed.forEach(key => {
    if (req.body[key] !== undefined) {
      fields.push(`${key} = ?`)
      params.push(req.body[key])
    }
  })
  if (fields.length === 0) return res.json({ success: true })
  if (req.body.soDienThoai) {
    const exist = db.prepare('SELECT id FROM bacSi WHERE soDienThoai = ? AND id != ? AND trangThai != "ngungHoatDong"').get(req.body.soDienThoai, req.params.id)
    if (exist) return res.status(400).json({ error: 'Số Điện Thoại Này Đã Tồn Tại' })
  }
  params.push(req.params.id)
  db.prepare(`UPDATE bacSi SET ${fields.join(', ')} WHERE id = ?`).run(...params)
  res.json({ success: true })
})
router.delete('/:id', (req, res) => {
  db.prepare('UPDATE bacSi SET trangThai = ? WHERE id = ?').run('ngungHoatDong', req.params.id)
  res.json({ success: true })
})
export default router