-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/5c1f7dd326e222ca8162fcde107f3559.md
-- source-sha256: efe97b0bd66de91532cd849aa2a55c64f1405a6c9d8879a2a15f52eede97f6de
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '5c1f7dd326e222ca8162fcde107f3559' OR slug = 'shirotae-bashi-climbing-guide-ja') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('5c1f7dd326e222ca8162fcde107f3559', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'shirotae-bashi-climbing-guide-ja', '白妙橋ガイド：奥多摩の石灰岩と先に確かめたい利用状況', '白妙橋の石灰岩と交通を知り、利用自粛解除の未確認部分を先に解決して予定を決めます。', '<h2>利用状態を確かめてから予定を組む</h2>
<p>白妙橋は奥多摩の石灰岩のロープクライミングエリアです。東京旅行の調査候補にはできますが、この記事は利用確認済みの行き先として推薦しません。外岩経験があり5.11台・5.12台を比較するパートナーに向け、岩と交通の背景、予約より先に許可を確認すべき理由を整理します。</p>
<p><a href="https://www.climbing-net.com/iwaba_detail/%E7%99%BD%E5%A6%99%E6%A9%8B/">CLIMBING-netのページ</a>には、ゴミ、残置物、焚き火、駐車問題からJFAが2007年4月より利用自粛を呼びかけたという記載が残り、現状確認を求めています。この古い記録から同じ範囲で継続しているとも、年月だけを理由に解除されたとも言えません。</p>
<h2>中上級の石灰岩ラインを調べる</h2>
<p>出版社は垂直から明瞭な前傾の石灰岩と、5.11台・5.12台の充実を紹介しています。<a href="https://www.rocktopo.net/areas/110">ROCKTOPOの索引</a>には正面壁、バルコニー・フェイス、カワラ・フェイス、ディンプル・フェイス、アイビー・フェイスがあります。区画を理解するための掲載であり、開放の証明ではありません。</p>
<p>5.9以下を多数必要とするチームなら目的に合わない可能性があります。中上級の石灰岩が目標なら、まず利用を確認し、選んだ壁の完全なトポを用意してください。データベースの本数を当日の登攀許可リストとみなさないことが必要です。</p>
<h2>奥多摩駅から日原方面という交通の骨格</h2>
<p>出版社は奥多摩駅から日原行きバスで白妙橋へ行き、吊り橋を渡ると正面壁基部としています。交通の背景であり、訪問日に橋や入口が利用できるという確認ではありません。許可を確かめてから往復バスと徒歩を調べ、新宿からの固定総時間は使わずに計画します。</p>
<p>古い車の案内にはトラウトカントリーでの受付と駐車、岩場周辺とバス停前の路上駐車禁止が記されています。禁止事項を守りつつ、過去の駐車料を現在の料金としないでください。駐車場への支払いも別の岩壁の利用許可を意味しません。</p>
<h2>解除の確認ができるまで別の候補を残す</h2>
<p>白妙橋の利用自粛が解除されたか、また実際の訪問日の登攀・通行許可は確認できていません。現状を答えられる管理側や地元クライミング窓口に確認し、明確な回答がなければ条件の分かる別の場所を選びましょう。変更できない唯一の外岩日にしないことが大切です。</p>
<p>新しい投稿は情報が登録されたことを示すだけで、地主の同意を証明しません。出版社は住民との関係と自然保護も重視しています。クイックドローなどを回収し、火を使わず、ゴミを持ち帰る約束は、利用を確認できた場合にも必要です。</p>
<h2>三つの質問に答えてから装備を決める</h2>
<p>入れる区画、通れるアプローチ、駐車とトイレの場所を別々に確認し、具体的な答えがそろってから選線と装備を計画します。岩場の魅力を知ることと、未解決の条件を旅行案内で覆い隠さないことを両立させましょう。</p>
<h2>参考資料</h2>
<ul>
<li><a href="https://www.climbing-net.com/iwaba_detail/%E7%99%BD%E5%A6%99%E6%A9%8B/">山と溪谷社 CLIMBING-net — 白妙橋</a></li>
<li><a href="https://www.rocktopo.net/areas/110">ROCKTOPO — 白妙橋</a></li>
</ul>
<h2>ほかの言語</h2>
<p><a href="/blog/765b73392af400eacd36fec66a9b0513">繁體中文</a> · <a href="/en/blog/584437e6e66e29a1702a4779de0a9c7e">English</a> · <a href="/ja/blog/5c1f7dd326e222ca8162fcde107f3559">日本語</a></p>
', NULL, 'travel', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('5c1f7dd326e222ca8162fcde107f3559', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('5c1f7dd326e222ca8162fcde107f3559', '岩場指南');
DROP TABLE _blog_article_guard;
