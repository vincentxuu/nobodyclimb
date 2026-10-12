-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/44d66a525d64f97349d2c9b60de239be.md
-- source-sha256: 78a8c79598ea673788a0fec99c51ef0f9ed2af56e974b7e09323c6fec46820f2
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '44d66a525d64f97349d2c9b60de239be' OR slug = 'bpump-ogikubo-climbing-guide') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('44d66a525d64f97349d2c9b60de239be', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'bpump-ogikubo-climbing-guide', 'B-PUMP 荻窪指南：專門抱石日、初訪費用與換線安排', '荻窪站旁的B-PUMP是專門抱石選項。依該店官網核對票價、登錄、租借與時間，避免混用秋葉原規定。', '<h2>適合專心抱石的一天</h2>
<p><a href="https://pump-climbing.com/gym/bpump/">B-PUMP OGIKUBO官方頁</a>介紹的是專門抱石岩館，地址為東京都杉並區上荻1-10-12、荻窪東亜会館3樓，官網以JR荻窪站步行約1分鐘作交通參考。適合在東京旅行中安排一段專心試課題的時間；它並非繩攀選項，不應把原本的先鋒訓練目標直接帶進這一天。</p>
<p>官網2026年9月30日的活動公告提及CIRCUIT WALL及COMPETITION WALL的特定日使用限制，也有整日休館訊息。可理解它有不同牆區和活動使用，但不能由牆名推定每一天的難度或可用範圍。初訪者先向工作人員了解當前課題與落地規則；只有室內初學經驗，也應從自己能處理的動作與高度開始。</p>
<h2>營業時間和入場價格</h2>
<p>2026年10月12日讀取的荻窪店官方頁列日本當地時間：平日13:00–23:00，週六、週日與國定假日10:00–21:00。一般成人通日票平日及假日均為含稅2,530日圓；平日白天至18:30、晚間18:00後為2,310日圓，平日21:00後為1,650日圓；假日18:00後票也為2,310日圓。票種須配合使用時間，不能把短時段費率當作全天費用。</p>
<p>料金有官方頁面差異：<a href="https://pump-climbing.com/gym/bpump/discovery">荻窪初訪頁</a>另列平日首次含稅4,510日圓，與主頁通日票加登錄的4,730日圓示例不一致。本篇採主頁各項費用加總作預算參考，不宣稱店家必定收這個數字；實際適用票種與初訪合計尚須向荻窪店確認。</p>
<p>首次登錄費2,200日圓；已在其他PUMP登錄且首次來荻窪者為1,100日圓。成人首次通日利用的預算示例：一般新登錄合計4,730日圓，其他PUMP登錄者合計3,630日圓。這是登錄加通日票的加總，不包含其他購物。已登錄狀態請在櫃台說明，不要自行假設兩店登錄費完全免繳。</p>
<h2>租借和初訪準備</h2>
<p>荻窪店列租鞋220日圓、租粉110日圓，兩項均初次免費。這與秋葉原店官網不同，規劃時一定讀自己的目的地頁。攜帶便於活動的衣物，抵達後完成登錄與使用說明，再了解級數標示、課題起終點與墜落區動線；不熟悉哪個範圍可站，就先問工作人員。</p>
<p>本文以成人獨立利用為情境；未成年人、團體、課程預約與大型行李存放的特定條件，本篇未完整核實。這些若影響能否入場，需先向荻窪店確認。不要因為本站寫出票價，就當成所有旅客的登錄程序和利用資格都已完成。</p>
<h2>如何把課題日排得有品質</h2>
<p>建議示例：開館後入場，先用幾條容易課題熟悉課題風格，再選兩三種有興趣的動作輪流練習，中間安排休息。若隔天有外岩，結束時間依恢復與交通安排調整，不必把岩館日排成無限重試。這是編輯建議，不是對荻窪級數、訓練成效或人潮的實測結論。</p>
<p>上述是2026年10月12日官方頁快照，不保證2027年四月仍同價同時。出發前再確認荻窪店當期營業、換線和活動限制，尤其不要只讀首頁保留的舊課題數或舊換線日期。當天可用牆面會影響你能完成的課題計畫；若碰到活動限制，請工作人員協助重新選區。</p>
<h2>參考資料</h2>
<ul>
<li><a href="https://pump-climbing.com/gym/bpump/">ボルダリングジム＆ショップ B-PUMP OGIKUBO 荻窪店</a></li>
<li><a href="https://pump-climbing.com/gym/bpump/discovery">ボルダリングジム＆ショップ B-PUMP OGIKUBO 荻窪店</a></li>
</ul>
<p><a href="/blog/44d66a525d64f97349d2c9b60de239be">繁體中文</a> · <a href="/en/blog/b8732fabf83588800175280c5cb82705">English</a> · <a href="/ja/blog/10d55aed821ce29227f89aa1f05ee146">日本語</a></p>
', NULL, 'gyms', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('44d66a525d64f97349d2c9b60de239be', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('44d66a525d64f97349d2c9b60de239be', '岩館指南');
DROP TABLE _blog_article_guard;
