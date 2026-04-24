'use client'
import { Plus, Receipt, Eye, CreditCard, X } from 'lucide-react'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import mainLayoutComp from '../../components/mainLayout'
import api from '../../lib/api'
const MainLayout = mainLayoutComp
const trangThaiMap = {
  chuaThanhToan: { label: 'Chưa TT', cls: 'bg-red-100 text-red-800' },
  thanhToanMot: { label: 'Một Phần', cls: 'bg-amber-100 text-amber-800' },
  daThanhToan: { label: 'Đã TT', cls: 'bg-green-100 text-green-800' },
}
function HoaDonContent() {
  const searchParams = useSearchParams()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDetail, setShowDetail] = useState(null)
  const [payModal, setPayModal] = useState(null)
  const [payAmount, setPayAmount] = useState('')
  const [benhNhanList, setBenhNhanList] = useState([])
  const [bacSiList, setBacSiList] = useState([])
  const [dichVuList, setDichVuList] = useState([])
  const [form, setForm] = useState({ benhNhanId: '', bacSiId: '', hoSoId: '', ghiChu: '' })
  const [chiTiet, setChiTiet] = useState([])
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState(null)
  const load = () => { setLoading(true); api.get('/hoaDon').then((r) => { setList(r.data); setLoading(false) }) }
  useEffect(() => { 
    load() 
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))
  }, [])
  useEffect(() => {
    api.get('/benhNhan').then((r) => setBenhNhanList(r.data))
    api.get('/bacSi').then((r) => setBacSiList(r.data))
    api.get('/dichVu').then((r) => setDichVuList(r.data.filter((d) => d.trangThai === 'hoatDong')))
  }, [])
  useEffect(() => {
    const hoSoId = searchParams.get('hoSoId')
    const benhNhanId = searchParams.get('benhNhanId')
    const bacSiId = searchParams.get('bacSiId')
    if (hoSoId && benhNhanId && bacSiId) {
      setForm({ benhNhanId: parseInt(benhNhanId), bacSiId: parseInt(bacSiId), hoSoId: parseInt(hoSoId), ghiChu: '' })
      setChiTiet([])
      setShowModal(true)
    }
  }, [searchParams])
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
  const tongTien = chiTiet.reduce((sum, ct) => sum + ct.soLuong * ct.donGia, 0)
  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.benhNhanId || (!form.bacSiId && user?.vaiTro !== 'bacSi') || !chiTiet.length) return alert('Vui Lòng Chọn Bệnh Nhân, Bác Sĩ Và Ít Nhất 1 Dịch Vụ')
    setSaving(true)
    try { 
      await api.post('/hoaDon', { ...form, chiTiet }); 
      setShowModal(false); setChiTiet([]); load() 
    } finally { setSaving(false) }
  }
  const handlePay = async (e) => {
    e.preventDefault()
    if (!payAmount) return
    await api.put(`/hoaDon/${payModal.id}/thanhToan`, { daThanhToan: parseFloat(payAmount) })
    setPayModal(null); load()
  }
  const openDetail = (id) => api.get(`/hoaDon/${id}`).then((r) => setShowDetail(r.data))
  const f = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }))
  const fmtVnd = (n) => new Intl.NumberFormat('vi-VN').format(n || 0) + ' ₫'
  const inputCls = 'w-full rounded border border-green-950 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-950 placeholder:text-gray-400'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'
  return (
    <MainLayout
      title="Quản Lý Hóa Đơn"
      actions={
        user?.vaiTro === 'admin' && (
          <button onClick={() => { setForm({ benhNhanId: '', bacSiId: '', ghiChu: '', hoSoId: '' }); setChiTiet([]); setShowModal(true) }} className="cursor-pointer inline-flex items-center gap-2 rounded border-2 border-green-950 bg-green-950 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white hover:text-green-950">
            <Plus size={16}/>Tạo Hóa Đơn
          </button>
        )
      }
    >
      <div className="bg-white border-2 border-green-950 rounded overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        {loading ? (
          <div className="flex justify-center items-center h-48"><div className="w-6 h-6 border-2 border-green-950 border-t-transparent rounded-full animate-spin"/></div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500">
            <Receipt size={40} className="mb-3 text-green-950/50"/>
            <p className="text-sm font-medium">Chưa Có Hóa Đơn</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-gray-500">
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider">Ngày</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider">Bệnh Nhân</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider">Bác Sĩ</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider">Tổng Tiền</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider">Đã TT</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider">Còn Lại</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider">Trạng Thái</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {list.map((hd) => {
                  const ts = trangThaiMap[hd.trangThai] || { label: hd.trangThai, cls: 'bg-gray-100 text-gray-600' }
                  return (
                    <tr key={hd.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-500">{hd.ngayTao?.slice(0, 10)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{hd.tenBenhNhan}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{hd.tenBacSi}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{fmtVnd(hd.tongTien)}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-600">{fmtVnd(hd.daThanhToan)}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-red-600">{fmtVnd(hd.tongTien - hd.daThanhToan)}</td>
                      <td className="px-6 py-4"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${ts.cls}`}>{ts.label}</span></td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openDetail(hd.id)} className="cursor-pointer p-1.5 text-gray-400 hover:text-green-950 transition-colors rounded hover:bg-gray-100">
                            <Eye size={16}/>
                          </button>
                          {hd.trangThai !== 'daThanhToan' && user?.vaiTro !== 'bacSi' && (
                            <button onClick={() => { setPayModal(hd); setPayAmount('') }} className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded hover:bg-green-100 transition-colors">
                              <CreditCard size={14}/>TT
                            </button>
                          )}
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
          <div className="bg-white border-2 border-green-950 rounded p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">{form.hoSoId ? 'Lập Hóa Đơn Từ Phiếu Khám' : 'Tạo Hóa Đơn Mới'}</h2>
            <form onSubmit={handleSave}>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div><label className={labelCls}>Bệnh Nhân *</label><select required className={inputCls} value={form.benhNhanId} onChange={f('benhNhanId')}><option value="">Chọn Bệnh Nhân</option>{benhNhanList.map((bn) => <option key={bn.id} value={bn.id}>{bn.hoTen}</option>)}</select></div>
                <div><label className={labelCls}>Bác Sĩ *</label><select required className={inputCls} value={form.bacSiId} onChange={f('bacSiId')}><option value="">Chọn Bác Sĩ</option>{bacSiList.map((bs) => <option key={bs.id} value={bs.id}>{bs.hoTen}</option>)}</select></div>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-900">Danh Sách Dịch Vụ</span>
                <button type="button" onClick={addChiTiet} disabled={chiTiet.length >= dichVuList.length} className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                  <Plus size={14}/>Thêm Dịch Vụ
                </button>
              </div>
              <div className="space-y-3 mb-4">
                {chiTiet.map((ct, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <select className={`${inputCls} w-[50%] truncate`} value={ct.dichVuId} onChange={(e) => updateChiTiet(i, 'dichVuId', e.target.value)}>
                      {dichVuList.filter(dv => !chiTiet.some((c, idx) => idx !== i && c.dichVuId === dv.id)).map((dv) => <option key={dv.id} value={dv.id}>{dv.tenDichVu}</option>)}
                    </select>
                    <input className={`${inputCls} w-[20%]`} type="number" min="1" value={ct.soLuong} onChange={(e) => updateChiTiet(i, 'soLuong', e.target.value)} placeholder="SL"/>
                    <input className={`${inputCls} w-[25%]`} type="number" value={ct.donGia} onChange={(e) => updateChiTiet(i, 'donGia', e.target.value)} placeholder="Đơn Giá"/>
                    <button type="button" onClick={() => removeChiTiet(i)} className="cursor-pointer p-2 text-red-500 hover:bg-red-50 rounded transition-colors shrink-0">
                      <X size={18}/>
                    </button>
                  </div>
                ))}
                {chiTiet.length === 0 && <div className="text-sm text-gray-400 py-2">Chưa Có Dịch Vụ Nào, Vui Lòng Thêm!</div>}
              </div>
              <div className="text-right text-lg font-semibold text-green-950 mb-6">Tổng Cộng: {fmtVnd(tongTien)}</div>
              <div className="mb-6"><label className={labelCls}>Ghi Chú</label><textarea className={inputCls} value={form.ghiChu} onChange={f('ghiChu')} rows={2} placeholder="Ghi Chú Thêm..."/></div>
              <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="cursor-pointer px-4 py-2 rounded text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">Hủy</button>
                <button type="submit" disabled={saving} className="cursor-pointer rounded border-2 border-green-950 bg-green-950 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white hover:text-green-950 disabled:opacity-50">
                  {saving ? 'Đang Lưu...' : 'Tạo Hóa Đơn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDetail(null)}>
          <div className="bg-white border-2 border-green-950 rounded p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-medium text-gray-900">Chi Tiết Hóa Đơn #{showDetail.id} {showDetail.hoSoId ? '(Từ Phiếu Khám)' : ''}</h2>
              <button onClick={() => setShowDetail(null)} className="cursor-pointer w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div><div className="text-xs font-medium text-gray-400 mb-1">Bệnh Nhân</div><div className="text-sm font-medium">{showDetail.tenBenhNhan}</div></div>
              <div><div className="text-xs font-medium text-gray-400 mb-1">Bác Sĩ Thực Hiện</div><div className="text-sm font-medium">{showDetail.tenBacSi}</div></div>
              <div><div className="text-xs font-medium text-gray-400 mb-1">Ngày Tạo</div><div className="text-sm">{showDetail.ngayTao?.slice(0, 16)}</div></div>
              <div><div className="text-xs font-medium text-gray-400 mb-1">Trạng Thái</div><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${trangThaiMap[showDetail.trangThai]?.cls}`}>{trangThaiMap[showDetail.trangThai]?.label}</span></div>
            </div>
            <div className="mb-6 rounded border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 tracking-wider">Dịch Vụ</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 tracking-wider">SL</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 tracking-wider">Đơn Giá</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 tracking-wider">Thành Tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {showDetail.chiTiet?.map((ct, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{ct.tenDichVu}</td>
                      <td className="py-3 px-4 text-sm text-gray-500">{ct.soLuong}</td>
                      <td className="py-3 px-4 text-sm text-gray-500">{fmtVnd(ct.donGia)}</td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 text-right">{fmtVnd(ct.thanhTien)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 rounded p-4 flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tổng Tiền Thanh Toán</span>
                <span className="font-medium text-gray-900">{fmtVnd(showDetail.tongTien)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Đã Thanh Toán</span>
                <span className="font-medium text-green-600">{fmtVnd(showDetail.daThanhToan)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-200 mt-1">
                <span className="font-medium text-gray-900">Còn Lại Cần Thanh Toán</span>
                <span className="font-medium text-red-600 text-base">{fmtVnd(showDetail.tongTien - showDetail.daThanhToan)}</span>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setShowDetail(null)} className="cursor-pointer px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded transition-colors">Đóng</button>
            </div>
          </div>
        </div>
      )}
      {payModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setPayModal(null)}>
          <div className="bg-white border-2 border-green-950 rounded p-6 w-full max-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Thanh Toán</h2>
              <button onClick={() => setPayModal(null)} className="cursor-pointer w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors">✕</button>
            </div>
            <div className="bg-red-50 text-red-800 p-3 rounded text-sm mb-5 font-medium border border-red-100">
              Số Tiền Còn Nợ Lại: {fmtVnd(payModal.tongTien - payModal.daThanhToan)}
            </div>
            <form onSubmit={handlePay}>
              <div className="mb-6">
                <label className={labelCls}>Số Tiền Khách Thanh Toán (₫)</label>
                <input required className={inputCls} type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="Nhập Số Tiền..." max={payModal.tongTien - payModal.daThanhToan}/>
              </div>
              <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
                <button type="button" onClick={() => setPayModal(null)} className="cursor-pointer px-4 py-2 rounded text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">Hủy</button>
                <button type="submit" className="cursor-pointer rounded border-2 border-green-950 bg-green-950 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white hover:text-green-950">
                  Xác Nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  )
}
export default function HoaDonPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-48"><div className="w-6 h-6 border-2 border-green-950 border-t-transparent rounded-full animate-spin"/></div>}>
      <HoaDonContent />
    </Suspense>
  )
}