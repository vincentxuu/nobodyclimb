-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/3306805c1c133d5be7e7fbf8ed510ec6.md
-- source-sha256: 983a5265af07b9ef48f24a483d335fb0570b9a8171550624d97106fd196a20f1
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '3306805c1c133d5be7e7fbf8ed510ec6' OR slug = 'mitsutoge-climbing-guide-ja') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('3306805c1c133d5be7e7fbf8ed510ec6', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'mitsutoge-climbing-guide-ja', '三ツ峠クライミングガイド：登山、支点作業、下降を含めた一日', '山頂直下の岩場へ行くには、低いグレードだけでなく、登山の時間、ロープ技術、帰路を考える必要がある。', '<h2>登山も登攀計画の一部</h2>
<p>山梨県の三ツ峠の岩場は山頂直下にあり、屏風岩周辺が主な対象です。<a href="https://www.climbing-net.com/iwaba_detail/%E4%B8%89%E3%83%84%E5%B3%A0/">CLIMBING-netの紹介</a>は右、中央、左フェイスに分け、フェイス、クラック、人工登攀、マルチピッチを説明しています。東京旅行に山岳的な一日を加えたい人の候補ですが、アプローチと下山も登攀計画に含める必要があります。</p>
<p><a href="https://www.rocktopo.net/areas/8">ROCKTOPOの三ツ峠ページ</a>も三種のロープクライミングを掲載し、岩質を集塊岩としています。初中級ルートがあるだけでは適性を判断できません。マルチピッチではルート判断、支点作業、ロープ管理、下降、撤退が必要です。経験がなければ、低いグレードを理由に自力で試すのではなく、現地を知る人による講習を選びましょう。</p>
<h2>岩壁より先に目的を決める</h2>
<p>出版社は、右フェイスをフェイスとクラックが多彩な壁、中央フェイスを強い傾斜と人工登攀を含む壁、左フェイスをクラシックなフリールートの壁として紹介しています。初訪問では、シングルピッチで岩に慣れる、マルチピッチのシステムを練習するなどの目的を決め、現行トポで対応するルートを選びます。エリア間移動と支点作業を無視して、複数の壁の目標を詰め込まないでください。</p>
<h2>駅名だけではアプローチが決まらない</h2>
<p><a href="https://www.fujikyu-railway.jp/sightseeing/hiking.php">富士山麓電気鉄道のハイキング案内</a>は、河口湖駅から天下茶屋方面のバスで三ツ峠登山口へ向かう方法と、三つ峠駅からの登山に触れています。この二つの入口は別です。出版社は三ツ峠駅から徒歩約2時間半から3時間とし、裏登山道の駐車地点からは別のアプローチを説明しています。これは接近の参考で、東京からの総移動を実測した時間ではありません。</p>
<p>訪問日の往復バス、山小屋の予約、道路状況は本稿では完全に確認していません。リーダーと入口を決め、その日の交通を調べ、帰路から離壁時刻を逆算します。下降と歩行の時間が足りなければ、マルチピッチは組みません。近くに泊まれば移動の負担は減りますが、古い山小屋やテント場の記述を現在の許可として使わないでください。</p>
<h2>季節、落石、一日の進め方</h2>
<p>出版社の季節目安は4月から10月、ROCKTOPOは4、5、6、7、9、10月です。4月は候補になるという意味で、低温や残雪がない証拠ではありません。山上の状況と天気を確認します。CLIMBING-netはバンドの浮石、ロープによる落石、下方の人への影響を注意点とし、ヘルメットやルートに合ったスリング類を挙げています。練習場でも山岳的な判断は必要です。</p>
<p>計画例は前夜を近くで過ごし、朝にアプローチして主目標を一つだけ登る形です。下降、ロープの片付け、下山に余裕を残して早めに終えます。岩の状態、ルート判断、確保点に疑問があれば、より簡単な講習に変えるか撤退します。本稿には個別ルートのロープ長や支点表はありません。完全なトポと判断できる同行者を用意することが次の一歩です。</p>
<h2>参考資料</h2>
<ul>
<li><a href="https://www.rocktopo.net/areas/8">三ツ峠 | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E4%B8%89%E3%83%84%E5%B3%A0/">三ツ峠</a></li>
<li><a href="https://www.fujikyu-railway.jp/sightseeing/hiking.php">ウォーキング＆ハイキング | 富士山に一番近い鉄道 富士急行線 富士山麓電気鉄道株式会社</a></li>
</ul>
<p><a href="/blog/64fa975558f3a9f80501f6babd512ce8">繁體中文</a> · <a href="/en/blog/5756dd674ad7adc331afd511c9954f78">English</a> · <a href="/ja/blog/3306805c1c133d5be7e7fbf8ed510ec6">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('3306805c1c133d5be7e7fbf8ed510ec6', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('3306805c1c133d5be7e7fbf8ed510ec6', '岩場指南');
DROP TABLE _blog_article_guard;
