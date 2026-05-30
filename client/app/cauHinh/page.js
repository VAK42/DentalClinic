'use client'
import { useState, useEffect } from 'react'
import mainLayoutComp from '../../components/mainLayout'
import api from '../../lib/api'
const MainLayout = mainLayoutComp
export default function CauHinhPage() {
  const [form, setForm] = useState({ soTienMotGioBacSi: '100000', soTienMotGioLeTan: '50000' })
  const [saving, setSaving] = useState(false)
  useEffect(() => { api.get('/cauHinh').then(r => setForm(prev => ({ ...prev, ...r.data }))).catch(console.error) }, [])
  const handleSubmit = async (e) => { e.preventDefault(); setSaving(true); try { await api.put('/cauHinh', form); alert('Đã Lưu Cấu Hình Thành Công!') } catch (err) { alert('Lỗi Khi Lưu Cấu Hình') } finally { setSaving(false) } }
  const inputCls = 'w-full rounded border border-green-950 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-950 placeholder:text-gray-400'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'
  return (
    <MainLayout title="Cấu Hình Hệ Thống">
      <div className="bg-white border-2 border-green-950 rounded shadow-sm overflow-hidden w-full">
        <form onSubmit={handleSubmit} className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-2">Thiết Lập Mức Tiền Cơ Bản</h2>
          <div className="space-y-6">
            <div>
              <label className={labelCls}>Đối Với Bác Sĩ</label>
              <input
                type="number"
                required
                className={inputCls}
                value={form.soTienMotGioBacSi}
                onChange={e => setForm({ ...form, soTienMotGioBacSi: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-2">Được Sử Dụng Làm Hệ Số Nhân Khi Tính Tiền Làm Thêm Giờ Của Bác Sĩ</p>
            </div>
            <div>
              <label className={labelCls}>Đối Với Lễ Tân (VNĐ)</label>
              <input
                type="number"
                required
                className={inputCls}
                value={form.soTienMotGioLeTan}
                onChange={e => setForm({ ...form, soTienMotGioLeTan: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-2">Được Sử Dụng Làm Hệ Số Nhân Khi Tính Tiền Làm Thêm Giờ Của Lễ Tân</p>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="cursor-pointer inline-flex items-center gap-2 rounded border-2 border-green-950 bg-green-950 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-white hover:text-green-950 disabled:opacity-50"
            >
              {saving ? 'Đang Lưu...' : 'Lưu Cấu Hình'}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}