-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/9c0f7fdeb7726a56c75426b0c5d30d0c.md
-- source-sha256: 532b5724ba6648f3e2505eef62286eec0651b9bbd29e77d80c6b0f577ac58480
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '9c0f7fdeb7726a56c75426b0c5d30d0c' OR slug = 'koutakuji-benten-climbing-guide-en') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('9c0f7fdeb7726a56c75426b0c5d30d0c', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'koutakuji-benten-climbing-guide-en', 'Kotakuji and Benten-iwa climbing guide: slab practice in Atsugi', 'Plan Benten-iwa slab practice, the bus and forest-road approach, and private-land training rules.', '<h2>A slab day focused on footwork</h2>
<p>The Kotakuji area is in Atsugi, Kanagawa, with Benten-iwa as its signature slab. Consider it when your outdoor day from Tokyo is about foothold decisions, balance and controlled movement. This guide is for competent roped-climbing partners and beginners arranging instruction; a training venue does not imply unrestricted self-service rope access.</p>
<p><a href="https://www.climbing-net.com/iwaba_detail/%E5%BA%83%E6%B2%A2%E5%AF%BA/">CLIMBING-net</a> highlights Benten-iwa&#39;s slab, lists tuff and distinguishes it from the opposite-bank crag and other rocks. This article focuses on Benten-iwa rather than treating the whole area&#39;s route inventory as choices on one slab.</p>
<h2>Choose the practice before the rope arrangement</h2>
<p>Slab climbing lets you focus on footholds, balance and pacing. Select a route whose climbing, belaying and descent your team can manage, then decide how to practise. The publisher lists lead climbing and top-roping with limitations; this does not mean every part of the wall can be freely rigged for a top-rope.</p>
<p>If arranging instruction, explain whether you want footwork, leading or rope-system practice before the day. Obtain the actual topo, anchors and descent information. A beginner-friendly description cannot replace those details, and this guide does not prescribe a universal rope length or equipment count.</p>
<h2>A bus connection from Hon-Atsugi or Isehara</h2>
<p>The publisher&#39;s transport outline uses Odakyu&#39;s Hon-Atsugi or Isehara station and a bus to Kotakuji Onsen Iriguchi, followed by a walk toward the hot spring and along the forest road beyond the vehicle barrier. Direct buses to the hot spring are described as less frequent, so distinguish the stop names when checking your date.</p>
<p>Drivers should confirm the designated parking in front of Kotakuji Onsen. Do not drive into or park beside the forest road. Deal with local instructions, supplies and toilets before carrying equipment to the wall; older descriptions of convenient or free facilities are not an entitlement.</p>
<h2>Read the private-land rules and training boundaries</h2>
<p><a href="http://mt-farm.info/koutakujiaizen.html">The published Kotakuji preservation-group rules</a> explain that the crag is private land. They require rubbish removal, no tree cutting, no fires and no tents at the crag or parking. The page records a 2016 agreement and says detailed restrictions on crampons and ice tools have been posted at the base since 2019. This does not establish that older route-based boundaries are the current complete permission.</p>
<p>Use conditions and the permitted crampon and ice-tool training area for your actual visit date have not been confirmed. An ordinary rock-climbing visit need not include such training. If that is your purpose, read the base notice and confirm management requirements. Quiet use, clear paths and timely rope removal belong in the practice plan too.</p>
<h2>References</h2>
<ul>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E5%BA%83%E6%B2%A2%E5%AF%BA/">山と溪谷社 CLIMBING-net — 広沢寺・弁天岩</a></li>
<li><a href="http://mt-farm.info/koutakujiaizen.html">MT Farm／広沢寺の岩場を守る会公開資料 — 広沢寺・弁天岩</a></li>
</ul>
<h2>Other languages</h2>
<p><a href="/blog/3776dfb661562fe8179ecbefb91a9c21">繁體中文</a> · <a href="/en/blog/9c0f7fdeb7726a56c75426b0c5d30d0c">English</a> · <a href="/ja/blog/576667d5eb7252593c4bbf1983e09fe9">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('9c0f7fdeb7726a56c75426b0c5d30d0c', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('9c0f7fdeb7726a56c75426b0c5d30d0c', '岩場指南');
DROP TABLE _blog_article_guard;
