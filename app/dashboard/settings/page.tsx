'use client'
import { useState, useEffect } from 'react'

const SETTINGS_KEY = 'borewell_admin_settings'

const DEFAULTS = {
  companyName: 'S K Borewells',
  phone: '+91 83100 08194',
  email: 'info@borewellpro.in',
  gst: '29XXXXX1234Z1ZX',
}

function loadSettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }
  } catch { return DEFAULTS }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState(DEFAULTS)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  const update = (key: string, val: string) => {
    setSettings(s => ({ ...s, [key]: val }))
    setSaved(false)
  }

  const handleSave = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const FIELDS = [
    { label: 'Company Name', key: 'companyName' },
    { label: 'Mobile Number', key: 'phone' },
    { label: 'Email', key: 'email' },
    { label: 'GST Number', key: 'gst' },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-500 text-sm">Update company information</p>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
        <h2 className="font-bold text-slate-700">Company Info</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {FIELDS.map(f => (
            <div key={f.key}>
              <label className="block text-xs font-semibold text-slate-500 mb-1">{f.label}</label>
              <input
                value={settings[f.key as keyof typeof settings]}
                onChange={e => update(f.key, e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Save Changes
          </button>
          {saved && (
            <span className="text-green-600 text-sm font-medium">✓ Saved successfully</span>
          )}
        </div>
      </div>
    </div>
  )
}
