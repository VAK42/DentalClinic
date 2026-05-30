import { Router } from 'express'
import db from '../db.js'
const router = Router()
router.get('/benhNhan/:benhNhanId', (req, res) => {
  const rows = db.prepare(`
    SELECT hs.*, bs.hoTen as tenBacSi
    FROM hoSoBenhAn hs
    JOIN bacSi bs ON hs.bacSiId = bs.id
    WHERE hs.benhNhanId = ? ${req.user?.vaiTro === 'bacSi' ? 'AND hs.bacSiId = ?' : ''}
    ORDER BY hs.ngayKham DESC
  `).all(req.params.benhNhanId, ...(req.user?.vaiTro === 'bacSi' ? [req.user.bacSiId] : []))
  const results = rows.map(r => ({
    ...r,
    dichVu: r.dichVu ? JSON.parse(r.dichVu) : []
  }))
  res.json(results)
})
router.get('/:id', (req, res) => {
  const hoSo = db.prepare(`
    SELECT hs.*, bs.hoTen as tenBacSi, bn.hoTen as tenBenhNhan
    FROM hoSoBenhAn hs
    JOIN bacSi bs ON hs.bacSiId = bs.id
    JOIN benhNhan bn ON hs.benhNhanId = bn.id
    WHERE hs.id = ? ${req.user?.vaiTro === 'bacSi' ? 'AND hs.bacSiId = ?' : ''}
  `).get(req.params.id, ...(req.user?.vaiTro === 'bacSi' ? [req.user.bacSiId] : []))
  if (!hoSo) return res.status(404).json({ error: 'Không Tìm Thấy Hồ Sơ' })
  const rang = db.prepare('SELECT * FROM tinhTrangRang WHERE hoSoId = ? ORDER BY soRang').all(req.params.id)
  res.json({
    ...hoSo,
    dichVu: hoSo.dichVu ? JSON.parse(hoSo.dichVu) : [],
    tinhTrangRang: rang
  })
})
router.post('/', (req, res) => {
  const { benhNhanId, bacSiId, lichHenId, chuanDoan, ghiChuLamSang, tinhTrangRang, trangThai, dichVu, heSoPhucTap } = req.body
  const actualBacSiId = req.user?.vaiTro === 'bacSi' ? req.user.bacSiId : bacSiId
  if (!benhNhanId || !actualBacSiId) return res.status(400).json({ error: 'Thiếu Thông Tin Bắt Buộc' })
  const dichVuStr = dichVu ? JSON.stringify(dichVu) : '[]'
  const hspt = heSoPhucTap ? parseFloat(heSoPhucTap) : 0.0
  const result = db.prepare(`
    INSERT INTO hoSoBenhAn (benhNhanId, bacSiId, lichHenId, chuanDoan, ghiChuLamSang, trangThai, dichVu, heSoPhucTap)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(benhNhanId, actualBacSiId, lichHenId, chuanDoan, ghiChuLamSang, trangThai || 'choKham', dichVuStr, hspt)
  const hoSoId = result.lastInsertRowid
  if (tinhTrangRang && Array.isArray(tinhTrangRang)) {
    const insertRang = db.prepare(`INSERT INTO tinhTrangRang (hoSoId, soRang, tinhTrang, ghiChu) VALUES (?, ?, ?, ?)`)
    tinhTrangRang.forEach(r => insertRang.run(hoSoId, r.soRang, r.tinhTrang, r.ghiChu))
  }
  res.status(201).json({ id: hoSoId })
})
router.put('/:id', (req, res) => {
  const { chuanDoan, ghiChuLamSang, tinhTrangRang, trangThai, dichVu, heSoPhucTap } = req.body
  const dichVuStr = dichVu ? JSON.stringify(dichVu) : '[]'
  const hspt = heSoPhucTap ? parseFloat(heSoPhucTap) : 0.0
  db.prepare(`
    UPDATE hoSoBenhAn
    SET chuanDoan = ?, ghiChuLamSang = ?, trangThai = ?, dichVu = ?, heSoPhucTap = ?
    WHERE id = ?
  `).run(chuanDoan || '', ghiChuLamSang || '', trangThai || 'daKham', dichVuStr, hspt, req.params.id)
  if (trangThai) {
    db.prepare(`
      UPDATE lichHen
      SET trangThai = ?
      WHERE id = (SELECT lichHenId FROM hoSoBenhAn WHERE id = ?)
    `).run(trangThai, req.params.id)
  }
  if (tinhTrangRang && Array.isArray(tinhTrangRang)) {
    db.prepare('DELETE FROM tinhTrangRang WHERE hoSoId = ?').run(req.params.id)
    const insertRang = db.prepare(`INSERT INTO tinhTrangRang (hoSoId, soRang, tinhTrang, ghiChu) VALUES (?, ?, ?, ?)`)
    tinhTrangRang.forEach(r => insertRang.run(req.params.id, r.soRang, r.tinhTrang, r.ghiChu))
  }
  res.json({ success: true })
})
export default router