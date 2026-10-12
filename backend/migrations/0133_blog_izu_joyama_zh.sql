-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/846b2bf6c46598816c9c71352d76080c.md
-- source-sha256: b987157f9a67138035ae87c2d94d192c67b27fccfb5937543e1facdbe13b4f1f
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '846b2bf6c46598816c9c71352d76080c' OR slug = 'izu-joyama-climbing-guide') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('846b2bf6c46598816c9c71352d76080c', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'izu-joyama-climbing-guide', '伊豆・城山攀岩指南：南壁、運攀與多繩距該怎麼選', '伊豆城山的南壁與上部岩區有不同的攀登內容和接近方式。先定目標，再安排大仁出發的戶外一天。', '<h2>城山不是只有一種攀法</h2>
<p>伊豆城山位於靜岡縣大仁一帶。<a href="https://www.climbing-net.com/iwaba_detail/%E5%9F%8E%E5%B1%B1/">CLIMBING-net 的場地介紹</a>把南壁 slab 與ワイルドボアゴージ等岩區放在同一個場地中，並列 bolt 先鋒和多繩距。它適合已能和夥伴獨立處理戶外確保的旅人；若你只在岩館上攀，應先安排戶外課程或嚮導，而不是把「有初中級線」理解成能自行入場。</p>
<p><a href="https://www.rocktopo.net/areas/10">ROCKTOPO 城山頁</a>也區分岩面先鋒與多繩距，岩質標為凝灰岩；<a href="https://izugeopark.org/geosites/joyama/">伊豆半島地質公園</a>則從地景角度解釋城山為露出地表的「火山之根」。地景介紹有助理解這座山，但不能用來判定固定點或開放狀態。選南壁單繩距、南壁多繩距或上部岩區，是三種不同的一日計畫。</p>
<h2>先用 topo 選目標</h2>
<p>ROCKTOPO列出的バトルランナー最高級數5.10a，以及ストーンフリー5.10c、ミウラー5.11a，可以用來尋找詳細 topo。最高級數不等於每段的長度、保護或下降方法都已確定。本篇不提供逐點 beta；出發前請把路線所在岩區、單繩距或多繩距、繩長與撤退方式逐項確認。同行者若能力不同，優先選全隊都能參與的單繩距目標。</p>
<h2>大仁出發，別混用接近時間</h2>
<p>CLIMBING-net的接近說明以伊豆箱根鐵道大仁站為起點，估步行25分鐘到登山道入口，再10分鐘到南壁；上部ワイルドボアゴージ的走法另計。這是出版社的接近估值，不是當天交通保證。以大仁站搜尋鐵路班次，再用實際 topo 確認最後一段；不要拿南壁時間套到所有岩區。現行停車位、收費及全面開放狀態，本篇未向管理方核實。</p>
<h2>季節與行程安排</h2>
<p>季節資料有不同尺度：CLIMBING-net列9月下旬至6月上旬，ROCKTOPO則突出11月至3月。可理解為選季線索，不能據此保證四月的任何一天都涼爽乾燥。建議確認近期雨量、岩面實況與風，再決定是否維持戶外日。不要把「岩壁有 bolt」當作固定點全面檢查完成；帶齊該路線需要的器材，並由有能力者判斷實況。</p>
<p>建議示例：前一晚住大仁或附近住宿區，第一天只安排南壁，不把上部岩區也塞進去。進場後先熟悉地形與下降，再選少量目標；回程預留步行和轉車。若安排多繩距，把架站、收繩及下降時間列入整天預算，並設明確的停止攀登時間。這些是編輯規劃建議，並非本站親身攀登紀錄。</p>
<h2>參考資料</h2>
<ul>
<li><a href="https://www.rocktopo.net/areas/10">城山 | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E5%9F%8E%E5%B1%B1/">城山</a></li>
<li><a href="https://izugeopark.org/geosites/joyama/">城山 | 南から来た火山の贈りもの | 伊豆半島ジオパーク公式サイト</a></li>
</ul>
<p><a href="/blog/846b2bf6c46598816c9c71352d76080c">繁體中文</a> · <a href="/en/blog/f9c33618b02b1700c394aeb058870e5a">English</a> · <a href="/ja/blog/f902725d10853b2ce13782a94ae46efd">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('846b2bf6c46598816c9c71352d76080c', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('846b2bf6c46598816c9c71352d76080c', '岩場指南');
DROP TABLE _blog_article_guard;
