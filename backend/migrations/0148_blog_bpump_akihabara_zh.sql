-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/9a6e16e346eca229e3c6a34a77333acf.md
-- source-sha256: 57af8c42492265f66fc26cd5f6057c6f83b0e2d1f06c18f421bbb6dc994e8573
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '9a6e16e346eca229e3c6a34a77333acf' OR slug = 'bpump-akihabara-climbing-guide') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('9a6e16e346eca229e3c6a34a77333acf', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'bpump-akihabara-climbing-guide', 'B-PUMP 秋葉原指南：初訪費用、樓層選課與東京抱石日', '依秋葉原店官網核對營業時間、登錄、日票和租鞋。用自己的能力選課題，並把換線公告納入行程。', '<h2>適合怎樣的東京行程</h2>
<p><a href="https://pump-climbing.com/gym/akiba/">B-PUMP TOKYO 秋葉原店</a>是東京文京區湯島1-1-8的抱石岩館。官網列秋葉原站、御茶之水站各步行約5分鐘，適合把攀登接到城市活動前後。它是抱石選項；如果你的訓練目的是繩索先鋒或確保練習，安排這一天時應重新設定目標為課題、動作與岩館體驗。</p>
<p>官網首頁的2026年10月換線消息提到1樓有初級至中級使用者、3樓有Beginner Wall，並另有其他樓層與頂樓課題資訊。可把這些當作初訪選區線索，抵達時請工作人員介紹當前級數和可用牆面；不要把某次換線公告中的課題數量當成永久配置。即使已有抱石經驗，也先熟悉落地、動線與岩館規則。</p>
<h2>營業時間與初訪預算</h2>
<p>2026年10月12日讀取的秋葉原店官網列：平日12:00–23:00，週六與國定假日11:00–21:00，週日10:00–21:00。時間是日本當地時間，特殊營業和換線仍須看當期公告。一般成人通日利用費為含稅2,420日圓；首次登錄2,200日圓，已在其他PUMP登錄、首次使用秋葉原店者為1,100日圓。</p>
<p>預算示例：未在PUMP登錄的成人第一次買通日票，登錄加利用合計4,620日圓；若適用其他PUMP登錄者費率，合計3,520日圓。這是把兩筆官網費用相加，不含其他消費。官網另列平日白天和晚間費率，時間窗與通日不同；想縮短停留可先看價格表，但不要用晚間票預算一整天。</p>
<p>秋葉原店列租鞋330日圓、初次免費，並明示目前不提供粉袋／粉租借。使用粉狀粉時須使用粉袋，液態粉可單獨使用。<a href="https://pump-climbing.com/gym/akiba/discovery">初訪說明頁</a>也要求攜帶襪子和便於活動的衣物。需要粉的人應自行準備適用器材或先向店家詢問。抵達後先告知初訪與既有PUMP登錄狀態，完成店家的使用說明，再開始熱身。</p>
<p>本篇預算以成人為例。帶未成年人時，秋葉原店官網列有陪同、可用時段及未滿18歲初訪確認書要求，不能直接套用成人安排。請由監護人讀該店規定並準備文件。本文沒有核實特定日期團體名額、置物容量或教練課程空位；若這些是行程必要條件，先和店家確認再預定。</p>
<h2>把岩館排成有餘裕的一天</h2>
<p>建議示例：平日午后入場，先以容易課題熟悉當前級數，再選少量有興趣的動作練習，最後留力離場吃飯。旅行隔天若有戶外目標，不必把每條熱門課題都試到力竭。這是編輯安排，不是本站實測擁擠程度或訓練效果；抵達時若牆面換線，就請工作人員指引可用區域。</p>
<p>上列費用和時間是2026年10月12日官網快照，不是2027年四月的價格保證。出發前再讀秋葉原店自己的PRICE、OPEN HOUR與最新換線公告；若旅程因雨改排岩館，也同樣先確認當日營業，而不是只憑平常時刻抵達。</p>
<h2>參考資料</h2>
<ul>
<li><a href="https://pump-climbing.com/gym/akiba/">ボルダリングジム＆ショップ B-PUMP TOKYO 秋葉原</a></li>
<li><a href="https://pump-climbing.com/gym/akiba/discovery">ボルダリングジム＆ショップ B-PUMP TOKYO 秋葉原</a></li>
</ul>
<p><a href="/blog/9a6e16e346eca229e3c6a34a77333acf">繁體中文</a> · <a href="/en/blog/6710b8dcea752a73926f8654a6eb1b24">English</a> · <a href="/ja/blog/7251160388f3655aad947e08e053add5">日本語</a></p>
', NULL, 'gyms', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('9a6e16e346eca229e3c6a34a77333acf', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('9a6e16e346eca229e3c6a34a77333acf', '岩館指南');
DROP TABLE _blog_article_guard;
