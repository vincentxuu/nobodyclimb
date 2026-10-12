-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/0225e44e1bc9ca45cd60c5f524dfd8d3.md
-- source-sha256: df4858157be1ea40333a22e0f5abc9b42953d23cb5b4a14a7f5ca6675202d62b
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '0225e44e1bc9ca45cd60c5f524dfd8d3' OR slug = 'yugawara-makuiwa-climbing-guide-ja') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('0225e44e1bc9ca45cd60c5f524dfd8d3', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'yugawara-makuiwa-climbing-guide-ja', '湯河原幕岩ガイド：日当たりのよい岩壁と区画ごとの確認', '幕岩の日照と短いルート、バス接近、公園料金と区画の登攀許可を分けて確認します。', '<h2>東京から岩を中心にした一日へ</h2>
<p>湯河原幕岩は神奈川県湯河原町の幕山公園周辺にあります。駅とバスでつなぎ、自然の岩を登る日として検討できる場所です。自立したロープクライマー向けに季節、交通、区画の制限を整理します。初めての外岩なら指導者と行く区画を先に相談してください。</p>
<p><a href="https://www.yugawara.or.jp/sightseeing/893/">湯河原の公式観光ページ</a>は日当たりのよさ、冬の人気、短いルートと順番待ちを紹介しています。<a href="https://www.climbing-net.com/iwaba_detail/%E5%B9%95%E5%B2%A9/">CLIMBING-net</a>は凝灰岩、秋から春のシーズンを掲載します。計画に役立つ特徴ですが、晴天が全区画の自由な利用を保証するわけではありません。</p>
<h2>総本数より訪れる区画を決める</h2>
<p>幕岩は一枚の壁ではありません。出版社は正面壁、茅ヶ崎ロックなどを分け、一部の上部アプローチの危険と立入禁止範囲を記しています。区画と目標を決めてトポと利用条件を確認し、全エリアの本数から登れる量を推測しないでください。</p>
<p>短いラインも気軽とは限りません。出版社は短く傾斜が少ないリードでの墜落が危険になる場合を注意しています。選線、ビレイ位置、下降、回収をまとめて確認します。「初心者向き」という観光紹介は屋外のロープ能力を不要にするものではありません。</p>
<h2>湯河原駅から当日のバスを調べる</h2>
<p>公式観光ページはJR湯河原駅から幕山公園行きに乗り、終点下車、乗車約15分としています。出版社の古いページには診療所前からの徒歩案内もあります。両者を固定の時刻表のように組み合わせず、旅行当日の便、停留所、最終の帰りを確認して出発時刻を決めます。</p>
<p>ロープを片付け、区画から公園まで下り、バスを待つ時間を確保します。車は当期の駐車配置と現地指示を守り、道路や観光客用の区画を勝手に終日利用先としないでください。</p>
<h2>梅の季節の料金と立入制限は別に確認する</h2>
<p>公式ページは「梅の宴」期間の入園料と有料駐車を記しています。その年の開催日と料金を調べ、過去の金額を保証と受け取らないでください。公園への入園は特定の岩場の登攀許可を代替しません。</p>
<p>CLIMBING-netにはテントウムシロック以西の立入禁止とJFAでの現状確認が記載されています。適用時期を確定できる日付がないため、現在の全境界として扱いません。実際の訪問日の各区画の開放範囲とイベント期の料金は確認できていません。最新管理情報と現地掲示を読み、不明な場所へ入らないことが必要です。</p>
<h2>許可された区画内で予備目標を用意する</h2>
<p>同じ利用可能な区画で主目標と予備を決めると、空いた壁を探して区画間を移動するより計画しやすくなります。順番を相談し、帰路の締切を保ちましょう。公園の指定施設を使い、ゴミを持ち帰り、幕営しないでください。出版社は幕山公園のキャンプ禁止を掲載しています。他の公園利用者とも場所を共有する一日です。</p>
<h2>参考資料</h2>
<ul>
<li><a href="https://www.yugawara.or.jp/sightseeing/893/">湯河原温泉公式観光サイト — 湯河原幕岩</a></li>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E5%B9%95%E5%B2%A9/">山と溪谷社 CLIMBING-net — 湯河原幕岩</a></li>
</ul>
<h2>ほかの言語</h2>
<p><a href="/blog/55bc53c2ae00be9fa37bf43c61eb3ead">繁體中文</a> · <a href="/en/blog/517ad7d94b070775edab4dc5fc40fc23">English</a> · <a href="/ja/blog/0225e44e1bc9ca45cd60c5f524dfd8d3">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('0225e44e1bc9ca45cd60c5f524dfd8d3', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('0225e44e1bc9ca45cd60c5f524dfd8d3', '岩場指南');
DROP TABLE _blog_article_guard;
