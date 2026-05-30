import { Router } from 'express'
import db from '../db.js'
const router = Router()
const tinhLuongBacSi = (bacSiId, thang, nam) => {
  const bacSi = db.prepare('SELECT * FROM bacSi WHERE id = ?').get(bacSiId)
  if (!bacSi) throw new Error('Không Tìm Thấy Nhân Viên')
  const rateKey = bacSi.loaiNhanVien === 'leTan' ? 'soTienMotGioLeTan' : 'soTienMotGioBacSi'
  const config = db.prepare("SELECT value FROM cauHinh WHERE key = ?").get(rateKey)
  const soTienMotGio = config ? parseFloat(config.value) : (bacSi.loaiNhanVien === 'leTan' ? 50000 : 100000)
  let heSoBacSi = 1.0
  if (bacSi.loaiNhanVien === 'bacSi') {
    const map = { cuNhan: 1.3, thacSy: 1.5, tienSy: 1.7, phoGiaoSu: 2.0, giaoSu: 2.5 }
    heSoBacSi = map[bacSi.bangCap] || 1.0
  }
  const doanhThu = db.prepare(`
    SELECT COALESCE(SUM(ct.thanhTien), 0) as tong
    FROM chiTietHoaDon ct
    JOIN hoaDon hd ON ct.hoaDonId = hd.id
    WHERE hd.bacSiId = ? AND strftime('%m', hd.ngayTao) = printf('%02d', ?) AND strftime('%Y', hd.ngayTao) = ? AND hd.trangThai != 'chuaThanhToan'
  `).get(bacSiId, thang, String(nam))
  const hoaHong = Math.round(doanhThu.tong * bacSi.tyLeHoaHong / 100)
  const caMau = db.prepare('SELECT * FROM caLamViecMau WHERE bacSiId = ?').all(bacSiId)
  const startStr = `${nam}-${String(thang).padStart(2, '0')}-01`
  const endStr = `${nam}-${String(thang).padStart(2, '0')}-31`
  const ngayNghis = db.prepare(`
    SELECT ngay, loaiNghi FROM ngayNghi WHERE (bacSiId = ? OR bacSiId IS NULL) AND ngay BETWEEN ? AND ?
  `).all(bacSiId, startStr, endStr)
  let soNgayNghiPhep = 0
  let soNgayNghiLe = 0
  const nghiaSet = {}
  ngayNghis.forEach(n => {
    nghiaSet[n.ngay] = n.loaiNghi
    if (n.loaiNghi === 'nghiPhep') soNgayNghiPhep++
    if (n.loaiNghi === 'nghiLe') soNgayNghiLe++
  })
  const hoSos = db.prepare(`
    SELECT date(ngayKham) as ngay, heSoPhucTap FROM hoSoBenhAn 
    WHERE bacSiId = ? AND strftime('%m', ngayKham) = printf('%02d', ?) AND strftime('%Y', ngayKham) = ?
  `).all(bacSiId, thang, String(nam))
  const hoSoByDate = {}
  hoSos.forEach(hs => {
    if (!hoSoByDate[hs.ngay]) hoSoByDate[hs.ngay] = 0
    hoSoByDate[hs.ngay] += (hs.heSoPhucTap || 0)
  })
  let soGioQuyDoi = 0
  const daysInMonth = new Date(nam, thang, 0).getDate()
  for (let i = 1; i <= daysInMonth; i++) {
    const dStr = `${nam}-${String(thang).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    const dateObj = new Date(dStr)
    const thu = dateObj.getDay()
    const ca = caMau.find(c => c.thuTrongTuan === thu)
    if (!ca) continue
    if (nghiaSet[dStr]) continue
    const startParts = ca.gioBatDau.split(':')
    const endParts = ca.gioKetThuc.split(':')
    const hStart = parseInt(startParts[0]) + parseInt(startParts[1])/60
    const hEnd = parseInt(endParts[0]) + parseInt(endParts[1])/60
    const soGioMoiCa = Math.max(0, hEnd - hStart)
    const tongHeSoBenhNhan = hoSoByDate[dStr] || 0
    const heSoVuotMuc = Math.max(0, (ca.heSo - 1) + tongHeSoBenhNhan)
    soGioQuyDoi += soGioMoiCa * heSoVuotMuc
  }
  const tienLamThem = soGioQuyDoi * heSoBacSi * soTienMotGio
  let tienTruNghiPhep = 0
  if (soNgayNghiPhep > 2) {
    tienTruNghiPhep = (soNgayNghiPhep - 2) * (0.05 * bacSi.luongCo)
  }
  const tongLuong = bacSi.luongCo + hoaHong + tienLamThem - tienTruNghiPhep
  const existing = db.prepare('SELECT id FROM bangLuong WHERE bacSiId=? AND thang=? AND nam=?').get(bacSiId, thang, nam)
  let id = existing ? existing.id : null
  if (existing) {
    db.prepare(`
      UPDATE bangLuong 
      SET luongCo=?, hoaHong=?, tongLuong=?, soGioQuyDoi=?, heSoBacSi=?, tienLamThem=?, soNgayNghiPhep=?, soNgayNghiLe=?, tienTruNghiPhep=? 
      WHERE id=?
    `).run(bacSi.luongCo, hoaHong, tongLuong, soGioQuyDoi, heSoBacSi, tienLamThem, soNgayNghiPhep, soNgayNghiLe, tienTruNghiPhep, existing.id)
  } else {
    const res = db.prepare(`
      INSERT INTO bangLuong (bacSiId, thang, nam, luongCo, hoaHong, tongLuong, soGioQuyDoi, heSoBacSi, tienLamThem, soNgayNghiPhep, soNgayNghiLe, tienTruNghiPhep) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(bacSiId, thang, nam, bacSi.luongCo, hoaHong, tongLuong, soGioQuyDoi, heSoBacSi, tienLamThem, soNgayNghiPhep, soNgayNghiLe, tienTruNghiPhep)
    id = res.lastInsertRowid
  }
  return { id, luongCo: bacSi.luongCo, hoaHong, soGioQuyDoi, tienLamThem, tienTruNghiPhep, tongLuong, doanhThu: doanhThu.tong, hoTen: bacSi.hoTen }
}
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
  try {
    const kq = tinhLuongBacSi(bacSiId, thang, nam)
    res.json(kq)
  } catch (err) {
    res.status(404).json({ error: err.message })
  }
})
router.post('/tinhTatCa', (req, res) => {
  const { thang, nam } = req.body
  if (!thang || !nam) return res.status(400).json({ error: 'Thiếu Thông Tin' })
  const allNhanVien = db.prepare("SELECT id FROM bacSi WHERE trangThai = 'hoatDong'").all()
  const results = []
  for (const nv of allNhanVien) {
    try {
      results.push(tinhLuongBacSi(nv.id, thang, nam))
    } catch(e) {}
  }
  res.json(results)
})
router.put('/:id/thanhToan', (req, res) => {
  db.prepare(`UPDATE bangLuong SET trangThai = 'daThanhToan' WHERE id = ?`).run(req.params.id)
  res.json({ success: true })
})
router.get('/baoCao/nam', (req, res) => {
  const { nam, bacSiId } = req.query
  if (!nam) return res.status(400).json({ error: 'Thiếu Năm' })
  let q = `
    SELECT bl.thang, bl.nam, bl.bacSiId, bs.hoTen, bl.luongCo, bl.hoaHong, bl.tienLamThem, bl.tienTruNghiPhep, bl.tongLuong
    FROM bangLuong bl
    JOIN bacSi bs ON bl.bacSiId = bs.id
    WHERE bl.nam = ?
  `
  const params = [nam]
  const authBacSiId = (req.user?.vaiTro === 'bacSi' || req.user?.vaiTro === 'leTan') ? req.user.bacSiId : null
  const targetBacSiId = authBacSiId || bacSiId
  if (targetBacSiId) {
    q += ` AND bl.bacSiId = ?`
    params.push(targetBacSiId)
  }
  q += ` ORDER BY bl.thang ASC`
  const rows = db.prepare(q).all(...params)
  res.json(rows)
})
export default router