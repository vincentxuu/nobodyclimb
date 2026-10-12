-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/576667d5eb7252593c4bbf1983e09fe9.md
-- source-sha256: 085f198d85d4a9d28b62a675ffa092926e00bfd3e9c2dae17c128e5e00ae1f80
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '576667d5eb7252593c4bbf1983e09fe9' OR slug = 'koutakuji-benten-climbing-guide-ja') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('576667d5eb7252593c4bbf1983e09fe9', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'koutakuji-benten-climbing-guide-ja', '広沢寺・弁天岩ガイド：厚木のスラブ練習と利用ルール', '弁天岩のスラブ練習、バスと林道の接近、私有地の約束と訓練範囲を整理します。', '<h2>足の使い方を練習したい一日に</h2>
<p>広沢寺の岩場は神奈川県厚木市にあり、代表的な一枚岩が弁天岩です。東京滞在の外岩日で足場の選択、重心、落ち着いた動きを練習したいなら候補になります。ロープ操作が自立したパートナーや講習を手配する初心者に向けて整理します。練習向きという紹介は、自由な架設や無管理の教室を意味しません。</p>
<p><a href="https://www.climbing-net.com/iwaba_detail/%E5%BA%83%E6%B2%A2%E5%AF%BA/">CLIMBING-net</a>は弁天岩のスラブを特徴とし、凝灰岩と記載しています。対岸の岩場なども含む広沢寺全体と分け、この記事は弁天岩に焦点を当てます。全エリアの本数や難度を一枚のスラブの選択肢として扱いません。</p>
<h2>練習内容からロープの方法を決める</h2>
<p>スラブでは足の置き方、バランス、移動のリズムに注意を向けられます。登攀、ビレイ、下降を最後まで扱えるラインを選び、そこで何を練習するかを決めましょう。出版社はリードと限定のあるトップロープを掲載していますが、壁全体に自由にトップロープを張れるという意味ではありません。</p>
<p>講習を依頼するなら、足使い、リード、ロープ手順のどれが目的かを事前に伝えます。トポ、支点、下降が不明なまま「初心者向き」で補わず、この記事でも共通のロープ長や器材数は指定しません。</p>
<h2>本厚木・伊勢原からバスと徒歩</h2>
<p>出版社の交通案内は小田急線本厚木または伊勢原から広沢寺温泉入口へバスで向かい、温泉方向へ歩いて車止めの先の林道を進むものです。温泉行きの便は少ないとされるため、停留所名を区別して当日の往復を確認してください。</p>
<p>車は広沢寺温泉前の指定された駐車方法を確認します。林道へ乗り入れたり路肩に停めたりせず、現地指示、補給、トイレを済ませてから岩場へ向かいましょう。過去の便利さや無料という情報を利用の権利と受け取らないでください。</p>
<h2>私有地の約束と訓練範囲を読む</h2>
<p><a href="http://mt-farm.info/koutakujiaizen.html">「広沢寺の岩場を守る会」の公開ルール</a>は私有地であることを説明し、ゴミの持ち帰り、伐採と焚き火の禁止、岩場や駐車場での幕営禁止を求めています。2016年の申し合わせを記録し、2019年からアイゼン・バイルの禁止範囲を基部の案内板に詳しく示すとしています。古いルート名だけで現行の許可範囲を確定しないでください。</p>
<p>実際の訪問日の利用条件と、アイゼン・バイル訓練の許可範囲は確認できていません。通常の岩登り旅行にその訓練を追加する必要はありません。目的として行うなら基部の当日掲示を読み、管理側に確認します。静かな利用、通路の確保、早めの片付けも練習計画に含めましょう。</p>
<h2>参考資料</h2>
<ul>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E5%BA%83%E6%B2%A2%E5%AF%BA/">山と溪谷社 CLIMBING-net — 広沢寺・弁天岩</a></li>
<li><a href="http://mt-farm.info/koutakujiaizen.html">MT Farm／広沢寺の岩場を守る会公開資料 — 広沢寺・弁天岩</a></li>
</ul>
<h2>ほかの言語</h2>
<p><a href="/blog/3776dfb661562fe8179ecbefb91a9c21">繁體中文</a> · <a href="/en/blog/9c0f7fdeb7726a56c75426b0c5d30d0c">English</a> · <a href="/ja/blog/576667d5eb7252593c4bbf1983e09fe9">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('576667d5eb7252593c4bbf1983e09fe9', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('576667d5eb7252593c4bbf1983e09fe9', '岩場指南');
DROP TABLE _blog_article_guard;
