-- chat_messages：由後端在 /ai/ask 內寫入訊息後需要的欄位
-- sources：assistant 訊息的來源（JSON array），重新載入對話時才能還原來源卡片
-- status：NULL = 正常；'stopped' = 使用者中斷生成，content 為中斷前的部分內容

ALTER TABLE chat_messages ADD COLUMN sources TEXT;
ALTER TABLE chat_messages ADD COLUMN status TEXT;
