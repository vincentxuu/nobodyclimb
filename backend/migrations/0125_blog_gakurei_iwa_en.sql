-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/8a57b4ba16e86e3c07ccc9a2068eb344.md
-- source-sha256: 626a62005a92de4b192724ab24b314fa4048ab7ab834e59fbe8bf5bc6f0ff328
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '8a57b4ba16e86e3c07ccc9a2068eb344' OR slug = 'gakurei-iwa-climbing-guide-en') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('8a57b4ba16e86e3c07ccc9a2068eb344', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'gakurei-iwa-climbing-guide-en', 'Gakurei-iwa guide: five riverside towers in Nippara', 'Explore Gakurei-iwa''s riverside towers with careful route identification, older-protection assessment and current approach checks.', '<h2>Narrow the objective to a particular wall</h2>
<p>Gakurei-iwa is a group of rock towers on the Nippara River in Okutama, Tokyo. It is a candidate for outdoor rope climbers prepared to investigate older routes and protection. An easy database grade is not sufficient preparation; know which tower you intend to climb before reaching the river.</p>
<p><a href="https://www.climbing-net.com/iwaba_detail/%E5%B2%B3%E5%B6%BA%E5%B2%A9/">CLIMBING-net</a> identifies five towers: the larger A, B and C, and the smaller D and E. A single area name can cover different starts and routes. Give partners the target tower and route name rather than just a shared coordinate.</p>
<h2>Use the database to understand the options</h2>
<p>The <a href="https://www.rocktopo.net/areas/106">ROCKTOPO area page</a> records face routes. Its <a href="https://www.rocktopo.net/rocks/2226">C-to-E tower page</a> includes ポパイ・ス・スキ at 5.10b, 鬼門 at 5.11b and ロック・スピリット at 5.12b. These are database grades, not NobodyClimb field assessments. A face-route label does not establish modern, complete bolt protection.</p>
<p>Choose a candidate appropriate to your abilities, then obtain the corresponding topo, length, anchor and descent information. If names or positions differ between sources, ask someone familiar with the crag instead of identifying a line by grade alone. A route list cannot replace a shared understanding of the objective and retreat.</p>
<h2>Separate fixed protection from movement difficulty</h2>
<p>The publisher warns that many lines use ring bolts or pitons, and that forceful nailing may have changed grades. Protection reliability and movement difficulty need separate assessment. A low grade does not remove uncertainty about protection, rock or descent.</p>
<p>This article does not teach aid climbing, nailing or anchor construction, nor does it suggest that visitors solve problems by adding protection. If you cannot assess the existing protection, identify the anchor and retreat safely, obtain skills or suitable instruction first, or drop the destination. Arriving with sport quickdraws and only then asking how to descend is too late.</p>
<h2>Confirm transport and access before Nippara</h2>
<p>The publisher describes a bus from Okutama Station to Higashi-Nippara followed by an approximately 20-minute walk, noting a shorter approach from Naka-Nippara on weekdays. This is source information, not a guarantee of services on your travel date. Check the day&#39;s outbound and return buses and the path from the road to the river.</p>
<p>Current bus stops, approach passage, parking permission and fixed-protection condition were not verified in this research; obtain recent information before departure rather than parking or entering solely from an older page. The source&#39;s year-round season description, with cold winters, is a climate clue rather than a promise of suitable climbing every day.</p>
<p>Prepare five essentials: tower, route, protection, descent and return. Carry water, food, rain protection and lighting, and consider riverside conditions and retreat time. The interest is in the older routes across five towers, best explored with a particular plan.</p>
<h2>References</h2>
<ul>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E5%B2%B3%E5%B6%BA%E5%B2%A9/">岳嶺岩</a></li>
<li><a href="https://www.rocktopo.net/areas/106">岳嶺岩 | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
<li><a href="https://www.rocktopo.net/rocks/2226">C峰～E峰 | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
</ul>
<p><a href="/blog/52fa6a72b2179173608991efd3bd602f">繁體中文</a> · <a href="/en/blog/8a57b4ba16e86e3c07ccc9a2068eb344">English</a> · <a href="/ja/blog/bcedf8485d7ea87fa0001f82d0a54ff8">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('8a57b4ba16e86e3c07ccc9a2068eb344', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('8a57b4ba16e86e3c07ccc9a2068eb344', '岩場指南');
DROP TABLE _blog_article_guard;
