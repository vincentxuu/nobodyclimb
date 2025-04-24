'use client';

import { UserCircle, FileText, Bookmark, Settings } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useCallback } from 'react';

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { size?: number | string }>;
}

const menuItems: MenuItem[] = [
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

const ProfileSidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  
  // 優化點擊處理函數
  const handleNavigate = useCallback((href: string) => {
    if (pathname !== href) {
      router.push(href, { scroll: false });
    }
  }, [pathname, router]);

  // 桌面版返回完整側邊欄
  return (
    <motion.div 
      className="w-64 bg-white flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* User Card */}
      <div className="flex flex-col items-center p-6">
        <div className="w-24 h-24 bg-[#F5F5F5] rounded-full flex items-center justify-center mb-4">
          <UserCircle className="w-20 h-20 text-[#3F3D3D]" />
        </div>
        <h2 className="text-[16px] font-medium text-[#1B1A1A] mb-1">許岩手</h2>
        <p className="text-[14px] text-[#8E8C8C] font-light">nobodyclimb@gmail.com</p>
      </div>

      <hr className="border-[#DBD8D8]" />

      {/* Navigation Menu */}
      <div className="p-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <div
              key={item.href}
              onClick={() => handleNavigate(item.href)}
              className={`flex items-center gap-3 px-5 py-3 rounded-[4px] transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#F5F5F5] text-[#3F3D3D]'
                  : 'text-[#6D6C6C] hover:bg-gray-50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[16px] font-medium tracking-[0.02em]">
                {item.name}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ProfileSidebar;