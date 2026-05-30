'use client'
import { useState } from 'react'
const statusConfig = {
  binhThuong: { label: 'Bình Thường', svgColor: '#e5e7eb' },
  sauRang: { label: 'Sâu Răng', svgColor: '#dc2626' },
  tramRang: { label: 'Trám Răng', svgColor: '#d97706' },
  matRang: { label: 'Mất Răng', svgColor: '#9ca3af' },
  rangGia: { label: 'Răng Giả', svgColor: '#16a34a' },
  viemLoi: { label: 'Viêm Lợi', svgColor: '#ec4899' },
  rangKhon: { label: 'Răng Khôn', svgColor: '#3b82f6' },
}
const upperRight = [18, 17, 16, 15, 14, 13, 12, 11]
const upperLeft = [21, 22, 23, 24, 25, 26, 27, 28]
const lowerRight = [48, 47, 46, 45, 44, 43, 42, 41]
const lowerLeft = [31, 32, 33, 34, 35, 36, 37, 38]
function toothSvg(soRang, status, onClick) {
  const cfg = statusConfig[status] || statusConfig.binhThuong
  const isMissing = status === 'matRang'
  return (
    <div key={soRang} className="flex flex-col items-center gap-1 group">
      <span className="text-[10px] font-semibold text-gray-400 group-hover:text-green-950 transition-colors">{soRang}</span>
      <div className="cursor-pointer transition-transform hover:scale-110" onClick={() => onClick(soRang)} title={cfg.label}>
        <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
          {isMissing ? (
            <>
              <line x1="4" y1="4" x2="28" y2="38" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
              <line x1="28" y1="4" x2="4" y2="38" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
            </>
          ) : (
            <>
              <rect x="2" y="2" width="28" height="20" rx="6" fill={cfg.svgColor} stroke="#d1d5db" strokeWidth="1"/>
              <rect x="6" y="26" width="8" height="13" rx="3" fill={cfg.svgColor} stroke="#d1d5db" strokeWidth="1"/>
              <rect x="18" y="26" width="8" height="13" rx="3" fill={cfg.svgColor} stroke="#d1d5db" strokeWidth="1"/>
              <rect x="7" y="6" width="18" height="10" rx="3" fill="rgba(255,255,255,0.4)"/>
            </>
          )}
        </svg>
      </div>
    </div>
  )
}
export default function OdontogramComp({ data = [], onChange, readOnly = false }) {
  const [selectedTooth, setSelectedTooth] = useState(null)
  const [showPicker, setShowPicker] = useState(false)
  const getStatus = (soRang) => {
    const found = data.find((d) => d.soRang === soRang)
    return found ? found.tinhTrang : 'binhThuong'
  }
  const handleToothClick = (soRang) => {
    if (readOnly) return
    setSelectedTooth(soRang)
    setShowPicker(true)
  }
  const handleSelect = (tinhTrang) => {
    if (!onChange) return
    const updated = data.filter((d) => d.soRang !== selectedTooth)
    if (tinhTrang !== 'binhThuong') updated.push({ soRang: selectedTooth, tinhTrang, ghiChu: '' })
    onChange(updated)
    setShowPicker(false)
    setSelectedTooth(null)
  }
  return (
    <div>
      <div className="bg-gray-50 border-2 border-gray-100 rounded p-5 overflow-x-auto shadow-inner">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-semibold text-gray-500 w-16 flex-shrink-0 uppercase tracking-wider">HÀM TRÊN</span>
            <div className="flex gap-1">{upperRight.map((n) => toothSvg(n, getStatus(n), handleToothClick))}</div>
            <div className="w-px bg-green-950/20 self-stretch mx-2 rounded-full"/>
            <div className="flex gap-1">{upperLeft.map((n) => toothSvg(n, getStatus(n), handleToothClick))}</div>
          </div>
          <div className="w-full h-px bg-gray-200 my-2 rounded-full"/>
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-semibold text-gray-500 w-16 flex-shrink-0 uppercase tracking-wider">HÀM DƯỚI</span>
            <div className="flex gap-1">{lowerRight.map((n) => toothSvg(n, getStatus(n), handleToothClick))}</div>
            <div className="w-px bg-green-950/20 self-stretch mx-2 rounded-full"/>
            <div className="flex gap-1">{lowerLeft.map((n) => toothSvg(n, getStatus(n), handleToothClick))}</div>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-6 pt-4 border-t border-gray-200">
          {Object.entries(statusConfig).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
              <div className="w-3 h-3 rounded-full flex-shrink-0 shadow-inner" style={{ background: cfg.svgColor, border: '1px solid rgba(0,0,0,0.1)' }}/>
              <span className="text-[11px] font-semibold text-gray-700">{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>
      {showPicker && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4" onClick={() => setShowPicker(false)}>
          <div className="bg-white border-2 border-green-950 rounded p-6 w-80 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
              <span className="text-base font-semibold text-gray-900">Chi Tiết Răng Số {selectedTooth}</span>
              <button className="w-8 h-8 hover:bg-gray-100 text-gray-400 hover:text-gray-900 rounded-full flex items-center justify-center transition-colors cursor-pointer" onClick={() => setShowPicker(false)}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(statusConfig).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => handleSelect(key)}
                  className={`cursor-pointer flex items-center gap-2 px-3 py-2 rounded text-sm font-semibold transition-all border ${getStatus(selectedTooth) === key ? 'border-green-950 bg-green-50 text-green-950 shadow-sm' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}
                >
                  <div className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-inner" style={{ background: cfg.svgColor, border: '1px solid rgba(0,0,0,0.1)' }}/>
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}