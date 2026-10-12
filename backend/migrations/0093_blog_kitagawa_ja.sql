-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/539a55b775755912bb59b30b8edc855d.md
-- source-sha256: 107fb90a9e1f14a9d25c332cb439bee3b9bf1c01bcb8122931d6fd6112ea7bd2
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '539a55b775755912bb59b30b8edc855d' OR slug = 'kitagawa-climbing-guide-ja') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('539a55b775755912bb59b30b8edc855d', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'kitagawa-climbing-guide-ja', '北川ガイド：西吾野から歩いて大ハングの岩場へ', '北川のハング、下降と回収、西吾野からの徒歩、地域の駐車と静かな利用の要望を確認します。', '<h2>ハングを目標にするパートナーへ</h2>
<p>北川は埼玉県飯能市の自然の岩場で、西吾野から徒歩で近づけます。外岩のリードとビレイを自立して行える二人に向く候補です。易しいルートを多数必要とするグループは、難度の構成を見てから予定に入れてください。</p>
<p><a href="https://www.climbing-net.com/iwaba_detail/%E5%8C%97%E5%B7%9D/">CLIMBING-net</a>は大ハングを特徴とし、岩質をチャートとしています。<a href="https://www.rocktopo.net/areas/95">ROCKTOPO</a>は2026年10月12日の閲覧時にフェイスのリード19ルートを登録し、5.10台・5.11台・5.12台を含んでいます。投稿型資料の記録は利用許可の一覧ではなく、易しいルートが少数あっても初心者グループがいつでも登れるとは限りません。</p>
<h2>グレードの前に下降と回収を読む</h2>
<p>出版社はハング上の終了点と回収用支点を区別し、ロープドラッグ、古いスリング、支点の老朽化を記述しています。質問すべき点を見つける情報として読み、実際のトポや現場判断の代わりにしないでください。</p>
<p>候補の長さ、終了位置、下降、器材回収を旅行前に確認します。かぶったラインの回収に慣れていなければ、登れるグレードというだけで取り付かず、詳しい同行者を探すか最後まで扱える目標を選びましょう。</p>
<h2>西吾野から余裕を持って歩く</h2>
<p>出版社の交通案内は西武線西吾野駅から全昌寺を経て中組自治会館へ向かい、その脇の踏み跡に入るものです。同じページ内で徒歩時間に幅があるため、固定の所要時間を約束せず道筋を参考にします。電車と徒歩なら狭い駐車場の問題も避けられます。</p>
<p>水と昼食を用意し、帰りの列車と下山する時刻を先に決めます。紹介には暗くなる前の下山を望む住民の要望もあります。片付けと徒歩を明るいうちに終えられるよう、最後のトライを早めに設定しましょう。</p>
<h2>支払いと静かな利用を守る</h2>
<p><a href="https://freeclimb.jp/access/10214/">JFAの2025年5月の告知</a>は、取り決めの一台500円を払わない人がいることと、狭い駐車場で効率よく停めてほしいことを伝えています。日付のある地域の要望なので、将来の料金保証とせず、現在の金額、支払い、駐車指示を確認します。満車なら路肩を使わず予定を変えてください。</p>
<p>出版社は岩場が地域の信仰対象であり、地主と住民の理解で利用されていることを説明しています。叫び声、火器、器材の残置、過度のチョーク跡を避け、住民には来意を伝えて挨拶しましょう。駐車代だけで解決する問題ではありません。</p>
<p>実際の訪問日の利用条件と駐車条件は確認できていません。春秋の適期という紹介を計画の参考にしつつ、最新告知、雨、現地指示を再確認してください。</p>
<h2>参考資料</h2>
<ul>
<li><a href="https://www.rocktopo.net/areas/95">ROCKTOPO — 北川</a></li>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E5%8C%97%E5%B7%9D/">山と溪谷社 CLIMBING-net — 北川</a></li>
<li><a href="https://freeclimb.jp/access/10214/">日本フリークライミング協会 JFA — 北川</a></li>
</ul>
<h2>ほかの言語</h2>
<p><a href="/blog/ca9339e1ccb8ed108c5404f374ec48c9">繁體中文</a> · <a href="/en/blog/3bd5d63c9d8194fc6a547792b33ed6e7">English</a> · <a href="/ja/blog/539a55b775755912bb59b30b8edc855d">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('539a55b775755912bb59b30b8edc855d', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('539a55b775755912bb59b30b8edc855d', '岩場指南');
DROP TABLE _blog_article_guard;
