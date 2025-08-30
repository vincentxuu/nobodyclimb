import { NextRequest } from 'next/server'
import videosData from '../../../lib/constants/videos.json'

// 直接使用 Workers fetch handler 模式
export async function GET(_request: NextRequest) {
  try {
    // 直接使用導入的靜態數據
    console.log('Using imported videos data, length:', videosData.length)
    return new Response(JSON.stringify(videosData), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error in videos API:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to load videos', 
      details: error instanceof Error ? error.message : String(error) 
    }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' }
    })
  }
}