-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/7604f1e91f67001a52849073701d8398.md
-- source-sha256: 3c052e95c903be63ccd4a712932e0fae2ca273f1471f087d53925421f680cc49
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '7604f1e91f67001a52849073701d8398' OR slug = 'gozen-iwa-climbing-guide-en') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('7604f1e91f67001a52849073701d8398', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'gozen-iwa-climbing-guide-en', 'Gozen-iwa climbing guide: access rules before limestone routes', 'Plan a visit to Gozen-iwa around its managed access, outdoor leading requirements and limestone route information.', '<h2>Check the whole team&#39;s eligibility first</h2>
<p>Gozen-iwa is a limestone climbing destination in Okutama, Tokyo. It suits experienced outdoor leaders who want a day focused on particular routes. Before choosing those routes, establish how your group can enter and whether every person meets the conditions. A partner who has only just started outdoor rope climbing changes the decision.</p>
<p>The <a href="http://caramba-02.sakura.ne.jp/okutama/area/">Okutama Climbing Center rules</a> describe an intermediate-to-advanced area. They require stable outdoor leading at 5.11 or above, along with sufficient climbing and safety skills. In principle, the same conditions apply to belayers and spectators. This is the manager&#39;s requirement, rather than a threshold NobodyClimb has inferred from the route list.</p>
<h2>Registration and parking are separate tasks</h2>
<p>Everyone entering for the first time must register; unregistered climbers may not enter. On each visit, complete the entry log and record your departure time when leaving. The management page lists a contribution of ¥500 per person per visit. Bring exact change and finish the formalities before approaching the crag. One registered friend does not cover the whole group.</p>
<p>Parking has its own procedures. The management page still describes buying a specified drink, while a <a href="https://wind-scene.com/gozeniwa/">2023 visit report</a> says the vending machine had been removed. The current method of paying the center parking fee was not verified in this research; confirm it with management before departure and follow the instructions on site. Allow time for these formalities instead of budgeting only for the walk.</p>
<p>As an approach reference, the 2023 report describes walking from the parking area beside the Okutama Climbing Center to the crag in under 15 minutes. This is that visit&#39;s observation, not a guarantee of current passage. From your Tokyo accommodation, identify the center and crag first, then confirm public transport, the designated approach and conditions with management instead of following a nearby fishing-site path blindly.</p>
<h2>Use the route list for selection, not permission</h2>
<p><a href="https://www.rocktopo.net/areas/198">ROCKTOPO&#39;s Gozen-iwa page</a> lists routes including ミートテック at 5.10c, ハートブレイク at 5.11a and 蒙古タンメン at 5.12a. These are database grades. An easier route does not waive the entry requirements, and a grade does not establish rope length, quickdraw count, rock stability or descent procedure.</p>
<p>Choose a short list of objectives, then use an up-to-date topo to check lengths, descents and equipment with your partner. If one person wants a hard project, establish whether the other can provide appropriate belaying. Keep the day flexible enough to leave without climbing the intended line.</p>
<h2>Make the rules part of the itinerary</h2>
<p>Management prohibits night entry, unauthorized guiding, new-route development and additional bolts. It warns about rockfall and imperfect fixed protection. Its rules also cover taking rubbish home, avoiding tree cutting and leaving descent hardware in place. Give every member of the group the same rules to read.</p>
<p>For a day from your Tokyo accommodation, confirm eligibility and management instructions first, transport second, and route objectives and equipment last. This guide did not inspect fixed protection on site and does not guarantee access on your travel date; check the approach and notices again before departure. If those conditions remain unclear, an indoor climbing day keeps the trip adaptable.</p>
<h2>References</h2>
<ul>
<li><a href="https://www.rocktopo.net/areas/198">御前岩 | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
<li><a href="https://wind-scene.com/gozeniwa/">はじめての御前岩クライミング｜アプローチや注意事項など</a></li>
<li><a href="http://caramba-02.sakura.ne.jp/okutama/area/">エリア情報 | 奥多摩クライミングセンター</a></li>
</ul>
<p><a href="/blog/4637dfbdbb41eed37e0cbdb1acef3b31">繁體中文</a> · <a href="/en/blog/7604f1e91f67001a52849073701d8398">English</a> · <a href="/ja/blog/954fded07c2b02e46cb4676c2e347ca5">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('7604f1e91f67001a52849073701d8398', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('7604f1e91f67001a52849073701d8398', '岩場指南');
DROP TABLE _blog_article_guard;
