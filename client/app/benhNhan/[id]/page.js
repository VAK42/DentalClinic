'use client'
import { Sparkles, Printer, FileText, Plus, Receipt, Eye, FilePen, X, Star } from 'lucide-react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback, useRef } from 'react'
import mainLayoutComp from '../../../components/mainLayout'
import odontogramComp from '../../../components/odontogram'
import api from '../../../lib/api'
const MainLayout = mainLayoutComp
const OdontogramComp = odontogramComp
export default function BenhNhanDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [bn, setBn] = useState(null)
  const [hoSo, setHoSo] = useState([])
  const [bacSiList, setBacSiList] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [rang, setRang] = useState([])
  const [form, setForm] = useState({ bacSiId: '', chuanDoan: '', ghiChuLamSang: '', heSoPhucTap: 0.0 })
  const [saving, setSaving] = useState(false)
  const [selectedHoSo, setSelectedHoSo] = useState(null)
  const [reportModal, setReportModal] = useState(false)
  const [reportNote, setReportNote] = useState('')
  const [reportAdvice, setReportAdvice] = useState('')
  const [reportAdviceLoading, setReportAdviceLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [selectedHoSoId, setSelectedHoSoId] = useState(null)
  const [chiTiet, setChiTiet] = useState([])
  const [dichVuList, setDichVuList] = useState([])
  const autoOpened = useRef(false)
  const openKham = useCallback(async (hs) => {
    setSelectedHoSoId(hs.id)
    setForm({ bacSiId: hs.bacSiId, chuanDoan: hs.chuanDoan || '', ghiChuLamSang: hs.ghiChuLamSang || '', heSoPhucTap: hs.heSoPhucTap || 0.0 })
    setChiTiet(hs.dichVu || [])
    try {
      const r = await api.get(`/hoSoBenhAn/${hs.id}`)
      setRang(r.data.tinhTrangRang || [])
    } catch {
      setRang([])
    }
    setShowModal(true)
  }, [])
  const load = useCallback(() => {
    api.get(`/benhNhan/${id}`).then((r) => setBn(r.data))
    api.get(`/hoSoBenhAn/benhNhan/${id}`).then((r) => setHoSo(r.data))
    api.get('/bacSi').then((r) => setBacSiList(r.data))
  }, [id])
  useEffect(() => { 
    load()
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))
    api.get('/dichVu').then((r) => setDichVuList(r.data.filter((d) => d.trangThai === 'hoatDong')))
  }, [load])
  useEffect(() => {
    const lhId = searchParams.get('lichHenId')
    if (searchParams.get('mode') === 'kham' && lhId && hoSo.length > 0 && !autoOpened.current) {
      const found = hoSo.find(hs => hs.lichHenId === parseInt(lhId))
      if (found) {
        autoOpened.current = true
        openKham(found)
        router.replace(`/benhNhan/${id}`)
      }
    }
  }, [searchParams, hoSo, id, router, openKham])
  const addChiTiet = () => {
    const usedIds = chiTiet.map(ct => ct.dichVuId)
    const available = dichVuList.filter(dv => !usedIds.includes(dv.id))
    if (!available.length) return
    const dv = available[0]
    setChiTiet((prev) => [...prev, { dichVuId: dv.id, tenDichVu: dv.tenDichVu, soLuong: 1, donGia: dv.donGia }])
  }
  const removeChiTiet = (i) => setChiTiet((prev) => prev.filter((_, idx) => idx !== i))
  const updateChiTiet = (i, field, val) => {
    setChiTiet((prev) => {
      const updated = [...prev]
      if (field === 'dichVuId') {
        const dv = dichVuList.find((d) => d.id === parseInt(val))
        updated[i] = { ...updated[i], dichVuId: parseInt(val), tenDichVu: dv?.tenDichVu, donGia: dv?.donGia || 0 }
      } else { updated[i] = { ...updated[i], [field]: field === 'soLuong' ? parseInt(val) : parseFloat(val) } }
      return updated
    })
  }
  const closeModal = () => {
    setShowModal(false)
    if (searchParams.get('mode') === 'kham') {
      router.replace(`/benhNhan/${id}`)
    }
  }
  const handleSaveHoSo = async () => {
    if (!form.bacSiId && user?.vaiTro !== 'bacSi') return alert('Vui Lòng Chọn Bác Sĩ')
    setSaving(true)
    try {
      const payload = { 
        ...form, 
        benhNhanId: id, 
        tinhTrangRang: rang,
        lichHenId: searchParams.get('lichHenId') || null,
        trangThai: selectedHoSoId ? (user?.vaiTro === 'leTan' ? 'choKham' : 'daKham') : 'choKham',
        dichVu: chiTiet
      }
      if (user?.vaiTro === 'bacSi') payload.bacSiId = user.bacSiId
      if (selectedHoSoId) {
        await api.put(`/hoSoBenhAn/${selectedHoSoId}`, payload)
      } else {
        await api.post('/hoSoBenhAn', payload)
      }
      closeModal(); setSelectedHoSoId(null); setRang([]); setForm({ bacSiId: '', chuanDoan: '', ghiChuLamSang: '' }); setChiTiet([]); load()
    } finally { setSaving(false) }
  }
  const handleAiNote = async (e) => {
    e.preventDefault()
    if (!rang.length) return alert('Vui Lòng Cập Nhật Tình Trạng Ít Nhất 1 Răng Trước')
    setAiLoading(true)
    try {
      const r = await api.post('/ai/sinhGhiChu', { tinhTrangRang: rang, tenBenhNhan: bn?.hoTen })
      setForm((prev) => ({ ...prev, ghiChuLamSang: r.data.ghiChu }))
    } catch { alert('Lỗi Sinh Ghi Chú Tự Động') } finally { setAiLoading(false) }
  }
  const openReport = (hs) => { setSelectedHoSo(hs); setReportNote(''); setReportAdvice(''); setReportModal(true) }
  const handleGenerateSummary = async (e) => {
    e.preventDefault()
    setReportAdviceLoading(true)
    try {
      const r = await api.post('/ai/tomTatBaoCao', { chuanDoan: selectedHoSo.chuanDoan, ghiChuLamSang: selectedHoSo.ghiChuLamSang, tenBenhNhan: bn?.hoTen })
      setReportAdvice(r.data.tomTat)
    } catch { alert('Lỗi Phân Tích Dữ Liệu') } finally { setReportAdviceLoading(false) }
  }
  const f = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }))
  const inputCls = 'w-full rounded border border-green-950 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-950 placeholder:text-gray-400'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'
  if (!bn) {
    return (
      <MainLayout title="Chi Tiết Bệnh Nhân">
        <div className="flex justify-center items-center h-64"><div className="w-6 h-6 border-2 border-green-950 border-t-transparent rounded-full animate-spin"/></div>
      </MainLayout>
    )
  }
  return (
    <div className="relative">
      <div className="print:hidden">
        <MainLayout title={bn.hoTen} actions={<button onClick={() => router.push('/lichHen?benhNhanId=' + id)} className="cursor-pointer inline-flex items-center gap-2 rounded border-2 border-green-950 bg-green-950 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white hover:text-green-950"><Plus size={16}/>Tạo Phiếu Khám</button>}>
          <div className="grid grid-cols-2 gap-5 mb-5">
            <div className="bg-white border-2 border-green-950 rounded p-6 shadow-sm hover:shadow-lg transition-shadow duration-300">
              <div className="text-base font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-2">Thông Tin Cá Nhân</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><div className="text-xs font-semibold text-gray-500 mb-1">Ngày Sinh</div><div className="font-medium text-gray-900">{bn.ngaySinh || '—'}</div></div>
                <div><div className="text-xs font-semibold text-gray-500 mb-1">Giới Tính</div><div className="font-medium text-gray-900">{bn.gioiTinh || '—'}</div></div>
                <div><div className="text-xs font-semibold text-gray-500 mb-1">Điện Thoại</div><div className="font-medium text-gray-900">{bn.soDienThoai || '—'}</div></div>
                <div><div className="text-xs font-semibold text-gray-500 mb-1">Địa Chỉ</div><div className="font-medium text-gray-900">{bn.diaChi || '—'}</div></div>
              </div>
              {bn.tienSuBenh && <div className="mt-4 pt-3 border-t border-gray-100 text-sm"><div className="text-xs font-semibold text-gray-500 mb-1">Tiền Sử Bệnh</div><div className="text-gray-900">{bn.tienSuBenh}</div></div>}
              {bn.diUng && <div className="mt-4"><div className="text-xs font-semibold text-gray-500 mb-1">Dị Ứng</div><span className="inline-flex items-center px-2.5 py-1.5 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-200">{bn.diUng}</span></div>}
            </div>
            <div className="bg-white border-2 border-green-950 rounded p-6 shadow-sm hover:shadow-lg transition-shadow duration-300">
              <div className="text-base font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-2">Tổng Quan Lịch Sử Khám</div>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center text-sm"><span className="text-gray-500">Tổng Số Lượt Khám Bệnh</span><span className="font-semibold text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-full">{hoSo.length}</span></div>
                {hoSo.length > 0 && (
                  <>
                    <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100"><span className="text-gray-500">Lần Khám Gần Nhất</span><span className="font-medium text-gray-900">{hoSo[0]?.ngayKham?.slice(0, 10)}</span></div>
                    {hoSo[0]?.chuanDoan && (<div className="text-sm pt-2 border-t border-gray-100"><span className="block text-xs font-semibold text-gray-500 mb-1">Chẩn Đoán Mới Nhất</span><span className="text-green-950 font-medium bg-green-50 px-3 py-1.5 rounded block border border-green-100">{hoSo[0].chuanDoan}</span></div>)}
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="bg-white border-2 border-green-950 rounded overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-[shadow,transform] duration-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50"><span className="text-base font-semibold text-gray-900">Chi Tiết Lịch Sử Khám Bệnh</span></div>
            {hoSo.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-500"><FileText size={40} className="mb-3 text-green-950/50"/><p className="text-sm font-medium">Chưa Có Hồ Sơ Khám Bệnh</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-gray-500">
                      <th className="px-6 py-4 text-xs font-semibold tracking-wider">Ngày Khám</th>
                      <th className="px-6 py-4 text-xs font-semibold tracking-wider">Bác Sĩ</th>
                      <th className="px-6 py-4 text-xs font-semibold tracking-wider">Chẩn Đoán</th>
                      <th className="px-6 py-4 text-xs font-semibold tracking-wider">Trạng Thái</th>
                      <th className="px-6 py-4 text-xs font-semibold tracking-wider text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hoSo.map((hs) => {
                      const isChoKham = hs.trangThai === 'choKham'
                      return (
                        <tr key={hs.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-500">{hs.ngayKham?.slice(0, 16)}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{hs.tenBacSi}</td>
                          <td className="px-6 py-4 text-sm font-medium text-green-950">{hs.chuanDoan || '—'}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${isChoKham ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                              {isChoKham ? 'Chờ Khám' : 'Đã Khám'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!isChoKham && (<button onClick={() => openReport(hs)} className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded transition-colors"><FileText size={14}/>Báo Cáo</button>)}
                              {isChoKham && (user?.vaiTro === 'bacSi' || user?.vaiTro === 'admin') && (<button onClick={() => openKham(hs)} className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold rounded transition-colors border border-blue-200"><FilePen size={14}/>Khám</button>)}
                              {isChoKham && (user?.vaiTro === 'leTan' || user?.vaiTro === 'admin') && (<button onClick={() => openKham(hs)} className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-semibold rounded transition-colors border border-amber-200"><FilePen size={14}/>Sửa</button>)}
                              {!isChoKham && user?.vaiTro !== 'bacSi' && (<button onClick={() => router.push(`/hoaDon?hoSoId=${hs.id}&benhNhanId=${id}&bacSiId=${hs.bacSiId}`)} className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold rounded transition-colors border border-green-200"><Receipt size={14}/>Lập Hóa Đơn</button>)}
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
              <div className="bg-white border-2 border-green-950 rounded p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900">{selectedHoSoId ? 'Cập Nhật Phiếu Khám' : 'Tạo Phiếu Khám Mới'} — {bn.hoTen}</h2>
                  <button onClick={closeModal} className="cursor-pointer w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors">✕</button>
                </div>
                <div className="grid grid-cols-2 gap-5 mb-6">
                  {user?.vaiTro !== 'bacSi' && (<div><label className={labelCls}>Bác Sĩ Phụ Trách *</label><select required className={inputCls} value={form.bacSiId} onChange={f('bacSiId')}><option value="">Chọn Bác Sĩ</option>{bacSiList.map((bs) => <option key={bs.id} value={bs.id}>{bs.hoTen}</option>)}</select></div>)}
                  <div className={user?.vaiTro === 'bacSi' ? 'col-span-1' : ''}><label className={labelCls}>Chẩn Đoán Hiện Tại / Sơ Bộ *</label><input required className={inputCls} value={form.chuanDoan} onChange={f('chuanDoan')} placeholder="Nhập Chẩn Đoán Tóm Tắt..."/></div>
                  {user?.vaiTro === 'bacSi' && (
                    <div>
                      <label className={labelCls}>Độ Phức Tạp Ca Bệnh</label>
                      <div className="flex items-center gap-2 mt-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star 
                            key={star} 
                            size={24} 
                            className={`cursor-pointer transition-colors ${form.heSoPhucTap >= star * 0.1 ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-amber-200'}`}
                            onClick={() => setForm(p => ({ ...p, heSoPhucTap: p.heSoPhucTap === star * 0.1 ? 0 : star * 0.1 }))}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="mb-6 bg-white border border-gray-200 rounded p-5">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-semibold text-gray-900">Dịch Vụ Chỉ Định / Sử Dụng</label>
                    <button type="button" onClick={addChiTiet} disabled={chiTiet.length >= dichVuList.length} className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                      <Plus size={14}/>Thêm Dịch Vụ
                    </button>
                  </div>
                  <div className="space-y-3">
                    {chiTiet.map((ct, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <select className={`${inputCls} w-[50%] truncate`} value={ct.dichVuId} onChange={(e) => updateChiTiet(i, 'dichVuId', e.target.value)}>
                          {dichVuList.filter(dv => !chiTiet.some((c, idx) => idx !== i && c.dichVuId === dv.id)).map(dv => <option key={dv.id} value={dv.id}>{dv.tenDichVu}</option>)}
                        </select>
                        <input className={`${inputCls} w-[15%]`} type="number" min="1" value={ct.soLuong} onChange={(e) => updateChiTiet(i, 'soLuong', e.target.value)} placeholder="SL"/>
                        <input className={`${inputCls} w-[25%]`} type="number" value={ct.donGia} onChange={(e) => updateChiTiet(i, 'donGia', e.target.value)} placeholder="Đơn Giá"/>
                        <button type="button" onClick={() => removeChiTiet(i)} className="cursor-pointer p-2 text-red-500 hover:bg-red-50 rounded transition-colors shrink-0">
                          <X size={18}/>
                        </button>
                      </div>
                    ))}
                    {chiTiet.length === 0 && <div className="text-sm text-gray-400 py-2 text-center">Chưa Chọn Dịch Vụ Nào</div>}
                  </div>
                  {chiTiet.length > 0 && (
                    <div className="text-right text-base font-semibold text-green-950 mt-4 border-t border-gray-100 pt-3">
                      Tạm Tính: {new Intl.NumberFormat('vi-VN').format(chiTiet.reduce((s, c) => s + c.soLuong * c.donGia, 0)) + ' ₫'}
                    </div>
                  )}
                </div>
                {user?.vaiTro !== 'leTan' && (
                  <>
                    <div className="mb-6 bg-gray-50 border border-gray-100 rounded p-5">
                      <div className="flex items-center justify-between mb-4">
                        <label className="text-sm font-semibold text-gray-900">Sơ Đồ Răng Khám</label>
                        <button type="button" onClick={handleAiNote} disabled={aiLoading} className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 text-sm font-semibold border border-green-200 rounded transition-colors disabled:opacity-50">
                          <Sparkles size={16}/>{aiLoading ? 'Trợ Lý AI Đang Soạn...' : 'AI Khởi Tạo Ghi Chú'}
                        </button>
                      </div>
                      <div className="bg-white p-4 rounded border border-gray-100">
                        <OdontogramComp data={rang} onChange={setRang}/>
                      </div>
                    </div>
                    <div className="mb-6">
                      <label className={labelCls}>Ghi Chú Lâm Sàng & Phác Đồ *</label>
                      <textarea required className={inputCls} rows={5} value={form.ghiChuLamSang} onChange={f('ghiChuLamSang')} placeholder="Nhập Chi Tiết Ghi Chú Quá Trình Khám Hoặc Điều Trị..."/>
                    </div>
                  </>
                )}
                <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
                  <button onClick={closeModal} className="cursor-pointer px-4 py-2 rounded text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">Hủy Bỏ</button>
                  <button type="button" onClick={handleSaveHoSo} disabled={saving} className="cursor-pointer rounded border-2 border-green-950 bg-green-950 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-white hover:text-green-950 disabled:opacity-50">
                    {saving ? 'Đang Lưu...' : selectedHoSoId ? (user?.vaiTro === 'leTan' ? 'Lưu Thay Đổi' : 'Lưu & Hoàn Tất Khám') : 'Lưu Phiếu Khám'}
                  </button>
                </div>
              </div>
            </div>
          )}
          {reportModal && selectedHoSo && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white border-2 border-green-950 rounded p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100"><h2 className="text-xl font-semibold text-gray-900">Báo Cáo Phiếu Khám Giao Bệnh Nhân</h2><button onClick={() => setReportModal(false)} className="cursor-pointer w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors">✕</button></div>
                <div className="bg-gray-50 border border-gray-100 rounded p-5 mb-6">
                  <div className="text-sm font-semibold text-green-950 mb-4 border-b border-gray-200 pb-2">Thông Tin Cơ Bản</div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><div className="text-xs font-semibold text-gray-500 mb-1">Bệnh Nhân</div><div className="font-medium text-gray-900">{bn.hoTen}</div></div>
                    <div><div className="text-xs font-semibold text-gray-500 mb-1">Bác Sĩ Điều Trị</div><div className="font-medium text-gray-900">{selectedHoSo.tenBacSi}</div></div>
                    <div><div className="text-xs font-semibold text-gray-500 mb-1">Ngày Khám</div><div className="text-gray-900">{selectedHoSo.ngayKham?.slice(0, 16)}</div></div>
                    <div><div className="text-xs font-semibold text-gray-500 mb-1">Kết Quả Chẩn Đoán</div><div className="font-medium text-gray-900">{selectedHoSo.chuanDoan || '—'}</div></div>
                  </div>
                  {selectedHoSo.ghiChuLamSang && (<div className="mt-4 pt-3 border-t border-gray-200 text-sm"><div className="text-xs font-semibold text-gray-500 mb-1">Ghi Chú Chuyên Môn Trong Quá Trình Nhận Bệnh</div><div className="text-gray-900">{selectedHoSo.ghiChuLamSang}</div></div>)}
                </div>
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-900">Lời Khuyên Chuyên Môn</label>
                    <button type="button" onClick={handleGenerateSummary} disabled={reportAdviceLoading} className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold border border-green-200 rounded transition-colors disabled:opacity-50"><Sparkles size={14}/>{reportAdviceLoading ? 'Hệ Thống Đang Xử Lý...' : 'Khởi Tạo Lời Khuyên'}</button>
                  </div>
                  <textarea required className={inputCls} rows={4} value={reportAdvice} onChange={(e) => setReportAdvice(e.target.value)} placeholder="Nhấn Nút Phân Tích Để Soạn Lời Khuyên Chi Tiết Cho Bệnh Nhân..."/>
                </div>
                <div className="mb-6"><label className="text-sm font-semibold text-gray-900 block mb-2">Ghi Chú Bổ Sung Trong Ca Khám (Dặn Dò Riêng) *</label><textarea required className={inputCls} rows={3} value={reportNote} onChange={(e) => setReportNote(e.target.value)} placeholder="Lời Dặn Trước / Sau Sử Dụng Thuốc, Lịch Trình Ăn Uống, Thay Rửa..."/></div>
                <div className="flex justify-end gap-3 pt-5 border-t border-gray-100"><button type="button" onClick={() => setReportModal(false)} className="cursor-pointer px-4 py-2 rounded text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">Đóng Lại</button><button type="button" onClick={() => window.print()} className="cursor-pointer inline-flex items-center gap-2 rounded border-2 border-green-950 bg-green-950 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-white hover:text-green-950"><Printer size={16}/>Xuất Phiếu & In</button></div>
              </div>
            </div>
          )}
        </MainLayout>
      </div>
      {reportModal && selectedHoSo && (
        <div className="hidden print:block print:bg-white p-4 font-sans text-black">
          <div className="flex justify-between items-start border-b-2 border-green-950 pb-3 mb-4">
            <div><h1 className="text-xl font-medium text-green-950 tracking-tight">Phòng Khám DentalClinic</h1><p className="text-xs text-gray-600 mt-1 font-medium italic">Chuyên Khoa Răng Hàm Mặt</p></div>
            <div className="text-right text-xs font-medium"><p>Mã Phiếu: #{selectedHoSo.id}</p><p>Ngày Khám: {selectedHoSo.ngayKham?.slice(0, 10)}</p></div>
          </div>
          <div className="mb-4">
            <h2 className="text-sm font-medium text-white bg-green-950 px-3 py-1 inline-block mb-3 tracking-wide italic">I. Thông Tin Bệnh Nhân</h2>
            <div className="grid grid-cols-2 gap-y-2 text-xs border-2 border-green-950/10 p-3 rounded-lg border-l-4 border-l-green-950">
              <p><span className="font-medium text-gray-500 text-[9px] block mb-0.5 tracking-widest">Họ Và Tên</span><span className="text-sm font-medium">{bn.hoTen}</span></p>
              <p><span className="font-medium text-gray-500 text-[9px] block mb-0.5 tracking-widest">Ngày Sinh</span>{bn.ngaySinh}</p>
              <p><span className="font-medium text-gray-500 text-[9px] block mb-0.5 tracking-widest">Điện Thoại</span>{bn.soDienThoai}</p>
              <p><span className="font-medium text-gray-500 text-[9px] block mb-0.5 tracking-widest">Bác Sĩ Điều Trị</span><span className="font-medium text-green-950">{selectedHoSo.tenBacSi}</span></p>
            </div>
          </div>
          <div className="mb-4">
            <h2 className="text-sm font-medium text-white bg-green-950 px-3 py-1 inline-block mb-3 tracking-wide italic">II. Kết Quả Chẩn Đoán & Điều Trị</h2>
            <div className="border-2 border-green-950/10 p-4 rounded-lg bg-white overflow-hidden relative"><div className="absolute top-0 bottom-0 left-0 w-1 bg-green-900/20"/><div><h3 className="text-[9px] font-medium text-green-950 tracking-widest mb-1 border-b border-green-950/20 inline-block">Chẩn Đoán</h3><p className="text-sm font-medium text-gray-900 leading-relaxed">{selectedHoSo.chuanDoan || 'Không Có Dữ Liệu'}</p></div><div className="mt-4"><h3 className="text-[9px] font-medium text-green-950 tracking-widest mb-1 border-b border-green-950/20 inline-block">Nội Dung Thực Hiện</h3><p className="text-xs leading-relaxed text-gray-700 italic bg-gray-50 p-3 rounded border-l-2 border-green-950/30">{selectedHoSo.ghiChuLamSang || 'Không Có Dữ Liệu'}</p></div></div>
          </div>
          <div className="mb-4">
            <h2 className="text-sm font-medium text-white bg-green-950 px-3 py-1 inline-block mb-3 tracking-wide italic">III. Lời Khuyên & Chỉ Định</h2>
            <div className="border-2 border-green-950/10 p-4 rounded-lg bg-gray-50/50">
              <div className="mb-3 pb-3 border-b border-dashed border-gray-300"><h3 className="text-[9px] font-medium text-gray-500 tracking-widest mb-2">Tư Vấn Chăm Sóc Chuyên Môn</h3><div className="text-xs text-gray-900 leading-relaxed font-medium whitespace-pre-wrap pl-2 border-l-2 border-green-950/10">{reportAdvice || 'Chưa Có Lời Khuyên Cụ Thể.'}</div></div>
              <div><h3 className="text-[9px] font-medium text-gray-500 tracking-widest mb-2">Dặn Dò Của Bác Sĩ Phụ Trách</h3><p className="text-xs text-gray-800 leading-relaxed pl-2 border-l-2 border-green-950/10">{reportNote || 'Không Có Dữ Liệu'}</p></div>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-2 text-center text-xs items-end">
            <div><p className="font-medium mb-16 text-gray-500 text-[9px] tracking-widest">Phòng Quản Lý & Lễ Tân</p><div className="w-32 h-px bg-gray-200 mx-auto mb-2"/><p className="text-[10px] text-gray-500 italic font-medium">Xác Nhận Ngày: {new Date().toLocaleDateString('vi-VN')}</p></div>
            <div className="text-right pr-6"><p className="font-medium mb-16 text-gray-900 text-[9px] tracking-widest">Bác Sĩ Điều Trị</p><div><p className="font-medium text-xl text-green-950 italic font-serif leading-none">{selectedHoSo.tenBacSi}</p><div className="w-32 h-0.5 bg-green-950 ml-auto mt-2 mb-2"/><p className="text-[9px] text-gray-500 tracking-widest font-medium">Chữ Ký Chuyên Môn</p></div></div>
          </div>
        </div>
      )}
    </div>
  )
}