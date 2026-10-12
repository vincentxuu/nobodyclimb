-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/a1b302e1a01cb19b46d6f12c33281e48.md
-- source-sha256: 37eda9e7b43d6c2dcc9483525c0c21df9bc10c114d8271c702d07a66059c05cb
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = 'a1b302e1a01cb19b46d6f12c33281e48' OR slug = 'seoninbong-climbing-guide-en') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('a1b302e1a01cb19b46d6f12c33281e48', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'seoninbong-climbing-guide-en', 'Seoninbong: approach, applications and preparation for Dobongsan cracks', 'Research granite crack climbing in the Dobongsan part of Bukhansan National Park, with station names, park application rules and route-specific planning.', '<h2>Planning this venue</h2>
<p>Seoninbong (선인봉) is in the Dobongsan (도봉산) area on the northeastern side of Bukhansan National Park. The <a href="https://www.mountainproject.com/area/119848026/senin-bong-dobongsan">Mountain Project area description</a> identifies granite and crack climbing. For a Seoul trip focused on traditional multipitch climbing, it deserves its own research rather than a footnote to Insubong.</p>
<p>Sharing granite does not mean the two peaks share routes, descents or transport arrangements. This guide helps identify approach orientation and permission questions. It offers no pitch-by-pitch beta and does not turn community comparisons into a promise of fewer people today.</p>
<h2>Keep the station names distinct</h2>
<p>The community transport description uses Line 1’s Dobongsan Station (도봉산역), not the similarly named Dobong Station (도봉역). Save the Korean station and peak names rather than rely on an abbreviated translation in travel notes. The description points from the station towards Dobongsan; it is not current turn-by-turn navigation.</p>
<p>This guide has not confirmed the complete current approach or its duration; ask the park office or a partner familiar with Seoninbong before leaving. Different lines may require different approach decisions, and a hiking summit time is not a climbing approach time. Drivers should check parking rules afresh. The community page’s uncertain older parking estimate is not reproduced as a current price.</p>
<h2>Rock use is separate from ordinary hiking</h2>
<p>The <a href="https://www.knps.or.kr/smartsafe/permission/list.do">national park rock application portal</a> includes 북한산도봉. Published rules allow applications three to thirty days ahead, release a new date at 10:00 and require teams of two to five people. Final approval by text message is required before using the rock. Resolve this before finalising accommodation and transport, particularly rather than assuming a solo visitor can arrange permission on arrival.</p>
<p>This research has not confirmed availability for a particular Seoninbong wall and date, the applicable sectors or the application process for foreign visitors; ask the park office first. A portal does not establish permission for your route, and weather or current restrictions can still alter the plan. The <a href="https://www.knps.or.kr/front/portal/visit/visitCourseSubMain.do?menuNo=7020092&parkId=121500&parkNavGb=guide">official Bukhansan visitor page</a> also advises checking designated entry times and trail restrictions.</p>
<p>Approval is followed by a same-day confirmation procedure. The <a href="https://www.knps.or.kr/smartsafe/cms/contents.do?cmsSeq=28">official application instructions</a> require confirming the climbing start from within the park through the text-message link and GPS before 16:00, and confirming completion when leaving. Keeping the approval message does not replace these start and completion steps; clarify the details with the park office when applying.</p>
<h2>Let the route determine the equipment</h2>
<p>The community description discusses cracks and traditional protection. That helps explain the climbing character but should not become one rack list for every route. Obtain current information for the chosen line, including pitch lengths, fixed hardware, placements you must make yourself, belay stations and descent. Discuss rope length, the number of descents and possible retreat points together before deciding what to pack.</p>
<p>If you can lead indoors but cannot yet assess crack protection or multipitch descents, choosing a lower grade does not resolve the gap. Enquire with an experienced local leader and explain your climbing and belaying background so you can agree on suitable activities. This article has not verified the availability, prices or qualifications of commercial guiding services and promises no booking.</p>
<h2>When the trip becomes workable</h2>
<p>Once applications and approach questions are resolved and the team can handle the route and descent, Seoninbong becomes a workable mountain day rather than a name on a wish list. Allow the full day for transport, approach, climbing and leaving the mountain. Agree on an alternative for deteriorating weather or slow progress instead of squeezing multipitch climbing into half a city day.</p>
<p>Public information was checked on 12 October 2026. Community descriptions are not an inspection on your climbing date, and NobodyClimb has not verified the area through a brand first-hand ascent. The useful next step is to take your date, team and intended line to the park office and a local partner for confirmation.</p>
<h2>References</h2>
<ul>
<li><a href="https://www.mountainproject.com/area/119848026/senin-bong-dobongsan">Rock Climbing in Seonin-bong (Dobongsan), Seoul/Gyeonggi-do (Northwest Korea)</a></li>
<li><a href="https://www.knps.or.kr/smartsafe/permission/list.do">스마트워치 상황관제 시스템</a></li>
<li><a href="https://www.knps.or.kr/front/portal/visit/visitCourseSubMain.do?menuNo=7020092&parkId=121500&parkNavGb=guide">코스별난이도 &lt; 북한산국립공원 &lt; 국립공원탐방 &lt; 국립공원공단</a></li>
<li><a href="https://www.knps.or.kr/smartsafe/cms/contents.do?cmsSeq=28">스마트워치 상황관제 시스템</a></li>
</ul>
<h2>Reading languages</h2>
<p><a href="/blog/57c6e2d0d50150551208df0a89af68aa">繁體中文</a> · <a href="/en/blog/a1b302e1a01cb19b46d6f12c33281e48">English</a> · <a href="/ja/blog/b17a878a6f6cde0a8a599161443c8279">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('a1b302e1a01cb19b46d6f12c33281e48', '首爾攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('a1b302e1a01cb19b46d6f12c33281e48', '岩場指南');
DROP TABLE _blog_article_guard;
