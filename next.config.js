/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  images: {
    domains: [
      'cloudflare-ipfs.com',
      'r2.cloudflarestorage.com',
      'i.imgur.com',
      'nobodyclimb.cc',
    ],
    formats: ['image/avif', 'image/webp'],
    unoptimized: true, // 在 Cloudflare Workers 中禁用圖片優化
  },
  
  // 環境變量
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.nobodyclimb.com',
  },
}

module.exports = nextConfig
