-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/bcedf8485d7ea87fa0001f82d0a54ff8.md
-- source-sha256: 84f6aefa8ac3c0acacf8404c3b313a37fab947e70e72a9e4aef5c6f5defed0e0
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = 'bcedf8485d7ea87fa0001f82d0a54ff8' OR slug = 'gakurei-iwa-climbing-guide-ja') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('bcedf8485d7ea87fa0001f82d0a54ff8', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'gakurei-iwa-climbing-guide-ja', '岳嶺岩ガイド：日原川の五つの岩峰と旧ルートの準備', '日原川河原の岳嶺岩について、岩峰の区別、リングボルトやピトンへの注意、接近計画を整理します。', '<h2>河原に着く前に目標の岩壁を絞る</h2>
<p>岳嶺岩は東京・奥多摩の日原川河原にある岩峰群です。外岩のロープクライミング経験があり、旧ルートやプロテクションを調べる人向けの候補です。易しいグレードがあるだけでは準備にならず、どの岩峰へ向かうかを先に決めたい場所です。</p>
<p><a href="https://www.climbing-net.com/iwaba_detail/%E5%B2%B3%E5%B6%BA%E5%B2%A9/">CLIMBING-net</a>は、大きい A、B、C 峰と小さい D、E 峰の合計五つを紹介しています。一つのエリア名に複数の取り付きとルートがあるので、同行者には共同座標だけでなく目標峰とルート名を共有します。</p>
<h2>ルート資料で選択肢を理解する</h2>
<p><a href="https://www.rocktopo.net/areas/106">ROCKTOPO のエリアページ</a>にはフェイスルートが収録され、<a href="https://www.rocktopo.net/rocks/2226">C 峰から E 峰のページ</a>にはポパイ・ス・スキ 5.10b、鬼門 5.11b、ロック・スピリット 5.12b などがあります。データベースの表記であり、NobodyClimb の現地評価ではありません。フェイスという分類も、現代的なボルトで完全に保護されていることを意味しません。</p>
<p>能力に合う候補を選んだら、対応するトポ、長さ、終了点、下降を調べます。資料間で名前や位置が合わなければ、グレードで推測せず現地に詳しい人へ確認してください。リストだけで目標と撤退の共通理解を代用できません。</p>
<h2>支点と動作の難しさを別に見る</h2>
<p>出版者は多くのルートがリングボルトやピトンを使うこと、無理なネイリングでグレードが変わった可能性を注意事項にしています。支点の信頼性と動作の難度は別に判断します。低いグレードでも、保護、岩、下降の不確実性がなくなるわけではありません。</p>
<p>本記事は人工登攀、ネイリング、支点構築を教えず、旅行者による保護の追加も解決策として勧めません。既存支点、終了点、撤退を判断できなければ、先に技術や適切な指導を得るか訪問を取りやめます。一般的なスポート装備だけで到着し、そこで下降方法を尋ねるのは準備の順序が逆です。</p>
<h2>日原へ向かう前に交通と接近を確認する</h2>
<p>出版者は奥多摩駅からバスで東日原、徒歩約 20 分とし、平日は中日原からの方が近いと紹介しています。旅行当日の運行保証ではないため、往復便と道路から河原への道を別に確認します。</p>
<p>今回の調査では現在のバス停、接近の通行、駐車資格、固定支点の状態を確認していません。最近の情報を得て、古いページだけで駐車や立ち入りを決めないでください。通年だが冬は寒いという紹介も、気候の手掛かりであって毎日の登攀条件を保証しません。</p>
<p>目標峰、ルート、プロテクション、下降、帰路の五点を準備し、水、食事、雨具、照明を持ちます。河原の状態と撤退の余裕も考えます。五つの岩峰の旧ルートを、具体的な目的を持って探索するための候補です。</p>
<h2>参考資料</h2>
<ul>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E5%B2%B3%E5%B6%BA%E5%B2%A9/">岳嶺岩</a></li>
<li><a href="https://www.rocktopo.net/areas/106">岳嶺岩 | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
<li><a href="https://www.rocktopo.net/rocks/2226">C峰～E峰 | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
</ul>
<p><a href="/blog/52fa6a72b2179173608991efd3bd602f">繁體中文</a> · <a href="/en/blog/8a57b4ba16e86e3c07ccc9a2068eb344">English</a> · <a href="/ja/blog/bcedf8485d7ea87fa0001f82d0a54ff8">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('bcedf8485d7ea87fa0001f82d0a54ff8', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('bcedf8485d7ea87fa0001f82d0a54ff8', '岩場指南');
DROP TABLE _blog_article_guard;
