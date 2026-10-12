-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/4c9b21b244fc4b4377bc5a242c083c77.md
-- source-sha256: 46f44c6cff59bc8a31d2d4797a1df5513da190a514625c4ecc67f4c6bfcf7c73
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '4c9b21b244fc4b4377bc5a242c083c77' OR slug = 'kawamata-climbing-guide-ja') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('4c9b21b244fc4b4377bc5a242c083c77', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'kawamata-climbing-guide-ja', '河又ガイド：名栗の石灰岩と蛇岩崩落の注意情報', '河又の石灰岩、飯能からのバス、駐車の約束を、蛇岩崩落情報と合わせて確認します。', '<h2>壁を決める前に崩落情報を読む</h2>
<p>河又は埼玉県飯能市下名栗にある石灰岩のエリアです。外岩のリード経験があるパートナー同士に向け、交通、選ぶ壁、利用条件を分けて整理します。複数の岩場を含むため、「河又」という名前だけで全区画が同じ状態と考えないでください。</p>
<p>まず<a href="https://freeclimb.jp/access/10282/">JFAの2025年10月の蛇岩崩落情報</a>を確認します。崩落の報告を受け、詳細不明として、しばらく近寄らないよう注意しています。日付のあるこの情報から河又全体の閉鎖を推測することはできませんが、データベースにルートが残っていても蛇岩の再開を意味しません。</p>
<p>同じ<a href="https://www.climbing-net.com/iwaba_detail/%E6%B2%B3%E5%8F%88/">CLIMBING-netの紹介</a>は冒頭に2010年の禁止解除を記す一方、「その他」欄にはコウモリ岩は原則禁止と記載しています。両記述の適用範囲と後者の更新日は確認できておらず、過去の解除から現在の利用可を判断できません。この注意を残したうえで管理側に目的の岩場を確認し、確認前はコウモリ岩へ入らないでください。</p>
<h2>石灰岩の具体的な目標を絞る</h2>
<p><a href="https://www.climbing-net.com/iwaba_detail/%E6%B2%B3%E5%8F%88/">CLIMBING-netの紹介</a>は垂直からかぶった石灰岩と、5.10台・5.11台の多い構成を掲載しています。<a href="https://www.rocktopo.net/areas/94">ROCKTOPOの索引</a>でも複数の岩場に分かれています。壁と登るラインを決めてトポを入手し、索引全体を自由に移動できる一つの場所として扱わないことが必要です。</p>
<p>旅行の一日なら余裕のある最初の一本と、挑戦したい一本を候補にできます。出版社は古い支点、劣化したスリング、浮き石も指摘しています。リボルトは壁全体の安全保証ではないため、装備と下降を実際のラインに合わせて確認しましょう。</p>
<h2>飯能からバス、帰りの便を先に決める</h2>
<p>飯能または東飯能から名栗方面のバスで河又名栗湖入口へ向かうのが交通の骨格です。<a href="https://www.saitamabus.jp/app/routebusstop/busstop/stopid/11-24126">埼玉県バス協会の停留所情報</a>に飯能との系統が掲載されています。旅行当日の運行を調べ、出版社の尾須沢鍾乳洞案内板からのアプローチ記述を最新の現地案内と照合してください。</p>
<p>帰りの便と岩場を出る時刻を決めてからトライ数を配分します。重い荷物や不慣れな山道では掲載の徒歩時間をそのまま使わず、余裕を持たせましょう。看板、入口、地形が資料と違えば、進まず確認し直します。</p>
<h2>地図の空き地より地域の駐車ルールを優先する</h2>
<p>ROCKTOPOは有料の河原駐車場を利用する地域との取り決めを掲載しています。出版社には古い駐車案内も残っています。指定場所、支払い、時間を現地に確認し、公衆トイレ前の短時間利用の場所を占有したり、無断でゲートを動かしたりしないでください。</p>
<p>蛇岩の再開と、他の岩場の実際の訪問日の利用条件は確認できていません。最新の許可や状態が分かるまで、変更できない唯一の外岩予定にはしないでください。食料と水、トイレを先に準備し、ゴミを持ち帰り、火器を使わず、地域の負担を増やさない一日にしましょう。</p>
<h2>参考資料</h2>
<ul>
<li><a href="https://www.rocktopo.net/areas/94">ROCKTOPO — 河又</a></li>
<li><a href="https://freeclimb.jp/access/10282/">日本フリークライミング協会 JFA — 河又</a></li>
<li><a href="https://www.saitamabus.jp/app/routebusstop/busstop/stopid/11-24126">埼玉県バス協会 — 河又名栗湖入口</a></li>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E6%B2%B3%E5%8F%88/">山と溪谷社 CLIMBING-net — 河又</a></li>
</ul>
<h2>ほかの言語</h2>
<p><a href="/blog/5e435298b3f0aefaa8f64a209f252ab8">繁體中文</a> · <a href="/en/blog/35cbd4d53e55dc61ee5640f58190600d">English</a> · <a href="/ja/blog/4c9b21b244fc4b4377bc5a242c083c77">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('4c9b21b244fc4b4377bc5a242c083c77', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('4c9b21b244fc4b4377bc5a242c083c77', '岩場指南');
DROP TABLE _blog_article_guard;
