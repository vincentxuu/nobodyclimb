-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/9ae4f485fe4c3c2d7d7a866d9b511286.md
-- source-sha256: c452333bbd4aea39ed2938f69efb54f13e5e08181e47a371f882b27cde919950
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '9ae4f485fe4c3c2d7d7a866d9b511286' OR slug = 'tengu-iwa-climbing-guide-ja') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('9ae4f485fe4c3c2d7d7a866d9b511286', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'tengu-iwa-climbing-guide-ja', '天狗岩ガイド：檜原の滝側壁へ向かうための確認事項', 'つづら岩と合併掲載される檜原の天狗岩について、滝側壁の特徴、千足からの接近、資料の限界を整理します。', '<h2>どの天狗岩なのかを先に特定する</h2>
<p>本記事の天狗岩は、<a href="https://www.climbing-net.com/iwaba_detail/%E3%81%A4%E3%81%A5%E3%82%89%E5%B2%A9%E3%80%81%E5%A4%A9%E7%8B%97%E5%B2%A9/">CLIMBING-net</a>がつづら岩とともに紹介する、檜原方面の滝側壁の岩場です。東京旅行の候補として、この具体的な場所を見分けるための記事です。「天狗岩」だけで地図検索し、最も近い結果へ向かうことは避けてください。</p>
<p>尾根上のつづら岩とはアプローチの規模が異なるので、訪問は別に判断します。同行者の写真に地域やトポの情報がなければ、難度や装備を話す前に場所を確認しましょう。本記事では名前が似た天王岩を、この岩場の別名やナビゲーション地点として扱いません。</p>
<h2>短い接近でも一日の計画を作る</h2>
<p>出版者は天狗岩の接近を約 30 分とし、武蔵五日市からバスで千足へ向かう手掛かりを示しています。同じページのつづら岩約一時間半とは異なりますが、東京中心部からの総所要時間が 30 分という意味ではありません。全員が同じ時間で到着できる保証でもありません。</p>
<p>旅行当日の往復便を調べ、千足から目的の岩壁までの道を確認します。バス停、取り付き、滝の観覧地点を別に記録し、観光地点とルートを混同しないようにします。雨後の足元が適さなければ行程を短縮することも、先に全員で決めておきます。</p>
<h2>紹介から分かることと不足すること</h2>
<p>CLIMBING-net は滝側壁にフリールートが開拓されたと紹介していますが、「近年」に明確な日付はありません。最近の整備やリボルトの証拠にはできません。<a href="https://www.rocktopo.net/areas/101">ROCKTOPO の共同エリアページ</a>で掲載自体は確認できますが、今回取得したページには天狗岩の逐線計画を完成できる情報がありませんでした。</p>
<p>本記事では天狗岩の各ルートの現行グレード、長さ、固定支点、下降方法を確認しておらず、グレード別の推奨リストを提示しません。最近のトポを入手した場合は、つづら岩だけでなく、この滝側壁が含まれるかを確かめましょう。現地を知る人にルートと現況を確認してから、パーティーに合うか判断します。</p>
<p>共同紹介には古いピトンの孔やスリングについての注意がありますが、天狗岩の全ルートとの対応は示されていません。全ルートに同じ操作が必要と読み替えず、記載がないから支点評価は不要とも考えないでください。装備は目標ルートと現況から決めます。</p>
<h2>候補に残してよい条件</h2>
<p>外岩のロープクライミング経験があり、具体的なトポ、接近、下降の情報を補う人なら、檜原での攀登日の候補にできます。名称と歩行時間だけでは、必ず登る目的地として確定するには不足しています。人気の評価ではなく、準備の問題です。</p>
<p>岩場の特定、地図、目標、帰路を同行者と共有し、水、行動食、雨具、照明を準備します。場所、支点、退路を確認できなければ登攀を始めません。事前の確認によって、滝の脇の岩壁を意図のある一日に組み込めます。</p>
<h2>参考資料</h2>
<ul>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E3%81%A4%E3%81%A5%E3%82%89%E5%B2%A9%E3%80%81%E5%A4%A9%E7%8B%97%E5%B2%A9/">つづら岩、天狗岩</a></li>
<li><a href="https://www.rocktopo.net/areas/101">つづら岩、天狗岩 | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
</ul>
<p><a href="/blog/843cf5663149a378e12125ac8ae990dc">繁體中文</a> · <a href="/en/blog/7eef70c42822bcb8025353d418e8f4e0">English</a> · <a href="/ja/blog/9ae4f485fe4c3c2d7d7a866d9b511286">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('9ae4f485fe4c3c2d7d7a866d9b511286', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('9ae4f485fe4c3c2d7d7a866d9b511286', '岩場指南');
DROP TABLE _blog_article_guard;
