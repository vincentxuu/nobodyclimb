-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/7eef70c42822bcb8025353d418e8f4e0.md
-- source-sha256: 0dec2f295b33da3f8268ce0ca889afd998c612604099cb71b30f8fc664d0355f
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '7eef70c42822bcb8025353d418e8f4e0' OR slug = 'tengu-iwa-climbing-guide-en') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('7eef70c42822bcb8025353d418e8f4e0', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'tengu-iwa-climbing-guide-en', 'Tengu-iwa guide: the waterfall-side crag in Hinohara', 'Identify the Hinohara Tengu-iwa listed alongside Tsuzura-iwa, and plan around its waterfall-side setting and limited route detail.', '<h2>Identify the particular Tengu-iwa</h2>
<p>This article concerns the Hinohara-area Tengu-iwa described alongside Tsuzura-iwa by <a href="https://www.climbing-net.com/iwaba_detail/%E3%81%A4%E3%81%A5%E3%82%89%E5%B2%A9%E3%80%81%E5%A4%A9%E7%8B%97%E5%B2%A9/">CLIMBING-net</a>: a wall beside a waterfall. The purpose is to identify this specific destination for Tokyo visitors. Searching only the common name and following the nearest map result is insufficient.</p>
<p>It has a different approach from Tsuzura-iwa on the ridge, so make a separate decision about visiting it. If a partner sends a photograph without a location or topo, establish which crag it shows before discussing difficulty or equipment. This guide does not use the similarly named Tenno-iwa as an alternative name or navigation point.</p>
<h2>A shorter approach still requires a complete plan</h2>
<p>The publisher estimates a 30-minute approach to Tengu-iwa and identifies a bus from Musashi-Itsukaichi to Senzoku as the starting point. That differs from its hour-and-a-half estimate for Tsuzura-iwa. It does not mean a 30-minute total journey from central Tokyo or an arrival time every visitor can reproduce.</p>
<p>Check outbound and return services for your actual travel date, then identify the path from Senzoku to the intended wall. Mark the bus stop, climb and waterfall viewpoint separately to avoid discovering that a sightseeing destination is not your route. Agree in advance that unsuitable post-rain footing may end the outing.</p>
<h2>What the sources establish—and leave open</h2>
<p>CLIMBING-net mentions free routes developed on the waterfall-side wall. Its relative phrase about recent development has no clear date, so it is not evidence of a recent re-equipping programme. The <a href="https://www.rocktopo.net/areas/101">shared ROCKTOPO page</a> establishes the listing, but the retrieved page did not provide a complete route-by-route climbing plan for Tengu-iwa.</p>
<p>This guide did not verify current grades, lengths, fixed protection or descents for Tengu-iwa&#39;s individual routes and does not offer a grade-based recommendation list. If you obtain a recent topo, check that it covers this waterfall-side wall rather than only Tsuzura-iwa. Ask someone familiar with it about routes and current conditions before choosing it for your team.</p>
<p>The shared publisher page also discusses older piton openings and slings without mapping that warning to every Tengu-iwa route. Do not turn it into a universal instruction, or assume that unspecified routes need no anchor assessment. Equipment should follow the actual objective and conditions.</p>
<h2>When to keep it on your shortlist</h2>
<p>Experienced outdoor rope climbers willing to obtain specific topo, approach and descent information can keep Tengu-iwa as a research candidate for a Hinohara day. A name and approximate walking time are insufficient for a firm climbing commitment. The issue is preparation, rather than a popularity ranking.</p>
<p>Share the crag identity, map, objectives and return plan with partners; prepare water, food, rain protection and lighting. If you cannot establish the location, protection or retreat, do not begin climbing. Completing that preparation makes the waterfall wall a purposeful destination.</p>
<h2>References</h2>
<ul>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E3%81%A4%E3%81%A5%E3%82%89%E5%B2%A9%E3%80%81%E5%A4%A9%E7%8B%97%E5%B2%A9/">つづら岩、天狗岩</a></li>
<li><a href="https://www.rocktopo.net/areas/101">つづら岩、天狗岩 | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
</ul>
<p><a href="/blog/843cf5663149a378e12125ac8ae990dc">繁體中文</a> · <a href="/en/blog/7eef70c42822bcb8025353d418e8f4e0">English</a> · <a href="/ja/blog/9ae4f485fe4c3c2d7d7a866d9b511286">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('7eef70c42822bcb8025353d418e8f4e0', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('7eef70c42822bcb8025353d418e8f4e0', '岩場指南');
DROP TABLE _blog_article_guard;
