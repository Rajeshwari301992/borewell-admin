'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { login, isAuthenticated, getRole, type UserRole } from '@/lib/auth'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole] = useState<UserRole>('customer')

  // Customer OTP flow
  const [email, setEmail] = useState('')
  const [otpStep, setOtpStep] = useState(false)       // false = email entry, true = otp entry
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpSent, setOtpSent] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [successMsg, setSuccessMsg] = useState('')
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // Admin login
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    localStorage.removeItem('borewell_admin_session')
    if (isAuthenticated()) {
      router.replace(getRole() === 'admin' ? '/dashboard' : '/customer-dashboard')
    }
  }, [router])

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return
    const t = setTimeout(() => setResendTimer(v => v - 1), 1000)
    return () => clearTimeout(t)
  }, [resendTimer])

  const sendOtpRequest = async (emailAddr: string) => {
    setLoading(true)
    setError('')
    setSuccessMsg('')
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailAddr }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to send OTP.'); return false }
      setSuccessMsg(data.message || 'OTP sent to your email.')
      return true
    } catch {
      setError('Network error. Please try again.')
      return false
    } finally {
      setLoading(false)
    }
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const trimmed = email.trim().toLowerCase()
    if (!trimmed.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) { setError('Enter a valid email address'); return }
    const ok = await sendOtpRequest(trimmed)
    if (ok) {
      setOtp(['', '', '', '', '', ''])
      setOtpSent(true)
      setOtpStep(true)
      setResendTimer(30)
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    }
  }

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return
    const next = [...otp]
    next[i] = val.slice(-1)
    setOtp(next)
    setError('')
    if (val && i < 5) otpRefs.current[i + 1]?.focus()
  }

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus()
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      setOtp(text.split(''))
      otpRefs.current[5]?.focus()
    }
    e.preventDefault()
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const entered = otp.join('')
    if (entered.length < 6) { setError('Enter the complete 6-digit OTP'); return }
    setError('')
    setSuccessMsg('')
    setLoading(true)
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: entered }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Invalid OTP.')
        setOtp(['', '', '', '', '', ''])
        otpRefs.current[0]?.focus()
        setLoading(false)
        return
      }
      setSuccessMsg('Email verified successfully!')
      await new Promise(r => setTimeout(r, 600))
      const loggedIn = login(email, '', 'customer', false)
      if (loggedIn) router.push('/customer-dashboard')
      else setError('Login failed. Please try again.')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendTimer > 0) return
    const ok = await sendOtpRequest(email.trim().toLowerCase())
    if (ok) {
      setOtp(['', '', '', '', '', ''])
      setResendTimer(30)
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    }
  }

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) { setError('Please enter your username'); return }
    if (!password) { setError('Please enter your password'); return }
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 700))
    const ok = login(username, password, 'admin', rememberMe)
    setLoading(false)
    if (ok) router.push('/dashboard')
    else setError('Invalid credentials. Please try again.')
  }

  const switchRole = (r: UserRole) => {
    setRole(r)
    setError('')
    setEmail('')
    setOtpStep(false)
    setOtp(['', '', '', '', '', ''])
    setOtpSent(false)
    setUsername('')
    setPassword('')
  }

  const tabBase = 'flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer'
  const tabActive = 'bg-white text-slate-900 shadow-sm'
  const tabInactive = 'text-white/60 hover:text-white/90'

  return (
    <div className="min-h-screen flex bg-slate-950 overflow-hidden">
      <style>{`
        @keyframes floatUp { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
        @keyframes spinSlow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulseDot { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.25)} }
        @keyframes drillDown { 0%,100%{transform:translateY(0)} 60%{transform:translateY(12px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .float-rig { animation: floatUp 4s ease-in-out infinite; }
        .drill-pipe { animation: drillDown 2.2s ease-in-out infinite; }
        .spin-slow { animation: spinSlow 8s linear infinite; }
        .pulse-dot { animation: pulseDot 1.5s ease-in-out infinite; }
        .fade-up { animation: fadeUp 0.5s ease forwards; }
      `}</style>

      {/* ── Left Panel — hidden on mobile ── */}
      <div className="hidden lg:flex lg:w-[58%] relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: 'linear-gradient(145deg,#0a0f1e 0%,#0d1b3e 50%,#0a1628 100%)' }}>
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute top-20 right-20 w-72 h-72 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle,#3b82f6,transparent)' }} />
        <div className="absolute bottom-20 left-10 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle,#f59e0b,transparent)' }} />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg text-2xl"
              style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>⛏️</div>
            <div>
              <div className="text-white font-black text-xl tracking-wide">S K Borewells</div>
              <div className="text-blue-400 text-xs font-medium tracking-widest uppercase">Professional Drilling Services</div>
            </div>
          </div>
        </div>

        {/* Rig SVG */}
        <div className="relative z-10 flex-1 flex items-center justify-center float-rig">
          <svg viewBox="0 0 420 460" className="w-full max-w-xs drop-shadow-2xl" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="lg-mast" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#475569"/><stop offset="50%" stopColor="#94a3b8"/><stop offset="100%" stopColor="#475569"/>
              </linearGradient>
              <linearGradient id="lg-truck" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24"/><stop offset="100%" stopColor="#d97706"/>
              </linearGradient>
            </defs>
            <rect x="0" y="380" width="420" height="80" fill="#1e2d1a"/>
            <line x1="0" y1="382" x2="420" y2="380" stroke="#2d4020" strokeWidth="2"/>
            <rect x="60" y="310" width="280" height="16" rx="3" fill="#374151"/>
            <rect x="80" y="262" width="180" height="55" rx="4" fill="#d97706"/>
            {[100,140,180,210].map(x => <rect key={x} x={x} y="268" width="34" height="43" rx="3" fill="#b45309"/>)}
            <rect x="268" y="248" width="110" height="78" rx="7" fill="url(#lg-truck)"/>
            <rect x="272" y="254" width="58" height="38" rx="4" fill="#1e3a8a" opacity="0.9"/>
            <line x1="275" y1="256" x2="290" y2="290" stroke="#93c5fd" strokeWidth="2" opacity="0.5"/>
            <rect x="330" y="256" width="40" height="58" rx="4" fill="#e08a0a"/>
            <rect x="264" y="240" width="106" height="14" rx="5" fill="#f59e0b"/>
            <rect x="330" y="218" width="7" height="26" rx="3" fill="#374151"/>
            <line x1="178" y1="52" x2="158" y2="320" stroke="url(#lg-mast)" strokeWidth="9" strokeLinecap="round"/>
            <line x1="210" y1="52" x2="230" y2="320" stroke="url(#lg-mast)" strokeWidth="9" strokeLinecap="round"/>
            {[90,130,170,210,250,290].map((y,i) => (
              <g key={y}>
                <line x1={160+i*0.8} y1={y} x2={208-i*0.8} y2={y+40} stroke="#64748b" strokeWidth="3"/>
                <line x1={208-i*0.8} y1={y} x2={160+i*0.8} y2={y+40} stroke="#64748b" strokeWidth="3"/>
              </g>
            ))}
            {[75,115,155,195,235,275,315].map(y => (
              <line key={y} x1="162" y1={y} x2="218" y2={y} stroke="#475569" strokeWidth="2.5"/>
            ))}
            <rect x="168" y="42" width="50" height="14" rx="3" fill="#94a3b8"/>
            <rect x="178" y="32" width="30" height="14" rx="3" fill="#64748b"/>
            <circle cx="184" cy="39" r="6" fill="#374151" stroke="#94a3b8" strokeWidth="2"/>
            <circle cx="202" cy="39" r="6" fill="#374151" stroke="#94a3b8" strokeWidth="2"/>
            <g className="drill-pipe">
              <line x1="194" y1="200" x2="194" y2="380" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round"/>
              <line x1="190" y1="200" x2="190" y2="380" stroke="#94a3b8" strokeWidth="2" opacity="0.6"/>
              <line x1="198" y1="200" x2="198" y2="380" stroke="#cbd5e1" strokeWidth="2" opacity="0.6"/>
              {[230,268,306,344].map(y => <rect key={y} x="188" y={y} width="12" height="7" rx="2" fill="#64748b"/>)}
            </g>
            <polygon points="190,375 198,375 196,392 192,392" fill="#374151"/>
            <polygon points="192,390 196,390 198,402 190,402" fill="#1e293b"/>
            {[[186,375,0],[200,372,0.2],[184,379,0.4],[204,377,0.6]].map(([cx,cy,delay],i) => (
              <circle key={i} cx={cx} cy={cy} r={3+i*0.5} fill="#d97706" opacity="0" className="pulse-dot"
                style={{ animationDelay: `${delay}s` }}/>
            ))}
            {[[104,358],[152,358],[288,354],[330,354]].map(([cx,cy],i) => (
              <g key={i}>
                <circle cx={cx} cy={cy} r="32" fill="#111827"/>
                <circle cx={cx} cy={cy} r="26" fill="#1f2937"/>
                <circle cx={cx} cy={cy} r="32" fill="none" stroke="#374151" strokeWidth="4"
                  strokeDasharray="7 7" className="spin-slow" style={{ animationDelay:`${i*0.1}s` }}/>
                <circle cx={cx} cy={cy} r="18" fill="#374151" stroke="#6b7280" strokeWidth="2.5"/>
                <circle cx={cx} cy={cy} r="8" fill="#4b5563" stroke="#9ca3af" strokeWidth="2"/>
                <circle cx={cx} cy={cy} r="3" fill="#9ca3af"/>
              </g>
            ))}
          </svg>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[['5,000+','Borewells Drilled'],['15+','Years Experience'],['98%','Success Rate']].map(([v,l]) => (
            <div key={l} className="text-center p-4 rounded-2xl"
              style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }}>
              <div className="text-2xl font-black" style={{ color:'#fbbf24' }}>{v}</div>
              <div className="text-xs text-slate-400 mt-1">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel (form) ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative"
        style={{ background: 'linear-gradient(160deg,#0f172a 0%,#1e293b 100%)' }}>

        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>⛏️</div>
          <div>
            <div className="text-white font-black text-lg">S K Borewells</div>
            <div className="text-blue-400 text-xs">Drilling Services</div>
          </div>
        </div>

        <div className="w-full max-w-md fade-up">
          <div className="rounded-3xl overflow-hidden shadow-2xl"
            style={{ background:'rgba(255,255,255,0.06)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.12)' }}>

            <div className="px-8 pt-8 pb-6">
              <h2 className="text-2xl font-black text-white mb-1">Welcome Back</h2>
              <p className="text-slate-400 text-sm">Sign in to your S K Borewells account</p>
            </div>

            {/* Role Tabs */}
            <div className="px-8 mb-6">
              <div className="flex gap-1 p-1 rounded-xl" style={{ background:'rgba(0,0,0,0.3)' }}>
                <button type="button" onClick={() => switchRole('customer')}
                  className={`${tabBase} ${role === 'customer' ? tabActive : tabInactive}`}>
                  👤 Customer
                </button>
                <button type="button" onClick={() => switchRole('admin')}
                  className={`${tabBase} ${role === 'admin' ? tabActive : tabInactive}`}>
                  🛠️ Admin
                </button>
              </div>
            </div>

            {/* ── CUSTOMER FLOW ── */}
            {role === 'customer' && !otpStep && (
              <form onSubmit={handleSendOtp} className="px-8 pb-8 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">Email Address</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg select-none">✉️</span>
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError('') }}
                      placeholder="Enter your email address"
                      autoComplete="email"
                      className="w-full pl-12 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                      style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)' }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">We'll send an OTP to verify your email.</p>
                </div>
                {error && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-red-300"
                    style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)' }}>
                    ⚠️ {error}
                  </div>
                )}
                {successMsg && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-green-300"
                    style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)' }}>
                    ✅ {successMsg}
                  </div>
                )}
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 font-bold text-sm rounded-xl transition-all shadow-lg disabled:opacity-60"
                  style={{ background:'linear-gradient(135deg,#d97706,#b45309)', color:'#fff', boxShadow:'0 4px 20px rgba(217,119,6,0.4)' }}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                      Sending OTP...
                    </span>
                  ) : '✉️ Send OTP'}
                </button>
              </form>
            )}

            {/* ── OTP VERIFICATION STEP ── */}
            {role === 'customer' && otpStep && (
              <form onSubmit={handleVerifyOtp} className="px-8 pb-8 space-y-5">
                {/* Back + mobile display */}
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => { setOtpStep(false); setError('') }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition shrink-0"
                    style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)' }}>
                    ←
                  </button>
                  <div>
                    <div className="text-white text-sm font-semibold">OTP sent to {email}</div>
                    <div className="text-slate-500 text-xs">Enter the 6-digit code below</div>
                  </div>
                </div>


                {/* Success message */}
                {successMsg && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-green-300"
                    style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)' }}>
                    ✅ {successMsg}
                  </div>
                )}

                {/* OTP input boxes */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">Enter OTP</label>
                  <div className="flex gap-2 justify-between" onPaste={handleOtpPaste}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={el => { otpRefs.current[i] = el }}
                        type="tel"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpChange(i, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(i, e)}
                        className="w-11 h-12 text-center text-white text-xl font-black rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                        style={{
                          background: digit ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.08)',
                          border: digit ? '1.5px solid rgba(251,191,36,0.5)' : '1px solid rgba(255,255,255,0.12)',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Resend */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Didn&apos;t receive OTP?</span>
                  <button type="button" onClick={handleResendOtp} disabled={resendTimer > 0}
                    className="font-semibold transition"
                    style={{ color: resendTimer > 0 ? '#475569' : '#f59e0b' }}>
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                  </button>
                </div>

                {error && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-red-300"
                    style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)' }}>
                    ⚠️ {error}
                  </div>
                )}

                <button type="submit" disabled={loading || otp.join('').length < 6}
                  className="w-full py-3.5 font-bold text-sm rounded-xl transition-all shadow-lg disabled:opacity-60"
                  style={{ background:'linear-gradient(135deg,#d97706,#b45309)', color:'#fff', boxShadow:'0 4px 20px rgba(217,119,6,0.4)' }}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                      Verifying...
                    </span>
                  ) : '✅ Verify & Login'}
                </button>
              </form>
            )}

            {/* ── ADMIN FORM ── */}
            {role === 'admin' && (
              <form onSubmit={handleAdminSubmit} className="px-8 pb-8 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">Username</label>
                  <input type="text" value={username}
                    onChange={e => { setUsername(e.target.value); setError('') }}
                    placeholder="admin" autoComplete="username"
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">Password</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} value={password}
                      onChange={e => { setPassword(e.target.value); setError('') }}
                      placeholder="••••••••" autoComplete="current-password"
                      className="w-full px-4 py-3 pr-12 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)' }}
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition">
                      {showPass ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                      className="w-4 h-4 accent-blue-500 rounded"/>
                    <span className="text-sm text-slate-400">Remember me</span>
                  </label>
                  <button type="button" className="text-sm text-blue-400 hover:text-blue-300 transition"
                    onClick={() => alert('Please contact support: +91 83100 08194')}>
                    Forgot password?
                  </button>
                </div>
                {error && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-red-300"
                    style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)' }}>
                    ⚠️ {error}
                  </div>
                )}
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 font-bold text-sm rounded-xl transition-all shadow-lg disabled:opacity-60"
                  style={{ background:'linear-gradient(135deg,#1d4ed8,#1e40af)', color:'#fff', boxShadow:'0 4px 20px rgba(29,78,216,0.4)' }}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                      Authenticating...
                    </span>
                  ) : '🛠️ Login as Admin'}
                </button>
              </form>
            )}
          </div>

          <p className="text-center text-xs text-slate-600 mt-6">© 2025 S K Borewells · Secure Login</p>
        </div>
      </div>
    </div>
  )
}
