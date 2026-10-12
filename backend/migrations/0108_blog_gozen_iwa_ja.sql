-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/954fded07c2b02e46cb4676c2e347ca5.md
-- source-sha256: 5555eba4e2a58c7ff27df7e360ed799d45308805bcda43688c18da759354386a
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '954fded07c2b02e46cb4676c2e347ca5' OR slug = 'gozen-iwa-climbing-guide-ja') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('954fded07c2b02e46cb4676c2e347ca5', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'gozen-iwa-climbing-guide-ja', '御前岩ガイド：石灰岩を登る前に入山条件を確認', '御前岩を旅行に組み込むため、入山登録、安全技術の条件、ルート情報の使い方を整理します。', '<h2>まず同行者全員の入山条件を確認する</h2>
<p>御前岩は東京・奥多摩の石灰岩の岩場です。外岩でのリード経験があり、旅の一日を目標ルートに充てたい人に向いています。登りたいルートを選ぶ前に、入山の手順と全員の資格を確かめましょう。外岩のロープクライミングを始めたばかりの人がいる場合は、訪問先を再検討する必要があります。</p>
<p><a href="http://caramba-02.sakura.ne.jp/okutama/area/">奥多摩クライミングセンターの規則</a>は中・上級者向けのエリアとし、外岩で 5.11 以上を安定してリードできること、十分な登攀・安全技術を求めています。ビレイのみの人や見学者も原則として同条件です。これは管理者の条件であり、NobodyClimb がルート表から独自に設けた基準ではありません。</p>
<h2>登録と駐車の手続きを分けて考える</h2>
<p>初めて入山する人は全員登録し、未登録では立ち入れません。毎回入山ノートに記入し、帰る際にも下山時刻を記録します。管理ページに掲載されている入山協力金は、一人一回 500 円です。釣り銭のないよう準備し、手続きを済ませてから岩場へ向かいましょう。同行者一人の登録で全員分を代用することはできません。</p>
<p>駐車にも別の手順があります。管理ページは指定の飲料購入を案内していますが、<a href="https://wind-scene.com/gozeniwa/">2023 年の訪問記録</a>には自販機が撤去されたとあります。今回の調査ではセンター駐車料金の現行の支払い方法を確認できていないため、出発前に管理者へ確認し、現地の案内に従ってください。歩行時間だけでなく、手続きを行う時間も確保します。</p>
<p>接近の参考として、2023 年の記録は奥多摩クライミングセンター脇の駐車場所から岩場まで、徒歩 15 分未満としています。その訪問時の観察であり、現在の通行保証ではありません。東京の宿から向かう場合は、センターと岩場の位置を確認し、公共交通、指定の接近路、現況を管理者へ確かめてから出発します。近くの釣り場の道をそのまま追わないようにしましょう。</p>
<h2>ルート表は選定用であり入山許可ではない</h2>
<p><a href="https://www.rocktopo.net/areas/198">ROCKTOPO の御前岩情報</a>には、ミートテック 5.10c、ハートブレイク 5.11a、蒙古タンメン 5.12a などが掲載されています。これはデータベース上のグレードです。易しいルートの存在によって入山条件が免除されるわけではなく、グレードだけではロープ長、必要なクイックドロー、岩の安定性、下降方法も判断できません。</p>
<p>候補を少数に絞り、最新のトポで長さ、下降方法、装備をパートナーと確認しましょう。一人が難しいルートに挑む場合も、相手が適切なビレイを提供できるかを先に確かめます。目的のルートを登らずに帰る選択肢も残しておきます。</p>
<h2>規則を旅程の中に組み込む</h2>
<p>管理者は夜間入山、無許可のガイディング、新ルート開拓、ボルト追加を禁止し、落石や完全ではない支点について注意を促しています。ゴミの持ち帰り、伐採禁止、終了点や回収用の残置カラビナを持ち出さないことも規則に含まれます。リーダーだけでなく、全員が同じ規則を読んでおくと準備を共有できます。</p>
<p>東京の宿からの日帰りなら、入山条件、管理手順、交通、ルートと装備の順に確認します。本記事は現地の固定支点を点検しておらず、旅行当日の開放を保証しません。アプローチと現地告知も出発前に確認してください。条件を確かめられない場合は、屋内ジムへの変更も含めて日程に余裕を持たせましょう。</p>
<h2>参考資料</h2>
<ul>
<li><a href="https://www.rocktopo.net/areas/198">御前岩 | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
<li><a href="https://wind-scene.com/gozeniwa/">はじめての御前岩クライミング｜アプローチや注意事項など</a></li>
<li><a href="http://caramba-02.sakura.ne.jp/okutama/area/">エリア情報 | 奥多摩クライミングセンター</a></li>
</ul>
<p><a href="/blog/4637dfbdbb41eed37e0cbdb1acef3b31">繁體中文</a> · <a href="/en/blog/7604f1e91f67001a52849073701d8398">English</a> · <a href="/ja/blog/954fded07c2b02e46cb4676c2e347ca5">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('954fded07c2b02e46cb4676c2e347ca5', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('954fded07c2b02e46cb4676c2e347ca5', '岩場指南');
DROP TABLE _blog_article_guard;
