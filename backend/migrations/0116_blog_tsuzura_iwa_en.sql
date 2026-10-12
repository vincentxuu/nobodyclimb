-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/42334c89066afb25b1b265431e5c4296.md
-- source-sha256: 73e3e4a493c156e2aea8d1ec2d0dac4db98ad3be3479680e0a87e67d767e26e5
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '42334c89066afb25b1b265431e5c4296' OR slug = 'tsuzura-iwa-climbing-guide-en') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('42334c89066afb25b1b265431e5c4296', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'tsuzura-iwa-climbing-guide-en', 'Tsuzura-iwa guide: a mountain approach and climbing day', 'Plan Tsuzura-iwa as a mountain training day with a long approach, suitable rope skills and a clear return plan.', '<h2>The climbing day starts on the trail</h2>
<p>Tsuzura-iwa is a climbing crag on the Mazukari ridge in Tokyo. Consider it when you want loaded walking and rope work in the same day, with a mountain-training objective. If a trip leaves only one free day, first decide how much of it you want to spend walking and how much on the rock.</p>
<p><a href="https://www.climbing-net.com/iwaba_detail/%E3%81%A4%E3%81%A5%E3%82%89%E5%B2%A9%E3%80%81%E5%A4%A9%E7%8B%97%E5%B2%A9/">CLIMBING-net</a> describes a long-established training crag with an approach of approximately an hour and a half. This is an approach estimate, not the total journey from your Tokyo accommodation. Budget for a mountain outing rather than immediate climbing upon arrival.</p>
<h2>A shared listing does not mean one destination</h2>
<p>Both <a href="https://www.rocktopo.net/areas/101">ROCKTOPO</a> and the publisher list Tsuzura-iwa with Tengu-iwa. They are different walls: Tsuzura-iwa is on the ridge, while Tengu-iwa is beside a waterfall and has a different approach time. Tell partners which crag you intend to visit so that nobody plans around the shorter Tengu-iwa walk.</p>
<p>The publisher identifies a bus from Musashi-Itsukaichi to Senzoku as the access starting point. Check actual services, trails and the start of your climb separately. A bus stop name is not complete navigation. Save an offline map and topo, note the return service, and stop adding objectives once your turnaround time arrives.</p>
<h2>Equipment cannot be inferred from the grade</h2>
<p>The description notes that some older pitons have openings that do not accept a carabiner directly and discusses situations requiring slings. This is a clue about older-route equipment, not a guarantee that an anchor is sound or an instruction to copy a technique without assessing it. A competent person must evaluate protection and retreat options.</p>
<p>The same page mentions 山崎ハングルート with a scale of approximately 30 metres. It is an example of the crag&#39;s history and lines, rather than this guide&#39;s recommended route for a visitor. Select objectives for the whole team, then establish intermediate belays, anchors and descent. If your experience is limited to ground belaying, obtain the necessary skills or suitable instruction first.</p>
<h2>Leave time for walking and retreat</h2>
<p>As an editorial planning recommendation, allow room for equipment sorting, the loaded ascent, route finding, descent and the walk out. Carry water, food, rain protection, a headlamp and suitable walking footwear. A headlamp is a contingency, not a reason to climb until dark.</p>
<p>This guide did not verify current access, trail passability or fixed-protection condition at Tsuzura-iwa; obtain recent information before departure and follow notices on site. A lack of new website comments does not prove closure, while a database entry does not guarantee that an approach is passable.</p>
<p>Tsuzura-iwa is a candidate for a purposeful mountain-training day if the team can manage its route and retreat. If the goal is a few quick sport pitches near Tokyo, compare the approach cost with your available time before choosing this ridge crag.</p>
<h2>References</h2>
<ul>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E3%81%A4%E3%81%A5%E3%82%89%E5%B2%A9%E3%80%81%E5%A4%A9%E7%8B%97%E5%B2%A9/">つづら岩、天狗岩</a></li>
<li><a href="https://www.rocktopo.net/areas/101">つづら岩、天狗岩 | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
</ul>
<p><a href="/blog/e06757387faaa1797f6f6934f2343249">繁體中文</a> · <a href="/en/blog/42334c89066afb25b1b265431e5c4296">English</a> · <a href="/ja/blog/f593da3943f02c8541fd4365a2e857de">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('42334c89066afb25b1b265431e5c4296', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('42334c89066afb25b1b265431e5c4296', '岩場指南');
DROP TABLE _blog_article_guard;
