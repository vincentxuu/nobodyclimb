-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/679d2da9f72094d2de6d55fc4a739c8e.md
-- source-sha256: e243055991d60e81f257420ef7bdb89f4ea4ae195c9008dec3226d362ee6bdbf
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '679d2da9f72094d2de6d55fc4a739c8e' OR slug = 'futagoyama-climbing-guide-en') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('679d2da9f72094d2de6d55fc4a739c8e', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'futagoyama-climbing-guide-en', 'Futagoyama climbing guide: limestone objectives and access checks', 'Consider Futagoyama by sector and objective, checking access conditions, anchor notices and a realistic return before travelling.', '<h2>Choose the sector before the grade</h2>
<p>Futagoyama in Ogano, Saitama, features limestone lead and multipitch climbing. <a href="https://www.climbing-net.com/iwaba_detail/%E4%BA%8C%E5%AD%90%E5%B1%B1/">CLIMBING-net</a> describes distinct sectors on the East and West Peaks, including Hokora and Rosoku Rock; <a href="https://www.rocktopo.net/areas/92">ROCKTOPO</a> separates face, crack and multipitch routes. A visitor&#39;s first decision should be how the specific intended sector may currently be used, before selecting a famous route.</p>
<p>It suits teams with outdoor leading skills who can change objectives when conditions require. The publisher describes walls extending into substantial overhangs. If the team wants an easy day on lower grades, first inspect the actual topo&#39;s options and the travel commitment. A Chuo Ridge multipitch objective and single-pitch routes at Hokora or Yumi require different skills and schedules; one generic Futagoyama day-trip label is not enough.</p>
<h2>Names to use when finding a topo</h2>
<p>ROCKTOPO lists Chuo Ridge with a maximum grade of 5.9, 悪魔のエチュード at 5.10b, シリアル at 5.11a, ノースマウンテン at 5.12a and 任侠道 at 5.13a. These are search leads for different objectives, not protection or crux instructions. For a harder project, choose a line matching demonstrated outdoor skills and allow time to learn the sector and warm up conservatively. Do not let return-travel pressure dictate a final attempt.</p>
<h2>Entry information and anchor notices</h2>
<p>The <a href="https://www.oganoclimbing.com/%E8%A4%87%E8%A3%BD-%E4%BC%9A%E5%93%A1%E5%90%91%E3%81%91%E7%89%B9%E5%88%A5%E6%A1%88%E5%86%85%E6%97%A5%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6">Ogano Climbing Association&#39;s entry page</a> asks visiting climbers to reread its guidance, but the readable text obtained for this article did not contain the complete rules. Current membership, registration and access conditions for each sector have not been fully verified here; confirm them directly with the association before travelling. This guide does not claim that all of Futagoyama is open. If eligibility for the chosen sector is unclear, do not treat the climbing day as confirmed.</p>
<p>A <a href="https://freeclimb.jp/access/10079/">JFA notice from December 2024</a> reports that the first bolt on 青い瞳のセリーヌ in the Hiroba sector pulled out. No completed repair confirmation was obtained here. Follow up on that specific route; the notice cannot establish the safety of other lines. A separate <a href="https://freeclimb.jp/access/6829/">JFA toilet notice</a> asks visitors at minimum to carry out toilet paper. Follow current local requirements, use established toilets beforehand and prepare to carry waste out as required.</p>
<h2>Travel and conditions determine the plan</h2>
<p>CLIMBING-net references the forest-road approach from Sakamoto and National Route 299 and warns about seepage in the rainy season and summer. Exact public-transport connections and current forest-road and parking conditions have not been verified here. Have a knowledgeable local partner confirm transport and the latest departure time, or stay nearby to reduce travel pressure. Even in April, assess recent rain rather than assuming sunshine means dry rock.</p>
<p>Suggested example: once eligibility and transport are confirmed, choose one available sector and a few objectives, and identify them on site before climbing. Wet rock, a closure sign or missing reliable descent information are reasons to change plans. This guide helps decide whether a Futagoyama visit can be planned; it is not an entry permit, an anchor inspection record or a replacement topo.</p>
<h2>References</h2>
<ul>
<li><a href="https://www.rocktopo.net/areas/92">二子山 | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E4%BA%8C%E5%AD%90%E5%B1%B1/">二子山</a></li>
<li><a href="https://freeclimb.jp/access/10079/">アクセス情報：埼玉県・二子山 - ボルト破損</a></li>
<li><a href="https://freeclimb.jp/access/6829/">【注意喚起(エリア関連)：埼玉県・二子山】</a></li>
<li><a href="https://www.oganoclimbing.com/%E8%A4%87%E8%A3%BD-%E4%BC%9A%E5%93%A1%E5%90%91%E3%81%91%E7%89%B9%E5%88%A5%E6%A1%88%E5%86%85%E6%97%A5%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6">二子山への入山について | 一般社団法人小鹿野クライミング協会</a></li>
</ul>
<p><a href="/blog/faba26d85e4f809578c41ec9e2f7ca02">繁體中文</a> · <a href="/en/blog/679d2da9f72094d2de6d55fc4a739c8e">English</a> · <a href="/ja/blog/0a0d30a5b4a4f89339e7d3b2a993db9e">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('679d2da9f72094d2de6d55fc4a739c8e', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('679d2da9f72094d2de6d55fc4a739c8e', '岩場指南');
DROP TABLE _blog_article_guard;
