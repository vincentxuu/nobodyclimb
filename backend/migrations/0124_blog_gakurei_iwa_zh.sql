-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/52fa6a72b2179173608991efd3bd602f.md
-- source-sha256: 1f472e3193d0906d41eeaefc47ed30145e5171cfe8173f2cb7aab5a444a88646
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '52fa6a72b2179173608991efd3bd602f' OR slug = 'gakurei-iwa-climbing-guide') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('52fa6a72b2179173608991efd3bd602f', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'gakurei-iwa-climbing-guide', '岳嶺岩攀岩指南：日原河岸的五座岩峰與舊線準備', '岳嶺岩是日原川河岸的岩峰群。先核對目標峰、舊保護與通行現況，再決定是否納入東京外岩行程。', '<h2>想探索岩峰群，先把目標縮到一面壁</h2>
<p>岳嶺岩位於東京奧多摩日原川河岸，適合已有戶外繩攀能力、願意研究舊線與保護的人。它不是「有簡單級數就能直接入門」的目的地；出發前最好已知道自己要到哪座岩峰，而不是到了河邊才決定。</p>
<p><a href="https://www.climbing-net.com/iwaba_detail/%E5%B2%B3%E5%B6%BA%E5%B2%A9/">CLIMBING-net 的介紹</a>描述 A、B、C 三座較大岩峰與 D、E 兩座較小岩峰，共五座。這樣的分割槽意味著一個「岳嶺岩」名稱下可能有不同起攀點與路線；傳給同行者的資料應指出目標峰和線名，不能只是一個共同座標。</p>
<h2>先用路線資料理解範圍</h2>
<p><a href="https://www.rocktopo.net/areas/106">ROCKTOPO 區域頁</a>收錄 face 路線，<a href="https://www.rocktopo.net/rocks/2226">C 至 E 峰頁</a>列有 ポパイ・ス・スキ 5.10b、鬼門 5.11b、ロック・スピリット 5.12b 等例子。這些是資料庫級數，不是 NobodyClimb 的現場測評，也不能從「face」分類推論它們具有現代、完整的 bolt 保護。</p>
<p>可以先選一條符合能力的候選，再尋找對應 topo、長度、結束點與下降資訊。若不同資料的線名或位置不一致，先向熟悉者確認，而不靠級數猜測是哪條。資料庫的一份清單，不能代替同伴間對目標與撤退的共同理解。</p>
<h2>舊固定點與級數要分開看</h2>
<p>出版者提醒許多線使用 ring bolt 或 piton，也指出強行打釘可能改變級數。這是兩種需要分開處理的問題：固定點的可靠性要判斷，動作難度也可能不能完全照舊錶。低階數並不抵消保護、岩質或下降的不確定性。</p>
<p>本文不提供人工攀登、打釘或支點架設教學，也不把增設保護當成旅行者可以自行做的解法。若不能判斷既有保護、辨認結束點與安全退回，就先補足技能、尋求適當指導，或取消這一站。只帶一般運攀快扣來到現場，再問如何撤退，順序已經太晚。</p>
<h2>到日原之前，先完成交通與接近確認</h2>
<p>出版者列出從奧多摩站搭巴士到東日原、再步行約 20 分鐘的接近參考，也說平日可從中日原縮短距離。這是介紹頁的資訊，不是旅行當日巴士服務保證；應查當日班次和回程，再確認由道路下到河岸的路線。</p>
<p>本指南未核實目前巴士停靠、接近通行、停車資格與固定點狀況，出發前須取得近期資訊，不依舊頁直接停車或進入。一般介紹將季節寫為通年但冬季寒冷，對行程只是氣候線索，不能保證任何一天適合攀登。</p>
<p>若你想把岳嶺岩列入東京旅程，先完成目標峰、路線、保護、下降與回程五項準備。帶水、食物、雨具與照明，將河岸現況和撤退餘裕納入判斷。它值得研究的是五座岩峰中的舊線特色，適合有具體計畫的探索，而不是臨時補一個「冷門岩場」打卡。</p>
<h2>參考資料</h2>
<ul>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E5%B2%B3%E5%B6%BA%E5%B2%A9/">岳嶺岩</a></li>
<li><a href="https://www.rocktopo.net/areas/106">岳嶺岩 | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
<li><a href="https://www.rocktopo.net/rocks/2226">C峰～E峰 | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
</ul>
<p><a href="/blog/52fa6a72b2179173608991efd3bd602f">繁體中文</a> · <a href="/en/blog/8a57b4ba16e86e3c07ccc9a2068eb344">English</a> · <a href="/ja/blog/bcedf8485d7ea87fa0001f82d0a54ff8">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('52fa6a72b2179173608991efd3bd602f', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('52fa6a72b2179173608991efd3bd602f', '岩場指南');
DROP TABLE _blog_article_guard;
