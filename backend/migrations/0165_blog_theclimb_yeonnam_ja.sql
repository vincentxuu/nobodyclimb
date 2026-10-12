-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/2e54298c1999d880d7aae65162a88774.md
-- source-sha256: f2bbb7184c65ea0666796f1e3b13dbea7186fdd28dccad8055cb5992d2cd0124
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '2e54298c1999d880d7aae65162a88774' OR slug = 'theclimb-yeonnam-climbing-guide-ja') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('2e54298c1999d880d7aae65162a88774', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'theclimb-yeonnam-climbing-guide-ja', 'The Climb 延南店：店舗を確認してソウルのボルダー利用を計画', '旧弘大店は閉店告知済み。延南店の所在地、公開営業時間、日帰り利用料金と初回確認事項をまとめる。', '<h2>この場所の計画</h2>
<p>ソウル旅行のメモでは、The Climbが「弘大」とまとめられていることがある。しかし周辺の街の名前だけでは店舗を特定できない。<a href="http://theclimb.co.kr/branch/">公式店舗情報</a>ではB弘大店が2026年5月17日閉店と記載されている。現在の計画では旧店の住所を使わず、延南店（연남점）を確認したい。</p>
<p>本稿は延南店だけを対象に、2026年10月12日に読めた公式情報を整理する。チェーン全体の設備や講習、営業状況を一つの店舗の情報として扱わない。</p>
<h2>住所は階数まで確認</h2>
<p>延南店はソウル麻浦区楊花路186、LC TOWERの3階。韓国語住所「서울특별시 마포구 양화로 186 3층」と公式電話02-2088-5071を保存しておこう。現地の地図で住所と연남점を一緒に入力し、目的地を確認する。閉店した弘大店の楊花路125へ向かわないようにしたい。</p>
<p>本稿では駅の各出口からの徒歩時間を検証していないため、数分で到着できるとは約束しない。宿からの移動には乗り換え、建物入口の確認、初回受付を加える。遅い時間に着くなら、繁華街との近さだけでなく、実際に登れる時間がどれだけ残るかを考えよう。</p>
<h2>営業時間と登る内容</h2>
<p><a href="http://theclimb.co.kr/english/">公式英語ページ</a>の延南店欄は平日07:00–24:00、土日祝08:00–22:00。同ページのブランド紹介にはボルダーや課題の更新があるが、特定の日に延南店の全壁が使える保証や、個々の課題の難易度保証ではない。イベント、セット、特別営業時間の有無は旅行前に確認したい。</p>
<p>普段からボルダーをする人も、スタート、ゴール、色、着地エリアのルールを聞き、易しい課題で慣れるところから始めよう。別のジムの色を自分の慣れたVグレードへ直接換算しない。これは利用計画の助言であり、未確認の色別グレード表は掲載しない。初めての人は体験講習が必要か、予約が必要か、理解できる言語で説明を受けられるかを先に尋ねたい。</p>
<h2>日帰り料金と道具</h2>
<p>英語ページの共通料金表には1日券22,000ウォン、シューズ3,000ウォン、チョーク1,000ウォンとある。券とシューズで25,000ウォン、チョークも借りれば26,000ウォンという計算になる。別売りの講習や追加サービスは含まない。英語ページには閉店した店舗の古い欄も残っているため、この金額は確認日の予算目安とし、延南店で当日適用される料金は受付に確認する。</p>
<p>自分のシューズを持参すればレンタルの必要が減る。借りるならサイズと利用ルールを受付で聞こう。1回あたりが安く見えるだけで回数券を買わず、短期滞在では有効期限、本人利用の条件、実際の来店回数を先に確認したい。</p>
<h2>初回に聞きたいこと</h2>
<p>今日の延南店の1日利用総額、初回の登録や説明、シューズとチョークの料金、初心者講習の空きと言語対応。この四点を旅行メモに用意しておくとよい。本稿では外国人の登録手順全体、講習の対応言語、当日の空き枠を確認できていないため、延南店へ直接問い合わせる必要がある。</p>
<p>延南店は室内ボルダーの候補として、屋外日の雨天代替にも検討できる。店舗、時間、サービスを順に確かめれば、代替案を実行しやすい。本稿は公開資料のガイドであり、NobodyClimbの訪問体験記ではない。</p>
<h2>参考資料</h2>
<ul>
<li><a href="http://theclimb.co.kr/branch/">branch | theclimb</a></li>
<li><a href="http://theclimb.co.kr/english/">Korea Climbing gym | theclimb</a></li>
</ul>
<h2>言語</h2>
<p><a href="/blog/5ed702d9314fa563edaf66a482188c49">繁體中文</a> · <a href="/en/blog/53da59d598053f31d90eb8b4629fcfa1">English</a> · <a href="/ja/blog/2e54298c1999d880d7aae65162a88774">日本語</a></p>
', NULL, 'gyms', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('2e54298c1999d880d7aae65162a88774', '首爾攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('2e54298c1999d880d7aae65162a88774', '岩館指南');
DROP TABLE _blog_article_guard;
