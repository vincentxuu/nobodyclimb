-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/b17a878a6f6cde0a8a599161443c8279.md
-- source-sha256: f1f7e99591d13fe7210b9c5fac96ae0ddaa12671fd38423e2565f294be700a6d
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = 'b17a878a6f6cde0a8a599161443c8279' OR slug = 'seoninbong-climbing-guide-ja') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('b17a878a6f6cde0a8a599161443c8279', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'seoninbong-climbing-guide-ja', '仙人峰クライミング：道峰山のクラックへ、アクセスと申請の準備', '北漢山国立公園の道峰山にある花崗岩クラック。道峰山駅からの方向、岩壁申請、ルートに合わせる準備を整理する。', '<h2>この場所の計画</h2>
<p>仙人峰（선인봉、Seoninbong）は北漢山国立公園の北東側、道峰山（도봉산）エリアにある。<a href="https://www.mountainproject.com/area/119848026/senin-bong-dobongsan">Mountain Projectの紹介</a>は花崗岩とクラッククライミングの場として説明している。ソウル旅行でトラッドのマルチピッチを目指すなら、仁寿峰の補足ではなく、独立して調べたい目的地だ。</p>
<p>同じ花崗岩でも、ルート、下降、交通計画を共有できるわけではない。本稿はアプローチの方向と申請の疑問を整理する。ピッチごとのベータは提供せず、コミュニティの比較を今日の混雑の少なさの保証にも使わない。</p>
<h2>駅名を取り違えない</h2>
<p>コミュニティの交通案内は1号線の道峰山駅（도봉산역、Dobongsan）を示している。名前の似た道峰駅（도봉역、Dobong）ではない。旅行メモの略称だけに頼らず、韓国語の駅名と岩峰名を保存したい。同ページは駅から道峰山方面への方向を説明しており、最新の曲がり角ごとのナビではない。</p>
<p>本稿では現在のアプローチ全体と所要時間を確認できていないため、出発前に管理事務所や仙人峰を知るパートナーへ確認する必要がある。登る線によって取り付きへの判断も異なり、一般登山の山頂までの時間を登攀アプローチに流用できない。車の場合も駐車規則を再確認し、資料中の推測を含む古い駐車料金を現在の料金として扱わない。</p>
<h2>岩壁利用は一般登山と別</h2>
<p><a href="https://www.knps.or.kr/smartsafe/permission/list.do">国立公園の岩壁申請入口</a>には「북한산도봉」がある。公開ルールでは3日後〜30日後を申請でき、新しい日付は10:00に開放、チームは2〜5人。最終承認のSMSを受けてから岩壁を利用する。宿や交通を決める前に確認し、一人で着いてから現場で許可を取れるとは考えないようにしたい。</p>
<p>今回の調査では、予定日の仙人峰の個別岩壁の空き、適用エリア、外国人の申請方法を確認できていないため、先に管理事務所へ問い合わせる必要がある。入口があるだけでは選んだルートの許可を意味せず、天候や当日の規制で計画は変わり得る。<a href="https://www.knps.or.kr/front/portal/visit/visitCourseSubMain.do?menuNo=7020092&parkId=121500&parkNavGb=guide">北漢山の公式訪問案内</a>も入山時間制度と登山道規制の確認を促している。</p>
<p>承認後には当日の確認手続きもある。<a href="https://www.knps.or.kr/smartsafe/cms/contents.do?cmsSeq=28">公式申請説明</a>では、公園内でSMSのリンクとGPSを使って16:00前に登攀開始を確認し、下山時にも終了確認を行う必要がある。承認SMSを保存するだけでは開始・終了の手続きの代わりにならない。申請時に管理事務所へ詳細を確認したい。</p>
<h2>装備はルートから決める</h2>
<p>コミュニティの紹介にはクラックとトラッドのプロテクションが出てくる。岩場の性格を理解する資料にはなるが、全ルート共通のラック一覧にはできない。目標の線の最新トポを入手し、ピッチ長、固定支点、自分で設置する支点、ビレイ点、下降を確認しよう。ロープ長、下降回数、撤退できる地点も一緒に話し合ってから装備を選ぶ。</p>
<p>室内リードができても、クラックの支点やマルチピッチ下降を判断できないなら、低いグレードだけではその差は埋まらない。現地を知る案内者に登攀とビレイの経験を伝え、可能な活動を相談したい。本稿では商業ガイドの提供状況、料金、資格を検証しておらず、予約を保証しない。</p>
<h2>実行できる日程にするには</h2>
<p>申請とアプローチが明らかになり、チームがルートと下降を扱えるとき、仙人峰は希望の名前から実行可能な山の一日になる。移動、アプローチ、登攀、下山まで一日として確保し、天候悪化や遅れの代替案も共有しよう。市内観光の半日に無理にマルチピッチを詰め込まない。</p>
<p>公開資料の確認日は2026年10月12日。コミュニティの説明は登攀当日の現地検査ではなく、NobodyClimbが実登して検証したものでもない。次の具体的な一歩は、日付、チーム、目標ルートを管理事務所と現地のパートナーへ伝えて確認することだ。</p>
<h2>参考資料</h2>
<ul>
<li><a href="https://www.mountainproject.com/area/119848026/senin-bong-dobongsan">Rock Climbing in Seonin-bong (Dobongsan), Seoul/Gyeonggi-do (Northwest Korea)</a></li>
<li><a href="https://www.knps.or.kr/smartsafe/permission/list.do">스마트워치 상황관제 시스템</a></li>
<li><a href="https://www.knps.or.kr/front/portal/visit/visitCourseSubMain.do?menuNo=7020092&parkId=121500&parkNavGb=guide">코스별난이도 &lt; 북한산국립공원 &lt; 국립공원탐방 &lt; 국립공원공단</a></li>
<li><a href="https://www.knps.or.kr/smartsafe/cms/contents.do?cmsSeq=28">스마트워치 상황관제 시스템</a></li>
</ul>
<h2>言語</h2>
<p><a href="/blog/57c6e2d0d50150551208df0a89af68aa">繁體中文</a> · <a href="/en/blog/a1b302e1a01cb19b46d6f12c33281e48">English</a> · <a href="/ja/blog/b17a878a6f6cde0a8a599161443c8279">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('b17a878a6f6cde0a8a599161443c8279', '首爾攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('b17a878a6f6cde0a8a599161443c8279', '岩場指南');
DROP TABLE _blog_article_guard;
