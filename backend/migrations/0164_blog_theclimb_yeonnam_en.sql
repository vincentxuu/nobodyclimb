-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/53da59d598053f31d90eb8b4629fcfa1.md
-- source-sha256: ffa0f3a5199da88872b3f9c58955785d69c6280f7ad712cdbebfe520f99d06e2
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '53da59d598053f31d90eb8b4629fcfa1' OR slug = 'theclimb-yeonnam-climbing-guide-en') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('53da59d598053f31d90eb8b4629fcfa1', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'theclimb-yeonnam-climbing-guide-en', 'The Climb Yeonnam: choosing the right branch for a Seoul bouldering visit', 'The former Hongdae branch has closed. Check Yeonnam’s address, published hours and day-pass costs before planning your Seoul session.', '<h2>Planning this venue</h2>
<p>Travel notes often place The Climb under “Hongdae,” but a neighbourhood label is not enough to identify a branch. The <a href="http://theclimb.co.kr/branch/">operator’s branch page</a> marks B Hongdae as closed on 17 May 2026. For a current itinerary, verify Yeonnam (연남점) rather than reuse the former Hongdae address.</p>
<p>This article covers one branch using official information readable on 12 October 2026. It does not combine every branch’s facilities, courses or operating status into one recommendation.</p>
<h2>Check the address and floor</h2>
<p>Yeonnam is on the third floor of LC TOWER, 186 Yanghwa-ro, Mapo-gu, Seoul. Save the Korean address, “서울특별시 마포구 양화로 186 3층,” and the official telephone number, 02-2088-5071. Enter the address together with 연남점 in a local map and verify the destination. The closed Hongdae branch was at 125 Yanghwa-ro.</p>
<p>This guide has not verified walking times from individual station exits, so it promises no minute-by-minute arrival estimate. Include transfers, finding the building entrance and first-visit check-in in your plan. If arriving late, consider the climbing time remaining rather than only the gym’s proximity to a popular neighbourhood.</p>
<h2>Hours and the session itself</h2>
<p>The Yeonnam section of the <a href="http://theclimb.co.kr/english/">official English page</a> lists weekdays 07:00–24:00 and weekends and holidays 08:00–22:00. Its brand introduction discusses bouldering and setting; this does not guarantee that every Yeonnam wall is available on a particular day or establish the difficulty of individual problems. Ask about events, setting closures and exceptional hours before your trip.</p>
<p>If you already boulder, ask how starts, finishes, colours and landing areas work, then choose some easy problems to get familiar with the gym. Colours at different gyms should not be assumed to map directly onto your usual V grades. This is planning advice, not a verified colour-grade chart. Complete beginners should ask whether a trial class is required, whether it needs booking and whether instruction is available in a language they understand.</p>
<h2>Day pass and equipment budget</h2>
<p>The common price list on the English page gives a day pass of ₩22,000, shoe rental of ₩3,000 and chalk rental of ₩1,000. A pass plus shoes totals ₩25,000, or ₩26,000 with chalk as well. These sums exclude separately purchased instruction and other services. The English page also retains older sections for closed branches, so use these figures as a dated budget reference and confirm the price applicable at Yeonnam with reception.</p>
<p>Bringing your own shoes reduces rental needs; otherwise ask about sizes and rental rules when checking in. Do not buy a multiple-visit pass solely because its per-visit price looks lower. A short-term visitor should first check validity, personal-use conditions and the number of sessions actually planned.</p>
<h2>Questions for a first visit</h2>
<p>Prepare four questions: What is today’s total day-pass cost at Yeonnam? What registration or briefing does a first visit require? How are shoes and chalk charged? Is a beginner class available, and in what language? This guide has not verified the complete registration process for foreign visitors, class languages or same-day availability; ask Yeonnam directly.</p>
<p>Yeonnam can be an indoor bouldering candidate, including as a weather alternative to an outdoor day. Confirming the branch, hours and services makes that alternative usable. This is a public-source guide, not a NobodyClimb first-hand visit report.</p>
<h2>References</h2>
<ul>
<li><a href="http://theclimb.co.kr/branch/">branch | theclimb</a></li>
<li><a href="http://theclimb.co.kr/english/">Korea Climbing gym | theclimb</a></li>
</ul>
<h2>Reading languages</h2>
<p><a href="/blog/5ed702d9314fa563edaf66a482188c49">繁體中文</a> · <a href="/en/blog/53da59d598053f31d90eb8b4629fcfa1">English</a> · <a href="/ja/blog/2e54298c1999d880d7aae65162a88774">日本語</a></p>
', NULL, 'gyms', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('53da59d598053f31d90eb8b4629fcfa1', '首爾攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('53da59d598053f31d90eb8b4629fcfa1', '岩館指南');
DROP TABLE _blog_article_guard;
