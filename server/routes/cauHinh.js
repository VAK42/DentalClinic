import { Router } from 'express'
import db from '../db.js'
const router = Router()
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM cauHinh').all()
  const result = {}
  rows.forEach(r => { result[r.key] = r.value })
  res.json(result)
})
router.put('/', (req, res) => {
  const settings = req.body
  const updateStmt = db.prepare('INSERT OR REPLACE INTO cauHinh (key, value) VALUES (?, ?)')
  db.transaction(() => {
    for (const [key, value] of Object.entries(settings)) {
      updateStmt.run(key, value.toString())
    }
  })()
  res.json({ success: true })
})
export default router