const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')

const app = express()
const PORT = 3002
const DB_FILE = path.join(__dirname, 'bookings-db.json')
const OVERRIDES_FILE = path.join(__dirname, 'slot-overrides.json')
const SETTINGS_FILE = path.join(__dirname, 'booking-settings.json')

app.use(cors())
app.use(express.json())

// ---------- storage helpers ----------

function readDB() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) } catch { return [] }
}
function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2))
}
function readOverrides() {
  try { return JSON.parse(fs.readFileSync(OVERRIDES_FILE, 'utf8')) } catch { return {} }
}
function writeOverrides(data) {
  fs.writeFileSync(OVERRIDES_FILE, JSON.stringify(data, null, 2))
}
function readSettings() {
  try { return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')) }
  catch { return { defaultLimit: 3, dayLimits: {}, blockedDates: [] } }
}
function writeSettings(data) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2))
}

function getLimitForDate(date, settings) {
  if (settings.dayLimits && settings.dayLimits[date] !== undefined) {
    return settings.dayLimits[date]
  }
  return settings.defaultLimit ?? 3
}

function countBookingsForDate(date, bookings) {
  return bookings.filter(b => b.requiredDate === date && b.status !== 'Cancelled').length
}

// GET / — health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'S K Borewells API', port: PORT })
})

// ---------- booking count / availability ----------

// GET /booking-count/:date — used by customer frontend to check availability
app.get('/booking-count/:date', (req, res) => {
  const { date } = req.params
  const settings = readSettings()

  if (settings.blockedDates && settings.blockedDates.includes(date)) {
    return res.json({ count: 0, limit: 0, remaining: 0, blocked: true })
  }

  const bookings = readDB()
  const limit = getLimitForDate(date, settings)
  const count = countBookingsForDate(date, bookings)
  const remaining = Math.max(0, limit - count)

  res.json({ count, limit, remaining, blocked: false })
})

// GET /bookings/by-mobile/:mobile — all bookings for a customer mobile (must come before /bookings/:id)
app.get('/bookings/by-mobile/:mobile', (req, res) => {
  const bookings = readDB()
  const mobile = req.params.mobile.replace(/\D/g, '')
  const results = bookings.filter(b => b.mobile && b.mobile.replace(/\D/g, '') === mobile)
  res.json(results)
})

// GET /bookings/by-email/:email — all bookings for a customer email (must come before /bookings/:id)
app.get('/bookings/by-email/:email', (req, res) => {
  const bookings = readDB()
  const email = decodeURIComponent(req.params.email).trim().toLowerCase()
  const results = bookings.filter(b => b.email && b.email.trim().toLowerCase() === email)
  res.json(results)
})

// GET /bookings/track/:bookingId — public customer tracking (must come before /bookings/:id)
app.get('/bookings/track/:bookingId', (req, res) => {
  const bookings = readDB()
  const booking = bookings.find(b => b.bookingId === req.params.bookingId)
  if (!booking) return res.status(404).json({ message: 'Booking not found' })
  res.json(booking)
})

// GET /bookings/daily-summary — admin capacity view (must come before /bookings/:id)
app.get('/bookings/daily-summary', (req, res) => {
  const bookings = readDB()
  const settings = readSettings()

  const byDate = {}
  for (const b of bookings) {
    if (!b.requiredDate || b.status === 'Cancelled') continue
    byDate[b.requiredDate] = (byDate[b.requiredDate] || 0) + 1
  }
  // Include blocked dates in summary even if no bookings
  if (settings.blockedDates) {
    for (const d of settings.blockedDates) {
      if (!(d in byDate)) byDate[d] = 0
    }
  }

  const summary = Object.entries(byDate).map(([date, count]) => {
    const limit = getLimitForDate(date, settings)
    const blocked = settings.blockedDates && settings.blockedDates.includes(date)
    return { date, count, limit, remaining: Math.max(0, limit - count), blocked }
  }).sort((a, b) => a.date.localeCompare(b.date))

  res.json(summary)
})

// ---------- bookings CRUD ----------

// GET /bookings — list all bookings
app.get('/bookings', (req, res) => {
  res.json(readDB())
})

