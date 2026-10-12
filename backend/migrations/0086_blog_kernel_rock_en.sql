-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/3404251672a20c98c78d55609045d1f8.md
-- source-sha256: adcd956db07093d432bea5d4f51f9b242d6dce56f3dc7390255f7c73712cd2ea
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '3404251672a20c98c78d55609045d1f8' OR slug = 'kernel-rock-climbing-guide-en') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('3404251672a20c98c78d55609045d1f8', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'kernel-rock-climbing-guide-en', 'Kernel Rock climbing guide: planning a small limestone crag', 'Compare Kernel Rock''s small limestone selection, Hinatawada approach and unconfirmed access arrangements.', '<h2>A compact crag needs a clear objective</h2>
<p>Kernel Rock, written カーネルロック locally, is a small natural crag in Tokyo. For a roped-climbing partnership on a city trip, its appeal is a focused shortlist rather than a large choice of climbs. Check that both partners have suitable objectives before allocating a day, especially if a mixed-ability group expects many alternatives.</p>
<p><a href="https://www.rocktopo.net/areas/1797">ROCKTOPO&#39;s area page</a> lists limestone and, when read on 12 October 2026, seven face-climbing lead routes. That is a community database snapshot, not an official route inventory or confirmation that every recorded climb is available on your visit date.</p>
<h2>Match the wall shape to your objective</h2>
<p><a href="https://www.rocktopo.net/rocks/8264">The main-wall listing</a> includes プレイヤー (5.9), セント・フローリア (5.10a), ぶらり (5.10c) and カモン・エディ！ (5.11a). Descriptions mention a small overhang on the central line and flakes and pockets through a more pronounced overhang on another. Keep the Japanese names when matching a proper topo to the wall.</p>
<p>A grade alone does not describe the movement: an overhanging start can ask something different from continuous vertical climbing within the same grade range. Shortlist an easier starting climb and a project. If a line is crowded or unsuitable, a small crag offers fewer alternatives, so keep the objective flexible.</p>
<h2>Plan access without assuming parking permission</h2>
<p><a href="https://beta-climbing.com/lesson/weekday_climbing_club">BETA Climbing&#39;s outdoor activity page</a> places the crag in Ome and describes roughly five minutes on foot from JR Hinatawada. This is an activity-planning reference, not independent visitor permission. The main-wall page says Rose Town Tea Garden parking is reportedly usable. That qualified note does not establish the business&#39;s consent or unrestricted visitor parking. Use the location to investigate rail travel, walking or a transfer, then confirm the entrance, approach and facility rules locally.</p>
<p>No management notice has been obtained for Kernel Rock, and entry, parking and fees have not been confirmed. If you cannot reach someone who can confirm them, keep an alternative venue with clear access arrangements. Do not arrive expecting to cross business property or use an informal roadside space. The roughly five-minute figure is attributed only to that activity description; this guide has not verified an independent visitor’s approach or duration on the visit date, shop hours or parking fees.</p>
<h2>Let the chosen routes determine equipment</h2>
<p>The database helps identify climbs, but the text obtained does not support a universal rope length or quickdraw count. Obtain a complete topo for your actual objectives, confirm route length, descent and protection requirements, and check the equipment with your partner before packing.</p>
<p>The season field favours cooler months; treat it as a planning clue rather than a forecast of dry rock. Keep the day flexible if the rock is wet, the approach unclear or use conditions differ from expectations. This compact venue makes most sense for climbers who have confirmed access and bring a small set of specific objectives.</p>
<h2>References</h2>
<ul>
<li><a href="https://www.rocktopo.net/areas/1797">ROCKTOPO — カーネルロック</a></li>
<li><a href="https://www.rocktopo.net/rocks/8264">ROCKTOPO — カーネルロック</a></li>
<li><a href="https://beta-climbing.com/lesson/weekday_climbing_club">BETA Climbing — カーネルロック</a></li>
</ul>
<h2>Other languages</h2>
<p><a href="/blog/a11b01e0adba7d6b2cfd364b88cbfcac">繁體中文</a> · <a href="/en/blog/3404251672a20c98c78d55609045d1f8">English</a> · <a href="/ja/blog/5b87e2eda04aaa15d696f3b1dbf5056d">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('3404251672a20c98c78d55609045d1f8', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('3404251672a20c98c78d55609045d1f8', '岩場指南');
DROP TABLE _blog_article_guard;
