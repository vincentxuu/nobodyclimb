-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/71b53781fde2dc5037cef4423599ae79.md
-- source-sha256: 3f53f6765da8851458e368dc61a4802acfc427f2dba388f63f910c3afcf8829f
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '71b53781fde2dc5037cef4423599ae79' OR slug = 'insubong-climbing-guide-ja') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('71b53781fde2dc5037cef4423599ae79', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'insubong-climbing-guide-ja', '仁寿峰クライミング：申請と下降を確認して花崗岩マルチピッチへ', 'クラックとスラブのマルチピッチを計画するため、入山方向、国立公園の岩壁申請、ルート別の下降と未確認事項を整理。', '<h2>この場所の計画</h2>
<p>仁寿峰（인수봉、Insubong／Insu-bong）はソウルの北漢山にあるロープクライミングの目的地。花崗岩のスラブ、クラック、マルチピッチを含む山での一日が魅力だ。<a href="https://www.mountainproject.com/area/106225638/insu-bong-bukhansan">Mountain Projectのエリア紹介</a>はトラッドを紹介し、一部のスポートルートでは支点間隔が非常に長いことも述べている。見慣れた数字だけで、ジムの同グレードと同じ感覚の旅行先にはできない。</p>
<p>本稿は行程判断のためのガイドであり、トポや現地の案内者に代わるものではない。マルチピッチ、プロテクション、下降を計画できるチームの調査の出発点になる。ボルダーや室内リードの経験だけなら、易しく見える線を先に選ぶより、現地を知る人と相談したい。</p>
<h2>入山する側を把握する</h2>
<p>コミュニティの紹介は北漢山の東側からのアプローチを示し、北漢山牛耳駅（북한산우이역）と道詵寺（도선사）に言及している。この名前で方向を把握したうえで、公園や現地のパートナーに現在の経路を確認しよう。同ページには2022年の交通や乗り合い料金があるが、本稿では現在の料金として扱わず、一定の徒歩時間も約束しない。</p>
<p>宿泊先からの一日には移動、アプローチ、準備、登攀、下降、下山まで含める。市街地から行けることは日没までに登り終えられる保証ではない。下降時間のない計画を、早出だけで補おうとしない。</p>
<h2>国立公園への申請を先に確認</h2>
<p><a href="https://www.knps.or.kr/smartsafe/permission/list.do">国立公園の岩壁利用申請ページ</a>には北漢山の選択肢がある。公開ルールでは今日から3日後〜30日後を申請でき、新しい日付は10:00に開放。チームは2〜5人で、最終承認のSMSを受けてから岩壁を利用する。一般登山道への入山とは別で、登山道があることからクライミング許可を推定できない。</p>
<p>今回の調査では、予定日の仁寿峰の個別岩壁の空き、適用されるエリア、外国人の申請方法を確認できていないため、先に管理事務所へ問い合わせる必要がある。交通やガイドの予約前に、日付、人数、岩壁、旅行者としての身分を伝えて確認したい。申請フォームが見つかることと、承認されることは別だ。</p>
<p>承認後には当日の確認手続きもある。<a href="https://www.knps.or.kr/smartsafe/cms/contents.do?cmsSeq=28">公式申請説明</a>では、公園内でSMSのリンクとGPSを使って16:00前に登攀開始を確認し、下山時にも終了確認を行う必要がある。承認SMSを保存するだけでは開始・終了の手続きの代わりにならない。申請時に管理事務所へ詳細を確認したい。</p>
<h2>ルートと一緒に支点・下降を選ぶ</h2>
<p>資料にはChouinard A、Chouinard B、Insu A、Insu Bなどの名前がある。トポを探すキーワードとして使い、総合グレードだけで各ピッチの説明を置き換えない。保護方法、固定支点の現状、長さ、ビレイ点、下降ライン、撤退方法を確認する。スラブとクラックでは必要な判断が違い、ボルトの有無だけでは持参するプロテクションを決められない。</p>
<p>本稿では「60mロープ1本で十分」という共通装備表を示さない。ロープと下降装備は選んだルートの最新情報に合わせる。条件を確認してからチームに適しているか判断しよう。下降情報や支点配置、現地でのルート識別が不明なら、経験者の案内を受けるか計画を変更したい。</p>
<h2>最終確認の順序</h2>
<p><a href="https://www.knps.or.kr/front/portal/visit/visitCourseSubMain.do?menuNo=7020092&parkId=121500&parkNavGb=guide">北漢山の公式訪問案内</a>は入山時間制度と登山道規制の確認を促している。まず申請の承認と当日の規制、次に天候と選んだルートを確認する。パートナーとは登攀を切り上げる時刻、下降方法、予定より遅れた場合の代替案を共有しよう。</p>
<p>許可、ルート条件、チームの技術が合えば、仁寿峰はソウル旅行の中心的な登攀日になり得る。公開資料の確認日は2026年10月12日。本稿は固定支点の現地検査でも、NobodyClimbの登攀体験記でもない。</p>
<h2>参考資料</h2>
<ul>
<li><a href="https://www.mountainproject.com/area/106225638/insu-bong-bukhansan">Rock Climbing in Insu-bong (Bukhansan), Seoul/Gyeonggi-do (Northwest Korea)</a></li>
<li><a href="https://www.knps.or.kr/smartsafe/permission/list.do">스마트워치 상황관제 시스템</a></li>
<li><a href="https://www.knps.or.kr/front/portal/visit/visitCourseSubMain.do?menuNo=7020092&parkId=121500&parkNavGb=guide">코스별난이도 &lt; 북한산국립공원 &lt; 국립공원탐방 &lt; 국립공원공단</a></li>
<li><a href="https://www.knps.or.kr/smartsafe/cms/contents.do?cmsSeq=28">스마트워치 상황관제 시스템</a></li>
</ul>
<h2>言語</h2>
<p><a href="/blog/77bd05d60d5cdeb6838224fbb1ae0274">繁體中文</a> · <a href="/en/blog/ac1de57c9cd0be29fe035bde62b098e8">English</a> · <a href="/ja/blog/71b53781fde2dc5037cef4423599ae79">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('71b53781fde2dc5037cef4423599ae79', '首爾攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('71b53781fde2dc5037cef4423599ae79', '岩場指南');
DROP TABLE _blog_article_guard;
