import request from 'supertest'
import app from '../testApp.js'
import db from '../db.js'
beforeEach(() => {
  db.exec("DELETE FROM taiKhoan")
  db.exec("DELETE FROM sqlite_sequence WHERE name='taiKhoan'")
  db.exec("DELETE FROM bacSi")
  db.exec("DELETE FROM sqlite_sequence WHERE name='bacSi'")
  db.exec("DELETE FROM dichVu")
  db.exec("DELETE FROM sqlite_sequence WHERE name='dichVu'")
})
describe('systemManagementPipeline', () => {
  it('manageSystemEntities', async () => {
    const receptionistPayload = { hoTen: 'Lễ Tân Một', chuyenKhoa: 'Tiếp Tân', luongCo: 8000000, tyLeHoaHong: 0, loaiNhanVien: 'leTan', ngayBatDau: '2026-01-01' }
    const createReceptionistRes = await request(app).post('/api/bacSi').send(receptionistPayload)
    expect(createReceptionistRes.statusCode).toBe(201)
    const receptionistId = createReceptionistRes.body.id
    const doctorPayload = { hoTen: 'Bác Sĩ Một', chuyenKhoa: 'Nha Khoa Tổng Quát', luongCo: 15000000, tyLeHoaHong: 10, loaiNhanVien: 'bacSi', ngayBatDau: '2026-01-01' }
    const createDoctorRes = await request(app).post('/api/bacSi').send(doctorPayload)
    expect(createDoctorRes.statusCode).toBe(201)
    const doctorId = createDoctorRes.body.id
    const receptionistAccountPayload = { tenDangNhap: 'leTanMot', matKhau: 'password123', vaiTro: 'leTan', bacSiId: receptionistId }
    const createReceptionistAccountRes = await request(app).post('/api/taiKhoan').send(receptionistAccountPayload)
    expect(createReceptionistAccountRes.statusCode).toBe(200)
    const doctorAccountPayload = { tenDangNhap: 'bacSiMot', matKhau: 'password123', vaiTro: 'bacSi', bacSiId: doctorId }
    const createDoctorAccountRes = await request(app).post('/api/taiKhoan').send(doctorAccountPayload)
    expect(createDoctorAccountRes.statusCode).toBe(200)
    const getAllAccountsRes = await request(app).get('/api/taiKhoan')
    expect(getAllAccountsRes.statusCode).toBe(200)
    expect(getAllAccountsRes.body.length).toBe(2)
    const duplicateDoctorAccountRes = await request(app).post('/api/taiKhoan').send(doctorAccountPayload)
    expect(duplicateDoctorAccountRes.statusCode).toBe(400)
    expect(duplicateDoctorAccountRes.body.error).toBe('Tên Đăng Nhập Đã Tồn Tại')
    const duplicateProfileAccountPayload = { tenDangNhap: 'bacSiHai', matKhau: 'password123', vaiTro: 'bacSi', bacSiId: doctorId }
    const duplicateProfileAccountRes = await request(app).post('/api/taiKhoan').send(duplicateProfileAccountPayload)
    expect(duplicateProfileAccountRes.statusCode).toBe(400)
    expect(duplicateProfileAccountRes.body.error).toBe('Hồ Sơ Nhân Viên Này Đã Được Liên Kết Với Tài Khoản Khác')
    const servicePayload = { tenDichVu: 'Trám Răng Sứ', moTa: 'Trám Răng Sứ', donGia: 1500000, nhom: 'Phục Hình' }
    const createServiceRes = await request(app).post('/api/dichVu').send(servicePayload)
    expect(createServiceRes.statusCode).toBe(201)
    const getServicesRes = await request(app).get('/api/dichVu')
    expect(getServicesRes.statusCode).toBe(200)
    expect(getServicesRes.body.length).toBeGreaterThan(0)
  })
})