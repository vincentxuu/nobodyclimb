'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ProfileSidebar from '@/components/ProfileSidebar';

interface ProfilePageLayoutProps {
  children: React.ReactNode;
}

export default function ProfilePageLayout({ children }: ProfilePageLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);

  // 檢測是否為手機版
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    
    window.addEventListener('resize', checkIfMobile);
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  return (
    <div className="container mx-auto px-4 md:px-6 max-w-screen-xl">
      <div className="flex flex-col md:flex-row md:space-x-6">
        {/* 側邊選單 - 在桌面版才顯示 */}
        <div className="hidden md:block w-64 flex-shrink-0 sticky top-6 self-start">
          <ProfileSidebar />
        </div>
        
        {/* 主要內容區域 */}
        <div className="flex-1 mt-16 md:mt-0">
          <motion.div 
            className="flex-1 w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
