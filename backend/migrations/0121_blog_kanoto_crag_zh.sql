-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/c9291664b2c87caf58701928ae1d1cc8.md
-- source-sha256: d6bcab0414370f1d7188ef3bb07a8a61e49a329a50455aa7705e824c9959e9ba
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = 'c9291664b2c87caf58701928ae1d1cc8' OR slug = 'kanoto-crag-climbing-guide') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('c9291664b2c87caf58701928ae1d1cc8', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'kanoto-crag-climbing-guide', '神戸の岩場攀岩指南：別把石灰岩場走成神戸岩景點', '檜原的神戸の岩場是小型石灰岩攀登區，與禁攀的神戸岩不同。整理巴士接近、居民通行與路線選擇的準備。', '<h2>岩場名稱是這一天最重要的導航資訊</h2>
<p>神戸の岩場（Kanoto no Iwaba）是東京檜原一帶的小型石灰岩攀登區。它適合已有外岩繩攀經驗、想安排明確路線目標的人；但第一項準備不是挑級數，而是分清楚「神戸の岩場」與觀光地點「神戸岩」。</p>
<p><a href="https://www.climbing-net.com/iwaba_detail/%E7%A5%9E%E6%88%B8%E3%81%AE%E5%B2%A9%E5%A0%B4/">CLIMBING-net 的介紹</a>明確指出兩者不同，並說神戸岩禁止攀登。開車時看到神戸岩指標，不能據此直接跟到峽谷，把觀光岩壁當成自己的攀登區。與同伴分享位置時，應同時傳送岩場 topo 和接近說明，而不是隻傳同名景點的地圖。</p>
<h2>從巴士站到岩壁，會經過生活空間</h2>
<p>出版者提供武藏五日市搭往藤倉或小岩的巴士、在神戸岩入口下車的接近線索；往春日神社、小紅橋與住宅旁小溪的路線，與一路走向觀光地點不同。這是資料中的接近描述，出發前仍須核對當天巴士、踏跡與居民通行安排。</p>
<p>來源提醒接近會經住宅院旁，應打招呼、安靜通行；春日神社周邊沒有可停車的位置，路肩和公民館旁空地不可停車。若使用資料所述的付費釣場停車，須先向釣場說明來攀登並依安排停放。本指南未核實目前停車接待、費用與接近通行條件，出發前需確認，不能把舊介紹當停車授權。</p>
<p>就旅行規劃而言，公共交通可避免到了入口才找車位，但必須先確認回程。把巴士時間、步行與攀登時間一起看，保留撤回車站的空間，而不是把所有時間留給最後一趟嘗試。</p>
<h2>小型岩場，也可能有長線</h2>
<p>介紹將此處描述為緊湊石灰岩，右側幾條線有超過 20 公尺的尺度。<a href="https://www.rocktopo.net/areas/103">ROCKTOPO 區域頁</a>可用於查詢已收錄的 face 路線。這表示「小型」不是所有線都短；不能帶一條平常在岩館用的繩，就預設能完成戶外下降。</p>
<p>先看目標線的實際長度、結束點、下降方式與器材需求，再整理裝備。路線數只幫助理解選擇範圍，不代表所有線現況都可爬，也不是一天爬完的清單。若旅行隊伍能力差異大，讓每人都有合適的可撤退目標，比只挑一條最高星等線更實際。</p>
<h2>保護岩場，也保護這條接近路</h2>
<p>不要在居民附近喧嘩、佔用停車或擋住出入口。這些動作不是另外附加的旅遊禮貌，而是攀登日能否順利開始的條件。來源也指出釣場停車處不可露營或車宿，當天攀登計畫與住宿安排應分開處理。</p>
<p>本指南未檢查岩場當日開放與固定點，請在出發前取得近期 topo、現況與接近訊息；遇到禁止告示或不能確認的通行安排，就不進入。神戸の岩場值得研究的特色是緊湊岩壁中的石灰岩長線，而這一切的前提，是走到正確場地並尊重其周邊的生活空間。</p>
<h2>參考資料</h2>
<ul>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E7%A5%9E%E6%88%B8%E3%81%AE%E5%B2%A9%E5%A0%B4/">神戸の岩場</a></li>
<li><a href="https://www.rocktopo.net/areas/103">神戸の岩場 | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
</ul>
<p><a href="/blog/c9291664b2c87caf58701928ae1d1cc8">繁體中文</a> · <a href="/en/blog/af5833584555468d1d9b8279473c03c6">English</a> · <a href="/ja/blog/b9b323658d9f5ff525d4e28d1e77a140">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('c9291664b2c87caf58701928ae1d1cc8', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('c9291664b2c87caf58701928ae1d1cc8', '岩場指南');
DROP TABLE _blog_article_guard;
