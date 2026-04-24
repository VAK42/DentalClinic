'use client'
import { Plus, CalendarDays, Play, Check, X, Clock } from 'lucide-react'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import mainLayoutComp from '../../components/mainLayout'
import api from '../../lib/api'
const MainLayout = mainLayoutComp
const trangThaiMap = {
  choKham: { label: 'Chờ Khám', cls: 'bg-amber-100 text-amber-800' },
  dangKham: { label: 'Đang Khám', cls: 'bg-blue-100 text-blue-800' },
  daKham: { label: 'Đã Khám', cls: 'bg-green-100 text-green-800' },
  daHuy: { label: 'Đã Hủy', cls: 'bg-red-100 text-red-800' },
}
export default function LichHenPage() {
  const router = useRouter()
  const [list, setList] = useState([])
  const [allBacSi, setAllBacSi] = useState([])
  const [benhNhanList, setBenhNhanList] = useState([])
  const [allCa, setAllCa] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterNgay, setFilterNgay] = useState(new Date().toISOString().slice(0, 10))
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ benhNhanId: '', bacSiId: '', ngayGio: '', ghiChu: '' })
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState(null)
  const load = () => {
    setLoading(true)
    api.get('/lichHen', { params: { ngay: filterNgay } }).then((r) => { setList(r.data); setLoading(false) })
  }
  useEffect(() => {
    load()
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))
  }, [filterNgay])
  useEffect(() => {
    api.get('/bacSi').then((r) => setAllBacSi(r.data.filter(bs => bs.loaiNhanVien === 'bacSi' && bs.trangThai === 'hoatDong')))
    api.get('/benhNhan').then((r) => setBenhNhanList(r.data))
    api.get('/caLamViec').then((r) => setAllCa(r.data))
  }, [])
  const selectedDate = form.ngayGio ? form.ngayGio.slice(0, 10) : ''
  const selectedTime = form.ngayGio ? form.ngayGio.slice(11, 16) : ''
  const selectedDayOfWeek = selectedDate ? new Date(selectedDate).getDay() : null
  const filteredBacSi = useMemo(() => {
    if (selectedDayOfWeek === null) return allBacSi
    return allBacSi.filter(bs => allCa.some(c => c.bacSiId === bs.id && c.thuTrongTuan === selectedDayOfWeek))
  }, [allBacSi, allCa, selectedDayOfWeek])
  const caForSelected = useMemo(() => {
    if (!form.bacSiId || selectedDayOfWeek === null) return null
    return allCa.find(c => c.bacSiId === parseInt(form.bacSiId) && c.thuTrongTuan === selectedDayOfWeek) || null
  }, [allCa, form.bacSiId, selectedDayOfWeek])
  const shiftStatus = useMemo(() => {
    if (!form.bacSiId || !form.ngayGio) return null
    if (!caForSelected) return { type: 'noCa', msg: 'Bác Sĩ Không Có Ca Làm Việc Vào Ngày Này' }
    if (selectedTime && (selectedTime < caForSelected.gioBatDau || selectedTime >= caForSelected.gioKetThuc)) {
      return { type: 'outOfRange', msg: `Giờ Nằm Ngoài Ca (${caForSelected.gioBatDau}–${caForSelected.gioKetThuc})` }
    }
    return { type: 'ok', msg: `Ca Làm Việc: ${caForSelected.gioBatDau} – ${caForSelected.gioKetThuc}` }
  }, [caForSelected, form.bacSiId, form.ngayGio, selectedTime])
  const canSubmit = !shiftStatus || shiftStatus.type === 'ok'
  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.benhNhanId || (!form.bacSiId && user?.vaiTro !== 'bacSi') || !form.ngayGio) return alert('Vui Lòng Điền Đầy Đủ Thông Tin')
    if (!canSubmit) return alert(shiftStatus.msg)
    setSaving(true)
    try { await api.post('/lichHen', form); setShowModal(false); load() } catch (e) { alert(e.response?.data?.error || 'Lỗi') } finally { setSaving(false) }
  }
  const handleOpenModal = () => {
    setForm({ benhNhanId: '', bacSiId: '', ngayGio: '', ghiChu: '' })
    setShowModal(true)
  }
  const handleStatus = async (id, trangThai, benhNhanId = null) => {
    await api.put(`/lichHen/${id}`, { trangThai })
    if (trangThai === 'dangKham' && benhNhanId) {
      router.push(`/benhNhan/${benhNhanId}?lichHenId=${id}&mode=kham`)
    } else { load() }
  }
  const handleCancel = async (id) => { if (!confirm('Hủy Lịch Hẹn Này?')) return; await api.delete(`/lichHen/${id}`); load() }
  const f = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }))
  const inputCls = 'w-full rounded border border-green-950 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-950 placeholder:text-gray-400'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'
  return (
    <MainLayout title="Quản Lý Lịch Hẹn" actions={<div className="flex items-center gap-3"><input type="date" value={filterNgay} onChange={(e) => setFilterNgay(e.target.value)} className="rounded border border-green-950 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-950"/><button onClick={handleOpenModal} className="cursor-pointer inline-flex items-center gap-2 rounded border-2 border-green-950 bg-green-950 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white hover:text-green-950"><Plus size={16}/>Đặt Lịch Mới</button></div>}>
      <div className="bg-white border-2 border-green-950 rounded overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        {loading ? (
          <div className="flex justify-center items-center h-48"><div className="w-6 h-6 border-2 border-green-950 border-t-transparent rounded-full animate-spin"/></div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500"><CalendarDays size={40} className="mb-3 text-green-950/50"/><p className="text-sm font-medium">Không Có Lịch Hẹn Trong Ngày {filterNgay}</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-gray-500">
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider">Thời Gian</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider">Bệnh Nhân</th>
                  {user?.vaiTro !== 'bacSi' && <th className="px-6 py-4 text-xs font-semibold tracking-wider">Bác Sĩ</th>}
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider">Ghi Chú</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider">Trạng Thái</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {list.map((lh) => {
                  const ts = trangThaiMap[lh.trangThai] || { label: lh.trangThai, cls: 'bg-gray-100 text-gray-600' }
                  return (
                    <tr key={lh.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-green-950">{lh.ngayGio?.slice(11, 16)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{lh.tenBenhNhan}</td>
                      {user?.vaiTro !== 'bacSi' && <td className="px-6 py-4 text-sm text-gray-500">{lh.tenBacSi}</td>}
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">{lh.ghiChu || '—'}</td>
                      <td className="px-6 py-4"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${ts.cls}`}>{ts.label}</span></td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {lh.trangThai === 'choKham' && user?.vaiTro !== 'leTan' && (<button onClick={() => handleStatus(lh.id, 'dangKham', lh.benhNhanId)} className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-medium rounded hover:bg-blue-100 transition-colors border border-blue-200"><Play size={14}/>Khám</button>)}
                          {lh.trangThai === 'dangKham' && (<button onClick={() => handleStatus(lh.id, 'daKham')} disabled={!lh.hasHoSo} title={!lh.hasHoSo ? 'Vui Lòng Lưu Hồ Sơ Khám Trước Khi Hoàn Tất' : ''} className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors border ${lh.hasHoSo ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'}`}><Check size={14}/>Xong</button>)}
                          {lh.trangThai !== 'daHuy' && lh.trangThai !== 'daKham' && (<button onClick={() => handleCancel(lh.id)} className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded hover:bg-red-100 transition-colors border border-red-200"><X size={14}/>Hủy Lịch</button>)}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-green-950 rounded p-6 w-full max-w-md shadow-2xl">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">Đặt Lịch Hẹn Mới</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div><label className={labelCls}>Ngày & Giờ *</label><input required className={inputCls} type="datetime-local" value={form.ngayGio} onChange={f('ngayGio')}/></div>
              {user?.vaiTro !== 'bacSi' && (
                <div>
                  <label className={labelCls}>
                    Bác Sĩ *
                    {selectedDayOfWeek !== null && filteredBacSi.length < allBacSi.length && (
                      <span className="ml-2 text-xs font-normal text-amber-600">({filteredBacSi.length}/{allBacSi.length} Có Ca Hôm Đó)</span>
                    )}
                  </label>
                  <select required className={inputCls} value={form.bacSiId} onChange={f('bacSiId')}>
                    <option value="">Chọn Bác Sĩ</option>
                    {filteredBacSi.map((bs) => <option key={bs.id} value={bs.id}>{bs.hoTen}</option>)}
                  </select>
                </div>
              )}
              {shiftStatus && (
                <div className={`flex items-center gap-2 px-3 py-2.5 rounded text-sm font-medium border ${
                  shiftStatus.type === 'ok' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  <Clock size={15} className="shrink-0"/>
                  {shiftStatus.msg}
                </div>
              )}
              <div><label className={labelCls}>Bệnh Nhân *</label><select required className={inputCls} value={form.benhNhanId} onChange={f('benhNhanId')}><option value="">Chọn Bệnh Nhân</option>{benhNhanList.map((bn) => <option key={bn.id} value={bn.id}>{bn.hoTen}</option>)}</select></div>
              <div><label className={labelCls}>Ghi Chú *</label><textarea required className={inputCls} value={form.ghiChu} onChange={f('ghiChu')} placeholder="Lý Do Khám..." rows={3}/></div>
              <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="cursor-pointer px-4 py-2 rounded text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">Hủy Bỏ</button>
                <button type="submit" disabled={saving || !canSubmit} className="cursor-pointer rounded border-2 border-green-950 bg-green-950 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white hover:text-green-950 disabled:opacity-40 disabled:cursor-not-allowed">
                  {saving ? 'Đang Lưu...' : 'Xác Nhận Đặt Lịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  )
}