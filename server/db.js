import Database from 'better-sqlite3'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
const dbPath = process.env.env === 'test' ? ':memory:' : join(__dirname, 'dentalClinic.db')
const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')
db.exec(`
  CREATE TABLE IF NOT EXISTS bacSi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hoTen TEXT NOT NULL,
    chuyenKhoa TEXT,
    soDienThoai TEXT,
    email TEXT,
    luongCo REAL DEFAULT 0,
    tyLeHoaHong REAL DEFAULT 0,
    ngayBatDau TEXT,
    loaiNhanVien TEXT DEFAULT 'bacSi',
    bangCap TEXT DEFAULT 'cuNhan',
    trangThai TEXT DEFAULT 'hoatDong',
    createdAt TEXT DEFAULT (datetime('now','localtime'))
  );
  CREATE TABLE IF NOT EXISTS benhNhan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hoTen TEXT NOT NULL,
    ngaySinh TEXT,
    gioiTinh TEXT,
    soDienThoai TEXT,
    diaChi TEXT,
    tienSuBenh TEXT,
    diUng TEXT,
    createdAt TEXT DEFAULT (datetime('now','localtime'))
  );
  CREATE TABLE IF NOT EXISTS lichHen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    benhNhanId INTEGER NOT NULL,
    bacSiId INTEGER NOT NULL,
    ngayGio TEXT NOT NULL,
    trangThai TEXT DEFAULT 'choKham',
    ghiChu TEXT,
    createdAt TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (benhNhanId) REFERENCES benhNhan(id),
    FOREIGN KEY (bacSiId) REFERENCES bacSi(id)
  );
  CREATE TABLE IF NOT EXISTS hoSoBenhAn (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    benhNhanId INTEGER NOT NULL,
    bacSiId INTEGER NOT NULL,
    lichHenId INTEGER,
    chuanDoan TEXT,
    ghiChuLamSang TEXT,
    trangThai TEXT DEFAULT 'choKham',
    dichVu TEXT,
    heSoPhucTap REAL DEFAULT 0.0,
    ngayKham TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (benhNhanId) REFERENCES benhNhan(id),
    FOREIGN KEY (bacSiId) REFERENCES bacSi(id),
    FOREIGN KEY (lichHenId) REFERENCES lichHen(id)
  );
  CREATE TABLE IF NOT EXISTS tinhTrangRang (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hoSoId INTEGER NOT NULL,
    soRang INTEGER NOT NULL,
    tinhTrang TEXT NOT NULL,
    ghiChu TEXT,
    ngayCapNhat TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (hoSoId) REFERENCES hoSoBenhAn(id)
  );
  CREATE TABLE IF NOT EXISTS dichVu (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenDichVu TEXT NOT NULL,
    moTa TEXT,
    donGia REAL NOT NULL,
    nhom TEXT,
    trangThai TEXT DEFAULT 'hoatDong'
  );
  CREATE TABLE IF NOT EXISTS hoaDon (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    benhNhanId INTEGER NOT NULL,
    bacSiId INTEGER NOT NULL,
    hoSoId INTEGER,
    tongTien REAL DEFAULT 0,
    daThanhToan REAL DEFAULT 0,
    trangThai TEXT DEFAULT 'chuaThanhToan',
    trangThaiPhieu TEXT DEFAULT 'daXacNhan',
    ngayTao TEXT DEFAULT (datetime('now','localtime')),
    ghiChu TEXT,
    FOREIGN KEY (benhNhanId) REFERENCES benhNhan(id),
    FOREIGN KEY (bacSiId) REFERENCES bacSi(id),
    FOREIGN KEY (hoSoId) REFERENCES hoSoBenhAn(id)
  );
  CREATE TABLE IF NOT EXISTS chiTietHoaDon (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hoaDonId INTEGER NOT NULL,
    dichVuId INTEGER NOT NULL,
    soLuong INTEGER DEFAULT 1,
    donGia REAL NOT NULL,
    thanhTien REAL NOT NULL,
    FOREIGN KEY (hoaDonId) REFERENCES hoaDon(id),
    FOREIGN KEY (dichVuId) REFERENCES dichVu(id)
  );
  CREATE TABLE IF NOT EXISTS bangLuong (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bacSiId INTEGER NOT NULL,
    thang INTEGER NOT NULL,
    nam INTEGER NOT NULL,
    luongCo REAL DEFAULT 0,
    hoaHong REAL DEFAULT 0,
    thuong REAL DEFAULT 0,
    khauTru REAL DEFAULT 0,
    tongLuong REAL DEFAULT 0,
    soGioQuyDoi REAL DEFAULT 0,
    heSoBacSi REAL DEFAULT 1.0,
    tienLamThem REAL DEFAULT 0,
    soNgayNghiPhep INTEGER DEFAULT 0,
    soNgayNghiLe INTEGER DEFAULT 0,
    tienTruNghiPhep REAL DEFAULT 0,
    trangThai TEXT DEFAULT 'chuaThanhToan',
    ngayTao TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (bacSiId) REFERENCES bacSi(id)
  );
  CREATE TABLE IF NOT EXISTS taiKhoan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenDangNhap TEXT UNIQUE NOT NULL,
    matKhau TEXT NOT NULL,
    vaiTro TEXT NOT NULL,
    bacSiId INTEGER,
    trangThai TEXT DEFAULT 'hoatDong',
    createdAt TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (bacSiId) REFERENCES bacSi(id)
  );
  CREATE TABLE IF NOT EXISTS caLamViecMau (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bacSiId INTEGER NOT NULL,
    thuTrongTuan INTEGER NOT NULL,
    gioBatDau TEXT NOT NULL,
    gioKetThuc TEXT NOT NULL,
    heSo REAL DEFAULT 1.0,
    UNIQUE(bacSiId, thuTrongTuan),
    FOREIGN KEY (bacSiId) REFERENCES bacSi(id)
  );
  CREATE TABLE IF NOT EXISTS cauHinh (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS ngayNghi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bacSiId INTEGER,
    ngay TEXT NOT NULL,
    loaiNghi TEXT NOT NULL,
    ghiChu TEXT,
    createdAt TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (bacSiId) REFERENCES bacSi(id)
  );
`)
db.exec("INSERT OR IGNORE INTO cauHinh (key, value) VALUES ('soTienMotGioBacSi', '100000'), ('soTienMotGioLeTan', '50000')")
db.exec(`INSERT OR IGNORE INTO taiKhoan (tenDangNhap, matKhau, vaiTro) VALUES ('admin', '$2b$10$IXpj1j0J3NoVyIRLluLTdeyWpuqUrAqCW8y2BWT4mCGV1EkSSYIR.', 'admin')`)
export default db