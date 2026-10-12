-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/517ad7d94b070775edab4dc5fc40fc23.md
-- source-sha256: 2c3ec78ac5f1498cfda3a3020f0bd191117cc3bcfedb6e0273118698c7f99395
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '517ad7d94b070775edab4dc5fc40fc23' OR slug = 'yugawara-makuiwa-climbing-guide-en') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('517ad7d94b070775edab4dc5fc40fc23', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'yugawara-makuiwa-climbing-guide-en', 'Yugawara Makuiwa climbing guide: sunny rock, bus access and sector restrictions', 'Compare Makuiwa''s sunny short routes and bus approach, separating park charges from climbing permission.', '<h2>A rock-focused day outside central Tokyo</h2>
<p>Yugawara Makuiwa is around Makuyama Park in Yugawara, Kanagawa. It is a candidate for partners who want natural rock with a station-and-bus approach. This guide helps competent roped climbers compare season, transport and sector restrictions; first-time outdoor climbers should arrange suitable instruction.</p>
<p><a href="https://www.yugawara.or.jp/sightseeing/893/">Yugawara&#39;s official tourism page</a> describes good sunshine, winter popularity, short climbs and queues on popular routes. <a href="https://www.climbing-net.com/iwaba_detail/%E5%B9%95%E5%B2%A9/">CLIMBING-net</a> lists tuff and an autumn-to-spring climbing window. These features help with planning, but sunshine does not establish unrestricted access to every wall.</p>
<h2>Choose a sector rather than a total route count</h2>
<p>Makuiwa includes several sectors. The publisher distinguishes the front wall, Chigasaki Rock and others, warning about some upper approaches and prohibited areas. Decide which sector and routes you want, then obtain their topo and access instructions. The entire area&#39;s route count is not the number of climbs available to your team.</p>
<p>Short routes are not automatically forgiving. The publisher specifically cautions that falls on short, less steep lead climbs can be serious. Confirm route choice, belay position, descent and cleaning. A beginner-friendly tourism description does not remove the need for outdoor rope skills.</p>
<h2>Check the actual bus from Yugawara</h2>
<p>The official page lists a bus from JR Yugawara to the Makuyama Park terminus, with an approximate 15-minute ride. The publisher&#39;s older page gives a different approach via Shinryosho-mae. Do not combine them into a fixed timetable: check services, stops and the last return for your actual date before setting the Tokyo departure time.</p>
<p>Allow time to pack ropes, descend from the selected sector and wait for the bus. Drivers should follow current park arrangements and local instructions rather than choose roadsides or visitor spaces for a full climbing day.</p>
<h2>Festival charges and climbing restrictions are separate</h2>
<p>The official page notes entry and parking charges during the Ume no Utage plum festival. Check that year&#39;s dates and charges; older figures are not promised here. Park entry does not replace permission for a particular climbing sector.</p>
<p>CLIMBING-net records a restriction west of Tentomushi Rock and asks users to check JFA. The page does not provide a date sufficient to establish the notice&#39;s current scope, so it cannot define today&#39;s complete boundary. Sector opening boundaries and festival charges for your actual visit date have not been confirmed. Read current management information and local signs; stay out if permission is unclear.</p>
<h2>Keep an alternative in the permitted sector</h2>
<p>Shortlist a primary climb and a backup within the same confirmed permitted sector. This is more workable than wandering between sectors looking for an empty line. Agree on turns with other teams and retain the departure deadline. Use designated park facilities, carry rubbish out and do not camp: the publisher records a ban on camping in Makuyama Park. A focused climbing day should still leave room for other park visitors.</p>
<h2>References</h2>
<ul>
<li><a href="https://www.yugawara.or.jp/sightseeing/893/">湯河原温泉公式観光サイト — 湯河原幕岩</a></li>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E5%B9%95%E5%B2%A9/">山と溪谷社 CLIMBING-net — 湯河原幕岩</a></li>
</ul>
<h2>Other languages</h2>
<p><a href="/blog/55bc53c2ae00be9fa37bf43c61eb3ead">繁體中文</a> · <a href="/en/blog/517ad7d94b070775edab4dc5fc40fc23">English</a> · <a href="/ja/blog/0225e44e1bc9ca45cd60c5f524dfd8d3">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('517ad7d94b070775edab4dc5fc40fc23', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('517ad7d94b070775edab4dc5fc40fc23', '岩場指南');
DROP TABLE _blog_article_guard;
