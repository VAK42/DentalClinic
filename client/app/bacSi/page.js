'use client'
import { Plus, Stethoscope, Pencil, Clock, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import mainLayoutComp from '../../components/mainLayout'
import api from '../../lib/api'
const MainLayout = mainLayoutComp
const THU_LABELS = [
  { value: 1, label: 'T2' },
  { value: 2, label: 'T3' },
  { value: 3, label: 'T4' },
  { value: 4, label: 'T5' },
  { value: 5, label: 'T6' },
  { value: 6, label: 'T7' },
  { value: 0, label: 'CN' },
]
export default function BacSiPage() {
  const [tab, setTab] = useState('nhanVien')
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ hoTen: '', chuyenKhoa: '', soDienThoai: '', email: '', luongCo: '', tyLeHoaHong: '', ngayBatDau: '', loaiNhanVien: 'bacSi' })
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [caList, setCaList] = useState([])
  const [caLoading, setCaLoading] = useState(false)
  const [showCaModal, setShowCaModal] = useState(false)
  const [caForm, setCaForm] = useState({ bacSiId: '', thuTrongTuan: '', gioBatDau: '08:00', gioKetThuc: '17:00' })
  const [editCaId, setEditCaId] = useState(null)
  const [savingCa, setSavingCa] = useState(false)
  const loadNhanVien = () => { setLoading(true); api.get('/bacSi').then((r) => { setList(r.data); setLoading(false) }) }
  const loadCa = () => { setCaLoading(true); api.get('/caLamViec').then((r) => { setCaList(r.data); setCaLoading(false) }) }
  useEffect(() => { loadNhanVien(); loadCa() }, [])
  const openAdd = () => { setForm({ hoTen: '', chuyenKhoa: '', soDienThoai: '', email: '', luongCo: '', tyLeHoaHong: '', ngayBatDau: '', loaiNhanVien: 'bacSi' }); setEditId(null); setShowModal(true) }
  const openEdit = (bs) => { setForm({ hoTen: bs.hoTen, chuyenKhoa: bs.chuyenKhoa || '', soDienThoai: bs.soDienThoai || '', email: bs.email || '', luongCo: bs.luongCo, tyLeHoaHong: bs.tyLeHoaHong, ngayBatDau: bs.ngayBatDau || '', loaiNhanVien: bs.loaiNhanVien || 'bacSi' }); setEditId(bs.id); setShowModal(true) }
  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.hoTen.trim()) return alert('Vui Lòng Nhập Tên Nhân Viên')
    setSaving(true)
    try {
      if (editId) { await api.put(`/bacSi/${editId}`, { ...form, trangThai: 'hoatDong' }) } else { await api.post('/bacSi', form) }
      setShowModal(false); loadNhanVien()
    } finally { setSaving(false) }
  }
  const handleDeactivate = async (id) => { if (!confirm('Ngừng Hoạt Động Nhân Viên Này?')) return; await api.delete(`/bacSi/${id}`); loadNhanVien() }
  const bacSiOnly = list.filter(bs => bs.loaiNhanVien === 'bacSi' && bs.trangThai === 'hoatDong')
  const getCaForBacSi = (bacSiId, thu) => caList.find(c => c.bacSiId === bacSiId && c.thuTrongTuan === thu)
  const openCaModal = (bacSiId, thu, existingCa) => {
    setCaForm({ bacSiId, thuTrongTuan: thu, gioBatDau: existingCa?.gioBatDau || '08:00', gioKetThuc: existingCa?.gioKetThuc || '17:00' })
    setEditCaId(existingCa?.id || null)
    setShowCaModal(true)
  }
  const handleSaveCa = async (e) => {
    e.preventDefault()
    if (caForm.gioBatDau >= caForm.gioKetThuc) return alert('Giờ Kết Thúc Phải Sau Giờ Bắt Đầu')
    setSavingCa(true)
    try { await api.post('/caLamViec', caForm); setShowCaModal(false); loadCa() } catch (err) { alert(err.response?.data?.error || 'Lỗi') } finally { setSavingCa(false) }
  }
  const handleDeleteCa = async (id) => { if (!confirm('Xóa Ca Làm Việc Này?')) return; await api.delete(`/caLamViec/${id}`); loadCa() }
  const f = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }))
  const fc = (k) => (e) => setCaForm((prev) => ({ ...prev, [k]: e.target.value }))
  const fmtVnd = (n) => new Intl.NumberFormat('vi-VN').format(n || 0) + ' ₫'
  const inputCls = 'w-full rounded border border-green-950 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-950 placeholder:text-gray-400'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'
  const thuLabel = (v) => THU_LABELS.find(t => t.value === v)?.label || ''
  return (
    <MainLayout
      title="Quản Lý Nhân Sự"
      actions={
        <div className="flex items-center gap-3">
          <button
            onClick={openAdd}
            disabled={tab !== 'nhanVien'}
            className="cursor-pointer inline-flex items-center gap-2 rounded border-2 border-green-950 bg-green-950 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white hover:text-green-950 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Plus size={16}/>Thêm Nhân Viên
          </button>
        </div>
      }
    >
      <div className="flex gap-1 mb-6 border-b-2 border-gray-100">
        <button onClick={() => setTab('nhanVien')} className={`cursor-pointer px-5 py-2.5 text-sm font-semibold rounded transition-all flex items-center gap-2 ${tab === 'nhanVien' ? 'bg-green-950 text-white' : 'text-gray-500 hover:text-green-950 hover:bg-gray-50'}`}>
          <Stethoscope size={15}/>Danh Sách Nhân Viên
        </button>
        <button onClick={() => setTab('caLamViec')} className={`cursor-pointer px-5 py-2.5 text-sm font-semibold rounded transition-all flex items-center gap-2 ${tab === 'caLamViec' ? 'bg-green-950 text-white' : 'text-gray-500 hover:text-green-950 hover:bg-gray-50'}`}>
          <Clock size={15}/>Ca Làm Việc
        </button>
      </div>
      {tab === 'nhanVien' && (
        <div className="bg-white border-2 border-green-950 rounded overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          {loading ? (
            <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-green-950 border-t-transparent rounded-full animate-spin"/></div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <Stethoscope size={40} className="mb-3 text-green-950/50"/>
              <p className="text-sm font-medium">Chưa Có Nhân Viên</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-gray-500">
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider">Họ & Tên</th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider">Loại</th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider">Chuyên Khoa</th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider">Điện Thoại</th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider">Lương Cố Định</th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((bs) => (
                    <tr key={bs.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{bs.hoTen}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${bs.loaiNhanVien === 'bacSi' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                          {bs.loaiNhanVien === 'bacSi' ? 'Bác Sĩ' : 'Lễ Tân'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{bs.chuyenKhoa || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{bs.soDienThoai || '—'}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-950">{fmtVnd(bs.luongCo)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(bs)} className="cursor-pointer p-1.5 text-gray-400 hover:text-green-950 transition-colors rounded hover:bg-gray-100">
                            <Pencil size={16}/>
                          </button>
                          <button onClick={() => handleDeactivate(bs.id)} className="cursor-pointer px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded hover:bg-red-100 transition-colors">Ngừng</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {tab === 'caLamViec' && (
        <div className="bg-white border-2 border-green-950 rounded overflow-hidden shadow-sm">
          {caLoading ? (
            <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-green-950 border-t-transparent rounded-full animate-spin"/></div>
          ) : bacSiOnly.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <Clock size={40} className="mb-3 text-green-950/50"/>
              <p className="text-sm font-medium">Chưa Có Bác Sĩ Nào Đang Hoạt Động</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-gray-500">
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider sticky left-0 bg-gray-50">Bác Sĩ</th>
                    {THU_LABELS.map(t => (
                      <th key={t.value} className="px-4 py-4 text-xs font-semibold tracking-wider text-center">{t.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bacSiOnly.map((bs) => (
                    <tr key={bs.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 sticky left-0 bg-white">{bs.hoTen}</td>
                      {THU_LABELS.map(t => {
                        const ca = getCaForBacSi(bs.id, t.value)
                        return (
                          <td key={t.value} className="px-4 py-4 text-center">
                            {ca ? (
                              <div className="flex flex-col items-center gap-1 group">
                                <button onClick={() => openCaModal(bs.id, t.value, ca)} className="cursor-pointer inline-flex flex-col items-center px-2.5 py-1.5 rounded bg-green-50 border border-green-200 hover:bg-green-100 transition-colors">
                                  <span className="text-[11px] font-semibold text-green-800">{ca.gioBatDau}</span>
                                  <span className="text-[10px] text-green-600">–</span>
                                  <span className="text-[11px] font-semibold text-green-800">{ca.gioKetThuc}</span>
                                </button>
                                <button onClick={() => handleDeleteCa(ca.id)} className="cursor-pointer p-0.5 text-red-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100">
                                  <Trash2 size={11}/>
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => openCaModal(bs.id, t.value, null)} className="cursor-pointer w-8 h-8 flex items-center justify-center rounded border-2 border-dashed border-gray-200 text-gray-300 hover:border-green-950 hover:text-green-950 transition-all mx-auto">
                                <Plus size={14}/>
                              </button>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-green-950 rounded p-6 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">{editId ? 'Cập Nhật Nhân Viên' : 'Thêm Nhân Viên Mới'}</h2>
            <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className={labelCls}>Họ & Tên *</label><input required className={inputCls} value={form.hoTen} onChange={f('hoTen')} placeholder="Nguyễn Văn A"/></div>
              <div className="col-span-2">
                <label className={labelCls}>Loại Nhân Viên *</label>
                <select className={inputCls} value={form.loaiNhanVien} onChange={f('loaiNhanVien')}>
                  <option value="bacSi">Bác Sĩ</option>
                  <option value="leTan">Lễ Tân</option>
                </select>
              </div>
              <div><label className={labelCls}>Chuyên Khoa / Vai Trò *</label><input required className={inputCls} value={form.chuyenKhoa} onChange={f('chuyenKhoa')} placeholder="Phục Hình / Lễ Tân..."/></div>
              <div><label className={labelCls}>Điện Thoại *</label><input required className={inputCls} value={form.soDienThoai} onChange={f('soDienThoai')} placeholder="09..."/></div>
              <div><label className={labelCls}>Email *</label><input required className={inputCls} type="email" value={form.email} onChange={f('email')} placeholder="nv@example.com"/></div>
              <div><label className={labelCls}>Ngày Bắt Đầu *</label><input required className={inputCls} type="date" value={form.ngayBatDau} onChange={f('ngayBatDau')}/></div>
              <div><label className={labelCls}>Lương Cố Định * (₫)</label><input required className={inputCls} type="number" value={form.luongCo} onChange={f('luongCo')} placeholder="10000000"/></div>
              <div><label className={labelCls}>Hoa Hồng * (%)</label><input required className={inputCls} type="number" value={form.tyLeHoaHong} onChange={f('tyLeHoaHong')} placeholder="0"/></div>
              <div className="col-span-2 flex justify-end gap-3 mt-4 pt-5 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="cursor-pointer px-4 py-2 rounded text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">Hủy</button>
                <button type="submit" disabled={saving} className="cursor-pointer rounded border-2 border-green-950 bg-green-950 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white hover:text-green-950 disabled:opacity-50">
                  {saving ? 'Đang Lưu...' : 'Lưu Thông Tin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showCaModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-green-950 rounded p-6 w-full max-w-sm shadow-2xl">
            <h2 className="mb-1 text-xl font-semibold text-gray-900">{editCaId ? 'Sửa Ca Làm Việc' : 'Thêm Ca Làm Việc'}</h2>
            <p className="text-sm text-gray-500 mb-6">
              {list.find(bs => bs.id === caForm.bacSiId)?.hoTen} — {thuLabel(caForm.thuTrongTuan)}
            </p>
            <form onSubmit={handleSaveCa} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Giờ Bắt Đầu *</label><input required type="time" className={inputCls} value={caForm.gioBatDau} onChange={fc('gioBatDau')}/></div>
                <div><label className={labelCls}>Giờ Kết Thúc *</label><input required type="time" className={inputCls} value={caForm.gioKetThuc} onChange={fc('gioKetThuc')}/></div>
              </div>
              <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
                <button type="button" onClick={() => setShowCaModal(false)} className="cursor-pointer px-4 py-2 rounded text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">Hủy</button>
                <button type="submit" disabled={savingCa} className="cursor-pointer rounded border-2 border-green-950 bg-green-950 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white hover:text-green-950 disabled:opacity-50">
                  {savingCa ? 'Đang Lưu...' : 'Lưu Ca'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  )
}