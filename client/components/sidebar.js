'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Stethoscope,
  Activity,
  Receipt,
  Wallet,
  BarChart3,
  LogOut,
  UserCog,
  Smile,
  Settings,
  CalendarOff
} from 'lucide-react'
const allNavGroups = [
  {
    label: 'Tổng Quan',
    roles: ['admin'],
    items: [{ href: '/dashboard', label: 'Bảng Điều Khiển', icon: LayoutDashboard }],
  },
  {
    label: 'Bệnh Nhân',
    roles: ['admin', 'leTan', 'bacSi'],
    items: [
      { href: '/benhNhan', label: 'Hồ Sơ Bệnh Nhân', icon: Users },
      { href: '/lichHen', label: 'Lịch Hẹn', icon: CalendarDays },
    ],
  },
  {
    label: 'Quản Lý',
    roles: ['admin'],
    items: [
      { href: '/bacSi', label: 'Nhân Sự', icon: Stethoscope },
      { href: '/ngayNghi', label: 'Ngày Nghỉ', icon: CalendarOff },
      { href: '/dichVu', label: 'Dịch Vụ & Phí', icon: Activity },
    ],
  },
  {
    label: 'Quản Trị Hệ Thống',
    roles: ['admin'],
    items: [
      { href: '/taiKhoan', label: 'Tài Khoản', icon: UserCog },
      { href: '/cauHinh', label: 'Cấu Hình', icon: Settings },
    ],
  },
  {
    label: 'Tài Chính',
    roles: ['admin', 'leTan', 'bacSi'],
    items: [
      { href: '/hoaDon', label: 'Hóa Đơn', icon: Receipt, roles: ['admin', 'leTan'] },
      { href: '/bangLuong', label: 'Bảng Lương', icon: Wallet, roles: ['admin', 'bacSi', 'leTan'] },
      { 
        href: '/thongKe', 
        label: 'Thống Kê', 
        icon: BarChart3, 
        roles: ['admin', 'bacSi', 'leTan'],
        subItems: [
          { href: '/thongKe/luong', label: 'Báo Cáo Lương', roles: ['admin', 'bacSi', 'leTan'] }
        ]
      },
    ],
  },
]
export default function sidebarComp({ user, onLogout }) {
  const pathname = usePathname()
  if (!user) return null
  const filteredGroups = allNavGroups
    .filter(g => g.roles.includes(user.vaiTro))
    .map(g => ({
      ...g,
      items: g.items
        .filter(item => !item.roles || item.roles.includes(user.vaiTro))
        .map(item => {
          if (item.subItems) {
            return { ...item, subItems: item.subItems.filter(sub => !sub.roles || sub.roles.includes(user.vaiTro)) }
          }
          return item
        })
    }))
    .filter(g => g.items.length > 0)
  const roleDisplay = {
    admin: 'Quản Trị',
    leTan: 'Lễ Tân',
    bacSi: 'Bác Sĩ'
  }[user.vaiTro] || 'User'
  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0 z-50">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-200">
        <div className="w-10 h-10 bg-green-950 rounded-full flex items-center justify-center flex-shrink-0">
          <Smile className="text-white" size={22} />
        </div>
        <div className="leading-tight">
          <div className="text-base font-semibold text-gray-900">Dental<span className="text-green-950">Clinic</span></div>
          <div className="text-xs font-medium text-gray-500">{roleDisplay} - {user.tenDangNhap}</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {filteredGroups.map((group) => (
          <div key={group.label} className="mb-6">
            <div className="text-[11px] font-semibold text-gray-400 tracking-wider px-3 mb-3">{group.label}</div>
            {group.items.map((item) => {
              const Icon = item.icon
              const isActive = item.href === '/thongKe' ? pathname === '/thongKe' : pathname.startsWith(item.href)
              return (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-all mb-1 ${isActive ? 'bg-green-950/10 text-green-950' : 'text-gray-600 hover:bg-gray-100 hover:text-green-950'}`}
                  >
                    <Icon size={18} className={isActive ? 'text-green-950' : 'text-gray-400'} />
                    {item.label}
                  </Link>
                  {item.subItems && item.subItems.length > 0 && (
                    <div className="flex flex-col gap-1 ml-4 border-l border-gray-200 pl-4 mt-1 mb-2">
                      {item.subItems.map(sub => {
                        const isSubActive = pathname.startsWith(sub.href)
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={`block py-1.5 text-xs font-medium transition-all ${isSubActive ? 'text-green-950' : 'text-gray-500 hover:text-green-950'}`}
                          >
                            {sub.label}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="cursor-pointer flex w-full items-center gap-3 px-3 py-2.5 rounded text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} />
          Đăng Xuất
        </button>
      </div>
    </aside>
  )
}