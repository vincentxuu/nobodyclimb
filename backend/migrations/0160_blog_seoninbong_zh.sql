-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/57c6e2d0d50150551208df0a89af68aa.md
-- source-sha256: b6178ffba8d5e5d8d5f3eea569fadd27b5ac7038ea8d5ecbb2c8fc3fc509e21f
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '57c6e2d0d50150551208df0a89af68aa' OR slug = 'seoninbong-climbing-guide') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('57c6e2d0d50150551208df0a89af68aa', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'seoninbong-climbing-guide', '仙人峰攀岩指南：道峰山裂隙路線的交通、申請與準備', '仙人峰在北漢山國立公園的道峰山一帶。從道峰山站辨識進入方向，整理花崗岩裂隙與岩壁申請要確認的條件。', '<h2>如何安排這個場地</h2>
<p>仙人峰（선인봉，Seoninbong）位於北漢山國立公園東北側的道峰山（도봉산）一帶。<a href="https://www.mountainproject.com/area/119848026/senin-bong-dobongsan">Mountain Project 的場地介紹</a>將它描述為花崗岩與裂隙攀登場地。若你的首爾行程目標是多繩距傳統攀登，仙人峰可作為獨立研究對象，而不是仁壽峰文章裡的附註。</p>
<p>但「也是花崗岩」不代表兩座岩峰能共用路線、下降或交通安排。本篇幫你辨識進山方向與申請問題，不提供逐段攀登 beta，也不把社群人氣比較當成今天人少的保證。</p>
<h2>導航時不要少打一個山字</h2>
<p>社群頁的公共交通說明使用地鐵 1 號線道峰山站（도봉산역，Dobongsan），不是名稱近似的道峰站（도봉역，Dobong）。保存韓文站名與岩峰名稱，比只記中文音譯更能避免誤用行程筆記。其描述是從車站往道峰山方向接近，並非一份最新逐轉彎導航。</p>
<p>本文未確認當期完整接近路線與所需時間，出發前應向管理處或熟悉仙人峰的夥伴確認。不同攀登線路的起點可能需要不同接近判斷；不要把一般登山路線的到頂時間當成攀岩接近時間。自駕者也應重新核對停車規則，本文不沿用社群頁帶有估計語氣的舊停車費。</p>
<h2>岩壁使用不是一般登山入場</h2>
<p><a href="https://www.knps.or.kr/smartsafe/permission/list.do">國立公園岩壁申請入口</a>列有「북한산도봉」選項。公開規則為今日起第 3 至第 30 日可申請，新日期 10:00 開放，隊伍 2–5 人；取得最終核准簡訊才可使用岩壁。這些條件值得在住宿與交通定案前就查清楚，尤其不能假定單人出發後能在現場補辦。</p>
<p>本次未確認仙人峰指定岩壁在預定日期的名額、適用區域及外籍旅客申請方式；應先向管理處確認。線上有入口不等於你選的路線已被允許，更不代表天候或當期管制不會改變安排。<a href="https://www.knps.or.kr/front/portal/visit/visitCourseSubMain.do?menuNo=7020092&parkId=121500&parkNavGb=guide">官方北漢山遊憩頁</a>另外提醒核對入山時間制度和步道管制。</p>
<p>核准後還有當日確認程序。<a href="https://www.knps.or.kr/smartsafe/cms/contents.do?cmsSeq=28">官方申請說明</a>要求在園區內透過簡訊連結與GPS確認攀登開始，須在16:00前完成；離山時亦須完成結束確認。不能只保留核准簡訊就略過報到與離山程序；細節請在申請時向管理處確認。</p>
<h2>用選定路線決定裝備</h2>
<p>社群介紹談到裂隙與傳統保護器材，適合用來理解場地性質，不適合抽成所有路線通用的器材數量。安排仙人峰時，先取得目標路線的最新 topo，確認每段長度、固定點與自行設置保護的需求，並核對確保站和下降。把繩長、下降次數及可能撤退的位置一併討論，才有辦法決定帶什麼。</p>
<p>如果你會室內先鋒，但尚未能判斷裂隙保護或多繩距下降，別只找更低的級數補足落差。可以先詢問具備當地經驗的帶領者，說明自己的攀登與確保經驗，由雙方確認能做的活動。本文未查證商業帶領服務的供應、價格或資格，不提供預約保證。</p>
<h2>什麼時候值得排進行程</h2>
<p>在申請與接近問題清楚、隊伍能處理路線和下降時，仙人峰才從「想去的名字」成為可執行的山中日。把整天時間留給交通、接近、攀登和離山；事先訂下天氣變差或進度不足時的替代方案，而不是把多繩距硬塞進半天市區行程。</p>
<p>本篇於 2026 年 10 月 12 日核對公開資料；社群描述不是當日現場檢查，NobodyClimb 也未以品牌身分實爬驗證。對實際出發最有用的下一步，是帶著日期、隊伍與目標線路向管理處和當地夥伴確認。</p>
<h2>參考資料</h2>
<ul>
<li><a href="https://www.mountainproject.com/area/119848026/senin-bong-dobongsan">Rock Climbing in Seonin-bong (Dobongsan), Seoul/Gyeonggi-do (Northwest Korea)</a></li>
<li><a href="https://www.knps.or.kr/smartsafe/permission/list.do">스마트워치 상황관제 시스템</a></li>
<li><a href="https://www.knps.or.kr/front/portal/visit/visitCourseSubMain.do?menuNo=7020092&parkId=121500&parkNavGb=guide">코스별난이도 &lt; 북한산국립공원 &lt; 국립공원탐방 &lt; 국립공원공단</a></li>
<li><a href="https://www.knps.or.kr/smartsafe/cms/contents.do?cmsSeq=28">스마트워치 상황관제 시스템</a></li>
</ul>
<h2>閱讀語言</h2>
<p><a href="/blog/57c6e2d0d50150551208df0a89af68aa">繁體中文</a> · <a href="/en/blog/a1b302e1a01cb19b46d6f12c33281e48">English</a> · <a href="/ja/blog/b17a878a6f6cde0a8a599161443c8279">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('57c6e2d0d50150551208df0a89af68aa', '首爾攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('57c6e2d0d50150551208df0a89af68aa', '岩場指南');
DROP TABLE _blog_article_guard;
