-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/64fa975558f3a9f80501f6babd512ce8.md
-- source-sha256: 76368494406ae817d937ca07e6c97dbc012d3d6d0aa88316c96a80bdf29294e1
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '64fa975558f3a9f80501f6babd512ce8' OR slug = 'mitsutoge-climbing-guide') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('64fa975558f3a9f80501f6babd512ce8', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'mitsutoge-climbing-guide', '三ツ峠攀岩指南：把登山接近、架站與下降算進多繩距的一天', '三ツ峠是山頂下的岩訓與多繩距場地。選對接近路線、能力和回程安排，比只看低級數更重要。', '<h2>登山和攀登是同一個行程</h2>
<p>山梨縣三ツ峠的岩場位在山頂下方，主要目標集中於屏風岩。<a href="https://www.climbing-net.com/iwaba_detail/%E4%B8%89%E3%83%84%E5%B3%A0/">CLIMBING-net 場地資料</a>把它分為右、中央及左フェイス，內容有岩面、裂隙、人工攀與多繩距。想在東京旅行中加入山岳味較強的一天，可以考慮這裡；但應把接近和下山列為登攀的一部分，而不是到站就能上牆。</p>
<p>ROCKTOPO也<a href="https://www.rocktopo.net/areas/8">分列三ツ峠的三種繩攀內容</a>，岩質列為集塊岩。是否適合你，不能只看「有初中級線」：多繩距繩隊要能辨識路線、架站、管理繩索、處理下降並自主撤退。沒有這些能力者，應選由熟悉場地者帶領的岩訓，而不是把低級數當成可自行嘗試的理由。</p>
<h2>先選練習目的，再選岩面</h2>
<p>出版社將右フェイス描述為岩面與裂隙內容多樣，中央フェイス包含仰角與人工攀，左フェイス則有經典自由攀路線。初訪者應先選「單繩距熟悉岩質」或「多繩距系統練習」這類明確目的，再用現行 topo 找相符路線。不要把不同岩面的線湊成一張願望清單，忽略彼此移動和架站時間。</p>
<h2>接近路線不能只看站名</h2>
<p><a href="https://www.fujikyu-railway.jp/sightseeing/hiking.php">富士山麓電氣鐵道的登山頁</a>指向河口湖站搭往天下茶屋的巴士，在三ツ峠登山口下車，也說明有從三つ峠站登山的走法。這兩個入口不能混為一談。出版社估從三ツ峠站步行約2.5至3小時；裏登山道停車點至上方再到岩場則是另一個估值。那些是接近參考，不是東京門到門實測。</p>
<p>目前實際日期的往返巴士、山莊預約和道路狀態，本篇未完整核實。建議先與帶隊者確定入口，查當天運輸，再從回程倒推離壁時間；若不能留足下降和步行，不安排多繩距。住宿可以降低當天交通壓力，但不能把舊資料寫的山屋營業與露營規則當成現行許可。</p>
<h2>季節、落石與一天的節奏</h2>
<p>出版社列4月至10月，ROCKTOPO列4、5、6、7、9、10月作季節參考；四月可當選季線索，不等於沒有低溫或殘雪。出發前確認山上實況及天氣。CLIMBING-net尤其提醒 band 上浮石、繩索碰觸引起落石及多人在下方的問題，並要求頭盔與依路線準備 sling 等器材；不能用「岩訓場」三字降低對山岳場地的判斷。</p>
<p>建議示例：前一晚住附近，上午接近後只做一項主要目標，提早結束並保留下降、收繩和下山餘裕。岩況、路線辨識或確保站有疑問，就改成較簡單的課程或撤退。本文沒有個別路線的繩長與架站表；完整 topo 和有能力的同行者，是把計畫變成可執行攀登的下一步。</p>
<h2>參考資料</h2>
<ul>
<li><a href="https://www.rocktopo.net/areas/8">三ツ峠 | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E4%B8%89%E3%83%84%E5%B3%A0/">三ツ峠</a></li>
<li><a href="https://www.fujikyu-railway.jp/sightseeing/hiking.php">ウォーキング＆ハイキング | 富士山に一番近い鉄道 富士急行線 富士山麓電気鉄道株式会社</a></li>
</ul>
<p><a href="/blog/64fa975558f3a9f80501f6babd512ce8">繁體中文</a> · <a href="/en/blog/5756dd674ad7adc331afd511c9954f78">English</a> · <a href="/ja/blog/3306805c1c133d5be7e7fbf8ed510ec6">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('64fa975558f3a9f80501f6babd512ce8', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('64fa975558f3a9f80501f6babd512ce8', '岩場指南');
DROP TABLE _blog_article_guard;
