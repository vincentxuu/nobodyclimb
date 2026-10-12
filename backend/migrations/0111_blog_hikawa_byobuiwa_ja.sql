-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/395cb55a029370fe1c56cd80f6ede51a.md
-- source-sha256: baf7b5b924e38a6f66531a70368659340cb1a80bf188d1e903f239182811dcf7
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '395cb55a029370fe1c56cd80f6ede51a' OR slug = 'hikawa-byobuiwa-climbing-guide-ja') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('395cb55a029370fe1c56cd80f6ede51a', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'hikawa-byobuiwa-climbing-guide-ja', '氷川屏風岩ガイド：奥多摩駅から向かう変化のある岩壁', 'スラブから前傾壁まである氷川屏風岩の特徴、駅からの接近、古いルートを選ぶ際の確認事項を紹介します。', '<h2>グレードより先に登りたい地形を選ぶ</h2>
<p>氷川屏風岩は東京都奥多摩町氷川の岩場です。外岩でのロープクライミング経験があり、トポで岩峰やルートを見分けられる人に向いた候補です。駅から歩ける点は魅力ですが、駅に近いことだけで、すべてが新しい支点の分かりやすいスポートルートだとは判断できません。</p>
<p><a href="https://www.climbing-net.com/iwaba_detail/%E6%B0%B7%E5%B7%9D%E5%B1%8F%E9%A2%A8%E5%B2%A9/">CLIMBING-net の紹介</a>は、人工登攀中心だった岩場に 1980 年代からフリールートが開拓され、A 峰のスラブ、C 峰の前傾壁、ルーフなどへ広がったと説明しています。スラブは比較的緩い傾斜の岩面、ルーフは屋根状の強い傾斜です。地形によって足の使い方、持久力、ロープの扱いが変わるため、グレードだけでなくエリアを選びましょう。</p>
<h2>駅からの徒歩でも準備は必要</h2>
<p>出版者の案内では奥多摩駅から徒歩約 30 分で、沢道と尾根道を区別し、フクロウ岩へは沢道を使うとしています。これは掲載された目安であり、装備を背負った道探しや休憩、足元への対応を含む保証時間ではありません。</p>
<p>同じ資料は路上駐車不可とし、駅でトイレを済ませ、水を持参することを勧めています。東京の宿からなら奥多摩駅を交通計画の基点にし、当日の列車と帰路を確認します。地図上の距離が短くても水や食事を省かず、不明な空き地を駐車場所にしないでください。</p>
<h2>古いルートで確認したいこと</h2>
<p>紹介には一部脆い岩があること、C 峰では終了点用に長めのスリングを準備することが記載されています。<a href="https://www.rocktopo.net/rocks/1671">ROCKTOPO の岩壁ページ</a>には、苔、ピトン、リングボルト、終了点の見分けにくさに関する利用者の記録もあります。個別の記録から全支点が危険と断定はできませんが、岩場に詳しい人へ質問する材料になります。</p>
<p>目標の岩峰、終了点、下降方法、必要な装備を確認してから登攀を決めましょう。終了点の判断や構築ができない場合は、対応できるパートナーや適切な指導を得る必要があります。ジムのグレードやデータベースのルート数だけで、安全の余裕や一日の登攀量は決まりません。</p>
<h2>季節の説明を当日の保証にしない</h2>
<p>CLIMBING-net は岩質をチャートとし、雨後の乾きがよく冬も暖かいと紹介しています。一般的な特徴であり、雨の直後に必ず登れるという意味ではありません。本記事では各ルートの現在の濡れ、苔、固定支点の状態を確認していないため、現地でルートごとに判断してください。</p>
<p>明確な少数の目標と代替案を用意し、トポのエリア、水と装備、下山と帰りの列車まで確認しておきます。接近路や岩面が適さなければ登攀を取りやめましょう。岩壁の変化と歴史を理解しながら訪れることが、この岩場を選ぶ楽しみにつながります。</p>
<h2>参考資料</h2>
<ul>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E6%B0%B7%E5%B7%9D%E5%B1%8F%E9%A2%A8%E5%B2%A9/">氷川屏風岩</a></li>
<li><a href="https://www.rocktopo.net/rocks/1671">氷川屏風岩 | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
</ul>
<p><a href="/blog/82e5ced58bcad87924ada8646bd4e3b2">繁體中文</a> · <a href="/en/blog/c78784d147efe236d7b3cf29c9342a9c">English</a> · <a href="/ja/blog/395cb55a029370fe1c56cd80f6ede51a">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('395cb55a029370fe1c56cd80f6ede51a', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('395cb55a029370fe1c56cd80f6ede51a', '岩場指南');
DROP TABLE _blog_article_guard;
