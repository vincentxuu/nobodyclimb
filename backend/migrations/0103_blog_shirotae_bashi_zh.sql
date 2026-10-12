-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/765b73392af400eacd36fec66a9b0513.md
-- source-sha256: 63efbc7ecb2c4ca63b8c7a492249f0114524d5138ed78e19cb59f7b53e1e6a26
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '765b73392af400eacd36fec66a9b0513' OR slug = 'shirotae-bashi-climbing-guide') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('765b73392af400eacd36fec66a9b0513', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'shirotae-bashi-climbing-guide', '白妙橋攀岩指南：奧多摩石灰岩與必須先釐清的利用狀態', '白妙橋石灰岩與交通背景；利用自粛解除尚未確認，先取得現況再決定是否排入攀登日。', '<h2>先把利用狀態查清楚，再排攀登日</h2>
<p>白妙橋位於東京都奧多摩，是以石灰岩繩索路線聞名的場地。它可以進入東京旅行的研究名單，但本文不把它當作已確認可使用的出遊推薦。對有戶外先鋒經驗、想比較5.11與5.12路線的搭檔，這篇提供岩壁與交通背景，也說明為何許可確認應早於買票與選線。</p>
<p><a href="https://www.climbing-net.com/iwaba_detail/%E7%99%BD%E5%A6%99%E6%A9%8B/">CLIMBING-net的岩場頁</a>仍記錄JFA自2007年4月起呼籲利用自粛，理由包括垃圾、器材殘置、焚火與停車問題。頁面要求確認現況。這份舊資料不能證明自粛仍以原範圍生效，也不能因年代久遠就推定已取消。</p>
<h2>石灰岩難度選擇集中在中高級</h2>
<p>出版社描述近垂直到明顯仰角的石灰岩，並強調5.11與5.12範圍的路線。<a href="https://www.rocktopo.net/areas/110">ROCKTOPO的岩區索引</a>列出正面壁、バルコニー・フェイス、カワラ・フェイス、ディンプル・フェイス與アイビー・フェイス等區域，能用來理解分區，而不是證明開放。</p>
<p>對行程規劃而言，先知道難度重心就能判斷是否值得進一步研究。若隊伍主要想找大量5.9以下路線，它未必符合目的；若目標是中高級石灰岩，則先取得對應牆面的完整路線圖。不要把分區索引中的路線數當成管理單位當日允許攀登的清單。</p>
<h2>交通背景：奧多摩站接日原方向巴士</h2>
<p>出版社記錄奧多摩站搭日原方向巴士至白妙橋，過吊橋即可接近正面壁。這只提供交通骨架，並不表示吊橋或岩場入口在造訪日可以使用。必須先釐清利用條件，再查當日去回程巴士與步行安排；本文不給新宿出發的固定總時間。</p>
<p>開車的舊介紹提及トラウトカントリー受付與停車，且禁止岩場周邊路邊停車，尤其巴士停留所前空間。這些要求值得保留，但不能把頁面上的舊停車費改寫成現在報價。更不能因停車設施願意收費，就推導別處岩壁已獲攀登許可。</p>
<h2>沒有解除證據，就先保留替代場地</h2>
<p>目前未確認白妙橋利用自粛是否解除，也未確認實際造訪日的攀登與通行許可。安排前應向能回答現況的管理或地方攀登窗口確認；若找不到明確資訊，先選其他利用條件清楚的場地，不把白妙橋排成不能替換的唯一戶外日。</p>
<p>資料庫近期有紀錄，只能說有人上傳資訊，不能證明地主同意。出版社頁面也提醒周邊居民關係與自然保護，不留快扣與其他器材、不焚火、帶回垃圾。即使之後確認可以利用，這些仍是與環境共處的基本規劃。</p>
<h2>把查核結果轉成一個明確決定</h2>
<p>行前清單應分成三個問題：哪一區允許進入、哪條路徑可通行、在哪裡完成停車與如廁。每一項都要能得到具體答案，才往路線與裝備安排走。這樣讀白妙橋，仍能認識其岩壁特色，同時避免用一篇旅行指南掩蓋尚未解決的利用條件。</p>
<h2>參考資料</h2>
<ul>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E7%99%BD%E5%A6%99%E6%A9%8B/">山と溪谷社 CLIMBING-net — 白妙橋</a></li>
<li><a href="https://www.rocktopo.net/areas/110">ROCKTOPO — 白妙橋</a></li>
</ul>
<h2>其他語言</h2>
<p><a href="/blog/765b73392af400eacd36fec66a9b0513">繁體中文</a> · <a href="/en/blog/584437e6e66e29a1702a4779de0a9c7e">English</a> · <a href="/ja/blog/5c1f7dd326e222ca8162fcde107f3559">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('765b73392af400eacd36fec66a9b0513', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('765b73392af400eacd36fec66a9b0513', '岩場指南');
DROP TABLE _blog_article_guard;
