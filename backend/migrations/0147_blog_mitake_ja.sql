-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/8062be3f3deec2302597d0c88a01f1dd.md
-- source-sha256: 23396e97d9e58e4332c19ae51b65f945939db3016b512bae40639c3f2b1cc77c
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '8062be3f3deec2302597d0c88a01f1dd' OR slug = 'mitake-climbing-guide-ja') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('8062be3f3deec2302597d0c88a01f1dd', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'mitake-climbing-guide-ja', '御岳ボルダリングガイド：河原の岩、マット、ローカルルール', 'ロープの岩場とは別の計画として、課題、マット、遊歩道や駐車場のルールを確認する。', '<h2>対象は御岳の河原のボルダー</h2>
<p><a href="https://www.rocktopo.net/areas/108">ROCKTOPOの御岳ボルダー</a>は東京都のチャートのボルダリングを掲載し、忍者返しの岩、日影岩などを紹介しています。周辺のロープの岩場をまとめたリードガイドではありません。ロープとヌンチャクだけを持つ旅で、抱石の予定がなければ、御岳は同じ種類の代替先ではありません。マットと外岩ボルダーの経験を別に考える必要があります。</p>
<p>都市旅行に外岩ボルダーを加えたい人で、着地と墜落のリスクを判断できることが前提です。ジムだけの経験なら、御岳を知る人と行き、低くて着地を扱いやすい課題から始めましょう。室内グレードで河原の安全は判断できません。高さ、濡れた岩、地面の石、着地の広さを現地で確認し、マットが全ての高さを守ると考えないこと。</p>
<h2>課題と装備を選ぶ</h2>
<p>ROCKTOPOはマミ岩中央4級、忍者返し1級を人気課題の手がかりとして挙げています。日本の級と掲載名称であり、完登できる保証ではありません。トポで岩、スタート、終了を確認し、現場で着地を見ます。写真と状況が違えば、名前を登るために無理をしないでください。初日は岩質に慣れ、扱える着地の課題を選ぶことが旅のペースにも合います。</p>
<p><a href="https://freeclimb.jp/kantou-area/4891/">JFAの御岳情報</a>は御岳駅近くのマウンガで、マット、ブラシ、シューズのレンタルがあるとしています。これは予約先を探す手がかりで、当日の在庫、料金、営業時間は本稿では確認していません。マットを持参しないなら、予約、受け取りと返却の時間、岩までの運び方を先に確認しましょう。</p>
<h2>河原を共有するためのルール</h2>
<p>JFAは、釣り、カヌー、観光でも使われる場所として、通路を占領しない、大声を出さない、登った後にチョークを落とすよう求めています。ナイトボルダリング、焚き火、キャンプ場以外のテント泊は禁止です。マットや荷物は道を塞がず、移動するときは他の利用者を確認します。待っている同行者も遊歩道を占領しないようにしましょう。</p>
<h2>移動、駐車、4月の旅</h2>
<p>御岳駅周辺を計画の起点にして、選んだ岩への歩行と装備の受け取りを組みます。東京発の具体的な列車と総所要時間は未確認なので、訪問日の便を調べてください。車ならJFAが挙げる寒山寺、御岳交流センター、御岳苑地の駐車場を確認します。ROCKTOPOは玉堂美術館上のトイレ前駐車場を、トイレ利用以外の抱石駐車に使わないよう明示しています。空きがあるだけでは利用できません。</p>
<p>ROCKTOPOの季節目安には4月も含まれます。それでも雨、河原の通行、岩の乾きは確認し、特定日の水位や利用状況は本稿では確認していません。計画例は先にマットを受け取り、午前は一つのエリアを選び、登った後にブラッシングし、返却に間に合うよう早めに退出する形です。雨後の着地や道を判断できなければジムに変更します。これは日程案で、当日の状態の保証ではありません。</p>
<h2>参考資料</h2>
<ul>
<li><a href="https://www.rocktopo.net/areas/108">御岳ボルダー | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
<li><a href="https://freeclimb.jp/kantou-area/4891/">東京・御岳ボルダー</a></li>
</ul>
<p><a href="/blog/5a344696cd02ef57df38a2864f25997c">繁體中文</a> · <a href="/en/blog/48613c56b82390b44b67702d629eb6ba">English</a> · <a href="/ja/blog/8062be3f3deec2302597d0c88a01f1dd">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('8062be3f3deec2302597d0c88a01f1dd', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('8062be3f3deec2302597d0c88a01f1dd', '岩場指南');
DROP TABLE _blog_article_guard;
