-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/b8732fabf83588800175280c5cb82705.md
-- source-sha256: 6214235894e1bfe29b3513aa6baa946c014936f365ee5ea40c4b90e0ccd8f18d
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = 'b8732fabf83588800175280c5cb82705' OR slug = 'bpump-ogikubo-climbing-guide-en') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('b8732fabf83588800175280c5cb82705', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'bpump-ogikubo-climbing-guide-en', 'B-PUMP Ogikubo guide: a dedicated bouldering day and first-visit costs', 'Use Ogikubo''s own official prices, rentals and hours to plan a focused bouldering session beside the station.', '<h2>A day focused on bouldering</h2>
<p><a href="https://pump-climbing.com/gym/bpump/">B-PUMP OGIKUBO&#39;s official page</a> presents a dedicated bouldering gym at 1-10-12 Kamiogi, Suginami-ku, Tokyo, on the third floor of Ogikubo Toa Kaikan. It gives an approximately one-minute walk from JR Ogikubo Station. It fits a focused problem session during a Tokyo trip. It is not a rope-climbing option; revise a lead-training aim before planning this day.</p>
<p>September 2026 event notices on the official page mention date-specific limits on CIRCUIT WALL and COMPETITION WALL, as well as a full-day closure. They show that different walls and event use matter, but wall names do not establish daily difficulty or availability. First-time visitors should ask staff about current problems and landing rules, starting with movements and heights they can manage.</p>
<h2>Hours and admission prices</h2>
<p>As read on October 12, 2026, Ogikubo lists Japan-local hours of 13:00–23:00 on weekdays and 10:00–21:00 on Saturdays, Sundays and public holidays. Adult full-day admission is ¥2,530 including tax on both weekdays and holidays. Weekday daytime use until 18:30 and evening use from 18:00 are ¥2,310; weekdays from 21:00 are ¥1,650. Holiday evening use from 18:00 is ¥2,310. Match the ticket to its time window rather than treating a short-session rate as full-day admission.</p>
<p>There is a discrepancy between official pages: <a href="https://pump-climbing.com/gym/bpump/discovery">Ogikubo&#39;s first-visit page</a> lists a weekday first visit at ¥4,510 including tax, differing from the ¥4,730 sum of registration and full-day admission on the main page. The budget here uses the main page&#39;s component charges as a reference, not a promise of the amount charged. Confirm the applicable ticket and first-visit total directly with Ogikubo.</p>
<p>Initial registration is ¥2,200, or ¥1,100 for someone registered at another PUMP gym visiting Ogikubo for the first time. An adult first-visit full-day budget is therefore ¥4,730 with standard registration or ¥3,630 with the other-PUMP rate. These totals add registration and full-day admission, excluding other purchases. Explain your registration status at reception rather than assuming another branch&#39;s registration means no fee.</p>
<h2>Rentals and first-visit preparation</h2>
<p>Ogikubo lists shoe rental at ¥220 and chalk rental at ¥110, both free on the first visit. This differs from Akihabara&#39;s official page; use the destination branch&#39;s information. Wear clothing suitable for movement, complete registration and orientation, and learn the grading, problem starts and finishes and fall-zone layout. Ask staff before standing somewhere you are unsure about.</p>
<p>This guide assumes an adult visiting independently. Conditions for minors, groups, coaching bookings and large-luggage storage have not been fully verified here. If any are essential to entry or your itinerary, confirm them with Ogikubo first. Listing prices does not complete registration or establish eligibility for every visitor.</p>
<h2>Planning a useful problem session</h2>
<p>Suggested example: arrive after opening, use easy problems to learn the setting style, then rotate between two or three types of movement with rests. If outdoor climbing follows the next day, set the finish time around recovery and travel rather than endless attempts. This is an editorial suggestion, not a measured conclusion about Ogikubo grades, training effects or crowds.</p>
<p>The information above is the official-page snapshot read on October 12, 2026; it does not guarantee the same fees or hours in April 2027. Recheck Ogikubo&#39;s current hours, setting and event restrictions, rather than relying on old problem counts or setting dates retained on the homepage. Available walls affect your plan; ask staff to help choose another area if events limit access.</p>
<h2>References</h2>
<ul>
<li><a href="https://pump-climbing.com/gym/bpump/">ボルダリングジム＆ショップ B-PUMP OGIKUBO 荻窪店</a></li>
<li><a href="https://pump-climbing.com/gym/bpump/discovery">ボルダリングジム＆ショップ B-PUMP OGIKUBO 荻窪店</a></li>
</ul>
<p><a href="/blog/44d66a525d64f97349d2c9b60de239be">繁體中文</a> · <a href="/en/blog/b8732fabf83588800175280c5cb82705">English</a> · <a href="/ja/blog/10d55aed821ce29227f89aa1f05ee146">日本語</a></p>
', NULL, 'gyms', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('b8732fabf83588800175280c5cb82705', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('b8732fabf83588800175280c5cb82705', '岩館指南');
DROP TABLE _blog_article_guard;
