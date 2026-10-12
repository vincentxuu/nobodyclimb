-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/2154ab57f65bc1aded60ed8d4af84d72.md
-- source-sha256: b26a352f78502bd4a743cd8c7da69dcfc80bce3107044cf1c1c6e5d1c444425a
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '2154ab57f65bc1aded60ed8d4af84d72' OR slug = 'shoji-iwa-climbing-guide-en') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('2154ab57f65bc1aded60ed8d4af84d72', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'shoji-iwa-climbing-guide-en', 'Shoji-iwa climbing guide: limestone routes and a bus approach in Hinohara', 'Review Shoji-iwa''s limestone routes, Kanotoiwa Iriguchi approach, season and limited parking.', '<h2>A candidate for limestone objectives around 5.11</h2>
<p>Shoji-iwa is a roped-climbing crag in Ozawa, Hinohara, Tokyo. It suits experienced outdoor lead-climbing partners willing to plan a bus connection and a woodland approach. Being inside Tokyo does not make it an interchangeable substitute for a city gym.</p>
<p><a href="https://www.climbing-net.com/iwaba_detail/%E9%9A%9C%E5%AD%90%E5%B2%A9/">CLIMBING-net</a> lists limestone, vertical to slightly overhanging walls and a substantial 5.11 range. It is a better candidate for climbers who have reviewed a topo and identified objectives than for a group expecting a casual choice of easy climbs.</p>
<h2>Names help with the topo, not equipment condition</h2>
<p><a href="https://www.rocktopo.net/rocks/206">ROCKTOPO&#39;s main-wall page</a> records TNT (5.10b), 夏立ちぬ (5.11a) and ウッシーⅢ (5.12b), among others. Keep the Japanese names for topo matching. A grade and a listing do not establish the condition of bolts or rock on your climbing day; review the start, protection and descent together.</p>
<p>The publisher warns about old bolts, describes poorer summer conditions and favours November through March. An April trip is outside that stated best window, so do not extend the winter recommendation into a promise of dry spring climbing. Begin below your limit and assess movement and protection before raising the difficulty.</p>
<h2>Kanotoiwa Iriguchi is the start of the approach</h2>
<p>The published outline uses a Koiwa-bound bus from Musashi-Itsukaichi to Kanotoiwa Iriguchi. Walk toward Kanotoiwa, cross the first bridge and follow the forest road, then take the mountain path beside a small stream. The publisher describes roughly 15 minutes on each of the road and path; treat these as reference estimates. Shoji-iwa is not the Kanotoiwa sightseeing feature or an interchangeable entrance to neighbouring crags.</p>
<p>Check buses for your actual date and save the topo, transport details and a departure deadline before leaving. Allow additional time for navigation and equipment. If local signs differ from the description, follow them rather than improvise a shortcut.</p>
<h2>Parking space is limited</h2>
<p>ROCKTOPO warns against parking on roads nearer the crag and advises another venue if the designated space is unavailable. The publisher also describes very limited parking. Confirm the actual authorized location and conditions before driving; an empty forest-road shoulder is not a backup.</p>
<p>Approach and climbing conditions for your actual visit date have not been confirmed. Obtain current use information and review rain before committing. Database records do not prove permission. The publisher lists no crag toilet: arrange this before the approach, bring water and lunch, avoid fires and carry rubbish out. A complete travel day includes an orderly return and consideration for the local community.</p>
<h2>References</h2>
<ul>
<li><a href="https://www.rocktopo.net/rocks/206">ROCKTOPO — 障子岩</a></li>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E9%9A%9C%E5%AD%90%E5%B2%A9/">山と溪谷社 CLIMBING-net — 障子岩</a></li>
</ul>
<h2>Other languages</h2>
<p><a href="/blog/b905d673e6be5137348535d62c79011c">繁體中文</a> · <a href="/en/blog/2154ab57f65bc1aded60ed8d4af84d72">English</a> · <a href="/ja/blog/a1aa21c3ea0059ea1b2fbd1489dae93b">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('2154ab57f65bc1aded60ed8d4af84d72', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('2154ab57f65bc1aded60ed8d4af84d72', '岩場指南');
DROP TABLE _blog_article_guard;
