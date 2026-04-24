import request from 'supertest'
import app from '../testApp.js'
import db from '../db.js'
beforeEach(() => {
  db.exec("DELETE FROM hoaDon")
  db.exec("DELETE FROM sqlite_sequence WHERE name='hoaDon'")
  db.exec("DELETE FROM chiTietHoaDon")
  db.exec("DELETE FROM sqlite_sequence WHERE name='chiTietHoaDon'")
  db.exec("DELETE FROM hoSoBenhAn")
  db.exec("DELETE FROM sqlite_sequence WHERE name='hoSoBenhAn'")
  db.exec("DELETE FROM dichVu")
  db.exec("DELETE FROM sqlite_sequence WHERE name='dichVu'")
  db.exec("DELETE FROM lichHen")
  db.exec("DELETE FROM sqlite_sequence WHERE name='lichHen'")
  db.exec("DELETE FROM benhNhan")
  db.exec("DELETE FROM sqlite_sequence WHERE name='benhNhan'")
  db.exec("DELETE FROM caLamViecMau")
  db.exec("DELETE FROM sqlite_sequence WHERE name='caLamViecMau'")
  db.exec("DELETE FROM bacSi")
  db.exec("DELETE FROM sqlite_sequence WHERE name='bacSi'")
})
describe('patientManagementPipeline', () => {
  it('manageCompletePatientVisitLifecycle', async () => {
    const doctorPayload = { hoTen: 'Bác Sĩ Ba', chuyenKhoa: 'Trám Răng', luongCo: 10000000, tyLeHoaHong: 20, loaiNhanVien: 'bacSi', ngayBatDau: '2026-01-01' }
    const createDoctorRes = await request(app).post('/api/bacSi').send(doctorPayload)
    const doctorId = createDoctorRes.body.id
    const shiftPayload = { bacSiId: doctorId, thuTrongTuan: 2, gioBatDau: '08:00', gioKetThuc: '17:00' }
    await request(app).post('/api/caLamViec').send(shiftPayload)
    const patientPayload = { hoTen: 'Bệnh Nhân Hai', soDienThoai: '0912345678', ngaySinh: '1995-05-05', diaChi: 'Hồ Chí Minh', gioiTinh: 'nu' }
    const createPatientRes = await request(app).post('/api/benhNhan').send(patientPayload)
    const patientId = createPatientRes.body.id
    const validDate = new Date('2026-04-28')
    const validDateString = validDate.toISOString().slice(0, 10)
    const appointmentPayload = { benhNhanId: patientId, bacSiId: doctorId, ngayGio: `${validDateString}T09:00`, ghiChu: 'Đau Răng' }
    const createAppointmentRes = await request(app).post('/api/lichHen').send(appointmentPayload)
    const appointmentId = createAppointmentRes.body.id
    await request(app).put(`/api/lichHen/${appointmentId}`).send({ trangThai: 'dangKham' })
    const servicePayload = { tenDichVu: 'Trám Răng Thẩm Mỹ', moTa: 'Trám bằng Composite', donGia: 500000, nhom: 'Phục Hình' }
    const createServiceRes = await request(app).post('/api/dichVu').send(servicePayload)
    const serviceId = createServiceRes.body.id
    const medicalRecordPayload = { benhNhanId: patientId, bacSiId: doctorId, lichHenId: appointmentId, chuanDoan: 'Sâu Răng Số 6', ghiChuLamSang: 'Cần Trám Kỹ', tinhTrangRang: [{ soRang: '46', tinhTrang: 'Sâu Nhẹ', ghiChu: 'Đã Trám' }] }
    const createMedicalRecordRes = await request(app).post('/api/hoSoBenhAn').send(medicalRecordPayload)
    expect(createMedicalRecordRes.statusCode).toBe(201)
    const medicalRecordId = createMedicalRecordRes.body.id
    const invoicePayload = { benhNhanId: patientId, bacSiId: doctorId, hoSoId: medicalRecordId, ghiChu: 'Thanh Toán Trám Răng', chiTiet: [{ dichVuId: serviceId, soLuong: 1, donGia: 500000 }] }
    const createInvoiceRes = await request(app).post('/api/hoaDon').send(invoicePayload)
    expect(createInvoiceRes.statusCode).toBe(201)
    const invoiceId = createInvoiceRes.body.id
    const paymentPayload = { daThanhToan: 500000 }
    const payInvoiceRes = await request(app).put(`/api/hoaDon/${invoiceId}/thanhToan`).send(paymentPayload)
    expect(payInvoiceRes.statusCode).toBe(200)
    expect(payInvoiceRes.body.trangThai).toBe('daThanhToan')
    const patientHistoryRes = await request(app).get(`/api/hoSoBenhAn/benhNhan/${patientId}`)
    expect(patientHistoryRes.statusCode).toBe(200)
    expect(patientHistoryRes.body.length).toBe(1)
    expect(patientHistoryRes.body[0].chuanDoan).toBe('Sâu Răng Số 6')
    const invoiceRes = await request(app).get(`/api/hoaDon/${invoiceId}`)
    expect(invoiceRes.statusCode).toBe(200)
    expect(invoiceRes.body.trangThai).toBe('daThanhToan')
  })
})