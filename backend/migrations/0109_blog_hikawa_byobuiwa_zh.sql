-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/82e5ced58bcad87924ada8646bd4e3b2.md
-- source-sha256: 33477d8a1de269d60c0e24ab7d9ba3e632987cd6049a5ef672bce0a73a59832b
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '82e5ced58bcad87924ada8646bd4e3b2' OR slug = 'hikawa-byobuiwa-climbing-guide') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('82e5ced58bcad87924ada8646bd4e3b2', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'hikawa-byobuiwa-climbing-guide', '氷川屏風岩攀岩指南：奧多摩車站上方的多樣岩壁', '從奧多摩站步行前往氷川屏風岩，先辨認區域、理解舊線與岩質，再準備當日路線及回程。', '<h2>想看不同岩壁，先認清自己的目標</h2>
<p>氷川屏風岩位於東京奧多摩町氷川，適合已有外岩繩攀經驗、願意用 topo 辨認區域與路線的人。若希望到站後走路進山，這是可以研究的目的地；若只想找交通方便、每條保護都清楚的新式運攀線，不能只因「靠近車站」就直接排定。</p>
<p><a href="https://www.climbing-net.com/iwaba_detail/%E6%B0%B7%E5%B7%9D%E5%B1%8F%E9%A2%A8%E5%B2%A9/">CLIMBING-net 的岩場介紹</a>描述此處從早期人工攀登岩場，在 1980 年代逐步發展自由攀登，包含 A 峰的 slab、C 峰前傾壁與 roof 等地形。Slab 指較平緩的岩面，roof 則是接近屋頂式的大仰角；不同地形對腳點使用、體能與繩路都有不同要求。先選區域比只找一條符合級數的線更有意義。</p>
<h2>從奧多摩站走進山，不等於簡單接近</h2>
<p>出版者資料以奧多摩站步行約 30 分鐘為接近參考，區分溪谷路與稜線路，並指出フクロウ岩走溪谷路。這是來源中的估計，不是固定保證；帶繩索與裝備時，應另外保留辨路、休息與處理不合適地面的時間。</p>
<p>同一來源明示不可路邊停車，並建議在車站先使用廁所、自己帶水。東京住宿出發時，可以先把奧多摩站設為公共交通轉接點，再核對當天列車和回程。不要因地圖看起來距離短，就在上山前省略飲水或午餐準備，也不要把不明的停車空地當合法選項。</p>
<h2>級數之外，舊線會帶來哪些問題</h2>
<p>介紹頁指出部分岩石較脆，也提醒攀登 C 峰時需準備結束點用的較長 sling。<a href="https://www.rocktopo.net/rocks/1671">ROCKTOPO 的岩壁頁</a>另有使用者提到苔蘚、piton 與 ring bolt，以及結束點辨認困難。這些是個別使用者的回報，不應延伸成「全岩場支點失效」，但值得作為出發前詢問熟悉者的問題。</p>
<p>先確認目標線是哪個峰、結束點如何辨識、下降需要什麼裝備，再決定是否攀登；不熟悉結束點架設的人，應找具備相應能力的同伴或適合的指導。不要把室內級數直接換算成此處的安全餘裕，也不要只憑網頁上的路線數量估計一天能爬多少。</p>
<h2>季節資訊如何使用</h2>
<p>CLIMBING-net 描述雨後較容易乾、冬季也較暖，岩質為 chert（燧石質岩）。這是岩場的一般介紹，不能當成雨後即刻可爬的保證。本指南未核實每條路線目前的潮濕、苔蘚與固定點狀況，抵達後仍需逐線判斷是否適合攀登。</p>
<p>比較好的行程是帶著少量明確目標與備案出發，而非到場才找最簡單的線。先在 topo 上確認區域、帶足水與裝備、留出下山與回程空間；若接近路況或岩面不合適，就取消攀登。氷川屏風岩的價值在岩壁變化與歷史脈絡，閱讀與判斷也是體驗的一部分。</p>
<h2>參考資料</h2>
<ul>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E6%B0%B7%E5%B7%9D%E5%B1%8F%E9%A2%A8%E5%B2%A9/">氷川屏風岩</a></li>
<li><a href="https://www.rocktopo.net/rocks/1671">氷川屏風岩 | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
</ul>
<p><a href="/blog/82e5ced58bcad87924ada8646bd4e3b2">繁體中文</a> · <a href="/en/blog/c78784d147efe236d7b3cf29c9342a9c">English</a> · <a href="/ja/blog/395cb55a029370fe1c56cd80f6ede51a">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('82e5ced58bcad87924ada8646bd4e3b2', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('82e5ced58bcad87924ada8646bd4e3b2', '岩場指南');
DROP TABLE _blog_article_guard;
