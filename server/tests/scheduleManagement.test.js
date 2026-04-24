import request from 'supertest'
import app from '../testApp.js'
import db from '../db.js'
beforeEach(() => {
  db.exec("DELETE FROM lichHen")
  db.exec("DELETE FROM sqlite_sequence WHERE name='lichHen'")
  db.exec("DELETE FROM benhNhan")
  db.exec("DELETE FROM sqlite_sequence WHERE name='benhNhan'")
  db.exec("DELETE FROM caLamViecMau")
  db.exec("DELETE FROM sqlite_sequence WHERE name='caLamViecMau'")
  db.exec("DELETE FROM bacSi")
  db.exec("DELETE FROM sqlite_sequence WHERE name='bacSi'")
})
describe('scheduleManagementPipeline', () => {
  it('manageDoctorSchedulesAndPatientAppointments', async () => {
    const doctorPayload = { hoTen: 'Bác Sĩ Hai', chuyenKhoa: 'Nhổ Răng', luongCo: 12000000, tyLeHoaHong: 15, loaiNhanVien: 'bacSi', ngayBatDau: '2026-01-01' }
    const createDoctorRes = await request(app).post('/api/bacSi').send(doctorPayload)
    expect(createDoctorRes.statusCode).toBe(201)
    const doctorId = createDoctorRes.body.id
    const shiftPayload = { bacSiId: doctorId, thuTrongTuan: 1, gioBatDau: '08:00', gioKetThuc: '17:00' }
    const createShiftRes = await request(app).post('/api/caLamViec').send(shiftPayload)
    expect(createShiftRes.statusCode).toBe(201)
    const patientPayload = { hoTen: 'Bệnh Nhân Một', soDienThoai: '0987654321', ngaySinh: '1990-01-01', diaChi: 'Hà Nội', gioiTinh: 'nam' }
    const createPatientRes = await request(app).post('/api/benhNhan').send(patientPayload)
    expect(createPatientRes.statusCode).toBe(201)
    const patientId = createPatientRes.body.id
    const validDate = new Date('2026-04-27')
    const validDateString = validDate.toISOString().slice(0, 10)
    const validAppointmentPayload = { benhNhanId: patientId, bacSiId: doctorId, ngayGio: `${validDateString}T10:00`, ghiChu: 'Khám Định Kỳ' }
    const validAppointmentRes = await request(app).post('/api/lichHen').send(validAppointmentPayload)
    expect(validAppointmentRes.statusCode).toBe(201)
    const outOfShiftAppointmentPayload = { benhNhanId: patientId, bacSiId: doctorId, ngayGio: `${validDateString}T18:00`, ghiChu: 'Khám Ngoài Giờ' }
    const outOfShiftAppointmentRes = await request(app).post('/api/lichHen').send(outOfShiftAppointmentPayload)
    expect(outOfShiftAppointmentRes.statusCode).toBe(409)
    expect(outOfShiftAppointmentRes.body.error).toBe('Giờ Đặt Nằm Ngoài Ca Làm Việc (08:00–17:00)')
    const wrongDayDate = new Date('2026-04-28')
    const wrongDayDateString = wrongDayDate.toISOString().slice(0, 10)
    const wrongDayAppointmentPayload = { benhNhanId: patientId, bacSiId: doctorId, ngayGio: `${wrongDayDateString}T10:00`, ghiChu: 'Khám Sai Ngày' }
    const wrongDayAppointmentRes = await request(app).post('/api/lichHen').send(wrongDayAppointmentPayload)
    expect(wrongDayAppointmentRes.statusCode).toBe(409)
    expect(wrongDayAppointmentRes.body.error).toBe('Bác Sĩ Không Có Ca Làm Việc Vào Ngày Này')
  })
})