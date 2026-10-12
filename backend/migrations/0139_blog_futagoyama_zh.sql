-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/faba26d85e4f809578c41ec9e2f7ca02.md
-- source-sha256: c2872d2632e30192d044385c304e9aec3bd6404d054414808cf6e5b8c088a2e0
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = 'faba26d85e4f809578c41ec9e2f7ca02' OR slug = 'futagoyama-climbing-guide') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('faba26d85e4f809578c41ec9e2f7ca02', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'futagoyama-climbing-guide', '二子山攀岩指南：高階石灰岩目標與必須先確認的入場條件', '二子山包含先鋒與多繩距目標。區域規則、固定點公告及往返安排應先確認，再決定是否加入東京行程。', '<h2>先問岩區，再問級數</h2>
<p>埼玉縣小鹿野町的二子山，是以石灰岩先鋒及多繩距為特色的場地。<a href="https://www.climbing-net.com/iwaba_detail/%E4%BA%8C%E5%AD%90%E5%B1%B1/">CLIMBING-net</a>描述東岳、西岳、祠與ローソク岩等不同區域；<a href="https://www.rocktopo.net/areas/92">ROCKTOPO</a>也將岩面、裂隙和多繩距分列。對旅行者來說，第一個決定應是「我要去的那一區，目前允許如何使用」，而不是先挑最有名的路線。</p>
<p>適合已有戶外先鋒能力、能依岩況調整目標的繩隊。出版社列出的壁面包含明顯仰角；若全隊只想輕鬆試幾條低級數線，應先看實際 topo 的可選量和接近投入。中央稜多繩距與祠、弓状的單繩距目標，需要不同的能力與時間規劃，不能只用同一個「二子山日歸」標籤處理。</p>
<h2>名稱可以當 topo 線索</h2>
<p>ROCKTOPO列中央稜最高5.9、悪魔のエチュード5.10b、シリアル5.11a、ノースマウンテン5.12a與任侠道5.13a。本文只把它們作為不同目標的查找線索，不提供保護點或核心動作建議。若想挑戰高階目標，先選一條符合已知戶外能力的線，再安排熟悉岩區和保守暖身；不要把回程壓力帶進最後一把。</p>
<h2>入場資訊與固定點公告</h2>
<p><a href="https://www.oganoclimbing.com/%E8%A4%87%E8%A3%BD-%E4%BC%9A%E5%93%A1%E5%90%91%E3%81%91%E7%89%B9%E5%88%A5%E6%A1%88%E5%86%85%E6%97%A5%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6">小鹿野攀岩協會的入山頁</a>要求入山攀岩者重新確認其注意事項，但本次取得的可讀正文未包含完整規則。各岩區目前的會員、登記及開放條件，本篇未能完整核實，出發前應直接向協會確認；本文不宣稱二子山全區開放。若無法確認指定區的使用資格，就不應把它排成已確定的攀登日。</p>
<p><a href="https://freeclimb.jp/access/10079/">JFA於2024年12月的公告</a>記錄広場區「青い瞳のセリーヌ」第一個 bolt 脫落。本篇未取得修復完成資訊，這是要追查的個別路線問題，不能推論其他線安全。另有<a href="https://freeclimb.jp/access/6829/">JFA的如廁提醒</a>，要求至少把衛生紙帶走；實際安排仍應遵守最新在地規則，提前使用合法廁所並做好攜出準備。</p>
<h2>交通和岩況決定是否值得排</h2>
<p>CLIMBING-net以坂本側林道、國道299號作接近線索，並提醒雨季和夏季滲水。精確公共交通銜接、當前林道與停車條件，本篇未核實。建議讓熟悉當地的同行者確認接送和最晚離場時間，或在附近住宿，減少當天移動壓力。四月也須看近期雨量，不能只看當天晴天就判斷岩場乾燥。</p>
<p>建議示例：在使用資格與交通都確認後，只選一個可用區域、少量目標，先完成現場辨識再上攀。把濕壁、現場禁用告示、找不到可靠下降資訊，列為更改行程的理由。本文的功能是幫你判斷能否規劃二子山，並不是當日入場許可、固定點檢查紀錄或替代 topo。</p>
<h2>參考資料</h2>
<ul>
<li><a href="https://www.rocktopo.net/areas/92">二子山 | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E4%BA%8C%E5%AD%90%E5%B1%B1/">二子山</a></li>
<li><a href="https://freeclimb.jp/access/10079/">アクセス情報：埼玉県・二子山 - ボルト破損</a></li>
<li><a href="https://freeclimb.jp/access/6829/">【注意喚起(エリア関連)：埼玉県・二子山】</a></li>
<li><a href="https://www.oganoclimbing.com/%E8%A4%87%E8%A3%BD-%E4%BC%9A%E5%93%A1%E5%90%91%E3%81%91%E7%89%B9%E5%88%A5%E6%A1%88%E5%86%85%E6%97%A5%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6">二子山への入山について | 一般社団法人小鹿野クライミング協会</a></li>
</ul>
<p><a href="/blog/faba26d85e4f809578c41ec9e2f7ca02">繁體中文</a> · <a href="/en/blog/679d2da9f72094d2de6d55fc4a739c8e">English</a> · <a href="/ja/blog/0a0d30a5b4a4f89339e7d3b2a993db9e">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('faba26d85e4f809578c41ec9e2f7ca02', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('faba26d85e4f809578c41ec9e2f7ca02', '岩場指南');
DROP TABLE _blog_article_guard;
