-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/2b1fad5f50c738e4d0600022edc266ae.md
-- source-sha256: 8fbaa424adcf1cd64f8d497dc98f5d4d13cc9ff9f730b9d45294ede85fbc1d0c
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '2b1fad5f50c738e4d0600022edc266ae' OR slug = 'takatoriyama-climbing-guide-en') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('2b1fad5f50c738e4d0600022edc266ae', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'takatoriyama-climbing-guide-en', 'Takatoriyama guide: registration before a park top-rope day', 'Plan Takatoriyama around mandatory registration, council instructions, predominantly top-rope climbing and the park''s trail notices.', '<h2>Public park access is not unrestricted climbing access</h2>
<p>Takatoriyama is a park crag in Yokosuka, Kanagawa, that can suit a prepared top-rope day during a Tokyo trip. Registration and management conditions come first. Seeing climbers or routes on the wall does not authorize you to set up a rope and join them.</p>
<p>The <a href="https://www.city.yokosuka.kanagawa.jp/5560/sisetu/fc00000978.html">official Yokosuka park page</a> says rock climbing is generally prohibited, with an exception for following Takatoriyama Safety Mountaineering Council instructors and the specified rules. It requires registration with the council. Contact the council through the details on the page to confirm participation and instruction arrangements. If the conditions are not met, visit the park without climbing.</p>
<h2>Understand the top-rope emphasis</h2>
<p><a href="https://www.rocktopo.net/areas/115">ROCKTOPO&#39;s Takatoriyama page</a> also requires registration and says routes are principally climbed on top rope. A top rope passes through an anchor above the climber, but that does not mean anyone can build or inspect the system. Anchors, rope paths, equipment and belaying still require competence.</p>
<p>Although the database places many lines in a lead/face category, the area&#39;s description emphasizes top roping. Do not infer permission to lead from the category alone. Confirm allowed activities and rules with the council before selecting routes; a grade or video is not a substitute for instruction. A team with different abilities still needs shared checks and clear belaying responsibilities.</p>
<h2>Use official park transport information</h2>
<p>The city describes vertical walls created by past quarrying. Its access directions use the Shonan Takatori housing-estate loop bus from Keikyu Oppama Station to Takatori Shogakko, followed by approximately ten minutes on foot. The page also says the park has no car park. These are directions to the park, not identical approach times for every climbing sector.</p>
<p>Check actual outbound and return buses and use permitted paths. Drivers must not treat a database parking link as a park-provided space; establish lawful parking separately and avoid residential roads or obstructing entrances. Allow for equipment handling and other park visitors.</p>
<h2>Adjust the route around closure notices</h2>
<p>At the research date, the city page still listed the trail between the rock-carved Buddha and the water distribution reservoir as closed because of rockfall, from 8 June 2025 with no reopening date. The Buddha remained viewable. This notice concerns a trail section, not proof that the whole park or every climbing sector is closed. It does not permit bypassing barriers to reach a climb.</p>
<p>Registration acceptance, instruction arrangements and trail reopening on your travel date were not verified in this research; confirm with the council and the city&#39;s latest notices before departure. A park described as open year-round does not allow unrestricted climbing at any time.</p>
<p>Prepare in this order: contact the council, meet the conditions, then plan the top-rope day. Bring water, food, personal protection and equipment required for the activity. Without permission or the necessary anchor competence, do not climb. Registration and public-space rules are part of enjoying this quarry landscape.</p>
<h2>References</h2>
<ul>
<li><a href="https://www.city.yokosuka.kanagawa.jp/5560/sisetu/fc00000978.html">鷹取山公園</a></li>
<li><a href="https://www.rocktopo.net/areas/115">鷹取山 | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
</ul>
<p><a href="/blog/7bb10cb94d8c3c8ed95394f052e9927a">繁體中文</a> · <a href="/en/blog/2b1fad5f50c738e4d0600022edc266ae">English</a> · <a href="/ja/blog/c39656362f8fc1cfdbc2a36837b9135b">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('2b1fad5f50c738e4d0600022edc266ae', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('2b1fad5f50c738e4d0600022edc266ae', '岩場指南');
DROP TABLE _blog_article_guard;
