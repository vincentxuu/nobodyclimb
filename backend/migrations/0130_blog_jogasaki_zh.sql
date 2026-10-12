-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/d050b303d8cb720b212a12e15e918dcc.md
-- source-sha256: 5202b092908d61affd135132f77cb6dc0038daac203e2227960bf02abf3b636a
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = 'd050b303d8cb720b212a12e15e918dcc' OR slug = 'jogasaki-climbing-guide') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('d050b303d8cb720b212a12e15e918dcc', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'jogasaki-climbing-guide', '城ヶ崎海岸攀岩指南：先選裂隙岩區，再安排伊豆海岸行程', '城ヶ崎以海崖裂隙為主要特色。從傳攀能力、岩區入口與撤退方式，判斷是否適合你的東京延伸行程。', '<h2>適合誰，先選什麼</h2>
<p>城ヶ崎位於靜岡縣伊東一帶，並不是一面集中入口的岩壁。<a href="https://www.rocktopo.net/areas/9">ROCKTOPO 城ヶ崎資料</a>同時收錄裂隙、岩面先鋒、抱石及多繩距；<a href="https://tommy-climbing.com/rocks/cn8/pg257.html">當地嚮導 TOMMY CLIMBING CLUB</a>則把從富戶到赤澤的海岸岩區描述為以裂隙為中心。想在東京旅行中加入海崖攀登，應先選岩區和攀登方式，再決定在哪一站下車。</p>
<p>若目標是裂隙，關鍵能力包括放置與判斷自然保護、選擇適合尺寸的器材、設置確保及撤退。室內先鋒的級數不能回答這些問題。沒有這些經驗的人，建議預約熟悉該岩區的嚮導，把第一天設定成裂隙入門，而不是自行找一條看似容易的線。</p>
<h2>岩區和路線怎麼選</h2>
<p>ROCKTOPO將岩質列為安山岩，並分列裂隙與岩面路線；不要把整個城ヶ崎標成運動攀登岩場。頁面列出的「パープルシャドウ」5.8與「ピーターパン」5.10b，可以當作查找 topo 的名稱線索，不是本文核准的當日推薦線。TOMMY的八幡野資料也分列自然保護與 bolt 路線，部分路線採混合保護；是否有 bolt 不代表只需快扣。</p>
<h2>交通與接近：以岩區為單位</h2>
<p>TOMMY的八幡野活動以伊豆高原站集合，並提及伊豆高原、城ヶ崎海岸、富戶周邊住宿。這是該嚮導的活動安排，不是所有岩區的共同入口。訂房前，把選定岩區的入口、步行路線、是否需垂降，以及離開岩區的方法交給同行者一起確認。東京出發的精確車次與完整門到門時間，本篇未核實；不要沿用旅遊筆記中的總時數。</p>
<h2>海邊條件與一天的安排</h2>
<p>TOMMY提醒海岸殘置器材腐蝕與樹木支點需要檢查。即使岩場照片很乾，仍要確認浪況、潮汐、風和實際落腳點；未能判斷海崖環境時，不要先垂降再想怎麼離開。ROCKTOPO列出的季節集中在12月至4月，這是選季參考，不能保證某天岩況。四月行程建議保留可取消的戶外日，不把唯一攀登日綁在海崖。</p>
<p>建議示例：前一晚住伊豆，早上只去一個已確認的岩區；把熟悉接近、檢查保護與一兩條保守目標作為主菜。若當日條件不合，改為海岸散步或室內攀登。這是編輯安排示例，不是已驗證的嚮導方案；本文也沒有代替任何一條路線的器材清單。</p>
<h2>參考資料</h2>
<ul>
<li><a href="https://www.rocktopo.net/areas/9">城ヶ崎 | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
<li><a href="https://tommy-climbing.com/rocks/cn8/pg257.html">JYOGASAKI YAWATANO│TOMMY CLIMBING CLUB</a></li>
</ul>
<p><a href="/blog/d050b303d8cb720b212a12e15e918dcc">繁體中文</a> · <a href="/en/blog/44a849fc8c33070654fbaf80c966bd2d">English</a> · <a href="/ja/blog/7c531718bd0f487b7372ac297244329c">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('d050b303d8cb720b212a12e15e918dcc', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('d050b303d8cb720b212a12e15e918dcc', '岩場指南');
DROP TABLE _blog_article_guard;
