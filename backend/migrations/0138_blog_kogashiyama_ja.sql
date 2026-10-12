-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/83848f20009ac20978478f9a18c5ffae.md
-- source-sha256: b74832866b08afe93698f452710794d49f6101ec08f7083bde61ee6fa15fec9e
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '83848f20009ac20978478f9a18c5ffae' OR slug = 'kogashiyama-climbing-guide-ja') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('83848f20009ac20978478f9a18c5ffae', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'kogashiyama-climbing-guide-ja', '古賀志山クライミングガイド：不動滝のルート選びと利用範囲', '宇都宮周辺の岩場で、登れるエリアと地主との約束を確認し、自分の力量に合う一日を組み立てる。', '<h2>どんな旅行者に向くか</h2>
<p>古賀志山は栃木県宇都宮周辺の岩場です。<a href="https://www.climbing-net.com/iwaba_detail/%E5%8F%A4%E8%B3%80%E5%BF%97%E5%B1%B1/">CLIMBING-netの紹介</a>では岩質をチャートとし、ボルトルート、マルチピッチ、一部トップロープ限定を掲載しています。<a href="https://www.rocktopo.net/areas/80">ROCKTOPO</a>の登録はフェイスのリードが中心です。力量に応じた目標はありますが、易しいルートがあることと、外岩のロープ経験なしで登れることは別です。</p>
<p>外岩のリード、確保、回収ができるチームなら、ルートを絞った一日にできます。ジム経験だけの人は岩場を知るガイドと行きましょう。東京旅行の登攀日が少ないなら、移動とアプローチに使う時間に全員が納得できるかを先に確認します。幅広いルートがあっても、誰もがすぐ適した目標を見つけられるとは限りません。</p>
<h2>不動滝周辺で目標を探す</h2>
<p>ROCKTOPOには不動滝正面・左フェイス、右フェイス、左奥フェイスなどの名称があり、競技会ルート5.9、ハートブレーカー5.10c、羚羊ハング5.11aが人気ルートとして挙がっています。現地と照合できるよう、日本語名を残してトポを探すとよいでしょう。掲載グレードは装備や安全の保証ではありません。ナチュラルプロテクション、回収、リードの可否はルートごとに確認します。</p>
<h2>ルート数より利用の約束</h2>
<p>CLIMBING-netには、雌滝エリアに入らない、樹木を切らない、神社に私物を置かない、焚き火をしない、ゴミを持ち帰る、ヘルメットを着用するという約束が記されています。ROCKTOPOには左奥エリアより左は登攀禁止とあります。名称だけで同じ境界だと決めつけず、現行トポと掲示で場所を確認しましょう。分からなければ確認できた範囲に留まります。現在の全エリアの境界は、地主や管理主体には確認していません。</p>
<h2>移動、岩の状態、一日の計画</h2>
<p>出版社の案内は、古賀志山南登山道駐車場と約30分の歩行をアプローチの目安にしています。ただし公共交通の段落には古い施設名や廃止された便の情報があり、本稿では便や所要時間を引き継ぎません。宇都宮周辺の宿泊や確認できる送迎を用意し、現地を知る同行者と集合場所、帰りを決めてから列車を調べましょう。現在の送迎料金や駐車料金は未確認なので、予算には余裕を持たせます。</p>
<p>ROCKTOPOと出版社は通年の目安を示していますが、濡れた岩、雨後の状態、混雑は当日判断が必要です。計画例として、朝は不動滝の一つのエリアに絞り、ルートと支点を確認して、全員が参加できる少数の目標を選びます。慣れない回収作業に新しい練習を重ねないでください。<a href="https://freeclimb.jp/information/9978/">JFAの古賀志事故報告</a>は、疑似リードとトップロープ回収に伴う確保の混乱を記録しています。ロープ経験者も訪問前に読んでおきたい資料です。</p>
<h2>参考資料</h2>
<ul>
<li><a href="https://www.rocktopo.net/areas/80">古賀志山 | ROCKTOPO 日本のクライミング、ボルダリングの岩場情報・トポ</a></li>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E5%8F%A4%E8%B3%80%E5%BF%97%E5%B1%B1/">古賀志山</a></li>
<li><a href="https://freeclimb.jp/information/9978/">古賀志事故報告書</a></li>
</ul>
<p><a href="/blog/a2ec5292794db159908646020424553b">繁體中文</a> · <a href="/en/blog/30860f3340ee9d6b944945e372542527">English</a> · <a href="/ja/blog/83848f20009ac20978478f9a18c5ffae">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('83848f20009ac20978478f9a18c5ffae', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('83848f20009ac20978478f9a18c5ffae', '岩場指南');
DROP TABLE _blog_article_guard;
