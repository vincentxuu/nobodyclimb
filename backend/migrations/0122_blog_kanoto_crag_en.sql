-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/af5833584555468d1d9b8279473c03c6.md
-- source-sha256: 9a812907d8e79a26f6d261befcf24f6b5c3d44fb73a6b8ea670c1d7446ab1c00
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = 'af5833584555468d1d9b8279473c03c6' OR slug = 'kanoto-crag-climbing-guide-en') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('af5833584555468d1d9b8279473c03c6', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'kanoto-crag-climbing-guide-en', 'Kanoto climbing guide: distinguish the crag from the gorge', 'Plan the compact limestone Kanoto crag without confusing its approach with the no-climbing Kanoto-iwa gorge.', '<h2>The name is essential navigation information</h2>
<p>Kanoto no Iwaba is a compact limestone crag in the Hinohara area of Tokyo. It suits outdoor rope climbers with a clear route objective. The first planning task is to distinguish the climbing crag from the sightseeing destination Kanoto-iwa.</p>
<p><a href="https://www.climbing-net.com/iwaba_detail/%E7%A5%9E%E6%88%B8%E3%81%AE%E5%B2%A9%E5%A0%B4/">CLIMBING-net</a> explicitly distinguishes them and says climbing at Kanoto-iwa is prohibited. Road signs for the gorge do not establish that the tourist cliffs are your climbing destination. Share a topo and the crag approach with partners rather than just a map of the similarly named attraction.</p>
<h2>The approach passes through residents&#39; surroundings</h2>
<p>The publisher describes taking a Fujikura- or Koiwa-bound bus from Musashi-Itsukaichi to Kanoto-iwa Iriguchi. Its approach via Kasuga Shrine, a small red bridge and a stream beside homes differs from continuing to the sightseeing gorge. Confirm actual bus services, paths and passage arrangements before departure.</p>
<p>The source asks visitors to greet residents and pass quietly beside a residential yard. It says there is no parking around Kasuga Shrine and prohibits parking on road shoulders and the space beside the community hall. If using the fishing-site parking described in the source, explain your purpose at reception and follow the operator&#39;s directions. Current parking acceptance, fees and approach conditions were not verified in this research; confirm them before departure rather than treating an older description as parking permission.</p>
<p>Public transport can remove the need to find parking at the entrance, but it requires checking your return. Plan the bus, walk and climbing together, leaving enough time to get back instead of spending every remaining minute on a final attempt.</p>
<h2>A compact crag can still have long lines</h2>
<p>The publisher describes compact limestone with several right-hand lines exceeding 20 metres. The <a href="https://www.rocktopo.net/areas/103">ROCKTOPO area page</a> helps identify recorded face routes. A small crag does not mean uniformly short climbs, and a rope routinely used indoors is not automatically sufficient for outdoor lowering or descent.</p>
<p>Confirm actual route length, anchor, descent and equipment before packing. Route totals describe a database&#39;s choices, not current climbability or a checklist for the day. In a team with varied abilities, give everyone an appropriate objective with a retreat option.</p>
<h2>Respect the approach as part of the crag</h2>
<p>Avoid noise around homes, obstructing entrances and unauthorized parking. These actions affect whether the day can begin properly. The source also prohibits camping or sleeping in vehicles in the fishing-site parking area, so plan accommodation separately.</p>
<p>This guide did not inspect current opening or fixed protection; obtain a recent topo and condition and approach information before departure, and do not enter when notices or passage arrangements prevent it. The crag&#39;s appeal is limestone climbing with longer lines in a compact setting, reached through the correct approach with respect for the people living nearby.</p>
<h2>References</h2>
<ul>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E7%A5%9E%E6%88%B8%E3%81%AE%E5%B2%A9%E5%A0%B4/">神戸の岩場</a></li>
<li><a href="https://www.rocktopo.net/areas/103">神戸の岩場 | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
</ul>
<p><a href="/blog/c9291664b2c87caf58701928ae1d1cc8">繁體中文</a> · <a href="/en/blog/af5833584555468d1d9b8279473c03c6">English</a> · <a href="/ja/blog/b9b323658d9f5ff525d4e28d1e77a140">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('af5833584555468d1d9b8279473c03c6', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('af5833584555468d1d9b8279473c03c6', '岩場指南');
DROP TABLE _blog_article_guard;
