-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/5b87e2eda04aaa15d696f3b1dbf5056d.md
-- source-sha256: 4192eb480a439f6a09f9f8138fa87c4493b54d01008bdb6d8455db3036b0d4db
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '5b87e2eda04aaa15d696f3b1dbf5056d' OR slug = 'kernel-rock-climbing-guide-ja') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('5b87e2eda04aaa15d696f3b1dbf5056d', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'kernel-rock-climbing-guide-ja', 'カーネルロックガイド：小さな石灰岩の岩場を訪れる前に', '小規模な石灰岩の選択肢、日向和田からの移動、未確認の入場と駐車条件を整理します。', '<h2>小さな岩場だから目標を先に絞る</h2>
<p>カーネルロックは東京都の小規模な自然の岩場です。東京旅行でロープクライミングを組み込むなら、多数の選択肢よりも、目標を絞った一日として検討できます。二人とも登りたいラインがあるかを確認し、力量の異なる大人数で行く場合は代替ルートの範囲も見てください。</p>
<p><a href="https://www.rocktopo.net/areas/1797">ROCKTOPOのエリア情報</a>では岩質は石灰岩。2026年10月12日の閲覧時点で、フェイスのリードが7ルート登録されています。これは投稿型データベースの記録であり、管理者が確定した総数や訪問日の利用可否ではありません。</p>
<h2>グレードと壁の形を一緒に見る</h2>
<p><a href="https://www.rocktopo.net/rocks/8264">メインエリアの掲載</a>にはプレイヤー（5.9）、セント・フローリア（5.10a）、ぶらり（5.10c）、カモン・エディ！（5.11a）があります。中央のラインには小ハング、別のラインにはフレークやポケットで越える明瞭なハングという説明があります。実際のトポと照合できるよう、ルート名は日本語のまま使いましょう。</p>
<p>同じ5.10台でも、ハングの出だしと垂直の連続した登りでは必要な動きが違います。余裕のある一本と挑戦したい一本を候補にし、混雑や不具合があれば目標を変えられるようにしておきます。小規模な岩場では代替の選択肢にも限りがあります。</p>
<h2>駐車の投稿を許可と受け取らない</h2>
<p><a href="https://beta-climbing.com/lesson/weekday_climbing_club">BETA Climbingの外岩活動案内</a>は青梅市、JR日向和田駅から徒歩約5分としています。活動計画の参考であり、個人の訪問許可ではありません。メインエリアにはRose Town Tea Gardenの駐車場が利用可能「とのこと」とあります。この記述だけで店側の許可や自由な利用を確定することはできません。位置をもとに鉄道、徒歩、接続手段を調べ、入口と通行方法、施設の条件を現地側に確認してください。</p>
<p>カーネルロックの管理者による告知は取得できておらず、入場・駐車・料金の条件は確認できていません。確認先につながらなければ、利用条件が明確な別の候補を残しておきましょう。到着してから店の敷地を横切ったり、路肩を探したりする計画にはしないでください。上記の約5分はその活動案内の記述に限ります。個人訪問者の当日のアプローチと所要時間、店の営業時間や駐車料金は確認できていません。</p>
<h2>装備は登るラインから決める</h2>
<p>取得したテキストだけでは、全ルート共通のロープ長や必要なクイックドロー数を示せません。目標の完全なトポを入手し、長さ、下降、支点を確認してからパートナーと装備を照合します。旅行の荷物を減らすために必要な器材を省かないことが大切です。</p>
<p>季節欄は涼しい月が中心ですが、当日の乾燥を保証しません。濡れた岩、不明瞭な入口、想定と異なる条件があれば予定を変更できる日程にしましょう。事前確認を終え、少数の明確な目標を持つ人に向く候補です。</p>
<h2>参考資料</h2>
<ul>
<li><a href="https://www.rocktopo.net/areas/1797">ROCKTOPO — カーネルロック</a></li>
<li><a href="https://www.rocktopo.net/rocks/8264">ROCKTOPO — カーネルロック</a></li>
<li><a href="https://beta-climbing.com/lesson/weekday_climbing_club">BETA Climbing — カーネルロック</a></li>
</ul>
<h2>ほかの言語</h2>
<p><a href="/blog/a11b01e0adba7d6b2cfd364b88cbfcac">繁體中文</a> · <a href="/en/blog/3404251672a20c98c78d55609045d1f8">English</a> · <a href="/ja/blog/5b87e2eda04aaa15d696f3b1dbf5056d">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('5b87e2eda04aaa15d696f3b1dbf5056d', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('5b87e2eda04aaa15d696f3b1dbf5056d', '岩場指南');
DROP TABLE _blog_article_guard;
