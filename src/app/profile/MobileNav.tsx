'use client';

import React, { useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserCircle, FileText, Bookmark, Settings } from 'lucide-react';

const menuItems = [
  {
    name: '我的人物誌',
    href: '/profile',
    icon: UserCircle,
  },
  {
    name: '我的文章',
    href: '/profile/articles',
    icon: FileText,
  },
  {
    name: '收藏文章',
    href: '/profile/bookmarks',
    icon: Bookmark,
  },
  {
    name: '帳號設定',
    href: '/profile/settings',
    icon: Settings,
  },
];

export default function MobileNav() {
  const router = useRouter();
  const pathname = usePathname();
  
  // 優化點擊處理函數
  const handleNavigate = useCallback((href: string) => {
    if (pathname !== href) {
      router.push(href, { scroll: false });
    }
  }, [pathname, router]);

  return (
    <nav className="bg-white shadow-md w-full">
      <div className="flex items-center justify-between px-4 py-3 w-full">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <div
              key={item.href}
              onClick={() => handleNavigate(item.href)}
              className={`flex flex-col items-center text-xs cursor-pointer ${
                isActive ? 'text-[#1B1A1A]' : 'text-[#6F6E77]'
              }`}
            >
              <item.icon size={20} className="mb-1" />
              <span>{item.name}</span>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
