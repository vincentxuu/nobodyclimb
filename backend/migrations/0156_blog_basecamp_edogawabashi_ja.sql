-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/18c5a82f2d50a8bf0216bbc5305ff668.md
-- source-sha256: f70074d2a3c17fff10391419052ca05c9f52a96594ca2af109d529d50c2f488d
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '18c5a82f2d50a8bf0216bbc5305ff668' OR slug = 'basecamp-edogawabashi-climbing-guide-ja') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('18c5a82f2d50a8bf0216bbc5305ff668', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'basecamp-edogawabashi-climbing-guide-ja', 'Base Camp 江戸川橋：ボルダー・ロープと初回利用の準備', 'ボルダーとロープのある東京のジム。初回料金、レンタル、体験の違いを確認し、自分に合う利用方法を選ぶ。', '<h2>この場所の計画</h2>
<p>東京で室内クライミングの日を設け、ボルダーとロープの両方を候補にしたいなら、Base Camp 江戸川橋を検討できる。<a href="https://b-camp.jp/edogawabashi/">公式紹介</a>にはボルダリング、リード、トップロープが掲載されている。ただし、それぞれ必要な準備は異なる。本稿は公開情報の整理であり、入場できることがビレイ技術の習得を意味するわけではない。</p>
<h2>アクセスと時間の余裕</h2>
<p>公式案内では江戸川橋駅から徒歩約5分、神楽坂駅から約11分。これは駅からの目安なので、宿泊先からの計画には乗り換え、出口確認、受付の時間も加えたい。営業時間は平日12:00–23:00、土日祝10:00–21:00。定休日はないが、臨時休館はあり得る。</p>
<p>旅行中に一晩だけ利用するなら、閉店時刻だけでなく目的の壁が使えるかも確認する。公式トップページにはセット予定があり、営業中でもボルダーやロープの一部が利用できない場合がある。登録、着替え、ウォームアップにも時間を残そう。</p>
<h2>ボルダーとロープを分けて考える</h2>
<p><a href="https://b-camp.jp/edogawabashi/facilities/">施設ページ</a>には複数のボルダーエリアとロープの設備が紹介されている。シューズだけを持参し、ビレイのできるパートナーがいないなら、受付でボルダー利用の希望を伝え、館内ルールの説明を受けよう。トップロープがあることだけで、いつでもスタッフにビレイしてもらえるとは判断できない。</p>
<p>パートナーや必要な技術がまだない状態でロープを試したい場合は、<a href="https://b-camp.jp/edogawabashi/visitor/">初回利用案内</a>のトップロープ体験を確認したい。1時間1,100円で、施設利用料は別途必要。ボルダリング初心者講習を終えた人、またはボルダリング経験者が対象なので、館の方法に従って開催枠を確認する。通常入場、ボルダーの初心者説明、トップロープ体験は同じサービスではなく、予算と予約も分けて考える。</p>
<h2>初回料金とレンタル</h2>
<p>2026年10月12日確認の<a href="https://b-camp.jp/edogawabashi/charge/">料金表</a>では、税込の一般1日利用が2,420円、初回登録が1,100円。合計3,520円は一般の初回1日利用の計算であり、トップロープ体験などの追加料金は含まない。</p>
<p>通常のレンタルはシューズ330円、チョーク110円、ハーネス110円、ATCビレイ器110円、リードロープ550円。初回登録時はシューズ、チョーク、ハーネス、ATCが無料になるが、リードロープはその一覧に含まれない。レンタルシューズには靴下を持参しよう。Base Camp各店の登録は共通なので、別店舗で登録済みなら受付で会員情報を確認してもらいたい。</p>
<h2>出発前の三つの確認</h2>
<p>まず、ボルダー利用なのか、技術を持つパートナーとのロープ利用なのか、体験の相談なのかを決める。次に当日の営業情報とセット予定を確認する。最後に会員登録の有無、借りたい道具、体験料金を分けてメモしておくと、受付で総額を確認しやすい。</p>
<p>道具を借りられることは技術確認の代わりにはならない。ロープの利用条件は館の説明に従う。目的を決めておけば、短い滞在でも受付後の行動を組み立てやすく、目的の壁がセット中だったという行き違いも減らせる。料金と営業時間は確認時点の情報であり、今後の旅行では再確認が必要だ。</p>
<h2>参考資料</h2>
<ul>
<li><a href="https://b-camp.jp/edogawabashi/">BASE CAMP TOKYO 江戸川橋 - ボルダリング、リードクライミング・トップロープなど様々なクライミングが行える施設。江戸川橋駅徒歩5分。 東京屈指の繁華街である池袋からもアクセス良好な立地に位置するBase Camp。 ボルダリングが初めての方へ、随時初回インストラクションを実施。</a></li>
<li><a href="https://b-camp.jp/edogawabashi/facilities/">施設紹介 - BASE CAMP TOKYO 江戸川橋</a></li>
<li><a href="https://b-camp.jp/edogawabashi/visitor/">はじめての方へ - BASE CAMP TOKYO 江戸川橋</a></li>
<li><a href="https://b-camp.jp/edogawabashi/charge/">営業時間・料金案内 - BASE CAMP TOKYO 江戸川橋</a></li>
</ul>
<h2>言語</h2>
<p><a href="/blog/4170cdb52c273770734572c680c669c4">繁體中文</a> · <a href="/en/blog/e9a8202bd67c91865e698b92a798c973">English</a> · <a href="/ja/blog/18c5a82f2d50a8bf0216bbc5305ff668">日本語</a></p>
', NULL, 'gyms', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('18c5a82f2d50a8bf0216bbc5305ff668', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('18c5a82f2d50a8bf0216bbc5305ff668', '岩館指南');
DROP TABLE _blog_article_guard;
