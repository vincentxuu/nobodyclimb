-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/ac1de57c9cd0be29fe035bde62b098e8.md
-- source-sha256: 197bb3a0247eb9e19a631f8c835a71fe05d35abb886c7885aa0aaebe3ca9f000
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = 'ac1de57c9cd0be29fe035bde62b098e8' OR slug = 'insubong-climbing-guide-en') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('ac1de57c9cd0be29fe035bde62b098e8', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'insubong-climbing-guide-en', 'Insubong: plan permits and descent before a Seoul granite climb', 'Granite cracks and slabs require a different plan from a gym visit. Check park applications, approach orientation and route-specific descent before committing.', '<h2>Planning this venue</h2>
<p>Insubong (인수봉, also written Insu-bong) is a roped-climbing destination in Seoul’s Bukhansan area. Its appeal is a full mountain day on granite slabs, cracks and multipitch terrain. The <a href="https://www.mountainproject.com/area/106225638/insu-bong-bukhansan">Mountain Project area description</a> describes traditional climbing and also warns of very widely spaced protection on some sport climbs. A familiar numerical grade should not turn this into the outdoor equivalent of a gym route.</p>
<p>This is an itinerary guide, not a substitute for a topo or local leadership. It is a research starting point for teams able to plan multipitch climbing, protection and descent. If your experience is limited to bouldering or indoor lead climbing, discuss the day with someone who knows the area before choosing a line that merely looks easy.</p>
<h2>Understand the approach side</h2>
<p>The community page places the approach on the east side of Bukhansan and mentions Bukhansan Ui Station (북한산우이역) and Doseonsa Temple (도선사). Use those names to orient your research, then confirm the current approach with the park or a local partner. The page contains transport and shared-taxi prices from 2022; this guide does not present those as current quotes or promise a fixed walking time.</p>
<p>Count transport, approach, preparation, climbing, descent and leaving the mountain in the day from your Seoul accommodation. Being reachable from the city does not establish that a climb fits within daylight. A plan without descent time should not rely solely on an earlier start.</p>
<h2>Confirm the park application in advance</h2>
<p>The <a href="https://www.knps.or.kr/smartsafe/permission/list.do">national park rock-climbing application page</a> includes Bukhansan. Its published rules allow applications for dates three to thirty days ahead, with a new date released at 10:00. Teams must have two to five people and receive final approval by text message before using the rock. This is distinct from ordinary trail access; a hiking trail does not establish climbing permission.</p>
<p>This research has not confirmed availability for a particular Insubong wall and date, the applicable sectors or the application process for foreign visitors; ask the park office first. Do so before booking transport or a guiding service. Give your intended date, party size, wall and visitor status. Finding a form does not mean your application has been approved.</p>
<p>Approval is followed by a same-day confirmation procedure. The <a href="https://www.knps.or.kr/smartsafe/cms/contents.do?cmsSeq=28">official application instructions</a> require confirming the climbing start from within the park through the text-message link and GPS before 16:00, and confirming completion when leaving. Keeping the approval message does not replace these start and completion steps; clarify the details with the park office when applying.</p>
<h2>Choose protection and descent with the route</h2>
<p>The community listing includes names such as Chouinard A, Chouinard B, Insu A and Insu B. They are keywords for finding a topo, not a reason to replace pitch-by-pitch information with one overall grade. Confirm each pitch’s protection, current fixed hardware, length, belay stations, descent line and retreat options. Slabs and cracks require different decisions, and the presence of bolts alone does not establish the rack you need.</p>
<p>This guide therefore offers no universal “one 60-metre rope is enough” list. Rope and descent equipment must fit current information for the chosen route. Resolve those requirements before deciding whether the climb suits the team. If descent information, protection or identifying the line remains unclear, seek someone familiar with the area or change the plan.</p>
<h2>A useful order for final checks</h2>
<p>The <a href="https://www.knps.or.kr/front/portal/visit/visitCourseSubMain.do?menuNo=7020092&parkId=121500&parkNavGb=guide">official Bukhansan visitor page</a> advises checking designated entry times and trail restrictions. Check approval and current restrictions first, then weather and the chosen route. Agree with your partner on when to stop climbing, how to descend and what to do if progress is slower than planned.</p>
<p>Insubong can be a central part of a Seoul climbing trip when permission, route requirements and team skills align. Public sources were checked on 12 October 2026. This is neither an inspection of fixed hardware nor a NobodyClimb first-hand climbing report.</p>
<h2>References</h2>
<ul>
<li><a href="https://www.mountainproject.com/area/106225638/insu-bong-bukhansan">Rock Climbing in Insu-bong (Bukhansan), Seoul/Gyeonggi-do (Northwest Korea)</a></li>
<li><a href="https://www.knps.or.kr/smartsafe/permission/list.do">스마트워치 상황관제 시스템</a></li>
<li><a href="https://www.knps.or.kr/front/portal/visit/visitCourseSubMain.do?menuNo=7020092&parkId=121500&parkNavGb=guide">코스별난이도 &lt; 북한산국립공원 &lt; 국립공원탐방 &lt; 국립공원공단</a></li>
<li><a href="https://www.knps.or.kr/smartsafe/cms/contents.do?cmsSeq=28">스마트워치 상황관제 시스템</a></li>
</ul>
<h2>Reading languages</h2>
<p><a href="/blog/77bd05d60d5cdeb6838224fbb1ae0274">繁體中文</a> · <a href="/en/blog/ac1de57c9cd0be29fe035bde62b098e8">English</a> · <a href="/ja/blog/71b53781fde2dc5037cef4423599ae79">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('ac1de57c9cd0be29fe035bde62b098e8', '首爾攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('ac1de57c9cd0be29fe035bde62b098e8', '岩場指南');
DROP TABLE _blog_article_guard;
