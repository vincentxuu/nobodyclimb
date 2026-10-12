-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/c39656362f8fc1cfdbc2a36837b9135b.md
-- source-sha256: fcbb2eebe4d96e597e6732b2473c0ba68d90184423090570b6fc601a29147734
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = 'c39656362f8fc1cfdbc2a36837b9135b' OR slug = 'takatoriyama-climbing-guide-ja') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('c39656362f8fc1cfdbc2a36837b9135b', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'takatoriyama-climbing-guide-ja', '鷹取山ガイド：登録から計画する公園のトップロープ', '横須賀の鷹取山で登るため、登録と指導条件、トップロープの特徴、園内の通行止めを確認します。', '<h2>公園を歩けても自由に登れるわけではない</h2>
<p>鷹取山は神奈川県横須賀市の公園内の岩場で、東京旅行に準備したトップロープの日を組み込みたい人向けの候補です。登録と管理条件を先に満たす必要があります。他の人が登っていることや岩壁のルートを見て、自分でロープを掛けてよいとは判断できません。</p>
<p><a href="https://www.city.yokosuka.kanagawa.jp/5560/sisetu/fc00000978.html">横須賀市の公園ページ</a>は岩登りを原則禁止とし、鷹取山安全登山協議会指導員の指導に従い、定めた事項を遵守する場合を例外としています。協議会への登録も必要です。ページ掲載の連絡先で参加方法と指導の扱いを確認し、条件を満たせなければ登攀をせず公園見学にします。</p>
<h2>トップロープ主体の意味を理解する</h2>
<p><a href="https://www.rocktopo.net/areas/115">ROCKTOPO の鷹取山ページ</a>も登録を求め、基本的にトップロープで登られると説明しています。ロープが上方の支点を通る方式ですが、誰でもそのシステムを構築・点検できるという意味ではありません。支点、ロープ経路、器材、ビレイには対応する技術が必要です。</p>
<p>データベースでは多くのラインがリード・フェイス分類ですが、エリア説明はトップロープ主体です。分類だけでリードの許可を推測しないでください。協議会に活動と規則を確認してから目標を選び、グレードや動画を指導の代わりにしません。能力差があるパーティーでも点検とビレイ分担を共有します。</p>
<h2>公園の公式交通案内を使う</h2>
<p>市は過去の採石による垂直の岩壁を特徴として紹介しています。交通案内は京急追浜駅から湘南たかとり団地循環バスで「たかとり小学校」、徒歩約 10 分です。公園に駐車場はありません。この案内は公園への到達で、すべての登攀エリアの接近時間ではありません。</p>
<p>当日の往復便を確認し、許可された経路を使います。車の場合もデータベースの駐車リンクを公園提供の駐車スペースと考えず、合法的な場所を別に確認してください。住宅道路や入口を塞がず、装備整理と他の公園利用者の通行も計画に含めます。</p>
<h2>通行止めの告示に合わせて経路を変える</h2>
<p>調査日の市ページには、摩崖仏から水道配水池までが落石のため、2025 年 6 月 8 日から当面通行止めで、再開未定と掲載されていました。摩崖仏は見学可能です。一部歩道の告示であり、公園全体や全登攀区間の閉鎖とは断定できません。一方で、取り付きへ行くために封鎖を越える許可でもありません。</p>
<p>今回の調査では旅行当日の登録受け入れ、指導の手配、歩道再開を確認していないため、出発前に協議会と市の最新告示を確認してください。公園の年中無休という案内も、いつでも自由に登れる意味ではありません。</p>
<p>連絡、条件の充足、トップロープ計画の順に準備します。水、食事、防護、活動に必要な装備を持ち、許可や支点に対応する技術がなければ登りません。登録と公共空間の規則も含めて、採石場の景観の中で登る一日を計画しましょう。</p>
<h2>参考資料</h2>
<ul>
<li><a href="https://www.city.yokosuka.kanagawa.jp/5560/sisetu/fc00000978.html">鷹取山公園</a></li>
<li><a href="https://www.rocktopo.net/areas/115">鷹取山 | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
</ul>
<p><a href="/blog/7bb10cb94d8c3c8ed95394f052e9927a">繁體中文</a> · <a href="/en/blog/2b1fad5f50c738e4d0600022edc266ae">English</a> · <a href="/ja/blog/c39656362f8fc1cfdbc2a36837b9135b">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('c39656362f8fc1cfdbc2a36837b9135b', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('c39656362f8fc1cfdbc2a36837b9135b', '岩場指南');
DROP TABLE _blog_article_guard;
