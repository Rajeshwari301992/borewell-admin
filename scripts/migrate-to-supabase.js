/**
 * One-time migration: bookings-db.json → Supabase
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/migrate-to-supabase.js
 */
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars before running.')
  process.exit(1)
}

const supabase = createClient(url, key)

function toRow(b) {
  return {
    booking_id:         b.bookingId || b.id,
    customer_name:      b.customerName || '',
    mobile:             b.mobile || '',
    alt_mobile:         b.altMobile || '',
    email:              b.email ? b.email.toLowerCase().trim() : '',
    address:            b.address || '',
    village:            b.village || '',
    pincode:            b.pincode || '',
    service_type:       b.serviceType || '',
    depth:              b.depth || 0,
    estimated_amount:   b.estimatedAmount || 0,
    booking_date:       b.bookingDate || '',
    required_date:      b.requiredDate || '',
    status:             b.status || 'Booking Received',
    notes:              b.notes || '',
    time_slot:          b.timeSlot || '',
    assigned_team:      b.assignedTeam || '',
    assigned_operator:  b.assignedOperator || '',
    assigned_vehicle:   b.assignedVehicle || '',
    scheduled_date:     b.scheduledDate || '',
    scheduled_time:     b.scheduledTime || '',
    final_depth:        b.finalDepth ?? null,
    water_strike_level: b.waterStrikeLevel ?? null,
    final_amount:       b.finalAmount ?? null,
    job_notes:          b.jobNotes || '',
  }
}

async function migrate() {
  const dbPath = path.join(__dirname, '..', 'bookings-db.json')
  if (!fs.existsSync(dbPath)) { console.log('bookings-db.json not found'); return }
  const bookings = JSON.parse(fs.readFileSync(dbPath, 'utf8'))
  console.log(`Migrating ${bookings.length} bookings…`)

  const rows = bookings.map(toRow)
  const { error } = await supabase.from('bookings').upsert(rows, { onConflict: 'booking_id' })
  if (error) { console.error('Migration failed:', error.message); process.exit(1) }
  console.log(`✓ Migrated ${rows.length} bookings to Supabase`)

  // Migrate settings
  const settingsPath = path.join(__dirname, '..', 'booking-settings.json')
  if (fs.existsSync(settingsPath)) {
    const s = JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
    await supabase.from('app_settings').upsert({
      id: 1,
      default_limit: s.defaultLimit ?? 3,
      day_limits: s.dayLimits ?? {},
      blocked_dates: s.blockedDates ?? [],
    })
    console.log('✓ Migrated settings')
  }
}

migrate().catch(console.error)
