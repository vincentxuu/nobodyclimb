-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/0a0d30a5b4a4f89339e7d3b2a993db9e.md
-- source-sha256: 2f929523c2a032b2799536075e417903d97e7700db91296ce6560170e95e3318
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '0a0d30a5b4a4f89339e7d3b2a993db9e' OR slug = 'futagoyama-climbing-guide-ja') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('0a0d30a5b4a4f89339e7d3b2a993db9e', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'futagoyama-climbing-guide-ja', '二子山クライミングガイド：石灰岩の目標と入山前の確認', 'エリアと目的を絞り、利用条件、ボルトの注意情報、帰路を確認してから東京旅行に組み込む。', '<h2>グレードより先にエリアを決める</h2>
<p>埼玉県小鹿野町の二子山は、石灰岩のリードとマルチピッチが特徴の岩場です。<a href="https://www.climbing-net.com/iwaba_detail/%E4%BA%8C%E5%AD%90%E5%B1%B1/">CLIMBING-net</a>は東岳、西岳、祠、ローソク岩などを紹介し、<a href="https://www.rocktopo.net/areas/92">ROCKTOPO</a>もフェイス、クラック、マルチピッチを分けています。旅行者が先に決めるべきなのは、有名ルートではなく、予定するエリアを現在どの条件で利用できるかです。</p>
<p>外岩のリード経験があり、状態に応じて目標を変えられるチーム向けです。出版社の案内には強い傾斜の壁もあります。低いグレードを気軽に数本登りたいなら、実際のトポで選択肢と移動の負担を確認しましょう。中央稜のマルチピッチと祠・弓状のシングルピッチでは、技術と時間計画が異なります。ひとくくりの日帰り計画では不十分です。</p>
<h2>トポを探すための名称</h2>
<p>ROCKTOPOには中央稜の最高5.9、悪魔のエチュード5.10b、シリアル5.11a、ノースマウンテン5.12a、任侠道5.13aが掲載されています。本稿ではトポを探す手がかりとして挙げ、支点や核心の解説はしません。高難度を狙うなら、実際の外岩経験に合う一本を選び、エリアの把握と控えめなウォームアップの時間を確保します。帰路の焦りで最後のトライを決めないこと。</p>
<h2>入山情報とボルトの注意情報</h2>
<p><a href="https://www.oganoclimbing.com/%E8%A4%87%E8%A3%BD-%E4%BC%9A%E5%93%A1%E5%90%91%E3%81%91%E7%89%B9%E5%88%A5%E6%A1%88%E5%86%85%E6%97%A5%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6">小鹿野クライミング協会の入山ページ</a>は、入山するクライマーに注意事項の再確認を求めています。ただし今回取得できた本文には規則の全体がありませんでした。各エリアの現在の会員、登録、利用条件は本稿では完全に確認できていないため、訪問前に協会へ直接確認してください。二子山全域が開放されているとは述べていません。利用資格が分からなければ、登攀日を確定扱いにしないでください。</p>
<p><a href="https://freeclimb.jp/access/10079/">JFAの2024年12月の告知</a>には、広場エリアの「青い瞳のセリーヌ」で第一ボルトが抜けたとの情報があります。本稿では修復完了を確認していません。この個別ルートを追って確認する必要があり、他のルートの安全は推測できません。<a href="https://freeclimb.jp/access/6829/">JFAのトイレに関する注意</a>も、最低限トイレ紙の持ち帰りを求めています。最新の現地ルールに従い、事前に適切なトイレを使い、必要な持ち帰りの準備をしましょう。</p>
<h2>移動と状態で計画を決める</h2>
<p>CLIMBING-netは坂本側の林道と国道299号をアプローチの手がかりにし、雨期や夏の染み出しに触れています。具体的な公共交通の接続と現在の林道・駐車条件は未確認です。現地を知る同行者と送迎、最終退出時刻を確認するか、近くに泊まって移動の負担を減らしましょう。4月でも当日の晴れだけで岩が乾いていると判断せず、直前の雨を見ます。</p>
<p>計画例は、利用資格と交通を確認してから、一つの利用可能なエリアと少数の目標に絞る方法です。登る前に現地で場所を照合します。濡れた壁、利用禁止の掲示、信頼できる下降情報がない場合は変更します。本稿は計画の可否を考えるための資料で、入場許可や支点点検記録、トポの代わりではありません。</p>
<h2>参考資料</h2>
<ul>
<li><a href="https://www.rocktopo.net/areas/92">二子山 | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E4%BA%8C%E5%AD%90%E5%B1%B1/">二子山</a></li>
<li><a href="https://freeclimb.jp/access/10079/">アクセス情報：埼玉県・二子山 - ボルト破損</a></li>
<li><a href="https://freeclimb.jp/access/6829/">【注意喚起(エリア関連)：埼玉県・二子山】</a></li>
<li><a href="https://www.oganoclimbing.com/%E8%A4%87%E8%A3%BD-%E4%BC%9A%E5%93%A1%E5%90%91%E3%81%91%E7%89%B9%E5%88%A5%E6%A1%88%E5%86%85%E6%97%A5%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6">二子山への入山について | 一般社団法人小鹿野クライミング協会</a></li>
</ul>
<p><a href="/blog/faba26d85e4f809578c41ec9e2f7ca02">繁體中文</a> · <a href="/en/blog/679d2da9f72094d2de6d55fc4a739c8e">English</a> · <a href="/ja/blog/0a0d30a5b4a4f89339e7d3b2a993db9e">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('0a0d30a5b4a4f89339e7d3b2a993db9e', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('0a0d30a5b4a4f89339e7d3b2a993db9e', '岩場指南');
DROP TABLE _blog_article_guard;
