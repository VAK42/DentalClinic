import { Router } from 'express'
import db from '../db.js'
const router = Router()
router.get('/', (req, res) => {
  const query = `
    SELECT bl.*, bs.hoTen as tenBacSi
    FROM bangLuong bl
    JOIN bacSi bs ON bl.bacSiId = bs.id
    ${(req.user?.vaiTro === 'bacSi' || req.user?.vaiTro === 'leTan') ? 'WHERE bl.bacSiId = ?' : ''}
    ORDER BY bl.nam DESC, bl.thang DESC
  `
  const rows = db.prepare(query).all(...((req.user?.vaiTro === 'bacSi' || req.user?.vaiTro === 'leTan') ? [req.user.bacSiId] : []))
  res.json(rows)
})
router.post('/tinh', (req, res) => {
  const { bacSiId, thang, nam } = req.body
  if (!bacSiId || !thang || !nam) return res.status(400).json({ error: 'Thiếu Thông Tin' })
  const bacSi = db.prepare('SELECT * FROM bacSi WHERE id = ?').get(bacSiId)
  if (!bacSi) return res.status(404).json({ error: 'Không Tìm Thấy Nhân Viên' })
  const doanhThu = db.prepare(`
    SELECT COALESCE(SUM(ct.thanhTien), 0) as tong
    FROM chiTietHoaDon ct
    JOIN hoaDon hd ON ct.hoaDonId = hd.id
    WHERE hd.bacSiId = ?
    AND strftime('%m', hd.ngayTao) = printf('%02d', ?)
    AND strftime('%Y', hd.ngayTao) = ?
    AND hd.trangThai != 'chuaThanhToan'
  `).get(bacSiId, thang, String(nam))
  const hoaHong = Math.round(doanhThu.tong * bacSi.tyLeHoaHong / 100)
  const tongLuong = bacSi.luongCo + hoaHong
  const existing = db.prepare('SELECT id FROM bangLuong WHERE bacSiId=? AND thang=? AND nam=?').get(bacSiId, thang, nam)
  if (existing) {
    db.prepare(`UPDATE bangLuong SET luongCo=?, hoaHong=?, tongLuong=? WHERE id=?`).run(bacSi.luongCo, hoaHong, tongLuong, existing.id)
    return res.json({ id: existing.id, luongCo: bacSi.luongCo, hoaHong, tongLuong, doanhThu: doanhThu.tong })
  }
  const result = db.prepare(`
    INSERT INTO bangLuong (bacSiId, thang, nam, luongCo, hoaHong, tongLuong)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(bacSiId, thang, nam, bacSi.luongCo, hoaHong, tongLuong)
  res.status(201).json({ id: result.lastInsertRowid, luongCo: bacSi.luongCo, hoaHong, tongLuong, doanhThu: doanhThu.tong })
})
router.post('/tinhTatCa', (req, res) => {
  const { thang, nam } = req.body
  if (!thang || !nam) return res.status(400).json({ error: 'Thiếu Thông Tin' })
  const allNhanVien = db.prepare("SELECT * FROM bacSi WHERE trangThai = 'hoatDong'").all()
  const results = []
  for (const nv of allNhanVien) {
    const doanhThu = db.prepare(`
      SELECT COALESCE(SUM(ct.thanhTien), 0) as tong
      FROM chiTietHoaDon ct
      JOIN hoaDon hd ON ct.hoaDonId = hd.id
      WHERE hd.bacSiId = ?
      AND strftime('%m', hd.ngayTao) = printf('%02d', ?)
      AND strftime('%Y', hd.ngayTao) = ?
      AND hd.trangThai != 'chuaThanhToan'
    `).get(nv.id, thang, String(nam))
    const hoaHong = Math.round(doanhThu.tong * nv.tyLeHoaHong / 100)
    const tongLuong = nv.luongCo + hoaHong
    const existing = db.prepare('SELECT id FROM bangLuong WHERE bacSiId=? AND thang=? AND nam=?').get(nv.id, thang, nam)
    if (existing) {
      db.prepare('UPDATE bangLuong SET luongCo=?, hoaHong=?, tongLuong=? WHERE id=?').run(nv.luongCo, hoaHong, tongLuong, existing.id)
    } else {
      db.prepare('INSERT INTO bangLuong (bacSiId, thang, nam, luongCo, hoaHong, tongLuong) VALUES (?, ?, ?, ?, ?, ?)').run(nv.id, thang, nam, nv.luongCo, hoaHong, tongLuong)
    }
    results.push({ hoTen: nv.hoTen, luongCo: nv.luongCo, hoaHong, tongLuong, doanhThu: doanhThu.tong })
  }
  res.json(results)
})
router.put('/:id/thanhToan', (req, res) => {
  db.prepare(`UPDATE bangLuong SET trangThai = 'daThanhToan' WHERE id = ?`).run(req.params.id)
  res.json({ success: true })
})
export default router