-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/b905d673e6be5137348535d62c79011c.md
-- source-sha256: 39e418d736728da9d5543f96049dac20635a22f7608d4cd5fcff14ad77240ab7
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = 'b905d673e6be5137348535d62c79011c' OR slug = 'shoji-iwa-climbing-guide') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('b905d673e6be5137348535d62c79011c', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'shoji-iwa-climbing-guide', '障子岩攀岩指南：檜原石灰岩路線與巴士步行規劃', '障子岩的石灰岩路線、神戸岩入口巴士與山徑接近，兼顧老支點、季節與有限停車。', '<h2>想找5.11石灰岩路線，可以先看這裡</h2>
<p>障子岩位於東京都檜原村小沢，是東京旅程中可研究的繩索岩場。這篇給已有外岩先鋒經驗、願意花時間處理巴士與山徑接近的搭檔，說明如何選目標與安排一天。它不適合只看到「東京境內」便當成市區岩館的替代行程。</p>
<p><a href="https://www.climbing-net.com/iwaba_detail/%E9%9A%9C%E5%AD%90%E5%B2%A9/">CLIMBING-net的介紹</a>將岩質列為石灰岩，傾斜從近垂直到微仰角，路線構成以5.11級較多。比起只想隨意攀幾條簡單線的旅行者，它更適合先看過路線圖、知道自己想練習或嘗試什麼的人。</p>
<h2>路線名幫你對照，不代替支點資訊</h2>
<p><a href="https://www.rocktopo.net/rocks/206">ROCKTOPO主岩壁頁</a>可核對TNT（5.10b）、夏立ちぬ（5.11a）與ウッシーⅢ（5.12b）等登錄。保留日文名稱有助在實際路線圖上找線，但等級與登錄狀態都不保證當天的設備或岩況。選線時應把起攀、保護與下降一起看，而不是只找數字最接近岩館成績的路線。</p>
<p>出版社特別提醒古老螺栓，並指出夏季狀態較差、較佳季節為11月至3月。若旅行安排在4月，這是季節外緣的候選，不應把冬季適期直接延伸成春季乾燥保證。給第一條線保留難度餘裕，實際確認腳點、握點與保護需求後再增加強度。</p>
<h2>神戸岩入口只是起點，岩場不是觀光岩本身</h2>
<p>交通骨架是武蔵五日市站搭小岩方向巴士，在神戸岩入口下車，往神戸岩方向走，過第一座橋後沿林道，再由小溪旁進入山徑。出版社描述林道與山徑各約15分鐘；這是接近路線的參考，不是全隊抵達時間的保證。本文談的是障子岩，不將神戸岩觀光點或其他鄰近岩場混為同一入口。</p>
<p>先查當日去回巴士，再決定住宿地出發時間。路線圖、交通截圖與離開岩壁的截止時間應在出發前備好；攜帶重裝備時要為找路與整理繩索多留餘裕。若現地通行告示與介紹不同，以告示為先，不自行另闢捷徑。</p>
<h2>小停車空間，不適合到場後才找車位</h2>
<p>ROCKTOPO主岩壁頁提醒靠近岩場的道路周邊原則上禁止停車，指定空間停不了時應改去其他場地；出版社也說停車空間極少。開車並不一定比巴士更省事。先確認可使用的指定位置與條件，滿位就調整，別把看似空曠的林道路肩當備案。</p>
<p>目前未確認障子岩在實際造訪日的通行與攀登條件。把它列為候選後，再取得最新利用資訊與雨況；社群頁面上的路線紀錄不足以證明許可。資料也列岩場沒有公廁，需在進山前處理如廁並帶足水與午餐，不焚火、不留下垃圾。對旅行者而言，一天的完成標準包括準時下山與不增加當地負擔。</p>
<h2>參考資料</h2>
<ul>
<li><a href="https://www.rocktopo.net/rocks/206">ROCKTOPO — 障子岩</a></li>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E9%9A%9C%E5%AD%90%E5%B2%A9/">山と溪谷社 CLIMBING-net — 障子岩</a></li>
</ul>
<h2>其他語言</h2>
<p><a href="/blog/b905d673e6be5137348535d62c79011c">繁體中文</a> · <a href="/en/blog/2154ab57f65bc1aded60ed8d4af84d72">English</a> · <a href="/ja/blog/a1aa21c3ea0059ea1b2fbd1489dae93b">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('b905d673e6be5137348535d62c79011c', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('b905d673e6be5137348535d62c79011c', '岩場指南');
DROP TABLE _blog_article_guard;
