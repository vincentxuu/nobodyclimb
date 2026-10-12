-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/5e435298b3f0aefaa8f64a209f252ab8.md
-- source-sha256: a7fdfcbd3455fb51b08b07a208142070b350e440cf97b51e26997a4e575eae30
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '5e435298b3f0aefaa8f64a209f252ab8' OR slug = 'kawamata-climbing-guide') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('5e435298b3f0aefaa8f64a209f252ab8', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'kawamata-climbing-guide', '河又攀岩指南：名栗石灰岩選線與蛇岩崩落提醒', '河又石灰岩選線、飯能巴士與停車約定，先讀JFA蛇岩崩落公告再確認造訪條件。', '<h2>先看警訊，再決定去哪一面牆</h2>
<p>河又位於埼玉縣飯能市下名栗，是東京旅行可考慮的石灰岩攀登地。若你與搭檔已有天然岩場先鋒經驗，這篇幫你把交通、選線與進入條件分開確認；不能把「河又」當成一面狀態一致的岩壁。不同岩區的接近路徑與風險，需要分別看。</p>
<p>最先要讀的是<a href="https://freeclimb.jp/access/10282/">JFA在2025年10月的蛇岩崩落公告</a>：協會收到蛇岩崩落報告，表示細節不明，提醒暫時不要靠近。這是有日期的事件公告，不能從它推導整個河又都關閉，也不能因資料庫仍列有路線，就認定蛇岩已恢復可用。</p>
<h2>以5.10、5.11範圍挑選石灰岩目標</h2>
<p><a href="https://www.climbing-net.com/iwaba_detail/%E6%B2%B3%E5%8F%88/">CLIMBING-net的岩場介紹</a>列出近垂直到仰角的石灰岩，以及多條5.10、5.11級路線。<a href="https://www.rocktopo.net/areas/94">ROCKTOPO的岩區索引</a>則顯示河又包含不只一個岩區。讀完資料後，先選出具體牆面與路線，別把整個索引當作可以自由探索的同一個場地。</p>
<p>對旅行日而言，少量明確目標比只記一個岩場名更有用。可以先列一條低於戶外極限的路線、一條想嘗試的路線，並取得對應路線圖。出版社也記錄老舊支點、劣化吊帶與浮石問題；整備過的支點不等於整面牆已獲安全保證。裝備與下降安排應針對實際選線確認。</p>
<h2>飯能轉巴士，回程先於上牆時間決定</h2>
<p>交通以飯能或東飯能轉名栗方向巴士為骨架，在河又名栗湖入口下車。這個停留所與飯能的連接可用<a href="https://www.saitamabus.jp/app/routebusstop/busstop/stopid/11-24126">埼玉巴士協會的路線資料</a>查核；班次與行駛路線仍需按造訪日期確認。出版社的步行描述由尾須沢鍾乳洞指示牌往岩場走，將它當成路徑線索，再與當地最新指引對照。</p>
<p>先記回程巴士與離開牆面的時間，才分配嘗試次數。若帶重裝備或不熟山徑，別把介紹頁的步行分鐘數直接當成全隊速度。抵達後若告示、入口或地形與路線圖不同，停止往裡走並重新確認。</p>
<h2>停車規則比地圖空位優先</h2>
<p>ROCKTOPO提醒攀岩利用與當地有採用付費河原停車場的約定。出版社頁面還留有舊停車安排，這類差異正是不能照抄舊攻略價格或入口的原因。開車前向現地確認指定停車場、付款方式與可使用時段，不佔用公廁前的短停空間，也不自行移動門障。</p>
<p>同一篇<a href="https://www.climbing-net.com/iwaba_detail/%E6%B2%B3%E5%8F%88/">CLIMBING-net介紹</a>在開頭記錄2010年禁令解除，但「其他」欄仍寫コウモリ岩原則禁止。兩段資料的適用範圍與後者更新日期未確認；不能由歷史解除推定該岩區目前可用。規劃時應保留這項警示，向管理方確認目標岩區，未獲確認前不要進入コウモリ岩。</p>
<p>目前未確認蛇岩的重新開放，也未確認其他岩區在實際造訪日的利用條件。若無法取得最新許可與岩況資訊，先將河又保留為候選，不把它訂成無法替換的唯一戶外日。進山前備好食物、飲水與如廁安排，帶走垃圾，不使用火器；旅行者遵守這些約定，才不會把一天的攀登變成地方居民需要處理的麻煩。</p>
<h2>參考資料</h2>
<ul>
<li><a href="https://www.rocktopo.net/areas/94">ROCKTOPO — 河又</a></li>
<li><a href="https://freeclimb.jp/access/10282/">日本フリークライミング協会 JFA — 河又</a></li>
<li><a href="https://www.saitamabus.jp/app/routebusstop/busstop/stopid/11-24126">埼玉県バス協会 — 河又名栗湖入口</a></li>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E6%B2%B3%E5%8F%88/">山と溪谷社 CLIMBING-net — 河又</a></li>
</ul>
<h2>其他語言</h2>
<p><a href="/blog/5e435298b3f0aefaa8f64a209f252ab8">繁體中文</a> · <a href="/en/blog/35cbd4d53e55dc61ee5640f58190600d">English</a> · <a href="/ja/blog/4c9b21b244fc4b4377bc5a242c083c77">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('5e435298b3f0aefaa8f64a209f252ab8', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('5e435298b3f0aefaa8f64a209f252ab8', '岩場指南');
DROP TABLE _blog_article_guard;
