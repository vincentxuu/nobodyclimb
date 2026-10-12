-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/843cf5663149a378e12125ac8ae990dc.md
-- source-sha256: 8afe4787125915ea06a5c2ee739b2322f902f7964de08b7575b5a94690ffcf44
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '843cf5663149a378e12125ac8ae990dc' OR slug = 'tengu-iwa-climbing-guide') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('843cf5663149a378e12125ac8ae990dc', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'tengu-iwa-climbing-guide', '天狗岩攀岩指南：檜原瀑布側壁的路線與接近判斷', '本文介紹與つづら岩合列的檜原天狗岩，整理瀑布側壁特色、千足接近線索與資料缺口，不與天王岩混淆。', '<h2>先確定你找的是哪個天狗岩</h2>
<p>本文的天狗岩，是<a href="https://www.climbing-net.com/iwaba_detail/%E3%81%A4%E3%81%A5%E3%82%89%E5%B2%A9%E3%80%81%E5%A4%A9%E7%8B%97%E5%B2%A9/">CLIMBING-net</a>與つづら岩共同介紹的檜原一帶岩場，位在瀑布側壁。選題目的在於幫東京旅人辨認這個具體場地，不能只拿「天狗岩」三字在地圖上搜尋後就跟著最近的結果走。</p>
<p>它與尾根上的つづら岩有不同接近尺度，應分開決定是否前往。若同行者傳來一張沒有區域、沒有 topo 的照片，先問清楚地點，再談適合的裝備和難度。本指南也不把名稱相近的天王岩視為此處的替代名稱或導航點。</p>
<h2>比較短的接近仍需要完整計畫</h2>
<p>出版者描述天狗岩的接近約 30 分鐘，並提供武藏五日市搭巴士到千足的起點線索。相較同頁つづら岩約一個半小時的接近，這個步行成本不同，但不是從東京市區出發只需半小時，也不是可以保證人人用同樣速度到達。</p>
<p>安排公共交通時，先核對旅行當日去回班次，再確認從千足往目標岩壁的路線。把下車站、起攀點與瀑布景點分開標在地圖上，避免走到觀景處後才發現不是自己的線。雨後若接近不合適，縮短行程也應是事先約定的選項。</p>
<h2>岩場介紹有什麼，沒有什麼</h2>
<p>CLIMBING-net 提到瀑布側壁的天狗岩曾開拓自由攀登新線，但文章中的「近年」沒有明確日期，不能當成最近換線或整修的證據。<a href="https://www.rocktopo.net/areas/101">ROCKTOPO 的共同區域頁</a>可確認條目，但本次取得的頁面沒有提供可完整規劃天狗岩逐線攀登的資料。</p>
<p>本指南未核實天狗岩各線的現行級數、長度、固定點與下降方式，不提供按級數選線的推薦清單。若已找到近期 topo，應再核對它是否確實涵蓋這面瀑布側壁，而不是隻畫了つづら岩；向熟悉者詢問路線與現況，再決定是否適合自己的繩隊。</p>
<p>同頁有舊 piton 孔口與 sling 的提醒，但資料沒有逐線對應天狗岩所有線。不要把共同條目的警告翻成「每條都必須某種操作」，也不要因未逐線標明就忽略支點判斷。裝備應由目標線和現況決定，而不是從大範圍標籤推測。</p>
<h2>哪些人可以把它保留在候選名單</h2>
<p>如果你已有戶外繩攀能力，也願意補足具體 topo、接近與下降資訊，天狗岩可以作為檜原攀登日的研究候選。若只有網頁名稱與粗略接近時間，資料還不足以把它排成必爬的一站。這不是人氣高低的評分，而是準備是否足夠的問題。</p>
<p>出發前將岩場名稱、地圖、目標線與回程一起交給同行者，備好水、行動糧、雨具與照明。現場若無法確認地點、保護或退路，就不進入攀登。先完成辨認與準備，才能讓這面瀑布旁的岩壁成為有目的的行程，而不是與別座同名岩場的誤會。</p>
<h2>參考資料</h2>
<ul>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E3%81%A4%E3%81%A5%E3%82%89%E5%B2%A9%E3%80%81%E5%A4%A9%E7%8B%97%E5%B2%A9/">つづら岩、天狗岩</a></li>
<li><a href="https://www.rocktopo.net/areas/101">つづら岩、天狗岩 | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
</ul>
<p><a href="/blog/843cf5663149a378e12125ac8ae990dc">繁體中文</a> · <a href="/en/blog/7eef70c42822bcb8025353d418e8f4e0">English</a> · <a href="/ja/blog/9ae4f485fe4c3c2d7d7a866d9b511286">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('843cf5663149a378e12125ac8ae990dc', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('843cf5663149a378e12125ac8ae990dc', '岩場指南');
DROP TABLE _blog_article_guard;
