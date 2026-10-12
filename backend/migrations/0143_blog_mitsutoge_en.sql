-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/5756dd674ad7adc331afd511c9954f78.md
-- source-sha256: 4acd3bf3e7240d000ad77a4487adfc66bbdc8b9c5919fde4dbdde245a9bf1bab
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '5756dd674ad7adc331afd511c9954f78' OR slug = 'mitsutoge-climbing-guide-en') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('5756dd674ad7adc331afd511c9954f78', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'mitsutoge-climbing-guide-en', 'Mitsutoge climbing guide: budgeting the approach, belays and descent', 'Plan this mountain venue around the walking approach and rope systems, with realistic return transport and route-specific equipment.', '<h2>The hike belongs in the climbing plan</h2>
<p>Mitsutoge&#39;s climbing is below the mountain summit in Yamanashi, with objectives around Byobu Rock. <a href="https://www.climbing-net.com/iwaba_detail/%E4%B8%89%E3%83%84%E5%B3%A0/">CLIMBING-net&#39;s venue guide</a> divides it into right, central and left faces, describing face, crack, aid and multipitch climbing. It can add a mountain-oriented day to a Tokyo trip, provided the ascent and descent on foot are included in the climbing plan.</p>
<p><a href="https://www.rocktopo.net/areas/8">ROCKTOPO records three rope-climbing categories at Mitsutoge</a> and identifies agglomerate rock. Suitability is not settled by the presence of easier lines: a multipitch team needs route finding, belay transitions, rope management, descent and independent retreat skills. Without those skills, choose supervised instruction with someone familiar with the venue rather than using low grades to justify an independent attempt.</p>
<h2>Choose a learning objective before a face</h2>
<p>The publisher describes varied face and crack climbing on the right face, steeper and aid climbing on the central face, and classic free routes on the left. On a first visit, choose a concrete aim such as getting familiar with the rock on single pitches or practising multipitch systems, then select appropriate routes from a current topo. Avoid combining objectives from different faces without accounting for movement and belay time.</p>
<h2>The station name does not define the approach</h2>
<p>The <a href="https://www.fujikyu-railway.jp/sightseeing/hiking.php">Fujisanroku Electric Railway hiking page</a> points to a bus from Kawaguchiko toward Tenkachaya, getting off at Mitsutoge Trailhead, and also mentions walking from Mitsutoge Station. These are different entrances. The publisher estimates about 2.5 to 3 hours on foot from the station and describes a separate approach from parking on the rear trail. Those are approach references, not measured door-to-door travel times from Tokyo.</p>
<p>Return buses for a specific date, hut bookings and road conditions have not been fully verified here. Agree on the entrance with the trip leader, check that day&#39;s transport and work backward from the return to set the time to leave the wall. If descent and walking cannot fit, do not schedule multipitch. Staying nearby can reduce travel pressure, but older hut and camping descriptions are not current permission.</p>
<h2>Season, loose rock and the pace of the day</h2>
<p>The publisher gives April to October as a season reference; ROCKTOPO lists April, May, June, July, September and October. April is a planning cue, not proof that cold or remaining snow is absent. Check mountain conditions and weather. CLIMBING-net specifically warns about loose rock on ledges, rockfall triggered by ropes and climbers below, and calls for helmets and route-appropriate slings and other gear. A training venue still requires mountain judgment.</p>
<p>Suggested example: stay nearby the previous night, approach in the morning and attempt one main objective. Finish early enough for descent, rope packing and the hike out. If rock conditions, route identification or belays are uncertain, change to a simpler supervised activity or retreat. This article has no route-specific rope-length or belay table; a complete topo and competent partners are the next steps toward an executable plan.</p>
<h2>References</h2>
<ul>
<li><a href="https://www.rocktopo.net/areas/8">三ツ峠 | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E4%B8%89%E3%83%84%E5%B3%A0/">三ツ峠</a></li>
<li><a href="https://www.fujikyu-railway.jp/sightseeing/hiking.php">ウォーキング＆ハイキング | 富士山に一番近い鉄道 富士急行線 富士山麓電気鉄道株式会社</a></li>
</ul>
<p><a href="/blog/64fa975558f3a9f80501f6babd512ce8">繁體中文</a> · <a href="/en/blog/5756dd674ad7adc331afd511c9954f78">English</a> · <a href="/ja/blog/3306805c1c133d5be7e7fbf8ed510ec6">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('5756dd674ad7adc331afd511c9954f78', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('5756dd674ad7adc331afd511c9954f78', '岩場指南');
DROP TABLE _blog_article_guard;
