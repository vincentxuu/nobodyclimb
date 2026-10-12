-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/e581bf0c98b450fee3b3325aa169cdc1.md
-- source-sha256: d23666d90e6020b96bfd32bf8ff2345495aa69a46b80226b03e361dec009abd5
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = 'e581bf0c98b450fee3b3325aa169cdc1' OR slug = 'tenno-iwa-climbing-guide-ja') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('e581bf0c98b450fee3b3325aa169cdc1', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'tenno-iwa-climbing-guide-ja', '天王岩ガイド：電車とバスで計画する秋川のリードクライミング', '天王岩の岩質と上下の区画、武蔵五日市からのバス、釣場施設の利用制限を整理します。', '<h2>秋川でリードを楽しみたい人へ</h2>
<p>天王岩は東京都あきる野市養沢にある自然の岩場です。屋外でのリードとビレイを自立して行えるパートナー同士に向け、岩の特徴と移動が旅行日程に合うかを整理します。室内ボルダリングだけの経験なら、先に外岩講習や現地に詳しい人の同行を手配してください。</p>
<p><a href="https://www.climbing-net.com/iwaba_detail/%E5%A4%A9%E7%8E%8B%E5%B2%A9/">CLIMBING-netの紹介</a>では岩質はチャート、5.10台と5.11台のルートが多く、垂直から薄かぶりの壁とされています。グレードを候補選びに使いつつ、実際のトポ、支点、屋外での経験から登るラインを決めましょう。</p>
<h2>上下の岩場を決めてからルートを選ぶ</h2>
<p><a href="https://www.rocktopo.net/areas/111">ROCKTOPOの天王岩ページ</a>は上の岩場と下の岩場を分け、ボルダーも掲載しています。同じ地名でも必要な装備は異なります。この記事はロープを使う日を想定しているので、どの区画で何を登るかをパートナーと先に合わせてください。</p>
<p>出版社の紹介は北西向きで冬は寒いとしています。春の旅行では直前の雨を確認し、現場の岩の状態を見て登るか判断しましょう。通年という表示は乾燥の保証ではありません。普段の外岩限界より余裕のある一本から始め、手足の置き方と下降を確認してから次の目標へ進む計画が組めます。</p>
<h2>武蔵五日市から先のバスを確認する</h2>
<p>紹介されている交通の骨格は、武蔵五日市駅から養沢方面のバスで曽利郷橋へ行き、車道脇の指定された山道から取り付くものです。宿泊地や出発時刻は、旅行当日の往復バスを調べてから決めましょう。ここでは固定の便や新宿からの所要時間を約束しません。</p>
<p>以前の火葬場へ向かう道は地権者から通行しないよう求められています。秋川国際マス釣場の駐車場、その周辺の路肩、岩場上の資材置き場を駐車先にしないでください。車なら十里木の正規の駐車方法を確認し、追加の徒歩やバス移動も予定に入れます。</p>
<h2>補給と帰路を登る前に決める</h2>
<p>釣場の施設はクライマー用のサービスではありません。両資料はトイレの無断利用を避けるよう求めています。アプローチ前に用を済ませ、飲食物を用意し、ゴミは持ち帰りましょう。釣場の売店や食堂を利用するときも、施設のルールを先に尋ねてください。</p>
<p>実際の訪問日の開放状況と通行条件は確認できていません。交通予約後も管理情報を再確認し、データベース掲載を許可の代わりにしないでください。片付け、徒歩、バス待ちの余裕を残して岩場を出る時刻を決めると、一本追加するために帰路を圧迫せずに済みます。</p>
<h2>参考資料</h2>
<ul>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E5%A4%A9%E7%8E%8B%E5%B2%A9/">山と溪谷社 CLIMBING-net — 天王岩</a></li>
<li><a href="https://www.rocktopo.net/areas/111">ROCKTOPO — 天王岩</a></li>
</ul>
<h2>ほかの言語</h2>
<p><a href="/blog/90992eb1ee13ff8fc149773ec213bedf">繁體中文</a> · <a href="/en/blog/1b2a18866f18fd1a3b01da67b0a2d9bf">English</a> · <a href="/ja/blog/e581bf0c98b450fee3b3325aa169cdc1">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('e581bf0c98b450fee3b3325aa169cdc1', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('e581bf0c98b450fee3b3325aa169cdc1', '岩場指南');
DROP TABLE _blog_article_guard;
