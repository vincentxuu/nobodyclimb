-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/3bd5d63c9d8194fc6a547792b33ed6e7.md
-- source-sha256: 1907491d57f70c91ee6bf3562edab0efb5150a86b46900f42353ad6187665cb0
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '3bd5d63c9d8194fc6a547792b33ed6e7' OR slug = 'kitagawa-climbing-guide-en') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('3bd5d63c9d8194fc6a547792b33ed6e7', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'kitagawa-climbing-guide-en', 'Kitagawa climbing guide: walking from Nishi-Agano to an overhanging crag', 'Review Kitagawa''s overhangs, descent questions, Nishi-Agano approach and community parking requirements.', '<h2>For partners with an overhang objective</h2>
<p>Kitagawa is a natural crag in Hanno, Saitama, approached on foot from Nishi-Agano. It suits partners already able to lead and belay outdoors. If your group needs numerous easy lines, examine the distribution before making this the day&#39;s venue.</p>
<p><a href="https://www.climbing-net.com/iwaba_detail/%E5%8C%97%E5%B7%9D/">CLIMBING-net</a> highlights the large overhang and lists chert, or チャート. <a href="https://www.rocktopo.net/areas/95">ROCKTOPO</a> recorded 19 face-climbing lead routes when read on 12 October 2026, including 5.10, 5.11 and 5.12 ranges. This community snapshot is not an access list, and a few easier lines do not guarantee availability for a beginner group.</p>
<h2>Read about descent and cleaning first</h2>
<p>The publisher distinguishes the finishing anchors above the overhang from anchors used for retrieval, and records rope drag, old slings and ageing protection. These descriptions help identify questions to ask; they do not replace an actual topo or on-site judgment.</p>
<p>Before travelling, confirm length, finish, descent and equipment recovery for your shortlist. If cleaning an overhanging route is unfamiliar, its grade alone is not a reason to start it. Arrange knowledgeable support or choose an objective you can manage from start to finish.</p>
<h2>Walk from Nishi-Agano with time in hand</h2>
<p>The publisher&#39;s outline starts at Nishi-Agano on the Seibu railway, passes Zenshoji and reaches the Nakagumi community hall, with a path beside it. Walking estimates differ within the page, so follow the route outline without relying on a guaranteed number of minutes. Rail and walking also avoid the limited local parking.</p>
<p>Pack water and lunch and identify the return train and a descent deadline before setting out. The guide records residents&#39; request that climbers leave before dark. End attempts early enough to pack and walk while there is still daylight.</p>
<h2>Payment and quiet use are part of the arrangement</h2>
<p><a href="https://freeclimb.jp/access/10214/">JFA&#39;s May 2025 notice</a> relays residents&#39; concerns about unpaid agreed parking charges of ¥500 per car and inefficient parking in a small space. It is a dated local request, not a promise of a future rate. Confirm current payment instructions and parking arrangements; if full, change plans rather than use the roadside.</p>
<p>The publisher explains that the crag is also a place of local belief and climbing depends on landowner and community understanding. Avoid shouting, flames, abandoned equipment and excessive chalk marks; greet residents and explain your visit. Paying for parking does not remove those responsibilities.</p>
<p>Use and parking conditions for your actual visit date have not been confirmed. The publisher&#39;s spring and autumn preference helps with planning, but recheck notices, rainfall and on-site instructions before your climbing day.</p>
<h2>References</h2>
<ul>
<li><a href="https://www.rocktopo.net/areas/95">ROCKTOPO — 北川</a></li>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E5%8C%97%E5%B7%9D/">山と溪谷社 CLIMBING-net — 北川</a></li>
<li><a href="https://freeclimb.jp/access/10214/">日本フリークライミング協会 JFA — 北川</a></li>
</ul>
<h2>Other languages</h2>
<p><a href="/blog/ca9339e1ccb8ed108c5404f374ec48c9">繁體中文</a> · <a href="/en/blog/3bd5d63c9d8194fc6a547792b33ed6e7">English</a> · <a href="/ja/blog/539a55b775755912bb59b30b8edc855d">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('3bd5d63c9d8194fc6a547792b33ed6e7', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('3bd5d63c9d8194fc6a547792b33ed6e7', '岩場指南');
DROP TABLE _blog_article_guard;
