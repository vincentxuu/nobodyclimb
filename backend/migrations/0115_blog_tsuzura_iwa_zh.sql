-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/e06757387faaa1797f6f6934f2343249.md
-- source-sha256: 25e80c2eae9a9b163dd7acc84c3fafc1d059b1a2b7870ac5257e75068d353204
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = 'e06757387faaa1797f6f6934f2343249' OR slug = 'tsuzura-iwa-climbing-guide') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('e06757387faaa1797f6f6934f2343249', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'tsuzura-iwa-climbing-guide', 'つづら岩攀岩指南：把長接近也算進山嶽訓練', 'つづら岩位於馬頭刈尾根，以山嶽訓練取向與較長接近為特色。先確認能力、topo 和回程，不與天狗岩混為同一目的地。', '<h2>從山路開始的攀登日</h2>
<p>つづら岩是東京馬頭刈尾根上的攀登岩場，適合願意把負重步行與繩索操作一起安排的人。選它的理由是山嶽訓練，而不只是從東京出發找幾條運攀線。對只有一天空檔的旅行者，最先要決定的是：想把多少時間留給步行，多少時間留給岩壁？</p>
<p><a href="https://www.climbing-net.com/iwaba_detail/%E3%81%A4%E3%81%A5%E3%82%89%E5%B2%A9%E3%80%81%E5%A4%A9%E7%8B%97%E5%B2%A9/">CLIMBING-net 的介紹</a>將つづら岩描述為長期使用的訓練岩場，接近約一個半小時。這是從接近路段理解的來源估計，並非東京住宿到起攀點的總時間。不要把它當成市區岩館式的「到場就爬」。</p>
<h2>同頁出現天狗岩，但要分開規劃</h2>
<p><a href="https://www.rocktopo.net/areas/101">ROCKTOPO</a>與出版者頁面把つづら岩、天狗岩合列。共同條目不代表是同一面岩壁：介紹中的つづら岩在尾根上，天狗岩是瀑布側壁，接近時間也不同。若分享行程給朋友，請寫清楚當天目的地是つづら岩，避免有人以較短的天狗岩步行時間估算整隊行程。</p>
<p>出版者提供從武藏五日市搭巴士到千足的接近線索。實際出發前，要另外核對當天班次、登山道與起攀點，不把巴士站名稱當成完整導航。儲存離線地圖與 topo，也把回程班次寫下來；過了自己的折返時間，就不再增加新目標。</p>
<h2>舊路線的裝備不是看級數就知道</h2>
<p>介紹特別提醒某些舊線的 piton 孔口可能無法直接扣入 carabiner，並提到需要 sling 的情境。這是判讀舊路線裝備的線索，不能直接照做就假定支點可靠。是否適合使用、如何保護與撤退，仍需由具備相關能力的人現場判斷。</p>
<p>同一頁提到山崎ハングルート，約 30 公尺的尺度可作為認識岩場歷史與線形的例子，不是本指南對旅行者的推薦爬法。先挑符合整隊能力的目標，確認中途架站、結束點與下降，再整理裝備。若你只有地面確保的經驗，先補足技能或安排適當指導，不以「訓練場」三字推論能自行學會。</p>
<h2>讓步行與撤退都有餘裕</h2>
<p>以編輯規劃建議來說，這一天應留出裝備整理、負重上坡、路線辨認、下降與下山的空間。帶水、行動糧、雨具、頭燈與合適步行鞋，登山裝備不要被攀登裝備擠出揹包；頭燈是備援，不是延長攀登到天黑的理由。</p>
<p>本指南未核實つづら岩現行開放、登山道通行與固定點狀況，出發前須取得近期資訊並以現場告示為準。一般網站沒有新留言，不等於路線封閉；同樣地，資料庫仍有條目也不等於通行無虞。</p>
<p>如果旅程目的是有計畫的山嶽訓練，且全隊能處理所選路線與撤退，つづら岩值得列為候選。若只是想在東京附近迅速完成幾條運攀線，先比較接近成本和自己的時間，再決定這座尾根上的岩場是否適合當天。</p>
<h2>參考資料</h2>
<ul>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E3%81%A4%E3%81%A5%E3%82%89%E5%B2%A9%E3%80%81%E5%A4%A9%E7%8B%97%E5%B2%A9/">つづら岩、天狗岩</a></li>
<li><a href="https://www.rocktopo.net/areas/101">つづら岩、天狗岩 | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
</ul>
<p><a href="/blog/e06757387faaa1797f6f6934f2343249">繁體中文</a> · <a href="/en/blog/42334c89066afb25b1b265431e5c4296">English</a> · <a href="/ja/blog/f593da3943f02c8541fd4365a2e857de">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('e06757387faaa1797f6f6934f2343249', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('e06757387faaa1797f6f6934f2343249', '岩場指南');
DROP TABLE _blog_article_guard;
