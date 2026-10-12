-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/a11b01e0adba7d6b2cfd364b88cbfcac.md
-- source-sha256: 99842ef5ee71648dedfc12b625f2e930723d2b0931fe33e7246f8cd031ab2fef
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = 'a11b01e0adba7d6b2cfd364b88cbfcac' OR slug = 'kernel-rock-climbing-guide') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('a11b01e0adba7d6b2cfd364b88cbfcac', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'kernel-rock-climbing-guide', 'カーネルロック攀岩指南：先確認進入方式，再安排小型石灰岩岩場', '小型石灰岩場的路線選擇、日向和田交通線索，以及需先確認的進入與停車條件。', '<h2>七條登錄路線，適合帶著明確目標來</h2>
<p>カーネルロック（Kernel Rock）是東京都的小型天然岩場。對東京旅行中的繩索攀登搭檔，它的吸引力在於集中選線，而不是大量路線任選：先確認有符合兩人能力的目標，再判斷是否值得把一天留給這裡。若希望整組不同程度的朋友都能長時間輪流攀登，先仔細檢查選擇範圍。</p>
<p><a href="https://www.rocktopo.net/areas/1797">ROCKTOPO岩區頁</a>將岩質列為石灰岩；2026年10月12日讀取時，資料庫登錄七條面攀先鋒路線。這是社群資料快照，不是管理單位核定的路線總數，也不代表所有登錄線都可在造訪日使用。</p>
<h2>從岩壁形狀挑選目標</h2>
<p><a href="https://www.rocktopo.net/rocks/8264">主岩區的路線頁</a>列有プレイヤー（5.9）、セント・フローリア（5.10a）、ぶらり（5.10c）與カモン・エディ！（5.11a）。頁面描述中，中央線帶有小仰角，另一條則以片狀岩與口袋越過明顯仰角。路線名保留日文，方便拿到實際路線圖後對照，不把翻譯名當成現地標示。</p>
<p>這種組合讓選線不能只看數字：同樣在5.10範圍，仰角起步與較連續的垂直攀登可能要求不同動作。把一條有餘裕的起始線與一條想嘗試的線先列好；若現場擁擠或某線有問題，小岩場的替代選擇有限，就需要願意調整目標。</p>
<h2>交通從地圖定位開始，不從停車註記推導許可</h2>
<p><a href="https://beta-climbing.com/lesson/weekday_climbing_club">BETA Climbing的外岩活動說明</a>把場地定位為青梅市，列JR日向和田站步行約5分鐘；這是活動安排的參考，不是獨立旅客的進入許可。ROCKTOPO主岩區頁另提及Rose Town Tea Garden停車場「據稱可利用」。這個措辭本身就有保留，不能改寫成已獲店家同意或旅客能自由停車。先以日向和田站與頁面定位規劃鐵路、步行或接駁，再向現地確認入口、通行路徑及設施使用條件。</p>
<p>目前未取得カーネルロック的管理單位公告，也未確認進入、停車或收費條件。若聯繫不到可確認的人，先保留另一個交通與利用條件清楚的場地；不要到達後才嘗試穿越店家土地或找路邊空位。上述約5分鐘僅引用該活動說明；本文未確認獨立旅客當日的接近路徑與耗時，亦未核實店家營業時間或停車費。</p>
<h2>把裝備清單交給實際選線</h2>
<p>資料庫的路線名與等級可協助選題，但這次取得的文字沒有足以支持全岩場通用繩長與快扣數的資料。先取得當天目標的完整路線圖，確認攀登長度、下降方式與保護需求，再與搭檔核對裝備；別為了輕裝旅行任意縮短繩索或減少保護器材。</p>
<p>季節欄位偏向較涼的月份，可當作規劃線索，但不是當日岩面狀態預報。給這個小岩場保留一個彈性的白天，現場若雨濕、路徑不明或使用條件與預期不同，就調整行程。它適合的是先做足場地確認、帶著少量具體目標來攀登的人。</p>
<h2>參考資料</h2>
<ul>
<li><a href="https://www.rocktopo.net/areas/1797">ROCKTOPO — カーネルロック</a></li>
<li><a href="https://www.rocktopo.net/rocks/8264">ROCKTOPO — カーネルロック</a></li>
<li><a href="https://beta-climbing.com/lesson/weekday_climbing_club">BETA Climbing — カーネルロック</a></li>
</ul>
<h2>其他語言</h2>
<p><a href="/blog/a11b01e0adba7d6b2cfd364b88cbfcac">繁體中文</a> · <a href="/en/blog/3404251672a20c98c78d55609045d1f8">English</a> · <a href="/ja/blog/5b87e2eda04aaa15d696f3b1dbf5056d">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('a11b01e0adba7d6b2cfd364b88cbfcac', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('a11b01e0adba7d6b2cfd364b88cbfcac', '岩場指南');
DROP TABLE _blog_article_guard;
