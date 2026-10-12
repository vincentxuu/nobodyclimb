-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/44a849fc8c33070654fbaf80c966bd2d.md
-- source-sha256: d2664071209c30ef9a39e25b8feb3b6d85ed7d0bde1dc6a764ab120403a52028
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '44a849fc8c33070654fbaf80c966bd2d' OR slug = 'jogasaki-climbing-guide-en') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('44a849fc8c33070654fbaf80c966bd2d', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'jogasaki-climbing-guide-en', 'Jogasaki climbing guide: choosing a coastal crack area in Izu', 'Plan an Izu coastal climbing day around crack skills, the chosen sector and a workable approach and exit.', '<h2>Who it suits and what to choose first</h2>
<p>Jogasaki is a collection of coastal sectors around Ito in Shizuoka, rather than a single wall with one entrance. <a href="https://www.rocktopo.net/areas/9">ROCKTOPO&#39;s Jogasaki page</a> lists crack leads, face leads, boulders and multipitch routes. <a href="https://tommy-climbing.com/rocks/cn8/pg257.html">Local guide TOMMY CLIMBING CLUB</a> describes the coast from Futo to Akazawa as predominantly crack climbing. Choose a sector and climbing style before choosing your arrival station.</p>
<p>If cracks are your aim, assess your ability to place and evaluate natural protection, select the appropriate rack, establish belays and retreat. An indoor lead grade does not answer those questions. If these skills are new, arrange a guide familiar with the selected sector and make the day an introduction to cracks rather than an independent attempt on a seemingly easy route.</p>
<h2>Choosing sectors and routes</h2>
<p>ROCKTOPO identifies the rock as andesite and separates crack from face routes; Jogasaki should not be treated as primarily a sport crag. Names such as Purple Shadow, listed at 5.8, and Peter Pan, listed at 5.10b, are useful leads for locating a topo, rather than approved recommendations for your day. TOMMY&#39;s Yawatano information distinguishes natural protection from bolted routes, with mixed protection on some lines. Seeing bolts does not establish that quickdraws alone are sufficient.</p>
<h2>Travel and approach: plan by sector</h2>
<p>TOMMY uses Izu-Kogen Station as a meeting point for its Yawatano outings and mentions accommodation around Izu-Kogen, Jogasaki-Kaigan and Futo. That is the guide&#39;s arrangement, not a shared entrance for every sector. Before booking, agree on the selected sector&#39;s entrance, walking route, any rappel approach and the exit. Exact trains from Tokyo and a complete door-to-door travel time have not been verified here; do not treat a travel note&#39;s estimate as a timetable.</p>
<h2>Coastal conditions and a realistic day</h2>
<p>TOMMY warns about deterioration of fixed coastal equipment and the need to inspect tree anchors. Check sea conditions, tides, wind and the actual stance, even if photographs show dry rock. If you cannot assess the coastal setting, do not rappel in before establishing an exit. ROCKTOPO highlights December through April as its season reference, which does not guarantee conditions on a particular day. For an April trip, keep the outdoor day flexible rather than tying your only climbing day to a sea cliff.</p>
<p>Suggested example: stay in Izu the previous night and visit one confirmed sector in the morning. Make learning the approach, checking protection and trying one or two conservative objectives the core of the day. If conditions are unsuitable, switch to a coastal walk or indoor climbing. This is an editorial planning example, not a verified guiding package or a route-specific gear list.</p>
<h2>References</h2>
<ul>
<li><a href="https://www.rocktopo.net/areas/9">城ヶ崎 | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
<li><a href="https://tommy-climbing.com/rocks/cn8/pg257.html">JYOGASAKI YAWATANO│TOMMY CLIMBING CLUB</a></li>
</ul>
<p><a href="/blog/d050b303d8cb720b212a12e15e918dcc">繁體中文</a> · <a href="/en/blog/44a849fc8c33070654fbaf80c966bd2d">English</a> · <a href="/ja/blog/7c531718bd0f487b7372ac297244329c">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('44a849fc8c33070654fbaf80c966bd2d', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('44a849fc8c33070654fbaf80c966bd2d', '岩場指南');
DROP TABLE _blog_article_guard;
