-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/30860f3340ee9d6b944945e372542527.md
-- source-sha256: 134dbe4b2275cb1472c683fb4be4a59e3da2f0e5ec2033aee67ac6c9021a1743
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '30860f3340ee9d6b944945e372542527' OR slug = 'kogashiyama-climbing-guide-en') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('30860f3340ee9d6b944945e372542527', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'kogashiyama-climbing-guide-en', 'Kogashiyama climbing guide: Fudo Falls sectors and access boundaries', 'Choose an outdoor lead day near Utsunomiya while respecting restricted sectors, landowner conditions and route-specific skills.', '<h2>Who should consider it</h2>
<p>Kogashiyama is an outdoor venue around Utsunomiya in Tochigi. <a href="https://www.climbing-net.com/iwaba_detail/%E5%8F%A4%E8%B3%80%E5%BF%97%E5%B1%B1/">CLIMBING-net&#39;s guide</a> lists bolted leads, multipitch and some top-rope-only routes, identifying the rock as chert. <a href="https://www.rocktopo.net/areas/80">ROCKTOPO</a> predominantly records face leads. There are objectives for different abilities, but the existence of easier routes is not an invitation to climb independently without outdoor rope experience.</p>
<p>Teams with outdoor leading, belaying and cleaning skills can make this a focused route-selection day. Visitors with gym-only experience should go with a guide who knows the venue. If your Tokyo itinerary has few climbing days, first make sure the whole team accepts the travel and approach commitment. A broad route range does not ensure everyone will immediately find a suitable objective.</p>
<h2>Finding an objective around Fudo Falls</h2>
<p>ROCKTOPO organizes photographs and routes under names including Fudo Falls front/left face, right face and far-left face. Its listed popular routes include 競技会ルート at 5.9, ハートブレーカー at 5.10c and 羚羊ハング at 5.11a. Keep the Japanese names when finding a topo so they can be matched on site. Recorded grades are not gear or safety guarantees: check protection, cleaning and whether leading is permitted for each route.</p>
<h2>Landowner conditions come before route counts</h2>
<p>CLIMBING-net records conditions including staying out of the Medaki area, not cutting trees, not leaving belongings at the shrine, no fires, carrying out rubbish and wearing a helmet. ROCKTOPO separately says climbing farther left than the far-left sector is prohibited. Do not assume these names describe the same exact boundary. Locate them using a current topo and signs, and remain within a confirmed sector if unsure. Complete current sector boundaries have not been confirmed with landowners or a managing body here.</p>
<h2>Travel, conditions and your climbing day</h2>
<p>The publisher uses the Kogashiyama southern trailhead parking area and an approximately 30-minute walk as an approach reference. Its public-transport description includes older place names and a discontinued service, so this guide does not reuse those connections or journey times. Arrange accommodation around Utsunomiya or confirmed transport, agree on the meeting point and return with a local leader, then look up trains. Current transfer and parking charges have not been verified; keep the budget flexible.</p>
<p>Both ROCKTOPO and the publisher provide a year-round season reference, but wet surfaces, recent rain and crowding still require judgment. A suggested day starts with one Fudo Falls sector, confirms routes and anchors, then selects a few objectives the whole team can join. Avoid introducing unfamiliar exercises during cleaning. The <a href="https://freeclimb.jp/information/9978/">JFA Kogashiyama accident report</a> documents belay confusion involving mock leading and top-rope cleaning; experienced rope climbers should read it before visiting.</p>
<h2>References</h2>
<ul>
<li><a href="https://www.rocktopo.net/areas/80">古賀志山 | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E5%8F%A4%E8%B3%80%E5%BF%97%E5%B1%B1/">古賀志山</a></li>
<li><a href="https://freeclimb.jp/information/9978/">古賀志事故報告書</a></li>
</ul>
<p><a href="/blog/a2ec5292794db159908646020424553b">繁體中文</a> · <a href="/en/blog/30860f3340ee9d6b944945e372542527">English</a> · <a href="/ja/blog/83848f20009ac20978478f9a18c5ffae">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('30860f3340ee9d6b944945e372542527', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('30860f3340ee9d6b944945e372542527', '岩場指南');
DROP TABLE _blog_article_guard;
