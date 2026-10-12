-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/10d55aed821ce29227f89aa1f05ee146.md
-- source-sha256: 9f119fb21eaf70fe599da764c198b69b7cb7c3a9153aef4c24cb0f9543bb3776
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '10d55aed821ce29227f89aa1f05ee146' OR slug = 'bpump-ogikubo-climbing-guide-ja') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('10d55aed821ce29227f89aa1f05ee146', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'bpump-ogikubo-climbing-guide-ja', 'B-PUMP荻窪ガイド：ボルダリングの一日と初回料金', '荻窪店自身の料金、レンタル、営業時間を確認し、駅近くで課題に集中する一日を計画する。', '<h2>ボルダーに集中する一日</h2>
<p><a href="https://pump-climbing.com/gym/bpump/">B-PUMP OGIKUBOの公式ページ</a>はボルダリング専門ジムを紹介しています。住所は東京都杉並区上荻1-10-12、荻窪東亜会館3階で、JR荻窪駅から徒歩約1分です。東京旅行で課題に集中する時間を作る候補になります。ロープの岩場ではないため、リード練習の目的をそのまま持ち込まず、この日の目標を考え直しましょう。</p>
<p>公式ページの2026年9月のイベント告知には、CIRCUIT WALLとCOMPETITION WALLの特定日の制限や、一日の休業があります。壁やイベントの使い分けを示す情報ですが、名称だけで毎日の難度や利用範囲は分かりません。初めてなら現在の課題と着地のルールをスタッフに確認し、扱える動きと高さから始めましょう。</p>
<h2>営業時間と利用料金</h2>
<p>2026年10月12日に確認した公式案内は、日本時間で平日13:00–23:00、土日祝10:00–21:00です。一般の通日利用料は平日、土日祝とも税込2,530円。平日昼間の18:30までと夜間18:00からは2,310円、平日21:00からは1,650円、土日祝の18:00からも2,310円です。時間帯の条件に合う券を選び、短時間料金を通日の料金として使わないでください。</p>
<p>公式ページ間には差があります。<a href="https://pump-climbing.com/gym/bpump/discovery">荻窪の初訪問ページ</a>は平日の初回を税込4,510円とし、トップページの登録と通日料金を足した4,730円とは一致しません。本稿の予算はトップページの項目を合計した参考で、必ずその金額を請求されるという意味ではありません。適用される券種と初回合計は荻窪店へ直接確認してください。</p>
<p>初回登録は2,200円、他PUMP登録済みで荻窪店を初めて使う場合は1,100円です。成人の初回通日利用の予算例は、新規登録で合計4,730円、他PUMP登録者料金なら3,630円です。登録と通日利用料の合計で、買い物などは含みません。受付で登録状況を伝え、別店舗で登録済みなら無料と自己判断しないでください。</p>
<h2>レンタルと初訪問の準備</h2>
<p>荻窪店のシューズレンタルは220円、チョークは110円で、どちらも初回無料です。秋葉原店の案内とは異なるため、行く店の情報を確認します。動きやすい服装で受付と利用説明を済ませ、グレード、スタートと終了、墜落範囲の動線を把握しましょう。立ってよい場所が分からなければ、先にスタッフへ聞いてください。</p>
<p>本稿は成人が個人で利用する場面を想定しています。未成年、団体、講習予約、大きな荷物の保管に関する条件は完全に確認していません。利用や日程に必要なら荻窪店へ先に確認してください。料金が書かれていることと、全ての旅行者の登録や利用資格が整っていることは別です。</p>
<h2>充実した課題の日を組む</h2>
<p>計画例は開館後に入り、易しい課題でセットに慣れてから、気になる動きを二、三種類選び、休みながら取り組む形です。翌日が外岩なら、終わりの時間を回復と移動に合わせ、際限なく繰り返す日にしないようにします。これは編集上の提案で、荻窪のグレード、訓練効果、混雑を実測した結論ではありません。</p>
<p>上の内容は2026年10月12日の公式ページの確認結果で、2027年4月も同じ料金、時間とは保証しません。トップページに残る古い課題数やセット日だけを頼らず、直近の営業時間、セット、イベント制限を見てください。当日使える壁で課題計画も変わります。制限があればスタッフに別のエリア選びを相談しましょう。</p>
<h2>参考資料</h2>
<ul>
<li><a href="https://pump-climbing.com/gym/bpump/">ボルダリングジム＆ショップ B-PUMP OGIKUBO 荻窪店</a></li>
<li><a href="https://pump-climbing.com/gym/bpump/discovery">ボルダリングジム＆ショップ B-PUMP OGIKUBO 荻窪店</a></li>
</ul>
<p><a href="/blog/44d66a525d64f97349d2c9b60de239be">繁體中文</a> · <a href="/en/blog/b8732fabf83588800175280c5cb82705">English</a> · <a href="/ja/blog/10d55aed821ce29227f89aa1f05ee146">日本語</a></p>
', NULL, 'gyms', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('10d55aed821ce29227f89aa1f05ee146', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('10d55aed821ce29227f89aa1f05ee146', '岩館指南');
DROP TABLE _blog_article_guard;
