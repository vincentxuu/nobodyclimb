-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/a81faf4baa85bd50e89afdc78a1c805f.md
-- source-sha256: d6b0c100b42d1e3fe247eff7d464f0ff1e0df97dbbaabb7f696fa97029160f1f
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = 'a81faf4baa85bd50e89afdc78a1c805f' OR slug = 'koshizawa-buttress-climbing-guide-ja') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('a81faf4baa85bd50e89afdc78a1c805f', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'koshizawa-buttress-climbing-guide-ja', '越沢バットレスガイド：マルチピッチの準備で選ぶ奥多摩の一日', '越沢バットレスはマルチピッチ主体のゲレンデ。グレードだけでなく、パーティーの技術と下降計画を確認します。', '<h2>この日の目的はパーティーとして行動すること</h2>
<p>越沢バットレスは奥多摩のマルチピッチの岩場で、支点構築、セカンドの確保、下降を協力して行えるパーティー向けの候補です。マルチピッチは途中のビレイ点で区切って登る方式で、地上で確保するシングルピッチのスポートクライミングとは時間と技術の要求が異なります。</p>
<p><a href="https://www.climbing-net.com/iwaba_detail/%E8%B6%8A%E6%B2%A2%E3%83%90%E3%83%83%E3%83%88%E3%83%AC%E3%82%B9/">CLIMBING-net</a>は高差約 80 メートル、幅約 70 メートルの岩壁を紹介し、マルチピッチ主体で本格的な山岳ルートへ向かうための訓練色が強いと説明しています。この寸法は岩壁の規模であり、特定ルートの登攀長や必要なロープ数ではありません。一日で多くのグレードを登るより、全員に合った計画を完遂することを目標にします。</p>
<h2>易しいグレードだけでは決められない</h2>
<p><a href="https://www.rocktopo.net/areas/102">ROCKTOPO のエリアページ</a>は、収録した主要ラインをマルチとして分類しています。データベースは現地操作の完全な手引きではありません。ルート名とグレードが分かっても、中間支点や下降位置が分からなければ準備は足りません。</p>
<p>誰がリードし、誰がセカンドを確保し、誰が支点を判断するか、互いが見えないときにどう連絡するかを共有しましょう。登攀中止も選択肢にします。一人だけが全システムを理解しているなら、まず管理された環境で練習するか、適切な指導を受けてください。</p>
<h2>岩角と残置支点は別に評価する</h2>
<p>出版者は残置プロテクションの信頼性に注意を促し、一部に鋭い岩角があること、過去にロープ切断事故があったことを記載しています。動作の難しさとは別の問題であり、登れることだけでロープの通過位置や支点の問題に対応できるとは限りません。</p>
<p>装備は目標ルートと現況に合わせ、プロテクション、支点、下降、個人の防護まで考えます。他のスポート岩場のクイックドロー本数をそのまま流用しないでください。本記事は支点構築や下降の手順を教えるものではありません。経験者とトポ、撤退方法を確認し、判断できない支点やロープ経路の区間へは進まないことを勧めます。</p>
<h2>接近から下山までを一日の計画にする</h2>
<p>取り付き、アプローチ、下降、帰路を同時に確認します。同じ道とは限らないため、岩壁の座標だけを保存しても不十分です。公共交通を使う場合は当日の往復便と、撤退の余裕を残す折り返し時刻を決めます。装備整理、ルート探し、他パーティーの待ち時間も必要です。</p>
<p><a href="https://npo.mirokuyamanokai.org/2024/06/07/56265">みろく山の会の 2024 年 5 月の記録</a>は、鳩ノ巣駅から取り付きまで徒歩約 30 分としています。駅を交通計画の基点にできますが、そのパーティーの記録であり、現在の登山道や全員の所要時間の保証ではありません。当日の列車と現在の接近・下降経路を別に確認します。</p>
<p>CLIMBING-net には維持協力費の記載がありますが、今回の調査では現行の費用、接近設備、固定支点の状態を確認できていません。出発前に関係する管理者や現地に詳しいクライマーへ確認し、古い紹介を現況の保証にしないでください。情報が不足するなら、先に補ってから旅程へ組み込みます。</p>
<p>越沢バットレスは、山岳登攀の総合的な技術を使う目的で選びたい岩場です。自分たちで管理できる計画、撤退時間、代替活動を用意することで、意図のある練習の一日にできます。</p>
<h2>参考資料</h2>
<ul>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E8%B6%8A%E6%B2%A2%E3%83%90%E3%83%83%E3%83%88%E3%83%AC%E3%82%B9/">越沢バットレス</a></li>
<li><a href="https://www.rocktopo.net/areas/102">越沢バットレス | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
<li><a href="https://npo.mirokuyamanokai.org/2024/06/07/56265">越沢バットレス自主トレ</a></li>
</ul>
<p><a href="/blog/dafce096fb5fe98e910208925e4c9aa9">繁體中文</a> · <a href="/en/blog/289373c784da996c3ce737cd070e62de">English</a> · <a href="/ja/blog/a81faf4baa85bd50e89afdc78a1c805f">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('a81faf4baa85bd50e89afdc78a1c805f', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('a81faf4baa85bd50e89afdc78a1c805f', '岩場指南');
DROP TABLE _blog_article_guard;
