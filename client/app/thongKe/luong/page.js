'use client'
import { useState, useEffect } from 'react'
import mainLayoutComp from '../../../components/mainLayout'
import api from '../../../lib/api'
import { Wallet, TrendingUp, Users, FileText } from 'lucide-react'
const MainLayout = mainLayoutComp
export default function ThongKeLuongPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterNam, setFilterNam] = useState(new Date().getFullYear())
  const [filterBacSi, setFilterBacSi] = useState('')
  const [bacSiList, setBacSiList] = useState([])
  const [user, setUser] = useState(null)
  useEffect(() => { const stored = localStorage.getItem('user'); if (stored) setUser(JSON.parse(stored)); api.get('/bacSi').then(r => setBacSiList(r.data.filter(b => b.trangThai === 'hoatDong'))) }, [])
  useEffect(() => { setLoading(true); const params = new URLSearchParams(); params.append('nam', filterNam); if (filterBacSi) params.append('bacSiId', filterBacSi); api.get(`/bangLuong/baoCao/nam?${params.toString()}`).then(r => { setData(r.data); setLoading(false) }).catch(() => setLoading(false)) }, [filterNam, filterBacSi])
  const fmtVnd = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0)
  let tongChiNam = 0
  let tongLamThem = 0
  let tongTruNghi = 0
  const thangMap = {}
  for (let i = 1; i <= 12; i++) thangMap[i] = 0
  const bsMap = {}
  data.forEach(d => {
    tongChiNam += d.tongLuong || 0
    tongLamThem += d.tienLamThem || 0
    tongTruNghi += d.tienTruNghiPhep || 0
    
    thangMap[d.thang] += d.tongLuong || 0
    if (!bsMap[d.bacSiId]) {
      bsMap[d.bacSiId] = { hoTen: d.hoTen, tongLuong: 0, tienLamThem: 0, tienTruNghiPhep: 0, thangMap: {} }
    }
    bsMap[d.bacSiId].tongLuong += d.tongLuong || 0
    bsMap[d.bacSiId].tienLamThem += d.tienLamThem || 0
    bsMap[d.bacSiId].tienTruNghiPhep += d.tienTruNghiPhep || 0
    bsMap[d.bacSiId].thangMap[d.thang] = d.tongLuong || 0
  })
  const bsStats = Object.values(bsMap).sort((a, b) => b.tongLuong - a.tongLuong)
  const maxThang = Math.max(...Object.values(thangMap), 1)
  return (
    <MainLayout
      title="Báo Cáo Tiền Lương"
      actions={
        <div className="flex items-center gap-3">
          {user?.vaiTro === 'admin' && (
            <select 
              className="cursor-pointer rounded border-2 border-green-950 px-3 py-2 text-sm font-semibold focus:outline-none bg-white focus:ring-2 focus:ring-green-950 transition-all hover:bg-gray-50" 
              value={filterBacSi} 
              onChange={e => setFilterBacSi(e.target.value)}
            >
              <option value="">Tất Cả Nhân Viên</option>
              {bacSiList.map(b => <option key={b.id} value={b.id}>{b.hoTen}</option>)}
            </select>
          )}
          <select 
            className="cursor-pointer rounded border-2 border-green-950 px-3 py-2 text-sm font-semibold focus:outline-none bg-white focus:ring-2 focus:ring-green-950 transition-all hover:bg-gray-50" 
            value={filterNam} 
            onChange={e => setFilterNam(e.target.value)}
          >
            {[2023, 2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
          </select>
        </div>
      }
    >
      {loading ? (
        <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-4 border-green-950 border-t-transparent rounded-full animate-spin"/></div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-7">
            <div className="bg-white border-2 border-green-950 rounded p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-500 tracking-wider">Tổng Lương Năm {filterNam}</h3>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center"><Wallet size={20} className="text-green-700"/></div>
              </div>
              <div className="text-3xl font-semibold text-gray-900">{fmtVnd(tongChiNam)}</div>
            </div>
            <div className="bg-white border-2 border-green-950 rounded p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-500 tracking-wider">Tổng Tiền Làm Thêm</h3>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"><TrendingUp size={20} className="text-blue-700"/></div>
              </div>
              <div className="text-3xl font-semibold text-gray-900">{fmtVnd(tongLamThem)}</div>
            </div>
            <div className="bg-white border-2 border-green-950 rounded p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-500 tracking-wider">Tổng Phạt Nghỉ Phép</h3>
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center"><FileText size={20} className="text-red-700"/></div>
              </div>
              <div className="text-3xl font-semibold text-gray-900">{fmtVnd(tongTruNghi)}</div>
            </div>
          </div>
          <div className="bg-white border-2 border-green-950 rounded p-6 mb-7 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-6">Biểu Đồ Lương Theo Tháng</h3>
            <div className="flex items-end gap-2 h-48">
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => {
                const val = thangMap[m]
                return (
                  <div key={m} className="flex flex-col items-center gap-2 flex-1 group">
                    <span className="text-[10px] font-semibold text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">{fmtVnd(val)}</span>
                    <div className="w-full bg-green-200 group-hover:bg-green-950 rounded min-h-[4px] transition-all duration-300 relative" style={{ height: `${(val / maxThang) * 140}px` }}>
                    </div>
                    <span className="text-xs font-medium text-gray-600">T{m}</span>
                  </div>
                )
              })}
            </div>
          </div>
          {user?.vaiTro === 'admin' && !filterBacSi && (
            <div className="bg-white border-2 border-green-950 rounded shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <span className="font-semibold text-gray-900">Chi Tiết Lương Theo Nhân Sự</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 tracking-wider">Nhân Viên</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 tracking-wider text-right">Làm Thêm</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 tracking-wider text-right">Khấu Trừ</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 tracking-wider text-right">Tổng Cả Năm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bsStats.map((bs, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{bs.hoTen}</td>
                        <td className="px-6 py-4 text-sm text-right text-blue-600">{fmtVnd(bs.tienLamThem)}</td>
                        <td className="px-6 py-4 text-sm text-right text-red-600">-{fmtVnd(bs.tienTruNghiPhep)}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-green-950 text-right">{fmtVnd(bs.tongLuong)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </MainLayout>
  )
}