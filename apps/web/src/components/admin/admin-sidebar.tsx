'use client'

import {
  ArrowLeft,
  BarChart3,
  Bell,
  Bot,
  Building2,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  LayoutDashboard,
  type LucideIcon,
  Megaphone,
  Menu,
  Mountain,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, usePathname } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

// =============================================
// 導航定義
// =============================================

interface NavItem {
  href: string
  label: string
  /** 巢狀子項目不顯示 icon，可省略 */
  icon?: LucideIcon
  /** true = pathname 需完全相等才算 active（避免 /admin 永遠亮） */
  exact?: boolean
}

interface NavGroup {
  id: string
  label: string
  icon: LucideIcon
  /** group 根路徑，pathname 在此之下時 group 自動展開 */
  base: string
  children: NavItem[]
}

const MAIN_ITEMS: NavItem[] = [
  { href: '/admin', label: '總覽', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: '用戶管理', icon: Users },
  { href: '/admin/crags', label: '岩場管理', icon: Mountain },
  { href: '/admin/gyms', label: '岩館管理', icon: Building2 },
  { href: '/admin/broadcast', label: '廣播通知', icon: Megaphone },
  { href: '/admin/analytics', label: '數據分析', icon: BarChart3 },
  { href: '/admin/logs', label: '訪問日誌', icon: FileText },
  { href: '/admin/notifications', label: '通知監控', icon: Bell },
]

const AI_GROUP: NavGroup = {
  id: 'ai',
  label: 'AI 助理',
  icon: Bot,
  base: '/admin/ai',
  children: [
    { href: '/admin/ai', label: '儀表板', exact: true },
    { href: '/admin/ai/settings', label: '設定' },
    { href: '/admin/ai/logs', label: '查詢日誌' },
    { href: '/admin/ai/react-agent', label: 'React Agent' },
    { href: '/admin/ai/prompts', label: '模板設定' },
    { href: '/admin/ai/knowledge', label: '知識庫' },
    { href: '/admin/ai/metrics', label: '趨勢分析' },
    { href: '/admin/ai/costs', label: '費用估算' },
  ],
}

const COLLAPSED_STORAGE_KEY = 'nc-admin-sidebar-collapsed'

function isItemActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

// =============================================
// 單一導航列
// =============================================

interface NavLinkProps {
  item: NavItem
  active: boolean
  collapsed: boolean
  nested?: boolean
}

function NavLink({ item, active, collapsed, nested }: NavLinkProps) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex items-center gap-3 rounded-lg text-sm transition-colors',
        'text-wb-70 hover:bg-wb-10 hover:text-wb-100',
        active && 'bg-wb-10 font-medium text-wb-100',
        collapsed ? 'justify-center px-0 py-2.5' : nested ? 'py-2 pl-10 pr-3' : 'px-3 py-2.5'
      )}
    >
      {/* active 狀態：左側 accent bar */}
      {active && (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-wb-100"
        />
      )}
      {Icon && (!nested || collapsed) && <Icon className="h-4 w-4 shrink-0" />}
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  )
}

// =============================================
// Sidebar 本體（桌面 + 手機 overlay 共用）
// =============================================

interface SidebarContentProps {
  pathname: string
  collapsed: boolean
  onToggleCollapse?: () => void
  onClose?: () => void
}

