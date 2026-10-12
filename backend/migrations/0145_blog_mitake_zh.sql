-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/5a344696cd02ef57df38a2864f25997c.md
-- source-sha256: 7df9c254dedbd124b133491088e4ff415ccf078314faa6aea56f683c6fb76c7d
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '5a344696cd02ef57df38a2864f25997c' OR slug = 'mitake-climbing-guide') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('5a344696cd02ef57df38a2864f25997c', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'mitake-climbing-guide', '御岳抱石指南：河岸岩塊、墜落墊安排與在地規則', '御岳河岸抱石與繩攀是不同的行程。先準備墜落墊、選合適課題，並遵守遊步道、停車與清潔規則。', '<h2>本文介紹的是御岳河岸抱石</h2>
<p><a href="https://www.rocktopo.net/areas/108">ROCKTOPO 御岳ボルダー頁</a>以東京都的燧石岩抱石為內容，並列忍者返しの岩、日影岩等岩塊。它不是把周邊繩攀岩場一併介紹的上攀指南。若東京旅程原本只帶繩索、快扣而不打算抱石，御岳不能直接當作同類替代；需要另行安排墜落墊與戶外抱石能力。</p>
<p>適合希望在城市旅行中加入戶外抱石、能判斷落地區與墜落風險的人。只在岩館抱石者，可以找熟悉御岳的帶隊者，從低而落地容易處理的課題開始；不要用室內級數推定河岸岩塊安全。離地高度、岩面濕滑、地面石頭與落地空間都要現場確認，墜落墊也不是任何高度的保證。</p>
<h2>課題和器材怎麼選</h2>
<p>ROCKTOPO列マミ岩中央4級、忍者返し1級作熱門課題線索；這是日制級數與資料頁名稱，不是保證能完攀的推薦。先用 topo 找起攀、終點與岩塊，再看實際落地範圍；到場後若與照片不符，不要為了追名字硬試。第一天以熟悉岩質與選落地可管理的課題為主，比追高難度更適合旅行節奏。</p>
<p><a href="https://freeclimb.jp/kantou-area/4891/">JFA御岳資料</a>記錄御岳站附近的マウンガ提供墜落墊、刷子與岩鞋租借。這能作租借線索，但本篇未核實店家當日庫存、價格與營業時間。若不自行帶墊，請先確認預約、領還時間與如何搬到岩區；不要搭到站後才把器材有無交給運氣。</p>
<h2>共享河岸的規則</h2>
<p>JFA提醒御岳也是釣魚、獨木舟與觀光者使用的場所：不要占用通路、不要大聲喧嘩，攀完要刷掉粉痕。夜間抱石、生火與非營地搭帳過夜禁止。把墜落墊與背包收在不擋路的位置，觀察其他使用者再移動；同行者等待時也不應占住遊步道，這些是實際能做的行動。</p>
<h2>交通、停車與四月行程</h2>
<p>以御岳站周邊作行程起點，再依選定岩塊安排步行與器材領取。確切東京出發車次及總車程本篇未核實，請查旅行當日班次。開車者可從JFA列出的寒山寺、御岳交流中心與御岳苑地停車場查現況；ROCKTOPO明示玉堂美術館上方廁所前停車場不能拿來整天抱石停車，僅允許廁所使用的停車。不能因為看到空位就使用。</p>
<p>ROCKTOPO將四月列入季節參考；仍須確認降雨、河岸通行和岩面是否乾燥，本篇未核實任何特定日的水位或開放狀況。建議示例：先處理領墊，上午選一個岩區，攀後刷粉，再依還墊時間提早撤離。若雨後落地或通路難以判斷，就改室內抱石。這是一日安排建議，不是當日狀態保證。</p>
<h2>參考資料</h2>
<ul>
<li><a href="https://www.rocktopo.net/areas/108">御岳ボルダー | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
<li><a href="https://freeclimb.jp/kantou-area/4891/">東京・御岳ボルダー</a></li>
</ul>
<p><a href="/blog/5a344696cd02ef57df38a2864f25997c">繁體中文</a> · <a href="/en/blog/48613c56b82390b44b67702d629eb6ba">English</a> · <a href="/ja/blog/8062be3f3deec2302597d0c88a01f1dd">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('5a344696cd02ef57df38a2864f25997c', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('5a344696cd02ef57df38a2864f25997c', '岩場指南');
DROP TABLE _blog_article_guard;
