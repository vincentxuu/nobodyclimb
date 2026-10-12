-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/55bc53c2ae00be9fa37bf43c61eb3ead.md
-- source-sha256: c4f5b328b921fead7ded5481958778a81db186e2f5e7147cdb9fa7011b392551
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '55bc53c2ae00be9fa37bf43c61eb3ead' OR slug = 'yugawara-makuiwa-climbing-guide') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('55bc53c2ae00be9fa37bf43c61eb3ead', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'yugawara-makuiwa-climbing-guide', '湯河原幕岩攀岩指南：日照岩壁、巴士接近與分區限制', '幕岩的日照與短路線、湯河原巴士接近，區分公園費用、分區禁入與攀登許可。', '<h2>想離開東京市區，找一個以岩壁為主的白天</h2>
<p>湯河原幕岩位於神奈川縣湯河原町的幕山公園一帶。若旅行中的戶外日想登天然岩壁、又希望以車站與巴士銜接，可以研究這個選項。本文幫已能自主繩索攀登的搭檔判斷季節、交通與分區限制；初次外岩者則可先與帶領者確認適合的區域與路線。</p>
<p><a href="https://www.yugawara.or.jp/sightseeing/893/">湯河原官方觀光頁</a>將它介紹為日照好、冬季受歡迎的攀登地，並提到短路線與熱門線排隊。<a href="https://www.climbing-net.com/iwaba_detail/%E5%B9%95%E5%B2%A9/">CLIMBING-net</a>列岩質為凝灰岩，較佳攀登季節涵蓋秋至春。這些特色有助比較行程，不等於晴天就能無限制進入所有牆面。</p>
<h2>選區比總路線數更重要</h2>
<p>幕岩不是單一岩壁。出版社區分正面壁、茅ヶ崎ロック與其他區域，指出部分上方接近路徑有危險，也提醒存在禁止進入範圍。旅行者應先決定哪一個岩區與哪幾條線，再查路線圖與進入要求；別以整區總本數推算自己能登多少條。</p>
<p>短路線也不能只看「好上手」。出版社特別提醒短而不陡的先鋒線，墜落時未必比長仰角線更寬容。把選線、確保位置、下降與回收安排一併確認；若只有岩館經驗，先安排戶外指導，不把熱門觀光頁上的「初心者」文字當成免除繩索能力的條件。</p>
<h2>湯河原站之後，查當日的幕山公園巴士</h2>
<p>官方觀光頁列JR湯河原站轉幕山公園行巴士，在終點下車，乘車參考約15分鐘。出版社舊頁另有到診療所前步行的描述，兩者不能拼成一張固定時刻表。依造訪日期查實際運行、去回站點與最後一班，再決定從東京的出發時間。</p>
<p>將回程截止時間留在手機與同行計畫裡，保留整理繩索、從岩區下到公園與候車的時間。開車者要按當期停車配置與現地指示使用，不把公園中的道路或觀光客車位當成全日攀登的自選區。</p>
<h2>梅季費用與禁入公告，要分開查</h2>
<p>官方頁面說「梅の宴」期間有入園與停車收費。對未來旅行，先確認當年度活動日期與費用，本文不將頁面上的舊金額視為保證。即使不在活動季，公園入園方式也不能替代某一岩區的攀登許可。</p>
<p>CLIMBING-net記錄テントウムシロック以西的禁入資訊，並要求查JFA現況。其頁面沒有足以確定公告有效期間的日期，不能把這一句擴大或縮小成現在的完整邊界。目前未確認幕岩各區在實際造訪日的開放範圍與活動季費用。行前讀最新管理資訊，到場看告示，有疑問就不往限制區移動。</p>
<h2>為熱門線留替代目標</h2>
<p>準備一條主要路線與同一允許區內的備選，會比跨區找空線更容易維持清楚的行程。若排隊，與其他隊伍溝通輪流，別為搶進度延後撤退時間。用公園指定設施處理如廁與補給，帶走垃圾，不在公園搭帳；出版社記錄幕山公園禁止露營。這一天可以是專心的岩壁日，也需要留出與公園其他使用者共處的空間。</p>
<h2>參考資料</h2>
<ul>
<li><a href="https://www.yugawara.or.jp/sightseeing/893/">湯河原温泉公式観光サイト — 湯河原幕岩</a></li>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E5%B9%95%E5%B2%A9/">山と溪谷社 CLIMBING-net — 湯河原幕岩</a></li>
</ul>
<h2>其他語言</h2>
<p><a href="/blog/55bc53c2ae00be9fa37bf43c61eb3ead">繁體中文</a> · <a href="/en/blog/517ad7d94b070775edab4dc5fc40fc23">English</a> · <a href="/ja/blog/0225e44e1bc9ca45cd60c5f524dfd8d3">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('55bc53c2ae00be9fa37bf43c61eb3ead', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('55bc53c2ae00be9fa37bf43c61eb3ead', '岩場指南');
DROP TABLE _blog_article_guard;
