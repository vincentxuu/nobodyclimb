-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/4637dfbdbb41eed37e0cbdb1acef3b31.md
-- source-sha256: 0d808f86264b78448c2310471b101145d6d12c0bdffff37213c4168b545fab2e
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '4637dfbdbb41eed37e0cbdb1acef3b31' OR slug = 'gozen-iwa-climbing-guide') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('4637dfbdbb41eed37e0cbdb1acef3b31', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'gozen-iwa-climbing-guide', '御前岩攀岩指南：先確認入山資格，再選石灰岩路線', '御前岩適合具備外岩先鋒與安全判斷能力的中高階攀登者。本文整理管理規則、路線資料與東京旅行的準備順序。', '<h2>先問整隊是否符合入山條件</h2>
<p>御前岩是東京奧多摩的石灰岩攀登目的地，適合已有外岩先鋒經驗、想把旅行中的一天留給指定路線的人。它的吸引力不只在難度；如何合法進入、每位同行者是否符合條件，應先於挑選想爬的線。若隊伍有人剛開始接觸戶外繩攀，這一站需要重新評估。</p>
<p><a href="http://caramba-02.sakura.ne.jp/okutama/area/">奧多摩攀岩中心的入山規則</a>將此處定位為中高階區域，要求能在外岩穩定先鋒 5.11 以上，並具備充分攀登與安全技術；原則上，單純確保或參觀者也適用同樣條件。這是管理方訂出的資格，不是 NobodyClimb 依路線表自行劃出的分級。</p>
<h2>登記、費用與停車如何準備</h2>
<p>管理頁要求初次進入的全員登記，未登記者不得進入；每次入山另填入山簿，離開時記錄下山時間。頁面列出的入山協力金為每人每次 500 日圓。請準備零錢，先完成手續，再帶裝備上山，不要把「朋友已登記」當成全隊都已完成。</p>
<p>停車也有獨立規則。管理頁與 2023 年的<a href="https://wind-scene.com/gozeniwa/">實地記錄</a>對中心停車費的繳付方式有差異：前者仍寫購買指定飲料，後者記錄販賣機已撤除。本次未核實中心停車費的現行繳付方式，出發前須向管理方確認，抵達後依現場指示辦理。交通計畫因此應保留辦理手續的時間，不能只計算車站到岩壁的距離。</p>
<p>作為接近的參考，2023 年實地記錄從奧多摩攀岩中心旁停車處步行至岩場，作者記錄不到 15 分鐘。這是當次觀察，不是目前通行保證。從東京住宿前往時，先定位中心與岩場，再向管理方核對公共交通、指定接近與現況，避免直接跟著附近釣場的路徑進入。</p>
<h2>路線表能回答什麼</h2>
<p><a href="https://www.rocktopo.net/areas/198">ROCKTOPO 的御前岩資料</a>可用於尋找路線與區域，例如頁面列出 ミートテック 5.10c、ハートブレイク 5.11a、蒙古タンメン 5.12a。這些是資料庫標示，不能據此推論較簡單的線可以讓不符合入山條件的人進入。級數也不回答繩長、快扣數、岩塊穩定性或下降操作。</p>
<p>建議先選少量目標線，與同行者核對最新 topo 的長度、下降方式與所需裝備；一人想挑戰高難度時，也要先確認另一人能提供合適確保。不要把旅程排成必須完攀某條線的任務，抵達後若狀況不合適，仍應能撤回。</p>
<h2>管理規則就是行程的一部分</h2>
<p>管理方禁止夜間進入、未經許可的帶隊指導、新路線開拓與追加 bolt，並提醒落石與不完整固定點的風險。規則還包含垃圾帶走、不可任意砍樹、不可移走結束點或回收用的留置鉤環。對旅行者而言，最有用的準備是讓全隊讀過同一份規則，而不只由領隊知道。</p>
<p>安排東京住宿出發的御前岩日，先確認管理規則與資格，再查當天交通，最後才決定裝備清單與目標線。本指南未檢查現場固定點，也不保證旅行當日開放；接近路線與現場公告仍須在出發前確認。若這些條件不能確認，把攀登日改為室內岩館，比帶著不確定性到岩壁下更容易保留旅程的彈性。</p>
<h2>參考資料</h2>
<ul>
<li><a href="https://www.rocktopo.net/areas/198">御前岩 | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
<li><a href="https://wind-scene.com/gozeniwa/">はじめての御前岩クライミング｜アプローチや注意事項など</a></li>
<li><a href="http://caramba-02.sakura.ne.jp/okutama/area/">エリア情報 | 奥多摩クライミングセンター</a></li>
</ul>
<p><a href="/blog/4637dfbdbb41eed37e0cbdb1acef3b31">繁體中文</a> · <a href="/en/blog/7604f1e91f67001a52849073701d8398">English</a> · <a href="/ja/blog/954fded07c2b02e46cb4676c2e347ca5">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('4637dfbdbb41eed37e0cbdb1acef3b31', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('4637dfbdbb41eed37e0cbdb1acef3b31', '岩場指南');
DROP TABLE _blog_article_guard;
