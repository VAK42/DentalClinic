'use client'
import { useState, useEffect } from 'react'
import mainLayoutComp from '../../components/mainLayout'
import api from '../../lib/api'
import { Trash2, Plus } from 'lucide-react'
const MainLayout = mainLayoutComp
export default function NgayNghiPage() {
  const [list, setList] = useState([])
  const [bacSiList, setBacSiList] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ bacSiId: '', ngay: '', loaiNghi: 'nghiPhep', ghiChu: '' })
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [filterThang, setFilterThang] = useState(new Date().getMonth() + 1)
  const [filterNam, setFilterNam] = useState(new Date().getFullYear())
  const load = () => { setLoading(true); api.get(`/ngayNghi?thang=${filterThang}&nam=${filterNam}`).then(r => setList(r.data)).catch(console.error).finally(() => setLoading(false)) }
  useEffect(() => { api.get('/bacSi').then(r => setBacSiList(r.data.filter(b => b.trangThai === 'hoatDong'))); load() }, [filterThang, filterNam])
  const handleSubmit = async (e) => { e.preventDefault(); setSaving(true); try { await api.post('/ngayNghi', form); setShowModal(false); load() } catch (e) { alert('Có Lỗi Xảy Ra') } finally { setSaving(false) } }
  const handleDelete = async (id) => { if (!confirm('Xác Nhận Xóa Ngày Nghỉ Này?')) return; await api.delete(`/ngayNghi/${id}`); load() }
  const inputCls = 'w-full rounded border border-green-950 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-950 placeholder:text-gray-400'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'
  return (
    <MainLayout title="Quản Lý Ngày Nghỉ" actions={
      <button onClick={() => { setForm({ bacSiId: '', ngay: '', loaiNghi: 'nghiPhep', ghiChu: '' }); setShowModal(true) }} className="cursor-pointer inline-flex items-center gap-2 rounded border-2 border-green-950 bg-green-950 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white hover:text-green-950">
        <Plus size={18} /> Thêm Ngày Nghỉ
      </button>
    }>
      <div className="mb-6 flex gap-4 items-center">
        <div>
          <label className={labelCls}>Tháng</label>
          <select value={filterThang} onChange={e => setFilterThang(e.target.value)} className={inputCls}>
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>Tháng {m}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Năm</label>
          <select value={filterNam} onChange={e => setFilterNam(e.target.value)} className={inputCls}>
            {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
      <div className="bg-white rounded border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 tracking-wider">Ngày</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 tracking-wider">Nhân Viên</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 tracking-wider">Loại Nghỉ</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 tracking-wider">Ghi Chú</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 tracking-wider text-right">Hành Động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="5" className="text-center py-10">Đang Tải Dữ Liệu...</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan="5" className="text-center py-10 text-gray-500">Không Có Dữ Liệu</td></tr>
            ) : list.map(item => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(item.ngay).toLocaleDateString('vi-VN')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.tenBacSi || <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">Tất Cả (Lễ)</span>}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.loaiNghi === 'nghiLe' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                    {item.loaiNghi === 'nghiLe' ? 'Nghỉ Lễ' : 'Nghỉ Phép'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{item.ghiChu || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button onClick={() => handleDelete(item.id)} className="cursor-pointer px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded hover:bg-red-100 transition-colors">
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-semibold mb-4 border-b border-gray-100 pb-2">Thêm Ngày Nghỉ</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelCls}>Loại Nghỉ *</label>
                <select required value={form.loaiNghi} onChange={e => setForm({...form, loaiNghi: e.target.value})} className={inputCls}>
                  <option value="nghiPhep">Nghỉ Phép (Cá Nhân)</option>
                  <option value="nghiLe">Nghỉ Lễ (Toàn Phòng Khám)</option>
                </select>
              </div>
              {form.loaiNghi === 'nghiPhep' && (
                <div>
                  <label className={labelCls}>Bác Sĩ / Lễ Tân *</label>
                  <select required value={form.bacSiId} onChange={e => setForm({...form, bacSiId: e.target.value})} className={inputCls}>
                    <option value="">-- Chọn Nhân Viên --</option>
                    {bacSiList.map(b => <option key={b.id} value={b.id}>{b.hoTen}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className={labelCls}>Ngày *</label>
                <input type="date" required value={form.ngay} onChange={e => setForm({...form, ngay: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Ghi Chú</label>
                <textarea value={form.ghiChu} onChange={e => setForm({...form, ghiChu: e.target.value})} className={inputCls} rows="3" />
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="cursor-pointer px-4 py-2 rounded text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">Hủy</button>
                <button type="submit" disabled={saving} className="cursor-pointer inline-flex items-center gap-2 rounded border-2 border-green-950 bg-green-950 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-white hover:text-green-950 disabled:opacity-50">Lưu Lại</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  )
}