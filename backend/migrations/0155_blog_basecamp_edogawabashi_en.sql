-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/e9a8202bd67c91865e698b92a798c973.md
-- source-sha256: 292ae18e2dc1a09420d9c0d4aaccf840b9d51eabbe5eca3c0d44b28aa590c484
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = 'e9a8202bd67c91865e698b92a798c973' OR slug = 'basecamp-edogawabashi-climbing-guide-en') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('e9a8202bd67c91865e698b92a798c973', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'basecamp-edogawabashi-climbing-guide-en', 'Base Camp Edogawabashi: planning a bouldering or roped session', 'A Tokyo gym with bouldering and roped climbing. Compare first-visit costs, equipment rental and supervised experiences before choosing a session.', '<h2>Planning this venue</h2>
<p>Base Camp Edogawabashi is a useful candidate for a Tokyo climbing day when you want a choice between bouldering and ropes. The <a href="https://b-camp.jp/edogawabashi/">operator’s introduction</a> lists bouldering, lead climbing and top-rope climbing. Those options require different preparation. This guide uses published information; admission should not be treated as evidence that a visitor has been trained to belay.</p>
<h2>Getting there and allowing time</h2>
<p>The operator gives an approximate five-minute walk from Edogawabashi Station and eleven minutes from Kagurazaka Station. These are station-to-gym estimates, so add transfers, finding the exit and check-in to your hotel-to-gym plan. Published opening hours are 12:00–23:00 on weekdays and 10:00–21:00 on weekends and public holidays. There is no fixed weekly closing day, but temporary closures remain possible.</p>
<p>For a visitor with just one available evening, wall availability matters as much as closing time. The home page carries a setting schedule, and a bouldering or rope area can be unavailable while the gym is open. Check your intended area and leave time for registration, changing and warming up.</p>
<h2>Bouldering and ropes need separate plans</h2>
<p>The <a href="https://b-camp.jp/edogawabashi/facilities/">facilities page</a> describes several bouldering areas and roped facilities. If you have shoes but no qualified belay partner, tell reception that you intend to boulder and follow the gym’s briefing. The presence of top ropes does not establish that staff will be available to belay you on demand.</p>
<p>If you want to try ropes without an established partner and the necessary skills, consult the <a href="https://b-camp.jp/edogawabashi/visitor/">first-visit information</a>. Its top-rope experience is one hour for ¥1,100, with a separate facility fee. Participants need to have completed the bouldering introduction or have bouldering experience; check the available session through the operator’s booking arrangements. General admission, a bouldering introduction and the top-rope experience are different services. Budget and book them separately.</p>
<h2>First-visit costs and rental</h2>
<p>Checked on 12 October 2026, the <a href="https://b-camp.jp/edogawabashi/charge/">price page</a> lists tax-inclusive adult full-day admission at ¥2,420 and initial registration at ¥1,100. Together they total ¥3,520 for an ordinary first adult full-day visit, before a top-rope experience or other paid extras.</p>
<p>Regular rental prices are shoes ¥330, chalk ¥110, harness ¥110, an ATC belay device ¥110 and a lead rope ¥550. Initial registration includes free rental of shoes, chalk, a harness and an ATC; the lead rope is not on that free-rental list. Bring socks for rental shoes. Registration is shared across Base Camp branches, so ask reception to check an existing membership rather than assuming you need to pay registration again.</p>
<h2>Three checks before leaving</h2>
<p>Decide whether this is a bouldering visit, a rope session with a capable partner or an enquiry about an experience. Check opening information and setting closures for that day. Then list your membership status, rental needs and any experience fee separately so reception can clarify the total.</p>
<p>Renting equipment does not establish competence. Rope-use requirements and eligibility must follow the gym’s instructions. These checks help a short visit start with a clear purpose and reduce the chance of arriving during a closure of your chosen area. Prices and hours are a dated snapshot and need checking again for a future trip.</p>
<h2>References</h2>
<ul>
<li><a href="https://b-camp.jp/edogawabashi/">BASE CAMP TOKYO 江戸川橋 - ボルダリング、リードクライミング・トップロープなど様々なクライミングが行える施設。江戸川橋駅徒歩5分。 東京屈指の繁華街である池袋からもアクセス良好な立地に位置するBase Camp。 ボルダリングが初めての方へ、随時初回インストラクションを実施。</a></li>
<li><a href="https://b-camp.jp/edogawabashi/facilities/">施設紹介 - BASE CAMP TOKYO 江戸川橋</a></li>
<li><a href="https://b-camp.jp/edogawabashi/visitor/">はじめての方へ - BASE CAMP TOKYO 江戸川橋</a></li>
<li><a href="https://b-camp.jp/edogawabashi/charge/">営業時間・料金案内 - BASE CAMP TOKYO 江戸川橋</a></li>
</ul>
<h2>Reading languages</h2>
<p><a href="/blog/4170cdb52c273770734572c680c669c4">繁體中文</a> · <a href="/en/blog/e9a8202bd67c91865e698b92a798c973">English</a> · <a href="/ja/blog/18c5a82f2d50a8bf0216bbc5305ff668">日本語</a></p>
', NULL, 'gyms', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('e9a8202bd67c91865e698b92a798c973', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('e9a8202bd67c91865e698b92a798c973', '岩館指南');
DROP TABLE _blog_article_guard;
