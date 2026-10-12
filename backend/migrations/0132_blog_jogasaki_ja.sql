-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/7c531718bd0f487b7372ac297244329c.md
-- source-sha256: 3978da72449e71877b958f2d54123cfd082b0f10abc60de7e38c57bb94747705
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '7c531718bd0f487b7372ac297244329c' OR slug = 'jogasaki-climbing-guide-ja') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('7c531718bd0f487b7372ac297244329c', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'jogasaki-climbing-guide-ja', '城ヶ崎海岸クライミングガイド：クラックのエリア選びと旅の組み立て', '海岸のクラックを登るために、必要な経験、エリアへの移動、撤退方法から旅の実現性を考える。', '<h2>向いている人と最初に決めること</h2>
<p>静岡県伊東周辺の城ヶ崎は、一つの入口から入る一枚の岩壁ではなく、海岸に点在するエリアの集合です。<a href="https://www.rocktopo.net/areas/9">ROCKTOPOの城ヶ崎ページ</a>にはクラック、フェイス、ボルダー、マルチピッチが掲載されています。<a href="https://tommy-climbing.com/rocks/cn8/pg257.html">地元ガイドのTOMMY CLIMBING CLUB</a>も、富戸から赤沢までの海岸をクラック中心の岩場として紹介しています。まずエリアと登り方を決め、その後に到着駅を選びましょう。</p>
<p>クラックを目的にするなら、ナチュラルプロテクションの設置と判断、必要なギアの選択、支点構築、撤退の経験を確認します。ジムでのリードグレードだけでは判断できません。未経験なら、そのエリアを知るガイドを依頼し、初日はクラック入門として組み立てることを勧めます。</p>
<h2>エリアとルートの選び方</h2>
<p>ROCKTOPOでは岩質は安山岩で、クラックとフェイスを区別しています。城ヶ崎全体をスポートの岩場と考えるのは適切ではありません。「パープルシャドウ」5.8や「ピーターパン」5.10bは、トポを探すための名称の手がかりです。当日の推奨ルートとして安全性を確認したものではありません。TOMMYの八幡野情報もNPとボルトを分け、一部には混合したプロテクションがあります。ボルトが見えても、ヌンチャクだけで足りるとは限りません。</p>
<h2>移動とアプローチはエリア単位で</h2>
<p>TOMMYの八幡野講習は伊豆高原駅集合で、伊豆高原、城ヶ崎海岸、富戸周辺の宿泊施設にも触れています。これは同ガイドの運営方法で、全エリア共通の入口ではありません。予約前に、入口、歩く道、懸垂下降の必要性、岩場からの退出方法を同行者と確認しましょう。東京発の具体的な列車と総所要時間は本稿では確認していません。旅のメモにある時間を時刻表として使わないでください。</p>
<h2>海岸の条件と一日の組み立て</h2>
<p>TOMMYは海沿いの残置器材の腐食と、樹木支点の確認を呼びかけています。写真が乾いていても、波、潮、風、足場を確認します。海岸の状況を判断できないときは、出口を決める前に懸垂下降で入らないでください。ROCKTOPOのシーズン表示は12月から4月が中心ですが、その日の状態を保証するものではありません。4月の旅でも、屋外の日を変更できる日程にしておくのがよいでしょう。</p>
<p>日程例としては、前夜を伊豆で過ごし、朝は確認済みの一つのエリアに絞ります。アプローチの把握、プロテクションの確認、控えめな目標を一、二本登ることを中心にします。条件が合わなければ海岸散策やジムへ変更します。これは編集上の計画例で、確認済みのガイド商品でも、個別ルートの装備表でもありません。</p>
<h2>参考資料</h2>
<ul>
<li><a href="https://www.rocktopo.net/areas/9">城ヶ崎 | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
<li><a href="https://tommy-climbing.com/rocks/cn8/pg257.html">JYOGASAKI YAWATANO│TOMMY CLIMBING CLUB</a></li>
</ul>
<p><a href="/blog/d050b303d8cb720b212a12e15e918dcc">繁體中文</a> · <a href="/en/blog/44a849fc8c33070654fbaf80c966bd2d">English</a> · <a href="/ja/blog/7c531718bd0f487b7372ac297244329c">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('7c531718bd0f487b7372ac297244329c', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('7c531718bd0f487b7372ac297244329c', '岩場指南');
DROP TABLE _blog_article_guard;
