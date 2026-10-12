-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/a1aa21c3ea0059ea1b2fbd1489dae93b.md
-- source-sha256: a64ff476d69f444795030cc14cbe282c9a697dec7dd384f5e95ab2da35d61fd6
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = 'a1aa21c3ea0059ea1b2fbd1489dae93b' OR slug = 'shoji-iwa-climbing-guide-ja') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('a1aa21c3ea0059ea1b2fbd1489dae93b', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'shoji-iwa-climbing-guide-ja', '障子岩ガイド：檜原の石灰岩とバス・徒歩での計画', '障子岩の石灰岩、神戸岩入口からの接近、季節、古い支点と限られた駐車を整理します。', '<h2>5.11台の石灰岩を探すなら候補に</h2>
<p>障子岩は東京都檜原村小沢のロープクライミングの岩場です。外岩のリード経験があり、バスと山道の移動を計画できるパートナー向けに特徴を整理します。東京都内というだけで市街地のジムと同じ感覚の日程にはしないでください。</p>
<p><a href="https://www.climbing-net.com/iwaba_detail/%E9%9A%9C%E5%AD%90%E5%B2%A9/">CLIMBING-net</a>は岩質を石灰岩、垂直から薄かぶり、5.11台が多い構成としています。易しいラインを気軽に選びたい人より、トポを読み、登りたい目標がある人に向く候補です。</p>
<h2>名前と支点の情報を分けて確認する</h2>
<p><a href="https://www.rocktopo.net/rocks/206">ROCKTOPOの主壁ページ</a>にはTNT（5.10b）、夏立ちぬ（5.11a）、ウッシーⅢ（5.12b）などが登録されています。日本語名をトポの照合に使い、グレードや掲載がボルトと岩の状態を保証するとは考えないでください。出だし、支点、下降を一緒に見て選びます。</p>
<p>出版社は古いボルトに注意を促し、夏は状態が悪く、11月から3月をベストとしています。4月の旅行はこの適期の外側なので、冬の推奨を春の乾燥保証に広げないことが必要です。余裕のある一本から始め、動きと支点を見て難度を上げましょう。</p>
<h2>神戸岩入口から先は別途歩く</h2>
<p>交通の骨格は武蔵五日市から小岩方面のバスで神戸岩入口へ向かい、神戸岩方向へ歩いて最初の橋を渡り、林道と小沢脇の山道をたどるものです。出版社は林道と山道を各約15分としていますが、全員の到着時刻を保証しません。障子岩は観光地点の神戸岩そのものではなく、隣接岩場とも入口を混同しないでください。</p>
<p>当日の往復バスを調べ、トポ、交通情報、岩場を出る締切を保存します。重い荷物なら道探しと片付けの時間を増やしましょう。通行案内が資料と違えば現地の指示を優先し、勝手な近道を作らないでください。</p>
<h2>駐車は到着後に探さない</h2>
<p>ROCKTOPOは岩場に近い道路周辺の駐車を原則禁止とし、指定場所に停められなければ別の岩場へ行くよう記しています。出版社も駐車場所はほとんどないと説明します。正規の場所と条件を先に確認し、林道の空いた路肩を予備の駐車先にしないでください。</p>
<p>実際の訪問日の通行条件と登攀条件は確認できていません。最新利用情報と雨を確認してから確定し、登攀記録を許可と受け取らないようにします。出版社によると岩場に公衆トイレはありません。進入前に用を済ませ、水と昼食を用意し、火を使わずゴミを持ち帰るところまでを一日の計画に含めましょう。</p>
<h2>参考資料</h2>
<ul>
<li><a href="https://www.rocktopo.net/rocks/206">ROCKTOPO — 障子岩</a></li>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E9%9A%9C%E5%AD%90%E5%B2%A9/">山と溪谷社 CLIMBING-net — 障子岩</a></li>
</ul>
<h2>ほかの言語</h2>
<p><a href="/blog/b905d673e6be5137348535d62c79011c">繁體中文</a> · <a href="/en/blog/2154ab57f65bc1aded60ed8d4af84d72">English</a> · <a href="/ja/blog/a1aa21c3ea0059ea1b2fbd1489dae93b">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('a1aa21c3ea0059ea1b2fbd1489dae93b', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('a1aa21c3ea0059ea1b2fbd1489dae93b', '岩場指南');
DROP TABLE _blog_article_guard;
