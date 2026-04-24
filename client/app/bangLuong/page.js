'use client'
import { Calculator, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import mainLayoutComp from '../../components/mainLayout'
import api from '../../lib/api'
const MainLayout = mainLayoutComp
export default function BangLuongPage() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [calcModal, setCalcModal] = useState(false)
  const [form, setForm] = useState({ thang: new Date().getMonth() + 1, nam: new Date().getFullYear() })
  const [results, setResults] = useState([])
  const [calculating, setCalculating] = useState(false)
  const [user, setUser] = useState(null)
  const load = () => { setLoading(true); api.get('/bangLuong').then((r) => { setList(r.data); setLoading(false) }) }
  useEffect(() => {
    load()
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))
  }, [])
  const handleCalc = async (e) => {
    e.preventDefault()
    setCalculating(true); setResults([])
    try { const r = await api.post('/bangLuong/tinhTatCa', form); setResults(r.data); load() } catch (e) { alert(e.response?.data?.error || 'Lỗi') } finally { setCalculating(false) }
  }
  const handlePay = async (id) => { if (!confirm('Xác Nhận Đã Thanh Toán Lương?')) return; await api.put(`/bangLuong/${id}/thanhToan`); load() }
  const f = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }))
  const fmtVnd = (n) => new Intl.NumberFormat('vi-VN').format(n || 0) + ' ₫'
  const inputCls = 'w-full rounded border border-green-950 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-950 placeholder:text-gray-400'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'
  return (
    <MainLayout
      title="Bảng Lương Nhân Viên"
      actions={
        user?.vaiTro === 'admin' && (
          <button onClick={() => { setCalcModal(true); setResults([]) }} className="cursor-pointer inline-flex items-center gap-2 rounded border-2 border-green-950 bg-green-950 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white hover:text-green-950">
            <Calculator size={16}/>Tính Lương Tháng Này
          </button>
        )
      }
    >
      <div className="bg-white border-2 border-green-950 rounded overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        {loading ? (
          <div className="flex justify-center items-center h-48"><div className="w-6 h-6 border-2 border-green-950 border-t-transparent rounded-full animate-spin"/></div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500">
            <Wallet size={40} className="mb-3 text-green-950/50"/>
            <p className="text-sm font-medium">Chưa Có Bảng Lương</p>
            {user?.vaiTro === 'admin' && <p className="text-xs mt-1 text-gray-400">Nhấn "Tính Lương Tháng Này" Để Tạo Cho Toàn Bộ Nhân Viên</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-gray-500">
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider">Tháng/Năm</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider">Nhân Viên</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider">Lương Cứng</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider">Hoa Hồng</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider">Tổng Lương</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider">Trạng Thái</th>
                  {user?.vaiTro === 'admin' && <th className="px-6 py-4 text-xs font-semibold tracking-wider text-right">Thao Tác</th>}
                </tr>
              </thead>
              <tbody>
                {list.map((bl) => (
                  <tr key={bl.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold">{bl.thang}/{bl.nam}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{bl.tenBacSi}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{fmtVnd(bl.luongCo)}</td>
                    <td className="px-6 py-4 text-sm text-green-600">{fmtVnd(bl.hoaHong)}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-950">{fmtVnd(bl.tongLuong)}</td>
                    <td className="px-6 py-4"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${bl.trangThai === 'daThanhToan' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{bl.trangThai === 'daThanhToan' ? 'Đã Thanh Toán' : 'Chưa Trả'}</span></td>
                    {user?.vaiTro === 'admin' && (
                      <td className="px-6 py-4 text-right">
                        {bl.trangThai !== 'daThanhToan' && (
                          <button onClick={() => handlePay(bl.id)} className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded hover:bg-green-100 transition-colors">
                            <Wallet size={14}/>Thanh Toán Ngay
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {calcModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setCalcModal(false)}>
          <div className="bg-white border-2 border-green-950 rounded p-6 w-full max-w-xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">Tính Lương Toàn Bộ Nhân Viên</h2>
              <button onClick={() => setCalcModal(false)} className="cursor-pointer w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors">✕</button>
            </div>
            <form onSubmit={handleCalc}>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div><label className={labelCls}>Tháng</label><select className={inputCls} value={form.thang} onChange={f('thang')}>{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>)}</select></div>
                <div><label className={labelCls}>Năm</label><input required className={inputCls} type="number" value={form.nam} onChange={f('nam')}/></div>
              </div>
              {results.length > 0 && (
                <div className="mb-6 border border-gray-100 rounded overflow-hidden">
                  <div className="bg-green-50 px-4 py-2.5 border-b border-green-100">
                    <span className="text-sm font-semibold text-green-900">Kết Quả — {results.length} Nhân Viên</span>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50 text-gray-500">
                        <th className="px-4 py-2.5 text-xs font-semibold text-left">Nhân Viên</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-right">Hoa Hồng</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-right">Tổng Lương</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r, i) => (
                        <tr key={i} className="border-b border-gray-50 last:border-0">
                          <td className="px-4 py-2.5 font-medium text-gray-900">{r.hoTen}</td>
                          <td className="px-4 py-2.5 text-right text-green-600">{fmtVnd(r.hoaHong)}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-green-950">{fmtVnd(r.tongLuong)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
                <button type="button" onClick={() => setCalcModal(false)} className="cursor-pointer px-4 py-2 rounded text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">Đóng</button>
                <button type="submit" disabled={calculating} className="cursor-pointer inline-flex items-center gap-2 rounded border-2 border-green-950 bg-green-950 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white hover:text-green-950 disabled:opacity-50">
                  <Calculator size={16}/>
                  {calculating ? 'Đang Phân Tích...' : 'Tính Lương Tất Cả'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  )
}