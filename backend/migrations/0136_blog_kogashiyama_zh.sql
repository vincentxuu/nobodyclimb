-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/a2ec5292794db159908646020424553b.md
-- source-sha256: 8145919f1cc86b3905ae9227f6d91dd6ec40648762e707f5adf22a604f9c6c7a
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = 'a2ec5292794db159908646020424553b' OR slug = 'kogashiyama-climbing-guide') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('a2ec5292794db159908646020424553b', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'kogashiyama-climbing-guide', '古賀志山攀岩指南：不動滝岩區、能力選線與入場界線', '古賀志山有從較容易路線到進階先鋒的選擇，但地主約定與部分禁攀區域要先理解。用現行 topo 規劃一天。', '<h2>適合什麼旅行者</h2>
<p>古賀志山是栃木縣宇都宮周邊的戶外岩場。<a href="https://www.climbing-net.com/iwaba_detail/%E5%8F%A4%E8%B3%80%E5%BF%97%E5%B1%B1/">CLIMBING-net 的介紹</a>列出 bolt 先鋒、多繩距及部分只能 top-rope 的路線，岩質為燧石岩；<a href="https://www.rocktopo.net/areas/80">ROCKTOPO</a>則以岩面先鋒為主要收錄內容。它能提供不同程度的目標，但「有容易線」不代表沒有戶外繩索經驗也能自行攀登。</p>
<p>已有戶外先鋒、確保與回收能力的繩隊，可以把它安排成專注選線的一天。只有室內經驗者則適合由熟悉岩場的嚮導帶領。若東京行程可攀的天數有限，先確認全隊都接受交通與接近的投入，再決定是否值得為這個場地排一天；不要因為路線分布廣，就預設每人都能立即找到合適目標。</p>
<h2>不動滝周邊的目標怎麼找</h2>
<p>ROCKTOPO以不動滝正面・左フェイス、右フェイス及左奧フェイス等名稱整理照片與路線，列競技会ルート5.9、ハートブレーカー5.10c和羚羊ハング5.11a作熱門路線線索。保留日文名稱查 topo 比自行翻成中文更容易和現場對照。這些級數是資料頁上的記錄，不是器材或安全保證；每條線是否需自然保護、如何回收，以及可否先鋒，都要查個別 topo。</p>
<h2>地主約定比路線數重要</h2>
<p>CLIMBING-net記錄的約定包括不進入雌滝區、不砍樹、不在神社放私人物品、不生火、垃圾帶走及戴頭盔；ROCKTOPO另明示左奧區再往左禁止攀登。兩種名稱不能只憑字面當成同一條精確界線。請用現行 topo 和現場告示定位；沒有把握就留在已確認區域。現在各區的完整開放界線，本篇未向地主或管理方取得確認。</p>
<h2>交通、岩況與一天的安排</h2>
<p>出版社資料以古賀志山南登山道停車場及約30分鐘步行作接近參考；其公共交通段落有舊站名及廢線資訊，因此本篇不沿用那些班次或車程。建議先安排宇都宮周邊住宿或可確認的接送，向在地帶隊者確認集合地點與回程，再查列車。現行接送費與停車費未核實，預算應留彈性，不把舊頁上的金額套用到今天。</p>
<p>ROCKTOPO與出版社都給通年參考，但當日濕滑、雨後岩況與人潮仍需判斷。建議示例是早上只選一個不動滝岩區，先確認路線與支點，再安排數條全隊能參與的線；不要在陌生的回收流程中臨時加入新練習。<a href="https://freeclimb.jp/information/9978/">JFA 古賀志事故報告</a>記錄模擬先鋒與 top-rope 回收交錯造成的確保混淆，值得有繩索經驗者在出發前閱讀。</p>
<h2>參考資料</h2>
<ul>
<li><a href="https://www.rocktopo.net/areas/80">古賀志山 | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E5%8F%A4%E8%B3%80%E5%BF%97%E5%B1%B1/">古賀志山</a></li>
<li><a href="https://freeclimb.jp/information/9978/">古賀志事故報告書</a></li>
</ul>
<p><a href="/blog/a2ec5292794db159908646020424553b">繁體中文</a> · <a href="/en/blog/30860f3340ee9d6b944945e372542527">English</a> · <a href="/ja/blog/83848f20009ac20978478f9a18c5ffae">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('a2ec5292794db159908646020424553b', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('a2ec5292794db159908646020424553b', '岩場指南');
DROP TABLE _blog_article_guard;
