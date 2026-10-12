-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/7251160388f3655aad947e08e053add5.md
-- source-sha256: a7e0a86b2b98f01d27cb4f7d4a91225d088c929ffcddfddc90f14c61a54d6b90
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '7251160388f3655aad947e08e053add5' OR slug = 'bpump-akihabara-climbing-guide-ja') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('7251160388f3655aad947e08e053add5', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'bpump-akihabara-climbing-guide-ja', 'B-PUMP秋葉原ガイド：初回料金と東京でのボルダリング', '秋葉原店の営業時間、登録、利用料、レンタルを確認し、力量とセット予定に合わせて一日を組み立てる。', '<h2>東京の旅にどう組み込むか</h2>
<p><a href="https://pump-climbing.com/gym/akiba/">B-PUMP TOKYO秋葉原</a>は東京都文京区湯島1-1-8のボルダリングジムです。公式サイトでは秋葉原駅と御茶ノ水駅からそれぞれ徒歩約5分としています。街の予定の前後に組みやすい場所です。ロープのリードや確保練習を目的にしていたなら、この日は課題、動き、ジムでの体験を目的に設定し直しましょう。</p>
<p>公式トップページの2026年10月のセット情報には、初級から中級の利用者がいる1階や、3階のBeginner Wall、他の階と屋上の課題が記されています。初訪問の場所選びの手がかりとして、到着時に現在のグレードと利用できる壁をスタッフへ確認しましょう。特定のセット告知の本数は恒久的な配置ではありません。経験者も着地、館内の動線、ルールを先に把握します。</p>
<h2>営業時間と初回予算</h2>
<p>2026年10月12日に確認した秋葉原店の公式案内では、平日12:00–23:00、土曜・祝日11:00–21:00、日曜10:00–21:00です。日本時間で、変則営業やセットは最新告知も確認します。一般の通日利用料は税込2,420円。初回登録は2,200円、他PUMP登録済みで秋葉原店を初めて利用する場合は1,100円です。</p>
<p>予算例として、PUMP未登録の成人が初回に通日で利用するなら、登録と利用料の合計は4,620円です。他PUMP登録者の料金が適用されるなら3,520円です。公式の二つの料金を合計した例で、他の支出は含みません。平日昼間や夜間の料金には時間帯の条件があります。短い滞在なら料金表を確認し、夜間料金で一日分を見積もらないでください。</p>
<p>秋葉原店のレンタルシューズは330円で初回無料、チョークは現在貸し出していません。粉チョークにはバッグが必要で、液体チョークは単体利用が可能です。<a href="https://pump-climbing.com/gym/akiba/discovery">初訪問の案内</a>は靴下と動きやすい服装も挙げています。必要なチョークは持参するか事前に確認しましょう。受付で初訪問とPUMP登録状況を伝え、説明を受けてからウォームアップします。</p>
<p>本稿の予算は成人の例です。秋葉原店の公式ページには未成年の付き添い、利用時間、18歳未満の初回利用確認書の条件があり、成人の日程をそのまま子どもに使えません。保護者が店の規定を読み、必要書類を準備してください。特定日の団体枠、荷物の収納容量、指導枠は確認していません。必須条件なら予約前に店へ確認します。</p>
<h2>余裕のあるジムの日にする</h2>
<p>計画例は平日の午後に入り、易しい課題で現在のグレード感に慣れ、気になる動きを少数練習して、食事に行く余力を残す形です。翌日が外岩なら、人気課題を全て限界まで試す必要はありません。編集上の提案で、混雑の実測や訓練効果の検証ではありません。セット中の壁があれば、利用可能な場所をスタッフに案内してもらいましょう。</p>
<p>上の料金と時間は2026年10月12日の公式ページの確認内容で、2027年4月の料金を保証しません。出発前に秋葉原店自身のPRICE、OPEN HOUR、最新セット告知を再確認してください。雨の外岩日の代わりに行く場合も、通常時刻だけで判断せず当日の営業を確認します。</p>
<h2>参考資料</h2>
<ul>
<li><a href="https://pump-climbing.com/gym/akiba/">ボルダリングジム＆ショップ B-PUMP TOKYO 秋葉原</a></li>
<li><a href="https://pump-climbing.com/gym/akiba/discovery">ボルダリングジム＆ショップ B-PUMP TOKYO 秋葉原</a></li>
</ul>
<p><a href="/blog/9a6e16e346eca229e3c6a34a77333acf">繁體中文</a> · <a href="/en/blog/6710b8dcea752a73926f8654a6eb1b24">English</a> · <a href="/ja/blog/7251160388f3655aad947e08e053add5">日本語</a></p>
', NULL, 'gyms', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('7251160388f3655aad947e08e053add5', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('7251160388f3655aad947e08e053add5', '岩館指南');
DROP TABLE _blog_article_guard;
