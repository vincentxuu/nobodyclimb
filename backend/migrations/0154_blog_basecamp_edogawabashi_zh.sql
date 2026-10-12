-- 自動生成；請修改 Markdown 原稿再重新生成。
-- blog-source: backend/content/blog/4170cdb52c273770734572c680c669c4.md
-- source-sha256: 000cda6683a217474333df263d2fc6effd77674382167d5160ea0df16a752c81
-- D1 migration runner 必須在單一交易中執行此檔。
CREATE TABLE _blog_article_guard (ok INTEGER NOT NULL CHECK (ok = 1));
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb') = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN (SELECT count(*) FROM users WHERE username = 'nobodyclimb' AND is_active = 1) = 1 THEN 1 ELSE 0 END);
INSERT OR ROLLBACK INTO _blog_article_guard (ok) VALUES (CASE WHEN NOT EXISTS (SELECT 1 FROM posts WHERE id = '4170cdb52c273770734572c680c669c4' OR slug = 'basecamp-edogawabashi-climbing-guide') THEN 1 ELSE 0 END);
INSERT INTO posts (id, author_id, slug, title, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at) VALUES ('4170cdb52c273770734572c680c669c4', (SELECT id FROM users WHERE username = 'nobodyclimb' AND is_active = 1), 'basecamp-edogawabashi-climbing-guide', 'Base Camp 江戶川橋：抱石、上攀與首次入場怎麼安排', '從江戶川橋站步行前往，同一館可選抱石與繩索攀登。整理首次費用、租借與體驗課差異，避免把入場當成確保教學。', '<h2>如何安排這個場地</h2>
<p>想在東京旅行中安排一個室內攀岩日，又不想先決定只抱石或只爬繩索，Base Camp 江戶川橋值得列入候選。<a href="https://b-camp.jp/edogawabashi/">館方介紹</a>列出抱石、先鋒上攀（lead）與頂繩（top-rope）；選擇多，但每種活動的入場準備不同。這篇依館方公開資料整理，沒有把入場資格當成已受過確保訓練。</p>
<h2>到哪裡、留多少時間</h2>
<p>館方列江戶川橋站步行約 5 分鐘、神樂坂站約 11 分鐘。把這些數字當作車站到館的參考，飯店到館還要加入轉乘、找出口與報到時間。平日營業 12:00–23:00，週末及假日 10:00–21:00；沒有固定公休日，仍可能臨時休館。</p>
<p>對旅客而言，先看當天要用的牆比只看閉館時間更實際。館方首頁有換線日程，抱石或繩索區可能在營業中暫停使用。若只剩一個晚上能爬，出發前確認目標區域，並替註冊、換裝和熱身保留時間。</p>
<h2>抱石與繩索是兩種安排</h2>
<p><a href="https://b-camp.jp/edogawabashi/facilities/">設施頁</a>介紹多個抱石區，也有繩索攀登設施。若此次只帶岩鞋、不帶能確保的夥伴，可以先向櫃檯說明想使用抱石區，接受館內規則說明後再爬。不要因為館內有頂繩，就推定隨時有工作人員替你確保。</p>
<p>想試繩索而尚未建立夥伴與操作能力，可先看<a href="https://b-camp.jp/edogawabashi/visitor/">初次造訪說明</a>的頂繩體驗：1 小時 1,100 日圓，另付設施費；參加者須已完成抱石入門說明或有抱石經驗，並按館方方式確認時段。一般入場、抱石入門說明與頂繩體驗不是同一個服務，預算與預約也應分開。</p>
<h2>首次預算與租借</h2>
<p>截至 2026 年 10 月 12 日，<a href="https://b-camp.jp/edogawabashi/charge/">費用頁</a>成人全天設施費為含稅 2,420 日圓，初次註冊 1,100 日圓。兩項相加是 3,520 日圓，這是一般成人首次全天入場的計算，未加頂繩體驗或其他付費項目。</p>
<p>一般租借價為岩鞋 330、粉袋 110、安全吊帶 110、ATC 確保器 110、先鋒繩 550 日圓。初次註冊可免費借岩鞋、粉袋、吊帶與 ATC；先鋒繩不在這份免費清單。租岩鞋要帶襪子。若之前在其他 Base Camp 分店註冊，會員登記共通，先讓櫃檯確認會員資料，不要直接重複計入註冊費。</p>
<h2>出發前做三件事</h2>
<p>先決定此次是抱石、和具備能力的夥伴爬繩索，還是詢問體驗。接著確認當日營業與換線區域。最後把需要租的器材、會員狀態及體驗費分開列出，報到時一次問清楚。租到器材不等於完成技術評估；繩索使用方式和資格以館方現場說明為準。</p>
<p>如果旅行時間很有限，這樣的安排能讓你在到館前知道自己要做什麼，也避免到了才發現想爬的區域在換線。費用與營業時間是查核當日資料，未來行程仍應重新確認。</p>
<h2>參考資料</h2>
<ul>
<li><a href="https://b-camp.jp/edogawabashi/">BASE CAMP TOKYO 江戸川橋 - ボルダリング、リードクライミング・トップロープなど様々なクライミングが行える施設。江戸川橋駅徒歩5分。 東京屈指の繁華街である池袋からもアクセス良好な立地に位置するBase Camp。 ボルダリングが初めての方へ、随時初回インストラクションを実施。</a></li>
<li><a href="https://b-camp.jp/edogawabashi/facilities/">施設紹介 - BASE CAMP TOKYO 江戸川橋</a></li>
<li><a href="https://b-camp.jp/edogawabashi/visitor/">はじめての方へ - BASE CAMP TOKYO 江戸川橋</a></li>
<li><a href="https://b-camp.jp/edogawabashi/charge/">営業時間・料金案内 - BASE CAMP TOKYO 江戸川橋</a></li>
</ul>
<h2>閱讀語言</h2>
<p><a href="/blog/4170cdb52c273770734572c680c669c4">繁體中文</a> · <a href="/en/blog/e9a8202bd67c91865e698b92a798c973">English</a> · <a href="/ja/blog/18c5a82f2d50a8bf0216bbc5305ff668">日本語</a></p>
', NULL, 'gyms', 'published', 0, datetime('now'), datetime('now'), datetime('now'));
INSERT INTO post_tags (post_id, tag) VALUES ('4170cdb52c273770734572c680c669c4', '東京攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('4170cdb52c273770734572c680c669c4', '岩館指南');
DROP TABLE _blog_article_guard;
