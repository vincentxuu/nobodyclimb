-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/c78784d147efe236d7b3cf29c9342a9c.md
-- source-sha256: 6d623bb891e38dd6d7cb499ce27e473ec77bbe10d30e9064698a3a737c3a5c80
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = 'c78784d147efe236d7b3cf29c9342a9c' OR slug = 'hikawa-byobuiwa-climbing-guide-en') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('c78784d147efe236d7b3cf29c9342a9c', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'hikawa-byobuiwa-climbing-guide-en', 'Hikawa Byobu-iwa guide: varied climbing above Okutama', 'Understand Hikawa Byobu-iwa''s slabs, overhangs, approach and older protection before planning a day from Tokyo.', '<h2>Choose the terrain before the grade</h2>
<p>Hikawa Byobu-iwa is in Hikawa, Okutama, Tokyo. It is worth considering for climbers with outdoor rope experience who are comfortable identifying sectors and routes from a topo. Access on foot from a railway station is appealing, but proximity to a station does not establish that every route has straightforward modern protection.</p>
<p><a href="https://www.climbing-net.com/iwaba_detail/%E6%B0%B7%E5%B7%9D%E5%B1%8F%E9%A2%A8%E5%B2%A9/">CLIMBING-net&#39;s description</a> traces the crag from aid climbing to free-route development during the 1980s. It describes slabs on A Peak, overhanging terrain on C Peak and roofs. A slab is a relatively low-angle face; a roof has a much steeper, ceiling-like angle. These features demand different movement, stamina and rope management. Selecting a sector is more useful than selecting only a grade.</p>
<h2>A station approach still needs preparation</h2>
<p>The publisher gives approximately 30 minutes on foot from Okutama Station. It distinguishes a stream approach from a ridge approach and identifies the stream route for フクロウ岩. Treat that time as a source estimate, allowing extra time for route finding, rest and unsuitable footing while carrying equipment.</p>
<p>The same page says roadside parking is not permitted and recommends using the station toilet and bringing water. Use Okutama Station as the public-transport planning point, then check trains for your actual date and return journey. A short map distance is no reason to skip food and water preparation or assume an unmarked space is lawful parking.</p>
<h2>Older routes require questions beyond the grade</h2>
<p>The description warns of some fragile rock and recommends longer slings for C Peak anchors. A <a href="https://www.rocktopo.net/rocks/1671">ROCKTOPO rock page</a> contains user reports about moss, pitons, ring bolts and difficulty identifying an anchor. These individual reports do not establish that every anchor is defective. They identify useful questions for someone familiar with the crag.</p>
<p>Determine the peak, intended anchor, descent method and equipment before committing. If you cannot assess or arrange the required anchor, go with someone who has the relevant competence or seek suitable instruction. Indoor grades and database route totals do not indicate your safety margin or how much you can climb in a day.</p>
<h2>Interpret seasonal descriptions carefully</h2>
<p>CLIMBING-net identifies the rock as chert and describes relatively good drying after rain and warmth in winter. These are general descriptions, rather than permission to climb immediately after rainfall. This guide did not verify the present moisture, moss or fixed-protection condition of each route; assess each line on arrival.</p>
<p>Prepare a short list of identifiable objectives and an alternative plan. Confirm sectors in the topo, carry water and equipment, and reserve time for the descent and train home. If the approach or rock is unsuitable, cancel the climbing. The variety of the terrain and the crag&#39;s history are part of its appeal, and careful interpretation belongs in the visit.</p>
<h2>References</h2>
<ul>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E6%B0%B7%E5%B7%9D%E5%B1%8F%E9%A2%A8%E5%B2%A9/">氷川屏風岩</a></li>
<li><a href="https://www.rocktopo.net/rocks/1671">氷川屏風岩 | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
</ul>
<p><a href="/blog/82e5ced58bcad87924ada8646bd4e3b2">繁體中文</a> · <a href="/en/blog/c78784d147efe236d7b3cf29c9342a9c">English</a> · <a href="/ja/blog/395cb55a029370fe1c56cd80f6ede51a">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('c78784d147efe236d7b3cf29c9342a9c', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('c78784d147efe236d7b3cf29c9342a9c', '岩場指南');
DROP TABLE _blog_article_guard;
