-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/1b2a18866f18fd1a3b01da67b0a2d9bf.md
-- source-sha256: ff53f390c4a94911e1f841f06a398a9290fffb636d813953a02ca068ac331f1b
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '1b2a18866f18fd1a3b01da67b0a2d9bf' OR slug = 'tenno-iwa-climbing-guide-en') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('1b2a18866f18fd1a3b01da67b0a2d9bf', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'tenno-iwa-climbing-guide-en', 'Tenno-iwa climbing guide: a lead-climbing day in Akikawa', 'Plan Tenno-iwa''s climbing, bus approach and fishery-related parking and facility restrictions.', '<h2>Who this day suits</h2>
<p>Tenno-iwa is a natural crag in Yozawa, Akiruno, Tokyo. This guide is for partners already able to lead and belay outdoors: it helps you decide whether the climbing and the journey fit a day of your trip. Climbers with only indoor bouldering experience should arrange outdoor instruction or experienced local support first.</p>
<p><a href="https://www.climbing-net.com/iwaba_detail/%E5%A4%A9%E7%8E%8B%E5%B2%A9/">CLIMBING-net&#39;s venue guide</a> describes chert, called チャート in Japanese, with many routes in the 5.10 and 5.11 ranges on vertical to slightly overhanging rock. Those grades help narrow a shortlist, but the actual topo, protection and your outdoor experience should determine the route you choose.</p>
<h2>Choose the sector before choosing the climb</h2>
<p><a href="https://www.rocktopo.net/areas/111">ROCKTOPO&#39;s Tenno-iwa page</a> distinguishes upper and lower crags and also records bouldering. These disciplines require different equipment. Agree with your partner which sector and which climbs you intend to visit; this article plans around roped climbing.</p>
<p>The publisher notes a northwesterly aspect and cold winter conditions. For a spring trip, review recent rain and assess the rock on arrival rather than treating a year-round season label as a promise of dry climbing. Start below your usual outdoor limit so you can assess the holds, footholds and descent before committing to harder objectives.</p>
<h2>The bus connection matters</h2>
<p>The publisher&#39;s access description uses Musashi-Itsukaichi Station, a Yozawa-bound bus and the Sorigobashi stop, followed by the designated path beside the road. Check both outbound and return buses for your actual date before setting your departure time. Rail travel to the station is only one part of the day; this guide does not promise a fixed timetable or a total journey time from Shinjuku.</p>
<p>Avoid the former road toward the crematorium: the guide records a landowner request not to use it. The nearby trout fishery car park, adjoining roadside and material-storage area above the crag are not climbing parking. Drivers can investigate legitimate parking at Jurigi, allowing for the extra walking or bus connection.</p>
<h2>Arrange supplies and a departure time</h2>
<p>The fishery is not a climbing service facility. Both sources warn against unauthorized use of its toilets. Use facilities before the approach, bring your day&#39;s food and water and carry rubbish out. If you patronize the fishery shop or restaurant, ask about facility rules rather than assuming a purchase grants access.</p>
<p>Opening and approach conditions for your actual visit date have not been confirmed. Check current management notices before travelling; database listings do not establish permission. Agree on a time to leave the wall, with enough margin for packing ropes, walking and waiting for the bus. A few well-planned climbs make a more workable day than one extra attempt that puts the return connection at risk.</p>
<h2>References</h2>
<ul>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E5%A4%A9%E7%8E%8B%E5%B2%A9/">山と溪谷社 CLIMBING-net — 天王岩</a></li>
<li><a href="https://www.rocktopo.net/areas/111">ROCKTOPO — 天王岩</a></li>
</ul>
<h2>Other languages</h2>
<p><a href="/blog/90992eb1ee13ff8fc149773ec213bedf">繁體中文</a> · <a href="/en/blog/1b2a18866f18fd1a3b01da67b0a2d9bf">English</a> · <a href="/ja/blog/e581bf0c98b450fee3b3325aa169cdc1">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('1b2a18866f18fd1a3b01da67b0a2d9bf', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('1b2a18866f18fd1a3b01da67b0a2d9bf', '岩場指南');
DROP TABLE _blog_article_guard;
