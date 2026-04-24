import 'dotenv/config'
import express, { json } from 'express'
import cors from 'cors'
import quanLyTaiKhoanRouter from './routes/quanLyTaiKhoan.js'
import hoSoBenhAnRouter from './routes/hoSoBenhAn.js'
import bangLuongRouter from './routes/bangLuong.js'
import caLamViecRouter from './routes/caLamViec.js'
import benhNhanRouter from './routes/benhNhan.js'
import lichHenRouter from './routes/lichHen.js'
import thongKeRouter from './routes/thongKe.js'
import dichVuRouter from './routes/dichVu.js'
import hoaDonRouter from './routes/hoaDon.js'
import bacSiRouter from './routes/bacSi.js'
import authRouter from './routes/auth.js'
import aiRouter from './routes/ai.js'
import { verifyToken } from './middleware/auth.js'
const app = express()
app.use(cors())
app.use(json())
app.use('/api/auth', authRouter)
app.use(verifyToken)
app.use('/api/taiKhoan', quanLyTaiKhoanRouter)
app.use('/api/hoSoBenhAn', hoSoBenhAnRouter)
app.use('/api/bangLuong', bangLuongRouter)
app.use('/api/caLamViec', caLamViecRouter)
app.use('/api/benhNhan', benhNhanRouter)
app.use('/api/thongKe', thongKeRouter)
app.use('/api/lichHen', lichHenRouter)
app.use('/api/dichVu', dichVuRouter)
app.use('/api/hoaDon', hoaDonRouter)
app.use('/api/bacSi', bacSiRouter)
app.use('/api/ai', aiRouter)
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message })
})
export default app