// POST /bookings — create booking with server-side limit check
app.post('/bookings', (req, res) => {
  const booking = req.body
  const bookings = readDB()
  const settings = readSettings()
  const date = booking.requiredDate

  if (date) {
    if (settings.blockedDates && settings.blockedDates.includes(date)) {
      return res.status(409).json({ success: false, message: 'Selected date is blocked by admin.' })
    }
    const limit = getLimitForDate(date, settings)
    const count = countBookingsForDate(date, bookings)
    if (count >= limit) {
      return res.status(409).json({
        success: false,
        message: `Booking limit reached for ${date}. Selected date is fully booked.`,
      })
    }
  }

  const exists = bookings.find(b => b.bookingId === booking.bookingId)
  if (!exists) {
    bookings.unshift({ ...booking, status: booking.status || 'Booking Received', createdAt: new Date().toISOString() })
    writeDB(bookings)
    console.log(`New booking: ${booking.bookingId} — ${booking.customerName} for ${date}`)
  }
  res.status(201).json({ success: true, message: 'Booking confirmed successfully' })
})

// PATCH /bookings/:id — update booking status (used by delay notification)
app.patch('/bookings/:id', (req, res) => {
  const bookings = readDB()
  const idx = bookings.findIndex(b => b.bookingId === req.params.id || b.id === req.params.id)
  if (idx === -1) return res.status(404).json({ success: false, message: 'Booking not found' })
  bookings[idx] = { ...bookings[idx], ...req.body }
  writeDB(bookings)
  res.json({ success: true, booking: bookings[idx] })
})

// PUT /bookings/:bookingId — legacy alias (admin dashboard may use PUT)
app.put('/bookings/:bookingId', (req, res) => {
  const bookings = readDB()
  const idx = bookings.findIndex(b => b.bookingId === req.params.bookingId)
  if (idx >= 0) {
    bookings[idx] = { ...bookings[idx], ...req.body }
    writeDB(bookings)
    res.json({ ok: true })
  } else {
    res.status(404).json({ error: 'Not found' })
  }
})

// ---------- legacy slot endpoints (kept for admin dashboard compatibility) ----------

app.post('/slot-override', (req, res) => {
  const { date, slot } = req.body
  if (!date || !slot) return res.status(400).json({ error: 'date and slot required' })
  const overrides = readOverrides()
  overrides[date] = [...new Set([...(overrides[date] || []), slot.toLowerCase()])]
  writeOverrides(overrides)
  res.json({ ok: true })
})

app.get('/booked-slots/:date', (req, res) => {
  const bookings = readDB()
  const overrides = readOverrides()
  const date = req.params.date
  const booked = new Set(overrides[date] || [])
  for (const b of bookings) {
    if (b.status === 'Cancelled') continue
    if (b.requiredDate === date && b.timeSlot) booked.add(b.timeSlot.toLowerCase())
    if (b.scheduledDate === date && b.scheduledTime) booked.add(b.scheduledTime.toLowerCase())
  }
  res.json([...booked])
})

// ---------- admin settings ----------

app.get('/admin/settings', (req, res) => {
  res.json(readSettings())
})

app.patch('/admin/settings', (req, res) => {
  const settings = readSettings()
  const updated = { ...settings, ...req.body }
  writeSettings(updated)
  res.json({ success: true, settings: updated })
})

app.post('/admin/blocked-dates', (req, res) => {
  const { date } = req.body
  if (!date) return res.status(400).json({ success: false, message: 'Date required' })
  const settings = readSettings()
  if (!settings.blockedDates) settings.blockedDates = []
  if (!settings.blockedDates.includes(date)) {
    settings.blockedDates.push(date)
    writeSettings(settings)
  }
  res.json({ success: true, blockedDates: settings.blockedDates })
})

app.delete('/admin/blocked-dates/:date', (req, res) => {
  const settings = readSettings()
  settings.blockedDates = (settings.blockedDates || []).filter(d => d !== req.params.date)
  writeSettings(settings)
  res.json({ success: true, blockedDates: settings.blockedDates })
})

// ---------- start ----------

app.listen(PORT, () => {
  console.log(`Borewell API server running at http://localhost:${PORT}`)
})
