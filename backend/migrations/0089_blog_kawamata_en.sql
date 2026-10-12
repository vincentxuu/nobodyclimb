-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/35cbd4d53e55dc61ee5640f58190600d.md
-- source-sha256: 5fc0f0c38a8dfdb2cdc51272a89d0c2a933d1ef329b6809a4078f591ab233b34
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '35cbd4d53e55dc61ee5640f58190600d' OR slug = 'kawamata-climbing-guide-en') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('35cbd4d53e55dc61ee5640f58190600d', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'kawamata-climbing-guide-en', 'Kawamata climbing guide: Naguri limestone and the Hebi-iwa collapse notice', 'Plan Kawamata''s limestone objectives and Hanno bus access, starting with JFA''s Hebi-iwa collapse notice.', '<h2>Read the warning before choosing a wall</h2>
<p>Kawamata is a limestone climbing area in Shimo-Naguri, Hanno, Saitama. This guide is for partners with outdoor lead-climbing experience who want to separate transport, route selection and access checks. The name covers several sectors, whose approaches and conditions should be considered individually.</p>
<p>Start with<a href="https://freeclimb.jp/access/10282/">JFA&#39;s October 2025 Hebi-iwa collapse notice</a>. The association reports a collapse, says details are unclear and asks climbers to stay away for the time being. This dated notice does not establish that all of Kawamata is closed; continued database listings also do not establish that Hebi-iwa has reopened.</p>
<h2>Select a specific limestone objective</h2>
<p><a href="https://www.climbing-net.com/iwaba_detail/%E6%B2%B3%E5%8F%88/">CLIMBING-net&#39;s guide</a> describes vertical to overhanging limestone with many routes in the 5.10 and 5.11 ranges. <a href="https://www.rocktopo.net/areas/94">ROCKTOPO&#39;s area index</a> shows multiple sectors. Choose a named wall and actual routes, then obtain their topo rather than treating the entire index as one freely accessible venue.</p>
<p>For a travel day, shortlist an easier opening climb and a possible project. The publisher records ageing protection, deteriorated slings and loose-rock concerns. Rebolting is not a guarantee for an entire wall, so match equipment and descent planning to the actual route.</p>
<h2>Hanno to the bus, with the return planned first</h2>
<p>The transport outline is a Naguri-bound bus from Hanno or Higashi-Hanno to Kawamata Naguriko Iriguchi. <a href="https://www.saitamabus.jp/app/routebusstop/busstop/stopid/11-24126">Saitama&#39;s bus association listing</a> confirms connections with Hanno; check services for your visit date. The publisher describes an approach from the Osuzawa limestone-cave sign. Use it as a clue and compare it with current local directions.</p>
<p>Set the return bus and the time to leave the wall before allocating attempts. A published walking time is not a promise for a group carrying heavy equipment on unfamiliar paths. If signs, entrances or terrain do not match the topo, stop and reconfirm.</p>
<h2>Parking rules take priority over map spaces</h2>
<p>ROCKTOPO records a local agreement to use the paid riverside parking. The publisher retains older parking details; such differences are a reason to confirm the designated facility, payment and hours locally rather than copy an old guide. Do not occupy short-stay toilet parking or move a barrier without authorization.</p>
<p>The same <a href="https://www.climbing-net.com/iwaba_detail/%E6%B2%B3%E5%8F%88/">CLIMBING-net description</a> records a lifting of a ban in 2010 near its beginning, but its “Other” field still says コウモリ岩 is prohibited in principle. The scope of those statements and the update date of the latter have not been established. The historical lifting does not establish current access to that sector. Retain this warning, confirm the intended sector with those responsible, and do not enter コウモリ岩 without confirmation.</p>
<p>Hebi-iwa&#39;s reopening and the use conditions of other sectors on your actual visit date have not been confirmed. Keep Kawamata conditional until current permission and rock conditions can be established. Bring food and water, arrange toilet needs beforehand, carry rubbish out and avoid flames. These preparations also reduce the burden on the people who live beside the climbing area.</p>
<h2>References</h2>
<ul>
<li><a href="https://www.rocktopo.net/areas/94">ROCKTOPO — 河又</a></li>
<li><a href="https://freeclimb.jp/access/10282/">日本フリークライミング協会 JFA — 河又</a></li>
<li><a href="https://www.saitamabus.jp/app/routebusstop/busstop/stopid/11-24126">埼玉県バス協会 — 河又名栗湖入口</a></li>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E6%B2%B3%E5%8F%88/">山と溪谷社 CLIMBING-net — 河又</a></li>
</ul>
<h2>Other languages</h2>
<p><a href="/blog/5e435298b3f0aefaa8f64a209f252ab8">繁體中文</a> · <a href="/en/blog/35cbd4d53e55dc61ee5640f58190600d">English</a> · <a href="/ja/blog/4c9b21b244fc4b4377bc5a242c083c77">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('35cbd4d53e55dc61ee5640f58190600d', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('35cbd4d53e55dc61ee5640f58190600d', '岩場指南');
DROP TABLE _blog_article_guard;
