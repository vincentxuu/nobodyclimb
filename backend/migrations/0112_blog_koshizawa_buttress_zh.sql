-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/dafce096fb5fe98e910208925e4c9aa9.md
-- source-sha256: 324f2c23c556302872fc6f6b6072a03b0784cc8219f95b7cf4448e26b705d18d
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = 'dafce096fb5fe98e910208925e4c9aa9' OR slug = 'koshizawa-buttress-climbing-guide') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('dafce096fb5fe98e910208925e4c9aa9', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'koshizawa-buttress-climbing-guide', '越沢バットレス攀岩指南：以多繩距能力安排奧多摩一天', '越沢バットレス以多繩距與山嶽訓練為主。東京旅人應先確認繩隊能力、下降與現況，不以低階數取代準備。', '<h2>這一天的主題是繩隊合作</h2>
<p>越沢バットレス是東京奧多摩的多繩距攀登岩壁，適合已經能合作處理架站、後攀者確保與下降的繩隊。多繩距意味著一條線會在中途架站，分段讓隊友上攀；它與在地面確保、一次下降回地面的單繩距運攀，有不同的時間與技術需求。</p>
<p><a href="https://www.climbing-net.com/iwaba_detail/%E8%B6%8A%E6%B2%A2%E3%83%90%E3%83%83%E3%83%88%E3%83%AC%E3%82%B9/">CLIMBING-net</a>將此處描述為高差約 80 公尺、寬約 70 公尺，以多繩距為主、偏向進入山嶽攀登前的訓練場。這些尺寸讓你理解岩壁的尺度，不能用來推算某條線的總攀登長度或需要幾條繩。從東京安排一天，重點應是完整完成一個適合全隊的攀登計畫，而非刷許多級數。</p>
<h2>為什麼不能只看「容易的線」</h2>
<p><a href="https://www.rocktopo.net/areas/102">ROCKTOPO 的區域頁</a>目前把已收錄的主要線列為 multi。資料庫收錄不是完整現場操作手冊；若只知道名稱和級數，卻不知道中途架站與下降位置，還不足以出發。</p>
<p>先確認每位隊員能做什麼：誰負責先鋒、誰能確保後攀者、誰能判斷支點、如何在看不見對方時溝通。把「今天不攀登」也列為選項。若只有一人瞭解全部系統，應先在受控環境練習或安排適合的指導，不要把旅行當天當成首次學習複雜操作的場合。</p>
<h2>岩石與留置保護需要獨立判斷</h2>
<p>出版者特別提醒留置保護的可靠性，並指出部分岩緣鋒利、過去發生過繩索被切斷事故。這與單純的路線難度是兩個問題：身體能完成動作，不等於能處理繩索經過岩緣或支點不可靠的情況。</p>
<p>因此，裝備清單要依目標線與現況制定，包含保護、架站、下降與個人防護，而不是照搬另一個運攀岩場的快扣數。本文不提供支點搭建或下降的逐步教學。出發前應與有相關經驗的人核對 topo，確認撤退方式；現場若無法判斷保護或繩路，就不進入該段。</p>
<h2>把接近與下山算進完整的一天</h2>
<p>閱讀 topo 時，同時找出起攀點、接近路線、下降與離開路線。這些不一定是同一條路，不能只儲存岩壁座標。大眾運輸旅人還要查實際當日的去回班次，設定不影響撤退的折返時間；裝備整理、等待其他繩隊與路線辨認都可能增加時間。</p>
<p><a href="https://npo.mirokuyamanokai.org/2024/06/07/56265">みろく山之會的 2024 年 5 月山行記錄</a>從鳩ノ巣站步行到起攀點，記錄約 30 分鐘。可將鳩ノ巣站作為查交通的起點，但這是當次隊伍的時間，不是現行步道通行或每個人的步行保證。從東京出發，另查旅行當日列車，並取得目前接近與下降路線。</p>
<p>CLIMBING-net 頁面有維護協力費的記載，但本次未核實現行費用、接近設施與岩壁支點狀況，請在出發前向熟悉此地的管理或攀登者確認，不把舊介紹當現況保證。若缺少這些資訊，先補資料，再決定是否把它加入東京行程。</p>
<p>越沢バットレス值得安排的理由，是用山嶽攀登的完整能力面對一面岩壁。帶著能自行管理的計畫前往，保留撤退時間與替代活動，才讓這一天真正成為有目的的練習。</p>
<h2>參考資料</h2>
<ul>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E8%B6%8A%E6%B2%A2%E3%83%90%E3%83%83%E3%83%88%E3%83%AC%E3%82%B9/">越沢バットレス</a></li>
<li><a href="https://www.rocktopo.net/areas/102">越沢バットレス | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
<li><a href="https://npo.mirokuyamanokai.org/2024/06/07/56265">越沢バットレス自主トレ</a></li>
</ul>
<p><a href="/blog/dafce096fb5fe98e910208925e4c9aa9">繁體中文</a> · <a href="/en/blog/289373c784da996c3ce737cd070e62de">English</a> · <a href="/ja/blog/a81faf4baa85bd50e89afdc78a1c805f">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('dafce096fb5fe98e910208925e4c9aa9', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('dafce096fb5fe98e910208925e4c9aa9', '岩場指南');
DROP TABLE _blog_article_guard;
