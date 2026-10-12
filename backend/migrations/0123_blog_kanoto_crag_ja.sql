-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/b9b323658d9f5ff525d4e28d1e77a140.md
-- source-sha256: f63b0ac34f0d12c2b00b34ad1d00dea8d00a390f660dad45620c687bdb906b2d
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = 'b9b323658d9f5ff525d4e28d1e77a140' OR slug = 'kanoto-crag-climbing-guide-ja') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('b9b323658d9f5ff525d4e28d1e77a140', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'kanoto-crag-climbing-guide-ja', '神戸の岩場ガイド：神戸岩の観光地点と取り付きを区別する', 'コンパクトな石灰岩の神戸の岩場について、登攀禁止の神戸岩との違い、バス接近と地域への配慮を整理します。', '<h2>岩場名は最初に確認したいナビゲーション情報</h2>
<p>神戸の岩場は東京・檜原方面のコンパクトな石灰岩の岩場です。外岩でロープクライミングの経験があり、目標ルートを決めて訪れる人に向いた候補です。最初に確認するのはグレードではなく、「神戸の岩場」と観光地点「神戸岩」の違いです。</p>
<p><a href="https://www.climbing-net.com/iwaba_detail/%E7%A5%9E%E6%88%B8%E3%81%AE%E5%B2%A9%E5%A0%B4/">CLIMBING-net</a>は別の場所だと明記し、神戸岩を登攀禁止としています。車道の神戸岩の案内を追うだけでは、目的の攀登エリアに着くとは限りません。同行者へは同名の観光地点の地図だけでなく、岩場のトポと接近説明を共有しましょう。</p>
<h2>接近路は地域の生活空間を通る</h2>
<p>出版者は武蔵五日市から藤倉または小岩行きのバスに乗り、神戸岩入口で降りる接近を紹介しています。春日神社、小さな赤い橋、民家脇の沢へ進む説明で、観光地点へ道路を進み続ける経路とは異なります。当日のバス、踏み跡、通行の扱いを出発前に確認してください。</p>
<p>資料は民家の庭先を通るため一声かけ、静かに通過するよう促しています。春日神社周辺に駐車場所はなく、路肩や公民館脇の空き地は駐車不可です。紹介される釣り場の有料駐車場を使う場合は、受付でクライミングに来たことを伝え、指定に従います。今回の調査では現在の駐車受け入れ、費用、接近の通行条件を確認していないため、古い紹介を駐車許可とせず、事前に確認してください。</p>
<p>公共交通を使えば現地での駐車探しを避けられますが、帰りの便の確認が必要です。バス、歩行、登攀をまとめて計画し、最後のトライだけに残り時間を使わないようにします。</p>
<h2>小さな岩場でも長いラインがある</h2>
<p>出版者はコンパクトな石灰岩で、右側の数本に 20 メートルを超えるラインがあると説明しています。<a href="https://www.rocktopo.net/areas/103">ROCKTOPO のエリアページ</a>は収録されたフェイスルートを探す入口になります。「小規模」でもすべてが短いとは限らず、ジムで使うロープで下降できるとは判断できません。</p>
<p>目標の実際の長さ、終了点、下降、器材を確認してから準備します。掲載本数は選択肢の目安であり、全ルートの現行状態や一日で登るチェックリストではありません。能力差のあるパーティーでは、一人ずつ無理なく撤退できる目標を考えます。</p>
<h2>接近路も岩場の一部として配慮する</h2>
<p>民家周辺での大声、入口を塞ぐ行動、無断駐車を避けます。資料は釣り場駐車場でのキャンプや車中泊も不可としているため、宿泊は別に計画しましょう。</p>
<p>本記事は当日の開放や固定支点を点検していません。最近のトポ、現況、接近情報を入手し、禁止告示や不明な通行条件があれば立ち入らないでください。コンパクトな中に石灰岩の長いラインがある魅力は、正しい場所へ行き、周囲の生活空間を尊重することを前提に楽しめます。</p>
<h2>参考資料</h2>
<ul>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E7%A5%9E%E6%88%B8%E3%81%AE%E5%B2%A9%E5%A0%B4/">神戸の岩場</a></li>
<li><a href="https://www.rocktopo.net/areas/103">神戸の岩場 | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
</ul>
<p><a href="/blog/c9291664b2c87caf58701928ae1d1cc8">繁體中文</a> · <a href="/en/blog/af5833584555468d1d9b8279473c03c6">English</a> · <a href="/ja/blog/b9b323658d9f5ff525d4e28d1e77a140">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('b9b323658d9f5ff525d4e28d1e77a140', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('b9b323658d9f5ff525d4e28d1e77a140', '岩場指南');
DROP TABLE _blog_article_guard;
