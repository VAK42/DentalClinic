'use client'
import { UserPlus, Pencil, Trash2, Shield, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import mainLayoutComp from '@/components/mainLayout'
import api from '@/lib/api'
const MainLayout = mainLayoutComp
export default function TaiKhoanPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState([])
  const [doctors, setDoctors] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    id: null,
    tenDangNhap: '',
    matKhau: '',
    vaiTro: 'leTan',
    bacSiId: '',
    trangThai: 'hoatDong'
  })
  const [error, setError] = useState('')
  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      if (user.vaiTro !== 'admin') {
        router.push('/dashboard')
        return
      }
    }
    fetchAccounts()
    fetchDoctors()
  }, [router])
  const fetchAccounts = async () => {
    try {
      const { data } = await api.get('/taiKhoan')
      setAccounts(data)
    } catch (error) {
      console.error(error)
    }
  }
  const fetchDoctors = async () => {
    try {
      const { data } = await api.get('/bacSi')
      setDoctors(data)
    } catch (error) {
      console.error(error)
    }
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (formData.id) {
        await api.put(`/taiKhoan/${formData.id}`, formData)
      } else {
        await api.post('/taiKhoan', formData)
      }
      setShowModal(false)
      fetchAccounts()
    } catch (err) {
      setError(err.response?.data?.error || 'Có Lỗi Xảy Ra')
    }
  }
  const handleDelete = async (id) => {
    if (!confirm('Bạn Có Chắc Muốn Vô Hiệu Hóa Tài Khoản Này?')) return
    try {
      await api.delete(`/taiKhoan/${id}`)
      fetchAccounts()
    } catch (err) {
      alert(err.response?.data?.error || 'Có Lỗi Xảy Ra')
    }
  }
  const openForm = (acc = null) => {
    setError('')
    if (acc) {
      setFormData({ ...acc, matKhau: '' })
    } else {
      setFormData({
        id: null,
        tenDangNhap: '',
        matKhau: '',
        vaiTro: 'leTan',
        bacSiId: '',
        trangThai: 'hoatDong'
      })
    }
    setShowModal(true)
  }
  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-max"><Shield size={12}/> Quản Trị</span>
      case 'bacSi': return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-max"><User size={12}/> Bác Sĩ</span>
      default: return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-max"><User size={12}/> Lễ Tân</span>
    }
  }
  return (
    <MainLayout
      title="Quản Lý Tài Khoản"
      actions={
        <button
          onClick={() => openForm()}
          className="cursor-pointer flex items-center gap-2 rounded border-2 border-green-950 bg-green-950 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white hover:text-green-950"
        >
          <UserPlus size={16} /> Thêm Mới
        </button>
      }
    >
      <div className="rounded border-2 border-green-950 bg-white p-6 shadow hover:shadow-xl transition-all duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="pb-3 font-medium">Tên Đăng Nhập</th>
                <th className="pb-3 font-medium">Vai Trò</th>
                <th className="pb-3 font-medium">Trạng Thái</th>
                <th className="pb-3 font-medium">Ngày Tạo</th>
                <th className="pb-3 font-medium text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc) => (
                <tr key={acc.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="py-3 font-medium text-gray-900">{acc.tenDangNhap}</td>
                  <td className="py-3">{getRoleBadge(acc.vaiTro)}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${acc.trangThai === 'hoatDong' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {acc.trangThai === 'hoatDong' ? 'Hoạt Động' : 'Vô Hiệu Hóa'}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">{new Date(acc.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openForm(acc)} className="cursor-pointer p-1.5 text-gray-400 hover:text-green-950 transition-colors rounded hover:bg-gray-100">
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(acc.id)}
                        disabled={acc.tenDangNhap === 'admin'}
                        className="cursor-pointer p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-500">Chưa Có Tài Khoản Nào</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded border-2 border-green-950 bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">{formData.id ? 'Cập Nhật Tài Khoản' : 'Thêm Tài Khoản Mới'}</h2>
            {error && <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Tên Đăng Nhập</label>
                <input
                  type="text"
                  required
                  value={formData.tenDangNhap}
                  onChange={(e) => setFormData({ ...formData, tenDangNhap: e.target.value })}
                  className="w-full rounded border border-green-950 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-950"
                  placeholder="Admin, LeTan1, ..."
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Mật Khẩu {formData.id && <span className="text-gray-400 font-normal">(Bỏ Trống Nếu Không Đổi)</span>}
                </label>
                <input
                  type="password"
                  required={!formData.id}
                  value={formData.matKhau}
                  onChange={(e) => setFormData({ ...formData, matKhau: e.target.value })}
                  className="w-full rounded border border-green-950 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-950"
                  placeholder={formData.id ? '********' : 'Nhập Mật Khẩu Cho Tài Khoản'}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Vai Trò</label>
                <select
                  required
                  value={formData.vaiTro}
                  onChange={(e) => setFormData({ ...formData, vaiTro: e.target.value })}
                  className="w-full rounded border border-green-950 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-950"
                >
                  <option value="leTan">Lễ Tân</option>
                  <option value="bacSi">Bác Sĩ</option>
                  <option value="admin">Quản Trị Viên</option>
                </select>
              </div>
              {(formData.vaiTro === 'bacSi' || formData.vaiTro === 'leTan') && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Liên Kết Hồ Sơ Nhân Viên <span className="text-gray-400 font-normal text-xs">(Xác Định Tài Khoản Này Thuộc Về Ai)</span></label>
                  <select
                    required
                    value={formData.bacSiId || ''}
                    onChange={(e) => setFormData({ ...formData, bacSiId: e.target.value })}
                    className="w-full rounded border border-green-950 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-950"
                  >
                    <option value="">-- Chọn Nhân Viên --</option>
                    {doctors.filter(d => {
                      const taken = accounts.find(a => a.bacSiId === d.id && a.id !== formData.id)
                      return !taken
                    }).map(d => (
                      <option key={d.id} value={d.id}>{d.hoTen} ({d.loaiNhanVien === 'bacSi' ? 'Bác Sĩ' : 'Lễ Tân'})</option>
                    ))}
                  </select>
                </div>
              )}
              {formData.id && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Trạng Thái</label>
                  <select
                    required
                    value={formData.trangThai}
                    onChange={(e) => setFormData({ ...formData, trangThai: e.target.value })}
                    className="w-full rounded border border-green-950 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-950"
                  >
                    <option value="hoatDong">Hoạt Động</option>
                    <option value="ngungHoatDong">Vô Hiệu Hóa</option>
                  </select>
                </div>
              )}
              <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="cursor-pointer rounded px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="cursor-pointer rounded border-2 border-green-950 bg-green-950 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white hover:text-green-950"
                >
                  Lưu Thông Tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  )
}