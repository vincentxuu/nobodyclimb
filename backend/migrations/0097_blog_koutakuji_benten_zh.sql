-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/3776dfb661562fe8179ecbefb91a9c21.md
-- source-sha256: 573e35ba704e6f4451c2b0b4e9445837306274f3a9caa997ab047799ac6a5683
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '3776dfb661562fe8179ecbefb91a9c21' OR slug = 'koutakuji-benten-climbing-guide') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('3776dfb661562fe8179ecbefb91a9c21', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'koutakuji-benten-climbing-guide', '広沢寺・弁天岩攀岩指南：厚木斜板練習與場地規則', '厚木弁天岩斜板的練習用途、巴士與林道接近，並釐清私有地規則與訓練範圍。', '<h2>把腳步練習留給一面斜板</h2>
<p>広沢寺一帶位於神奈川縣厚木市，弁天岩是這裡的代表性大岩板。若東京旅行中的戶外日想練習腳點判斷、重心與穩定移動，可以先研究這裡。本文給具備繩索操作能力的搭檔，也協助打算找帶領者的初學者理解場地；「適合練習」不代表能自行架繩或當成無管理的公共教室。</p>
<p><a href="https://www.climbing-net.com/iwaba_detail/%E5%BA%83%E6%B2%A2%E5%AF%BA/">CLIMBING-net的介紹</a>把弁天岩斜板列為核心特色，岩質為凝灰岩，並區分弁天岩、對岸岩區與其他岩塊。本文聚焦弁天岩，不把全區的路線數與難度都算成這一面斜板的選擇。</p>
<h2>先選練習內容，再安排繩索系統</h2>
<p>斜板攀登可把注意力放在腳點、身體平衡與移動節奏，而不只是拉大岩點。若當天目標是技術練習，選能完整處理攀登、確保與下降的路線，再決定如何練習。出版社列有先鋒及有限定的頂繩形式，不能從中推導整面牆都可自由架頂繩。</p>
<p>若請帶領者協助，可在行前說明自己希望練腳步、先鋒或繩索流程，讓目標與對方安排一致。沒有完整路線圖、支點與下降資訊時，不以「新手岩場」三個字補足缺失，也不在本文指定通用繩長或器材數量。</p>
<h2>本厚木或伊勢原轉巴士，再走溫泉方向</h2>
<p>出版社交通骨架是小田急線本厚木或伊勢原站轉巴士，在広沢寺温泉入口下車，步行到溫泉一帶，再走有車止的林道前往岩場。直達温泉的班次較少，安排去回程時要分清站名。不要只看小田急列車時間，而忽略最後一段巴士與步行。</p>
<p>開車者應使用現地指定的広沢寺温泉前停車安排，不開進林道，也不在林道路肩停放。把停車付款或指示、補給及如廁先完成，再帶裝備往牆面走。若設施使用條件改變，依現地要求調整，不把舊攻略寫的免費或方便當成權利。</p>
<h2>私有地的使用約定，要連同訓練範圍一起讀</h2>
<p><a href="http://mt-farm.info/koutakujiaizen.html">「広沢寺の岩場を守る会」規則的公開資料</a>說明這裡是私有地，並要求帶走垃圾、不砍樹、不焚火、不在岩場或停車場搭帳。資料記錄2016年的約定，也指出2019年起冰爪、冰工具的禁用範圍詳列於弁天岩基部告示。它不支持把舊線名範圍當成現行完整許可。</p>
<p>目前未確認實際造訪日的利用條件與冰爪、冰工具訓練範圍。一般攀岩旅行不需要把冰爪訓練加進當天；若特別為此而來，務必讀當日基部告示並確認管理要求。把安靜使用、讓出動線與按時收繩列入計畫，才讓斜板上的練習與當地長期維護相容。</p>
<h2>參考資料</h2>
<ul>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E5%BA%83%E6%B2%A2%E5%AF%BA/">山と溪谷社 CLIMBING-net — 広沢寺・弁天岩</a></li>
<li><a href="http://mt-farm.info/koutakujiaizen.html">MT Farm／広沢寺の岩場を守る会公開資料 — 広沢寺・弁天岩</a></li>
</ul>
<h2>其他語言</h2>
<p><a href="/blog/3776dfb661562fe8179ecbefb91a9c21">繁體中文</a> · <a href="/en/blog/9c0f7fdeb7726a56c75426b0c5d30d0c">English</a> · <a href="/ja/blog/576667d5eb7252593c4bbf1983e09fe9">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('3776dfb661562fe8179ecbefb91a9c21', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('3776dfb661562fe8179ecbefb91a9c21', '岩場指南');
DROP TABLE _blog_article_guard;