function SidebarContent({ pathname, collapsed, onToggleCollapse, onClose }: SidebarContentProps) {
  const inAiGroup = pathname === AI_GROUP.base || pathname.startsWith(`${AI_GROUP.base}/`)
  const [aiOpen, setAiOpen] = useState(inAiGroup)

  // 進入 AI 子頁面時自動展開 group
  useEffect(() => {
    if (inAiGroup) setAiOpen(true)
  }, [inAiGroup])

  const GroupIcon = AI_GROUP.icon
  const showAiChildren = collapsed ? false : aiOpen

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div
        className={cn(
          'flex h-14 shrink-0 items-center border-b border-wb-20',
          collapsed ? 'justify-center px-2' : 'justify-between px-4'
        )}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-wb-100 font-display text-xs font-bold text-white">
            NC
          </span>
          {!collapsed && <span className="truncate font-semibold text-wb-100">管理後台</span>}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-wb-70 hover:bg-wb-10 hover:text-wb-100 lg:hidden"
            aria-label="關閉選單"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className={cn('flex-1 space-y-0.5 overflow-y-auto py-3', collapsed ? 'px-2' : 'px-3')}>
        {MAIN_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isItemActive(pathname, item)}
            collapsed={collapsed}
          />
        ))}

        <div className="my-2 border-t border-wb-20" />

        {/* AI 助理 collapsible group */}
        {collapsed ? (
          <NavLink
            item={{ href: AI_GROUP.base, label: AI_GROUP.label, icon: GroupIcon }}
            active={inAiGroup}
            collapsed
          />
        ) : (
          <button
            type="button"
            onClick={() => setAiOpen((v) => !v)}
            aria-expanded={aiOpen}
            className={cn(
              'relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
              'text-wb-70 hover:bg-wb-10 hover:text-wb-100',
              inAiGroup && 'font-medium text-wb-100'
            )}
          >
            {inAiGroup && !aiOpen && (
              <span
                aria-hidden
                className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-wb-100"
              />
            )}
            <GroupIcon className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate text-left">{AI_GROUP.label}</span>
            <ChevronDown
              className={cn('h-4 w-4 shrink-0 transition-transform', aiOpen && 'rotate-180')}
            />
          </button>
        )}
        {showAiChildren && (
          <div className="space-y-0.5">
            {AI_GROUP.children.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isItemActive(pathname, item)}
                collapsed={false}
                nested
              />
            ))}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className={cn('shrink-0 border-t border-wb-20 py-3', collapsed ? 'px-2' : 'px-3')}>
        <Link
          href="/"
          title={collapsed ? '返回網站' : undefined}
          className={cn(
            'flex items-center gap-3 rounded-lg text-sm text-wb-70 transition-colors hover:bg-wb-10 hover:text-wb-100',
            collapsed ? 'justify-center py-2.5' : 'px-3 py-2.5'
          )}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          {!collapsed && <span>返回網站</span>}
        </Link>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cn(
              'mt-0.5 hidden w-full items-center gap-3 rounded-lg text-sm text-wb-50 transition-colors hover:bg-wb-10 hover:text-wb-100 lg:flex',
              collapsed ? 'justify-center py-2.5' : 'px-3 py-2.5'
            )}
            aria-label={collapsed ? '展開側邊欄' : '收合側邊欄'}
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4 shrink-0" />
            ) : (
              <>
                <ChevronsLeft className="h-4 w-4 shrink-0" />
                <span>收合側邊欄</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// =============================================
// 對外元件：桌面固定 sidebar + 手機 top bar / overlay
// =============================================

interface AdminSidebarProps {
  children: React.ReactNode
}

export function AdminSidebar({ children }: AdminSidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // 從 localStorage 還原收合狀態（只在 client 端）
  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSED_STORAGE_KEY) === '1')
    } catch {
      /* localStorage 不可用時維持預設 */
    }
  }, [])

  const toggleCollapse = () => {
    setCollapsed((v) => {
      const next = !v
      try {
        window.localStorage.setItem(COLLAPSED_STORAGE_KEY, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }

  // 路由變化時關閉手機 overlay
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // 手機 overlay 開啟時鎖住 body 捲動
  useEffect(() => {
    if (!mobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileOpen])

  return (
    <div className="flex min-h-screen bg-wb-10">
      {/* 桌面版 sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden border-r border-wb-20 transition-[width] duration-200 lg:block',
          collapsed ? 'w-[60px]' : 'w-60'
        )}
      >
        <SidebarContent
          pathname={pathname}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
        />
      </aside>

      {/* 手機版 overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="關閉選單"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <aside className="absolute inset-y-0 left-0 w-60 shadow-xl">
            <SidebarContent
              pathname={pathname}
              collapsed={false}
              onClose={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* 內容區 */}
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col transition-[padding] duration-200',
          collapsed ? 'lg:pl-[60px]' : 'lg:pl-60'
        )}
      >
        {/* 手機版 top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-wb-20 bg-white px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-1.5 text-wb-70 hover:bg-wb-10 hover:text-wb-100"
            aria-label="開啟選單"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-semibold text-wb-100">管理後台</span>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
