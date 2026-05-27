'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated, getRole } from '@/lib/auth'

export default function Home() {
  const router = useRouter()
  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/login'); return }
    router.replace(getRole() === 'admin' ? '/dashboard' : '/customer-dashboard')
  }, [router])
  return null
}
