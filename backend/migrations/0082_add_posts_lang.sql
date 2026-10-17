-- posts.lang：文章正文語系，供列表依介面語系篩選
-- NULL = 未標語系（使用者自行發表的文章），所有語系的列表都會顯示
-- zh/en/ja = 由 backend/content/blog 原稿同步的三語文章，只在對應語系的列表出現

ALTER TABLE posts ADD COLUMN lang TEXT CHECK (lang IN ('zh', 'en', 'ja'));
