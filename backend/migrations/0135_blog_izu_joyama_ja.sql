-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/f902725d10853b2ce13782a94ae46efd.md
-- source-sha256: f71c98b028b0c8240ce1de5b896467736f5422455a8457708468d99df88a62c9
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = 'f902725d10853b2ce13782a94ae46efd' OR slug = 'izu-joyama-climbing-guide-ja') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('f902725d10853b2ce13782a94ae46efd', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'izu-joyama-climbing-guide-ja', '伊豆・城山クライミングガイド：南壁と上部エリアの選び方', '城山の南壁と上部エリアは登り方もアプローチも異なる。目的に合う岩場を選び、大仁からの一日を計画する。', '<h2>城山は一つの登り方に限らない</h2>
<p>伊豆の城山は静岡県の大仁周辺にあります。<a href="https://www.climbing-net.com/iwaba_detail/%E5%9F%8E%E5%B1%B1/">CLIMBING-netの岩場紹介</a>では、南壁のスラブとワイルドボアゴージなどを紹介し、ボルトルートとマルチピッチを掲載しています。パートナーと屋外での確保を行える人向けの行き先です。経験がジムだけなら、初中級向けルートの表示を単独で行ける意味にせず、講習やガイドを手配しましょう。</p>
<p><a href="https://www.rocktopo.net/areas/10">ROCKTOPOの城山ページ</a>もフェイスとマルチピッチを分け、岩質を凝灰岩としています。<a href="https://izugeopark.org/geosites/joyama/">伊豆半島ジオパーク</a>は、この景観を地表に現れた「火山の根」と説明しています。地形の理解には役立ちますが、支点や利用状況の判断には使えません。南壁のシングルピッチ、マルチピッチ、上部エリアでは、一日の組み方が異なります。</p>
<h2>トポで目的を絞る</h2>
<p>ROCKTOPOにはバトルランナーの最高グレード5.10a、ストーンフリー5.10c、ミウラー5.11aが掲載されています。詳細トポを探す手がかりにしてください。最高グレードだけでは、各ピッチの長さ、プロテクション、下降は分かりません。本稿はムーブごとの解説をしないため、エリア、ピッチ数、ロープ条件、撤退方法を事前に確認します。力量に差があるチームは、全員が参加できるシングルピッチから選ぶとよいでしょう。</p>
<h2>大仁からのアプローチを混同しない</h2>
<p>CLIMBING-netでは伊豆箱根鉄道の大仁駅から登山道入口まで徒歩約25分、そこから南壁まで約10分としています。上部のワイルドボアゴージは別のアプローチです。これは出版社の目安で、当日の移動を保証しません。大仁までの列車を調べ、最後の区間は現行トポで確認してください。南壁の時間を全エリアに当てはめないこと。現在の駐車台数、料金、全域の利用状況は、管理主体には確認していません。</p>
<h2>季節と日程</h2>
<p>シーズンの表示にも幅があります。CLIMBING-netは9月下旬から6月上旬、ROCKTOPOは11月から3月を中心に挙げています。4月のどの日も涼しく乾くという保証ではなく、季節選びの参考です。直前の雨、岩の状態、風を確認して実施を決めましょう。ボルトがあることと全支点の点検済みは別です。ルートに必要な装備を用意し、判断できる人が現場を確認します。</p>
<p>日程例は、前夜を大仁周辺で過ごし、初日は南壁だけにする組み方です。上部エリアまで詰め込まず、地形と下降を把握してから少数の目標を選びます。帰りの歩行と乗り換えも残します。マルチピッチなら支点作業、ロープ整理、下降を含めて時間を計算し、打ち切る時刻を決めましょう。これは編集上の提案で、NobodyClimbの実登記録ではありません。</p>
<h2>参考資料</h2>
<ul>
<li><a href="https://www.rocktopo.net/areas/10">城山 | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E5%9F%8E%E5%B1%B1/">城山</a></li>
<li><a href="https://izugeopark.org/geosites/joyama/">城山 | 南から来た火山の贈りもの | 伊豆半島ジオパーク公式サイト</a></li>
</ul>
<p><a href="/blog/846b2bf6c46598816c9c71352d76080c">繁體中文</a> · <a href="/en/blog/f9c33618b02b1700c394aeb058870e5a">English</a> · <a href="/ja/blog/f902725d10853b2ce13782a94ae46efd">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('f902725d10853b2ce13782a94ae46efd', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('f902725d10853b2ce13782a94ae46efd', '岩場指南');
DROP TABLE _blog_article_guard;
