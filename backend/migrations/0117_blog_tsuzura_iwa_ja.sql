-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/f593da3943f02c8541fd4365a2e857de.md
-- source-sha256: a6e4978b66e3e147a1bf51f0aab46ce8e015aa8f84e2fcad5ec0bca0d5189ab5
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = 'f593da3943f02c8541fd4365a2e857de' OR slug = 'tsuzura-iwa-climbing-guide-ja') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('f593da3943f02c8541fd4365a2e857de', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'tsuzura-iwa-climbing-guide-ja', 'つづら岩ガイド：長いアプローチから始まる登攀計画', '馬頭刈尾根のつづら岩を、接近時間、ロープ技術、帰路を含めた山岳トレーニングとして検討します。', '<h2>山道から始まるクライミングの一日</h2>
<p>つづら岩は東京の馬頭刈尾根上にある岩場です。装備を背負って歩くこととロープ操作を組み合わせ、山岳トレーニングを目的にする人に向いた候補です。旅の空き日が一日だけなら、まず歩行と登攀にそれぞれどれほど時間を使いたいかを考えましょう。</p>
<p><a href="https://www.climbing-net.com/iwaba_detail/%E3%81%A4%E3%81%A5%E3%82%89%E5%B2%A9%E3%80%81%E5%A4%A9%E7%8B%97%E5%B2%A9/">CLIMBING-net</a>は古くから使われるゲレンデとし、アプローチを約一時間半と紹介しています。これは接近区間の目安であり、東京の宿から取り付きまでの総所要時間ではありません。到着後すぐ登るジムのようには計画しないことを勧めます。</p>
<h2>天狗岩との合併掲載を同じ目的地と考えない</h2>
<p><a href="https://www.rocktopo.net/areas/101">ROCKTOPO</a>も出版者も、つづら岩と天狗岩を一緒に掲載しています。しかし、つづら岩は尾根上、天狗岩は滝の側壁で、接近時間も異なる別の岩壁です。同行者には目的地をつづら岩と明記し、天狗岩の短い歩行時間で計算しないよう共有します。</p>
<p>出版者は武蔵五日市からバスで千足へ向かう接近の手掛かりを示しています。当日の便、登山道、取り付きは別に確認してください。バス停名だけではナビゲーションになりません。オフライン地図とトポを保存し、帰りの便と折り返し時刻も決めておきます。</p>
<h2>グレードだけでは旧ルートの装備を決められない</h2>
<p>紹介には、古いルートでカラビナを直接入れられないピトンがあり、スリングが必要になる場合が記載されています。旧ルートの装備を理解する手掛かりであり、そのまま方法をまねれば支点が安全になるという意味ではありません。使用の可否、プロテクション、撤退は対応できる人が現地で判断します。</p>
<p>同じページは山崎ハングルートを約 30 メートルのラインとして紹介しています。岩場の歴史やラインの例であり、本記事が旅行者へ勧める登り方ではありません。パーティー全員に合った目標を選び、中間支点、終了点、下降を確認してから装備を決めます。地上からのビレイしか経験がない場合は、必要な技術や適切な指導を先に得てください。</p>
<h2>歩行と撤退の余裕を確保する</h2>
<p>編集上の計画提案として、装備整理、荷物を背負った登り、ルート探し、下降、下山まで時間を確保します。水、行動食、雨具、ヘッドランプ、適した歩行靴を用意し、登山装備も忘れないようにします。ヘッドランプは備えであり、暗くなるまで登るための道具とは考えません。</p>
<p>本記事ではつづら岩の現行の開放、登山道の通行、固定支点の状態を確認していません。出発前に最近の情報を得て、現地告示に従ってください。新しいコメントがないことは閉鎖の証拠ではなく、データベースに掲載があることも通行の保証ではありません。</p>
<p>目的が山岳トレーニングで、選んだルートと撤退に全員が対応できるなら検討したい岩場です。東京近郊で短時間に数本登りたい場合は、アプローチと持ち時間を比較してから選びましょう。</p>
<h2>参考資料</h2>
<ul>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E3%81%A4%E3%81%A5%E3%82%89%E5%B2%A9%E3%80%81%E5%A4%A9%E7%8B%97%E5%B2%A9/">つづら岩、天狗岩</a></li>
<li><a href="https://www.rocktopo.net/areas/101">つづら岩、天狗岩 | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
</ul>
<p><a href="/blog/e06757387faaa1797f6f6934f2343249">繁體中文</a> · <a href="/en/blog/42334c89066afb25b1b265431e5c4296">English</a> · <a href="/ja/blog/f593da3943f02c8541fd4365a2e857de">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('f593da3943f02c8541fd4365a2e857de', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('f593da3943f02c8541fd4365a2e857de', '岩場指南');
DROP TABLE _blog_article_guard;
