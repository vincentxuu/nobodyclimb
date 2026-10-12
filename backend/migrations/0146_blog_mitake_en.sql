-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/48613c56b82390b44b67702d629eb6ba.md
-- source-sha256: a59893da3a7070d53642c573879116a2b74c16b37913ff408c21fd3e6a633ae7
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '48613c56b82390b44b67702d629eb6ba' OR slug = 'mitake-climbing-guide-en') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('48613c56b82390b44b67702d629eb6ba', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'mitake-climbing-guide-en', 'Mitake bouldering guide: river rocks, pads and local rules', 'Plan Mitake as an outdoor bouldering day, with suitable problems, crash pads and respect for paths, parking and cleaning rules.', '<h2>This is a river-bouldering guide</h2>
<p><a href="https://www.rocktopo.net/areas/108">ROCKTOPO&#39;s Mitake Boulder page</a> covers chert bouldering in Tokyo, with rocks such as Ninja-gaeshi and Hikage Rock. This article does not combine nearby rope crags into a lead-climbing guide. If your trip is planned around ropes and quickdraws with no bouldering, Mitake is not an equivalent substitute: arrange crash pads and assess outdoor bouldering skills separately.</p>
<p>It suits visitors who want outdoor bouldering during a city trip and can assess landings and fall consequences. Gym-only boulderers should find someone familiar with Mitake and start on low problems with manageable landings. Indoor grades do not establish the safety of river rocks. Check height, wet surfaces, stones and landing space on site; pads are not a guarantee at every height.</p>
<h2>Choosing problems and equipment</h2>
<p>ROCKTOPO lists マミ岩中央 at Japanese grade 4-kyu and 忍者返し at 1-kyu as popular problem references. These are names and grades from the database, not guaranteed recommendations. Use a topo to identify the rock, start and finish, then inspect the landing. If reality differs from a photo, do not force an attempt to tick a name. Getting familiar with the rock and choosing manageable landings is a sensible first-day aim.</p>
<p>The <a href="https://freeclimb.jp/kantou-area/4891/">JFA Mitake page</a> records pad, brush and climbing-shoe rental at Maunga near Mitake Station. This is a rental lead; this article has not verified the shop&#39;s day-specific stock, prices or hours. If you are not bringing pads, confirm reservations, collection and return times and transport to the rocks before travelling.</p>
<h2>Rules for a shared riverbank</h2>
<p>JFA notes that anglers, paddlers and tourists also use Mitake: do not block paths or make excessive noise, and brush off chalk after climbing. Night bouldering, fires and overnight tents outside campsites are prohibited. Keep pads and bags clear of walkways, notice other users before moving, and avoid turning the path into a waiting area for your group.</p>
<h2>Transport, parking and an April visit</h2>
<p>Use the Mitake Station area as a planning starting point, then arrange walking and equipment collection for the chosen rocks. Exact trains from Tokyo and total travel time have not been verified here; check your travel date. Drivers can investigate the parking areas JFA lists at Kanzanji, Mitake Exchange Center and Mitake Enchi. ROCKTOPO says the toilet-front parking above Gyokudo Art Museum is for toilet use, not an all-day bouldering stay. An empty space is not permission.</p>
<p>ROCKTOPO includes April in its season reference. Still check rain, riverbank access and dry rock; no specific day&#39;s water level or access condition has been verified here. Suggested example: collect pads first, choose one sector in the morning, brush after climbing and leave in time for returns. If post-rain landings or paths are hard to assess, switch to indoor bouldering. This is a planning suggestion, not a daily condition guarantee.</p>
<h2>References</h2>
<ul>
<li><a href="https://www.rocktopo.net/areas/108">御岳ボルダー | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
<li><a href="https://freeclimb.jp/kantou-area/4891/">東京・御岳ボルダー</a></li>
</ul>
<p><a href="/blog/5a344696cd02ef57df38a2864f25997c">繁體中文</a> · <a href="/en/blog/48613c56b82390b44b67702d629eb6ba">English</a> · <a href="/ja/blog/8062be3f3deec2302597d0c88a01f1dd">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('48613c56b82390b44b67702d629eb6ba', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('48613c56b82390b44b67702d629eb6ba', '岩場指南');
DROP TABLE _blog_article_guard;
