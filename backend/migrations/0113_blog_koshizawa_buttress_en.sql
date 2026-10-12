-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/289373c784da996c3ce737cd070e62de.md
-- source-sha256: 92ce0203ae36cf7fc61302aec0c3c72aa15f8baae6affb3f833fefbda1637a15
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '289373c784da996c3ce737cd070e62de' OR slug = 'koshizawa-buttress-climbing-guide-en') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('289373c784da996c3ce737cd070e62de', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'koshizawa-buttress-climbing-guide-en', 'Koshizawa Buttress guide: plan an Okutama multipitch day', 'Koshizawa Buttress is primarily a multipitch training crag. Check team systems, descent and current access before making it a Tokyo day trip.', '<h2>The objective is a functioning rope team</h2>
<p>Koshizawa Buttress is an Okutama multipitch crag for teams already able to manage belays, bring up a second and descend. Multipitch climbing divides a route into stages with intermediate belays. Its time and technical demands differ from a single sport pitch belayed from the ground.</p>
<p><a href="https://www.climbing-net.com/iwaba_detail/%E8%B6%8A%E6%B2%A2%E3%83%90%E3%83%83%E3%83%88%E3%83%AC%E3%82%B9/">CLIMBING-net</a> describes a wall approximately 80 metres high and 70 metres wide, primarily used for multipitch climbing and training for mountain routes. Those dimensions explain the wall&#39;s scale; they do not establish a particular route&#39;s climbing length or the ropes required. Plan a suitable complete outing instead of a day of accumulating grades.</p>
<h2>An easy grade is only one piece of information</h2>
<p><a href="https://www.rocktopo.net/areas/102">ROCKTOPO&#39;s area page</a> categorizes its recorded main lines as multipitch. A database is not a complete operating manual. Names and grades are insufficient if you cannot identify intermediate belays and descents.</p>
<p>Establish who will lead, who can belay the second, who can assess anchors and how you will communicate out of sight. Keep cancelling the climb as a valid option. If one person is the sole keeper of all the systems, practise in a controlled setting or arrange appropriate instruction first.</p>
<h2>Assess rock edges and fixed protection separately</h2>
<p>The publisher questions the reliability of fixed protection. It also warns of sharp edges and past rope-cutting accidents. These issues are distinct from movement difficulty: being able to climb the moves does not establish that you can manage an unsafe rope path or unreliable protection.</p>
<p>Build the equipment list around the intended route and current conditions, including protection, anchors, descent and personal protection. Do not copy a quickdraw count from an unrelated sport crag. This article does not teach anchor construction or descent procedures. Review the topo and retreat options with someone experienced, and do not enter a section you cannot assess.</p>
<h2>Plan the approach and return as part of the climb</h2>
<p>Identify the start, approach, descent and exit together. They may follow different paths, so a saved wall coordinate is insufficient. Public-transport visitors need the actual outbound and return services for their date, plus a turnaround time that leaves room for retreat. Sorting equipment, locating the line and waiting for other teams all take time.</p>
<p>A <a href="https://npo.mirokuyamanokai.org/2024/06/07/56265">Miroku mountaineering club report from May 2024</a> records approximately 30 minutes from Hatonosu Station to the climb. Use Hatonosu as a transport-planning point, but treat the time as that team&#39;s observation, not a guarantee of current trail passage or your walking speed. Check trains for your date and obtain the current approach and descent description.</p>
<p>CLIMBING-net mentions a maintenance contribution, but the present fee, approach facilities and fixed-protection condition were not verified in this research; confirm them with relevant management or climbers familiar with the area before departure, rather than treating an older description as a current guarantee. If this information is missing, obtain it before committing the day.</p>
<p>Choose Koshizawa Buttress for a purposeful day using the full skills of mountain climbing. Bring a plan your team can manage independently, leave room for retreat and retain another activity if conditions do not support the climb.</p>
<h2>References</h2>
<ul>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E8%B6%8A%E6%B2%A2%E3%83%90%E3%83%83%E3%83%88%E3%83%AC%E3%82%B9/">越沢バットレス</a></li>
<li><a href="https://www.rocktopo.net/areas/102">越沢バットレス | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
<li><a href="https://npo.mirokuyamanokai.org/2024/06/07/56265">越沢バットレス自主トレ</a></li>
</ul>
<p><a href="/blog/dafce096fb5fe98e910208925e4c9aa9">繁體中文</a> · <a href="/en/blog/289373c784da996c3ce737cd070e62de">English</a> · <a href="/ja/blog/a81faf4baa85bd50e89afdc78a1c805f">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('289373c784da996c3ce737cd070e62de', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('289373c784da996c3ce737cd070e62de', '岩場指南');
DROP TABLE _blog_article_guard;
