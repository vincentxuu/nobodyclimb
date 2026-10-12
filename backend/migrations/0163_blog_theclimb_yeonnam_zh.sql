-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/5ed702d9314fa563edaf66a482188c49.md
-- source-sha256: 7bcc3a04d9525dad56a63ec8a4e5107745fd794dfe0c4c5649e0b0eaf992a982
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '5ed702d9314fa563edaf66a482188c49' OR slug = 'theclimb-yeonnam-climbing-guide') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('5ed702d9314fa563edaf66a482188c49', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'theclimb-yeonnam-climbing-guide', 'The Climb 延南店：先分清分店，再安排首爾抱石日', '舊弘大店已公告歇業，延南店在楊花路 186 號三樓。整理官方營業時間、日票與首次造訪要問的事項。', '<h2>如何安排這個場地</h2>
<p>搜尋首爾岩館時，旅遊筆記常把 The Climb 與「弘大」放在一起。但分店名字不能只靠附近商圈推定：<a href="http://theclimb.co.kr/branch/">館方分店資料</a>已將 B 弘大店標為 2026 年 5 月 17 日歇業。若你要安排現在的行程，應確認的是延南店（연남점），不是沿用舊弘大店地址。</p>
<p>這篇以延南店為單一場館，整理 2026 年 10 月 12 日可讀的官方資訊。沒有把連鎖品牌所有分店的環境、課程或營業狀態混成同一個推薦。</p>
<h2>地址先核對到樓層</h2>
<p>延南店地址是首爾麻浦區楊花路 186 號，LC TOWER 三樓；韓文可保存為「서울특별시 마포구 양화로 186 3층」。官方電話為 02-2088-5071。出發前將地址與「연남점」一起輸入當地地圖，核對目的地，避免導航到已關閉的楊花路 125 號弘大分店。</p>
<p>本文沒有核實各車站出口的步行時間，所以不承諾幾分鐘抵達。從飯店規劃時，把地鐵轉乘、找大樓入口和首次報到算進去；晚到時先看還剩多少有效攀登時間，而不是只看離商圈多近。</p>
<h2>營業時間與要爬的內容</h2>
<p><a href="http://theclimb.co.kr/english/">官方英文頁的延南店區塊</a>列平日 07:00–24:00，週末及假日 08:00–22:00。同一頁介紹品牌的抱石與換線，不等於保證延南店每面牆在某一天都可使用，也不是個別路線的難度保證。旅行前仍應問當日是否有活動、換線或特殊營業安排。</p>
<p>如果你平常會抱石，入館後先詢問該館起點、終點、顏色與落地區域的規則，再選幾條輕鬆路線熟悉。不同館的顏色不能直接換算成自己熟悉的 V 級；這是行程安排建議，本文不提供未查證的顏色分級表。完全初學者則先問是否需要體驗課、是否須預約，以及能否使用你理解的語言說明。</p>
<h2>日票與器材預算</h2>
<p>官方英文頁的共通價目列單日票 22,000 韓元，租鞋 3,000、租粉 1,000 韓元。日票加租鞋為 25,000 韓元，若再租粉則為 26,000 韓元；這是依公開價目的加總，不包含另購課程或其他服務。英文頁同時保留已閉店分店的舊區塊，因此這些金額只作查核日的預算參考，延南店當日適用價格仍須向櫃檯確認。</p>
<p>帶自己的岩鞋可以減少租借需求；需要租鞋時，報到就問尺寸與使用規則。不要先購買多次票，只因它看起來比日票便宜：短期旅客應先核對有效期、本人使用條件與實際會去的次數。</p>
<h2>把第一次造訪問清楚</h2>
<p>可在行程筆記準備四個問題：今天延南店的日票總額是多少；第一次造訪要完成哪些登記或說明；租鞋與粉如何計費；初學者課程是否有空位與語言支援。本文未確認外籍旅客的完整登記流程、課程語言與當日名額，須直接向延南店詢問。</p>
<p>延南店可以作為室內抱石的行程候選，尤其當你想替戶外日保留雨天備案。先核對分店、再核對時間與服務，才能讓備案真正可用。這篇是公開資料指南，並非 NobodyClimb 的親訪心得。</p>
<h2>參考資料</h2>
<ul>
<li><a href="http://theclimb.co.kr/branch/">branch | theclimb</a></li>
<li><a href="http://theclimb.co.kr/english/">Korea Climbing gym | theclimb</a></li>
</ul>
<h2>閱讀語言</h2>
<p><a href="/blog/5ed702d9314fa563edaf66a482188c49">繁體中文</a> · <a href="/en/blog/53da59d598053f31d90eb8b4629fcfa1">English</a> · <a href="/ja/blog/2e54298c1999d880d7aae65162a88774">日本語</a></p>
', NULL, 'gyms', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('5ed702d9314fa563edaf66a482188c49', '首爾攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('5ed702d9314fa563edaf66a482188c49', '岩館指南');
DROP TABLE _blog_article_guard;
