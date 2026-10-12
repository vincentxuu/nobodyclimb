-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/7bb10cb94d8c3c8ed95394f052e9927a.md
-- source-sha256: 88268637808ef4692860db5ea6fd22de8d4a1d5a21c03ce6596506a30c3cb495
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '7bb10cb94d8c3c8ed95394f052e9927a' OR slug = 'takatoriyama-climbing-guide') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('7bb10cb94d8c3c8ed95394f052e9927a', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'takatoriyama-climbing-guide', '鷹取山攀岩指南：完成登記，再安排公園頂繩日', '橫須賀鷹取山的攀登須登記並遵守指導與規則。整理公園接近、頂繩取向與部分步道封閉資訊。', '<h2>公園可遊覽，不等於可以自由攀登</h2>
<p>鷹取山是神奈川縣橫須賀市的公園岩場，適合想在東京旅行中安排有準備的頂繩攀登日的人。它的前提是先完成登記與管理條件；不能看到有人爬，或看到岩壁上的路線，就自行架繩加入。</p>
<p><a href="https://www.city.yokosuka.kanagawa.jp/5560/sisetu/fc00000978.html">橫須賀市官方公園頁</a>寫明園內原則禁止岩登，但遵從鷹取山安全登山協議會指導員的指導與既定事項時例外，並要求向協議會登記。這不只是一般推薦。規劃時應先聯絡頁面列出的協議會窗口，確認你的參加方式與指導安排；未完成條件就只安排公園遊覽，不攀登。</p>
<h2>先了解頂繩取向</h2>
<p><a href="https://www.rocktopo.net/areas/115">ROCKTOPO 的鷹取山頁</a>同樣提醒登記，並說明此區基本以 top-rope（頂繩）攀登。頂繩是繩索先透過上方支點的方式，但並不意味著任何人都能自己搭建或檢驗上方系統；器材、支點、繩索路徑與確保仍須相應能力。</p>
<p>資料庫雖把許多線歸為 lead/face，場地說明又以頂繩為主，不應僅看分類就自行安排先鋒攀登。先向協議會確認允許的活動與規則，再選目標線；不要以網頁級數或別人的影片代替現場指導。若旅行同伴能力不同，頂繩日也要讓每人瞭解安全檢查與確保分工。</p>
<h2>用公園官方交通，而非想像中的停車位</h2>
<p>市府介紹此處為過去採石形成的垂直岩壁。官方交通是由京急追浜站搭湘南たかとり団地循環巴士，到たかとり小学校下車，再步行約 10 分鐘；頁面同時標示公園沒有停車場。這是公園的到達資訊，不表示每個攀登區都有相同接近時間。</p>
<p>公共交通旅人先核對當日巴士和回程，再依允許的接近路進入。若打算開車，不能把資料庫中的停車連結當作公園提供的車位；停車應另行確認合法場所，不能停在住宅道路或妨礙出入口。把裝備收整與公園使用者的通行也納入當天安排。</p>
<h2>有步道封閉，就依目前告示改路</h2>
<p>查閱當日的市府頁仍列出摩崖佛至水道配水池區間因落石封閉，從 2025 年 6 月 8 日起持續，重開時間未定；摩崖佛仍可觀看。這是一段步道的公告，不能推論全公園或全部攀登區閉鎖，也不能繞過封鎖去接近自己的目標。</p>
<p>本指南未核實旅行當日的登記受理、指導安排與步道是否重開，出發前須向協議會並查市府最新告示確認。網站所示公園年中無休，也不等於攀登可以隨時自由進行，兩種資訊需要分開理解。</p>
<p>鷹取山最適合以「先聯絡、完成條件、再安排頂繩」的順序準備。水、食物、個人防護與攀登裝備依活動要求攜帶，沒有許可或缺少適當支點能力就不爬。把登記和公共空間規則一起完成，才能安心把這個採石場景觀中的攀登日放進旅程。</p>
<h2>參考資料</h2>
<ul>
<li><a href="https://www.city.yokosuka.kanagawa.jp/5560/sisetu/fc00000978.html">鷹取山公園</a></li>
<li><a href="https://www.rocktopo.net/areas/115">鷹取山 | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
</ul>
<p><a href="/blog/7bb10cb94d8c3c8ed95394f052e9927a">繁體中文</a> · <a href="/en/blog/2b1fad5f50c738e4d0600022edc266ae">English</a> · <a href="/ja/blog/c39656362f8fc1cfdbc2a36837b9135b">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('7bb10cb94d8c3c8ed95394f052e9927a', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('7bb10cb94d8c3c8ed95394f052e9927a', '岩場指南');
DROP TABLE _blog_article_guard;
