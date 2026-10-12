-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/584437e6e66e29a1702a4779de0a9c7e.md
-- source-sha256: 9eaf76db3d79729e52f05e3e3dd731f3a73ba79f7369b6e715ad2375aa99cb27
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '584437e6e66e29a1702a4779de0a9c7e' OR slug = 'shirotae-bashi-climbing-guide-en') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('584437e6e66e29a1702a4779de0a9c7e', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'shirotae-bashi-climbing-guide-en', 'Shirotaebashi climbing guide: Okutama limestone and unresolved access status', 'Understand Shirotaebashi''s limestone and transport background while its voluntary non-use status remains unresolved.', '<h2>Resolve access before planning a climbing day</h2>
<p>Shirotaebashi is an Okutama limestone venue with roped routes. It can enter a Tokyo-trip research list, but this article does not recommend it as confirmed available. For experienced partners comparing 5.11 and 5.12 objectives, the wall and transport background help explain why permission must come before booking and route selection.</p>
<p><a href="https://www.climbing-net.com/iwaba_detail/%E7%99%BD%E5%A6%99%E6%A9%8B/">CLIMBING-net&#39;s page</a> retains a record of JFA calling for voluntary non-use from April 2007 because of rubbish, abandoned equipment, fire and parking problems, and asks readers to check the current situation. Its age neither proves the original restriction remains unchanged nor establishes that it was lifted.</p>
<h2>A limestone selection weighted toward harder climbs</h2>
<p>The publisher describes vertical to distinctly overhanging limestone and emphasizes 5.11 and 5.12 routes. <a href="https://www.rocktopo.net/areas/110">ROCKTOPO&#39;s index</a> lists the front wall, Balcony Face, Kawara Face, Dimple Face and Ivy Face. These entries explain the sectors; they do not establish opening status.</p>
<p>A team seeking many routes graded 5.9 or easier may find this a poor fit. Partners interested in harder limestone should obtain the complete topo for their chosen wall, after confirming access. Database route counts are not a management-approved climbing list for a particular day.</p>
<h2>Transport background from Okutama</h2>
<p>The publisher describes a Nippara-bound bus from Okutama to Shirotaebashi, then a suspension bridge toward the front wall. This is a transport outline, not confirmation that the bridge or entrance is usable on your date. Establish permission first, then check return services and walking arrangements. No fixed total travel time from Shinjuku is promised.</p>
<p>Older driving information mentions reception and parking at Trout Country and prohibits roadside parking, especially beside the bus stop. Keep the prohibition in mind without treating the old parking fee as a current quote. Paying for parking does not establish climbing permission at a separate wall.</p>
<h2>Keep an alternative until the status is clear</h2>
<p>Whether Shirotaebashi&#39;s voluntary non-use request has been lifted, and climbing and approach permission for your actual visit date, have not been confirmed. Ask an appropriate management or local climbing contact for the current position. If no clear answer is available, choose a venue with confirmed use conditions rather than make this your only outdoor day.</p>
<p>Recent database activity only shows that people submitted information; it does not prove landowner consent. The publisher also stresses community relations and conservation: remove quickdraws and equipment, avoid fires and carry rubbish out. These remain relevant even if permission is later confirmed.</p>
<h2>Turn the check into a clear decision</h2>
<p>Resolve three questions before equipment planning: which sector may be entered, which approach is allowed, and where parking and toilet needs can be handled. Each needs a concrete answer. This approach lets you understand Shirotaebashi&#39;s climbing character without hiding unresolved access behind a travel guide.</p>
<h2>References</h2>
<ul>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E7%99%BD%E5%A6%99%E6%A9%8B/">山と溪谷社 CLIMBING-net — 白妙橋</a></li>
<li><a href="https://www.rocktopo.net/areas/110">ROCKTOPO — 白妙橋</a></li>
</ul>
<h2>Other languages</h2>
<p><a href="/blog/765b73392af400eacd36fec66a9b0513">繁體中文</a> · <a href="/en/blog/584437e6e66e29a1702a4779de0a9c7e">English</a> · <a href="/ja/blog/5c1f7dd326e222ca8162fcde107f3559">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('584437e6e66e29a1702a4779de0a9c7e', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('584437e6e66e29a1702a4779de0a9c7e', '岩場指南');
DROP TABLE _blog_article_guard;
