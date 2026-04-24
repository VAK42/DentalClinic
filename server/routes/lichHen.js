import { Router } from 'express'
import db from '../db.js'
const router = Router()
router.get('/', (req, res) => {
  const { ngay, bacSiId } = req.query
  let query = `
    SELECT lh.*, bn.hoTen as tenBenhNhan, bs.hoTen as tenBacSi,
           (SELECT COUNT(*) FROM hoSoBenhAn WHERE lichHenId = lh.id) > 0 as hasHoSo
    FROM lichHen lh
    JOIN benhNhan bn ON lh.benhNhanId = bn.id
    JOIN bacSi bs ON lh.bacSiId = bs.id
  `
  const params = []
  const conditions = []
  if (ngay) { conditions.push(`date(lh.ngayGio) = ?`); params.push(ngay) }
  if (req.user?.vaiTro === 'bacSi') { conditions.push(`lh.bacSiId = ?`); params.push(req.user.bacSiId) }
  else if (bacSiId) { conditions.push(`lh.bacSiId = ?`); params.push(bacSiId) }
  if (conditions.length) query += ` WHERE ` + conditions.join(' AND ')
  query += ` ORDER BY lh.ngayGio`
  res.json(db.prepare(query).all(...params))
})
router.get('/:id', (req, res) => {
  const row = db.prepare(`
    SELECT lh.*, bn.hoTen as tenBenhNhan, bs.hoTen as tenBacSi
    FROM lichHen lh
    JOIN benhNhan bn ON lh.benhNhanId = bn.id
    JOIN bacSi bs ON lh.bacSiId = bs.id
    WHERE lh.id = ? ${req.user?.vaiTro === 'bacSi' ? 'AND lh.bacSiId = ?' : ''}
  `).get(req.params.id, ...(req.user?.vaiTro === 'bacSi' ? [req.user.bacSiId] : []))
  if (!row) return res.status(404).json({ error: 'Không Tìm Thấy Lịch Hẹn' })
  res.json(row)
})
router.post('/', (req, res) => {
  const { benhNhanId, bacSiId, ngayGio, ghiChu } = req.body
  const actualBacSiId = req.user?.vaiTro === 'bacSi' ? req.user.bacSiId : bacSiId
  if (!benhNhanId || !actualBacSiId || !ngayGio) return res.status(400).json({ error: 'Thiếu Thông Tin Bắt Buộc' })
  const thuRow = db.prepare(`SELECT CAST(strftime('%w', ?) AS INTEGER) as thu`).get(ngayGio.slice(0, 10))
  const ca = db.prepare('SELECT * FROM caLamViecMau WHERE bacSiId=? AND thuTrongTuan=?').get(actualBacSiId, thuRow.thu)
  if (!ca) return res.status(409).json({ error: 'Bác Sĩ Không Có Ca Làm Việc Vào Ngày Này' })
  const gio = ngayGio.slice(11, 16)
  if (gio < ca.gioBatDau || gio >= ca.gioKetThuc) return res.status(409).json({ error: `Giờ Đặt Nằm Ngoài Ca Làm Việc (${ca.gioBatDau}–${ca.gioKetThuc})` })
  const trung = db.prepare(`SELECT id FROM lichHen WHERE bacSiId=? AND ngayGio=? AND trangThai != 'daHuy'`).get(actualBacSiId, ngayGio)
  if (trung) return res.status(409).json({ error: 'Bác Sĩ Đã Có Lịch Hẹn Vào Thời Điểm Này' })
  const result = db.prepare(`INSERT INTO lichHen (benhNhanId, bacSiId, ngayGio, ghiChu) VALUES (?, ?, ?, ?)`).run(benhNhanId, actualBacSiId, ngayGio, ghiChu)
  res.status(201).json({ id: result.lastInsertRowid })
})
router.put('/:id', (req, res) => {
  const fields = []
  const params = []
  const allowed = ['ngayGio', 'trangThai', 'ghiChu', 'bacSiId']
  allowed.forEach(key => {
    if (req.body[key] !== undefined) {
      fields.push(`${key} = ?`)
      params.push(req.body[key])
    }
  })
  if (fields.length === 0) return res.json({ success: true })
  params.push(req.params.id)
  db.prepare(`UPDATE lichHen SET ${fields.join(', ')} WHERE id = ?`).run(...params)
  res.json({ success: true })
})
router.delete('/:id', (req, res) => {
  db.prepare(`UPDATE lichHen SET trangThai = 'daHuy' WHERE id = ?`).run(req.params.id)
  res.json({ success: true })
})
export default router