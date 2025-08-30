const fs = require('fs');
const path = require('path');

/**
 * 合併多個頻道的影片資料到統一的 videos.ts 檔案
 */
function mergeVideoSources() {
  // 自動掃描 src/lib/constants/ 目錄中所有 *_videos.ts 檔案
  const constantsDir = 'src/lib/constants';
  const sourceFiles = [];
  
  // 掃描目錄中的檔案
  if (fs.existsSync(constantsDir)) {
    const files = fs.readdirSync(constantsDir);
    for (const file of files) {
      // 匹配 *_videos.json 格式，但排除 videos.json（目標檔案）
      if (file.endsWith('_videos.json') && file !== 'videos.json') {
        sourceFiles.push(path.join(constantsDir, file));
      }
    }
  }
  
  console.log(`🔍 自動發現 ${sourceFiles.length} 個影片來源檔案:`, sourceFiles.map(f => path.basename(f)));

  const outputFile = 'public/data/videos.json';
  let allVideos = [];
  let idCounter = 1;

  console.log('🔄 開始合併影片來源...');

  // 讀取每個來源檔案
  for (const sourceFile of sourceFiles) {
    if (fs.existsSync(sourceFile)) {
      console.log(`📖 讀取 ${sourceFile}...`);

      try {
        // 直接讀取 JSON 檔案
        const content = fs.readFileSync(sourceFile, 'utf8');
        const videoData = JSON.parse(content);

        // 重新分配 ID 以避免衝突
        const processedVideos = videoData.map(video => ({
          ...video,
          id: (idCounter++).toString()
        }));

        allVideos.push(...processedVideos);
        console.log(`✅ 成功讀取 ${processedVideos.length} 部影片`);
      } catch (error) {
        console.error(`❌ 讀取 ${sourceFile} 時發生錯誤:`, error.message);
      }
    } else {
      console.log(`⏭️  跳過不存在的檔案: ${sourceFile}`);
    }
  }

  if (allVideos.length === 0) {
    console.error('❌ 沒有找到任何影片資料');
    return;
  }

  // 按觀看次數排序（精選影片在前）
  allVideos.sort((a, b) => {
    // 先按精選狀態排序
    if (a.featured !== b.featured) {
      return b.featured - a.featured;
    }

    // 再按觀看次數排序（將 K/M 轉換為數字進行比較）
    const parseViewCount = (viewCount) => {
      if (typeof viewCount === 'string') {
        if (viewCount.includes('M')) {
          return parseFloat(viewCount) * 1000000;
        }
        if (viewCount.includes('K')) {
          return parseFloat(viewCount) * 1000;
        }
        return parseInt(viewCount) || 0;
      }
      return viewCount || 0;
    };

    return parseViewCount(b.viewCount) - parseViewCount(a.viewCount);
  });

  // 生成統計資訊
  const channels = [...new Set(allVideos.map(v => v.channel))];
  const categories = [...new Set(allVideos.map(v => v.category))];
  const featuredCount = allVideos.filter(v => v.featured).length;

  // 直接寫入 JSON 格式
  fs.writeFileSync(outputFile, JSON.stringify(allVideos, null, 2));

  console.log('');
  console.log('🎉 影片來源合併完成！');
  console.log('');
  console.log('📊 統計資訊:');
  console.log(`   📹 總影片數: ${allVideos.length}`);
  console.log(`   📺 頻道數: ${channels.length} (${channels.join(', ')})`);
  console.log(`   📂 分類數: ${categories.length} (${categories.join(', ')})`);
  console.log(`   ⭐ 精選影片: ${featuredCount} 部`);
  console.log('');
  console.log(`📁 輸出檔案: ${outputFile}`);
  console.log('');
  console.log('💡 提示:');
  console.log('   - 影片已按精選狀態和觀看次數排序');
  console.log('   - ID 已重新分配以避免衝突');
  console.log('   - 可以在 sourceFiles 陣列中添加更多頻道');
}

// 如果直接執行此腳本
if (require.main === module) {
  try {
    mergeVideoSources();
  } catch (error) {
    console.error('❌ 合併失敗:', error.message);
    process.exit(1);
  }
}

module.exports = { mergeVideoSources };