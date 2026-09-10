'use client'

import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { useRouter } from '@/i18n/navigation'
import { authService } from '@/lib/api/services'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await authService.getCurrentUser()
        if (response.success && response.data) {
          const user = response.data as { role?: string }
          setIsAdmin(user.role === 'admin')
        } else {
          setIsAdmin(false)
        }
      } catch {
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdmin()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-wb-10 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-wb-50" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-wb-10 flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-2xl font-bold text-wb-100 mb-2">存取被拒絕</h1>
          <p className="text-wb-70 mb-4">您沒有權限存取此頁面</p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-wb-100 text-white rounded-lg hover:bg-wb-90 transition-colors"
          >
            返回首頁
          </button>
        </div>
      </div>
    )
  }

  return <AdminSidebar>{children}</AdminSidebar>
}
