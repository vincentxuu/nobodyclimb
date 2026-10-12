-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/77bd05d60d5cdeb6838224fbb1ae0274.md
-- source-sha256: 424c3d5433e6235bd8713c349ad57a286a7930a9d275d03bddade104a5a46252
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '77bd05d60d5cdeb6838224fbb1ae0274' OR slug = 'insubong-climbing-guide') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('77bd05d60d5cdeb6838224fbb1ae0274', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'insubong-climbing-guide', '仁壽峰攀岩指南：首爾花崗岩多繩距，先確認申請與下降', '仁壽峰的裂隙與岩板不是一般市區抱石行程。整理進山方向、國立公園岩壁申請與路線規劃，並明列外籍申請尚未確認。', '<h2>如何安排這個場地</h2>
<p>仁壽峰（인수봉，Insubong／Insu-bong）是首爾北漢山的戶外繩索攀登目的地。它吸引人的不是下車後立刻攀爬，而是花崗岩岩板、裂隙與多繩距的完整山中日。<a href="https://www.mountainproject.com/area/106225638/insu-bong-bukhansan">Mountain Project 的場地介紹</a>描述傳統攀登，也提醒部分運動路線的固定點間距很長。不要因為路線表出現熟悉的數字，就把它當成室內同級路線的旅行版。</p>
<p>這篇是行程判斷指南，不取代 topo 或現場帶領。適合已能規劃多繩距、保護與下降的隊伍作研究起點；若你只有抱石或室內上攀經驗，先與具備當地經驗的帶領者討論，比先挑一條看起來低難度的線更實際。</p>
<h2>先決定從哪一側進山</h2>
<p>社群場地頁將仁壽峰進入方向放在北漢山東側，提到北漢山牛耳站（북한산우이역）及道詵寺（도선사）一帶。可以先用這兩個韓文名稱理解接近方向，再向公園或當地夥伴確認當期路徑。頁面內有 2022 年交通與共乘費用資訊，本文不把那些價格當成現在的報價，也不承諾固定步行時間。</p>
<p>從首爾住宿地算整天時，要把交通、接近、裝備整理、攀登、下降與離山都列入。仁壽峰的「市區可到」不等於日照內一定爬得完；沒有把下降時間算入的行程，不應只靠更早出門補救。</p>
<h2>國立公園申請需要提前確認</h2>
<p><a href="https://www.knps.or.kr/smartsafe/permission/list.do">國立公園岩壁申請頁</a>包含北漢山選項，公開規則寫可申請今日起第 3 至第 30 日，新日期於 10:00 開放；隊伍為 2–5 人，須取得最終核准簡訊才能使用岩壁。這不是一般步道門票，也不能用有登山步道推定可以攀岩。</p>
<p>本次未確認仁壽峰指定岩壁在預定日期的名額、適用區域及外籍旅客申請方式；應先向管理處確認。請把這件事放在訂交通或帶領服務之前，提供預定日期、人數、目標岩壁與旅客身分請對方確認，不要把有填表入口當成已核准。</p>
<p>核准後還有當日確認程序。<a href="https://www.knps.or.kr/smartsafe/cms/contents.do?cmsSeq=28">官方申請說明</a>要求在園區內透過簡訊連結與GPS確認攀登開始，須在16:00前完成；離山時亦須完成結束確認。不能只保留核准簡訊就略過報到與離山程序；細節請在申請時向管理處確認。</p>
<h2>選線時同時選保護與下降</h2>
<p>社群資料列出 Chouinard A、Chouinard B、Insu A、Insu B 等多繩距路線名稱，可作查找 topo 的關鍵字；本文不以資料庫的單一總級數代替逐段描述。選線時應確認每段保護方式、固定點現況、繩距長度、確保站、下降線與撤退選項。岩板與裂隙需要的操作不同，單看是否有 bolt 不足以決定攜帶哪些保護器材。</p>
<p>同樣地，本文不提供「一條 60 公尺繩就夠」的通用清單。繩索與下降器材必須配合選定路線的最新資料；先把這些條件問清楚，再決定是否適合自己的隊伍。如果下降資訊、保護配置或現地辨識仍不清楚，改由熟悉場地的人帶領，或調整當天計畫。</p>
<h2>出發前的判斷順序</h2>
<p><a href="https://www.knps.or.kr/front/portal/visit/visitCourseSubMain.do?menuNo=7020092&parkId=121500&parkNavGb=guide">北漢山官方遊憩頁</a>提醒確認入山時間制度與步道管制。先查申請是否核准和當日管制，再查天氣與選定線路；最後與夥伴確認何時停止上攀、如何下降與失去進度時的替代安排。</p>
<p>仁壽峰可以成為首爾攀岩旅行的重點，但只有在申請、路線與隊伍能力都能對上時，才值得排成實際攀登日。本文的公開資料查核日是 2026 年 10 月 12 日，並非現場固定點檢查或 NobodyClimb 的攀登經驗。</p>
<h2>參考資料</h2>
<ul>
<li><a href="https://www.mountainproject.com/area/106225638/insu-bong-bukhansan">Rock Climbing in Insu-bong (Bukhansan), Seoul/Gyeonggi-do (Northwest Korea)</a></li>
<li><a href="https://www.knps.or.kr/smartsafe/permission/list.do">스마트워치 상황관제 시스템</a></li>
<li><a href="https://www.knps.or.kr/front/portal/visit/visitCourseSubMain.do?menuNo=7020092&parkId=121500&parkNavGb=guide">코스별난이도 &lt; 북한산국립공원 &lt; 국립공원탐방 &lt; 국립공원공단</a></li>
<li><a href="https://www.knps.or.kr/smartsafe/cms/contents.do?cmsSeq=28">스마트워치 상황관제 시스템</a></li>
</ul>
<h2>閱讀語言</h2>
<p><a href="/blog/77bd05d60d5cdeb6838224fbb1ae0274">繁體中文</a> · <a href="/en/blog/ac1de57c9cd0be29fe035bde62b098e8">English</a> · <a href="/ja/blog/71b53781fde2dc5037cef4423599ae79">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('77bd05d60d5cdeb6838224fbb1ae0274', '首爾攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('77bd05d60d5cdeb6838224fbb1ae0274', '岩場指南');
DROP TABLE _blog_article_guard;
