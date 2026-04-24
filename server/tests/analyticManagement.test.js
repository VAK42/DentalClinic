import request from 'supertest'
import app from '../testApp.js'
import db from '../db.js'
beforeEach(() => {
  db.exec("DELETE FROM bangLuong")
  db.exec("DELETE FROM sqlite_sequence WHERE name='bangLuong'")
  db.exec("DELETE FROM chiTietHoaDon")
  db.exec("DELETE FROM sqlite_sequence WHERE name='chiTietHoaDon'")
  db.exec("DELETE FROM hoaDon")
  db.exec("DELETE FROM sqlite_sequence WHERE name='hoaDon'")
  db.exec("DELETE FROM hoSoBenhAn")
  db.exec("DELETE FROM sqlite_sequence WHERE name='hoSoBenhAn'")
  db.exec("DELETE FROM dichVu")
  db.exec("DELETE FROM sqlite_sequence WHERE name='dichVu'")
  db.exec("DELETE FROM lichHen")
  db.exec("DELETE FROM sqlite_sequence WHERE name='lichHen'")
  db.exec("DELETE FROM benhNhan")
  db.exec("DELETE FROM sqlite_sequence WHERE name='benhNhan'")
  db.exec("DELETE FROM bacSi")
  db.exec("DELETE FROM sqlite_sequence WHERE name='bacSi'")
})
describe('analyticManagementPipeline', () => {
  it('calculateSalaryAndCheckDashboardStats', async () => {
    const doctorPayload = { hoTen: 'Bác Sĩ Bốn', chuyenKhoa: 'Cạo Vôi Răng', luongCo: 10000000, tyLeHoaHong: 10, loaiNhanVien: 'bacSi', ngayBatDau: '2026-01-01' }
    const createDoctorRes = await request(app).post('/api/bacSi').send(doctorPayload)
    const doctorId = createDoctorRes.body.id
    const patientPayload = { hoTen: 'Bệnh Nhân Ba', soDienThoai: '0933333333', ngaySinh: '2000-10-10', diaChi: 'Đà Nẵng', gioiTinh: 'nam' }
    const createPatientRes = await request(app).post('/api/benhNhan').send(patientPayload)
    const patientId = createPatientRes.body.id
    const appointmentPayload = { benhNhanId: patientId, bacSiId: doctorId, ngayGio: new Date().toISOString().slice(0, 10) + 'T10:00', ghiChu: 'Khám Lần Đầu' }
    db.prepare('INSERT INTO lichHen (benhNhanId, bacSiId, ngayGio, ghiChu) VALUES (?, ?, ?, ?)').run(patientId, doctorId, appointmentPayload.ngayGio, appointmentPayload.ghiChu)
    const servicePayload = { tenDichVu: 'Cạo Vôi Răng Đơn Giản', moTa: 'Cạo vôi siêu âm', donGia: 300000, nhom: 'Nha Chu' }
    const createServiceRes = await request(app).post('/api/dichVu').send(servicePayload)
    const serviceId = createServiceRes.body.id
    const invoicePayload = { benhNhanId: patientId, bacSiId: doctorId, hoSoId: null, ghiChu: 'Thanh Toán Cạo Vôi', chiTiet: [{ dichVuId: serviceId, soLuong: 1, donGia: 300000 }] }
    const createInvoiceRes = await request(app).post('/api/hoaDon').send(invoicePayload)
    const invoiceId = createInvoiceRes.body.id
    await request(app).put(`/api/hoaDon/${invoiceId}/thanhToan`).send({ daThanhToan: 300000 })
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()
    const payrollRes = await request(app).post('/api/bangLuong/tinhTatCa').send({ thang: currentMonth, nam: currentYear })
    expect(payrollRes.statusCode).toBe(200)
    expect(payrollRes.body.length).toBe(1)
    const doctorPayroll = payrollRes.body[0]
    expect(doctorPayroll.hoTen).toBe('Bác Sĩ Bốn')
    expect(doctorPayroll.luongCo).toBe(10000000)
    expect(doctorPayroll.doanhThu).toBe(300000)
    expect(doctorPayroll.hoaHong).toBe(30000)
    expect(doctorPayroll.tongLuong).toBe(10030000)
    const statsRes = await request(app).get('/api/thongKe/tongQuan')
    expect(statsRes.statusCode).toBe(200)
    expect(statsRes.body.thucThu).toBe(300000)
    expect(statsRes.body.phatSinh).toBe(300000)
    expect(statsRes.body.benhNhanMoi).toBe(1)
  })
})