import { Router } from 'express'
import db from '../db.js'
const router = Router()
router.get('/', (req, res) => {
  const { vaiTro, bacSiId } = req.user
  let query = `
    SELECT hd.*, bn.hoTen as tenBenhNhan, bs.hoTen as tenBacSi
    FROM hoaDon hd
    JOIN benhNhan bn ON hd.benhNhanId = bn.id
    JOIN bacSi bs ON hd.bacSiId = bs.id
  `
  const params = []
  if (vaiTro === 'bacSi') {
    query += ` WHERE hd.bacSiId = ? AND hd.trangThaiPhieu != 'nhapPhieu'`
    params.push(bacSiId)
  }
  query += ` ORDER BY hd.ngayTao DESC`
  res.json(db.prepare(query).all(...params))
})
router.get('/:id', (req, res) => {
  const hd = db.prepare(`
    SELECT hd.*, bn.hoTen as tenBenhNhan, bs.hoTen as tenBacSi
    FROM hoaDon hd
    JOIN benhNhan bn ON hd.benhNhanId = bn.id
    JOIN bacSi bs ON hd.bacSiId = bs.id
    WHERE hd.id = ?
  `).get(req.params.id)
  if (!hd) return res.status(404).json({ error: 'Không Tìm Thấy Hóa Đơn' })
  const chiTiet = db.prepare(`
    SELECT ct.*, dv.tenDichVu
    FROM chiTietHoaDon ct
    JOIN dichVu dv ON ct.dichVuId = dv.id
    WHERE ct.hoaDonId = ?
  `).all(req.params.id)
  res.json({ ...hd, chiTiet })
})
router.post('/', (req, res) => {
  const { benhNhanId, bacSiId, hoSoId, ghiChu, chiTiet } = req.body
  if (!benhNhanId || !bacSiId || !chiTiet || !chiTiet.length) return res.status(400).json({ error: 'Thiếu Thông Tin Bắt Buộc' })
  const tongTien = chiTiet.reduce((sum, item) => sum + item.soLuong * item.donGia, 0)
  const result = db.prepare(`INSERT INTO hoaDon (benhNhanId, bacSiId, hoSoId, tongTien, ghiChu, trangThaiPhieu) VALUES (?, ?, ?, ?, ?, ?)`).run(benhNhanId, bacSiId, hoSoId, tongTien, ghiChu, hoSoId ? 'daXacNhan' : 'nhapPhieu')
  const hoaDonId = result.lastInsertRowid
  const insertCt = db.prepare(`INSERT INTO chiTietHoaDon (hoaDonId, dichVuId, soLuong, donGia, thanhTien) VALUES (?, ?, ?, ?, ?)`)
  chiTiet.forEach(item => insertCt.run(hoaDonId, item.dichVuId, item.soLuong, item.donGia, item.soLuong * item.donGia))
  res.status(201).json({ id: hoaDonId, tongTien })
})
router.put('/:id/guiBacSi', (req, res) => {
  const hd = db.prepare('SELECT trangThaiPhieu FROM hoaDon WHERE id = ?').get(req.params.id)
  if (!hd) return res.status(404).json({ error: 'Không Tìm Thấy Hóa Đơn' })
  if (hd.trangThaiPhieu !== 'nhapPhieu') return res.status(400).json({ error: 'Hóa Đơn Không Ở Trạng Thái Soạn Thảo' })
  db.prepare(`UPDATE hoaDon SET trangThaiPhieu = 'choBacSi' WHERE id = ?`).run(req.params.id)
  res.json({ success: true })
})
router.put('/:id/suaChiTiet', (req, res) => {
  const { chiTiet } = req.body
  const hd = db.prepare('SELECT trangThaiPhieu FROM hoaDon WHERE id = ?').get(req.params.id)
  if (!hd) return res.status(404).json({ error: 'Không Tìm Thấy Hóa Đơn' })
  if (hd.trangThaiPhieu !== 'choBacSi') return res.status(400).json({ error: 'Hóa Đơn Không Ở Trạng Thái Chờ Bác Sĩ' })
  if (!chiTiet || !chiTiet.length) return res.status(400).json({ error: 'Cần Ít Nhất 1 Dịch Vụ' })
  const tongTien = chiTiet.reduce((sum, item) => sum + item.soLuong * item.donGia, 0)
  db.prepare('DELETE FROM chiTietHoaDon WHERE hoaDonId = ?').run(req.params.id)
  const insertCt = db.prepare(`INSERT INTO chiTietHoaDon (hoaDonId, dichVuId, soLuong, donGia, thanhTien) VALUES (?, ?, ?, ?, ?)`)
  chiTiet.forEach(item => insertCt.run(req.params.id, item.dichVuId, item.soLuong, item.donGia, item.soLuong * item.donGia))
  db.prepare('UPDATE hoaDon SET tongTien = ? WHERE id = ?').run(tongTien, req.params.id)
  res.json({ success: true, tongTien })
})
router.put('/:id/xacNhan', (req, res) => {
  const hd = db.prepare('SELECT trangThaiPhieu FROM hoaDon WHERE id = ?').get(req.params.id)
  if (!hd) return res.status(404).json({ error: 'Không Tìm Thấy Hóa Đơn' })
  if (hd.trangThaiPhieu !== 'choBacSi') return res.status(400).json({ error: 'Hóa Đơn Chưa Được Gửi Cho Bác Sĩ' })
  db.prepare(`UPDATE hoaDon SET trangThaiPhieu = 'daXacNhan' WHERE id = ?`).run(req.params.id)
  res.json({ success: true })
})
router.put('/:id/thanhToan', (req, res) => {
  const { daThanhToan } = req.body
  const hd = db.prepare('SELECT tongTien, trangThaiPhieu FROM hoaDon WHERE id = ?').get(req.params.id)
  if (!hd) return res.status(404).json({ error: 'Không Tìm Thấy Hóa Đơn' })
  if (hd.trangThaiPhieu !== 'daXacNhan') return res.status(400).json({ error: 'Hóa Đơn Chưa Được Bác Sĩ Xác Nhận' })
  const trangThai = daThanhToan >= hd.tongTien ? 'daThanhToan' : 'thanhToanMot'
  db.prepare(`UPDATE hoaDon SET daThanhToan=?, trangThai=? WHERE id=?`).run(daThanhToan, trangThai, req.params.id)
  res.json({ success: true, trangThai })
})
export default router