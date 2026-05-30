'use client'
import { BarChart3, DollarSign, Users, CalendarDays, Stethoscope, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import mainLayoutComp from '../../components/mainLayout'
import api from '../../lib/api'
const MainLayout = mainLayoutComp
export default function ThongKePage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filterNam, setFilterNam] = useState(new Date().getFullYear())
  useEffect(() => {
    setLoading(true)
    api.get('/thongKe/tongQuan', { params: { nam: filterNam } }).then((r) => { setData(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [filterNam])
  const fmtVnd = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0)
  const thangData = Array.from({ length: 12 }, (_, i) => {
    const found = data?.lichHenTheoThang?.find((m) => parseInt(m.thang) === i + 1)
    return { label: `T${i + 1}`, count: found ? found.soLuong : 0 }
  })
  const maxBar = Math.max(...thangData.map((t) => t.count), 1)
  const Skeleton = () => (
    <div className="bg-white border-2 border-gray-100 rounded p-5 animate-pulse">
      <div className="w-12 h-12 bg-gray-100 rounded-full mb-4"/>
      <div className="h-8 bg-gray-100 rounded w-3/4 mb-2"/>
      <div className="h-4 bg-gray-100 rounded w-1/2"/>
    </div>
  )
  return (
    <MainLayout
      title="Báo Cáo & Thống Kê"
      actions={
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-600">Năm:</label>
          <select 
            className="rounded border border-green-950 px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-950 bg-white" 
            value={filterNam} 
            onChange={(e) => setFilterNam(e.target.value)}
          >
            {[2023, 2024, 2025, 2026].map((y) => <option key={y}>{y}</option>)}
          </select>
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5 mb-7">
        {loading ? (
          <><Skeleton/><Skeleton/><Skeleton/><Skeleton/><Skeleton/><Skeleton/></>
        ) : (
          <>
            <div className="bg-white border-2 border-green-950 rounded p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4 border border-blue-100">
                <TrendingUp size={24} className="text-blue-600"/>
              </div>
              <div className="text-xl font-semibold text-gray-900 leading-tight">{fmtVnd(data?.phatSinh)}</div>
              <div className="text-sm font-medium text-gray-500 mt-1">Doanh Thu Phát Sinh</div>
            </div>
            <div className="bg-white border-2 border-green-950 rounded p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4 border border-green-100">
                <DollarSign size={24} className="text-green-600"/>
              </div>
              <div className="text-xl font-semibold text-gray-900 leading-tight">{fmtVnd(data?.thucThu)}</div>
              <div className="text-sm font-medium text-gray-500 mt-1">Thực Thu (Đã Thu)</div>
            </div>
            <div className="bg-white border-2 border-green-950 rounded p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4 border border-red-100">
                <DollarSign size={24} className="text-red-600"/>
              </div>
              <div className="text-xl font-semibold text-gray-900 leading-tight">{fmtVnd(data?.luongDaTra)}</div>
              <div className="text-sm font-medium text-gray-500 mt-1">Lương Đã Trả</div>
            </div>
            <div className="bg-white border-2 border-green-950 rounded p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-4 border border-emerald-100">
                <TrendingUp size={24} className="text-emerald-600"/>
              </div>
              <div className="text-xl font-semibold text-gray-900 leading-tight">{fmtVnd(data?.loiNhuanRong)}</div>
              <div className="text-sm font-medium text-gray-500 mt-1">Lợi Nhuận Ròng</div>
            </div>
            <div className="bg-white border-2 border-green-950 rounded p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-4 border border-indigo-100">
                <Users size={24} className="text-indigo-600"/>
              </div>
              <div className="text-xl font-semibold text-gray-900 leading-tight">{data?.benhNhanMoi || 0}</div>
              <div className="text-sm font-medium text-gray-500 mt-1">Tổng Bệnh Nhân</div>
            </div>
            <div className="bg-white border-2 border-green-950 rounded p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mb-4 border border-purple-100">
                <Stethoscope size={24} className="text-purple-600"/>
              </div>
              <div className="text-xl font-semibold text-gray-900 leading-tight">{data?.nhanSuHoatDong || 0}</div>
              <div className="text-sm font-medium text-gray-500 mt-1">Nhân Sự Hoạt Động</div>
            </div>
          </>
        )}
      </div>
      {loading ? (
        <div className="bg-white border-2 border-gray-100 rounded h-64 animate-pulse mb-7"/>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-7">
          <div className="bg-white border-2 border-green-950 rounded p-6 hover:shadow-lg transition-all">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-3">
              <TrendingUp size={20} className="text-green-950"/>
              <span className="font-semibold text-gray-900">Lịch Hẹn Theo Tháng — {filterNam}</span>
            </div>
            <div className="flex items-end gap-2 h-48">
              {thangData.map((t) => (
                <div key={t.label} className="flex flex-col items-center gap-2 flex-1 group">
                  <span className="text-[11px] font-semibold text-green-950 opacity-0 group-hover:opacity-100 transition-opacity">{t.count > 0 ? t.count : ''}</span>
                  <div className="w-full bg-green-200 group-hover:bg-green-950 rounded min-h-[4px] transition-all duration-300" style={{ height: `${(t.count / maxBar) * 140}px` }}/>
                  <span className="text-[11px] font-medium text-gray-500">{t.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border-2 border-green-950 rounded overflow-hidden hover:shadow-lg transition-all">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 bg-gray-50">
              <Stethoscope size={20} className="text-green-950"/>
              <span className="font-semibold text-gray-900">Doanh Thu Theo Bác Sĩ</span>
            </div>
            {data?.topBacSi?.length ? (
              <div className="overflow-x-auto p-4">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-500 border-b border-gray-100">
                      <th className="py-2 px-3 text-xs font-semibold tracking-wider">#</th>
                      <th className="py-2 px-3 text-xs font-semibold tracking-wider">Bác Sĩ</th>
                      <th className="py-2 px-3 text-xs font-semibold tracking-wider text-right">Doanh Thu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topBacSi.map((bs, i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <td className="py-3 px-3"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold bg-green-100 text-green-800">{i + 1}</span></td>
                        <td className="py-3 px-3 text-sm font-medium text-gray-900">{bs.hoTen}</td>
                        <td className="py-3 px-3 text-sm font-semibold text-green-600 text-right">{fmtVnd(bs.doanhThu)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <BarChart3 size={32} className="mb-2 opacity-50"/>
                <span className="text-sm font-medium">Chưa Có Dữ Liệu</span>
              </div>
            )}
          </div>
        </div>
      )}
      {loading ? (
        <div className="bg-white border-2 border-gray-100 rounded h-64 animate-pulse"/>
      ) : (
        data?.soDichVuTheoNhom?.length > 0 && (
          <div className="bg-white border-2 border-green-950 rounded overflow-hidden hover:shadow-lg transition-all">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <span className="font-semibold text-gray-900">Cơ Cấu Doanh Thu Theo Nhóm Dịch Vụ</span>
            </div>
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100">
                    <th className="py-2 px-3 text-xs font-semibold tracking-wider">Nhóm Dịch Vụ</th>
                    <th className="py-2 px-3 text-xs font-semibold tracking-wider">Số Lần Sử Dụng</th>
                    <th className="py-2 px-3 text-xs font-semibold tracking-wider">Doanh Thu</th>
                    <th className="py-2 px-3 text-xs font-semibold tracking-wider">Tỷ Trọng</th>
                  </tr>
                </thead>
                <tbody>
                  {data.soDichVuTheoNhom.map((n, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="py-4 px-3 text-sm font-medium text-gray-900">{n.nhom || 'Chưa Phân Nhóm'}</td>
                      <td className="py-4 px-3"><span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">{n.soLuong} Lần</span></td>
                      <td className="py-4 px-3 text-sm font-semibold text-green-950">{fmtVnd(n.doanhThu)}</td>
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                            <div className="h-full bg-green-950 rounded-full transition-all duration-500" style={{ width: `${data.phatSinh ? Math.round((n.doanhThu / data.phatSinh) * 100) : 0}%` }}/>
                          </div>
                          <span className="text-xs font-semibold text-gray-500 w-9">{data.phatSinh ? Math.round((n.doanhThu / data.phatSinh) * 100) : 0}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </MainLayout>
  )
}