-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/f9c33618b02b1700c394aeb058870e5a.md
-- source-sha256: 798da824a9d6f9b48132c9680eb72e6639ccffb21c59660a9b6a0b95f2aaaf2a
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = 'f9c33618b02b1700c394aeb058870e5a' OR slug = 'izu-joyama-climbing-guide-en') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('f9c33618b02b1700c394aeb058870e5a', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'izu-joyama-climbing-guide-en', 'Izu Joyama climbing guide: choosing between slabs, sport and multipitch', 'Match Joyama''s varied sectors to your climbing skills, then plan an approach from Ohito and enough time to return.', '<h2>More than one style of climbing</h2>
<p>Joyama is near Ohito in Shizuoka&#39;s Izu region. <a href="https://www.climbing-net.com/iwaba_detail/%E5%9F%8E%E5%B1%B1/">CLIMBING-net&#39;s venue guide</a> describes both the South Face slabs and sectors such as Wild Boar Gorge, listing bolted leads and multipitch climbing. It suits visitors who can manage outdoor belaying with their partners. If your experience is limited to gyms, book outdoor instruction or a guide rather than interpreting the presence of easier routes as independent access.</p>
<p><a href="https://www.rocktopo.net/areas/10">ROCKTOPO&#39;s Joyama page</a> separates face leads from multipitch routes and identifies tuff. The <a href="https://izugeopark.org/geosites/joyama/">Izu Peninsula Geopark</a> describes the landscape as an exposed volcanic root. That geological explanation does not assess anchors or access status. A South Face single-pitch day, a multipitch objective and a visit to an upper sector require different plans.</p>
<h2>Choose your objective with a topo</h2>
<p>ROCKTOPO lists Battle Runner with a maximum grade of 5.10a, Stone Free at 5.10c and Miura at 5.11a. Use these names to locate detailed topos. A maximum grade says nothing by itself about pitch lengths, protection or descent. This guide supplies no move-by-move beta: confirm the sector, whether the route is single- or multipitch, rope requirements and retreat. With mixed abilities, prioritize single-pitch objectives everyone can take part in.</p>
<h2>Start from Ohito without mixing approaches</h2>
<p>CLIMBING-net describes an approach from Ohito Station on the Izu-Hakone Railway: about 25 minutes on foot to the trailhead, then 10 minutes to the South Face. Wild Boar Gorge has a separate approach. These are the publisher&#39;s estimates, not a guarantee for your travel day. Look up trains to Ohito and use a current topo for the final section; do not apply South Face times to every sector. Current parking capacity, fees and comprehensive access status have not been verified with a managing body here.</p>
<h2>Season and day planning</h2>
<p>Season descriptions use different scopes: CLIMBING-net gives late September through early June, while ROCKTOPO highlights November through March. Treat them as planning references, not a promise of cool, dry conditions on any April date. Check recent rainfall, actual rock conditions and wind before keeping the outdoor plan. Bolts do not imply that every anchor has been inspected; bring route-specific equipment and have someone competent assess conditions.</p>
<p>Suggested example: stay in Ohito or nearby the previous night and dedicate the first day to the South Face, without adding upper sectors. Learn the terrain and descent before selecting a small number of objectives, and reserve time for walking and transfers. For multipitch, budget belay transitions, rope management and descent, with an explicit turnaround time. These are editorial suggestions, not NobodyClimb&#39;s firsthand ascent report.</p>
<h2>References</h2>
<ul>
<li><a href="https://www.rocktopo.net/areas/10">城山 | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E5%9F%8E%E5%B1%B1/">城山</a></li>
<li><a href="https://izugeopark.org/geosites/joyama/">城山 | 南から来た火山の贈りもの | 伊豆半島ジオパーク公式サイト</a></li>
</ul>
<p><a href="/blog/846b2bf6c46598816c9c71352d76080c">繁體中文</a> · <a href="/en/blog/f9c33618b02b1700c394aeb058870e5a">English</a> · <a href="/ja/blog/f902725d10853b2ce13782a94ae46efd">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('f9c33618b02b1700c394aeb058870e5a', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('f9c33618b02b1700c394aeb058870e5a', '岩場指南');
DROP TABLE _blog_article_guard;
